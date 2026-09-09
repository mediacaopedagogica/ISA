// Keise — ponte única de conversas para notebook e celular.
// O dashboard é apenas a entrada visual. Ao abrir uma conversa, usamos o chat REAL do núcleo.
(function(){
  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR')
  const isKeise=()=>{
    const requested=norm(new URLSearchParams(location.search).get('perfil'))
    const current=norm($('myName')?.textContent)
    return requested==='keise'||current==='keise'||current.startsWith('keise ')
  }

  function toast(text){
    const t=$('toast')
    if(!t){console.info(text);return}
    t.textContent=text;t.classList.remove('hidden')
    clearTimeout(t._kcu);t._kcu=setTimeout(()=>t.classList.add('hidden'),2600)
  }

  function installCss(){
    if(document.getElementById('keiseUnifiedChatStyle'))return
    const s=document.createElement('style')
    s.id='keiseUnifiedChatStyle'
    s.textContent=`
      body.keise-dashboard-mode #kdConversationList{
        display:grid!important;gap:11px!important;width:100%!important;max-width:760px!important
      }
      body.keise-dashboard-mode #kdConversationList .kd-conv-card{
        display:flex!important;align-items:center!important;gap:12px!important;width:100%!important;min-width:0!important;
        min-height:88px!important;height:auto!important;margin:0!important;padding:10px 18px!important;border-radius:24px!important;
        border:1px solid rgba(255,255,255,.97)!important;background:linear-gradient(120deg,#fff6e8,#ffeef4)!important;
        box-shadow:0 12px 25px rgba(93,70,111,.11)!important;transform:none!important;color:#543b65!important;text-align:left!important;
        cursor:pointer!important;pointer-events:auto!important;touch-action:manipulation!important
      }
      body.keise-dashboard-mode #kdConversationList .kd-conv-card:nth-child(2){background:linear-gradient(120deg,#eef7ff,#f0f2ff)!important}
      body.keise-dashboard-mode #kdConversationList .kd-conv-card:nth-child(3){background:linear-gradient(120deg,#fff8e7,#fff0e9)!important}
      body.keise-dashboard-mode #kdConversationList .kd-conv-card:hover{transform:translateY(-2px)!important}
      body.keise-dashboard-mode #kdConversationList .kd-conv-card .avatar{width:62px!important;height:62px!important;flex:0 0 62px!important;border-radius:18px!important}
      body.keise-dashboard-mode #kdConversationList .kd-conv-card .grow{min-width:0!important}
      body.keise-dashboard-mode #kdConversationList .kd-conv-card strong{display:block!important;font-size:16px!important;line-height:1.2!important}
      body.keise-dashboard-mode #kdConversationList .kd-conv-card small{display:block!important;margin-top:4px!important;font-size:13px!important;line-height:1.25!important;color:#8e7899!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}

      /* Ao sair do dashboard, nenhuma barra lateral reaparece: o módulo aberto usa a tela inteira. */
      body.keise-dashboard-mode.keise-panel-active #keiseDesktopTopbar,
      body.keise-dashboard-mode.keise-panel-active #keiseHomeDashboard,
      body.keise-dashboard-mode.keise-panel-active #mainView>.sidebar{display:none!important;visibility:hidden!important}
      body.keise-dashboard-mode.keise-panel-active #mainView{
        display:block!important;width:100%!important;max-width:100%!important;height:100dvh!important;min-height:100dvh!important;
        margin:0!important;padding:0!important;overflow:hidden!important;background:linear-gradient(155deg,#fff8fb,#f7f0ff 57%,#f2f8ff)!important
      }
      body.keise-dashboard-mode.keise-panel-active #mainView>.content{
        display:block!important;visibility:visible!important;width:100%!important;max-width:100%!important;min-width:0!important;
        height:100dvh!important;min-height:100dvh!important;max-height:100dvh!important;margin:0!important;padding:0!important;
        border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;overflow:hidden!important
      }
      body.keise-dashboard-mode.keise-panel-active #chatPanel:not(.hidden){
        display:grid!important;width:100%!important;height:100dvh!important;min-height:100dvh!important;max-height:100dvh!important
      }
      body.keise-dashboard-mode.keise-panel-active #calendarPanel:not(.hidden),
      body.keise-dashboard-mode.keise-panel-active #familyPanel:not(.hidden),
      body.keise-dashboard-mode.keise-panel-active #supervisionPanel:not(.hidden),
      body.keise-dashboard-mode.keise-panel-active #parentsPanel:not(.hidden),
      body.keise-dashboard-mode.keise-panel-active #studyPanel:not(.hidden),
      body.keise-dashboard-mode.keise-panel-active #diaryPanel:not(.hidden){display:block!important;width:100%!important;height:100dvh!important;overflow:auto!important}
      body.keise-dashboard-mode.keise-panel-active #mobileBackBtn{display:grid!important;place-items:center!important;pointer-events:auto!important}

      @media(max-width:850px){
        body.keise-dashboard-mode #kdConversationList{max-width:100%!important}
        body.keise-dashboard-mode #kdConversationList .kd-conv-card{min-height:88px!important;padding:10px 12px!important;border-radius:22px!important}
        body.keise-dashboard-mode #kdConversationList .kd-conv-card .avatar{width:60px!important;height:60px!important;flex-basis:60px!important;border-radius:18px!important}
        body.keise-dashboard-mode.keise-panel-active #chatPanel:not(.hidden){grid-template-rows:auto auto auto minmax(0,1fr) auto auto!important}
        body.keise-dashboard-mode.keise-panel-active .chat-header{padding-top:max(10px,env(safe-area-inset-top))!important}
        body.keise-dashboard-mode.keise-panel-active .messages{min-width:0!important;max-width:100%!important;overflow-x:hidden!important}
        body.keise-dashboard-mode.keise-panel-active .bubble{max-width:88%!important;overflow-wrap:anywhere!important;word-break:break-word!important}
        body.keise-dashboard-mode.keise-panel-active .composer{width:100%!important;max-width:100%!important;min-width:0!important;padding-left:7px!important;padding-right:7px!important}
        body.keise-dashboard-mode.keise-panel-active .composer textarea{min-width:0!important;flex:1 1 auto!important}
      }
    `
    document.head.appendChild(s)
  }

  function enterPanel(){
    if(typeof window.__ISA_KEISE_ENTER_PANEL__==='function')window.__ISA_KEISE_ENTER_PANEL__()
    else{
      document.body.classList.remove('keise-home-active')
      document.body.classList.add('keise-dashboard-mode','keise-panel-active')
      $('keiseHomeDashboard')?.classList.add('hidden')
    }
  }

  function findSourceCard(id){
    return [...document.querySelectorAll('#chatList .chat-item[data-conv]')].find(el=>String(el.dataset.conv)===String(id))||null
  }

  function forceChatVisible(){
    const main=$('mainView'),content=main?.querySelector('.content'),chat=$('chatPanel')
    if(!chat||chat.classList.contains('hidden'))return false
    enterPanel()
    main?.classList.add('mobile-content-open','mobile-chat-open','mobile-native-content')
    if(content){
      content.style.setProperty('display','block','important')
      content.style.setProperty('visibility','visible','important')
      content.style.setProperty('width','100%','important')
      content.style.setProperty('height','100dvh','important')
    }
    chat.style.setProperty('display','grid','important')
    chat.style.setProperty('width','100%','important')
    chat.style.setProperty('height','100dvh','important')
    return true
  }

  function openRealConversation(id){
    const source=findSourceCard(id)
    if(!source){
      toast('A conversa está sincronizando. Tente novamente em um instante.')
      window.__ISA_SHOW_KEISE_HOME__?.()
      return false
    }
    enterPanel()
    source.click()
    ;[40,120,260,520].forEach(ms=>setTimeout(()=>{
      if(forceChatVisible())return
      if(ms===520){
        window.__ISA_SHOW_KEISE_HOME__?.()
        toast('Não consegui abrir essa conversa agora. Ela continua salva; tente novamente.')
      }
    },ms))
    return true
  }

  function bindClicks(){
    if(document.documentElement.dataset.keiseUnifiedChatBound==='2')return
    document.documentElement.dataset.keiseUnifiedChatBound='2'

    document.addEventListener('click',event=>{
      if(!isKeise())return
      const card=event.target.closest?.('#kdConversationList .kd-conv-card[data-conv]')
      if(!card)return
      event.preventDefault();event.stopImmediatePropagation()
      openRealConversation(card.dataset.conv)
    },true)

    document.addEventListener('click',event=>{
      if(!isKeise())return
      if(!event.target.closest?.('#mobileBackBtn,#mobileNativeBack'))return
      setTimeout(()=>{
        const chat=$('chatPanel')
        chat?.style.removeProperty('display');chat?.style.removeProperty('width');chat?.style.removeProperty('height')
        const main=$('mainView'),content=main?.querySelector('.content')
        main?.classList.remove('mobile-content-open','mobile-chat-open','mobile-panel-open','mobile-native-content')
        content?.style.removeProperty('display');content?.style.removeProperty('visibility');content?.style.removeProperty('width');content?.style.removeProperty('height')
        window.__ISA_SHOW_KEISE_HOME__?.()
      },100)
    },false)
  }

  function start(){
    if(!isKeise()){
      let tries=0
      const timer=setInterval(()=>{
        if(isKeise()){clearInterval(timer);installCss();bindClicks()}
        else if(++tries>50)clearInterval(timer)
      },120)
      return
    }
    installCss();bindClicks()
  }

  start()
  window.__ISA_OPEN_KEISE_CONVERSATION__=openRealConversation
})();