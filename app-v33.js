// Compatibility entrypoint kept because index.html still references app-v33.js.
// The old bundled app duplicated the startup path. This file delegates to exactly one audited core.
(function(){
  'use strict'
  if(window.__ISA_APP_ENTRY_PROMISE__)return
  window.__ISA_APP_ENTRY_VERSION__='single-core-v4-authenticated-audit'
  window.__ISA_APP_ENTRY_PROMISE__=import('./app-core-single-v1.js?v=5-authenticated-boot-audit')
    .then(()=>window.__ISA_CORE_SINGLE_PROMISE__||true)
    .catch(error=>{
      window.__ISA_APP_ERROR__=String(error?.message||error||'Falha ao iniciar o Cantinho')
      console.error('[app-v33 bridge] núcleo único não carregou:',error)
      const guard=document.getElementById('personalBootGuard')
      const title=document.getElementById('personalBootTitle')
      if(title)title.textContent='Não foi possível abrir o Cantinho'
      const detail=guard?.querySelector('.guard-card p')
      if(detail)detail.textContent=window.__ISA_APP_ERROR__||'Atualize a página e tente novamente.'
      guard?.classList.remove('hidden')
      throw error
    })
})()
