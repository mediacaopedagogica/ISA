// Loader leve da Nossa Rede v5.
if(!document.getElementById('nossaRedePolicyV5Css')){const l=document.createElement('link');l.id='nossaRedePolicyV5Css';l.rel='stylesheet';l.href='./nossa-rede-policy-v5.css?v=1-timeline-social';document.head.appendChild(l)}
if(!document.getElementById('nossaRedeMobileFixV1')){const l=document.createElement('link');l.id='nossaRedeMobileFixV1';l.rel='stylesheet';l.href='./nossa-rede-mobile-fix-v1.css?v=1-all-profiles';document.head.appendChild(l)}
await import('./nossa-rede-policy-v5.js?v=1-timeline-social');
window.__ISA_NOSSA_REDE_V5__?.patch?.();
