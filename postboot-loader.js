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
    btn.addEventListener('click',async e=>{e.preventDefault();e.stopPropagation();if(typeof window.__ISA_OPEN_GENERAL_SETTINGS__!=='function')await load('./general-settings.js?v=16-stable-interactions');window.__ISA_OPEN_GENERAL_SETTINGS__?.()},true)
  }
  return btn
}
window.__ISA_ENSURE_SETTINGS_MENU__=ensureSettings

if(!approvedDashboardAtBoot){
  ensureSettings();document.addEventListener('DOMContentLoaded',ensureSettings,{once:true})
  let n=0;const t=setInterval(()=>{ensureSettings();window.__ISA_ENSURE_PROFILE_MENU__?.();if(++n>24)clearInterval(t)},350)
  later(20,'./profile-menu-guard.js?v=7-stable-interactions',()=>window.__ISA_ENSURE_PROFILE_MENU__?.())
  later(80,'./general-settings.js?v=16-stable-interactions',()=>{ensureSettings();window.__ISA_APPLY_GENERAL_SETTINGS__?.()})
  later(120,'./personal-navigation-core.js?v=3-stable-interactions',()=>window.__ISA_PERSONAL_NAV_SYNC__?.())
}else later(70,'./general-settings.js?v=16-stable-interactions')

later(260,'./social-privacy-guard.js?v=2-stable-interactions',()=>window.__ISA_SOCIAL_PRIVACY__?.apply?.())
later(520,'./profile-status-stickers.js?v=15-stable-interactions')
later(600,'./profile-birthday-v1.js?v=4-social-birthday-bridge',()=>window.__ISA_PROFILE_BIRTHDAY__?.inject?.())
later(625,'./nossa-rede-birthday-bridge-v1.js?v=1-live-birthdays',()=>window.__ISA_NOSSA_REDE_BIRTHDAYS__?.refresh?.())
later(640,'./family-social-extras-v1.js?v=2-live-social-extras',()=>window.__ISA_FAMILY_SOCIAL_EXTRAS__?.scan?.(true))
later(650,'./sticker-bg-remover.js?v=2-stable-interactions',()=>window.__ISA_ENSURE_STICKER_BG_REMOVER__?.())
later(680,'./interaction-recovery-v2.js?v=1-chat-date',()=>window.__ISA_INTERACTION_RECOVERY__?.scan?.())
later(690,'./collaborative-chat-postits-v1.js?v=1-edit-drag-status',()=>window.__ISA_COLLAB_POSTITS__?.scan?.())
later(710,'./conversation-important-v2.js?v=4-collab-chat',()=>window.__ISA_IMPORTANT_BOARD__?.render?.())
later(730,'./approved-conversation-stability-v1.js?v=1-no-shake',()=>window.__ISA_STABILIZE_APPROVED_CONVERSATIONS__?.())
if(!approvedDashboardAtBoot)later(760,'./social-nav-guard.js?v=9-stable-interactions',()=>{window.__ISA_ENSURE_SOCIAL_NAV__?.();window.__ISA_ENSURE_PROFILE_MENU__?.();window.__ISA_PERSONAL_NAV_SYNC__?.()})
later(840,'./nossa-rede-v4.js?v=6-stable-open',()=>{window.__ISA_ENHANCE_NOSSA_REDE__?.();window.__ISA_SOCIAL_PRIVACY__?.apply?.();window.__ISA_FAMILY_SOCIAL_EXTRAS__?.scan?.(true);window.__ISA_NOSSA_REDE_BIRTHDAYS__?.refresh?.();if(!approvedDashboardAtBoot)window.__ISA_PERSONAL_NAV_SYNC__?.()})
later(920,'./nossa-rede-policy-v5-loader.js?v=13-emoji-suite',()=>{window.__ISA_NOSSA_REDE_V5__?.patch?.();window.__ISA_COMMENT_MEDIA_MENU__?.scan?.();window.__ISA_NUVEM_COMPACT_COMPOSER__?.scan?.();window.__ISA_SOCIAL_EMOJI_SUITE__?.scan?.()})
later(965,'./isa-social-emoji-suite-v1.js?v=1-full-isa-chat-emojis',()=>window.__ISA_SOCIAL_EMOJI_SUITE__?.scan?.())
later(980,'./nuvem-carousel-v1.js?v=1-three-media',()=>window.__ISA_NUVEM_CAROUSEL__?.scan?.())
later(1010,'./social-profile-pages-v1.js?v=4-stable-open',()=>window.__ISA_SOCIAL_PROFILE_PAGES__?.decorate?.())
later(1060,'./social-profile-directory-v1.js?v=3-stable-open',()=>window.__ISA_SOCIAL_PROFILE_DIRECTORY__?.patch?.())
later(1090,'./social-reaction-names-v1.js?v=3-stable-open',()=>window.__ISA_ENHANCE_REACTION_NAMES__?.())
later(1110,'./profile-actions.js?v=8-stable-interactions')
later(1240,'./call-manager.js?v=19-stable-interactions')
later(1420,'./message-interactions-v1.js?v=7-full-emotions',()=>window.__ISA_REFRESH_MESSAGE_INTERACTIONS__?.())
later(1450,'./message-reaction-delegate-v2.js?v=4-expanded-emotions',()=>window.__ISA_REACTION_DELEGATE_REFRESH__?.())
later(1470,'./nuvem-reactions-v1.js?v=4-full-emotions',()=>window.__ISA_NUVEM_REACTIONS__?.apply?.())
later(1480,'./chat-rich-format-v1.js?v=5-stable-interactions',()=>window.__ISA_REFRESH_RICH_CHAT__?.())
later(1515,'./chat-rich-format-guard-v2.js?v=3-stable-interactions',()=>window.__ISA_CLEAN_EMPTY_CHAT_FORMATS__?.())
later(1560,'./family-media-menu-v2.js?v=13-stable-interactions')
later(1620,'./group-creation-guard-v1.js?v=4-stable-interactions',()=>window.__ISA_GROUP_RULES_REFRESH__?.())
if(keiseAtBoot)later(1660,'./keise-group-permission-ui-v1.js?v=2-stable-interactions',()=>window.__ISA_PATCH_KEISE_GROUP_PERMISSION__?.())
later(1690,'./super-pais-visibility-v1.js?v=2-per-profile-live',()=>window.__ISA_SUPER_PAIS_VISIBILITY__?.start?.())
later(1760,'./notifications-v2.js?v=12-stable-interactions')
later(1860,'./social-tag-notifications.js?v=3-stable-interactions',()=>window.__ISA_SOCIAL_TAG_NOTIFICATIONS__?.poll?.())
later(2220,'./extras-loader.js?v=63-social-extras-live',()=>{window.__ISA_SOCIAL_PRIVACY__?.apply?.();window.__ISA_SOCIAL_PROFILE_CHAT_SYNC__?.();window.__ISA_SOCIAL_PROFILE_PAGES__?.decorate?.();window.__ISA_SOCIAL_PROFILE_DIRECTORY__?.patch?.();window.__ISA_ENHANCE_REACTION_NAMES__?.();window.__ISA_PROFILE_BIRTHDAY__?.inject?.();window.__ISA_COMMENT_MEDIA_MENU__?.scan?.();window.__ISA_REFRESH_MESSAGE_INTERACTIONS__?.();window.__ISA_REFRESH_RICH_CHAT__?.();window.__ISA_CLEAN_EMPTY_CHAT_FORMATS__?.();window.__ISA_GROUP_RULES_REFRESH__?.();window.__ISA_INTERACTION_RECOVERY__?.scan?.();window.__ISA_STABILIZE_APPROVED_CONVERSATIONS__?.();window.__ISA_COLLAB_POSTITS__?.scan?.();window.__ISA_NUVEM_CAROUSEL__?.scan?.();window.__ISA_SOCIAL_EMOJI_SUITE__?.scan?.();window.__ISA_FAMILY_SOCIAL_EXTRAS__?.scan?.(true);window.__ISA_NOSSA_REDE_BIRTHDAYS__?.refresh?.();window.__ISA_SUPER_PAIS_VISIBILITY__?.start?.();if(!approvedDashboardAtBoot){window.__ISA_ENSURE_PROFILE_MENU__?.();window.__ISA_PERSONAL_NAV_SYNC__?.()}})
later(2280,'./nuvem-ui-ideas-v10.js?v=4-tools-only',()=>window.__ISA_NUVEM_UI_IDEAS__?.scan?.())
later(2310,'./nuvem-compose-compact-v1.js?v=11-flat-pink-live',()=>window.__ISA_NUVEM_COMPACT_COMPOSER__?.scan?.())
later(2360,'./nuvem-pin-picker-v2.js?v=3-stable',()=>{window.__ISA_NUVEM_PIN_PICKER__?.scan?.();window.__ISA_STABILIZE_APPROVED_CONVERSATIONS__?.()})

let keiseBooted=false
function bootKeise(){
  if(keiseBooted||currentProfile()!=='keise')return false
  keiseBooted=true
  load('./keise-chat-unified.js?v=5-stable-interactions')
  later(25,'./keise-approved-layout-final.js?v=5-no-shake',()=>{window.__ISA_SHOW_KEISE_HOME__?.();window.__ISA_STABILIZE_APPROVED_CONVERSATIONS__?.()})
  later(210,'./keise-game-test.js?v=11-stable-interactions')
  return true
}
bootKeise();let kc=0;const kt=setInterval(()=>{if(bootKeise()||++kc>50)clearInterval(kt)},120)

let sharedBooted=false
function bootSharedApproved(){
  const p=currentProfile();if(sharedBooted||!(p==='isa'||p==='alan'))return false
  sharedBooted=true
  later(25,'./approved-profile-dashboard.js?v=5-no-shake',()=>{window.__ISA_SHOW_APPROVED_PROFILE_HOME__?.();window.__ISA_STABILIZE_APPROVED_CONVERSATIONS__?.()})
  return true
}
bootSharedApproved();let sc=0;const st=setInterval(()=>{if(bootSharedApproved()||++sc>50)clearInterval(st)},120)
window.__ISA_EXTRAS_READY__=true
