// Nossa Rede: remove atalhos duplicados de perfil/configurações do cabeçalho.
// Esses acessos já ficam no menu lateral; aqui permanecem apenas corações/flores decorativos.
(function(){
  if(window.__ISA_NOSSA_REDE_HEADER_CLEANUP_V1__)return;
  window.__ISA_NOSSA_REDE_HEADER_CLEANUP_V1__=true;
  const $=id=>document.getElementById(id);

  function css(){
    if($('nossaRedeHeaderCleanupCss'))return;
    const s=document.createElement('style');s.id='nossaRedeHeaderCleanupCss';s.textContent=`
      #socialPanel .isa-social-head-actions button,
      #familySocialOverlay .isa-social-head-actions button,
      #socialPanel .isa-social-head-actions [data-spd-open],
      #familySocialOverlay .isa-social-head-actions [data-spd-open]{display:none!important}
      #socialPanel .isa-social-head-actions,
      #familySocialOverlay .isa-social-head-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:8px!important;pointer-events:none!important;min-width:108px!important}
      .nuvem-head-decor{display:flex;align-items:center;gap:7px;pointer-events:none;user-select:none}
      .nuvem-head-decor span{display:grid;place-items:center;width:31px;height:31px;border-radius:50%;font-size:18px;border:1px solid rgba(255,255,255,.92);box-shadow:0 5px 12px rgba(101,72,119,.06);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px)}
      .nuvem-head-decor .heart-pink{color:#ef91c1;background:rgba(255,221,238,.48)}
      .nuvem-head-decor .flower{background:rgba(242,226,255,.52);filter:saturate(.78)}
      .nuvem-head-decor .heart-blue{color:#8cc8e8;background:rgba(220,242,255,.52)}
      @media(max-width:760px){#socialPanel .isa-social-head-actions,#familySocialOverlay .isa-social-head-actions{min-width:88px!important;gap:5px!important}.nuvem-head-decor{gap:5px}.nuvem-head-decor span{width:27px;height:27px;font-size:16px}}
    `;document.head.appendChild(s)
  }

  function cleanRoot(root){
    if(!root)return;
    const host=root.querySelector('.isa-social-head-actions');if(!host)return;
    host.querySelectorAll('button,[data-spd-open]').forEach(x=>x.style.setProperty('display','none','important'));
    let d=host.querySelector('.nuvem-head-decor');
    if(!d){d=document.createElement('div');d.className='nuvem-head-decor';d.setAttribute('aria-hidden','true');d.innerHTML='<span class="heart-pink">♡</span><span class="flower">🌸</span><span class="heart-blue">♡</span>';host.appendChild(d)}
  }
  function clean(){css();cleanRoot($('socialPanel'));cleanRoot($('familySocialOverlay'))}
  clean();
  const o=new MutationObserver(()=>{clearTimeout(o._t);o._t=setTimeout(clean,50)});o.observe(document.documentElement,{childList:true,subtree:true});
  [300,800,1600,3200].forEach(ms=>setTimeout(clean,ms));
  window.__ISA_NOSSA_REDE_HEADER_CLEANUP__=clean;
})();
