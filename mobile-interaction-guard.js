const waitSettings=ms=>new Promise(r=>setTimeout(r,ms))

// Entrada de Configurações garantida em todos os acessos pessoais (?perfil=Alan, Isa, Keise etc.).
function ensureGlobalSettingsEntry(){
  const nav=document.querySelector('.nav-tabs')
  if(!nav)return null
  let btn=document.getElementById('settingsMenuBtn')
  if(!btn){
    btn=document.createElement('button')
    btn.id='settingsMenuBtn'
    btn.className='nav-btn'
    btn.type='button'
    btn.innerHTML='⚙️ <span>Configurações</span>'
    btn.title='Configurações Gerais'
    btn.setAttribute('aria-label','Configurações Gerais')
    const calendar=nav.querySelector('[data-tab="calendar"]')
    if(calendar)calendar.insertAdjacentElement('afterend',btn)
    else nav.appendChild(btn)
  }
  btn.classList.remove('hidden')
  btn.style.removeProperty('display')
  if(btn.dataset.settingsEntryGuardBound!=='1'){
    btn.dataset.settingsEntryGuardBound='1'
    btn.dataset.generalSettingsBound='1'
    btn.addEventListener('click',async e=>{
      e.preventDefault();e.stopPropagation()
      if(typeof window.__ISA_OPEN_GENERAL_SETTINGS__==='function'){
        window.__ISA_OPEN_GENERAL_SETTINGS__();return
      }
      try{
        await import('./general-settings.js?v=8-native-tap')
        for(let i=0;i<16;i++){
          if(typeof window.__ISA_OPEN_GENERAL_SETTINGS__==='function'){
            window.__ISA_OPEN_GENERAL_SETTINGS__();return
          }
          await waitSettings(90)
        }
      }catch(error){console.warn('Configurações não abriram:',error)}
    },true)
  }
  return btn
}

function startSettingsEntry(){
  ensureGlobalSettingsEntry()
  let tries=0
  const timer=setInterval(()=>{
    ensureGlobalSettingsEntry()
    if(++tries>=24)clearInterval(timer)
  },300)
}
startSettingsEntry()
document.addEventListener('DOMContentLoaded',startSettingsEntry,{once:true})

if(new URLSearchParams(location.search).get('mobile')==='1'){
  const $m=id=>document.getElementById(id)
  document.body.classList.add('mobile-native-mode')
  if(!document.querySelector('link[data-mobile-native-early]')){
    const l=document.createElement('link')
    l.rel='stylesheet';l.href='./mobile-native.css?v=3-native-tap';l.dataset.mobileNativeEarly='1'
    document.head.appendChild(l)
  }
  function syncDedicated(){
    ensureGlobalSettingsEntry()
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
    ensureGlobalSettingsEntry()
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

  function mobileMain(){return $m('mainView')}
  function mobileReady(){const m=mobileMain();return !!m&&!m.classList.contains('hidden')}

  function ensureTouchCss(){
    if(document.querySelector('style[data-mobile-touch-fix]'))return
    const s=document.createElement('style')
    s.dataset.mobileTouchFix='1'
    s.textContent='@media(max-width:850px){html,body{touch-action:manipulation}#mainView,#mainView>.sidebar,#mainView>.content,#mainView .profile-mini,#mainView .nav-tabs,#mainView .chat-list-head,#mainView .chat-list{pointer-events:auto!important}#mainView .profile-mini,#mainView .nav-tabs,#mainView .chat-list-head,#mainView .chat-list{position:relative!important;z-index:5!important}#mainView button,#mainView [role="button"],#mainView .chat-item{pointer-events:auto!important;touch-action:manipulation!important;-webkit-tap-highlight-color:rgba(160,120,220,.12)}#toast{pointer-events:none!important}.hidden{pointer-events:none}}'
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

  // IMPORTANTE: não interceptamos touchend e não fabricamos .click().
  // iOS/Android executam o clique nativo; isso preserva Sair, conversas, arquivos e botões que exigem gesto real.
  function syncAfterClick(event){
    if(!mobileMQ.matches||!mobileReady())return
    const nav=event.target.closest?.('.nav-btn[data-tab]')
    if(nav){const tab=nav.dataset.tab;if(tab==='chats')setTimeout(showMobileList,0);else if(tab!=='study'&&tab!=='diary')setTimeout(()=>showMobileContent('panel'),0)}
    const card=event.target.closest?.('#chatList .chat-item[data-conv]')
    if(card&&!event.target.closest?.('.conversation-pin-action'))setTimeout(()=>showMobileContent('chat'),0)
    if(event.target.closest?.('#mobileBackBtn,#mobilePanelBack'))setTimeout(showMobileList,0)
  }
  document.addEventListener('click',syncAfterClick,false)

  const contentObserver=new MutationObserver(()=>{
    ensureGlobalSettingsEntry()
    if(!mobileMQ.matches||!mobileReady())return
    const chat=$m('chatPanel'),calendar=$m('calendarPanel'),supervision=$m('supervisionPanel'),parents=$m('parentsPanel')
    if(chat&&!chat.classList.contains('hidden'))showMobileContent('chat')
    else if([calendar,supervision,parents].some(p=>p&&!p.classList.contains('hidden')))showMobileContent('panel')
  })

  function startMobileGuard(){
    ensureGlobalSettingsEntry();ensureTouchCss();ensurePanelBack()
    ;['chatPanel','calendarPanel','supervisionPanel','parentsPanel'].forEach(id=>{const el=$m(id);if(el&&!el.dataset.mobileGuardObserved){el.dataset.mobileGuardObserved='1';contentObserver.observe(el,{attributes:true,attributeFilter:['class']})}})
    // Defesa contra estilos antigos que tenham deixado a lista sem clique.
    if(mobileMQ.matches&&mobileReady()&&!mobileMain().classList.contains('mobile-content-open'))showMobileList()
  }
  startMobileGuard();document.addEventListener('DOMContentLoaded',startMobileGuard,{once:true});setTimeout(startMobileGuard,250);setTimeout(startMobileGuard,1200)
  window.__ISA_MOBILE_GUARD__={showMobileList,showMobileContent}
}
