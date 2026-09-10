/* Post-its colaborativos no chat — usa a própria mensagem como histórico compartilhado.
   Cada edição gera uma nova versão do mesmo post-it; a interface mostra somente a versão mais recente. */
(function(){
  if(window.__ISA_COLLAB_POSTITS_V1__)return;window.__ISA_COLLAB_POSTITS_V1__=true
  const PREFIX='[[ISA_POSTIT_V1]]'
  const $=id=>document.getElementById(id),q=(s,r=document)=>r?.querySelector?.(s)||null,qa=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])]
  const PEOPLE=[['isa','Isa'],['keise','Keise Pâmela'],['alan','Alan Victor'],['davi','Davi'],['evalda','Evalda'],['paloma','Paloma'],['vania','Vânia'],['silvane','Silvane'],['elion','Elion']]
  const CATS={remember:['💡','Lembrar'],important:['❗','Importante'],schedule:['🗓️','Agendar'],idea:['✨','Boa ideia'],research:['🔎','Pesquisar']}
  const STATUS={starting:['🌱','Iniciando'],progress:['🛠️','Em processo'],done:['✅','Concluído'],paused:['⏸️','Pausado'],help:['🆘','Precisa de ajuda']}
  let editing=null,scanQueued=false,drag=null

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ')
  function keyOf(name){const n=norm(name);for(const [k] of PEOPLE)if(n===k||n.startsWith(k+' ')||n.includes(' '+k+' ')||n.includes(k))return k;return n}
  function me(){return String(window.__ISA_FRIEND_PERSON__?.name||$('myName')?.textContent||$('friendName')?.textContent||'Família').trim()}
  function allowedTarget(viewerKey,targetKey){
    if(!targetKey||viewerKey===targetKey)return false
    if(viewerKey==='elion')return ['isa','keise','alan','davi'].includes(targetKey)
    if(viewerKey==='evalda')return ['isa','alan','keise','paloma','vania'].includes(targetKey)
    if(viewerKey==='paloma')return ['keise','alan','davi','isa','evalda'].includes(targetKey)
    if(viewerKey==='vania')return targetKey!=='elion'
    if(viewerKey==='silvane')return ['alan','isa','keise'].includes(targetKey)
    return true
  }
  function candidates(){const mk=keyOf(me());return PEOPLE.filter(([k])=>allowedTarget(mk,k)).map(([,label])=>label)}
  function activeTitle(){return String($('friendThreadTitle')?.textContent||$('chatTitle')?.textContent||'').trim()}
  function defaultCollaborators(){const title=activeTitle(),tk=keyOf(title),hit=PEOPLE.find(([k])=>k===tk);return hit&&allowedTarget(keyOf(me()),tk)?[hit[1]]:[]}
  function css(){if($('isaCollabPostitCss'))return;const l=document.createElement('link');l.id='isaCollabPostitCss';l.rel='stylesheet';l.href='./collaborative-chat-postits-v1.css?v=1-collab-drag';document.head.appendChild(l)}
  function toast(text){const t=$('friendToast')||$('toast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._cp);t._cp=setTimeout(()=>t.classList.add('hidden'),2500)}
  function encode(p){const clean={v:1,id:String(p.id||crypto.randomUUID()),cat:p.cat||'remember',text:String(p.text||'').slice(0,700),pin:p.pin||'📌',owner:String(p.owner||me()).slice(0,70),collaborators:[...new Set((p.collaborators||[]).map(x=>String(x).slice(0,70)))].slice(0,8),status:STATUS[p.status]?p.status:'starting',responses:(p.responses||[]).slice(-12).map(r=>({name:String(r.name||'Família').slice(0,70),text:String(r.text||'').slice(0,260),at:r.at||new Date().toISOString()})),updatedBy:String(p.updatedBy||me()).slice(0,70),updatedAt:p.updatedAt||new Date().toISOString()};return PREFIX+JSON.stringify(clean)}
  function fromBoard(n){return encode({id:n.id,cat:n.cat,text:n.text,pin:n.pin,owner:profileOwner(n),collaborators:(n.collaborators?.length?n.collaborators:defaultCollaborators()),status:n.status||'starting',responses:n.responses||[],updatedBy:me(),updatedAt:new Date().toISOString()})}
  function profileOwner(n){return n.owner||me()}
  function decodeText(text){const s=String(text||''),i=s.indexOf(PREFIX);if(i<0)return null;try{const p=JSON.parse(s.slice(i+PREFIX.length));return p?.id?p:null}catch{return null}}
  function bodyNode(row){
    const bubble=q('.bubble,.friend-bubble',row);if(!bubble)return null
    const nodes=[...bubble.querySelectorAll('div')]
    for(let i=nodes.length-1;i>=0;i--){const t=nodes[i].textContent||'';if(t.includes(PREFIX))return nodes[i]}
    return null
  }
  function parseRow(row){
    if(row.dataset.isaPostitPayload){try{return JSON.parse(decodeURIComponent(row.dataset.isaPostitPayload))}catch{}}
    const body=bodyNode(row);if(!body)return null;const p=decodeText(body.textContent);if(p){try{row.dataset.isaPostitPayload=encodeURIComponent(JSON.stringify(p))}catch{}}return p
  }
  function authorized(p){const mk=keyOf(me());return keyOf(p.owner)===mk||(p.collaborators||[]).some(n=>keyOf(n)===mk)}
  function posKey(id){return `isa-collab-postit-pos:${keyOf(me())}:${id}`}
  function pos(id){try{return JSON.parse(localStorage.getItem(posKey(id))||'{"x":0,"y":0}')}catch{return{x:0,y:0}}}
  function savePos(id,x,y){try{localStorage.setItem(posKey(id),JSON.stringify({x,y}))}catch{}}
  function resetPos(id){try{localStorage.removeItem(posKey(id))}catch{}scan()}
  function responseHtml(p){return (p.responses||[]).slice(-5).map(r=>`<div class="isa-collab-response"><b>${esc(r.name)}</b>${esc(r.text)}</div>`).join('')}
  function cardHtml(p){
    const cat=CATS[p.cat]||CATS.remember,st=STATUS[p.status]||STATUS.starting,can=authorized(p),ps=pos(p.id),people=(p.collaborators||[]).length?`<div class="isa-collab-people"><span class="isa-collab-person">✍️ ${esc(p.owner)}</span>${p.collaborators.map(n=>`<span class="isa-collab-person">🤝 ${esc(n)}</span>`).join('')}</div>`:''
    return `<article class="isa-collab-postit" data-collab-postit="${esc(p.id)}" data-cat="${esc(p.cat)}" style="--isa-postit-x:${Number(ps.x)||0}px;--isa-postit-y:${Number(ps.y)||0}px"><span class="isa-collab-pin">${esc(p.pin||'📌')}</span><div class="isa-collab-head" data-collab-drag="${esc(p.id)}"><div class="grow"><h4>${cat[0]} ${cat[1]}</h4><small class="isa-collab-meta">Criado por ${esc(p.owner)}${p.updatedBy?` • última alteração: ${esc(p.updatedBy)}`:''}</small></div><span class="isa-collab-status" data-status="${esc(p.status)}">${st[0]} ${st[1]}</span></div><div class="isa-collab-text">${esc(p.text||'')}</div>${people}${responseHtml(p)}<div class="isa-collab-actions">${can?'<button class="primary" type="button" data-collab-edit>✏️ Editar / responder</button>':'<span class="isa-collab-locked">🔒 Somente pessoas marcadas podem editar.</span>'}<button type="button" data-collab-reset>↺ Posição</button></div></article>`
  }
  function renderRow(row,p){
    row.classList.remove('isa-collab-protocol-hidden');row.classList.add('isa-collab-postit-row')
    const bubble=q('.bubble,.friend-bubble',row);if(!bubble)return
    let body=bodyNode(row)
    if(!body){body=document.createElement('div');bubble.prepend(body)}
    body.innerHTML=cardHtml(p);body.dataset.collabRendered='1'
    const pin=q('.pin-btn',row);if(pin)pin.style.display='none'
  }
  function cleanPreview(){qa('#chatList .chat-item small,#friendConversationList .friend-conversation small').forEach(el=>{if((el.textContent||'').includes(PREFIX))el.textContent='📌 Post-it colaborativo'});const pb=$('pinnedBar');if(pb&&(pb.textContent||'').includes(PREFIX))pb.textContent='📌 Post-it colaborativo fixado'}
  function scan(){
    css();const rows=qa('#messages .message-row,#friendMessages .friend-msg'),groups=new Map(),parsed=[]
    for(const row of rows){const p=parseRow(row);if(!p)continue;parsed.push([row,p]);groups.set(String(p.id),[row,p])}
    for(const [row,p] of parsed){const latest=groups.get(String(p.id))?.[0]===row;if(!latest){row.classList.add('isa-collab-protocol-hidden');continue}renderRow(row,p)}
    cleanPreview()
  }
  function scheduleScan(){if(scanQueued)return;scanQueued=true;requestAnimationFrame(()=>{scanQueued=false;scan()})}
  function editor(){
    let o=$('isaCollabPostitEditor');if(o)return o
    o=document.createElement('section');o.id='isaCollabPostitEditor';o.innerHTML='<div class="isa-collab-editor-card"><h3>Editar post-it colaborativo ✨</h3><label>Texto do post-it<textarea id="isaCollabText" maxlength="700"></textarea></label><label>Andamento<select id="isaCollabStatus"></select></label><div id="isaCollabPeopleField"><label>Quem pode colaborar<div id="isaCollabCandidates" class="isa-collab-candidates"></div></label></div><div id="isaCollabEditorResponses" class="isa-collab-editor-responses"></div><label id="isaCollabReplyLabel">Escrever no post-it como você<textarea id="isaCollabReply" maxlength="260" placeholder="Adicione uma resposta, observação ou atualização..."></textarea></label><div class="isa-collab-editor-actions"><button type="button" data-collab-cancel>Cancelar</button><button type="button" class="save" data-collab-save>Salvar no chat</button></div></div>'
    document.body.appendChild(o);q('[data-collab-cancel]',o).onclick=()=>o.classList.remove('show');q('[data-collab-save]',o).onclick=saveEditor;o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('show')});return o
  }
  function openEditor(p){
    if(!authorized(p))return toast('Este post-it não foi compartilhado com você.')
    editing=JSON.parse(JSON.stringify(p));const o=editor(),owner=keyOf(p.owner)===keyOf(me())
    $('isaCollabText').value=p.text||'';$('isaCollabText').disabled=false
    $('isaCollabStatus').innerHTML=Object.entries(STATUS).map(([k,v])=>`<option value="${k}" ${p.status===k?'selected':''}>${v[0]} ${v[1]}</option>`).join('')
    $('isaCollabCandidates').innerHTML=candidates().map(n=>`<label class="isa-collab-candidate"><input type="checkbox" value="${esc(n)}" ${(p.collaborators||[]).some(x=>keyOf(x)===keyOf(n))?'checked':''} ${owner?'':'disabled'}><span>${esc(n)}</span></label>`).join('')
    $('isaCollabPeopleField').style.opacity=owner?'1':'.68'
    $('isaCollabEditorResponses').innerHTML=(p.responses||[]).map(r=>`<div class="isa-collab-editor-response"><b>${esc(r.name)}</b> — ${esc(r.text)}</div>`).join('')
    $('isaCollabReply').value='';$('isaCollabReplyLabel').firstChild.textContent=`Escrever no post-it como ${me()}`;o.classList.add('show');setTimeout(()=>$('isaCollabText').focus(),30)
  }
  function currentInput(){return $('friendMessageInput')||$('messageInput')}
  function currentSend(){return $('friendSendBtn')||$('sendBtn')}
  function sendRaw(body){const input=currentInput(),send=currentSend();if(!input||!send)return toast('Abra a conversa antes de atualizar o post-it.'),false;if(input.value.trim())return toast('Envie ou limpe a mensagem que está digitando antes.'),false;input.value=body;input.dispatchEvent(new Event('input',{bubbles:true}));send.click();return true}
  function saveEditor(){
    if(!editing)return
    const owner=keyOf(editing.owner)===keyOf(me()),reply=$('isaCollabReply').value.trim();editing.text=$('isaCollabText').value.trim();if(!editing.text)return toast('O post-it precisa ter um texto.')
    editing.status=$('isaCollabStatus').value
    if(owner)editing.collaborators=qa('#isaCollabCandidates input:checked').map(x=>x.value)
    if(reply){editing.responses=[...(editing.responses||[]),{name:me(),text:reply,at:new Date().toISOString()}].slice(-12)}
    editing.updatedBy=me();editing.updatedAt=new Date().toISOString()
    if(sendRaw(encode(editing))){$('isaCollabPostitEditor').classList.remove('show');toast('Post-it atualizado no chat 💜');setTimeout(scheduleScan,600)}
  }
  function payloadForCard(card){const row=card.closest('.message-row,.friend-msg');return row?parseRow(row):null}
  function startDrag(e){const handle=e.target.closest?.('[data-collab-drag]');if(!handle||e.target.closest('button,select,input,textarea'))return;const card=handle.closest('.isa-collab-postit'),p=payloadForCard(card);if(!card||!p)return;const cur=pos(p.id);drag={id:p.id,card,startX:e.clientX,startY:e.clientY,x:Number(cur.x)||0,y:Number(cur.y)||0};card.classList.add('dragging');card.setPointerCapture?.(e.pointerId);e.preventDefault()}
  function moveDrag(e){if(!drag)return;e.preventDefault();const mobile=matchMedia('(max-width:760px)').matches,limX=mobile?105:240,dx=Math.max(-limX,Math.min(limX,drag.x+e.clientX-drag.startX)),dy=Math.max(mobile?-90:-140,Math.min(mobile?180:280,drag.y+e.clientY-drag.startY));drag.nx=dx;drag.ny=dy;drag.card.style.setProperty('--isa-postit-x',dx+'px');drag.card.style.setProperty('--isa-postit-y',dy+'px')}
  function endDrag(){if(!drag)return;savePos(drag.id,drag.nx??drag.x,drag.ny??drag.y);drag.card.classList.remove('dragging');drag=null}

  document.addEventListener('click',e=>{const card=e.target.closest?.('.isa-collab-postit');if(!card)return;const p=payloadForCard(card);if(!p)return;if(e.target.closest('[data-collab-edit]')){e.preventDefault();openEditor(p)}else if(e.target.closest('[data-collab-reset]')){e.preventDefault();resetPos(p.id)}},true)
  document.addEventListener('pointerdown',startDrag,true);document.addEventListener('pointermove',moveDrag,{passive:false});document.addEventListener('pointerup',endDrag,true);document.addEventListener('pointercancel',endDrag,true)
  new MutationObserver(scheduleScan).observe(document.documentElement,{childList:true,subtree:true})
  document.addEventListener('isa:chat-opened',scheduleScan);document.addEventListener('isa:friend-portal-entered',scheduleScan);document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleScan()})
  css();setTimeout(scan,50);setInterval(cleanPreview,1800)
  window.__ISA_COLLAB_POSTITS__={PREFIX,encode,decodeText,fromBoard,candidates,defaultCollaborators,scan,sendRaw,openEditor}
})();
