// Nossa Rede — ponte única e estável para TODOS os acessos familiares externos.
const $=id=>document.getElementById(id)
let opening=false,enhancementPromise=null

function toast(text){
  if(typeof window.__ISA_FRIEND_TOAST__==='function')return window.__ISA_FRIEND_TOAST__(text)
  const t=$('friendToast');if(!t)return
  t.textContent=text;t.classList.remove('hidden')
  clearTimeout(t._socialEntry);t._socialEntry=setTimeout(()=>t.classList.add('hidden'),2800)
}
async function safe(path){try{return await import(path)}catch(e){console.warn('Nossa Rede:',path,e);return null}}
const accessReady=()=>window.__ISA_FRIEND_ACCESS_VALID__===true||window.__ISA_FRIEND_BOOTSTRAP_STATE__==='ready'

function ensureTitleStyle(){
  if($('nuvemExternalShareTitleCss'))return
  const s=document.createElement('style');s.id='nuvemExternalShareTitleCss'
  s.textContent=`
    #familySocialOverlay .social-composer::before{content:none!important;display:none!important}
    #familySocialOverlay .nuvem-share-title{
      display:block!important;width:fit-content!important;max-width:330px!important;
      margin:0 0 12px 2px!important;padding:0!important;
      font-family:"Segoe Print","Bradley Hand","Comic Sans MS",cursive!important;
      font-size:22px!important;line-height:1.12!important;font-style:italic!important;font-weight:800!important;
      letter-spacing:.1px!important;color:#ef58a8!important;
      text-shadow:0 1px 0 rgba(255,255,255,.98),0 4px 10px rgba(239,88,168,.15)!important;
      transform:rotate(-1deg)!important;text-align:left!important
    }
    @media(max-width:760px){#familySocialOverlay .nuvem-share-title{font-size:18px!important;max-width:250px!important}}
  `
  document.head.appendChild(s)
}
function ensureShareTitle(){
  const comp=document.querySelector('#familySocialOverlay .social-composer');if(!comp)return false
  ensureTitleStyle()
  let title=comp.querySelector(':scope > .nuvem-share-title')
  if(!title){
    title=document.createElement('div');title.className='nuvem-share-title'
    const ta=comp.querySelector('textarea');comp.insertBefore(title,ta||comp.firstChild)
  }
  title.textContent='Compartilhe bons momentos e recordações 💕'
  return true
}

async function ensureCore(){
  if(typeof window.__ISA_OPEN_FAMILY_SOCIAL__!=='function')await safe('./family-social.js?v=19-all-family-social')
  for(let i=0;i<45&&typeof window.__ISA_OPEN_FAMILY_SOCIAL__!=='function';i++)await new Promise(r=>setTimeout(r,60))
  if(typeof window.__ISA_OPEN_FAMILY_SOCIAL__!=='function')throw new Error('A Nossa Rede ainda não terminou de carregar.')
  return window.__ISA_OPEN_FAMILY_SOCIAL__
}

async function enhance(){
  if(!enhancementPromise){
    enhancementPromise=(async()=>{
      await Promise.allSettled([
        safe('./nossa-rede-v4.js?v=7-all-family-social'),
        safe('./nossa-rede-policy-v5-loader.js?v=9-all-family-social'),
        safe('./nuvem-ui-ideas-v10.js?v=5-all-family-social'),
        safe('./nuvem-compose-compact-v1.js?v=4-real-title'),
        safe('./nuvem-carousel-v1.js?v=2-all-family-social'),
        safe('./nossa-rede-comment-menu-v1.js?v=3-all-family-social'),
        safe('./social-profile-pages-v1.js?v=5-all-family-social'),
        safe('./social-profile-directory-v1.js?v=4-all-family-social'),
        safe('./social-reaction-names-v1.js?v=4-all-family-social'),
        safe('./social-profile-chat-bridge.js?v=4-all-family-social')
      ])
      window.__ISA_ENHANCE_NOSSA_REDE__?.()
      window.__ISA_NOSSA_REDE_V5__?.patch?.()
      window.__ISA_NUVEM_COMPACT_COMPOSER__?.scan?.()
      window.__ISA_NUVEM_CAROUSEL__?.scan?.()
      window.__ISA_COMMENT_MEDIA_MENU__?.scan?.()
      window.__ISA_SOCIAL_PROFILE_PAGES__?.decorate?.()
      window.__ISA_SOCIAL_PROFILE_DIRECTORY__?.patch?.()
      window.__ISA_ENHANCE_REACTION_NAMES__?.()
      window.__ISA_SOCIAL_PROFILE_CHAT_SYNC__?.()
    })()
  }
  await enhancementPromise
  ensureShareTitle()
}

async function openSocial(){
  if(opening)return false
  if(!accessReady()){toast('Seu acesso ainda está sendo validado. Tente novamente em um instante.');return false}
  opening=true
  const btn=$('friendSocialBtn');btn?.classList.add('is-loading')
  try{
    const fn=await ensureCore()
    await fn()
    ensureShareTitle()
    btn?.classList.add('active')
    enhance().catch(e=>console.warn('Acabamentos da Nossa Rede:',e))
    return true
  }catch(e){
    console.warn('Nossa Rede externa:',e);toast(e?.message||'Não foi possível abrir a Nossa Rede agora.');return false
  }finally{
    opening=false;btn?.classList.remove('is-loading')
  }
}

function bind(){
  const b=$('friendSocialBtn');if(!b)return false
  b.disabled=false;b.removeAttribute('aria-disabled');b.classList.remove('is-locked')
  b.style.removeProperty('pointer-events');b.style.removeProperty('display');b.style.touchAction='manipulation'
  b.dataset.directSocialReady='1'
  return true
}

// Um único acionador delegado em captura: sobrevive a qualquer reconstrução visual do menu.
document.addEventListener('click',e=>{
  const b=e.target.closest?.('#friendSocialBtn');if(!b)return
  e.preventDefault();e.stopImmediatePropagation();openSocial()
},true)

window.__ISA_OPEN_EXTERNAL_SOCIAL_DIRECT__=openSocial
window.__ISA_BIND_EXTERNAL_SOCIAL_DIRECT__=bind
bind()
document.addEventListener('isa:friend-access-valid',bind)
document.addEventListener('isa:friend-portal-entered',bind)
let tries=0;const timer=setInterval(()=>{bind();if(++tries>50)clearInterval(timer)},220)
