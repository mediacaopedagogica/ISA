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
  if(!b){
    b=document.createElement('button');b.id=id;b.type='button';b.className='nav-btn';b.dataset.profileMenuAction='1';b.innerHTML=`${icon} <span>${label}</span>`;nav.appendChild(b)
  }
  b.classList.add('nav-btn');b.classList.remove('hidden');b.style.removeProperty('display');b.title=label;b.setAttribute('aria-label',label)
  if(b.dataset.profileActionBound!=='1'){
    b.dataset.profileActionBound='1'
    b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();action()})
  }
  return b
}
function openGames(){
  if(typeof window.__ISA_PROFILE_ACTIONS__?.openGames==='function')return window.__ISA_PROFILE_ACTIONS__.openGames()
  if(typeof window.__CANTINHO_OPEN_GAMES__==='function')return window.__CANTINHO_OPEN_GAMES__()
}
function stableOrder(nav,items){
  const order=items.filter(Boolean)
  const wanted=new Set(order)
  const current=[...nav.children].filter(el=>wanted.has(el))
  if(current.length===order.length&&current.every((el,i)=>el===order[i]))return
  order.forEach(el=>{if(el.parentNode===nav)nav.appendChild(el)})
}
function ensure(){
  const nav=document.querySelector('.nav-tabs'),p=profile();if(!nav||!p||p==='familia')return false
  const chats=byTab('chats'),calendar=byTab('calendar'),study=$('studyNav')||byTab('study'),diary=$('diaryNav')||byTab('diary'),supervision=$('supervisionNav')||byTab('supervision'),parents=$('parentsNav')||byTab('parents')
  const settings=dynamic('settingsMenuBtn','[data-settings-menu="1"]'),social=dynamic('socialNav'),test=dynamic('testGameNav'),studio=dynamic('alanStudioLauncher')||dynamic('alanStudioEntry')
  const games=actionButton(nav,'profileGamesNav','🎮','Joguinhos',openGames)
  const profileStatus=$('profileStatusNav'),profileSticker=$('profileStickerNav')
  visible(profileStatus,false);visible(profileSticker,false)

  const isKeise=p==='keise'||p.startsWith('keise '),isAlan=p==='alan',isIsa=p==='isa'
  visible(chats,true)
  visible(calendar,isKeise||isAlan)
  visible(study,isIsa)
  visible(diary,isIsa)
  visible(supervision,isKeise)
  visible(parents,isKeise)
  visible(test,isKeise)
  visible(studio,isAlan)
  visible(games,true)
  if(settings)visible(settings,true)
  if(social)visible(social,true)

  let order=[]
  if(isKeise)order=[chats,calendar,settings,social,supervision,parents,games,test]
  else if(isAlan)order=[chats,calendar,studio,settings,social,games]
  else if(isIsa)order=[chats,settings,diary,study,social,games]
  else order=[chats,settings,social,games]
  stableOrder(nav,order)
  nav.dataset.profileMenu=isKeise?'keise':isAlan?'alan':isIsa?'isa':'basic'
  return true
}
window.__ISA_ENSURE_PROFILE_MENU__=ensure
ensure()
document.addEventListener('DOMContentLoaded',ensure,{once:true})
const host=$('mainView')||document.body
new MutationObserver(()=>ensure()).observe(host,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})
let tries=0;const timer=setInterval(()=>{ensure();if(++tries>80)clearInterval(timer)},300)
