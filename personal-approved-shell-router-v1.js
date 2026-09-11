// Compatibilidade do roteador antigo.
// A V10 possui um único listener de navegação dentro de keise-approved-layout-final.js.
(function(){
  'use strict'
  if(window.__ISA_PERSONAL_APPROVED_SHELL_ROUTER_COMPAT_V2__)return
  window.__ISA_PERSONAL_APPROVED_SHELL_ROUTER_COMPAT_V2__=true
  window.__ISA_APPROVED_HOME_RETURN__=(...args)=>window.__ISA_APPROVED_DASHBOARD__?.home?.(...args)??false
})();