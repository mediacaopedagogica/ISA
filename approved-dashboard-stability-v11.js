/* Cantinho da Isa — compatibilidade do antigo estabilizador V11.
   A implementação que removia/reanexava todos os cards foi aposentada.
   A cirurgia V13 preserva os mesmos pontos de integração sem reconstruir a lista. */
(function(){
  'use strict'
  if(window.__ISA_APPROVED_STABILITY_SHIM_V13__)return
  window.__ISA_APPROVED_STABILITY_SHIM_V13__=true
  import('./approved-conversation-surgery-v13.js?v=1-no-flicker-keyed').then(()=>{
    window.__ISA_APPROVED_CONVERSATION_SURGERY__?.start?.()
    window.__ISA_APPROVED_CONVERSATION_SURGERY__?.schedule?.(0)
  }).catch(error=>console.warn('Estabilidade do dashboard aprovado:',error))
})();
