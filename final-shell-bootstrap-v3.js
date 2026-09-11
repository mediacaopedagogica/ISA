// Shell pessoal — V5: o layout aprovado da Keise volta a ser o dono visual.
// O app-v34 permanece somente como núcleo funcional por baixo.
(function(){
  'use strict'
  if(window.__ISA_FINAL_SHELL_BOOTSTRAP_V5__){window.__ISA_FINAL_SHELL__?.scan?.();return}
  window.__ISA_FINAL_SHELL_BOOTSTRAP_V5__=true

  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const APPROVED=new Set(['keise','isa','alan'])
  const OBSOLETE_IDS=['approvedProfileHome','approvedPanelBack','isaFinalShellShield','isaFinalShellShieldV2','isaApprovedShellShield','keiseDesktopTopbar','keiseHomeDashboard']
  let state='waiting',readySent=false,queued=false,observer=null,approvedAssetsRequested=false

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

  function removeWrongV4State(){
    $('isaCurrentShellLockV4')?.remove()
    document.body?.classList.remove('isa-current-shell')
    for(const id of OBSOLETE_IDS)$(id)?.remove()
  }

  function ensurePendingStyle(){
    if($('isaKeiseApprovedPendingStyle'))return
    const s=document.createElement('style');s.id='isaKeiseApprovedPendingStyle';s.textContent=`
      body.isa-keise-layout-pending #mainView:not(.hidden){visibility:hidden!important;opacity:0!important;pointer-events:none!important}
      #isaKeiseApprovedGuard{position:fixed;inset:0;z-index:140000;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 18% 14%,#fff0f6 0 18%,transparent 42%),radial-gradient(circle at 86% 12%,#eee4ff 0 18%,transparent 42%),#f8f2fb;color:#65536f;font-family:Inter,"Segoe UI",system-ui,sans-serif}
      #isaKeiseApprovedGuard .card{width:min(420px,94vw);padding:30px 26px;text-align:center;border-radius:28px;background:rgba(255,255,255,.9);border:1px solid rgba(255,255,255,.97);box-shadow:0 18px 48px rgba(95,70,110,.13)}
      #isaKeiseApprovedGuard .heart{font-size:44px;color:#dca7c9}#isaKeiseApprovedGuard .spin{width:34px;height:34px;border-radius:50%;border:4px solid #eadff3;border-top-color:#bca1e5;margin:18px auto 4px;animation:isaKeiseSpin .8s linear infinite}@keyframes isaKeiseSpin{to{transform:rotate(360deg)}}
    `;document.head.appendChild(s)
  }
  function showApprovedGuard(){
    if(!isKeise())return
    ensurePendingStyle();document.body.classList.add('isa-keise-layout-pending')
    if(!$('isaKeiseApprovedGuard')){
      const g=document.createElement('div');g.id='isaKeiseApprovedGuard';g.innerHTML='<div class="card"><div class="heart">♥</div><h2>Abrindo o Cantinho de Keise…</h2><p>Carregando seu layout e suas conversas.</p><div class="spin"></div></div>';document.body.appendChild(g)
    }
  }
  function hideApprovedGuard(){
    document.body?.classList.remove('isa-keise-layout-pending')
    $('isaKeiseApprovedGuard')?.remove()
    const g=$('personalBootGuard');if(g){g.classList.add('hidden');g.style.pointerEvents='none'}
    try{window.__ISA_HIDE_BOOT_GUARD__?.()}catch{}
  }

  function ensureApprovedAssets(){
    if(!isKeise()||approvedAssetsRequested)return
    approvedAssetsRequested=true
    if(!$('keiseApprovedFinalCssV5')){
      const l=document.createElement('link');l.id='keiseApprovedFinalCssV5';l.rel='stylesheet';l.href='./keise-approved-layout-final.css?v=4-approved-restore-20260911';document.head.appendChild(l)
    }
    if(!$('keiseApprovedFinalJsV5')){
      const s=document.createElement('script');s.id='keiseApprovedFinalJsV5';s.src='./keise-approved-layout-final.js?v=4-approved-restore-20260911';s.async=false;s.onload=()=>schedule();s.onerror=()=>{approvedAssetsRequested=false;s.remove();schedule()};document.head.appendChild(s)
    }
  }

  function emitReady(){
    state='ready';hideApprovedGuard()
    if(!readySent){
      readySent=true
      const detail={profile:'keise',version:'v5-approved-keise-home'}
      document.dispatchEvent(new CustomEvent('isa:final-shell-ready',{detail}));window.dispatchEvent(new CustomEvent('isa:final-shell-ready',{detail}))
    }
    return true
  }

  function recoverApprovedHome(){
    if(!isKeise())return false
    removeWrongV4State();showApprovedGuard();ensureApprovedAssets()
    if(mainReady()){
      try{window.__ISA_SHOW_KEISE_HOME__?.()}catch(e){console.warn('[shell v5] abrir home aprovada:',e)}
    }
    if(approvedReady())return emitReady()
    state='waiting-approved';return false
  }

  function scan(){
    removeWrongV4State()
    if(loginReady()&&!mainReady()){state='login';hideApprovedGuard();return false}
    if(isKeise())return recoverApprovedHome()
    // Outros perfis continuam no núcleo normal; este controlador não troca o layout deles.
    if(mainReady()){
      state='ready'
      const g=$('personalBootGuard');if(g){g.classList.add('hidden');g.style.pointerEvents='none'}
      return true
    }
    state='waiting';return false
  }
  function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;scan()})}

  removeWrongV4State()
  if(requested()==='keise')showApprovedGuard()
  const app=$('app')
  if(app){observer=new MutationObserver(()=>schedule());observer.observe(app,{subtree:true,childList:true,attributes:true,attributeFilter:['class']})}

  window.addEventListener('pageshow',schedule)
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule()})
  document.addEventListener('isa:core-ready',schedule)
  document.addEventListener('isa:core-boot-complete',schedule)
  document.addEventListener('isa:early-boot-release',schedule)
  setTimeout(schedule,0);setTimeout(schedule,180);setTimeout(schedule,550);setTimeout(schedule,1200);setTimeout(schedule,2400)

  // Segurança: nunca fica eternamente na tela de abertura.
  setTimeout(()=>{
    if(approvedReady()){emitReady();return}
    if(loginReady()&&!mainReady()){hideApprovedGuard();return}
    if(isKeise()){
      ensureApprovedAssets();try{window.__ISA_SHOW_KEISE_HOME__?.()}catch{}
      setTimeout(()=>{if(approvedReady())emitReady();else hideApprovedGuard()},1800)
    }else hideApprovedGuard()
  },8000)

  window.__ISA_FINAL_SHELL__={
    scan,recover:scan,retry:scan,
    unlock:()=>{if(isKeise())return recoverApprovedHome();hideApprovedGuard();return mainReady()},
    getState:()=>state,
    get state(){return state}
  }
})()
