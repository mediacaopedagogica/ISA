const $=id=>document.getElementById(id)
const normalize=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
const supported=new Set(['isa','keise','alan','paloma','elion','vania','evalda','davi'])
const external=!!$('friendApp')

function currentName(){
  const main=normalize($('myName')?.textContent)
  if(main&&main!=='familia')return main
  const friend=normalize($('friendName')?.textContent)
  if(friend&&friend!=='perfil')return friend
  return''
}
function toast(text){
  const el=$('friendToast')||$('toast')
  if(!el)return
  el.textContent=text
  el.classList.remove('hidden')
  clearTimeout(el._profileActionsTimer)
  el._profileActionsTimer=setTimeout(()=>el.classList.add('hidden'),2600)
}
function ensureStyle(){
  if($('profileActionsStyle'))return
  const s=document.createElement('style');s.id='profileActionsStyle';s.textContent=`
  .profile-feature-actions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:9px 0 4px}.profile-feature-action{border:1px solid rgba(169,136,192,.2);border-radius:13px;background:linear-gradient(145deg,#fff,#f4edff);color:#654f75;min-height:42px;padding:7px 8px;font-weight:900;font-size:10px;box-shadow:0 5px 14px rgba(92,65,111,.08);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px}.profile-feature-action:active{transform:translateY(1px)}
  .nav-btn[data-profile-action]{display:flex!important;visibility:visible!important;opacity:1!important}
  @media(max-width:780px){.profile-feature-actions{position:sticky;top:0;z-index:8;margin:6px 0;padding:5px;border-radius:14px;background:rgba(255,250,255,.88);backdrop-filter:blur(10px);grid-template-columns:repeat(4,minmax(0,1fr))}.profile-feature-action{min-height:38px;padding:5px 3px;font-size:9px;border-radius:11px}.profile-feature-action span{display:none}.nav-tabs{overscroll-behavior-x:contain}.nav-btn[data-profile-action] span{display:inline}}
  `;document.head.appendChild(s)
}
async function retry(action,label){
  for(let i=0;i<24;i++){
    if(action())return
    await new Promise(r=>setTimeout(r,100))
  }
  toast(`${label} ainda está carregando. Tente novamente em um instante.`)
}
function openSettings(){
  if(external)return retry(()=>{const b=$('friendSettingsBtn');if(!b)return false;b.click();return true},'Configurações')
  return retry(()=>{if(typeof window.__ISA_OPEN_GENERAL_SETTINGS__==='function'){window.__ISA_OPEN_GENERAL_SETTINGS__();return true}const b=$('settingsMenuBtn');if(!b)return false;b.click();return true},'Configurações')
}
function openStatus(){
  return retry(()=>{if(typeof window.__ISA_OPEN_PROFILE_STATUS__==='function'){window.__ISA_OPEN_PROFILE_STATUS__();return true}const b=document.querySelector('.pss-profile-edit')||$('pssProfileCloud');if(!b)return false;b.click();return true},'Status')
}
function openSticker(){
  return retry(()=>{if(typeof window.__ISA_OPEN_STICKER_CREATOR__==='function'){window.__ISA_OPEN_STICKER_CREATOR__();return true}const b=$('pssStickerBtn');if(!b)return false;b.click();return true},'Criador de Stickers')
}
function openGames(){
  return retry(()=>{if(typeof window.__CANTINHO_OPEN_GAMES__!=='function')return false;window.__CANTINHO_OPEN_GAMES__();return true},'Joguinhos')
}
function button(label,icon,action){const b=document.createElement('button');b.type='button';b.className='profile-feature-action';b.innerHTML=`${icon} <span>${label}</span>`;b.setAttribute('aria-label',label);b.title=label;b.onclick=action;return b}
function ensureExternal(){
  if(!external||!supported.has(currentName()))return false
  const profile=document.querySelector('.friend-profile');if(!profile)return false
  let row=$('profileFeatureActions')
  if(!row){row=document.createElement('div');row.id='profileFeatureActions';row.className='profile-feature-actions';row.append(button('Fundo','🎨',openSettings),button('Status','☁️',openStatus),button('Stickers','✨',openSticker),button('Jogos','🎮',openGames));profile.insertAdjacentElement('afterend',row)}
  return true
}
function addNavAction(nav,id,icon,label,action,after){
  let b=$(id);if(!b){b=document.createElement('button');b.id=id;b.type='button';b.className='nav-btn';b.dataset.profileAction='1';b.innerHTML=`${icon} <span>${label}</span>`;b.onclick=action;if(after?.parentNode===nav)after.insertAdjacentElement('afterend',b);else nav.appendChild(b)}
  b.classList.remove('hidden');b.style.removeProperty('display');return b
}
function ensureInternal(){
  if(external||!supported.has(currentName()))return false
  const nav=document.querySelector('.nav-tabs');if(!nav)return false
  const settings=$('settingsMenuBtn')||nav.querySelector('[data-settings-menu="1"]')||nav.querySelector('[data-tab="calendar"]')
  const status=addNavAction(nav,'profileStatusNav','☁️','Status',openStatus,settings)
  const sticker=addNavAction(nav,'profileStickerNav','✨','Stickers',openSticker,status)
  addNavAction(nav,'profileGamesNav','🎮','Jogos',openGames,sticker)
  return true
}
function ensure(){ensureStyle();return external?ensureExternal():ensureInternal()}
window.__ISA_ENSURE_PROFILE_ACTIONS__=ensure
const observer=new MutationObserver(ensure);observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class']})
let tries=0;const timer=setInterval(()=>{ensure();if(++tries>120)clearInterval(timer)},250)
ensure()
