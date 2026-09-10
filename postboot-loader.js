// Carregador progressivo: o núcleo do Cantinho nunca espera módulos extras.
const wait=ms=>new Promise(r=>setTimeout(r,ms))
async function load(path){try{return await import(path)}catch(e){console.warn('Módulo não carregou:',path,e);return null}}
function later(ms,path,after){setTimeout(async()=>{await load(path);try{after?.()}catch{}},ms)}

function currentProfile(){
  const requested=String(new URLSearchParams(location.search).get('perfil')||'').trim().toLowerCase()
  const current=String(document.getElementById('myName')?.textContent||'').trim().toLowerCase()
  if(requested==='keise'||current==='keise'||current.startsWith('keise '))return'keise'
  if(requested==='isa'||current==='isa'||current.startsWith('isa '))return'isa'
  if(requested==='alan'||current==='alan'||current.startsWith('alan '))return'alan'
  return current||requested
}
const profileAtBoot=currentProfile()
const keiseAtBoot=profileAtBoot==='keise'
const sharedApprovedAtBoot=profileAtBoot==='isa'||profileAtBoot==='alan'
const approvedDashboardAtBoot=keiseAtBoot||sharedApprovedAtBoot

function ensureSettings(){
  const nav=document.querySelector('.nav-tabs');if(!nav)return null
  let btn=document.getElementById('settingsMenuBtn')||document.getElementById('generalSettingsNav')
  if(!btn){btn=document.createElement('button');btn.id='settingsMenuBtn';btn.type='button';btn.className='nav-btn';const cal=nav.querySelector('[data-tab="calendar"]');cal?.insertAdjacentElement('afterend',btn);if(!btn.parentNode)nav.appendChild(btn)}
  btn.id='settingsMenuBtn';btn.classList.add('nav-btn');btn.classList.remove('hidden');btn.removeAttribute('data-tab');btn.dataset.settingsMenu='1';btn.textContent='⚙️';btn.title='Configurações';btn.setAttribute('aria-label','Configurações');btn.style.removeProperty('display');btn.style.removeProperty('visibility');btn.style.removeProperty('opacity')
  if(btn.dataset.stableSettingsBound!=='1'){
    btn.dataset.stableSettingsBound='1';btn.dataset.generalSettingsBound='1'
    btn.addEventListener('click',async e=>{e.preventDefault();e.stopPropagation();if(typeof window.__ISA_OPEN_GENERAL_SETTINGS__!=='function')await load('./general-settings.js?v=15-approved-profiles');window.__ISA_OPEN_GENERAL_SETTINGS__?.()},true)
  }
  return btn
}
window.__ISA_ENSURE_SETTINGS_MENU__=ensureSettings

if(!approvedDashboardAtBoot){
  ensureSettings();document.addEventListener('DOMContentLoaded',ensureSettings,{once:true})
  let n=0;const t=setInterval(()=>{ensureSettings();window.__ISA_ENSURE_PROFILE_MENU__?.();if(++n>24)clearInterval(t)},350)
  later(20,'./profile-menu-guard.js?v=6-classic-only',()=>window.__ISA_ENSURE_PROFILE_MENU__?.())
  later(80,'./general-settings.js?v=15-approved-profiles',()=>{ensureSettings();window.__ISA_APPLY_GENERAL_SETTINGS__?.()})
  later(120,'./personal-navigation-core.js?v=2-classic-only',()=>window.__ISA_PERSONAL_NAV_SYNC__?.())
}else later(70,'./general-settings.js?v=15-approved-profiles')

later(260,'./social-privacy-guard.js?v=1-family-rules',()=>window.__ISA_SOCIAL_PRIVACY__?.apply?.())
later(520,'./profile-status-stickers.js?v=14-plus-menu')
later(650,'./sticker-bg-remover.js?v=1-ai-cutout',()=>window.__ISA_ENSURE_STICKER_BG_REMOVER__?.())
if(!approvedDashboardAtBoot)later(760,'./social-nav-guard.js?v=8-classic-only',()=>{window.__ISA_ENSURE_SOCIAL_NAV__?.();window.__ISA_ENSURE_PROFILE_MENU__?.();window.__ISA_PERSONAL_NAV_SYNC__?.()})
later(840,'./nossa-rede-v4.js?v=3-family-rules',()=>{window.__ISA_ENHANCE_NOSSA_REDE__?.();window.__ISA_SOCIAL_PRIVACY__?.apply?.();if(!approvedDashboardAtBoot)window.__ISA_PERSONAL_NAV_SYNC__?.()})
later(920,'./nossa-rede-policy-v5-loader.js?v=2-social-profiles',()=>window.__ISA_NOSSA_REDE_V5__?.patch?.())
later(1010,'./social-profile-pages-v1.js?v=1-profiles-gallery',()=>window.__ISA_SOCIAL_PROFILE_PAGES__?.decorate?.())
later(1060,'./social-profile-directory-v1.js?v=1-visible-only',()=>window.__ISA_SOCIAL_PROFILE_DIRECTORY__?.patch?.())
later(1110,'./profile-actions.js?v=7-progressive')
later(1240,'./call-manager.js?v=18-plus-menu')
later(1420,'./message-interactions-v1.js?v=4-bubble-edge',()=>window.__ISA_REFRESH_MESSAGE_INTERACTIONS__?.())
later(1480,'./chat-rich-format-v1.js?v=1-rich-chat',()=>window.__ISA_REFRESH_RICH_CHAT__?.())
later(1515,'./chat-rich-format-guard-v2.js?v=1-no-empty-tags',()=>window.__ISA_CLEAN_EMPTY_CHAT_FORMATS__?.())
later(1560,'./family-media-menu-v2.js?v=12-compact-plus')
later(1620,'./group-creation-guard-v1.js?v=2-safe-groups',()=>window.__ISA_GROUP_RULES_REFRESH__?.())
later(1760,'./notifications-v2.js?v=11-progressive')
later(1860,'./social-tag-notifications.js?v=2-live-tags',()=>window.__ISA_SOCIAL_TAG_NOTIFICATIONS__?.poll?.())
later(2220,'./extras-loader.js?v=61-social-profile-pages',()=>{window.__ISA_SOCIAL_PRIVACY__?.apply?.();window.__ISA_SOCIAL_PROFILE_CHAT_SYNC__?.();window.__ISA_SOCIAL_PROFILE_PAGES__?.decorate?.();window.__ISA_SOCIAL_PROFILE_DIRECTORY__?.patch?.();window.__ISA_REFRESH_MESSAGE_INTERACTIONS__?.();window.__ISA_REFRESH_RICH_CHAT__?.();window.__ISA_CLEAN_EMPTY_CHAT_FORMATS__?.();window.__ISA_GROUP_RULES_REFRESH__?.();if(!approvedDashboardAtBoot){window.__ISA_ENSURE_PROFILE_MENU__?.();window.__ISA_PERSONAL_NAV_SYNC__?.()}})

let keiseBooted=false
function bootKeise(){
  if(keiseBooted||currentProfile()!=='keise')return false
  keiseBooted=true
  load('./keise-chat-unified.js?v=4-single-bridge')
  later(25,'./keise-approved-layout-final.js?v=3-single-layer',()=>window.__ISA_SHOW_KEISE_HOME__?.())
  later(210,'./keise-game-test.js?v=10-direct-api')
  return true
}
bootKeise();let kc=0;const kt=setInterval(()=>{if(bootKeise()||++kc>50)clearInterval(kt)},120)

let sharedBooted=false
function bootSharedApproved(){
  const p=currentProfile();if(sharedBooted||!(p==='isa'||p==='alan'))return false
  sharedBooted=true
  later(25,'./approved-profile-dashboard.js?v=2-social-mobile-fix',()=>window.__ISA_SHOW_APPROVED_PROFILE_HOME__?.())
  return true
}
bootSharedApproved();let sc=0;const st=setInterval(()=>{if(bootSharedApproved()||++sc>50)clearInterval(st)},120)
window.__ISA_EXTRAS_READY__=true
