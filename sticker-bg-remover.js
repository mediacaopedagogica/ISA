// Removedor de fundo do Criador de Stickers.
// Processa a foto no próprio navegador e devolve PNG transparente ao editor já existente.
const $=id=>document.getElementById(id)
let originalFile=null
let applyingProcessed=false
let busy=false
let removerPromise=null

function ensureStyle(){
  if($('pssBgRemoveStyle'))return
  const s=document.createElement('style');s.id='pssBgRemoveStyle';s.textContent=`
  .pss-bgremove-box{display:grid;gap:7px;padding:10px;border-radius:15px;background:linear-gradient(145deg,#f8f1ff,#eef8ff);border:1px solid #e7daf0}.pss-bgremove-actions{display:flex;gap:7px;flex-wrap:wrap}.pss-bgremove-actions button{flex:1;min-width:125px;border:0;border-radius:12px;padding:9px 11px;font-weight:900;color:#624f70;background:#fff;box-shadow:0 4px 12px #6e55751a;cursor:pointer}.pss-bgremove-actions button:first-child{background:linear-gradient(135deg,#eadcff,#dff2ff)}.pss-bgremove-actions button:disabled{opacity:.55;cursor:wait}.pss-bgremove-status{font-size:10px;line-height:1.35;color:#807087;min-height:14px}.pss-bgremove-status.ok{color:#4f8264}.pss-bgremove-status.error{color:#a34f65}
  `;document.head.appendChild(s)
}
function status(text,kind=''){
  const el=$('pssBgRemoveStatus');if(!el)return
  el.textContent=text||'';el.className=`pss-bgremove-status ${kind}`.trim()
}
function setButtons(disabled){
  const a=$('pssRemoveBgBtn'),b=$('pssRestoreBgBtn');if(a)a.disabled=disabled;if(b)b.disabled=disabled
}
function replaceInputFile(file){
  const input=$('pssStickerPhoto');if(!input||!file)return false
  try{
    const dt=new DataTransfer();dt.items.add(file)
    applyingProcessed=true;input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));applyingProcessed=false
    return true
  }catch(e){applyingProcessed=false;console.warn('Não foi possível atualizar a foto do sticker:',e);return false}
}
async function getRemover(){
  if(removerPromise)return removerPromise
  removerPromise=(async()=>{
    let mod=null,last=null
    for(const src of ['https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm','https://esm.sh/@imgly/background-removal@1.7.0?bundle']){
      try{mod=await import(src);break}catch(e){last=e}
    }
    if(!mod)throw last||new Error('Removedor indisponível')
    const fn=mod.default||mod.removeBackground
    if(typeof fn!=='function')throw new Error('Removedor indisponível')
    return fn
  })().catch(e=>{removerPromise=null;throw e})
  return removerPromise
}
async function removeBackground(){
  if(busy)return
  const input=$('pssStickerPhoto'),source=originalFile||input?.files?.[0]
  if(!source){status('Escolha uma foto primeiro.','error');return}
  busy=true;setButtons(true);status('Preparando a remoção do fundo…')
  try{
    const remove=await getRemover()
    const result=await remove(source,{
      model:'isnet_quint8',
      device:'cpu',
      output:{format:'image/png',quality:1,type:'foreground'},
      progress:(key,current,total)=>{
        if(!total)return
        const pct=Math.max(0,Math.min(100,Math.round((current/total)*100)))
        status(pct<100?`Baixando o removedor pela primeira vez… ${pct}%`:'Removendo somente o fundo…')
      }
    })
    const file=new File([result],`sticker-sem-fundo-${Date.now()}.png`,{type:'image/png',lastModified:Date.now()})
    if(!replaceInputFile(file))throw new Error('Não foi possível aplicar o recorte.')
    status('Fundo removido ✨ Confira o recorte e crie o sticker.','ok')
  }catch(e){console.warn('Removedor de fundo:',e);status('Não consegui remover o fundo nesta foto. Tente outra imagem.','error')}
  finally{busy=false;setButtons(false)}
}
function restoreOriginal(){
  if(!originalFile){status('Escolha uma foto primeiro.','error');return}
  if(replaceInputFile(originalFile))status('Foto original restaurada.','ok')
}
function captureOriginal(e){
  const input=e.target
  if(input?.id!=='pssStickerPhoto'||applyingProcessed)return
  const file=input.files?.[0]
  if(file){originalFile=file;status('Foto pronta. Você pode remover o fundo com IA.')}
}
document.addEventListener('change',captureOriginal,true)

function ensure(){
  ensureStyle()
  const input=$('pssStickerPhoto');if(!input)return false
  if($('pssRemoveBgBox'))return true
  const controls=input.closest('.pss-sticker-controls');if(!controls)return false
  const box=document.createElement('div');box.id='pssRemoveBgBox';box.className='pss-bgremove-box';box.innerHTML=`<div class="pss-bgremove-actions"><button id="pssRemoveBgBtn" type="button">🪄 Remover fundo</button><button id="pssRestoreBgBtn" type="button">↩️ Foto original</button></div><div id="pssBgRemoveStatus" class="pss-bgremove-status">A IA recorta a pessoa/objeto e deixa o fundo transparente.</div>`
  const photoLabel=input.closest('label');if(photoLabel)photoLabel.insertAdjacentElement('afterend',box);else controls.prepend(box)
  $('pssRemoveBgBtn').onclick=removeBackground;$('pssRestoreBgBtn').onclick=restoreOriginal
  const current=input.files?.[0];if(current&&!originalFile)originalFile=current
  return true
}
window.__ISA_ENSURE_STICKER_BG_REMOVER__=ensure
window.__ISA_REMOVE_STICKER_BACKGROUND__=removeBackground
ensure();document.addEventListener('DOMContentLoaded',ensure,{once:true})
let tries=0;const timer=setInterval(()=>{if(ensure()||++tries>60)clearInterval(timer)},250)
