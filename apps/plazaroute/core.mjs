export const categories = [
 {id:'vacation',name:'Vacation rental managers',short:'Vacation rentals',tag:'Portfolio relationships',query:'vacation rental property management companies',why:'Find the companies coordinating turnovers for several vacation homes.',ask:'Who chooses your cleaning partners, and how many homes would an initial trial cover?',offer:'vacation rental turnover cleaning'},
 {id:'cohosts',name:'Short-term rental co-hosts',short:'Co-hosts',tag:'Portfolio relationships',query:'Airbnb cohost vacation rental management services',why:'Look for local co-host businesses that coordinate cleaning across listings.',ask:'Do you coordinate cleaning, or does each property owner arrange it?',offer:'short-term rental turnover cleaning'},
 {id:'property',name:'Commercial property managers',short:'Commercial managers',tag:'Recurring service',query:'commercial property management companies',why:'Research managers responsible for offices, shared spaces, and several buildings.',ask:'Is cleaning contracted centrally, and when are service agreements reviewed?',offer:'recurring commercial cleaning'},
 {id:'apartments',name:'Apartment community managers',short:'Apartments',tag:'Move-out opportunities',query:'apartment property management companies',why:'Explore move-out cleaning and common-area work with local management offices.',ask:'Who handles vendor approval for move-out and common-area cleaning?',offer:'move-out and common-area cleaning'},
 {id:'offices',name:'Offices and professional practices',short:'Offices',tag:'Recurring service',query:'professional offices businesses',why:'Identify local offices with cleaning needs that match your team and schedule.',ask:'Who manages cleaning services, and what would a new provider need to qualify?',offer:'recurring office cleaning'},
 {id:'realtors',name:'Real estate brokerages',short:'Real estate',tag:'Referral relationships',query:'real estate brokerage offices',why:'Build relationships around listing preparation, closings, and move-out cleans.',ask:'Do you recommend cleaners to sellers, buyers, or rental owners?',offer:'listing preparation and move-out cleaning'},
 {id:'builders',name:'Builders and remodeling companies',short:'Builders',tag:'Project work',query:'home builders remodeling contractors',why:'Research contractors who may need a cleaning partner after construction.',ask:'What are your post-construction cleaning requirements and project timelines?',offer:'post-construction cleaning'},
 {id:'hospitality',name:'Independent inns and small hotels',short:'Inns and hotels',tag:'Backup partnerships',query:'independent inns boutique hotels',why:'Look for operators whose overflow or backup cleaning needs fit your capacity.',ask:'Do you use outside cleaning partners, and what staffing and training are required?',offer:'hospitality cleaning support'}
];
export const leadCategories=[...categories,{id:'cleaners',name:'Cleaning business / partner',ask:'Who handles business partnerships?',offer:'cleaning partnerships'},{id:'suppliers',name:'Supply retailer',ask:'Who handles trade customer accounts?',offer:'trade supply relationships'},{id:'residential',name:'Residential customer',short:'Residential',ask:'What cleaning needs and scheduling preferences would you like us to consider?',offer:'residential cleaning'},{id:'restaurants',name:'Restaurant or café',short:'Restaurants',ask:'Who handles cleaning for your restrooms and dining area, and what hours work around service?',offer:'restroom and dining-area cleaning'},{id:'salons',name:'Salon or beauty business',short:'Salons',ask:'Who decides on cleaning for your salon, and which days are you closed?',offer:'salon cleaning'},{id:'fitness',name:'Gym or fitness studio',short:'Fitness',ask:'Who manages cleaning for your locker rooms and workout areas?',offer:'restroom and locker-room cleaning'},{id:'medical',name:'Medical or dental office',short:'Medical',ask:'Who coordinates cleaning for your office, and what requirements must a cleaning provider meet?',offer:'office and restroom cleaning'},{id:'shopping',name:'Shopping plaza or center',short:'Shopping plazas',ask:'Who manages the property, and would you introduce us to tenants who need cleaning?',offer:'common-area and tenant cleaning'}];
export const relationships=[{id:'new',name:'New prospect'},{id:'quote',name:'Unbooked quote'},{id:'client',name:'Past or current client'},{id:'plaza',name:'Plaza-day customer'},{id:'referral',name:'Referral introduction'}];
export const channels=['Website','Google / Business Profile','Social media','Referral','Direct outreach','Other','Unknown'];
export const stages=['Researching','Ready to contact','Contacted','Conversation','Quote sent','Won','Not a fit'];
export const checks=['Multiple locations confirmed','Services match your capabilities','Travel and schedule work','Public business contact verified'];
export function category(id){return leadCategories.find(c=>c.id===id)||categories[0]}
export function searchUrl(area,id,source='web'){
 const c=category(id),q=c.query+' '+area;
 if(source==='maps')return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q);
 if(source==='groups')return 'https://www.google.com/search?q='+encodeURIComponent('site:facebook.com/groups/ '+area+' vacation rental hosts property managers');
 if(source==='chamber')return 'https://www.google.com/search?q='+encodeURIComponent(area+' chamber of commerce business directory '+c.query);
 return 'https://www.google.com/search?q='+encodeURIComponent(q);
}
export function safeUrl(value){if(!value)return '';try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)?u.href:''}catch{return ''}}
export function cleanLead(x){
 if(!x||typeof x!=='object'||typeof x.name!=='string'||!x.name.trim()||x.name.length>180)throw Error('Every prospect needs a business name (up to 180 characters).');
 const str=(v,max=2000)=>typeof v==='string'?v.slice(0,max):'';
 const day=v=>{if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return '';const d=new Date(v+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v?v:''};
 return {address:str(x.address,1000),phone:str(x.phone,160),email:str(x.email,300),placeId:str(x.placeId,2000),lat:typeof x.lat==='number'&&Number.isFinite(x.lat)&&Math.abs(x.lat)<=90?x.lat:null,lon:typeof x.lon==='number'&&Number.isFinite(x.lon)&&Math.abs(x.lon)<=180?x.lon:null,sourceName:str(x.sourceName,200),sourceLicense:str(x.sourceLicense,200),sourceLicenseUrl:safeUrl(str(x.sourceLicenseUrl,2000)),retrievedAt:str(x.retrievedAt,40),verifiedAt:str(x.verifiedAt,40),contactStatus:['Unreviewed','Source checked','Contact route checked','Needs correction'].includes(x.contactStatus)?x.contactStatus:'Unreviewed',doNotContact:x.doNotContact===true,projectIds:Array.isArray(x.projectIds)?[...new Set(x.projectIds.filter(v=>typeof v==='string').map(v=>v.slice(0,100)))].slice(0,20):[],id:str(x.id,200)||crypto.randomUUID(),name:x.name.trim(),area:str(x.area,150),category:leadCategories.some(c=>c.id===x.category)?x.category:'vacation',relationship:relationships.some(r=>r.id===x.relationship)?x.relationship:'new',channel:channels.includes(x.channel)?x.channel:'Unknown',bookedValue:typeof x.bookedValue==='number'&&Number.isFinite(x.bookedValue)&&x.bookedValue>=0&&x.bookedValue<=1000000000?x.bookedValue:null,travelMinutes:typeof x.travelMinutes==='number'&&Number.isFinite(x.travelMinutes)&&x.travelMinutes>=0&&x.travelMinutes<=10000?x.travelMinutes:null,website:safeUrl(str(x.website,2000)),contact:str(x.contact,500),source:safeUrl(str(x.source,2000)),stage:stages.includes(x.stage)?x.stage:'Researching',followup:day(x.followup),notes:str(x.notes,5000),checks:checks.map((_,i)=>x.checks?.[i]===true),updated:typeof x.updated==='string'?str(x.updated,40):new Date().toISOString()};
}
export function readBackup(text){let v;try{v=JSON.parse(text)}catch{throw Error('This is not a valid JSON backup. Your existing prospects are unchanged.')}
 if(v?.format!=='plazaroute-backup'||v.version!==1||!Array.isArray(v.leads)||v.leads.length>3000)throw Error('Choose a PlazaRoute version 1 backup with no more than 3,000 prospects.');
 const leads=v.leads.map(cleanLead);if(new Set(leads.map(x=>x.id)).size!==leads.length)throw Error('This backup has duplicate prospect IDs. Your existing prospects are unchanged.');return leads;
}
export function csvCell(v){let s=String(v??'');if(/^[\s]*[=+@\-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'}
export function exportCsv(leads){return [['Name','Area','Type','Relationship','Lead channel','Website','Contact','Source URL','Stage','Follow-up','Confirmed fit checks','Booked value USD','Estimated round-trip drive minutes','Notes'],...leads.map(x=>[x.name,x.area,category(x.category).name,relationships.find(r=>r.id===x.relationship)?.name||'New prospect',x.channel||'Unknown',x.website,x.contact,x.source,x.stage,x.followup,x.checks.filter(Boolean).length+'/4',x.bookedValue??'',x.travelMinutes??'',x.notes])].map(row=>row.map(csvCell).join(',')).join('\r\n')}
export function todayLocal(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
export function due(x,today=todayLocal()){return !!x.followup&&x.followup<=today&&!['Won','Not a fit'].includes(x.stage)}
export function draft(profile,lead){
 if(lead?.doNotContact)throw Error('This contact is marked Do not contact.');
 const company=profile.company?.trim(),person=profile.person?.trim();if(!company||!person||!lead)throw Error('Enter your name and cleaning business, then choose a saved prospect.');
 const service=profile.service?.trim();if(!service)throw Error('Describe the cleaning service you can provide.');
 const area=lead.area||profile.area;return {subject:'Cleaning services for '+lead.name,body:'Hello '+lead.name+(lead.category==='residential'?'':' team')+',\n\nMy name is '+person+', and I run '+company+(area?' in the '+area+' area':'')+'. We provide '+service+'.\n\nI’m reaching out to ask who coordinates cleaning services for your business. I’d welcome a brief conversation about your requirements, scheduling, and whether our services would be a suitable fit.\n\n'+category(lead.category).ask+'\n\nThank you,\n'+person+'\n'+company+(profile.contact?.trim()?'\n'+profile.contact.trim():'')};
}

export function compareFunnel(previous,current){
 const valid=x=>Array.isArray(x)&&x.length===3&&x.every(n=>Number.isSafeInteger(n)&&n>=0&&n<=1000000000);
 if(!valid(previous)||!valid(current))throw Error('Enter six whole numbers, using zero where there were no visits, inquiries, or bookings.');
 if([previous,current].some(x=>x[1]>x[0]||x[2]>x[1]))throw Error('Use unique website visitors, the visitors who inquired, and the inquiries that booked. Counts must follow that sequence for each period.');
 const rate=(n,d)=>d===0?null:n/d;
 const before={visits:previous[0],inquiryRate:rate(previous[1],previous[0]),bookingRate:rate(previous[2],previous[1])};
 const after={visits:current[0],inquiryRate:rate(current[1],current[0]),bookingRate:rate(current[2],current[1])};
 const findings=[];
 if(after.visits<before.visits)findings.push({title:'Fewer website visitors',detail:'Review where traffic changed by source. Check the same weeks last year before treating a short-term dip as a seasonal pattern.'});
 if(before.inquiryRate!==null&&after.inquiryRate!==null&&after.inquiryRate<before.inquiryRate)findings.push({title:'A smaller share of visitors inquired',detail:'Test the enquiry form and phone links on your mobile phone. Check that messages arrive and that service details and availability are clear.'});
 if(before.bookingRate!==null&&after.bookingRate!==null&&after.bookingRate<before.bookingRate)findings.push({title:'A smaller share of inquiries booked',detail:'Review response time, missed calls, quote follow-up, service fit, and why inquiries did not book.'});
 if(!findings.length)findings.push({title:'No decline identified in comparable measures',detail:'These entries do not show a lower visitor count or lower comparable conversion rates. Zero denominators leave rates unavailable; small counts can vary sharply.'});
 return {before,after,findings};
}
export function reactivationDraft(profile,lead,offer,now=new Date()){
 if(lead?.doNotContact)throw Error('This contact is marked Do not contact.');
 const person=profile.person?.trim(),company=profile.company?.trim(),service=offer.service?.trim(),area=offer.area?.trim();
 if(!person||!company)throw Error('Enter your name and cleaning business.');
 if(!lead)throw Error('Choose a saved past client or unbooked quote.');
 if(!service||!area)throw Error('Enter the cleaning scope and the area you can serve.');
 if(!['quote','client','referral'].includes(offer.mode))throw Error('Choose a valid message purpose.');
 const expected=offer.mode==='quote'?['quote']:['client','plaza'];
 if(!expected.includes(lead.relationship))throw Error(offer.mode==='quote'?'Choose a record marked Unbooked quote.':'Choose a record marked Past or current client or Plaza-day customer.');
 const signature=person+'\n'+company+(profile.contact?.trim()?'\n'+profile.contact.trim():'');
 if(offer.mode==='referral')return {subject:'A local cleaning introduction',body:'Hello '+lead.name+',\n\nThank you for choosing '+company+'. We’re making room for '+service+' in '+area+'.\n\nDo you know a neighbor or coworker who might be interested? If someone comes to mind, would you be comfortable introducing us? They can contact us directly to discuss their needs and availability.\n\nThank you,\n'+signature};
 const validSlot=v=>{if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v))return false;const d=new Date(v),p=v.match(/\d+/g).map(Number);return Number.isFinite(d.getTime())&&[d.getFullYear(),d.getMonth()+1,d.getDate(),d.getHours(),d.getMinutes()].every((n,i)=>n===p[i])};
 if(!validSlot(offer.slot1)||!validSlot(offer.slot2))throw Error('Enter two available dates and times.');
 const slots=[new Date(offer.slot1),new Date(offer.slot2)];
 if(slots.some(d=>d<=now))throw Error('Both openings must be in the future.');
 if(slots[0].getTime()===slots[1].getTime())throw Error('Choose two different available openings.');
 const f=d=>d.toLocaleString(undefined,{weekday:'long',month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});
 const intro=offer.mode==='quote'?'I’m following up on your earlier cleaning inquiry with '+company+'.':'Thank you for previously booking with '+company+'.';
 return {subject:'Two cleaning openings in '+area,body:'Hello '+lead.name+',\n\n'+intro+' We have openings for '+service+' in '+area+' on '+f(slots[0])+' or '+f(slots[1])+'.\n\n'+(offer.mode==='quote'?'If you’re still considering having the work done, would either opening suit you? We can confirm the scope and current price before booking.':'Would either opening work for another clean? We can confirm the scope and current price before booking.')+'\n\nThank you,\n'+signature};
}
