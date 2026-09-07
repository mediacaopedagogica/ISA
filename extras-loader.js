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
const dedicatedMobile=new URLSearchParams(location.search).get('mobile')==='1'

async function loadCoreExtras(){
  const jobs=[
    loadOnce('profile','./profile-mascot.js?v=4-stable'),
    loadOnce('groups','./group-controls.js?v=5-stable'),
    loadOnce('pins','./conversation-pins.js?v=5-direct-pin'),
    loadOnce('paused-friends','./paused-friends-filter.js?v=3-stable'),
    loadOnce('family-media','./family-media-menu-v2.js?v=6-audio-mime'),
    loadOnce('links','./link-preview.js?v=5-stable')
  ]
  if(!dedicatedMobile)jobs.push(loadOnce('calls','./call-manager.js?v=4-stable'))
  if(isIsa())jobs.push(loadOnce('isa-tools','./isa-tools.js?v=9-study-fix'))
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
