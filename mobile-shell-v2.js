import { CONFIG } from './config.js'

const $=id=>document.getElementById(id)
const mq=window.matchMedia('(max-width:850px)')
let notifyHome=null,readyBound=false

function toast(text){const t=$('toast');if(!t){alert(text);return}t.textContent=text;t.classList.remove('hidden');clearTimeout(t._mobile);t._mobile=setTimeout(()=>t.classList.add('hidden'),3200)}
function sessionToken(){
  try{const ref=new URL(CONFIG.SUPABASE_URL).hostname.split('.')[0],raw=localStorage.getItem(`sb-${ref}-auth-token`);if(!raw)return null;const d=JSON.parse(raw);return d?.access_token||d?.currentSession?.access_token||d?.session?.access_token||null}catch{return null}
}
function jwtSub(token){try{return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).sub||null}catch{return null}}
function isMainReady(){return !!$('mainView')&&!$('mainView').classList.contains('hidden')&&!!$('myName')?.textContent?.trim()}
function who(){return String($('myName')?.textContent||'').trim().toLowerCase()}
function isIsa(){return who()==='isa'}
function isParentName(){return who()==='keise'||who()==='alan'}

function ensureProfileNav(){
  const study=$('studyNav'),diary=$('diaryNav'),supervision=$('supervisionNav'),parents=$('parentsNav')
  if(isIsa()){
    study?.classList.remove('hidden');diary?.classList.remove('hidden');supervision?.classList.add('hidden');parents?.classList.add('hidden')
    import('./isa-tools.js?v=5').catch(()=>{})
  }else{
    study?.classList.add('hidden');diary?.classList.add('hidden')
    if(isParentName()){supervision?.classList.remove('hidden');parents?.classList.remove('hidden')}
  }
}
function moveNotification(){
  const banner=$('notifyBanner'),sidebar=document.querySelector('.sidebar'),nav=document.querySelector('.nav-tabs')
  if(!banner||!sidebar||!nav)return
  if(mq.matches){
    if(!notifyHome)notifyHome={parent:banner.parentNode,next:banner.nextSibling}
    if(banner.parentNode!==sidebar)nav.after(banner)
  }else if(notifyHome?.parent&&banner.parentNode!==notifyHome.parent){
    notifyHome.parent.insertBefore(banner,notifyHome.next)
  }
}
function visible(id){const el=$(id);return !!el&&!el.classList.contains('hidden')}
function syncMobileState(){
  if(!isMainReady())return
  ensureProfileNav();moveNotification()
  document.body.classList.remove('mobile-chat-list','mobile-chat-open','mobile-panel-open')
  if(!mq.matches)return
  if(visible('calendarPanel')||visible('supervisionPanel')||visible('parentsPanel'))document.body.classList.add('mobile-panel-open')
  else if(visible('chatPanel'))document.body.classList.add('mobile-chat-open')
  else document.body.classList.add('mobile-chat-list')
}
function base64ToBytes(v){const pad='='.repeat((4-v.length%4)%4),raw=atob((v+pad).replace(/-/g,'+').replace(/_/g,'/')),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out}
async function currentMember(token){
  const sub=jwtSub(token);if(!sub)throw new Error('Sessão do Cantinho não encontrada.')
  const r=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/family_members?select=id&auth_user_id=eq.${encodeURIComponent(sub)}&active=eq.true&limit=1`,{headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${token}`},cache:'no-store'})
  const d=await r.json();if(!r.ok||!d?.[0])throw new Error('Perfil não encontrado para ativar notificações.');return d[0]
}
async function activateNotifications(){
  const btn=$('enableNotificationsBtn');if(btn){btn.disabled=true;btn.textContent='Ativando…'}
  try{
    if(!window.isSecureContext)throw new Error('As notificações precisam de uma conexão segura HTTPS.')
    if(!('Notification' in window))throw new Error('Este navegador não oferece notificações para sites.')
    if(!('serviceWorker' in navigator)||!('PushManager' in window))throw new Error('Este navegador não oferece Push Web. Abra o Cantinho no Chrome ou Edge atualizado.')
    let perm=Notification.permission
    if(perm!=='granted')perm=await Notification.requestPermission()
    if(perm!=='granted')throw new Error('As notificações não foram autorizadas no navegador.')
    const token=sessionToken();if(!token)throw new Error('Entre novamente no Cantinho para registrar este aparelho.')
    const member=await currentMember(token)
    const reg=await navigator.serviceWorker.register('./sw.js?v=32',{scope:'./'})
    await Promise.race([navigator.serviceWorker.ready,new Promise((_,rej)=>setTimeout(()=>rej(new Error('O serviço de notificações demorou para iniciar. Recarregue e tente novamente.')),7000))])
    let sub=await reg.pushManager.getSubscription()
    if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:base64ToBytes(CONFIG.VAPID_PUBLIC_KEY)})
    const j=sub.toJSON()
    const payload={member_id:member.id,platform:'web',endpoint:j.endpoint,p256dh:j.keys?.p256dh||null,auth_key:j.keys?.auth||null,device_name:/Android|iPhone|Mobile/i.test(navigator.userAgent)?'Celular':'Computador',enabled:true,child_message_alarm:true,updated_at:new Date().toISOString()}
    const save=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/push_devices?on_conflict=member_id,endpoint`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(payload)})
    if(!save.ok){let d=null;try{d=await save.json()}catch{};throw new Error(d?.message||'O aparelho autorizou notificações, mas não foi possível registrá-lo.')}
    $('notifyBanner')?.classList.add('hidden')
    await reg.showNotification('Cantinho da Isa 💜',{body:'Notificações ativadas neste aparelho.',icon:'icon.svg',badge:'icon.svg',tag:'cantinho-teste',renotify:false,data:{url:'./'}}).catch(()=>{})
    toast('Notificações ativadas neste celular 🔔')
  }catch(e){console.error('Ativação de notificações:',e);toast(e?.message||'Não foi possível ativar as notificações.')}
  finally{if(btn){btn.disabled=false;btn.textContent='Ativar'}}
}
function bind(){
  if(readyBound||!isMainReady())return false
  readyBound=true
  syncMobileState()
  const notify=$('enableNotificationsBtn')
  if(notify&&!notify.dataset.mobilePushV2){notify.dataset.mobilePushV2='1';notify.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();activateNotifications()},{capture:true})}
  document.addEventListener('click',e=>{
    if(e.target.closest('.nav-btn,.chat-item[data-conv],#mobileBackBtn'))setTimeout(syncMobileState,90)
  })
  mq.addEventListener?.('change',()=>setTimeout(syncMobileState,0))
  const tracked=['chatPanel','calendarPanel','supervisionPanel','parentsPanel']
  for(const id of tracked){const el=$(id);if(el&&!el.dataset.mobileShellObserved){el.dataset.mobileShellObserved='1';new MutationObserver(syncMobileState).observe(el,{attributes:true,attributeFilter:['class']})}}
  return true
}
function start(){
  if(bind())return
  const main=$('mainView');if(main)new MutationObserver(()=>{if(bind())syncMobileState()}).observe(main,{attributes:true,attributeFilter:['class']})
  let n=0;const retry=()=>{if(bind()||++n>24)return;setTimeout(retry,250)};retry()
}
start()
