const $=id=>document.getElementById(id)
const mq=matchMedia('(max-width:850px)')
let notifyAnchor=null

function shell(){return $('mainView')}
function backBtn(){
  let b=$('mobilePanelBack')
  if(!b){
    b=document.createElement('button')
    b.id='mobilePanelBack';b.type='button';b.className='hidden';b.textContent='←';b.title='Voltar às conversas';b.setAttribute('aria-label','Voltar às conversas')
    $('mainView')?.querySelector('.content')?.appendChild(b)
    b.addEventListener('click',showConversationList)
  }
  return b
}
function placeNotifyBanner(){
  const banner=$('notifyBanner');if(!banner)return
  if(!notifyAnchor&&banner.parentNode){notifyAnchor=document.createComment('notify-banner-home-v2');banner.parentNode.insertBefore(notifyAnchor,banner)}
  if(mq.matches){
    const side=shell()?.querySelector('.sidebar'),head=side?.querySelector('.chat-list-head')
    if(side&&head&&banner.parentNode!==side)side.insertBefore(banner,head)
  }else if(notifyAnchor?.parentNode&&banner.parentNode!==notifyAnchor.parentNode){notifyAnchor.parentNode.insertBefore(banner,notifyAnchor.nextSibling)}
}
function showConversationList(){
  if(!mq.matches)return
  const s=shell();if(!s)return
  s.classList.remove('mobile-content-open','mobile-chat-open','mobile-panel-open')
  backBtn()?.classList.add('hidden')
  const chats=document.querySelector('.nav-btn[data-tab="chats"]')
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b===chats))
  requestAnimationFrame(()=>{$('chatList')?.scrollTo({top:$('chatList')?.scrollTop||0})})
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
  const list=$('chatList')
  if(list&&!list.dataset.mobileV2Bound){
    list.dataset.mobileV2Bound='1'
    list.addEventListener('click',e=>{if(mq.matches&&e.target.closest('.chat-item[data-conv]'))setTimeout(()=>showContent('chat'),25)},true)
  }
  const mb=$('mobileBackBtn')
  if(mb&&!mb.dataset.mobileV2Bound){mb.dataset.mobileV2Bound='1';mb.addEventListener('click',e=>{if(mq.matches){e.preventDefault();e.stopPropagation();showConversationList()}},true)}
  document.querySelectorAll('.nav-btn[data-tab]').forEach(btn=>{
    if(btn.dataset.mobileV2Bound)return
    btn.dataset.mobileV2Bound='1'
    btn.addEventListener('click',()=>{
      if(!mq.matches)return
      const tab=btn.dataset.tab
      if(tab==='diary')return
      setTimeout(()=>tab==='chats'?showConversationList():showContent('panel'),20)
    },true)
  })
}
function sync(){
  wire();backBtn();placeNotifyBanner()
  if(!mq.matches){shell()?.classList.remove('mobile-content-open','mobile-chat-open','mobile-panel-open');backBtn()?.classList.add('hidden')}
}

sync()
const main=$('mainView')
if(main){const obs=new MutationObserver(()=>sync());obs.observe(main,{attributes:true,attributeFilter:['class']})}
const nav=document.querySelector('.nav-tabs')
if(nav){const obs=new MutationObserver(()=>wire());obs.observe(nav,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})}
window.addEventListener('resize',sync,{passive:true})
mq.addEventListener?.('change',sync)
window.__ISA_MOBILE_SHOW_CONTENT__=showContent
window.__ISA_MOBILE_SHOW_CONVERSATIONS__=showConversationList
