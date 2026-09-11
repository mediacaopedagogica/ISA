// Compatibilidade do antigo roteador de conversas.
// A V10 usa somente o controlador do dashboard aprovado para Keise, Isa e Alan.
(function(){
  'use strict'
  if(window.__ISA_KEISE_CONVERSATION_ROUTER_COMPAT_V3__)return
  window.__ISA_KEISE_CONVERSATION_ROUTER_COMPAT_V3__=true
  window.__ISA_OPEN_KEISE_STABLE_CONVERSATION__=id=>window.__ISA_APPROVED_DASHBOARD__?.openConversation?.(id)??false
})();