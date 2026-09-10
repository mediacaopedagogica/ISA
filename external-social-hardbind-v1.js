// Nossa Rede: binding final e direto para TODOS os acessos familiares externos.
// Intercepta o toque/clique no documento antes de outros controladores e abre o núcleo social.
const $=id=>document.getElementById(id)
const wait=ms=>new Promise(r=>setTimeout(r,ms))
let opening=false,lastTouch=0

function toast(text){
  if(typeof window.__ISA_FRIEND_TOAST__==='function')return window.__ISA_FRIEND_TOAST__(text)
  const t=$('friendToast');if(!t)return
  t.textContent=text;t.classList.remove('hidden');clearTimeout(t._hardSocial);t._hardSocial=setTimeout(()=>t.classList.add('hidden'),2800)
}
function accessReady(){return window.__ISA_FRIEND_ACCESS_VALID__===true||window.__ISA_FRIEND_BOOTSTRAP_STATE__==='ready'}
async function safe(path){try{return await import(path)}catch(e){console.warn('Nossa Rede hardbind:',path,e);return null}}

async function core(){
  if(typeof window.__ISA_OPEN_FAMILY_SOCIAL__!=='function')await safe('./family-social.js?v=21-hardbind')
  for(let i=0;i<60&&typeof window.__ISA_OPEN_FAMILY_SOCIAL__!=='function';i++)await wait(50)
  if(typeof window.__ISA_OPEN_FAMILY_SOCIAL__!=='function')throw new Error('A Nossa Rede não terminou de carregar.')
  return window.__ISA_OPEN_FAMILY_SOCIAL__
}
async function enhance(){
  await Promise.allSettled([
    safe('./nossa-rede-v4.js?v=9-hardbind'),
    safe('./nossa-rede-policy-v5-loader.js?v=12-hardbind'),
    safe('./nuvem-ui-ideas-v10.js?v=7-hardbind'),
    safe('./nuvem-compose-compact-v1.js?v=7-hardbind'),
    safe('./nuvem-carousel-v1.js?v=4-hardbind'),
    safe('./nossa-rede-comment-menu-v1.js?v=5-hardbind'),
    safe('./nossa-rede-header-cleanup-v1.js?v=2-hardbind')
  ])
  window.__ISA_ENHANCE_NOSSA_REDE__?.()
  window.__ISA_NOSSA_REDE_V5__?.patch?.()
  window.__ISA_NUVEM_UI_IDEAS__?.scan?.()
  window.__ISA_NUVEM_COMPACT_COMPOSER__?.scan?.()
  window.__ISA_NUVEM_CAROUSEL__?.scan?.()
  window.__ISA_COMMENT_MEDIA_MENU__?.scan?.()
  window.__ISA_NOSSA_REDE_HEADER_CLEANUP__?.()
}
async function openNow(){
  if(opening)return false
  if(!accessReady()){toast('Seu acesso ainda está sendo validado. Tente novamente em um instante.');return false}
  opening=true
  const b=$('friendSocialBtn');b?.classList.add('is-loading')
  try{
    const open=await core();await open();setTimeout(enhance,40);return true
  }catch(e){console.warn(e);toast(e?.message||'Não foi possível abrir a Nossa Rede.');return false}
  finally{opening=false;b?.classList.remove('is-loading')}
}
function targetButton(e){return e.target?.closest?.('#friendSocialBtn')}
function onPointer(e){
  const b=targetButton(e);if(!b||e.pointerType!=='touch')return
  lastTouch=Date.now();e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openNow()
}
function onClick(e){
  const b=targetButton(e);if(!b)return
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();if(Date.now()-lastTouch<650)return;openNow()
}
function ensureButton(){
  const b=$('friendSocialBtn');if(!b)return false
  b.disabled=false;b.removeAttribute('disabled');b.removeAttribute('aria-disabled');b.classList.remove('hidden','is-locked');b.style.setProperty('pointer-events','auto','important');b.style.removeProperty('display');b.style.touchAction='manipulation';return true
}

document.addEventListener('pointerup',onPointer,true)
document.addEventListener('click',onClick,true)
document.addEventListener('isa:friend-access-valid',()=>{ensureButton();setTimeout(()=>core().catch(()=>{}),80)})
document.addEventListener('isa:friend-portal-entered',()=>{ensureButton();setTimeout(ensureButton,120)})
const obs=new MutationObserver(()=>ensureButton());obs.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','disabled','aria-disabled']})
ensureButton();setTimeout(ensureButton,400);setTimeout(ensureButton,1200)
window.__ISA_OPEN_FAMILY_SOCIAL_HARD__=openNow
