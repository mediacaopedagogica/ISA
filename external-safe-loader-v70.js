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

// Estes recursos precisam existir ANTES do usuário tocar em Acessar/Nossa Rede.
ensureHostCss()
load('./external-enter-rescue-v77.js?v=2-enter-final')
load('./conversation-important-v2.js?v=2-share-move-live')

async function start(){
  if(started)return
  started=true

  ensureHostCss()
  try{window.__ISA_BIND_EXTERNAL_SOCIAL_DIRECT__?.()}catch{}

  // Navegação base.
  await load('./external-ui-controller.js?v=14-profile-parity')

  // Perfil completo igual ao do link principal: Perfil + Curiosidades + Galeria + foto social independente.
  await load('./external-profile-parity-v1.js?v=2-keise-profile-parity')
  try{await window.__ISA_EXTERNAL_PROFILE_PARITY__?.start?.()}catch(error){console.warn('[Cantinho externo] perfil completo não terminou de carregar',error)}

  // Mesmas reações do Isa Chat no chat e na Nossa Rede.
  await load('./message-reaction-delegate-v2.js?v=4-expanded-emotions')
  await load('./isa-social-emoji-suite-v1.js?v=1-full-isa-chat-emojis')
  try{window.__ISA_SOCIAL_EMOJI_SUITE__?.scan?.();window.__ISA_REACTION_DELEGATE_REFRESH__?.()}catch{}

  // Extras reais da Nossa Rede: stories 24h, capa própria, localização/mapa, efeitos e temas sazonais.
  await load('./family-social-extras-v1.js?v=2-live-social-extras')
  await load('./nossa-rede-birthday-bridge-v1.js?v=1-live-birthdays')
  try{window.__ISA_FAMILY_SOCIAL_EXTRAS__?.scan?.(true);window.__ISA_NOSSA_REDE_BIRTHDAYS__?.refresh?.()}catch{}

  // Aparência e recursos complementares entram depois, sem substituir a Nossa Rede atual.
  setTimeout(()=>load('./external-decoration-cleanup-v1.js?v=2-portal-only'),100)
  setTimeout(()=>load('./nossa-rede-header-cleanup-v1.js?v=4-all-family-final'),180)
  setTimeout(()=>load('./external-progressive-loader.js?v=29-birthdays-social-extras'),320)
}

document.addEventListener('isa:friend-portal-entered',start,{once:true})
if(window.__ISA_FRIEND_PORTAL_ENTERED__===true)start()

window.__ISA_START_EXTERNAL_EXTRAS__=start
