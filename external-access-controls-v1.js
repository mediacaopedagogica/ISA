// Controles físicos de entrada/saída dos links familiares.
// Funciona mesmo se um módulo visual tardio reconstruir botões.
(function(){
  'use strict'
  if(window.__ISA_EXTERNAL_ACCESS_CONTROLS_V1__)return
  window.__ISA_EXTERNAL_ACCESS_CONTROLS_V1__=true
  let touchAt=0
  function enter(){
    if(window.__ISA_FRIEND_ACCESS_VALID__===true&&typeof window.__ISA_FRIEND_ENTER_PORTAL__==='function'){window.__ISA_FRIEND_ENTER_PORTAL__();return true}
    if(typeof window.__ISA_FRIEND_BOOTSTRAP__==='function'){window.__ISA_FRIEND_BOOTSTRAP__();return true}
    setTimeout(()=>{if(window.__ISA_FRIEND_ACCESS_VALID__===true)window.__ISA_FRIEND_ENTER_PORTAL__?.();else window.__ISA_FRIEND_BOOTSTRAP__?.()},120);return false
  }
  function exit(){
    if(typeof window.__ISA_FRIEND_EXIT_PORTAL__==='function'){window.__ISA_FRIEND_EXIT_PORTAL__();return true}
    const gate=document.getElementById('friendGate'),chat=document.getElementById('friendChat')
    chat?.classList.add('hidden');gate?.classList.remove('hidden');document.body.classList.remove('friend-portal-open');window.__ISA_FRIEND_PORTAL_ENTERED__=false
    const b=document.getElementById('friendEnterBtn');if(b){b.disabled=false;b.dataset.mode='enter';b.textContent='Acessar 💜';b.classList.remove('hidden')}
    return true
  }
  function target(e){return e.target?.closest?.('#friendEnterBtn,#friendExitBtn')}
  function run(e){const b=target(e);if(!b)return;if(e.type==='click'&&Date.now()-touchAt<650)return;if(e.type==='pointerup'&&e.pointerType==='touch')touchAt=Date.now();e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();if(b.id==='friendEnterBtn')enter();else exit()}
  document.addEventListener('pointerup',run,true);document.addEventListener('click',run,true)
  // Mantém os botões realmente clicáveis depois de reconstruções de DOM.
  const scan=()=>{for(const id of ['friendEnterBtn','friendExitBtn']){const b=document.getElementById(id);if(!b)continue;b.disabled=false;b.style.setProperty('pointer-events','auto','important');b.style.setProperty('touch-action','manipulation','important');b.style.setProperty('position','relative','important');b.style.setProperty('z-index','1000','important')}}
  new MutationObserver(scan).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','disabled']});scan();setInterval(scan,1200)
  window.__ISA_EXTERNAL_ACCESS_CONTROLS__={enter,exit,scan}
})()
