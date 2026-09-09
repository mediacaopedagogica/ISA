// Isa Chat — ponte ÚNICA de navegação dos perfis principais (exceto Keise).
// O núcleo app-v33 continua dono de conversas, Supabase, histórico e permissões.
// Esta camada controla SOMENTE qual coluna/painel aparece no mobile.
(function(){
  const $=id=>document.getElementById(id)
  const mq=matchMedia('(max-width:850px)')
  let started=false,observer=null,syncTimer=null

  function norm(v){return String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
  function requested(){return norm(new URLSearchParams(location.search).get('perfil'))}
  function who(){return norm($('myName')?.textContent)}
  function isKeise(){const p=requested(),n=who();return p==='keise'||n==='keise'||n.startsWith('keise ')}
  function main(){return $('mainView')}
  function ready(){const m=main();return !!m&&!m.classList.contains('hidden')&&!!who()&&who()!=='familia'&&!isKeise()}
  function visible(el){return !!el&&!el.classList.contains('hidden')}

  function knownPanels(){
    return [
      $('chatPanel'),$('calendarPanel'),$('familyPanel'),$('supervisionPanel'),$('parentsPanel'),
      $('socialPanel'),$('studyPanel'),$('diaryPanel')
    ].filter(Boolean)
  }
  function visibleNonChatPanel(){return knownPanels().find(el=>el.id!=='chatPanel'&&visible(el))||null}

  function backButton(){
    let b=$('mobilePanelBack')
    if(!b){
      b=document.createElement('button')
      b.id='mobilePanelBack';b.type='button';b.className='hidden';b.textContent='←'
      b.title='Voltar às conversas';b.setAttribute('aria-label','Voltar às conversas')
      main()?.querySelector(':scope > .content')?.appendChild(b)
      b.addEventListener('click',e=>{
        e.preventDefault();e.stopPropagation()
        const chatTab=document.querySelector('.nav-tabs .nav-btn[data-tab="chats"]')
        chatTab?.click()
        setTimeout(showList,0);setTimeout(showList,90)
      })
    }
    return b
  }

  function clearMobileState(){
    const m=main();if(!m)return
    m.classList.remove('mobile-content-open','mobile-chat-open','mobile-panel-open','mobile-native-content')
    backButton()?.classList.add('hidden')
  }
  function showList(){
    if(!ready())return
    const m=main();if(!m)return
    m.classList.remove('mobile-content-open','mobile-chat-open','mobile-panel-open','mobile-native-content')
    backButton()?.classList.add('hidden')
    const list=$('chatList')
    if(list){list.style.removeProperty('display');list.style.removeProperty('visibility');list.style.removeProperty('pointer-events')}
  }
  function showChat(){
    if(!ready()||!mq.matches)return
    const m=main();if(!m)return
    m.classList.add('mobile-content-open','mobile-chat-open')
    m.classList.remove('mobile-panel-open','mobile-native-content')
    backButton()?.classList.add('hidden') // chat já possui #mobileBackBtn real do núcleo
  }
  function showPanel(){
    if(!ready()||!mq.matches)return
    const m=main();if(!m)return
    m.classList.add('mobile-content-open','mobile-panel-open')
    m.classList.remove('mobile-chat-open','mobile-native-content')
    backButton()?.classList.remove('hidden')
  }

  function sync(){
    if(!ready())return
    if(!mq.matches){clearMobileState();return}
    if(visible($('chatPanel'))){showChat();return}
    if(visibleNonChatPanel()){showPanel();return}
    showList()
  }
  function scheduleSync(){
    clearTimeout(syncTimer)
    syncTimer=setTimeout(sync,0)
    ;[45,130,320].forEach(ms=>setTimeout(sync,ms))
  }

  function onClick(e){
    if(!ready()||!mq.matches)return
    const conversation=e.target.closest?.('#chatList .chat-item[data-conv]')
    if(conversation&&!e.target.closest?.('.conversation-pin-action')){scheduleSync();return}

    const back=e.target.closest?.('#mobileBackBtn')
    if(back){setTimeout(showList,20);setTimeout(showList,130);return}

    const nav=e.target.closest?.('.nav-tabs .nav-btn')
    if(nav){
      if(nav.dataset.tab==='chats'){setTimeout(showList,25);setTimeout(showList,140)}
      else scheduleSync()
      return
    }

    // Nossa Rede, Configurações e módulos dinâmicos não usam sempre data-tab.
    if(e.target.closest?.('#socialNav,#settingsMenuBtn,#generalSettingsNav,#studyNav,#diaryNav,#alanStudioLauncher,#alanStudioEntry'))scheduleSync()
  }

  function installObserver(){
    const content=main()?.querySelector(':scope > .content')
    if(!content||observer)return
    observer=new MutationObserver(()=>scheduleSync())
    observer.observe(content,{subtree:true,childList:true,attributes:true,attributeFilter:['class']})
  }

  function start(){
    if(started||!ready())return false
    started=true
    document.body.classList.add('isa-personal-navigation-core')
    backButton();installObserver()
    document.addEventListener('click',onClick,false)
    mq.addEventListener?.('change',scheduleSync)
    window.addEventListener('resize',scheduleSync,{passive:true})
    scheduleSync()
    window.__ISA_MOBILE_SHOW_CONTENT__=kind=>kind==='chat'?showChat():showPanel()
    window.__ISA_MOBILE_SHOW_CONVERSATIONS__=showList
    window.__ISA_PERSONAL_NAV_SYNC__=scheduleSync
    return true
  }

  if(!start()){
    let tries=0
    const timer=setInterval(()=>{if(start()||++tries>100)clearInterval(timer)},120)
  }
})();
