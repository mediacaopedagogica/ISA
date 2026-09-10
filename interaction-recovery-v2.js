/* Recuperação de interação — estabiliza cards de conversa e o campo de data sem redesenhar a interface. */
(function(){
  if(window.__ISA_INTERACTION_RECOVERY_V2__)return;
  window.__ISA_INTERACTION_RECOVERY_V2__=true;
  const q=(s,r=document)=>r?.querySelector?.(s)||null;
  const qa=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])];

  /*
   * O dashboard aprovado espelha a lista nativa de conversas e a atualiza com frequência.
   * Em toque/clique isso podia substituir o card entre pointerdown/pointerup e o click se perdia.
   * Abrimos a conversa já no pointerdown, usando a conversa nativa correspondente como fonte.
   */
  let opening=false;
  function sourceForCard(card){
    const cards=qa('#kaConversationList .ka-conv-card').filter(x=>getComputedStyle(x).display!=='none');
    const idx=cards.indexOf(card);
    if(idx<0)return null;
    const source=qa('#chatList .chat-item[data-conv]').filter(x=>!x.classList.contains('hidden')&&getComputedStyle(x).display!=='none');
    return source[idx]||null;
  }
  function openMirroredCard(card){
    if(opening)return;
    const source=sourceForCard(card);if(!source)return;
    opening=true;
    try{
      window.__ISA_APPROVED_PROFILE_ENTER_PANEL__?.();
      source.click();
      document.dispatchEvent(new CustomEvent('isa:chat-opened',{detail:{conversationId:source.dataset.conv||''}}));
    }finally{setTimeout(()=>opening=false,220)}
  }
  document.addEventListener('pointerdown',e=>{
    const card=e.target.closest?.('#kaConversationList .ka-conv-card');
    if(!card||e.target.closest?.('.nuvem-pin-picker-trigger,.conversation-pin-action'))return;
    e.preventDefault();e.stopImmediatePropagation();openMirroredCard(card);
  },true);
  document.addEventListener('keydown',e=>{
    if(e.key!=='Enter'&&e.key!==' ')return;
    const card=e.target.closest?.('#kaConversationList .ka-conv-card');
    if(!card||e.target.closest?.('.nuvem-pin-picker-trigger,.conversation-pin-action'))return;
    e.preventDefault();e.stopImmediatePropagation();openMirroredCard(card);
  },true);

  /*
   * profile-birthday-v1 sincroniza os inputs sempre que o DOM muda. Isso fazia o navegador
   * apagar a edição de type=date enquanto a pessoa ainda digitava. Protegemos apenas esse input
   * enquanto ele está em edição; ao perder foco/salvar, a sincronização normal volta a funcionar.
   */
  const protoValue=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
  function protectBirthInput(input){
    if(!input||input.__isaBirthProtected||!protoValue?.get||!protoValue?.set)return;
    input.__isaBirthProtected=true;
    let editing=false,dirty=false;
    Object.defineProperty(input,'value',{
      configurable:true,
      get(){return protoValue.get.call(this)},
      set(v){
        const saved=String(window.__ISA_PROFILE_BIRTHDAY__?.get?.()||'');
        if(editing&&dirty&&String(v??'')===saved)return;
        protoValue.set.call(this,v);
      }
    });
    input.addEventListener('focus',()=>{editing=true},{passive:true});
    input.addEventListener('beforeinput',()=>{dirty=true},true);
    input.addEventListener('input',()=>{dirty=true},true);
    input.addEventListener('change',()=>{dirty=true},true);
    input.addEventListener('blur',()=>{editing=false;setTimeout(()=>{dirty=false},120)},{passive:true});
  }
  function patchBirthInputs(){qa('[data-birth-input]').forEach(protectBirthInput)}

  /* Segurança extra: nenhum painel visual invisível deste pacote deve capturar a tela. */
  function clearInvisibleBlockers(){
    qa('#nuvemConversationPinPicker,#nr10CommentEmojiPicker,#nuvemPostitBackdrop').forEach(el=>{
      if(!el.classList.contains('show'))el.style.pointerEvents='none';
      else el.style.removeProperty('pointer-events');
    });
  }

  let t=0;
  function scan(){patchBirthInputs();clearInvisibleBlockers()}
  new MutationObserver(()=>{clearTimeout(t);t=setTimeout(scan,35)}).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('focusin',e=>{if(e.target?.matches?.('[data-birth-input]'))protectBirthInput(e.target)},true);
  document.addEventListener('click',()=>setTimeout(clearInvisibleBlockers,0),true);
  scan();[250,700,1300,2500,5000].forEach(ms=>setTimeout(scan,ms));
  window.__ISA_INTERACTION_RECOVERY__={scan,openMirroredCard};
})();
