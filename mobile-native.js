const mobileParams=new URLSearchParams(location.search)
if(mobileParams.get('mobile')==='1'){
  document.body.classList.add('mobile-native-mode')
  if(!document.querySelector('link[data-mobile-native]')){
    const link=document.createElement('link');link.rel='stylesheet';link.href='./mobile-native.css?v=1';link.dataset.mobileNative='1';document.head.appendChild(link)
  }

  const $=id=>document.getElementById(id)
  const main=()=>$('mainView')
  let suppressClickUntil=0

  function ensureBack(){
    let b=$('mobileNativeBack')
    if(!b){
      b=document.createElement('button');b.id='mobileNativeBack';b.type='button';b.className='hidden';b.textContent='←';b.setAttribute('aria-label','Voltar');b.title='Voltar'
      document.body.appendChild(b)
      b.addEventListener('click',()=>showHome())
    }
    return b
  }
  function showHome(){
    const m=main();if(!m)return
    m.classList.remove('mobile-native-content')
    ensureBack().classList.add('hidden')
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab==='chats'))
  }
  function showContent(kind='panel'){
    const m=main();if(!m)return
    m.classList.add('mobile-native-content')
    const b=ensureBack();b.classList.toggle('hidden',kind==='chat')
    if(kind==='chat')setTimeout(ensureConversationActions,0)
  }
  function ensureConversationActions(){
    const panel=$('chatPanel');if(!panel||panel.classList.contains('hidden'))return
    const plus=$('groupPlusBtn');if(plus)plus.classList.remove('hidden')
    const menu=$('groupPlusMenu')
    if(menu&&!menu.querySelector('[data-group-action="poll"]')){
      const poll=document.createElement('button');poll.type='button';poll.dataset.groupAction='poll';poll.textContent='📊 Criar enquete';menu.prepend(poll)
      poll.addEventListener('click',()=>{menu.classList.add('hidden');try{window.openPollDialog?.()}catch{}})
    }
  }
  function openNav(tab,nav){
    if(tab==='chats'){showHome();return}
    if(tab==='study'||tab==='diary'){
      nav?.click();
      if(tab==='study')setTimeout(()=>showContent('panel'),120)
      return
    }
    try{window.switchTab?.(tab)}catch{}
    showContent('panel')
  }
  function openCard(card){
    const id=card?.dataset?.conv;if(!id)return
    try{
      const result=window.openChat?.(id,false)
      Promise.resolve(result).finally(()=>showContent('chat'))
    }catch{card.click();setTimeout(()=>showContent('chat'),0)}
  }

  document.addEventListener('pointerup',event=>{
    if(event.pointerType&&event.pointerType!=='touch'&&event.pointerType!=='pen')return
    const nav=event.target.closest?.('.nav-btn[data-tab]')
    if(nav){event.preventDefault();event.stopImmediatePropagation();suppressClickUntil=Date.now()+700;openNav(nav.dataset.tab,nav);return}
    const card=event.target.closest?.('#chatList .chat-item[data-conv]')
    if(card&&!event.target.closest?.('.conversation-pin-action')){event.preventDefault();event.stopImmediatePropagation();suppressClickUntil=Date.now()+700;openCard(card);return}
    const back=event.target.closest?.('#mobileBackBtn,#mobileNativeBack')
    if(back){event.preventDefault();event.stopImmediatePropagation();suppressClickUntil=Date.now()+700;if(back.id==='mobileBackBtn'){back.click()}showHome();return}
  },true)
  document.addEventListener('click',event=>{
    if(Date.now()<suppressClickUntil&&event.isTrusted&&(event.target.closest?.('.nav-btn[data-tab]')||event.target.closest?.('#chatList .chat-item[data-conv]')||event.target.closest?.('#mobileBackBtn,#mobileNativeBack'))){event.preventDefault();event.stopImmediatePropagation()}
  },true)

  const observer=new MutationObserver(()=>{
    const chat=$('chatPanel'),cal=$('calendarPanel'),sup=$('supervisionPanel'),parents=$('parentsPanel'),study=$('studyPanel')
    if(chat&&!chat.classList.contains('hidden'))showContent('chat')
    else if([cal,sup,parents,study].some(p=>p&&!p.classList.contains('hidden')))showContent('panel')
    ensureConversationActions()
  })
  function start(){
    ensureBack()
    ;['chatPanel','calendarPanel','supervisionPanel','parentsPanel','studyPanel'].forEach(id=>{const el=$(id);if(el&&!el.dataset.mobileNativeObserved){el.dataset.mobileNativeObserved='1';observer.observe(el,{attributes:true,attributeFilter:['class']})}})
    ensureConversationActions()
  }
  start();document.addEventListener('DOMContentLoaded',start,{once:true});setTimeout(start,300);setTimeout(start,1200)
  window.__ISA_MOBILE_SHOW_CONTENT__=showContent
  window.__ISA_MOBILE_NATIVE__={showHome,showContent}
}
