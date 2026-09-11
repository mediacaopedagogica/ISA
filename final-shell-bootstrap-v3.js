// Shell pessoal — V8 PASSIVO.
// Não constrói layout, não esconde mainView e não cria overlay próprio.
// Apenas confirma quando o núcleo e o dashboard aprovado terminaram.
(function(){
  'use strict'
  if(window.__ISA_FINAL_SHELL_BOOTSTRAP_V8__){window.__ISA_FINAL_SHELL__?.scan?.();return}
  window.__ISA_FINAL_SHELL_BOOTSTRAP_V8__=true

  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const APPROVED=new Set(['keise','isa','alan'])
  const OBSOLETE_IDS=['approvedProfileHome','approvedPanelBack','isaFinalShellShield','isaFinalShellShieldV2','isaApprovedShellShield','keiseDesktopTopbar','keiseHomeDashboard','isaKeiseApprovedGuard']
  let state='waiting',readySent=false,observer=null,timer=null,poll=null

  function requested(){const p=norm(new URLSearchParams(location.search).get('perfil'));return APPROVED.has(p)?p:''}
  function identified(){const n=norm($('myName')?.textContent);for(const p of APPROVED)if(n===p||n.startsWith(p+' '))return p;return''}
  function profile(){return requested()||identified()}
  function isKeise(){return profile()==='keise'}
  function mainReady(){const m=$('mainView');return !!m&&!m.classList.contains('hidden')}
  function loginReady(){const l=$('loginView');return !!l&&!l.classList.contains('hidden')}
  function coreReady(){return window.__ISA_APP_READY__===true}
  function approvedReady(){
    const home=$('keiseApprovedHome')
    return isKeise()&&coreReady()&&mainReady()&&!!home&&!home.classList.contains('hidden')&&document.body.classList.contains('keise-home-active')
  }

  function cleanupOldShells(){
    document.body?.classList.remove('isa-current-shell','isa-keise-layout-pending')
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
      const d=detail||{profile:profile()||'family',version:'v8-passive-single-owner'}
      document.dispatchEvent(new CustomEvent('isa:final-shell-ready',{detail:d}));window.dispatchEvent(new CustomEvent('isa:final-shell-ready',{detail:d}))
    }
    return true
  }
  function scan(){
    if(state==='ready')return true
    cleanupOldShells()
    if(loginReady()&&!mainReady()){state='login';hideBootGuard();return false}
    if(isKeise()){
      if(approvedReady())return emitReady({profile:'keise',version:'v8-passive-single-owner'})
      state=coreReady()?'waiting-approved':'waiting-core'
      // O controlador aprovado é o único dono do DOM; aqui apenas pedimos que ele confira o estado.
      if(coreReady()&&typeof window.__ISA_SHOW_KEISE_HOME__==='function'){
        try{window.__ISA_SHOW_KEISE_HOME__()}catch{}
      }
      return false
    }
    if(mainReady()&&coreReady())return emitReady({profile:profile()||'family',version:'v8-passive-single-owner'})
    state='waiting';return false
  }
  function schedule(delay=60){if(state==='ready'||timer)return;timer=setTimeout(()=>{timer=null;scan()},Math.max(0,delay))}

  cleanupOldShells()
  const app=$('app');if(app){observer=new MutationObserver(()=>schedule(80));observer.observe(app,{subtree:true,childList:true,attributes:true,attributeFilter:['class']})}
  window.addEventListener('pageshow',()=>schedule(10))
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule(30)})
  document.addEventListener('isa:keise-approved-home-built',()=>schedule(0))
  setTimeout(()=>schedule(0),0)
  poll=setInterval(()=>scan(),450)

  // Fail-open visual apenas remove o spinner. Nunca substitui o dashboard por layout antigo.
  setTimeout(()=>{if(state!=='ready')hideBootGuard()},10000)

  window.__ISA_FINAL_SHELL__={scan,recover:scan,retry:()=>{schedule(0);return false},unlock:()=>{hideBootGuard();return scan()},getState:()=>state,isReady:()=>state==='ready',get state(){return state}}
})()