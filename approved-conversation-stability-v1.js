// Compatibilidade da antiga camada de estabilização de conversas.
// A V10 já mantém um único espelho visível, atualizado por MutationObserver do #chatList.
(function(){
  'use strict'
  if(window.__ISA_APPROVED_CONVERSATION_STABILITY_V10__)return
  window.__ISA_APPROVED_CONVERSATION_STABILITY_V10__=true
  window.__ISA_APPROVED_CONVERSATION_STABILITY__=true
  window.__ISA_STABILIZE_APPROVED_CONVERSATIONS__=()=>{
    try{window.__ISA_NUVEM_PIN_PICKER__?.scan?.()}catch{}
    return true
  }
})();