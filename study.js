import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js'
import { initStudyCalculator } from './study-calculator.js'

const db=createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}})
const $=id=>document.getElementById(id)
let me=null,groups=[],scope='private',note=null,saveTimer=null,noteChannel=null,calculatorReady=false

function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function css(){if(document.querySelector('link[href^="study.css"]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href='study.css?v=1';document.head.appendChild(l)}
function toast(text){const t=$('toast');if(!t)return;t.textContent=text;t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),1800)}

function mount(){
  css();const nav=document.querySelector('.nav-tabs'),content=document.querySelector('.content');if(!nav||!content)return
  if(!$('studyNav')){const b=document.createElement('button');b.id='studyNav';b.className='nav-btn';b.dataset.tab='study';b.innerHTML='✏️ <span>Estudos</span>';nav.insertBefore(b,$('supervisionNav')||$('parentsNav'))}
  if(!$('studyPanel')){const p=document.createElement('section');p.id='studyPanel';p.className='hidden';p.innerHTML=`
    <div class="study-head"><div><h2>Mesa de Estudos</h2><p>Use individualmente ou compartilhe com um grupo.</p></div><select id="studyScope" class="study-scope"><option value="private">Só meu</option></select></div>
    <div id="studyHome"><div class="study-home-grid"><button class="study-tool-card" id="openCalculatorTool" type="button"><span class="tool-symbol">🧮</span><strong>Calculadora + Caderno</strong><small>Calculadora visual normal ou científica e caderno digital lado a lado.</small></button></div></div>
    <div id="studyCalculator" class="study-workspace hidden">
      <button id="studyBackBtn" class="study-back" type="button">← Mesa de Estudos</button>
      <div class="calc-note-layout">
        <section class="calculator-3d">
          <div class="calc-top"><strong>Calculadora</strong><div class="calc-mode"><button type="button" id="calcNormalBtn" class="active">Normal</button><button type="button" id="calcScientificBtn">Científica</button></div></div>
          <div class="calc-display" aria-live="polite"><div id="calcExpression" class="calc-expression"></div><div id="calcResult" class="calc-result">0</div></div>
          <div id="calcKeys" class="calc-keys">
            <button class="calc-key scientific sci-hidden" data-calc="sin(">sin</button><button class="calc-key scientific sci-hidden" data-calc="cos(">cos</button><button class="calc-key scientific sci-hidden" data-calc="tan(">tan</button><button class="calc-key scientific sci-hidden" data-calc="log10(">log</button><button class="calc-key scientific sci-hidden" data-calc="ln(">ln</button>
            <button class="calc-key scientific sci-hidden" data-calc="e">e</button><button class="calc-key scientific sci-hidden" data-action="factorial">x!</button><button class="calc-key scientific sci-hidden" data-calc="abs(">abs</button><button class="calc-key scientific sci-hidden" data-action="inverse">1/x</button><button class="calc-key scientific sci-hidden" data-action="square">x²</button>
            <button class="calc-key operator" data-action="clear">C</button><button class="calc-key" data-action="backspace">⌫</button><button class="calc-key" data-calc="(">(</button><button class="calc-key" data-calc=")">)</button><button class="calc-key operator" data-calc="÷">÷</button>
            <button class="calc-key" data-calc="7">7</button><button class="calc-key" data-calc="8">8</button><button class="calc-key" data-calc="9">9</button><button class="calc-key operator" data-calc="×">×</button><button class="calc-key operator" data-action="percent">%</button>
            <button class="calc-key" data-calc="4">4</button><button class="calc-key" data-calc="5">5</button><button class="calc-key" data-calc="6">6</button><button class="calc-key operator" data-calc="-">−</button><button class="calc-key operator" data-calc="sqrt(">√</button>
            <button class="calc-key" data-calc="1">1</button><button class="calc-key" data-calc="2">2</button><button class="calc-key" data-calc="3">3</button><button class="calc-key operator" data-calc="+">+</button><button class="calc-key operator" data-calc="^">xʸ</button>
            <button class="calc-key" data-calc="0">0</button><button class="calc-key" data-calc=".">.</button><button class="calc-key" data-calc="π">π</button><button class="calc-key operator" data-action="negative">±</button><button class="calc-key equal" data-action="equals">=</button>
          </div><div id="calcHistory" class="calc-history"></div>
        </section>
        <section class="notebook-3d"><header class="notebook-head"><div><strong id="notebookTitle">Meu caderno</strong><small>Digite ou envie resultados da calculadora.</small></div><span id="notebookStatus" class="notebook-status">Carregando…</span></header><textarea id="studyNotebook" class="notebook-paper" placeholder="Comece suas anotações aqui..."></textarea><footer class="notebook-actions"><span class="grow-note">Salvamento automático</span><button id="saveNotebookBtn" type="button">Salvar agora</button><button id="clearNotebookBtn" type="button">Limpar página</button></footer></section>
      </div>
    </div>`;content.appendChild(p)}
  bind()
}

function bind(){
  $('studyNav')?.addEventListener('click',show)
  document.querySelectorAll('.nav-btn:not(#studyNav)').forEach(b=>b.addEventListener('click',()=>$('studyPanel')?.classList.add('hidden')))
  $('openCalculatorTool')?.addEventListener('click',openCalculator);$('studyBackBtn')?.addEventListener('click',()=>{$('studyCalculator').classList.add('hidden');$('studyHome').classList.remove('hidden')})
  $('studyScope')?.addEventListener('change',async e=>{scope=e.target.value;await loadNote()});$('studyNotebook')?.addEventListener('input',scheduleSave);$('saveNotebookBtn')?.addEventListener('click',()=>saveNote(true));$('clearNotebookBtn')?.addEventListener('click',()=>{if(confirm('Limpar esta página do caderno?')){$('studyNotebook').value='';saveNote(true)}})
}
function show(){['chatPanel','familyPanel','calendarPanel','supervisionPanel','parentsPanel','emptyState'].forEach(id=>$(id)?.classList.add('hidden'));$('studyPanel')?.classList.remove('hidden');document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.id==='studyNav'));identity().then(loadNote).catch(e=>{console.error(e);toast('Entre na conta para usar Estudos.')})}
function openCalculator(){ $('studyHome').classList.add('hidden');$('studyCalculator').classList.remove('hidden');if(!calculatorReady){initStudyCalculator({onSendResult:sendResult});calculatorReady=true}identity().then(loadNote).catch(console.error)}

async function identity(){
  if(me)return me;const {data:{user}}=await db.auth.getUser();if(!user)throw new Error('Sem sessão')
  const {data,error}=await db.from('family_members').select('id,family_id,display_name,role').eq('auth_user_id',user.id).eq('active',true).single();if(error||!data)throw error||new Error('Perfil não encontrado');me=data
  const {data:cm}=await db.from('conversation_members').select('conversation_id').eq('member_id',me.id);const ids=[...new Set((cm||[]).map(x=>x.conversation_id))]
  if(ids.length){const {data:g}=await db.from('conversations').select('id,title,type,updated_at').in('id',ids).eq('type','group').order('updated_at',{ascending:false});groups=g||[]}
  const sel=$('studyScope');if(sel){sel.innerHTML='<option value="private">Só meu</option>'+groups.map(g=>`<option value="${g.id}">Grupo • ${esc(g.title||'Sem nome')}</option>`).join('');if(![...sel.options].some(o=>o.value===scope))scope='private';sel.value=scope}return me
}
async function loadNote(){
  if(!$('studyNotebook'))return;await identity();clearTimeout(saveTimer);note=null;if(noteChannel){db.removeChannel(noteChannel);noteChannel=null}
  $('notebookStatus').textContent='Carregando…';const group=scope!=='private'?groups.find(g=>g.id===scope):null
  let q=db.from('study_items').select('id,owner_member_id,conversation_id,title,content,visibility,updated_at').eq('item_type','notebook')
  if(group)q=q.eq('conversation_id',group.id).eq('visibility','group').eq('title','Caderno do grupo • Calculadora');else q=q.eq('owner_member_id',me.id).is('conversation_id',null).eq('visibility','private').eq('title','Meu caderno • Calculadora')
  const {data,error}=await q.order('updated_at',{ascending:false}).limit(1);if(error){console.error(error);$('notebookStatus').textContent='Erro ao carregar';return}
  note=data?.[0]||null;$('studyNotebook').value=note?.content?.text||'';$('notebookTitle').textContent=group?`Caderno • ${group.title}`:'Meu caderno';$('notebookStatus').textContent=note?'Salvo ✓':'Novo caderno'
  if(note){noteChannel=db.channel(`study-note-${note.id}`).on('postgres_changes',{event:'UPDATE',schema:'public',table:'study_items',filter:`id=eq.${note.id}`},payload=>{if(document.activeElement!==$('studyNotebook')){$('studyNotebook').value=payload.new?.content?.text||'';$('notebookStatus').textContent='Atualizado ✓'}}).subscribe()}
}
function scheduleSave(){if(!me)return;$('notebookStatus').textContent='Salvando…';clearTimeout(saveTimer);saveTimer=setTimeout(()=>saveNote(false),900)}
async function saveNote(feedback=false){
  if(!$('studyNotebook'))return;await identity();clearTimeout(saveTimer);const text=$('studyNotebook').value,group=scope!=='private'?groups.find(g=>g.id===scope):null;$('notebookStatus').textContent='Salvando…'
  if(!note){const {data,error}=await db.from('study_items').insert({family_id:me.family_id,conversation_id:group?.id||null,owner_member_id:me.id,item_type:'notebook',title:group?'Caderno do grupo • Calculadora':'Meu caderno • Calculadora',content:{text},visibility:group?'group':'private',allowed_member_ids:[],updated_by:me.id}).select('id,owner_member_id,conversation_id,title,content,visibility,updated_at').single();if(error){console.error(error);$('notebookStatus').textContent='Não foi possível salvar';return}note=data}
  else{const {error}=await db.from('study_items').update({content:{text},updated_by:me.id}).eq('id',note.id);if(error){console.error(error);$('notebookStatus').textContent='Não foi possível salvar';return}}
  $('notebookStatus').textContent='Salvo ✓';if(feedback)toast('Caderno salvo ✓')
}
function sendResult(h){if(!h||!$('studyNotebook'))return;const ta=$('studyNotebook'),line=`${h.expression} = ${h.result}`,start=ta.selectionStart??ta.value.length,end=ta.selectionEnd??ta.value.length,prefix=ta.value&&start>0&&!ta.value.slice(0,start).endsWith('\n')?'\n':'';ta.value=ta.value.slice(0,start)+prefix+line+'\n'+ta.value.slice(end);ta.focus();ta.selectionStart=ta.selectionEnd=start+prefix.length+line.length+1;scheduleSave();toast('Resultado enviado ao caderno')}

mount();db.auth.onAuthStateChange((_e,session)=>{if(!session){me=null;groups=[];note=null}else if($('studyPanel')&&!$('studyPanel').classList.contains('hidden'))identity().then(loadNote).catch(console.error)})
