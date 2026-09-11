// Isa Chat — compatibilidade de toque/configurações.
// Este arquivo NÃO controla sidebar/content/painéis.
// Keise, Isa e Alan usam seus dashboards aprovados sem uma segunda camada visual.
const waitSettings=ms=>new Promise(r=>setTimeout(r,ms))

function norm(v){return String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function requestedProfile(){return norm(new URLSearchParams(location.search).get('perfil'))}
function currentProfile(){return norm(document.getElementById('myName')?.textContent)}
function approvedProfile(){
  const p=requestedProfile(),n=currentProfile()
  for(const name of ['keise','isa','alan'])if(p===name||n===name||n.startsWith(name+' '))return name
  return''
}

function ensureGlobalSettingsEntry(){
  if(approvedProfile())return document.getElementById('settingsMenuBtn')||null
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
        await import('./general-settings.js?v=15-approved-profiles')
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
  s.textContent=`@media(max-width:850px){html,body{touch-action:manipulation}#mainView button,#mainView [role="button"],#mainView .chat-item{touch-action:manipulation;-webkit-tap-highlight-color:rgba(160,120,220,.12)}#toast{pointer-events:none!important}.hidden{pointer-events:none}}`
  document.head.appendChild(s)
}

// Mantém cada card do dashboard aprovado preso ao UUID exato da conversa.
// Este guard é carregado antes do dashboard e, por isso, elimina roteamento por
// texto/nome ou cliques concorrentes de camadas antigas.
let wantedConversationId=''
let wantedConversationTitle=''
let conversationRetryTimer=null

function nativeConversationCard(id){
  return [...document.querySelectorAll('#chatList .chat-item[data-conv]')]
    .find(el=>String(el.dataset.conv||'')===String(id||''))||null
}

function openWantedConversation(id,attempt=0){
  if(!id||String(id)!==wantedConversationId)return false
  const source=nativeConversationCard(id)
  const dashboard=window.__ISA_APPROVED_DASHBOARD__
  if(!source||!dashboard){
    if(attempt<18)setTimeout(()=>openWantedConversation(id,attempt+1),60)
    return false
  }
  try{dashboard.enterPanel?.()}catch{}
  try{HTMLElement.prototype.click.call(source)}catch{source.click?.()}
  clearTimeout(conversationRetryTimer)
  conversationRetryTimer=setTimeout(()=>{
    if(String(id)!==wantedConversationId)return
    const active=[...document.querySelectorAll('#chatList .chat-item.active[data-conv]')][0]
    const title=norm(document.getElementById('chatTitle')?.textContent)
    const wanted=norm(wantedConversationTitle)
    if(String(active?.dataset.conv||'')!==String(id)||(wanted&&title&&title!==wanted)){
      const exact=nativeConversationCard(id)
      if(exact){try{HTMLElement.prototype.click.call(exact)}catch{exact.click?.()}}
    }
  },360)
  return true
}

function bindApprovedConversationIntegrity(){
  if(window.__ISA_APPROVED_CONVERSATION_ID_GUARD__)return
  window.__ISA_APPROVED_CONVERSATION_ID_GUARD__=true
  window.addEventListener('click',e=>{
    if(!approvedProfile())return
    const card=e.target?.closest?.('#kaConversationList [data-ka-conv]')
    if(!card)return
    const id=String(card.dataset.kaConv||card.dataset.sourceConv||'')
    if(!id)return
    e.preventDefault();e.stopImmediatePropagation()
    wantedConversationId=id
    wantedConversationTitle=card.querySelector('strong')?.textContent?.replace(/★/g,'').trim()||''
    openWantedConversation(id)
  },true)
  window.addEventListener('keydown',e=>{
    if(!approvedProfile()||!['Enter',' '].includes(e.key))return
    const card=e.target?.closest?.('#kaConversationList [data-ka-conv]')
    if(!card)return
    e.preventDefault();e.stopImmediatePropagation()
    const id=String(card.dataset.kaConv||card.dataset.sourceConv||'')
    if(!id)return
    wantedConversationId=id
    wantedConversationTitle=card.querySelector('strong')?.textContent?.replace(/★/g,'').trim()||''
    openWantedConversation(id)
  },true)
}

function start(){
  ensureTouchCss()
  bindApprovedConversationIntegrity()
  if(!approvedProfile())ensureGlobalSettingsEntry()
  let tries=0
  const timer=setInterval(()=>{if(!approvedProfile())ensureGlobalSettingsEntry();if(++tries>=32)clearInterval(timer)},300)
}
start();document.addEventListener('DOMContentLoaded',start,{once:true})
window.__ISA_MOBILE_GUARD__={singleNavigation:true,approvedProfiles:['keise','isa','alan'],exactConversationRouting:true}
