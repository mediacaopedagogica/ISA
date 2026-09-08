import { CONFIG } from './config.js'

const $=id=>document.getElementById(id)
const norm=v=>String(v||'').trim().toLowerCase()
if(norm($('myName')?.textContent)!=='alan') throw new Error('alan-studio: perfil não autorizado')

const css=document.createElement('link')
css.rel='stylesheet';css.href='./alan-studio.css?v=1';document.head.appendChild(css)

const DEFAULT_STATE={
  version:1,
  songs:[],
  gigs:[],
  setlist:[],
  practice:[],
  settings:{bpm:90,meter:'4/4',accent:true}
}
let state=structuredClone(DEFAULT_STATE)
let saveTimer=null
let audioCtx=null,metroTimer=null,nextNoteTime=0,beatIndex=0,running=false,tapTimes=[]

function getAuth(){
  const seek=o=>{if(!o||typeof o!=='object')return'';if(typeof o.access_token==='string')return o.access_token;for(const v of Object.values(o)){const t=seek(v);if(t)return t}return''}
  for(const store of [localStorage,sessionStorage]){try{for(let i=0;i<store.length;i++){const k=store.key(i)||'';if(!/auth-token/i.test(k))continue;let raw=store.getItem(k)||'';if(raw.startsWith('base64-')){try{raw=atob(raw.slice(7))}catch{}}try{const t=seek(JSON.parse(raw));if(t)return t}catch{}}}catch{}}
  return''
}
async function rpc(name,args={}){
  const bearer=getAuth();if(!bearer)throw new Error('Sessão do Alan não encontrada.')
  const r=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${name}`,{method:'POST',cache:'no-store',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${bearer}`,'Content-Type':'application/json'},body:JSON.stringify(args)})
  let data=null;try{data=await r.json()}catch{}
  if(!r.ok)throw new Error(data?.message||data?.hint||'Não foi possível acessar o Estúdio do Alan.')
  return data
}
function mergeState(data){
  const d=data&&typeof data==='object'?data:{}
  state={...structuredClone(DEFAULT_STATE),...d,settings:{...DEFAULT_STATE.settings,...(d.settings||{})}}
  state.songs=Array.isArray(state.songs)?state.songs:[]
  state.gigs=Array.isArray(state.gigs)?state.gigs:[]
  state.setlist=Array.isArray(state.setlist)?state.setlist:[]
  state.practice=Array.isArray(state.practice)?state.practice:[]
}
function saveSoon(){
  const el=$('alanSaveState');if(el)el.textContent='Salvando…'
  clearTimeout(saveTimer);saveTimer=setTimeout(async()=>{try{await rpc('alan_studio_save',{p_data:state});if(el)el.textContent='Salvo ✓'}catch(e){console.warn(e);if(el)el.textContent='Não salvou'}},500)
}
function esc(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function money(v){return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function uid(prefix='id'){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}
function todayISO(){return new Date().toISOString().slice(0,10)}
function gigNet(g){return Number(g.fee||0)-Number(g.transport||0)-Number(g.food||0)-Number(g.other||0)}
function gigDue(g){return Math.max(0,Number(g.fee||0)-Number(g.deposit||0))}
function meterBeats(){return Math.max(1,Number(String(state.settings.meter||'4/4').split('/')[0])||4)}

function ensureEntry(){
  if($('alanStudioEntry'))return
  const nav=document.querySelector('.nav-tabs');if(!nav)return
  const btn=document.createElement('button');btn.id='alanStudioEntry';btn.type='button';btn.className='nav-btn';btn.innerHTML='🎸 <span>Meu Estúdio</span>';btn.addEventListener('click',openStudio)
  const cal=nav.querySelector('[data-tab="calendar"]');if(cal?.nextSibling)nav.insertBefore(btn,cal.nextSibling);else nav.appendChild(btn)
}
function ensureOverlay(){
  if($('alanStudioOverlay'))return $('alanStudioOverlay')
  const el=document.createElement('section');el.id='alanStudioOverlay';el.className='hidden';el.innerHTML=`
  <div class="alan-studio-shell">
    <header class="alan-studio-head">
      <div class="alan-studio-brand"><span class="guitar">🎸</span><div><strong>Estúdio do Alan</strong><small>Música, apresentações e cachês</small></div></div>
      <div class="spacer"></div><span id="alanSaveState" class="alan-save-state">Salvo ✓</span>
      <button id="alanPrintBtn" class="alan-studio-icon" type="button" title="Imprimir">🖨️</button>
      <button id="alanStudioClose" class="alan-studio-close" type="button">✕</button>
    </header>
    <nav class="alan-studio-side">
      <button class="active" data-alan-view="home">🏠 Início</button>
      <button data-alan-view="metronome">⏱️ Metrônomo</button>
      <button data-alan-view="repertoire">🎼 Repertório</button>
      <button data-alan-view="setlist">📋 Setlist</button>
      <button data-alan-view="agenda">📅 Agenda de Shows</button>
      <button data-alan-view="finance">💰 Cachês</button>
    </nav>
    <main class="alan-studio-main">
      <section class="alan-view active" data-view="home"><div class="alan-view-head"><div><h2>Seu painel musical 🎶</h2><p>O que precisa de atenção agora, sem complicação.</p></div></div><div id="alanHomeStats" class="alan-grid"></div><div class="alan-section"><div class="alan-section-title"><h3>Acesso rápido</h3></div><div class="alan-quick"><button data-open="metronome"><span>⏱️</span>Metrônomo</button><button data-open="repertoire"><span>🎼</span>Repertório</button><button data-open="agenda"><span>📅</span>Novo show</button><button data-open="finance"><span>💰</span>Cachês</button></div></div><div class="alan-section"><div class="alan-section-title"><h3>Próxima apresentação</h3></div><div id="alanNextGig"></div></div></section>

      <section class="alan-view" data-view="metronome"><div class="alan-view-head"><div><h2>Metrônomo ⏱️</h2><p>BPM, compasso, acento no primeiro tempo e Tap Tempo.</p></div></div><div class="alan-metronome"><div class="alan-card alan-metronome-panel"><div class="alan-bpm"><span id="alanBpmValue">90</span> <small>BPM</small></div><div id="alanBeats" class="alan-beats"></div><div class="alan-bpm-controls"><button id="alanBpmMinus" class="alan-mini" type="button">−</button><input id="alanBpmRange" type="range" min="35" max="220" step="1"><button id="alanBpmPlus" class="alan-mini" type="button">＋</button></div><div class="alan-metro-actions"><select id="alanMeter"><option>2/4</option><option>3/4</option><option>4/4</option><option>6/8</option></select><label class="alan-soft"><input id="alanAccent" type="checkbox"> Acentuar 1º tempo</label><button id="alanTap" class="alan-soft alan-tap" type="button">👆 Tap Tempo</button><button id="alanMetroStart" class="alan-primary" type="button">▶ Iniciar</button><button id="alanMetroFull" class="alan-soft" type="button">⛶ Tela cheia</button></div></div><div class="alan-card"><h3>Prática rápida</h3><p class="alan-metro-note">Use o Tap Tempo para descobrir aproximadamente o BPM de uma música. O primeiro tempo pode receber um clique mais agudo para ajudar a sentir o compasso.</p><div class="alan-form"><label>Minutos praticados<input id="alanPracticeMinutes" type="number" min="1" max="480" value="20"></label><label class="wide">Observação<input id="alanPracticeNote" placeholder="Ex.: treinei a introdução e a troca de acordes"></label></div><button id="alanPracticeSave" class="alan-primary" type="button">Salvar prática</button></div></div></section>

      <section class="alan-view" data-view="repertoire"><div class="alan-view-head"><div><h2>Repertório 🎼</h2><p>Tom, capo, BPM e situação de cada música.</p></div></div><div class="alan-card"><form id="alanSongForm" class="alan-form"><label class="wide">Música<input name="title" required placeholder="Nome da música"></label><label>Artista<input name="artist" placeholder="Artista"></label><label>Tom<input name="key" placeholder="Ex.: G"></label><label>Capo<input name="capo" type="number" min="0" max="12" value="0"></label><label>BPM<input name="bpm" type="number" min="30" max="250"></label><label>Status<select name="status"><option value="study">Estudando</option><option value="ready">Pronta</option><option value="show">Apresentação</option></select></label><label class="wide">Observações<input name="notes" placeholder="Ex.: baixar meio tom no refrão"></label><button class="alan-primary" type="submit">＋ Adicionar</button></form></div><div class="alan-section"><div id="alanSongList" class="alan-list"></div></div></section>

      <section class="alan-view" data-view="setlist"><div class="alan-view-head"><div><h2>Setlist 📋</h2><p>Monte a ordem da apresentação e reorganize sem arrastar — funciona melhor no celular.</p></div></div><div class="alan-card"><div class="alan-form"><label class="wide">Adicionar do repertório<select id="alanSetSong"></select></label><button id="alanSetAdd" class="alan-primary" type="button">＋ Adicionar ao setlist</button></div></div><div class="alan-section"><div id="alanSetList" class="alan-setlist"></div></div></section>

      <section class="alan-view" data-view="agenda"><div class="alan-view-head"><div><h2>Agenda de Shows 📅</h2><p>Compromissos, valores combinados e observações do evento.</p></div></div><div class="alan-card"><form id="alanGigForm" class="alan-form"><label>Data<input name="date" type="date" required></label><label>Horário<input name="time" type="time"></label><label class="wide">Local / evento<input name="venue" required placeholder="Ex.: Restaurante, casamento, evento"></label><label>Cachê (R$)<input name="fee" type="number" min="0" step="0.01"></label><label>Sinal recebido (R$)<input name="deposit" type="number" min="0" step="0.01"></label><label>Transporte (R$)<input name="transport" type="number" min="0" step="0.01"></label><label>Alimentação (R$)<input name="food" type="number" min="0" step="0.01"></label><label>Outros gastos (R$)<input name="other" type="number" min="0" step="0.01"></label><label>Status<select name="status"><option value="quoted">Orçado</option><option value="confirmed">Confirmado</option><option value="done">Realizado</option><option value="paid">Pago</option><option value="late">Pagamento atrasado</option></select></label><label class="wide">Observações<input name="notes" placeholder="Contato, chegada, traje, equipamento..."></label><button class="alan-primary" type="submit">＋ Salvar show</button></form></div><div class="alan-section"><div id="alanGigList" class="alan-list"></div></div></section>

      <section class="alan-view" data-view="finance"><div class="alan-view-head"><div><h2>Gestão de Cachês 💰</h2><p>Recebido, a receber, gastos e lucro real das apresentações.</p></div></div><div id="alanFinanceStats" class="alan-finance-grid"></div><div class="alan-card"><div class="alan-section-title"><h3>Resumo por apresentação</h3></div><div id="alanFinanceList" class="alan-list"></div></div></section>
    </main>
  </div>`
  document.body.appendChild(el)
  wireOverlay(el)
  return el
}
function setView(name){
  document.querySelectorAll('#alanStudioOverlay [data-alan-view]').forEach(b=>b.classList.toggle('active',b.dataset.alanView===name))
  document.querySelectorAll('#alanStudioOverlay .alan-view').forEach(v=>v.classList.toggle('active',v.dataset.view===name))
  if(name==='metronome')renderMetronome();if(name==='home')renderHome();if(name==='repertoire')renderSongs();if(name==='setlist')renderSetlist();if(name==='agenda')renderGigs();if(name==='finance')renderFinance()
}
function openStudio(){ensureOverlay().classList.remove('hidden');document.documentElement.style.overflow='hidden';renderAll()}
function closeStudio(){stopMetronome();$('alanStudioOverlay')?.classList.add('hidden');document.documentElement.style.overflow=''}

function renderHome(){
  const now=new Date(),future=state.gigs.filter(g=>g.date&&new Date(`${g.date}T${g.time||'23:59'}`)>=now).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)),next=future[0]
  const due=state.gigs.filter(g=>g.status!=='paid').reduce((s,g)=>s+gigDue(g),0),ready=state.songs.filter(s=>s.status==='ready'||s.status==='show').length
  const since=Date.now()-7*864e5,mins=state.practice.filter(p=>new Date(p.at).getTime()>=since).reduce((s,p)=>s+Number(p.minutes||0),0)
  $('alanHomeStats').innerHTML=`<article class="alan-stat"><span>🎤</span><strong>${next?esc(new Date(next.date+'T12:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})):'—'}</strong><small>próximo show</small></article><article class="alan-stat"><span>💰</span><strong class="alan-money warn">${money(due)}</strong><small>a receber</small></article><article class="alan-stat"><span>🎵</span><strong>${ready}</strong><small>músicas prontas</small></article><article class="alan-stat"><span>⏱️</span><strong>${Math.floor(mins/60)}h ${mins%60}min</strong><small>prática em 7 dias</small></article>`
  $('alanNextGig').innerHTML=next?gigCard(next,true):'<div class="alan-empty">Nenhuma apresentação futura cadastrada.</div>'
}
function renderMetronome(){
  $('alanBpmValue').textContent=state.settings.bpm;$('alanBpmRange').value=state.settings.bpm;$('alanMeter').value=state.settings.meter;$('alanAccent').checked=!!state.settings.accent
  const n=meterBeats();$('alanBeats').innerHTML=Array.from({length:n},(_,i)=>`<span class="alan-beat ${i===0?'down':''}" data-beat="${i}"></span>`).join('')
  $('alanMetroStart').textContent=running?'■ Parar':'▶ Iniciar'
}
function clickSound(time,isDown){
  const ctx=audioCtx,osc=ctx.createOscillator(),gain=ctx.createGain();osc.frequency.value=isDown&&state.settings.accent?1120:760;gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(isDown?.2:.13,time+.002);gain.gain.exponentialRampToValueAtTime(.0001,time+.055);osc.connect(gain).connect(ctx.destination);osc.start(time);osc.stop(time+.065)
}
function scheduleMetro(){
  if(!running||!audioCtx)return
  const sec=60/Number(state.settings.bpm||90),beats=meterBeats()
  while(nextNoteTime<audioCtx.currentTime+.12){const b=beatIndex;clickSound(nextNoteTime,b===0);const delay=Math.max(0,(nextNoteTime-audioCtx.currentTime)*1000);setTimeout(()=>{document.querySelectorAll('#alanBeats .alan-beat').forEach((x,i)=>x.classList.toggle('active',i===b));setTimeout(()=>document.querySelectorAll('#alanBeats .alan-beat').forEach(x=>x.classList.remove('active')),80)},delay);beatIndex=(beatIndex+1)%beats;nextNoteTime+=sec}
}
async function toggleMetronome(){
  if(running){stopMetronome();return}
  audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();await audioCtx.resume();running=true;beatIndex=0;nextNoteTime=audioCtx.currentTime+.06;metroTimer=setInterval(scheduleMetro,25);scheduleMetro();renderMetronome()
}
function stopMetronome(){running=false;clearInterval(metroTimer);metroTimer=null;document.querySelectorAll('#alanBeats .alan-beat').forEach(x=>x.classList.remove('active'));if($('alanMetroStart'))$('alanMetroStart').textContent='▶ Iniciar'}
function setBpm(v){state.settings.bpm=Math.max(35,Math.min(220,Math.round(Number(v)||90)));saveSoon();if($('alanBpmValue'))renderMetronome()}
function tapTempo(){const now=performance.now();tapTimes=tapTimes.filter(t=>now-t<2500);tapTimes.push(now);if(tapTimes.length>=2){const diffs=tapTimes.slice(1).map((t,i)=>t-tapTimes[i]),avg=diffs.reduce((a,b)=>a+b,0)/diffs.length;setBpm(60000/avg)}}

function renderSongs(){
  const list=$('alanSongList');if(!state.songs.length){list.innerHTML='<div class="alan-empty">Seu repertório ainda está vazio.</div>';return}
  const statusLabel={study:'Estudando',ready:'Pronta',show:'Apresentação'}
  list.innerHTML=state.songs.map(s=>`<article class="alan-row"><div><b>${esc(s.title)}</b><small>${esc(s.artist||'Sem artista')}</small></div><div><small>Tom</small><b>${esc(s.key||'—')}</b></div><div><small>Capo / BPM</small><b>${Number(s.capo||0)} / ${s.bpm||'—'}</b></div><div><span class="alan-badge ${s.status==='ready'||s.status==='show'?'ready':'study'}">${statusLabel[s.status]||'Estudando'}</span></div><div class="alan-row-actions"><button class="alan-mini" data-song-status="${s.id}">✓ Status</button><button class="alan-danger" data-song-del="${s.id}">Excluir</button></div></article>`).join('')
}
function renderSetlist(){
  const sel=$('alanSetSong');sel.innerHTML='<option value="">Selecione uma música</option>'+state.songs.map(s=>`<option value="${s.id}">${esc(s.title)}${s.key?' • '+esc(s.key):''}</option>`).join('')
  const box=$('alanSetList'),valid=state.setlist.map(id=>state.songs.find(s=>s.id===id)).filter(Boolean)
  box.innerHTML=valid.length?valid.map((s,i)=>`<article class="alan-set-item"><span class="alan-set-num">${i+1}</span><div><b>${esc(s.title)}</b><small>${esc(s.artist||'')} ${s.key?'• Tom '+esc(s.key):''}</small></div><div class="alan-row-actions"><button class="alan-mini" data-set-up="${s.id}" ${i===0?'disabled':''}>↑</button><button class="alan-mini" data-set-down="${s.id}" ${i===valid.length-1?'disabled':''}>↓</button><button class="alan-danger" data-set-del="${s.id}">✕</button></div></article>`).join(''):'<div class="alan-empty">Adicione músicas do repertório para montar o setlist.</div>'
}
function statusText(s){return({quoted:'Orçado',confirmed:'Confirmado',done:'Realizado',paid:'Pago',late:'Atrasado'})[s]||s}
function gigCard(g,compact=false){const due=gigDue(g),net=gigNet(g);return `<article class="alan-row"><div><b>${esc(g.venue)}</b><small>${esc(new Date(g.date+'T12:00').toLocaleDateString('pt-BR'))}${g.time?' • '+esc(g.time):''}${g.notes?' • '+esc(g.notes):''}</small></div><div><small>Cachê</small><b class="alan-money">${money(g.fee)}</b></div><div><small>A receber</small><b class="alan-money ${due?'warn':'good'}">${money(due)}</b></div><div><small>Lucro</small><b class="alan-money good">${money(net)}</b><br><span class="alan-badge ${g.status}">${statusText(g.status)}</span></div>${compact?'':`<div class="alan-row-actions"><button class="alan-mini" data-gig-paid="${g.id}">✓ Pago</button><button class="alan-danger" data-gig-del="${g.id}">Excluir</button></div>`}</article>`}
function renderGigs(){const list=$('alanGigList'),gigs=[...state.gigs].sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));list.innerHTML=gigs.length?gigs.map(g=>gigCard(g)).join(''):'<div class="alan-empty">Nenhum show cadastrado.</div>'}
function renderFinance(){
  const total=state.gigs.reduce((s,g)=>s+Number(g.fee||0),0),received=state.gigs.reduce((s,g)=>s+Math.min(Number(g.deposit||0),Number(g.fee||0)),0)+state.gigs.filter(g=>g.status==='paid').reduce((s,g)=>s+Math.max(0,Number(g.fee||0)-Number(g.deposit||0)),0),due=state.gigs.filter(g=>g.status!=='paid').reduce((s,g)=>s+gigDue(g),0),expenses=state.gigs.reduce((s,g)=>s+Number(g.transport||0)+Number(g.food||0)+Number(g.other||0),0),net=total-expenses
  $('alanFinanceStats').innerHTML=`<article class="alan-stat"><span>🎤</span><strong>${money(total)}</strong><small>cachês cadastrados</small></article><article class="alan-stat"><span>✅</span><strong class="alan-money good">${money(received)}</strong><small>recebido/sinal</small></article><article class="alan-stat"><span>⏳</span><strong class="alan-money warn">${money(due)}</strong><small>a receber</small></article><article class="alan-stat"><span>📈</span><strong class="alan-money good">${money(net)}</strong><small>resultado após gastos</small></article>`
  $('alanFinanceList').innerHTML=state.gigs.length?[...state.gigs].sort((a,b)=>b.date.localeCompare(a.date)).map(g=>gigCard(g)).join(''):'<div class="alan-empty">Cadastre apresentações na Agenda para acompanhar os cachês aqui.</div>'
}
function renderAll(){renderHome();renderMetronome();renderSongs();renderSetlist();renderGigs();renderFinance()}

function wireOverlay(el){
  $('alanStudioClose').onclick=closeStudio;$('alanPrintBtn').onclick=()=>window.print()
  el.querySelectorAll('[data-alan-view]').forEach(b=>b.onclick=()=>setView(b.dataset.alanView));el.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>setView(b.dataset.open))
  $('alanBpmMinus').onclick=()=>setBpm(state.settings.bpm-1);$('alanBpmPlus').onclick=()=>setBpm(state.settings.bpm+1);$('alanBpmRange').oninput=e=>setBpm(e.target.value);$('alanMeter').onchange=e=>{state.settings.meter=e.target.value;beatIndex=0;saveSoon();renderMetronome()};$('alanAccent').onchange=e=>{state.settings.accent=e.target.checked;saveSoon()};$('alanTap').onclick=tapTempo;$('alanMetroStart').onclick=toggleMetronome;$('alanMetroFull').onclick=()=>el.requestFullscreen?.().catch(()=>{})
  $('alanPracticeSave').onclick=()=>{const minutes=Math.max(1,Number($('alanPracticeMinutes').value)||1),note=$('alanPracticeNote').value.trim();state.practice.push({id:uid('p'),at:new Date().toISOString(),minutes,note});$('alanPracticeNote').value='';saveSoon();renderHome()}
  $('alanSongForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget);state.songs.push({id:uid('s'),title:String(f.get('title')||'').trim(),artist:String(f.get('artist')||'').trim(),key:String(f.get('key')||'').trim(),capo:Number(f.get('capo')||0),bpm:Number(f.get('bpm')||0)||'',status:String(f.get('status')||'study'),notes:String(f.get('notes')||'').trim()});e.currentTarget.reset();saveSoon();renderSongs();renderSetlist();renderHome()}
  $('alanSetAdd').onclick=()=>{const id=$('alanSetSong').value;if(id&&!state.setlist.includes(id)){state.setlist.push(id);saveSoon();renderSetlist()}}
  $('alanGigForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget);state.gigs.push({id:uid('g'),date:String(f.get('date')||''),time:String(f.get('time')||''),venue:String(f.get('venue')||'').trim(),fee:Number(f.get('fee')||0),deposit:Number(f.get('deposit')||0),transport:Number(f.get('transport')||0),food:Number(f.get('food')||0),other:Number(f.get('other')||0),status:String(f.get('status')||'quoted'),notes:String(f.get('notes')||'').trim()});e.currentTarget.reset();e.currentTarget.elements.date.value=todayISO();saveSoon();renderGigs();renderFinance();renderHome()}
  el.addEventListener('click',e=>{
    const t=e.target.closest('button');if(!t)return
    if(t.dataset.songDel){state.songs=state.songs.filter(s=>s.id!==t.dataset.songDel);state.setlist=state.setlist.filter(id=>id!==t.dataset.songDel);saveSoon();renderSongs();renderSetlist();renderHome()}
    if(t.dataset.songStatus){const s=state.songs.find(x=>x.id===t.dataset.songStatus);if(s){s.status=s.status==='study'?'ready':s.status==='ready'?'show':'study';saveSoon();renderSongs();renderHome()}}
    if(t.dataset.setDel){state.setlist=state.setlist.filter(id=>id!==t.dataset.setDel);saveSoon();renderSetlist()}
    if(t.dataset.setUp||t.dataset.setDown){const id=t.dataset.setUp||t.dataset.setDown,i=state.setlist.indexOf(id),j=t.dataset.setUp?i-1:i+1;if(i>=0&&j>=0&&j<state.setlist.length){[state.setlist[i],state.setlist[j]]=[state.setlist[j],state.setlist[i]];saveSoon();renderSetlist()}}
    if(t.dataset.gigDel){state.gigs=state.gigs.filter(g=>g.id!==t.dataset.gigDel);saveSoon();renderGigs();renderFinance();renderHome()}
    if(t.dataset.gigPaid){const g=state.gigs.find(x=>x.id===t.dataset.gigPaid);if(g){g.status='paid';g.deposit=Number(g.fee||0);saveSoon();renderGigs();renderFinance();renderHome()}}
  })
  $('alanGigForm').elements.date.value=todayISO()
}

async function boot(){
  ensureEntry();const overlay=ensureOverlay();try{const data=await rpc('alan_studio_load');mergeState(data);renderAll()}catch(e){console.warn(e);mergeState({});const s=$('alanSaveState');if(s)s.textContent='Modo local';}
  let tries=0;const timer=setInterval(()=>{ensureEntry();if(++tries>40)clearInterval(timer)},250)
}
boot()
