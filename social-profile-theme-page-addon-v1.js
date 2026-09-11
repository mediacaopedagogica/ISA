/* Cor do tema também na página completa do perfil, sem alterar posições/layout. */
(function(){
  'use strict'
  if(window.__ISA_PROFILE_THEME_PAGE_V2__)return;window.__ISA_PROFILE_THEME_PAGE_V2__=true
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ')
  let modalObserver=null,waits=0,timer=0
  function css(){if(document.getElementById('isaProfileThemePageCss'))return;const s=document.createElement('style');s.id='isaProfileThemePageCss';s.textContent=`
  #socialProfilePage .spp-card.isa-own-theme{--spp-accent:#c7b5ee;border-color:color-mix(in srgb,var(--spp-accent) 38%,#fff)!important;box-shadow:0 24px 60px color-mix(in srgb,var(--spp-accent) 20%,rgba(44,28,56,.18))!important}
  #socialProfilePage .spp-card.isa-own-theme .spp-head{position:relative;border-radius:20px;overflow:hidden;background:linear-gradient(135deg,color-mix(in srgb,var(--spp-accent) 14%,#fff),#fff)!important}
  #socialProfilePage .spp-card.isa-own-theme .spp-tab.active,#socialProfilePage .spp-card.isa-own-theme .spp-btn.primary{background:linear-gradient(135deg,var(--spp-accent),color-mix(in srgb,var(--spp-accent) 68%,#8d76bd))!important;color:#fff!important}
  #socialProfilePage .spp-card.isa-own-theme .spp-now{border-color:color-mix(in srgb,var(--spp-accent) 35%,#eee)!important;background:color-mix(in srgb,var(--spp-accent) 12%,#fff)!important}
  `;document.head.appendChild(s)}
  function sync(){
    css();const modal=document.getElementById('socialProfilePage'),card=modal?.querySelector('.spp-card'),head=modal?.querySelector('.spp-head'),shown=norm(document.getElementById('sppName')?.textContent),mine=norm(window.__ISA_FRIEND_PERSON__?.name||document.getElementById('myName')?.textContent||document.getElementById('friendName')?.textContent)
    if(!card||!head||!shown||!mine)return false
    const own=shown===mine||shown.startsWith(mine+' ')||mine.startsWith(shown+' ');card.classList.toggle('isa-own-theme',own)
    head.classList.remove('isa-own-bg');head.style.removeProperty('background-image');head.style.removeProperty('background-position')
    if(!own)return true
    const root=document.getElementById('socialPanel')||document.getElementById('familySocialOverlay'),accent=(root?getComputedStyle(root).getPropertyValue('--isa-profile-accent'):'').trim()||root?.dataset?.profileThemeColor||'#c7b5ee';card.style.setProperty('--spp-accent',accent);return true
  }
  function schedule(delay=0){clearTimeout(timer);timer=setTimeout(sync,delay)}
  function bindModal(){
    const modal=document.getElementById('socialProfilePage');if(!modal||modalObserver?._target===modal)return !!modal
    try{modalObserver?.disconnect()}catch{}
    modalObserver=new MutationObserver(()=>schedule(20));modalObserver._target=modal;modalObserver.observe(modal,{attributes:true,attributeFilter:['class'],childList:true,subtree:false});return true
  }
  function wait(){if(bindModal()){schedule(0);return}if(++waits<18)setTimeout(wait,180)}
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-social-profile],#socialEditProfile,#fsEditProfile,.spp-profile-open')){bindModal();schedule(80)}},true)
  for(const ev of ['isa:theme-applied','isa:social-rendered','isa:social-opened','isa:friend-portal-entered'])document.addEventListener(ev,()=>{bindModal();schedule(30)},{passive:true})
  css();wait();window.__ISA_PROFILE_THEME_PAGE__={sync,schedule}
})();
