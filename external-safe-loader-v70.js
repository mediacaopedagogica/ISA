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

async function start(){
  if(started)return
  started=true

  ensureHostCss()
  try{window.__ISA_BIND_EXTERNAL_SOCIAL_DIRECT__?.()}catch{}

  // Navegação base.
  await load('./external-ui-controller.js?v=14-profile-parity')

  // Perfil completo igual ao do link principal: Perfil + Curiosidades + Galeria + foto social independente.
  await load('./external-profile-parity-v1.js?v=1-keise-profile-parity')
  try{window.__ISA_EXTERNAL_PROFILE_PARITY__?.start?.()}catch{}

  await load('./message-reaction-delegate-v2.js?v=4-portal-only')

  // Aparência e recursos complementares entram depois, sem substituir a Nossa Rede atual.
  setTimeout(()=>load('./external-decoration-cleanup-v1.js?v=2-portal-only'),100)
  setTimeout(()=>load('./nossa-rede-header-cleanup-v1.js?v=4-all-family-final'),180)
  setTimeout(()=>load('./external-progressive-loader.js?v=26-profile-parity'),320)
}

document.addEventListener('isa:friend-portal-entered',start,{once:true})
if(window.__ISA_FRIEND_PORTAL_ENTERED__===true)start()

window.__ISA_START_EXTERNAL_EXTRAS__=start
