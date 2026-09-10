/* Paleta visual de reações do Isa Chat — mesma família de emojis da Nossa Rede. */
(function(){
  if(window.__NUVEM_REACTIONS_V3__)return;
  window.__NUVEM_REACTIONS_V3__=true;
  const palette=['🩷','🩵','💜','❤️','😂','😍','🌸','🥰','✨','👏','👍','😢','🙏','😡','🤩','😭','🤔','🥳','😱','😮'];
  function apply(){
    const picker=document.getElementById('miReactionPicker');
    if(!picker)return false;
    if(picker.dataset.nuvemFullPalette!=='1'){
      picker.dataset.nuvemFullPalette='1';
      picker.innerHTML=palette.map(e=>`<button type="button" data-mi-react="${e}" title="Reagir com ${e}" aria-label="Reagir com ${e}">${e}</button>`).join('');
      picker.querySelectorAll('[data-mi-react]').forEach(b=>b.addEventListener('click',()=>{}, {passive:true}));
    }
    return true;
  }
  apply();
  [120,350,800,1600,2800].forEach(ms=>setTimeout(apply,ms));
  document.addEventListener('isa:chat-opened',apply,{passive:true});
  window.__ISA_NUVEM_REACTIONS__={apply,palette};
})();
