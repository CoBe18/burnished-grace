// PlazaRoute customer booking page: a cleaning business's customers pick a service,
// a day and a time, or ask about monthly service. No sign-in. Payment happens on the
// business's own Stripe or PayPal link; this page never handles card details.
// Copyright 2026 Burnished Grace Creative Studio. All rights reserved.
import {BookingApi,readBookingLink,openDays,dayLabel,timeLabel,price,duration,payHref,payButtonText,niceCode,validEmail,validPhone,validLogo,statusText,statusClass,whenText,DAY_NAMES} from './booking.mjs';

const STORE='plazaroute.book.v1',FIRST_DAYS=12;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
let s=load(),api=null,page=null,days=[],tab='job',sel={service:'',day:'',slot:''},allDays=false,mine=[],noticeTimer,sending=false;

function load(){try{const v=JSON.parse(localStorage.getItem(STORE)||'null');return v&&typeof v==='object'?v:{}}catch{return {}}}
function save(){try{localStorage.setItem(STORE,JSON.stringify(s))}catch{}}
function notice(t){clearTimeout(noticeTimer);$('noticeText').textContent=t;$('notice').hidden=false;noticeTimer=setTimeout(()=>{$('notice').hidden=true},8000)}
function show(id){for(const el of document.querySelectorAll('.bookscreen'))el.hidden=el.id!==id;window.scrollTo({top:0})}
const service=()=>page?.services.find(x=>x.id===sel.service);
const biz=()=>page?.business||'the business';

// ---------------------------------------------------------------- open
async function start(){
 const link=readBookingLink(location.hash);
 if(link){if(s.url!==link.url||s.key!==link.key)s={url:link.url,key:link.key,mine:[],last:s.last};save()}
 if(!s.url||!s.key){show('bookNoLink');return}
 api=new BookingApi(s);show('bookLoading');
 try{page=await api.page()}
 catch(e){$('bookNoLinkText').textContent=e.notSetUp?e.message+' Ask them for their booking link, or call them.':e.message;show('bookNoLink');return}
 header();
 if(!page.enabled){$('bookOffTitle').textContent=(page.business?page.business+' is':'This business is')+' not taking online bookings right now.';show('bookOff');return}
 days=openDays(page);
 $('tabJob').hidden=!page.take_jobs;$('tabMonthly').hidden=!page.take_monthly;
 if(!page.take_jobs&&tab==='job')tab=page.take_monthly?'monthly':'mine';
 if(!page.take_monthly&&tab==='monthly')tab=page.take_jobs?'job':'mine';
 $('bookHeading').textContent=page.business?'Book '+page.business+'.':'Book a cleaning.';
 $('bookIntro').textContent=page.intro||'Pick a service, a day and a time. It takes about two minutes.';
 $('mDays').innerHTML=DAY_NAMES.map((d,i)=>`<label><input type="checkbox" value="${d.slice(0,3)}">${d.slice(0,3)}</label>`).join('');
 prefill();renderServices();setTab(tab);show('bookHome');
}
function header(){
 $('bookBiz').textContent=page.business||'Book a cleaning';document.title='Book a cleaning'+(page.business?' | '+page.business:'');
 $('bookArea').textContent=page.area||'';
 const logo=$('bookLogo');if(validLogo(page.logo)){logo.src=page.logo;logo.alt=(page.business||'Business')+' logo';logo.hidden=false}else logo.hidden=true;
 const call=$('bookCall'),digits=String(page.phone||'').replace(/[^\d+]/g,'');
 if(digits.length>=7){call.href='tel:'+digits;call.textContent='Call '+page.phone;call.hidden=false}else call.hidden=true;
}
function prefill(){
 const l=s.last||{};
 for(const [p,k] of [['j','Name'],['j','Business'],['j','Phone'],['j','Email'],['j','Address'],['m','Name'],['m','Business'],['m','Phone'],['m','Email'],['m','Address']]){const el=$(p+k);if(el&&!el.value)el.value=l[k.toLowerCase()]||''}
 if(!$('lEmail').value)$('lEmail').value=l.email||'';
}
function setTab(t){
 tab=t;
 for(const b of document.querySelectorAll('[data-tab]'))b.setAttribute('aria-selected',String(b.dataset.tab===t));
 $('paneJob').hidden=t!=='job';$('paneMonthly').hidden=t!=='monthly';$('paneMine').hidden=t!=='mine';
 if(t==='mine')loadMine();
 if(t==='job')refreshPage();
}
// Open times change as other people book, so get the newest ones when the customer comes back.
let lastPage=Date.now();
async function refreshPage(){if(!api||sending||Date.now()-lastPage<3000)return;lastPage=Date.now();try{const p=await api.page();if(!p.enabled){start();return}page=p;days=openDays(p);header();renderServices()}catch{}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&page?.enabled&&!$('bookHome').hidden&&tab==='job')refreshPage()});
for(const b of document.querySelectorAll('[data-tab]'))b.onclick=()=>setTab(b.dataset.tab);
$('bookOffRetry').onclick=()=>start();

// ---------------------------------------------------------------- one-time job
function renderServices(){
 const list=page.services||[];
 $('bookServices').innerHTML=list.length?list.map(v=>`<label class="bookservice"><input type="radio" name="service" value="${esc(v.id)}"${v.id===sel.service?' checked':''}><strong>${esc(v.name)}</strong><span class="bookprice">${esc(price(v.price))}</span><p>${esc([v.description,v.minutes?'About '+duration(v.minutes):''].filter(Boolean).join('\n'))}</p></label>`).join(''):`<p class="footnote">No services are listed for online booking yet. Please call${page.phone?' '+esc(page.phone):''} to book.</p>`;
 renderDays();
}
$('bookServices').onchange=e=>{if(e.target.name==='service'){sel.service=e.target.value;renderDays();$('stepDay').scrollIntoView({behavior:'smooth',block:'nearest'})}};
function renderDays(){
 $('stepDay').hidden=!sel.service;
 if(!days.some(d=>d.day===sel.day&&d.open))sel.day='',sel.slot='';
 const list=allDays?days:days.slice(0,FIRST_DAYS);
 $('bookDays').innerHTML=days.length?list.map(d=>`<button type="button" data-day="${d.day}" aria-pressed="${d.day===sel.day}"${d.open?'':' disabled'}><strong>${esc(dayLabel(d.day,{weekday:'short',month:'short',day:'numeric'}))}</strong><span>${d.open?d.open+' time'+(d.open===1?'':'s')+' open':'Full'}</span></button>`).join(''):`<p class="footnote">No days are open for online booking right now. Please call${page.phone?' '+esc(page.phone):''}.</p>`;
 $('bookMoreDays').hidden=allDays||days.length<=FIRST_DAYS;
 renderTimes();
}
$('bookMoreDays').onclick=()=>{allDays=true;renderDays()};
$('bookDays').onclick=e=>{const b=e.target.closest('button[data-day]');if(!b||b.disabled)return;sel.day=b.dataset.day;sel.slot='';renderDays();$('stepTime').scrollIntoView({behavior:'smooth',block:'nearest'})};
function renderTimes(){
 const d=days.find(x=>x.day===sel.day);$('stepTime').hidden=!sel.service||!d;
 if(d&&!d.slots.some(x=>x.slot===sel.slot&&!x.full))sel.slot='';
 if(d){$('bookDayName').textContent=dayLabel(d.day);$('bookTimes').innerHTML=d.slots.map(x=>`<button type="button" data-slot="${x.slot}" aria-pressed="${x.slot===sel.slot}"${x.full?' disabled aria-label="'+esc(x.label)+', taken"':''}>${esc(x.label)}</button>`).join('')}
 renderDetails();
}
$('bookTimes').onclick=e=>{const b=e.target.closest('button[data-slot]');if(!b||b.disabled)return;sel.slot=b.dataset.slot;renderTimes();$('stepDetails').scrollIntoView({behavior:'smooth',block:'nearest'});};
function renderDetails(){
 const v=service(),ready=!!(v&&sel.day&&sel.slot);$('stepDetails').hidden=!ready;
 if(ready)$('bookSummary').textContent=[v.name,dayLabel(sel.day,{weekday:'short',month:'short',day:'numeric'})+' at '+timeLabel(sel.slot),price(v.price)].join(' · ');
}
function contact(p){
 const v={name:$(p+'Name').value.trim(),business:$(p+'Business').value.trim(),phone:$(p+'Phone').value.trim(),email:$(p+'Email').value.trim(),address:$(p+'Address').value.trim(),notes:$(p+'Notes').value.trim(),website:$(p+'Website').value};
 const bad=!v.name?[p+'Name','Enter your name.']:!validPhone(v.phone)?[p+'Phone','Enter a phone number we can reach you at.']:!validEmail(v.email)?[p+'Email','Enter your email address.']:!v.address?[p+'Address','Enter the address of the place to clean.']:null;
 return {v,bad};
}
function remember(v,b){s.last={name:v.name,business:v.business,phone:v.phone,email:v.email,address:v.address};s.mine=[{email:v.email.toLowerCase(),code:b.code},...(s.mine||[]).filter(x=>x.code!==b.code)].slice(0,30);save();prefill()}
$('jobForm').onsubmit=async e=>{
 e.preventDefault();if(sending)return;const st=$('jobStatus'),{v,bad}=contact('j');
 if(bad){st.textContent=bad[1];$(bad[0]).focus();return}
 sending=true;$('jobSend').disabled=true;st.textContent='Sending your request…';
 try{
  const b=await api.book({kind:'job',service:sel.service,day:sel.day,slot:sel.slot,...v});
  remember(v,b);st.textContent='';$('jNotes').value='';sel={service:'',day:'',slot:''};done(b);
  api.page().then(p=>{page=p;days=openDays(p);renderServices()}).catch(()=>{});
 }catch(err){
  st.textContent=err.message;
  // Someone else may have taken the time: get the newest open times.
  try{page=await api.page();days=openDays(page);renderServices()}catch{}
 }finally{sending=false;$('jobSend').disabled=false}
};

// ---------------------------------------------------------------- monthly service
$('monthlyForm').onsubmit=async e=>{
 e.preventDefault();if(sending)return;const st=$('monthlyStatus'),{v,bad}=contact('m');
 if(bad){st.textContent=bad[1];$(bad[0]).focus();return}
 const n=Number($('mRestrooms').value),picked=[...$('mDays').querySelectorAll('input:checked')].map(x=>x.value).join(', ');
 sending=true;$('monthlySend').disabled=true;st.textContent='Sending your request…';
 try{const b=await api.book({kind:'monthly',...v,restrooms:Number.isInteger(n)&&n>=1&&n<=50?n:null,days:picked});remember(v,b);st.textContent='';$('mNotes').value='';done(b)}
 catch(err){st.textContent=err.message}finally{sending=false;$('monthlySend').disabled=false}
};

// ---------------------------------------------------------------- confirmation
function payBlock(b){const href=b.pay_url?payHref(b.pay_url,b.price):'';return href?{href,text:payButtonText(b.pay_url,b.price)}:null}
function done(b){
 const job=b.kind==='job';
 $('doneEyebrow').textContent=job?'BOOKING REQUESTED':'REQUEST SENT';
 $('doneTitle').textContent=job?'Your time is held.':'Your request is in.';
 $('doneIntro').textContent=job?biz()+' will confirm your booking by phone, text or email. Until then it is a request, and your time is held for you.':biz()+' will get back to you about monthly service with a price and a start date.';
 $('doneCode').textContent=niceCode(b.code);
 const facts=job?[['Service',b.service],['When',dayLabel(b.day)+' at '+timeLabel(b.slot)],['Where',b.address],['Price',price(b.price)]]:[['Request','Monthly service'],['Where',b.address],['Restrooms',b.restrooms||''],['Days that suit you',b.days]];
 $('doneFacts').innerHTML=facts.filter(f=>f[1]!==''&&f[1]!=null).map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('');
 const pay=job?payBlock(b):null;$('donePay').hidden=!pay;
 if(pay){$('donePayLink').href=pay.href;$('donePayLink').textContent=pay.text;$('donePayNote').textContent=page.pay_note||'You can pay now, or wait until your booking is confirmed.';$('donePayFoot').textContent='Your payment goes straight to '+biz()+' on their own payment page. After you pay, they mark your booking Paid, and you will see it under My bookings.'}
 show('bookDone');$('bookMain').focus();
}
$('doneMine').onclick=()=>{show('bookHome');setTab('mine')};
$('doneAgain').onclick=()=>{show('bookHome');setTab(page.take_jobs?'job':'monthly')};

// ---------------------------------------------------------------- my bookings
async function loadMine(){
 const saved=s.mine||[],st=$('mineStatus');
 if(!saved.length){mine=[];st.textContent='';renderMine();return}
 st.textContent='Loading…';
 const byEmail=new Map();for(const x of saved)if(!byEmail.has(x.email))byEmail.set(x.email,x.code);
 const out=new Map();let failed='';
 for(const [email,code] of byEmail){try{for(const b of await api.lookup(email,code))out.set(b.code,{...b,email})}catch(e){failed=e.message}}
 mine=[...out.values()].sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));
 st.textContent=failed&&!mine.length?failed:'Updated '+new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
 renderMine();
}
function renderMine(){
 $('mineList').innerHTML=mine.length?mine.map(b=>{
  const pay=payBlock(b),canCancel=['Requested','Confirmed'].includes(b.status),job=b.kind==='job';
  return `<div class="minecard ${statusClass(b.status)}"><div class="minetop"><div><h3>${esc(b.service||'Booking')}</h3><span class="footnote">${esc(whenText(b))}</span></div><span class="jobstatus ${statusClass(b.status)}">${esc(statusText(b))}</span></div>
${b.address?`<p>${esc(b.address)}</p>`:''}${job?`<p>${esc(price(b.price))} · ${b.paid?'<span class="paidtag">✓ Paid</span>':'<span class="unpaidtag">Not marked paid yet</span>'}</p>`:''}${b.note?`<p class="minenote"><strong>From ${esc(biz())}:</strong> ${esc(b.note)}</p>`:''}
<p class="footnote">Confirmation code ${esc(niceCode(b.code))}</p>
<div class="mineactions">${pay?`<a class="primary" href="${esc(pay.href)}" target="_blank" rel="noopener noreferrer">${esc(pay.text)}</a>`:''}${canCancel?`<button type="button" class="quiet" data-cancel="${esc(b.code)}">Cancel this ${job?'booking':'request'}</button>`:''}</div></div>`}).join(''):'<p class="footnote">No bookings on this device yet. After you book, they show up here with their status.</p>';
}
$('mineRefresh').onclick=()=>loadMine();
$('mineList').onclick=async e=>{
 const b=e.target.closest('button[data-cancel]');if(!b)return;
 if(b.dataset.confirm!=='1'){const was=b.textContent;b.dataset.confirm='1';b.textContent='Tap again to cancel it';setTimeout(()=>{if(b.isConnected){b.dataset.confirm='';b.textContent=was}},5000);return}
 const item=mine.find(x=>x.code===b.dataset.cancel);if(!item)return;b.disabled=true;
 try{await api.cancel(item.email,item.code);notice('Cancelled. '+biz()+' can see that it is cancelled.');await loadMine();api.page().then(p=>{page=p;days=openDays(p);renderServices()}).catch(()=>{})}
 catch(err){notice(err.message);b.disabled=false}
};
$('lookupForm').onsubmit=async e=>{
 e.preventDefault();const email=$('lEmail').value.trim().toLowerCase(),code=$('lCode').value.toUpperCase().replace(/[^A-Z0-9]/g,''),st=$('lookupStatus');
 if(!validEmail(email)){st.textContent='Enter the email you booked with.';$('lEmail').focus();return}
 if(code.length!==10){st.textContent='Enter the 10-character confirmation code, like ABCDE-12345.';$('lCode').focus();return}
 st.textContent='Looking…';
 try{await api.lookup(email,code);s.mine=[{email,code},...(s.mine||[]).filter(x=>x.code!==code)].slice(0,30);save();st.textContent='';$('lCode').value='';await loadMine();$('mineList').scrollIntoView({behavior:'smooth',block:'nearest'})}
 catch(err){st.textContent=err.message}
};

start();
