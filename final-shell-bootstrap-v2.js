// Bootstrap estável dos dashboards pessoais aprovados.
// O layout legado continua existindo somente como núcleo funcional invisível.
(function(){
  'use strict'
  if(window.__ISA_FINAL_SHELL_BOOTSTRAP_V3__){window.__ISA_FINAL_SHELL__?.recover?.();return}
  window.__ISA_FINAL_SHELL_BOOTSTRAP_V3__=true

  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const wait=ms=>new Promise(r=>setTimeout(r,ms))
  const timeout=(ms,label='timeout')=>new Promise((_,rej)=>setTimeout(()=>rej(new Error(label)),ms))
  const APPROVED=new Set(['keise','isa','alan'])
  let bootPromise=null,themePromise=null,state='idle',lastError='',pollTimer=0

  function requestedProfile(){const q=norm(new URLSearchParams(location.search).get('perfil'));return APPROVED.has(q)?q:''}
  function identityProfile(){const n=norm($('myName')?.textContent);for(const p of APPROVED)if(n===p||n.startsWith(p+' '))return p;return''}
  function profile(){return identityProfile()||requestedProfile()}
  const mainReady=()=>!!$('mainView')&&!$('mainView').classList.contains('hidden')
  const loginReady=()=>!!$('loginView')&&!$('loginView').classList.contains('hidden')
  const finalReady=()=>!!$('keiseApprovedHome')&&!$('keiseApprovedHome').classList.contains('hidden')

  function css(){
    if($('isaFinalShellBootstrapCssV3'))return
    const s=document.createElement('style');s.id='isaFinalShellBootstrapCssV3';s.textContent=`
      body.isa-approved-route-lock-v3 #mainView>.sidebar{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;width:0!important;min-width:0!important;max-width:0!important;padding:0!important;margin:0!important;border:0!important;overflow:hidden!important}
      body.isa-approved-route-lock-v3 #emptyState{display:none!important;visibility:hidden!important}
      body.isa-approved-route-lock-v3:not(.keise-panel-active) #mainView>.content>section:not(#keiseApprovedHome){display:none!important;visibility:hidden!important;pointer-events:none!important}
      #isaFinalShellShieldV2{position:fixed;inset:0;z-index:119900;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 16% 12%,#fff0f7 0 17%,transparent 42%),radial-gradient(circle at 87% 11%,#eee7ff 0 18%,transparent 43%),linear-gradient(145deg,#fffafd,#f7f2ff 58%,#f0f8ff);transition:opacity .16s ease,visibility .16s ease;pointer-events:auto}
      #isaFinalShellShieldV2.hidden{opacity:0;visibility:hidden;pointer-events:none}
      #isaFinalShellShieldV2 .isa-final-card{width:min(410px,92vw);padding:24px 30px;border:1px solid rgba(255,255,255,.96);border-radius:30px;background:rgba(255,255,255,.9);box-shadow:0 20px 52px rgba(92,67,111,.12);text-align:center;color:#5b4366;font:800 15px/1.4 Inter,"Segoe UI",sans-serif}
      #isaFinalShellShieldV2 .isa-final-heart{font-size:38px;margin-bottom:7px;color:#df8fbe}
      #isaFinalShellShieldV2 .isa-final-copy{margin-top:7px;color:#8c7895;font-size:12px;font-weight:600}
      #isaFinalShellShieldV2 .isa-final-retry{margin-top:14px;border:0;border-radius:14px;padding:10px 16px;background:linear-gradient(135deg,#efa8d0,#bda7ef);color:white;font:800 12px/1 Inter,"Segoe UI",sans-serif;cursor:pointer;box-shadow:0 8px 18px rgba(126,90,153,.18)}
    `;document.head.appendChild(s)
  }

  function lock(){css();document.body?.classList.add('isa-approved-route-lock-v3')}
  function unlockForLogin(){document.body?.classList.remove('isa-approved-route-lock-v3','isa-final-shell-managed','isa-final-shell-ready','isa-approved-shell-lock');hideShield();window.__ISA_HIDE_BOOT_GUARD__?.()}

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
  function showShield(message='Abrindo seu Cantinho…',detail='Preparando o layout aprovado.',retry=false){
    const el=shield();el.querySelector('.isa-final-title').textContent=message;el.querySelector('.isa-final-copy').textContent=detail;const b=el.querySelector('.isa-final-retry');if(b)b.hidden=!retry;el.classList.remove('hidden')
  }
  function hideShield(){$('isaFinalShellShieldV2')?.classList.add('hidden')}

  async function loadThemeStack(){
    if(themePromise)return themePromise
    themePromise=(async()=>{
      await import('./social-theme-live-rescue-v1.js?v=1-direct-live').catch(()=>null)
      await import('./social-profile-theme-v2.js?v=3-live-visible').catch(()=>null)
      await import('./seasonal-theme-engine-v1.js?v=2-calendar-live').catch(()=>null)
      try{await window.__ISA_PROFILE_THEME_V2__?.loadState?.();window.__ISA_PROFILE_THEME_V2__?.scan?.();window.__ISA_SEASONAL_THEME_ENGINE__?.refresh?.()}catch{}
    })()
    return themePromise
  }

  async function buildFinal(p){
    if(p==='keise'){
      if(typeof window.__ISA_SHOW_KEISE_HOME__!=='function')await Promise.race([import('./keise-approved-layout-final.js?v=9-approved-route-stable'),timeout(6000,'keise layout não carregou')])
      for(let i=0;i<70;i++){window.__ISA_SHOW_KEISE_HOME__?.();if(finalReady())return true;await wait(90)}
      return finalReady()
    }
    if(typeof window.__ISA_SHOW_APPROVED_PROFILE_HOME__!=='function')await Promise.race([import('./approved-profile-dashboard.js?v=9-approved-route-stable'),timeout(6000,'layout do perfil não carregou')])
    for(let i=0;i<70;i++){window.__ISA_SHOW_APPROVED_PROFILE_HOME__?.();if(finalReady())return true;await wait(90)}
    return finalReady()
  }

  async function ensureDashboard(force=false){
    const p=profile()
    if(!p){if(loginReady())unlockForLogin();return false}
    if(finalReady()){
      lock();document.body.classList.add('isa-final-shell-ready');hideShield();window.__ISA_HIDE_BOOT_GUARD__?.();state='ready';loadThemeStack();return true
    }
    if(!mainReady()){
      if(loginReady())unlockForLogin()
      return false
    }
    if(bootPromise&&!force)return bootPromise

    lock();showShield('Abrindo seu Cantinho…','Carregando somente o layout final aprovado.',false);state='building'
    bootPromise=(async()=>{
      try{
        const ok=await Promise.race([buildFinal(p),timeout(10000,'o layout final demorou para responder')])
        if(!ok)throw new Error('o layout final não ficou pronto')
        lock();document.body.classList.add('isa-final-shell-ready');document.body.classList.remove('isa-final-shell-managed','isa-approved-shell-lock')
        hideShield();$('isaApprovedShellShield')?.classList.add('hidden');$('personalBootGuard')?.classList.add('hidden');window.__ISA_HIDE_BOOT_GUARD__?.();state='ready';lastError=''
        document.dispatchEvent(new CustomEvent('isa:final-shell-ready',{detail:{profile:p}}));loadThemeStack();return true
      }catch(err){
        state='error';lastError=String(err?.message||err||'Falha ao abrir o layout')
        console.error('[layout aprovado]',err)
        // Nunca exponha novamente a interface antiga. O núcleo segue invisível e pode ser reutilizado no retry.
        lock();showShield('Não consegui concluir a abertura',lastError,true)
        document.dispatchEvent(new CustomEvent('isa:final-shell-retry',{detail:{profile:p,error:lastError}}));return false
      }finally{bootPromise=null}
    })()
    return bootPromise
  }

  function recover(){
    if(finalReady()){lock();hideShield();window.__ISA_HIDE_BOOT_GUARD__?.();state='ready';return true}
    ensureDashboard(false);return false
  }

  // Um perfil explícito nunca pode piscar a interface antiga enquanto a sessão termina de abrir.
  if(requestedProfile())lock()
  css();shield()

  // Poll direcionado. Não observa o próprio escudo e não entra em loop de MutationObserver.
  let tries=0
  const poll=()=>{
    if(finalReady()){recover();clearInterval(pollTimer);return}
    if(loginReady()&&!mainReady()&&!requestedProfile()){unlockForLogin();return}
    ensureDashboard(false)
    if(++tries>600&&state!=='ready')tries=0
  }
  pollTimer=setInterval(poll,180)
  setTimeout(poll,0)
  window.addEventListener('pageshow',poll)
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')poll()})
  document.addEventListener('isa:approved-home-ready',poll)

  window.__ISA_FINAL_SHELL__={recover,ensureDashboard,theme:loadThemeStack,get state(){return state},get error(){return lastError}}
})()
