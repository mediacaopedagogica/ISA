// Bootstrap determinístico dos dashboards pessoais aprovados.
// V6: o layout legado nunca pode aparecer enquanto a identidade ainda está sendo resolvida.
(function(){
  'use strict'
  if(window.__ISA_FINAL_SHELL_BOOTSTRAP_V6__){window.__ISA_FINAL_SHELL__?.scan?.();return}
  window.__ISA_FINAL_SHELL_BOOTSTRAP_V6__=true

  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const wait=ms=>new Promise(r=>setTimeout(r,ms))
  const APPROVED=new Set(['keise','isa','alan'])
  const DISPLAY={keise:'Keise',isa:'Isa',alan:'Alan'}
  let state='identity',lastError='',bootPromise=null,modulePromise=null,moduleProfile='',scanQueued=false,identifyTimer=0

  function requestedProfile(){
    const p=norm(new URLSearchParams(location.search).get('perfil'))
    return APPROVED.has(p)?p:''
  }
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
    if($('isaFinalShellBootstrapCssV6'))return
    const s=document.createElement('style')
    s.id='isaFinalShellBootstrapCssV6'
    s.textContent=`
      body.isa-shell-identity-gate #mainView{visibility:hidden!important;opacity:0!important;pointer-events:none!important}
      body.isa-approved-route-lock-v6.isa-approved-awaiting #mainView{visibility:hidden!important;opacity:0!important;pointer-events:none!important}
      body.isa-approved-route-lock-v6.isa-approved-ready #mainView{visibility:visible!important;opacity:1!important;pointer-events:auto!important}
      body.isa-approved-route-lock-v6 #mainView>.sidebar{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;width:0!important;min-width:0!important;max-width:0!important;padding:0!important;margin:0!important;border:0!important;overflow:hidden!important}
      body.isa-approved-route-lock-v6 #emptyState{display:none!important;visibility:hidden!important;pointer-events:none!important}
      body.isa-approved-route-lock-v6:not(.keise-panel-active) #mainView>.content>section:not(#keiseApprovedHome){display:none!important;visibility:hidden!important;pointer-events:none!important}
      #personalBootRetryV6{margin-top:14px;border:0;border-radius:14px;padding:10px 17px;background:linear-gradient(135deg,#efa8d0,#bda7ef);color:#fff;font:800 12px/1 Inter,"Segoe UI",sans-serif;cursor:pointer;box-shadow:0 8px 18px rgba(126,90,153,.18)}
      #personalBootRetryV6[hidden]{display:none!important}
    `
    document.head.appendChild(s)
  }

  function removeLegacyClasses(){
    document.body?.classList.remove('isa-approved-route-lock-v3','isa-approved-route-lock-v4','isa-approved-route-lock-v5','isa-final-shell-managed','isa-approved-shell-lock')
    $('isaFinalShellShieldV2')?.remove()
  }
  function guard(){return $('personalBootGuard')}
  function retryButton(){
    let b=$('personalBootRetryV6')
    if(b)return b
    const card=guard()?.querySelector('.guard-card')
    if(!card)return null
    b=document.createElement('button');b.id='personalBootRetryV6';b.type='button';b.hidden=true;b.textContent='Tentar novamente';b.addEventListener('click',()=>retry());card.appendChild(b)
    return b
  }
  function showGuard(title='Abrindo seu Cantinho…',detail='Carregando suas conversas com segurança.',retryVisible=false){
    const g=guard();if(!g)return
    g.classList.remove('hidden')
    const t=$('personalBootTitle');if(t)t.textContent=title
    const p=g.querySelector('.guard-card p');if(p)p.textContent=detail
    const spin=g.querySelector('.guard-spinner');if(spin)spin.style.display=retryVisible?'none':''
    const b=retryButton();if(b)b.hidden=!retryVisible
  }
  function hideGuard(){
    guard()?.classList.add('hidden')
    const b=$('personalBootRetryV6');if(b)b.hidden=true
  }
  function gateIdentity(show=false){
    installCss();removeLegacyClasses();document.body?.classList.add('isa-shell-identity-gate')
    if(show)showGuard('Abrindo seu Cantinho…','Identificando seu perfil com segurança.',false)
  }
  function lockApproved(){
    installCss();removeLegacyClasses();document.body?.classList.remove('isa-shell-identity-gate');document.body?.classList.add('isa-approved-route-lock-v6','isa-approved-awaiting');document.body?.classList.remove('isa-approved-ready')
  }
  function markReady(){
    installCss();removeLegacyClasses();document.body?.classList.remove('isa-shell-identity-gate');document.body?.classList.add('isa-approved-route-lock-v6','isa-approved-ready','isa-final-shell-ready');document.body?.classList.remove('isa-approved-awaiting')
  }
  function unlock(){
    removeLegacyClasses();document.body?.classList.remove('isa-shell-identity-gate','isa-approved-route-lock-v6','isa-approved-awaiting','isa-approved-ready','isa-final-shell-ready');hideGuard()
  }

  function modulePath(p){return p==='keise'?'./keise-approved-layout-final.js?v=9-single-core':'./approved-profile-dashboard.js?v=9-single-core'}
  function homeFn(p){return p==='keise'?window.__ISA_SHOW_KEISE_HOME__:window.__ISA_SHOW_APPROVED_PROFILE_HOME__}
  async function ensureModule(p){
    if(modulePromise&&moduleProfile===p)return modulePromise
    moduleProfile=p;modulePromise=import(modulePath(p)).catch(err=>{modulePromise=null;moduleProfile='';throw err});return modulePromise
  }
  async function revealApproved(p){
    await ensureModule(p)
    const deadline=Date.now()+7000
    while(Date.now()<deadline){
      try{homeFn(p)?.()}catch{}
      const home=finalHome()
      if(home){home.classList.remove('hidden');try{homeFn(p)?.()}catch{};if(!home.classList.contains('hidden'))return true}
      await wait(80)
    }
    return false
  }

  async function bootApproved(p){
    if(!p)return false
    if(finalReady()){markReady();hideGuard();state='ready';return true}
    if(bootPromise)return bootPromise
    state='building';lastError='';lockApproved();showGuard(`Abrindo o Cantinho de ${DISPLAY[p]||'você'}…`,'Carregando suas conversas com segurança.',false)
    bootPromise=(async()=>{
      try{
        const preload=ensureModule(p)
        const deadline=Date.now()+10000
        while(!mainReady()&&Date.now()<deadline){
          if(loginReady()){unlock();state='login';return false}
          await wait(70)
        }
        if(!mainReady())throw new Error('Sua sessão não terminou de carregar.')
        await preload
        if(!(await revealApproved(p)))throw new Error('O painel final não respondeu a tempo.')
        markReady();hideGuard();state='ready';lastError='';document.dispatchEvent(new CustomEvent('isa:final-shell-ready',{detail:{profile:p}}));return true
      }catch(err){
        state='error';lastError=String(err?.message||err||'Falha ao abrir o painel final.');console.error('[layout aprovado v6]',err);lockApproved();showGuard('A abertura não terminou',`${lastError} Toque em “Tentar novamente”.`,true);return false
      }finally{bootPromise=null}
    })()
    return bootPromise
  }

  function retry(){
    if(bootPromise)return bootPromise
    state='identity';lastError='';const p=profile()||requestedProfile();return p?bootApproved(p):scan()
  }
  function watchdog(){
    if(finalReady()){markReady();hideGuard();state='ready';return true}
    if(loginReady()&&!mainReady()){unlock();state='login';return false}
    const p=profile()||requestedProfile()
    if(p){lockApproved();showGuard(`Abrindo o Cantinho de ${DISPLAY[p]||'você'}…`,'A abertura está demorando mais do que o normal.',true)}
    else if(mainReady()){unlock();state='legacy'}
    else{gateIdentity(true);showGuard('A abertura está demorando','Ainda estamos identificando seu perfil.',true)}
    return false
  }

  function scan(){
    if(finalReady()){markReady();hideGuard();state='ready';return true}
    if(loginReady()&&!mainReady()){unlock();state='login';return false}

    const rp=requestedProfile(),p=profile()
    if(rp){lockApproved();if(state==='identity')showGuard(`Abrindo o Cantinho de ${DISPLAY[rp]||'você'}…`,'Carregando suas conversas com segurança.',false);ensureModule(rp).catch(()=>{});return bootApproved(rp)}
    if(p){clearTimeout(identifyTimer);return bootApproved(p)}

    if(mainReady()){
      gateIdentity(true);clearTimeout(identifyTimer);identifyTimer=setTimeout(()=>{
        const identified=identityProfile();if(identified)bootApproved(identified);else if(mainReady()){unlock();state='legacy'}
      },220)
      return false
    }

    gateIdentity(false)
    return false
  }
  function scheduleScan(){if(scanQueued)return;scanQueued=true;queueMicrotask(()=>{scanQueued=false;scan()})}

  installCss();gateIdentity(false)
  const rp=requestedProfile();if(rp){lockApproved();showGuard(`Abrindo o Cantinho de ${DISPLAY[rp]||'você'}…`,'Carregando suas conversas com segurança.',false);ensureModule(rp).catch(()=>{})}
  else setTimeout(()=>{if(!loginReady()&&!mainReady()&&!finalReady())showGuard('Abrindo seu Cantinho…','Carregando sua sessão com segurança.',false)},120)

  const app=$('app');if(app)new MutationObserver(scheduleScan).observe(app,{subtree:true,childList:true,attributes:true,attributeFilter:['class'],characterData:true})
  window.addEventListener('pageshow',scheduleScan)
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')scheduleScan()})
  document.addEventListener('isa:approved-home-ready',scheduleScan)
  document.addEventListener('isa:core-ready',scheduleScan)
  setTimeout(scheduleScan,0)
  setTimeout(()=>{if(state!=='ready'&&state!=='login'&&state!=='legacy')watchdog()},12000)

  window.__ISA_FINAL_SHELL__={scan,recover:retry,retry,watchdog,ensureDashboard:scan,get state(){return state},get error(){return lastError}}
})()
