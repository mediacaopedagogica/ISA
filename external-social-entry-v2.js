// Nossa Rede externa — controlador único.
// Carrega somente depois de o portal familiar estar aberto e usa uma única instância do módulo social.
const $=id=>document.getElementById(id)
let opening=false,corePromise=null
const wait=ms=>new Promise(r=>setTimeout(r,ms))

function toast(text){
  if(typeof window.__ISA_FRIEND_TOAST__==='function')return window.__ISA_FRIEND_TOAST__(text)
  const t=$('friendToast');if(!t)return
  t.textContent=text;t.classList.remove('hidden');clearTimeout(t._socialV2);t._socialV2=setTimeout(()=>t.classList.add('hidden'),3000)
}

async function ensureCore(){
  if(typeof window.__ISA_OPEN_FAMILY_SOCIAL__==='function')return window.__ISA_OPEN_FAMILY_SOCIAL__
  if(!corePromise)corePromise=import('./family-social.js?v=70-safe-social').catch(error=>{corePromise=null;throw error})
  await corePromise
  for(let i=0;i<30&&typeof window.__ISA_OPEN_FAMILY_SOCIAL__!=='function';i++)await wait(50)
  if(typeof window.__ISA_OPEN_FAMILY_SOCIAL__!=='function')throw new Error('A Nossa Rede não terminou de carregar.')
  return window.__ISA_OPEN_FAMILY_SOCIAL__
}

async function enhance(){
  const modules=[
    './nossa-rede-v4.js?v=10-safe-social',
    './nossa-rede-policy-v5-loader.js?v=13-safe-social',
    './nuvem-ui-ideas-v10.js?v=8-safe-social',
    './nuvem-compose-compact-v1.js?v=8-safe-social',
    './nuvem-carousel-v1.js?v=5-safe-social',
    './nossa-rede-comment-menu-v1.js?v=6-safe-social',
    './nossa-rede-header-cleanup-v1.js?v=3-safe-social'
  ]
  await Promise.allSettled(modules.map(src=>import(src)))
  window.__ISA_ENHANCE_NOSSA_REDE__?.()
  window.__ISA_NOSSA_REDE_V5__?.patch?.()
  window.__ISA_NUVEM_UI_IDEAS__?.scan?.()
  window.__ISA_NUVEM_COMPACT_COMPOSER__?.scan?.()
  window.__ISA_NUVEM_CAROUSEL__?.scan?.()
  window.__ISA_COMMENT_MEDIA_MENU__?.scan?.()
  window.__ISA_NOSSA_REDE_HEADER_CLEANUP__?.()
}

async function openSocial(){
  if(opening)return false
  if(window.__ISA_FRIEND_ACCESS_VALID__!==true){toast('Seu acesso ainda não terminou de validar.');return false}
  opening=true
  const b=$('friendSocialBtn');b?.classList.add('is-loading')
  try{
    const open=await ensureCore()
    await open()
    setTimeout(()=>enhance().catch(()=>{}),40)
    return true
  }catch(error){
    console.warn('[Nossa Rede externa]',error)
    toast(error?.message||'Não foi possível abrir a Nossa Rede.')
    return false
  }finally{
    opening=false;b?.classList.remove('is-loading')
  }
}

function bind(){
  const b=$('friendSocialBtn');if(!b)return false
  b.disabled=false;b.removeAttribute('disabled');b.removeAttribute('aria-disabled');b.classList.remove('hidden','is-locked')
  b.style.setProperty('pointer-events','auto','important');b.style.touchAction='manipulation'
  if(b.dataset.singleSocialBound!=='1'){
    b.dataset.singleSocialBound='1'
    b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openSocial()})
  }
  return true
}

window.__ISA_OPEN_EXTERNAL_SOCIAL_DIRECT__=openSocial
window.__ISA_BIND_EXTERNAL_SOCIAL_DIRECT__=bind
bind()
document.addEventListener('isa:friend-portal-entered',bind)
