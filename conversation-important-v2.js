/* Conversa importante v2 — post-its pessoais por conversa, compartilháveis no próprio chat. */
(function(){
  if(window.__ISA_IMPORTANT_BOARD_V2__)return;window.__ISA_IMPORTANT_BOARD_V2__=true
  const $=id=>document.getElementById(id),q=(s,r=document)=>r?.querySelector?.(s)||null,qa=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])]
  const CATS={remember:['💡','Lembrar'],important:['❗','Importante'],schedule:['🗓️','Agendar'],idea:['✨','Boa ideia'],research:['🔎','Pesquisar']}
  const PINS=[
    {v:'🩷',label:'Rosa',cls:'pink'},{v:'🩵',label:'Azul',cls:'blue'},{v:'💜',label:'Lilás',cls:'lilac'},{v:'🌸',label:'Flor',cls:'flower'},
    {v:'⭐',label:'Estrela',cls:'star'},{v:'📌',label:'Alfinete',cls:'classic'},{v:'🔵',label:'Azul escuro',cls:'deepblue'},{v:'🟣',label:'Roxo',cls:'purple'}
  ]
  let filter='',chosenPin='',editing=null,drag=null
  const pinMeta=v=>PINS.find(p=>p.v===v)||PINS[0]
  const pinButtons=(attr,compact=false)=>PINS.map(p=>`<button type="button" ${attr}="${p.v}" class="ib-fixer-choice ib-fixer-${p.cls}${compact?' compact':''}" title="Fixador ${p.label}" aria-label="Fixador ${p.label}"><span>${p.v}</span><small>${p.label}</small></button>`).join('')
  function css(){if($('importantBoardCss'))return;const l=document.createElement('link');l.id='importantBoardCss';l.rel='stylesheet';l.href='./conversation-important-v2.css?v=2-fixadores-todos';document.head.appendChild(l)}
  function external(){return !!$('friendApp')}
  function profile(){return String(window.__ISA_FRIEND_PERSON__?.name||$('myName')?.textContent||$('friendName')?.textContent||'familia').trim()}
  function activeConv(){
    if(external()){const b=q('#friendConversationList .friend-conversation.active[data-friend-conv]');return b?.dataset.friendConv||String($('friendThreadTitle')?.textContent||'conversa')}
    const b=q('#chatList .chat-item.active[data-conv],#chatList [data-conv][aria-current="true"]');return b?.dataset.conv||String($('chatTitle')?.textContent||'conversa')
  }
  function key(){return `isa-important-v2:${profile().toLowerCase()}:${activeConv()}`}
  function load(){try{return JSON.parse(localStorage.getItem(key())||'[]')}catch{return[]}}
  function save(rows){try{localStorage.setItem(key(),JSON.stringify(rows))}catch{}}
  function toast(text){const t=$('friendToast')||$('toast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._ib);t._ib=setTimeout(()=>t.classList.add('hidden'),2400)}
  function defaultPin(){const n=profile().toLowerCase();return /(^|\s)(alan|davi|elion)(\s|$)/i.test(n)?'📌':'🩷'}
  function selectPin(value,{applyEditor=true}={}){
    const o=board();chosenPin=value||defaultPin()
    qa('[data-ib-pin]',o).forEach(x=>x.classList.toggle('active',x.dataset.ibPin===chosenPin))
    qa('[data-ib-editor-pin]',o).forEach(x=>x.classList.toggle('active',x.dataset.ibEditorPin===chosenPin))
    if(applyEditor&&editing&&q('.ib-editor',o)?.classList.contains('show'))editing.pin=chosenPin
  }
  function board(){let o=$('isaImportantBoard');if(o)return o;css();o=document.createElement('section');o.id='isaImportantBoard';o.innerHTML=`<div class="ib-shell"><header class="ib-head"><span style="font-size:26px">📌</span><div class="grow"><h2>Conversa importante</h2><small>Seus post-its pessoais desta conversa. Compartilhe só quando quiser.</small></div><button class="ib-close" type="button">✕</button></header><div class="ib-tools">${Object.entries(CATS).map(([k,v])=>`<button class="ib-cat" data-ib-filter="${k}" type="button">${v[0]} ${v[1]}</button>`).join('')}<button class="ib-new" type="button">＋ Nova nota</button></div><div class="ib-fixer-toolbar"><div class="ib-fixer-title"><b>📍 Fixadores</b><small>Escolha um para cada post-it</small></div><div class="ib-pin-picker">${pinButtons('data-ib-pin')}</div></div><div class="ib-board"></div><div class="ib-share-hint">💜 <b>Compartilhar</b> envia uma cópia para a conversa e mantém o post-it aqui. <b>Mover para chat</b> envia e tira a nota do seu quadro pessoal.</div></div><div class="ib-editor"><div class="ib-editor-card"><h3>Nova nota ✨</h3><textarea maxlength="600" placeholder="Escreva o que quer lembrar..."></textarea><div class="ib-editor-row">${Object.entries(CATS).map(([k,v])=>`<button type="button" data-ib-cat="${k}">${v[0]} ${v[1]}</button>`).join('')}</div><div class="ib-editor-fixers"><strong>📍 Fixador deste post-it</strong><small>Você pode usar um diferente em cada nota.</small><div class="ib-editor-pins">${pinButtons('data-ib-editor-pin',true)}</div></div><div class="ib-editor-actions"><button type="button" data-ib-cancel>Cancelar</button><button type="button" class="save" data-ib-save>Salvar</button></div></div></div>`;document.body.appendChild(o)
    q('.ib-close',o).onclick=()=>o.classList.remove('show');q('.ib-new',o).onclick=()=>openEditor();q('[data-ib-cancel]',o).onclick=()=>q('.ib-editor',o).classList.remove('show');q('[data-ib-save]',o).onclick=saveEditor
    qa('[data-ib-filter]',o).forEach(b=>b.onclick=()=>{filter=filter===b.dataset.ibFilter?'':b.dataset.ibFilter;qa('[data-ib-filter]',o).forEach(x=>x.classList.toggle('active',x.dataset.ibFilter===filter));render()})
    qa('[data-ib-pin]',o).forEach(b=>b.onclick=()=>selectPin(b.dataset.ibPin))
    qa('[data-ib-editor-pin]',o).forEach(b=>b.onclick=()=>selectPin(b.dataset.ibEditorPin))
    qa('[data-ib-cat]',o).forEach(b=>b.onclick=()=>{editing.cat=b.dataset.ibCat;qa('[data-ib-cat]',o).forEach(x=>x.classList.toggle('active',x.dataset.ibCat===editing.cat))})
    q('.ib-board',o).addEventListener('click',onBoardClick)
    q('.ib-board',o).addEventListener('pointerdown',startDrag)
    document.addEventListener('pointermove',moveDrag,{passive:false});document.addEventListener('pointerup',endDrag)
    selectPin(defaultPin(),{applyEditor:false});return o
  }
  function injectButtons(){
    const targets=external()?[q('#friendThread .friend-thread-head')]:[q('#chatPanel .chat-header')]
    for(const h of targets){if(!h||q('.isa-important-open',h))continue;const b=document.createElement('button');b.type='button';b.className='isa-important-open';b.textContent='📌 Importante';b.title='Abrir meus post-its desta conversa';Object.assign(b.style,{border:'1px solid #eadff0',borderRadius:'13px',background:'#fff8fc',color:'#6a5673',padding:'8px 10px',fontWeight:'850',cursor:'pointer',marginLeft:'6px'});b.onclick=e=>{e.preventDefault();e.stopPropagation();open()};h.appendChild(b)}
  }
  function open(){const o=board();filter='';q('.ib-editor',o).classList.remove('show');o.classList.add('show');render()}
  function openEditor(note=null){const o=board();editing=note?{...note}:{id:crypto.randomUUID(),cat:'remember',text:'',pin:chosenPin||defaultPin(),x:null,y:null,rot:(Math.random()*2-1).toFixed(2)};editing.pin=editing.pin||chosenPin||defaultPin();q('.ib-editor textarea',o).value=editing.text||'';qa('[data-ib-cat]',o).forEach(x=>x.classList.toggle('active',x.dataset.ibCat===editing.cat));q('.ib-editor h3',o).textContent=note?'Editar post-it ✨':'Nova nota ✨';q('.ib-editor',o).classList.add('show');selectPin(editing.pin,{applyEditor:false});setTimeout(()=>q('.ib-editor textarea',o).focus(),30)}
  function saveEditor(){const o=board(),text=q('.ib-editor textarea',o).value.trim();if(!text)return toast('Escreva algo na nota.');editing.text=text;editing.pin=editing.pin||chosenPin||defaultPin();const rows=load(),i=rows.findIndex(x=>x.id===editing.id);if(i>=0)rows[i]=editing;else{const n=rows.length;editing.x=editing.x??20+(n%4)*230;editing.y=editing.y??22+Math.floor(n/4)*180;rows.push(editing)}save(rows);q('.ib-editor',o).classList.remove('show');render()}
  function render(){const o=board(),box=q('.ib-board',o),rows=load();box.innerHTML=rows.filter(n=>!filter||n.cat===filter).map((n,i)=>{const c=CATS[n.cat]||CATS.remember,p=pinMeta(n.pin||defaultPin());return `<article class="ib-note" data-note="${n.id}" data-cat="${n.cat}" style="left:${Number(n.x)||20}px;top:${Number(n.y)||20}px;--rot:${Number(n.rot)||0}deg"><span class="ib-pin ib-pin-${p.cls}" title="Fixador ${p.label}">${p.v}</span><button class="ib-note-menu" data-note-edit="${n.id}" type="button" title="Editar post-it">•••</button><h4>${c[0]} ${c[1]}</h4><textarea readonly>${String(n.text||'').replace(/&/g,'&amp;').replace(/</g,'&lt;')}</textarea><div class="ib-note-actions"><button data-note-share="${n.id}" type="button">↥ Compartilhar</button><button data-note-move="${n.id}" type="button">💬 Mover para chat</button><button data-note-delete="${n.id}" type="button">✕</button></div></article>`}).join('')||'<div style="padding:34px;text-align:center;color:#95839d">Nenhum post-it aqui ainda. Crie uma nota para esta conversa 💜</div>'}
  function note(id){return load().find(x=>x.id===id)}
  function onBoardClick(e){
    const id=e.target.dataset.noteEdit||e.target.dataset.noteShare||e.target.dataset.noteMove||e.target.dataset.noteDelete;if(!id)return
    e.preventDefault();e.stopPropagation();const n=note(id);if(!n)return
    if(e.target.dataset.noteEdit)openEditor(n)
    else if(e.target.dataset.noteDelete){const rows=load().filter(x=>x.id!==id);save(rows);render()}
    else if(e.target.dataset.noteShare)sendToChat(n,false)
    else if(e.target.dataset.noteMove)sendToChat(n,true)
  }
  function sendToChat(n,remove){
    const input=external()?$('friendMessageInput'):$('messageInput'),send=external()?$('friendSendBtn'):$('sendBtn');if(!input||!send)return toast('Abra a conversa antes de compartilhar.')
    const c=CATS[n.cat]||CATS.remember;input.value=`📌 ${c[1]}\n${n.text}`;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();setTimeout(()=>send.click(),60)
    if(remove){setTimeout(()=>{save(load().filter(x=>x.id!==n.id));render();toast('Post-it movido para a conversa 💬')},450)}else toast('Cópia enviada para a conversa 💜')
  }
  function startDrag(e){const n=e.target.closest('.ib-note');if(!n||e.target.closest('button,textarea'))return;const box=q('.ib-board',board()),r=n.getBoundingClientRect(),br=box.getBoundingClientRect();drag={id:n.dataset.note,el:n,box,startX:e.clientX,startY:e.clientY,x:r.left-br.left+box.scrollLeft,y:r.top-br.top+box.scrollTop};n.setPointerCapture?.(e.pointerId);e.preventDefault()}
  function moveDrag(e){if(!drag)return;e.preventDefault();const maxX=Math.max(0,drag.box.scrollWidth-drag.el.offsetWidth-8),maxY=Math.max(0,drag.box.scrollHeight-drag.el.offsetHeight-8),x=Math.max(4,Math.min(maxX,drag.x+e.clientX-drag.startX)),y=Math.max(4,Math.min(maxY,drag.y+e.clientY-drag.startY));drag.el.style.left=x+'px';drag.el.style.top=y+'px';drag.nx=x;drag.ny=y}
  function endDrag(){if(!drag)return;const rows=load(),n=rows.find(x=>x.id===drag.id);if(n){n.x=drag.nx??drag.x;n.y=drag.ny??drag.y;save(rows)}drag=null}
  css();board();injectButtons();new MutationObserver(()=>injectButtons()).observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('isa:chat-opened',injectButtons);document.addEventListener('isa:friend-portal-entered',injectButtons);window.__ISA_IMPORTANT_BOARD__={open,render}
})();
