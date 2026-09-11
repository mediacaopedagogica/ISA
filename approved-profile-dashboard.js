// Isa Chat — dashboard FINAL aprovado de Isa e Alan.
// V2: um único controlador visual; sem intervalos de reconstrução e sem disputar o shell nativo.
(function(){
  'use strict'
  if(window.__ISA_APPROVED_PROFILE_DASHBOARD_V2__)return
  window.__ISA_APPROVED_PROFILE_DASHBOARD_V2__=true

  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const wait=ms=>new Promise(r=>setTimeout(r,ms))
  let built=false,chatObserver=null,chatSyncTimer=null,busy='',lastChatSignature='',lastProfile=''

  const requested=()=>norm(new URLSearchParams(location.search).get('perfil'))
  const current=()=>norm($('myName')?.textContent)
  const profile=()=>{
    const n=current(),r=requested()
    if(n==='isa'||n.startsWith('isa ')||r==='isa')return'isa'
    if(n==='alan'||n.startsWith('alan ')||r==='alan')return'alan'
    return''
  }
  const coreReady=()=>window.__ISA_APP_READY__===true
  const ready=()=>!!$('mainView')&&!$('mainView').classList.contains('hidden')&&!!profile()&&coreReady()
  const CONFIG={
    isa:{name:'Isa',emoji:'🌷',features:[['💬','Chat','chat'],['⚙️','Configurações','settings'],['📔','Meu Diário','diary'],['📚','Estudos','study'],['🎮','Joguinhos','games'],['🌸','Nossa Rede','social']]},
    alan:{name:'Alan',emoji:'🎸',features:[['💬','Chat','chat'],['📅','Calendário','calendar'],['🎸','Meu Estúdio','studio'],['⚙️','Configurações','settings'],['🌸','Nossa Rede','social'],['🎮','Joguinhos','games']]}
  }

  function toast(text){
    const t=$('toast');if(!t){console.info(text);return}
    t.textContent=text;t.classList.remove('hidden');clearTimeout(t._approvedDash);t._approvedDash=setTimeout(()=>t.classList.add('hidden'),2700)
  }
  async function load(path){try{return await import(path)}catch(e){console.warn('Dashboard aprovado:',path,e);return null}}
  function nativeClick(el){
    if(!el)return false
    try{HTMLElement.prototype.click.call(el);return true}catch{}
    try{el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));return true}catch{}
    return false
  }
  function ensureCss(){
    if(!$('approvedProfileBaseCss')){const l=document.createElement('link');l.id='approvedProfileBaseCss';l.rel='stylesheet';l.href='./keise-approved-layout-final.css?v=9-all-approved';document.head.appendChild(l)}
    if(!$('approvedProfileRuntimeStyle')){
      const s=document.createElement('style');s.id='approvedProfileRuntimeStyle';s.textContent=`
        body.approved-family-dashboard .ka-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}
        body.approved-family-dashboard .ka-grid .ka-feature,body.approved-family-dashboard .ka-grid .ka-feature:nth-child(n+5){grid-column:span 1!important;min-height:142px!important}
        #approvedPanelBack{position:fixed;z-index:119500;left:max(12px,env(safe-area-inset-left));top:max(12px,env(safe-area-inset-top));min-width:48px;height:46px;padding:0 15px;border:1px solid rgba(255,255,255,.95);border-radius:16px;background:linear-gradient(145deg,#fff,#efe5ff);color:#5d466c;box-shadow:0 10px 26px rgba(79,57,96,.18);font:800 14px/1 Inter,"Segoe UI",sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;pointer-events:auto!important;touch-action:manipulation!important}
        #approvedPanelBack.hidden{display:none!important}
        body.approved-family-dashboard #mobilePanelBack{display:none!important}
        body.approved-family-dashboard.keise-home-active #mainView>.sidebar{display:none!important;visibility:hidden!important;width:0!important;min-width:0!important;max-width:0!important;pointer-events:none!important;overflow:hidden!important}
        body.approved-family-dashboard.keise-home-active #keiseApprovedTopbar,body.approved-family-dashboard.keise-home-active #keiseApprovedHome{visibility:visible!important;opacity:1!important;pointer-events:auto!important}
        @media(max-width:850px){body.approved-family-dashboard .ka-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}body.approved-family-dashboard .ka-grid .ka-feature,body.approved-family-dashboard .ka-grid .ka-feature:nth-child(n+5){grid-column:span 1!important;min-height:108px!important;font-size:13px!important}#approvedPanelBack{width:46px;min-width:46px;padding:0;font-size:0}#approvedPanelBack:before{content:'←';font-size:23px}}
        @media(max-width:390px){body.approved-family-dashboard .ka-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
      `;document.head.appendChild(s)
    }
  }
  function shell(){const main=$('mainView');return{main,sidebar:main?.querySelector(':scope > .sidebar')||main?.querySelector('.sidebar'),content:main?.querySelector(':scope > .content')||main?.querySelector('.content')}}
  function clearInline(el,props){if(!el)return;props.forEach(p=>el.style.removeProperty(p))}
  function restoreHomeShell(){
    const {main,sidebar,content}=shell()
    clearInline(main,['display','visibility','opacity','pointer-events','grid-template-columns','grid-template-rows','width','max-width','min-width','height','min-height','max-height','margin','padding','overflow','background'])
    clearInline(sidebar,['display','visibility','opacity','width','min-width','max-width','height','min-height','max-height','padding','margin','border','overflow','pointer-events'])
    clearInline(content,['display','visibility','opacity','pointer-events','grid-column','grid-row','width','max-width','min-width','height','min-height','max-height','margin','margin-left','padding','border','border-radius','background','box-shadow','overflow'])
  }
  function hideNativeHome(){
    const {content}=shell();if(!content)return
    ;[...content.children].forEach(el=>{if(el.id!=='keiseApprovedHome'&&el.tagName==='SECTION')el.classList.add('hidden')})
  }
  function emitReady(){
    const p=profile();if(!p)return
    try{document.dispatchEvent(new CustomEvent('isa:approved-home-ready',{detail:{profile:p,version:'v2-single-owner'}}))}catch{}
    try{window.dispatchEvent(new CustomEvent('isa:approved-home-ready',{detail:{profile:p,version:'v2-single-owner'}}))}catch{}
  }

  function enterHome({scroll=false}={}){
    if(!built||!ready())return false
    ensureCss();restoreHomeShell();const {main}=shell(),p=profile()
    document.body.classList.remove('keise-approved-awaiting','isa-keise-layout-pending','keise-panel-active')
    document.body.classList.add('keise-approved-layout','approved-family-dashboard','keise-dashboard-mode','keise-home-active',`approved-profile-${p}`)
    main?.classList.remove('mobile-content-open','mobile-chat-open','mobile-panel-open','mobile-native-content','social-mode')
    hideNativeHome()
    $('keiseApprovedTopbar')?.classList.remove('hidden');$('keiseApprovedHome')?.classList.remove('hidden');$('approvedPanelBack')?.classList.add('hidden')
    syncIdentity();scheduleConversationSync(true)
    if(scroll)setTimeout(()=>$('kaConversations')?.scrollIntoView({behavior:'smooth',block:'start'}),60)
    try{window.__ISA_HIDE_BOOT_GUARD__?.()}catch{}
    $('personalBootGuard')?.classList.add('hidden')
    emitReady();return true
  }
  function enterPanel(){
    if(!built)return false
    ensureCss();const {main,sidebar,content}=shell(),p=profile()
    document.body.classList.remove('keise-approved-awaiting','isa-keise-layout-pending','keise-home-active')
    document.body.classList.add('keise-approved-layout','approved-family-dashboard','keise-dashboard-mode','keise-panel-active',`approved-profile-${p}`)
    $('keiseApprovedTopbar')?.classList.add('hidden');$('keiseApprovedHome')?.classList.add('hidden');$('approvedPanelBack')?.classList.remove('hidden')
    if(sidebar){sidebar.style.setProperty('display','none','important');sidebar.style.setProperty('visibility','hidden','important');sidebar.style.setProperty('width','0','important');sidebar.style.setProperty('pointer-events','none','important')}
    if(main){main.style.setProperty('display','block','important');main.style.setProperty('visibility','visible','important');main.style.setProperty('opacity','1','important');main.style.setProperty('pointer-events','auto','important');main.style.setProperty('width','100%','important');main.style.setProperty('height','100dvh','important');main.style.setProperty('overflow','hidden','important')}
    if(content){content.style.setProperty('display','block','important');content.style.setProperty('visibility','visible','important');content.style.setProperty('opacity','1','important');content.style.setProperty('pointer-events','auto','important');content.style.setProperty('width','100%','important');content.style.setProperty('height','100dvh','important');content.style.setProperty('margin','0','important');content.style.setProperty('padding','0','important');content.style.setProperty('overflow','hidden','important')}
    return true
  }
  window.__ISA_APPROVED_PROFILE_ENTER_PANEL__=enterPanel

  function openCore(tab){const b=document.querySelector(`.nav-tabs .nav-btn[data-tab="${tab}"]`);if(!b)return false;enterPanel();return nativeClick(b)}
  async function openSettings(){if(typeof window.__ISA_OPEN_GENERAL_SETTINGS__!=='function')await load('./general-settings.js?v=18-no-nav-loop');if(typeof window.__ISA_OPEN_GENERAL_SETTINGS__==='function'){await window.__ISA_OPEN_GENERAL_SETTINGS__();return true}toast('Configurações ainda estão carregando.');return false}
  async function openStatus(){if(typeof window.__ISA_OPEN_PROFILE_STATUS__!=='function')await load('./profile-status-stickers.js?v=15-stable-interactions');if(typeof window.__ISA_OPEN_PROFILE_STATUS__==='function'){await window.__ISA_OPEN_PROFILE_STATUS__();return true}toast('Meu perfil e status ainda está carregando.');return false}
  async function openGames(){if(typeof window.__CANTINHO_OPEN_GAMES__!=='function'){await load('./games-menu.js?v=15-approved-profiles');await load('./games-menu-snake.js?v=3-all-users')}if(typeof window.__CANTINHO_OPEN_GAMES__==='function'){window.__CANTINHO_OPEN_GAMES__();setTimeout(()=>document.dispatchEvent(new Event('cantinho:games-open')),50);return true}toast('Joguinhos ainda estão carregando.');return false}
  async function openSocial(){
    if(typeof window.__ISA_OPEN_SOCIAL__!=='function'&&typeof window.__ISA_OPEN_SOCIAL_CORE__!=='function')await load('./social-network.js?v=10-approved-single-owner')
    const fn=window.__ISA_OPEN_SOCIAL__||window.__ISA_OPEN_SOCIAL_CORE__
    if(typeof fn==='function'){enterPanel();await fn();setTimeout(()=>window.__ISA_SOCIAL_PRIVACY__?.apply?.(),80);return true}
    toast('Nossa Rede ainda está carregando.');return false
  }
  async function openStudio(){
    if(profile()!=='alan')return false
    let entry=$('alanStudioEntry')||$('alanStudioLauncher')
    if(!entry){
      const access=await load('./alan-studio-access.js?v=2-approved-dashboard')
      try{if(access?.isAlanStudioEnabled&&!(await access.isAlanStudioEnabled())){toast('Meu Estúdio está desativado no momento.');return false}}catch{}
      await load('./alan-studio-launcher.js?v=2-approved-dashboard')
      for(let i=0;i<24&&!($('alanStudioEntry')||$('alanStudioLauncher'));i++)await wait(80)
      entry=$('alanStudioEntry')||$('alanStudioLauncher')
    }
    if(entry){enterPanel();nativeClick(entry);return true}
    toast('Meu Estúdio ainda está carregando.');return false
  }
  async function notifications(){await load('./notifications-v2.js?v=12-stable-interactions');if('Notification' in window&&Notification.permission==='granted'){toast('🔔 As notificações já estão ativas.');return true}const b=$('enableNotificationsBtn');if(b){nativeClick(b);return true}toast('Notificações ainda estão carregando.');return false}
  function avatar(){const input=$('profileAvatarInput');if(input){nativeClick(input);return true}toast('A troca da foto ainda está carregando.');return false}
  function group(){const b=$('newGroupBtn');if(b){nativeClick(b);return true}toast('A criação de grupo ainda está carregando.');return false}
  function logout(){const b=$('logoutBtn');if(b){nativeClick(b);setTimeout(()=>{const main=$('mainView');if(main&&!main.classList.contains('hidden'))location.replace(`./?sair=${profile()||'perfil'}&_cb=${Date.now()}`)},1700);return true}location.replace(`./?sair=${profile()||'perfil'}&_cb=${Date.now()}`);return true}

  async function runAction(a){
    if(!a||busy===a)return false;busy=a
    try{
      if(a==='chat'){enterHome({scroll:true});return true}
      if(a==='calendar'){if(!openCore('calendar'))toast('Calendário ainda está carregando.');return true}
      if(a==='diary'){if(!openCore('diary'))toast('Meu Diário ainda está carregando.');return true}
      if(a==='study'){if(!openCore('study'))toast('Estudos ainda estão carregando.');return true}
      if(a==='studio'){await openStudio();return true}
      if(a==='settings'){await openSettings();return true}
      if(a==='games'){await openGames();return true}
      if(a==='social'){if(!await openSocial())enterHome();return true}
      if(a==='status'||a==='profile'){await openStatus();return true}
      if(a==='notifications'){await notifications();return true}
      if(a==='avatar'){avatar();return true}
      if(a==='group'){group();return true}
      if(a==='logout'){logout();return true}
      return false
    }finally{setTimeout(()=>busy='',180)}
  }
  window.__ISA_APPROVED_PROFILE_RUN_ACTION__=runAction
  window.__ISA_SHOW_APPROVED_PROFILE_HOME__=enterHome
  function feature(icon,label,a){return `<button type="button" class="ka-feature" data-approved-action="${a}"><span class="ka-feature-icon">${icon}</span><span>${label}</span></button>`}

  function build(){
    if(built||!ready())return false
    ensureCss();const p=profile(),cfg=CONFIG[p],{main,content}=shell();if(!cfg||!main||!content)return false
    built=true;lastProfile=p
    document.body.classList.remove('keise-approved-awaiting','isa-keise-layout-pending')
    document.body.classList.add('keise-approved-layout','approved-family-dashboard','keise-dashboard-mode',`approved-profile-${p}`)
    document.querySelectorAll('#keiseDesktopTopbar,#keiseHomeDashboard,.kd-side-menu,#approvedProfileHome,#isaFinalShellShield,#isaFinalShellShieldV2,#isaApprovedShellShield').forEach(el=>el.remove())
    if(!$('approvedPanelBack')){const b=document.createElement('button');b.id='approvedPanelBack';b.type='button';b.className='hidden';b.dataset.approvedBack='1';b.innerHTML='← <span>Voltar</span>';b.setAttribute('aria-label','Voltar ao início');b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();enterHome()},true);document.body.appendChild(b)}

    let top=$('keiseApprovedTopbar')
    if(!top){top=document.createElement('header');top.id='keiseApprovedTopbar';top.innerHTML=`<div class="ka-brand"><span class="ka-brand-heart">💗</span><span class="ka-brand-name">Cantinho da Isa 💕</span></div><label class="ka-search"><input id="kaSearchInput" type="search" placeholder="Pesquisar no Cantinho da Isa..." aria-label="Pesquisar no Cantinho da Isa"></label><div class="ka-top-actions"><button class="ka-bell" type="button" data-approved-action="notifications" aria-label="Notificações">🔔</button><button class="ka-top-profile" type="button" data-approved-action="profile"><span id="kaTopAvatar" class="ka-top-avatar">${cfg.emoji}</span><span>${cfg.name}</span><span>⌄</span></button></div>`;main.insertBefore(top,main.firstChild)}

    let home=$('keiseApprovedHome')
    if(!home){home=document.createElement('section');home.id='keiseApprovedHome';home.innerHTML=`
      <div class="ka-hero">
        <button type="button" class="ka-avatar-btn" data-approved-action="avatar" aria-label="Alterar foto do perfil"><span id="kaAvatarContent" class="ka-avatar-content">${cfg.emoji}</span><span class="ka-camera">📷</span></button>
        <div class="ka-identity"><h1 id="kaName">${cfg.name}</h1><p>Cantinho da Isa <span>💕</span></p></div>
        <button type="button" class="ka-status-btn" data-approved-action="status"><span class="cloud">☁️</span><span><b id="kaStatusTitle">Status</b><small id="kaStatusSub">Como estou hoje</small></span><span class="arrow">›</span></button>
        <button type="button" class="ka-logout" data-approved-action="logout">Sair</button>
      </div>
      <div class="ka-grid">${cfg.features.map(x=>feature(...x)).join('')}</div>
      <div id="kaConversations" class="ka-conv-head"><h2>Conversas</h2><button type="button" class="ka-group-btn" data-approved-action="group">＋ Grupo</button></div>
      <div id="kaConversationList"></div><div class="ka-heart-deco" aria-hidden="true">💜</div>`;content.insertBefore(home,content.firstChild)}

    $('kaSearchInput')?.addEventListener('input',filterConversations,{passive:true})
    const source=$('chatList')
    if(source){chatObserver=new MutationObserver(()=>scheduleConversationSync(false));chatObserver.observe(source,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','title','style','src']})}
    document.addEventListener('isa:profile-updated',()=>syncIdentity(),{passive:true})
    document.addEventListener('isa:profile-status-saved',()=>syncIdentity(),{passive:true})
    window.addEventListener('pageshow',()=>{syncIdentity();scheduleConversationSync(false)},{passive:true})
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){syncIdentity();scheduleConversationSync(false)}},{passive:true})
    ;[180,650,1600].forEach(ms=>setTimeout(()=>{syncIdentity();scheduleConversationSync(false)},ms))
    syncIdentity();scheduleConversationSync(true);enterHome();return true
  }

  function cloneWithoutIds(node){const c=node.cloneNode(true);c.removeAttribute?.('id');c.querySelectorAll?.('[id]').forEach(x=>x.removeAttribute('id'));return c}
  function conversationSignature(items){return items.map(x=>`${x.dataset.conv||''}|${x.className}|${x.innerHTML}`).join('\u241E')}
  function scheduleConversationSync(force=false){clearTimeout(chatSyncTimer);chatSyncTimer=setTimeout(()=>syncConversations(force),force?0:80)}
  function syncConversations(force=false){
    if(!built||!document.body.classList.contains('keise-home-active'))return
    const source=$('chatList'),target=$('kaConversationList');if(!source||!target)return
    const items=[...source.querySelectorAll('.chat-item[data-conv]')].filter(x=>!x.classList.contains('hidden')&&getComputedStyle(x).display!=='none')
    const signature=conversationSignature(items);if(!force&&signature===lastChatSignature)return;lastChatSignature=signature
    const frag=document.createDocumentFragment()
    if(!items.length){const n=document.createElement('div');n.className='ka-empty-note';n.textContent=/carregando/i.test(source.textContent||'')?'Abrindo suas conversas…':'Suas conversas aparecem aqui.';frag.appendChild(n)}
    else items.forEach(orig=>{const clone=cloneWithoutIds(orig);clone.classList.add('ka-conv-card');clone.dataset.sourceConv=orig.dataset.conv||'';clone.removeAttribute('data-conv');clone.setAttribute('role','button');clone.tabIndex=0;clone.querySelectorAll('[data-conv]').forEach(el=>el.removeAttribute('data-conv'));frag.appendChild(clone)})
    target.replaceChildren(frag);filterConversations()
    try{window.__ISA_STABILIZE_APPROVED_CONVERSATIONS__?.()}catch{}
  }
  function filterConversations(){const q=norm($('kaSearchInput')?.value);document.querySelectorAll('#kaConversationList .ka-conv-card,#kaConversationListStable .ka-conv-card').forEach(card=>{card.style.display=!q||norm(card.textContent).includes(q)?'':'none'})}
  function syncIdentity(){
    const p=profile(),cfg=CONFIG[p];if(!cfg||p!==lastProfile)return
    const src=$('myAvatar'),name=$('myName')?.textContent?.trim()||cfg.name,avatar=src?.innerHTML||src?.textContent||cfg.emoji
    const a=$('kaAvatarContent'),t=$('kaTopAvatar');if(a&&a.innerHTML!==avatar)a.innerHTML=avatar;if(t&&t.innerHTML!==avatar)t.innerHTML=avatar;if($('kaName')&&$('kaName').textContent!==name)$('kaName').textContent=name
    const cloud=$('pssProfileCloud'),strong=cloud?.querySelector('strong')?.textContent?.trim(),small=cloud?.querySelector('small')?.textContent?.trim();if($('kaStatusTitle'))$('kaStatusTitle').textContent=strong||'Status';if($('kaStatusSub'))$('kaStatusSub').textContent=small||'Como estou hoje'
  }

  function start(){ensureCss();let tries=0;const timer=setInterval(()=>{if(build()||++tries>220)clearInterval(timer)},90)}
  start();window.__ISA_APPROVED_PROFILE_DASHBOARD__=true
})();
