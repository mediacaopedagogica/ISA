// Keise — ponte única de conversas para notebook e celular.
// Mantém o dashboard visual, mas usa SEMPRE a conversa real do núcleo (#chatList / data-conv).
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
      /* Os cards de conversa são o MESMO componente visual em notebook e celular. */
      body.keise-dashboard-mode #kdConversationList{
        display:grid!important;
        gap:11px!important;
        width:100%!important;
        max-width:760px!important;
      }
      body.keise-dashboard-mode #kdConversationList .kd-conv-card{
        display:flex!important;
        align-items:center!important;
        gap:12px!important;
        width:100%!important;
        min-width:0!important;
        min-height:88px!important;
        height:auto!important;
        margin:0!important;
        padding:10px 18px!important;
        border-radius:24px!important;
        border:1px solid rgba(255,255,255,.97)!important;
        background:linear-gradient(120deg,#fff6e8,#ffeef4)!important;
        box-shadow:0 12px 25px rgba(93,70,111,.11)!important;
        transform:none!important;
        color:#543b65!important;
        text-align:left!important;
        cursor:pointer!important;
        pointer-events:auto!important;
        touch-action:manipulation!important;
      }
      body.keise-dashboard-mode #kdConversationList .kd-conv-card:nth-child(2){background:linear-gradient(120deg,#eef7ff,#f0f2ff)!important}
      body.keise-dashboard-mode #kdConversationList .kd-conv-card:nth-child(3){background:linear-gradient(120deg,#fff8e7,#fff0e9)!important}
      body.keise-dashboard-mode #kdConversationList .kd-conv-card:hover{transform:translateY(-2px)!important}
      body.keise-dashboard-mode #kdConversationList .kd-conv-card .avatar{
        width:62px!important;height:62px!important;flex:0 0 62px!important;border-radius:18px!important
      }
      body.keise-dashboard-mode #kdConversationList .kd-conv-card .grow{min-width:0!important}
      body.keise-dashboard-mode #kdConversationList .kd-conv-card strong{display:block!important;font-size:16px!important;line-height:1.2!important}
      body.keise-dashboard-mode #kdConversationList .kd-conv-card small{
        display:block!important;margin-top:4px!important;font-size:13px!important;line-height:1.25!important;color:#8e7899!important;
        white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important
      }

      /* CORREÇÃO PRINCIPAL: o hardstyle antigo escondia chat/calendário mesmo depois de sair do dashboard. */
      body.keise-dashboard-mode:not(.keise-home-active) #keiseDesktopTopbar,
      body.keise-dashboard-mode:not(.keise-home-active) #keiseHomeDashboard{display:none!important}

      @media (min-width:851px){
        body.keise-dashboard-mode:not(.keise-home-active) #mainView{
          display:grid!important;
          grid-template-columns:310px minmax(0,1fr)!important;
          grid-template-rows:minmax(0,1fr)!important;
          gap:18px!important;
          width:100%!important;
          max-width:none!important;
          min-height:100vh!important;
          height:100vh!important;
          margin:0!important;
          padding:18px!important;
          overflow:hidden!important;
          background:transparent!important;
        }
        body.keise-dashboard-mode:not(.keise-home-active) #mainView>.sidebar{
          display:flex!important;
          visibility:visible!important;
          flex-direction:column!important;
          grid-column:1!important;
          grid-row:1!important;
          width:auto!important;
          min-width:0!important;
          max-width:none!important;
          min-height:calc(100vh - 36px)!important;
          height:calc(100vh - 36px)!important;
          max-height:calc(100vh - 36px)!important;
          margin:0!important;
          padding:0!important;
          border:1px solid rgba(255,255,255,.9)!important;
          border-radius:28px!important;
          background:rgba(255,255,255,.74)!important;
          box-shadow:0 18px 55px rgba(86,66,103,.12)!important;
          overflow:hidden!important;
          pointer-events:auto!important;
        }
        body.keise-dashboard-mode:not(.keise-home-active) #mainView>.content{
          display:block!important;
          grid-column:2!important;
          grid-row:1!important;
          width:auto!important;
          max-width:none!important;
          min-width:0!important;
          min-height:calc(100vh - 36px)!important;
          height:calc(100vh - 36px)!important;
          margin:0!important;
          padding:0!important;
          border:1px solid rgba(255,255,255,.9)!important;
          border-radius:28px!important;
          background:rgba(255,255,255,.74)!important;
          box-shadow:0 18px 55px rgba(86,66,103,.12)!important;
          overflow:hidden!important;
        }
        body.keise-dashboard-mode:not(.keise-home-active) #chatPanel:not(.hidden){display:grid!important;height:calc(100vh - 36px)!important}
        body.keise-dashboard-mode:not(.keise-home-active) #emptyState:not(.hidden){display:grid!important}
        body.keise-dashboard-mode:not(.keise-home-active) #calendarPanel:not(.hidden),
        body.keise-dashboard-mode:not(.keise-home-active) #familyPanel:not(.hidden),
        body.keise-dashboard-mode:not(.keise-home-active) #supervisionPanel:not(.hidden),
        body.keise-dashboard-mode:not(.keise-home-active) #parentsPanel:not(.hidden),
        body.keise-dashboard-mode:not(.keise-home-active) #studyPanel:not(.hidden),
        body.keise-dashboard-mode:not(.keise-home-active) #diaryPanel:not(.hidden){display:block!important}
      }

      @media (max-width:850px){
        body.keise-dashboard-mode #kdConversationList{max-width:100%!important}
        /* Não mudamos o desenho dos cards no mobile: só a largura acompanha a tela. */
        body.keise-dashboard-mode #kdConversationList .kd-conv-card{
          min-height:88px!important;padding:10px 18px!important;border-radius:24px!important
        }
        body.keise-dashboard-mode #kdConversationList .kd-conv-card .avatar{
          width:62px!important;height:62px!important;flex-basis:62px!important;border-radius:18px!important
        }

        body.keise-dashboard-mode:not(.keise-home-active) #mainView{
          display:block!important;
          width:100%!important;
          max-width:100%!important;
          min-height:100dvh!important;
          height:100dvh!important;
          margin:0!important;
          padding:0!important;
          overflow:hidden!important;
          background:transparent!important;
        }
        body.keise-dashboard-mode:not(.keise-home-active) #mainView>.sidebar{
          display:flex!important;
          visibility:visible!important;
          flex-direction:column!important;
          width:100%!important;
          min-width:0!important;
          max-width:100%!important;
          min-height:100dvh!important;
          height:100dvh!important;
          max-height:100dvh!important;
          margin:0!important;
          padding:0!important;
          border:0!important;
          border-radius:0!important;
          overflow:hidden!important;
          pointer-events:auto!important;
        }
        body.keise-dashboard-mode:not(.keise-home-active) #mainView>.content{
          display:none!important;
          width:100%!important;
          min-width:0!important;
          max-width:100%!important;
          min-height:100dvh!important;
          height:100dvh!important;
          margin:0!important;
          padding:0!important;
          border:0!important;
          border-radius:0!important;
          overflow:hidden!important;
        }
        body.keise-dashboard-mode:not(.keise-home-active) #mainView.mobile-content-open>.sidebar{display:none!important}
        body.keise-dashboard-mode:not(.keise-home-active) #mainView.mobile-content-open>.content{display:block!important}
        body.keise-dashboard-mode:not(.keise-home-active) #chatPanel:not(.hidden){display:grid!important;height:100dvh!important;min-height:100dvh!important}
        body.keise-dashboard-mode:not(.keise-home-active) #calendarPanel:not(.hidden),
        body.keise-dashboard-mode:not(.keise-home-active) #familyPanel:not(.hidden),
        body.keise-dashboard-mode:not(.keise-home-active) #supervisionPanel:not(.hidden),
        body.keise-dashboard-mode:not(.keise-home-active) #parentsPanel:not(.hidden),
        body.keise-dashboard-mode:not(.keise-home-active) #studyPanel:not(.hidden),
        body.keise-dashboard-mode:not(.keise-home-active) #diaryPanel:not(.hidden){display:block!important}
      }
    `
    document.head.appendChild(s)
  }

  function releaseDashboard(){
    document.body.classList.remove('keise-home-active')
    $('keiseHomeDashboard')?.classList.add('hidden')
  }

  function findSourceCard(id){
    return [...document.querySelectorAll('#chatList .chat-item[data-conv]')].find(el=>String(el.dataset.conv)===String(id))||null
  }

  function openRealConversation(id){
    const source=findSourceCard(id)
    if(!source){
      toast('A conversa está sincronizando. Tente novamente em um instante.')
      window.__ISA_SHOW_KEISE_HOME__?.()
      return false
    }
    releaseDashboard()
    source.click()
    setTimeout(()=>{
      const chat=$('chatPanel')
      if(chat&&!chat.classList.contains('hidden')){
        window.__ISA_MOBILE_GUARD__?.showMobileContent?.('chat')
        return
      }
      window.__ISA_SHOW_KEISE_HOME__?.()
      toast('Não consegui abrir essa conversa. Ela continua salva; tente novamente.')
    },220)
    return true
  }

  function bindClicks(){
    if(document.documentElement.dataset.keiseUnifiedChatBound==='1')return
    document.documentElement.dataset.keiseUnifiedChatBound='1'

    // Captura antes do clone chamar orig.click(): abre sempre o item REAL e atual do #chatList.
    document.addEventListener('click',event=>{
      if(!isKeise())return
      const card=event.target.closest?.('#kdConversationList .kd-conv-card[data-conv]')
      if(!card)return
      event.preventDefault()
      event.stopImmediatePropagation()
      openRealConversation(card.dataset.conv)
    },true)

    // Ao voltar no celular, retorna ao dashboard da Keise em vez de deixar a tela vazia.
    document.addEventListener('click',event=>{
      if(!isKeise())return
      if(!event.target.closest?.('#mobileBackBtn'))return
      setTimeout(()=>{
        const main=$('mainView')
        main?.classList.remove('mobile-content-open','mobile-chat-open','mobile-panel-open')
        window.__ISA_SHOW_KEISE_HOME__?.()
      },80)
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
