// Watchdog dos links pessoais aprovados.
// V3: observa a abertura e nunca reinicia o dashboard automaticamente em ciclos.
(function(){
  'use strict'
  if(window.__ISA_PERSONAL_BOOT_FAILOPEN_V3__)return
  window.__ISA_PERSONAL_BOOT_FAILOPEN_V3__=true

  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const approvedName=v=>['keise','isa','alan'].includes(norm(v))
  const requested=()=>norm(new URLSearchParams(location.search).get('perfil'))
  const identity=()=>norm($('myName')?.textContent)
  const approved=()=>approvedName(requested())||approvedName(identity())
  const finalReady=()=>!!$('keiseApprovedHome')&&!$('keiseApprovedHome').classList.contains('hidden')
  const mainReady=()=>!!$('mainView')&&!$('mainView').classList.contains('hidden')
  const loginReady=()=>!!$('loginView')&&!$('loginView').classList.contains('hidden')

  function hideGuard(){$('personalBootGuard')?.classList.add('hidden')}
  function scan(){
    if(finalReady()){hideGuard();return true}
    if(loginReady()&&!mainReady()){hideGuard();return false}
    if(!approved()&&!requested())return false
    // Apenas pede ao controlador único para observar o estado atual. Não cria um novo ciclo.
    window.__ISA_FINAL_SHELL__?.scan?.()
    return false
  }

  window.addEventListener('pageshow',scan)
  document.addEventListener('isa:final-shell-ready',scan)
  document.addEventListener('isa:early-boot-release',scan)
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')scan()})
  setTimeout(scan,0)
  // Depois de 12 s apenas mostra a opção de retry; não reinicia nada sozinho.
  setTimeout(()=>{
    if(finalReady()||loginReady()&&!mainReady())return
    window.__ISA_FINAL_SHELL__?.watchdog?.()
  },12000)

  window.__ISA_PERSONAL_BOOT_FAILOPEN__={release:scan,scan}
})()
