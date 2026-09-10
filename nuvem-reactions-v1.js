/* Paleta 3D pedida para reações, sem observer global nem refresh recursivo. */
(function(){
  if(window.__NUVEM_REACTIONS_V2__)return;
  window.__NUVEM_REACTIONS_V2__=true;
  const palette=['🩷','🩵','💜','😂','😍','🌸','✨'];
  function apply(){
    const picker=document.getElementById('miReactionPicker');
    if(!picker)return false;
    const buttons=[...picker.querySelectorAll('button[data-mi-react]')];
    if(!buttons.length)return false;
    buttons.forEach((b,i)=>{
      const emoji=palette[i]||palette[0];
      if(b.dataset.miReact!==emoji)b.dataset.miReact=emoji;
      if(b.textContent!==emoji)b.textContent=emoji;
      b.title=`Reagir com ${emoji}`;
      b.setAttribute('aria-label',`Reagir com ${emoji}`);
    });
    return true;
  }
  apply();
  [120,350,800,1600,2800].forEach(ms=>setTimeout(apply,ms));
  document.addEventListener('isa:chat-opened',apply,{passive:true});
  window.__ISA_NUVEM_REACTIONS__={apply};
})();
