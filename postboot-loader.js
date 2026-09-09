// Carregador progressivo: o núcleo do Cantinho nunca espera módulos extras.
const wait=ms=>new Promise(r=>setTimeout(r,ms))
async function load(path){try{return await import(path)}catch(e){console.warn('Módulo não carregou:',path,e);return null}}
function later(ms,path,after){setTimeout(async()=>{await load(path);try{after?.()}catch{}},ms)}
function css(path,id){if(document.getElementById(id))return;const l=document.createElement('link');l.id=id;l.rel='stylesheet';l.href=path;document.head.appendChild(l)}

function isKeiseAccess(){
  const requested=String(new URLSearchParams(location.search).get('perfil')||'').trim().toLowerCase()
  const current=String(document.getElementById('myName')?.textContent||'').trim().toLowerCase()
  return requested==='keise'||current==='keise'||current.startsWith('keise ')
}
const keiseAtBoot=isKeiseAccess()

function ensureSettings(){
  const nav=document.querySelector('.nav-tabs');if(!nav)return null
  let btn=document.getElementById('settingsMenuBtn')||document.getElementById('generalSettingsNav')
  if(!btn){btn=document.createElement('button');btn.id='settingsMenuBtn';btn.type='button';btn.className='nav-btn';const cal=nav.querySelector('[data-tab="calendar"]');cal?.insertAdjacentElement('afterend',btn);if(!btn.parentNode)nav.appendChild(btn)}
  btn.id='settingsMenuBtn';btn.classList.add('nav-btn');btn.classList.remove('hidden');btn.removeAttribute('data-tab');btn.dataset.settingsMenu='1';btn.textContent='⚙️';btn.title='Configurações';btn.setAttribute('aria-label','Configurações');btn.style.removeProperty('display');btn.style.removeProperty('visibility');btn.style.removeProperty('opacity')
  if(btn.dataset.stableSettingsBound!=='1'){
    btn.dataset.stableSettingsBound='1';btn.dataset.generalSettingsBound='1'
    btn.addEventListener('click',async e=>{e.preventDefault();e.stopPropagation();if(typeof window.__ISA_OPEN_GENERAL_SETTINGS__!=='function')await load('./general-settings.js?v=12-unified-settings');window.__ISA_OPEN_GENERAL_SETTINGS__?.()},true)
  }
  return btn
}
window.__ISA_ENSURE_SETTINGS_MENU__=ensureSettings

// A interface aprovada da Keise não precisa que o carregador injete/observe a navegação antiga.
// Para os demais perfis, o comportamento anterior é preservado integralmente.
if(!keiseAtBoot){
  ensureSettings();document.addEventListener('DOMContentLoaded',ensureSettings,{once:true})
  let n=0;const t=setInterval(()=>{ensureSettings();window.__ISA_ENSURE_PROFILE_MENU__?.();if(++n>24)clearInterval(t)},350)
  later(20,'./profile-menu-guard.js?v=4-responsive-safe',()=>window.__ISA_ENSURE_PROFILE_MENU__?.())
}else{
  // Configurações continuam disponíveis pela API pública, sem criar um segundo botão invisível.
  later(80,'./general-settings.js?v=13-keise-single-layer')
}

if(!keiseAtBoot)later(80,'./general-settings.js?v=12-unified-settings',()=>{ensureSettings();window.__ISA_APPLY_GENERAL_SETTINGS__?.()})

// CRÍTICO: mobile-responsive/mobile-native controlam display da sidebar/content e entram em
// conflito direto com o dashboard aprovado da Keise. Eles nunca são carregados nesse acesso.
if(!keiseAtBoot){
  const dedicatedMobile=new URLSearchParams(location.search).get('mobile')==='1'
  later(180,dedicatedMobile?'./mobile-native.js?v=6-progressive':'./mobile-responsive-v2.js?v=18-progressive',()=>window.__ISA_ENSURE_PROFILE_MENU__?.())
}

later(520,'./profile-status-stickers.js?v=14-plus-menu')
later(650,'./sticker-bg-remover.js?v=1-ai-cutout',()=>window.__ISA_ENSURE_STICKER_BG_REMOVER__?.())
later(760,'./social-nav-guard.js?v=6-progressive',()=>{window.__ISA_ENSURE_SOCIAL_NAV__?.();if(!keiseAtBoot)window.__ISA_ENSURE_PROFILE_MENU__?.()})
later(840,'./nossa-rede-v4.js?v=1-approved',()=>window.__ISA_ENHANCE_NOSSA_REDE__?.())
later(980,'./profile-actions.js?v=7-progressive')
later(1200,'./call-manager.js?v=18-plus-menu')
later(1450,'./family-media-menu-v2.js?v=12-compact-plus')
later(1750,'./notifications-v2.js?v=11-progressive')
later(2300,'./extras-loader.js?v=56-keise-single-layer',()=>{if(!keiseAtBoot)window.__ISA_ENSURE_PROFILE_MENU__?.()})

let keiseBooted=false
function bootKeise(){
  if(keiseBooted||!isKeiseAccess())return false
  keiseBooted=true

  // Fonte visual única: nenhum dashboard/estilo antigo da Keise é carregado aqui.
  // keise-chat-unified fica somente como ponte funcional de conversa; sem camada visual própria.
  load('./keise-chat-unified.js?v=4-single-bridge')
  later(25,'./keise-approved-layout-final.js?v=3-single-layer',()=>window.__ISA_SHOW_KEISE_HOME__?.())
  later(210,'./keise-game-test.js?v=9-progressive')
  return true
}
bootKeise()
let keiseChecks=0;const keiseTimer=setInterval(()=>{if(bootKeise()||++keiseChecks>50)clearInterval(keiseTimer)},120)

window.__ISA_EXTRAS_READY__=true
