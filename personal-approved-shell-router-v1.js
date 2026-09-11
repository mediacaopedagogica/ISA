// Isa Chat — roteador central dos shells aprovados de Keise, Isa e Alan.
// Um único ponto de captura para botões visíveis; não reconstrói DOM e não usa observers/intervalos.
(function(){
  'use strict'
  if(window.__ISA_PERSONAL_APPROVED_SHELL_ROUTER_V1__)return
  window.__ISA_PERSONAL_APPROVED_SHELL_ROUTER_V1__=true

  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const requested=()=>norm(new URLSearchParams(location.search).get('perfil'))
  const current=()=>norm(document.getElementById('myName')?.textContent)
  const profile=()=>{
    const r=requested(),n=current()
    for(const p of ['keise','isa','alan'])if(r===p||n===p||n.startsWith(p+' '))return p
    return''
  }
  const approved=()=>!!profile()
  let lastKey='',lastAt=0,running=false

  function home(){
    const p=profile();if(!p)return false
    if(p==='keise'){window.__ISA_SHOW_KEISE_HOME__?.();return true}
    window.__ISA_SHOW_APPROVED_PROFILE_HOME__?.();return true
  }
  function run(action){
    const p=profile();if(!p||!action||running)return false
    running=true
    try{
      if(p==='keise'&&typeof window.__ISA_KEISE_RUN_ACTION__==='function'){window.__ISA_KEISE_RUN_ACTION__(action);return true}
      if((p==='isa'||p==='alan')&&typeof window.__ISA_APPROVED_PROFILE_RUN_ACTION__==='function'){window.__ISA_APPROVED_PROFILE_RUN_ACTION__(action);return true}
      return false
    }finally{setTimeout(()=>{running=false},180)}
  }
  function stableConversation(card){
    if(!card)return false
    const id=String(card.dataset.sourceConv||card.dataset.kaConv||'');if(!id)return false
    if(profile()==='keise'&&typeof window.__ISA_OPEN_KEISE_STABLE_CONVERSATION__==='function')return !!window.__ISA_OPEN_KEISE_STABLE_CONVERSATION__(id)
    const src=[...(document.querySelectorAll('#chatList .chat-item[data-conv]')||[])].find(x=>String(x.dataset.conv||'')===id)
    if(!src)return false
    try{HTMLElement.prototype.click.call(src)}catch{src.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}))}
    requestAnimationFrame(()=>requestAnimationFrame(()=>{window.__ISA_APPROVED_PROFILE_ENTER_PANEL__?.();try{document.dispatchEvent(new CustomEvent('isa:chat-opened',{detail:{conversationId:id}}))}catch{}}))
    return true
  }

  function route(e){
    if(!approved())return
    const action=e.target?.closest?.('[data-ka-action],[data-approved-action]')
    const fixedBack=e.target?.closest?.('#kaPanelBack,#approvedPanelBack')
    const stable=e.target?.closest?.('#kaConversationListStable .ka-conv-card[data-source-conv],#kaConversationList .ka-conv-card[data-source-conv]')
    if(!action&&!fixedBack&&!stable)return
    if(e.target?.closest?.('.nuvem-pin-picker-trigger'))return
    const key=fixedBack?'back':action?`a:${action.dataset.kaAction||action.dataset.approvedAction||''}`:`c:${stable?.dataset?.sourceConv||''}`
    const now=performance.now()
    if(e.type==='click'&&key===lastKey&&now-lastAt<650){e.preventDefault();e.stopImmediatePropagation();return}
    if(e.type==='pointerup'){lastKey=key;lastAt=now}
    e.preventDefault();e.stopImmediatePropagation()
    if(fixedBack){home();return}
    if(action){run(action.dataset.kaAction||action.dataset.approvedAction);return}
    stableConversation(stable)
  }
  function keyboard(e){
    if(!approved()||!['Enter',' '].includes(e.key))return
    const action=e.target?.closest?.('[data-ka-action],[data-approved-action]'),back=e.target?.closest?.('#kaPanelBack,#approvedPanelBack'),stable=e.target?.closest?.('#kaConversationListStable .ka-conv-card[data-source-conv],#kaConversationList .ka-conv-card[data-source-conv]')
    if(!action&&!back&&!stable)return
    if(e.target?.closest?.('.nuvem-pin-picker-trigger'))return
    e.preventDefault();e.stopImmediatePropagation();if(back)home();else if(action)run(action.dataset.kaAction||action.dataset.approvedAction);else stableConversation(stable)
  }

  // O botão nativo de voltar precisa primeiro limpar activeConversation no núcleo; depois restauramos o shell aprovado.
  function nativeBack(e){
    if(!approved()||!e.target?.closest?.('#mobileBackBtn,#mobileNativeBack'))return
    setTimeout(home,0);setTimeout(home,80)
  }

  window.addEventListener('pointerup',route,true)
  window.addEventListener('click',route,true)
  window.addEventListener('keydown',keyboard,true)
  document.addEventListener('click',nativeBack,false)
  document.addEventListener('isa:core-back',()=>setTimeout(home,0),{passive:true})
  window.__ISA_APPROVED_HOME_RETURN__=home
})();
