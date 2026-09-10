// Reações robustas: dois cliques no notebook ou dois toques no celular abrem os emojis ao lado da mensagem/imagem.
// Usa o picker/persistência de message-interactions-v1.js para não duplicar a lógica de banco.
(function(){
  if(window.__ISA_REACTION_DELEGATE_V2__)return;
  window.__ISA_REACTION_DELEGATE_V2__=true;
  const $=id=>document.getElementById(id);
  const lastTouch=new WeakMap();
  let retryTimer=0;

  function rowFrom(target){return target?.closest?.('#messages .message-row[id^="msg-"],#friendMessages .friend-msg')||null}
  function bubbleFrom(row){return row?.querySelector?.('.bubble,.friend-bubble')||null}
  function messageId(row){return row?.dataset?.messageId||String(row?.id||'').replace(/^msg-/,'')||''}
  function external(row){return !!row?.closest?.('#friendMessages')}
  function interactive(target){return !!target?.closest?.('button,a,input,textarea,select,video,audio,[contenteditable="true"]')}

  function positionPicker(p,anchor){
    const r=anchor.getBoundingClientRect();
    p.classList.add('show');
    const w=Math.min(p.offsetWidth||300,innerWidth-12),h=p.offsetHeight||52;
    let left=r.right+7,top=r.top+r.height/2-h/2;
    if(left+w>innerWidth-6)left=Math.max(6,r.left-w-7);
    if(left<6)left=Math.max(6,Math.min(innerWidth-w-6,r.left+r.width/2-w/2));
    top=Math.max(6,Math.min(innerHeight-h-6,top));
    p.style.left=`${left}px`;p.style.top=`${top}px`;
  }

  function openPicker(row,attempt=0){
    if(!row)return false;
    const id=messageId(row),anchor=bubbleFrom(row),p=$('miReactionPicker');
    if(id&&anchor&&p){
      p.dataset.messageId=id;p.dataset.external=external(row)?'1':'0';
      positionPicker(p,anchor);return true;
    }
    // Em acessos externos os IDs chegam logo após a renderização. Pede hidratação e tenta novamente.
    window.__ISA_REFRESH_MESSAGE_INTERACTIONS__?.();
    if(attempt<4){clearTimeout(retryTimer);retryTimer=setTimeout(()=>openPicker(row,attempt+1),90+attempt*70)}
    return false;
  }

  function onDoubleClick(e){
    const row=rowFrom(e.target);if(!row||interactive(e.target))return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openPicker(row);
  }

  function onPointerUp(e){
    if(e.pointerType!=='touch')return;
    const row=rowFrom(e.target);if(!row||interactive(e.target))return;
    const now=Date.now(),prev=lastTouch.get(row)||0;lastTouch.set(row,now);
    if(now-prev<=380){
      lastTouch.set(row,0);e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openPicker(row);
    }
  }

  // Delegação no documento sobrevive a toda re-renderização das mensagens.
  document.addEventListener('dblclick',onDoubleClick,true);
  document.addEventListener('pointerup',onPointerUp,true);

  function mark(){
    document.querySelectorAll('#messages .message-row[id^="msg-"],#friendMessages .friend-msg').forEach(row=>{
      const b=bubbleFrom(row);if(b){b.style.position='relative';b.dataset.doubleReact='1';b.title=b.title||'Dois cliques/toques para reagir';}
    });
  }
  const obs=new MutationObserver(()=>{clearTimeout(obs._t);obs._t=setTimeout(mark,80)});
  obs.observe(document.documentElement,{childList:true,subtree:true});
  mark();[400,1000,2200].forEach(ms=>setTimeout(mark,ms));
  window.__ISA_REACTION_DELEGATE_REFRESH__=mark;
})();
