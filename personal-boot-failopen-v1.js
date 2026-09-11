// Watchdog dos links pessoais — single native shell.
// Não procura, cria ou reinicia dashboards paralelos.
(function(){
  'use strict'
  if(window.__ISA_PERSONAL_BOOT_FAILOPEN_V4__)return
  window.__ISA_PERSONAL_BOOT_FAILOPEN_V4__=true

  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const approvedName=v=>['keise','isa','alan'].includes(norm(v))
  const requested=()=>norm(new URLSearchParams(location.search).get('perfil'))
  const identity=()=>norm($('myName')?.textContent)
  const approved=()=>approvedName(requested())||approvedName(identity())
  const mainReady=()=>!!$('mainView')&&!$('mainView').classList.contains('hidden')
  const loginReady=()=>!!$('loginView')&&!$('loginView').classList.contains('hidden')
  const finalReady=()=>mainReady()&&(window.__ISA_FINAL_SHELL__?.getState?.()==='ready'||document.body.classList.contains('isa-current-shell'))

  function hideGuard(){const g=$('personalBootGuard');if(g){g.classList.add('hidden');g.style.pointerEvents='none'}}
  function scan(){
    if(finalReady()){hideGuard();return true}
    if(loginReady()&&!mainReady()){hideGuard();return false}
    if(!approved()&&!requested())return false
    window.__ISA_FINAL_SHELL__?.scan?.()
    return false
  }

  window.addEventListener('pageshow',scan)
  document.addEventListener('isa:final-shell-ready',scan)
  document.addEventListener('isa:early-boot-release',scan)
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')scan()})
  setTimeout(scan,0)
  setTimeout(()=>{
    if(finalReady()||loginReady()&&!mainReady()){hideGuard();return}
    window.__ISA_FINAL_SHELL__?.unlock?.();hideGuard()
  },7000)

  window.__ISA_PERSONAL_BOOT_FAILOPEN__={release:scan,scan}
})()
