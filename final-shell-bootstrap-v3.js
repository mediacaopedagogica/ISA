// Shell pessoal — V4 estabilizado sobre o núcleo nativo v34.
// Não cria dashboard paralelo. O HTML nativo é o único shell visual/funcional.
(function(){
  'use strict'
  if(window.__ISA_FINAL_SHELL_BOOTSTRAP_V4__){window.__ISA_FINAL_SHELL__?.scan?.();return}
  window.__ISA_FINAL_SHELL_BOOTSTRAP_V4__=true

  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const APPROVED=new Set(['keise','isa','alan'])
  const LEGACY_IDS=['keiseApprovedTopbar','keiseApprovedHome','approvedProfileHome','approvedPanelBack','kaPanelBack','isaFinalShellShield','isaFinalShellShieldV2','isaApprovedShellShield']
  const LEGACY_CLASSES=['isa-shell-identity-gate','isa-approved-route-lock-v3','isa-approved-route-lock-v4','isa-approved-route-lock-v5','isa-approved-route-lock-v6','isa-approved-route-lock-v7','isa-approved-route-lock-v8','isa-approved-awaiting','isa-approved-ready','isa-final-shell-managed','isa-approved-shell-lock','isa-final-shell-v3-ready','keise-dashboard-mode','keise-home-active','keise-panel-active']
  let state='waiting',readySent=false,queued=false,observer=null

  function requested(){const p=norm(new URLSearchParams(location.search).get('perfil'));return APPROVED.has(p)?p:''}
  function identified(){
    const n=norm($('myName')?.textContent)
    for(const p of APPROVED)if(n===p||n.startsWith(p+' '))return p
    return''
  }
  function profile(){return requested()||identified()}
  function mainReady(){const m=$('mainView');return !!m&&!m.classList.contains('hidden')}
  function loginReady(){const l=$('loginView');return !!l&&!l.classList.contains('hidden')}

  function installCss(){
    if($('isaCurrentShellLockV4'))return
    const s=document.createElement('style');s.id='isaCurrentShellLockV4';s.textContent=`
      /* O dashboard central antigo nunca volta a ser uma camada visual. */
      #keiseApprovedTopbar,#approvedProfileHome,#approvedPanelBack,#kaPanelBack,#isaFinalShellShield,#isaFinalShellShieldV2,#isaApprovedShellShield{display:none!important;visibility:hidden!important;pointer-events:none!important}
      #keiseApprovedHome:not([data-current-shell-marker="1"]){display:none!important;visibility:hidden!important;pointer-events:none!important}
      #keiseApprovedHome[data-current-shell-marker="1"]{position:fixed!important;left:-9999px!important;top:-9999px!important;width:1px!important;height:1px!important;min-width:1px!important;min-height:1px!important;display:block!important;visibility:visible!important;opacity:0!important;overflow:hidden!important;pointer-events:none!important;padding:0!important;margin:0!important;border:0!important}
      body.isa-current-shell #mainView:not(.hidden){visibility:visible!important;opacity:1!important;pointer-events:auto!important}
      body.isa-current-shell #mainView>.sidebar,body.isa-current-shell #mainView>.content{visibility:visible!important;opacity:1!important;pointer-events:auto!important}
      body.isa-current-shell #personalBootGuard{pointer-events:none!important}
      @media(min-width:851px){
        body.isa-current-shell #mainView:not(.hidden){display:flex!important;width:100%!important;height:100dvh!important;min-height:100dvh!important;gap:14px!important;padding:14px!important;overflow:hidden!important}
        body.isa-current-shell #mainView>.sidebar{display:flex!important;flex-direction:column!important;flex:0 0 310px!important;width:310px!important;min-width:310px!important;max-width:310px!important;height:calc(100dvh - 28px)!important;max-height:calc(100dvh - 28px)!important;overflow:hidden!important}
        body.isa-current-shell #mainView>.content{display:block!important;position:relative!important;flex:1 1 auto!important;width:auto!important;min-width:0!important;height:calc(100dvh - 28px)!important;max-height:calc(100dvh - 28px)!important;overflow:hidden!important}
        body.isa-current-shell #chatList{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important}
        body.isa-current-shell #emptyState{width:min(520px,72%)!important;max-width:520px!important;min-height:240px!important;margin:auto!important;border-radius:30px!important}
      }
      @media(max-width:850px){
        body.isa-current-shell #chatList{overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;scrollbar-width:thin!important}
      }
    `
    document.head.appendChild(s)
  }

  function removeLegacyNodes(){
    for(const id of LEGACY_IDS){
      const el=$(id)
      if(!el)continue
      if(id==='keiseApprovedHome'&&el.dataset.currentShellMarker==='1')continue
      el.remove()
    }
  }

  function clearLegacyClasses(){
    const b=document.body;if(!b)return
    for(const c of LEGACY_CLASSES)b.classList.remove(c)
    b.classList.add('isa-current-shell')
  }

  function resetNativeInlineStyles(){
    const main=$('mainView'),side=main?.querySelector(':scope > .sidebar'),content=main?.querySelector(':scope > .content')
    for(const el of [main,side,content]){
      if(!el)continue
      for(const p of ['display','visibility','opacity','pointer-events','width','min-width','max-width','height','min-height','max-height','padding','margin','border','overflow','flex','position','inset','left','right','top','bottom'])el.style.removeProperty(p)
    }
    if(main){main.style.removeProperty('grid-template-columns');main.style.removeProperty('gap')}
  }

  // Compatibilidade temporária com o loader antigo do index: é só um marcador invisível,
  // não contém dashboard, botões, lista ou layout.
  function ensureReadyMarker(){
    let m=$('keiseApprovedHome')
    if(m&&m.dataset.currentShellMarker!=='1'){m.remove();m=null}
    if(!m){m=document.createElement('i');m.id='keiseApprovedHome';m.dataset.currentShellMarker='1';m.setAttribute('aria-hidden','true');document.body.appendChild(m)}
    return m
  }

  function hideGuard(){
    const g=$('personalBootGuard');if(g){g.classList.add('hidden');g.style.pointerEvents='none'}
    try{window.__ISA_HIDE_BOOT_GUARD__?.()}catch{}
  }

  function unlock(){
    installCss();removeLegacyNodes();clearLegacyClasses();resetNativeInlineStyles()
    for(const id of ['isaFinalShellShield','isaFinalShellShieldV2','isaApprovedShellShield'])$(id)?.remove()
    const main=$('mainView');if(main&&!main.classList.contains('hidden')){
      main.style.setProperty('pointer-events','auto','important')
      main.style.setProperty('visibility','visible','important')
      main.style.setProperty('opacity','1','important')
    }
  }

  function markReady(){
    unlock();ensureReadyMarker();hideGuard();state='ready'
    const p=profile()||'keise'
    if(!readySent){
      readySent=true
      const detail={profile:p,version:'v4-single-native-shell'}
      document.dispatchEvent(new CustomEvent('isa:final-shell-ready',{detail}))
      window.dispatchEvent(new CustomEvent('isa:final-shell-ready',{detail}))
    }
    return true
  }

  function scan(){
    unlock()
    if(loginReady()&&!mainReady()){state='login';hideGuard();return false}
    if(mainReady())return markReady()
    state='waiting';return false
  }
  function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;scan()})}

  installCss();clearLegacyClasses();removeLegacyNodes()
  const app=$('app')
  if(app){observer=new MutationObserver(muts=>{
    // Qualquer tentativa tardia de remontar o dashboard antigo é eliminada imediatamente.
    let legacyAdded=false
    for(const m of muts)for(const n of m.addedNodes||[]){
      if(n.nodeType!==1)continue
      if(LEGACY_IDS.includes(n.id)||n.querySelector?.('#keiseApprovedTopbar,#approvedProfileHome,#approvedPanelBack,#kaPanelBack')){legacyAdded=true;break}
    }
    if(legacyAdded)removeLegacyNodes()
    schedule()
  });observer.observe(app,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']})}

  window.addEventListener('pageshow',schedule)
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule()})
  document.addEventListener('isa:core-ready',schedule)
  document.addEventListener('isa:core-boot-complete',schedule)
  setTimeout(schedule,0);setTimeout(schedule,180);setTimeout(schedule,650);setTimeout(schedule,1600)

  // O guard nunca pode capturar a tela por tempo indefinido.
  setTimeout(()=>{if(mainReady())markReady();else if(loginReady())hideGuard();else hideGuard()},7000)

  window.__ISA_FINAL_SHELL__={
    scan,recover:scan,retry:scan,unlock,
    getState:()=>state,
    get state(){return state}
  }
})()