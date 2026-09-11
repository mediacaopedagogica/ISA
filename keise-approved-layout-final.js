// Cantinho da Isa — controlador ÚNICO do dashboard aprovado de Keise, Isa e Alan.
// V10: um shell visual canônico, motor nativo invisível, sem polling de reconstrução.
(function(){
  'use strict'
  if(window.__ISA_APPROVED_DASHBOARD_V10__)return
  window.__ISA_APPROVED_DASHBOARD_V10__=true

  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const APPROVED=new Set(['keise','isa','alan'])
  const requested=()=>norm(new URLSearchParams(location.search).get('perfil'))
  const identity=()=>norm($('myName')?.textContent)
  const profile=()=>{const r=requested(),n=identity();for(const p of APPROVED)if(r===p||n===p||n.startsWith(p+' '))return p;return''}
  const coreReady=()=>window.__ISA_APP_READY__===true
  const mainReady=()=>!!$('mainView')&&!$('mainView').classList.contains('hidden')&&coreReady()

  const CONFIG={
    keise:{name:'Keise',fallback:'🦋',features:[
      ['💬','Chat','chat',''],['📅','Calendário','calendar',''],['🌸','Nossa Rede','social',''],['🧪','Teste','test','private'],
      ['👀','Supervisão','supervision',''],['🛡️','Super Pais','parents',''],['🔐','Meu acesso','access',''],['👤','Meu perfil','profile',''],['⚙️','Configurações','settings','settings']
    ]},
    isa:{name:'Isa',fallback:'🌷',features:[
      ['💬','Chat','chat',''],['📅','Calendário','calendar',''],['🌸','Nossa Rede','social',''],['🎮','Joguinhos','games',''],
      ['📚','Estudos','study',''],['📔','Meu Diário','diary',''],['👤','Meu perfil','profile',''],['⚙️','Configurações','settings','settings']
    ]},
    alan:{name:'Alan',fallback:'🎸',features:[
      ['💬','Chat','chat',''],['📅','Calendário','calendar',''],['🌸','Nossa Rede','social',''],['🎮','Joguinhos','games',''],
      ['🎸','Meu Estúdio','studio',''],['👤','Meu perfil','profile',''],['⚙️','Configurações','settings','settings']
    ]}
  }

  let built=false,mode='boot',busy='',routingBound=false,chatObserver=null,identityObserver=null,buildObserver=null,syncQueued=false
  const p0=requested()
  if(APPROVED.has(p0))document.documentElement.classList.add('isa-approved-requested')

  function ensureEarlyCss(){
    if($('approvedSingleOwnerEarlyCss'))return
    const s=document.createElement('style');s.id='approvedSingleOwnerEarlyCss';s.textContent=`
      html.isa-approved-requested body #mainView:not(.hidden):not(.approved-shell-mounted){visibility:hidden!important;opacity:0!important;pointer-events:none!important}
      body.isa-approved-single-owner #mainView>.sidebar{display:none!important;visibility:hidden!important;width:0!important;min-width:0!important;max-width:0!important;opacity:0!important;pointer-events:none!important;overflow:hidden!important}
      body.isa-approved-single-owner #emptyState{display:none!important}
      body.isa-approved-single-owner.keise-home-active #keiseApprovedTopbar,
      body.isa-approved-single-owner.keise-home-active #keiseApprovedHome{visibility:visible!important;opacity:1!important;pointer-events:auto!important}
      #approvedUnifiedBack{position:fixed;z-index:119500;left:max(12px,env(safe-area-inset-left));top:max(12px,env(safe-area-inset-top));min-width:48px;height:46px;padding:0 15px;border:1px solid rgba(255,255,255,.96);border-radius:16px;background:linear-gradient(145deg,#fff,#efe5ff);color:#5d466c;box-shadow:0 10px 26px rgba(79,57,96,.18);font:800 14px/1 Inter,"Segoe UI",sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;pointer-events:auto!important;touch-action:manipulation!important}
      #approvedUnifiedBack.hidden{display:none!important}
      @media(max-width:850px){#approvedUnifiedBack{width:46px;min-width:46px;padding:0;font-size:0}#approvedUnifiedBack:before{content:'←';font-size:23px}}
    `;document.head.appendChild(s)
  }
  ensureEarlyCss()

  function ensureCss(){
    if(!$('approvedUnifiedCss')){const l=document.createElement('link');l.id='approvedUnifiedCss';l.rel='stylesheet';l.href='./keise-approved-layout-final.css?v=10-unified-approved';document.head.appendChild(l)}
  }
  function shell(){const main=$('mainView');return{main,sidebar:main?.querySelector(':scope > .sidebar')||main?.querySelector('.sidebar'),content:main?.querySelector(':scope > .content')||main?.querySelector('.content')}}
  function toast(text){const t=$('toast');if(!t){console.info(text);return}t.textContent=text;t.classList.remove('hidden');clearTimeout(t._approvedUnified);t._approvedUnified=setTimeout(()=>t.classList.add('hidden'),2700)}
  function nativeClick(el){if(!el)return false;try{HTMLElement.prototype.click.call(el);return true}catch{}try{el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));return true}catch{}return false}
  async function load(path){try{return await import(path)}catch(e){console.warn('Dashboard aprovado:',path,e);return null}}
  function clearInline(el,props){if(!el)return;props.forEach(x=>el.style.removeProperty(x))}

  function cleanCompetingShells(){
    document.querySelectorAll('#keiseDesktopTopbar,#keiseHomeDashboard,.kd-side-menu,#approvedProfileHome,#approvedPanelBack,#kaPanelBack,#isaFinalShellShield,#isaFinalShellShieldV2,#isaApprovedShellShield,#isaKeiseApprovedGuard').forEach(el=>el.remove())
  }
  function restoreHomeShell(){
    const {main,content}=shell()
    clearInline(main,['display','visibility','opacity','pointer-events','grid-template-columns','grid-template-rows','width','max-width','min-width','height','min-height','max-height','margin','padding','overflow','background'])
    clearInline(content,['display','visibility','opacity','pointer-events','grid-column','grid-row','width','max-width','min-width','height','min-height','max-height','margin','margin-left','padding','border','border-radius','background','box-shadow','overflow'])
    if(main)main.classList.add('approved-shell-mounted')
  }
  function hideNativeHome(){
    const {content}=shell();if(!content)return
    ;[...content.children].forEach(el=>{if(el.id!=='keiseApprovedHome'&&el.tagName==='SECTION')el.classList.add('hidden')})
  }
  function setClasses(homeMode){
    const p=profile();if(!p)return
    document.body.classList.remove('approved-profile-keise','approved-profile-isa','approved-profile-alan','approved-family-dashboard','keise-panel-active','keise-home-active','keise-approved-awaiting','isa-keise-layout-pending')
    document.body.classList.add('isa-approved-single-owner','keise-approved-layout','keise-dashboard-mode',`approved-profile-${p}`)
    if(p!=='keise')document.body.classList.add('approved-family-dashboard')
    document.body.classList.add(homeMode?'keise-home-active':'keise-panel-active')
  }
  function emitReady(){
    const p=profile();if(!p)return
    const detail={profile:p,version:'v10-unified-approved'}
    try{document.dispatchEvent(new CustomEvent('isa:approved-home-ready',{detail}))}catch{}
    try{document.dispatchEvent(new CustomEvent('isa:keise-approved-home-built',{detail}))}catch{}
    try{window.__ISA_HIDE_BOOT_GUARD__?.()}catch{}
    $('personalBootGuard')?.classList.add('hidden')
  }

  function enterHome({scroll=false}={}){
    if(!built||!mainReady())return false
    mode='home';ensureCss();restoreHomeShell();setClasses(true);hideNativeHome()
    const {main}=shell();main?.classList.remove('mobile-content-open','mobile-chat-open','mobile-panel-open','mobile-native-content','social-mode')
    $('keiseApprovedTopbar')?.classList.remove('hidden');$('keiseApprovedHome')?.classList.remove('hidden');$('approvedUnifiedBack')?.classList.add('hidden')
    syncIdentity();queueConversationSync(true)
    if(scroll)setTimeout(()=>$('kaConversations')?.scrollIntoView({behavior:'smooth',block:'start'}),40)
    document.documentElement.classList.remove('isa-approved-requested');emitReady();return true
  }
  function enterPanel(){
    if(!built)return false
    mode='panel';ensureCss();setClasses(false)
    const {main,content}=shell()
    $('keiseApprovedTopbar')?.classList.add('hidden');$('keiseApprovedHome')?.classList.add('hidden');$('approvedUnifiedBack')?.classList.remove('hidden')
    if(main){main.classList.add('approved-shell-mounted');main.style.setProperty('display','block','important');main.style.setProperty('visibility','visible','important');main.style.setProperty('opacity','1','important');main.style.setProperty('pointer-events','auto','important');main.style.setProperty('width','100%','important');main.style.setProperty('height','100dvh','important');main.style.setProperty('overflow','hidden','important')}
    if(content){content.style.setProperty('display','block','important');content.style.setProperty('visibility','visible','important');content.style.setProperty('opacity','1','important');content.style.setProperty('pointer-events','auto','important');content.style.setProperty('width','100%','important');content.style.setProperty('height','100dvh','important');content.style.setProperty('margin','0','important');content.style.setProperty('padding','0','important');content.style.setProperty('overflow','hidden','important')}
    return true
  }

  function feature([icon,label,action,cls='']){return `<button type="button" class="ka-feature ${cls}" data-approved-action="${action}"><span class="ka-feature-icon">${icon}</span><span>${label}</span></button>`}
  function build(){
    const p=profile(),cfg=CONFIG[p]
    if(built||!cfg||!mainReady())return false
    const {main,content}=shell();if(!main||!content)return false
    built=true;ensureCss();cleanCompetingShells();document.body.classList.add('isa-approved-single-owner')

    const back=document.createElement('button');back.id='approvedUnifiedBack';back.type='button';back.className='hidden';back.dataset.approvedBack='1';back.innerHTML='← <span>Voltar</span>';back.setAttribute('aria-label','Voltar ao início');document.body.appendChild(back)

    let top=document.createElement('header');top.id='keiseApprovedTopbar';top.innerHTML=`
      <div class="ka-brand"><span class="ka-brand-heart">💗</span><span class="ka-brand-name">Cantinho da Isa 💕</span></div>
      <label class="ka-search"><input id="kaSearchInput" type="search" placeholder="Pesquisar no Cantinho da Isa..." aria-label="Pesquisar no Cantinho da Isa"></label>
      <div class="ka-top-actions"><button class="ka-bell" type="button" data-approved-action="notifications" aria-label="Notificações" title="Notificações">🔔</button><button class="ka-top-profile" type="button" data-approved-action="profile"><span id="kaTopAvatar" class="ka-top-avatar">${cfg.fallback}</span><span id="kaTopName">${cfg.name}</span><span>⌄</span></button></div>`
    main.insertBefore(top,main.firstChild)

    const home=document.createElement('section');home.id='keiseApprovedHome';home.innerHTML=`
      <div class="ka-hero">
        <button id="kaAvatarBtn" type="button" class="ka-avatar-btn" data-approved-action="avatar" aria-label="Alterar foto do perfil"><span id="kaAvatarContent" class="ka-avatar-content">${cfg.fallback}</span><span class="ka-camera">📷</span></button>
        <div class="ka-identity"><h1 id="kaName">${cfg.name}</h1><p>Cantinho da Isa <span>💕</span></p></div>
        <button type="button" class="ka-status-btn" data-approved-action="status"><span class="cloud">☁️</span><span><b id="kaStatusTitle">Definir meu status</b><small id="kaStatusSub">Como estou hoje • atividade • música</small></span><span class="arrow">›</span></button>
        <button id="kaLogout" type="button" class="ka-logout" data-approved-action="logout">Sair</button>
      </div>
      <div class="ka-grid">${cfg.features.map(feature).join('')}</div>
      <div id="kaConversations" class="ka-conv-head"><h2>Conversas</h2><button type="button" class="ka-group-btn" data-approved-action="group">＋ Grupo</button></div>
      <div id="kaConversationList"></div>
      <div class="ka-heart-deco" aria-hidden="true">💜</div>`
    content.insertBefore(home,content.firstChild)

    $('kaSearchInput')?.addEventListener('input',filterConversations)
    bindRouting();bindObservers();syncIdentity();syncConversations();enterHome();return true
  }

  function cloneWithoutIds(node){const c=node.cloneNode(true);c.removeAttribute?.('id');c.querySelectorAll?.('[id]').forEach(x=>x.removeAttribute('id'));return c}
  function queueConversationSync(force=false){
    if(!built||mode!=='home')return
    if(syncQueued&&!force)return;syncQueued=true
    requestAnimationFrame(()=>{syncQueued=false;syncConversations()})
  }
  function syncConversations(){
    if(!built||mode!=='home')return
    const source=$('chatList'),target=$('kaConversationList');if(!source||!target)return
    const items=[...source.querySelectorAll('.chat-item[data-conv]')].filter(x=>!x.classList.contains('hidden')&&getComputedStyle(x).display!=='none')
    const signature=items.map(x=>`${x.dataset.conv||''}:${(x.textContent||'').trim()}`).join('|')
    if(target.dataset.signature===signature&&target.children.length===items.length){filterConversations();return}
    target.dataset.signature=signature;target.replaceChildren()
    if(!items.length){const n=document.createElement('div');n.className='ka-empty-note';n.textContent=/carregando/i.test(source.textContent||'')?'Abrindo suas conversas…':'Suas conversas aparecem aqui.';target.appendChild(n);return}
    const seen=new Set()
    for(const orig of items){
      const id=String(orig.dataset.conv||'');if(!id||seen.has(id))continue;seen.add(id)
      const clone=cloneWithoutIds(orig);clone.classList.add('ka-conv-card');clone.removeAttribute('data-conv');clone.dataset.kaConv=id;clone.dataset.sourceConv=id;clone.querySelectorAll('[data-conv]').forEach(el=>el.removeAttribute('data-conv'));target.appendChild(clone)
    }
    filterConversations();setTimeout(()=>{window.__ISA_NUVEM_PIN_PICKER__?.scan?.()},0)
  }
  function filterConversations(){const q=norm($('kaSearchInput')?.value);document.querySelectorAll('#kaConversationList .ka-conv-card').forEach(card=>{card.style.display=!q||norm(card.textContent).includes(q)?'':'none'})}
  function syncIdentity(){
    const p=profile(),cfg=CONFIG[p];if(!cfg)return
    const src=$('myAvatar'),name=$('myName')?.textContent?.trim()||cfg.name,avatar=src?.innerHTML||src?.textContent||cfg.fallback
    for(const id of ['kaAvatarContent','kaTopAvatar']){const el=$(id);if(el&&el.innerHTML!==avatar)el.innerHTML=avatar}
    if($('kaName'))$('kaName').textContent=name;if($('kaTopName'))$('kaTopName').textContent=name.split(/\s+/)[0]||cfg.name
    const cloud=$('pssProfileCloud'),strong=cloud?.querySelector('strong')?.textContent?.trim(),small=cloud?.querySelector('small')?.textContent?.trim()
    if($('kaStatusTitle'))$('kaStatusTitle').textContent=strong||'Definir meu status';if($('kaStatusSub'))$('kaStatusSub').textContent=small||'Como estou hoje • atividade • música'
  }
  function bindObservers(){
    const source=$('chatList');if(source&&!chatObserver){chatObserver=new MutationObserver(()=>queueConversationSync());chatObserver.observe(source,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class']})}
    const identityRoot=$('myName')?.parentElement||$('mainView');if(identityRoot&&!identityObserver){identityObserver=new MutationObserver(()=>syncIdentity());identityObserver.observe(identityRoot,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','src']})}
  }

  function openCore(tab){const b=document.querySelector(`.nav-tabs .nav-btn[data-tab="${tab}"]`);if(!b)return false;enterPanel();return nativeClick(b)}
  async function openSocial(){if(typeof window.__ISA_OPEN_SOCIAL__!=='function'&&typeof window.__ISA_OPEN_SOCIAL_CORE__!=='function')await load('./social-network.js?v=10-approved-single-owner');const fn=window.__ISA_OPEN_SOCIAL__||window.__ISA_OPEN_SOCIAL_CORE__;if(typeof fn==='function'){enterPanel();await fn();return true}toast('Nossa Rede ainda está carregando.');return false}
  async function openStatus(){if(typeof window.__ISA_OPEN_PROFILE_STATUS__!=='function')await load('./profile-status-stickers.js?v=15-stable-interactions');if(typeof window.__ISA_OPEN_PROFILE_STATUS__==='function'){await window.__ISA_OPEN_PROFILE_STATUS__();return true}toast('Meu perfil ainda está carregando.');return false}
  async function openSettings(){if(typeof window.__ISA_OPEN_GENERAL_SETTINGS__!=='function')await load('./general-settings.js?v=18-no-nav-loop');if(typeof window.__ISA_OPEN_GENERAL_SETTINGS__==='function'){await window.__ISA_OPEN_GENERAL_SETTINGS__();return true}toast('Configurações ainda estão carregando.');return false}
  async function openAccess(){if(typeof window.__ISA_OPEN_ACCESS_SETTINGS__!=='function')await load('./keise-access-settings.js?v=2-direct-api');if(typeof window.__ISA_OPEN_ACCESS_SETTINGS__==='function'){window.__ISA_OPEN_ACCESS_SETTINGS__();return true}toast('Meu acesso ainda está carregando.');return false}
  async function openTest(){if(typeof window.__ISA_OPEN_KEISE_TEST__!=='function')await load('./keise-game-test.js?v=10-direct-api');if(typeof window.__ISA_OPEN_KEISE_TEST__==='function'){window.__ISA_OPEN_KEISE_TEST__();return true}toast('Teste ainda está carregando.');return false}
  async function openGames(){if(typeof window.__CANTINHO_OPEN_GAMES__!=='function'){await load('./games-menu.js?v=15-approved-profiles');await load('./games-menu-snake.js?v=3-all-users')}if(typeof window.__CANTINHO_OPEN_GAMES__==='function'){window.__CANTINHO_OPEN_GAMES__();setTimeout(()=>document.dispatchEvent(new Event('cantinho:games-open')),30);return true}toast('Joguinhos ainda estão carregando.');return false}
  async function openStudio(){if(profile()!=='alan')return false;let entry=$('alanStudioEntry')||$('alanStudioLauncher');if(!entry){await load('./alan-studio-access.js?v=2-approved-dashboard');await load('./alan-studio-launcher.js?v=2-approved-dashboard');for(let i=0;i<18&&!($('alanStudioEntry')||$('alanStudioLauncher'));i++)await new Promise(r=>setTimeout(r,80));entry=$('alanStudioEntry')||$('alanStudioLauncher')}if(entry){enterPanel();nativeClick(entry);return true}toast('Meu Estúdio ainda está carregando.');return false}
  async function notifications(){await load('./notifications-v2.js?v=12-stable-interactions');if('Notification'in window&&Notification.permission==='granted'){toast('🔔 As notificações já estão ativas.');return true}const b=$('enableNotificationsBtn');if(b){nativeClick(b);return true}toast('Notificações ainda estão carregando.');return false}
  function avatar(){const input=$('profileAvatarInput');if(input){nativeClick(input);return true}toast('A troca da foto ainda está carregando.');return false}
  function group(){const b=$('newGroupBtn');if(b){nativeClick(b);return true}toast('A criação de grupo ainda está carregando.');return false}
  function logout(){const b=$('logoutBtn');if(b){nativeClick(b);setTimeout(()=>{const main=$('mainView');if(main&&!main.classList.contains('hidden'))location.replace(`./?sair=${profile()||'perfil'}&_cb=${Date.now()}`)},1800);return true}location.replace(`./?sair=${profile()||'perfil'}&_cb=${Date.now()}`);return true}

  async function runAction(action){
    if(!action||busy)return false;busy=action
    try{
      if(action==='chat'){enterHome({scroll:true});return true}
      if(action==='calendar'){if(!openCore('calendar'))toast('Calendário ainda está carregando.');return true}
      if(action==='social'){if(!await openSocial())enterHome();return true}
      if(action==='test'){await openTest();return true}
      if(action==='supervision'){if(!openCore('supervision'))toast('Supervisão ainda está carregando.');return true}
      if(action==='parents'){if(!openCore('parents'))toast('Super Pais ainda está carregando.');return true}
      if(action==='access'){await openAccess();return true}
      if(action==='profile'||action==='status'){await openStatus();return true}
      if(action==='settings'){await openSettings();return true}
      if(action==='notifications'){await notifications();return true}
      if(action==='group'){group();return true}
      if(action==='avatar'){avatar();return true}
      if(action==='study'){if(!openCore('study'))toast('Estudos ainda estão carregando.');return true}
      if(action==='diary'){if(!openCore('diary'))toast('Meu Diário ainda está carregando.');return true}
      if(action==='games'){await openGames();return true}
      if(action==='studio'){await openStudio();return true}
      if(action==='logout'){logout();return true}
      return false
    }finally{setTimeout(()=>busy='',160)}
  }
  function openConversation(id){
    if(!id)return false
    const orig=[...document.querySelectorAll('#chatList .chat-item[data-conv]')].find(x=>String(x.dataset.conv||'')===String(id))
    if(!orig){toast('Essa conversa ainda está sincronizando.');return false}
    enterPanel();requestAnimationFrame(()=>nativeClick(orig));return true
  }
  function home(){return enterHome()}

  function route(e){
    if(!built||!APPROVED.has(profile()))return
    const pin=e.target?.closest?.('.nuvem-pin-picker-trigger,[data-nuvem-pin-picker],[data-pin-picker]');if(pin)return
    const back=e.target?.closest?.('#approvedUnifiedBack'),action=e.target?.closest?.('[data-approved-action],[data-ka-action]'),conv=e.target?.closest?.('#kaConversationList [data-ka-conv]')
    if(!back&&!action&&!conv)return
    e.preventDefault();e.stopImmediatePropagation()
    if(back){home();return}
    if(action){runAction(action.dataset.approvedAction||action.dataset.kaAction);return}
    openConversation(conv.dataset.kaConv)
  }
  function keyboard(e){
    if(!built||!['Enter',' '].includes(e.key))return
    const target=e.target?.closest?.('#approvedUnifiedBack,[data-approved-action],[data-ka-action],#kaConversationList [data-ka-conv]');if(!target)return
    e.preventDefault();e.stopImmediatePropagation();if(target.id==='approvedUnifiedBack')home();else if(target.dataset.approvedAction||target.dataset.kaAction)runAction(target.dataset.approvedAction||target.dataset.kaAction);else openConversation(target.dataset.kaConv)
  }
  function bindRouting(){if(routingBound)return;routingBound=true;window.addEventListener('click',route,true);window.addEventListener('keydown',keyboard,true);document.addEventListener('click',e=>{if(!APPROVED.has(profile())||!e.target?.closest?.('#mobileBackBtn,#mobileNativeBack'))return;setTimeout(home,0)},false);document.addEventListener('isa:core-back',()=>setTimeout(home,0))}

  function tryBuild(){if(built)return true;if(!APPROVED.has(profile())||!mainReady())return false;return build()}
  function start(){
    ensureEarlyCss();bindRouting();tryBuild()
    if(built)return
    const root=$('app')||document.documentElement
    buildObserver=new MutationObserver(()=>{if(tryBuild()){try{buildObserver.disconnect()}catch{}buildObserver=null}})
    buildObserver.observe(root,{subtree:true,childList:true,attributes:true,characterData:true,attributeFilter:['class']})
    for(const ev of ['isa:core-ready','isa:core-boot-complete','isa:final-shell-ready'])document.addEventListener(ev,tryBuild)
    window.addEventListener('pageshow',tryBuild,{once:true})
  }

  window.__ISA_SHOW_APPROVED_HOME__=home
  window.__ISA_SHOW_KEISE_HOME__=home
  window.__ISA_SHOW_APPROVED_PROFILE_HOME__=home
  window.__ISA_APPROVED_RUN_ACTION__=runAction
  window.__ISA_KEISE_RUN_ACTION__=runAction
  window.__ISA_APPROVED_PROFILE_RUN_ACTION__=runAction
  window.__ISA_OPEN_KEISE_CONVERSATION__=openConversation
  window.__ISA_APPROVED_PROFILE_ENTER_PANEL__=enterPanel
  window.__ISA_KEISE_ENTER_PANEL__=enterPanel
  window.__ISA_APPROVED_DASHBOARD__={home,enterPanel,runAction,openConversation,tryBuild,get mode(){return mode},get profile(){return profile()}}
  start()
})();