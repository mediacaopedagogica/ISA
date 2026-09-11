// Bootstrap determinístico dos dashboards pessoais aprovados.
// V8: o layout legado fica invisível até a identidade ser conhecida e o painel aprovado
// é montado assim que o núcleo libera mainView, sem depender do fim de todos os extras.
(function(){
  'use strict'
  if(window.__ISA_FINAL_SHELL_BOOTSTRAP_V8__){window.__ISA_FINAL_SHELL__?.scan?.();return}
  window.__ISA_FINAL_SHELL_BOOTSTRAP_V8__=true

  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const wait=ms=>new Promise(r=>setTimeout(r,ms))
  const APPROVED=new Set(['keise','isa','alan'])
  const DISPLAY={keise:'Keise',isa:'Isa',alan:'Alan'}
  let state='identity',lastError='',failedPhase='',bootPromise=null,modulePromise=null,moduleProfile='',scanQueued=false,identityTimer=0,readyEventSent=false

  function requestedProfile(){const p=norm(new URLSearchParams(location.search).get('perfil'));return APPROVED.has(p)?p:''}
  function identityProfile(){
    const n=norm($('myName')?.textContent)
    for(const p of APPROVED)if(n===p||n.startsWith(p+' '))return p
    return''
  }
  function profile(){return requestedProfile()||identityProfile()}
  const mainReady=()=>!!$('mainView')&&!$('mainView').classList.contains('hidden')
  const loginReady=()=>!!$('loginView')&&!$('loginView').classList.contains('hidden')
  const finalHome=()=>$('keiseApprovedHome')
  const finalReady=()=>!!finalHome()&&!finalHome().classList.contains('hidden')

  function installCss(){
    if($('isaFinalShellBootstrapCssV8'))return
    const s=document.createElement('style');s.id='isaFinalShellBootstrapCssV8';s.textContent=`
      body.isa-shell-identity-gate #mainView{visibility:hidden!important;opacity:0!important;pointer-events:none!important}
      body.isa-approved-route-lock-v8.isa-approved-awaiting #mainView{visibility:hidden!important;opacity:0!important;pointer-events:none!important}
      body.isa-approved-route-lock-v8.isa-approved-ready #mainView{visibility:visible!important;opacity:1!important;pointer-events:auto!important}
      body.isa-approved-route-lock-v8 #mainView>.sidebar{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;width:0!important;min-width:0!important;max-width:0!important;padding:0!important;margin:0!important;border:0!important;overflow:hidden!important}
      body.isa-approved-route-lock-v8 #emptyState{display:none!important;visibility:hidden!important;pointer-events:none!important}
      body.isa-approved-route-lock-v8:not(.keise-panel-active) #mainView>.content>section:not(#keiseApprovedHome){display:none!important;visibility:hidden!important;pointer-events:none!important}
      #personalBootRetryV8{margin-top:14px;border:0;border-radius:14px;padding:10px 17px;background:linear-gradient(135deg,#efa8d0,#bda7ef);color:#fff;font:800 12px/1 Inter,"Segoe UI",sans-serif;cursor:pointer;box-shadow:0 8px 18px rgba(126,90,153,.18)}
      #personalBootRetryV8[hidden]{display:none!important}
      #personalBootDiagnosticV8{display:none;margin-top:9px;color:#9b879f;font:600 10px/1.35 Inter,"Segoe UI",sans-serif;word-break:break-word}
      #personalBootGuard.isa-boot-error #personalBootDiagnosticV8{display:block}
    `
    document.head.appendChild(s)
  }

  function cleanupOldLocks(){
    document.body?.classList.remove('isa-approved-route-lock-v3','isa-approved-route-lock-v4','isa-approved-route-lock-v5','isa-approved-route-lock-v6','isa-approved-route-lock-v7','isa-final-shell-managed','isa-approved-shell-lock')
    $('isaFinalShellShieldV2')?.remove()
  }
  function guard(){return $('personalBootGuard')}
  function ensureGuardControls(){
    const card=guard()?.querySelector('.guard-card');if(!card)return{}
    let d=$('personalBootDiagnosticV8');if(!d){d=document.createElement('div');d.id='personalBootDiagnosticV8';card.appendChild(d)}
    let b=$('personalBootRetryV8');if(!b){b=document.createElement('button');b.id='personalBootRetryV8';b.type='button';b.hidden=true;b.textContent='Tentar novamente';b.addEventListener('click',()=>retry());card.appendChild(b)}
    return{button:b,diagnostic:d}
  }
  function showGuard(title='Abrindo seu Cantinho…',detail='Carregando suas conversas com segurança.',retryVisible=false){
    const g=guard();if(!g)return
    g.classList.remove('hidden');g.classList.toggle('isa-boot-error',retryVisible)
    const t=$('personalBootTitle');if(t)t.textContent=title
    const p=g.querySelector('.guard-card p');if(p)p.textContent=detail
    const spin=g.querySelector('.guard-spinner');if(spin)spin.style.display=retryVisible?'none':''
    const {button,diagnostic}=ensureGuardControls();if(button)button.hidden=!retryVisible
    if(diagnostic){
      const phase=failedPhase||window.__ISA_CORE_FAILED_PHASE__||window.__ISA_CORE_PHASE__||'aguardando-núcleo'
      const runtime=window.__ISA_APP_ERROR__||window.__ISA_LAST_RUNTIME_ERROR__||lastError||''
      diagnostic.textContent=retryVisible?`Etapa: ${phase}${runtime?` • ${runtime}`:''}`:''
    }
  }
  function hideGuard(){
    const g=guard();g?.classList.add('hidden');g?.classList.remove('isa-boot-error')
    const b=$('personalBootRetryV8');if(b)b.hidden=true
  }
  function gateIdentity(show=false){
    installCss();cleanupOldLocks();document.body?.classList.add('isa-shell-identity-gate')
    if(show)showGuard('Abrindo seu Cantinho…','Identificando seu perfil com segurança.',false)
  }
  function lockApproved(){
    installCss();cleanupOldLocks();document.body?.classList.remove('isa-shell-identity-gate');document.body?.classList.add('isa-approved-route-lock-v8','isa-approved-awaiting');document.body?.classList.remove('isa-approved-ready')
  }
  function markReady(p){
    installCss();cleanupOldLocks();document.body?.classList.remove('isa-shell-identity-gate');document.body?.classList.add('isa-approved-route-lock-v8','isa-approved-ready','isa-final-shell-ready');document.body?.classList.remove('isa-approved-awaiting')
    hideGuard();state='ready';lastError='';failedPhase=''
    if(!readyEventSent){readyEventSent=true;document.dispatchEvent(new CustomEvent('isa:final-shell-ready',{detail:{profile:p}}))}
  }
  function unlockLegacy(){
    cleanupOldLocks();document.body?.classList.remove('isa-shell-identity-gate','isa-approved-route-lock-v8','isa-approved-awaiting','isa-approved-ready','isa-final-shell-ready');hideGuard();state='legacy'
  }

  function modulePath(p){return p==='keise'?'./keise-approved-layout-final.js?v=11-critical-shell':'./approved-profile-dashboard.js?v=11-critical-shell'}
  function homeFn(p){return p==='keise'?window.__ISA_SHOW_KEISE_HOME__:window.__ISA_SHOW_APPROVED_PROFILE_HOME__}
  async function ensureModule(p){
    if(modulePromise&&moduleProfile===p)return modulePromise
    moduleProfile=p
    modulePromise=import(modulePath(p)).catch(err=>{modulePromise=null;moduleProfile='';throw err})
    return modulePromise
  }

  async function revealApproved(p){
    await ensureModule(p)
    const deadline=Date.now()+9000
    while(Date.now()<deadline){
      try{homeFn(p)?.()}catch(err){window.__ISA_LAST_RUNTIME_ERROR__=String(err?.message||err)}
      const home=finalHome()
      if(home){
        home.classList.remove('hidden')
        try{homeFn(p)?.()}catch{}
        if(!home.classList.contains('hidden'))return true
      }
      await wait(75)
    }
    return false
  }

  async function bootApproved(p,{force=false}={}){
    if(!p)return false
    if(finalReady()){markReady(p);return true}
    if(state==='error'&&!force)return false
    if(bootPromise)return bootPromise

    state='building';lastError='';failedPhase='';readyEventSent=false;lockApproved();showGuard(`Abrindo o Cantinho de ${DISPLAY[p]||'você'}…`,'Carregando o layout aprovado.',false)
    bootPromise=(async()=>{
      try{
        const preload=ensureModule(p)
        const mainDeadline=Date.now()+14000
        while(!mainReady()&&Date.now()<mainDeadline){
          if(loginReady()){
            cleanupOldLocks();document.body?.classList.remove('isa-shell-identity-gate','isa-approved-route-lock-v8','isa-approved-awaiting','isa-approved-ready');hideGuard();state='login';return false
          }
          if(window.__ISA_CORE_PHASE__==='error')throw new Error(window.__ISA_APP_ERROR__||'O núcleo não conseguiu iniciar.')
          await wait(70)
        }
        if(!mainReady())throw new Error(`O núcleo não liberou a área principal. Etapa: ${window.__ISA_CORE_FAILED_PHASE__||window.__ISA_CORE_PHASE__||'desconhecida'}.`)
        await preload
        const ok=await revealApproved(p)
        if(!ok)throw new Error('O painel final foi carregado, mas não conseguiu montar a tela aprovada.')
        markReady(p);return true
      }catch(err){
        state='error';failedPhase=window.__ISA_CORE_FAILED_PHASE__||window.__ISA_CORE_PHASE__||'approved-shell';lastError=String(err?.message||err||'Falha ao abrir o painel final.');console.error('[layout aprovado v8]',err)
        lockApproved();showGuard('A abertura não terminou',`${lastError}`,true)
        document.dispatchEvent(new CustomEvent('isa:final-shell-error',{detail:{profile:p,error:lastError,phase:failedPhase}}))
        return false
      }finally{bootPromise=null}
    })()
    return bootPromise
  }

  function retry(){
    if(bootPromise)return bootPromise
    state='identity';lastError='';failedPhase='';readyEventSent=false
    const p=profile()||requestedProfile()
    if(p)return bootApproved(p,{force:true})
    return scan(true)
  }

  function scan(force=false){
    if(finalReady()){const p=profile()||requestedProfile()||'keise';markReady(p);return true}
    if(loginReady()&&!mainReady()){
      cleanupOldLocks();document.body?.classList.remove('isa-shell-identity-gate','isa-approved-route-lock-v8','isa-approved-awaiting','isa-approved-ready');hideGuard();state='login';return false
    }

    const rp=requestedProfile(),p=profile()
    if(rp){
      lockApproved();if(state==='identity')showGuard(`Abrindo o Cantinho de ${DISPLAY[rp]||'você'}…`,'Carregando o layout aprovado.',false)
      ensureModule(rp).catch(err=>{window.__ISA_LAST_RUNTIME_ERROR__=String(err?.message||err)})
      if(state!=='error'||force)return bootApproved(rp,{force})
      return false
    }
    if(p){clearTimeout(identityTimer);if(state!=='error'||force)return bootApproved(p,{force});return false}

    if(mainReady()){
      gateIdentity(true);clearTimeout(identityTimer)
      identityTimer=setTimeout(()=>{
        const identified=identityProfile()
        if(identified)bootApproved(identified,{force:true})
        else if(mainReady()&&window.__ISA_APP_READY__===true)unlockLegacy()
      },1400)
      return false
    }

    gateIdentity(false)
    return false
  }
  function scheduleScan(){if(scanQueued)return;scanQueued=true;queueMicrotask(()=>{scanQueued=false;scan(false)})}

  installCss();gateIdentity(false)
  const rp=requestedProfile()
  if(rp){lockApproved();showGuard(`Abrindo o Cantinho de ${DISPLAY[rp]||'você'}…`,'Carregando o layout aprovado.',false);ensureModule(rp).catch(err=>{window.__ISA_LAST_RUNTIME_ERROR__=String(err?.message||err)})}
  else setTimeout(()=>{if(!loginReady()&&!mainReady()&&!finalReady())showGuard('Abrindo seu Cantinho…','Carregando sua sessão com segurança.',false)},140)

  const app=$('app');if(app)new MutationObserver(scheduleScan).observe(app,{subtree:true,childList:true,attributes:true,attributeFilter:['class'],characterData:true})
  window.addEventListener('pageshow',scheduleScan)
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')scheduleScan()})
  document.addEventListener('isa:approved-home-ready',scheduleScan)
  document.addEventListener('isa:core-boot-start',scheduleScan)
  document.addEventListener('isa:core-boot-complete',scheduleScan)
  document.addEventListener('isa:core-phase',scheduleScan)
  document.addEventListener('isa:core-ready',scheduleScan)
  document.addEventListener('isa:core-error',e=>{
    failedPhase=String(e?.detail?.phase||window.__ISA_CORE_FAILED_PHASE__||'core-error')
    lastError=String(e?.detail?.message||window.__ISA_APP_ERROR__||'Falha no núcleo.');state='error';lockApproved();showGuard('Não foi possível abrir o Cantinho',lastError,true)
  })
  setTimeout(scheduleScan,0)
  setTimeout(()=>{
    if(state==='ready'||state==='login'||state==='legacy'||state==='error')return
    const p=profile()||requestedProfile()
    if(p){state='error';failedPhase=window.__ISA_CORE_FAILED_PHASE__||window.__ISA_CORE_PHASE__||'timeout';lastError=`A abertura excedeu o tempo esperado. Etapa: ${failedPhase}.`;lockApproved();showGuard('A abertura está demorando',lastError,true)}
  },20000)

  window.__ISA_FINAL_SHELL__={scan,recover:retry,retry,ensureDashboard:scan,get state(){return state},get error(){return lastError},get failedPhase(){return failedPhase}}
})()
