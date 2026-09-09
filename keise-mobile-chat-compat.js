// Compatibilidade do chat unificado da Keise com ?mobile=1.
(function(){
  const s=document.createElement('style')
  s.id='keiseMobileChatCompat'
  s.textContent=`
    @media(max-width:850px){
      body.keise-dashboard-mode:not(.keise-home-active) #mainView.mobile-native-content>.sidebar{display:none!important}
      body.keise-dashboard-mode:not(.keise-home-active) #mainView.mobile-native-content>.content{display:block!important}
      body.keise-dashboard-mode:not(.keise-home-active) #mainView.mobile-native-content #chatPanel:not(.hidden){display:grid!important}
    }
  `
  document.getElementById(s.id)?.remove()
  document.head.appendChild(s)

  document.addEventListener('click',event=>{
    if(!event.target.closest?.('#kdConversationList .kd-conv-card[data-conv]'))return
    setTimeout(()=>window.__ISA_MOBILE_GUARD__?.syncDedicated?.(),40)
  },false)

  document.addEventListener('click',event=>{
    if(!event.target.closest?.('#mobileBackBtn,#mobileNativeBack'))return
    setTimeout(()=>{
      document.getElementById('mainView')?.classList.remove('mobile-native-content')
      window.__ISA_SHOW_KEISE_HOME__?.()
    },90)
  },false)
})();
