// Cantinho da Isa — Quadro da Família v1.
// Módulo independente do Chat: só aparece dentro do grupo Família para Keise, Isa e Alan.
// Não reconstrói conversas, mensagens, dashboard ou boot.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js'

const db=createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}})
const $=id=>document.getElementById(id)
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim()
const APPROVED=new Set(['keise','isa','alan'])
const STATUS={todo:'📝 Ainda vou fazer',doing:'⏳ Estou fazendo',done:'✅ Terminei'}
const PRIORITY={low:'Baixa',normal:'Normal',high:'Alta'}
const WEEK=['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']

let me=null,group=null,members=[],tasks=[],view='today',anchorDate=ymd(new Date()),selectedDate=ymd(new Date())
let channel=null,refreshTimer=0,dragId='',editingId='',opening=false

function ymd(value){const d=value instanceof Date?value:new Date(`${value}T12:00:00`);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function parseYmd(value){return new Date(`${value}T12:00:00`)}
function addDays(value,n){const d=parseYmd(value);d.setDate(d.getDate()+n);return ymd(d)}
function startOfWeek(value){const d=parseYmd(value),day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return ymd(d)}
function endOfWeek(value){return addDays(startOfWeek(value),6)}
function startOfMonth(value){const d=parseYmd(value);d.setDate(1);return ymd(d)}
function endOfMonth(value){const d=parseYmd(value);d.setMonth(d.getMonth()+1,0);return ymd(d)}
function range(){if(view==='week')return{start:startOfWeek(anchorDate),end:endOfWeek(anchorDate)};if(view==='month')return{start:startOfMonth(anchorDate),end:endOfMonth(anchorDate)};return{start:anchorDate,end:anchorDate}}
function formatDate(v,opts={day:'2-digit',month:'2-digit'}){try{return new Intl.DateTimeFormat('pt-BR',opts).format(parseYmd(v))}catch{return v}}
function profileKey(){const q=norm(new URLSearchParams(location.search).get('perfil')),n=norm($('myName')?.textContent);for(const p of APPROVED)if(q===p||n===p||n.startsWith(p+' '))return p;return''}
function approved(){return APPROVED.has(profileKey())}
function isFamilyChat(){const panel=$('chatPanel'),title=norm($('chatTitle')?.textContent);return approved()&&panel&&!panel.classList.contains('hidden')&&title==='familia'}
function toast(text){const t=$('toast');if(!t){console.info(text);return}t.textContent=text;t.classList.remove('hidden');clearTimeout(t._familyBoard);t._familyBoard=setTimeout(()=>t.classList.add('hidden'),2700)}
function memberName(id){return members.find(x=>String(x.id)===String(id))?.display_name||'Família'}
function sameIds(a,b){return String(a||'')===String(b||'')}
function taskCanMove(t){return sameIds(t.created_by,me?.id)||(t.assignee_ids||[]).some(id=>sameIds(id,me?.id))}
function taskCanEdit(t){return sameIds(t.created_by,me?.id)}

function ensureCss(){
  if($('familyBoardCss'))return
  const l=document.createElement('link');l.id='familyBoardCss';l.rel='stylesheet';l.href='./family-board-v1.css?v=1';document.head.appendChild(l)
}

async function identity(force=false){
  if(me&&!force)return me
  const {data:{user}}=await db.auth.getUser();if(!user)return null
  const {data,error}=await db.from('family_members').select('id,family_id,display_name,relationship_label,active').eq('auth_user_id',user.id).eq('active',true).maybeSingle()
  if(error||!data)return null;me=data;return me
}

async function resolveGroup(force=false){
  if(group&&!force)return group
  const who=await identity(force);if(!who)return null
  const {data:links,error:lerr}=await db.from('conversation_members').select('conversation_id').eq('member_id',who.id)
  if(lerr)throw lerr
  const ids=[...new Set((links||[]).map(x=>x.conversation_id).filter(Boolean))];if(!ids.length)return null
  const {data:rows,error}=await db.from('conversations').select('id,family_id,type,title,created_by').in('id',ids).eq('type','group')
  if(error)throw error
  group=(rows||[]).find(x=>norm(x.title)==='familia')||null
  if(!group)return null
  const {data:cm,error:cmErr}=await db.from('conversation_members').select('member_id').eq('conversation_id',group.id);if(cmErr)throw cmErr
  const mids=[...new Set((cm||[]).map(x=>x.member_id).filter(Boolean))]
  if(mids.length){const {data:fm,error:fmErr}=await db.from('family_members').select('id,display_name,relationship_label,active').in('id',mids).eq('active',true).order('display_name');if(fmErr)throw fmErr;members=fm||[]}else members=[]
  return group
}

function ensureButton(){
  const header=$('chatPanel')?.querySelector('.chat-header');if(!header)return null
  let btn=$('familyBoardBtn')
  if(!btn){
    btn=document.createElement('button');btn.id='familyBoardBtn';btn.type='button';btn.className='family-board-open-btn';btn.innerHTML='<span>📋</span><b>Quadro</b>';btn.title='Abrir Quadro da Família';btn.setAttribute('aria-label','Abrir Quadro da Família')
    btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openBoard()})
    header.appendChild(btn)
  }
  btn.hidden=!isFamilyChat()
  return btn
}

function build(){
  ensureCss();ensureButton()
  if(!$('familyBoardModal')){
    const m=document.createElement('section');m.id='familyBoardModal';m.className='fboard-modal';m.setAttribute('aria-hidden','true');m.innerHTML=`
      <article class="fboard-shell" role="dialog" aria-modal="true" aria-labelledby="fboardTitle">
        <header class="fboard-head">
          <div><small>Grupo Família</small><h2 id="fboardTitle">📋 Quadro da Família</h2><p id="fboardRangeLabel">Organizando as tarefas…</p></div>
          <button id="fboardClose" class="fboard-close" type="button" aria-label="Fechar">✕</button>
        </header>
        <div class="fboard-toolbar">
          <div class="fboard-tabs" role="tablist">
            <button type="button" data-fboard-view="today" class="active">Hoje</button>
            <button type="button" data-fboard-view="week">Semana</button>
            <button type="button" data-fboard-view="month">Mês</button>
          </div>
          <label class="fboard-date-label">Data <input id="fboardDate" type="date"></label>
          <button id="fboardNew" class="fboard-new" type="button">＋ Nova tarefa</button>
        </div>
        <section class="fboard-progress-wrap"><div class="fboard-progress-copy"><b id="fboardProgressText">0 de 0 tarefas concluídas</b><span id="fboardProgressPct">0%</span></div><div class="fboard-progress"><i id="fboardProgressBar"></i></div></section>
        <div id="fboardCalendar"></div>
        <div id="fboardColumns" class="fboard-columns"></div>
      </article>`
    document.body.appendChild(m)
    $('fboardClose').onclick=closeBoard;m.addEventListener('click',e=>{if(e.target===m)closeBoard()})
    m.querySelectorAll('[data-fboard-view]').forEach(b=>b.onclick=()=>changeView(b.dataset.fboardView))
    $('fboardDate').addEventListener('change',e=>{if(!e.target.value)return;anchorDate=e.target.value;selectedDate=e.target.value;refresh()})
    $('fboardNew').onclick=()=>openEditor()
  }
  if(!$('familyBoardEditor')){
    const e=document.createElement('section');e.id='familyBoardEditor';e.className='fboard-editor-modal';e.setAttribute('aria-hidden','true');e.innerHTML=`
      <form id="fboardForm" class="fboard-editor" autocomplete="off">
        <header><div><small>Quadro da Família</small><h3 id="fboardEditorTitle">Nova tarefa</h3></div><button id="fboardEditorClose" type="button">✕</button></header>
        <label class="full"><span>Tarefa</span><input id="fboardTaskTitle" maxlength="240" required placeholder="Ex.: Comprar ração"></label>
        <div class="two"><label><span>Prazo</span><input id="fboardDueDate" type="date" required></label><label><span>Horário <em>opcional</em></span><input id="fboardDueTime" type="time"></label></div>
        <div class="two"><label><span>Prioridade</span><select id="fboardPriority"><option value="low">Baixa</option><option value="normal" selected>Normal</option><option value="high">Alta</option></select></label><label><span>Repetir</span><select id="fboardRecurrence"><option value="none">Não repetir</option><option value="daily">Todos os dias</option><option value="weekly">Dias da semana</option><option value="monthly">Todo mês</option></select></label></div>
        <div id="fboardWeekdays" class="fboard-weekdays hidden">${WEEK.map((d,i)=>`<label><input type="checkbox" value="${i+1}"><span>${d}</span></label>`).join('')}</div>
        <label class="full"><span>Observação <em>opcional</em></span><textarea id="fboardNotes" maxlength="2000" rows="3" placeholder="Detalhes, lembrete, endereço…"></textarea></label>
        <fieldset class="fboard-visibility"><legend>Quem pode ver?</legend><label><input type="radio" name="fboardVisibility" value="private"><span>🔒 Só minha</span></label><label><input type="radio" name="fboardVisibility" value="shared" checked><span>👨‍👩‍👧 Compartilhada</span></label></fieldset>
        <section id="fboardPeople" class="fboard-people"></section>
        <div class="fboard-editor-actions"><button id="fboardCancel" type="button">Cancelar</button><button id="fboardSave" type="submit">Salvar tarefa</button></div>
      </form>`
    document.body.appendChild(e)
    $('fboardEditorClose').onclick=closeEditor;$('fboardCancel').onclick=closeEditor
    e.addEventListener('click',ev=>{if(ev.target===e)closeEditor()})
    $('fboardRecurrence').addEventListener('change',syncEditorVisibility)
    e.querySelectorAll('input[name="fboardVisibility"]').forEach(r=>r.addEventListener('change',syncEditorVisibility))
    $('fboardForm').addEventListener('submit',saveTask)
  }
}

function rangeLabel(){
  const r=range()
  if(view==='week')return `Semana • ${formatDate(r.start,{day:'2-digit',month:'short'})} a ${formatDate(r.end,{day:'2-digit',month:'short'})}`
  if(view==='month')return new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(parseYmd(anchorDate))
  return `${ymd(new Date())===anchorDate?'Hoje':'Dia'} • ${formatDate(anchorDate,{weekday:'long',day:'2-digit',month:'long'})}`
}

async function loadTasks(){
  const g=await resolveGroup();if(!g){tasks=[];return tasks}
  const r=range()
  const {data,error}=await db.from('family_board_tasks').select('id,family_id,conversation_id,created_by,title,status,due_date,due_time,priority,notes,visibility,assignee_ids,shared_with,recurrence_kind,recurrence_days,series_id,completed_at,archived_at,created_at,updated_at').eq('conversation_id',g.id).is('archived_at',null).gte('due_date',r.start).lte('due_date',r.end).order('due_date',{ascending:true}).order('due_time',{ascending:true,nullsFirst:false}).order('created_at',{ascending:true})
  if(error)throw error;tasks=data||[];return tasks
}

function visibleTasks(){return view==='month'?tasks.filter(t=>t.due_date===selectedDate):tasks}
function progress(){const total=tasks.length,done=tasks.filter(t=>t.status==='done').length;return{total,done,pct:total?Math.round(done*100/total):0}}
function recurrenceText(t){if(t.recurrence_kind==='daily')return'↻ Todos os dias';if(t.recurrence_kind==='monthly')return'↻ Mensal';if(t.recurrence_kind==='weekly'){const days=(t.recurrence_days||[]).map(n=>WEEK[Number(n)-1]).filter(Boolean);return`↻ ${days.join(', ')||'Semanal'}`}return''}
function timeText(v){return v?String(v).slice(0,5):''}

function cardHtml(t){
  const assignees=(t.assignee_ids||[]).map(memberName).filter(Boolean)
  const canMove=taskCanMove(t),canEdit=taskCanEdit(t),rec=recurrenceText(t)
  const statusActions=t.status==='todo'?`<button data-status="doing">Começar</button><button class="finish" data-status="done">✓ Terminei</button>`:t.status==='doing'?`<button data-status="todo">Voltar</button><button class="finish" data-status="done">✓ Terminei</button>`:`<button data-status="doing">↩ Reabrir</button>${canEdit?'<button class="archive" data-archive>Arquivar</button>':''}`
  return `<article class="fboard-task ${t.status==='done'?'done':''} priority-${esc(t.priority)}" data-task-id="${esc(t.id)}" ${canMove?'draggable="true"':''}>
    <div class="fboard-task-top"><span class="fboard-priority">${t.priority==='high'?'🔴':t.priority==='low'?'🟢':'🟡'} ${PRIORITY[t.priority]||'Normal'}</span>${canEdit?'<button class="fboard-edit" type="button" data-edit title="Editar">✎</button>':''}</div>
    <h4>${esc(t.title)}</h4>
    <div class="fboard-task-meta"><span>👤 ${esc(assignees.join(', ')||memberName(t.created_by))}</span><span>📅 ${esc(formatDate(t.due_date))}${t.due_time?` • ${esc(timeText(t.due_time))}`:''}</span>${rec?`<span>${esc(rec)}</span>`:''}${t.visibility==='private'?'<span>🔒 Só minha</span>':''}</div>
    ${t.notes?`<p>${esc(t.notes)}</p>`:''}
    ${canMove?`<div class="fboard-task-actions">${statusActions}</div>`:'<small class="fboard-readonly">Você acompanha esta tarefa.</small>'}
  </article>`
}

function columnHtml(status,list){
  let cards=''
  if(list.length&&view==='week'){
    const start=startOfWeek(anchorDate)
    cards=Array.from({length:7},(_,i)=>{
      const d=addDays(start,i),dayTasks=list.filter(t=>t.due_date===d);if(!dayTasks.length)return''
      return `<div class="fboard-day-group"><div class="fboard-day-heading"><b>${WEEK[i]}</b><span>${formatDate(d,{day:'2-digit',month:'2-digit'})}</span></div>${dayTasks.map(cardHtml).join('')}</div>`
    }).join('')
  }else cards=list.map(cardHtml).join('')
  return `<section class="fboard-column" data-drop-status="${status}"><header><h3>${STATUS[status]}</h3><span>${list.length}</span></header><div class="fboard-dropzone">${list.length?cards:`<div class="fboard-column-empty">${status==='todo'?'Nada pendente por aqui.':status==='doing'?'Ninguém começou algo ainda.':'As concluídas aparecem aqui.'} </div>`}</div></section>`
}

function weekStrip(){
  if(view!=='week')return''
  const start=startOfWeek(anchorDate)
  return `<div class="fboard-week-strip">${Array.from({length:7},(_,i)=>{const d=addDays(start,i),count=tasks.filter(t=>t.due_date===d).length;return `<button type="button" data-week-day="${d}" class="${d===anchorDate?'active':''}"><b>${WEEK[i]}</b><span>${formatDate(d,{day:'2-digit',month:'2-digit'})}</span><em>${count||''}</em></button>`}).join('')}</div>`
}

function monthCalendar(){
  if(view!=='month')return''
  const first=parseYmd(startOfMonth(anchorDate)),offset=(first.getDay()+6)%7,month=first.getMonth(),year=first.getFullYear(),days=new Date(year,month+1,0).getDate()
  const counts=new Map();for(const t of tasks)counts.set(t.due_date,(counts.get(t.due_date)||0)+1)
  let cells='';for(let i=0;i<offset;i++)cells+='<span class="blank"></span>'
  for(let day=1;day<=days;day++){const d=ymd(new Date(year,month,day)),count=counts.get(d)||0;cells+=`<button type="button" data-month-day="${d}" class="${d===selectedDate?'selected':''} ${d===ymd(new Date())?'today':''}"><b>${day}</b>${count?`<span>${count}</span>`:''}</button>`}
  return `<section class="fboard-month"><div class="fboard-month-weekdays">${WEEK.map(x=>`<span>${x}</span>`).join('')}</div><div class="fboard-month-grid">${cells}</div><small>Toque em um dia para ver as tarefas dele nas colunas.</small></section>`
}

function render(){
  build();if(!$('familyBoardModal')?.classList.contains('show'))return
  const p=progress(),shown=visibleTasks()
  $('fboardRangeLabel').textContent=rangeLabel();$('fboardDate').value=anchorDate
  document.querySelectorAll('[data-fboard-view]').forEach(b=>b.classList.toggle('active',b.dataset.fboardView===view))
  $('fboardProgressText').textContent=`${p.done} de ${p.total} tarefa${p.total===1?'':'s'} concluída${p.total===1?'':'s'} ${view==='week'?'nesta semana':view==='month'?'neste mês':'neste dia'}`
  $('fboardProgressPct').textContent=`${p.pct}%`;$('fboardProgressBar').style.width=`${p.pct}%`
  $('fboardCalendar').innerHTML=weekStrip()+monthCalendar()
  const by={todo:[],doing:[],done:[]};for(const t of shown)(by[t.status]||by.todo).push(t)
  $('fboardColumns').innerHTML=columnHtml('todo',by.todo)+columnHtml('doing',by.doing)+columnHtml('done',by.done)
  wireBoard()
}

function wireBoard(){
  document.querySelectorAll('#fboardCalendar [data-week-day]').forEach(b=>b.onclick=()=>{anchorDate=b.dataset.weekDay;selectedDate=anchorDate;render()})
  document.querySelectorAll('#fboardCalendar [data-month-day]').forEach(b=>b.onclick=()=>{selectedDate=b.dataset.monthDay;render()})
  document.querySelectorAll('#fboardColumns [data-task-id]').forEach(card=>{
    const id=card.dataset.taskId,t=tasks.find(x=>x.id===id);if(!t)return
    card.querySelector('[data-edit]')?.addEventListener('click',()=>openEditor(t))
    card.querySelectorAll('[data-status]').forEach(b=>b.addEventListener('click',()=>moveTask(t,b.dataset.status)))
    card.querySelector('[data-archive]')?.addEventListener('click',()=>archiveTask(t))
    if(taskCanMove(t))card.addEventListener('dragstart',e=>{dragId=id;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',id);card.classList.add('dragging')})
    card.addEventListener('dragend',()=>{dragId='';card.classList.remove('dragging')})
  })
  document.querySelectorAll('#fboardColumns [data-drop-status]').forEach(col=>{
    col.addEventListener('dragover',e=>{if(!dragId)return;e.preventDefault();col.classList.add('drag-over')})
    col.addEventListener('dragleave',()=>col.classList.remove('drag-over'))
    col.addEventListener('drop',e=>{e.preventDefault();col.classList.remove('drag-over');const id=e.dataTransfer.getData('text/plain')||dragId,t=tasks.find(x=>x.id===id);if(t&&taskCanMove(t)&&t.status!==col.dataset.dropStatus)moveTask(t,col.dataset.dropStatus)})
  })
}

async function changeView(next){
  if(!['today','week','month'].includes(next))return
  view=next
  if(next==='today'){anchorDate=ymd(new Date());selectedDate=anchorDate}
  else if(next==='month'){selectedDate=anchorDate}
  await refresh()
}

function peopleHtml(task=null){
  const ass=new Set((task?.assignee_ids||[me?.id]).map(String)),shared=new Set((task?.shared_with||members.map(x=>x.id)).map(String))
  return `<div class="fboard-person-block"><b>Quem vai fazer?</b><div class="fboard-person-grid">${members.map(m=>`<label><input type="checkbox" data-assignee value="${esc(m.id)}" ${ass.has(String(m.id))?'checked':''}><span>${esc(m.display_name)}</span></label>`).join('')}</div></div><div class="fboard-person-block" data-share-block><b>Quem pode ver?</b><div class="fboard-person-grid">${members.map(m=>`<label><input type="checkbox" data-share value="${esc(m.id)}" ${sameIds(m.id,me?.id)?'checked disabled':shared.has(String(m.id))?'checked':''}><span>${esc(m.display_name)}</span></label>`).join('')}</div></div>`
}

function openEditor(task=null){
  build();if(!me||!group)return
  if(task&&!taskCanEdit(task))return toast('Somente quem criou a tarefa pode editar os detalhes.')
  editingId=task?.id||'';$('fboardEditorTitle').textContent=task?'Editar tarefa':'Nova tarefa';$('fboardTaskTitle').value=task?.title||'';$('fboardDueDate').value=task?.due_date||(view==='month'?selectedDate:anchorDate);$('fboardDueTime').value=timeText(task?.due_time)||'';$('fboardPriority').value=task?.priority||'normal';$('fboardNotes').value=task?.notes||'';$('fboardRecurrence').value=task?.recurrence_kind||'none'
  const visibility=task?.visibility||'shared';document.querySelectorAll('input[name="fboardVisibility"]').forEach(r=>r.checked=r.value===visibility)
  $('fboardPeople').innerHTML=peopleHtml(task)
  $('fboardWeekdays').querySelectorAll('input').forEach(x=>x.checked=(task?.recurrence_days||[]).map(Number).includes(Number(x.value)))
  syncEditorVisibility();$('familyBoardEditor').classList.add('show');$('familyBoardEditor').setAttribute('aria-hidden','false');setTimeout(()=>$('fboardTaskTitle')?.focus(),40)
}

function closeEditor(){editingId='';$('familyBoardEditor')?.classList.remove('show');$('familyBoardEditor')?.setAttribute('aria-hidden','true')}
function syncEditorVisibility(){
  const weekly=$('fboardRecurrence')?.value==='weekly';$('fboardWeekdays')?.classList.toggle('hidden',!weekly)
  const privateMode=document.querySelector('input[name="fboardVisibility"]:checked')?.value==='private'
  $('fboardPeople')?.querySelector('[data-share-block]')?.classList.toggle('hidden',privateMode)
  $('fboardPeople')?.querySelectorAll('[data-assignee]').forEach(x=>{if(privateMode){x.checked=sameIds(x.value,me?.id);x.disabled=true}else x.disabled=false})
}

async function saveTask(e){
  e.preventDefault();const btn=$('fboardSave');if(btn.disabled)return
  const title=$('fboardTaskTitle').value.trim(),due=$('fboardDueDate').value,time=$('fboardDueTime').value||null,priority=$('fboardPriority').value,notes=$('fboardNotes').value.trim(),recurrence=$('fboardRecurrence').value,visibility=document.querySelector('input[name="fboardVisibility"]:checked')?.value||'shared'
  if(!title||!due)return toast('Informe a tarefa e o prazo.')
  let assignees=[...$('fboardPeople').querySelectorAll('[data-assignee]:checked')].map(x=>x.value)
  let shared=[...$('fboardPeople').querySelectorAll('[data-share]:checked')].map(x=>x.value)
  if(visibility==='private'){assignees=[me.id];shared=[]}
  if(!assignees.length)return toast('Marque pelo menos uma pessoa para fazer a tarefa.')
  shared=[...new Set([...shared,...assignees])]
  const days=recurrence==='weekly'?[...$('fboardWeekdays').querySelectorAll('input:checked')].map(x=>Number(x.value)):[]
  if(recurrence==='weekly'&&!days.length){const iso=(parseYmd(due).getDay()+6)%7+1;days.push(iso)}
  const payload={family_id:me.family_id,conversation_id:group.id,created_by:me.id,title,due_date:due,due_time:time,priority,notes,visibility,assignee_ids:assignees,shared_with:shared,recurrence_kind:recurrence,recurrence_days:days}
  const wasEditing=!!editingId
  btn.disabled=true;btn.textContent='Salvando…'
  try{
    if(editingId){const {created_by,family_id,conversation_id,...update}=payload;const {error}=await db.from('family_board_tasks').update(update).eq('id',editingId).eq('created_by',me.id);if(error)throw error}
    else{const {error}=await db.from('family_board_tasks').insert(payload);if(error)throw error}
    closeEditor();toast(wasEditing?'Tarefa atualizada 💜':'Tarefa criada 💜');await refresh()
  }catch(error){console.error('Quadro da Família:',error);toast(error?.message||'Não foi possível salvar a tarefa.')}
  finally{btn.disabled=false;btn.textContent='Salvar tarefa'}
}

async function moveTask(task,status){
  if(!taskCanMove(task)||!['todo','doing','done'].includes(status))return
  const old=task.status;task.status=status;render()
  const {error}=await db.from('family_board_tasks').update({status}).eq('id',task.id)
  if(error){task.status=old;render();toast('Não foi possível mover a tarefa.');return}
  if(status==='done')toast('Tarefa concluída ✓');scheduleRefresh(140)
}

async function archiveTask(task){
  if(!taskCanEdit(task)||task.status!=='done')return
  const {error}=await db.from('family_board_tasks').update({archived_at:new Date().toISOString()}).eq('id',task.id).eq('created_by',me.id)
  if(error)return toast('Não foi possível arquivar.');toast('Tarefa arquivada.');await refresh()
}

function subscribe(){
  if(!group)return
  if(channel){try{db.removeChannel(channel)}catch{};channel=null}
  channel=db.channel(`family-board-${group.id}`).on('postgres_changes',{event:'*',schema:'public',table:'family_board_tasks',filter:`conversation_id=eq.${group.id}`},()=>scheduleRefresh(120)).subscribe()
}
function scheduleRefresh(ms=120){clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>refresh().catch(()=>{}),ms)}
async function refresh(){try{await loadTasks();render()}catch(error){console.warn('Quadro da Família:',error);toast('Não foi possível atualizar o quadro agora.')}}

async function openBoard(){
  if(opening)return;opening=true
  try{
    build();const who=await identity();if(!who||!approved())return toast('Quadro disponível para Keise, Isa e Alan.')
    const g=await resolveGroup(true);if(!g)return toast('O grupo Família ainda não está disponível para este perfil.')
    if(!members.some(x=>sameIds(x.id,who.id)))return toast('Este perfil não participa do grupo Família.')
    $('familyBoardModal').classList.add('show');$('familyBoardModal').setAttribute('aria-hidden','false');subscribe();await refresh()
  }catch(error){console.error('Quadro da Família:',error);toast('Não foi possível abrir o Quadro da Família.')}
  finally{opening=false}
}
function closeBoard(){closeEditor();$('familyBoardModal')?.classList.remove('show');$('familyBoardModal')?.setAttribute('aria-hidden','true');if(channel){try{db.removeChannel(channel)}catch{};channel=null}}

function scan(){ensureCss();ensureButton()}
function observeChat(){
  const panel=$('chatPanel'),title=$('chatTitle');if(!panel||!title)return
  if(panel.dataset.familyBoardObserved==='1')return;panel.dataset.familyBoardObserved='1'
  new MutationObserver(scan).observe(panel,{attributes:true,attributeFilter:['class']})
  new MutationObserver(scan).observe(title,{childList:true,characterData:true,subtree:true})
}

document.addEventListener('isa:chat-opened',()=>setTimeout(scan,0),{passive:true})
document.addEventListener('isa:approved-home-ready',()=>setTimeout(()=>{observeChat();scan()},80),{passive:true})
window.addEventListener('pageshow',()=>{observeChat();scan()},{once:true})
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if($('familyBoardEditor')?.classList.contains('show'))closeEditor();else if($('familyBoardModal')?.classList.contains('show'))closeBoard()})

ensureCss();observeChat();scan();setTimeout(()=>{observeChat();scan()},900)
window.__ISA_FAMILY_BOARD__={open:openBoard,close:closeBoard,scan,refresh,get group(){return group},get members(){return members.slice()}}
