// Compatibility core for older cached app-v33 entrypoints.
// IMPORTANT: never rebuild the application from chunk text at runtime.
// The authoritative core is the prebuilt app-v34 bundle.
(function(){
  'use strict'
  if(window.__ISA_CORE_SINGLE_PROMISE__)return

  window.__ISA_CORE_SINGLE_VERSION__='direct-v34-compat-v1'
  window.__ISA_CORE_PHASE__='loading-direct-v34'
  try{document.dispatchEvent(new CustomEvent('isa:core-phase',{detail:{phase:'loading-direct-v34'}}))}catch{}

  window.__ISA_CORE_SINGLE_PROMISE__=new Promise((resolve,reject)=>{
    if(window.__ISA_SCRIPT_LOADED__){resolve(true);return}

    let script=document.querySelector('script[data-isa-direct-v34="1"]')
    if(script){
      script.addEventListener('load',()=>resolve(true),{once:true})
      script.addEventListener('error',()=>reject(new Error('Falha ao carregar app-v34.js')),{once:true})
      return
    }

    script=document.createElement('script')
    script.src='./app-v34.js?v=direct-recovery-20260911-01'
    script.async=false
    script.dataset.isaDirectV34='1'
    script.onload=()=>{
      window.__ISA_CORE_PHASE__='direct-v34-loaded'
      try{document.dispatchEvent(new CustomEvent('isa:core-phase',{detail:{phase:'direct-v34-loaded'}}))}catch{}
      resolve(true)
    }
    script.onerror=()=>reject(new Error('Falha ao carregar app-v34.js'))
    document.head.appendChild(script)
  }).catch(error=>{
    const message=String(error?.message||error||'Falha ao iniciar o Cantinho')
    window.__ISA_APP_ERROR__=message
    window.__ISA_CORE_FAILED_PHASE__='loading-direct-v34'
    window.__ISA_CORE_PHASE__='error'
    try{document.dispatchEvent(new CustomEvent('isa:core-error',{detail:{phase:'loading-direct-v34',message}}))}catch{}
    throw error
  })
})()
