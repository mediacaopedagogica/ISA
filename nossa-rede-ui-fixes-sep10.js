/* Correções visuais independentes da Nossa Rede: aplicadas cedo, sem alterar o layout aprovado. */
(function(){
  if(document.getElementById('isaNossaRedeSep10Fixes'))return
  const l=document.createElement('link')
  l.id='isaNossaRedeSep10Fixes'
  l.rel='stylesheet'
  l.href='./nossa-rede-media-workflow-v3.css?v=4-ui-fixes'
  document.head.appendChild(l)
})();
