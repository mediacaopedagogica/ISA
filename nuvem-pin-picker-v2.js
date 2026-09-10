/* Nuvem pin picker v4 — seletor visual estável, com corações/flores e pins/estrelas. */
(function(){
  if(window.__NUVEM_PIN_PICKER_V4__)return;window.__NUVEM_PIN_PICKER_V4__=true;
  const q=(s,r=document)=>r?.querySelector?.(s)||null,qa=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])];
  const OPT={star_blue:['★','blue','Estrela azul','star'],star_pink:['★','pink','Estrela rosa','star'],star_purple:['★','purple','Estrela roxa','star'],pin_blue:['📌','blue','Pin','star'],pin_star:['⭐','purple','Pin estrela','star'],heart_blue:['♥','blue','Coração azul','heart'],heart_pink:['♥','pink','Coração rosa','heart'],heart_purple:['♥','purple','Coração roxo','heart'],flower:['🌸','flower','Flor','star']};
  let active=null,timer=0;
  function who(){return String(document.getElementById('myName')?.textContent||window.__ISA_FRIEND_PERSON__?.name||document.getElementById('friendName')?.textContent||'familia').trim().toLowerCase().replace(/\s+/g,'-')}
  function masculineDefault(){return /(^|-)(alan|davi|elion)(-|$)/.test(who())}
  function key(id){return`isa-nuvem-pin-style-v2:${who()}:${id}`}
  function read(id){try{return localStorage.getItem(key(id))||''}catch{return''}}
  function write(id,v){try{v?localStorage.setItem(key(id),v):localStorage.removeItem(key(id))}catch{}}
  function core(card){return q('.conversation-pin-action',card)}
  function state(card){const el=core(card);if(!el?.classList.contains('is-pinned'))return'none';return/Desfixar/i.test(el.title||'')?'heart':'star'}
  function glyph(id){const m=OPT[id];return m?`<span class="nuvem-pin-glyph nuvem-pin-${m[1]}">${m[0]}</span>`:'<span class="nuvem-pin-glyph nuvem-pin-purple">☆</span>'}
  function css(){if(document.getElementById('nuvemPinPickerCss'))return;const l=document.createElement('link');l.id='nuvemPinPickerCss';l.rel='stylesheet';l.href='./nuvem-pin-picker-v1.css?v=4-pins';document.head.appendChild(l)}
  function picker(){let p=document.getElementById('nuvemConversationPinPicker');if(p)return p;p=document.createElement('div');p.id='nuvemConversationPinPicker';p.innerHTML=`<div class="nuvem-pin-title">Fixar conversa com…</div><div style="padding:0 10px 6px;color:#8c7994;font-size:10px">Escolha o estilo que combinar com você.</div>${Object.entries(OPT).map(([id,m])=>`<button class="nuvem-pin-choice" type="button" data-pin-choice="${id}">${glyph(id)}<span>${m[2]}</span></button>`).join('')}<button class="nuvem-pin-choice unpin" type="button" data-pin-choice="">✕ Desfixar conversa</button>`;document.body.appendChild(p);p.addEventListener('click',e=>{const b=e.target.closest('[data-pin-choice]');if(b&&active)choose(active,b.dataset.pinChoice||'')});document.addEventListener('pointerdown',e=>{if(p.classList.contains('show')&&!p.contains(e.target)&&!e.target.closest?.('.nuvem-pin-picker-trigger'))hide()},{capture:true,passive:true});return p}
  function open(btn,card){const p=picker(),saved=read(card.dataset.conv);active=card;qa('[data-pin-choice]',p).forEach(b=>b.classList.toggle('selected',!!b.dataset.pinChoice&&b.dataset.pinChoice===saved));p.classList.add('show');const r=btn.getBoundingClientRect(),w=Math.min(p.offsetWidth||330,innerWidth-20),h=p.offsetHeight||310;let x=Math.max(10,Math.min(innerWidth-w-10,r.right-w)),y=r.bottom+8;if(y+h>innerHeight-10)y=Math.max(10,r.top-h-8);p.style.left=`${x}px`;p.style.top=`${y}px`}
  function hide(){document.getElementById('nuvemConversationPinPicker')?.classList.remove('show');active=null}
  function steps(from,to){if(from===to)return 0;if(from==='none'&&to==='star')return 1;if(from==='none'&&to==='heart')return 2;if(from==='star'&&to==='heart')return 1;if(from==='star'&&to==='none')return 2;if(from==='heart'&&to==='none')return 1;if(from==='heart'&&to==='star')return 2;return 0}
  function cycle(card,count,done){const el=core(card);if(!el||count<1){done?.();return}let i=0;const go=()=>{if(i>=count){done?.();return}i++;el.click();setTimeout(go,650)};go()}
  function choose(card,id){const desired=id?(OPT[id]?.[3]||'star'):'none',from=state(card),count=steps(from,desired);write(card.dataset.conv,id);hide();decorate(card);cycle(card,count,()=>{if(desired==='none')write(card.dataset.conv,'');setTimeout(()=>decorate(card),120)})}
  function decorate(card){if(!card?.dataset?.conv)return;let b=q('.nuvem-pin-picker-trigger',card);if(!b){b=document.createElement('button');b.type='button';b.className='nuvem-pin-picker-trigger';b.title='Escolher como fixar esta conversa';b.onclick=e=>{e.preventDefault();e.stopPropagation();open(b,card)};card.appendChild(b)}const s=state(card),saved=read(card.dataset.conv),fallback=s==='heart'?'heart_purple':s==='star'?(masculineDefault()?'pin_blue':'star_pink'):'';b.innerHTML=glyph(saved||fallback);b.classList.toggle('is-pinned',s!=='none'||!!saved)}
  function scan(){css();picker();qa('#chatList .chat-item[data-conv]').forEach(decorate)}
  const list=document.getElementById('chatList');if(list)new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(scan,120)}).observe(list,{childList:true,subtree:true});
  scan();[900,1800,3200].forEach(ms=>setTimeout(scan,ms));document.addEventListener('isa:chat-opened',scan,{passive:true});window.__ISA_NUVEM_PIN_PICKER__={scan};
})();
