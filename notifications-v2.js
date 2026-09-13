import { CONFIG } from './config.js'
const $=id=>document.getElementById(id)
function toast(text){const t=$('toast');if(!t){alert(text);return}t.textContent=text;t.classList.remove('hidden');clearTimeout(t._nv4);t._nv4=setTimeout(()=>t.classList.add('hidden'),4200)}
function token(){try{const ref=new URL(CONFIG.SUPABASE_URL).hostname.split('.')[0],raw=localStorage.getItem(`sb-${ref}-auth-token`);if(!raw)return'';const d=JSON.parse(raw);return d?.access_token||d?.currentSession?.access_token||d?.session?.access_token||''}catch{return''}}
function jwtSub(t){try{const p=t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(atob(p.padEnd(Math.ceil(p.length/4)*4,'='))).sub||''}catch{return''}}
function vapidBytes(base64){const pad='='.repeat((4-base64.length%4)%4),s=(base64+pad).replace(/-/g,'+').replace(/_/g,'/'),raw=atob(s),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out}
async function memberId(){
  const t=token(),sub=jwtSub(t);if(!t||!sub)throw new Error('Entre novamente no Cantinho antes de ativar as notificações.')
  const r=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/family_members?select=id&auth_user_id=eq.${encodeURIComponent(sub)}&active=eq.true&limit=1`,{headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${t}`},cache:'no-store'})
  const d=await r.json();if(!r.ok||!d?.[0]?.id)throw new Error('Não foi possível identificar este perfil.');return d[0].id
}
async function readyRegistration(ms=9000){
  const ready=navigator.serviceWorker.ready
  return Promise.race([ready,new Promise((_,rej)=>setTimeout(()=>rej(new Error('O serviço de notificações demorou para iniciar. Recarregue o Cantinho e tente novamente.')),ms))])
}
async function registerSubscription(){
  if(!window.isSecureContext)throw new Error('As notificações precisam de conexão segura HTTPS.')
  if(!('serviceWorker'in navigator))throw new Error('Este navegador não oferece notificações em segundo plano.')
  if(!('PushManager'in window))throw new Error('Este navegador não oferece Push Web. Abra o Cantinho no Chrome ou Edge atualizado.')
  let reg=await navigator.serviceWorker.getRegistration()
  if(!reg)await navigator.serviceWorker.register('./sw.js?v=33',{scope:'./'})
  reg=await readyRegistration()
  if(!reg?.active)throw new Error('O serviço de notificações ainda não ficou ativo. Recarregue a página e tente novamente.')
  let sub=await reg.pushManager.getSubscription()
  if(!sub){
    try{sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:vapidBytes(CONFIG.VAPID_PUBLIC_KEY)})}
    catch(e){
      if(e?.name==='NotAllowedError')throw new Error('O navegador não autorizou o Push. Confira se Notificações está como Permitir nas configurações deste site.')
      if(e?.name==='InvalidStateError')throw new Error('O serviço de notificações ainda está iniciando. Recarregue o Cantinho e tente novamente.')
      throw e
    }
  }
  const j=sub.toJSON(),mid=await memberId(),t=token()
  if(!j.endpoint||!j.keys?.p256dh||!j.keys?.auth)throw new Error('O navegador criou uma assinatura incompleta. Atualize o navegador e tente novamente.')
  const body={member_id:mid,platform:'web',endpoint:j.endpoint,p256dh:j.keys.p256dh,auth_key:j.keys.auth,device_name:/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)?'Celular':'Computador',enabled:true,child_message_alarm:true,updated_at:new Date().toISOString()}
  const r=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/push_devices?on_conflict=member_id,endpoint`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${t}`,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(body)})
  if(!r.ok){let e=null;try{e=await r.json()}catch{};throw new Error(e?.message||'O aparelho autorizou notificações, mas não pôde ser registrado.')}
  return reg
}
async function activate(e){
  e?.preventDefault?.();e?.stopPropagation?.();e?.stopImmediatePropagation?.()
  const b=$('enableNotificationsBtn');if(!b)return
  if(!('Notification'in window)){toast('Este navegador não oferece notificações para sites. Abra no Chrome ou Edge atualizado.');return}
  b.disabled=true;b.textContent='Ativando…'
  try{
    let p=Notification.permission
    if(p!=='granted')p=await Notification.requestPermission()
    if(p==='denied')throw new Error('As notificações estão bloqueadas. Nas permissões deste site, marque Notificações como Permitir.')
    if(p!=='granted')throw new Error('A ativação das notificações foi cancelada.')
    const reg=await registerSubscription()
    localStorage.setItem('isa-notifications-enabled','1')
    $('notifyBanner')?.classList.add('hidden')
    try{await reg.showNotification('Cantinho da Isa 💜',{body:'Notificações ativadas neste aparelho.',icon:'./icon.svg',badge:'./icon.svg',tag:'isa-notifications-ready',renotify:false,data:{url:'./'}})}catch{}
    toast('Notificações ativadas neste aparelho 🔔')
  }catch(err){
    console.error('Notificações:',err)
    toast(err?.message||'Não foi possível ativar as notificações.')
    b.textContent=Notification.permission==='denied'?'Bloqueadas':'Tentar novamente'
  }finally{
    b.disabled=false
    if(b.textContent==='Ativando…')b.textContent='Ativar'
  }
}
async function reflectExisting(){
  try{
    if(!('Notification'in window)||Notification.permission!=='granted'||!('serviceWorker'in navigator))return
    const reg=await navigator.serviceWorker.getRegistration(),sub=await reg?.pushManager?.getSubscription?.()
    if(sub){localStorage.setItem('isa-notifications-enabled','1');$('notifyBanner')?.classList.add('hidden')}
  }catch{}
}
function wire(){
  const b=$('enableNotificationsBtn');if(!b||b.dataset.notifyV4)return
  b.dataset.notifyV4='1'
  b.addEventListener('click',activate,true)
  reflectExisting()
}
wire()
const main=$('mainView')
if(main){const o=new MutationObserver(()=>wire());o.observe(main,{attributes:true,attributeFilter:['class']})}
