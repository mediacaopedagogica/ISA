// Loader leve da Nossa Rede: restaura o visual aprovado anterior e mantém as ferramentas funcionais.
if(!document.getElementById('nossaRedePolicyV5Css')){const l=document.createElement('link');l.id='nossaRedePolicyV5Css';l.rel='stylesheet';l.href='./nossa-rede-policy-v5.css?v=2-organic-base';document.head.appendChild(l)}
if(!document.getElementById('nossaRedeMobileFixV1')){const l=document.createElement('link');l.id='nossaRedeMobileFixV1';l.rel='stylesheet';l.href='./nossa-rede-mobile-fix-v1.css?v=3-interaction-fix';document.head.appendChild(l)}
if(!document.getElementById('nossaRedeOrganicV6')){const l=document.createElement('link');l.id='nossaRedeOrganicV6';l.rel='stylesheet';l.href='./nossa-rede-organic-v6.css?v=1-approved-image';document.head.appendChild(l)}
if(!document.getElementById('nossaRedeOrganicV7Final')){const l=document.createElement('link');l.id='nossaRedeOrganicV7Final';l.rel='stylesheet';l.href='./nossa-rede-organic-v7-final.css?v=1-exact-approved-details';document.head.appendChild(l)}
if(!document.getElementById('nossaRedeOrganicV8Exact')){const l=document.createElement('link');l.id='nossaRedeOrganicV8Exact';l.rel='stylesheet';l.href='./nossa-rede-organic-v8-exact.css?v=1-cloud-comment-plus';document.head.appendChild(l)}
if(!document.getElementById('nossaRedePinkTitleV1')){const l=document.createElement('link');l.id='nossaRedePinkTitleV1';l.rel='stylesheet';l.href='./nossa-rede-pink-title-v1.css?v=1-pink-handwritten';document.head.appendChild(l)}
await import('./nossa-rede-policy-v5.js?v=2-organic-layout');
await import('./nossa-rede-comment-menu-v1.js?v=1-cloud-comment-plus').catch(()=>null);
await import('./nuvem-compose-compact-v1.js?v=2-compact-3d').catch(()=>null);
window.__ISA_NOSSA_REDE_V5__?.patch?.();
window.__ISA_COMMENT_MEDIA_MENU__?.scan?.();
window.__ISA_NUVEM_COMPACT_COMPOSER__?.scan?.();
