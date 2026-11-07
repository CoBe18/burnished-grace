// PlazaRoute Cleaning Business Hub: shared by the owner's Team & jobs screens and
// the cleaners' job page (crew.html). Talks to the buyer's own Supabase project.
// Copyright 2026 Burnished Grace Creative Studio. All rights reserved.
import {plannedVisits,addDays,weekStart,dateRange,niceDay} from './route.mjs';

export const JOB_STATUSES=['Assigned','On the way','In progress','Done','Could not finish'];
export const PHOTO_BUCKET='job-photos';
const MISSING='The Team & jobs part of your Supabase project is not set up yet. Open the Supabase SQL Editor and run the newest Supabase-Setup.sql (it is safe to run again).';

// conn: {url, key, token: async () => access token}
export class HubClient{
 constructor(conn){this.conn=conn}
 async call(method,path,{body,headers={},raw=false}={}){
  const h={apikey:this.conn.key,Authorization:'Bearer '+await this.conn.token(),...headers};
  if(body!==undefined&&!(body instanceof Blob))h['Content-Type']='application/json';
  let r;try{r=await fetch(this.conn.url+path,{method,headers:h,body:body===undefined?undefined:body instanceof Blob?body:JSON.stringify(body),signal:AbortSignal.timeout(60000)})}
  catch{throw Error('Supabase could not be reached. Check your signal or internet connection and try again.')}
  if(r.status===401&&!this.retried){this.retried=true;try{this.conn.expired?.();return await this.call(method,path,{body,headers,raw})}finally{this.retried=false}}
  const text=await r.text();let data=null;try{data=text?JSON.parse(text):null}catch{}
  if(!r.ok){
   const msg=data?.message||data?.msg||data?.error_description||data?.error||'';
   if(r.status===404&&/rest\/v1/.test(path)||/PGRST20[25]|42P01|42883|Could not find the (table|function)/.test(msg+(data?.code||'')))throw Error(MISSING);
   if(/Bucket not found/i.test(msg))throw Error(MISSING);
   if(data?.code==='P0001'||data?.code==='22023')throw Error(msg);
   if(/row-level security|403|Unauthorized/i.test(msg+' '+(data?.statusCode||'')))throw Error('Supabase did not allow that. If you are a cleaner, the job may have been moved to someone else. Refresh and try again.');
   if(/exceeded the maximum allowed size|413/.test(msg+r.status))throw Error('That photo is too large. Try again; PlazaRoute makes photos smaller before sending them.');
   throw Error(r.status>=500?'Supabase is not responding ('+r.status+'). If your free project is paused, the owner can restore it at supabase.com.':(msg||'Supabase refused the request ('+r.status+').'));
  }
  return raw?r:data;
 }
 select(table,query){return this.call('GET','/rest/v1/'+table+'?'+query)}
 upsert(table,rows,onConflict='id'){return this.call('POST','/rest/v1/'+table+'?on_conflict='+onConflict,{body:rows,headers:{Prefer:'resolution=merge-duplicates,return=representation'}})}
 insert(table,rows){return this.call('POST','/rest/v1/'+table,{body:rows,headers:{Prefer:'return=representation'}})}
 update(table,filter,patch){return this.call('PATCH','/rest/v1/'+table+'?'+filter,{body:patch,headers:{Prefer:'return=representation'}})}
 remove(table,filter){return this.call('DELETE','/rest/v1/'+table+'?'+filter,{headers:{Prefer:'return=representation'}})}
 rpc(fn,args={}){return this.call('POST','/rest/v1/rpc/'+fn,{body:args})}
 upload(path,blob){return this.call('POST','/storage/v1/object/'+PHOTO_BUCKET+'/'+encodePath(path),{body:blob,headers:{'Content-Type':blob.type||'image/jpeg','x-upsert':'false'}})}
 async signed(paths,expiresIn=3600){
  if(!paths.length)return new Map();
  const out=new Map();
  for(let i=0;i<paths.length;i+=100){const list=await this.call('POST','/storage/v1/object/sign/'+PHOTO_BUCKET,{body:{expiresIn,paths:paths.slice(i,i+100)}});for(const x of list||[])if(x.signedURL)out.set(x.path,this.conn.url+'/storage/v1'+x.signedURL)}
  return out;
 }
 removeFiles(paths){return paths.length?this.call('DELETE','/storage/v1/object/'+PHOTO_BUCKET,{body:{prefixes:paths}}):Promise.resolve([])}
}
export const encodePath=p=>p.split('/').map(encodeURIComponent).join('/');
export const inList=ids=>'in.('+ids.map(id=>'"'+String(id).replaceAll('"','')+'"').join(',')+')';

// ---------------------------------------------------------------- invite links
const b64=s=>btoa(String.fromCharCode(...new TextEncoder().encode(s))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
const unb64=s=>new TextDecoder().decode(Uint8Array.from(atob(s.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0)));
export function inviteLink(crewUrl,{url,key,code,name,business,email}){
 let base;try{base=new URL(crewUrl)}catch{throw Error('Add your cleaners’ page address first (see “Your cleaners’ page”).')}
 if(base.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(base.hostname))throw Error('Your cleaners’ page address must start with https://');
 base.hash='join='+b64(JSON.stringify({u:url,k:key,c:code,n:name||'',b:business||'',e:email||''}));
 return base.toString();
}
export function readInvite(hash){
 const m=/(?:^#|&)join=([A-Za-z0-9_-]+)/.exec(hash||'');if(!m)return null;
 try{const d=JSON.parse(unb64(m[1]));if(typeof d.u!=='string'||typeof d.k!=='string'||!/^[0-9a-f]{32}$/.test(d.c))return null;const u=new URL(d.u);if(u.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(u.hostname))return null;return {url:u.origin,key:d.k,code:d.c,name:String(d.n||'').slice(0,120),business:String(d.b||'').slice(0,160),email:String(d.e||'').slice(0,300)}}catch{return null}
}
export function inviteMessage(link,{name,business}){return 'Hi'+(name?' '+name.split(' ')[0]:'')+', here is your link to see your cleaning jobs'+(business?' for '+business:'')+'. Open it on your phone and make your password: '+link}
export function smsHref(phone,body){return 'sms:'+String(phone||'').replace(/[^\d+]/g,'')+'?&body='+encodeURIComponent(body)}
export function mailHref(email,subject,body){return 'mailto:'+encodeURIComponent(email||'').replace('%40','@')+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body)}

// ---------------------------------------------------------------- jobs from the route plan
export function windowText(a){const t=v=>{const [h,m]=v.split(':').map(Number);return new Date(2000,0,1,h,m).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})};return a.from||a.to?(a.from?'after '+t(a.from):'')+(a.from&&a.to?', ':'')+(a.to?'done by '+t(a.to):''):''}
// One job per visit in a day plan. Prices are never included.
export function jobsFromPlan(plan){
 const out=[];let n=0;
 for(const g of plan.groups)for(const s of g.stops){
  const a=s.account,lead=s.lead;
  out.push({id:s.item.id,day:plan.date,business:a.name,address:(lead?.address||g.address||'').slice(0,1000),lat:Number.isFinite(lead?.lat)?lead.lat:g.point?.lat??null,lon:Number.isFinite(lead?.lon)?lead.lon:g.point?.lon??null,plaza:(g.plaza?.name||'').slice(0,180),window_text:windowText(a),access:(a.access||'').slice(0,1000),restrooms:a.restrooms,contact_name:(a.contactName||'').slice(0,160),contact_phone:(a.contactPhone||'').slice(0,160),stop_order:n++,instructions:(a.crewNotes||'').slice(0,2000),status:s.item.status});
 }
 return out;
}
// Details the owner may change on the account after a job was sent (not instructions, not progress).
export const DETAIL_FIELDS=['business','address','lat','lon','plaza','window_text','access','restrooms','contact_name','contact_phone','stop_order'];
export function staleJobs(jobs,live){
 const byId=new Map(live.map(j=>[j.id,j]));
 return jobs.filter(j=>{const l=byId.get(j.id);return l&&l.status==='Assigned'&&DETAIL_FIELDS.some(f=>(l[f]??null)!==(j[f]??null))});
}
export function minutesOnSite(job){const a=Date.parse(job.started_at||job.on_way_at||''),b=Date.parse(job.finished_at||'');if(!Number.isFinite(a)||!Number.isFinite(b)||b<=a)return null;const m=Math.round((b-a)/60000);return m>0&&m<=1440?m:null}
export function directionsUrl(job){const dest=Number.isFinite(job.lat)&&Number.isFinite(job.lon)?job.lat.toFixed(6)+','+job.lon.toFixed(6):job.address;return dest?'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(dest)+'&travelmode=driving':''}
export const clockTime=v=>v?new Date(v).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}):'';

// ---------------------------------------------------------------- photos
// Phone photos are 3–10 MB. Make them about 1600 px and 200–500 KB before sending.
export async function shrinkPhoto(file,max=1600,quality=.8){
 if(!file||!/^image\//.test(file.type||'image/'))throw Error('Choose a photo.');
 let img;try{img=await createImageBitmap(file,{imageOrientation:'from-image'})}catch{throw Error('This photo could not be read. Take it with the camera button instead.')}
 const scale=Math.min(1,max/Math.max(img.width,img.height)),w=Math.round(img.width*scale),h=Math.round(img.height*scale);
 const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);img.close?.();
 const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',quality));if(!blob)throw Error('This photo could not be prepared.');
 return blob;
}
export const photoPath=(jobId,kind)=>jobId+'/'+kind+'/'+new Date().toISOString().replace(/[:.]/g,'-')+'-'+crypto.randomUUID().slice(0,8)+'.jpg';

// ---------------------------------------------------------------- revenue
// Each account's monthly price is spread over the visits it should get that month.
// "Earned" is the share of the price for visits marked Done. Missed visits are "at risk".
const monthStart=d=>d.slice(0,8)+'01';
const monthEnd=d=>{const x=new Date(d.slice(0,7)+'-01T12:00:00Z');x.setUTCMonth(x.getUTCMonth()+1);x.setUTCDate(0);return x.toISOString().slice(0,10)};
const prevMonth=d=>{const x=new Date(monthStart(d)+'T12:00:00Z');x.setUTCMonth(x.getUTCMonth()-1);return x.toISOString().slice(0,10)};
function monthItems(accounts,visits,m){return plannedVisits(accounts,visits,monthStart(m),monthEnd(m)).filter(i=>!['Rescheduled','Skipped'].includes(i.status))}
function valueMap(items){const n=new Map();for(const i of items)n.set(i.account.id,(n.get(i.account.id)||0)+1);return new Map([...n].map(([id,c])=>[id,c?items.find(i=>i.account.id===id).account.price/c:0]))}
function tally(items,values,today){
 const r={planned:items.length,done:0,missed:0,open:0,upcoming:0,earned:0,atRisk:0,expected:0};
 for(const i of items){const v=values.get(i.account.id)||0;r.expected+=v;if(i.status==='Done'){r.done++;r.earned+=v}else if(i.status==='Missed'){r.missed++;r.atRisk+=v}else if(i.date<today)r.open++;else r.upcoming++}
 return r;
}
export function revenueByMonth(accounts,visits,today,months=6){
 const out=[];let m=monthStart(today);
 for(let k=0;k<months;k++){const items=monthItems(accounts,visits,m),values=valueMap(items),r=tally(items,values,today);const ids=new Set(items.map(i=>i.account.id));r.contracted=accounts.filter(a=>ids.has(a.id)).reduce((n,a)=>n+a.price,0);r.accounts=ids.size;r.from=m;r.to=monthEnd(m);r.label=niceDay(m,{month:'long',year:'numeric'});out.push(r);m=prevMonth(m)}
 return out;
}
export function revenueByWeek(accounts,visits,today,weeks=8){
 const out=[],cache=new Map();
 const values=m=>{if(!cache.has(m))cache.set(m,valueMap(monthItems(accounts,visits,m)));return cache.get(m)};
 let from=weekStart(today);
 for(let k=0;k<weeks;k++){
  const to=addDays(from,6),items=plannedVisits(accounts,visits,from,to).filter(i=>!['Rescheduled','Skipped'].includes(i.status));
  // A visit's value comes from its own month, so weeks that cross a month line stay right.
  const r={planned:items.length,done:0,missed:0,open:0,upcoming:0,earned:0,atRisk:0,expected:0};
  for(const i of items){const v=values(monthStart(i.date)).get(i.account.id)||0;r.expected+=v;if(i.status==='Done'){r.done++;r.earned+=v}else if(i.status==='Missed'){r.missed++;r.atRisk+=v}else if(i.date<today)r.open++;else r.upcoming++}
  r.from=from;r.to=to;r.label=niceDay(from,{month:'short',day:'numeric'})+' – '+niceDay(to,{month:'short',day:'numeric'});out.push(r);from=addDays(from,-7);
 }
 return out;
}
export function cleanerTotals(jobs,team){
 const byMember=new Map(team.map(m=>[m.id,{member:m,done:0,notFinished:0,minutes:0,timed:0,open:0}]));
 for(const j of jobs){const t=byMember.get(j.member_id);if(!t)continue;if(j.status==='Done'){t.done++;const m=minutesOnSite(j);if(m){t.minutes+=m;t.timed++}}else if(j.status==='Could not finish')t.notFinished++;else t.open++}
 return [...byMember.values()].filter(t=>t.done||t.notFinished||t.open).sort((a,b)=>b.done-a.done||a.member.name.localeCompare(b.member.name));
}
export {dateRange};
