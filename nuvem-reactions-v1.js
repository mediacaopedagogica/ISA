/* Restaura a paleta pedida sem duplicar o mecanismo de reações existente. */
(function(){
  if(window.__NUVEM_REACTIONS_V1__)return;window.__NUVEM_REACTIONS_V1__=true;
  const palette=['🩷','🩵','💜','😂','😍','🌸','✨'];
  function apply(){
    const picker=document.getElementById('miReactionPicker');
    if(picker){[...picker.querySelectorAll('button[data-mi-react]')].forEach((b,i)=>{const emoji=palette[i]||palette[0];b.dataset.miReact=emoji;b.textContent=emoji;b.title=`Reagir com ${emoji}`;b.setAttribute('aria-label',`Reagir com ${emoji}`)})}
    window.__ISA_REFRESH_MESSAGE_INTERACTIONS__?.();
  }
  const observer=new MutationObserver(()=>apply());observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(apply,900);setTimeout(apply,1800);setTimeout(apply,3200);setInterval(()=>{if(document.visibilityState==='visible')apply()},5000);
})();
