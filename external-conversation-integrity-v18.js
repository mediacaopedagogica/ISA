// Cantinho da Isa — integridade de conversas dos acessos familiares externos.
// Um clique em uma pessoa nunca pode terminar em outra conversa.
(function(){
  'use strict'
  if(window.__ISA_EXTERNAL_CONVERSATION_INTEGRITY_V18__)return
  window.__ISA_EXTERNAL_CONVERSATION_INTEGRITY_V18__=true

  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ')
  let intendedId='',intendedTitle='',until=0,token=0,observer=null,retrying=false

  function titleOf(card){
    const strong=card?.querySelector?.('strong')
    if(!strong)return''
    const c=strong.cloneNode(true);c.querySelectorAll('.nuvem-pin-picker-trigger').forEach(x=>x.remove())
    return norm(String(c.textContent||'').replace(/^👥\s*/,'').replace(/[★☆⭐🌸💜💙🩷❤️]+/g,''))
  }
  function activeId(){return String(document.querySelector('#friendConversationList .friend-conversation.active[data-friend-conv]')?.dataset?.friendConv||'')}
  function threadTitle(){return norm($('friendThreadTitle')?.textContent||'')}
  function exactCard(id){return [...document.querySelectorAll('#friendConversationList .friend-conversation[data-friend-conv]')].find(x=>String(x.dataset.friendConv||'')===String(id))||null}
  function arm(card){
    intendedId=String(card?.dataset?.friendConv||'')
    intendedTitle=titleOf(card)
    until=Date.now()+5000;token++
    try{sessionStorage.setItem('isa-external-intended-conversation',intendedId)}catch{}
    return token
  }
  function clickExact(id){
    const card=exactCard(id);if(!card)return false
    retrying=true
    try{HTMLElement.prototype.click.call(card)}catch{retrying=false;return false}
    retrying=false;return true
  }
  function verify(t,attempt=0){
    if(t!==token||!intendedId||Date.now()>until)return
    const thread=$('friendThread'),open=thread&&!thread.classList.contains('hidden')
    const a=activeId(),title=threadTitle()
    const wrongId=!!(open&&a&&a!==intendedId)
    const wrongTitle=!!(open&&intendedTitle&&title&&title!==intendedTitle)
    if(wrongId||wrongTitle){
      if(attempt>=5)return
      clickExact(intendedId);setTimeout(()=>verify(t,attempt+1),160);return
    }
    if(attempt<4)setTimeout(()=>verify(t,attempt+1),250)
  }

  document.addEventListener('click',e=>{
    if(e.target?.closest?.('.nuvem-pin-picker-trigger,[data-nuvem-pin-picker],[data-pin-picker]'))return
    const card=e.target?.closest?.('#friendConversationList .friend-conversation[data-friend-conv]')
    if(!card)return
    const id=String(card.dataset.friendConv||'');if(!id)return
    if(!e.isTrusted&&!retrying&&intendedId&&Date.now()<until&&id!==intendedId){e.preventDefault();e.stopImmediatePropagation();return}
    if(retrying&&id===intendedId)return
    const t=arm(card);setTimeout(()=>verify(t,0),80)
  },true)

  function bindObserver(){
    if(observer)return
    observer=new MutationObserver(()=>{if(intendedId&&Date.now()<until)setTimeout(()=>verify(token,0),20)})
    observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']})
  }

  document.addEventListener('isa:friend-portal-entered',bindObserver,{once:true})
  bindObserver()
  window.__ISA_EXTERNAL_CONVERSATION_INTEGRITY__={verify:()=>verify(token,0),get intendedId(){return intendedId},get activeId(){return activeId()}}
})();