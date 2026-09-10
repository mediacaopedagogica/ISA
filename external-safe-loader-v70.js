// Inicialização segura dos acessos externos.
// A entrada da Nossa Rede é carregada diretamente pelo HTML e continua leve.
let started=false

async function load(path){
  try{return await import(path)}
  catch(error){console.warn('[Cantinho externo] módulo não carregou:',path,error);return null}
}

async function start(){
  if(started)return
  started=true

  // Reforça o binding leve da Nossa Rede sem importar outra ponte.
  try{window.__ISA_BIND_EXTERNAL_SOCIAL_DIRECT__?.()}catch{}

  // Navegação e controles do portal só depois de a pessoa entrar.
  await load('./external-ui-controller.js?v=11-social-fixed')
  await load('./message-reaction-delegate-v2.js?v=4-portal-only')

  // Aparência e recursos complementares entram depois, sem bloquear a navegação.
  setTimeout(()=>load('./external-decoration-cleanup-v1.js?v=2-portal-only'),100)
  setTimeout(()=>load('./nossa-rede-header-cleanup-v1.js?v=2-portal-only'),180)
  setTimeout(()=>load('./external-progressive-loader.js?v=23-social-fixed'),320)
}

document.addEventListener('isa:friend-portal-entered',start,{once:true})
if(window.__ISA_FRIEND_PORTAL_ENTERED__===true)start()

window.__ISA_START_EXTERNAL_EXTRAS__=start
