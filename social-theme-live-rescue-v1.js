// Resposta visual imediata do seletor de cor/tema da Nossa Rede.
// A persistência continua em social-profile-theme-v2; este módulo elimina a sensação de botão sem efeito.
(function(){
  'use strict'
  if(window.__ISA_THEME_LIVE_RESCUE_V1__)return
  window.__ISA_THEME_LIVE_RESCUE_V1__=true
  const QUICK={pink:'#f4b6cf',lilac:'#c7b5ee',green:'#b8deb9',yellow:'#f5df92',blue:'#b9d9ef'}
  const roots=()=>[document.getElementById('socialPanel'),document.getElementById('familySocialOverlay')].filter(Boolean)
  function rgb(hex,a){const h=String(hex||'#c7b5ee').replace('#','');if(!/^[0-9a-f]{6}$/i.test(h))return`rgba(199,181,238,${a})`;const n=parseInt(h,16);return`rgba(${n>>16},${(n>>8)&255},${n&255},${a})`}
  function css(){if(document.getElementById('isaThemeLiveRescueCss'))return;const s=document.createElement('style');s.id='isaThemeLiveRescueCss';s.textContent=`
    #socialPanel.isa-theme-rescue-live,#familySocialOverlay.isa-theme-rescue-live{background:radial-gradient(circle at 8% 10%,var(--isa-theme-a18),transparent 31%),radial-gradient(circle at 92% 9%,var(--isa-theme-a13),transparent 30%),linear-gradient(145deg,#fffafd,#f8f4ff 54%,#f2f8ff)!important;transition:background .22s ease!important}
    #socialPanel.isa-theme-rescue-live .social-side,#socialPanel.isa-theme-rescue-live .social-topbar,#socialPanel.isa-theme-rescue-live .social-composer,#socialPanel.isa-theme-rescue-live .social-right,
    #familySocialOverlay.isa-theme-rescue-live .social-side,#familySocialOverlay.isa-theme-rescue-live .social-topbar,#familySocialOverlay.isa-theme-rescue-live .social-composer,#familySocialOverlay.isa-theme-rescue-live .social-right{border-color:var(--isa-theme-a34)!important;box-shadow:0 17px 38px var(--isa-theme-a16)!important}
    #socialPanel.isa-theme-rescue-live .social-btn.primary,#familySocialOverlay.isa-theme-rescue-live .social-btn.primary{background:linear-gradient(135deg,var(--isa-theme-accent),var(--isa-theme-dark))!important;color:#fff!important}
    #socialPanel.isa-theme-rescue-live .nuvem-share-title,#familySocialOverlay.isa-theme-rescue-live .nuvem-share-title{color:var(--isa-theme-ink)!important}
    #socialPanel.isa-theme-rescue-live .social-pill,#familySocialOverlay.isa-theme-rescue-live .social-pill{background:linear-gradient(135deg,#fff,var(--isa-theme-a16))!important;border-color:var(--isa-theme-a28)!important}
  `;document.head.appendChild(s)}
  function darken(hex){const h=String(hex).replace('#',''),n=parseInt(h,16),r=Math.max(0,(n>>16)-38),g=Math.max(0,((n>>8)&255)-38),b=Math.max(0,(n&255)-38);return'#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('')}
  function apply(color){if(!/^#[0-9a-f]{6}$/i.test(String(color||'')))return;css();for(const root of roots()){root.style.setProperty('--isa-theme-accent',color);root.style.setProperty('--isa-profile-accent',color);root.style.setProperty('--isa-theme-dark',darken(color));root.style.setProperty('--isa-theme-ink',darken(color));root.style.setProperty('--isa-theme-a13',rgb(color,.13));root.style.setProperty('--isa-theme-a16',rgb(color,.16));root.style.setProperty('--isa-theme-a18',rgb(color,.18));root.style.setProperty('--isa-theme-a28',rgb(color,.28));root.style.setProperty('--isa-theme-a34',rgb(color,.34));root.classList.add('isa-theme-rescue-live','isa-profile-theme-live');root.dataset.profileThemeColor=color}}
  function selectedColor(){const custom=document.getElementById('isaProfileThemeColor');if(custom?.value)return custom.value;const active=document.querySelector('.social-theme.active,.external-theme-swatch.active');return QUICK[active?.dataset?.theme]||null}
  document.addEventListener('click',e=>{const b=e.target?.closest?.('.social-theme,.external-theme-swatch');if(!b)return;const c=QUICK[b.dataset.theme];if(c){apply(c);setTimeout(()=>window.__ISA_PROFILE_THEME_V2__?.apply?.(),80)}},true)
  document.addEventListener('input',e=>{if(e.target?.id==='isaProfileThemeColor')apply(e.target.value)},true)
  document.addEventListener('change',e=>{if(e.target?.id==='fsTheme'||e.target?.id==='socialTheme'){const c=QUICK[e.target.value];if(c)apply(c)}},true)
  document.addEventListener('click',e=>{if(e.target?.closest?.('#socialNav,#friendSocialBtn,#socialEditProfile,#fsEditProfile'))setTimeout(()=>{const c=selectedColor()||document.getElementById('socialPanel')?.dataset.profileThemeColor||document.getElementById('familySocialOverlay')?.dataset.profileThemeColor;if(c)apply(c);window.__ISA_PROFILE_THEME_V2__?.loadState?.().then(()=>window.__ISA_PROFILE_THEME_V2__?.apply?.())},120)},true)
  new MutationObserver(()=>{const c=selectedColor();if(c)apply(c)}).observe(document.documentElement,{subtree:true,childList:true})
  setTimeout(()=>{const c=selectedColor();if(c)apply(c)},500)
  window.__ISA_THEME_LIVE_RESCUE__={apply}
})()
