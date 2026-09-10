/* Faz a COR do tema escolhido aparecer também na página completa do próprio perfil.
   Fundos de imagem são exclusivos da videochamada e não entram no perfil. */
(function(){
  if(window.__ISA_PROFILE_THEME_PAGE_V1__)return;window.__ISA_PROFILE_THEME_PAGE_V1__=true
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ')
  function css(){if(document.getElementById('isaProfileThemePageCss'))return;const s=document.createElement('style');s.id='isaProfileThemePageCss';s.textContent=`
  #socialProfilePage .spp-card.isa-own-theme{--spp-accent:#c7b5ee;border-color:color-mix(in srgb,var(--spp-accent) 38%,#fff)!important;box-shadow:0 24px 60px color-mix(in srgb,var(--spp-accent) 20%,rgba(44,28,56,.18))!important}
  #socialProfilePage .spp-card.isa-own-theme .spp-head{position:relative;border-radius:20px;overflow:hidden;background:linear-gradient(135deg,color-mix(in srgb,var(--spp-accent) 14%,#fff),#fff)!important}
  #socialProfilePage .spp-card.isa-own-theme .spp-tab.active,#socialProfilePage .spp-card.isa-own-theme .spp-btn.primary{background:linear-gradient(135deg,var(--spp-accent),color-mix(in srgb,var(--spp-accent) 68%,#8d76bd))!important;color:#fff!important}
  #socialProfilePage .spp-card.isa-own-theme .spp-now{border-color:color-mix(in srgb,var(--spp-accent) 35%,#eee)!important;background:color-mix(in srgb,var(--spp-accent) 12%,#fff)!important}
  `;document.head.appendChild(s)}
  function sync(){
    css();const modal=document.getElementById('socialProfilePage'),card=modal?.querySelector('.spp-card'),head=modal?.querySelector('.spp-head'),shown=norm(document.getElementById('sppName')?.textContent),mine=norm(window.__ISA_FRIEND_PERSON__?.name||document.getElementById('myName')?.textContent||document.getElementById('friendName')?.textContent)
    if(!card||!head||!shown||!mine)return
    const own=shown===mine||shown.startsWith(mine+' ')||mine.startsWith(shown+' ');card.classList.toggle('isa-own-theme',own)
    head.classList.remove('isa-own-bg');head.style.removeProperty('background-image');head.style.removeProperty('background-position')
    if(!own)return
    const root=document.getElementById('socialPanel')||document.getElementById('familySocialOverlay'),accent=(root?getComputedStyle(root).getPropertyValue('--isa-profile-accent'):'').trim()||'#c7b5ee';card.style.setProperty('--spp-accent',accent)
  }
  new MutationObserver(()=>requestAnimationFrame(sync)).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});document.addEventListener('click',e=>{if(e.target.closest?.('[data-social-profile],#socialEditProfile,#fsEditProfile'))setTimeout(sync,80)},true);document.addEventListener('isa:friend-portal-entered',()=>setTimeout(sync,400));setTimeout(sync,900);window.__ISA_PROFILE_THEME_PAGE__={sync}
})();
