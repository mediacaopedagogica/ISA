const $=id=>document.getElementById(id)
let socialLoading=null,profileLoading=null

function toast(text){
  if(typeof window.__ISA_FRIEND_TOAST__==='function')return window.__ISA_FRIEND_TOAST__(text)
  const t=$('friendToast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._externalMenu);t._externalMenu=setTimeout(()=>t.classList.add('hidden'),2600)
}
function addStyle(){
  if($('externalMenuStyle'))return
  const s=document.createElement('style');s.id='externalMenuStyle';s.textContent=`
.family-primary-nav{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px!important;margin:8px 0 12px!important}.family-primary-tab{min-width:0!important;min-height:48px!important;padding:7px 5px!important;border-radius:14px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:5px!important;font-weight:900!important}.family-primary-tab span{font-size:10px!important;white-space:nowrap!important}.family-primary-tab.icon-only{font-size:20px!important}.family-primary-tab.icon-only span{display:none!important}.friend-profile .pss-profile-edit{display:none!important}
@media(max-width:780px){.family-primary-nav{position:sticky;top:0;z-index:15;grid-template-columns:repeat(5,minmax(0,1fr));padding:5px!important;margin:4px 0 8px!important;border-radius:16px;background:rgba(255,250,255,.9);backdrop-filter:blur(12px)}.family-primary-tab{min-height:44px!important;padding:4px 2px!important}.family-primary-tab span{font-size:8px!important}.family-primary-tab.icon-only{font-size:18px!important}}
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
function goChats(){
  window.__ISA_CLOSE_FAMILY_SOCIAL__?.()
  if($('friendChat')?.classList.contains('thread-open'))$('friendBackBtn')?.click()
  $('friendChatsTab')?.classList.add('active');$('friendSocialBtn')?.classList.remove('active')
}
async function openSocial(){if(await ensureSocialLoaded())window.__ISA_OPEN_FAMILY_SOCIAL__?.()}
async function openProfile(){if(await ensureProfileLoaded()){if(typeof window.__ISA_OPEN_PROFILE_STATUS__==='function')window.__ISA_OPEN_PROFILE_STATUS__();else document.querySelector('.pss-profile-edit')?.click()}}
async function openSticker(){if(await ensureProfileLoaded()){if(typeof window.__ISA_OPEN_STICKER_CREATOR__==='function')window.__ISA_OPEN_STICKER_CREATOR__();else $('pssStickerBtn')?.click()}}
function setHtml(el,html){if(el&&el.innerHTML!==html)el.innerHTML=html}
function ensure(){
  addStyle()
  const nav=document.querySelector('.family-primary-nav');if(!nav)return false
  const chat=$('friendChatsTab');if(chat){chat.disabled=false;chat.removeAttribute('aria-disabled');chat.classList.remove('is-locked');setHtml(chat,'💬 <span>Chat</span>');if(chat.dataset.externalMenuBound!=='1'){chat.dataset.externalMenuBound='1';chat.addEventListener('click',e=>{e.preventDefault();goChats()})}}
  let social=$('friendSocialBtn');if(!social){social=document.createElement('button');social.id='friendSocialBtn';social.type='button';social.className='family-primary-tab';nav.appendChild(social)}
  if(!social.classList.contains('family-primary-tab'))social.classList.add('family-primary-tab');social.classList.remove('is-locked');social.disabled=false;social.removeAttribute('aria-disabled');setHtml(social,'🌸 <span>Nossa Rede</span>');if(social.dataset.externalMenuBound!=='1'){social.dataset.externalMenuBound='1';social.addEventListener('click',e=>{e.preventDefault();openSocial()})}
  let profile=$('friendProfileMenuBtn');if(!profile){profile=document.createElement('button');profile.id='friendProfileMenuBtn';profile.type='button';profile.className='family-primary-tab';nav.appendChild(profile)}setHtml(profile,'☁️ <span>Perfil</span>');if(profile.dataset.externalMenuBound!=='1'){profile.dataset.externalMenuBound='1';profile.addEventListener('click',e=>{e.preventDefault();openProfile()})}
  let sticker=$('friendStickerMenuBtn');if(!sticker){sticker=document.createElement('button');sticker.id='friendStickerMenuBtn';sticker.type='button';sticker.className='family-primary-tab';nav.appendChild(sticker)}setHtml(sticker,'✨ <span>Stickers</span>');if(sticker.dataset.externalMenuBound!=='1'){sticker.dataset.externalMenuBound='1';sticker.addEventListener('click',e=>{e.preventDefault();openSticker()})}
  let settings=$('friendSettingsBtn');if(!settings){settings=document.createElement('button');settings.id='friendSettingsBtn';settings.type='button';settings.className='family-primary-tab icon-only friend-settings-menu';nav.appendChild(settings)}
  settings.classList.add('family-primary-tab','icon-only','friend-settings-menu');if(settings.textContent!=='⚙️')settings.textContent='⚙️';settings.title='Configurações';settings.setAttribute('aria-label','Configurações');if(settings.parentNode!==nav)nav.appendChild(settings)
  document.querySelectorAll('.friend-profile .pss-profile-edit').forEach(b=>{if(b.style.display!=='none')b.style.setProperty('display','none','important')})
  return true
}
window.__ISA_ENSURE_EXTERNAL_MENU__=ensure
ensure();document.addEventListener('isa:friend-portal-entered',ensure);document.addEventListener('isa:friend-access-valid',ensure)
let tries=0;const timer=setInterval(()=>{ensure();if(++tries>30)clearInterval(timer)},300)
