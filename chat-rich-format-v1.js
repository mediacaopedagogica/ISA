// Cantinho da Isa — formatação rica segura + cores por participante.
const $=id=>document.getElementById(id)
const PALETTE=['#fff0f6','#efe7ff','#e7f1ff','#e8f8ef','#fff6cf','#fce9ff','#e8f8f7','#fff0e3']
const FONT_MAP={rounded:'ui-rounded, "Segoe UI", system-ui, sans-serif',clean:'Inter, "Segoe UI", system-ui, sans-serif',serif:'Georgia, "Times New Roman", serif',mono:'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',hand:'"Comic Sans MS", "Segoe Print", cursive'}
let formatTimer=0

function ensureCss(){
  if($('chatRichFormatCss'))return
  const l=document.createElement('link');l.id='chatRichFormatCss';l.rel='stylesheet';l.href='./chat-rich-format-v1.css?v=1';document.head.appendChild(l)
}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function hash(s){let h=0;for(const ch of String(s||'')){h=((h<<5)-h)+ch.codePointAt(0);h|=0}return Math.abs(h)}
function stripTokens(s){
  return String(s??'')
    .replace(/^\s*\[important\]\s*/i,'')
    .replace(/\[(?:b|i|u|\/b|\/i|\/u)\]/gi,'')
    .replace(/\[(?:c|m)=#[0-9a-f]{6}\]|\[\/(?:c|m)\]/gi,'')
    .replace(/\[f=(?:rounded|clean|serif|mono|hand)\]|\[\/f\]/gi,'')
    .replace(/\[s=(?:8[0-9]|9[0-9]|1[0-7][0-9]|180)\]|\[\/s\]/gi,'')
}
window.__ISA_STRIP_MESSAGE_FORMATTING__=stripTokens

function formatHtml(raw){
  let text=String(raw??''),important=false
  if(/^\s*\[important\]/i.test(text)){important=true;text=text.replace(/^\s*\[important\]\s*/i,'')}
  let html=esc(text)
  html=html.replace(/\[b\]/gi,'<strong>').replace(/\[\/b\]/gi,'</strong>')
  html=html.replace(/\[i\]/gi,'<em>').replace(/\[\/i\]/gi,'</em>')
  html=html.replace(/\[u\]/gi,'<u>').replace(/\[\/u\]/gi,'</u>')
  html=html.replace(/\[c=(#[0-9a-f]{6})\]/gi,'<span style="color:$1">').replace(/\[\/c\]/gi,'</span>')
  html=html.replace(/\[m=(#[0-9a-f]{6})\]/gi,'<mark style="background:$1">').replace(/\[\/m\]/gi,'</mark>')
  html=html.replace(/\[f=(rounded|clean|serif|mono|hand)\]/gi,(_,k)=>`<span style="font-family:${FONT_MAP[String(k).toLowerCase()]}">`).replace(/\[\/f\]/gi,'</span>')
  html=html.replace(/\[s=(8[0-9]|9[0-9]|1[0-7][0-9]|180)\]/gi,(_,n)=>`<span style="font-size:${Number(n)}%">`).replace(/\[\/s\]/gi,'</span>')
  html=html.replace(/\n/g,'<br>')
  return{html,important}
}
function findTextNode(row){
  const b=row.querySelector('.bubble,.friend-bubble');if(!b)return null
  const kids=[...b.children]
  return kids.find(x=>x.tagName==='DIV'&&!x.matches('.photo-loading,.photo-expired,.friend-photo-wrap,.friend-audio-wrap,.mi-reaction-summary,[data-family-photo],[data-family-audio]'))||null
}
function senderName(row){return String(row.querySelector('.sender,.friend-sender')?.textContent||'').trim()}
function decorateRow(row){
  const b=row.querySelector('.bubble,.friend-bubble');if(!b)return
  const mine=row.classList.contains('mine')
  if(mine){row.style.setProperty('--mi-sender-bg','#eadcff');row.dataset.miSide='mine'}
  else{
    const name=senderName(row)||'Família';const bg=PALETTE[hash(name)%PALETTE.length]
    row.style.setProperty('--mi-sender-bg',bg);row.dataset.miSide='other';row.dataset.miSender=name
  }
  const node=findTextNode(row);if(!node||node.dataset.miFormatted==='1')return
  const raw=node.textContent||'';node.dataset.miRaw=raw;node.dataset.miFormatted='1';node.classList.add('mi-rich-text')
  const out=formatHtml(raw);node.innerHTML=out.html
  if(out.important){row.classList.add('mi-important-message');const flag=document.createElement('div');flag.className='mi-important-flag';flag.textContent='❗ IMPORTANTE';b.insertBefore(flag,node)}
}
function refreshRows(){
  document.querySelectorAll('#messages .message-row,#friendMessages .friend-msg').forEach(decorateRow)
}
function toast(text){
  const t=$('friendToast')||$('toast');if(!t)return
  t.textContent=text;t.classList.remove('hidden');clearTimeout(t._rf);t._rf=setTimeout(()=>t.classList.add('hidden'),2200)
}
function wrapSelection(input,open,close){
  if(!input)return
  const start=input.selectionStart??input.value.length,end=input.selectionEnd??start
  const value=input.value||'',selected=value.slice(start,end)
  input.value=value.slice(0,start)+open+selected+close+value.slice(end)
  const caret=selected?start+open.length+selected.length+close.length:start+open.length
  input.focus();input.setSelectionRange(caret,caret);input.dispatchEvent(new Event('input',{bubbles:true}))
}
function toggleImportant(input,btn){
  if(!input)return
  if(/^\s*\[important\]/i.test(input.value)){input.value=input.value.replace(/^\s*\[important\]\s*/i,'');btn?.classList.remove('active')}
  else{input.value='[important] '+input.value;btn?.classList.add('active')}
  input.focus();input.dispatchEvent(new Event('input',{bubbles:true}))
}
function toolbarHtml(){return `
  <div class="mi-format-scroll" aria-label="Formatação da mensagem">
    <button type="button" class="mi-fmt-btn" data-fmt="b" title="Negrito"><strong>B</strong></button>
    <button type="button" class="mi-fmt-btn" data-fmt="i" title="Itálico"><em>I</em></button>
    <button type="button" class="mi-fmt-btn" data-fmt="u" title="Sublinhado"><u>U</u></button>
    <button type="button" class="mi-fmt-btn" data-fmt="small" title="Diminuir trecho selecionado">A−</button>
    <button type="button" class="mi-fmt-btn" data-fmt="large" title="Aumentar trecho selecionado">A+</button>
    <label class="mi-fmt-select-wrap" title="Mudar tipografia"><span>Aa</span><select data-fmt-font aria-label="Tipografia"><option value="">Tipografia</option><option value="rounded">Arredondada</option><option value="clean">Limpa</option><option value="serif">Clássica</option><option value="mono">Mono</option><option value="hand">Divertida</option></select></label>
    <label class="mi-color-wrap" title="Cor da letra"><span>Cor</span><input type="color" data-fmt-color value="#6b4d75" aria-label="Cor da letra"></label>
    <button type="button" class="mi-fmt-btn mi-highlight-btn" data-fmt="highlight" title="Grifar com a cor escolhida">🖍️ Grifar</button>
    <label class="mi-color-wrap" title="Cor do marca-texto"><span>Marca-texto</span><input type="color" data-fmt-mark value="#fff09a" aria-label="Cor do marca-texto"></label>
    <button type="button" class="mi-fmt-btn mi-important-btn" data-fmt="important" title="Marcar toda a mensagem como importante">❗ Importante</button>
  </div>`}
function bindToolbar(host,input){
  if(!host||!input||host.querySelector('.mi-format-toolbar'))return
  host.classList.add('mi-has-format')
  const bar=document.createElement('div');bar.className='mi-format-toolbar';bar.innerHTML=toolbarHtml();host.prepend(bar)
  const mark=bar.querySelector('[data-fmt-mark]')
  bar.querySelectorAll('[data-fmt]').forEach(btn=>btn.addEventListener('click',()=>{
    const kind=btn.dataset.fmt
    if(kind==='b')wrapSelection(input,'[b]','[/b]')
    if(kind==='i')wrapSelection(input,'[i]','[/i]')
    if(kind==='u')wrapSelection(input,'[u]','[/u]')
    if(kind==='small')wrapSelection(input,'[s=90]','[/s]')
    if(kind==='large')wrapSelection(input,'[s=125]','[/s]')
    if(kind==='highlight')wrapSelection(input,`[m=${mark?.value||'#fff09a'}]`,'[/m]')
    if(kind==='important')toggleImportant(input,btn)
  }))
  bar.querySelector('[data-fmt-font]')?.addEventListener('change',e=>{const v=e.target.value;if(v){wrapSelection(input,`[f=${v}]`,'[/f]');e.target.value=''}})
  bar.querySelector('[data-fmt-color]')?.addEventListener('change',e=>wrapSelection(input,`[c=${e.target.value}]`,'[/c]'))
  mark?.addEventListener('change',()=>toast('Cor do marca-texto escolhida. Selecione um trecho e toque em “Grifar”.'))
  input.addEventListener('input',()=>{const btn=bar.querySelector('[data-fmt="important"]');btn?.classList.toggle('active',/^\s*\[important\]/i.test(input.value))})
}
function ensureToolbars(){
  bindToolbar($('composer'),$('messageInput'))
  bindToolbar(document.querySelector('.friend-composer'),$('friendMessageInput'))
}
function initObservers(){
  const main=$('messages');if(main)new MutationObserver(()=>{clearTimeout(formatTimer);formatTimer=setTimeout(refreshRows,70)}).observe(main,{childList:true,subtree:true})
  const ext=$('friendMessages');if(ext)new MutationObserver(()=>{clearTimeout(formatTimer);formatTimer=setTimeout(refreshRows,70)}).observe(ext,{childList:true,subtree:true})
}
ensureCss();ensureToolbars();refreshRows();initObservers()
setTimeout(()=>{ensureToolbars();refreshRows()},450)
setInterval(()=>{if(document.visibilityState==='visible'){ensureToolbars();refreshRows()}},3500)
window.__ISA_REFRESH_RICH_CHAT__=()=>{ensureToolbars();refreshRows()}
