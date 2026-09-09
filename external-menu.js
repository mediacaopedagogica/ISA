const $=id=>document.getElementById(id)
let socialLoading=null,profileLoading=null,gamesLoading=null,studiesLoading=null
const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')

function toast(text){
  if(typeof window.__ISA_FRIEND_TOAST__==='function')return window.__ISA_FRIEND_TOAST__(text)
  const t=$('friendToast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._externalMenu);t._externalMenu=setTimeout(()=>t.classList.add('hidden'),2600)
}
function currentName(){return norm(window.__ISA_FRIEND_PERSON__?.name||$('friendName')?.textContent)}
function isPaloma(){return currentName()==='paloma'}
function addStyle(){
  if($('externalMenuStyle'))return
  const s=document.createElement('style');s.id='externalMenuStyle';s.textContent=`
.family-primary-nav{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(64px,1fr));gap:7px!important;margin:8px 0 12px!important}.family-primary-tab{min-width:0!important;min-height:48px!important;padding:7px 5px!important;border-radius:14px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:5px!important;font-weight:900!important}.family-primary-tab span{font-size:10px!important;white-space:nowrap!important}.family-primary-tab.icon-only{font-size:20px!important}.family-primary-tab.icon-only span{display:none!important}.friend-profile .pss-profile-edit{display:none!important}.friend-composer #palomaGamesPlus{display:none!important}
@media(max-width:780px){.family-primary-nav{position:sticky;top:0;z-index:15;grid-template-columns:repeat(4,minmax(0,1fr));padding:5px!important;margin:4px 0 8px!important;border-radius:16px;background:rgba(255,250,255,.9);backdrop-filter:blur(12px)}.family-primary-tab{min-height:44px!important;padding:4px 2px!important}.family-primary-tab span{font-size:8px!important}.family-primary-tab.icon-only{font-size:18px!important}}
`;document.head.appendChild(s)
}
async function ensureSocialLoaded(){
  if(typeof window.__ISA_OPEN_FAMILY_SOCIAL__==='function')return true
  if(!socialLoading)socialLoading=import('./family-social.js?v=10-unfreeze-menu').catch(e=>{socialLoading=null;throw e})
  try{await socialLoading;window.__ISA_ENSURE_FAMILY_SOCIAL__?.();return typeof window.__ISA_OPEN_FAMILY_SOCIAL__==='function'}catch(e){console.warn('Nossa Rede:',e);toast('A Nossa Rede demorou para abrir. Tente novamente.');return false}
}
async function ensureProfileLoaded(){
  if(typeof window.__ISA_OPEN_PROFILE_STATUS__==='function'&&typeof window.__ISA_OPEN_STICKER_CREATOR__==='function')return true
  if(!profileLoading)profileLoading=import('./profile-status-stickers.js?v=9-unfreeze-menu').catch(e=>{profileLoading=null;throw e})
  try{await profileLoading;return true}catch(e){console.warn('Perfil/Stickers:',e);toast('Perfil e Stickers ainda estão carregando.');return false}
}
async function ensureGamesLoaded(){
  if(typeof window.__CANTINHO_OPEN_GAMES__==='function')return true
  if(!gamesLoading)gamesLoading=import('./games-menu.js?v=11-all-family-menu').catch(e=>{gamesLoading=null;throw e})
  try{await gamesLoading;return typeof window.__CANTINHO_OPEN_GAMES__==='function'}catch(e){console.warn('Joguinhos:',e);toast('Os Joguinhos ainda estão carregando.');return false}
}
async function ensureStudiesLoaded(){
  if(typeof window.__PALOMA_OPEN_STUDIES__==='function')return true
  if(!studiesLoading)studiesLoading=import('./paloma-studies.js?v=8-paloma-menu').catch(e=>{studiesLoading=null;throw e})
  try{await studiesLoading;return typeof window.__PALOMA_OPEN_STUDIES__==='function'}catch(e){console.warn('Estudos da Paloma:',e);toast('Os Estudos ainda estão carregando.');return false}
}
function goChats(){
  window.__ISA_CLOSE_FAMILY_SOCIAL__?.()
  if($('friendChat')?.classList.contains('thread-open'))$('friendBackBtn')?.click()
  $('friendChatsTab')?.classList.add('active');$('friendSocialBtn')?.classList.remove('active')
}
async function openSocial(){if(await ensureSocialLoaded())window.__ISA_OPEN_FAMILY_SOCIAL__?.()}
async function openProfile(){if(await ensureProfileLoaded()){if(typeof window.__ISA_OPEN_PROFILE_STATUS__==='function')window.__ISA_OPEN_PROFILE_STATUS__();else document.querySelector('.pss-profile-edit')?.click()}}
async function openSticker(){if(await ensureProfileLoaded()){if(typeof window.__ISA_OPEN_STICKER_CREATOR__==='function')window.__ISA_OPEN_STICKER_CREATOR__();else $('pssStickerBtn')?.click()}}
async function openGames(){if(await ensureGamesLoaded())window.__CANTINHO_OPEN_GAMES__?.()}
async function openStudies(){if(isPaloma()&&await ensureStudiesLoaded())window.__PALOMA_OPEN_STUDIES__?.()}
function setHtml(el,html){if(el&&el.innerHTML!==html)el.innerHTML=html}
function stableOrder(nav,items){const order=items.filter(Boolean),wanted=new Set(order),current=[...nav.children].filter(el=>wanted.has(el));if(current.length===order.length&&current.every((el,i)=>el===order[i]))return;order.forEach(el=>{if(el.parentNode===nav)nav.appendChild(el)})}
function bind(el,key,fn){if(!el||el.dataset[key]==='1')return;el.dataset[key]='1';el.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();fn()})}
function ensure(){
  addStyle()
  const nav=document.querySelector('.family-primary-nav');if(!nav)return false
  const chat=$('friendChatsTab');if(chat){chat.disabled=false;chat.removeAttribute('aria-disabled');chat.classList.remove('is-locked');setHtml(chat,'💬 <span>Chat</span>');bind(chat,'externalMenuBound',goChats)}
  let social=$('friendSocialBtn');if(!social){social=document.createElement('button');social.id='friendSocialBtn';social.type='button';social.className='family-primary-tab';nav.appendChild(social)}
  social.classList.add('family-primary-tab');social.classList.remove('is-locked');social.disabled=false;social.removeAttribute('aria-disabled');setHtml(social,'🌸 <span>Nossa Rede</span>');bind(social,'externalMenuBound',openSocial)
  let profile=$('friendProfileMenuBtn');if(!profile){profile=document.createElement('button');profile.id='friendProfileMenuBtn';profile.type='button';profile.className='family-primary-tab';nav.appendChild(profile)}setHtml(profile,'☁️ <span>Perfil</span>');bind(profile,'externalMenuBound',openProfile)
  let sticker=$('friendStickerMenuBtn');if(!sticker){sticker=document.createElement('button');sticker.id='friendStickerMenuBtn';sticker.type='button';sticker.className='family-primary-tab';nav.appendChild(sticker)}setHtml(sticker,'✨ <span>Stickers</span>');bind(sticker,'externalMenuBound',openSticker)
  let games=$('friendGamesMenuBtn');if(!games){games=document.createElement('button');games.id='friendGamesMenuBtn';games.type='button';games.className='family-primary-tab';nav.appendChild(games)}setHtml(games,'🎮 <span>Joguinhos</span>');bind(games,'externalMenuBound',openGames)
  let studies=$('friendStudiesMenuBtn')
  if(isPaloma()){
    if(!studies){studies=document.createElement('button');studies.id='friendStudiesMenuBtn';studies.type='button';studies.className='family-primary-tab';nav.appendChild(studies)}
    setHtml(studies,'🩺 <span>Estudos</span>');studies.classList.remove('hidden');studies.style.removeProperty('display');bind(studies,'externalMenuBound',openStudies)
  }else if(studies){studies.classList.add('hidden');studies.style.setProperty('display','none','important')}
  let settings=$('friendSettingsBtn');if(!settings){settings=document.createElement('button');settings.id='friendSettingsBtn';settings.type='button';settings.className='family-primary-tab icon-only friend-settings-menu';nav.appendChild(settings)}
  settings.classList.add('family-primary-tab','icon-only','friend-settings-menu');if(settings.textContent!=='⚙️')settings.textContent='⚙️';settings.title='Configurações';settings.setAttribute('aria-label','Configurações')
  stableOrder(nav,[chat,social,profile,sticker,games,isPaloma()?studies:null,settings])
  document.querySelectorAll('.friend-profile .pss-profile-edit').forEach(b=>{if(b.style.display!=='none')b.style.setProperty('display','none','important')})
  return true
}
window.__ISA_ENSURE_EXTERNAL_MENU__=ensure
ensure();document.addEventListener('isa:friend-portal-entered',ensure);document.addEventListener('isa:friend-access-valid',ensure)
let tries=0;const timer=setInterval(()=>{ensure();if(++tries>40)clearInterval(timer)},300)
