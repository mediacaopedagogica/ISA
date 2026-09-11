// Bootstrap determinístico dos dashboards pessoais aprovados.
// O layout legado continua apenas como núcleo funcional e nunca é exibido quando o perfil aprovado está abrindo.
(function(){
  'use strict'
  if(window.__ISA_FINAL_SHELL_BOOTSTRAP_V4__){window.__ISA_FINAL_SHELL__?.recover?.();return}
  window.__ISA_FINAL_SHELL_BOOTSTRAP_V4__=true

  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const wait=ms=>new Promise(r=>setTimeout(r,ms))
  const APPROVED=new Set(['keise','isa','alan'])
  let state='idle',lastError='',bootPromise=null,modulePromise=null,lastProfile='',identifyTimer=0

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
    if($('isaFinalShellBootstrapCssV4'))return
    const s=document.createElement('style');s.id='isaFinalShellBootstrapCssV4';s.textContent=`
      body.isa-approved-route-lock-v4 #mainView>.sidebar{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;width:0!important;min-width:0!important;max-width:0!important;padding:0!important;margin:0!important;border:0!important;overflow:hidden!important}
      body.isa-approved-route-lock-v4 #emptyState{display:none!important;visibility:hidden!important}
      body.isa-approved-route-lock-v4:not(.keise-panel-active) #mainView>.content>section:not(#keiseApprovedHome){display:none!important;visibility:hidden!important;pointer-events:none!important}
      #isaFinalShellShieldV2{position:fixed;inset:0;z-index:119900;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 16% 12%,#fff0f7 0 17%,transparent 42%),radial-gradient(circle at 87% 11%,#eee7ff 0 18%,transparent 43%),linear-gradient(145deg,#fffafd,#f7f2ff 58%,#f0f8ff);transition:opacity .16s ease,visibility .16s ease;pointer-events:auto}
      #isaFinalShellShieldV2.hidden{opacity:0;visibility:hidden;pointer-events:none}
      #isaFinalShellShieldV2 .isa-final-card{width:min(410px,92vw);padding:24px 30px;border:1px solid rgba(255,255,255,.96);border-radius:30px;background:rgba(255,255,255,.9);box-shadow:0 20px 52px rgba(92,67,111,.12);text-align:center;color:#5b4366;font:800 15px/1.4 Inter,"Segoe UI",sans-serif}
      #isaFinalShellShieldV2 .isa-final-heart{font-size:38px;margin-bottom:7px;color:#df8fbe}
      #isaFinalShellShieldV2 .isa-final-copy{margin-top:7px;color:#8c7895;font-size:12px;font-weight:600}
      #isaFinalShellShieldV2 .isa-final-retry{margin-top:14px;border:0;border-radius:14px;padding:10px 16px;background:linear-gradient(135deg,#efa8d0,#bda7ef);color:white;font:800 12px/1 Inter,"Segoe UI",sans-serif;cursor:pointer;box-shadow:0 8px 18px rgba(126,90,153,.18)}
    `;document.head.appendChild(s)
  }

  function shield(){
    let el=$('isaFinalShellShieldV2')
    if(!el){
      el=document.createElement('div');el.id='isaFinalShellShieldV2';el.className='hidden'
      el.innerHTML='<div class="isa-final-card"><div class="isa-final-heart">♥</div><div class="isa-final-title">Abrindo seu Cantinho…</div><div class="isa-final-copy">Preparando o layout aprovado.</div><button class="isa-final-retry" type="button" hidden>Tentar novamente</button></div>'
      document.body.appendChild(el)
      el.querySelector('.isa-final-retry')?.addEventListener('click',()=>ensureDashboard(true))
    }
    return el
  }
  function showShield(title='Abrindo seu Cantinho…',detail='Carregando somente o layout final aprovado.',retry=false){
    const el=shield();el.querySelector('.isa-final-title').textContent=title;el.querySelector('.isa-final-copy').textContent=detail
    const b=el.querySelector('.isa-final-retry');if(b)b.hidden=!retry
    el.classList.remove('hidden')
  }
  function hideShield(){$('isaFinalShellShieldV2')?.classList.add('hidden')}
  function hideBoot(){window.__ISA_HIDE_BOOT_GUARD__?.();$('personalBootGuard')?.classList.add('hidden')}
  function lock(){installCss();document.body?.classList.add('isa-approved-route-lock-v4');document.body?.classList.remove('isa-approved-route-lock-v3')}
  function unlock(){document.body?.classList.remove('isa-approved-route-lock-v3','isa-approved-route-lock-v4','isa-final-shell-managed','isa-approved-shell-lock');hideShield();hideBoot()}

  function modulePath(p){return p==='keise'?'./keise-approved-layout-final.js?v=7-hardwired-final':'./approved-profile-dashboard.js?v=7-hardwired-final'}
  function homeFn(p){return p==='keise'?window.__ISA_SHOW_KEISE_HOME__:window.__ISA_SHOW_APPROVED_PROFILE_HOME__}

  async function ensureModule(p){
    if(modulePromise&&lastProfile===p)return modulePromise
    lastProfile=p
    modulePromise=import(modulePath(p)).catch(err=>{modulePromise=null;throw err})
    return modulePromise
  }

  async function revealApproved(p){
    await ensureModule(p)
    for(let i=0;i<110;i++){
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

  async function ensureDashboard(force=false){
    const p=profile()

    if(loginReady()&&!mainReady()){
      state='idle';lastError='';bootPromise=null;modulePromise=null;lastProfile='';unlock();return false
    }

    if(!p){
      if(mainReady()){
        lock();showShield('Abrindo seu Cantinho…','Identificando o perfil conectado.',false)
        clearTimeout(identifyTimer)
        identifyTimer=setTimeout(()=>{if(!profile()&&mainReady())unlock()},2200)
      }
      return false
    }

    clearTimeout(identifyTimer)
    if(!mainReady()){
      if(requestedProfile())ensureModule(p).catch(()=>{})
      return false
    }

    if(finalReady()){
      lock();hideShield();hideBoot();state='ready';lastError='';document.body.classList.add('isa-final-shell-ready')
      document.dispatchEvent(new CustomEvent('isa:final-shell-ready',{detail:{profile:p}}))
      return true
    }

    if(state==='error'&&!force)return false
    if(bootPromise&&!force)return bootPromise

    lock();showShield('Abrindo seu Cantinho…','Carregando somente o layout final aprovado.',false);state='building'
    bootPromise=(async()=>{
      try{
        const ok=await revealApproved(p)
        if(!ok)throw new Error('O layout aprovado não respondeu a tempo.')
        lock();document.body.classList.add('isa-final-shell-ready');document.body.classList.remove('isa-final-shell-managed','isa-approved-shell-lock')
        hideShield();hideBoot();state='ready';lastError=''
        document.dispatchEvent(new CustomEvent('isa:final-shell-ready',{detail:{profile:p}}))
        return true
      }catch(err){
        state='error';lastError=String(err?.message||err||'Falha ao abrir o layout aprovado')
        console.error('[layout aprovado]',err)
        lock();showShield('Não consegui concluir a abertura',lastError,true)
        document.dispatchEvent(new CustomEvent('isa:final-shell-retry',{detail:{profile:p,error:lastError}}))
        return false
      }finally{bootPromise=null}
    })()
    return bootPromise
  }

  function recover(){
    if(finalReady()){lock();hideShield();hideBoot();state='ready';return true}
    if(state==='error')state='idle'
    ensureDashboard(true);return false
  }

  function scan(){
    const p=profile()
    if(lastProfile&&p&&lastProfile!==p){state='idle';lastError='';bootPromise=null;modulePromise=null;lastProfile=''}
    if(finalReady()){lock();hideShield();hideBoot();state='ready';return}
    if(loginReady()&&!mainReady()){unlock();state='idle';return}
    if(state!=='error')ensureDashboard(false)
  }

  installCss();shield()
  const app=$('app')
  if(app)new MutationObserver(scan).observe(app,{subtree:true,childList:true,attributes:true,attributeFilter:['class'],characterData:true})
  window.addEventListener('pageshow',scan)
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')scan()})
  document.addEventListener('isa:approved-home-ready',scan)
  document.addEventListener('isa:personal-boot-retry',()=>recover())
  setInterval(()=>{if(state!=='ready'&&state!=='error')scan()},240)
  setTimeout(scan,0)

  window.__ISA_FINAL_SHELL__={recover,ensureDashboard,get state(){return state},get error(){return lastError}}
})()
