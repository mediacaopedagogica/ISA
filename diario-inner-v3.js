const $=id=>document.getElementById(id)
const editor=$('diaryEditor')
let view=localStorage.getItem('isa-diary-view')||'page'

function dirty(){window.__ISA_DIARY_DIRTY__?.()}
function focusEditor(){editor?.focus({preventScroll:true})}
function exec(cmd,value=null){if(!editor)return;focusEditor();document.execCommand(cmd,false,value);dirty()}
function formatBlock(tag){focusEditor();document.execCommand('formatBlock',false,tag);dirty()}
function setFontSize(px){
  if(!editor)return;focusEditor();document.execCommand('fontSize',false,'7');editor.querySelectorAll('font[size="7"]').forEach(f=>{f.removeAttribute('size');f.style.fontSize=`${px}px`});dirty()
}
function insertChecklist(){focusEditor();document.execCommand('insertText',false,'☐ ');dirty()}
function backToChat(){if(history.length>1)history.back();else location.href='./'}
function applyView(){
  document.body.classList.toggle('diary-mode-book',view==='book')
  document.body.classList.toggle('diary-mode-page',view!=='book')
  document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view))
  localStorage.setItem('isa-diary-view',view)
}
function makeToolbar(){
  const bar=document.querySelector('.diary-toolbar');if(!bar||bar.dataset.innerV3)return;bar.dataset.innerV3='1'
  const tools=document.createElement('div');tools.className='diary-format-tools';tools.innerHTML=`
    <select id="diaryTextStyle" title="Formato de escrita">
      <option value="p">Texto normal</option><option value="h1">Título</option><option value="h2">Subtítulo</option><option value="h3">Anotação</option><option value="blockquote">Reflexão / citação</option>
    </select>
    <select id="diaryFontSize" title="Tamanho"><option value="15">15</option><option value="17" selected>17</option><option value="19">19</option><option value="22">22</option><option value="28">28</option><option value="34">34</option></select>
    <span class="format-sep"></span>
    <button type="button" data-cmd="bold" title="Negrito"><b>B</b></button><button type="button" data-cmd="italic" title="Itálico"><i>I</i></button><button type="button" data-cmd="underline" title="Sublinhado"><u>U</u></button>
    <span class="format-sep"></span>
    <button type="button" data-cmd="justifyLeft" title="Alinhar à esquerda">≡</button><button type="button" data-cmd="justifyCenter" title="Centralizar">≡</button><button type="button" data-cmd="justifyRight" title="Alinhar à direita">≡</button>
    <span class="format-sep"></span>
    <button type="button" data-cmd="insertUnorderedList" title="Lista">•☰</button><button type="button" data-cmd="insertOrderedList" title="Lista numerada">1☰</button><button type="button" id="diaryChecklistBtn" title="Checklist">☐</button>
    <span class="format-sep"></span>
    <button type="button" data-cmd="undo" title="Desfazer">↶</button><button type="button" data-cmd="redo" title="Refazer">↷</button>
    <span class="format-sep"></span>
    <div class="diary-view-switch"><button type="button" data-view="page">📄 Página</button><button type="button" data-view="book">📖 <span>Modo </span>Diário</button></div>`
  bar.appendChild(tools)
  tools.querySelectorAll('[data-cmd]').forEach(b=>b.addEventListener('click',()=>exec(b.dataset.cmd)))
  $('diaryTextStyle').addEventListener('change',e=>formatBlock(e.target.value))
  $('diaryFontSize').addEventListener('change',e=>setFontSize(Number(e.target.value)))
  $('diaryChecklistBtn').addEventListener('click',insertChecklist)
  tools.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.view;applyView()}))
  applyView()
}
function makeTopActions(){
  const desk=document.querySelector('.diary-desk');if(!desk||desk.querySelector('.diary-top-actions'))return
  const top=document.createElement('div');top.className='diary-top-actions';top.innerHTML=`<button class="diary-back-chat" type="button" id="diaryBackChat">← Voltar ao chat</button><div class="diary-quote">“Pequenos registros, grandes histórias… ♡”</div><button class="diary-back-chat" type="button" id="diaryTopLock">🔒 Fechar diário</button>`
  desk.prepend(top);$('diaryBackChat').onclick=backToChat;$('diaryTopLock').onclick=()=>$('lockDiaryBtn')?.click()
}
function enhancePostitDrawer(){
  const drawer=document.querySelector('.postit-drawer');if(!drawer||drawer.dataset.innerV3)return;drawer.dataset.innerV3='1'
  const h=drawer.querySelector('h3');if(h)h.textContent='Post-its 3D 📌'
  const p=drawer.querySelector('p');if(p)p.textContent='Escolha uma cor, escreva e prenda na folha. Depois você pode arrastar, editar ou recolher.'
}
function enhanceMood(){
  const group=$('moodGroup');if(!group||group.dataset.innerV3)return;group.dataset.innerV3='1';group.setAttribute('title','Como me sinto hoje?')
}
function responsiveView(){if(matchMedia('(max-width:760px)').matches&&view==='book'){document.body.classList.add('diary-mobile-single')}else document.body.classList.remove('diary-mobile-single')}
function start(){makeTopActions();makeToolbar();enhancePostitDrawer();enhanceMood();responsiveView()}
start();window.addEventListener('resize',responsiveView,{passive:true});window.addEventListener('isa-diary-opened',()=>setTimeout(start,0));window.addEventListener('isa-diary-entry-changed',()=>setTimeout(start,0))
