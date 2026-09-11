// Nossa Rede: o + não escolhe destino. Story, capa e publicação já têm seus próprios lugares.
(function(){
  'use strict'
  if(window.__ISA_NOSSA_REDE_MENU_CLEANUP_V2__)return
  window.__ISA_NOSSA_REDE_MENU_CLEANUP_V2__=true

  function clean(root=document){
    root.querySelectorAll?.('.nuvem-compose-menu').forEach(menu=>{
      menu.querySelectorAll('[data-isa-media-destination="story"],[data-isa-media-destination="cover"],[data-nuvem-compose="upload"]').forEach(el=>el.remove())
    })
  }

  let queued=false
  const schedule=()=>{
    if(queued)return
    queued=true
    requestAnimationFrame(()=>{queued=false;clean(document)})
  }

  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true})
  document.addEventListener('click',e=>{
    if(e.target.closest?.('.nuvem-compose-plus,.social-comment-form,.fs75-comment-form,.social-composer'))setTimeout(schedule,0)
  },true)
  clean();setTimeout(schedule,150);setTimeout(schedule,700)
  window.__ISA_NOSSA_REDE_MENU_CLEANUP__={clean,schedule}
})();
