// Shell pessoal — V9 PASSIVO para Keise, Isa e Alan.
// Não constrói layout. Só libera o boot quando o dashboard FINAL aprovado do perfil estiver realmente visível.
(function(){
  'use strict'
  if(window.__ISA_FINAL_SHELL_BOOTSTRAP_V9__){window.__ISA_FINAL_SHELL__?.scan?.();return}
  window.__ISA_FINAL_SHELL_BOOTSTRAP_V9__=true

  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const APPROVED=new Set(['keise','isa','alan'])
  // approvedPanelBack e kaPanelBack são botões ATUAIS e nunca podem ser removidos aqui.
  const OBSOLETE_IDS=['approvedProfileHome','isaFinalShellShield','isaFinalShellShieldV2','isaApprovedShellShield','keiseDesktopTopbar','keiseHomeDashboard','isaKeiseApprovedGuard']
  let state='waiting',readySent=false,observer=null,timer=null,poll=null

  function requested(){const p=norm(new URLSearchParams(location.search).get('perfil'));return APPROVED.has(p)?p:''}
  function identified(){const n=norm($('myName')?.textContent);for(const p of APPROVED)if(n===p||n.startsWith(p+' '))return p;return''}
  function profile(){return requested()||identified()}
  function mainReady(){const m=$('mainView');return !!m&&!m.classList.contains('hidden')}
  function loginReady(){const l=$('loginView');return !!l&&!l.classList.contains('hidden')}
  function coreReady(){return window.__ISA_APP_READY__===true}
  function approvedReady(){
    const p=profile(),home=$('keiseApprovedHome'),top=$('keiseApprovedTopbar')
    if(!APPROVED.has(p)||!coreReady()||!mainReady()||!home||home.classList.contains('hidden')||!top||top.classList.contains('hidden')||!document.body.classList.contains('keise-home-active'))return false
    if(p==='keise')return document.body.classList.contains('keise-approved-layout')
    return document.body.classList.contains('approved-family-dashboard')&&document.body.classList.contains(`approved-profile-${p}`)
  }

  function cleanupOldShells(){
    document.body?.classList.remove('isa-current-shell')
    $('isaCurrentShellLockV4')?.remove()
    for(const id of OBSOLETE_IDS)$(id)?.remove()
  }
  function hideBootGuard(){
    const g=$('personalBootGuard');if(g){g.classList.add('hidden');g.style.pointerEvents='none'}
    try{window.__ISA_HIDE_BOOT_GUARD__?.()}catch{}
  }
  function stopWatching(){
    try{observer?.disconnect()}catch{}observer=null
    if(timer){clearTimeout(timer);timer=null}
    if(poll){clearInterval(poll);poll=null}
  }
  function emitReady(detail){
    if(state==='ready')return true
    state='ready';hideBootGuard();stopWatching()
    if(!readySent){
      readySent=true
      const d=detail||{profile:profile()||'family',version:'v9-all-approved'}
      document.dispatchEvent(new CustomEvent('isa:final-shell-ready',{detail:d}));window.dispatchEvent(new CustomEvent('isa:final-shell-ready',{detail:d}))
    }
    return true
  }
  function askApprovedHome(p){
    try{
      if(p==='keise')window.__ISA_SHOW_KEISE_HOME__?.()
      else if(p==='isa'||p==='alan')window.__ISA_SHOW_APPROVED_PROFILE_HOME__?.()
    }catch{}
  }
  function scan(){
    if(state==='ready')return true
    cleanupOldShells()
    if(loginReady()&&!mainReady()){state='login';hideBootGuard();return false}
    const p=profile()
    if(APPROVED.has(p)){
      if(approvedReady())return emitReady({profile:p,version:'v9-all-approved'})
      state=coreReady()?'waiting-approved':'waiting-core'
      if(coreReady())askApprovedHome(p)
      return false
    }
    if(mainReady()&&coreReady())return emitReady({profile:p||'family',version:'v9-all-approved'})
    state='waiting';return false
  }
  function schedule(delay=60){if(state==='ready'||timer)return;timer=setTimeout(()=>{timer=null;scan()},Math.max(0,delay))}

  cleanupOldShells()
  const app=$('app');if(app){observer=new MutationObserver(()=>schedule(90));observer.observe(app,{subtree:true,childList:true,attributes:true,attributeFilter:['class']})}
  window.addEventListener('pageshow',()=>schedule(10))
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule(30)})
  document.addEventListener('isa:keise-approved-home-built',()=>schedule(0))
  document.addEventListener('isa:approved-home-ready',()=>schedule(0))
  setTimeout(()=>schedule(0),0)
  poll=setInterval(()=>scan(),500)

  // Fail-open somente visual: tira o spinner, mas NUNCA libera o layout antigo como shell final.
  setTimeout(()=>{if(state!=='ready')hideBootGuard()},10000)

  window.__ISA_FINAL_SHELL__={scan,recover:scan,retry:()=>{schedule(0);return false},unlock:()=>{hideBootGuard();return scan()},getState:()=>state,isReady:()=>state==='ready',approvedReady,get state(){return state}}
})()
