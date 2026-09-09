// Carrega os recursos complementares sem bloquear nem esconder o app principal.
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function loadWithRetry(path){
  try{return await import(path)}
  catch(first){
    console.warn('Primeira tentativa falhou:',path,first)
    await wait(320)
    const sep=path.includes('?')?'&':'?'
    return import(`${path}${sep}retry=${Date.now()}`)
  }
}

// Mantém exatamente um botão de Configurações no menu principal em qualquer tamanho de tela.
function ensureSettingsMenuButton(){
  const nav=document.querySelector('.nav-tabs');
  if(!nav)return null;
  const candidates=[...nav.querySelectorAll('#settingsMenuBtn,#generalSettingsNav')];
  let btn=candidates[0]||null;
  candidates.slice(1).forEach(extra=>extra.remove());
  if(!btn){
    btn=document.createElement('button');btn.id='settingsMenuBtn';btn.className='nav-btn';btn.type='button';btn.innerHTML='⚙️ <span>Configurações</span>';
    const calendar=nav.querySelector('[data-tab="calendar"]');
    if(calendar)calendar.insertAdjacentElement('afterend',btn);else nav.appendChild(btn);
  }else if(btn.id!=='settingsMenuBtn')btn.id='settingsMenuBtn';
  if(!btn.classList.contains('nav-btn'))btn.classList.add('nav-btn');
  if(btn.classList.contains('hidden'))btn.classList.remove('hidden');
  btn.type='button';btn.title='Configurações Gerais';btn.setAttribute('aria-label','Configurações Gerais');btn.setAttribute('data-settings-menu','1');btn.removeAttribute('data-tab');
  if(btn.style.display)btn.style.removeProperty('display');if(btn.style.visibility)btn.style.removeProperty('visibility');if(btn.style.opacity)btn.style.removeProperty('opacity');
  if(btn.dataset.settingsEntryBound!=='1'){
    btn.dataset.settingsEntryBound='1';btn.dataset.generalSettingsBound='1';
    btn.addEventListener('click',async e=>{
      e.preventDefault();e.stopPropagation();
      for(let i=0;i<20;i++){if(typeof window.__ISA_OPEN_GENERAL_SETTINGS__==='function'){window.__ISA_OPEN_GENERAL_SETTINGS__();return}await wait(120)}
      try{await loadWithRetry('./general-settings.js?v=7-unfreeze');window.__ISA_OPEN_GENERAL_SETTINGS__?.()}catch(error){console.warn('Configurações não abriram:',error)}
    },true);
  }
  return btn;
}

window.__ISA_ENSURE_SETTINGS_MENU__=ensureSettingsMenuButton;
ensureSettingsMenuButton();
document.addEventListener('DOMContentLoaded',ensureSettingsMenuButton,{once:true});
const menuObserver=new MutationObserver(()=>ensureSettingsMenuButton());
menuObserver.observe(document.getElementById('mainView')||document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
let settingsMenuTries=0;const settingsMenuTimer=setInterval(()=>{ensureSettingsMenuButton();if(++settingsMenuTries>=40)clearInterval(settingsMenuTimer)},250);

const dedicatedMobile=new URLSearchParams(location.search).get('mobile')==='1'
const common=[
  './general-settings.js?v=7-unfreeze',
  './notifications-v2.js?v=9-stable',
  './extras-loader.js?v=50-all-profile-features',
  './profile-status-stickers.js?v=2-all-links',
  './profile-actions.js?v=1-all-links',
  './social-nav-guard.js?v=2-idempotent-unfreeze'
]
const paths=dedicatedMobile?[
  './call-manager.js?v=8-header-safe',
  './mobile-native.js?v=4-settings-all-devices',
  ...common
]:[
  './mobile-responsive-v2.js?v=16-settings-all-devices',
  ...common
]
const results=await Promise.allSettled(paths.map(loadWithRetry))
ensureSettingsMenuButton();
window.__ISA_ENSURE_SOCIAL_NAV__?.();

// O Teste Jogo é exclusivo da Keise e precisa existir mesmo se as conversas demorarem.
const requestedProfile=String(new URLSearchParams(location.search).get('perfil')||'').trim().toLowerCase();
const currentName=String(document.getElementById('myName')?.textContent||'').trim().toLowerCase();
if(requestedProfile==='keise'||currentName==='keise'||currentName.startsWith('keise ')){
  try{await loadWithRetry('./keise-game-test.js?v=6-unfreeze-menu');window.__ISA_ENSURE_TEST_GAME_NAV__?.()}catch(error){console.warn('Teste Jogo da Keise não carregou:',error)}
}

window.__ISA_EXTRAS_READY__=true
window.__ISA_EXTRAS_RESULTS__=results.map((r,i)=>({index:i,path:paths[i],ok:r.status==='fulfilled',error:r.status==='rejected'?String(r.reason?.message||r.reason||'Erro'):null}))
const failed=results.filter(r=>r.status==='rejected')
failed.forEach((r,i)=>console.warn('Módulo complementar não carregou',i,r.reason))
if(failed.length){const t=document.getElementById('toast');if(t){t.textContent='Alguns recursos extras demoraram para carregar. O Cantinho continua disponível.';t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),4200)}}
