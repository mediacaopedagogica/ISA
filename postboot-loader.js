// Carrega recursos complementares sem bloquear o núcleo do Cantinho.
const wait=ms=>new Promise(r=>setTimeout(r,ms))
const idle=()=>new Promise(resolve=>{
  if('requestIdleCallback' in window)requestIdleCallback(()=>resolve(),{timeout:700})
  else setTimeout(resolve,80)
})

async function loadWithRetry(path){
  try{return await import(path)}
  catch(first){
    console.warn('Primeira tentativa falhou:',path,first)
    await wait(320)
    const sep=path.includes('?')?'&':'?'
    return import(`${path}${sep}retry=${Date.now()}`)
  }
}

function ensureSettingsMenuButton(){
  const nav=document.querySelector('.nav-tabs')
  if(!nav)return null
  const candidates=[...nav.querySelectorAll('#settingsMenuBtn,#generalSettingsNav')]
  let btn=candidates[0]||null
  candidates.slice(1).forEach(extra=>extra.remove())
  if(!btn){
    btn=document.createElement('button');btn.id='settingsMenuBtn';btn.className='nav-btn';btn.type='button';btn.innerHTML='⚙️ <span>Configurações</span>'
    const calendar=nav.querySelector('[data-tab="calendar"]')
    if(calendar)calendar.insertAdjacentElement('afterend',btn);else nav.appendChild(btn)
  }else if(btn.id!=='settingsMenuBtn')btn.id='settingsMenuBtn'
  if(!btn.classList.contains('nav-btn'))btn.classList.add('nav-btn')
  btn.classList.remove('hidden');btn.type='button';btn.title='Configurações Gerais';btn.setAttribute('aria-label','Configurações Gerais');btn.setAttribute('data-settings-menu','1');btn.removeAttribute('data-tab')
  btn.style.removeProperty('display');btn.style.removeProperty('visibility');btn.style.removeProperty('opacity')
  if(btn.dataset.settingsEntryBound!=='1'){
    btn.dataset.settingsEntryBound='1';btn.dataset.generalSettingsBound='1'
    btn.addEventListener('click',async e=>{
      e.preventDefault();e.stopPropagation()
      if(typeof window.__ISA_OPEN_GENERAL_SETTINGS__==='function'){window.__ISA_OPEN_GENERAL_SETTINGS__();return}
      try{await loadWithRetry('./general-settings.js?v=9-profile-menu');window.__ISA_OPEN_GENERAL_SETTINGS__?.()}catch(error){console.warn('Configurações não abriram:',error)}
    },true)
  }
  return btn
}

window.__ISA_ENSURE_SETTINGS_MENU__=ensureSettingsMenuButton
ensureSettingsMenuButton()
document.addEventListener('DOMContentLoaded',ensureSettingsMenuButton,{once:true})
let settingsMenuTries=0;const settingsMenuTimer=setInterval(()=>{ensureSettingsMenuButton();window.__ISA_ENSURE_PROFILE_MENU__?.();if(++settingsMenuTries>=30)clearInterval(settingsMenuTimer)},300)

const dedicatedMobile=new URLSearchParams(location.search).get('mobile')==='1'
const firstWave=dedicatedMobile?[
  './mobile-native.js?v=5-native-tap',
  './general-settings.js?v=9-profile-menu',
  './profile-menu-guard.js?v=1-exact-menus',
  './profile-actions.js?v=3-helper-only'
]:[
  './mobile-responsive-v2.js?v=17-native-tap',
  './general-settings.js?v=9-profile-menu',
  './profile-menu-guard.js?v=1-exact-menus',
  './profile-actions.js?v=3-helper-only'
]
const secondWave=[
  './notifications-v2.js?v=10-progressive',
  './profile-status-stickers.js?v=3-progressive',
  './social-nav-guard.js?v=4-profile-menu'
]
const thirdWave=[
  ...(dedicatedMobile?['./call-manager.js?v=9-progressive']:[]),
  './extras-loader.js?v=52-profile-menu'
]

const results=[]
async function loadWave(paths){
  for(const path of paths){
    await idle()
    try{await loadWithRetry(path);results.push({path,ok:true});window.__ISA_ENSURE_PROFILE_MENU__?.()}
    catch(error){results.push({path,ok:false,error:String(error?.message||error||'Erro')});console.warn('Módulo complementar não carregou:',path,error)}
  }
}

await loadWave(firstWave)
ensureSettingsMenuButton();window.__ISA_ENSURE_PROFILE_MENU__?.()
setTimeout(()=>loadWave(secondWave).then(()=>{window.__ISA_ENSURE_SOCIAL_NAV__?.();window.__ISA_ENSURE_PROFILE_MENU__?.()}),250)
setTimeout(()=>loadWave(thirdWave).then(()=>window.__ISA_ENSURE_PROFILE_MENU__?.()),1000)

// Teste Jogo continua exclusivo da Keise.
const requestedProfile=String(new URLSearchParams(location.search).get('perfil')||'').trim().toLowerCase()
const currentName=String(document.getElementById('myName')?.textContent||'').trim().toLowerCase()
if(requestedProfile==='keise'||currentName==='keise'||currentName.startsWith('keise ')){
  setTimeout(async()=>{
    await idle()
    try{await loadWithRetry('./keise-game-test.js?v=8-profile-menu');window.__ISA_ENSURE_TEST_GAME_NAV__?.();window.__ISA_ENSURE_PROFILE_MENU__?.()}
    catch(error){console.warn('Teste Jogo da Keise não carregou:',error)}
  },1300)
}

window.__ISA_EXTRAS_READY__=true
window.__ISA_EXTRAS_RESULTS__=results
