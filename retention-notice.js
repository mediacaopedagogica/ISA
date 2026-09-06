function ensureRetentionCss(){if(document.querySelector('link[href^="retention-notice.css"]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href='retention-notice.css?v=1';document.head.appendChild(l)}
let retentionTimer=null
function showRetentionCloud(kind='documento'){
  ensureRetentionCss();let el=document.getElementById('retentionCloud');
  if(!el){el=document.createElement('div');el.id='retentionCloud';el.className='retention-cloud';el.setAttribute('role','status');el.setAttribute('aria-live','polite');document.body.appendChild(el)}
  const target=kind==='apresentacao'?'PowerPoint':'PDF';
  el.innerHTML=`<span class="retention-dot"></span><strong>Arquivo temporário.</strong> Este arquivo fica salvo por até 7 dias. Baixe em ${target} para guardar uma cópia.`;
  clearTimeout(retentionTimer);el.classList.remove('show');requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('show')));
  retentionTimer=setTimeout(()=>el.classList.remove('show'),6500)
}
document.addEventListener('click',e=>{
  const doc=e.target.closest('#openDocumentTool');if(doc){showRetentionCloud('documento');return}
  const pres=e.target.closest('#openPresentationTool');if(pres)showRetentionCloud('apresentacao')
},{capture:true})
window.showRetentionCloud=showRetentionCloud
