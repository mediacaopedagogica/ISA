// Watchdog dos links pessoais — V5.
// Para Keise, só considera concluído quando o dashboard aprovado estiver visível.
(function(){
  'use strict'
  if(window.__ISA_PERSONAL_BOOT_FAILOPEN_V5__)return
  window.__ISA_PERSONAL_BOOT_FAILOPEN_V5__=true

  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const requested=()=>norm(new URLSearchParams(location.search).get('perfil'))
  const identity=()=>norm($('myName')?.textContent)
  const mainReady=()=>!!$('mainView')&&!$('mainView').classList.contains('hidden')
  const loginReady=()=>!!$('loginView')&&!$('loginView').classList.contains('hidden')
  const isKeise=()=>requested()==='keise'||identity()==='keise'||identity().startsWith('keise ')
  const approvedHomeReady=()=>{
    const home=$('keiseApprovedHome')
    return isKeise()&&mainReady()&&!!home&&!home.classList.contains('hidden')&&document.body.classList.contains('keise-home-active')
  }
  const finalReady=()=>isKeise()?approvedHomeReady():mainReady()

  function hideGuard(){
    const g=$('personalBootGuard');if(g){g.classList.add('hidden');g.style.pointerEvents='none'}
    if(!isKeise())$('isaKeiseApprovedGuard')?.remove()
  }
  function tryApproved(){
    if(!isKeise())return false
    try{window.__ISA_SHOW_KEISE_HOME__?.()}catch{}
    try{window.__ISA_FINAL_SHELL__?.scan?.()}catch{}
    return approvedHomeReady()
  }
  function scan(){
    if(finalReady()){hideGuard();return true}
    if(loginReady()&&!mainReady()){hideGuard();return false}
    try{window.__ISA_FINAL_SHELL__?.scan?.()}catch{}
    return false
  }

  window.addEventListener('pageshow',scan)
  document.addEventListener('isa:final-shell-ready',scan)
  document.addEventListener('isa:early-boot-release',scan)
  document.addEventListener('isa:core-ready',scan)
  document.addEventListener('isa:core-boot-complete',scan)
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')scan()})
  setTimeout(scan,0);setTimeout(scan,600);setTimeout(scan,1600)

  setTimeout(()=>{
    if(finalReady()){hideGuard();return}
    if(loginReady()&&!mainReady()){hideGuard();return}
    if(isKeise()){
      tryApproved()
      setTimeout(()=>{
        if(approvedHomeReady()){hideGuard();return}
        try{window.__ISA_FINAL_SHELL__?.recover?.()}catch{}
        try{window.__ISA_SHOW_KEISE_HOME__?.()}catch{}
      },900)
    }else{
      try{window.__ISA_FINAL_SHELL__?.scan?.()}catch{}
      hideGuard()
    }
  },6500)

  // Último fail-open: evita spinner eterno, mas não transforma a sidebar nativa em layout aprovado.
  setTimeout(()=>{
    if(approvedHomeReady()||loginReady()&&!mainReady()){hideGuard();return}
    if(isKeise()){
      try{window.__ISA_SHOW_KEISE_HOME__?.()}catch{}
      try{window.__ISA_FINAL_SHELL__?.scan?.()}catch{}
      const g=$('personalBootGuard');if(g){g.classList.add('hidden');g.style.pointerEvents='none'}
      $('isaKeiseApprovedGuard')?.remove();document.body?.classList.remove('isa-keise-layout-pending')
    }else hideGuard()
  },10500)

  window.__ISA_PERSONAL_BOOT_FAILOPEN__={release:scan,scan,approvedHomeReady}
})()
