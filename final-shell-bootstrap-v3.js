// Shell final V10 — passivo e dirigido por eventos.
// Não constrói dashboard, não faz polling e não chama recuperações em loop.
(function(){
  'use strict'
  if(window.__ISA_FINAL_SHELL_BOOTSTRAP_V10__){window.__ISA_FINAL_SHELL__?.scan?.();return}
  window.__ISA_FINAL_SHELL_BOOTSTRAP_V10__=true

  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const APPROVED=new Set(['keise','isa','alan'])
  let state='waiting',readySent=false,observer=null,timer=null

  const requested=()=>{const p=norm(new URLSearchParams(location.search).get('perfil'));return APPROVED.has(p)?p:''}
  const identified=()=>{const n=norm($('myName')?.textContent);for(const p of APPROVED)if(n===p||n.startsWith(p+' '))return p;return''}
  const profile=()=>requested()||identified()
  const mainReady=()=>!!$('mainView')&&!$('mainView').classList.contains('hidden')
  const loginReady=()=>!!$('loginView')&&!$('loginView').classList.contains('hidden')
  const coreReady=()=>window.__ISA_APP_READY__===true
  const approvedReady=()=>{
    const p=profile(),home=$('keiseApprovedHome'),top=$('keiseApprovedTopbar')
    return APPROVED.has(p)&&coreReady()&&mainReady()&&!!home&&!home.classList.contains('hidden')&&!!top&&!top.classList.contains('hidden')&&document.body.classList.contains('isa-approved-single-owner')&&document.body.classList.contains('keise-home-active')&&document.body.classList.contains(`approved-profile-${p}`)
  }

  function hideGuard(){const g=$('personalBootGuard');if(g){g.classList.add('hidden');g.style.pointerEvents='none'}try{window.__ISA_HIDE_BOOT_GUARD__?.()}catch{}}
  function stop(){try{observer?.disconnect()}catch{}observer=null;if(timer){clearTimeout(timer);timer=null}}
  function emit(detail){
    if(state==='ready')return true
    state='ready';hideGuard();stop()
    if(!readySent){readySent=true;const d=detail||{profile:profile()||'family',version:'v10-event-driven'};document.dispatchEvent(new CustomEvent('isa:final-shell-ready',{detail:d}));window.dispatchEvent(new CustomEvent('isa:final-shell-ready',{detail:d}))}
    return true
  }
  function scan(){
    if(state==='ready')return true
    if(loginReady()&&!mainReady()){state='login';hideGuard();return false}
    const p=profile()
    if(APPROVED.has(p)){
      if(approvedReady())return emit({profile:p,version:'v10-event-driven'})
      state=coreReady()?'waiting-approved':'waiting-core'
      if(coreReady())window.__ISA_APPROVED_DASHBOARD__?.tryBuild?.()
      return false
    }
    if(mainReady()&&coreReady())return emit({profile:p||'family',version:'v10-event-driven'})
    state='waiting';return false
  }
  function schedule(delay=0){if(state==='ready')return;if(timer)clearTimeout(timer);timer=setTimeout(()=>{timer=null;scan()},delay)}

  const app=$('app');if(app){observer=new MutationObserver(()=>schedule(40));observer.observe(app,{subtree:true,childList:true,attributes:true,characterData:true,attributeFilter:['class']})}
  for(const ev of ['isa:approved-home-ready','isa:keise-approved-home-built','isa:core-ready','isa:core-boot-complete'])document.addEventListener(ev,()=>schedule(0))
  window.addEventListener('pageshow',()=>schedule(0),{once:true})
  setTimeout(()=>schedule(0),0)
  setTimeout(()=>{if(state!=='ready'&&loginReady()&&!mainReady())hideGuard()},9000)

  window.__ISA_FINAL_SHELL__={scan,recover:scan,retry:()=>{schedule(0);return false},unlock:()=>{hideGuard();return scan()},getState:()=>state,isReady:()=>state==='ready',approvedReady,get state(){return state}}
})();