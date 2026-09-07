const $=id=>document.getElementById(id)
const mq=matchMedia('(max-width:850px)')
let notifyAnchor=null,isaToolsLoaded=false

function shell(){return $('mainView')}
function who(){return String($('myName')?.textContent||'').trim().toLowerCase()}
function mainReady(){return !!shell()&&!shell().classList.contains('hidden')&&!!who()}
function syncProfileSubtitle(){const role=$('myRole');if(!role)return;if(!role.dataset.desktopText)role.dataset.desktopText=role.textContent||'';role.textContent=mq.matches?'Cantinho da Isa 💜':role.dataset.desktopText}
function ensureProfileNav(){
  if(!mainReady())return
  syncProfileSubtitle()
  const study=$('studyNav'),diary=$('diaryNav'),supervision=$('supervisionNav'),parents=$('parentsNav')
  if(who()==='isa'){
    study?.classList.remove('hidden');diary?.classList.remove('hidden');supervision?.classList.add('hidden');parents?.classList.add('hidden')
    if(!isaToolsLoaded){isaToolsLoaded=true;import('./isa-tools.js?v=5').catch(()=>{isaToolsLoaded=false})}
  }else{
    study?.classList.add('hidden');diary?.classList.add('hidden')
    if(who()==='keise'||who()==='alan'){supervision?.classList.remove('hidden');parents?.classList.remove('hidden')}
  }
}
function backBtn(){
  let b=$('mobilePanelBack')
  if(!b){b=document.createElement('button');b.id='mobilePanelBack';b.type='button';b.className='hidden';b.textContent='←';b.title='Voltar às conversas';b.setAttribute('aria-label','Voltar às conversas');shell()?.querySelector('.content')?.appendChild(b);b.addEventListener('click',showConversationList)}
  return b
}
function placeNotifyBanner(){
  const banner=$('notifyBanner');if(!banner)return
  if(!notifyAnchor&&banner.parentNode){notifyAnchor=document.createComment('notify-banner-home-v3');banner.parentNode.insertBefore(notifyAnchor,banner)}
  if(mq.matches){const side=shell()?.querySelector('.sidebar'),head=side?.querySelector('.chat-list-head');if(side&&head&&banner.parentNode!==side)side.insertBefore(banner,head)}
  else if(notifyAnchor?.parentNode&&banner.parentNode!==notifyAnchor.parentNode)notifyAnchor.parentNode.insertBefore(banner,notifyAnchor.nextSibling)
}
function showConversationList(){
  if(!mq.matches)return
  const s=shell();if(!s)return
  s.classList.remove('mobile-content-open','mobile-chat-open','mobile-panel-open');backBtn()?.classList.add('hidden')
  const chats=document.querySelector('.nav-btn[data-tab="chats"]');document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b===chats))
  requestAnimationFrame(()=>{$('chatList')?.focus?.({preventScroll:true})})
}
function showContent(kind='panel'){
  if(!mq.matches)return
  const s=shell();if(!s)return
  s.classList.add('mobile-content-open');s.classList.toggle('mobile-chat-open',kind==='chat');s.classList.toggle('mobile-panel-open',kind!=='chat');backBtn()?.classList.toggle('hidden',kind==='chat')
}
function wire(){
  ensureProfileNav()
  const list=$('chatList')
  if(list&&!list.dataset.mobileV4Bound){list.dataset.mobileV4Bound='1';list.addEventListener('click',e=>{if(mq.matches&&e.target.closest('.chat-item[data-conv]'))setTimeout(()=>showContent('chat'),25)},true)}
  const mb=$('mobileBackBtn')
  if(mb&&!mb.dataset.mobileV4Bound){mb.dataset.mobileV4Bound='1';mb.addEventListener('click',e=>{if(mq.matches){e.preventDefault();e.stopPropagation();showConversationList()}},true)}
  document.querySelectorAll('.nav-btn[data-tab]').forEach(btn=>{if(btn.dataset.mobileV4Bound)return;btn.dataset.mobileV4Bound='1';btn.addEventListener('click',()=>{if(!mq.matches)return;const tab=btn.dataset.tab;if(tab==='diary'||tab==='study')return;setTimeout(()=>tab==='chats'?showConversationList():showContent('panel'),25)},true)})
}
function sync(){
  ensureProfileNav();wire();backBtn();placeNotifyBanner();syncProfileSubtitle()
  if(!mq.matches){shell()?.classList.remove('mobile-content-open','mobile-chat-open','mobile-panel-open');backBtn()?.classList.add('hidden')}
  else if(mainReady()&&!shell().classList.contains('mobile-content-open'))showConversationList()
}

sync()
const main=$('mainView')
if(main){const obs=new MutationObserver(()=>sync());obs.observe(main,{attributes:true,attributeFilter:['class']})}
const nav=document.querySelector('.nav-tabs')
if(nav){const obs=new MutationObserver(()=>{ensureProfileNav();wire()});obs.observe(nav,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})}
window.addEventListener('resize',sync,{passive:true});mq.addEventListener?.('change',sync)
window.__ISA_MOBILE_SHOW_CONTENT__=showContent
window.__ISA_MOBILE_SHOW_CONVERSATIONS__=showConversationList
