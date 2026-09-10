// Inicialização segura dos acessos externos.
// A Nossa Rede é controlada diretamente pelo HTML e não usa pontes antigas concorrentes.
let started=false

async function load(path){
  try{return await import(path)}
  catch(error){console.warn('[Cantinho externo] módulo não carregou:',path,error);return null}
}

function ensureHostCss(){
  if(document.getElementById('externalSocialHostV77'))return
  const l=document.createElement('link')
  l.id='externalSocialHostV77'
  l.rel='stylesheet'
  l.href='./external-social-host-v77.css?v=2-fullscreen-final'
  document.head.appendChild(l)
}

load('./mobile-conversation-scroll-v2.js?v=1-visible-scroll')
load('./nossa-rede-ui-fixes-sep10.js?v=1-overlay-birthday-cover')
// Fixadores precisam existir em TODOS os links, antes mesmo da lista terminar de montar.
load('./nuvem-pin-picker-v2.js?v=6-all-family-links')
ensureHostCss()
load('./external-enter-rescue-v77.js?v=2-enter-final')
load('./collaborative-chat-postits-v2.js?v=2-cancel-reopen-fixers')
load('./conversation-important-v2.js?v=4-collab-chat')

async function start(){
  if(started)return
  started=true
  ensureHostCss()
  try{window.__ISA_BIND_EXTERNAL_SOCIAL_DIRECT__?.();window.__ISA_COLLAB_POSTITS__?.scan?.();window.__ISA_NUVEM_PIN_PICKER__?.scan?.()}catch{}
  await load('./external-ui-controller.js?v=14-profile-parity')
  await load('./external-profile-parity-v1.js?v=2-keise-profile-parity')
  try{await window.__ISA_EXTERNAL_PROFILE_PARITY__?.start?.()}catch(error){console.warn('[Cantinho externo] perfil completo não terminou de carregar',error)}
  await load('./message-reaction-delegate-v2.js?v=4-expanded-emotions')
  await load('./isa-social-emoji-suite-v1.js?v=1-full-isa-chat-emojis')
  try{window.__ISA_SOCIAL_EMOJI_SUITE__?.scan?.();window.__ISA_REACTION_DELEGATE_REFRESH__?.()}catch{}
  await load('./family-social-extras-v1.js?v=2-live-social-extras')
  await load('./nossa-rede-birthday-bridge-v1.js?v=1-live-birthdays')
  await load('./nuvem-carousel-v1.js?v=7-edit-delete-api')
  await load('./nossa-rede-media-workflow-v4.js?v=2-rich-editor-stable')
  await load('./nossa-rede-editor-make-addon-v1.js?v=1-makeup-tools')
  try{
    window.__ISA_FAMILY_SOCIAL_EXTRAS__?.scan?.(true)
    window.__ISA_NOSSA_REDE_BIRTHDAYS__?.refresh?.()
    window.__ISA_NUVEM_CAROUSEL__?.scan?.()
    window.__ISA_NOSSA_REDE_MEDIA_WORKFLOW__?.scan?.()
    window.__ISA_PATCH_MEDIA_MAKE__?.()
    window.__ISA_NUVEM_PIN_PICKER__?.scan?.()
  }catch{}
  setTimeout(()=>load('./external-decoration-cleanup-v1.js?v=2-portal-only'),100)
  setTimeout(()=>load('./nossa-rede-header-cleanup-v1.js?v=4-all-family-final'),180)
  setTimeout(()=>load('./external-progressive-loader.js?v=34-all-family-fixers'),320)
}

document.addEventListener('isa:friend-portal-entered',start,{once:true})
if(window.__ISA_FRIEND_PORTAL_ENTERED__===true)start()
window.__ISA_START_EXTERNAL_EXTRAS__=start
