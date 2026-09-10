// Nossa Rede — trava visual final.
// Evita que a estrutura-base antiga apareça por alguns instantes antes das camadas finais.
(function(){
  'use strict'
  if(window.__ISA_NOSSA_REDE_FINAL_LOCK_V1__)return
  window.__ISA_NOSSA_REDE_FINAL_LOCK_V1__=true

  const $=id=>document.getElementById(id)
  const FINAL_CSS=[
    ['nrFinalBase','./social-network.css?v=2'],
    ['nrFinalV4','./nossa-rede-v4.css?v=1-approved'],
    ['nrFinalPolicy','./nossa-rede-policy-v5.css?v=2-organic-base'],
    ['nrFinalMobile','./nossa-rede-mobile-fix-v1.css?v=3-interaction-fix'],
    ['nrFinalOrganic6','./nossa-rede-organic-v6.css?v=1-approved-image'],
    ['nrFinalOrganic7','./nossa-rede-organic-v7-final.css?v=1-exact-approved-details'],
    ['nrFinalOrganic8','./nossa-rede-organic-v8-exact.css?v=1-cloud-comment-plus'],
    ['nrFinalCompact','./nuvem-compose-compact-v1.css?v=5-pink-simple']
  ]

  function preloadCss(){
    for(const [id,href] of FINAL_CSS){
      if($(id))continue
      const l=document.createElement('link');l.id=id;l.rel='stylesheet';l.href=href;document.head.appendChild(l)
    }
    if($('nrFinalLockCss'))return
    const s=document.createElement('style');s.id='nrFinalLockCss';s.textContent=`
      #socialPanel.nr-final-building{position:relative!important;min-height:64vh!important}
      #socialPanel.nr-final-building>.social-shell{visibility:hidden!important;opacity:0!important;pointer-events:none!important}
      #socialPanel .nr-final-guard{display:none}
      #socialPanel.nr-final-building>.nr-final-guard{position:fixed;inset:0;z-index:2147481000;display:grid!important;place-items:center;padding:20px;background:radial-gradient(circle at 8% 8%,rgba(255,215,237,.9),transparent 27%),radial-gradient(circle at 90% 8%,rgba(229,216,255,.9),transparent 28%),radial-gradient(circle at 12% 94%,rgba(216,240,255,.88),transparent 28%),linear-gradient(135deg,#fff9fd,#faf5ff 48%,#eff8ff);color:#26306d}
      .nr-final-guard-card{width:min(390px,90vw);padding:24px 22px;border-radius:30px;text-align:center;background:rgba(255,255,255,.82);border:1px solid rgba(255,255,255,.97);box-shadow:0 22px 48px rgba(87,66,125,.14);backdrop-filter:blur(24px)}
      .nr-final-guard-heart{font-size:40px;margin-bottom:8px;filter:drop-shadow(0 7px 10px rgba(239,81,166,.23))}.nr-final-guard-card strong{display:block;font-size:19px}.nr-final-guard-card small{display:block;margin-top:5px;color:#776b92}.nr-final-guard-dot{width:28px;height:28px;margin:15px auto 0;border:4px solid #eadff3;border-top-color:#ef79b8;border-radius:50%;animation:nrFinalSpin .75s linear infinite}@keyframes nrFinalSpin{to{transform:rotate(360deg)}}
    `;document.head.appendChild(s)
  }

  function guard(root){
    let g=root.querySelector(':scope > .nr-final-guard')
    if(!g){g=document.createElement('div');g.className='nr-final-guard';g.innerHTML='<div class="nr-final-guard-card"><div class="nr-final-guard-heart">💗</div><strong>Abrindo a Nossa Rede</strong><small>Preparando o visual final do Isa Chat…</small><div class="nr-final-guard-dot"></div></div>';root.prepend(g)}
    return g
  }

  function ready(root){
    if(!root)return false
    const required=[
      '.isa-social-header',
      '.isa-birthday-card',
      '.isa-status-card-wrap',
      '.isa-family-message',
      '.nuvem-share-title',
      '.nuvem-compose-compact'
    ]
    return required.every(sel=>root.querySelector(sel))
  }

  function callEnhancers(){
    try{window.__ISA_ENHANCE_NOSSA_REDE__?.()}catch{}
    try{window.__ISA_NOSSA_REDE_V5__?.patch?.()}catch{}
    try{window.__ISA_NUVEM_COMPACT_COMPOSER__?.scan?.()}catch{}
    try{window.__ISA_COMMENT_MEDIA_MENU__?.scan?.()}catch{}
    try{window.__ISA_NUVEM_CAROUSEL__?.scan?.()}catch{}
    try{window.__ISA_NOSSA_REDE_HEADER_CLEANUP__?.()}catch{}
    try{window.__ISA_SOCIAL_PRIVACY__?.apply?.()}catch{}
  }

  async function ensureMissingModules(){
    const jobs=[]
    if(typeof window.__ISA_ENHANCE_NOSSA_REDE__!=='function')jobs.push(import('./nossa-rede-v4.js?v=12-final-lock'))
    if(!window.__ISA_NOSSA_REDE_V5__)jobs.push(import('./nossa-rede-policy-v5-loader.js?v=12-final-lock'))
    if(!window.__ISA_NUVEM_COMPACT_COMPOSER__)jobs.push(import('./nuvem-compose-compact-v1.js?v=10-final-lock'))
    if(typeof window.__ISA_NOSSA_REDE_HEADER_CLEANUP__!=='function')jobs.push(import('./nossa-rede-header-cleanup-v1.js?v=4-final-lock'))
    if(!window.__ISA_NUVEM_CAROUSEL__)jobs.push(import('./nuvem-carousel-v1.js?v=6-final-lock'))
    if(!window.__ISA_COMMENT_MEDIA_MENU__)jobs.push(import('./nossa-rede-comment-menu-v1.js?v=4-final-lock'))
    if(jobs.length)await Promise.allSettled(jobs)
  }

  let applying=false
  async function finalize(root){
    if(!root||applying)return ready(root)
    if(ready(root)){
      root.classList.remove('nr-final-building');root.classList.add('nr-final-ready');root.dataset.nrFinalReady='1';root.querySelector(':scope > .nr-final-guard')?.remove();return true
    }
    applying=true
    root.classList.add('nr-final-building');root.classList.remove('nr-final-ready');guard(root)
    try{
      callEnhancers()
      if(!ready(root)){await ensureMissingModules();callEnhancers()}
      for(let i=0;i<24&&!ready(root);i++){
        await new Promise(r=>setTimeout(r,45));callEnhancers()
      }
      if(ready(root)){
        root.classList.remove('nr-final-building');root.classList.add('nr-final-ready');root.dataset.nrFinalReady='1';root.querySelector(':scope > .nr-final-guard')?.remove();return true
      }
      // Nunca revela a versão-base antiga. Mantém o guard e oferece nova tentativa.
      const card=root.querySelector('.nr-final-guard-card');if(card){card.innerHTML='<div class="nr-final-guard-heart">💗</div><strong>Nossa Rede está quase pronta</strong><small>O visual final não terminou de carregar.</small><button id="nrFinalRetry" type="button" style="margin-top:14px;border:0;border-radius:999px;padding:10px 16px;background:#ef79b8;color:#fff;font-weight:900;cursor:pointer">Tentar novamente</button>';$('#nrFinalRetry')?.addEventListener('click',()=>{applying=false;finalize(root)},{once:true})}
      return false
    }finally{applying=false}
  }

  function scan(){
    const root=$('socialPanel');if(!root)return
    if(!ready(root)||root.classList.contains('nr-final-building'))finalize(root)
  }

  preloadCss()
  const obs=new MutationObserver(()=>{const root=$('socialPanel');if(!root)return;if(root.dataset.nrFinalReady!=='1'||!ready(root)){root.classList.add('nr-final-building');guard(root);queueMicrotask(()=>finalize(root))}})
  obs.observe(document.documentElement,{childList:true,subtree:true})
  scan()
  document.addEventListener('click',e=>{if(e.target.closest?.('#socialNav')){const root=$('socialPanel');if(root&&!ready(root)){root.classList.add('nr-final-building');guard(root);finalize(root)}}},true)
  window.__ISA_NOSSA_REDE_FINAL_LOCK__={scan,finalize,ready}
})();
