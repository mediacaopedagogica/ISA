// Mantém Nossa Rede no menu mesmo quando outros módulos reconstroem a navegação.
// Importante: todas as operações são idempotentes para não criar um ciclo de MutationObserver.
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const $=id=>document.getElementById(id);
let recoveryRunning=false,recoveryDone=false;

function mainProfileReady(){
  const main=$('mainView');
  const requested=String(new URLSearchParams(location.search).get('perfil')||'').trim().toLowerCase();
  const name=String($('myName')?.textContent||'').trim().toLowerCase();
  return !!main&&!main.classList.contains('hidden')&&!!(requested||name)&&name!=='família';
}
function bind(btn){
  if(!btn)return null;
  if(btn.type!=='button')btn.type='button';
  if(!btn.classList.contains('nav-btn'))btn.classList.add('nav-btn');
  if(btn.classList.contains('hidden'))btn.classList.remove('hidden');
  if(btn.hasAttribute('data-tab'))btn.removeAttribute('data-tab');
  if(btn.style.display)btn.style.removeProperty('display');
  if(btn.style.visibility)btn.style.removeProperty('visibility');
  if(btn.style.opacity)btn.style.removeProperty('opacity');
  if(btn.dataset.socialGuardMarkup!=='1'){
    btn.innerHTML='🌸 <span>Nossa Rede</span>';
    btn.dataset.socialGuardMarkup='1';
  }
  if(btn.title!=='Nossa Rede')btn.title='Nossa Rede';
  if(btn.getAttribute('aria-label')!=='Abrir Nossa Rede')btn.setAttribute('aria-label','Abrir Nossa Rede');
  if(btn.dataset.socialGuardBound==='1')return btn;
  btn.dataset.socialGuardBound='1';
  btn.addEventListener('click',async e=>{
    e?.preventDefault?.();e?.stopPropagation?.();
    if(typeof window.__ISA_OPEN_SOCIAL__==='function'){await window.__ISA_OPEN_SOCIAL__(e);return}
    if(typeof window.__ISA_OPEN_SOCIAL_CORE__==='function'){window.__ISA_OPEN_SOCIAL_CORE__();return}
    await recover();
    if(typeof window.__ISA_OPEN_SOCIAL__==='function')await window.__ISA_OPEN_SOCIAL__(e);
    else window.__ISA_OPEN_SOCIAL_CORE__?.();
  },true);
  return btn;
}
function ensureButton(){
  if(!mainProfileReady())return null;
  const nav=document.querySelector('.nav-tabs');if(!nav)return null;
  const panel=$('socialPanel');
  let btn=$('socialNav');
  if(!btn&&panel){
    btn=document.createElement('button');btn.id='socialNav';
    const anchor=$('settingsMenuBtn')||nav.querySelector('[data-settings-menu="1"]')||nav.querySelector('[data-tab="calendar"]');
    if(anchor?.parentNode===nav)anchor.insertAdjacentElement('afterend',btn);else nav.appendChild(btn);
  }
  return btn?bind(btn):null;
}
async function recover(){
  if(recoveryRunning)return;recoveryRunning=true;
  try{
    if(!$('socialPanel')){
      try{await import('./social-network.js?v=5-social-safe')}catch(e){console.warn('Nossa Rede: núcleo não carregou',e)}
    }
    try{await import('./social-network-bridge-v2.js?v=5-social-safe')}catch(e){console.warn('Nossa Rede: ponte não carregou',e)}
    for(let i=0;i<30;i++){if(ensureButton())break;await wait(100)}
    recoveryDone=!!$('socialPanel');
  }finally{recoveryRunning=false}
}
async function ensure(){
  if(!mainProfileReady())return false;
  if(ensureButton())return true;
  if(!recoveryDone)await recover();
  return !!ensureButton();
}
window.__ISA_ENSURE_SOCIAL_NAV__=ensureButton;
const observer=new MutationObserver(()=>{
  ensureButton();
  if(mainProfileReady()&&!$('socialPanel')&&!recoveryRunning&&!recoveryDone)recover();
});
observer.observe(document.getElementById('mainView')||document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
let tries=0;const timer=setInterval(()=>{ensure();if(++tries>80)clearInterval(timer)},250);
ensure();
