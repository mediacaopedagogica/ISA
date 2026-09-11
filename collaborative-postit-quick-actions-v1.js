/* Toque único no post-it do chat: abre Editar/Responder ou Cancelar/Reabrir.
   Também protege Mover para chat contra duplo toque/reenvio e esconde duplicatas acidentais. */
(function(){
  if(window.__ISA_COLLAB_POSTIT_QUICK_V1__)return;window.__ISA_COLLAB_POSTIT_QUICK_V1__=true
  const q=(s,r=document)=>r?.querySelector?.(s)||null,qa=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])]
  let activeCard=null,dedupeQueued=false
  function css(){if(document.getElementById('isaPostitQuickCss'))return;const s=document.createElement('style');s.id='isaPostitQuickCss';s.textContent=`
  #isaPostitQuickMenu{position:fixed;z-index:2147483200;display:none;min-width:190px;padding:8px;border:1px solid rgba(255,255,255,.96);border-radius:18px;background:linear-gradient(145deg,#fffafd,#f4efff);box-shadow:0 18px 42px rgba(63,45,82,.25);backdrop-filter:blur(18px)}#isaPostitQuickMenu.show{display:grid;gap:6px}#isaPostitQuickMenu button{border:0;border-radius:12px;padding:10px 12px;text-align:left;background:#fff;color:#66516f;font-size:11px;font-weight:900;cursor:pointer}#isaPostitQuickMenu button:hover{background:#f3eafb}#isaPostitQuickMenu .cancel{background:#fff0f3;color:#98546a}#isaPostitQuickMenu .reopen{background:#edf7eb;color:#4e7350}.isa-collab-postit{cursor:pointer}.isa-collab-postit.dragging{cursor:grabbing}
  .isa-postit-duplicate-hidden{display:none!important}[data-note-move][data-isa-moving="1"]{opacity:.55!important;pointer-events:none!important}
  `;document.head.appendChild(s)}
  function payload(card){const row=card?.closest?.('.message-row,.friend-msg');if(!row)return null;try{if(row.dataset.isaPostitPayload)return JSON.parse(decodeURIComponent(row.dataset.isaPostitPayload))}catch{}return null}
  function menu(){let m=document.getElementById('isaPostitQuickMenu');if(m)return m;m=document.createElement('div');m.id='isaPostitQuickMenu';m.innerHTML='<button type="button" data-postit-quick="edit">✏️ Editar / responder</button><button type="button" class="cancel" data-postit-quick="toggle">✖ Cancelar post-it</button>';document.body.appendChild(m);m.addEventListener('click',e=>{const b=e.target.closest('[data-postit-quick]');if(!b||!activeCard)return;const p=payload(activeCard);hide();if(!p)return;if(b.dataset.postitQuick==='edit')window.__ISA_COLLAB_POSTITS__?.openEditor?.(p);else window.__ISA_COLLAB_POSTITS__?.toggleCancelled?.(p)});return m}
  function hide(){document.getElementById('isaPostitQuickMenu')?.classList.remove('show');activeCard=null}
  function open(card){const p=payload(card);if(!p)return;const m=menu(),toggle=q('[data-postit-quick="toggle"]',m),cancelled=p.status==='cancelled';toggle.textContent=cancelled?'↩ Reabrir post-it':'✖ Cancelar post-it';toggle.classList.toggle('reopen',cancelled);toggle.classList.toggle('cancel',!cancelled);activeCard=card;m.classList.add('show');const r=card.getBoundingClientRect(),w=m.offsetWidth||210,h=m.offsetHeight||96;let x=Math.min(innerWidth-w-10,Math.max(10,r.left+r.width/2-w/2)),y=r.bottom+8;if(y+h>innerHeight-10)y=Math.max(10,r.top-h-8);m.style.left=`${x}px`;m.style.top=`${y}px`}

  function postitSignature(p){return [p?.owner||'',p?.cat||'',p?.text||'',(p?.collaborators||[]).slice().sort().join('|')].join('¦')}
  function dedupe(){
    dedupeQueued=false
    const rows=qa('#messages .message-row,#friendMessages .friend-msg'),groups=new Map()
    for(const row of rows){
      let p=null;try{if(row.dataset.isaPostitPayload)p=JSON.parse(decodeURIComponent(row.dataset.isaPostitPayload))}catch{}
      if(!p)continue
      const stamp=Date.parse(p.updatedAt||'')||0,key=p.id?`id:${p.id}`:`sig:${postitSignature(p)}`
      if(!groups.has(key))groups.set(key,[]);groups.get(key).push({row,p,stamp})
    }
    for(const items of groups.values()){
      items.sort((a,b)=>a.stamp-b.stamp)
      const keep=items[items.length-1]
      for(const x of items)x.row.classList.toggle('isa-postit-duplicate-hidden',x!==keep)
    }
    /* segunda defesa: mensagens criadas acidentalmente em sequência com ids diferentes, mas conteúdo idêntico */
    const bySig=new Map()
    for(const row of rows){
      if(row.classList.contains('isa-postit-duplicate-hidden'))continue
      let p=null;try{if(row.dataset.isaPostitPayload)p=JSON.parse(decodeURIComponent(row.dataset.isaPostitPayload))}catch{}
      if(!p)continue
      const sig=postitSignature(p),stamp=Date.parse(p.updatedAt||'')||0,prev=bySig.get(sig)
      if(prev&&Math.abs(stamp-prev.stamp)<=15000){prev.row.classList.add('isa-postit-duplicate-hidden');bySig.set(sig,{row,stamp})}else bySig.set(sig,{row,stamp})
    }
  }
  function scheduleDedupe(){if(dedupeQueued)return;dedupeQueued=true;requestAnimationFrame(dedupe)}

  /* O botão Mover é operação única. Bloqueia imediatamente antes do handler do quadro receber o click. */
  document.addEventListener('click',e=>{
    const b=e.target.closest?.('[data-note-move]');if(!b)return
    if(b.dataset.isaMoving==='1'){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();return}
    b.dataset.isaMoving='1';b.disabled=true
    setTimeout(()=>{if(b.isConnected){b.disabled=false;delete b.dataset.isaMoving}},2200)
  },true)

  document.addEventListener('click',e=>{const card=e.target.closest?.('.isa-collab-postit');if(!card){if(!e.target.closest?.('#isaPostitQuickMenu'))hide();return}if(e.target.closest('button,input,textarea,select,label,[data-collab-drag]'))return;e.preventDefault();e.stopPropagation();open(card)},true)
  document.addEventListener('pointerdown',e=>{if(!e.target.closest?.('.isa-collab-postit,#isaPostitQuickMenu'))hide()},{capture:true,passive:true})
  new MutationObserver(scheduleDedupe).observe(document.documentElement,{childList:true,subtree:true})
  document.addEventListener('isa:chat-opened',()=>setTimeout(scheduleDedupe,80));document.addEventListener('isa:friend-portal-entered',()=>setTimeout(scheduleDedupe,120))
  css();menu();setTimeout(scheduleDedupe,350);window.__ISA_COLLAB_POSTIT_QUICK__={open,hide,dedupe,scheduleDedupe}
})();
