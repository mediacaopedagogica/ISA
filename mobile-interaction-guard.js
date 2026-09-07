const mobileMQ=matchMedia('(max-width:850px)')
const $m=id=>document.getElementById(id)

function mobileMain(){return $m('mainView')}
function mobileReady(){const m=mobileMain();return !!m&&!m.classList.contains('hidden')}

function ensurePanelBack(){
  let b=$m('mobilePanelBack')
  if(!b){
    b=document.createElement('button')
    b.id='mobilePanelBack'
    b.type='button'
    b.textContent='←'
    b.title='Voltar às conversas'
    b.setAttribute('aria-label','Voltar às conversas')
    b.className='hidden'
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
  const m=mobileMain();m.classList.add('mobile-content-open')
  m.classList.toggle('mobile-chat-open',kind==='chat')
  m.classList.toggle('mobile-panel-open',kind!=='chat')
  const back=ensurePanelBack();if(back)back.classList.toggle('hidden',kind==='chat')
}

// Delegação em capture: funciona mesmo quando a lista de conversas é recriada pelo app.
document.addEventListener('click',event=>{
  if(!mobileMQ.matches||!mobileReady())return
  const nav=event.target.closest('.nav-btn[data-tab]')
  if(nav){
    const tab=nav.dataset.tab
    if(tab==='chats')setTimeout(showMobileList,0)
    else if(tab!=='study'&&tab!=='diary')setTimeout(()=>showMobileContent('panel'),0)
  }
  const card=event.target.closest('#chatList .chat-item[data-conv]')
  if(card)setTimeout(()=>showMobileContent('chat'),0)
  const back=event.target.closest('#mobileBackBtn,#mobilePanelBack')
  if(back)setTimeout(showMobileList,0)
},true)

// Segurança extra para Android: se o núcleo abriu um painel, mostra a área de conteúdo.
const contentObserver=new MutationObserver(()=>{
  if(!mobileMQ.matches||!mobileReady())return
  const chat=$m('chatPanel')
  const calendar=$m('calendarPanel')
  const supervision=$m('supervisionPanel')
  const parents=$m('parentsPanel')
  if(chat&&!chat.classList.contains('hidden'))showMobileContent('chat')
  else if([calendar,supervision,parents].some(p=>p&&!p.classList.contains('hidden')))showMobileContent('panel')
})
;['chatPanel','calendarPanel','supervisionPanel','parentsPanel'].forEach(id=>{const el=$m(id);if(el)contentObserver.observe(el,{attributes:true,attributeFilter:['class']})})

ensurePanelBack()?.addEventListener('click',showMobileList)
window.__ISA_MOBILE_GUARD__={showMobileList,showMobileContent}
