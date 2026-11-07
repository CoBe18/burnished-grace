// Plaza Mode: group saved businesses that share a shopping plaza or strip center,
// keep the property manager with the plaza, and plan "plaza days" where several
// businesses at one address are cleaned on the same visit.
import {csvCell} from './core.mjs';

export const outcomes=['Not invited yet','Invited','Booked','Declined','Completed'];
export const PLAZA_LIMITS={plazas:500,businesses:200,days:100};
const text=(x,n=2000)=>typeof x==='string'?x.trim().slice(0,n):'';
const coord=(x,max)=>typeof x==='number'&&Number.isFinite(x)&&Math.abs(x)<=max?x:null;
const day=v=>{if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return '';const d=new Date(v+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v?v:''};
const time=v=>typeof v==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v)?v:'';
const newId=()=>globalThis.crypto.randomUUID();

export function cleanPlaza(x){
 if(!x||typeof x!=='object'||!text(x.name,160))throw Error('A plaza needs a name.');
 const m=x.manager&&typeof x.manager==='object'?x.manager:{};
 const leadIds=[...new Set((Array.isArray(x.leadIds)?x.leadIds:[]).filter(v=>typeof v==='string'&&v).map(v=>v.slice(0,200)))];
 if(leadIds.length>PLAZA_LIMITS.businesses)throw Error('A plaza can hold up to '+PLAZA_LIMITS.businesses+' businesses.');
 const days=(Array.isArray(x.days)?x.days:[]).filter(d=>d&&typeof d==='object').map(d=>{const seen=new Set();return {id:text(d.id,100)||newId(),date:day(d.date),time:time(d.time),notes:text(d.notes,2000),entries:(Array.isArray(d.entries)?d.entries:[]).filter(e=>e&&typeof e.leadId==='string'&&e.leadId&&!seen.has(e.leadId)&&seen.add(e.leadId)).slice(0,PLAZA_LIMITS.businesses).map(e=>({leadId:e.leadId.slice(0,200),outcome:outcomes.includes(e.outcome)?e.outcome:outcomes[0]}))}}).filter(d=>d.date);
 if(days.length>PLAZA_LIMITS.days)throw Error('A plaza can hold up to '+PLAZA_LIMITS.days+' plaza days.');
 days.sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
 return {id:text(x.id,100)||newId(),name:text(x.name,160),address:text(x.address,1000),lat:coord(x.lat,90),lon:coord(x.lon,180),manager:{name:text(m.name,160),company:text(m.company,180),phone:text(m.phone,160),email:text(m.email,300),notes:text(m.notes,2000)},notes:text(x.notes,4000),leadIds,days,updated:typeof x.updated==='string'&&Number.isFinite(Date.parse(x.updated))?x.updated.slice(0,40):new Date().toISOString()};
}

// Distance between two points in meters.
export function meters(a,b){const r=6371000,rad=Math.PI/180,dLat=(b.lat-a.lat)*rad,dLon=(b.lon-a.lon)*rad,h=Math.sin(dLat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dLon/2)**2;return 2*r*Math.asin(Math.min(1,Math.sqrt(h)))}

// "1234 N Main St Ste 5, Phoenix, AZ 85004" -> "n main st|85004". Used only when a record has no map position.
export function streetKey(address){
 if(typeof address!=='string'||!address.trim())return '';
 const zip=(address.split(',').slice(1).join(',').match(/\b(\d{5})(?:-\d{4})?\b(?!.*\b\d{5}\b)/)||[])[1]||'';
 let street=address.split(',')[0].toLowerCase().replace(/\b(suite|ste|unit|#|bldg|building|space|spc)\b.*$/,'').replace(/#.*$/,'');
 street=street.replace(/^\s*\d+[a-z]?(-\d+)?\s+/,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
 if(!street||!zip)return '';
 return street+'|'+zip;
}

// Suggest plaza groups from saved businesses that are not already in a plaza.
// Records with map positions join a group when they are within `radius` meters of
// another member; records without positions group by matching street and ZIP code.
export function suggestPlazas(leads,plazas=[],{radius=150}={}){
 const taken=new Set(plazas.flatMap(p=>p.leadIds||[]));
 const pool=leads.filter(l=>!taken.has(l.id)&&!l.doNotContact);
 const located=pool.filter(l=>Number.isFinite(l.lat)&&Number.isFinite(l.lon)),unlocated=pool.filter(l=>!(Number.isFinite(l.lat)&&Number.isFinite(l.lon)));
 const groups=[],seen=new Set();
 for(const start of located){if(seen.has(start.id))continue;const group=[start];seen.add(start.id);for(let i=0;i<group.length;i++)for(const other of located)if(!seen.has(other.id)&&meters(group[i],other)<=radius){seen.add(other.id);group.push(other)}if(group.length>1)groups.push({by:'map',leads:group})}
 const byStreet=new Map();for(const l of unlocated){const k=streetKey(l.address);if(!k)continue;if(!byStreet.has(k))byStreet.set(k,[]);byStreet.get(k).push(l)}
 for(const [key,group] of byStreet)if(group.length>1)groups.push({by:'address',key,leads:group});
 // A shopping-center record names the plaza; only its tenants become plaza businesses.
 return groups.map(g=>{const anchor=g.leads.find(l=>l.category==='shopping');const tenants=g.leads.filter(l=>l.category!=='shopping');return {...g,anchor,leads:tenants}}).filter(g=>g.leads.length>=(g.anchor?1:2)).map(g=>{const anchor=g.anchor;const located=g.leads.filter(l=>Number.isFinite(l.lat));const street=(g.leads.find(l=>l.address)?.address||'').split(',')[0].replace(/^\s*\d+[a-z]?(-\d+)?\s+/i,'').trim();return {...g,suggestedName:anchor?anchor.name:street?'Plaza on '+street:'Plaza near '+g.leads[0].name,address:(anchor||g.leads.find(l=>l.address)||{}).address||'',lat:located.length?located.reduce((n,l)=>n+l.lat,0)/located.length:null,lon:located.length?located.reduce((n,l)=>n+l.lon,0)/located.length:null}}).sort((a,b)=>b.leads.length-a.leads.length);
}

// Plan a plaza day: every business currently in the plaza starts as "Not invited yet".
export function newPlazaDay(plaza,date,timeValue='',notes=''){if(!day(date))throw Error('Choose a date for the plaza day.');return {id:newId(),date,time:time(timeValue),notes:text(notes,2000),entries:plaza.leadIds.map(leadId=>({leadId,outcome:outcomes[0]}))}}

// Latest outcome per business across all of a plaza's days.
export function latestOutcomes(plaza){const out=new Map();for(const d of plaza.days||[])for(const e of d.entries)if(e.outcome!==outcomes[0]||!out.has(e.leadId))out.set(e.leadId,{outcome:e.outcome,date:d.date});return out}

export function nextPlazaDay(plaza,today){return (plaza.days||[]).find(d=>d.date>=today)||null}

// Booking a business on a plaza day turns a prospect into a plaza-day customer.
export function promoteBooked(leads,plaza){const booked=new Set();for(const d of plaza.days||[])for(const e of d.entries)if(e.outcome==='Booked'||e.outcome==='Completed')booked.add(e.leadId);return leads.filter(l=>booked.has(l.id)&&['new','referral'].includes(l.relationship)).map(l=>({...l,relationship:'plaza',updated:new Date().toISOString()}))}

function niceDate(date,timeValue){const d=new Date(date+'T'+(timeValue||'12:00')+':00');const s=d.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'});return timeValue?s+' at '+d.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'}):s}

// Editable invitation for one business. PlazaRoute never sends it.
export function plazaInvite(profile,lead,plaza,plazaDay){
 if(lead?.doNotContact)throw Error('This contact is marked Do not contact.');
 const person=profile.person?.trim(),company=profile.company?.trim(),service=profile.service?.trim();
 if(!person||!company)throw Error('Enter your name and cleaning business in Prepare outreach first.');
 if(!lead||!plaza||!plazaDay)throw Error('Choose a business and a plaza day.');
 const signature=person+'\n'+company+(profile.contact?.trim()?'\n'+profile.contact.trim():'');
 return {subject:'Cleaning at '+plaza.name+' on '+niceDate(plazaDay.date),body:'Hello '+lead.name+' team,\n\nMy name is '+person+' with '+company+'. We will be at '+plaza.name+(plaza.address?' ('+plaza.address+')':'')+' on '+niceDate(plazaDay.date,plazaDay.time)+(service?' providing '+service:' for cleaning work')+'.\n\nBecause we are already on site that day, we can add your space to the visit. If that would help, I’d be glad to confirm what you need cleaned, the time that works around your hours, and the price before anything is booked.\n\nWould you like a spot on that day?\n\nThank you,\n'+signature};
}

// Editable introduction for the plaza's property manager.
export function managerIntro(profile,plaza){
 const person=profile.person?.trim(),company=profile.company?.trim(),service=profile.service?.trim();
 if(!person||!company)throw Error('Enter your name and cleaning business in Prepare outreach first.');
 if(!plaza)throw Error('Choose a plaza.');
 const m=plaza.manager||{};const greeting=m.name?'Hello '+m.name:'Hello'+(m.company?' '+m.company+' team':'');
 const signature=person+'\n'+company+(profile.contact?.trim()?'\n'+profile.contact.trim():'');
 return {subject:'Cleaning support for tenants at '+plaza.name,body:greeting+',\n\nMy name is '+person+' with '+company+(service?'. We provide '+service:'')+'. We schedule set "plaza days" so we can serve several businesses at one property on the same visit.\n\nWould you be open to letting your tenants at '+plaza.name+' know we are available, or pointing me to the right person for common-area cleaning? I’m happy to send details or meet on site.\n\nThank you,\n'+signature};
}

export function plazaRows(plaza,leads){const byId=new Map(leads.map(l=>[l.id,l])),latest=latestOutcomes(plaza),m=plaza.manager||{};return [['Plaza','Plaza address','Property manager','Manager company','Manager phone','Manager email','Business','Business address','Phone','Email','Website','Do not contact','Latest outcome','Outcome date'],...plaza.leadIds.map(id=>byId.get(id)).filter(Boolean).map(l=>{const o=latest.get(l.id);return [plaza.name,plaza.address,m.name,m.company,m.phone,m.email,l.name,l.address,l.phone,l.email,l.website,l.doNotContact?'Yes':'No',o?.outcome||outcomes[0],o?.date||'']})]}
export function plazaDayRows(plaza,plazaDay,leads){const byId=new Map(leads.map(l=>[l.id,l]));return [['Plaza','Date','Time','Business','Business address','Phone','Email','Outcome'],...plazaDay.entries.map(e=>{const l=byId.get(e.leadId);return [plaza.name,plazaDay.date,plazaDay.time,l?.name||'(removed record)',l?.address||'',l?.phone||'',l?.email||'',e.outcome]})]}
export const rowsCsv=rows=>rows.map(r=>r.map(csvCell).join(',')).join('\r\n');
