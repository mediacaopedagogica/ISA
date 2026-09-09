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

// Mantém exatamente um botão de Configurações no menu principal para todos os perfis.
// Ele não é criado abaixo de Sair e não fica sobre a conversa.
function ensureSettingsMenuButton(){
  const nav=document.querySelector('.nav-tabs');
  if(!nav)return null;
  let btn=document.getElementById('settingsMenuBtn');
  if(!btn){
    btn=document.createElement('button');
    btn.id='settingsMenuBtn';
    btn.className='nav-btn';
    btn.type='button';
    btn.innerHTML='⚙️ <span>Configurações</span>';
    btn.title='Configurações Gerais';
    btn.setAttribute('aria-label','Configurações Gerais');
    const calendar=nav.querySelector('[data-tab="calendar"]');
    if(calendar)calendar.insertAdjacentElement('afterend',btn);else nav.appendChild(btn);
  }
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
        await loadWithRetry('./general-settings.js?v=5-menu-entry');
        window.__ISA_OPEN_GENERAL_SETTINGS__?.();
      }catch(error){console.warn('Configurações não abriram:',error)}
    },true);
  }
  return btn;
}
ensureSettingsMenuButton();

const dedicatedMobile=new URLSearchParams(location.search).get('mobile')==='1'
const common=[
  './general-settings.js?v=5-menu-entry',
  './notifications-v2.js?v=9-stable',
  './extras-loader.js?v=48-settings-social-v3',
  './profile-status-stickers.js?v=1-all-profiles'
]
const paths=dedicatedMobile?[
  './call-manager.js?v=8-header-safe',
  './mobile-native.js?v=3-no-blank',
  ...common
]:[
  './mobile-responsive-v2.js?v=15-android-touch',
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
