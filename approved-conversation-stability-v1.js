/*
 * Isa Chat — estabilização real da lista espelhada de conversas.
 * Keise, Isa e Alan usam um dashboard visual que espelha #chatList.
 * Os dashboards antigos reconstruíam o espelho em intervalos curtos, causando tremor
 * e perda de clique. Este módulo separa o espelho VISÍVEL de um sink invisível usado
 * pelas rotinas antigas e atualiza o visível somente quando o conteúdo realmente muda.
 */
(function(){
  if(window.__ISA_APPROVED_CONVERSATION_STABILITY__)return;
  window.__ISA_APPROVED_CONVERSATION_STABILITY__=true;

  const q=(s,r=document)=>r?.querySelector?.(s)||null;
  const qa=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])];
  let sourceObserver=null,bootTimer=null,syncTimer=null,lastSignature='',opening=false;

  function css(){
    if(document.getElementById('approvedConversationStabilityCss'))return;
    const s=document.createElement('style');s.id='approvedConversationStabilityCss';s.textContent=`
      #kaConversationList.ka-sync-sink{display:none!important;visibility:hidden!important;width:0!important;height:0!important;overflow:hidden!important;pointer-events:none!important}
      #kaConversationListStable{display:grid;gap:11px;width:100%;max-width:760px}
      #kaConversationListStable .ka-conv-card{
        appearance:none!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:14px!important;
        position:relative!important;width:100%!important;min-width:0!important;min-height:88px!important;height:auto!important;margin:0!important;padding:10px 54px 10px 18px!important;
        border:1px solid rgba(255,255,255,.98)!important;border-radius:24px!important;background:linear-gradient(120deg,#fff6e8,#ffeef4)!important;
        box-shadow:0 12px 25px rgba(93,70,111,.11)!important;transform:none!important;text-align:left!important;color:#543b65!important;
        cursor:pointer!important;pointer-events:auto!important;touch-action:manipulation!important;outline:none!important
      }
      #kaConversationListStable .ka-conv-card:nth-child(2){background:linear-gradient(120deg,#eef7ff,#f0f2ff)!important}
      #kaConversationListStable .ka-conv-card:nth-child(3){background:linear-gradient(120deg,#fff8e7,#fff0e9)!important}
      #kaConversationListStable .ka-conv-card:hover{transform:translateY(-2px)!important}
      #kaConversationListStable .ka-conv-card:focus-visible{box-shadow:0 0 0 3px rgba(155,103,214,.22),0 12px 25px rgba(93,70,111,.11)!important}
      #kaConversationListStable .ka-conv-card>.avatar,
      #kaConversationListStable .ka-conv-card>.profile-photo,
      #kaConversationListStable .ka-conv-card>div:first-child{
        flex:0 0 62px!important;width:62px!important;height:62px!important;min-width:62px!important;max-width:62px!important;
        border-radius:18px!important;margin:0!important;display:grid!important;place-items:center!important;overflow:hidden!important
      }
      #kaConversationListStable .ka-conv-card>.avatar img,
      #kaConversationListStable .ka-conv-card>.profile-photo img,
      #kaConversationListStable .ka-conv-card>div:first-child img{width:100%!important;height:100%!important;object-fit:cover!important}
      #kaConversationListStable .ka-conv-card .grow{display:block!important;flex:1 1 auto!important;width:auto!important;min-width:0!important;max-width:none!important;margin:0!important;padding:0!important;text-align:left!important}
      #kaConversationListStable .ka-conv-card .grow strong{display:block!important;margin:0!important;padding:0!important;text-align:left!important;font:800 17px/1.2 Inter,"Segoe UI",sans-serif!important;color:#563c65!important}
      #kaConversationListStable .ka-conv-card .grow small{display:block!important;margin:4px 0 0!important;padding:0!important;text-align:left!important;font:500 13px/1.25 Inter,"Segoe UI",sans-serif!important;color:#8e7899!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      #kaConversationListStable .ka-conv-card .unread-star{color:#8a59b1!important}
      #kaConversationListStable .nuvem-pin-picker-trigger{right:10px!important;top:50%!important;transform:translateY(-50%)!important}
      #kaConversationListStable .conversation-pin-action{display:none!important}
      @media(max-width:850px){
        #kaConversationListStable{max-width:none;gap:10px}
        #kaConversationListStable .ka-conv-card{min-height:78px!important;border-radius:22px!important;padding:9px 50px 9px 12px!important;gap:11px!important}
        #kaConversationListStable .ka-conv-card>.avatar,#kaConversationListStable .ka-conv-card>.profile-photo,#kaConversationListStable .ka-conv-card>div:first-child{flex-basis:56px!important;width:56px!important;height:56px!important;min-width:56px!important;max-width:56px!important}
      }
    `;document.head.appendChild(s);
  }

  function sourceItems(){
    return qa('#chatList .chat-item[data-conv]').filter(x=>!x.classList.contains('hidden')&&getComputedStyle(x).display!=='none');
  }
  function sig(items){
    return items.map(x=>`${x.dataset.conv||''}|${x.className}|${x.innerHTML}`).join('\u241E');
  }
  function sourceById(id){return sourceItems().find(x=>String(x.dataset.conv)===String(id))||null}

  function cloneCard(src){
    const card=document.createElement('div');
    card.className=`${src.className} ka-conv-card`;
    card.classList.remove('active');
    card.removeAttribute('data-conv');
    card.dataset.sourceConv=src.dataset.conv||'';
    card.setAttribute('role','button');card.tabIndex=0;
    card.innerHTML=src.innerHTML;
    card.querySelectorAll('[id]').forEach(x=>x.removeAttribute('id'));
    card.querySelectorAll('.conversation-pin-action').forEach(x=>x.remove());
    const pin=q('.nuvem-pin-picker-trigger',card);if(pin){pin.dataset.stablePin=card.dataset.sourceConv;pin.type='button'}
    return card;
  }

  function filterStable(){
    const input=document.getElementById('kaSearchInput'),term=String(input?.value||'').trim().toLocaleLowerCase('pt-BR');
    qa('#kaConversationListStable .ka-conv-card').forEach(card=>{card.style.display=!term||card.textContent.toLocaleLowerCase('pt-BR').includes(term)?'':'none'});
  }

  function syncStable(force=false){
    const stable=document.getElementById('kaConversationListStable');if(!stable)return false;
    const items=sourceItems(),signature=sig(items);
    if(!force&&signature===lastSignature)return true;
    lastSignature=signature;
    const frag=document.createDocumentFragment();
    if(!items.length){const n=document.createElement('div');n.className='ka-empty-note';n.textContent=/carregando/i.test(document.getElementById('chatList')?.textContent||'')?'Abrindo suas conversas…':'Suas conversas aparecem aqui.';frag.appendChild(n)}
    else items.forEach(src=>frag.appendChild(cloneCard(src)));
    stable.replaceChildren(frag);filterStable();return true;
  }

  function repositionPicker(anchor){
    const picker=document.getElementById('nuvemConversationPinPicker');if(!picker?.classList.contains('show')||!anchor)return;
    const r=anchor.getBoundingClientRect(),w=Math.min(picker.offsetWidth||330,innerWidth-20),h=picker.offsetHeight||250;
    let x=Math.max(10,Math.min(innerWidth-w-10,r.right-w));let y=r.bottom+8;
    if(y+h>innerHeight-10)y=Math.max(10,r.top-h-8);
    picker.style.left=`${x}px`;picker.style.top=`${y}px`;
  }

  function openPin(card,anchor){
    const src=sourceById(card.dataset.sourceConv);if(!src)return;
    window.__ISA_NUVEM_PIN_PICKER__?.scan?.();
    const tryOpen=()=>{
      const trigger=q('.nuvem-pin-picker-trigger',src);
      if(trigger){trigger.click();setTimeout(()=>repositionPicker(anchor),0);setTimeout(()=>repositionPicker(anchor),80);return true}
      return false;
    };
    if(!tryOpen())setTimeout(()=>{window.__ISA_NUVEM_PIN_PICKER__?.scan?.();tryOpen()},90);
  }

  function openConversation(card){
    if(opening)return;
    const id=String(card?.dataset?.sourceConv||'');if(!id)return;
    // Keise tem um roteador dedicado: ele deixa o núcleo abrir a conversa antes de trocar o shell.
    if(typeof window.__ISA_OPEN_KEISE_STABLE_CONVERSATION__==='function'&&document.body.classList.contains('keise-approved-layout')){
      opening=true;try{window.__ISA_OPEN_KEISE_STABLE_CONVERSATION__(id)}finally{setTimeout(()=>opening=false,360)};return;
    }
    const src=sourceById(id);if(!src)return;
    opening=true;
    try{
      // Para os demais perfis, também preservamos esta ordem: clique nativo primeiro, layout depois.
      try{HTMLElement.prototype.click.call(src)}catch{src.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}))}
      requestAnimationFrame(()=>{
        window.__ISA_KEISE_ENTER_PANEL__?.();
        window.__ISA_APPROVED_PROFILE_ENTER_PANEL__?.();
        document.dispatchEvent(new CustomEvent('isa:chat-opened',{detail:{conversationId:id}}));
      });
    }finally{setTimeout(()=>opening=false,320)}
  }

  function bindStable(stable){
    if(stable.dataset.stableBound==='1')return;stable.dataset.stableBound='1';
    stable.addEventListener('click',e=>{
      const card=e.target.closest?.('.ka-conv-card');if(!card)return;
      e.preventDefault();e.stopImmediatePropagation();
      const pin=e.target.closest?.('.nuvem-pin-picker-trigger');if(pin){openPin(card,pin);return}
      openConversation(card);
    },true);
    stable.addEventListener('keydown',e=>{
      if(e.key!=='Enter'&&e.key!==' ')return;const card=e.target.closest?.('.ka-conv-card');if(!card)return;
      e.preventDefault();e.stopImmediatePropagation();openConversation(card);
    },true);
    const input=document.getElementById('kaSearchInput');if(input&&input.dataset.stableFilter!=='1'){input.dataset.stableFilter='1';input.addEventListener('input',filterStable,true)}
  }

  function observeSource(){
    const source=document.getElementById('chatList');if(!source||sourceObserver)return;
    sourceObserver=new MutationObserver(()=>{clearTimeout(syncTimer);syncTimer=setTimeout(()=>syncStable(false),70)});
    sourceObserver.observe(source,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','title','style','src']});
  }

  function stabilize(){
    css();
    let stable=document.getElementById('kaConversationListStable');
    let sink=document.getElementById('kaConversationList');
    if(!stable){
      if(!sink||sink.classList.contains('ka-sync-sink'))return false;
      stable=sink;stable.id='kaConversationListStable';stable.classList.add('ka-stable-conversation-list');
      sink=document.createElement('div');sink.id='kaConversationList';sink.className='ka-sync-sink';sink.setAttribute('aria-hidden','true');stable.insertAdjacentElement('afterend',sink);
      lastSignature='';
    }else if(!sink||!sink.classList.contains('ka-sync-sink')){
      const n=document.createElement('div');n.id='kaConversationList';n.className='ka-sync-sink';n.setAttribute('aria-hidden','true');stable.insertAdjacentElement('afterend',n);sink=n;
    }
    bindStable(stable);observeSource();syncStable(false);return true;
  }

  const domObserver=new MutationObserver(()=>{clearTimeout(bootTimer);bootTimer=setTimeout(stabilize,60)});
  domObserver.observe(document.documentElement,{childList:true,subtree:true});
  stabilize();[120,320,700,1300,2600,5000].forEach(ms=>setTimeout(stabilize,ms));
  document.addEventListener('isa:chat-opened',()=>setTimeout(()=>syncStable(false),160),{passive:true});
  window.__ISA_STABILIZE_APPROVED_CONVERSATIONS__=()=>{stabilize();syncStable(true)};
})();
