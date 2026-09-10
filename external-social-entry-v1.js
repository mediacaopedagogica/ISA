// Ponte estável da Nossa Rede para acessos familiares externos.
// O clique abre primeiro o núcleo da rede; acabamentos visuais entram depois, sem bloquear o toque.
const $=id=>document.getElementById(id)
let loading=false,enhanced=false
function toast(text){if(typeof window.__ISA_FRIEND_TOAST__==='function')return window.__ISA_FRIEND_TOAST__(text);const t=$('friendToast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._socialEntry);t._socialEntry=setTimeout(()=>t.classList.add('hidden'),2600)}
async function safe(path){try{return await import(path)}catch(e){console.warn('Nossa Rede:',path,e);return null}}
async function ensureCore(){
  if(typeof window.__ISA_OPEN_FAMILY_SOCIAL__!=='function')await safe('./family-social.js?v=18-stable-open')
  for(let i=0;i<45&&typeof window.__ISA_OPEN_FAMILY_SOCIAL__!=='function';i++)await new Promise(r=>setTimeout(r,60))
  if(typeof window.__ISA_OPEN_FAMILY_SOCIAL__!=='function')throw new Error('A Nossa Rede ainda não terminou de carregar.')
}
function enhanceLater(){
  if(enhanced)return;enhanced=true
  setTimeout(async()=>{
    await safe('./nossa-rede-v4.js?v=6-stable-open');window.__ISA_ENHANCE_NOSSA_REDE__?.()
    await safe('./nossa-rede-policy-v5-loader.js?v=5-interaction-fix');window.__ISA_NOSSA_REDE_V5__?.patch?.()
    safe('./nossa-rede-comment-menu-v1.js?v=2-stable-open').then(()=>window.__ISA_COMMENT_MEDIA_MENU__?.scan?.())
    safe('./social-profile-pages-v1.js?v=4-stable-open').then(()=>window.__ISA_SOCIAL_PROFILE_PAGES__?.decorate?.())
    safe('./social-profile-directory-v1.js?v=3-stable-open').then(()=>window.__ISA_SOCIAL_PROFILE_DIRECTORY__?.patch?.())
    safe('./social-reaction-names-v1.js?v=3-stable-open').then(()=>window.__ISA_ENHANCE_REACTION_NAMES__?.())
    safe('./social-profile-chat-bridge.js?v=3-stable-open').then(()=>window.__ISA_SOCIAL_PROFILE_CHAT_SYNC__?.())
  },420)
}
async function openSocial(){
  if(loading)return false
  if(window.__ISA_FRIEND_ACCESS_VALID__!==true){toast('Seu acesso ainda está sendo validado. Tente novamente em um instante.');return false}
  loading=true
  const btn=$('friendSocialBtn');btn?.classList.add('is-loading')
  try{
    await ensureCore()
    await window.__ISA_OPEN_FAMILY_SOCIAL__()
    enhanceLater()
    return true
  }catch(e){console.warn('Nossa Rede externa:',e);toast(e?.message||'Não foi possível abrir a Nossa Rede agora.');return false}
  finally{loading=false;btn?.classList.remove('is-loading')}
}
function directClick(e){
  e?.preventDefault?.();e?.stopPropagation?.()
  openSocial()
}
function bind(){
  const b=$('friendSocialBtn');if(!b)return false
  b.disabled=false;b.removeAttribute('aria-disabled');b.classList.remove('is-locked');b.style.removeProperty('pointer-events');b.style.removeProperty('display');b.style.touchAction='manipulation'
  if(b.dataset.directSocialReady!=='1'){
    b.dataset.directSocialReady='1'
    b.addEventListener('click',directClick,true)
  }
  return true
}
window.__ISA_OPEN_EXTERNAL_SOCIAL_DIRECT__=openSocial
window.__ISA_BIND_EXTERNAL_SOCIAL_DIRECT__=bind
bind();document.addEventListener('isa:friend-access-valid',bind);document.addEventListener('isa:friend-portal-entered',bind)
let tries=0;const timer=setInterval(()=>{bind();if(++tries>40)clearInterval(timer)},250)
