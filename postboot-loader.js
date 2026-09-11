// Carregador progressivo: o núcleo nunca espera módulos extras.
// Nos dashboards aprovados (Keise, Isa e Alan), módulos de navegação legado NÃO podem disputar o shell.
const wait=ms=>new Promise(r=>setTimeout(r,ms))
async function load(path){try{return await import(path)}catch(e){console.warn('Módulo não carregou:',path,e);return null}}
function later(ms,path,after){setTimeout(async()=>{await load(path);try{after?.()}catch{}},ms)}

function currentProfile(){
  const requested=String(new URLSearchParams(location.search).get('perfil')||'').trim().toLowerCase()
  const current=String(document.getElementById('myName')?.textContent||'').trim().toLowerCase()
  for(const p of ['keise','isa','alan'])if(requested===p||current===p||current.startsWith(p+' '))return p
  return current||requested
}
const profileAtBoot=currentProfile()
const keiseAtBoot=profileAtBoot==='keise'
const approvedAtBoot=['keise','isa','alan'].includes(profileAtBoot)

function ensureSettings(){
  // O menu visível dos três perfis aprovados pertence exclusivamente aos seus dashboards.
  if(approvedAtBoot)return document.getElementById('settingsMenuBtn')||document.getElementById('generalSettingsNav')||null
  const nav=document.querySelector('.nav-tabs');if(!nav)return null
  let btn=document.getElementById('settingsMenuBtn')||document.getElementById('generalSettingsNav')
  if(!btn){btn=document.createElement('button');btn.id='settingsMenuBtn';btn.type='button';btn.className='nav-btn';const cal=nav.querySelector('[data-tab="calendar"]');cal?.insertAdjacentElement('afterend',btn);if(!btn.parentNode)nav.appendChild(btn)}
  if(btn.id!=='settingsMenuBtn')btn.id='settingsMenuBtn'
  if(!btn.classList.contains('nav-btn'))btn.classList.add('nav-btn')
  if(btn.classList.contains('hidden'))btn.classList.remove('hidden')
  if(btn.hasAttribute('data-tab'))btn.removeAttribute('data-tab')
  if(btn.dataset.settingsMenu!=='1')btn.dataset.settingsMenu='1'
  const markup='⚙️ <span>Configurações</span>';if(btn.innerHTML!==markup)btn.innerHTML=markup
  if(btn.title!=='Configurações')btn.title='Configurações';if(btn.getAttribute('aria-label')!=='Configurações')btn.setAttribute('aria-label','Configurações')
  if(btn.style.display)btn.style.removeProperty('display');if(btn.style.visibility)btn.style.removeProperty('visibility');if(btn.style.opacity)btn.style.removeProperty('opacity')
  if(btn.dataset.stableSettingsBound!=='1'){
    btn.dataset.stableSettingsBound='1';btn.dataset.generalSettingsBound='1'
    btn.addEventListener('click',async e=>{e.preventDefault();e.stopPropagation();if(typeof window.__ISA_OPEN_GENERAL_SETTINGS__!=='function')await load('./general-settings.js?v=18-no-nav-loop');window.__ISA_OPEN_GENERAL_SETTINGS__?.()},true)
  }
  return btn
}
window.__ISA_ENSURE_SETTINGS_MENU__=ensureSettings

later(5,'./mobile-conversation-scroll-v2.js?v=1-visible-scroll')
later(12,'./mobile-responsive-v2.js?v=64-approved-no-conflict')

if(!approvedAtBoot){
  ensureSettings();document.addEventListener('DOMContentLoaded',ensureSettings,{once:true})
  let navTick=0;const navTimer=setInterval(()=>{ensureSettings();window.__ISA_ENSURE_PROFILE_MENU__?.();window.__ISA_PERSONAL_NAV_SYNC__?.();if(++navTick>30)clearInterval(navTimer)},350)
  later(20,'./profile-menu-guard.js?v=9-no-nav-loop',()=>window.__ISA_ENSURE_PROFILE_MENU__?.())
  later(120,'./personal-navigation-core.js?v=6-approved-excluded',()=>window.__ISA_PERSONAL_NAV_SYNC__?.())
}
later(80,'./general-settings.js?v=18-no-nav-loop',()=>{if(!approvedAtBoot)ensureSettings();window.__ISA_APPLY_GENERAL_SETTINGS__?.()})

later(260,'./social-privacy-guard.js?v=2-stable-interactions',()=>window.__ISA_SOCIAL_PRIVACY__?.apply?.())
later(520,'./profile-status-stickers.js?v=15-stable-interactions')
later(600,'./profile-birthday-v1.js?v=4-social-birthday-bridge',()=>window.__ISA_PROFILE_BIRTHDAY__?.inject?.())
later(610,'./profile-photo-unified-sync-v1.js?v=1-chat-social-same-photo',()=>window.__ISA_PROFILE_PHOTO_UNIFIED_SYNC__?.scan?.())
later(625,'./nossa-rede-birthday-bridge-v1.js?v=2-all-family-birthdays',()=>window.__ISA_NOSSA_REDE_BIRTHDAYS__?.refresh?.())
later(640,'./family-social-extras-v1.js?v=2-live-social-extras',()=>window.__ISA_FAMILY_SOCIAL_EXTRAS__?.scan?.(true))
later(650,'./sticker-bg-remover.js?v=2-stable-interactions',()=>window.__ISA_ENSURE_STICKER_BG_REMOVER__?.())
later(680,'./interaction-recovery-v2.js?v=1-chat-date',()=>window.__ISA_INTERACTION_RECOVERY__?.scan?.())
later(690,'./collaborative-chat-postits-v2.js?v=3-cancel-reopen-fixers',()=>window.__ISA_COLLAB_POSTITS__?.scan?.())
later(700,'./collaborative-postit-quick-actions-v1.js?v=2-tap-edit-cancel')
later(705,'./keise-conversation-router-v2.js?v=1-final-approved-home')
later(710,'./conversation-important-v2.js?v=5-collab-chat-v2',()=>window.__ISA_IMPORTANT_BOARD__?.render?.())
later(730,'./approved-conversation-stability-v1.js?v=11-canonical-no-polling',()=>window.__ISA_STABILIZE_APPROVED_CONVERSATIONS__?.())
if(!approvedAtBoot)later(760,'./social-nav-guard.js?v=11-approved-excluded',()=>{window.__ISA_ENSURE_SOCIAL_NAV__?.();window.__ISA_ENSURE_PROFILE_MENU__?.();window.__ISA_PERSONAL_NAV_SYNC__?.()})
later(840,'./nossa-rede-v4.js?v=7-single-shell-open',()=>{window.__ISA_ENHANCE_NOSSA_REDE__?.();window.__ISA_SOCIAL_PRIVACY__?.apply?.();window.__ISA_FAMILY_SOCIAL_EXTRAS__?.scan?.(true);window.__ISA_NOSSA_REDE_BIRTHDAYS__?.refresh?.();if(!approvedAtBoot)window.__ISA_PERSONAL_NAV_SYNC__?.()})
later(920,'./nossa-rede-policy-v5-loader.js?v=15-media-v4',()=>{window.__ISA_NOSSA_REDE_V5__?.patch?.();window.__ISA_COMMENT_MEDIA_MENU__?.scan?.();window.__ISA_NUVEM_COMPACT_COMPOSER__?.scan?.();window.__ISA_SOCIAL_EMOJI_SUITE__?.scan?.();window.__ISA_NOSSA_REDE_MEDIA_WORKFLOW__?.scan?.()})
later(965,'./isa-social-emoji-suite-v1.js?v=1-full-isa-chat-emojis',()=>window.__ISA_SOCIAL_EMOJI_SUITE__?.scan?.())
later(980,'./nuvem-carousel-v1.js?v=7-edit-delete-api',()=>window.__ISA_NUVEM_CAROUSEL__?.scan?.())
later(995,'./nossa-rede-media-workflow-v4.js?v=2-rich-editor-stable',()=>window.__ISA_NOSSA_REDE_MEDIA_WORKFLOW__?.scan?.())
later(1002,'./nossa-rede-editor-make-addon-v1.js?v=1-makeup-tools',()=>window.__ISA_PATCH_MEDIA_MAKE__?.())
later(1010,'./social-profile-pages-v1.js?v=4-stable-open',()=>window.__ISA_SOCIAL_PROFILE_PAGES__?.decorate?.())
later(1060,'./social-profile-directory-v1.js?v=3-stable-open',()=>window.__ISA_SOCIAL_PROFILE_DIRECTORY__?.patch?.())
later(1090,'./social-reaction-names-v1.js?v=3-stable-open',()=>window.__ISA_ENHANCE_REACTION_NAMES__?.())
later(1110,'./profile-actions.js?v=9-video-call-background')
later(1160,'./video-call-background-v1.js?v=1-upload-optional')
later(1240,'./call-manager.js?v=20-video-background')
later(1420,'./message-interactions-v1.js?v=7-full-emotions',()=>window.__ISA_REFRESH_MESSAGE_INTERACTIONS__?.())
later(1450,'./message-reaction-delegate-v2.js?v=4-expanded-emotions',()=>window.__ISA_REACTION_DELEGATE_REFRESH__?.())
later(1470,'./nuvem-reactions-v1.js?v=4-full-emotions',()=>window.__ISA_NUVEM_REACTIONS__?.apply?.())
later(1480,'./chat-rich-format-v1.js?v=5-stable-interactions',()=>window.__ISA_REFRESH_RICH_CHAT__?.())
later(1515,'./chat-rich-format-guard-v2.js?v=3-stable-interactions',()=>window.__ISA_CLEAN_EMPTY_CHAT_FORMATS__?.())
later(1560,'./family-media-menu-v2.js?v=13-stable-interactions')
later(1620,'./group-creation-guard-v1.js?v=4-stable-interactions',()=>window.__ISA_GROUP_RULES_REFRESH__?.())
if(keiseAtBoot)later(1660,'./keise-group-permission-ui-v1.js?v=2-stable-interactions',()=>window.__ISA_PATCH_KEISE_GROUP_PERMISSION__?.())
later(1690,'./super-pais-visibility-v1.js?v=3-approved-direct-chats',()=>window.__ISA_SUPER_PAIS_VISIBILITY__?.start?.())
later(1760,'./notifications-v2.js?v=12-stable-interactions')
later(1860,'./social-tag-notifications.js?v=3-stable-interactions',()=>window.__ISA_SOCIAL_TAG_NOTIFICATIONS__?.poll?.())
later(2220,'./extras-loader.js?v=69-unified-photo',()=>{window.__ISA_SOCIAL_PRIVACY__?.apply?.();window.__ISA_SOCIAL_PROFILE_CHAT_SYNC__?.();window.__ISA_PROFILE_PHOTO_UNIFIED_SYNC__?.scan?.();window.__ISA_SOCIAL_PROFILE_PAGES__?.decorate?.();window.__ISA_SOCIAL_PROFILE_DIRECTORY__?.patch?.();window.__ISA_ENHANCE_REACTION_NAMES__?.();window.__ISA_PROFILE_BIRTHDAY__?.inject?.();window.__ISA_COMMENT_MEDIA_MENU__?.scan?.();window.__ISA_REFRESH_MESSAGE_INTERACTIONS__?.();window.__ISA_REFRESH_RICH_CHAT__?.();window.__ISA_CLEAN_EMPTY_CHAT_FORMATS__?.();window.__ISA_GROUP_RULES_REFRESH__?.();window.__ISA_INTERACTION_RECOVERY__?.scan?.();window.__ISA_STABILIZE_APPROVED_CONVERSATIONS__?.();window.__ISA_COLLAB_POSTITS__?.scan?.();window.__ISA_NUVEM_CAROUSEL__?.scan?.();window.__ISA_SOCIAL_EMOJI_SUITE__?.scan?.();window.__ISA_FAMILY_SOCIAL_EXTRAS__?.scan?.(true);window.__ISA_NOSSA_REDE_BIRTHDAYS__?.refresh?.();window.__ISA_NOSSA_REDE_MEDIA_WORKFLOW__?.scan?.();window.__ISA_SUPER_PAIS_VISIBILITY__?.start?.();window.__ISA_NUVEM_PIN_PICKER__?.scan?.();window.__ISA_PROFILE_THEME_V2__?.scan?.();if(!approvedAtBoot){window.__ISA_ENSURE_SETTINGS_MENU__?.();window.__ISA_ENSURE_PROFILE_MENU__?.();window.__ISA_PERSONAL_NAV_SYNC__?.()}})
later(2280,'./nuvem-ui-ideas-v10.js?v=4-tools-only',()=>window.__ISA_NUVEM_UI_IDEAS__?.scan?.())
later(2310,'./nuvem-compose-compact-v1.js?v=11-flat-pink-live',()=>window.__ISA_NUVEM_COMPACT_COMPOSER__?.scan?.())
later(2335,'./nossa-rede-media-workflow-v4.js?v=2-rich-editor-stable',()=>window.__ISA_NOSSA_REDE_MEDIA_WORKFLOW__?.scan?.())
later(2360,'./nuvem-pin-picker-v2.js?v=7-single-shell-all-links',()=>{window.__ISA_NUVEM_PIN_PICKER__?.scan?.();window.__ISA_STABILIZE_APPROVED_CONVERSATIONS__?.()})

window.__ISA_EXTRAS_READY__=true
