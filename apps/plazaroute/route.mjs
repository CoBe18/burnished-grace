// PlazaRoute route tools: monthly accounts, the weekly visit log, the route day
// planner and the pricing & profit check. Shared by every edition.
// Copyright 2026 Burnished Grace Creative Studio. All rights reserved.
import {csvCell} from './core.mjs';
import {meters} from './plaza.mjs';

export const ROUTE_LIMITS={accounts:500,visits:10000,routes:400,settings:10};
export const plans=[{id:'one',name:'1 restroom',restrooms:1},{id:'two',name:'2 restrooms',restrooms:2},{id:'custom',name:'Custom plan',restrooms:null}];
export const accountStatuses=['Active','Paused','Ended'];
export const visitStatuses=['Scheduled','Done','Missed','Rescheduled','Skipped'];
export const weekdays=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
export const WEEKS_PER_MONTH=52/12;
export const defaultSettings=Object.freeze({id:'pricing',planPrices:{one:399,two:599},laborRate:20,minutesPerRestroom:30,suppliesPerRestroom:3,costPerMile:0.7,driveMinutesPerStop:15,milesPerStop:6,mph:30,roadFactor:1.3,targetMargin:40,home:{label:'',lat:null,lon:null}});

const text=(x,n=2000)=>typeof x==='string'?x.trim().slice(0,n):'';
const num=(x,min,max,fallback)=>{const n=typeof x==='string'&&x.trim()!==''?Number(x):x;return typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max?n:fallback};
const int=(x,min,max,fallback)=>{const n=num(x,min,max,null);return n===null?fallback:Math.round(n)};
const coord=(x,max)=>{const n=num(x,-max,max,null);return n};
export const validDay=v=>{if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return '';const d=new Date(v+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v?v:''};
const clock=v=>typeof v==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v)?v:'';
const stamp=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))?v.slice(0,40):new Date().toISOString();
const newId=()=>globalThis.crypto.randomUUID();

// ---------------------------------------------------------------- dates
export function addDays(date,n){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
export function dayOfWeek(date){return new Date(date+'T12:00:00Z').getUTCDay()}
export function weekStart(date,startsOn=1){const back=(dayOfWeek(date)-startsOn+7)%7;return addDays(date,-back)}
export function dateRange(from,to){const out=[];for(let d=from;d<=to&&out.length<400;d=addDays(d,1))out.push(d);return out}
export function niceDay(date,opts={weekday:'short',month:'short',day:'numeric'}){return new Date(date+'T12:00:00').toLocaleDateString(undefined,opts)}
export function money(n,digits=0){return new Intl.NumberFormat(undefined,{style:'currency',currency:'USD',minimumFractionDigits:digits,maximumFractionDigits:digits}).format(Number.isFinite(n)?n:0)}
export function hours(min){const m=Math.max(0,Math.round(min||0)),h=Math.floor(m/60);return h?h+' h '+String(m%60).padStart(2,'0')+' min':m+' min'}

// ---------------------------------------------------------------- record cleaning
export function cleanSettings(x={}){
 const d=defaultSettings,p=x?.planPrices||{},h=x?.home||{};
 return {id:'pricing',planPrices:{one:num(p.one,0,100000,d.planPrices.one),two:num(p.two,0,100000,d.planPrices.two)},laborRate:num(x?.laborRate,0,1000,d.laborRate),minutesPerRestroom:num(x?.minutesPerRestroom,1,600,d.minutesPerRestroom),suppliesPerRestroom:num(x?.suppliesPerRestroom,0,1000,d.suppliesPerRestroom),costPerMile:num(x?.costPerMile,0,20,d.costPerMile),driveMinutesPerStop:num(x?.driveMinutesPerStop,0,600,d.driveMinutesPerStop),milesPerStop:num(x?.milesPerStop,0,500,d.milesPerStop),mph:num(x?.mph,5,80,d.mph),roadFactor:num(x?.roadFactor,1,3,d.roadFactor),targetMargin:num(x?.targetMargin,0,95,d.targetMargin),home:{label:text(h.label,300),lat:coord(h.lat,90),lon:coord(h.lon,180)},updated:stamp(x?.updated)};
}
export function cleanAccount(x){
 if(!x||typeof x!=='object')throw Error('Invalid account.');
 const name=text(x.name,180);if(!name)throw Error('An account needs the business name.');
 const leadId=text(x.leadId,200);if(!leadId)throw Error('Choose the saved business for this account.');
 const plan=plans.some(p=>p.id===x.plan)?x.plan:'custom';
 const fixed=plans.find(p=>p.id===plan).restrooms;
 const restrooms=fixed||int(x.restrooms,1,50,1);
 const price=num(x.price,0,100000,null);if(price===null)throw Error('Enter the monthly price for '+name+'.');
 const serviceDays=[...new Set((Array.isArray(x.serviceDays)?x.serviceDays:[]).map(Number).filter(n=>Number.isInteger(n)&&n>=0&&n<=6))].sort();
 const status=accountStatuses.includes(x.status)?x.status:'Active';
 if(status==='Active'&&!serviceDays.length)throw Error('Choose at least one service day for '+name+'.');
 const startDate=validDay(x.startDate);if(!startDate)throw Error('Enter the start date for '+name+'.');
 const endDate=validDay(x.endDate);if(endDate&&endDate<startDate)throw Error('The end date must be on or after the start date.');
 return {id:text(x.id,100)||newId(),leadId,name,plan,restrooms,price,serviceDays,from:clock(x.from),to:clock(x.to),minutesPerVisit:int(x.minutesPerVisit,1,1440,null),startDate,endDate,status,contactName:text(x.contactName,160),contactPhone:text(x.contactPhone,160),access:text(x.access,1000),crewNotes:text(x.crewNotes,2000),notes:text(x.notes,4000),updated:stamp(x.updated)};
}
export const visitId=(accountId,date)=>accountId+'@'+date;
export function cleanVisit(x){
 if(!x||typeof x!=='object')throw Error('Invalid visit.');
 const accountId=text(x.accountId,100),date=validDay(x.date);
 if(!accountId||!date)throw Error('A visit needs an account and a date.');
 const status=visitStatuses.includes(x.status)?x.status:'Scheduled';
 const moveTo=status==='Rescheduled'?validDay(x.moveTo):'';
 if(status==='Rescheduled'&&!moveTo)throw Error('Choose the new date for the rescheduled visit.');
 return {id:visitId(accountId,date),accountId,date,status,minutes:int(x.minutes,0,1440,null),notes:text(x.notes,1000),moveTo,makeup:x.makeup===true,updated:stamp(x.updated)};
}
export function cleanRoute(x){
 const date=validDay(x?.date);if(!date)throw Error('A saved route needs a date.');
 const order=[...new Set((Array.isArray(x.order)?x.order:[]).filter(v=>typeof v==='string'&&v).map(v=>v.slice(0,200)))].slice(0,200);
 return {id:'route-'+date,date,order,updated:stamp(x.updated)};
}

// ---------------------------------------------------------------- accounts
export const active=a=>a.status==='Active';
export function runsOn(a,date){return a.startDate<=date&&(!a.endDate||date<=a.endDate)&&a.serviceDays.includes(dayOfWeek(date))}
export function monthlySummary(accounts){
 const act=accounts.filter(active),mrr=act.reduce((n,a)=>n+a.price,0);
 return {active:act.length,paused:accounts.filter(a=>a.status==='Paused').length,mrr,restrooms:act.reduce((n,a)=>n+a.restrooms,0),visitsPerWeek:act.reduce((n,a)=>n+a.serviceDays.length,0),average:act.length?mrr/act.length:0};
}
export function plazaFor(leadId,plazas){return plazas.find(p=>p.leadIds.includes(leadId))||null}
// Active accounts that share each account's stop (same plaza), so drive time can be split.
export function sharedCounts(accounts,plazas){
 const byPlaza=new Map();for(const a of accounts.filter(active)){const p=plazaFor(a.leadId,plazas);if(p)byPlaza.set(p.id,(byPlaza.get(p.id)||0)+1)}
 return new Map(accounts.map(a=>{const p=plazaFor(a.leadId,plazas);return [a.id,p?byPlaza.get(p.id)||1:1]}));
}

// ---------------------------------------------------------------- visits
// Every visit an active account should get between two dates, plus make-up visits and
// any visit already logged in that period (even if the account has since been paused).
export function plannedVisits(accounts,visits,from,to){
 const byId=new Map(visits.map(v=>[v.id,v])),accById=new Map(accounts.map(a=>[a.id,a])),out=new Map();
 for(const date of dateRange(from,to))for(const a of accounts){if(a.status!=='Active'||!runsOn(a,date))continue;const id=visitId(a.id,date),v=byId.get(id)||null;out.set(id,{id,account:a,date,visit:v,makeup:false,status:v?.status||'Scheduled'})}
 for(const v of visits)if(v.date>=from&&v.date<=to&&!out.has(v.id)){const a=accById.get(v.accountId);if(a)out.set(v.id,{id:v.id,account:a,date:v.date,visit:v,makeup:v.makeup,status:v.status})}
 return [...out.values()].sort((x,y)=>x.date.localeCompare(y.date)||(x.account.from||'99').localeCompare(y.account.from||'99')||x.account.name.localeCompare(y.account.name));
}
export function weekSummary(items,today){
 const count=s=>items.filter(i=>i.status===s).length;
 return {planned:items.filter(i=>!['Rescheduled','Skipped'].includes(i.status)).length,done:count('Done'),missed:count('Missed'),rescheduled:count('Rescheduled'),skipped:count('Skipped'),open:items.filter(i=>i.status==='Scheduled'&&i.date<today).length,remaining:items.filter(i=>i.status==='Scheduled'&&i.date>=today).length};
}
// Change one visit's status. Rescheduling also creates the make-up visit on the new date.
export function setVisit(item,status,{minutes=null,notes='',moveTo=''}={}){
 const base={accountId:item.account.id,date:item.date,makeup:item.makeup,status,minutes,notes,moveTo,updated:new Date().toISOString()};
 const out=[cleanVisit(base)];
 if(status==='Rescheduled'){if(moveTo===item.date)throw Error('Choose a different date for the make-up visit.');if(validDay(moveTo)&&runsOn(item.account,moveTo))throw Error(item.account.name+' is already scheduled on '+niceDay(moveTo)+'. Choose another date.');out.push(cleanVisit({accountId:item.account.id,date:moveTo,status:'Scheduled',makeup:true,notes:'Make-up for '+item.date}))}
 return out;
}
export function lastVisits(visits){const m=new Map();for(const v of visits)if(v.status==='Done'&&(!m.has(v.accountId)||v.date>m.get(v.accountId).date))m.set(v.accountId,v);return m}
export function averageMinutes(visits){const m=new Map();for(const v of visits)if(v.status==='Done'&&v.minutes){const x=m.get(v.accountId)||{n:0,t:0};x.n++;x.t+=v.minutes;m.set(v.accountId,x)}return new Map([...m].map(([k,x])=>[k,Math.round(x.t/x.n)]))}

// ---------------------------------------------------------------- route day
export const visitMinutes=(a,settings)=>a.minutesPerVisit||Math.round(a.restrooms*settings.minutesPerRestroom);
const point=x=>Number.isFinite(x?.lat)&&Number.isFinite(x?.lon)?{lat:x.lat,lon:x.lon}:null;
function driveLeg(a,b,s){if(!a||!b)return null;const miles=meters(a,b)*s.roadFactor/1609.344;return {miles,minutes:miles/s.mph*60}}
function routeLength(order,start,s){let total=0,prev=start;for(const g of order){if(prev&&g.point)total+=driveLeg(prev,g.point,s).miles;if(g.point)prev=g.point}return total}
// Nearest-neighbor order from the start point, improved with 2-opt swaps.
export function autoOrder(groups,start,s){
 const located=groups.filter(g=>g.point),rest=groups.filter(g=>!g.point).sort((a,b)=>a.name.localeCompare(b.name));
 let order=[],left=[...located],cur=start||located[0]?.point||null;
 while(left.length){let best=0;if(cur){let bd=Infinity;left.forEach((g,i)=>{const d=meters(cur,g.point);if(d<bd){bd=d;best=i}})}const g=left.splice(best,1)[0];order.push(g);cur=g.point}
 if(order.length>3&&order.length<=60){let improved=true,guard=0;while(improved&&guard++<50){improved=false;for(let i=0;i<order.length-1;i++)for(let k=i+1;k<order.length;k++){const next=[...order.slice(0,i),...order.slice(i,k+1).reverse(),...order.slice(k+1)];if(routeLength(next,start,s)+1e-9<routeLength(order,start,s)){order=next;improved=true}}}}
 return [...order,...rest];
}
export function dayPlan(date,{accounts,visits,plazas,leads,settings,route}){
 const s=cleanSettings(settings),leadById=new Map(leads.map(l=>[l.id,l]));
 const items=plannedVisits(accounts,visits,date,date).filter(i=>!['Rescheduled','Skipped'].includes(i.status));
 const groups=new Map();
 for(const item of items){
  const lead=leadById.get(item.account.leadId)||null,plaza=plazaFor(item.account.leadId,plazas);
  const key=plaza?'plaza:'+plaza.id:'account:'+item.account.id;
  if(!groups.has(key))groups.set(key,{key,plaza,name:plaza?plaza.name:item.account.name,address:plaza?.address||lead?.address||'',point:point(plaza),stops:[]});
  const g=groups.get(key);g.stops.push({item,account:item.account,lead,minutes:visitMinutes(item.account,s)});
  if(!g.point&&point(lead))g.point=point(lead);
  if(!g.address&&lead?.address)g.address=lead.address;
 }
 for(const g of groups.values()){g.stops.sort((a,b)=>(a.account.from||'99').localeCompare(b.account.from||'99')||a.account.name.localeCompare(b.account.name));g.onSite=g.stops.reduce((n,x)=>n+x.minutes,0);g.restrooms=g.stops.reduce((n,x)=>n+x.account.restrooms,0)}
 const start=point(s.home),all=[...groups.values()];
 let ordered;const saved=route?.order||[];
 if(saved.length&&all.every(g=>saved.includes(g.key)))ordered=[...all].sort((a,b)=>saved.indexOf(a.key)-saved.indexOf(b.key));
 else if(saved.length){const known=saved.map(k=>all.find(g=>g.key===k)).filter(Boolean);ordered=[...known,...autoOrder(all.filter(g=>!known.includes(g)),known.at(-1)?.point||start,s)]}
 else ordered=autoOrder(all,start,s);
 let prev=start,miles=0,drive=0;
 for(const g of ordered){const leg=g.point?driveLeg(prev,g.point,s):null;g.leg=leg;if(leg){miles+=leg.miles;drive+=leg.minutes}if(g.point)prev=g.point}
 const back=start&&prev&&prev!==start?driveLeg(prev,start,s):null;if(back){miles+=back.miles;drive+=back.minutes}
 const onSite=ordered.reduce((n,g)=>n+g.onSite,0);
 return {date,groups:ordered,start,back,manual:!!saved.length,totals:{stops:items.length,groups:ordered.length,restrooms:ordered.reduce((n,g)=>n+g.restrooms,0),onSite,drive,miles,total:onSite+drive,unlocated:ordered.filter(g=>!g.point).length}};
}
export function moveGroup(plan,key,dir){const keys=plan.groups.map(g=>g.key),i=keys.indexOf(key),j=i+dir;if(i<0||j<0||j>=keys.length)return keys;[keys[i],keys[j]]=[keys[j],keys[i]];return keys}
// Google Maps directions links, five stops per link so they also open on phones.
export function mapsLinks(plan,per=5){
 const place=g=>g.point?g.point.lat.toFixed(6)+','+g.point.lon.toFixed(6):g.address;
 const pts=[...(plan.start?[{label:'Start',value:plan.start.lat.toFixed(6)+','+plan.start.lon.toFixed(6)}]:[]),...plan.groups.filter(g=>place(g)).map(g=>({label:g.name,value:place(g)}))];
 const links=[];
 for(let i=0;i<pts.length-1;i+=per-1){const chunk=pts.slice(i,i+per);if(chunk.length<2)break;const q=new URLSearchParams({api:'1',origin:chunk[0].value,destination:chunk.at(-1).value,travelmode:'driving'});if(chunk.length>2)q.set('waypoints',chunk.slice(1,-1).map(p=>p.value).join('|'));links.push({from:chunk[0].label,to:chunk.at(-1).label,url:'https://www.google.com/maps/dir/?'+q.toString()})}
 if(pts.length===1)links.push({from:pts[0].label,to:pts[0].label,url:'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(pts[0].value)});
 return links;
}

// ---------------------------------------------------------------- pricing & profit
// All figures are estimates from the owner's own numbers.
export function priceCheck(input,settings){
 const s=cleanSettings(settings);
 const restrooms=int(input.restrooms,1,50,1),visitsPerWeek=num(input.visitsPerWeek,0.25,7,1),minutesPerRestroom=num(input.minutesPerRestroom,1,600,s.minutesPerRestroom);
 const sharedWith=int(input.sharedWith,1,100,1),driveMinutes=num(input.driveMinutes,0,600,s.driveMinutesPerStop),miles=num(input.miles,0,500,s.milesPerStop);
 const laborRate=num(input.laborRate,0,1000,s.laborRate),supplies=num(input.suppliesPerRestroom,0,1000,s.suppliesPerRestroom),costPerMile=num(input.costPerMile,0,20,s.costPerMile);
 const price=num(input.price,0,100000,0),target=num(input.targetMargin,0,95,s.targetMargin)/100;
 const visitsPerMonth=visitsPerWeek*WEEKS_PER_MONTH,onSite=restrooms*minutesPerRestroom,driveShare=driveMinutes/sharedWith,milesShare=miles/sharedWith;
 const perVisit={labor:(onSite+driveShare)/60*laborRate,supplies:restrooms*supplies,vehicle:milesShare*costPerMile};perVisit.total=perVisit.labor+perVisit.supplies+perVisit.vehicle;
 const monthlyCost=perVisit.total*visitsPerMonth,profit=price-monthlyCost,hoursMonth=(onSite+driveShare)*visitsPerMonth/60;
 const ownerHourly=hoursMonth?(price-(perVisit.supplies+perVisit.vehicle)*visitsPerMonth)/hoursMonth:0;
 return {restrooms,visitsPerWeek,visitsPerMonth,onSite,driveShare,milesShare,sharedWith,perVisit,monthlyCost,price,pricePerVisit:visitsPerMonth?price/visitsPerMonth:0,profit,margin:price?profit/price:0,hoursMonth,ownerHourly,suggested:target<1?monthlyCost/(1-target):monthlyCost,target};
}
export function accountProfit(a,settings,{sharedWith=1,avgMinutes=null}={}){
 const s=cleanSettings(settings),minutes=avgMinutes||visitMinutes(a,s);
 return priceCheck({restrooms:a.restrooms,visitsPerWeek:Math.max(1,a.serviceDays.length),minutesPerRestroom:minutes/a.restrooms,sharedWith,price:a.price},s);
}

// ---------------------------------------------------------------- exports
export function accountRows(accounts,leads,plazas,settings,visits=[]){
 const leadById=new Map(leads.map(l=>[l.id,l])),shared=sharedCounts(accounts,plazas),last=lastVisits(visits),avg=averageMinutes(visits);
 return [['Business','Plaza','Address','Plan','Restrooms','Monthly price','Service days','Time window','Status','Start date','End date','Contact','Contact phone','Access notes','Last visit done','Estimated monthly profit','Estimated margin','Notes'],...accounts.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(a=>{const l=leadById.get(a.leadId),p=accountProfit(a,settings,{sharedWith:shared.get(a.id),avgMinutes:avg.get(a.id)});return [a.name,plazaFor(a.leadId,plazas)?.name||'',l?.address||'',plans.find(x=>x.id===a.plan).name,a.restrooms,a.price.toFixed(2),a.serviceDays.map(d=>weekdays[d].slice(0,3)).join(' '),a.from||a.to?(a.from||'')+'–'+(a.to||''):'',a.status,a.startDate,a.endDate,a.contactName,a.contactPhone,a.access,last.get(a.id)?.date||'',p.profit.toFixed(2),Math.round(p.margin*100)+'%',a.notes]})];
}
export function visitRows(items,leads){const leadById=new Map(leads.map(l=>[l.id,l]));return [['Date','Day','Business','Address','Restrooms','Status','Minutes','Make-up visit','Moved to','Notes'],...items.map(i=>[i.date,weekdays[dayOfWeek(i.date)],i.account.name,leadById.get(i.account.leadId)?.address||'',i.account.restrooms,i.status,i.visit?.minutes??'',i.makeup?'Yes':'No',i.visit?.moveTo||'',i.visit?.notes||''])]}
export function routeRows(plan){
 const rows=[['Order','Stop','Business','Address','Time window','Restrooms','Estimated minutes on site','Drive from previous (min)','Drive from previous (miles)','Contact','Contact phone','Access notes','Done']];
 plan.groups.forEach((g,i)=>g.stops.forEach((x,j)=>rows.push([i+1,g.name,x.account.name,x.lead?.address||g.address,x.account.from||x.account.to?(x.account.from||'')+'–'+(x.account.to||''):'',x.account.restrooms,x.minutes,j===0&&g.leg?Math.round(g.leg.minutes):'',j===0&&g.leg?g.leg.miles.toFixed(1):'',x.account.contactName,x.account.contactPhone,x.account.access,x.item.status==='Done'?'Yes':''])));
 return rows;
}
export const rowsToCsv=rows=>rows.map(r=>r.map(csvCell).join(',')).join('\r\n');
