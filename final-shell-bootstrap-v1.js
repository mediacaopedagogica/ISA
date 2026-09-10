// Bootstrap definitivo dos dashboards pessoais aprovados.
// O DOM legado continua somente como núcleo funcional e nunca volta a ser a interface visível.
(function(){
  'use strict'
  if(window.__ISA_FINAL_SHELL_BOOTSTRAP_V1__)return
  window.__ISA_FINAL_SHELL_BOOTSTRAP_V1__=true
  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const wait=ms=>new Promise(r=>setTimeout(r,ms))
  let bootPromise=null,themePromise=null,timer=0,lastProfile=''

  function profile(){
    const q=norm(new URLSearchParams(location.search).get('perfil'))
    const n=norm($('myName')?.textContent)
    for(const p of ['keise','isa','alan'])if(q===p||n===p||n.startsWith(p+' '))return p
    return''
  }
  function mainReady(){const m=$('mainView');return !!m&&!m.classList.contains('hidden')}
  function finalReady(){return !!$('keiseApprovedHome')&&!$('keiseApprovedHome').classList.contains('hidden')&&!!$('keiseApprovedTopbar')&&!$('keiseApprovedTopbar').classList.contains('hidden')}
  function css(){
    if($('isaFinalShellBootstrapCss'))return
    const s=document.createElement('style');s.id='isaFinalShellBootstrapCss';s.textContent=`
      body.isa-final-shell-managed #mainView>.sidebar{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;width:0!important;min-width:0!important;max-width:0!important;padding:0!important;margin:0!important;border:0!important;overflow:hidden!important}
      body.isa-final-shell-managed #emptyState{display:none!important;visibility:hidden!important}
      body.isa-final-shell-managed:not(.keise-panel-active) #mainView>.content>section:not(#keiseApprovedHome){display:none!important}
      #isaFinalShellShield{position:fixed;inset:0;z-index:119900;display:grid;place-items:center;background:radial-gradient(circle at 16% 12%,#fff0f7 0 17%,transparent 42%),radial-gradient(circle at 87% 11%,#eee7ff 0 18%,transparent 43%),linear-gradient(145deg,#fffafd,#f7f2ff 58%,#f0f8ff);transition:opacity .16s ease,visibility .16s ease}
      #isaFinalShellShield.hidden{opacity:0;visibility:hidden;pointer-events:none}
      #isaFinalShellShield .isa-final-card{padding:24px 30px;border:1px solid rgba(255,255,255,.96);border-radius:30px;background:rgba(255,255,255,.87);box-shadow:0 20px 52px rgba(92,67,111,.12);text-align:center;color:#5b4366;font:800 15px/1.4 Inter,"Segoe UI",sans-serif}
      #isaFinalShellShield .isa-final-heart{font-size:38px;margin-bottom:7px;color:#df8fbe}
    `;document.head.appendChild(s)
  }
  function shield(show=true){
    let el=$('isaFinalShellShield')
    if(!el){el=document.createElement('div');el.id='isaFinalShellShield';el.innerHTML='<div class="isa-final-card"><div class="isa-final-heart">♥</div>Abrindo seu Cantinho…</div>';document.body.appendChild(el)}
    el.classList.toggle('hidden',!show);return el
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
  async function ensureDashboard(p){
    if(!p||!mainReady())return false
    css();document.body.classList.add('isa-final-shell-managed');shield(true)
    if(bootPromise&&lastProfile===p)return bootPromise
    lastProfile=p
    bootPromise=(async()=>{
      if(p==='keise'){
        if(typeof window.__ISA_SHOW_KEISE_HOME__!=='function')await import('./keise-approved-layout-final.js?v=7-hardwired-final')
        for(let i=0;i<22;i++){window.__ISA_SHOW_KEISE_HOME__?.();if(finalReady())break;await wait(90)}
      }else{
        if(typeof window.__ISA_SHOW_APPROVED_PROFILE_HOME__!=='function')await import('./approved-profile-dashboard.js?v=7-hardwired-final')
        for(let i=0;i<22;i++){window.__ISA_SHOW_APPROVED_PROFILE_HOME__?.();if(finalReady())break;await wait(90)}
      }
      if(finalReady()){
        document.body.classList.add('isa-final-shell-ready')
        shield(false);window.__ISA_HIDE_BOOT_GUARD__?.()
        document.dispatchEvent(new CustomEvent('isa:final-shell-ready',{detail:{profile:p}}))
      }
      loadThemeStack()
      return finalReady()
    })().catch(err=>{console.error('[layout final]',err);return false}).finally(()=>{setTimeout(()=>{bootPromise=null},250)})
    return bootPromise
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(()=>{const p=profile();if(p&&mainReady())ensureDashboard(p)},20)}

  // Se qualquer módulo tentar ressuscitar a casca antiga, reaplica a interface final imediatamente.
  const obs=new MutationObserver(schedule);obs.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']})
  document.addEventListener('isa:approved-home-ready',schedule)
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule()})
  window.addEventListener('pageshow',schedule)

  // Fallback do botão Sair dos dashboards aprovados: o clique nativo continua sendo a primeira opção.
  document.addEventListener('click',e=>{
    const b=e.target?.closest?.('[data-ka-action="logout"],[data-approved-action="logout"],#kaLogout')
    if(!b)return
    const p=profile()||'perfil'
    setTimeout(()=>{
      const main=$('mainView');if(!main||main.classList.contains('hidden'))return
      const core=$('logoutBtn');if(core&&core!==b)core.click()
      setTimeout(()=>{
        const still=$('mainView');if(!still||still.classList.contains('hidden'))return
        try{for(const store of [localStorage,sessionStorage]){const keys=[];for(let i=0;i<store.length;i++){const k=store.key(i)||'';if(/auth-token|supabase/i.test(k))keys.push(k)}keys.forEach(k=>store.removeItem(k))}}catch{}
        location.replace('./?sair='+encodeURIComponent(p)+'&_cb='+Date.now())
      },1100)
    },350)
  },false)

  // O script pode entrar antes do app principal; fica aguardando a identidade real sem mostrar o legado.
  let tries=0;const tick=()=>{schedule();if(++tries<180)setTimeout(tick,100)};tick()
  window.__ISA_FINAL_SHELL__={recover:schedule,ensureDashboard,theme:loadThemeStack}
})()
