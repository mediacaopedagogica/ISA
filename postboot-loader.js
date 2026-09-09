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
// Vale para notebook/desktop, responsivo mobile e mobile dedicado; nunca aparece abaixo de Sair
// e nunca fica flutuando sobre a conversa.
function ensureSettingsMenuButton(){
  const nav=document.querySelector('.nav-tabs');
  if(!nav)return null;

  const candidates=[...nav.querySelectorAll('#settingsMenuBtn,#generalSettingsNav')];
  let btn=candidates[0]||null;
  candidates.slice(1).forEach(extra=>extra.remove());

  if(!btn){
    btn=document.createElement('button');
    btn.id='settingsMenuBtn';
    btn.className='nav-btn';
    btn.type='button';
    btn.innerHTML='⚙️ <span>Configurações</span>';
    const calendar=nav.querySelector('[data-tab="calendar"]');
    if(calendar)calendar.insertAdjacentElement('afterend',btn);else nav.appendChild(btn);
  }else if(btn.id!=='settingsMenuBtn'){
    btn.id='settingsMenuBtn';
  }

  btn.classList.add('nav-btn');
  btn.classList.remove('hidden');
  btn.type='button';
  btn.title='Configurações Gerais';
  btn.setAttribute('aria-label','Configurações Gerais');
  btn.setAttribute('data-settings-menu','1');
  btn.removeAttribute('data-tab');
  btn.style.removeProperty('display');
  btn.style.removeProperty('visibility');
  btn.style.removeProperty('opacity');

  if(btn.dataset.settingsEntryBound!=='1'){
    btn.dataset.settingsEntryBound='1';
    // Impede o general-settings de adicionar um segundo listener ao mesmo botão.
    btn.dataset.generalSettingsBound='1';
    btn.addEventListener('click',async e=>{
      e.preventDefault();e.stopPropagation();
      for(let i=0;i<20;i++){
        if(typeof window.__ISA_OPEN_GENERAL_SETTINGS__==='function'){
          window.__ISA_OPEN_GENERAL_SETTINGS__();
          return;
        }
        await wait(120);
      }
      try{
        await loadWithRetry('./general-settings.js?v=6-mobile-notebook');
        window.__ISA_OPEN_GENERAL_SETTINGS__?.();
      }catch(error){console.warn('Configurações não abriram:',error)}
    },true);
  }
  return btn;
}

window.__ISA_ENSURE_SETTINGS_MENU__=ensureSettingsMenuButton;
ensureSettingsMenuButton();
document.addEventListener('DOMContentLoaded',ensureSettingsMenuButton,{once:true});

// Alguns módulos reorganizam o menu depois que o perfil abre. Observamos o app para recolocar
// o mesmo botão caso a navegação seja reconstruída, sem gerar duplicação.
const menuObserver=new MutationObserver(()=>ensureSettingsMenuButton());
menuObserver.observe(document.getElementById('mainView')||document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
let settingsMenuTries=0;
const settingsMenuTimer=setInterval(()=>{
  ensureSettingsMenuButton();
  if(++settingsMenuTries>=40)clearInterval(settingsMenuTimer);
},250);

const dedicatedMobile=new URLSearchParams(location.search).get('mobile')==='1'
const common=[
  './general-settings.js?v=6-mobile-notebook',
  './notifications-v2.js?v=9-stable',
  './extras-loader.js?v=48-settings-social-v3',
  './profile-status-stickers.js?v=1-all-profiles'
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
window.__ISA_EXTRAS_READY__=true
window.__ISA_EXTRAS_RESULTS__=results.map((r,i)=>({index:i,path:paths[i],ok:r.status==='fulfilled',error:r.status==='rejected'?String(r.reason?.message||r.reason||'Erro'):null}))

const failed=results.filter(r=>r.status==='rejected')
failed.forEach((r,i)=>console.warn('Módulo complementar não carregou',i,r.reason))
if(failed.length){
  const t=document.getElementById('toast')
  if(t){
    t.textContent='Alguns recursos extras demoraram para carregar. O Cantinho continua disponível.'
    t.classList.remove('hidden')
    setTimeout(()=>t.classList.add('hidden'),4200)
  }
}
