const $=id=>document.getElementById(id)
const mq=matchMedia('(max-width:850px)')
let notifyAnchor=null

function shell(){return $('mainView')}
function who(){return String($('myName')?.textContent||'').trim().toLowerCase()}
function mainReady(){return !!shell()&&!shell().classList.contains('hidden')&&!!who()}
function syncProfileSubtitle(){const role=$('myRole');if(!role)return;if(!role.dataset.desktopText)role.dataset.desktopText=role.textContent||'';const next=mq.matches?'Cantinho da Isa 💜':role.dataset.desktopText;if(role.textContent!==next)role.textContent=next}
function ensureProfileNav(){
  if(!mainReady())return
  syncProfileSubtitle()
  const study=$('studyNav'),diary=$('diaryNav'),supervision=$('supervisionNav'),parents=$('parentsNav')
  if(who()==='isa'){
    study?.classList.remove('hidden');diary?.classList.remove('hidden');supervision?.classList.add('hidden');parents?.classList.add('hidden')
  }else{
    study?.classList.add('hidden');diary?.classList.add('hidden')
    if(who()==='keise'||who()==='alan'){supervision?.classList.remove('hidden');parents?.classList.remove('hidden')}
  }
}
function backBtn(){
  let b=$('mobilePanelBack')
  if(!b){
    b=document.createElement('button');b.id='mobilePanelBack';b.type='button';b.className='hidden';b.textContent='←';b.title='Voltar às conversas';b.setAttribute('aria-label','Voltar às conversas')
    shell()?.querySelector('.content')?.appendChild(b)
    b.addEventListener('click',()=>showConversationList())
  }
  return b
}
function placeNotifyBanner(){
  const banner=$('notifyBanner');if(!banner)return
  if(!notifyAnchor&&banner.parentNode){notifyAnchor=document.createComment('notify-banner-home-v6');banner.parentNode.insertBefore(notifyAnchor,banner)}
  if(mq.matches){
    const side=shell()?.querySelector('.sidebar'),head=side?.querySelector('.chat-list-head')
    if(side&&head&&banner.parentNode!==side)side.insertBefore(banner,head)
  }else if(notifyAnchor?.parentNode&&banner.parentNode!==notifyAnchor.parentNode){
    notifyAnchor.parentNode.insertBefore(banner,notifyAnchor.nextSibling)
  }
}
function showConversationList(){
  if(!mq.matches)return
  const s=shell();if(!s)return
  s.classList.remove('mobile-content-open','mobile-chat-open','mobile-panel-open')
  backBtn()?.classList.add('hidden')
  const chats=document.querySelector('.nav-btn[data-tab="chats"]')
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b===chats))
  placeNotifyBanner()
  requestAnimationFrame(()=>{const list=$('chatList');if(list){list.style.removeProperty('display');list.scrollLeft=0}})
}
function showContent(kind='panel'){
  if(!mq.matches)return
  const s=shell();if(!s)return
  s.classList.add('mobile-content-open')
  s.classList.toggle('mobile-chat-open',kind==='chat')
  s.classList.toggle('mobile-panel-open',kind!=='chat')
  backBtn()?.classList.toggle('hidden',kind==='chat')
}
function wire(){
  ensureProfileNav()
  const list=$('chatList')
  if(list&&!list.dataset.mobileV6Bound){
    list.dataset.mobileV6Bound='1'
    list.addEventListener('click',e=>{if(mq.matches&&e.target.closest('.chat-item[data-conv]'))setTimeout(()=>showContent('chat'),70)})
  }
  const mb=$('mobileBackBtn')
  if(mb&&!mb.dataset.mobileV6Bound){
    mb.dataset.mobileV6Bound='1'
    mb.addEventListener('click',()=>{if(mq.matches)setTimeout(showConversationList,30)})
  }
  document.querySelectorAll('.nav-btn[data-tab]').forEach(btn=>{
    if(btn.dataset.mobileV6Bound)return
    btn.dataset.mobileV6Bound='1'
    btn.addEventListener('click',()=>{
      if(!mq.matches)return
      const tab=btn.dataset.tab
      if(tab==='diary'||tab==='study')return
      setTimeout(()=>tab==='chats'?showConversationList():showContent('panel'),70)
    })
  })
  const chat=$('chatPanel')
  if(chat&&!chat.dataset.mobileStateObserved){
    chat.dataset.mobileStateObserved='1'
    const obs=new MutationObserver(()=>{
      if(!mq.matches||!mainReady())return
      if(!chat.classList.contains('hidden'))showContent('chat')
    })
    obs.observe(chat,{attributes:true,attributeFilter:['class']})
  }
}
function sync(){
  ensureProfileNav();wire();backBtn();placeNotifyBanner();syncProfileSubtitle()
  if(!mq.matches){
    shell()?.classList.remove('mobile-content-open','mobile-chat-open','mobile-panel-open')
    backBtn()?.classList.add('hidden')
    return
  }
  if(mainReady()){
    const active=document.querySelector('.nav-btn.active[data-tab]')?.dataset.tab||'chats'
    const chatOpen=$('chatPanel')&&!$('chatPanel').classList.contains('hidden')
    if(chatOpen)showContent('chat')
    else if(active==='chats')showConversationList()
    else if(active!=='study'&&active!=='diary')showContent('panel')
  }
}

sync()
const main=$('mainView')
if(main){const obs=new MutationObserver(()=>sync());obs.observe(main,{attributes:true,attributeFilter:['class']})}
const nav=document.querySelector('.nav-tabs')
if(nav){const obs=new MutationObserver(()=>{ensureProfileNav();wire()});obs.observe(nav,{childList:true,subtree:true})}
window.addEventListener('resize',sync,{passive:true})
mq.addEventListener?.('change',sync)
window.__ISA_MOBILE_SHOW_CONTENT__=showContent
window.__ISA_MOBILE_SHOW_CONVERSATIONS__=showConversationList
