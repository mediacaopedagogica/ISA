// Limpa atalhos duplicados do topo dos acessos familiares externos.
// Perfil/configurações continuam somente no menu principal; o espaço vira decoração pastel sem clique.
(function(){
  if(window.__ISA_EXTERNAL_DECOR_CLEANUP_V1__)return;
  window.__ISA_EXTERNAL_DECOR_CLEANUP_V1__=true;
  const $=id=>document.getElementById(id);

  function style(){
    if($('externalDecorCleanupCss'))return;
    const s=document.createElement('style');s.id='externalDecorCleanupCss';s.textContent=`
      .friend-profile-quick,#friendProfileMenuBtn,#friendStickerMenuBtn,.friend-profile .pss-profile-edit{display:none!important}
      .friend-settings-menu:not(.family-primary-nav .friend-settings-menu){display:none!important}
      .friend-pastel-decor{margin-left:auto;display:flex;align-items:center;gap:7px;pointer-events:none;user-select:none;opacity:.72}
      .friend-pastel-decor span{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;font-size:18px;filter:saturate(.86);background:rgba(255,255,255,.5);border:1px solid rgba(255,255,255,.8);box-shadow:0 4px 10px rgba(103,75,119,.06)}
      .friend-pastel-decor span:nth-child(1){color:#ef9bc8}.friend-pastel-decor span:nth-child(2){color:#b69be6}.friend-pastel-decor span:nth-child(3){color:#8fcbe7}
      @media(max-width:780px){.friend-pastel-decor{gap:4px}.friend-pastel-decor span{width:23px;height:23px;font-size:15px}}
    `;document.head.appendChild(s)
  }

  function clean(){
    style();
    $('friendProfileQuickBtn')?.remove();$('friendProfileMenuBtn')?.remove();$('friendStickerMenuBtn')?.remove();
    document.querySelectorAll('.friend-profile .pss-profile-edit').forEach(x=>x.remove());
    document.querySelectorAll('.friend-settings-menu').forEach(x=>{if(!x.closest('.family-primary-nav'))x.remove()});
    const host=document.querySelector('.friend-profile');if(!host)return;
    let d=host.querySelector('.friend-pastel-decor');
    if(!d){d=document.createElement('div');d.className='friend-pastel-decor';d.setAttribute('aria-hidden','true');d.innerHTML='<span>♡</span><span>🌸</span><span>♡</span>';const exit=$('friendExitBtn');if(exit)host.insertBefore(d,exit);else host.appendChild(d)}
  }

  clean();
  const o=new MutationObserver(()=>{clearTimeout(o._t);o._t=setTimeout(clean,60)});o.observe(document.documentElement,{childList:true,subtree:true});
  [300,900,1800,3600].forEach(ms=>setTimeout(clean,ms));
  window.__ISA_EXTERNAL_DECOR_CLEANUP__=clean;
})();
