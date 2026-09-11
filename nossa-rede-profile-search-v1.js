// Nossa Rede — transforma a busca do cabeçalho em acesso direto ao perfil de familiares.
(function(){
  'use strict'
  if(window.__ISA_NOSSA_REDE_PROFILE_SEARCH_V1__)return
  window.__ISA_NOSSA_REDE_PROFILE_SEARCH_V1__=true
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ')
  function style(){
    if(document.getElementById('nossaRedeProfileSearchCss'))return
    const s=document.createElement('style');s.id='nossaRedeProfileSearchCss';s.textContent='#socialPanel .isa-status-card-wrap,#familySocialOverlay .isa-status-card-wrap{display:none!important}';document.head.appendChild(s)
  }
  function toast(text){const t=document.getElementById('friendToast')||document.getElementById('toast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._profileSearch);t._profileSearch=setTimeout(()=>t.classList.add('hidden'),2400)}
  async function openByName(value){
    const term=norm(value);if(!term)return
    try{
      if(!window.__ISA_SOCIAL_PROFILE_DIRECTORY__)await import('./social-profile-directory-v1.js?v=4-header-search')
      window.__ISA_SOCIAL_PROFILE_DIRECTORY__?.open?.()
      let tries=0
      const timer=setInterval(()=>{
        const modal=document.getElementById('sppDirectoryModal'),rows=[...(modal?.querySelectorAll?.('.spd-person')||[])]
        if(rows.length){
          const hit=rows.find(b=>norm(b.querySelector('strong')?.textContent)===term)||rows.find(b=>norm(b.querySelector('strong')?.textContent).startsWith(term))||rows.find(b=>norm(b.querySelector('strong')?.textContent).includes(term))
          if(hit){clearInterval(timer);hit.click();return}
        }
        if(++tries>24){clearInterval(timer);toast('Familiar não encontrado ou não disponível para este perfil.')}
      },80)
    }catch{toast('Não foi possível buscar este perfil agora.')}
  }
  function bind(input){
    if(!input||input.dataset.familyProfileSearch==='1')return
    const fresh=input.cloneNode(true);fresh.value='';input.replaceWith(fresh)
    fresh.dataset.familyProfileSearch='1';fresh.placeholder='Buscar familiar pelo nome…';fresh.setAttribute('aria-label','Buscar perfil de familiar')
    fresh.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();openByName(fresh.value)}})
  }
  function scan(){
    style()
    document.querySelectorAll('#socialPanel .isa-social-search,#familySocialOverlay .isa-social-search').forEach(bind)
  }
  document.addEventListener('isa:social-opened',()=>setTimeout(scan,60));document.addEventListener('isa:friend-portal-entered',()=>setTimeout(scan,120))
  new MutationObserver(()=>{clearTimeout(scan._t);scan._t=setTimeout(scan,90)}).observe(document.documentElement,{childList:true,subtree:true})
  scan();setTimeout(scan,400);setTimeout(scan,1000)
  window.__ISA_NOSSA_REDE_PROFILE_SEARCH__={scan,openByName}
})();
