// Watchdog dos links pessoais aprovados.
// Em caso de atraso, tenta novamente o dashboard final; nunca revela o layout legado.
(function(){
  'use strict'
  if(window.__ISA_PERSONAL_BOOT_FAILOPEN_V2__){window.__ISA_FINAL_SHELL__?.recover?.();return}
  window.__ISA_PERSONAL_BOOT_FAILOPEN_V2__=true
  const $=id=>document.getElementById(id)
  const personal=()=>String(new URLSearchParams(location.search).get('perfil')||'').trim().toLowerCase()
  const approved=()=>['keise','isa','alan'].includes(personal())
  const finalReady=()=>!!$('keiseApprovedHome')&&!$('keiseApprovedHome').classList.contains('hidden')
  const mainReady=()=>!!$('mainView')&&!$('mainView').classList.contains('hidden')
  const loginReady=()=>!!$('loginView')&&!$('loginView').classList.contains('hidden')

  function hideBootGuard(){ $('personalBootGuard')?.classList.add('hidden') }
  function keepLegacyLocked(){ if(approved())document.body?.classList.add('isa-approved-route-lock-v3') }
  function recover(reason='watchdog'){
    if(!approved())return
    keepLegacyLocked()
    console.warn('[boot pessoal] recuperação:',reason,window.__ISA_LAST_RUNTIME_ERROR__||'')
    if(finalReady()){hideBootGuard();$('isaFinalShellShieldV2')?.classList.add('hidden');return}
    if(loginReady()&&!mainReady()){
      // Sem sessão ativa, mostre o login normal. Não há dashboard antigo para revelar.
      hideBootGuard();$('isaFinalShellShieldV2')?.classList.add('hidden');return
    }
    window.__ISA_FINAL_SHELL__?.recover?.()
    document.dispatchEvent(new CustomEvent('isa:personal-boot-retry',{detail:{reason,error:window.__ISA_LAST_RUNTIME_ERROR__||''}}))
  }
  function scan(){
    if(!approved())return
    keepLegacyLocked()
    if(finalReady()){hideBootGuard();$('isaFinalShellShieldV2')?.classList.add('hidden')}
    else if(mainReady())window.__ISA_FINAL_SHELL__?.recover?.()
  }

  window.addEventListener('pageshow',scan)
  document.addEventListener('isa:final-shell-ready',scan)
  document.addEventListener('isa:early-boot-release',()=>recover('early watchdog'))
  scan()
  setTimeout(()=>recover('7s'),7000)
  setTimeout(()=>recover('12s'),12000)
  setTimeout(()=>recover('20s'),20000)
  window.__ISA_PERSONAL_BOOT_FAILOPEN__={release:recover,scan}
})()
