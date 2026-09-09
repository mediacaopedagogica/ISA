const mobileParams=new URLSearchParams(location.search)
if(mobileParams.get('mobile')==='1'){
  document.body.classList.add('mobile-native-mode')
  if(!document.querySelector('link[data-mobile-native]')){
    const link=document.createElement('link');link.rel='stylesheet';link.href='./mobile-native.css?v=1';link.dataset.mobileNative='1';document.head.appendChild(link)
  }

  const $=id=>document.getElementById(id)
  const main=()=>$('mainView')

  function ensureBack(){
    let b=$('mobileNativeBack')
    if(!b){
      b=document.createElement('button')
      b.id='mobileNativeBack';b.type='button';b.className='hidden';b.textContent='←';b.setAttribute('aria-label','Voltar');b.title='Voltar'
      document.body.appendChild(b)
      b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();showHome()})
    }
    return b
  }

  function showHome(){
    const m=main();if(!m)return
    m.classList.remove('mobile-native-content')
    ensureBack().classList.add('hidden')
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab==='chats'))
    const list=$('chatList')
    if(list){list.style.removeProperty('display');list.style.removeProperty('pointer-events')}
  }

  function showContent(kind='panel'){
    const m=main();if(!m)return
    m.classList.add('mobile-native-content')
    ensureBack().classList.toggle('hidden',kind==='chat')
    if(kind==='chat')setTimeout(ensureConversationActions,0)
  }

  function visible(el){return !!el&&!el.classList.contains('hidden')}

  function syncFromPanels(){
    const chat=$('chatPanel'),cal=$('calendarPanel'),sup=$('supervisionPanel'),parents=$('parentsPanel'),study=$('studyPanel')
    if(visible(chat)){showContent('chat');return true}
    if([cal,sup,parents,study].some(visible)){showContent('panel');return true}
    return false
  }

  function syncSoon(){
    setTimeout(syncFromPanels,0)
    setTimeout(syncFromPanels,80)
    setTimeout(syncFromPanels,220)
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

  // IMPORTANTE: no mobile dedicado nunca bloqueamos o clique original do app.
  // O núcleo é quem abre conversa/calendário/supervisão. Esta camada apenas troca a tela
  // depois que um painel realmente ficou visível. Assim um toque nunca gera tela vazia.
  document.addEventListener('click',event=>{
    const back=event.target.closest?.('#mobileBackBtn')
    if(back){setTimeout(showHome,0);setTimeout(showHome,90);return}

    const ownBack=event.target.closest?.('#mobileNativeBack')
    if(ownBack)return

    const nav=event.target.closest?.('.nav-btn[data-tab]')
    if(nav){
      if(nav.dataset.tab==='chats'){setTimeout(showHome,0);return}
      syncSoon();return
    }

    const card=event.target.closest?.('#chatList .chat-item[data-conv]')
    if(card&&!event.target.closest?.('.conversation-pin-action')){syncSoon();return}
  },true)

  // Também observa o estado real dos painéis. Não esconde a lista até algum conteúdo existir.
  const observer=new MutationObserver(()=>{syncFromPanels();ensureConversationActions()})

  function start(){
    ensureBack()
    ;['chatPanel','calendarPanel','supervisionPanel','parentsPanel','studyPanel'].forEach(id=>{
      const el=$(id)
      if(el&&!el.dataset.mobileNativeObserved){
        el.dataset.mobileNativeObserved='1'
        observer.observe(el,{attributes:true,attributeFilter:['class']})
      }
    })
    ensureConversationActions()
  }

  start();document.addEventListener('DOMContentLoaded',start,{once:true});setTimeout(start,300);setTimeout(start,1200)
  window.__ISA_MOBILE_SHOW_CONTENT__=showContent
  window.__ISA_MOBILE_NATIVE__={showHome,showContent,syncFromPanels}
}
