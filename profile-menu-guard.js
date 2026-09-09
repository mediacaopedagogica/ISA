const $=id=>document.getElementById(id)
const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')

function profile(){
  const requested=norm(new URLSearchParams(location.search).get('perfil'))
  const current=norm($('myName')?.textContent)
  return current&&current!=='familia'?current:requested
}
function visible(el,on){
  if(!el)return
  el.classList.toggle('hidden',!on)
  if(on){el.style.removeProperty('display');el.style.removeProperty('visibility');el.style.removeProperty('opacity')}
  else el.style.setProperty('display','none','important')
}
function byTab(name){return document.querySelector(`.nav-tabs .nav-btn[data-tab="${name}"]`)}
function dynamic(id,alt=''){return $(id)||(alt?document.querySelector(alt):null)}
function actionButton(nav,id,icon,label,action){
  let b=$(id)
  if(!b){b=document.createElement('button');b.id=id;b.type='button';b.className='nav-btn';b.dataset.profileMenuAction='1';b.innerHTML=`${icon} <span>${label}</span>`;nav.appendChild(b)}
  b.classList.add('nav-btn');b.classList.remove('hidden');b.style.removeProperty('display');b.title=label;b.setAttribute('aria-label',label)
  if(b.dataset.profileActionBound!=='1'){
    b.dataset.profileActionBound='1'
    b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();action()})
  }
  return b
}
function openProfile(){
  if(typeof window.__ISA_PROFILE_ACTIONS__?.openStatus==='function')return window.__ISA_PROFILE_ACTIONS__.openStatus()
  if(typeof window.__ISA_OPEN_PROFILE_STATUS__==='function')return window.__ISA_OPEN_PROFILE_STATUS__()
  document.querySelector('.pss-profile-edit')?.click()
}
function openSticker(){
  if(typeof window.__ISA_PROFILE_ACTIONS__?.openSticker==='function')return window.__ISA_PROFILE_ACTIONS__.openSticker()
  if(typeof window.__ISA_OPEN_STICKER_CREATOR__==='function')return window.__ISA_OPEN_STICKER_CREATOR__()
  $('pssStickerBtn')?.click()
}
function ensure(){
  const nav=document.querySelector('.nav-tabs'),p=profile();if(!nav||!p||p==='familia')return false
  const chats=byTab('chats'),calendar=byTab('calendar'),study=$('studyNav')||byTab('study'),diary=$('diaryNav')||byTab('diary'),supervision=$('supervisionNav')||byTab('supervision'),parents=$('parentsNav')||byTab('parents')
  const settings=dynamic('settingsMenuBtn','[data-settings-menu="1"]'),social=dynamic('socialNav'),test=dynamic('testGameNav'),studio=dynamic('alanStudioLauncher')||dynamic('alanStudioEntry')
  const profileStatus=actionButton(nav,'profileStatusNav','☁️','Perfil',openProfile)
  const profileSticker=actionButton(nav,'profileStickerNav','✨','Stickers',openSticker)
  const profileGames=$('profileGamesNav');visible(profileGames,false)

  const isKeise=p==='keise'||p.startsWith('keise '),isAlan=p==='alan',isIsa=p==='isa'
  visible(chats,true)
  visible(calendar,isKeise||isAlan)
  visible(study,isIsa)
  visible(diary,isIsa)
  visible(supervision,isKeise)
  visible(parents,isKeise)
  visible(test,isKeise)
  visible(studio,isAlan)
  visible(profileStatus,true);visible(profileSticker,true)
  if(settings)visible(settings,true)
  if(social)visible(social,true)

  let order=[]
  if(isKeise)order=[chats,calendar,settings,profileStatus,profileSticker,social,supervision,parents,test]
  else if(isAlan)order=[chats,calendar,studio,settings,profileStatus,profileSticker,social]
  else if(isIsa)order=[chats,settings,diary,study,profileStatus,profileSticker,social]
  else order=[chats,settings,profileStatus,profileSticker,social]
  order.filter(Boolean).forEach(el=>{if(el.parentNode===nav)nav.appendChild(el)})
  nav.dataset.profileMenu=isKeise?'keise':isAlan?'alan':isIsa?'isa':'basic'
  return true
}
window.__ISA_ENSURE_PROFILE_MENU__=ensure
ensure()
document.addEventListener('DOMContentLoaded',ensure,{once:true})
const host=$('mainView')||document.body
new MutationObserver(()=>ensure()).observe(host,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})
let tries=0;const timer=setInterval(()=>{ensure();if(++tries>120)clearInterval(timer)},250)
