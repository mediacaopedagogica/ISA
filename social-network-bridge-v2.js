// Nossa Rede v2 — ponte resiliente de navegação e acabamento de interações.
// Mantém o módulo social principal independente do núcleo do chat.
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const $=id=>document.getElementById(id);
let recoveryTried=false;

function ensureCss(){
  if(document.querySelector('link[data-social-v2]'))return;
  const l=document.createElement('link');
  l.rel='stylesheet';l.href='./social-network-v2.css?v=2';l.dataset.socialV2='1';
  document.head.appendChild(l);
}

function forceOpenSocial(){
  const panel=$('socialPanel'),nav=$('socialNav'),main=document.querySelector('main.content');
  if(!panel||!nav)return false;
  [...(main?.children||[])].forEach(s=>{if(s!==panel&&s.tagName==='SECTION')s.classList.add('hidden')});
  panel.classList.remove('hidden');
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b===nav));
  $('mainView')?.classList.add('social-mode');
  panel.scrollTop=0;
  return true;
}

async function recoverSocial(){
  if(recoveryTried)return;
  recoveryTried=true;
  try{
    await import(`./social-network.js?v=2-recovery-${Date.now()}`);
  }catch(e){console.warn('Nossa Rede: recuperação falhou',e)}
}

async function openWithRecovery(){
  ensureCss();
  if(forceOpenSocial())return;
  await recoverSocial();
  for(let i=0;i<24;i++){
    if(forceOpenSocial())return;
    await wait(100);
  }
  const t=$('toast');if(t){t.textContent='A Nossa Rede demorou para abrir. Tente novamente.';t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),3500)}
}

function improveSocialUi(){
  const nav=$('socialNav');
  if(nav){nav.title='Nossa Rede — status, fotos, vídeos, reações e comentários';nav.setAttribute('aria-label','Abrir Nossa Rede')}
  const top=document.querySelector('.social-topbar');
  if(top&&!top.querySelector('[data-social-status-tip]')){
    const tip=document.createElement('div');
    tip.dataset.socialStatusTip='1';tip.className='social-status-tip';
    tip.innerHTML='💭 <span>Frase do dia</span> · 😊 <span>Como estou</span> · 📍 <span>O que estou fazendo</span>';
    top.appendChild(tip);
  }
  document.querySelectorAll('.social-post').forEach(post=>{
    const actions=post.querySelector('.social-post-actions');
    if(actions&&!actions.dataset.v2){
      actions.dataset.v2='1';actions.setAttribute('aria-label','Reagir à publicação');
      const comment=post.querySelector('.social-comment-form input');
      if(comment)comment.placeholder='Escreva um comentário…';
    }
  });
}

// Captura antes do roteador antigo do app. Assim "social" não é tratado como uma aba desconhecida.
document.addEventListener('click',e=>{
  const nav=e.target.closest?.('#socialNav');
  if(!nav)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  openWithRecovery();
},{capture:true});

// Ao navegar para outra aba, remove apenas o estado visual social; o núcleo decide qual painel abrir.
document.addEventListener('click',e=>{
  const b=e.target.closest?.('.nav-btn');
  if(!b||b.id==='socialNav')return;
  $('socialPanel')?.classList.add('hidden');
  $('mainView')?.classList.remove('social-mode');
},{capture:true});

ensureCss();
const observer=new MutationObserver(()=>improveSocialUi());
observer.observe(document.documentElement,{subtree:true,childList:true});
improveSocialUi();

window.__ISA_OPEN_SOCIAL__=openWithRecovery;
