// Isa Chat — compatibilidade de toque/configurações.
// IMPORTANTE: este arquivo NÃO controla mais sidebar/content/painéis.
// O estado mobile pertence exclusivamente a personal-navigation-core.js (perfis principais)
// ou ao controlador aprovado da Keise.
const waitSettings=ms=>new Promise(r=>setTimeout(r,ms))

function norm(v){return String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function requestedProfile(){return norm(new URLSearchParams(location.search).get('perfil'))}
function currentProfile(){return norm(document.getElementById('myName')?.textContent)}
function isKeiseApprovedAccess(){const p=requestedProfile(),n=currentProfile();return p==='keise'||n==='keise'||n.startsWith('keise ')}

function ensureGlobalSettingsEntry(){
  if(isKeiseApprovedAccess())return document.getElementById('settingsMenuBtn')||null
  const nav=document.querySelector('.nav-tabs')
  if(!nav)return null
  let btn=document.getElementById('settingsMenuBtn')
  if(!btn){
    btn=document.createElement('button')
    btn.id='settingsMenuBtn';btn.className='nav-btn';btn.type='button'
    btn.innerHTML='⚙️ <span>Configurações</span>';btn.title='Configurações Gerais';btn.setAttribute('aria-label','Configurações Gerais')
    const calendar=nav.querySelector('[data-tab="calendar"]')
    if(calendar)calendar.insertAdjacentElement('afterend',btn);else nav.appendChild(btn)
  }
  btn.classList.remove('hidden');btn.style.removeProperty('display');btn.style.removeProperty('visibility');btn.style.removeProperty('opacity')
  if(btn.dataset.settingsEntryGuardBound!=='1'){
    btn.dataset.settingsEntryGuardBound='1';btn.dataset.generalSettingsBound='1'
    btn.addEventListener('click',async e=>{
      e.preventDefault();e.stopPropagation()
      if(typeof window.__ISA_OPEN_GENERAL_SETTINGS__==='function'){window.__ISA_OPEN_GENERAL_SETTINGS__();return}
      try{
        await import('./general-settings.js?v=14-single-navigation')
        for(let i=0;i<18;i++){
          if(typeof window.__ISA_OPEN_GENERAL_SETTINGS__==='function'){window.__ISA_OPEN_GENERAL_SETTINGS__();return}
          await waitSettings(80)
        }
      }catch(error){console.warn('Configurações não abriram:',error)}
    },true)
  }
  return btn
}

function ensureTouchCss(){
  if(document.querySelector('style[data-isa-touch-safety]'))return
  const s=document.createElement('style');s.dataset.isaTouchSafety='1'
  s.textContent=`@media(max-width:850px){
    html,body{touch-action:manipulation}
    #mainView button,#mainView [role="button"],#mainView .chat-item{touch-action:manipulation;-webkit-tap-highlight-color:rgba(160,120,220,.12)}
    #toast{pointer-events:none!important}
    .hidden{pointer-events:none}
  }`
  document.head.appendChild(s)
}

function start(){
  ensureTouchCss()
  if(!isKeiseApprovedAccess())ensureGlobalSettingsEntry()
  let tries=0
  const timer=setInterval(()=>{
    if(!isKeiseApprovedAccess())ensureGlobalSettingsEntry()
    if(++tries>=32)clearInterval(timer)
  },300)
}
start();document.addEventListener('DOMContentLoaded',start,{once:true})
window.__ISA_MOBILE_GUARD__={singleNavigation:true}
