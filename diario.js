import { CONFIG } from './config.js'

const $=id=>document.getElementById(id)
let status=null,currentPin='',entries=[],currentEntry=null,currentMood='😊',postits=[],postitColor='#fff1a8',parentMode=false

function sessionToken(){
  try{const ref=new URL(CONFIG.SUPABASE_URL).hostname.split('.')[0],raw=localStorage.getItem(`sb-${ref}-auth-token`);if(!raw)return null;const d=JSON.parse(raw);return d?.access_token||d?.currentSession?.access_token||d?.session?.access_token||null}catch{return null}
}
async function rpc(name,args={}){
  const token=sessionToken();if(!token)throw new Error('Entre no Cantinho da Isa antes de abrir o diário.')
  const r=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(args),cache:'no-store'})
  let d=null;try{d=await r.json()}catch{}
  if(!r.ok)throw new Error(d?.message||d?.hint||d?.details||'Não foi possível abrir o diário.')
  return d
}
function toast(text){const t=$('diaryToast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._x);t._x=setTimeout(()=>t.classList.add('hidden'),2400)}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function fmtDate(v){if(!v)return 'Sem data';const [y,m,d]=String(v).slice(0,10).split('-');return `${d}/${m}/${y}`}
function fmtTime(v){if(!v)return new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit'}).format(new Date());return new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit'}).format(new Date(v))}
function sanitizeHtml(html){
  const doc=new DOMParser().parseFromString(`<div>${html||''}</div>`,'text/html'),root=doc.body.firstElementChild
  const allowed=new Set(['DIV','P','BR','SPAN','B','STRONG','I','EM','U','MARK','H1','H2','H3','BLOCKQUOTE','UL','OL','LI','FONT'])
  ;[...root.querySelectorAll('*')].forEach(el=>{
    if(!allowed.has(el.tagName)){el.replaceWith(...el.childNodes);return}
    const old={bg:el.style.backgroundColor,size:el.style.fontSize,align:el.style.textAlign,weight:el.style.fontWeight,style:el.style.fontStyle,deco:el.style.textDecoration,family:el.style.fontFamily,color:el.style.color,fontSizeAttr:el.getAttribute('size')}
    ;[...el.attributes].forEach(a=>el.removeAttribute(a.name))
    if(old.bg)el.style.backgroundColor=old.bg
    if(old.size)el.style.fontSize=old.size
    if(old.align)el.style.textAlign=old.align
    if(old.weight)el.style.fontWeight=old.weight
    if(old.style)el.style.fontStyle=old.style
    if(old.deco)el.style.textDecoration=old.deco
    if(old.family)el.style.fontFamily=old.family
    if(old.color)el.style.color=old.color
    if(el.tagName==='FONT'&&old.fontSizeAttr)el.setAttribute('size',old.fontSizeAttr)
  })
  return root.innerHTML
}

async function init(){
  try{status=await rpc('diary_status',{});parentMode=status?.mode==='parent'||new URLSearchParams(location.search).get('parent')==='1';if(status?.mode==='child')setupChildCover();else if(status?.mode==='parent')setupParentCover();else throw new Error('O Meu Diário é exclusivo da Isa e dos responsáveis quando a proteção de segurança estiver liberada.')}
  catch(e){$('coverStatus').textContent=e.message;$('coverStatus').style.color='#a54f6b'}
}
function setupChildCover(){
  $('coverChildBox').classList.remove('hidden')
  if(status.configured){$('openDiaryBtn').classList.remove('hidden');$('createDiaryPinBtn').classList.remove('hidden');$('diaryPin').placeholder='Digite sua chave ou crie uma nova'}
  else{$('openDiaryBtn').classList.add('hidden');$('createDiaryPinBtn').classList.remove('hidden');$('diaryPin').placeholder='Crie uma chave (mín. 4 caracteres)'}
}
function setupParentCover(){
  $('coverParentBox').classList.remove('hidden')
  if(!status.configured){$('parentCoverText').textContent='A Isa ainda não criou o Meu Diário.';return}
  if(status.parentalUnlocked){$('parentCoverText').textContent='A proteção de segurança liberou o acesso parental.';$('parentOpenBtn').classList.remove('hidden')}
  else $('parentCoverText').textContent='O diário está protegido. Não há acesso parental de segurança liberado neste momento.'
}
async function createPin(){const p=$('diaryPin').value;try{await rpc('diary_set_pin',{p_pin:p});status.configured=true;currentPin=p;setupChildCover();toast('Chave criada ✓')}catch(e){$('coverStatus').textContent=e.message}}
async function openChild(){currentPin=$('diaryPin').value;try{await loadChildDiary()}catch(e){currentPin='';$('coverStatus').textContent=e.message}}
async function loadChildDiary(){entries=await rpc('diary_list',{p_pin:currentPin});openApp(false)}
async function openParent(){try{entries=await rpc('diary_parent_list',{});openApp(true)}catch(e){$('coverStatus').textContent=e.message}}
function openApp(readonly){
  parentMode=readonly;$('coverView').classList.add('hidden');$('diaryView').classList.remove('hidden');document.body.classList.toggle('parent-readonly',readonly);$('diaryModeLabel').textContent=readonly?'Responsável • somente leitura':'Isa';$('printDiaryBtn').classList.remove('hidden');$('diaryEditor').contentEditable=readonly?'false':'true';renderPageList();if(entries.length)selectEntry(entries[0].id);else newPage();window.dispatchEvent(new CustomEvent('isa-diary-opened',{detail:{readonly}}))
}
function lockDiary(){currentPin='';entries=[];currentEntry=null;postits=[];$('diaryView').classList.add('hidden');$('coverView').classList.remove('hidden');$('diaryPin').value='';$('coverStatus').textContent='';window.dispatchEvent(new Event('isa-diary-locked'))}
function renderPageList(){
  $('diaryPageList').innerHTML=entries.map(e=>`<button class="page-list-item ${currentEntry?.id===e.id?'active':''}" data-page-id="${e.id}"><span class="mood">${esc(e.mood||'💜')}</span><span><strong>${fmtDate(e.date)}</strong><small>${esc((e.bodyText||'Página do diário').slice(0,38))}</small></span></button>`).join('')||'<p style="font-size:.76rem;color:#8d8197;padding:4px">Nenhuma página ainda.</p>'
  document.querySelectorAll('[data-page-id]').forEach(b=>b.onclick=()=>selectEntry(b.dataset.pageId))
}
function selectEntry(id){
  const e=entries.find(x=>x.id===id);if(!e)return
  currentEntry=e;currentMood=e.mood||'😊';postits=Array.isArray(e.postits)?structuredClone(e.postits):[]
  $('entryDate').value=String(e.date).slice(0,10);$('entryTime').textContent=fmtTime(e.createdAt);$('pageMood').textContent=currentMood;$('fontSelect').value=e.font||'Segoe Print';$('diaryEditor').style.fontFamily=`${e.font||'Segoe Print'}, cursive`;$('diaryEditor').innerHTML=sanitizeHtml(e.bodyHtml||esc(e.bodyText||''));$('saveState').textContent=`Salvo • ${fmtTime(e.updatedAt)}`;$('pageNumber').textContent=String(entries.indexOf(e)+1);setMoodButtons();renderPostits();renderPageList();window.dispatchEvent(new Event('isa-diary-entry-changed'))
}
function newPage(){
  if(parentMode)return
  currentEntry=null;currentMood='😊';postits=[];$('entryDate').value=today();$('entryTime').textContent=fmtTime();$('pageMood').textContent=currentMood;$('fontSelect').value='Segoe Print';$('diaryEditor').style.fontFamily='Segoe Print, cursive';$('diaryEditor').innerHTML='';$('saveState').textContent='Nova página';$('pageNumber').textContent=String(entries.length+1);setMoodButtons();renderPostits();renderPageList();$('diaryEditor').focus();window.dispatchEvent(new Event('isa-diary-entry-changed'))
}
function setMoodButtons(){document.querySelectorAll('[data-mood]').forEach(b=>b.classList.toggle('active',b.dataset.mood===currentMood))}
async function savePage(){
  if(parentMode)return
  const clean=sanitizeHtml($('diaryEditor').innerHTML),text=$('diaryEditor').innerText.trim();$('saveDiaryBtn').disabled=true;$('saveState').textContent='Salvando…'
  try{const r=await rpc('diary_save',{p_pin:currentPin,p_entry_id:currentEntry?.id||null,p_entry_date:$('entryDate').value||today(),p_body_html:clean,p_body_text:text,p_mood:currentMood,p_font:$('fontSelect').value,p_postits:postits});entries=await rpc('diary_list',{p_pin:currentPin});currentEntry=entries.find(x=>x.id===r.id)||entries[0]||null;if(currentEntry)selectEntry(currentEntry.id);toast(r.safetyAlert?'Página salva ✓ • 🛡️ Proteção de segurança ativada.':'Página salva ✓')}
  catch(e){$('saveState').textContent='Não foi possível salvar';toast(e.message)}finally{$('saveDiaryBtn').disabled=false}
}
async function deletePage(){if(parentMode||!currentEntry)return;if(!confirm('Excluir esta página do diário?'))return;try{await rpc('diary_delete',{p_pin:currentPin,p_entry_id:currentEntry.id});entries=await rpc('diary_list',{p_pin:currentPin});currentEntry=null;renderPageList();if(entries.length)selectEntry(entries[0].id);else newPage();toast('Página excluída')}catch(e){toast(e.message)}}

function markDirty(){$('saveState').textContent='Alterações não salvas'}
function addPostit(){
  if(parentMode)return
  const text=$('postitText').value.trim();if(!text)return toast('Escreva algo no post-it.')
  postits.push({id:crypto.randomUUID(),text,color:postitColor,x:Math.round(8+Math.random()*62),y:Math.round(8+Math.random()*55),rot:Math.round(-4+Math.random()*8),collapsed:false});$('postitText').value='';renderPostits();markDirty()
}
function renderPostits(){
  const layer=$('postitLayer');if(!layer)return
  layer.innerHTML=postits.map(n=>`<div class="diary-postit ${n.collapsed?'collapsed':''}" data-postit-id="${n.id}" style="--note:${n.color};--rot:${Number(n.rot||0)}deg;left:${Number(n.x||5)}%;top:${Number(n.y||5)}%"><div class="postit-pin" aria-hidden="true"></div><div class="postit-tools"><button type="button" data-collapse-postit="${n.id}" title="${n.collapsed?'Abrir':'Recolher'}">${n.collapsed?'＋':'−'}</button><button type="button" data-delete-postit="${n.id}" title="Excluir">×</button></div><div class="postit-text" data-postit-text="${n.id}" contenteditable="${parentMode?'false':'true'}">${esc(n.text)}</div></div>`).join('')
  layer.querySelectorAll('[data-delete-postit]').forEach(b=>b.onclick=e=>{e.stopPropagation();if(parentMode)return;postits=postits.filter(n=>n.id!==b.dataset.deletePostit);renderPostits();markDirty()})
  layer.querySelectorAll('[data-collapse-postit]').forEach(b=>b.onclick=e=>{e.stopPropagation();if(parentMode)return;const n=postits.find(x=>x.id===b.dataset.collapsePostit);if(n){n.collapsed=!n.collapsed;renderPostits();markDirty()}})
  layer.querySelectorAll('[data-postit-text]').forEach(el=>{if(parentMode)return;el.addEventListener('input',()=>{const n=postits.find(x=>x.id===el.dataset.postitText);if(n){n.text=el.innerText.slice(0,300);markDirty()}});el.addEventListener('pointerdown',e=>e.stopPropagation())})
  layer.querySelectorAll('[data-postit-id]').forEach(makeDraggable)
}
function makeDraggable(el){
  if(parentMode)return
  el.onpointerdown=e=>{
    if(e.target.closest('button,[contenteditable="true"]'))return
    el.setPointerCapture(e.pointerId);const layer=$('postitLayer'),r=layer.getBoundingClientRect(),er=el.getBoundingClientRect(),dx=e.clientX-er.left,dy=e.clientY-er.top
    const move=ev=>{let x=((ev.clientX-r.left-dx)/r.width)*100,y=((ev.clientY-r.top-dy)/r.height)*100;x=Math.max(0,Math.min(82,x));y=Math.max(0,Math.min(78,y));el.style.left=x+'%';el.style.top=y+'%'}
    const up=()=>{el.removeEventListener('pointermove',move);const n=postits.find(x=>x.id===el.dataset.postitId);if(n){n.x=parseFloat(el.style.left);n.y=parseFloat(el.style.top)}markDirty()}
    el.addEventListener('pointermove',move);el.addEventListener('pointerup',up,{once:true})
  }
}

$('toggleDiaryPin').onclick=()=>{const i=$('diaryPin'),show=i.type==='password';i.type=show?'text':'password';$('toggleDiaryPin').textContent=show?'🙈':'👁️'}
$('createDiaryPinBtn').onclick=createPin;$('openDiaryBtn').onclick=openChild;$('parentOpenBtn').onclick=openParent;$('lockDiaryBtn').onclick=lockDiary
$('newDiaryPageBtn').onclick=newPage;$('saveDiaryBtn').onclick=savePage;$('deleteDiaryPageBtn').onclick=deletePage;$('addPostitBtn').onclick=addPostit;$('printDiaryBtn').onclick=()=>window.print()
$('diaryShieldBtn').onclick=()=>document.getElementById('diaryInfoDialog').showModal();$('closeDiaryInfo').onclick=$('okDiaryInfo').onclick=()=>document.getElementById('diaryInfoDialog').close()
document.querySelectorAll('[data-mood]').forEach(b=>b.onclick=()=>{if(parentMode)return;currentMood=b.dataset.mood;$('pageMood').textContent=currentMood;setMoodButtons();markDirty()})
$('fontSelect').onchange=e=>{if(parentMode)return;$('diaryEditor').style.fontFamily=`${e.target.value}, cursive`;markDirty()}
document.querySelectorAll('[data-highlight]').forEach(b=>b.onclick=()=>{if(parentMode)return;$('diaryEditor').focus();document.execCommand('hiliteColor',false,b.dataset.highlight);markDirty()})
document.querySelectorAll('[data-postit-color]').forEach(b=>b.onclick=()=>{postitColor=b.dataset.postitColor;document.querySelectorAll('[data-postit-color]').forEach(x=>x.classList.toggle('active',x===b))})
$('diaryEditor').addEventListener('input',()=>{if(!parentMode)markDirty()});$('entryDate').addEventListener('change',()=>{if(!parentMode)markDirty()});document.querySelector('[data-postit-color]')?.classList.add('active')
window.__ISA_DIARY_DIRTY__=markDirty
init()
