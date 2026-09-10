// Watchdog dos links pessoais: a tela de carregamento nunca pode ficar eterna.
(function(){
  'use strict'
  if(window.__ISA_PERSONAL_BOOT_FAILOPEN_V1__)return
  window.__ISA_PERSONAL_BOOT_FAILOPEN_V1__=true
  const $=id=>document.getElementById(id)
  const personal=()=>new URLSearchParams(location.search).get('perfil')
  const finalReady=()=>!!$('keiseApprovedHome')&&!$('keiseApprovedHome').classList.contains('hidden')
  const mainReady=()=>!!$('mainView')&&!$('mainView').classList.contains('hidden')
  const loginReady=()=>!!$('loginView')&&!$('loginView').classList.contains('hidden')
  function hideAllGuards(){
    $('personalBootGuard')?.classList.add('hidden')
    $('isaFinalShellShield')?.classList.add('hidden')
    $('isaFinalShellShieldV2')?.classList.add('hidden')
    $('isaApprovedShellShield')?.classList.add('hidden')
  }
  function failOpen(reason='watchdog'){
    if(!personal())return
    console.warn('[boot pessoal] fail-open:',reason,window.__ISA_LAST_RUNTIME_ERROR__||'')
    document.body.classList.remove('isa-final-shell-managed','isa-approved-shell-lock')
    hideAllGuards()
    if(!mainReady()&&!loginReady())$('loginView')?.classList.remove('hidden')
    document.dispatchEvent(new CustomEvent('isa:personal-boot-released',{detail:{reason,error:window.__ISA_LAST_RUNTIME_ERROR__||''}}))
  }
  function scan(){
    if(!personal())return
    if(finalReady()||loginReady())hideAllGuards()
  }
  new MutationObserver(scan).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']})
  document.addEventListener('isa:final-shell-ready',hideAllGuards)
  window.addEventListener('pageshow',scan)
  scan()
  setTimeout(()=>{if(personal()&&!finalReady())failOpen(mainReady()?'dashboard não concluiu':'núcleo não abriu')},7000)
  setTimeout(()=>{if(personal()&&!finalReady()&&!loginReady())failOpen('watchdog final')},11000)
  window.__ISA_PERSONAL_BOOT_FAILOPEN__={release:failOpen,scan}
})()
