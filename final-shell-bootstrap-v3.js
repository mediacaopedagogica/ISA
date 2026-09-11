// Shell pessoal — V7: o dashboard aprovado da Keise é carregado diretamente depois do núcleo.
// Este controlador só observa/valida; não injeta uma segunda cópia concorrente do layout.
(function(){
  'use strict'
  if(window.__ISA_FINAL_SHELL_BOOTSTRAP_V7__){window.__ISA_FINAL_SHELL__?.scan?.();return}
  window.__ISA_FINAL_SHELL_BOOTSTRAP_V7__=true

  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const APPROVED=new Set(['keise','isa','alan'])
  const OBSOLETE_IDS=['approvedProfileHome','approvedPanelBack','isaFinalShellShield','isaFinalShellShieldV2','isaApprovedShellShield','keiseDesktopTopbar','keiseHomeDashboard']
  let state='waiting',readySent=false,observer=null,timer=null,poll=null,cleanupDone=false,activateBusy=false

  function requested(){const p=norm(new URLSearchParams(location.search).get('perfil'));return APPROVED.has(p)?p:''}
  function identified(){const n=norm($('myName')?.textContent);for(const p of APPROVED)if(n===p||n.startsWith(p+' '))return p;return''}
  function profile(){return requested()||identified()}
  function isKeise(){return profile()==='keise'}
  function mainReady(){const m=$('mainView');return !!m&&!m.classList.contains('hidden')}
  function loginReady(){const l=$('loginView');return !!l&&!l.classList.contains('hidden')}
  function approvedReady(){
    const home=$('keiseApprovedHome')
    return isKeise()&&mainReady()&&!!home&&!home.classList.contains('hidden')&&document.body.classList.contains('keise-home-active')
  }

  function cleanupOldShells(){
    if(cleanupDone)return
    cleanupDone=true
    $('isaCurrentShellLockV4')?.remove()
    document.body?.classList.remove('isa-current-shell')
    for(const id of OBSOLETE_IDS)$(id)?.remove()
  }
  function ensureCss(){
    if($('keiseApprovedFinalCssV7'))return
    const l=document.createElement('link');l.id='keiseApprovedFinalCssV7';l.rel='stylesheet';l.href='./keise-approved-layout-final.css?v=7-direct-after-core';document.head.appendChild(l)
  }
  function ensurePendingStyle(){
    if($('isaKeiseApprovedPendingStyle'))return
    const s=document.createElement('style');s.id='isaKeiseApprovedPendingStyle';s.textContent=`
      body.isa-keise-layout-pending #mainView:not(.hidden){visibility:hidden!important;opacity:0!important;pointer-events:none!important}
      #isaKeiseApprovedGuard{position:fixed;inset:0;z-index:140000;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 18% 14%,#fff0f6 0 18%,transparent 42%),radial-gradient(circle at 86% 12%,#eee4ff 0 18%,transparent 42%),#f8f2fb;color:#65536f;font-family:Inter,"Segoe UI",system-ui,sans-serif}
      #isaKeiseApprovedGuard .card{width:min(420px,94vw);padding:30px 26px;text-align:center;border-radius:28px;background:rgba(255,255,255,.9);border:1px solid rgba(255,255,255,.97);box-shadow:0 18px 48px rgba(95,70,110,.13)}
      #isaKeiseApprovedGuard .heart{font-size:44px;color:#dca7c9}
      #isaKeiseApprovedGuard .spin{width:34px;height:34px;border-radius:50%;border:4px solid #eadff3;border-top-color:#bca1e5;margin:18px auto 4px;animation:isaKeiseSpin .8s linear infinite}
      @keyframes isaKeiseSpin{to{transform:rotate(360deg)}}
    `;document.head.appendChild(s)
  }
  function showGuard(){
    if(!isKeise()||state==='ready')return
    ensurePendingStyle();document.body.classList.add('isa-keise-layout-pending')
    if(!$('isaKeiseApprovedGuard')){
      const g=document.createElement('div');g.id='isaKeiseApprovedGuard';g.innerHTML='<div class="card"><div class="heart">♥</div><h2>Abrindo o Cantinho de Keise…</h2><p>Carregando seu layout e suas conversas.</p><div class="spin"></div></div>';document.body.appendChild(g)
    }
  }
  function hideGuard(){
    document.body?.classList.remove('isa-keise-layout-pending')
    $('isaKeiseApprovedGuard')?.remove()
    const g=$('personalBootGuard');if(g){g.classList.add('hidden');g.style.pointerEvents='none'}
    try{window.__ISA_HIDE_BOOT_GUARD__?.()}catch{}
  }
  function stopWatching(){
    try{observer?.disconnect()}catch{}observer=null
    if(timer){clearTimeout(timer);timer=null}
    if(poll){clearInterval(poll);poll=null}
  }
  function emitReady(){
    if(state==='ready')return true
    state='ready';hideGuard();stopWatching()
    if(!readySent){
      readySent=true
      const detail={profile:'keise',version:'v7-direct-approved-home'}
      document.dispatchEvent(new CustomEvent('isa:final-shell-ready',{detail}));window.dispatchEvent(new CustomEvent('isa:final-shell-ready',{detail}))
    }
    return true
  }

  function forceExistingApprovedHome(){
    const home=$('keiseApprovedHome');if(!home||!mainReady())return false
    document.body.classList.add('keise-approved-layout','keise-dashboard-mode','keise-home-active')
    document.body.classList.remove('keise-panel-active')
    home.classList.remove('hidden')
    $('keiseApprovedTopbar')?.classList.remove('hidden')
    $('kaPanelBack')?.classList.add('hidden')
    const main=$('mainView'),sidebar=main?.querySelector(':scope > .sidebar')||main?.querySelector('.sidebar')
    if(sidebar){sidebar.style.setProperty('display','none','important');sidebar.style.setProperty('visibility','hidden','important');sidebar.style.setProperty('pointer-events','none','important')}
    return true
  }
  function activateApproved(){
    if(state==='ready'||activateBusy||!mainReady())return approvedReady()
    if(approvedReady())return emitReady()
    activateBusy=true
    try{
      if(typeof window.__ISA_SHOW_KEISE_HOME__==='function')window.__ISA_SHOW_KEISE_HOME__()
      if(!approvedReady())forceExistingApprovedHome()
    }catch(e){console.warn('[shell v7] abrir home aprovada:',e)}finally{activateBusy=false}
    if(approvedReady())return emitReady()
    return false
  }
  function scan(){
    if(state==='ready')return true
    cleanupOldShells();ensureCss()
    if(loginReady()&&!mainReady()){state='login';hideGuard();return false}
    if(!isKeise()){
      if(mainReady()){state='ready';hideGuard();stopWatching();return true}
      state='waiting';return false
    }
    showGuard()
    if(approvedReady())return emitReady()
    if(!mainReady()){state='waiting-core';return false}
    state='waiting-approved';activateApproved();return approvedReady()
  }
  function schedule(delay=80){if(state==='ready'||timer)return;timer=setTimeout(()=>{timer=null;scan()},Math.max(0,delay))}

  cleanupOldShells();ensureCss();if(requested()==='keise')showGuard()
  const app=$('app');if(app){observer=new MutationObserver(()=>schedule(100));observer.observe(app,{subtree:true,childList:true,attributes:true,attributeFilter:['class']})}
  window.addEventListener('pageshow',()=>schedule(20))
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule(40)})
  document.addEventListener('isa:core-ready',()=>schedule(20))
  document.addEventListener('isa:core-boot-complete',()=>schedule(20))
  document.addEventListener('isa:early-boot-release',()=>schedule(20))
  document.addEventListener('isa:keise-approved-home-built',()=>schedule(0))
  setTimeout(()=>schedule(0),0)
  poll=setInterval(()=>{if(state==='ready'){stopWatching();return}scan()},650)

  // Nunca deixa o overlay rodar para sempre.
  setTimeout(()=>{
    if(state==='ready'||!isKeise())return
    if(approvedReady()){emitReady();return}
    if(mainReady()&&$('keiseApprovedHome')){forceExistingApprovedHome();if(approvedReady()){emitReady();return}}
    hideGuard();state='degraded'
  },7500)

  window.__ISA_FINAL_SHELL__={scan,recover:scan,retry:()=>{schedule(0);return false},unlock:()=>{if(approvedReady())return emitReady();hideGuard();return mainReady()},getState:()=>state,isReady:()=>state==='ready',get state(){return state}}
})()
