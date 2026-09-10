/* Nuvem — seletor visual de fixação por conversa.
   Usa o mecanismo persistente já existente para fixar/desfixar e guarda só a cor/ícone visual por perfil. */
(function(){
  if(window.__NUVEM_PIN_PICKER_V1__)return;window.__NUVEM_PIN_PICKER_V1__=true;
  const q=(s,r=document)=>r?.querySelector?.(s)||null,qa=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])];
  const OPTIONS={star_blue:['★','blue','Estrela azul','star'],star_pink:['★','pink','Estrela rosa','star'],star_purple:['★','purple','Estrela roxa','star'],heart_blue:['♥','blue','Coração azul','heart'],heart_pink:['♥','pink','Coração rosa','heart'],heart_purple:['♥','purple','Coração roxo','heart'],flower:['🌸','flower','Flor','star']};
  let active=null,scanTimer=0;
  function profile(){return String(document.getElementById('myName')?.textContent||new URLSearchParams(location.search).get('perfil')||'familia').trim().toLowerCase().replace(/\s+/g,'-')}
  function styleKey(id){return`isa-nuvem-pin-style-v1:${profile()}:${id}`}
  function getStyle(id){try{return localStorage.getItem(styleKey(id))||''}catch{return''}}
  function setStyle(id,v){try{v?localStorage.setItem(styleKey(id),v):localStorage.removeItem(styleKey(id))}catch{}}
  function original(card){return q('.conversation-pin-action',card)}
  function baseState(card){const o=original(card);if(!o?.classList.contains('is-pinned'))return'none';const t=String(o.title||'');return/Desfixar/i.test(t)?'heart':'star'}
  function glyph(opt){const m=OPTIONS[opt];return m?`<span class="nuvem-pin-glyph nuvem-pin-${m[1]}">${m[0]}</span>`:'<span class="nuvem-pin-glyph nuvem-pin-purple">☆</span>'}
  function ensureCss(){if(document.getElementById('nuvemPinPickerCss'))return;const l=document.createElement('link');l.id='nuvemPinPickerCss';l.rel='stylesheet';l.href='./nuvem-pin-picker-v1.css?v=1';document.head.appendChild(l)}
  function ensurePicker(){let p=document.getElementById('nuvemConversationPinPicker');if(p)return p;p=document.createElement('div');p.id='nuvemConversationPinPicker';p.innerHTML=`<div class="nuvem-pin-title">Fixar conversa com…</div>${Object.entries(OPTIONS).map(([k,m])=>`<button class="nuvem-pin-choice" type="button" data-nuvem-pin="${k}" title="${m[2]}">${glyph(k)}<span>${m[2]}</span></button>`).join('')}<button class="nuvem-pin-choice unpin" type="button" data-nuvem-pin="">✕ Desfixar conversa</button>`;document.body.appendChild(p);p.onclick=e=>{const b=e.target.closest('[data-nuvem-pin]');if(!b||!active)return;choose(active,b.dataset.nuvemPin||'')};document.addEventListener('pointerdown',e=>{if(p.classList.contains('show')&&!p.contains(e.target)&&!e.target.closest?.('.nuvem-pin-picker-trigger'))hide()},{capture:true});return p}
  function show(btn,card){const p=ensurePicker();active=card;const current=getStyle(card.dataset.conv);qa('[data-nuvem-pin]',p).forEach(b=>b.classList.toggle('selected',!!b.dataset.nuvemPin&&b.dataset.nuvemPin===current));p.classList.add('show');const r=btn.getBoundingClientRect(),w=Math.min(p.offsetWidth||330,innerWidth-20),h=p.offsetHeight||250;let left=Math.max(10,Math.min(innerWidth-w-10,r.right-w)),top=r.bottom+8;if(top+h>innerHeight-10)top=Math.max(10,r.top-h-8);p.style.left=`${left}px`;p.style.top=`${top}px`}
  function hide(){document.getElementById('nuvemConversationPinPicker')?.classList.remove('show');active=null}
  function clickOriginal(card,count,done){const o=original(card);if(!o){done?.();return}let n=0;const step=()=>{if(n>=count){done?.();return}n++;o.click();setTimeout(step,700)};step()}
  function transitionCount(from,to){if(from===to)return 0;if(from==='none'&&to==='star')return 1;if(from==='none'&&to==='heart')return 2;if(from==='star'&&to==='heart')return 1;if(from==='star'&&to==='none')return 2;if(from==='heart'&&to==='none')return 1;if(from==='heart'&&to==='star')return 2;return 0}
  function choose(card,opt){const id=card.dataset.conv,desired=opt?(OPTIONS[opt]?.[3]||'star'):'none',from=baseState(card),count=transitionCount(from,desired);hide();setStyle(id,opt);decorate(card);clickOriginal(card,count,()=>setTimeout(()=>{if(desired==='none')setStyle(id,'');decorate(card)},120))}
  function decorate(card){if(!card?.dataset?.conv)return;let b=q('.nuvem-pin-picker-trigger',card);if(!b){b=document.createElement('button');b.type='button';b.className='nuvem-pin-picker-trigger';b.title='Fixar conversa';b.setAttribute('aria-label','Escolher como fixar esta conversa');b.onclick=e=>{e.preventDefault();e.stopPropagation();show(b,card)};card.appendChild(b)}const state=baseState(card),saved=getStyle(card.dataset.conv),fallback=state==='heart'?'heart_purple':state==='star'?'star_pink':'';const opt=saved||fallback;b.innerHTML=state==='none'&&!saved?glyph(''):glyph(opt);b.classList.toggle('is-pinned',state!=='none');if(saved&&state==='none'){setStyle(card.dataset.conv,'');b.innerHTML=glyph('')}}
  function scan(){ensureCss();ensurePicker();qa('#chatList .chat-item[data-conv]').forEach(decorate)}
  const list=document.getElementById('chatList');if(list)new MutationObserver(()=>{clearTimeout(scanTimer);scanTimer=setTimeout(scan,100)}).observe(list,{childList:true,subtree:true,attributes:true,attributeFilter:['class','title']});
  scan();setTimeout(scan,1800);setInterval(()=>{if(document.visibilityState==='visible')scan()},4000);
  window.__ISA_NUVEM_PIN_PICKER__={scan};
})();
