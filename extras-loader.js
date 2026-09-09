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
function requestedProfile(){return String(new URLSearchParams(location.search).get('perfil')||'').trim().toLowerCase()}
function mainReady(){
  const main=$('mainView')
  return !!main&&!main.classList.contains('hidden')&&!!who()&&who()!=='família'
}
function isIsa(){return who()==='isa'||requestedProfile()==='isa'}
function isKeise(){return who()==='keise'||who().startsWith('keise ')||requestedProfile()==='keise'}
function isParent(){return isKeise()}
function isAlan(){return who()==='alan'||requestedProfile()==='alan'}
const dedicatedMobile=new URLSearchParams(location.search).get('mobile')==='1'

async function loadCoreExtras(){
  const jobs=[
    loadOnce('profile','./profile-mascot.js?v=4-stable'),
    loadOnce('groups','./group-controls.js?v=5-stable'),
    loadOnce('pins','./conversation-pins.js?v=5-direct-pin'),
    loadOnce('paused-friends','./paused-friends-filter.js?v=3-stable'),
    loadOnce('links','./link-preview.js?v=6-inline-video'),
    loadOnce('social-network','./social-network.js?v=3-family-feed'),
    loadOnce('social-network-bridge','./social-network-bridge-v2.js?v=3-touch-open'),
    loadOnce('games','./games-menu.js?v=6-all-profiles'),
    loadOnce('snake-game','./games-menu-snake.js?v=3-all-users')
  ]
  if(!dedicatedMobile)jobs.push(loadOnce('games-notebook-fit','./games-notebook-fit.js?v=2-all-profiles'))

  if(isKeise()){
    jobs.push(loadOnce('keise-access-settings','./keise-access-settings.js?v=1-edit-login'))
    jobs.push(loadOnce('keise-alan-studio-control','./keise-alan-studio-control.js?v=1-master-lock'))
    jobs.push(loadOnce('keise-game-test','./keise-game-test.js?v=5-persistent-menu'))
  }

  if(isAlan()){
    jobs.push(loadOnce('alan-supervision-only','./alan-supervision-only.js?v=2-no-global-observer'))
    const accessModule=await loadOnce('alan-studio-access','./alan-studio-access.js?v=1-master-lock')
    const studioEnabled=await accessModule.isAlanStudioEnabled()
    if(studioEnabled)jobs.push(loadOnce('alan-studio-launcher','./alan-studio-launcher.js?v=1-lazy-core-safe'))
  }
  if(isIsa())jobs.push(loadOnce('isa-tools','./isa-tools.js?v=9-study-fix'))
  const result=await Promise.allSettled(jobs)
  result.forEach((r,i)=>{if(r.status==='rejected')console.warn('Módulo extra não carregou',i,r.reason)})
}
async function loadSupervisionExtras(){
  if(!isParent())return
  await Promise.allSettled([loadOnce('diary-parent','./diary-parent.js?v=5-stable')])
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
  if(main){const obs=new MutationObserver(()=>{if(wire())obs.disconnect()});obs.observe(main,{attributes:true,attributeFilter:['class']})}
  let tries=0
  const retry=()=>{if(wire()||++tries>=80)return;setTimeout(retry,150)}
  retry()
}
start()