/* Cantinho da Isa — compatibilidade do antigo estabilizador V11.
   A implementação que removia/reanexava todos os cards foi aposentada.
   As cirurgias V13/V15 preservam o motor e mantêm a interface aprovada estável. */
(function(){
  'use strict'
  if(window.__ISA_APPROVED_STABILITY_SHIM_V15__)return
  window.__ISA_APPROVED_STABILITY_SHIM_V15__=true
  import('./approved-conversation-surgery-v13.js?v=1-no-flicker-keyed').then(()=>{
    window.__ISA_APPROVED_CONVERSATION_SURGERY__?.start?.()
    window.__ISA_APPROVED_CONVERSATION_SURGERY__?.schedule?.(0)
  }).catch(error=>console.warn('Estabilidade do dashboard aprovado:',error))
  import('./approved-ui-surgery-v14.js?v=1-social-birthday-cover-chat-colors').then(()=>{
    window.__ISA_APPROVED_UI_SURGERY__?.scan?.()
  }).catch(error=>console.warn('Cirurgia visual do dashboard aprovado:',error))
  import('./approved-birthday-calendar-v15.js?v=2-all-family-birthdays').then(()=>{
    window.__ISA_APPROVED_BIRTHDAY_CALENDAR__?.refresh?.(true)
  }).catch(error=>console.warn('Calendário de aniversários aprovado:',error))
})();
