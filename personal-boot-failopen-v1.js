// Watchdog passivo dos links pessoais — V10.
// Não reconstrói dashboard e não força navegação em intervalos.
(function(){
  'use strict'
  if(window.__ISA_PERSONAL_BOOT_FAILOPEN_V10__)return
  window.__ISA_PERSONAL_BOOT_FAILOPEN_V10__=true

  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const APPROVED=new Set(['keise','isa','alan'])
  const requested=()=>norm(new URLSearchParams(location.search).get('perfil'))
  const identity=()=>norm($('myName')?.textContent)
  const profile=()=>{const r=requested(),n=identity();for(const p of APPROVED)if(r===p||n===p||n.startsWith(p+' '))return p;return''}
  const mainReady=()=>!!$('mainView')&&!$('mainView').classList.contains('hidden')
  const loginReady=()=>!!$('loginView')&&!$('loginView').classList.contains('hidden')
  const approvedReady=()=>{
    const p=profile(),home=$('keiseApprovedHome'),top=$('keiseApprovedTopbar')
    return APPROVED.has(p)&&mainReady()&&!!home&&!home.classList.contains('hidden')&&!!top&&!top.classList.contains('hidden')&&document.body.classList.contains('isa-approved-single-owner')&&document.body.classList.contains('keise-home-active')&&document.body.classList.contains(`approved-profile-${p}`)
  }
  function hideGuard(){const g=$('personalBootGuard');if(g){g.classList.add('hidden');g.style.pointerEvents='none'}try{window.__ISA_HIDE_BOOT_GUARD__?.()}catch{}}
  function scan(){
    if(loginReady()&&!mainReady()){hideGuard();return false}
    if(APPROVED.has(profile())){
      window.__ISA_APPROVED_DASHBOARD__?.tryBuild?.()
      if(approvedReady()){hideGuard();return true}
      return false
    }
    if(mainReady()){hideGuard();return true}
    return false
  }
  for(const ev of ['isa:approved-home-ready','isa:keise-approved-home-built','isa:final-shell-ready','isa:core-ready','isa:core-boot-complete'])document.addEventListener(ev,scan)
  window.addEventListener('pageshow',scan,{once:true})
  setTimeout(scan,0)
  // Fail-safe visual: remove somente o spinner; nunca revela a sidebar legada como dashboard.
  setTimeout(()=>{if(!approvedReady()&&APPROVED.has(profile()))window.__ISA_APPROVED_DASHBOARD__?.tryBuild?.();hideGuard()},12000)
  window.__ISA_PERSONAL_BOOT_FAILOPEN__={release:scan,scan,approvedHomeReady:approvedReady,profile}
})();