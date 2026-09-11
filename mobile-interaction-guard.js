// Isa Chat — compatibilidade de toque/configurações + roteamento exato de conversa.
// Carrega antes do núcleo/dashboard para impedir que qualquer camada posterior
// troque a pessoa escolhida no chat.
const waitSettings=ms=>new Promise(r=>setTimeout(r,ms))

function norm(v){return String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function requestedProfile(){return norm(new URLSearchParams(location.search).get('perfil'))}
function currentProfile(){return norm(document.getElementById('myName')?.textContent)}
function approvedProfile(){
  const p=requestedProfile(),n=currentProfile()
  for(const name of ['keise','isa','alan'])if(p===name||n===name||n.startsWith(name+' '))return name
  return''
}

;(function installExactConversationPreRouter(){
  if(window.__ISA_EXACT_PRE_ROUTER_V2__)return
  window.__ISA_EXACT_PRE_ROUTER_V2__=true

  let intendedId=''
  let internalId=''
  let lockUntil=0
  let restoreTimer=null
  const now=()=>Date.now()
  const safe=v=>{try{return CSS.escape(String(v||''))}catch{return String(v||'').replace(/["\\]/g,'\\$&')}}
  const approved=()=>!!approvedProfile()

  function original(id){
    if(!id)return null
    return document.querySelector(`#chatList .chat-item[data-conv="${safe(id)}"]`)
  }

  function currentActiveId(){
    return String(document.querySelector('#chatList .chat-item.active[data-conv]')?.dataset?.conv||'')
  }

  function arm(id){
    intendedId=String(id||'')
    lockUntil=now()+60000
    try{sessionStorage.setItem('isa-exact-conversation',intendedId)}catch{}
  }

  function allowInternal(id,fn){
    internalId=String(id||'')
    try{return fn()}finally{internalId=''}
  }

  function clickExactNative(id){
    const card=original(id)
    if(!card)return false
    allowInternal(id,()=>{
      try{HTMLElement.prototype.click.call(card)}
      catch{card.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}))}
    })
    return true
  }

  function verifyAndRestore(id,attempt=0){
    clearTimeout(restoreTimer)
    restoreTimer=setTimeout(()=>{
      if(!id||id!==intendedId||now()>lockUntil)return
      const panel=document.getElementById('chatPanel')
      if(!panel||panel.classList.contains('hidden'))return
      const active=currentActiveId()
      if(active===id)return
      if(attempt>=6)return
      clickExactNative(id)
      verifyAndRestore(id,attempt+1)
    },attempt===0?180:220)
  }

  function openExact(id){
    id=String(id||'')
    if(!id)return false
    arm(id)
    try{window.__ISA_APPROVED_DASHBOARD__?.enterPanel?.()}catch{}
    let tries=0
    const run=()=>{
      if(id!==intendedId)return
      if(clickExactNative(id)){
        verifyAndRestore(id,0)
        return
      }
      if(++tries<30)setTimeout(run,60)
      else{
        const t=document.getElementById('toast')
        if(t){t.textContent='Essa conversa ainda está sincronizando. Tente novamente.';t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),2200)}
      }
    }
    run()
    return true
  }

  // Este listener é registrado antes do app-v34 e dos outros roteadores.
  // O clique visual nunca chega às camadas antigas: vira primeiro um UUID exato.
  window.addEventListener('click',e=>{
    if(!approved())return

    const visual=e.target?.closest?.('#kaConversationList .ka-conv-card,#kaConversationList [data-ka-conv],#kaConversationList [data-source-conv],#kaConversationList [data-safe-conv]')
    if(visual){
      const id=String(visual.dataset?.safeConv||visual.dataset?.sourceConv||visual.dataset?.kaConv||'')
      if(!id)return
      e.preventDefault();e.stopImmediatePropagation()
      openExact(id)
      return
    }

    const native=e.target?.closest?.('#chatList .chat-item[data-conv]')
    if(!native)return
    const id=String(native.dataset.conv||'')
    if(!id)return

    // Durante uma seleção armada, nenhum script pode abrir outro UUID.
    if(!e.isTrusted&&intendedId&&now()<lockUntil&&id!==intendedId&&internalId!==id){
      e.preventDefault();e.stopImmediatePropagation();return
    }
    if(internalId===id)return
    if(e.isTrusted)arm(id)
  },true)

  window.addEventListener('keydown',e=>{
    if(!approved()||!['Enter',' '].includes(e.key))return
    const visual=e.target?.closest?.('#kaConversationList .ka-conv-card,#kaConversationList [data-ka-conv],#kaConversationList [data-source-conv],#kaConversationList [data-safe-conv]')
    if(!visual)return
    const id=String(visual.dataset?.safeConv||visual.dataset?.sourceConv||visual.dataset?.kaConv||'')
    if(!id)return
    e.preventDefault();e.stopImmediatePropagation();openExact(id)
  },true)

  // Se qualquer MutationObserver/roteador tardio tentar trocar a conversa,
  // restaura a escolhida pelo usuário enquanto o painel estiver aberto.
  const observer=new MutationObserver(()=>{
    if(!approved()||!intendedId||now()>lockUntil)return
    const panel=document.getElementById('chatPanel')
    if(!panel||panel.classList.contains('hidden'))return
    const active=currentActiveId()
    if(active&&active!==intendedId)verifyAndRestore(intendedId,0)
  })
  const observe=()=>{
    const root=document.getElementById('mainView')||document.body
    try{observer.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class']})}catch{}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});else observe()

  document.addEventListener('isa:approved-home-ready',()=>{
    if(document.body.classList.contains('keise-home-active')){
      intendedId='';internalId='';lockUntil=0;clearTimeout(restoreTimer)
    }
  })

  window.__ISA_OPEN_EXACT_CONVERSATION_EARLY__=openExact
  window.__ISA_EXACT_CONVERSATION_GUARD__={openExact,get intendedId(){return intendedId},get activeId(){return currentActiveId()}}
})()

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

function start(){
  ensureTouchCss()
  if(!approvedProfile())ensureGlobalSettingsEntry()
  let tries=0
  const timer=setInterval(()=>{if(!approvedProfile())ensureGlobalSettingsEntry();if(++tries>=32)clearInterval(timer)},300)
}
start();document.addEventListener('DOMContentLoaded',start,{once:true})
window.__ISA_MOBILE_GUARD__={singleNavigation:true,approvedProfiles:['keise','isa','alan'],exactConversationRouting:true,version:'v2'}
