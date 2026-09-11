// Compatibility entrypoint kept because index.html still references app-v33.js.
// Recovery: use the stable direct bundled v34 boot. Do not rebuild/execute source chunks at runtime.
(function(){
  'use strict'
  if(window.__ISA_APP_ENTRY_PROMISE__)return

  window.__ISA_APP_ENTRY_VERSION__='direct-v34-recovery-v1'
  window.__ISA_CORE_PHASE__='loading-direct-v34'
  try{document.dispatchEvent(new CustomEvent('isa:core-phase',{detail:{phase:'loading-direct-v34'}}))}catch{}

  function showBootError(error){
    const message=String(error?.message||error||'Falha ao iniciar o Cantinho')
    window.__ISA_APP_ERROR__=message
    window.__ISA_CORE_PHASE__='error'
    window.__ISA_CORE_FAILED_PHASE__='loading-direct-v34'
    console.error('[app-v33 direct recovery] app-v34 não carregou:',error)
    try{document.dispatchEvent(new CustomEvent('isa:core-error',{detail:{phase:'loading-direct-v34',message}}))}catch{}

    const guard=document.getElementById('personalBootGuard')
    const title=document.getElementById('personalBootTitle')
    if(title)title.textContent='Não foi possível abrir o Cantinho'
    const detail=guard?.querySelector('.guard-card p')
    if(detail)detail.textContent='O núcleo principal não carregou. Tente novamente.'
    guard?.classList.remove('hidden')
  }

  window.__ISA_APP_ENTRY_PROMISE__=new Promise((resolve,reject)=>{
    // app-v34 marks this flag itself before starting its normal Supabase/session boot.
    if(window.__ISA_SCRIPT_LOADED__){
      window.__ISA_CORE_PHASE__='direct-v34-already-loaded'
      resolve(true)
      return
    }

    const existing=document.querySelector('script[data-isa-direct-v34="1"]')
    if(existing){
      existing.addEventListener('load',()=>resolve(true),{once:true})
      existing.addEventListener('error',()=>reject(new Error('Falha ao carregar app-v34.js')),{once:true})
      return
    }

    const script=document.createElement('script')
    script.src='./app-v34.js?v=direct-recovery-20260911-01'
    script.async=false
    script.dataset.isaDirectV34='1'
    script.onload=()=>{
      window.__ISA_CORE_PHASE__='direct-v34-loaded'
      try{document.dispatchEvent(new CustomEvent('isa:core-phase',{detail:{phase:'direct-v34-loaded'}}))}catch{}
      // app-v34 owns authentication, login button handlers and __ISA_APP_READY__.
      // Resolve only the loader; do not mark the app ready here.
      resolve(true)
    }
    script.onerror=()=>reject(new Error('Falha ao carregar app-v34.js'))
    document.head.appendChild(script)
  }).catch(error=>{
    showBootError(error)
    throw error
  })
})()
