// Watchdog dos links pessoais — V6.
// Keise, Isa e Alan só ficam prontos quando o dashboard FINAL aprovado estiver visível.
(function(){
  'use strict'
  if(window.__ISA_PERSONAL_BOOT_FAILOPEN_V6__)return
  window.__ISA_PERSONAL_BOOT_FAILOPEN_V6__=true

  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const APPROVED=new Set(['keise','isa','alan'])
  const requested=()=>norm(new URLSearchParams(location.search).get('perfil'))
  const identity=()=>norm($('myName')?.textContent)
  const profile=()=>{const r=requested(),n=identity();for(const p of APPROVED)if(r===p||n===p||n.startsWith(p+' '))return p;return''}
  const mainReady=()=>!!$('mainView')&&!$('mainView').classList.contains('hidden')
  const loginReady=()=>!!$('loginView')&&!$('loginView').classList.contains('hidden')
  const approvedHomeReady=()=>{
    const p=profile(),home=$('keiseApprovedHome'),top=$('keiseApprovedTopbar')
    if(!APPROVED.has(p)||!mainReady()||!home||home.classList.contains('hidden')||!top||top.classList.contains('hidden')||!document.body.classList.contains('keise-home-active'))return false
    if(p==='keise')return document.body.classList.contains('keise-approved-layout')
    return document.body.classList.contains('approved-family-dashboard')&&document.body.classList.contains(`approved-profile-${p}`)
  }
  const finalReady=()=>APPROVED.has(profile())?approvedHomeReady():mainReady()

  function hideGuard(){const g=$('personalBootGuard');if(g){g.classList.add('hidden');g.style.pointerEvents='none'}}
  function tryApproved(){
    const p=profile();if(!APPROVED.has(p))return false
    try{if(p==='keise')window.__ISA_SHOW_KEISE_HOME__?.();else window.__ISA_SHOW_APPROVED_PROFILE_HOME__?.()}catch{}
    try{window.__ISA_FINAL_SHELL__?.scan?.()}catch{}
    return approvedHomeReady()
  }
  function scan(){
    if(finalReady()){hideGuard();return true}
    if(loginReady()&&!mainReady()){hideGuard();return false}
    tryApproved();try{window.__ISA_FINAL_SHELL__?.scan?.()}catch{}
    return false
  }

  window.addEventListener('pageshow',scan)
  document.addEventListener('isa:final-shell-ready',scan)
  document.addEventListener('isa:approved-home-ready',scan)
  document.addEventListener('isa:keise-approved-home-built',scan)
  document.addEventListener('isa:early-boot-release',scan)
  document.addEventListener('isa:core-ready',scan)
  document.addEventListener('isa:core-boot-complete',scan)
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')scan()})
  setTimeout(scan,0);setTimeout(scan,500);setTimeout(scan,1400)

  setTimeout(()=>{
    if(finalReady()||loginReady()&&!mainReady()){hideGuard();return}
    tryApproved();setTimeout(()=>{if(finalReady())hideGuard();else try{window.__ISA_FINAL_SHELL__?.recover?.()}catch{}},800)
  },6500)

  // Nunca transforma a sidebar nativa em fallback visual. Se algo atrasar, apenas some o spinner.
  setTimeout(()=>{tryApproved();try{window.__ISA_FINAL_SHELL__?.scan?.()}catch{};hideGuard()},10500)

  window.__ISA_PERSONAL_BOOT_FAILOPEN__={release:scan,scan,approvedHomeReady,profile}
})()
