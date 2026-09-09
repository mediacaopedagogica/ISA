const $=id=>document.getElementById(id)
const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
const wait=ms=>new Promise(r=>setTimeout(r,ms))
let built=false,chatObserver=null,identityTimer=null

function requested(){return norm(new URLSearchParams(location.search).get('perfil'))}
function current(){return norm($('myName')?.textContent)}
function isKeise(){const p=current(),q=requested();return p==='keise'||p.startsWith('keise ')||q==='keise'}
function mainReady(){const m=$('mainView');return !!m&&!m.classList.contains('hidden')&&isKeise()}
function ensureCss(){if(document.querySelector('link[data-keise-dashboard]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href='./keise-dashboard-v1.css?v=2-approved-exact';l.dataset.keiseDashboard='1';document.head.appendChild(l)}
function toast(text){const t=$('toast');if(t){t.textContent=text;t.classList.remove('hidden');clearTimeout(t._kd);t._kd=setTimeout(()=>t.classList.add('hidden'),2600);return}console.info(text)}

async function find(selector,tries=24,delay=90){for(let i=0;i<tries;i++){const el=document.querySelector(selector);if(el)return el;await wait(delay)}return null}
async function clickTarget(selector,modulePath,after){let el=document.querySelector(selector);if(!el&&modulePath){try{await import(modulePath)}catch(e){console.warn('Keise dashboard module:',modulePath,e)}el=await find(selector,18,80)}if(el){el.click();after?.();return true}return false}

function hideHome(){document.body.classList.remove('keise-home-active');$('keiseHomeDashboard')?.classList.add('hidden')}
function clearMainPanels(){
  const content=document.querySelector('.content');if(!content)return
  ;[...content.children].forEach(el=>{if(el.id!=='keiseHomeDashboard'&&el.tagName==='SECTION')el.classList.add('hidden')})
}
function showHome({scrollConversations=false}={}){
  if(!built||!mainReady())return
  clearMainPanels();$('keiseHomeDashboard')?.classList.remove('hidden');document.body.classList.add('keise-home-active');
  document.querySelectorAll('.kd-side-btn').forEach(b=>b.classList.toggle('active',b.dataset.kdAction==='home'))
  syncIdentity();syncConversations();
  if(scrollConversations)setTimeout(()=>$('kdConversations')?.scrollIntoView({behavior:'smooth',block:'start'}),60)
}

async function openStatus(){
  hideHome()
  let cloud=$('pssProfileCloud')
  if(!cloud){try{await import('./profile-status-stickers.js?v=14-plus-menu')}catch{}cloud=await find('#pssProfileCloud',24,80)}
  if(cloud){cloud.click();return}
  showHome();toast('Meu perfil e status ainda está carregando.')
}
async function openSettings(){
  hideHome()
  if(typeof window.__ISA_OPEN_GENERAL_SETTINGS__!=='function'){try{await import('./general-settings.js?v=12-unified-settings')}catch{}}
  if(typeof window.__ISA_OPEN_GENERAL_SETTINGS__==='function'){window.__ISA_OPEN_GENERAL_SETTINGS__();return}
  const ok=await clickTarget('#settingsMenuBtn,[data-settings-menu="1"]');if(!ok){showHome();toast('Configurações ainda estão carregando.')}
}
async function runAction(action){
  if(action==='home'){showHome();return}
  if(action==='chat'){showHome({scrollConversations:true});return}
  if(action==='calendar'){hideHome();if(!await clickTarget('.nav-tabs .nav-btn[data-tab="calendar"]')){showHome();toast('Calendário ainda está carregando.')}return}
  if(action==='social'){hideHome();if(!await clickTarget('#socialNav','./social-nav-guard.js?v=6-progressive')){showHome();toast('Nossa Rede ainda está carregando.')}return}
  if(action==='test'){hideHome();if(!await clickTarget('#testGameNav','./keise-game-test.js?v=9-progressive')){showHome();toast('Teste ainda está carregando.')}return}
  if(action==='supervision'){hideHome();if(!await clickTarget('#supervisionNav,.nav-tabs .nav-btn[data-tab="supervision"]')){showHome();toast('Supervisão ainda está carregando.')}return}
  if(action==='parents'){hideHome();if(!await clickTarget('#parentsNav,.nav-tabs .nav-btn[data-tab="parents"]')){showHome();toast('Super Pais ainda está carregando.')}return}
  if(action==='access'){hideHome();if(!await clickTarget('#accessSettingsNav','./keise-access-settings.js?v=1-edit-login')){showHome();toast('Meu acesso ainda está carregando.')}return}
  if(action==='profile'||action==='status'){await openStatus();return}
  if(action==='settings'){await openSettings();return}
  if(action==='group'){$('newGroupBtn')?.click();return}
  if(action==='help'){toast('Ajuda do Cantinho: use os cartões para abrir cada área e as conversas para falar com a família.');return}
  if(action==='about'){toast('Cantinho da Isa 💕 — espaço privado da família.');return}
}

function feature(icon,label,action,cls=''){return `<button type="button" class="kd-feature ${cls}" data-kd-action="${action}"><span class="kd-feature-icon">${icon}</span><span>${label}</span></button>`}
function side(icon,label,action,active=false){return `<button type="button" class="kd-side-btn${active?' active':''}" data-kd-action="${action}"><span class="kd-side-icon">${icon}</span><span>${label}</span></button>`}

function build(){
  if(built||!mainReady())return false
  ensureCss();built=true;document.body.classList.add('keise-dashboard-mode')
  const main=$('mainView'),sidebar=main?.querySelector('.sidebar'),content=main?.querySelector('.content');if(!main||!sidebar||!content){built=false;return false}

  if(!$('keiseDesktopTopbar')){
    const top=document.createElement('header');top.id='keiseDesktopTopbar';top.innerHTML=`<div class="kd-brand"><span class="kd-brand-heart">💗</span><span class="kd-brand-name">Cantinho da Isa 💕</span></div><label class="kd-search"><input id="kdSearchInput" type="search" placeholder="Pesquisar no Cantinho da Isa..." aria-label="Pesquisar no Cantinho da Isa"></label><div class="kd-top-actions"><button class="kd-bell" type="button" aria-label="Notificações">🔔</button><button class="kd-top-profile" type="button" data-kd-action="profile"><span id="kdTopAvatar" class="kd-top-avatar">🦋</span><span>Keise</span><span>⌄</span></button></div>`;main.insertBefore(top,main.firstChild)
  }

  if(!sidebar.querySelector('.kd-side-menu')){
    const menu=document.createElement('div');menu.className='kd-side-menu';menu.innerHTML=`${side('⌂','Início','home',true)}${side('💬','Chat','chat')}${side('📅','Calendário','calendar')}${side('🌸','Nossa Rede','social')}${side('🧪','Teste','test')}${side('👀','Supervisão','supervision')}${side('🛡️','Super Pais','parents')}${side('🔐','Meu acesso','access')}${side('👤','Meu perfil','profile')}${side('⚙️','Configurações','settings')}<div class="kd-side-sep"></div>${side('❔','Ajuda','help')}${side('♡','Sobre o app','about')}<div class="kd-side-note">Família<br>é tudo 💕</div>`;sidebar.appendChild(menu)
  }

  if(!$('keiseHomeDashboard')){
    const home=document.createElement('section');home.id='keiseHomeDashboard';home.className='kd-home';home.innerHTML=`
      <div class="kd-hero">
        <button id="kdAvatarBtn" type="button" class="kd-avatar-btn" aria-label="Alterar foto do perfil"><span id="kdAvatarContent" class="kd-avatar-content">🦋</span><span class="kd-camera">📷</span></button>
        <div class="kd-identity"><h1 id="kdName">Keise</h1><p>Cantinho da Isa <span>💕</span></p></div>
        <button type="button" class="kd-status-btn" data-kd-action="status"><span class="cloud">☁️</span><span><b id="kdStatusTitle">Status</b><small id="kdStatusSub">Como estou hoje</small></span><span>›</span></button>
        <button id="kdLogout" type="button" class="kd-logout">Sair</button>
      </div>
      <div class="kd-grid">
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
      <div id="kdConversations" class="kd-conv-head"><h2>Conversas</h2><button type="button" class="kd-group-btn" data-kd-action="group">＋ Grupo</button></div>
      <div id="kdConversationList" class="kd-conversations-list"></div>
      <div class="kd-heart-deco" aria-hidden="true">💜</div>`
    content.insertBefore(home,content.firstChild)
  }

  document.addEventListener('click',e=>{const b=e.target.closest('[data-kd-action]');if(!b)return;const a=b.dataset.kdAction;if(!a)return;e.preventDefault();runAction(a)},false)
  $('kdLogout').addEventListener('click',e=>{e.preventDefault();$('logoutBtn')?.click()})
  $('kdAvatarBtn').addEventListener('click',e=>{e.preventDefault();const profileBtn=$('myAvatarBtn');if(profileBtn)profileBtn.click();else $('profileAvatarInput')?.click()})
  $('kdSearchInput')?.addEventListener('input',filterConversations)

  const list=$('chatList');if(list){chatObserver=new MutationObserver(syncConversations);chatObserver.observe(list,{childList:true,subtree:true,characterData:true})}
  $('mobileBackBtn')?.addEventListener('click',()=>setTimeout(()=>{if($('chatPanel')?.classList.contains('hidden'))showHome()},180))
  document.querySelector('.nav-tabs .nav-btn[data-tab="chats"]')?.addEventListener('click',()=>setTimeout(()=>{if($('chatPanel')?.classList.contains('hidden'))showHome()},80))
  identityTimer=setInterval(()=>{if(!mainReady()){clearInterval(identityTimer);return}syncIdentity();if(document.body.classList.contains('keise-home-active'))syncConversations()},900)
  syncIdentity();syncConversations();showHome();return true
}

function cloneWithoutIds(node){const c=node.cloneNode(true);c.removeAttribute?.('id');c.querySelectorAll?.('[id]').forEach(x=>x.removeAttribute('id'));return c}
function syncConversations(){
  const source=$('chatList'),target=$('kdConversationList');if(!source||!target)return
  const items=[...source.querySelectorAll('.chat-item')].filter(x=>!x.classList.contains('hidden')&&getComputedStyle(x).display!=='none')
  target.innerHTML=''
  if(!items.length){const n=document.createElement('div');n.className='kd-empty-note';n.textContent=/carregando/i.test(source.textContent||'')?'Abrindo suas conversas…':'Suas conversas aparecem aqui.';target.appendChild(n);return}
  items.forEach((orig,i)=>{const clone=cloneWithoutIds(orig);clone.classList.add('kd-conv-card');clone.dataset.kdConvIndex=String(i);clone.querySelectorAll('button,input,a').forEach(el=>{el.tabIndex=-1});clone.addEventListener('click',e=>{e.preventDefault();hideHome();orig.click()});target.appendChild(clone)})
  filterConversations()
}
function filterConversations(){const q=norm($('kdSearchInput')?.value);document.querySelectorAll('#kdConversationList .kd-conv-card').forEach(card=>{card.style.display=!q||norm(card.textContent).includes(q)?'':'none'})}
function syncIdentity(){
  const src=$('myAvatar'),name=$('myName')?.textContent?.trim()||'Keise';const avatar=src?.innerHTML||src?.textContent||'🦋'
  const a=$('kdAvatarContent'),t=$('kdTopAvatar');if(a&&a.innerHTML!==avatar)a.innerHTML=avatar;if(t&&t.innerHTML!==avatar)t.innerHTML=avatar;if($('kdName'))$('kdName').textContent=name
  const cloud=$('pssProfileCloud'),strong=cloud?.querySelector('strong')?.textContent?.trim(),small=cloud?.querySelector('small')?.textContent?.trim();if($('kdStatusTitle'))$('kdStatusTitle').textContent=strong||'Status';if($('kdStatusSub'))$('kdStatusSub').textContent=small||'Como estou hoje'
}

function start(){ensureCss();if(build())return;let tries=0;const timer=setInterval(()=>{if(build()||++tries>120)clearInterval(timer)},120)}
start()
window.__ISA_SHOW_KEISE_HOME__=showHome
