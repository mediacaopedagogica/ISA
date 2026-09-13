// Cantinho da Isa — Quadro do Dia físico/pastel entre Keise e Isa.
// Módulo isolado: não altera Chat, Nossa Rede, conversas, grupos, boot ou outros perfis.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js'

const db=createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}})
const $=id=>document.getElementById(id)
const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ')
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const EMOJIS=['✨','🪥','🌸','🎀','⭐','💜','🧸','📚','🎒','💧','🌈','🎵','🛏️','🧹','🪮','🧼']
const NOTE_COLORS=['pink','lilac','mint','yellow']
let me=null,isa=null,board=null,items=[],channel=null,busy=false,refreshTimer=0,directConvId=null

function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function prettyDate(){return new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'2-digit',month:'long'}).format(new Date())}
function isKeise(){return norm(me?.display_name).startsWith('keise')}
function isIsa(){return norm(me?.display_name)==='isa'}
function toast(text){const t=$('toast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._dtb);t._dtb=setTimeout(()=>t.classList.add('hidden'),2600)}
function cleanTime(v){const m=String(v||'').match(/^(\d{2}):(\d{2})/);return m?`${m[1]}:${m[2]}`:''}
function safeMinutes(v){const n=Math.round(Number(v)||10);return Math.min(240,Math.max(1,n))}

async function identity(force=false){
  if(me&&!force)return me
  const {data:{user}}=await db.auth.getUser();if(!user)return null
  const {data,error}=await db.from('family_members').select('id,family_id,display_name,relationship_label,active').eq('auth_user_id',user.id).eq('active',true).maybeSingle()
  if(error||!data)return null;me=data
  if(isKeise()){
    const r=await db.from('family_members').select('id,family_id,display_name,relationship_label,active').eq('family_id',me.family_id).eq('active',true).ilike('display_name','Isa').maybeSingle()
    isa=r.data||null
  }else if(isIsa()) isa=me
  return me
}

function ensureCss(){
  if($('dailyTaskBoardCss'))return
  const s=document.createElement('style');s.id='dailyTaskBoardCss';s.textContent=`
  #dailyTaskTile{position:relative}
  #dailyTaskTile .dtb-tile-badge{position:absolute;right:9px;top:8px;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:#ff7fb2;color:#fff;display:grid;place-items:center;font:900 10px/1 Inter,sans-serif;box-shadow:0 5px 12px #d66b9e38}
  .dtb-modal{position:fixed;inset:0;z-index:2147482500;display:none;place-items:center;padding:16px;background:rgba(57,43,68,.38);backdrop-filter:blur(12px)}.dtb-modal.show{display:grid}
  .dtb-card{width:min(1120px,97vw);max-height:94dvh;overflow:auto;border:1px solid rgba(255,255,255,.95);border-radius:34px;padding:24px;background:linear-gradient(145deg,#fffafd,#faf3ff 48%,#eef7ff);box-shadow:0 30px 90px rgba(70,48,87,.25);color:#5b4965;position:relative;scrollbar-color:#8e8790 transparent;scrollbar-width:thin}
  .dtb-head{display:flex;align-items:flex-start;gap:14px;padding:2px 4px 0}.dtb-title{flex:1}.dtb-title h2{margin:0;font-size:34px;letter-spacing:-.5px;color:#503d5a;font-weight:950}.dtb-title p{margin:7px 0 0;color:#8b7893;font-size:13px}.dtb-close{width:54px;height:54px;border:0;border-radius:20px;background:#f1e9f5;color:#6f5b78;font-size:25px;cursor:pointer;box-shadow:0 7px 16px #765e8112}.dtb-close:hover{transform:translateY(-1px)}
  .dtb-meta{display:flex;gap:10px;flex-wrap:wrap;margin:17px 4px}.dtb-chip{padding:10px 15px;border-radius:999px;background:#fff;border:1px solid #eadfeb;color:#755f7d;font-size:11px;font-weight:900;box-shadow:0 5px 13px #755b7910}.dtb-chip.sent{background:#fff0f7}.dtb-chip.done{background:#eefbf2;color:#47745b}
  .dtb-board{position:relative;border:2px solid rgba(236,201,187,.82);border-radius:30px;padding:25px 24px 26px;background:radial-gradient(circle at 12% 16%,rgba(255,255,255,.28) 0 2px,transparent 2.5px),radial-gradient(circle at 78% 64%,rgba(184,134,111,.08) 0 1.5px,transparent 2px),linear-gradient(135deg,#faeee5,#f4dfd4 55%,#f8e9df);background-size:21px 21px,17px 17px,auto;box-shadow:inset 0 0 0 9px rgba(255,246,240,.55),inset 0 0 28px rgba(171,118,97,.08),0 15px 36px rgba(96,69,108,.10)}
  .dtb-progress-box{position:relative;z-index:2;background:rgba(255,255,255,.76);border:1px solid rgba(255,255,255,.9);border-radius:22px;padding:15px 18px;margin-bottom:24px;box-shadow:0 8px 20px rgba(108,76,118,.08)}
  .dtb-progress{height:15px;border-radius:999px;background:#eee7f3;overflow:hidden;box-shadow:inset 0 2px 4px #7e648118}.dtb-progress>i{display:block;height:100%;width:0;border-radius:inherit;background:linear-gradient(90deg,#f4a7ce,#b9a4ef,#9edff0);transition:width .25s ease}.dtb-progress-text{display:flex;justify-content:space-between;gap:8px;margin:0 1px 10px;font-size:12px;color:#765f80;font-weight:900}
  .dtb-list{position:relative;z-index:2;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px}.dtb-item{--note:#fdebf3;--pin:#ef92bf;position:relative;min-height:202px;display:flex;flex-direction:column;gap:13px;padding:28px 22px 19px;border-radius:22px;background:var(--note);border:1px solid rgba(255,255,255,.92);box-shadow:0 14px 25px rgba(91,67,105,.15),inset 0 1px rgba(255,255,255,.86);transform:rotate(-.25deg);transition:.2s}.dtb-item:nth-child(even){transform:rotate(.25deg)}.dtb-item.lilac{--note:#f0eaff;--pin:#ae91ed}.dtb-item.mint{--note:#e5f6ef;--pin:#72cfbc}.dtb-item.yellow{--note:#fff2c9;--pin:#efbd54}.dtb-item.done{filter:saturate(.78);box-shadow:0 10px 20px rgba(91,67,105,.10);opacity:.88}.dtb-item.done .dtb-task-text{text-decoration:line-through;color:#7b8f82}
  .dtb-item:before{content:'';position:absolute;left:50%;top:-12px;width:24px;height:24px;border-radius:50%;transform:translateX(-50%);background:radial-gradient(circle at 36% 28%,#fff8 0 17%,transparent 18%),var(--pin);box-shadow:0 5px 8px #644c6d38,0 0 0 1px #fff9;z-index:4}.dtb-item:after{content:'♡';position:absolute;right:16px;top:16px;color:#e889bd;font:900 23px/1 cursive;opacity:.9}
  .dtb-note-main{display:grid;grid-template-columns:70px minmax(0,1fr);gap:13px;align-items:center;min-height:90px}.dtb-note-emoji{width:68px;height:68px;border-radius:20px;background:rgba(255,255,255,.58);display:grid;place-items:center;font-size:37px;box-shadow:inset 0 0 0 1px #fff8}.dtb-task-text{font-size:18px;font-weight:900;color:#604b6c;line-height:1.35;white-space:pre-wrap}.dtb-task-edit{width:100%;border:1px solid rgba(219,192,221,.78);border-radius:15px;padding:11px 12px;background:rgba(255,255,255,.64);color:#604e69;font:800 14px Inter,sans-serif;outline:none}.dtb-task-edit:focus{border-color:#d2afd8;box-shadow:0 0 0 3px #dabce525;background:#fff}.dtb-remove{position:absolute;right:12px;top:47px;width:31px;height:31px;border:0;border-radius:50%;background:#fff8;color:#a45b70;cursor:pointer;font-weight:900;z-index:3}
  .dtb-note-bottom{margin-top:auto;display:flex;align-items:center;gap:8px;flex-wrap:wrap}.dtb-time-chip,.dtb-duration-chip,.dtb-check-label{display:inline-flex;align-items:center;gap:6px;min-height:38px;border-radius:999px;padding:8px 12px;background:rgba(255,255,255,.68);border:1px solid rgba(220,200,223,.74);color:#685676;font-size:11px;font-weight:900}.dtb-check-label{background:linear-gradient(135deg,#fff0f8,#eadcff);border-color:#eeddf4}.dtb-time-input,.dtb-duration-input{border:0;background:transparent;color:#665271;font:900 11px Inter,sans-serif;outline:none}.dtb-time-input{width:72px}.dtb-duration-input{width:43px;text-align:center}.dtb-check{margin-left:auto;width:46px;height:46px;border:2px solid #c5afd0;border-radius:50%;background:#fff9;display:grid;place-items:center;font-size:23px;color:#4b8b61;cursor:pointer;box-shadow:0 5px 10px rgba(96,70,115,.08)}.dtb-check.checked{background:linear-gradient(145deg,#d7f5df,#f4fff7);border-color:#80c69b}.dtb-check:disabled{cursor:default;opacity:1}
  .dtb-board-sticky{position:absolute;z-index:3;width:104px;min-height:92px;padding:15px 12px;border-radius:8px;background:#fff0b7;color:#715a75;font:800 13px/1.45 'Comic Sans MS',cursive;box-shadow:0 8px 18px #6a4b6020;transform:rotate(-5deg);display:flex;align-items:center;justify-content:center;text-align:center}.dtb-board-sticky.left{left:-15px;top:180px}.dtb-board-sticky.right{right:-13px;bottom:110px;background:#ffe8f2;transform:rotate(4deg)}
  .dtb-board-footer{position:relative;z-index:2;margin-top:23px;padding:13px 17px;border-radius:18px;background:linear-gradient(135deg,rgba(255,255,255,.84),rgba(237,224,255,.86));border:1px solid #fff;box-shadow:0 8px 18px #6e527617;color:#765f81;font-size:11px;font-weight:850;text-align:center}
  .dtb-builder{margin-top:16px;padding:15px;border-radius:23px;background:linear-gradient(145deg,#fff,#fbf5ff);border:1px dashed #d9c7e2}.dtb-builder label{display:block;font-size:11px;font-weight:950;color:#755f7e;margin-bottom:8px}.dtb-addline{display:grid;grid-template-columns:58px minmax(0,1fr) 125px 125px auto;gap:8px;align-items:center}.dtb-emoji{height:43px;border:1px solid #eadfeb;border-radius:14px;background:#fff;text-align:center;font-size:21px}.dtb-newtext,.dtb-new-time,.dtb-new-duration{height:43px;min-width:0;border:1px solid #eadfeb;border-radius:14px;padding:9px 11px;background:#fff;color:#604e69;font:750 12px Inter,sans-serif}.dtb-new-duration{width:100%}.dtb-add{height:43px;border:0;border-radius:14px;padding:9px 14px;background:linear-gradient(135deg,#ec9ac8,#b59be7);color:#fff;font-weight:950;cursor:pointer}.dtb-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:13px}.dtb-send{flex:1;border:0;border-radius:16px;padding:13px 15px;background:linear-gradient(135deg,#e98fc3,#a993e4);color:white;font-weight:950;cursor:pointer;box-shadow:0 8px 18px #a47cb42a}.dtb-send:disabled,.dtb-add:disabled{opacity:.55;cursor:wait}
  .dtb-empty{position:relative;z-index:2;padding:38px 18px;text-align:center;border:1px dashed #d9c6db;border-radius:22px;background:#fff9fdcc;color:#8d7a95}.dtb-empty .big{font-size:42px;display:block;margin-bottom:8px}.dtb-celebrate{position:relative;z-index:2;margin-top:14px;padding:16px;border-radius:20px;text-align:center;background:linear-gradient(135deg,#fff5be,#ffe8f3,#e9e1ff);font-weight:950;color:#74586f;animation:dtbPop .4s ease}.dtb-celebrate b{display:block;font-size:18px;margin-bottom:3px}@keyframes dtbPop{from{transform:scale(.96);opacity:.3}to{transform:scale(1);opacity:1}}
  .dtb-spark{position:fixed;z-index:2147482600;pointer-events:none;font-size:20px;animation:dtbSpark .75s ease-out forwards}@keyframes dtbSpark{to{transform:translate(var(--x),var(--y)) rotate(45deg);opacity:0}}
  @media(max-width:860px){.dtb-card{width:min(760px,97vw)}.dtb-list{grid-template-columns:1fr}.dtb-board-sticky{display:none}.dtb-addline{grid-template-columns:58px minmax(0,1fr) 1fr 1fr}.dtb-add{grid-column:1/-1}.dtb-title h2{font-size:29px}}
  @media(max-width:650px){.dtb-modal{padding:0;align-items:stretch}.dtb-card{width:100vw;max-width:none;height:100dvh;max-height:100dvh;border-radius:0;padding:15px 11px 88px}.dtb-title h2{font-size:24px}.dtb-title p{font-size:11px}.dtb-close{width:44px;height:44px;border-radius:16px}.dtb-board{padding:18px 13px 21px;border-radius:24px}.dtb-list{gap:17px}.dtb-item{min-height:190px;padding:26px 16px 16px}.dtb-note-main{grid-template-columns:56px minmax(0,1fr)}.dtb-note-emoji{width:54px;height:54px;font-size:30px}.dtb-task-text{font-size:16px}.dtb-note-bottom{gap:6px}.dtb-time-chip,.dtb-duration-chip,.dtb-check-label{padding:7px 9px;font-size:10px}.dtb-check{width:42px;height:42px}.dtb-addline{grid-template-columns:54px 1fr}.dtb-new-time,.dtb-new-duration{grid-column:auto}.dtb-add{grid-column:1/-1}.dtb-actions{position:sticky;bottom:0;padding:10px 0 4px;background:linear-gradient(transparent,#f8f1ff 24%);z-index:5}}
  `;document.head.appendChild(s)
}

function build(){
  ensureCss()
  if(!$('dailyTaskBoardModal')){
    const m=document.createElement('section');m.id='dailyTaskBoardModal';m.className='dtb-modal';m.innerHTML='<article class="dtb-card"><header class="dtb-head"><div class="dtb-title"><h2 id="dtbTitle">🌈 Quadro do Dia da Isa</h2><p id="dtbSubtitle"></p></div><button id="dtbClose" class="dtb-close" type="button" aria-label="Fechar">✕</button></header><div id="dtbBody"></div></article>';document.body.appendChild(m)
    $('dtbClose').onclick=close;m.onclick=e=>{if(e.target===m)close()}
  }
}

async function loadBoard(){
  await identity();if(!me||(!isKeise()&&!isIsa()))return null
  if(isKeise()&&!isa)return null
  let q=db.from('daily_task_boards').select('id,family_id,creator_id,assignee_id,board_date,title,status,published_at,completed_at,created_at,updated_at').eq('board_date',today())
  if(isKeise())q=q.eq('creator_id',me.id).eq('assignee_id',isa.id)
  else q=q.eq('assignee_id',me.id).in('status',['published','completed'])
  const {data,error}=await q.maybeSingle();if(error)throw error;board=data||null
  items=[]
  if(board){const r=await db.from('daily_task_items').select('id,board_id,task_text,emoji,position,done,done_at,completed_by,created_at,updated_at,duration_minutes,schedule_mode,window_start,window_end,time_slots,coin_reward').eq('board_id',board.id).order('position').order('created_at');if(r.error)throw r.error;items=r.data||[]}
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
function noteColor(i){return NOTE_COLORS[i%NOTE_COLORS.length]}
function timeText(x){const t=cleanTime(x?.window_end);return t?`até ${t}`:'sem horário'}

function noteHtml(x,index,creator){
  const color=noteColor(index),deadline=cleanTime(x.window_end),mins=safeMinutes(x.duration_minutes)
  const main=creator
    ?`<input class="dtb-task-edit" data-edit="${x.id}" value="${esc(x.task_text)}" maxlength="240" aria-label="Editar tarefa">`
    :`<div class="dtb-task-text">${esc(x.task_text)}</div>`
  const deadlinePart=creator
    ?`<span class="dtb-time-chip">🕒 <input class="dtb-time-input" data-time="${x.id}" type="time" value="${esc(deadline)}" aria-label="Horário limite"></span>`
    :`<span class="dtb-time-chip">🕒 ${esc(timeText(x))}</span>`
  const durationPart=creator
    ?`<span class="dtb-duration-chip">⏱ <input class="dtb-duration-input" data-duration="${x.id}" type="number" min="1" max="240" value="${mins}" aria-label="Minutos para fazer"> min</span>`
    :`<span class="dtb-duration-chip">⏱ ${mins} min</span>`
  return `<article class="dtb-item ${color} ${x.done?'done':''}" data-task="${x.id}"><div class="dtb-note-main"><div class="dtb-note-emoji">${x.done?'✅':esc(x.emoji||'✨')}</div><div>${main}</div></div><div class="dtb-note-bottom">${deadlinePart}${durationPart}<span class="dtb-check-label">⭐ Vou conferir!</span>${creator?'':`<button type="button" class="dtb-check ${x.done?'checked':''}" data-toggle="${x.id}" aria-label="${x.done?'Desmarcar':'Marcar'} tarefa">${x.done?'✓':''}</button>`}</div>${creator?`<button type="button" class="dtb-remove" data-remove="${x.id}" title="Remover tarefa" aria-label="Remover tarefa">✕</button>`:''}</article>`
}

function render(){
  build();const body=$('dtbBody');if(!body)return
  const p=progress(),creator=isKeise()
  $('dtbTitle').textContent='🌈 Quadro do Dia da Isa'
  $('dtbSubtitle').textContent=creator?'Crie as tarefas do dia e envie para a Isa ir marcando conforme fizer.':'Seu quadro de hoje — marque conforme for concluindo. 💜'
  let inside=`<div class="dtb-progress-box"><div class="dtb-progress-text"><span>${p.done} de ${p.total} concluída${p.total===1?'':'s'}</span><span>${p.pct}% ⭐</span></div><div class="dtb-progress"><i style="width:${p.pct}%"></i></div></div>`
  if(!items.length)inside+=creator?'<div class="dtb-empty"><span class="big">📝✨</span><b>Seu quadro está prontinho para começar!</b><br>Adicione as tarefas e defina, se quiser, o horário e o tempo para fazer.</div>':'<div class="dtb-empty"><span class="big">🌷</span><b>Ainda não chegou um quadro para hoje.</b><br>Quando a Keise enviar, ele aparece aqui.</div>'
  else inside+=`<div class="dtb-list">${items.map((x,i)=>noteHtml(x,i,creator)).join('')}</div>`
  inside+=`<div class="dtb-board-footer">💬 ${creator?'Ao enviar ou atualizar o quadro, a Isa recebe um aviso no chat.':'Seu quadro foi enviado com carinho. Ao concluir, o progresso atualiza na hora.'} 💌</div>`
  if(items.length>1)inside+='<div class="dtb-board-sticky left">Você consegue, Isa! 💜</div><div class="dtb-board-sticky right">Dias mais leves 🌷</div>'
  let html=`<div class="dtb-meta"><span class="dtb-chip">📅 ${esc(prettyDate())}</span><span class="dtb-chip ${board?.status==='published'?'sent':board?.status==='completed'?'done':''}">${esc(statusText())}</span></div><section class="dtb-board">${inside}</section>`
  if(creator)html+=`<section class="dtb-builder"><label>Nova tarefa / pergunta</label><div class="dtb-addline"><select id="dtbEmoji" class="dtb-emoji" aria-label="Emoji da tarefa">${EMOJIS.map(e=>`<option>${e}</option>`).join('')}</select><input id="dtbNewText" class="dtb-newtext" maxlength="240" placeholder="Ex.: Já escovou os dentes?"><input id="dtbNewTime" class="dtb-new-time" type="time" aria-label="Horário limite"><input id="dtbNewDuration" class="dtb-new-duration" type="number" min="1" max="240" value="10" placeholder="min" aria-label="Tempo em minutos"><button id="dtbAdd" class="dtb-add" type="button">＋ Adicionar</button></div></section><div class="dtb-actions"><button id="dtbSend" class="dtb-send" type="button">${board?.status==='draft'||!board?'💌 Enviar quadro para Isa':'💌 Atualizar quadro da Isa'}</button></div>`
  if(!creator&&p.total>0&&p.done===p.total)html+='<div class="dtb-celebrate"><b>🌟 Uhuu! Quadro completo! 🌈</b>Você marcou todas as tarefas de hoje. 💜</div>'
  body.innerHTML=html
  if(creator)wireCreator();else wireIsa()
}

function wireCreator(){
  $('dtbAdd')?.addEventListener('click',addTask);$('dtbNewText')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addTask()}})
  document.querySelectorAll('#dtbBody [data-remove]').forEach(b=>b.onclick=()=>removeTask(b.dataset.remove))
  document.querySelectorAll('#dtbBody [data-edit]').forEach(i=>i.addEventListener('change',()=>editTask(i.dataset.edit,i.value)))
  document.querySelectorAll('#dtbBody [data-time]').forEach(i=>i.addEventListener('change',()=>editDeadline(i.dataset.time,i.value)))
  document.querySelectorAll('#dtbBody [data-duration]').forEach(i=>i.addEventListener('change',()=>editDuration(i.dataset.duration,i.value)))
  $('dtbSend')?.addEventListener('click',publish)
}
function wireIsa(){document.querySelectorAll('#dtbBody [data-toggle]').forEach(b=>b.onclick=()=>toggleTask(b.dataset.toggle,b))}

async function addTask(){
  if(busy)return;const input=$('dtbNewText'),text=String(input?.value||'').trim();if(!text)return toast('Escreva uma tarefa primeiro.')
  busy=true
  try{
    await ensureBoard();const position=items.length?Math.max(...items.map(x=>Number(x.position)||0))+1:1;const deadline=cleanTime($('dtbNewTime')?.value),duration=safeMinutes($('dtbNewDuration')?.value)
    const row={board_id:board.id,task_text:text,emoji:$('dtbEmoji')?.value||'✨',position,duration_minutes:duration,window_end:deadline||null}
    const {error}=await db.from('daily_task_items').insert(row);if(error)throw error
    input.value='';if($('dtbNewTime'))$('dtbNewTime').value='';if($('dtbNewDuration'))$('dtbNewDuration').value='10';await refresh()
  }catch(e){toast(e.message||'Não foi possível adicionar a tarefa.')}finally{busy=false}
}
async function editTask(id,text){text=String(text||'').trim();if(!text)return refresh();try{const {error}=await db.from('daily_task_items').update({task_text:text}).eq('id',id);if(error)throw error}catch(e){toast('Não foi possível editar.');refresh()}}
async function editDeadline(id,value){try{const deadline=cleanTime(value);const {error}=await db.from('daily_task_items').update({window_end:deadline||null}).eq('id',id);if(error)throw error;const item=items.find(x=>x.id===id);if(item)item.window_end=deadline||null}catch(e){toast('Não foi possível salvar o horário.');refresh()}}
async function editDuration(id,value){try{const duration=safeMinutes(value);const {error}=await db.from('daily_task_items').update({duration_minutes:duration}).eq('id',id);if(error)throw error;const item=items.find(x=>x.id===id);if(item)item.duration_minutes=duration}catch(e){toast('Não foi possível salvar o tempo.');refresh()}}
async function removeTask(id){if(busy)return;busy=true;try{const {error}=await db.from('daily_task_items').delete().eq('id',id);if(error)throw error;await refresh()}catch(e){toast('Não foi possível remover.')}finally{busy=false}}

async function findDirectConversation(){
  if(directConvId)return directConvId
  if(!me||!isa||String(me.id)===String(isa.id))return null
  try{
    const {data,error}=await db.from('conversations').select('id,type,conversation_members(member_id)').eq('family_id',me.family_id).eq('type','direct')
    if(error)throw error
    const hit=(data||[]).find(c=>{const ids=(c.conversation_members||[]).map(m=>String(m.member_id));return ids.length===2&&ids.includes(String(me.id))&&ids.includes(String(isa.id))})
    directConvId=hit?.id||null;return directConvId
  }catch{return null}
}
async function notifyIsaChat(updated=false){
  if(!isKeise()||!isa)return
  try{
    const conversation_id=await findDirectConversation();if(!conversation_id)return
    const body=updated?'🌈 Atualizei seu Quadro do Dia 💌 Dá uma olhadinha nas tarefas. ⭐ Vou conferir!':'🌈 Seu Quadro do Dia chegou! 💌 Quando puder, veja as tarefas de hoje. ⭐ Vou conferir!'
    await db.from('messages').insert({conversation_id,sender_id:me.id,kind:'text',body})
  }catch(e){console.warn('Quadro do Dia: aviso no chat não enviado',e)}
}

async function publish(){
  if(busy)return;if(!items.length)return toast('Adicione pelo menos uma tarefa.')
  busy=true;const btn=$('dtbSend');if(btn){btn.disabled=true;btn.textContent='Enviando…'}
  try{
    await ensureBoard();const updated=board?.status==='published'||board?.status==='completed'
    const {error}=await db.from('daily_task_boards').update({status:'published',published_at:new Date().toISOString(),completed_at:null}).eq('id',board.id);if(error)throw error
    await notifyIsaChat(updated);toast(updated?'Quadro atualizado para Isa 💌':'Quadro enviado para Isa 💌');await refresh()
  }catch(e){toast(e.message||'Não foi possível enviar o quadro.')}finally{busy=false}
}

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
document.addEventListener('isa:approved-home-ready',()=>setTimeout(()=>ensureTile(),60));document.addEventListener('isa:keise-approved-home-built',()=>setTimeout(()=>ensureTile(),60));window.addEventListener('pageshow',()=>setTimeout(()=>ensureTile(),180),{once:true});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&$('dailyTaskTile'))loadBoard().catch(()=>{})})
boot()
window.__ISA_DAILY_TASK_BOARD__={open,close,refresh,ensureTile}
