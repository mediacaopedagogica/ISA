// Entrada externa v77 — captura prioritária do botão Acessar/Tentar novamente.
// Evita que outro módulo impeça o acesso ao portal.
(function(){
  'use strict'
  if(window.__ISA_EXTERNAL_ENTER_RESCUE_V77__)return
  window.__ISA_EXTERNAL_ENTER_RESCUE_V77__=true

  function stop(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()}
  function run(){
    const valid=window.__ISA_FRIEND_ACCESS_VALID__===true
    if(valid&&typeof window.__ISA_FRIEND_ENTER_PORTAL__==='function'){
      window.__ISA_FRIEND_ENTER_PORTAL__()
      return true
    }
    if(typeof window.__ISA_FRIEND_BOOTSTRAP__==='function'){
      window.__ISA_FRIEND_BOOTSTRAP__()
      return true
    }
    // O botão só deveria aparecer depois do núcleo carregar; se houver atraso, tenta novamente logo em seguida.
    setTimeout(()=>{
      if(window.__ISA_FRIEND_ACCESS_VALID__===true&&typeof window.__ISA_FRIEND_ENTER_PORTAL__==='function')window.__ISA_FRIEND_ENTER_PORTAL__()
      else window.__ISA_FRIEND_BOOTSTRAP__?.()
    },120)
    return false
  }

  document.addEventListener('pointerup',e=>{
    const b=e.target?.closest?.('#friendEnterBtn')
    if(!b||e.pointerType!=='touch')return
    stop(e);run()
  },true)

  document.addEventListener('click',e=>{
    const b=e.target?.closest?.('#friendEnterBtn')
    if(!b)return
    stop(e);run()
  },true)

  window.__ISA_FORCE_ENTER_EXTERNAL__=run
})()
