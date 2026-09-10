// Módulos secundários dos acessos externos: só entram DEPOIS da validação do link.
// Assim Nossa Rede, observadores e recursos visuais não conseguem interferir na tela de bootstrap.
(function(){
  if(window.__ISA_EXTERNAL_AFTER_ACCESS_V70__)return;
  window.__ISA_EXTERNAL_AFTER_ACCESS_V70__=true;
  let started=false;

  async function safe(src){
    try{return await import(src)}
    catch(error){console.warn('[acesso familiar] módulo secundário não carregou:',src,error);return null}
  }

  async function start(){
    if(started||window.__ISA_FRIEND_ACCESS_VALID__!==true)return;
    started=true;
    const modules=[
      './external-social-entry-v1.js?v=16-after-valid',
      './external-decoration-cleanup-v1.js?v=2-after-valid',
      './nossa-rede-header-cleanup-v1.js?v=2-after-valid',
      './external-ui-controller.js?v=10-after-valid',
      './external-social-hardbind-v1.js?v=2-after-valid',
      './message-reaction-delegate-v2.js?v=4-after-valid',
      './external-progressive-loader.js?v=22-after-valid'
    ];
    for(const src of modules)await safe(src);
    try{window.__ISA_BIND_EXTERNAL_SOCIAL_DIRECT__?.()}catch{}
    try{window.__ISA_REACTION_DELEGATE_REFRESH__?.()}catch{}
    try{window.__ISA_EXTERNAL_DECOR_CLEANUP__?.()}catch{}
  }

  if(window.__ISA_FRIEND_ACCESS_VALID__===true)start();
  document.addEventListener('isa:friend-access-valid',start,{once:true});
  document.addEventListener('isa:friend-portal-entered',start,{once:true});
  setTimeout(start,1200);
})();
