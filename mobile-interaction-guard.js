if(new URLSearchParams(location.search).get('mobile')==='1'){
  const $m=id=>document.getElementById(id)
  document.body.classList.add('mobile-native-mode')
  if(!document.querySelector('link[data-mobile-native-early]')){
    const l=document.createElement('link')
    l.rel='stylesheet';l.href='./mobile-native.css?v=2-early';l.dataset.mobileNativeEarly='1'
    document.head.appendChild(l)
  }
  function syncDedicated(){
    const main=$m('mainView');if(!main)return
    const visible=el=>!!el&&!el.classList.contains('hidden')
    const chat=$m('chatPanel'),calendar=$m('calendarPanel'),supervision=$m('supervisionPanel'),parents=$m('parentsPanel'),study=$m('studyPanel')
    const anyPanel=[chat,calendar,supervision,parents,study].some(visible)
    main.classList.toggle('mobile-native-content',anyPanel)
    if(!anyPanel){
      const list=$m('chatList');if(list){list.style.removeProperty('display');list.style.removeProperty('pointer-events')}
    }
  }
  const observer=new MutationObserver(syncDedicated)
  function startDedicated(){
    ;['chatPanel','calendarPanel','supervisionPanel','parentsPanel','studyPanel'].forEach(id=>{
      const el=$m(id)
      if(el&&!el.dataset.mobileEarlyObserved){
        el.dataset.mobileEarlyObserved='1'
        observer.observe(el,{attributes:true,attributeFilter:['class']})
      }
    })
    syncDedicated()
  }
  startDedicated();document.addEventListener('DOMContentLoaded',startDedicated,{once:true});setTimeout(startDedicated,150);setTimeout(startDedicated,700)
  window.__ISA_MOBILE_GUARD__={dedicated:true,syncDedicated}
}else{
const mobileMQ=matchMedia('(max-width:850px)')
const $m=id=>document.getElementById(id)
let suppressTrustedClickUntil=0

function mobileMain(){return $m('mainView')}
function mobileReady(){const m=mobileMain();return !!m&&!m.classList.contains('hidden')}

function ensureTouchCss(){
  if(document.querySelector('style[data-mobile-touch-fix]'))return
  const s=document.createElement('style')
  s.dataset.mobileTouchFix='1'
  s.textContent='@media(max-width:850px){#mainView .profile-mini,#mainView .nav-tabs,#mainView .chat-list-head,#mainView .chat-list{position:relative!important;z-index:5!important;pointer-events:auto!important}#mainView button,#mainView [role="button"],#mainView .chat-item{pointer-events:auto!important;touch-action:manipulation!important;-webkit-tap-highlight-color:rgba(160,120,220,.12)}}'
  document.head.appendChild(s)
}

function ensurePanelBack(){
  let b=$m('mobilePanelBack')
  if(!b){
    b=document.createElement('button')
    b.id='mobilePanelBack';b.type='button';b.textContent='←';b.title='Voltar às conversas';b.setAttribute('aria-label','Voltar às conversas');b.className='hidden'
    mobileMain()?.querySelector('.content')?.appendChild(b)
  }
  return b
}

function showMobileList(){
  if(!mobileMQ.matches||!mobileReady())return
  const m=mobileMain();m.classList.remove('mobile-content-open','mobile-chat-open','mobile-panel-open')
  ensurePanelBack()?.classList.add('hidden')
  const list=$m('chatList');if(list){list.style.removeProperty('display');list.style.removeProperty('pointer-events')}
}

function showMobileContent(kind='panel'){
  if(!mobileMQ.matches||!mobileReady())return
  const m=mobileMain();m.classList.add('mobile-content-open');m.classList.toggle('mobile-chat-open',kind==='chat');m.classList.toggle('mobile-panel-open',kind!=='chat')
  const back=ensurePanelBack();if(back)back.classList.toggle('hidden',kind==='chat')
}

function syncAfterClick(event){
  if(!mobileMQ.matches||!mobileReady())return
  const nav=event.target.closest?.('.nav-btn[data-tab]')
  if(nav){const tab=nav.dataset.tab;if(tab==='chats')setTimeout(showMobileList,0);else if(tab!=='study'&&tab!=='diary')setTimeout(()=>showMobileContent('panel'),0)}
  const card=event.target.closest?.('#chatList .chat-item[data-conv]')
  if(card&&!event.target.closest?.('.conversation-pin-action'))setTimeout(()=>showMobileContent('chat'),0)
  if(event.target.closest?.('#mobileBackBtn,#mobilePanelBack'))setTimeout(showMobileList,0)
}

document.addEventListener('click',event=>{
  if(Date.now()<suppressTrustedClickUntil&&event.isTrusted){event.preventDefault();event.stopImmediatePropagation();return}
  syncAfterClick(event)
},true)

document.addEventListener('touchend',event=>{
  if(!mobileMQ.matches||!mobileReady())return
  const action=event.target.closest?.('#mainView button,#mainView [role="button"]')
  if(!action||action.disabled)return
  event.preventDefault()
  suppressTrustedClickUntil=Date.now()+650
  action.click()
},{capture:true,passive:false})

const contentObserver=new MutationObserver(()=>{
  if(!mobileMQ.matches||!mobileReady())return
  const chat=$m('chatPanel'),calendar=$m('calendarPanel'),supervision=$m('supervisionPanel'),parents=$m('parentsPanel')
  if(chat&&!chat.classList.contains('hidden'))showMobileContent('chat')
  else if([calendar,supervision,parents].some(p=>p&&!p.classList.contains('hidden')))showMobileContent('panel')
})

function startMobileGuard(){
  ensureTouchCss();ensurePanelBack()
  ;['chatPanel','calendarPanel','supervisionPanel','parentsPanel'].forEach(id=>{const el=$m(id);if(el&&!el.dataset.mobileGuardObserved){el.dataset.mobileGuardObserved='1';contentObserver.observe(el,{attributes:true,attributeFilter:['class']})}})
}
startMobileGuard();document.addEventListener('DOMContentLoaded',startMobileGuard,{once:true});setTimeout(startMobileGuard,250)
window.__ISA_MOBILE_GUARD__={showMobileList,showMobileContent}
}
