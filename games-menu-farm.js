// Fazendinha Família Feliz permanece em desenvolvimento.
// Enquanto a Keise não liberar novamente, o jogo NÃO aparece no menu da Isa.
const removeFarmCard=()=>{
  document.querySelectorAll('[data-game="farm"]').forEach(el=>el.remove());
};
removeFarmCard();
const observer=new MutationObserver(removeFarmCard);
observer.observe(document.documentElement,{childList:true,subtree:true});
