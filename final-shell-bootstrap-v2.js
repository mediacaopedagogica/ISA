// Bootstrap determinístico dos dashboards pessoais aprovados.
// V5: um único boot por vez, um único guard e layout legado bloqueado antes de o núcleo aparecer.
(function(){
  'use strict'
  if(window.__ISA_FINAL_SHELL_BOOTSTRAP_V5__){window.__ISA_FINAL_SHELL__?.scan?.();return}
  window.__ISA_FINAL_SHELL_BOOTSTRAP_V5__=true

  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const wait=ms=>new Promise(r=>setTimeout(r,ms))
  const APPROVED=new Set(['keise','isa','alan'])
  const DISPLAY={keise:'Keise',isa:'Isa',alan:'Alan'}
  let state='idle',lastError='',bootPromise=null,modulePromise=null,moduleProfile='',scanQueued=false,identifyTimer=0

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
    if($('isaFinalShellBootstrapCssV5'))return
    const s=document.createElement('style')
    s.id='isaFinalShellBootstrapCssV5'
    s.textContent=`
      body.isa-approved-route-lock-v5.isa-approved-awaiting #mainView{visibility:hidden!important;opacity:0!important;pointer-events:none!important}
      body.isa-approved-route-lock-v5.isa-approved-ready #mainView{visibility:visible!important;opacity:1!important;pointer-events:auto!important}
      body.isa-approved-route-lock-v5 #mainView>.sidebar{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;width:0!important;min-width:0!important;max-width:0!important;padding:0!important;margin:0!important;border:0!important;overflow:hidden!important}
      body.isa-approved-route-lock-v5 #emptyState{display:none!important;visibility:hidden!important;pointer-events:none!important}
      body.isa-approved-route-lock-v5:not(.keise-panel-active) #mainView>.content>section:not(#keiseApprovedHome){display:none!important;visibility:hidden!important;pointer-events:none!important}
      #personalBootRetryV5{margin-top:14px;border:0;border-radius:14px;padding:10px 17px;background:linear-gradient(135deg,#efa8d0,#bda7ef);color:#fff;font:800 12px/1 Inter,"Segoe UI",sans-serif;cursor:pointer;box-shadow:0 8px 18px rgba(126,90,153,.18)}
      #personalBootRetryV5[hidden]{display:none!important}
    `
    document.head.appendChild(s)
  }

  function removeOldShield(){$('isaFinalShellShieldV2')?.remove()}
  function guard(){return $('personalBootGuard')}
  function retryButton(){
    let b=$('personalBootRetryV5')
    if(b)return b
    const card=guard()?.querySelector('.guard-card')
    if(!card)return null
    b=document.createElement('button')
    b.id='personalBootRetryV5';b.type='button';b.hidden=true;b.textContent='Tentar novamente'
    b.addEventListener('click',()=>retry())
    card.appendChild(b)
    return b
  }
  function showGuard(title='Abrindo seu Cantinho…',detail='Preparando seu painel final.',retryVisible=false){
    removeOldShield()
    const g=guard();if(!g)return
    g.classList.remove('hidden')
    const t=$('personalBootTitle');if(t)t.textContent=title
    const p=g.querySelector('.guard-card p');if(p)p.textContent=detail
    const spin=g.querySelector('.guard-spinner');if(spin)spin.style.display=retryVisible?'none':''
    const b=retryButton();if(b)b.hidden=!retryVisible
  }
  function hideGuard(){
    const g=guard();if(g)g.classList.add('hidden')
    const b=$('personalBootRetryV5');if(b)b.hidden=true
  }
  function clearLegacyClasses(){
    document.body?.classList.remove('isa-approved-route-lock-v3','isa-approved-route-lock-v4','isa-final-shell-managed','isa-approved-shell-lock')
  }
  function lockAwaiting(){
    installCss();removeOldShield();clearLegacyClasses()
    document.body?.classList.add('isa-approved-route-lock-v5','isa-approved-awaiting')
    document.body?.classList.remove('isa-approved-ready')
  }
  function markReady(){
    installCss();removeOldShield();clearLegacyClasses()
    document.body?.classList.add('isa-approved-route-lock-v5','isa-approved-ready','isa-final-shell-ready')
    document.body?.classList.remove('isa-approved-awaiting')
  }
  function unlock(){
    clearLegacyClasses();removeOldShield()
    document.body?.classList.remove('isa-approved-route-lock-v5','isa-approved-awaiting','isa-approved-ready','isa-final-shell-ready')
    hideGuard()
  }

  function modulePath(p){return p==='keise'?'./keise-approved-layout-final.js?v=8-single-flight':'./approved-profile-dashboard.js?v=8-single-flight'}
  function homeFn(p){return p==='keise'?window.__ISA_SHOW_KEISE_HOME__:window.__ISA_SHOW_APPROVED_PROFILE_HOME__}
  async function ensureModule(p){
    if(modulePromise&&moduleProfile===p)return modulePromise
    moduleProfile=p
    modulePromise=import(modulePath(p)).catch(err=>{modulePromise=null;moduleProfile='';throw err})
    return modulePromise
  }
  async function revealApproved(p){
    await ensureModule(p)
    const deadline=Date.now()+6500
    while(Date.now()<deadline){
      try{homeFn(p)?.()}catch{}
      const home=finalHome()
      if(home){
        try{homeFn(p)?.()}catch{}
        home.classList.remove('hidden')
        if(!home.classList.contains('hidden'))return true
      }
      await wait(80)
    }
    return false
  }

  async function boot(p){
    if(!p)return false
    // REGRA CENTRAL: nunca crie um segundo boot enquanto o primeiro existir.
    if(bootPromise)return bootPromise

    state='building';lastError='';lockAwaiting()
    showGuard(`Abrindo o Cantinho de ${DISPLAY[p]||'você'}…`,'Carregando suas conversas com segurança.',false)

    bootPromise=(async()=>{
      try{
        // Pré-carrega o layout aprovado enquanto o núcleo autentica a sessão.
        const preload=ensureModule(p)
        const mainDeadline=Date.now()+9500
        let loginSeenAt=0
        while(!mainReady()&&Date.now()<mainDeadline){
          if(loginReady()){
            if(!loginSeenAt)loginSeenAt=Date.now()
            // Dá uma pequena janela para a restauração de sessão antes de assumir logout real.
            if(Date.now()-loginSeenAt>850){unlock();state='login';return false}
          }else loginSeenAt=0
          await wait(70)
        }
        if(!mainReady())throw new Error('Sua sessão não terminou de carregar.')
        await preload
        const ok=await revealApproved(p)
        if(!ok)throw new Error('O painel final não respondeu a tempo.')

        markReady();hideGuard();state='ready';lastError=''
        document.dispatchEvent(new CustomEvent('isa:final-shell-ready',{detail:{profile:p}}))
        return true
      }catch(err){
        state='error';lastError=String(err?.message||err||'Falha ao abrir o painel final.')
        console.error('[layout aprovado v5]',err)
        lockAwaiting()
        showGuard('A abertura não terminou',`${lastError} Toque em “Tentar novamente”.`,true)
        return false
      }finally{
        bootPromise=null
      }
    })()
    return bootPromise
  }

  function retry(){
    // Se ainda há um boot em andamento, reaproveita exatamente o mesmo.
    if(bootPromise)return bootPromise
    state='idle';lastError=''
    const p=profile()||requestedProfile()
    return p?boot(p):scan()
  }

  function watchdog(){
    if(finalReady()){markReady();hideGuard();state='ready';return true}
    if(loginReady()&&!mainReady()){unlock();state='login';return false}
    if(state==='building'||state==='idle'){
      const p=profile()||requestedProfile()
      if(p){lockAwaiting();showGuard(`Abrindo o Cantinho de ${DISPLAY[p]||'você'}…`,'A abertura está demorando mais do que o normal.',true)}
    }
    return false
  }

  function scan(){
    removeOldShield()
    if(finalReady()){
      markReady();hideGuard();state='ready';return true
    }
    if(loginReady()&&!mainReady()){
      unlock();state='login';return false
    }

    const rp=requestedProfile(),p=profile()
    // Se o endereço já informa Keise/Isa/Alan, o legado é bloqueado ANTES de mainView aparecer.
    if(rp){
      lockAwaiting()
      if(state==='idle')showGuard(`Abrindo o Cantinho de ${DISPLAY[rp]||'você'}…`,'Carregando suas conversas com segurança.',false)
      ensureModule(rp).catch(()=>{})
    }
    if(p){clearTimeout(identifyTimer);return boot(p)}

    // Notebook sem ?perfil=: o núcleo pode identificar o nome depois da sessão.
    if(mainReady()){
      lockAwaiting();showGuard('Abrindo seu Cantinho…','Identificando o perfil conectado.',false)
      clearTimeout(identifyTimer)
      identifyTimer=setTimeout(()=>{
        const identified=profile()
        if(identified)boot(identified)
        else if(mainReady())unlock()
      },650)
    }
    return false
  }

  function scheduleScan(){
    if(scanQueued)return
    scanQueued=true
    queueMicrotask(()=>{scanQueued=false;scan()})
  }

  installCss();removeOldShield()
  const rp=requestedProfile()
  if(rp){lockAwaiting();showGuard(`Abrindo o Cantinho de ${DISPLAY[rp]||'você'}…`,'Carregando suas conversas com segurança.',false);ensureModule(rp).catch(()=>{})}

  const app=$('app')
  if(app)new MutationObserver(scheduleScan).observe(app,{subtree:true,childList:true,attributes:true,attributeFilter:['class'],characterData:true})
  window.addEventListener('pageshow',scheduleScan)
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')scheduleScan()})
  document.addEventListener('isa:approved-home-ready',scheduleScan)
  // Deliberadamente NÃO escuta isa:personal-boot-retry: versões antigas disparavam esse evento junto de recover(), duplicando o boot.
  setTimeout(scheduleScan,0)
  setTimeout(()=>{if(state!=='ready'&&state!=='login')watchdog()},11500)

  window.__ISA_FINAL_SHELL__={scan,recover:retry,retry,watchdog,ensureDashboard:scan,get state(){return state},get error(){return lastError}}
})()
