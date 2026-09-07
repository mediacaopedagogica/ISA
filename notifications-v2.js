import { CONFIG } from './config.js'
const $=id=>document.getElementById(id)

function toast(text){const t=$('toast');if(!t){alert(text);return}t.textContent=text;t.classList.remove('hidden');clearTimeout(t._nv2);t._nv2=setTimeout(()=>t.classList.add('hidden'),3500)}
function token(){
  try{
    const ref=new URL(CONFIG.SUPABASE_URL).hostname.split('.')[0]
    const raw=localStorage.getItem(`sb-${ref}-auth-token`);if(!raw)return''
    const d=JSON.parse(raw);return d?.access_token||d?.currentSession?.access_token||d?.session?.access_token||''
  }catch{return''}
}
function jwtSub(t){try{const p=t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(atob(p.padEnd(Math.ceil(p.length/4)*4,'='))).sub||''}catch{return''}}
function vapidBytes(base64){const pad='='.repeat((4-base64.length%4)%4),s=(base64+pad).replace(/-/g,'+').replace(/_/g,'/'),raw=atob(s),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out}
async function memberId(){
  const t=token(),sub=jwtSub(t);if(!t||!sub)throw new Error('Entre novamente no Cantinho antes de ativar as notificações.')
  const r=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/family_members?select=id&auth_user_id=eq.${encodeURIComponent(sub)}&active=eq.true&limit=1`,{headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${t}`},cache:'no-store'})
  const d=await r.json();if(!r.ok||!d?.[0]?.id)throw new Error('Não foi possível identificar este perfil.');return d[0].id
}
async function registerSubscription(){
  if(!('serviceWorker'in navigator))throw new Error('Este navegador não oferece notificações em segundo plano.')
  if(!('PushManager'in window))throw new Error('Este navegador não oferece Push. Tente Chrome ou Edge atualizado.')
  let reg=await navigator.serviceWorker.getRegistration('./')
  if(!reg)reg=await navigator.serviceWorker.register('./sw.js?v=31',{scope:'./'})
  await navigator.serviceWorker.ready
  let sub=await reg.pushManager.getSubscription()
  if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:vapidBytes(CONFIG.VAPID_PUBLIC_KEY)})
  const j=sub.toJSON(),mid=await memberId(),t=token()
  const body={member_id:mid,platform:'web',endpoint:j.endpoint,p256dh:j.keys?.p256dh||'',auth_key:j.keys?.auth||'',device_name:/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)?'Celular':'Computador',enabled:true,child_message_alarm:true,updated_at:new Date().toISOString()}
  const url=`${CONFIG.SUPABASE_URL}/rest/v1/push_devices?on_conflict=member_id,endpoint`
  const r=await fetch(url,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${t}`,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(body)})
  if(!r.ok){let e=null;try{e=await r.json()}catch{};throw new Error(e?.message||'O aparelho não pôde ser registrado para Push.')}
  return reg
}
async function activate(e){
  e?.preventDefault?.();e?.stopPropagation?.();e?.stopImmediatePropagation?.()
  const b=$('enableNotificationsBtn');if(!b)return
  if(!('Notification'in window)){toast('Este navegador não oferece notificações.');return}
  b.disabled=true;b.textContent='Ativando…'
  try{
    let p=Notification.permission
    if(p==='default')p=await Notification.requestPermission()
    if(p==='denied')throw new Error('As notificações estão bloqueadas. Abra as permissões deste site e marque Notificações como Permitir.')
    if(p!=='granted')throw new Error('A ativação das notificações foi cancelada.')
    const reg=await registerSubscription()
    localStorage.setItem('isa-notifications-enabled','1')
    $('notifyBanner')?.classList.add('hidden')
    try{await reg.showNotification('Cantinho da Isa 💜',{body:'Notificações ativadas neste aparelho.',icon:'./icon.svg',badge:'./icon.svg',tag:'isa-notifications-ready'})}catch{}
    toast('Notificações ativadas neste aparelho 🔔')
  }catch(err){
    console.error('Notificações:',err)
    toast(err?.message||'Não foi possível ativar as notificações.')
    b.textContent=Notification.permission==='denied'?'Bloqueadas':'Ativar'
  }finally{b.disabled=false;if(b.textContent==='Ativando…')b.textContent='Ativar'}
}
function wire(){
  const b=$('enableNotificationsBtn');if(!b||b.dataset.notifyV2)return
  b.dataset.notifyV2='1';b.addEventListener('click',activate,true)
  if('Notification'in window&&Notification.permission==='granted'&&localStorage.getItem('isa-notifications-enabled')==='1')$('notifyBanner')?.classList.add('hidden')
}
wire()
const main=$('mainView');if(main){const o=new MutationObserver(wire);o.observe(main,{attributes:true,attributeFilter:['class']})}
