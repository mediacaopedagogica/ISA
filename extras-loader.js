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

async function loadProfile(){
  await loadOnce('profile','./profile-mascot.js?v=2')
}

async function loadGroupTools(){
  await loadOnce('groups','./group-controls.js?v=3')
}

async function loadChatExtras(){
  await loadOnce('family-media','./family-media-menu.js?v=4')
  await loadOnce('native-media','./native-media-bridge.js?v=4')
  await loadOnce('links','./link-preview.js?v=3')
  if(isIsa())await loadOnce('isa-tools','./isa-tools.js?v=3')
}

async function loadCalendarExtras(){
  if(isIsa())await loadOnce('calendar-alarm','./calendar-alarm.js?v=3')
}

async function loadSupervisionExtras(){
  await loadOnce('external-access','./external-access-controls.js?v=10')
  await loadOnce('diary-parent','./diary-parent.js?v=3')
}

function wire(){
  if(!mainReady())return false

  loadProfile().catch(()=>{})
  loadGroupTools().catch(()=>{})

  const chatList=$('chatList')
  if(chatList&&!chatList.dataset.extraLoaderBound){
    chatList.dataset.extraLoaderBound='1'
    chatList.addEventListener('click',e=>{
      if(e.target.closest('.chat-item[data-conv]'))setTimeout(()=>loadChatExtras().catch(()=>{}),80)
    })
  }

  document.querySelector('[data-tab="chats"]')?.addEventListener('click',()=>{
    if($('chatPanel')&&!$('chatPanel').classList.contains('hidden'))loadChatExtras().catch(()=>{})
  })
  document.querySelector('[data-tab="calendar"]')?.addEventListener('click',()=>loadCalendarExtras().catch(()=>{}),{once:false})
  document.querySelector('[data-tab="supervision"]')?.addEventListener('click',()=>loadSupervisionExtras().catch(()=>{}),{once:false})

  const chat=$('chatPanel')
  if(chat&&!chat.dataset.extraLoaderObserved){
    chat.dataset.extraLoaderObserved='1'
    const obs=new MutationObserver(()=>{
      if(!chat.classList.contains('hidden')){
        loadChatExtras().catch(()=>{})
        obs.disconnect()
      }
    })
    obs.observe(chat,{attributes:true,attributeFilter:['class']})
    if(!chat.classList.contains('hidden')){
      loadChatExtras().catch(()=>{})
      obs.disconnect()
    }
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
  const retry=()=>{
    if(wire()||++tries>=20)return
    setTimeout(retry,250)
  }
  retry()
}

start()
