// Cantinho da Isa — roteador seguro de conversas.
// O card visível e o UUID da conversa precisam apontar para a MESMA pessoa.
(function(){
  'use strict'
  if(window.__ISA_CONVERSATION_ROUTER_SAFETY_V5__)return
  window.__ISA_CONVERSATION_ROUTER_SAFETY_V5__=true

  const $=id=>document.getElementById(id)
  const now=()=>Date.now()
  const safeCss=v=>{try{return CSS.escape(String(v||''))}catch{return String(v||'').replace(/["\\]/g,'\\$&')}}
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ')
  const approvedProfiles=new Set(['keise','isa','alan'])
  const profile=()=>{
    const q=norm(new URLSearchParams(location.search).get('perfil'))
    const n=norm($('myName')?.textContent)
    for(const p of approvedProfiles)if(q===p||n===p||n.startsWith(p+' '))return p
    return''
  }

  let intendedId=''
  let intendedTitle=''
  let intendedUntil=0
  let internalNativeId=''
  let verifyToken=0
  let observer=null

  function cleanTitle(v){return norm(String(v||'').replace(/[★☆⭐🌸💜💙🩷❤️]+/g,'').replace(/\s+/g,' '))}
  function visibleTitle(card){
    if(!card)return''
    const strong=card.querySelector('.grow strong,strong')
    if(!strong)return''
    const clone=strong.cloneNode(true)
    clone.querySelectorAll('.unread-star,.nuvem-pin-picker-trigger').forEach(x=>x.remove())
    return cleanTitle(clone.textContent||'')
  }
  function originalCards(){return [...document.querySelectorAll('#chatList .chat-item[data-conv]')]}
  function originalCard(id){
    if(!id)return null
    return document.querySelector(`#chatList .chat-item[data-conv="${safeCss(id)}"]`)
  }
  function currentActiveId(){return String(document.querySelector('#chatList .chat-item.active[data-conv]')?.dataset?.conv||'')}
  function currentChatTitle(){return cleanTitle($('chatTitle')?.textContent||'')}

  // Se o visual e o UUID ficaram desencontrados por algum renderer antigo,
  // a pessoa que aparece escrita no card ganha prioridade. É exatamente o que o usuário clicou.
  function resolveIdFromCard(card){
    const stored=String(card?.dataset?.safeConv||card?.dataset?.sourceConv||card?.dataset?.kaConv||'')
    const title=visibleTitle(card)
    if(title){
      const matches=originalCards().filter(x=>visibleTitle(x)===title)
      if(matches.length===1){
        const exact=String(matches[0].dataset.conv||'')
        if(exact){
          card.dataset.safeConv=exact
          card.dataset.sourceConv=exact
          return exact
        }
      }
    }
    return stored
  }

  function arm(id,title=''){
    intendedId=String(id||'')
    intendedTitle=cleanTitle(title)
    intendedUntil=now()+5000
    verifyToken++
    try{sessionStorage.setItem('isa-intended-conversation',intendedId);sessionStorage.setItem('isa-intended-conversation-title',intendedTitle)}catch{}
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
    const panel=$('chatPanel'),active=currentActiveId(),title=currentChatTitle()
    const wrongId=!!(panel&&!panel.classList.contains('hidden')&&active&&active!==String(id))
    const wrongTitle=!!(panel&&!panel.classList.contains('hidden')&&intendedTitle&&title&&title!==intendedTitle)
    if(wrongId||wrongTitle){
      if(attempt>=5)return
      invokeNative(id)
      setTimeout(()=>verify(id,token,attempt+1),160)
      return
    }
    if(attempt<4)setTimeout(()=>verify(id,token,attempt+1),240)
  }

  function openExact(id,title=''){
    id=String(id||'')
    if(!id)return false
    const source=originalCard(id),expected=cleanTitle(title||visibleTitle(source))
    const token=arm(id,expected)
    try{window.__ISA_APPROVED_DASHBOARD__?.enterPanel?.()}catch{}
    let tries=0
    const run=()=>{
      if(token!==verifyToken)return
      if(invokeNative(id)){
        setTimeout(()=>verify(id,token,0),80)
        return
      }
      if(++tries<20)setTimeout(run,60)
      else{
        try{window.__ISA_SHOW_APPROVED_PROFILE_HOME__?.()}catch{}
        const t=$('toast');if(t){t.textContent='Essa conversa ainda está sincronizando. Tente novamente.';t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),2200)}
      }
    }
    run();return true
  }

  function sanitizeApprovedCards(root=document){
    root.querySelectorAll?.('#kaConversationList .ka-conv-card').forEach(card=>{
      const id=resolveIdFromCard(card)
      if(!id)return
      card.dataset.safeConv=id
      card.dataset.sourceConv=id
      // data-ka-conv pertence ao roteador visual antigo e é a principal fonte de desvio por posição.
      if(card.hasAttribute('data-ka-conv'))card.removeAttribute('data-ka-conv')
    })
  }

  function bindObserver(){
    if(observer)return
    observer=new MutationObserver(ms=>{
      let needs=false
      for(const m of ms){
        if(m.type==='attributes'&&m.target?.matches?.('#kaConversationList .ka-conv-card'))needs=true
        if(m.type==='childList'&&(m.addedNodes?.length||m.removedNodes?.length))needs=true
      }
      if(needs)queueMicrotask(()=>sanitizeApprovedCards())
    })
    observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['data-ka-conv','data-source-conv']})
  }

  document.addEventListener('click',e=>{
    const card=e.target?.closest?.('#kaConversationList .ka-conv-card')
    if(card){
      const title=visibleTitle(card),id=resolveIdFromCard(card)
      if(!id)return
      e.preventDefault();e.stopImmediatePropagation()
      openExact(id,title)
      return
    }

    const native=e.target?.closest?.('#chatList .chat-item[data-conv]')
    if(!native)return
    const id=String(native.dataset.conv||'')
    if(!id)return
    if(!e.isTrusted&&internalNativeId!==id&&intendedId&&now()<intendedUntil&&id!==intendedId){
      e.preventDefault();e.stopImmediatePropagation();return
    }
    if(internalNativeId===id)return
    const token=arm(id,visibleTitle(native))
    setTimeout(()=>verify(id,token,0),80)
  },true)

  document.addEventListener('keydown',e=>{
    if(!['Enter',' '].includes(e.key))return
    const card=e.target?.closest?.('#kaConversationList .ka-conv-card')
    if(!card)return
    const title=visibleTitle(card),id=resolveIdFromCard(card)
    if(!id)return
    e.preventDefault();e.stopImmediatePropagation();openExact(id,title)
  },true)

  for(const ev of ['isa:approved-home-ready','isa:keise-approved-home-built','isa:core-ready','isa:pin-style-changed'])document.addEventListener(ev,()=>setTimeout(()=>sanitizeApprovedCards(),0))
  window.addEventListener('pageshow',()=>setTimeout(()=>sanitizeApprovedCards(),0),{once:true})

  window.__ISA_OPEN_KEISE_STABLE_CONVERSATION__=(id)=>openExact(id,visibleTitle(originalCard(id)))
  window.__ISA_OPEN_EXACT_CONVERSATION__=window.__ISA_OPEN_KEISE_STABLE_CONVERSATION__
  window.__ISA_CONVERSATION_ROUTER_SAFETY__={openExact,sanitize:()=>sanitizeApprovedCards(),resolveIdFromCard,get intendedId(){return intendedId},get activeId(){return currentActiveId()}}

  bindObserver();sanitizeApprovedCards();setTimeout(()=>sanitizeApprovedCards(),100);setTimeout(()=>sanitizeApprovedCards(),500);setTimeout(()=>sanitizeApprovedCards(),1400)
})();