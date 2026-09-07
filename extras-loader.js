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
function idle(fn,delay=180){
  if('requestIdleCallback'in window)requestIdleCallback(()=>fn().catch(()=>{}),{timeout:1200})
  else setTimeout(()=>fn().catch(()=>{}),delay)
}
async function loadProfile(){await loadOnce('profile','./profile-mascot.js?v=2')}
async function loadGroupTools(){await loadOnce('groups','./group-controls.js?v=3')}
async function loadChatExtras(){
  await Promise.allSettled([
    loadOnce('family-media','./family-media-menu-v2.js?v=2'),
    loadOnce('links','./link-preview.js?v=3')
  ])
}
async function loadCalls(){await loadOnce('calls','./call-manager.js?v=2')}
async function loadSupervisionExtras(){await loadOnce('diary-parent','./diary-parent.js?v=3')}

function wire(){
  if(!mainReady())return false
  idle(loadProfile,140)
  idle(loadGroupTools,240)

  const chatList=$('chatList')
  if(chatList&&!chatList.dataset.extraLoaderV9){
    chatList.dataset.extraLoaderV9='1'
    chatList.addEventListener('click',e=>{
      if(!e.target.closest('.chat-item[data-conv]'))return
      setTimeout(()=>loadChatExtras().catch(()=>{}),130)
      setTimeout(()=>loadCalls().catch(()=>{}),1000)
    })
  }
  const chats=document.querySelector('[data-tab="chats"]')
  if(chats&&!chats.dataset.extraLoaderV9){
    chats.dataset.extraLoaderV9='1'
    chats.addEventListener('click',()=>{
      if($('chatPanel')&&!$('chatPanel').classList.contains('hidden'))loadChatExtras().catch(()=>{})
    })
  }
  const supervision=document.querySelector('[data-tab="supervision"]')
  if(supervision&&!supervision.dataset.extraLoaderV9){
    supervision.dataset.extraLoaderV9='1'
    supervision.addEventListener('click',()=>loadSupervisionExtras().catch(()=>{}))
  }
  return true
}
function start(){
  if(wire())return
  const main=$('mainView')
  if(main){const obs=new MutationObserver(()=>{if(wire())obs.disconnect()});obs.observe(main,{attributes:true,attributeFilter:['class']})}
  let tries=0
  const retry=()=>{if(wire()||++tries>=40)return;setTimeout(retry,250)}
  retry()
}
start()
