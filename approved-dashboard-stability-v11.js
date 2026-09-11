/* Cantinho da Isa — compatibilidade do antigo estabilizador V11.
   A implementação que removia/reanexava todos os cards foi aposentada.
   As cirurgias V13/V15 preservam o motor e mantêm a interface aprovada estável. */
(function(){
  'use strict'
  if(window.__ISA_APPROVED_STABILITY_SHIM_V17__)return
  window.__ISA_APPROVED_STABILITY_SHIM_V17__=true

  // Primeiro fixa o roteamento pelo nome visível + UUID exato.
  // Se um renderer antigo deixar título e UUID desencontrados, a pessoa escrita no card tem prioridade.
  import('./keise-conversation-router-v2.js?v=5-title-uuid-exact-lock').then(()=>{
    window.__ISA_CONVERSATION_ROUTER_SAFETY__?.sanitize?.()
  }).catch(error=>console.warn('Roteamento exato das conversas:',error))

  import('./approved-conversation-surgery-v13.js?v=2-exact-id-lock').then(()=>{
    window.__ISA_APPROVED_CONVERSATION_SURGERY__?.start?.()
    window.__ISA_APPROVED_CONVERSATION_SURGERY__?.schedule?.(0)
    setTimeout(()=>window.__ISA_CONVERSATION_ROUTER_SAFETY__?.sanitize?.(),0)
  }).catch(error=>console.warn('Estabilidade do dashboard aprovado:',error))

  import('./approved-ui-surgery-v14.js?v=1-social-birthday-cover-chat-colors').then(()=>{
    window.__ISA_APPROVED_UI_SURGERY__?.scan?.()
  }).catch(error=>console.warn('Cirurgia visual do dashboard aprovado:',error))

  import('./approved-birthday-calendar-v15.js?v=2-all-family-birthdays').then(()=>{
    window.__ISA_APPROVED_BIRTHDAY_CALENDAR__?.refresh?.(true)
  }).catch(error=>console.warn('Calendário de aniversários aprovado:',error))
})();
