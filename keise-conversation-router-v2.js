// Cantinho da Isa — roteador seguro de conversas.
// Garante que um clique abra somente o UUID daquele card, sem trocar para outra pessoa.
(function(){
  'use strict'
  if(window.__ISA_CONVERSATION_ROUTER_SAFETY_V4__)return
  window.__ISA_CONVERSATION_ROUTER_SAFETY_V4__=true

  const $=id=>document.getElementById(id)
  const now=()=>Date.now()
  const safeCss=v=>{try{return CSS.escape(String(v||''))}catch{return String(v||'').replace(/["\\]/g,'\\$&')}}
  const approvedProfiles=new Set(['keise','isa','alan'])
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const profile=()=>{
    const q=norm(new URLSearchParams(location.search).get('perfil'))
    const n=norm($('myName')?.textContent)
    for(const p of approvedProfiles)if(q===p||n===p||n.startsWith(p+' '))return p
    return''
  }

  let intendedId=''
  let intendedUntil=0
  let internalNativeId=''
  let verifyToken=0
  let observer=null

  function originalCard(id){
    if(!id)return null
    return document.querySelector(`#chatList .chat-item[data-conv="${safeCss(id)}"]`)
  }

  function currentActiveId(){
    return String(document.querySelector('#chatList .chat-item.active[data-conv]')?.dataset?.conv||'')
  }

  function arm(id){
    intendedId=String(id||'')
    intendedUntil=now()+3200
    verifyToken++
    try{sessionStorage.setItem('isa-intended-conversation',intendedId)}catch{}
    return verifyToken
  }

  function invokeNative(id){
    const card=originalCard(id)
    if(!card)return false
    internalNativeId=String(id)
    try{HTMLElement.prototype.click.call(card)}
    catch{try{card.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}))}catch{internalNativeId='';return false}}
    internalNativeId=''
    return true
  }

  function verify(id,token,attempt=0){
    if(token!==verifyToken||String(id)!==intendedId||now()>intendedUntil)return
    const panel=$('chatPanel')
    const active=currentActiveId()
    if(panel&&!panel.classList.contains('hidden')&&active&&active!==String(id)){
      if(attempt>=3)return
      invokeNative(id)
      setTimeout(()=>verify(id,token,attempt+1),180)
      return
    }
    if(attempt<3)setTimeout(()=>verify(id,token,attempt+1),260)
  }

  function openExact(id){
    id=String(id||'')
    if(!id)return false
    const token=arm(id)
    try{window.__ISA_APPROVED_DASHBOARD__?.enterPanel?.()}catch{}
    let tries=0
    const run=()=>{
      if(token!==verifyToken)return
      if(invokeNative(id)){
        setTimeout(()=>verify(id,token,0),90)
        return
      }
      if(++tries<18)setTimeout(run,70)
      else{
        try{window.__ISA_SHOW_APPROVED_PROFILE_HOME__?.()}catch{}
        const t=$('toast');if(t){t.textContent='Essa conversa ainda está sincronizando. Tente novamente.';t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),2200)}
      }
    }
    run()
    return true
  }

  function sanitizeApprovedCards(root=document){
    root.querySelectorAll?.('#kaConversationList .ka-conv-card').forEach(card=>{
      const id=String(card.dataset.sourceConv||card.dataset.kaConv||card.dataset.safeConv||'')
      if(!id)return
      card.dataset.safeConv=id
      card.dataset.sourceConv=id
      // O controlador antigo captura data-ka-conv no window antes dos demais listeners.
      // Removemos apenas essa rota antiga; data-source-conv continua para ordem/pin/avatar.
      if(card.hasAttribute('data-ka-conv'))card.removeAttribute('data-ka-conv')
    })
  }

  function bindObserver(){
    if(observer)return
    observer=new MutationObserver(ms=>{
      for(const m of ms){
        if(m.type==='attributes'&&m.target?.matches?.('#kaConversationList .ka-conv-card'))sanitizeApprovedCards(m.target.parentElement||document)
        else if(m.type==='childList')for(const n of m.addedNodes)if(n.nodeType===1)sanitizeApprovedCards(n.matches?.('#kaConversationList')?n:n.parentElement||n)
      }
    })
    observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['data-ka-conv']})
  }

  // Cards do dashboard aprovado: captura pelo ID estável e abre exatamente o original correspondente.
  document.addEventListener('click',e=>{
    const card=e.target?.closest?.('#kaConversationList .ka-conv-card[data-safe-conv],#kaConversationList .ka-conv-card[data-source-conv]')
    if(card){
      const id=String(card.dataset.safeConv||card.dataset.sourceConv||'')
      if(!id)return
      e.preventDefault();e.stopImmediatePropagation()
      openExact(id)
      return
    }

    const native=e.target?.closest?.('#chatList .chat-item[data-conv]')
    if(!native)return
    const id=String(native.dataset.conv||'')
    if(!id)return

    // Um clique sintético de outro módulo não pode trocar a conversa enquanto uma seleção exata está em andamento.
    if(!e.isTrusted&&internalNativeId!==id&&intendedId&&now()<intendedUntil&&id!==intendedId){
      e.preventDefault();e.stopImmediatePropagation();return
    }
    if(internalNativeId===id)return
    const token=arm(id)
    setTimeout(()=>verify(id,token,0),90)
  },true)

  document.addEventListener('keydown',e=>{
    if(!['Enter',' '].includes(e.key))return
    const card=e.target?.closest?.('#kaConversationList .ka-conv-card[data-safe-conv],#kaConversationList .ka-conv-card[data-source-conv]')
    if(!card)return
    const id=String(card.dataset.safeConv||card.dataset.sourceConv||'')
    if(!id)return
    e.preventDefault();e.stopImmediatePropagation();openExact(id)
  },true)

  for(const ev of ['isa:approved-home-ready','isa:keise-approved-home-built','isa:core-ready'])document.addEventListener(ev,()=>setTimeout(()=>sanitizeApprovedCards(),0))
  window.addEventListener('pageshow',()=>setTimeout(()=>sanitizeApprovedCards(),0),{once:true})

  window.__ISA_OPEN_KEISE_STABLE_CONVERSATION__=openExact
  window.__ISA_OPEN_EXACT_CONVERSATION__=openExact
  window.__ISA_CONVERSATION_ROUTER_SAFETY__={openExact,sanitize:()=>sanitizeApprovedCards(),get intendedId(){return intendedId},get activeId(){return currentActiveId()}}

  bindObserver();sanitizeApprovedCards();setTimeout(()=>sanitizeApprovedCards(),120);setTimeout(()=>sanitizeApprovedCards(),700)
})();