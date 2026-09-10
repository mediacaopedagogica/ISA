// Bootstrap fail-open dos dashboards pessoais aprovados.
// Regra: nunca esconder o núcleo antes de a interface final estar realmente pronta.
(function(){
  'use strict'
  if(window.__ISA_FINAL_SHELL_BOOTSTRAP_V2__)return
  window.__ISA_FINAL_SHELL_BOOTSTRAP_V2__=true
  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const wait=ms=>new Promise(r=>setTimeout(r,ms))
  const timeout=(ms,label='timeout')=>new Promise((_,rej)=>setTimeout(()=>rej(new Error(label)),ms))
  let bootPromise=null,themePromise=null,timer=0,lastProfile='',retryAfter=0

  function profile(){
    const q=norm(new URLSearchParams(location.search).get('perfil'))
    const n=norm($('myName')?.textContent)
    for(const p of ['keise','isa','alan'])if(q===p||n===p||n.startsWith(p+' '))return p
    return''
  }
  const mainReady=()=>!!$('mainView')&&!$('mainView').classList.contains('hidden')
  const finalReady=()=>!!$('keiseApprovedHome')&&!$('keiseApprovedHome').classList.contains('hidden')

  function css(){
    if($('isaFinalShellBootstrapCssV2'))return
    const s=document.createElement('style');s.id='isaFinalShellBootstrapCssV2';s.textContent=`
      body.isa-final-shell-managed #mainView>.sidebar{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;width:0!important;min-width:0!important;max-width:0!important;padding:0!important;margin:0!important;border:0!important;overflow:hidden!important}
      body.isa-final-shell-managed #emptyState{display:none!important;visibility:hidden!important}
      body.isa-final-shell-managed:not(.keise-panel-active) #mainView>.content>section:not(#keiseApprovedHome){display:none!important}
      #isaFinalShellShieldV2{position:fixed;inset:0;z-index:119900;display:grid;place-items:center;background:radial-gradient(circle at 16% 12%,#fff0f7 0 17%,transparent 42%),radial-gradient(circle at 87% 11%,#eee7ff 0 18%,transparent 43%),linear-gradient(145deg,#fffafd,#f7f2ff 58%,#f0f8ff);transition:opacity .16s ease,visibility .16s ease;pointer-events:none}
      #isaFinalShellShieldV2.hidden{opacity:0;visibility:hidden}
      #isaFinalShellShieldV2 .isa-final-card{padding:24px 30px;border:1px solid rgba(255,255,255,.96);border-radius:30px;background:rgba(255,255,255,.87);box-shadow:0 20px 52px rgba(92,67,111,.12);text-align:center;color:#5b4366;font:800 15px/1.4 Inter,"Segoe UI",sans-serif}
      #isaFinalShellShieldV2 .isa-final-heart{font-size:38px;margin-bottom:7px;color:#df8fbe}
    `;document.head.appendChild(s)
  }
  function shield(show=true){
    let el=$('isaFinalShellShieldV2')
    if(!el){el=document.createElement('div');el.id='isaFinalShellShieldV2';el.className='hidden';el.innerHTML='<div class="isa-final-card"><div class="isa-final-heart">♥</div>Abrindo seu Cantinho…</div>';document.body.appendChild(el)}
    el.classList.toggle('hidden',!show);return el
  }
  function releaseFallback(reason='fallback'){
    console.warn('[layout final] liberando núcleo:',reason)
    document.body.classList.remove('isa-final-shell-managed','isa-final-shell-ready','isa-approved-shell-lock')
    shield(false)
    $('isaApprovedShellShield')?.classList.add('hidden')
    window.__ISA_HIDE_BOOT_GUARD__?.()
    const main=$('mainView'),login=$('loginView')
    if((!main||main.classList.contains('hidden'))&&login)login.classList.remove('hidden')
    document.dispatchEvent(new CustomEvent('isa:final-shell-fallback',{detail:{reason}}))
  }
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
      if(typeof window.__ISA_SHOW_KEISE_HOME__!=='function')await Promise.race([import('./keise-approved-layout-final.js?v=8-fail-open'),timeout(4200,'keise layout timeout')])
      for(let i=0;i<30;i++){window.__ISA_SHOW_KEISE_HOME__?.();if(finalReady())return true;await wait(80)}
      return finalReady()
    }
    if(typeof window.__ISA_SHOW_APPROVED_PROFILE_HOME__!=='function')await Promise.race([import('./approved-profile-dashboard.js?v=8-fail-open'),timeout(4200,'profile layout timeout')])
    for(let i=0;i<30;i++){window.__ISA_SHOW_APPROVED_PROFILE_HOME__?.();if(finalReady())return true;await wait(80)}
    return finalReady()
  }
  async function ensureDashboard(p){
    if(!p||!mainReady())return false
    if(Date.now()<retryAfter)return false
    if(bootPromise&&lastProfile===p)return bootPromise
    css();shield(true);lastProfile=p
    bootPromise=(async()=>{
      try{
        const ok=await Promise.race([buildFinal(p),timeout(5600,'dashboard timeout')])
        if(!ok)throw new Error('dashboard não ficou pronto')
        // Só agora escondemos o núcleo legado.
        document.body.classList.add('isa-final-shell-managed','isa-final-shell-ready')
        shield(false);$('isaApprovedShellShield')?.classList.add('hidden');window.__ISA_HIDE_BOOT_GUARD__?.()
        document.dispatchEvent(new CustomEvent('isa:final-shell-ready',{detail:{profile:p}}))
        loadThemeStack()
        return true
      }catch(err){
        retryAfter=Date.now()+7000
        releaseFallback(err?.message||'erro ao montar dashboard')
        return false
      }finally{setTimeout(()=>{bootPromise=null},250)}
    })()
    return bootPromise
  }
  function schedule(){
    clearTimeout(timer)
    timer=setTimeout(()=>{const p=profile();if(p&&mainReady())ensureDashboard(p)},30)
  }
  new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']})
  document.addEventListener('isa:approved-home-ready',schedule)
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule()})
  window.addEventListener('pageshow',schedule)

  // Proteção absoluta: nenhum link pode permanecer preso em um escudo para sempre.
  setTimeout(()=>{
    if(finalReady()){
      document.body.classList.add('isa-final-shell-managed','isa-final-shell-ready');shield(false);window.__ISA_HIDE_BOOT_GUARD__?.();return
    }
    releaseFallback('watchdog de 7s')
  },7000)

  let tries=0;const tick=()=>{schedule();if(++tries<90)setTimeout(tick,120)};tick()
  window.__ISA_FINAL_SHELL__={recover:schedule,ensureDashboard,theme:loadThemeStack,release:releaseFallback}
})()
