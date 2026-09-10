/* Conversa importante v4 — post-its pessoais que viram cartões colaborativos v2 dentro do chat. */
(function(){
  if(window.__ISA_IMPORTANT_BOARD_V2__)return;window.__ISA_IMPORTANT_BOARD_V2__=true
  const $=id=>document.getElementById(id),q=(s,r=document)=>r?.querySelector?.(s)||null,qa=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])]
  const CATS={remember:['💡','Lembrar'],important:['❗','Importante'],schedule:['🗓️','Agendar'],idea:['✨','Boa ideia'],research:['🔎','Pesquisar']}
  const STATUS={starting:['🌱','Iniciando'],progress:['🛠️','Em processo'],done:['✅','Concluído'],paused:['⏸️','Pausado'],help:['🆘','Precisa de ajuda'],cancelled:['✖️','Cancelado']}
  const PINS=[
    {v:'🩷',label:'Rosa',cls:'pink'},{v:'🩵',label:'Azul',cls:'blue'},{v:'💜',label:'Lilás',cls:'lilac'},{v:'🌸',label:'Flor',cls:'flower'},
    {v:'⭐',label:'Estrela',cls:'star'},{v:'📌',label:'Alfinete',cls:'classic'},{v:'🔵',label:'Azul escuro',cls:'deepblue'},{v:'🟣',label:'Roxo',cls:'purple'}
  ]
  let filter='',chosenPin='',editing=null,drag=null,collabPromise=null
  const pinMeta=v=>PINS.find(p=>p.v===v)||PINS[0]
  const pinButtons=(attr,compact=false)=>PINS.map(p=>`<button type="button" ${attr}="${p.v}" class="ib-fixer-choice ib-fixer-${p.cls}${compact?' compact':''}" title="Fixador ${p.label}" aria-label="Fixador ${p.label}"><span>${p.v}</span><small>${p.label}</small></button>`).join('')
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]))

  function css(){if($('importantBoardCss'))return;const l=document.createElement('link');l.id='importantBoardCss';l.rel='stylesheet';l.href='./conversation-important-v2.css?v=3-collab-chat';document.head.appendChild(l)}
  function external(){return !!$('friendApp')}
  function profile(){return String(window.__ISA_FRIEND_PERSON__?.name||$('myName')?.textContent||$('friendName')?.textContent||'familia').trim()}
  function activeConv(){
    if(external()){const b=q('#friendConversationList .friend-conversation.active[data-friend-conv]');return b?.dataset.friendConv||String($('friendThreadTitle')?.textContent||'conversa')}
    const b=q('#chatList .chat-item.active[data-conv],#chatList [data-conv][aria-current="true"]');return b?.dataset.conv||String($('chatTitle')?.textContent||'conversa')
  }
  function key(){return `isa-important-v2:${profile().toLowerCase()}:${activeConv()}`}
  function load(){try{return JSON.parse(localStorage.getItem(key())||'[]')}catch{return[]}}
  function save(rows){try{localStorage.setItem(key(),JSON.stringify(rows))}catch{}}
  function toast(text){const t=$('friendToast')||$('toast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._ib);t._ib=setTimeout(()=>t.classList.add('hidden'),2600)}
  function defaultPin(){const n=profile().toLowerCase();return /(^|\s)(alan|davi|elion)(\s|$)/i.test(n)?'📌':'🩷'}

  async function ensureCollab(){
    const current=window.__ISA_COLLAB_POSTITS__
    if(window.__ISA_COLLAB_POSTITS_V2__&&current?.toggleCancelled&&current?.openEditor)return current
    if(!collabPromise)collabPromise=import('./collaborative-chat-postits-v2.js?v=4-board-force-v2').catch(error=>{collabPromise=null;console.warn('Post-it colaborativo v2:',error);return null})
    await collabPromise
    const ready=window.__ISA_COLLAB_POSTITS__
    return ready?.toggleCancelled?ready:null
  }
  function collabCandidates(){return window.__ISA_COLLAB_POSTITS__?.candidates?.()||[]}
  function defaultCollaborators(){return window.__ISA_COLLAB_POSTITS__?.defaultCollaborators?.()||[]}

  function selectPin(value,{applyEditor=true}={}){
    const o=board();chosenPin=value||defaultPin()
    qa('[data-ib-pin]',o).forEach(x=>x.classList.toggle('active',x.dataset.ibPin===chosenPin))
    qa('[data-ib-editor-pin]',o).forEach(x=>x.classList.toggle('active',x.dataset.ibEditorPin===chosenPin))
    if(applyEditor&&editing&&q('.ib-editor',o)?.classList.contains('show'))editing.pin=chosenPin
  }

  function renderCollaboratorChoices(){
    const o=board(),box=q('.ib-editor-collaborators',o);if(!box)return
    const candidates=collabCandidates(),selected=new Set((editing?.collaborators||[]).map(String))
    box.innerHTML=candidates.length?candidates.map(n=>`<label class="ib-collab-person"><input type="checkbox" value="${esc(n)}" ${selected.has(n)?'checked':''}><span>👤 ${esc(n)}</span></label>`).join(''):'<small class="ib-collab-empty">Abra uma conversa para escolher quem também poderá escrever neste post-it.</small>'
  }

  function board(){
    let o=$('isaImportantBoard');if(o)return o
    css();o=document.createElement('section');o.id='isaImportantBoard'
    o.innerHTML=`<div class="ib-shell"><header class="ib-head"><span style="font-size:26px">📌</span><div class="grow"><h2>Conversa importante</h2><small>Seus post-its pessoais desta conversa. Ao compartilhar, eles podem virar cartões colaborativos dentro do chat.</small></div><button class="ib-close" type="button">✕</button></header><div class="ib-tools">${Object.entries(CATS).map(([k,v])=>`<button class="ib-cat" data-ib-filter="${k}" type="button">${v[0]} ${v[1]}</button>`).join('')}<button class="ib-new" type="button">＋ Nova nota</button></div><div class="ib-fixer-toolbar"><div class="ib-fixer-title"><b>📍 Fixadores</b><small>Escolha um para cada post-it</small></div><div class="ib-pin-picker">${pinButtons('data-ib-pin')}</div></div><div class="ib-board"></div><div class="ib-share-hint">💜 <b>Compartilhar</b> mantém o post-it no seu quadro e cria uma versão editável no chat. <b>Mover para chat</b> transforma a nota em um post-it colaborativo no chat e a retira do quadro pessoal.</div></div><div class="ib-editor"><div class="ib-editor-card"><h3>Nova nota ✨</h3><textarea maxlength="600" placeholder="Escreva o que quer lembrar..."></textarea><div class="ib-editor-row">${Object.entries(CATS).map(([k,v])=>`<button type="button" data-ib-cat="${k}">${v[0]} ${v[1]}</button>`).join('')}</div><div class="ib-editor-fixers"><strong>📍 Fixador deste post-it</strong><small>Você pode usar um diferente em cada nota.</small><div class="ib-editor-pins">${pinButtons('data-ib-editor-pin',true)}</div></div><div class="ib-editor-status"><strong>📋 Andamento</strong><small>O status também aparece quando a nota for para o chat.</small><select id="ibEditorStatus">${Object.entries(STATUS).filter(([k])=>k!=='cancelled').map(([k,v])=>`<option value="${k}">${v[0]} ${v[1]}</option>`).join('')}</select></div><div class="ib-editor-collab-wrap"><strong>🤝 Quem poderá escrever junto</strong><small>Marque outra pessoa. Quando ela visualizar este post-it na conversa, poderá editar, responder e alterar o andamento; cada resposta fica com o nome de quem escreveu.</small><div class="ib-editor-collaborators"></div></div><div class="ib-editor-actions"><button type="button" data-ib-cancel>Cancelar</button><button type="button" class="save" data-ib-save>Salvar</button></div></div></div>`
    document.body.appendChild(o)
    q('.ib-close',o).onclick=()=>o.classList.remove('show');q('.ib-new',o).onclick=()=>openEditor();q('[data-ib-cancel]',o).onclick=()=>q('.ib-editor',o).classList.remove('show');q('[data-ib-save]',o).onclick=saveEditor
    qa('[data-ib-filter]',o).forEach(b=>b.onclick=()=>{filter=filter===b.dataset.ibFilter?'':b.dataset.ibFilter;qa('[data-ib-filter]',o).forEach(x=>x.classList.toggle('active',x.dataset.ibFilter===filter));render()})
    qa('[data-ib-pin]',o).forEach(b=>b.onclick=()=>selectPin(b.dataset.ibPin))
    qa('[data-ib-editor-pin]',o).forEach(b=>b.onclick=()=>selectPin(b.dataset.ibEditorPin))
    qa('[data-ib-cat]',o).forEach(b=>b.onclick=()=>{if(!editing)return;editing.cat=b.dataset.ibCat;qa('[data-ib-cat]',o).forEach(x=>x.classList.toggle('active',x.dataset.ibCat===editing.cat))})
    q('.ib-board',o).addEventListener('click',onBoardClick);q('.ib-board',o).addEventListener('pointerdown',startDrag)
    document.addEventListener('pointermove',moveDrag,{passive:false});document.addEventListener('pointerup',endDrag)
    selectPin(defaultPin(),{applyEditor:false});ensureCollab().then(()=>renderCollaboratorChoices());return o
  }

  function injectButtons(){
    const targets=external()?[q('#friendThread .friend-thread-head')]:[q('#chatPanel .chat-header')]
    for(const h of targets){if(!h||q('.isa-important-open',h))continue;const b=document.createElement('button');b.type='button';b.className='isa-important-open';b.textContent='📌 Importante';b.title='Abrir meus post-its desta conversa';Object.assign(b.style,{border:'1px solid #eadff0',borderRadius:'13px',background:'#fff8fc',color:'#6a5673',padding:'8px 10px',fontWeight:'850',cursor:'pointer',marginLeft:'6px'});b.onclick=e=>{e.preventDefault();e.stopPropagation();open()};h.appendChild(b)}
  }
  function open(){const o=board();filter='';q('.ib-editor',o).classList.remove('show');o.classList.add('show');render();ensureCollab()}

  async function openEditor(note=null){
    const o=board();await ensureCollab()
    editing=note?{...note,collaborators:[...(note.collaborators||[])]}:{id:crypto.randomUUID(),cat:'remember',text:'',pin:chosenPin||defaultPin(),owner:profile(),collaborators:defaultCollaborators(),status:'starting',responses:[],x:null,y:null,rot:(Math.random()*2-1).toFixed(2)}
    editing.pin=editing.pin||chosenPin||defaultPin();editing.owner=editing.owner||profile();editing.status=STATUS[editing.status]&&editing.status!=='cancelled'?editing.status:'starting';editing.collaborators=editing.collaborators||[]
    q('.ib-editor textarea',o).value=editing.text||'';qa('[data-ib-cat]',o).forEach(x=>x.classList.toggle('active',x.dataset.ibCat===editing.cat));q('.ib-editor h3',o).textContent=note?'Editar post-it ✨':'Nova nota ✨';$('ibEditorStatus').value=editing.status
    q('.ib-editor',o).classList.add('show');selectPin(editing.pin,{applyEditor:false});renderCollaboratorChoices();setTimeout(()=>q('.ib-editor textarea',o).focus(),30)
  }

  function saveEditor(){
    const o=board(),text=q('.ib-editor textarea',o).value.trim();if(!text)return toast('Escreva algo na nota.')
    editing.text=text;editing.pin=editing.pin||chosenPin||defaultPin();editing.owner=editing.owner||profile();editing.status=$('ibEditorStatus')?.value||editing.status||'starting';editing.collaborators=qa('.ib-editor-collaborators input:checked',o).map(x=>x.value);editing.responses=editing.responses||[]
    const rows=load(),i=rows.findIndex(x=>x.id===editing.id);if(i>=0)rows[i]=editing;else{const n=rows.length;editing.x=editing.x??20+(n%4)*230;editing.y=editing.y??22+Math.floor(n/4)*180;rows.push(editing)}
    save(rows);q('.ib-editor',o).classList.remove('show');render()
  }

  function render(){
    const o=board(),box=q('.ib-board',o),rows=load()
    box.innerHTML=rows.filter(n=>!filter||n.cat===filter).map(n=>{const c=CATS[n.cat]||CATS.remember,p=pinMeta(n.pin||defaultPin()),st=STATUS[n.status]||STATUS.starting,collabs=(n.collaborators||[]).map(x=>`<span>🤝 ${esc(x)}</span>`).join('');return `<article class="ib-note" data-note="${esc(n.id)}" data-cat="${esc(n.cat)}" style="left:${Number(n.x)||20}px;top:${Number(n.y)||20}px;--rot:${Number(n.rot)||0}deg"><span class="ib-pin ib-pin-${p.cls}" title="Fixador ${p.label}">${p.v}</span><button class="ib-note-menu" data-note-edit="${esc(n.id)}" type="button" title="Editar post-it">•••</button><h4>${c[0]} ${c[1]}</h4><div class="ib-note-status" data-status="${esc(n.status||'starting')}">${st[0]} ${st[1]}</div><textarea readonly>${esc(n.text||'')}</textarea>${collabs?`<div class="ib-note-collabs">${collabs}</div>`:''}<div class="ib-note-actions"><button data-note-share="${esc(n.id)}" type="button">↥ Compartilhar</button><button data-note-move="${esc(n.id)}" type="button">💬 Mover para chat</button><button data-note-delete="${esc(n.id)}" type="button">✕</button></div></article>`}).join('')||'<div style="padding:34px;text-align:center;color:#95839d">Nenhum post-it aqui ainda. Crie uma nota para esta conversa 💜</div>'
  }
  function note(id){return load().find(x=>x.id===id)}
  function onBoardClick(e){
    const id=e.target.dataset.noteEdit||e.target.dataset.noteShare||e.target.dataset.noteMove||e.target.dataset.noteDelete;if(!id)return
    e.preventDefault();e.stopPropagation();const n=note(id);if(!n)return
    if(e.target.dataset.noteEdit)openEditor(n)
    else if(e.target.dataset.noteDelete){save(load().filter(x=>x.id!==id));render()}
    else if(e.target.dataset.noteShare)sendToChat(n,false)
    else if(e.target.dataset.noteMove)sendToChat(n,true)
  }

  async function sendToChat(n,remove){
    const input=external()?$('friendMessageInput'):$('messageInput'),send=external()?$('friendSendBtn'):$('sendBtn');if(!input||!send)return toast('Abra a conversa antes de compartilhar.')
    if(input.value.trim())return toast('Envie ou limpe a mensagem que está digitando antes de mover o post-it.')
    const collab=await ensureCollab();if(!collab?.fromBoard)return toast('O modo colaborativo ainda está carregando. Tente novamente em um instante.')
    n.owner=n.owner||profile();n.status=n.status||'starting';n.collaborators=n.collaborators?.length?n.collaborators:defaultCollaborators();n.responses=n.responses||[]
    const payload=collab.fromBoard(n);input.value=payload;input.dispatchEvent(new Event('input',{bubbles:true}));send.click()
    setTimeout(()=>{collab.scan?.();if(remove){save(load().filter(x=>x.id!==n.id));render();toast('Post-it movido para o chat e liberado para colaboração 💬')}else toast('Post-it compartilhado no chat 💜')},650)
  }

  function startDrag(e){const n=e.target.closest('.ib-note');if(!n||e.target.closest('button,textarea,input,select,label'))return;const box=q('.ib-board',board()),r=n.getBoundingClientRect(),br=box.getBoundingClientRect();drag={id:n.dataset.note,el:n,box,startX:e.clientX,startY:e.clientY,x:r.left-br.left+box.scrollLeft,y:r.top-br.top+box.scrollTop};n.setPointerCapture?.(e.pointerId);e.preventDefault()}
  function moveDrag(e){if(!drag)return;e.preventDefault();const maxX=Math.max(0,drag.box.scrollWidth-drag.el.offsetWidth-8),maxY=Math.max(0,drag.box.scrollHeight-drag.el.offsetHeight-8),x=Math.max(4,Math.min(maxX,drag.x+e.clientX-drag.startX)),y=Math.max(4,Math.min(maxY,drag.y+e.clientY-drag.startY));drag.el.style.left=x+'px';drag.el.style.top=y+'px';drag.nx=x;drag.ny=y}
  function endDrag(){if(!drag)return;const rows=load(),n=rows.find(x=>x.id===drag.id);if(n){n.x=drag.nx??drag.x;n.y=drag.ny??drag.y;save(rows)}drag=null}

  css();board();injectButtons();ensureCollab();new MutationObserver(()=>injectButtons()).observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('isa:chat-opened',injectButtons);document.addEventListener('isa:friend-portal-entered',()=>{injectButtons();ensureCollab()});window.__ISA_IMPORTANT_BOARD__={open,render,openEditor,sendToChat}
})();
