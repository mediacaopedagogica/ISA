// Cantinho da Isa — Quadro do Dia lúdico entre Keise e Isa.
// Módulo isolado: não altera Chat, Nossa Rede, conversas, grupos ou boot.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js'

const db=createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}})
const $=id=>document.getElementById(id)
const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ')
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const EMOJIS=['✨','🪥','🌸','🎀','⭐','💜','🧸','📚','🎒','💧','🌈','🎵']
let me=null,isa=null,board=null,items=[],channel=null,busy=false,refreshTimer=0

function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function prettyDate(){return new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'2-digit',month:'long'}).format(new Date())}
function isKeise(){return norm(me?.display_name).startsWith('keise')}
function isIsa(){return norm(me?.display_name)==='isa'}
function toast(text){const t=$('toast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._dtb);t._dtb=setTimeout(()=>t.classList.add('hidden'),2600)}

async function identity(force=false){
  if(me&&!force)return me
  const {data:{user}}=await db.auth.getUser();if(!user)return null
  const {data,error}=await db.from('family_members').select('id,family_id,display_name,relationship_label,active').eq('auth_user_id',user.id).eq('active',true).maybeSingle()
  if(error||!data)return null;me=data
  if(isKeise()){
    const r=await db.from('family_members').select('id,family_id,display_name,relationship_label,active').eq('family_id',me.family_id).eq('active',true).ilike('display_name','Isa').maybeSingle()
    isa=r.data||null
  }
  return me
}

function ensureCss(){
  if($('dailyTaskBoardCss'))return
  const s=document.createElement('style');s.id='dailyTaskBoardCss';s.textContent=`
  #dailyTaskTile{position:relative}
  #dailyTaskTile .dtb-tile-badge{position:absolute;right:9px;top:8px;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:#ff7fb2;color:white;display:grid;place-items:center;font:900 10px/1 Inter,sans-serif;box-shadow:0 5px 12px #d66b9e38}
  .dtb-modal{position:fixed;inset:0;z-index:2147482500;display:none;place-items:center;padding:16px;background:rgba(57,43,68,.35);backdrop-filter:blur(12px)}.dtb-modal.show{display:grid}
  .dtb-card{width:min(720px,96vw);max-height:92dvh;overflow:auto;border:1px solid rgba(255,255,255,.95);border-radius:30px;padding:18px;background:linear-gradient(145deg,#fffafd,#f8f1ff 52%,#eef8ff);box-shadow:0 28px 80px rgba(70,48,87,.24);color:#5b4965;position:relative}
  .dtb-card:before,.dtb-card:after{content:'✦';position:absolute;color:#efb5d4;font-size:21px;pointer-events:none}.dtb-card:before{left:22px;top:18px}.dtb-card:after{right:56px;top:20px;color:#c5b4f2}
  .dtb-head{display:flex;align-items:flex-start;gap:12px}.dtb-title{flex:1}.dtb-title h2{margin:0;font-size:24px;color:#503d5a}.dtb-title p{margin:5px 0 0;color:#8b7893;font-size:11px}.dtb-close{width:42px;height:42px;border:0;border-radius:15px;background:#efe7f5;color:#6f5b78;font-size:18px;cursor:pointer}
  .dtb-meta{display:flex;gap:7px;flex-wrap:wrap;margin:13px 0}.dtb-chip{padding:7px 10px;border-radius:999px;background:#fff;border:1px solid #eadfeb;color:#755f7d;font-size:10px;font-weight:850}.dtb-chip.sent{background:#fff0f7}.dtb-chip.done{background:#eefbf2;color:#47745b}
  .dtb-progress{height:13px;border-radius:999px;background:#eee7f3;overflow:hidden;box-shadow:inset 0 2px 4px #7e648118}.dtb-progress>i{display:block;height:100%;width:0;border-radius:inherit;background:linear-gradient(90deg,#f4a7ce,#b9a4ef,#9edff0);transition:width .25s ease}.dtb-progress-text{display:flex;justify-content:space-between;gap:8px;margin:7px 2px 14px;font-size:10px;color:#8b7894;font-weight:800}
  .dtb-list{display:grid;gap:9px}.dtb-item{display:grid;grid-template-columns:48px minmax(0,1fr) auto;align-items:center;gap:9px;padding:11px;border-radius:20px;background:rgba(255,255,255,.9);border:1px solid #ede1ef;box-shadow:0 8px 20px rgba(92,67,108,.07);transition:.2s}.dtb-item.done{background:linear-gradient(145deg,#f1fff5,#fff);border-color:#cfead7}.dtb-item.done .dtb-task-text{text-decoration:line-through;color:#8ca092}
  .dtb-check{width:45px;height:45px;border:0;border-radius:16px;background:linear-gradient(145deg,#ffe4f0,#e5dcff);display:grid;place-items:center;font-size:22px;cursor:pointer;box-shadow:0 6px 14px rgba(96,70,115,.10)}.dtb-check.checked{background:linear-gradient(145deg,#d9f5df,#effff4);color:#47845d}.dtb-check:disabled{cursor:default;opacity:1}
  .dtb-task-text{font-size:13px;font-weight:850;color:#654f70;line-height:1.35}.dtb-task-edit{width:100%;border:1px solid #eadfeb;border-radius:13px;padding:9px 10px;background:#fffafd;color:#604e69;font:700 12px Inter,sans-serif;outline:none}.dtb-task-edit:focus{border-color:#d6b9e0;box-shadow:0 0 0 3px #dabce525}.dtb-remove{width:34px;height:34px;border:0;border-radius:12px;background:#fff0f4;color:#a45b70;cursor:pointer;font-weight:900}
  .dtb-builder{margin-top:14px;padding:13px;border-radius:21px;background:linear-gradient(145deg,#fff,#fbf5ff);border:1px dashed #ddcce5}.dtb-builder label{display:block;font-size:10px;font-weight:900;color:#755f7e;margin-bottom:6px}.dtb-addline{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:7px}.dtb-emoji{width:54px;border:1px solid #eadfeb;border-radius:14px;background:#fff;text-align:center;font-size:20px}.dtb-newtext{min-width:0;border:1px solid #eadfeb;border-radius:14px;padding:10px 12px;background:#fff;color:#604e69;font:700 12px Inter,sans-serif}.dtb-add{border:0;border-radius:14px;padding:10px 14px;background:linear-gradient(135deg,#ec9ac8,#b59be7);color:#fff;font-weight:950;cursor:pointer}.dtb-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:13px}.dtb-send{flex:1;border:0;border-radius:16px;padding:12px 15px;background:linear-gradient(135deg,#e98fc3,#a993e4);color:white;font-weight:950;cursor:pointer;box-shadow:0 8px 18px #a47cb42a}.dtb-send:disabled,.dtb-add:disabled{opacity:.55;cursor:wait}
  .dtb-empty{padding:34px 16px;text-align:center;border:1px dashed #dfd1e4;border-radius:22px;background:#fff9fd;color:#8d7a95}.dtb-empty .big{font-size:42px;display:block;margin-bottom:8px}.dtb-celebrate{margin-top:14px;padding:16px;border-radius:20px;text-align:center;background:linear-gradient(135deg,#fff5be,#ffe8f3,#e9e1ff);font-weight:950;color:#74586f;animation:dtbPop .4s ease}.dtb-celebrate b{display:block;font-size:18px;margin-bottom:3px}@keyframes dtbPop{from{transform:scale(.96);opacity:.3}to{transform:scale(1);opacity:1}}
  .dtb-spark{position:fixed;z-index:2147482600;pointer-events:none;font-size:20px;animation:dtbSpark .75s ease-out forwards}@keyframes dtbSpark{to{transform:translate(var(--x),var(--y)) rotate(45deg);opacity:0}}
  @media(max-width:650px){.dtb-modal{padding:0;align-items:stretch}.dtb-card{width:100vw;max-width:none;height:100dvh;max-height:100dvh;border-radius:0;padding:15px 11px 88px}.dtb-title h2{font-size:21px}.dtb-item{grid-template-columns:46px minmax(0,1fr) auto}.dtb-addline{grid-template-columns:52px 1fr}.dtb-add{grid-column:1/-1}.dtb-actions{position:sticky;bottom:0;padding:10px 0 4px;background:linear-gradient(transparent,#f8f1ff 24%)}}
  `;document.head.appendChild(s)
}

function build(){
  ensureCss()
  if(!$('dailyTaskBoardModal')){
    const m=document.createElement('section');m.id='dailyTaskBoardModal';m.className='dtb-modal';m.innerHTML='<article class="dtb-card"><header class="dtb-head"><div class="dtb-title"><h2 id="dtbTitle">🌈 Quadro do Dia</h2><p id="dtbSubtitle"></p></div><button id="dtbClose" class="dtb-close" type="button" aria-label="Fechar">✕</button></header><div id="dtbBody"></div></article>';document.body.appendChild(m)
    $('dtbClose').onclick=close;m.onclick=e=>{if(e.target===m)close()}
  }
}

async function loadBoard(){
  await identity();if(!me||( !isKeise()&&!isIsa()))return null
  if(isKeise()&&!isa)return null
  let q=db.from('daily_task_boards').select('id,family_id,creator_id,assignee_id,board_date,title,status,published_at,completed_at,created_at,updated_at').eq('board_date',today())
  if(isKeise())q=q.eq('creator_id',me.id).eq('assignee_id',isa.id)
  else q=q.eq('assignee_id',me.id).in('status',['published','completed'])
  const {data,error}=await q.maybeSingle();if(error)throw error;board=data||null
  items=[]
  if(board){const r=await db.from('daily_task_items').select('id,board_id,task_text,emoji,position,done,done_at,completed_by,created_at,updated_at').eq('board_id',board.id).order('position').order('created_at');if(r.error)throw r.error;items=r.data||[]}
  subscribe();updateTileBadge();return board
}

async function ensureBoard(){
  if(board)return board
  if(!isKeise()||!isa)throw new Error('Quadro disponível apenas para Keise criar para Isa.')
  const row={family_id:me.family_id,creator_id:me.id,assignee_id:isa.id,board_date:today(),title:'Quadro do Dia',status:'draft'}
  const {data,error}=await db.from('daily_task_boards').insert(row).select('*').single()
  if(error){
    const again=await db.from('daily_task_boards').select('*').eq('creator_id',me.id).eq('assignee_id',isa.id).eq('board_date',today()).maybeSingle();if(again.error||!again.data)throw error;board=again.data
  }else board=data
  subscribe();return board
}

function progress(){const total=items.length,done=items.filter(x=>x.done).length;return{total,done,pct:total?Math.round(done*100/total):0}}
function statusText(){if(!board)return'Nenhum quadro hoje';if(board.status==='draft')return'Rascunho • só você vê';if(board.status==='completed')return'Completo 🌟';return'Enviado para Isa 💌'}

function render(){
  build();const body=$('dtbBody');if(!body)return
  const p=progress(),creator=isKeise()
  $('dtbTitle').textContent=creator?'🌈 Quadro do Dia da Isa':'🌷 Meu Quadro do Dia'
  $('dtbSubtitle').textContent=creator?'Crie as tarefas do dia e envie para a Isa ir marcando conforme fizer.':`Hoje • ${prettyDate()}`
  let html=`<div class="dtb-meta"><span class="dtb-chip">📅 ${esc(prettyDate())}</span><span class="dtb-chip ${board?.status==='published'?'sent':board?.status==='completed'?'done':''}">${esc(statusText())}</span></div><div class="dtb-progress"><i style="width:${p.pct}%"></i></div><div class="dtb-progress-text"><span>${p.done} de ${p.total} concluída${p.total===1?'':'s'}</span><span>${p.pct}% ⭐</span></div>`
  if(!items.length)html+=creator?'<div class="dtb-empty"><span class="big">📝✨</span><b>Seu quadro está prontinho para começar!</b><br>Adicione as perguntinhas ou tarefas que quiser enviar para a Isa.</div>':'<div class="dtb-empty"><span class="big">🌷</span><b>Ainda não chegou um quadro para hoje.</b><br>Quando a Keise enviar, ele aparece aqui.</div>'
  else html+=`<div class="dtb-list">${items.map(x=>`<div class="dtb-item ${x.done?'done':''}" data-task="${x.id}"><button type="button" class="dtb-check ${x.done?'checked':''}" data-toggle="${x.id}" ${creator?'disabled':''}>${x.done?'✓':esc(x.emoji||'✨')}</button><div>${creator?`<input class="dtb-task-edit" data-edit="${x.id}" value="${esc(x.task_text)}" maxlength="240">`:`<div class="dtb-task-text">${esc(x.task_text)}</div>`}</div>${creator?`<button type="button" class="dtb-remove" data-remove="${x.id}" title="Remover">✕</button>`:'<span></span>'}</div>`).join('')}</div>`
  if(creator)html+=`<section class="dtb-builder"><label>Nova tarefa / pergunta</label><div class="dtb-addline"><select id="dtbEmoji" class="dtb-emoji" aria-label="Emoji da tarefa">${EMOJIS.map(e=>`<option>${e}</option>`).join('')}</select><input id="dtbNewText" class="dtb-newtext" maxlength="240" placeholder="Ex.: Já escovou os dentes?"><button id="dtbAdd" class="dtb-add" type="button">＋ Adicionar</button></div></section><div class="dtb-actions"><button id="dtbSend" class="dtb-send" type="button">${board?.status==='draft'||!board?'💌 Enviar quadro para Isa':'💌 Atualizar quadro da Isa'}</button></div>`
  if(!creator&&p.total>0&&p.done===p.total)html+='<div class="dtb-celebrate"><b>🌟 Uhuu! Quadro completo! 🌈</b>Você marcou todas as tarefas de hoje. 💜</div>'
  body.innerHTML=html
  if(creator)wireCreator();else wireIsa()
}

function wireCreator(){
  $('dtbAdd')?.addEventListener('click',addTask);$('dtbNewText')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addTask()}})
  document.querySelectorAll('#dtbBody [data-remove]').forEach(b=>b.onclick=()=>removeTask(b.dataset.remove))
  document.querySelectorAll('#dtbBody [data-edit]').forEach(i=>i.addEventListener('change',()=>editTask(i.dataset.edit,i.value)))
  $('dtbSend')?.addEventListener('click',publish)
}
function wireIsa(){document.querySelectorAll('#dtbBody [data-toggle]').forEach(b=>b.onclick=()=>toggleTask(b.dataset.toggle,b))}

async function addTask(){if(busy)return;const input=$('dtbNewText'),text=String(input?.value||'').trim();if(!text)return toast('Escreva uma tarefa primeiro.');busy=true;try{await ensureBoard();const position=items.length?Math.max(...items.map(x=>Number(x.position)||0))+1:1;const {error}=await db.from('daily_task_items').insert({board_id:board.id,task_text:text,emoji:$('dtbEmoji')?.value||'✨',position});if(error)throw error;input.value='';await refresh()}catch(e){toast(e.message||'Não foi possível adicionar a tarefa.')}finally{busy=false}}
async function editTask(id,text){text=String(text||'').trim();if(!text)return refresh();try{const {error}=await db.from('daily_task_items').update({task_text:text}).eq('id',id);if(error)throw error}catch(e){toast('Não foi possível editar.');refresh()}}
async function removeTask(id){if(busy)return;busy=true;try{const {error}=await db.from('daily_task_items').delete().eq('id',id);if(error)throw error;await refresh()}catch(e){toast('Não foi possível remover.')}finally{busy=false}}
async function publish(){if(busy)return;if(!items.length)return toast('Adicione pelo menos uma tarefa.');busy=true;const btn=$('dtbSend');if(btn){btn.disabled=true;btn.textContent='Enviando…'};try{await ensureBoard();const {error}=await db.from('daily_task_boards').update({status:'published',published_at:new Date().toISOString(),completed_at:null}).eq('id',board.id);if(error)throw error;toast('Quadro enviado para Isa 💌');await refresh()}catch(e){toast(e.message||'Não foi possível enviar o quadro.')}finally{busy=false}}

function sparks(btn){const r=btn.getBoundingClientRect(),symbols=['✨','⭐','💜','🌸'];for(let i=0;i<7;i++){const s=document.createElement('span');s.className='dtb-spark';s.textContent=symbols[i%symbols.length];s.style.left=`${r.left+r.width/2}px`;s.style.top=`${r.top+r.height/2}px`;s.style.setProperty('--x',`${Math.round((Math.random()-.5)*120)}px`);s.style.setProperty('--y',`${Math.round(-30-Math.random()*90)}px`);document.body.appendChild(s);setTimeout(()=>s.remove(),850)}}
async function toggleTask(id,btn){if(busy)return;const item=items.find(x=>x.id===id);if(!item)return;busy=true;try{const next=!item.done;const {error}=await db.from('daily_task_items').update({done:next,done_at:next?new Date().toISOString():null,completed_by:next?me.id:null}).eq('id',id);if(error)throw error;if(next)sparks(btn);await refresh();const p=progress();if(board){const status=p.total>0&&p.done===p.total?'completed':'published';await db.from('daily_task_boards').update({status,completed_at:status==='completed'?new Date().toISOString():null}).eq('id',board.id);board.status=status;render()}}catch(e){toast(e.message||'Não foi possível marcar esta tarefa.')}finally{busy=false}}

async function refresh(){clearTimeout(refreshTimer);await loadBoard();render()}
function scheduleRefresh(){clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>refresh().catch(()=>{}),100)}
function subscribe(){
  if(channel){try{db.removeChannel(channel)}catch{};channel=null}
  if(!me)return
  channel=db.channel(`daily-task-${me.id}-${Date.now()}`)
  if(board?.id)channel.on('postgres_changes',{event:'*',schema:'public',table:'daily_task_items',filter:`board_id=eq.${board.id}`},scheduleRefresh).on('postgres_changes',{event:'UPDATE',schema:'public',table:'daily_task_boards',filter:`id=eq.${board.id}`},scheduleRefresh)
  else if(isIsa())channel.on('postgres_changes',{event:'*',schema:'public',table:'daily_task_boards',filter:`assignee_id=eq.${me.id}`},scheduleRefresh)
  channel.subscribe()
}

async function updateTileBadge(){
  const tile=$('dailyTaskTile');if(!tile||!isIsa())return
  const pending=items.filter(x=>!x.done).length;let b=tile.querySelector('.dtb-tile-badge')
  if(pending&&board?.status==='published'){if(!b){b=document.createElement('span');b.className='dtb-tile-badge';tile.appendChild(b)}b.textContent=String(pending)}else b?.remove()
}

async function open(){build();$('dailyTaskBoardModal')?.classList.add('show');$('dtbBody').innerHTML='<div class="dtb-empty"><span class="big">🌈</span>Carregando seu quadro…</div>';try{await loadBoard();render()}catch(e){$('dtbBody').innerHTML='<div class="dtb-empty"><span class="big">☁️</span>Não foi possível abrir o quadro agora.</div>';console.warn('Quadro do Dia:',e)}}
function close(){$('dailyTaskBoardModal')?.classList.remove('show')}

async function ensureTile(){
  await identity();if(!me||(!isKeise()&&!isIsa()))return false
  const grid=document.querySelector('#keiseApprovedHome .ka-grid');if(!grid)return false
  let tile=$('dailyTaskTile');if(tile)return true
  tile=document.createElement('button');tile.type='button';tile.id='dailyTaskTile';tile.className='ka-feature';tile.innerHTML='<span class="ka-feature-icon">🌈</span><span>Quadro do Dia</span>';tile.title=isKeise()?'Criar o Quadro do Dia da Isa':'Abrir meu Quadro do Dia';tile.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();open()})
  const settings=grid.querySelector('[data-approved-action="settings"]');settings?grid.insertBefore(tile,settings):grid.appendChild(tile)
  loadBoard().then(updateTileBadge).catch(()=>{});return true
}

function boot(){ensureCss();let n=0;const retry=()=>{ensureTile().then(ok=>{if(!ok&&++n<16)setTimeout(retry,350)}).catch(()=>{if(++n<16)setTimeout(retry,350)})};retry()}
document.addEventListener('isa:approved-home-ready',()=>setTimeout(()=>ensureTile(),60));document.addEventListener('isa:keise-approved-home-built',()=>setTimeout(()=>ensureTile(),60));window.addEventListener('pageshow',()=>setTimeout(()=>ensureTile(),180),{once:true});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&$ ('dailyTaskTile'))loadBoard().catch(()=>{})})
boot()
window.__ISA_DAILY_TASK_BOARD__={open,close,refresh,ensureTile}
