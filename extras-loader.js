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
function mainReady(){const main=$('mainView');return !!main&&!main.classList.contains('hidden')&&!!who()&&who()!=='família'}
function isIsa(){return who()==='isa'||requestedProfile()==='isa'}
function isKeise(){return who()==='keise'||who().startsWith('keise ')||requestedProfile()==='keise'}
function isParent(){return isKeise()}
function isAlan(){return who()==='alan'||requestedProfile()==='alan'}
function approvedDashboard(){return isKeise()||window.__ISA_APPROVED_PROFILE_DASHBOARD__===true||document.body.classList.contains('approved-family-dashboard')}
const dedicatedMobile=new URLSearchParams(location.search).get('mobile')==='1'

async function loadCoreExtras(){
  const jobs=[
    loadOnce('profile','./profile-mascot.js?v=4-stable'),
    loadOnce('groups','./group-controls.js?v=5-stable'),
    loadOnce('pins','./conversation-pins.js?v=5-direct-pin'),
    loadOnce('paused-friends','./paused-friends-filter.js?v=3-stable'),
    loadOnce('links','./link-preview.js?v=6-inline-video'),
    loadOnce('social-network','./social-network-stable-v9.js?v=1-final-only'),
    loadOnce('social-profile-chat-bridge','./social-profile-chat-bridge.js?v=1-separated-photo-chat-rules'),
    loadOnce('profile-theme-v2','./social-profile-theme-v2.js?v=1-all-colors-smart-bg'),
    loadOnce('profile-theme-page','./social-profile-theme-page-addon-v1.js?v=1-own-profile-visible-theme'),
    loadOnce('postit-quick-actions','./collaborative-postit-quick-actions-v1.js?v=1-tap-edit-cancel'),
    loadOnce('games','./games-menu.js?v=15-approved-profiles'),
    loadOnce('snake-game','./games-menu-snake.js?v=3-all-users')
  ]
  if(!approvedDashboard())jobs.push(loadOnce('social-network-bridge','./social-network-bridge-v2.js?v=3-touch-open'))
  if(!dedicatedMobile)jobs.push(loadOnce('games-notebook-fit','./games-notebook-fit.js?v=2-all-profiles'))
  if(isKeise()){
    jobs.push(loadOnce('keise-access-settings','./keise-access-settings.js?v=2-direct-api'))
    jobs.push(loadOnce('keise-alan-studio-control','./keise-alan-studio-control.js?v=1-master-lock'))
    jobs.push(loadOnce('keise-game-test','./keise-game-test.js?v=10-direct-api'))
  }
  if(isAlan()){
    if(!approvedDashboard())jobs.push(loadOnce('alan-supervision-only','./alan-supervision-only.js?v=2-no-global-observer'))
    const accessModule=await loadOnce('alan-studio-access','./alan-studio-access.js?v=2-approved-dashboard')
    const studioEnabled=await accessModule.isAlanStudioEnabled()
    if(studioEnabled)jobs.push(loadOnce('alan-studio-launcher','./alan-studio-launcher.js?v=2-approved-dashboard'))
  }
  if(isIsa())jobs.push(loadOnce('isa-tools','./isa-tools.js?v=9-study-fix'))
  jobs.push(loadOnce('social-privacy','./social-privacy-guard.js?v=1-family-rules'))
  const result=await Promise.allSettled(jobs)
  result.forEach((r,i)=>{if(r.status==='rejected')console.warn('Módulo extra não carregou',i,r.reason)})
  window.__ISA_SOCIAL_PRIVACY__?.apply?.()
  window.__ISA_SOCIAL_PROFILE_CHAT_SYNC__?.()
  window.__ISA_PROFILE_THEME_V2__?.scan?.()
  window.__ISA_PROFILE_THEME_PAGE__?.sync?.()
}
async function loadSupervisionExtras(){if(!isParent())return;await Promise.allSettled([loadOnce('diary-parent','./diary-parent.js?v=5-stable')])}
function wire(){
  if(wired||!mainReady())return false
  wired=true
  loadCoreExtras().then(()=>{window.__ISA_FEATURES_READY__=true}).catch(console.error)
  const supervision=document.querySelector('[data-tab="supervision"]')
  if(supervision&&!supervision.dataset.extraLoaderStable){
    supervision.dataset.extraLoaderStable='1';supervision.addEventListener('click',()=>loadSupervisionExtras().catch(()=>{}))
  }
  return true
}
function start(){
  if(wire())return
  const main=$('mainView')
  if(main){const obs=new MutationObserver(()=>{if(wire())obs.disconnect()});obs.observe(main,{attributes:true,attributeFilter:['class']})}
  let tries=0;const retry=()=>{if(wire()||++tries>=80)return;setTimeout(retry,150)};retry()
}
start()
