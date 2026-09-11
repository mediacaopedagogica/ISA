// Cantinho da Isa — estabilizador CANÔNICO do dashboard aprovado.
// Keise, Isa e Alan usam um único shell visual; o motor legado permanece invisível.
(function(){
  'use strict'
  if(window.__ISA_APPROVED_STABILITY_V11__)return
  window.__ISA_APPROVED_STABILITY_V11__=true
  window.__ISA_APPROVED_CONVERSATION_STABILITY__=true

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

  let queued=false
  let observer=null

  function ensureCss(){
    if($('isaCanonicalDashboardGuardCss'))return
    const s=document.createElement('style')
    s.id='isaCanonicalDashboardGuardCss'
    s.textContent=`
      body.isa-approved-single-owner #mainView>.sidebar,
      body.isa-canonical-approved #mainView>.sidebar{
        display:none!important;visibility:hidden!important;opacity:0!important;
        pointer-events:none!important;width:0!important;min-width:0!important;max-width:0!important;
        overflow:hidden!important;position:absolute!important;left:-99999px!important
      }
      body.isa-canonical-approved #emptyState{display:none!important}
      body.isa-canonical-approved.keise-home-active #keiseApprovedTopbar,
      body.isa-canonical-approved.keise-home-active #keiseApprovedHome{
        display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important
      }
      body.isa-canonical-approved.keise-panel-active #keiseApprovedTopbar,
      body.isa-canonical-approved.keise-panel-active #keiseApprovedHome{display:none!important}
      body.isa-canonical-approved #keiseApprovedHome button,
      body.isa-canonical-approved #keiseApprovedTopbar button,
      body.isa-canonical-approved #kaConversationList .ka-conv-card{
        pointer-events:auto!important;touch-action:manipulation!important
      }
      body.isa-canonical-approved #mainView{visibility:visible!important;opacity:1!important}
    `
    document.head.appendChild(s)
  }

  function removeCompetitors(){
    document.querySelectorAll(
      '#keiseDesktopTopbar,#keiseHomeDashboard,.kd-side-menu,#approvedProfileHome,#approvedPanelBack,#kaPanelBack,#isaFinalShellShield,#isaFinalShellShieldV2,#isaApprovedShellShield,#isaKeiseApprovedGuard'
    ).forEach(el=>el.remove())
  }

  function enforce(){
    queued=false
    const p=profile()
    if(!APPROVED.has(p))return false
    ensureCss()
    const dash=window.__ISA_APPROVED_DASHBOARD__
    const main=$('mainView')
    if(!main||main.classList.contains('hidden'))return false

    document.body.classList.add('isa-approved-single-owner','isa-canonical-approved','keise-approved-layout',`approved-profile-${p}`)
    if(p!=='keise')document.body.classList.add('approved-family-dashboard')
    else document.body.classList.remove('approved-family-dashboard')

    removeCompetitors()

    const mode=dash?.mode||((document.body.classList.contains('keise-panel-active'))?'panel':'home')
    const home=$('keiseApprovedHome'),top=$('keiseApprovedTopbar')

    if(!home||!top){
      try{dash?.tryBuild?.()}catch{}
      return false
    }

    if(mode==='panel'){
      document.body.classList.remove('keise-home-active')
      document.body.classList.add('keise-panel-active')
      home.classList.add('hidden');top.classList.add('hidden')
    }else{
      document.body.classList.remove('keise-panel-active')
      document.body.classList.add('keise-home-active')
      home.classList.remove('hidden');top.classList.remove('hidden')
    }

    // Nenhum módulo tardio pode desabilitar os controles do dashboard aprovado.
    document.querySelectorAll('#keiseApprovedHome button,#keiseApprovedTopbar button').forEach(btn=>{
      if(btn.dataset.canonicalKeepDisabled!=='1')btn.disabled=false
      btn.style.removeProperty('pointer-events')
    })

    try{window.__ISA_NUVEM_PIN_PICKER__?.scan?.()}catch{}
    return true
  }

  function schedule(){
    if(queued)return
    queued=true
    requestAnimationFrame(enforce)
  }

  function startObserver(){
    if(observer)return
    const root=$('mainView')||document.body
    observer=new MutationObserver(mutations=>{
      // Só reage a mudanças estruturais/classes relevantes; não reconstrói o dashboard e não usa polling.
      if(mutations.some(m=>m.type==='childList'||(m.type==='attributes'&&m.attributeName==='class')))schedule()
    })
    observer.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class']})
  }

  for(const ev of ['isa:approved-home-ready','isa:keise-approved-home-built','isa:final-shell-ready','isa:core-ready']){
    document.addEventListener(ev,()=>{schedule();startObserver()})
  }
  window.addEventListener('pageshow',()=>{schedule();startObserver()},{once:true})

  window.__ISA_STABILIZE_APPROVED_CONVERSATIONS__=()=>{schedule();return true}
  window.__ISA_CANONICAL_DASHBOARD_GUARD__={enforce,schedule,profile}

  ensureCss();schedule();startObserver()
})();