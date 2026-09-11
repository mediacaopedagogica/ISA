// Compatibilidade: desde a V10, Keise, Isa e Alan usam o mesmo dashboard aprovado.
// Este arquivo não constrói interface e não cria observers/intervalos concorrentes.
(function(){
  'use strict'
  if(window.__ISA_APPROVED_PROFILE_DASHBOARD_COMPAT_V3__)return
  window.__ISA_APPROVED_PROFILE_DASHBOARD_COMPAT_V3__=true

  const home=(...args)=>window.__ISA_APPROVED_DASHBOARD__?.home?.(...args)??false
  const panel=(...args)=>window.__ISA_APPROVED_DASHBOARD__?.enterPanel?.(...args)??false
  const run=(...args)=>window.__ISA_APPROVED_DASHBOARD__?.runAction?.(...args)??false

  window.__ISA_SHOW_APPROVED_PROFILE_HOME__=home
  window.__ISA_APPROVED_PROFILE_ENTER_PANEL__=panel
  window.__ISA_APPROVED_PROFILE_RUN_ACTION__=run
  window.__ISA_APPROVED_PROFILE_DASHBOARD_V2__=true
})();