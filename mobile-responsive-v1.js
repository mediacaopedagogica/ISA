const $=id=>document.getElementById(id)
const mq=matchMedia('(max-width:850px)')
let notifyAnchor=null

function shell(){return $('mainView')}
function backBtn(){
  let b=$('mobilePanelBack')
  if(!b){
    b=document.createElement('button')
    b.id='mobilePanelBack';b.type='button';b.className='hidden';b.textContent='←';b.title='Voltar';b.setAttribute('aria-label','Voltar')
    $('mainView')?.querySelector('.content')?.appendChild(b)
    b.addEventListener('click',showConversationList)
  }
  return b
}
function placeNotifyBanner(){
  const banner=$('notifyBanner');if(!banner)return
  if(!notifyAnchor&&banner.parentNode){notifyAnchor=document.createComment('notify-banner-home');banner.parentNode.insertBefore(notifyAnchor,banner)}
  if(mq.matches){
    const side=$('mainView')?.querySelector('.sidebar'),head=side?.querySelector('.chat-list-head')
    if(side&&head&&banner.parentNode!==side)side.insertBefore(banner,head)
  }else if(notifyAnchor?.parentNode&&banner.parentNode!==notifyAnchor.parentNode){notifyAnchor.parentNode.insertBefore(banner,notifyAnchor.nextSibling)}
}
function showConversationList(){
  if(!mq.matches)return
  const s=shell();if(!s)return
  s.classList.remove('mobile-content-open','mobile-chat-open','mobile-panel-open')
  backBtn()?.classList.add('hidden')
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab==='chats'))
}
function showContent(kind='panel'){
  if(!mq.matches)return
  const s=shell();if(!s)return
  s.classList.add('mobile-content-open')
  s.classList.toggle('mobile-chat-open',kind==='chat')
  s.classList.toggle('mobile-panel-open',kind!=='chat')
  backBtn()?.classList.toggle('hidden',kind==='chat')
}

function wireMobileNavigation(){
  const list=$('chatList')
  if(list&&!list.dataset.mobileResponsiveBound){
    list.dataset.mobileResponsiveBound='1'
    list.addEventListener('click',e=>{
      if(!mq.matches)return
      if(e.target.closest('.chat-item[data-conv]'))setTimeout(()=>showContent('chat'),40)
    },true)
  }
  const mb=$('mobileBackBtn')
  if(mb&&!mb.dataset.mobileResponsiveBound){
    mb.dataset.mobileResponsiveBound='1';mb.addEventListener('click',e=>{if(mq.matches){e.preventDefault();showConversationList()}},true)
  }
  document.querySelectorAll('.nav-btn[data-tab]').forEach(btn=>{
    if(btn.dataset.mobileResponsiveBound)return
    btn.dataset.mobileResponsiveBound='1'
    btn.addEventListener('click',()=>{
      if(!mq.matches)return
      const tab=btn.dataset.tab
      setTimeout(()=>tab==='chats'?showConversationList():showContent('panel'),30)
    },true)
  })
}

function toast(text){
  const t=$('toast');if(!t){alert(text);return}
  t.textContent=text;t.classList.remove('hidden');clearTimeout(t._mobile);t._mobile=setTimeout(()=>t.classList.add('hidden'),3200)
}
async function activateNotifications(ev){
  const btn=ev.currentTarget
  ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation()
  if(!('Notification' in window)){toast('Este navegador não oferece notificações.');return}
  btn.disabled=true;btn.textContent='Ativando…'
  try{
    let permission=Notification.permission
    if(permission==='default')permission=await Notification.requestPermission()
    if(permission==='granted'){
      localStorage.setItem('isa-notifications-enabled','1')
      $('notifyBanner')?.classList.add('hidden')
      try{
        if('serviceWorker' in navigator){
          const reg=await Promise.race([navigator.serviceWorker.ready,new Promise((_,rej)=>setTimeout(()=>rej(new Error('sw-timeout')),2500))])
          await reg.showNotification('Cantinho da Isa 💜',{body:'Notificações ativadas neste aparelho.',icon:'./icon.svg',badge:'./icon.svg',tag:'isa-notification-test',renotify:false})
        }else new Notification('Cantinho da Isa 💜',{body:'Notificações ativadas neste aparelho.'})
      }catch{}
      toast('Notificações ativadas neste aparelho 💜')
    }else if(permission==='denied'){
      toast('As notificações estão bloqueadas no navegador. Libere nas permissões deste site.')
      btn.textContent='Bloqueadas'
    }else{
      toast('A ativação das notificações foi cancelada.')
      btn.textContent='Ativar'
    }
  }catch(e){
    console.warn('Falha ao ativar notificações:',e)
    toast('Não foi possível ativar as notificações neste aparelho.')
    btn.textContent='Ativar'
  }finally{btn.disabled=false}
}
function wireNotifications(){
  const b=$('enableNotificationsBtn');if(!b||b.dataset.mobileNotifyBound)return
  b.dataset.mobileNotifyBound='1'
  b.addEventListener('click',activateNotifications,true)
  if('Notification' in window&&Notification.permission==='granted')$('notifyBanner')?.classList.add('hidden')
}

function sync(){
  wireMobileNavigation();wireNotifications();backBtn();placeNotifyBanner()
  if(!mq.matches){shell()?.classList.remove('mobile-content-open','mobile-chat-open','mobile-panel-open');backBtn()?.classList.add('hidden')}
}

sync()
const main=$('mainView')
if(main){const obs=new MutationObserver(()=>sync());obs.observe(main,{attributes:true,attributeFilter:['class']})}
window.addEventListener('resize',sync,{passive:true})
mq.addEventListener?.('change',sync)