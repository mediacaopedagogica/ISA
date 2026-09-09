// Keise — ponte funcional única entre o dashboard aprovado e o chat real do núcleo.
// Não cria CSS, não adiciona classes mobile antigas e não mantém um segundo dashboard.
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

  function enterPanel(){
    if(typeof window.__ISA_KEISE_ENTER_PANEL__==='function'){
      window.__ISA_KEISE_ENTER_PANEL__();return
    }
    document.body.classList.remove('keise-home-active')
    document.body.classList.add('keise-approved-layout','keise-dashboard-mode','keise-panel-active')
  }

  function findSourceCard(id){
    return [...document.querySelectorAll('#chatList .chat-item[data-conv]')]
      .find(el=>String(el.dataset.conv)===String(id))||null
  }

  function chatOpened(id){
    const chat=$('chatPanel')
    if(!chat||chat.classList.contains('hidden'))return false
    const active=[...document.querySelectorAll('#chatList .chat-item[data-conv]')]
      .some(el=>String(el.dataset.conv)===String(id)&&el.classList.contains('active'))
    return active||!!$('chatTitle')?.textContent?.trim()
  }

  function openRealConversation(id){
    if(!isKeise()||!id)return false
    const source=findSourceCard(id)
    if(!source){
      toast('A conversa está sincronizando. Tente novamente em um instante.')
      window.__ISA_SHOW_KEISE_HOME__?.()
      return false
    }

    // Este é o ÚNICO ponto que conversa com a lista nativa do núcleo.
    // Todo o restante da interface Keise usa apenas a ponte pública abaixo.
    enterPanel()
    source.click()

    ;[80,220,520].forEach(ms=>setTimeout(()=>{
      if(chatOpened(id)){enterPanel();return}
      if(ms===520){
        window.__ISA_SHOW_KEISE_HOME__?.()
        toast('Não consegui abrir essa conversa agora. Ela continua salva; tente novamente.')
      }
    },ms))
    return true
  }

  window.__ISA_OPEN_KEISE_CONVERSATION__=openRealConversation
  window.__ISA_KEISE_CHAT_BRIDGE__={openConversation:openRealConversation}
})();
