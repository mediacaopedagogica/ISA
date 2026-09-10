// Loader externo v71: zero extras pesados antes da entrada no portal.
// A validação do link e o botão Acessar têm prioridade absoluta.
let started=false
async function load(path){try{return await import(path)}catch(error){console.warn('[Cantinho externo] módulo não carregou:',path,error);return null}}
function ensureHostCss(){if(document.getElementById('externalSocialHostV77'))return;const l=document.createElement('link');l.id='externalSocialHostV77';l.rel='stylesheet';l.href='./external-social-host-v77.css?v=3-postenter';document.head.appendChild(l)}
ensureHostCss()

async function start(){
  if(started)return
  started=true
  const jobs=[
    './mobile-conversation-scroll-v2.js?v=2-postenter',
    './nossa-rede-ui-fixes-sep10.js?v=2-postenter',
    './nuvem-pin-picker-v2.js?v=7-postenter-all-links',
    './collaborative-chat-postits-v2.js?v=4-postenter',
    './collaborative-postit-quick-actions-v1.js?v=3-postenter',
    './conversation-important-v2.js?v=6-postenter',
    './external-ui-controller.js?v=15-postenter',
    './external-profile-parity-v1.js?v=3-postenter',
    './social-theme-live-rescue-v1.js?v=2-postenter',
    './social-profile-theme-v2.js?v=4-postenter',
    './seasonal-theme-engine-v1.js?v=3-postenter',
    './video-call-background-v1.js?v=2-postenter',
    './call-manager.js?v=21-postenter',
    './message-reaction-delegate-v2.js?v=5-postenter',
    './isa-social-emoji-suite-v1.js?v=2-postenter',
    './family-social-extras-v1.js?v=3-postenter',
    './nossa-rede-birthday-bridge-v1.js?v=2-postenter',
    './nuvem-carousel-v1.js?v=8-postenter',
    './nossa-rede-media-workflow-v4.js?v=3-postenter',
    './nossa-rede-editor-make-addon-v1.js?v=2-postenter'
  ]
  // Carrega em pequenos lotes para não congelar o primeiro paint.
  for(let i=0;i<jobs.length;i+=4){await Promise.all(jobs.slice(i,i+4).map(load));await new Promise(r=>setTimeout(r,0))}
  try{
    await window.__ISA_EXTERNAL_PROFILE_PARITY__?.start?.()
    await window.__ISA_PROFILE_THEME_V2__?.loadState?.()
    window.__ISA_EXTERNAL_ACCESS_CONTROLS__?.scan?.()
    window.__ISA_BIND_EXTERNAL_SOCIAL_DIRECT__?.()
    window.__ISA_COLLAB_POSTITS__?.scan?.()
    window.__ISA_NUVEM_PIN_PICKER__?.scan?.()
    window.__ISA_PROFILE_THEME_V2__?.scan?.()
    window.__ISA_SEASONAL_THEME_ENGINE__?.refresh?.()
    window.__ISA_SOCIAL_EMOJI_SUITE__?.scan?.()
    window.__ISA_REACTION_DELEGATE_REFRESH__?.()
    window.__ISA_FAMILY_SOCIAL_EXTRAS__?.scan?.(true)
    window.__ISA_NOSSA_REDE_BIRTHDAYS__?.refresh?.()
    window.__ISA_NUVEM_CAROUSEL__?.scan?.()
    window.__ISA_NOSSA_REDE_MEDIA_WORKFLOW__?.scan?.()
    window.__ISA_PATCH_MEDIA_MAKE__?.()
  }catch(error){console.warn('[Cantinho externo] extras parciais:',error)}
  setTimeout(()=>load('./external-decoration-cleanup-v1.js?v=3-postenter'),100)
  setTimeout(()=>load('./nossa-rede-header-cleanup-v1.js?v=5-postenter'),180)
  setTimeout(()=>load('./external-progressive-loader.js?v=38-postenter'),320)
}

document.addEventListener('isa:friend-portal-entered',start,{once:true})
if(window.__ISA_FRIEND_PORTAL_ENTERED__===true)start()
window.__ISA_START_EXTERNAL_EXTRAS__=start
