// Cantinho da Isa — compatibilidade + guarda antecipada do dashboard CANÔNICO.
// Keise, Isa e Alan nunca podem exibir o dashboard legado como interface visível.
(function(){
  'use strict'
  if(window.__ISA_APPROVED_PROFILE_DASHBOARD_COMPAT_V11__)return
  window.__ISA_APPROVED_PROFILE_DASHBOARD_COMPAT_V11__=true

  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const APPROVED=new Set(['keise','isa','alan'])
  const requested=()=>norm(new URLSearchParams(location.search).get('perfil'))
  const identified=()=>norm($('myName')?.textContent)
  const profile=()=>{
    const q=requested(),n=identified()
    for(const p of APPROVED)if(q===p||n===p||n.startsWith(p+' '))return p
    return''
  }

  const home=(...args)=>window.__ISA_APPROVED_DASHBOARD__?.home?.(...args)??false
  const panel=(...args)=>window.__ISA_APPROVED_DASHBOARD__?.enterPanel?.(...args)??false
  const run=(...args)=>window.__ISA_APPROVED_DASHBOARD__?.runAction?.(...args)??false

  window.__ISA_SHOW_APPROVED_PROFILE_HOME__=home
  window.__ISA_APPROVED_PROFILE_ENTER_PANEL__=panel
  window.__ISA_APPROVED_PROFILE_RUN_ACTION__=run
  window.__ISA_APPROVED_PROFILE_DASHBOARD_V2__=true

  let socialPreloaded=false
  function preloadSocial(p){
    if(socialPreloaded||!APPROVED.has(p))return
    const main=$('mainView');if(!main||main.classList.contains('hidden'))return
    socialPreloaded=true
    import('./social-network-stable-v9.js?v=1-final-only').catch(()=>{socialPreloaded=false})
  }

  function installCss(){
    if($('approvedCanonicalEarlyLock'))return
    const s=document.createElement('style')
    s.id='approvedCanonicalEarlyLock'
    s.textContent=`
      body.approved-canonical-lock #mainView>.sidebar{
        display:none!important;visibility:hidden!important;opacity:0!important;
        pointer-events:none!important;width:0!important;min-width:0!important;max-width:0!important;
        position:absolute!important;left:-99999px!important;overflow:hidden!important
      }
      body.approved-canonical-lock #emptyState{display:none!important}
      body.approved-canonical-lock.keise-home-active #keiseApprovedHome,
      body.approved-canonical-lock.keise-home-active #keiseApprovedTopbar{
        visibility:visible!important;opacity:1!important;pointer-events:auto!important
      }
      body.approved-canonical-lock:not(.keise-panel-active) #mainView>.content{
        margin:0!important;width:100%!important;max-width:none!important
      }
    `
    document.head.appendChild(s)
  }

  function cleanLegacy(){
    document.querySelectorAll('#keiseDesktopTopbar,#keiseHomeDashboard,.kd-side-menu,#approvedProfileHome,#approvedPanelBack,#kaPanelBack,#isaFinalShellShield,#isaFinalShellShieldV2,#isaApprovedShellShield,#isaKeiseApprovedGuard').forEach(el=>el.remove())
  }

  let queued=false,obs=null
  function enforce(){
    queued=false
    const p=profile();if(!APPROVED.has(p))return false
    installCss()
    document.body.classList.add('approved-canonical-lock','isa-approved-single-owner','keise-approved-layout',`approved-profile-${p}`)
    if(p!=='keise')document.body.classList.add('approved-family-dashboard');else document.body.classList.remove('approved-family-dashboard')
    cleanLegacy()
    const main=$('mainView');if(!main||main.classList.contains('hidden'))return false
    preloadSocial(p)
    const dash=window.__ISA_APPROVED_DASHBOARD__
    const h=$('keiseApprovedHome'),t=$('keiseApprovedTopbar')
    if(!h||!t){try{dash?.tryBuild?.()}catch{};return false}
    const mode=dash?.mode||'home'
    if(mode==='home'){
      document.body.classList.remove('keise-panel-active');document.body.classList.add('keise-home-active')
      h.classList.remove('hidden');t.classList.remove('hidden')
    }else{
      document.body.classList.remove('keise-home-active');document.body.classList.add('keise-panel-active')
      h.classList.add('hidden');t.classList.add('hidden')
    }
    return true
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(enforce)}
  function observe(){
    if(obs)return
    const root=$('app')||document.documentElement
    obs=new MutationObserver(ms=>{if(ms.some(m=>m.type==='childList'||(m.type==='attributes'&&m.attributeName==='class')))schedule()})
    obs.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class']})
  }

  for(const ev of ['isa:core-ready','isa:core-boot-complete','isa:approved-home-ready','isa:keise-approved-home-built','isa:final-shell-ready'])document.addEventListener(ev,schedule)
  window.addEventListener('pageshow',schedule,{once:true})
  installCss();observe();schedule()
  window.__ISA_APPROVED_CANONICAL_LOCK__={enforce,schedule,profile}
})();

import('./approved-dashboard-stability-v11.js?v=1-stable-order-avatar-social').catch(()=>{})
