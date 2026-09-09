// Nossa Rede v3 — ponte resiliente de navegação para mouse, toque e teclado.
// Não deixa o roteador antigo interpretar "social" como aba desconhecida.
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const $=id=>document.getElementById(id);
let recoveryTried=false,lastOpenAt=0;

function ensureCss(){
  if(document.querySelector('link[data-social-v2]'))return;
  const l=document.createElement('link');l.rel='stylesheet';l.href='./social-network-v2.css?v=3';l.dataset.socialV2='1';document.head.appendChild(l);
}
function toast(text){const t=$('toast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._socialBridge);t._socialBridge=setTimeout(()=>t.classList.add('hidden'),3500)}

function forceOpenSocial(){
  const panel=$('socialPanel'),nav=$('socialNav'),main=document.querySelector('main.content');
  if(!panel||!nav)return false;
  [...(main?.children||[])].forEach(s=>{if(s!==panel&&s.tagName==='SECTION')s.classList.add('hidden')});
  panel.classList.remove('hidden');
  panel.removeAttribute('aria-hidden');
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b===nav));
  $('mainView')?.classList.add('social-mode');
  panel.scrollTop=0;
  try{window.__ISA_OPEN_SOCIAL_CORE__?.()}catch{}
  return true;
}

async function recoverSocial(){
  if(recoveryTried)return;
  recoveryTried=true;
  try{await import(`./social-network.js?v=3-recovery-${Date.now()}`)}catch(e){console.warn('Nossa Rede: recuperação falhou',e)}
}

async function openWithRecovery(event){
  if(event){event.preventDefault?.();event.stopPropagation?.();event.stopImmediatePropagation?.()}
  const now=performance.now();if(now-lastOpenAt<180&&forceOpenSocial())return;lastOpenAt=now;
  ensureCss();
  if(forceOpenSocial())return;
  await recoverSocial();
  for(let i=0;i<30;i++){if(forceOpenSocial())return;await wait(100)}
  toast('A Nossa Rede demorou para abrir. Tente novamente.')
}

function armNav(){
  const nav=$('socialNav');if(!nav)return false;
  // Remove data-tab para o roteador antigo não tentar tratar esta aba.
  nav.removeAttribute('data-tab');nav.dataset.socialBridge='3';nav.type='button';nav.style.pointerEvents='auto';nav.style.touchAction='manipulation';
  nav.title='Nossa Rede — status, fotos, vídeos, reações e comentários';nav.setAttribute('aria-label','Abrir Nossa Rede');
  if(!nav.dataset.socialDirect){
    nav.dataset.socialDirect='1';
    nav.addEventListener('pointerup',openWithRecovery,{capture:true});
    nav.addEventListener('click',openWithRecovery,{capture:true});
    nav.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openWithRecovery(e)}},{capture:true});
  }
  return true;
}

function improveSocialUi(){
  armNav();
  const top=document.querySelector('.social-topbar');
  if(top&&!top.querySelector('[data-social-status-tip]')){const tip=document.createElement('div');tip.dataset.socialStatusTip='1';tip.className='social-status-tip';tip.innerHTML='💭 <span>Frase do dia</span> · 😊 <span>Como estou</span> · 📍 <span>O que estou fazendo</span>';top.appendChild(tip)}
  document.querySelectorAll('.social-post').forEach(post=>{const actions=post.querySelector('.social-post-actions');if(actions&&!actions.dataset.v2){actions.dataset.v2='1';actions.setAttribute('aria-label','Reagir à publicação');const comment=post.querySelector('.social-comment-form input');if(comment)comment.placeholder='Escreva um comentário…'}})
}

// Fallback global: cobre versões mobile que interceptam pointer/touch antes do click.
for(const type of ['pointerup','click'])document.addEventListener(type,e=>{const nav=e.target.closest?.('#socialNav');if(nav)openWithRecovery(e)},{capture:true});
document.addEventListener('touchend',e=>{const nav=e.target.closest?.('#socialNav');if(nav)openWithRecovery(e)},{capture:true,passive:false});

// Ao navegar para outra aba real, remove apenas o estado visual da Nossa Rede.
document.addEventListener('click',e=>{const b=e.target.closest?.('.nav-btn');if(!b||b.id==='socialNav')return;$('socialPanel')?.classList.add('hidden');$('mainView')?.classList.remove('social-mode')},{capture:true});

ensureCss();
const observer=new MutationObserver(()=>improveSocialUi());observer.observe(document.documentElement,{subtree:true,childList:true});improveSocialUi();
let tries=0;const timer=setInterval(()=>{improveSocialUi();if(armNav()||++tries>60)clearInterval(timer)},150);
window.__ISA_OPEN_SOCIAL__=openWithRecovery;
