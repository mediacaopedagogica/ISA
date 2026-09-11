// Shell pessoal aprovado — V3 de recuperação.
// Regra principal: o núcleo funcional NUNCA fica bloqueado por CSS/overlay.
// O layout aprovado só substitui visualmente o núcleo depois que estiver realmente montado.
(function(){
  'use strict'
  if(window.__ISA_FINAL_SHELL_BOOTSTRAP_V3__){window.__ISA_FINAL_SHELL__?.scan?.();return}
  window.__ISA_FINAL_SHELL_BOOTSTRAP_V3__=true

  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const wait=ms=>new Promise(r=>setTimeout(r,ms))
  const APPROVED=new Set(['keise','isa','alan'])
  let loading=null,lastProfile='',scanQueued=false,readySent=false

  function requested(){const p=norm(new URLSearchParams(location.search).get('perfil'));return APPROVED.has(p)?p:''}
  function identified(){
    const n=norm($('myName')?.textContent)
    for(const p of APPROVED)if(n===p||n.startsWith(p+' '))return p
    return''
  }
  function profile(){return requested()||identified()}
  function mainReady(){const m=$('mainView');return !!m&&!m.classList.contains('hidden')}
  function loginReady(){const l=$('loginView');return !!l&&!l.classList.contains('hidden')}
  function home(){return $('keiseApprovedHome')}
  function homeReady(){const h=home();return !!h&&!h.classList.contains('hidden')}

  function installCss(){
    if($('isaFinalShellBootstrapCssV3'))return
    const s=document.createElement('style');s.id='isaFinalShellBootstrapCssV3';s.textContent=`
      /* Só escondemos o núcleo DEPOIS que o dashboard final existe e está visível. */
      body.isa-final-shell-v3-ready #mainView{visibility:visible!important;opacity:1!important;pointer-events:auto!important}
      body.isa-final-shell-v3-ready #mainView>.sidebar{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;width:0!important;min-width:0!important;max-width:0!important;padding:0!important;margin:0!important;border:0!important;overflow:hidden!important}
      body.isa-final-shell-v3-ready #emptyState{display:none!important;visibility:hidden!important;pointer-events:none!important}
      body.isa-final-shell-v3-ready:not(.keise-panel-active) #mainView>.content>section:not(#keiseApprovedHome){display:none!important;visibility:hidden!important;pointer-events:none!important}
      body.isa-final-shell-v3-ready #keiseApprovedHome,
      body.isa-final-shell-v3-ready #keiseApprovedTopbar,
      body.isa-final-shell-v3-ready [data-ka-action],
      body.isa-final-shell-v3-ready [data-approved-action]{pointer-events:auto!important}
      /* Neutraliza travas deixadas por bootstraps anteriores. */
      body:not(.isa-final-shell-v3-ready) #mainView{pointer-events:auto!important}
    `
    document.head.appendChild(s)
  }

  function removeOldLocks(){
    const b=document.body;if(!b)return
    ;['isa-shell-identity-gate','isa-approved-route-lock-v3','isa-approved-route-lock-v4','isa-approved-route-lock-v5','isa-approved-route-lock-v6','isa-approved-route-lock-v7','isa-approved-route-lock-v8','isa-approved-awaiting','isa-approved-ready','isa-final-shell-managed','isa-approved-shell-lock'].forEach(c=>b.classList.remove(c))
    $('isaFinalShellShield')?.remove();$('isaFinalShellShieldV2')?.remove()
    const main=$('mainView');if(main){main.style.removeProperty('pointer-events');main.style.removeProperty('visibility');main.style.removeProperty('opacity')}
  }
  function hideGuard(){
    const g=$('personalBootGuard');if(g){g.classList.add('hidden');g.style.removeProperty('pointer-events')}
  }
  function failOpen(error){
    console.error('[shell aprovado v3] modo seguro:',error)
    removeOldLocks();document.body?.classList.remove('isa-final-shell-v3-ready','isa-final-shell-ready','keise-dashboard-mode','keise-home-active','keise-panel-active')
    hideGuard()
    const main=$('mainView');if(main&&!main.classList.contains('hidden')){main.style.setProperty('visibility','visible','important');main.style.setProperty('opacity','1','important');main.style.setProperty('pointer-events','auto','important')}
    document.dispatchEvent(new CustomEvent('isa:final-shell-failopen',{detail:{message:String(error?.message||error||'Falha no layout final')}}))
    return false
  }

  function modulePath(p){return p==='keise'?'./keise-approved-layout-final.js?v=12-clickable-shell':'./approved-profile-dashboard.js?v=12-clickable-shell'}
  function showFn(p){return p==='keise'?window.__ISA_SHOW_KEISE_HOME__:window.__ISA_SHOW_APPROVED_PROFILE_HOME__}

  async function ensureDashboard(p,{force=false}={}){
    if(!APPROVED.has(p)||!mainReady())return false
    if(homeReady()){markReady(p);return true}
    if(loading&&!force&&lastProfile===p)return loading
    lastProfile=p
    loading=(async()=>{
      try{
        installCss();removeOldLocks()
        await import(modulePath(p))
        const deadline=Date.now()+7000
        while(Date.now()<deadline){
          if(loginReady()&&!mainReady()){hideGuard();return false}
          try{showFn(p)?.()}catch(err){console.warn('[shell aprovado v3] montagem:',err)}
          if(homeReady()){markReady(p);return true}
          await wait(80)
        }
        throw new Error('O painel final não terminou de montar no tempo esperado.')
      }catch(error){return failOpen(error)}
      finally{loading=null}
    })()
    return loading
  }

  function markReady(p){
    installCss();removeOldLocks()
    document.body?.classList.add('isa-final-shell-v3-ready','isa-final-shell-ready')
    const main=$('mainView');if(main){main.style.removeProperty('pointer-events');main.style.removeProperty('visibility');main.style.removeProperty('opacity')}
    const h=home();if(h){h.classList.remove('hidden');h.style.setProperty('pointer-events','auto','important')}
    hideGuard();window.__ISA_HIDE_BOOT_GUARD__?.()
    if(!readySent){readySent=true;document.dispatchEvent(new CustomEvent('isa:final-shell-ready',{detail:{profile:p,version:'v3-clickable'}}))}
    return true
  }

  function scan(){
    installCss();removeOldLocks()
    if(loginReady()&&!mainReady()){hideGuard();return false}
    if(homeReady()){return markReady(profile()||'keise')}
    const p=profile()
    if(p&&mainReady())return ensureDashboard(p)
    if(mainReady()&&!p){hideGuard();return false}
    return false
  }
  function schedule(){if(scanQueued)return;scanQueued=true;queueMicrotask(()=>{scanQueued=false;scan()})}

  // Delegação de saída como proteção extra; não captura os demais cliques.
  document.addEventListener('click',e=>{
    const b=e.target?.closest?.('[data-ka-action="logout"],[data-approved-action="logout"],#kaLogout')
    if(!b)return
    const core=$('logoutBtn');if(core&&core!==b)setTimeout(()=>core.click(),0)
  },false)

  installCss();removeOldLocks()
  const app=$('app');if(app)new MutationObserver(schedule).observe(app,{subtree:true,childList:true,attributes:true,attributeFilter:['class']})
  window.addEventListener('pageshow',schedule)
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule()})
  document.addEventListener('isa:core-ready',schedule)
  document.addEventListener('isa:core-boot-complete',schedule)
  document.addEventListener('isa:approved-home-ready',schedule)
  setTimeout(schedule,0);setTimeout(schedule,250);setTimeout(schedule,900)

  // Última proteção: nunca deixar uma camada de boot capturando cliques indefinidamente.
  setTimeout(()=>{
    if(homeReady())markReady(profile()||'keise')
    else if(mainReady())failOpen(new Error('Fail-open preventivo: mantendo o núcleo clicável.'))
    else if(loginReady())hideGuard()
  },9000)

  window.__ISA_FINAL_SHELL__={scan,recover:scan,retry:scan,ensureDashboard,failOpen,get state(){return homeReady()?'ready':mainReady()?'core-ready':'waiting'}}
})()
