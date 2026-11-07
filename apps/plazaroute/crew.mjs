// PlazaRoute cleaners' page: each cleaner sees only the jobs assigned to them,
// gets directions and access notes, sends before-and-after photos and marks the job done.
// Copyright 2026 Burnished Grace Creative Studio. All rights reserved.
import {HubClient,readInvite,directionsUrl,clockTime,shrinkPhoto,photoPath,inList} from './hub.mjs';
import {addDays,niceDay} from './route.mjs';

const STORE='plazaroute.crew.v1';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const todayLocal=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
let s=load(),client=null,me=null,tab='today',jobs=[],photos=new Map(),urls=new Map(),pending=new Map(),busy=new Set(),openPanel='',signMode='signup',noticeTimer;

function load(){try{const v=JSON.parse(localStorage.getItem(STORE)||'null');return v&&typeof v==='object'?v:null}catch{return null}}
function save(){try{if(s)localStorage.setItem(STORE,JSON.stringify(s));else localStorage.removeItem(STORE)}catch{}}
function notice(t){clearTimeout(noticeTimer);$('noticeText').textContent=t;$('notice').hidden=false;noticeTimer=setTimeout(()=>{$('notice').hidden=true},8000)}
function show(id){for(const el of document.querySelectorAll('.crewscreen'))el.hidden=el.id!==id;$('crewSignOut').hidden=!['crewJobs','crewOff'].includes(id)}

// ---------------------------------------------------------------- sign-in
async function auth(path,body){
 let r;try{r=await fetch(s.url+'/auth/v1/'+path,{method:'POST',headers:{apikey:s.key,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)})}catch{throw Error('No connection. Check your signal and try again.')}
 const d=await r.json().catch(()=>({}));
 if(!r.ok){const m=d.msg||d.message||d.error_description||'';const e=Error(/already registered|already exists/i.test(m+d.error_code)?'This email already has a password. Tap “I already have a password” to sign in.':/invalid login|invalid_grant/i.test(m+d.error)?(path.includes('refresh')?'Please sign in again.':'That email and password did not match. Try again.'):/weak|at least/i.test(m+d.error_code)?'Use a longer password, at least 8 characters.':/not confirmed/i.test(m)?'Your email is not confirmed yet. Open the email Supabase sent you, tap the link, then sign in here.':/rate|too many/i.test(m)?'Too many tries. Wait a minute and try again.':m||'Sign-in failed ('+r.status+').');e.signedOut=path.includes('refresh');throw e}
 return d;
}
function adopt(d){s.access=d.access_token;s.refresh=d.refresh_token;s.expires=Date.now()+Math.max(60,(d.expires_in||3600)-60)*1000;s.userId=d.user?.id||s.userId;if(d.user?.email)s.email=d.user.email;save()}
async function token(){if(!s?.refresh)throw Error('Please sign in again.');if(!s.access||Date.now()>s.expires){try{adopt(await auth('token?grant_type=refresh_token',{refresh_token:s.refresh}))}catch(e){if(e.signedOut){s.access='';s.refresh='';save();signIn('Please sign in again.')}throw e}}return s.access}

function signIn(message=''){
 show('crewSign');
 const joining=!!s?.code&&!s?.joined;signMode=joining&&!s?.refreshUsed?'signup':'signin';setMode();
 $('crewEmail').value=s?.email||'';$('crewSignStatus').textContent=message;
 if(s?.name)$('crewSignEyebrow').textContent=('WELCOME, '+s.name).toUpperCase();
}
function setMode(){
 const up=signMode==='signup';
 $('crewSignTitle').textContent=up?'Make your password.':'Sign in to see your jobs.';
 $('crewSignIntro').textContent=up?'You only do this once'+(s?.business?' for '+s.business:'')+'. After that, this page opens straight to your jobs.':'Use the email and password you made when you joined'+(s?.business?' '+s.business:'')+'.';
 $('crewPasswordLabel').innerHTML=up?'Make a password <span>(at least 8 characters)</span>':'Your password';
 $('crewPassword').autocomplete=up?'new-password':'current-password';
 $('crewSignButton').textContent=up?'Create my sign-in':'Sign in';
 $('crewSwitch').textContent=up?'I already have a password':'I need to make a password';
}
$('crewSwitch').onclick=()=>{signMode=signMode==='signup'?'signin':'signup';setMode();$('crewSignStatus').textContent=''};
$('crewSignForm').onsubmit=async e=>{
 e.preventDefault();const email=$('crewEmail').value.trim(),password=$('crewPassword').value,st=$('crewSignStatus'),b=$('crewSignButton');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){st.textContent='Enter your email address.';return}
 if(password.length<8){st.textContent='Use at least 8 characters for your password.';return}
 b.disabled=true;st.textContent=signMode==='signup'?'Making your sign-in…':'Signing in…';
 try{
  if(signMode==='signup'){const d=await auth('signup',{email,password});if(!d.access_token){s.email=email;save();signMode='signin';setMode();st.textContent='Almost done. We sent a confirmation email to '+email+'. Open it and tap the link. (If a page then says it can’t be reached, that’s OK.) Come back here and sign in.';return}adopt(d)}
  else adopt(await auth('token?grant_type=password',{email,password}));
  $('crewPassword').value='';await start();
 }catch(err){st.textContent=err.message}finally{b.disabled=false}
};
$('crewSignOut').onclick=()=>{const b=$('crewSignOut');if(b.dataset.confirm!=='1'){b.dataset.confirm='1';b.textContent='Tap again to sign out';setTimeout(()=>{b.dataset.confirm='';b.textContent='Sign out'},4000);return}s.access='';s.refresh='';save();me=null;signIn('You are signed out.')};
$('crewRetry').onclick=()=>start();

// ---------------------------------------------------------------- start
async function start(){
 client=new HubClient({url:s.url,key:s.key,token,expired:()=>{s.expires=0}});
 show('crewLoading');
 try{
  me=await client.rpc('hub_me');
  if(!me&&s.code){try{me=await client.rpc('hub_join',{p_code:s.code})}catch(e){$('crewOffText').textContent=e.message;show('crewOff');return}}
  if(!me){$('crewOffText').textContent='Your boss turned off your access, or your invite link was replaced. Ask them to send you a new link.';show('crewOff');return}
  s.joined=true;s.name=me.name;if(me.business)s.business=me.business;save();
  $('crewBiz').textContent=me.business||'My Jobs';$('crewWho').textContent='Signed in as '+me.name;document.title='My Jobs | '+(me.business||'PlazaRoute');
  show('crewJobs');await loadJobs();
 }catch(e){if(!s.refresh)return;$('crewStatus').textContent=e.message;show('crewJobs');renderJobs()}
}

// ---------------------------------------------------------------- jobs
function range(){const t=todayLocal();return tab==='today'?{q:'day=eq.'+t+'&order=stop_order.asc',title:'Today',sub:niceDay(t,{weekday:'long',month:'long',day:'numeric'})}:tab==='next'?{q:'day=gt.'+t+'&day=lte.'+addDays(t,7)+'&order=day.asc,stop_order.asc',title:'Next 7 days',sub:''}:{q:'day=gte.'+addDays(t,-7)+'&day=lt.'+t+'&order=day.desc,stop_order.asc',title:'Last 7 days',sub:''}}
async function loadJobs(quiet=false){
 const r=range();$('crewHeading').textContent=r.title;
 if(!quiet)$('crewStatus').textContent='Loading…';
 try{
  jobs=await client.select('hub_jobs','select=*&'+r.q);
  const ids=jobs.map(j=>j.id),list=ids.length?await client.select('hub_photos','select=id,job_id,kind,path,created_at,uploaded_by&job_id='+inList(ids)+'&order=created_at.asc'):[];
  photos=new Map();for(const p of list){if(!photos.has(p.job_id))photos.set(p.job_id,[]);photos.get(p.job_id).push(p)}
  const need=list.map(p=>p.path).filter(p=>!urls.has(p));if(need.length){const m=await client.signed(need,6*3600);for(const [k,v] of m)urls.set(k,v)}
  $('crewStatus').textContent=(r.sub?r.sub+' · ':'')+'Updated '+new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
 }catch(e){$('crewStatus').textContent=e.message}
 renderJobs();
}
const label={'Assigned':'Not started','On the way':'On the way','In progress':'Working','Done':'✓ Done','Could not finish':'⚠ Could not finish'};
const cls={'Assigned':'assigned','On the way':'onway','In progress':'working','Done':'done','Could not finish':'problem'};
function photoRow(j,kind){
 const list=(photos.get(j.id)||[]).filter(p=>p.kind===kind),wait=(pending.get(j.id)||[]).filter(p=>p.kind===kind).length;
 const canAdd=j.status!=='Done';
 return `<div class="crewphotos"><h3>${kind==='before'?'Before':'After'} photos <span class="footnote">${list.length}</span></h3><div class="crewthumbs">${list.map(p=>`<figure><a href="${esc(urls.get(p.path)||'#')}" target="_blank" rel="noopener"><img src="${esc(urls.get(p.path)||'')}" alt="${kind} photo taken ${esc(clockTime(p.created_at))}" loading="lazy"></a>${p.uploaded_by===s.userId&&canAdd?`<button type="button" class="crewdel" data-delphoto="${esc(p.id)}" data-job="${esc(j.id)}" aria-label="Delete this photo">×</button>`:''}</figure>`).join('')}${canAdd?`<label class="crewadd"><input type="file" accept="image/*" capture="environment" multiple data-upload="${esc(j.id)}" data-kind="${kind}"><span aria-hidden="true">＋</span><span>${kind==='before'?'Before':'After'} photo</span></label>`:''}</div>${wait?`<p class="crewwarn">${wait} photo${wait===1?'':'s'} not sent yet. <button type="button" class="quiet" data-retry="${esc(j.id)}">Send again</button></p>`:''}</div>`;
}
function renderJobs(){
 if(!jobs.length){$('crewList').innerHTML=`<div class="empty crewempty">${tab==='today'?'No jobs for you today.':tab==='next'?'No jobs for you in the next 7 days yet.':'No jobs in the last 7 days.'}</div>`;return}
 let lastDay='';
 $('crewList').innerHTML=jobs.map((j,i)=>{
  const dayHead=tab!=='today'&&j.day!==lastDay?`<h2 class="crewday">${esc(niceDay(j.day,{weekday:'long',month:'short',day:'numeric'}))}</h2>`:'';lastDay=j.day;
  const dir=directionsUrl(j),busyNow=busy.has(j.id),after=(photos.get(j.id)||[]).filter(p=>p.kind==='after').length,isToday=j.day===todayLocal();
  const times=[j.on_way_at&&'On the way '+clockTime(j.on_way_at),j.started_at&&'Started '+clockTime(j.started_at),j.finished_at&&(j.status==='Done'?'Done ':'Stopped ')+clockTime(j.finished_at)].filter(Boolean).join(' · ');
  let actions='';
  if(j.status==='Assigned')actions=`<button type="button" class="quiet big" data-status="On the way" data-job="${esc(j.id)}">On my way</button><button type="button" class="primary big" data-status="In progress" data-job="${esc(j.id)}">Start job</button>`;
  else if(j.status==='On the way')actions=`<button type="button" class="primary big" data-status="In progress" data-job="${esc(j.id)}">Start job</button>`;
  else if(j.status==='In progress')actions=`<button type="button" class="primary big" data-panel="done" data-job="${esc(j.id)}">Job complete</button><button type="button" class="quiet big" data-panel="stuck" data-job="${esc(j.id)}">Couldn’t finish</button>`;
  else actions=`<button type="button" class="quiet" data-status="In progress" data-job="${esc(j.id)}">${j.status==='Done'?'Undo: not done yet':'Back to working on it'}</button>`;
  const panel=openPanel===j.id+':done'?`<div class="crewpanel"><label for="note-${esc(j.id)}">Note for your boss <span>(optional)</span></label><textarea id="note-${esc(j.id)}" rows="2" maxlength="2000" placeholder="Out of soap. Back door sticks.">${esc(j.cleaner_note||'')}</textarea>${after?'':'<p class="crewwarn">No after photos yet. Add them above first if you can.</p>'}<button type="button" class="primary big" data-finish="Done" data-job="${esc(j.id)}">Send: Job complete</button><button type="button" class="quiet" data-panel="" data-job="${esc(j.id)}">Cancel</button></div>`:openPanel===j.id+':stuck'?`<div class="crewpanel"><label for="note-${esc(j.id)}">What happened? <span>(your boss sees this)</span></label><textarea id="note-${esc(j.id)}" rows="3" maxlength="2000" placeholder="Business was closed. Key was not in the lockbox."></textarea><button type="button" class="primary big" data-finish="Could not finish" data-job="${esc(j.id)}">Send to my boss</button><button type="button" class="quiet" data-panel="" data-job="${esc(j.id)}">Cancel</button></div>`:'';
  return dayHead+`<article class="crewjob ${cls[j.status]}" id="job-${esc(j.id)}"><div class="crewjobtop"><span class="stopnum">${j.stop_order!=null?j.stop_order+1:i+1}</span><div><h2>${esc(j.business)}</h2>${j.plaza?`<span class="footnote">${esc(j.plaza)}</span>`:''}</div><span class="jobstatus ${cls[j.status]}">${esc(label[j.status])}</span></div>
<div class="crewfacts">${j.address?`<p>${esc(j.address)}</p>`:''}${dir?`<a class="buttonlink" href="${esc(dir)}" target="_blank" rel="noopener">Directions ↗</a>`:''}${j.contact_phone?`<a class="buttonlink" href="tel:${esc(j.contact_phone.replace(/[^\d+]/g,''))}">Call ${esc(j.contact_name||'on-site contact')}</a>`:''}</div>
<p class="footnote">${esc([j.restrooms?j.restrooms+' restroom'+(j.restrooms===1?'':'s'):'',j.window_text].filter(Boolean).join(' · '))}</p>
${j.access?`<div class="crewnote access"><strong>How to get in</strong><p>${esc(j.access)}</p></div>`:''}${j.instructions?`<div class="crewnote"><strong>Instructions</strong><p>${esc(j.instructions)}</p></div>`:''}
${times?`<p class="footnote">${esc(times)}</p>`:''}${j.cleaner_note?`<p class="jobnote">Your note: “${esc(j.cleaner_note)}”</p>`:''}
${isToday||j.status!=='Assigned'||tab!=='next'?photoRow(j,'before')+photoRow(j,'after'):''}
<div class="crewactions"${busyNow?' aria-busy="true"':''}>${actions}</div>${panel}</article>`;
 }).join('');
}

$('crewList').addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b)return;const id=b.dataset.job;
 if(b.dataset.panel!==undefined){openPanel=b.dataset.panel?id+':'+b.dataset.panel:'';renderJobs();if(openPanel)document.getElementById('note-'+id)?.focus();return}
 if(b.dataset.status)return setStatus(id,b.dataset.status,null);
 if(b.dataset.finish){const note=document.getElementById('note-'+id)?.value.trim()||'';if(b.dataset.finish==='Could not finish'&&!note){notice('Write what happened, so your boss knows.');return}return setStatus(id,b.dataset.finish,note||null)}
 if(b.dataset.retry)return sendPending(b.dataset.retry);
 if(b.dataset.delphoto){if(b.dataset.confirm!=='1'){b.dataset.confirm='1';b.textContent='Delete?';b.classList.add('confirm');setTimeout(()=>{b.dataset.confirm='';b.textContent='×';b.classList.remove('confirm')},4000);return}return deletePhoto(id,b.dataset.delphoto)}
});
$('crewList').addEventListener('change',async e=>{
 const input=e.target.closest('input[data-upload]');if(!input)return;
 const id=input.dataset.upload,kind=input.dataset.kind,files=[...input.files].slice(0,12);input.value='';
 if(!files.length)return;
 const list=pending.get(id)||[];
 for(const f of files){try{list.push({kind,blob:await shrinkPhoto(f)})}catch(err){notice(err.message)}}
 pending.set(id,list);await sendPending(id);
});
async function sendPending(id){
 const list=pending.get(id)||[];if(!list.length||busy.has(id))return;
 busy.add(id);let sent=0;
 try{
  while(list.length){
   const p=list[0];$('crewStatus').textContent='Sending photo '+(sent+1)+(list.length>1?' of '+(sent+list.length):'')+'…';
   const path=photoPath(id,p.kind);await client.upload(path,p.blob);
   const [row]=await client.insert('hub_photos',[{job_id:id,kind:p.kind,path}]);
   if(!photos.has(id))photos.set(id,[]);photos.get(id).push(row);urls.set(path,URL.createObjectURL(p.blob));
   list.shift();sent++;
  }
  $('crewStatus').textContent=sent+' photo'+(sent===1?'':'s')+' sent ✓';
 }catch(e){notice(e.message+' Your photo is kept here; tap Send again when you have signal.');$('crewStatus').textContent='Some photos were not sent.'}
 finally{busy.delete(id);if(!list.length)pending.delete(id);renderJobs()}
}
async function deletePhoto(jobId,photoId){
 const list=photos.get(jobId)||[],p=list.find(x=>x.id===photoId);if(!p)return;
 try{await client.removeFiles([p.path]);await client.remove('hub_photos','id=eq.'+p.id);photos.set(jobId,list.filter(x=>x.id!==photoId));renderJobs()}catch(e){notice(e.message)}
}
async function setStatus(id,status,note){
 if(busy.has(id))return;busy.add(id);renderJobs();
 try{const j=await client.rpc('hub_job_status',{p_job:id,p_status:status,p_note:note});const i=jobs.findIndex(x=>x.id===id);if(i>=0&&j)jobs[i]=j;openPanel='';notice(status==='Done'?'Job complete. Your boss can see it now.':status==='Could not finish'?'Sent. Your boss can see your note.':status==='On the way'?'Your boss can see you’re on the way.':status==='In progress'?'Started. Add before photos if you haven’t yet.':'Updated.')}
 catch(e){notice(e.message);loadJobs(true)}
 finally{busy.delete(id);renderJobs()}
}
for(const t of document.querySelectorAll('[data-tab]'))t.onclick=()=>{tab=t.dataset.tab;openPanel='';for(const x of document.querySelectorAll('[data-tab]'))x.setAttribute('aria-selected',String(x===t));loadJobs()};
$('crewRefresh').onclick=()=>loadJobs();
setInterval(()=>{if(document.visibilityState==='visible'&&me&&!openPanel&&!busy.size&&!$('crewJobs').hidden)loadJobs(true)},60000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&me&&!openPanel&&!busy.size)loadJobs(true)});

// ---------------------------------------------------------------- open
const invite=readInvite(location.hash);
if(invite){
 if(!s||s.url!==invite.url||s.code!==invite.code)s={url:invite.url,key:invite.key,code:invite.code,name:invite.name,business:invite.business,email:invite.email||s?.email||''};
 save();history.replaceState(null,'',location.pathname+location.search);
}
if(!s?.url)show('crewNoInvite');
else{if(s.business)$('crewBiz').textContent=s.business;if(s.refresh)start();else signIn()}
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});
