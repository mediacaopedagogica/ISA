// Keise — ÚNICO layout FINAL aprovado para notebook e mobile.
// V8: o núcleo v34 termina primeiro; depois este arquivo assume sozinho o dashboard visível e as interações.
(function(){
  'use strict'
  if(window.__ISA_KEISE_APPROVED_LAYOUT_V8__)return
  window.__ISA_KEISE_APPROVED_LAYOUT_V8__=true

  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const wait=ms=>new Promise(r=>setTimeout(r,ms))
  let built=false,chatObserver=null,identityTimer=null,busyAction='',routingBound=false
  let lastGestureKey='',lastGestureAt=0

  const requested=()=>norm(new URLSearchParams(location.search).get('perfil'))
  const current=()=>norm($('myName')?.textContent)
  const isKeise=()=>requested()==='keise'||current()==='keise'||current().startsWith('keise ')
  const isMobileLink=()=>requested()==='keise'
  const coreReady=()=>window.__ISA_APP_READY__===true
  const mainVisible=()=>!!$('mainView')&&!$('mainView').classList.contains('hidden')
  const mainReady=()=>mainVisible()&&isKeise()&&coreReady()

  // Se o link é explicitamente da Keise, nunca deixa a sidebar antiga piscar enquanto o núcleo termina.
  if(requested()==='keise')document.body.classList.add('keise-approved-awaiting')

  function toast(text){
    const t=$('toast')
    if(!t){console.info(text);return}
    t.textContent=text;t.classList.remove('hidden');clearTimeout(t._ka);t._ka=setTimeout(()=>t.classList.add('hidden'),2800)
  }
  function ensureCss(){
    if(!document.getElementById('keiseApprovedFinalCss')){
      const l=document.createElement('link');l.id='keiseApprovedFinalCss';l.rel='stylesheet';l.href='./keise-approved-layout-final.css?v=8-single-owner';document.head.appendChild(l)
    }
    if(!document.getElementById('keiseApprovedRuntimeStyle')){
      const s=document.createElement('style');s.id='keiseApprovedRuntimeStyle';s.textContent=`
        body.keise-approved-awaiting #mainView:not(.hidden){visibility:hidden!important;opacity:0!important;pointer-events:none!important}
        #keiseApprovedTopbar,#keiseApprovedHome,#keiseApprovedTopbar button,#keiseApprovedHome button,#keiseApprovedHome [data-ka-conv]{pointer-events:auto!important;touch-action:manipulation!important}
        #keiseApprovedTopbar,#keiseApprovedHome{position:relative;z-index:5}
        #kaPanelBack{position:fixed;z-index:119500;left:max(12px,env(safe-area-inset-left));top:max(12px,env(safe-area-inset-top));min-width:48px;height:46px;padding:0 15px;border:1px solid rgba(255,255,255,.95);border-radius:16px;background:linear-gradient(145deg,#fff,#efe5ff);color:#5d466c;box-shadow:0 10px 26px rgba(79,57,96,.18);font:800 14px/1 Inter,"Segoe UI",sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;pointer-events:auto!important}
        #kaPanelBack.hidden{display:none!important}
        body.keise-approved-layout #mobilePanelBack{display:none!important}
        @media(max-width:850px){#kaPanelBack{width:46px;min-width:46px;padding:0;font-size:0}#kaPanelBack:before{content:'←';font-size:23px}}
      `;document.head.appendChild(s)
    }
  }
  async function ensureModule(modulePath){try{await import(modulePath);return true}catch(e){console.warn('Keise módulo:',modulePath,e);return false}}

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
    clearInline(main,['display','grid-template-columns','grid-template-rows','width','max-width','min-width','height','min-height','max-height','margin','padding','overflow','background','visibility','opacity','pointer-events'])
    clearInline(sidebar,['display','visibility','width','min-width','max-width','height','min-height','max-height','padding','margin','border','overflow','pointer-events'])
    clearInline(content,['display','visibility','grid-column','grid-row','width','max-width','min-width','height','min-height','max-height','margin','margin-left','padding','border','border-radius','background','box-shadow','overflow','pointer-events','opacity'])
  }

  function enterHome({scrollConversations=false}={}){
    if(!built||!mainReady())return false
    ensureCss();setAccessClass();restoreShellForHome()
    const {main}=shell()
    document.body.classList.remove('keise-approved-awaiting','isa-keise-layout-pending','keise-panel-active')
    document.body.classList.add('keise-approved-layout','keise-dashboard-mode','keise-home-active')
    main?.classList.remove('mobile-content-open','mobile-chat-open','mobile-panel-open','mobile-native-content','social-mode')
    hideNativeHomePieces()
    $('keiseApprovedTopbar')?.classList.remove('hidden')
    $('keiseApprovedHome')?.classList.remove('hidden')
    $('kaPanelBack')?.classList.add('hidden')
    syncIdentity();syncConversations()
    if(scrollConversations)setTimeout(()=>$('kaConversations')?.scrollIntoView({behavior:'smooth',block:'start'}),70)
    try{window.__ISA_HIDE_BOOT_GUARD__?.()}catch{}
    $('personalBootGuard')?.classList.add('hidden')
    return true
  }

  function enterPanel(){
    if(!built)return false
    ensureCss();setAccessClass()
    const {main,sidebar,content}=shell()
    document.body.classList.remove('keise-approved-awaiting','isa-keise-layout-pending','keise-home-active')
    document.body.classList.add('keise-approved-layout','keise-dashboard-mode','keise-panel-active')
    $('keiseApprovedTopbar')?.classList.add('hidden')
    $('keiseApprovedHome')?.classList.add('hidden')
    $('kaPanelBack')?.classList.remove('hidden')
    if(sidebar){sidebar.style.setProperty('display','none','important');sidebar.style.setProperty('visibility','hidden','important');sidebar.style.setProperty('width','0','important');sidebar.style.setProperty('pointer-events','none','important')}
    if(main){main.style.setProperty('display','block','important');main.style.setProperty('visibility','visible','important');main.style.setProperty('opacity','1','important');main.style.setProperty('pointer-events','auto','important');main.style.setProperty('width','100%','important');main.style.setProperty('height','100dvh','important');main.style.setProperty('overflow','hidden','important')}
    if(content){content.style.setProperty('display','block','important');content.style.setProperty('visibility','visible','important');content.style.setProperty('opacity','1','important');content.style.setProperty('pointer-events','auto','important');content.style.setProperty('width','100%','important');content.style.setProperty('height','100dvh','important');content.style.setProperty('margin','0','important');content.style.setProperty('padding','0','important');content.style.setProperty('overflow','hidden','important')}
    return true
  }
  window.__ISA_KEISE_ENTER_PANEL__=enterPanel

  function nativeClick(btn){
    if(!btn)return false
    try{HTMLElement.prototype.click.call(btn);return true}catch{}
    try{btn.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));return true}catch{}
    return false
  }
  function openCorePanel(tab){
    const btn=document.querySelector(`.nav-tabs .nav-btn[data-tab="${tab}"]`)
    if(!btn)return false
    enterPanel();return nativeClick(btn)
  }

  async function openStatus(){
    if(typeof window.__ISA_OPEN_PROFILE_STATUS__!=='function')await ensureModule('./profile-status-stickers.js?v=15-stable-interactions')
    if(typeof window.__ISA_OPEN_PROFILE_STATUS__==='function'){window.__ISA_OPEN_PROFILE_STATUS__();return true}
    toast('Meu perfil e status ainda está carregando.');return false
  }
  async function openSettings(){
    if(typeof window.__ISA_OPEN_GENERAL_SETTINGS__!=='function')await ensureModule('./general-settings.js?v=17-single-shell')
    if(typeof window.__ISA_OPEN_GENERAL_SETTINGS__==='function'){window.__ISA_OPEN_GENERAL_SETTINGS__();return true}
    toast('Configurações ainda estão carregando.');return false
  }
  async function openAccess(){
    if(typeof window.__ISA_OPEN_ACCESS_SETTINGS__!=='function')await ensureModule('./keise-access-settings.js?v=2-direct-api')
    if(typeof window.__ISA_OPEN_ACCESS_SETTINGS__==='function'){window.__ISA_OPEN_ACCESS_SETTINGS__();return true}
    toast('Meu acesso ainda está carregando.');return false
  }
  async function openSocial(){
    if(typeof window.__ISA_OPEN_SOCIAL__!=='function'&&typeof window.__ISA_OPEN_SOCIAL_CORE__!=='function')await ensureModule('./social-network.js?v=6-keise-direct-api')
    const fn=window.__ISA_OPEN_SOCIAL__||window.__ISA_OPEN_SOCIAL_CORE__
    if(typeof fn==='function'){enterPanel();await fn();return true}
    toast('Nossa Rede ainda está carregando.');return false
  }
  async function openTest(){
    if(typeof window.__ISA_OPEN_KEISE_TEST__!=='function')await ensureModule('./keise-game-test.js?v=10-direct-api')
    if(typeof window.__ISA_OPEN_KEISE_TEST__==='function'){window.__ISA_OPEN_KEISE_TEST__();return true}
    toast('Teste ainda está carregando.');return false
  }
  async function openNotifications(){
    await ensureModule('./notifications-v2.js?v=12-stable-interactions')
    if('Notification' in window&&Notification.permission==='granted'){toast('🔔 As notificações já estão ativas neste aparelho.');return true}
    const btn=$('enableNotificationsBtn');if(btn){nativeClick(btn);return true}
    toast('Notificações ainda estão carregando.');return false
  }
  function openAvatarPicker(){const input=$('profileAvatarInput');if(input){nativeClick(input);return true}toast('A troca da foto ainda está carregando.');return false}
  function openGroup(){const btn=$('newGroupBtn');if(btn){nativeClick(btn);return true}toast('A criação de grupo ainda está carregando.');return false}
  function logout(){
    const core=$('logoutBtn')
    if(core){
      nativeClick(core)
      setTimeout(()=>{
        const main=$('mainView');if(!main||main.classList.contains('hidden'))return
        try{for(const store of [localStorage,sessionStorage]){const keys=[];for(let i=0;i<store.length;i++){const k=store.key(i)||'';if(/auth-token/i.test(k))keys.push(k)}keys.forEach(k=>store.removeItem(k))}}catch{}
        location.replace('./?sair=keise&_cb='+Date.now())
      },2200)
      return true
    }
    location.replace('./?sair=keise&_cb='+Date.now());return true
  }

  async function runAction(action){
    if(!action||busyAction===action)return false
    busyAction=action
    try{
      if(action==='chat'){enterHome({scrollConversations:true});return true}
      if(action==='calendar'){if(!openCorePanel('calendar'))toast('Calendário ainda está carregando.');return true}
      if(action==='social'){if(!await openSocial())enterHome();return true}
      if(action==='test'){await openTest();return true}
      if(action==='supervision'){if(!openCorePanel('supervision'))toast('Supervisão ainda está carregando.');return true}
      if(action==='parents'){if(!openCorePanel('parents'))toast('Super Pais ainda está carregando.');return true}
      if(action==='access'){await openAccess();return true}
      if(action==='profile'||action==='status'){await openStatus();return true}
      if(action==='settings'){await openSettings();return true}
      if(action==='notifications'){await openNotifications();return true}
      if(action==='group'){openGroup();return true}
      if(action==='logout'){logout();return true}
      if(action==='avatar'){openAvatarPicker();return true}
      return false
    }finally{setTimeout(()=>{busyAction=''},180)}
  }
  window.__ISA_KEISE_RUN_ACTION__=runAction

  function openConversation(id){
    if(!id)return false
    const source=$('chatList')
    const orig=[...(source?.querySelectorAll('.chat-item[data-conv]')||[])].find(x=>String(x.dataset.conv||'')===String(id))
    if(!orig){toast('Essa conversa ainda está sincronizando.');return false}
    enterPanel();setTimeout(()=>nativeClick(orig),0);return true
  }
  window.__ISA_OPEN_KEISE_CONVERSATION__=openConversation

  function routeGesture(e){
    if(!built||!isKeise())return
    const actionBtn=e.target?.closest?.('[data-ka-action]')
    const conv=e.target?.closest?.('#kaConversationList [data-ka-conv]')
    if(!actionBtn&&!conv)return
    const key=actionBtn?`a:${actionBtn.dataset.kaAction||''}`:`c:${conv.dataset.kaConv||''}`
    const now=performance.now()
    if(e.type==='click'&&key===lastGestureKey&&now-lastGestureAt<650){e.preventDefault();e.stopImmediatePropagation();return}
    if(e.type==='pointerup'){lastGestureKey=key;lastGestureAt=now}
    e.preventDefault();e.stopImmediatePropagation()
    if(actionBtn)runAction(actionBtn.dataset.kaAction)
    else openConversation(conv.dataset.kaConv)
  }
  function bindRouting(){
    if(routingBound)return;routingBound=true
    // Captura no window vem antes de antigos listeners de document: o dashboard não congela mesmo se um módulo legado interceptar cliques.
    window.addEventListener('pointerup',routeGesture,true)
    window.addEventListener('click',routeGesture,true)
    window.addEventListener('keydown',e=>{
      if(!built||!isKeise()||!['Enter',' '].includes(e.key))return
      const b=e.target?.closest?.('[data-ka-action]'),c=e.target?.closest?.('#kaConversationList [data-ka-conv]');if(!b&&!c)return
      e.preventDefault();e.stopImmediatePropagation();if(b)runAction(b.dataset.kaAction);else openConversation(c.dataset.kaConv)
    },true)
  }

  function feature(icon,label,action,cls=''){return `<button type="button" class="ka-feature ${cls}" data-ka-action="${action}"><span class="ka-feature-icon">${icon}</span><span>${label}</span></button>`}

  function build(){
    if(built||!mainReady())return false
    ensureCss();setAccessClass();bindRouting()
    const {main,content}=shell();if(!main||!content)return false
    built=true
    document.body.classList.remove('keise-approved-awaiting','isa-keise-layout-pending')
    document.body.classList.add('keise-approved-layout','keise-dashboard-mode')
    document.querySelectorAll('#keiseDesktopTopbar,#keiseHomeDashboard,.kd-side-menu,#approvedProfileHome,#approvedPanelBack').forEach(el=>el.remove())

    if(!$('kaPanelBack')){
      const back=document.createElement('button');back.id='kaPanelBack';back.type='button';back.className='hidden';back.dataset.kaAction='chat';back.innerHTML='← <span>Voltar</span>';back.setAttribute('aria-label','Voltar ao início');document.body.appendChild(back)
    }

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

    $('kaSearchInput')?.addEventListener('input',filterConversations)
    const source=$('chatList')
    if(source){chatObserver=new MutationObserver(()=>{if(document.body.classList.contains('keise-home-active'))syncConversations()});chatObserver.observe(source,{childList:true,subtree:true,characterData:true,attributes:true})}
    document.addEventListener('click',e=>{if(!isKeise())return;if(!e.target.closest?.('#mobileBackBtn,#mobileNativeBack'))return;setTimeout(()=>enterHome(),110)},false)

    identityTimer=setInterval(()=>{
      if(!isKeise())return
      syncIdentity();if(document.body.classList.contains('keise-home-active'))syncConversations()
    },1100)
    syncIdentity();syncConversations();enterHome()
    try{document.dispatchEvent(new CustomEvent('isa:keise-approved-home-built',{detail:{version:'v8-single-owner'}}))}catch{}
    return true
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
      const clone=cloneWithoutIds(orig);clone.classList.add('ka-conv-card');clone.removeAttribute('data-conv');clone.dataset.kaConv=id;clone.querySelectorAll('[data-conv]').forEach(el=>el.removeAttribute('data-conv'))
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

  function start(){
    ensureCss();bindRouting()
    let tries=0
    const timer=setInterval(()=>{
      if(build()){clearInterval(timer);return}
      if(++tries>600){clearInterval(timer);document.body.classList.remove('keise-approved-awaiting')}
    },100)
  }
  start()
  window.__ISA_SHOW_KEISE_HOME__=()=>{if(!built)build();return enterHome()}
  window.__ISA_KEISE_APPROVED_LAYOUT__=true
})();