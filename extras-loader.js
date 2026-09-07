const $=id=>document.getElementById(id)
const loaded=new Map()

function loadOnce(key,path){
  if(loaded.has(key))return loaded.get(key)
  const p=import(path).catch(error=>{loaded.delete(key);console.warn(`Falha ao carregar ${key}:`,error);throw error})
  loaded.set(key,p)
  return p
}
function mainReady(){
  const main=$('mainView')
  return !!main&&!main.classList.contains('hidden')&&!!$('myName')?.textContent?.trim()
}
function isIsa(){return String($('myName')?.textContent||'').trim().toLowerCase()==='isa'}
function idle(fn,delay=180){
  if('requestIdleCallback'in window)requestIdleCallback(()=>fn().catch(()=>{}),{timeout:Math.max(1200,delay+700)})
  else setTimeout(()=>fn().catch(()=>{}),delay)
}
async function loadProfile(){await loadOnce('profile','./profile-mascot.js?v=2')}
async function loadGroupTools(){await loadOnce('groups','./group-controls.js?v=3')}
async function loadPausedFriends(){await loadOnce('paused-friends','./paused-friends-filter.js?v=1')}
async function loadIsaTools(){if(isIsa())await loadOnce('isa-tools','./isa-tools.js?v=5')}
async function loadCalls(){await loadOnce('calls','./call-manager.js?v=2')}
async function loadChatExtras(){
  await Promise.allSettled([
    loadOnce('family-media','./family-media-menu-v2.js?v=2'),
    loadOnce('links','./link-preview.js?v=3')
  ])
}
async function loadSupervisionExtras(){
  await Promise.allSettled([
    loadOnce('external-access','./external-access-controls.js?v=11'),
    loadOnce('diary-parent','./diary-parent.js?v=3')
  ])
}

function wire(){
  if(!mainReady())return false
  idle(loadProfile,120)
  idle(loadGroupTools,220)
  idle(loadPausedFriends,420)
  if(isIsa())idle(loadIsaTools,260)
  // Receptor precisa existir mesmo antes de abrir uma conversa para chamadas recebidas tocarem.
  idle(loadCalls,700)

  const chatList=$('chatList')
  if(chatList&&!chatList.dataset.extraLoaderV8){
    chatList.dataset.extraLoaderV8='1'
    chatList.addEventListener('click',e=>{
      if(!e.target.closest('.chat-item[data-conv]'))return
      setTimeout(()=>loadChatExtras().catch(()=>{}),120)
    })
  }
  const chats=document.querySelector('[data-tab="chats"]')
  if(chats&&!chats.dataset.extraLoaderV8){
    chats.dataset.extraLoaderV8='1'
    chats.addEventListener('click',()=>{
      if($('chatPanel')&&!$('chatPanel').classList.contains('hidden'))loadChatExtras().catch(()=>{})
    })
  }
  const supervision=document.querySelector('[data-tab="supervision"]')
  if(supervision&&!supervision.dataset.extraLoaderV8){
    supervision.dataset.extraLoaderV8='1'
    supervision.addEventListener('click',()=>loadSupervisionExtras().catch(()=>{}))
  }
  return true
}
function start(){
  if(wire())return
  const main=$('mainView')
  if(main){
    const obs=new MutationObserver(()=>{if(wire())obs.disconnect()})
    obs.observe(main,{attributes:true,attributeFilter:['class']})
  }
  let tries=0
  const retry=()=>{if(wire()||++tries>=40)return;setTimeout(retry,250)}
  retry()
}
start()
