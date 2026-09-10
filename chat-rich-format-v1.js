// Cantinho da Isa — formatação rica contextual: selecione o texto para ver as opções.
const $=id=>document.getElementById(id)
const PALETTE=['#fff0f6','#efe7ff','#e7f1ff','#e8f8ef','#fff6cf','#fce9ff','#e8f8f7','#fff0e3']
const FONT_MAP={rounded:'ui-rounded, "Segoe UI", system-ui, sans-serif',clean:'Inter, "Segoe UI", system-ui, sans-serif',serif:'Georgia, "Times New Roman", serif',mono:'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',hand:'"Comic Sans MS", "Segoe Print", cursive'}
let formatTimer=0

function ensureCss(){if($('chatRichFormatCss'))return;const l=document.createElement('link');l.id='chatRichFormatCss';l.rel='stylesheet';l.href='./chat-rich-format-v1.css?v=4-selection-popover';document.head.appendChild(l)}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function hash(s){let h=0;for(const ch of String(s||'')){h=((h<<5)-h)+ch.codePointAt(0);h|=0}return Math.abs(h)}
function stripTokens(s){return String(s??'').replace(/^\s*\[important\]\s*/i,'').replace(/\[(?:b|i|u|\/b|\/i|\/u)\]/gi,'').replace(/\[(?:c|m)=#[0-9a-f]{6}\]|\[\/(?:c|m)\]/gi,'').replace(/\[f=(?:rounded|clean|serif|mono|hand)\]|\[\/f\]/gi,'').replace(/\[s=(?:8[0-9]|9[0-9]|1[0-7][0-9]|180)\]|\[\/s\]/gi,'')}
window.__ISA_STRIP_MESSAGE_FORMATTING__=stripTokens

function formatHtml(raw){
  let text=String(raw??''),important=false
  if(/^\s*\[important\]/i.test(text)){important=true;text=text.replace(/^\s*\[important\]\s*/i,'')}
  let html=esc(text)
  html=html.replace(/\[b\]/gi,'<strong>').replace(/\[\/b\]/gi,'</strong>')
    .replace(/\[i\]/gi,'<em>').replace(/\[\/i\]/gi,'</em>')
    .replace(/\[u\]/gi,'<u>').replace(/\[\/u\]/gi,'</u>')
    .replace(/\[c=(#[0-9a-f]{6})\]/gi,'<span style="color:$1">').replace(/\[\/c\]/gi,'</span>')
    .replace(/\[m=(#[0-9a-f]{6})\]/gi,'<mark style="background:$1">').replace(/\[\/m\]/gi,'</mark>')
    .replace(/\[f=(rounded|clean|serif|mono|hand)\]/gi,(_,k)=>`<span style="font-family:${FONT_MAP[String(k).toLowerCase()]}">`).replace(/\[\/f\]/gi,'</span>')
    .replace(/\[s=(8[0-9]|9[0-9]|1[0-7][0-9]|180)\]/gi,(_,n)=>`<span style="font-size:${Number(n)}%">`).replace(/\[\/s\]/gi,'</span>')
    .replace(/\n/g,'<br>')
  return{html,important}
}
function findTextNode(row){const b=row.querySelector('.bubble,.friend-bubble');if(!b)return null;const kids=[...b.children];return kids.find(x=>x.tagName==='DIV'&&!x.matches('.photo-loading,.photo-expired,.friend-photo-wrap,.friend-audio-wrap,.mi-reaction-summary,[data-family-photo],[data-family-audio]'))||null}
function senderName(row){return String(row.querySelector('.sender,.friend-sender')?.textContent||'').trim()}
function decorateRow(row){
  const b=row.querySelector('.bubble,.friend-bubble');if(!b)return
  const mine=row.classList.contains('mine')
  if(mine){row.style.setProperty('--mi-sender-bg','#eadcff');row.dataset.miSide='mine'}
  else{const name=senderName(row)||'Família';row.style.setProperty('--mi-sender-bg',PALETTE[hash(name)%PALETTE.length]);row.dataset.miSide='other';row.dataset.miSender=name}
  const node=findTextNode(row);if(!node||node.dataset.miFormatted==='1')return
  const raw=node.textContent||'';node.dataset.miRaw=raw;node.dataset.miFormatted='1';node.classList.add('mi-rich-text')
  const out=formatHtml(raw);node.innerHTML=out.html
  if(out.important){row.classList.add('mi-important-message');const flag=document.createElement('div');flag.className='mi-important-flag';flag.textContent='❗ IMPORTANTE';b.insertBefore(flag,node)}
}
function refreshRows(){document.querySelectorAll('#messages .message-row,#friendMessages .friend-msg').forEach(decorateRow)}
function toast(text){const t=$('friendToast')||$('toast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._rf);t._rf=setTimeout(()=>t.classList.add('hidden'),2200)}
function cleanEmptyTokens(input){
  if(!input)return
  let v=input.value||'',next=v
  for(let i=0;i<3;i++)next=next.replace(/\[(b|i|u)\]\s*\[\/\1\]/gi,'').replace(/\[(?:m|c)=#[0-9a-f]{6}\]\s*\[\/(?:m|c)\]/gi,'').replace(/\[f=(?:rounded|clean|serif|mono|hand)\]\s*\[\/f\]/gi,'').replace(/\[s=(?:8[0-9]|9[0-9]|1[0-7][0-9]|180)\]\s*\[\/s\]/gi,'')
  if(next!==v){input.value=next;input.dispatchEvent(new Event('input',{bubbles:true}))}
}
function snapshotSelection(input){
  if(!input)return null
  const start=input.selectionStart??0,end=input.selectionEnd??0
  input._miSelection={start,end}
  return input._miSelection
}
function hasSelection(input){const s=input?._miSelection||snapshotSelection(input);return !!s&&s.end>s.start&&String(input.value||'').slice(s.start,s.end).trim().length>0}
function hideToolbar(host){host?.querySelector('.mi-format-toolbar')?.classList.remove('mi-selection-active')}
function showToolbar(host,input){
  if(!host||!input)return
  snapshotSelection(input)
  const bar=host.querySelector('.mi-format-toolbar')
  if(!bar)return
  bar.classList.toggle('mi-selection-active',hasSelection(input))
}
function wrapSelection(input,open,close,host){
  if(!input)return false
  const s=input._miSelection||snapshotSelection(input),start=s?.start??0,end=s?.end??0
  if(end<=start){cleanEmptyTokens(input);hideToolbar(host);return false}
  const value=input.value||'',selected=value.slice(start,end)
  if(!selected.trim()){hideToolbar(host);return false}
  input.value=value.slice(0,start)+open+selected+close+value.slice(end)
  const selStart=start+open.length,selEnd=selStart+selected.length
  input.focus();input.setSelectionRange(selStart,selEnd);input._miSelection={start:selStart,end:selEnd};input.dispatchEvent(new Event('input',{bubbles:true}));hideToolbar(host);return true
}
function toggleImportant(input,btn,host){
  if(!input)return
  cleanEmptyTokens(input)
  if(/^\s*\[important\]/i.test(input.value)){input.value=input.value.replace(/^\s*\[important\]\s*/i,'');btn?.classList.remove('active')}
  else if((input.value||'').trim()){input.value='[important] '+input.value;btn?.classList.add('active')}
  else return
  input.focus();input.dispatchEvent(new Event('input',{bubbles:true}));hideToolbar(host)
}
function toolbarHtml(){return `<div class="mi-format-scroll" aria-label="Formatar trecho selecionado">
<button type="button" class="mi-fmt-btn" data-fmt="b" title="Negrito" aria-label="Negrito"><strong>B</strong></button>
<button type="button" class="mi-fmt-btn" data-fmt="i" title="Itálico" aria-label="Itálico"><em>I</em></button>
<button type="button" class="mi-fmt-btn" data-fmt="u" title="Sublinhado" aria-label="Sublinhado"><u>U</u></button>
<button type="button" class="mi-fmt-btn" data-fmt="small" title="Diminuir" aria-label="Diminuir texto">A−</button>
<button type="button" class="mi-fmt-btn" data-fmt="large" title="Aumentar" aria-label="Aumentar texto">A+</button>
<label class="mi-fmt-select-wrap" title="Tipografia"><span>Aa</span><select data-fmt-font aria-label="Tipografia"><option value="">Fonte</option><option value="rounded">Arredondada</option><option value="clean">Limpa</option><option value="serif">Clássica</option><option value="mono">Mono</option><option value="hand">Divertida</option></select></label>
<label class="mi-color-wrap" title="Cor da letra"><span>🎨</span><input type="color" data-fmt-color value="#6b4d75" aria-label="Cor da letra"></label>
<label class="mi-color-wrap" title="Marca-texto"><span>🖍️</span><input type="color" data-fmt-mark value="#fff09a" aria-label="Cor do marca-texto"></label>
<button type="button" class="mi-fmt-btn mi-highlight-btn" data-fmt="highlight" title="Grifar" aria-label="Grifar">▰</button>
<button type="button" class="mi-fmt-btn mi-important-btn" data-fmt="important" title="Marcar a mensagem inteira como importante">❗</button>
</div>`}
function bindToolbar(host,input){
  if(!host||!input||host.querySelector('.mi-format-toolbar'))return
  host.classList.add('mi-has-format')
  const bar=document.createElement('div');bar.className='mi-format-toolbar';bar.innerHTML=toolbarHtml();host.appendChild(bar)
  const mark=bar.querySelector('[data-fmt-mark]')
  bar.addEventListener('pointerdown',e=>{if(!e.target.matches('select,input[type="color"]'))e.preventDefault()})
  bar.querySelectorAll('[data-fmt]').forEach(btn=>btn.addEventListener('click',()=>{
    const kind=btn.dataset.fmt
    if(kind==='b')wrapSelection(input,'[b]','[/b]',host)
    if(kind==='i')wrapSelection(input,'[i]','[/i]',host)
    if(kind==='u')wrapSelection(input,'[u]','[/u]',host)
    if(kind==='small')wrapSelection(input,'[s=90]','[/s]',host)
    if(kind==='large')wrapSelection(input,'[s=125]','[/s]',host)
    if(kind==='highlight')wrapSelection(input,`[m=${mark?.value||'#fff09a'}]`,'[/m]',host)
    if(kind==='important')toggleImportant(input,btn,host)
  }))
  bar.querySelector('[data-fmt-font]')?.addEventListener('focus',()=>snapshotSelection(input))
  bar.querySelector('[data-fmt-font]')?.addEventListener('change',e=>{const v=e.target.value;if(v)wrapSelection(input,`[f=${v}]`,'[/f]',host);e.target.value=''})
  bar.querySelector('[data-fmt-color]')?.addEventListener('focus',()=>snapshotSelection(input))
  bar.querySelector('[data-fmt-color]')?.addEventListener('change',e=>wrapSelection(input,`[c=${e.target.value}]`,'[/c]',host))
  mark?.addEventListener('focus',()=>snapshotSelection(input))
  const update=()=>requestAnimationFrame(()=>showToolbar(host,input))
  ;['select','mouseup','keyup','touchend'].forEach(ev=>input.addEventListener(ev,update,{passive:ev==='touchend'}))
  input.addEventListener('input',()=>{cleanEmptyTokens(input);snapshotSelection(input);hideToolbar(host);const btn=bar.querySelector('[data-fmt="important"]');btn?.classList.toggle('active',/^\s*\[important\]/i.test(input.value))})
  input.addEventListener('blur',()=>setTimeout(()=>{if(!bar.matches(':hover')&&!bar.contains(document.activeElement))hideToolbar(host)},140))
}
function ensureToolbars(){bindToolbar($('composer'),$('messageInput'));bindToolbar(document.querySelector('.friend-composer'),$('friendMessageInput'))}
function initObservers(){const main=$('messages');if(main)new MutationObserver(()=>{clearTimeout(formatTimer);formatTimer=setTimeout(refreshRows,70)}).observe(main,{childList:true,subtree:true});const ext=$('friendMessages');if(ext)new MutationObserver(()=>{clearTimeout(formatTimer);formatTimer=setTimeout(refreshRows,70)}).observe(ext,{childList:true,subtree:true})}
document.addEventListener('pointerdown',e=>{if(e.target.closest?.('.mi-format-toolbar'))return;document.querySelectorAll('.mi-format-toolbar').forEach(b=>{const input=b.closest('.composer,.friend-composer')?.querySelector('textarea');if(input&&document.activeElement!==input)b.classList.remove('mi-selection-active')})},{capture:true})
ensureCss();ensureToolbars();refreshRows();initObservers();setTimeout(()=>{ensureToolbars();refreshRows()},450)
setInterval(()=>{if(document.visibilityState==='visible'){ensureToolbars();refreshRows()}},4000)
window.__ISA_REFRESH_RICH_CHAT__=()=>{ensureToolbars();refreshRows()}
