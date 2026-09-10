/* Paleta visual de reações do Isa Chat — mesma família de emojis da Nossa Rede, sem substituir handlers. */
(function(){
  if(window.__NUVEM_REACTIONS_V4__)return;
  window.__NUVEM_REACTIONS_V4__=true;
  const palette=['🩷','🩵','💜','❤️','😂','😍','🌸','🥰','✨','👏','👍','😢','🙏','😡','🤩','😭','🤔','🥳','😱','😮'];
  function apply(){
    const picker=document.getElementById('miReactionPicker');
    if(!picker)return false;
    const buttons=[...picker.querySelectorAll('button[data-mi-react]')];
    if(!buttons.length)return false;
    buttons.forEach((b,i)=>{
      const emoji=palette[i]||b.dataset.miReact||'💜';
      b.dataset.miReact=emoji;
      b.textContent=emoji;
      b.title=`Reagir com ${emoji}`;
      b.setAttribute('aria-label',`Reagir com ${emoji}`);
    });
    return true;
  }
  apply();
  [120,350,800,1600,2800].forEach(ms=>setTimeout(apply,ms));
  document.addEventListener('isa:chat-opened',apply,{passive:true});
  window.__ISA_NUVEM_REACTIONS__={apply,palette};
})();
