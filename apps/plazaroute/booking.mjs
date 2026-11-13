// PlazaRoute customer bookings: shared by the booking page (book.html) and the
// owner's Bookings screen. No sign-in is used on the booking page. It can only call
// the four public functions in Supabase-Setup.sql.
// Copyright 2026 Burnished Grace Creative Studio. All rights reserved.

export const BOOKING_STATUSES=['Requested','Confirmed','Declined','Cancelled','Done'];
export const SLOT_CHOICES=[30,60,90,120,180,240];
export const DAY_NAMES=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// ---------------------------------------------------------------- the booking link
const b64=s=>btoa(String.fromCharCode(...new TextEncoder().encode(s))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
const unb64=s=>new TextDecoder().decode(Uint8Array.from(atob(s.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0)));
const local=h=>['localhost','127.0.0.1'].includes(h);
const KEY_OK=/^[A-Za-z0-9._-]{20,400}$/;
// The link carries where the business's bookings live (its Supabase Project URL and
// publishable key). Both are meant to be public; the database rules do the protecting.
export function bookingLink(bookUrl,{url,key}){
 let base;try{base=new URL(bookUrl)}catch{throw Error('Add your booking page address first.')}
 if(base.protocol!=='https:'&&!local(base.hostname))throw Error('Your booking page address must start with https://');
 if(!KEY_OK.test(key||''))throw Error('Connect Sync first, so the link knows your Supabase project.');
 const u=new URL(url),m=/^([a-z0-9]{12,40})\.supabase\.co$/.exec(u.hostname);
 base.hash=m&&u.protocol==='https:'?'p='+m[1]+'.'+key:'j='+b64(JSON.stringify({u:u.origin,k:key}));
 return base.toString();
}
export function readBookingLink(hash){
 const p=/(?:^#|&)p=([a-z0-9]{12,40})\.([A-Za-z0-9._-]{20,400})(?:&|$)/.exec(hash||'');
 if(p)return {url:'https://'+p[1]+'.supabase.co',key:p[2]};
 const j=/(?:^#|&)j=([A-Za-z0-9_-]+)(?:&|$)/.exec(hash||'');if(!j)return null;
 try{const d=JSON.parse(unb64(j[1]));if(typeof d.u!=='string'||!KEY_OK.test(d.k||''))return null;const u=new URL(d.u);if(u.protocol!=='https:'&&!local(u.hostname))return null;return {url:u.origin,key:d.k}}catch{return null}
}

// ---------------------------------------------------------------- talking to Supabase without a sign-in
export class BookingApi{
 constructor({url,key}){this.url=url;this.key=key}
 async rpc(fn,args={}){
  let r;try{r=await fetch(this.url+'/rest/v1/rpc/'+fn,{method:'POST',headers:{apikey:this.key,'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(30000)})}
  catch{throw Error('No connection. Check your signal or internet and try again.')}
  const text=await r.text();let d=null;try{d=text?JSON.parse(text):null}catch{}
  if(!r.ok){
   const msg=d?.message||d?.msg||d?.error||'';
   if(d?.code==='P0001')throw Error(msg);
   if(r.status===404||/PGRST20[25]|42883|Could not find the function/.test(msg+(d?.code||'')))throw Object.assign(Error('Online booking is not set up for this business yet.'),{notSetUp:true});
   if(r.status===401||r.status===403)throw Object.assign(Error('This booking link is not working any more. Ask the business for a new link.'),{notSetUp:true});
   throw Error(r.status>=500?'Booking is not available right now. Please try again in a few minutes, or call.':'That did not go through. Please try again, or call.');
  }
  return d;
 }
 page(){return this.rpc('hub_booking_page')}
 book(p){return this.rpc('hub_book',{p})}
 lookup(email,code){return this.rpc('hub_booking_lookup',{p_email:email,p_code:code})}
 cancel(email,code){return this.rpc('hub_booking_cancel',{p_email:email,p_code:code})}
}

// ---------------------------------------------------------------- days and times
const pad=n=>String(n).padStart(2,'0');
export const validDay=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v+'T12:00:00Z'))?v:'';
export function addDays(day,n){const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
export const dayOfWeek=day=>new Date(day+'T12:00:00Z').getUTCDay();
export const minutesOf=t=>{const m=/^(\d{1,2}):(\d{2})/.exec(t||'');return m?Number(m[1])*60+Number(m[2]):NaN};
export const clockOf=min=>pad(Math.floor(min/60))+':'+pad(min%60);
export function timeLabel(t){const m=minutesOf(t);if(!Number.isFinite(m))return '';const h=Math.floor(m/60),mm=m%60;return (h%12||12)+':'+pad(mm)+' '+(h<12?'AM':'PM')}
export function dayLabel(day,opts={weekday:'long',month:'long',day:'numeric'}){return validDay(day)?new Date(day+'T12:00:00').toLocaleDateString('en-US',opts):''}
// Every start time the business offers on any open day.
export function slotTimes(s){
 const from=minutesOf(s.open_from),to=minutesOf(s.open_to),step=Number(s.slot_minutes);
 if(!Number.isFinite(from)||!Number.isFinite(to)||!(step>0))return [];
 const out=[];for(let t=from;t+step<=to;t+=step)out.push(clockOf(t));return out;
}
// The days a customer may pick, each with its open times and how many are left.
export function openDays(page){
 if(!page?.enabled||!validDay(page.today))return [];
 const times=slotTimes(page),taken=new Map((page.taken||[]).map(t=>[t.day+' '+t.slot,t.n])),days=new Set((page.open_days||[]).map(Number)),out=[];
 for(let n=page.min_notice_days;n<=page.max_days_ahead;n++){
  const day=addDays(page.today,n);if(!days.has(dayOfWeek(day)))continue;
  const slots=times.map(slot=>({slot,label:timeLabel(slot),full:(taken.get(day+' '+slot)||0)>=page.per_slot}));
  out.push({day,slots,open:slots.filter(x=>!x.full).length});
 }
 return out;
}

// ---------------------------------------------------------------- money and pay links
export function price(n){const v=Number(n);if(!Number.isFinite(v))return '';return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:Number.isInteger(v)?0:2,maximumFractionDigits:2}).format(v)}
export function duration(min){const m=Number(min);if(!(m>0))return '';const h=Math.floor(m/60),r=m%60;return h?(h+' hr'+(h===1?'':'s')+(r?' '+r+' min':'')):r+' min'}
// Only https links are ever shown as a pay button.
export function safePayUrl(v){try{const u=new URL(String(v||'').trim());return u.protocol==='https:'&&u.hostname.includes('.')&&!u.username&&!u.password?u.toString():''}catch{return ''}}
export function payKind(url){let h='';try{h=new URL(url).hostname.toLowerCase()}catch{return ''}return /(^|\.)stripe\.com$/.test(h)?'Stripe':/(^|\.)(paypal\.com|paypal\.me)$/.test(h)?'PayPal':/(^|\.)(square\.link|squareup\.com)$/.test(h)?'Square':/(^|\.)venmo\.com$/.test(h)?'Venmo':''}
// A paypal.me link can carry the amount, so the customer does not have to type it.
export function payHref(url,amount){
 const safe=safePayUrl(url);if(!safe)return '';
 const u=new URL(safe),a=Number(amount);
 if(/(^|\.)paypal\.me$/i.test(u.hostname)&&a>0&&/^\/[A-Za-z0-9._-]+\/?$/.test(u.pathname))u.pathname=u.pathname.replace(/\/$/,'')+'/'+(Number.isInteger(a)?a:a.toFixed(2));
 return u.toString();
}
export function payButtonText(url,amount){const k=payKind(url),p=price(amount);return 'Pay'+(p?' '+p:'')+(k?' with '+k:' online')}

// ---------------------------------------------------------------- small helpers
export const niceCode=c=>{const s=String(c||'').toUpperCase().replace(/[^A-Z0-9]/g,'');return s.length===10?s.slice(0,5)+'-'+s.slice(5):s};
export const validEmail=v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'').trim());
export const validPhone=v=>String(v||'').replace(/\D/g,'').length>=7;
export const validLogo=v=>typeof v==='string'&&v.length<=150000&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v);
export function statusText(b){
 if(b.status==='Requested')return b.kind==='monthly'?'Sent. Waiting to hear back':'Requested. Waiting for confirmation';
 if(b.status==='Confirmed')return b.kind==='monthly'?'Approved':'Confirmed';
 if(b.status==='Declined')return 'Not available';
 return b.status;
}
export const statusClass=s=>({Requested:'assigned',Confirmed:'working',Done:'done',Declined:'problem',Cancelled:'none'})[s]||'none';
export function whenText(b){return b.kind==='job'&&b.day?dayLabel(b.day,{weekday:'short',month:'short',day:'numeric'})+(b.slot?' at '+timeLabel(b.slot):''):b.kind==='monthly'?[b.restrooms?b.restrooms+' restroom'+(b.restrooms===1?'':'s'):'',b.days].filter(Boolean).join(' · '):''}

// ---------------------------------------------------------------- owner side
// The job a cleaner sees for a booked one-time job. The price is never included.
export const jobIdFor=b=>'bk-'+b.id;
export function jobFromBooking(b){
 return {id:jobIdFor(b),day:b.day,business:(b.business||b.name||'Booked job').slice(0,180),address:(b.address||'').slice(0,1000),lat:null,lon:null,plaza:'',window_text:b.slot?'at '+timeLabel(b.slot):'',access:'',restrooms:null,contact_name:(b.name||'').slice(0,160),contact_phone:(b.phone||'').slice(0,160),stop_order:null,
  instructions:[b.service_name?'Booked job: '+b.service_name+(b.minutes?' (about '+duration(b.minutes)+')':''):'',b.notes?'Customer’s note: '+b.notes:''].filter(Boolean).join('\n').slice(0,2000)};
}
export function customerMessage(b,business,kind){
 const hi='Hi'+(b.name?' '+b.name.split(' ')[0]:'')+', ',from=business?' '+business:'';
 const what=b.kind==='job'?(b.service_name||'your cleaning')+' on '+dayLabel(b.day,{weekday:'long',month:'long',day:'numeric'})+' at '+timeLabel(b.slot):'your request for monthly cleaning';
 if(kind==='decline')return hi+'thank you for asking'+from+' about '+what+'. I’m sorry, we can’t take it'+(b.kind==='job'?' at that time':' right now')+'.'+(b.customer_note?' '+b.customer_note:'');
 if(kind==='paid')return hi+'we received your payment'+(b.price?' of '+price(b.price):'')+' for '+what+'. Thank you!';
 if(b.kind==='monthly')return hi+'thank you for asking'+from+' about monthly cleaning. I’d like to set it up with you.'+(b.customer_note?' '+b.customer_note:'')+' What is a good time to talk?';
 return hi+'this is'+(from||' your cleaner')+'. Your booking is confirmed: '+what+', at '+(b.address||'your address')+'.'+(b.customer_note?' '+b.customer_note:'')+' Your confirmation code is '+niceCode(b.code)+'.';
}
// Booked one-time jobs by month, for the Revenue screen.
export function bookingTotals(bookings,from,to){
 const r={jobs:0,done:0,paid:0,paidTotal:0,unpaid:0,unpaidTotal:0};
 for(const b of bookings){
  if(b.kind!=='job'||!['Confirmed','Done'].includes(b.status)||!(b.day>=from&&b.day<=to))continue;
  r.jobs++;if(b.status==='Done')r.done++;const p=Number(b.price)||0;
  if(b.paid){r.paid++;r.paidTotal+=p}else{r.unpaid++;r.unpaidTotal+=p}
 }
 return r;
}
