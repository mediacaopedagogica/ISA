// Ponte única da Nossa Rede para acessos familiares externos.
// A rede social só é carregada quando a pessoa toca em Nossa Rede: isso evita travar o botão Acessar.
const $=id=>document.getElementById(id)
let loading=false,enhanced=false
function toast(text){if(typeof window.__ISA_FRIEND_TOAST__==='function')return window.__ISA_FRIEND_TOAST__(text);const t=$('friendToast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._socialEntry);t._socialEntry=setTimeout(()=>t.classList.add('hidden'),2600)}
async function safe(path){try{return await import(path)}catch(e){console.warn('Nossa Rede:',path,e);return null}}
async function ensureSocial(){
  if(typeof window.__ISA_OPEN_FAMILY_SOCIAL__!=='function')await safe('./family-social.js?v=16-organic-on-demand')
  for(let i=0;i<35&&typeof window.__ISA_OPEN_FAMILY_SOCIAL__!=='function';i++)await new Promise(r=>setTimeout(r,60))
  if(typeof window.__ISA_OPEN_FAMILY_SOCIAL__!=='function')throw new Error('A Nossa Rede ainda não terminou de carregar.')
  if(!enhanced){
    enhanced=true
    await safe('./nossa-rede-v4.js?v=4-organic-on-demand')
    window.__ISA_ENHANCE_NOSSA_REDE__?.()
    await safe('./nossa-rede-policy-v5-loader.js?v=3-organic-on-demand')
    window.__ISA_NOSSA_REDE_V5__?.patch?.()
    safe('./social-profile-pages-v1.js?v=3-organic').then(()=>window.__ISA_SOCIAL_PROFILE_PAGES__?.decorate?.())
    safe('./social-profile-directory-v1.js?v=2-organic').then(()=>window.__ISA_SOCIAL_PROFILE_DIRECTORY__?.patch?.())
    safe('./social-reaction-names-v1.js?v=2-organic').then(()=>window.__ISA_ENHANCE_REACTION_NAMES__?.())
    safe('./social-profile-chat-bridge.js?v=2-organic').then(()=>window.__ISA_SOCIAL_PROFILE_CHAT_SYNC__?.())
  }
}
async function openSocial(){
  if(loading)return false
  if(window.__ISA_FRIEND_ACCESS_VALID__!==true){toast('Seu acesso ainda está sendo validado. Tente novamente em um instante.');return false}
  loading=true
  const btn=$('friendSocialBtn');btn?.classList.add('is-loading');if(btn)btn.disabled=true
  try{
    await ensureSocial()
    await window.__ISA_OPEN_FAMILY_SOCIAL__()
    setTimeout(()=>{window.__ISA_ENHANCE_NOSSA_REDE__?.();window.__ISA_NOSSA_REDE_V5__?.patch?.();window.__ISA_ENHANCE_REACTION_NAMES__?.()},80)
    return true
  }catch(e){console.warn('Nossa Rede externa:',e);toast(e?.message||'Não foi possível abrir a Nossa Rede agora.');return false}
  finally{loading=false;if(btn){btn.classList.remove('is-loading');btn.disabled=false}}
}
function bind(){
  const b=$('friendSocialBtn');if(!b)return false
  b.disabled=false;b.removeAttribute('aria-disabled');b.classList.remove('is-locked');b.style.removeProperty('pointer-events');b.style.removeProperty('display')
  b.dataset.directSocialReady='1'
  return true
}
window.__ISA_OPEN_EXTERNAL_SOCIAL_DIRECT__=openSocial
window.__ISA_BIND_EXTERNAL_SOCIAL_DIRECT__=bind
bind();document.addEventListener('isa:friend-access-valid',bind);document.addEventListener('isa:friend-portal-entered',bind)
let tries=0;const timer=setInterval(()=>{bind();if(++tries>24)clearInterval(timer)},250)
