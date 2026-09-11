// Aniversários NÃO pertencem à tela do Chat.
// Este arquivo permanece apenas como compatibilidade para builds/cache antigos:
// se uma versão antiga tiver criado o quadro na sidebar, ele é removido.
(function(){
  'use strict'
  if(window.__ISA_EXTERNAL_BIRTHDAY_CHAT_CLEANUP_V2__)return
  window.__ISA_EXTERNAL_BIRTHDAY_CHAT_CLEANUP_V2__=true

  function cleanup(){
    document.getElementById('externalBirthdaySidebar')?.remove()
    document.querySelectorAll('.friend-sidebar .external-birthday-box,.friend-sidebar [data-birthday-sidebar]').forEach(el=>el.remove())
    document.getElementById('externalBirthdaySidebarStyle')?.remove()
  }

  cleanup()
  const sidebar=document.querySelector('.friend-sidebar')
  if(sidebar){
    const observer=new MutationObserver(()=>cleanup())
    observer.observe(sidebar,{childList:true,subtree:true})
    window.__ISA_EXTERNAL_BIRTHDAY_CHAT_OBSERVER__=observer
  }
  document.addEventListener('isa:friend-portal-entered',cleanup)
  document.addEventListener('isa:friend-access-valid',cleanup)
  setTimeout(cleanup,100);setTimeout(cleanup,700);setTimeout(cleanup,1800)

  // API compatível: chamadas antigas deixam de injetar aniversários no Chat.
  window.__ISA_EXTERNAL_BIRTHDAYS__={
    render:async()=>{cleanup();return false},
    refresh:async()=>{cleanup();return false},
    cleanup
  }
})();
