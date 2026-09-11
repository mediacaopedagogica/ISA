// Keise — roteador único das conversas do dashboard FINAL aprovado.
// O card visual é apenas um espelho de #chatList. Primeiro deixamos o núcleo abrir a conversa;
// só depois trocamos o shell para o painel. Isso evita travar o layout aprovado.
(function(){
  'use strict'
  if(window.__ISA_KEISE_CONVERSATION_ROUTER_V2__)return
  window.__ISA_KEISE_CONVERSATION_ROUTER_V2__=true

  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const isKeise=()=>{
    const requested=norm(new URLSearchParams(location.search).get('perfil'))
    const current=norm(document.getElementById('myName')?.textContent)
    return requested==='keise'||current==='keise'||current.startsWith('keise ')
  }
  const sourceById=id=>[...(document.querySelectorAll('#chatList .chat-item[data-conv]')||[])].find(x=>String(x.dataset.conv||'')===String(id))||null

  let opening=false,lastKey='',lastAt=0
  function toast(text){
    const t=document.getElementById('toast');if(!t)return
    t.textContent=text;t.classList.remove('hidden');clearTimeout(t._kcr);t._kcr=setTimeout(()=>t.classList.add('hidden'),2200)
  }
  function conversationCard(target){
    return target?.closest?.('#kaConversationListStable .ka-conv-card[data-source-conv]')||null
  }
  function conversationId(card){return String(card?.dataset?.sourceConv||'')}

  function open(id){
    if(!id||opening)return false
    const source=sourceById(id)
    if(!source){toast('Essa conversa ainda está sincronizando.');return false}
    opening=true
    try{
      // IMPORTANTE: o núcleo v34 precisa receber o clique enquanto sua árvore nativa ainda está intacta.
      // Só no frame seguinte escondemos o shell legado e mostramos o painel real.
      try{HTMLElement.prototype.click.call(source)}catch{source.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}))}
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        window.__ISA_KEISE_ENTER_PANEL__?.()
        try{document.dispatchEvent(new CustomEvent('isa:chat-opened',{detail:{conversationId:id}}))}catch{}
      }))
      return true
    }finally{setTimeout(()=>{opening=false},320)}
  }

  function route(e){
    if(!isKeise())return
    // Fixador continua pertencendo ao seletor de pins; não abrimos a conversa ao tocar nele.
    if(e.target?.closest?.('.nuvem-pin-picker-trigger'))return
    const card=conversationCard(e.target);if(!card)return
    const id=conversationId(card);if(!id)return
    const key='conv:'+id,now=performance.now()
    if(e.type==='click'&&key===lastKey&&now-lastAt<700){e.preventDefault();e.stopImmediatePropagation();return}
    if(e.type==='pointerup'){lastKey=key;lastAt=now}
    e.preventDefault();e.stopImmediatePropagation();open(id)
  }
  function keyRoute(e){
    if(!isKeise()||!['Enter',' '].includes(e.key))return
    if(e.target?.closest?.('.nuvem-pin-picker-trigger'))return
    const card=conversationCard(e.target);if(!card)return
    e.preventDefault();e.stopImmediatePropagation();open(conversationId(card))
  }

  // window/capture acontece antes do listener legado do espelho em document/element.
  window.addEventListener('pointerup',route,true)
  window.addEventListener('click',route,true)
  window.addEventListener('keydown',keyRoute,true)

  window.__ISA_OPEN_KEISE_STABLE_CONVERSATION__=open
})();
