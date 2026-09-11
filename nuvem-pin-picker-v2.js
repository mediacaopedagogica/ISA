/* Nuvem pin picker v7 — fixadores estáveis no núcleo, dashboard aprovado e links externos. */
(function(){
  'use strict'
  if(window.__NUVEM_PIN_PICKER_V7__)return;window.__NUVEM_PIN_PICKER_V7__=true
  const q=(s,r=document)=>r?.querySelector?.(s)||null,qa=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])]
  const OPT={star_blue:['★','blue','Estrela azul','star'],star_pink:['★','pink','Estrela rosa','star'],star_purple:['★','purple','Estrela roxa','star'],pin_blue:['📌','blue','Alfinete azul','star'],pin_star:['⭐','purple','Estrela dourada','star'],heart_blue:['♥','blue','Coração azul','heart'],heart_pink:['♥','pink','Coração rosa','heart'],heart_purple:['♥','purple','Coração roxo','heart'],flower:['🌸','flower','Flor','star']}
  let active=null,timer=0
  const observers=new Map()

  function who(){return String(document.getElementById('myName')?.textContent||window.__ISA_FRIEND_PERSON__?.name||document.getElementById('friendName')?.textContent||'familia').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-')}
  function masculineDefault(){return/(^|-)(alan|davi|elion)(-|$)/.test(who())}
  function convId(card){return card?.dataset?.conv||card?.dataset?.friendConv||card?.dataset?.sourceConv||card?.dataset?.kaConv||''}
  function externalCard(card){return !!card?.matches?.('.friend-conversation[data-friend-conv]')}
  function mirroredCard(card){return !!card?.matches?.('#kaConversationList .ka-conv-card[data-source-conv],#kaConversationListStable .ka-conv-card[data-source-conv]')}
  function key(id){return`isa-nuvem-pin-style-v3:${who()}:${id}`}
  function read(id){try{return localStorage.getItem(key(id))||''}catch{return''}}
  function write(id,v){try{v?localStorage.setItem(key(id),v):localStorage.removeItem(key(id))}catch{}}
  function sourceCard(card){if(!mirroredCard(card))return card;const id=convId(card);return q(`#chatList .chat-item[data-conv="${CSS.escape(id)}"]`)||card}
  function core(card){return q('.conversation-pin-action',sourceCard(card))}
  function state(card){
    const id=convId(card),saved=read(id)
    if(externalCard(card)||mirroredCard(card))return saved?(OPT[saved]?.[3]||'star'):'none'
    const el=core(card);if(!el?.classList.contains('is-pinned'))return saved?(OPT[saved]?.[3]||'star'):'none'
    return/Desfixar/i.test(el.title||'')?'heart':'star'
  }
  function glyph(id){const m=OPT[id];return m?`<span class="nuvem-pin-glyph nuvem-pin-${m[1]}">${m[0]}</span>`:'<span class="nuvem-pin-glyph nuvem-pin-purple">☆</span>'}
  function css(){if(document.getElementById('nuvemPinPickerCss'))return;const l=document.createElement('link');l.id='nuvemPinPickerCss';l.rel='stylesheet';l.href='./nuvem-pin-picker-v1.css?v=7-approved-stable';document.head.appendChild(l)}
  function picker(){
    let p=document.getElementById('nuvemConversationPinPicker');if(p)return p
    p=document.createElement('div');p.id='nuvemConversationPinPicker';p.innerHTML=`<div class="nuvem-pin-title">Fixar conversa com…</div><div class="nuvem-pin-subtitle">Escolha o fixador que combinar com você.</div>${Object.entries(OPT).map(([id,m])=>`<button class="nuvem-pin-choice" type="button" data-pin-choice="${id}">${glyph(id)}<span>${m[2]}</span></button>`).join('')}<button class="nuvem-pin-choice unpin" type="button" data-pin-choice="">✕ Desfixar conversa</button>`
    document.body.appendChild(p)
    p.addEventListener('click',e=>{const b=e.target.closest('[data-pin-choice]');if(b&&active)choose(active,b.dataset.pinChoice||'')})
    document.addEventListener('pointerdown',e=>{if(p.classList.contains('show')&&!p.contains(e.target)&&!e.target.closest?.('.nuvem-pin-picker-trigger'))hide()},{capture:true,passive:true})
    return p
  }
  function open(btn,card){const p=picker(),saved=read(convId(card));active=card;qa('[data-pin-choice]',p).forEach(b=>b.classList.toggle('selected',!!b.dataset.pinChoice&&b.dataset.pinChoice===saved));p.classList.add('show');const r=btn.getBoundingClientRect(),w=Math.min(p.offsetWidth||330,innerWidth-20),h=p.offsetHeight||310;let x=Math.max(10,Math.min(innerWidth-w-10,r.right-w)),y=r.bottom+8;if(y+h>innerHeight-10)y=Math.max(10,r.top-h-8);p.style.left=`${x}px`;p.style.top=`${y}px`}
  function hide(){document.getElementById('nuvemConversationPinPicker')?.classList.remove('show');active=null}
  function steps(from,to){if(from===to)return 0;if(from==='none'&&to==='star')return 1;if(from==='none'&&to==='heart')return 2;if(from==='star'&&to==='heart')return 1;if(from==='star'&&to==='none')return 2;if(from==='heart'&&to==='none')return 1;if(from==='heart'&&to==='star')return 2;return 0}
  function cycle(card,count,done){const el=core(card);if(!el||count<1){done?.();return}let i=0;const go=()=>{if(i>=count){done?.();return}i++;HTMLElement.prototype.click.call(el);setTimeout(go,520)};go()}
  function reorderExternal(){const box=document.getElementById('friendConversationList');if(!box)return;const cards=qa('.friend-conversation[data-friend-conv]',box);cards.forEach((c,i)=>{const pinned=!!read(convId(c));c.dataset.nuvemPinned=pinned?'1':'0';c.style.order=pinned?String(-1000+i):String(i)})}
  function emit(cid,id){try{document.dispatchEvent(new CustomEvent('isa:pin-style-changed',{detail:{conversationId:cid,style:id||''}}))}catch{};try{window.__ISA_APPROVED_STABILITY__?.schedule?.(0)}catch{}}
  function choose(card,id){
    const cid=convId(card);if(!cid)return
    const desired=id?(OPT[id]?.[3]||'star'):'none',from=state(card),count=steps(from,desired)
    write(cid,id);hide();decorate(card);emit(cid,id)
    if(externalCard(card)){reorderExternal();return}
    const src=sourceCard(card)
    cycle(src,count,()=>{if(desired==='none')write(cid,'');setTimeout(()=>{decorate(card);decorate(src);scan();emit(cid,id)},80)})
  }
  function decorate(card){
    const cid=convId(card);if(!card||!cid)return
    let b=q(':scope > .nuvem-pin-picker-trigger',card)
    if(!b){b=document.createElement('button');b.type='button';b.className='nuvem-pin-picker-trigger';b.title='Escolher como fixar esta conversa';b.setAttribute('aria-label','Escolher fixador da conversa');b.onclick=e=>{e.preventDefault();e.stopPropagation();open(b,card)};card.appendChild(b)}
    const s=state(card),saved=read(cid),fallback=s==='heart'?'heart_purple':s==='star'?(masculineDefault()?'pin_blue':'star_pink'):''
    const html=glyph(saved||fallback);if(b.innerHTML!==html)b.innerHTML=html;b.classList.toggle('is-pinned',s!=='none'||!!saved)
  }
  function cards(){return qa('#chatList .chat-item[data-conv],#friendConversationList .friend-conversation[data-friend-conv],#kaConversationList .ka-conv-card[data-source-conv],#kaConversationListStable .ka-conv-card[data-source-conv]')}
  function schedule(delay=70){clearTimeout(timer);timer=setTimeout(()=>{timer=0;scan()},delay)}
  function bindLists(){
    for(const id of ['chatList','friendConversationList','kaConversationList','kaConversationListStable']){
      const list=document.getElementById(id);if(!list||observers.has(list))continue
      const obs=new MutationObserver(()=>schedule());obs.observe(list,{childList:true,subtree:true});observers.set(list,obs)
    }
  }
  function scan(){css();picker();bindLists();cards().forEach(decorate);reorderExternal();return true}

  scan();setTimeout(scan,450);setTimeout(scan,1300)
  for(const ev of ['isa:chat-opened','isa:friend-portal-entered','isa:final-shell-ready','isa:approved-home-ready','isa:keise-approved-home-built','isa:social-rendered'])document.addEventListener(ev,()=>schedule(0),{passive:true})
  window.__ISA_NUVEM_PIN_PICKER__={scan,schedule}
})();
