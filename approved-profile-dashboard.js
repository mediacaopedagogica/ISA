// Isa Chat — ÚNICO dashboard aprovado compartilhado por Isa e Alan.
// Mesma linguagem visual da Keise; cada perfil mantém apenas os próprios recursos.
// O DOM antigo continua invisível como núcleo de mensagens, módulos, sessão e permissões.
(function(){
  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const wait=ms=>new Promise(r=>setTimeout(r,ms))
  let built=false,chatObserver=null,identityTimer=null,busy=''

  const requested=()=>norm(new URLSearchParams(location.search).get('perfil'))
  const current=()=>norm($('myName')?.textContent)
  const profile=()=>{const n=current(),r=requested();if(n==='isa'||n.startsWith('isa ')||r==='isa')return'isa';if(n==='alan'||n.startsWith('alan ')||r==='alan')return'alan';return''}
  const ready=()=>!!$('mainView')&&!$('mainView').classList.contains('hidden')&&!!profile()
  const CONFIG={
    isa:{name:'Isa',emoji:'🌷',features:[['💬','Chat','chat'],['⚙️','Configurações','settings'],['📔','Meu Diário','diary'],['📚','Estudos','study'],['🎮','Joguinhos','games'],['🌸','Nossa Rede','social']]},
    alan:{name:'Alan',emoji:'🎸',features:[['💬','Chat','chat'],['📅','Calendário','calendar'],['🎸','Meu Estúdio','studio'],['⚙️','Configurações','settings'],['🌸','Nossa Rede','social'],['🎮','Joguinhos','games']]}
  }

  function toast(text){const t=$('toast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._approvedDash);t._approvedDash=setTimeout(()=>t.classList.add('hidden'),2700)}
  async function load(path){try{return await import(path)}catch(e){console.warn('Dashboard aprovado:',path,e);return null}}
  function ensureCss(){
    if(!$('approvedProfileBaseCss')){const l=document.createElement('link');l.id='approvedProfileBaseCss';l.rel='stylesheet';l.href='./keise-approved-layout-final.css?v=5-shared-profiles';document.head.appendChild(l)}
    if(!$('approvedProfileRuntimeStyle')){
      const s=document.createElement('style');s.id='approvedProfileRuntimeStyle';s.textContent=`
        body.approved-family-dashboard .ka-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}
        body.approved-family-dashboard .ka-grid .ka-feature,body.approved-family-dashboard .ka-grid .ka-feature:nth-child(n+5){grid-column:span 1!important;min-height:142px!important}
        #approvedPanelBack{position:fixed;z-index:119500;left:max(12px,env(safe-area-inset-left));top:max(12px,env(safe-area-inset-top));min-width:48px;height:46px;padding:0 15px;border:1px solid rgba(255,255,255,.95);border-radius:16px;background:linear-gradient(145deg,#fff,#efe5ff);color:#5d466c;box-shadow:0 10px 26px rgba(79,57,96,.18);font:800 14px/1 Inter,"Segoe UI",sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px}
        #approvedPanelBack.hidden{display:none!important}
        body.approved-family-dashboard #mobilePanelBack{display:none!important}
        @media(max-width:850px){body.approved-family-dashboard .ka-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}body.approved-family-dashboard .ka-grid .ka-feature,body.approved-family-dashboard .ka-grid .ka-feature:nth-child(n+5){grid-column:span 1!important;min-height:108px!important;font-size:13px!important}#approvedPanelBack{width:46px;min-width:46px;padding:0;font-size:0}#approvedPanelBack:before{content:'←';font-size:23px}}
        @media(max-width:390px){body.approved-family-dashboard .ka-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
      `;document.head.appendChild(s)
    }
  }
  function shell(){const main=$('mainView');return{main,sidebar:main?.querySelector(':scope > .sidebar')||main?.querySelector('.sidebar'),content:main?.querySelector(':scope > .content')||main?.querySelector('.content')}}
  function clearInline(el,props){if(!el)return;props.forEach(p=>el.style.removeProperty(p))}
  function restoreHomeShell(){const {main,sidebar,content}=shell();clearInline(main,['display','width','max-width','min-width','height','min-height','max-height','margin','padding','overflow','background']);clearInline(sidebar,['display','visibility','width','min-width','max-width','height','min-height','max-height','padding','margin','border','overflow','pointer-events']);clearInline(content,['display','visibility','width','max-width','min-width','height','min-height','max-height','margin','margin-left','padding','border','border-radius','background','box-shadow','overflow','pointer-events'])}
  function hideNativeHome(){const {content}=shell();if(!content)return;[...content.children].forEach(el=>{if(el.id!=='keiseApprovedHome'&&el.tagName==='SECTION')el.classList.add('hidden')})}

  function enterHome({scroll=false}={}){
    if(!built||!ready())return
    ensureCss();restoreHomeShell();const {main}=shell()
    document.body.classList.add('keise-approved-layout','approved-family-dashboard','keise-dashboard-mode','keise-home-active')
    document.body.classList.remove('keise-panel-active')
    main?.classList.remove('mobile-content-open','mobile-chat-open','mobile-panel-open','mobile-native-content','social-mode')
    hideNativeHome();$('keiseApprovedTopbar')?.classList.remove('hidden');$('keiseApprovedHome')?.classList.remove('hidden');$('approvedPanelBack')?.classList.add('hidden')
    syncIdentity();syncConversations();if(scroll)setTimeout(()=>$('kaConversations')?.scrollIntoView({behavior:'smooth',block:'start'}),60)
  }
  function enterPanel(){
    ensureCss();const {main,sidebar,content}=shell()
    document.body.classList.add('keise-approved-layout','approved-family-dashboard','keise-dashboard-mode','keise-panel-active');document.body.classList.remove('keise-home-active')
    $('keiseApprovedTopbar')?.classList.add('hidden');$('keiseApprovedHome')?.classList.add('hidden');$('approvedPanelBack')?.classList.remove('hidden')
    if(sidebar){sidebar.style.setProperty('display','none','important');sidebar.style.setProperty('visibility','hidden','important');sidebar.style.setProperty('width','0','important')}
    if(main){main.style.setProperty('display','block','important');main.style.setProperty('width','100%','important');main.style.setProperty('height','100dvh','important');main.style.setProperty('overflow','hidden','important')}
    if(content){content.style.setProperty('display','block','important');content.style.setProperty('visibility','visible','important');content.style.setProperty('width','100%','important');content.style.setProperty('height','100dvh','important');content.style.setProperty('margin','0','important');content.style.setProperty('padding','0','important');content.style.setProperty('overflow','hidden','important')}
  }
  window.__ISA_APPROVED_PROFILE_ENTER_PANEL__=enterPanel

  function openCore(tab){const b=document.querySelector(`.nav-tabs .nav-btn[data-tab="${tab}"]`);if(!b)return false;enterPanel();b.click();return true}
  async function openSettings(){if(typeof window.__ISA_OPEN_GENERAL_SETTINGS__!=='function')await load('./general-settings.js?v=15-approved-profiles');if(typeof window.__ISA_OPEN_GENERAL_SETTINGS__==='function'){window.__ISA_OPEN_GENERAL_SETTINGS__();return true}toast('Configurações ainda estão carregando.');return false}
  async function openStatus(){if(typeof window.__ISA_OPEN_PROFILE_STATUS__!=='function')await load('./profile-status-stickers.js?v=14-plus-menu');if(typeof window.__ISA_OPEN_PROFILE_STATUS__==='function'){window.__ISA_OPEN_PROFILE_STATUS__();return true}toast('Meu perfil e status ainda está carregando.');return false}
  async function openGames(){if(typeof window.__CANTINHO_OPEN_GAMES__!=='function'){await load('./games-menu.js?v=15-approved-profiles');await load('./games-menu-snake.js?v=3-all-users')}if(typeof window.__CANTINHO_OPEN_GAMES__==='function'){window.__CANTINHO_OPEN_GAMES__();setTimeout(()=>document.dispatchEvent(new Event('cantinho:games-open')),50);return true}toast('Joguinhos ainda estão carregando.');return false}
  async function openSocial(){
    if(typeof window.__ISA_OPEN_SOCIAL__!=='function'&&typeof window.__ISA_OPEN_SOCIAL_CORE__!=='function')await load('./social-network.js?v=8-privacy')
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
    if(entry){enterPanel();entry.click();return true}
    toast('Meu Estúdio ainda está carregando.');return false
  }
  async function notifications(){await load('./notifications-v2.js?v=11-progressive');if('Notification' in window&&Notification.permission==='granted'){toast('🔔 As notificações já estão ativas.');return}const b=$('enableNotificationsBtn');if(b)b.click();else toast('Notificações ainda estão carregando.')}
  function avatar(){const input=$('profileAvatarInput');if(input)input.click();else toast('A troca da foto ainda está carregando.')}
  function group(){const b=$('newGroupBtn');if(b)b.click();else toast('A criação de grupo ainda está carregando.')}
  function logout(){const b=$('logoutBtn');if(b){b.click();return}location.replace(`./?sair=${profile()||'perfil'}&_cb=${Date.now()}`)}

  async function runAction(a){if(!a||busy===a)return;busy=a;try{
    if(a==='chat'){enterHome({scroll:true});return}
    if(a==='calendar'){if(!openCore('calendar'))toast('Calendário ainda está carregando.');return}
    if(a==='diary'){if(!openCore('diary'))toast('Meu Diário ainda está carregando.');return}
    if(a==='study'){if(!openCore('study'))toast('Estudos ainda estão carregando.');return}
    if(a==='studio'){await openStudio();return}
    if(a==='settings'){await openSettings();return}
    if(a==='games'){await openGames();return}
    if(a==='social'){if(!await openSocial())enterHome();return}
    if(a==='status'||a==='profile'){await openStatus();return}
    if(a==='notifications'){await notifications();return}
    if(a==='avatar'){avatar();return}
    if(a==='group'){group();return}
    if(a==='logout'){logout();return}
  }finally{setTimeout(()=>busy='',160)}}
  function feature(icon,label,a){return `<button type="button" class="ka-feature" data-approved-action="${a}"><span class="ka-feature-icon">${icon}</span><span>${label}</span></button>`}

  function build(){
    if(built||!ready())return false
    ensureCss();const p=profile(),cfg=CONFIG[p],{main,content}=shell();if(!cfg||!main||!content)return false;built=true
    document.body.classList.add('keise-approved-layout','approved-family-dashboard','keise-dashboard-mode',`approved-profile-${p}`)
    // Retira somente cascas visuais antigas. Mensagens, listas e painéis originais permanecem intactos.
    document.querySelectorAll('#keiseDesktopTopbar,#keiseHomeDashboard,.kd-side-menu').forEach(el=>el.remove())
    if(!$('approvedPanelBack')){const b=document.createElement('button');b.id='approvedPanelBack';b.type='button';b.className='hidden';b.innerHTML='← <span>Voltar</span>';b.onclick=e=>{e.preventDefault();e.stopPropagation();enterHome()};document.body.appendChild(b)}

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

    document.addEventListener('click',e=>{const b=e.target.closest?.('[data-approved-action]');if(!b||!profile())return;e.preventDefault();e.stopPropagation();runAction(b.dataset.approvedAction)},true)
    $('kaSearchInput')?.addEventListener('input',filterConversations)
    const source=$('chatList');if(source){chatObserver=new MutationObserver(()=>{if(document.body.classList.contains('keise-home-active'))syncConversations()});chatObserver.observe(source,{childList:true,subtree:true,characterData:true,attributes:true})}
    document.addEventListener('click',e=>{if(!profile())return;if(!e.target.closest?.('#mobileBackBtn,#mobileNativeBack'))return;setTimeout(()=>enterHome(),100)},false)
    identityTimer=setInterval(()=>{if(!profile())return;syncIdentity();if(document.body.classList.contains('keise-home-active'))syncConversations()},900)
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
      const clone=cloneWithoutIds(orig);clone.classList.add('ka-conv-card');clone.removeAttribute('data-conv');clone.querySelectorAll('[data-conv]').forEach(el=>el.removeAttribute('data-conv'))
      clone.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();enterPanel();orig.click()})
      target.appendChild(clone)
    })
    filterConversations()
  }
  function filterConversations(){const q=norm($('kaSearchInput')?.value);document.querySelectorAll('#kaConversationList .ka-conv-card').forEach(card=>{card.style.display=!q||norm(card.textContent).includes(q)?'':'none'})}
  function syncIdentity(){
    const p=profile(),cfg=CONFIG[p];if(!cfg)return
    const src=$('myAvatar'),name=$('myName')?.textContent?.trim()||cfg.name,avatar=src?.innerHTML||src?.textContent||cfg.emoji
    const a=$('kaAvatarContent'),t=$('kaTopAvatar');if(a&&a.innerHTML!==avatar)a.innerHTML=avatar;if(t&&t.innerHTML!==avatar)t.innerHTML=avatar;if($('kaName'))$('kaName').textContent=name
    const cloud=$('pssProfileCloud'),strong=cloud?.querySelector('strong')?.textContent?.trim(),small=cloud?.querySelector('small')?.textContent?.trim();if($('kaStatusTitle'))$('kaStatusTitle').textContent=strong||'Status';if($('kaStatusSub'))$('kaStatusSub').textContent=small||'Como estou hoje'
  }

  function start(){ensureCss();let tries=0;const timer=setInterval(()=>{if(build()||++tries>180)clearInterval(timer)},90)}
  start();window.__ISA_SHOW_APPROVED_PROFILE_HOME__=enterHome;window.__ISA_APPROVED_PROFILE_DASHBOARD__=true
})();
