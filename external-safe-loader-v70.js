// Inicialização segura dos acessos externos.
// Nada pesado roda na tela de validação. Os recursos extras só entram depois de o familiar tocar em Acessar.
let started=false

async function load(path){
  try{return await import(path)}
  catch(error){console.warn('[Cantinho externo] módulo não carregou:',path,error);return null}
}

async function start(){
  if(started)return
  started=true

  // Primeiro: navegação essencial e Nossa Rede, sem bindings duplicados.
  await load('./external-social-entry-v2.js?v=70-single-social')
  await load('./external-ui-controller.js?v=10-portal-only')
  await load('./message-reaction-delegate-v2.js?v=4-portal-only')

  // Depois: aparência e recursos complementares.
  setTimeout(()=>load('./external-decoration-cleanup-v1.js?v=2-portal-only'),80)
  setTimeout(()=>load('./nossa-rede-header-cleanup-v1.js?v=2-portal-only'),140)
  setTimeout(()=>load('./external-progressive-loader.js?v=22-safe-portal'),220)
}

document.addEventListener('isa:friend-portal-entered',start,{once:true})
if(window.__ISA_FRIEND_PORTAL_ENTERED__===true)start()

window.__ISA_START_EXTERNAL_EXTRAS__=start
