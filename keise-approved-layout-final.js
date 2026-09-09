// Keise — layout FINAL aprovado para notebook e mobile.
// O DOM antigo permanece apenas como núcleo funcional invisível; nada é apagado.
(function(){
  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const wait=ms=>new Promise(r=>setTimeout(r,ms))
  let built=false,chatObserver=null,identityTimer=null,busyAction=''

  const requested=()=>norm(new URLSearchParams(location.search).get('perfil'))
  const current=()=>norm($('myName')?.textContent)
  const isKeise=()=>requested()==='keise'||current()==='keise'||current().startsWith('keise ')
  const isMobileLink=()=>requested()==='keise'
  const mainReady=()=>!!$('mainView')&&!$('mainView').classList.contains('hidden')&&isKeise()

  function toast(text){
    const t=$('toast')
    if(!t){console.info(text);return}
    t.textContent=text;t.classList.remove('hidden');clearTimeout(t._ka);t._ka=setTimeout(()=>t.classList.add('hidden'),2800)
  }
  function ensureCss(){
    if(document.getElementById('keiseApprovedFinalCss'))return
    const l=document.createElement('link');l.id='keiseApprovedFinalCss';l.rel='stylesheet';l.href='./keise-approved-layout-final.css?v=2-interactive';document.head.appendChild(l)
  }
  async function find(selector,tries=28,delay=80){for(let i=0;i<tries;i++){const el=document.querySelector(selector);if(el)return el;await wait(delay)}return null}
  async function ensureModule(modulePath){try{await import(modulePath);return true}catch(e){console.warn('Keise módulo:',modulePath,e);return false}}
  async function clickTarget(selector,modulePath){
    let el=document.querySelector(selector)
    if(!el&&modulePath){await ensureModule(modulePath);el=await find(selector,22,80)}
    if(el){el.click();return true}
    return false
  }

  function setAccessClass(){
    document.body.classList.toggle('keise-mobile-access-link',isMobileLink())
    document.body.classList.toggle('keise-notebook-access-link',!isMobileLink())
  }
  function shell(){const main=$('mainView');return{main,sidebar:main?.querySelector(':scope > .sidebar')||main?.querySelector('.sidebar'),content:main?.querySelector(':scope > .content')||main?.querySelector('.content')}}
  function clearInline(el,props){if(!el)return;props.forEach(p=>el.style.removeProperty(p))}

  function hideNativeHomePieces(){
    const {content}=shell();if(!content)return
    ;[...content.children].forEach(el=>{if(el.id!=='keiseApprovedHome'&&el.tagName==='SECTION')el.classList.add('hidden')})
  }
  function restoreShellForHome(){
    const {main,sidebar,content}=shell()
    clearInline(main,['display','grid-template-columns','grid-template-rows','width','max-width','min-width','height','min-height','max-height','margin','padding','overflow','background'])
    clearInline(sidebar,['display','visibility','width','min-width','max-width','height','min-height','max-height','padding','margin','border','overflow','pointer-events'])
    clearInline(content,['display','visibility','grid-column','grid-row','width','max-width','min-width','height','min-height','max-height','margin','margin-left','padding','border','border-radius','background','box-shadow','overflow','pointer-events'])
  }

  function enterHome({scrollConversations=false}={}){
    if(!built||!mainReady())return
    ensureCss();setAccessClass();restoreShellForHome()
    const {main}=shell()
    document.body.classList.add('keise-approved-layout','keise-dashboard-mode','keise-home-active')
    document.body.classList.remove('keise-panel-active')
    main?.classList.remove('mobile-content-open','mobile-chat-open','mobile-panel-open','mobile-native-content')
    hideNativeHomePieces()
    $('keiseApprovedTopbar')?.classList.remove('hidden')
    $('keiseApprovedHome')?.classList.remove('hidden')
    syncIdentity();syncConversations()
    if(scrollConversations)setTimeout(()=>$('kaConversations')?.scrollIntoView({behavior:'smooth',block:'start'}),70)
  }

  function enterPanel(){
    ensureCss();setAccessClass()
    const {main,sidebar,content}=shell()
    document.body.classList.add('keise-approved-layout','keise-dashboard-mode','keise-panel-active')
    document.body.classList.remove('keise-home-active')
    $('keiseApprovedTopbar')?.classList.add('hidden')
    $('keiseApprovedHome')?.classList.add('hidden')
    if(sidebar){sidebar.style.setProperty('display','none','important');sidebar.style.setProperty('visibility','hidden','important');sidebar.style.setProperty('width','0','important')}
    if(main){main.style.setProperty('display','block','important');main.style.setProperty('width','100%','important');main.style.setProperty('height','100dvh','important');main.style.setProperty('overflow','hidden','important')}
    if(content){content.style.setProperty('display','block','important');content.style.setProperty('visibility','visible','important');content.style.setProperty('width','100%','important');content.style.setProperty('height','100dvh','important');content.style.setProperty('margin','0','important');content.style.setProperty('padding','0','important');content.style.setProperty('overflow','hidden','important')}
  }
  window.__ISA_KEISE_ENTER_PANEL__=enterPanel

  async function openStatus(){
    let cloud=$('pssProfileCloud')
    if(!cloud){await ensureModule('./profile-status-stickers.js?v=14-plus-menu');cloud=await find('#pssProfileCloud',24,80)}
    if(cloud){cloud.click();return true}
    const avatar=$('myAvatarBtn');if(avatar){avatar.click();return true}
    toast('Meu perfil e status ainda está carregando.');return false
  }
  async function openSettings(){
    if(typeof window.__ISA_OPEN_GENERAL_SETTINGS__!=='function')await ensureModule('./general-settings.js?v=12-unified-settings')
    if(typeof window.__ISA_OPEN_GENERAL_SETTINGS__==='function'){window.__ISA_OPEN_GENERAL_SETTINGS__();return true}
    const ok=await clickTarget('#settingsMenuBtn,[data-settings-menu="1"]');if(!ok)toast('Configurações ainda estão carregando.');return ok
  }
  async function openNotifications(){
    await ensureModule('./notifications-v2.js?v=11-progressive')
    if('Notification' in window&&Notification.permission==='granted'){toast('🔔 As notificações já estão ativas neste aparelho.');return true}
    const btn=$('enableNotificationsBtn')
    if(btn){btn.click();return true}
    toast('Notificações ainda estão carregando.');return false
  }
  function openAvatarPicker(){
    const core=$('myAvatarBtn')
    if(core){core.click();return true}
    const input=$('profileAvatarInput')
    if(input){input.click();return true}
    toast('A troca da foto ainda está carregando.');return false
  }
  function openGroup(){
    const btn=$('newGroupBtn')
    if(btn){btn.click();return true}
    toast('A criação de grupo ainda está carregando.');return false
  }
  function logout(){
    const core=$('logoutBtn')
    if(core){
      core.click()
      // O index já possui fallback de logout; este segundo fallback evita botão aparentemente congelado.
      setTimeout(()=>{
        const main=$('mainView')
        if(!main||main.classList.contains('hidden'))return
        try{
          for(const store of [localStorage,sessionStorage]){
            const keys=[];for(let i=0;i<store.length;i++){const k=store.key(i)||'';if(/auth-token/i.test(k))keys.push(k)}
            keys.forEach(k=>store.removeItem(k))
          }
        }catch{}
        location.replace('./?sair=keise&_cb='+Date.now())
      },3800)
      return true
    }
    location.replace('./?sair=keise&_cb='+Date.now());return true
  }

  async function runAction(action){
    if(!action||busyAction===action)return
    busyAction=action
    try{
      if(action==='chat'){enterHome({scrollConversations:true});return}
      if(action==='calendar'){enterPanel();if(!await clickTarget('.nav-tabs .nav-btn[data-tab="calendar"]')){enterHome();toast('Calendário ainda está carregando.')}return}
      if(action==='social'){enterPanel();if(!await clickTarget('#socialNav','./social-nav-guard.js?v=6-progressive')){enterHome();toast('Nossa Rede ainda está carregando.')}return}
      if(action==='test'){enterPanel();if(!await clickTarget('#testGameNav','./keise-game-test.js?v=9-progressive')){enterHome();toast('Teste ainda está carregando.')}return}
      if(action==='supervision'){enterPanel();if(!await clickTarget('#supervisionNav,.nav-tabs .nav-btn[data-tab="supervision"]')){enterHome();toast('Supervisão ainda está carregando.')}return}
      if(action==='parents'){enterPanel();if(!await clickTarget('#parentsNav,.nav-tabs .nav-btn[data-tab="parents"]')){enterHome();toast('Super Pais ainda está carregando.')}return}
      if(action==='access'){if(!await clickTarget('#accessSettingsNav','./keise-access-settings.js?v=1-edit-login'))toast('Meu acesso ainda está carregando.');return}
      if(action==='profile'||action==='status'){await openStatus();return}
      if(action==='settings'){await openSettings();return}
      if(action==='notifications'){await openNotifications();return}
      if(action==='group'){openGroup();return}
      if(action==='logout'){logout();return}
      if(action==='avatar'){openAvatarPicker();return}
    }finally{setTimeout(()=>{busyAction=''},180)}
  }

  function feature(icon,label,action,cls=''){return `<button type="button" class="ka-feature ${cls}" data-ka-action="${action}"><span class="ka-feature-icon">${icon}</span><span>${label}</span></button>`}

  function build(){
    if(built||!mainReady())return false
    ensureCss();setAccessClass()
    const {main,content}=shell();if(!main||!content)return false
    built=true
    document.body.classList.add('keise-approved-layout','keise-dashboard-mode')

    // O dashboard visual anterior é removido; o núcleo funcional original continua intacto e invisível.
    document.querySelectorAll('#keiseDesktopTopbar,#keiseHomeDashboard,.kd-side-menu').forEach(el=>el.remove())

    let top=$('keiseApprovedTopbar')
    if(!top){
      top=document.createElement('header');top.id='keiseApprovedTopbar';top.innerHTML=`
        <div class="ka-brand"><span class="ka-brand-heart">💗</span><span class="ka-brand-name">Cantinho da Isa 💕</span></div>
        <label class="ka-search"><input id="kaSearchInput" type="search" placeholder="Pesquisar no Cantinho da Isa..." aria-label="Pesquisar no Cantinho da Isa"></label>
        <div class="ka-top-actions"><button class="ka-bell" type="button" data-ka-action="notifications" aria-label="Notificações" title="Notificações">🔔</button><button class="ka-top-profile" type="button" data-ka-action="profile"><span id="kaTopAvatar" class="ka-top-avatar">🦋</span><span>Keise</span><span>⌄</span></button></div>`
      main.insertBefore(top,main.firstChild)
    }

    let home=$('keiseApprovedHome')
    if(!home){
      home=document.createElement('section');home.id='keiseApprovedHome';home.innerHTML=`
        <div class="ka-hero">
          <button id="kaAvatarBtn" type="button" class="ka-avatar-btn" data-ka-action="avatar" aria-label="Alterar foto do perfil"><span id="kaAvatarContent" class="ka-avatar-content">🦋</span><span class="ka-camera">📷</span></button>
          <div class="ka-identity"><h1 id="kaName">Keise</h1><p>Cantinho da Isa <span>💕</span></p></div>
          <button type="button" class="ka-status-btn" data-ka-action="status"><span class="cloud">☁️</span><span><b id="kaStatusTitle">Status</b><small id="kaStatusSub">Como estou hoje</small></span><span class="arrow">›</span></button>
          <button id="kaLogout" type="button" class="ka-logout" data-ka-action="logout">Sair</button>
        </div>
        <div class="ka-grid">
          ${feature('💬','Chat','chat')}
          ${feature('📅','Calendário','calendar')}
          ${feature('🌸','Nossa Rede','social')}
          ${feature('🧪','Teste','test','private')}
          ${feature('👀','Supervisão','supervision')}
          ${feature('🛡️','Super Pais','parents')}
          ${feature('🔐','Meu acesso','access')}
          ${feature('👤','Meu perfil','profile')}
          ${feature('⚙️','Configurações','settings','settings')}
        </div>
        <div id="kaConversations" class="ka-conv-head"><h2>Conversas</h2><button type="button" class="ka-group-btn" data-ka-action="group">＋ Grupo</button></div>
        <div id="kaConversationList"></div>
        <div class="ka-heart-deco" aria-hidden="true">💜</div>`
      content.insertBefore(home,content.firstChild)
    }

    // Delegação única: os botões do dashboard continuam ativos mesmo após atualizações do DOM.
    document.addEventListener('click',e=>{
      const b=e.target.closest?.('[data-ka-action]');if(!b||!isKeise())return
      e.preventDefault();e.stopPropagation();runAction(b.dataset.kaAction)
    },true)
    $('kaSearchInput')?.addEventListener('input',filterConversations)

    const source=$('chatList')
    if(source){chatObserver=new MutationObserver(()=>{if(document.body.classList.contains('keise-home-active'))syncConversations()});chatObserver.observe(source,{childList:true,subtree:true,characterData:true,attributes:true})}
    document.addEventListener('click',e=>{if(!isKeise())return;if(!e.target.closest?.('#mobileBackBtn,#mobileNativeBack'))return;setTimeout(()=>enterHome(),110)},false)

    identityTimer=setInterval(()=>{
      if(!isKeise())return
      syncIdentity()
      if(document.body.classList.contains('keise-home-active'))syncConversations()
    },900)
    syncIdentity();syncConversations();enterHome();return true
  }

  function cloneWithoutIds(node){const c=node.cloneNode(true);c.removeAttribute?.('id');c.querySelectorAll?.('[id]').forEach(x=>x.removeAttribute('id'));return c}
  function syncConversations(){
    if(!built||!document.body.classList.contains('keise-home-active'))return
    const source=$('chatList'),target=$('kaConversationList');if(!source||!target)return
    const items=[...source.querySelectorAll('.chat-item[data-conv]')].filter(x=>!x.classList.contains('hidden')&&getComputedStyle(x).display!=='none')
    target.innerHTML=''
    if(!items.length){const n=document.createElement('div');n.className='ka-empty-note';n.textContent=/carregando/i.test(source.textContent||'')?'Abrindo suas conversas…':'Suas conversas aparecem aqui.';target.appendChild(n);return}
    items.forEach(orig=>{
      const id=orig.dataset.conv||''
      const clone=cloneWithoutIds(orig)
      clone.classList.add('ka-conv-card')
      // IMPORTANTE: não deixamos data-conv no clone; o núcleo não registra um segundo listener nele.
      clone.removeAttribute('data-conv');clone.dataset.kaConv=id
      clone.querySelectorAll('[data-conv]').forEach(el=>el.removeAttribute('data-conv'))
      clone.addEventListener('click',e=>{
        e.preventDefault();e.stopPropagation()
        if(!id)return
        if(typeof window.__ISA_OPEN_KEISE_CONVERSATION__==='function')window.__ISA_OPEN_KEISE_CONVERSATION__(id)
        else{enterPanel();orig.click()}
      })
      target.appendChild(clone)
    })
    filterConversations()
  }
  function filterConversations(){const q=norm($('kaSearchInput')?.value);document.querySelectorAll('#kaConversationList .ka-conv-card').forEach(card=>{card.style.display=!q||norm(card.textContent).includes(q)?'':'none'})}
  function syncIdentity(){
    const src=$('myAvatar'),name=$('myName')?.textContent?.trim()||'Keise',avatar=src?.innerHTML||src?.textContent||'🦋'
    const a=$('kaAvatarContent'),t=$('kaTopAvatar');if(a&&a.innerHTML!==avatar)a.innerHTML=avatar;if(t&&t.innerHTML!==avatar)t.innerHTML=avatar;if($('kaName'))$('kaName').textContent=name
    const cloud=$('pssProfileCloud'),strong=cloud?.querySelector('strong')?.textContent?.trim(),small=cloud?.querySelector('small')?.textContent?.trim();if($('kaStatusTitle'))$('kaStatusTitle').textContent=strong||'Status';if($('kaStatusSub'))$('kaStatusSub').textContent=small||'Como estou hoje'
  }

  function start(){ensureCss();let tries=0;const timer=setInterval(()=>{if(build()||++tries>180)clearInterval(timer)},90)}
  start()
  window.__ISA_SHOW_KEISE_HOME__=enterHome
  window.__ISA_KEISE_APPROVED_LAYOUT__=true
})();
