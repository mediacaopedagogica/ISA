// Compatibilidade do roteador de conversas do dashboard aprovado.
// O controlador V10 continua sendo o único responsável por abrir a conversa.
(function(){
  'use strict'
  if(window.__ISA_KEISE_CONVERSATION_ROUTER_COMPAT_V4__)return
  window.__ISA_KEISE_CONVERSATION_ROUTER_COMPAT_V4__=true

  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ')
  const APPROVED=new Set(['keise','isa','alan'])
  const profile=()=>{
    const q=norm(new URLSearchParams(location.search).get('perfil'))
    const n=norm($('myName')?.textContent)
    for(const p of APPROVED)if(q===p||n===p||n.startsWith(p+' '))return p
    return''
  }

  let selectedId='',expectedTitle='',repairing=false,repairs=0,timer=0,titleObserver=null
  const sourceCard=id=>[...document.querySelectorAll('#chatList .chat-item[data-conv]')].find(x=>String(x.dataset.conv||'')===String(id))||null
  const titleOf=card=>String(card?.querySelector?.('.grow strong,strong')?.textContent||'').replace(/★/g,'').trim()
  const panelOpen=()=>APPROVED.has(profile())&&document.body.classList.contains('keise-panel-active')&&!$('chatPanel')?.classList.contains('hidden')

  function remember(card){
    const id=String(card?.dataset?.kaConv||card?.dataset?.sourceConv||'')
    if(!id)return
    selectedId=id;expectedTitle=titleOf(card);repairs=0
    window.__ISA_SELECTED_CONVERSATION_ID__=id
    ;[100,260,650,1200].forEach(ms=>setTimeout(verify,ms))
  }
  function verify(){
    if(!selectedId||!panelOpen()||repairing)return
    const src=sourceCard(selectedId);if(!src)return
    const active=String(document.querySelector('#chatList .chat-item[data-conv].active')?.dataset?.conv||'')
    const shown=norm($('chatTitle')?.textContent),wanted=norm(expectedTitle||titleOf(src))
    if(active===selectedId&&(!wanted||shown===wanted))return
    if(repairs>=2)return
    repairs++;repairing=true;src.click();setTimeout(()=>{repairing=false},80)
  }
  function clear(){selectedId='';expectedTitle='';repairs=0;repairing=false;clearTimeout(timer);window.__ISA_SELECTED_CONVERSATION_ID__=''}
  function bind(){
    const title=$('chatTitle');if(title&&!titleObserver){titleObserver=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(verify,50)});titleObserver.observe(title,{childList:true,subtree:true,characterData:true})}
  }

  document.addEventListener('pointerdown',e=>{if(!APPROVED.has(profile()))return;const card=e.target?.closest?.('#kaConversationList .ka-conv-card[data-ka-conv]');if(card)remember(card)},true)
  document.addEventListener('focusin',e=>{if(!APPROVED.has(profile()))return;const card=e.target?.closest?.('#kaConversationList .ka-conv-card[data-ka-conv]');if(card)remember(card)},true)
  document.addEventListener('isa:approved-home-ready',clear,{passive:true})
  document.addEventListener('isa:core-back',clear,{passive:true})
  bind();setTimeout(bind,500)

  window.__ISA_OPEN_KEISE_STABLE_CONVERSATION__=id=>window.__ISA_APPROVED_DASHBOARD__?.openConversation?.(id)??false
  window.__ISA_CONVERSATION_IDENTITY_GUARD__={verify,get selectedId(){return selectedId}}
})();
