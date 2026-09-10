// Nossa Rede — ponte única, estável e comum a TODOS os acessos familiares externos.
const $=id=>document.getElementById(id)
let opening=false,enhancing=false,lastTouchOpen=0
const wait=ms=>new Promise(r=>setTimeout(r,ms))

function toast(text){
  if(typeof window.__ISA_FRIEND_TOAST__==='function')return window.__ISA_FRIEND_TOAST__(text)
  const t=$('friendToast');if(!t)return
  t.textContent=text;t.classList.remove('hidden');clearTimeout(t._socialEntry);t._socialEntry=setTimeout(()=>t.classList.add('hidden'),2800)
}
async function safe(path){try{return await import(path)}catch(e){console.warn('Nossa Rede:',path,e);return null}}
const accessReady=()=>window.__ISA_FRIEND_ACCESS_VALID__===true||window.__ISA_FRIEND_BOOTSTRAP_STATE__==='ready'

function ensureTitle(){
  const comp=document.querySelector('#familySocialOverlay .social-composer');if(!comp)return false
  let t=comp.querySelector(':scope > .nuvem-share-title')
  if(!t){t=document.createElement('div');t.className='nuvem-share-title';const ta=comp.querySelector('textarea');comp.insertBefore(t,ta||comp.firstChild)}
  t.textContent='Compartilhe bons momentos e recordações 💕'
  return true
}

async function ensureCore(){
  if(typeof window.__ISA_OPEN_FAMILY_SOCIAL__!=='function')await safe('./family-social.js?v=20-all-family-social')
  for(let i=0;i<55&&typeof window.__ISA_OPEN_FAMILY_SOCIAL__!=='function';i++)await wait(55)
  if(typeof window.__ISA_OPEN_FAMILY_SOCIAL__!=='function')throw new Error('A Nossa Rede não terminou de carregar. Tente novamente.')
  bind()
  return window.__ISA_OPEN_FAMILY_SOCIAL__
}

async function enhance(){
  if(enhancing)return
  enhancing=true
  try{
    await Promise.allSettled([
      safe('./nossa-rede-v4.js?v=8-all-family-social'),
      safe('./nossa-rede-policy-v5-loader.js?v=11-pastel-header'),
      safe('./nuvem-ui-ideas-v10.js?v=6-all-family-social'),
      safe('./nuvem-compose-compact-v1.js?v=6-pink-simple'),
      safe('./nuvem-carousel-v1.js?v=3-all-family-social'),
      safe('./nossa-rede-comment-menu-v1.js?v=4-all-family-social'),
      safe('./nossa-rede-header-cleanup-v1.js?v=1-pastel-decor'),
      safe('./social-profile-pages-v1.js?v=6-all-family-social'),
      safe('./social-profile-directory-v1.js?v=5-all-family-social'),
      safe('./social-reaction-names-v1.js?v=5-all-family-social'),
      safe('./social-profile-chat-bridge.js?v=5-all-family-social')
    ])
    window.__ISA_ENHANCE_NOSSA_REDE__?.()
    window.__ISA_NOSSA_REDE_V5__?.patch?.()
    window.__ISA_NUVEM_UI_IDEAS__?.scan?.()
    window.__ISA_NUVEM_COMPACT_COMPOSER__?.scan?.()
    window.__ISA_NUVEM_CAROUSEL__?.scan?.()
    window.__ISA_COMMENT_MEDIA_MENU__?.scan?.()
    window.__ISA_NOSSA_REDE_HEADER_CLEANUP__?.()
    window.__ISA_SOCIAL_PROFILE_PAGES__?.decorate?.()
    window.__ISA_SOCIAL_PROFILE_DIRECTORY__?.patch?.()
    window.__ISA_ENHANCE_REACTION_NAMES__?.()
    window.__ISA_SOCIAL_PROFILE_CHAT_SYNC__?.()
    ensureTitle()
  }finally{enhancing=false}
}

async function openSocial(){
  if(opening)return false
  if(!accessReady()){toast('Seu acesso ainda está sendo validado. Tente novamente em um instante.');return false}
  opening=true
  const btn=$('friendSocialBtn');btn?.classList.add('is-loading')
  try{
    const open=await ensureCore()
    await open()
    ensureTitle()
    setTimeout(()=>{ensureTitle();enhance()},80)
    setTimeout(()=>{ensureTitle();window.__ISA_NOSSA_REDE_HEADER_CLEANUP__?.()},650)
    return true
  }catch(e){
    console.warn('Nossa Rede externa:',e);toast(e?.message||'Não foi possível abrir a Nossa Rede agora.');return false
  }finally{opening=false;btn?.classList.remove('is-loading')}
}

function clickHandler(e){
  if(Date.now()-lastTouchOpen<650){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();return}
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openSocial()
}
function touchHandler(e){
  if(e.pointerType!=='touch')return
  lastTouchOpen=Date.now();e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openSocial()
}

function bind(){
  const b=$('friendSocialBtn');if(!b)return false
  b.disabled=false;b.removeAttribute('disabled');b.removeAttribute('aria-disabled');b.classList.remove('is-locked','hidden')
  b.style.setProperty('pointer-events','auto','important');b.style.removeProperty('display');b.style.touchAction='manipulation'
  if(b.dataset.nuvemSocialBridge!=='2'){
    b.dataset.nuvemSocialBridge='2'
    b.addEventListener('click',clickHandler,true)
    b.addEventListener('pointerup',touchHandler,true)
  }
  return true
}

window.__ISA_OPEN_EXTERNAL_SOCIAL_DIRECT__=openSocial
window.__ISA_BIND_EXTERNAL_SOCIAL_DIRECT__=bind

bind()
document.addEventListener('isa:friend-access-valid',()=>{bind();setTimeout(()=>ensureCore().catch(()=>{}),60)})
document.addEventListener('isa:friend-portal-entered',()=>{bind();setTimeout(bind,180)})

const observer=new MutationObserver(()=>{clearTimeout(observer._t);observer._t=setTimeout(()=>{bind();if(document.getElementById('familySocialOverlay')){ensureTitle();window.__ISA_NOSSA_REDE_HEADER_CLEANUP__?.()}},55)})
observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','disabled','aria-disabled']})
let tries=0;const timer=setInterval(()=>{bind();if(++tries>120)clearInterval(timer)},300)
