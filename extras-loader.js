const $=id=>document.getElementById(id)
const loaded=new Map()
let wired=false

function loadOnce(key,path){
  if(loaded.has(key))return loaded.get(key)
  const p=import(path).catch(error=>{loaded.delete(key);console.warn(`Falha ao carregar ${key}:`,error);throw error})
  loaded.set(key,p)
  return p
}
function who(){return String($('myName')?.textContent||'').trim().toLowerCase()}
function mainReady(){
  const main=$('mainView')
  return !!main&&!main.classList.contains('hidden')&&!!who()&&who()!=='família'
}
function isIsa(){return who()==='isa'}
function isParent(){return who()==='keise'||who()==='alan'}
function isAlan(){return who()==='alan'}
const dedicatedMobile=new URLSearchParams(location.search).get('mobile')==='1'

async function loadCoreExtras(){
  const jobs=[
    loadOnce('profile','./profile-mascot.js?v=4-stable'),
    loadOnce('groups','./group-controls.js?v=5-stable'),
    loadOnce('pins','./conversation-pins.js?v=5-direct-pin'),
    loadOnce('paused-friends','./paused-friends-filter.js?v=3-stable'),
    loadOnce('family-media','./family-media-menu-v2.js?v=9-audio-day'),
    loadOnce('links','./link-preview.js?v=6-inline-video')
  ]
  if(!dedicatedMobile)jobs.push(loadOnce('calls','./call-manager.js?v=4-stable'))
  if(isAlan()){
    jobs.push(loadOnce('alan-studio','./alan-studio.js?v=1'))
    jobs.push(loadOnce('alan-score','./alan-studio-score.js?v=1-clean-studio'))
    jobs.push(loadOnce('alan-band-management','./alan-band-management.js?v=1-edital'))
    jobs.push(loadOnce('alan-band-operations','./alan-band-operations.js?v=1-production'))
  }
  if(isIsa()){
    jobs.push(loadOnce('isa-tools','./isa-tools.js?v=9-study-fix'))
    jobs.push(loadOnce('games','./games-menu.js?v=3-mobile-games'))
    jobs.push(loadOnce('snake-game','./games-menu-snake.js?v=1'))
    jobs.push(loadOnce('farm-game','./games-menu-farm.js?v=13-stable-roofs'))
    if(!dedicatedMobile)jobs.push(loadOnce('games-notebook-fit','./games-notebook-fit.js?v=1'))
  }
  const result=await Promise.allSettled(jobs)
  result.forEach((r,i)=>{if(r.status==='rejected')console.warn('Módulo extra não carregou',i,r.reason)})
}
async function loadSupervisionExtras(){
  if(!isParent())return
  await Promise.allSettled([
    loadOnce('diary-parent','./diary-parent.js?v=5-stable')
  ])
}
function wire(){
  if(wired||!mainReady())return false
  wired=true
  loadCoreExtras().then(()=>{window.__ISA_FEATURES_READY__=true}).catch(console.error)
  const supervision=document.querySelector('[data-tab="supervision"]')
  if(supervision&&!supervision.dataset.extraLoaderStable){
    supervision.dataset.extraLoaderStable='1'
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
  const retry=()=>{if(wire()||++tries>=80)return;setTimeout(retry,150)}
  retry()
}
start()