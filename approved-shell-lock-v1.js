// Compatibilidade do antigo lock visual.
// V10: o dashboard aprovado único controla Keise, Isa e Alan; este arquivo apenas reforça a ocultação do legado.
(function(){
  'use strict'
  if(window.__ISA_APPROVED_SHELL_LOCK_V10__)return
  window.__ISA_APPROVED_SHELL_LOCK_V10__=true
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const profile=()=>{const q=norm(new URLSearchParams(location.search).get('perfil')),n=norm(document.getElementById('myName')?.textContent);for(const p of ['keise','isa','alan'])if(q===p||n===p||n.startsWith(p+' '))return p;return''}
  function apply(){
    if(!profile())return false
    document.body.classList.add('isa-approved-shell-lock')
    let s=document.getElementById('isaApprovedShellLockCss')
    if(!s){s=document.createElement('style');s.id='isaApprovedShellLockCss';s.textContent=`body.isa-approved-shell-lock #mainView>.sidebar{display:none!important;visibility:hidden!important;width:0!important;min-width:0!important;max-width:0!important;pointer-events:none!important} body.isa-approved-shell-lock #emptyState{display:none!important}`;document.head.appendChild(s)}
    return true
  }
  apply()
  document.addEventListener('isa:approved-home-ready',apply)
  document.addEventListener('isa:core-ready',apply)
  window.__ISA_APPROVED_SHELL_LOCK__={apply,recover:()=>window.__ISA_APPROVED_DASHBOARD__?.home?.()??false}
})();