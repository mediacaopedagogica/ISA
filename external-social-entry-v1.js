// Ponte única da Nossa Rede para acessos familiares externos.
// Este módulo NÃO intercepta cliques globalmente; o external-ui-controller é o único controlador visual.
const $=id=>document.getElementById(id)
let loading=false
function toast(text){if(typeof window.__ISA_FRIEND_TOAST__==='function')return window.__ISA_FRIEND_TOAST__(text);const t=$('friendToast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._socialEntry);t._socialEntry=setTimeout(()=>t.classList.add('hidden'),2600)}
async function openSocial(){
  if(loading)return false
  if(window.__ISA_FRIEND_ACCESS_VALID__!==true){toast('Seu acesso ainda está sendo validado. Tente novamente em um instante.');return false}
  loading=true
  const btn=$('friendSocialBtn');btn?.classList.add('is-loading')
  try{
    if(typeof window.__ISA_OPEN_FAMILY_SOCIAL__!=='function')await import('./family-social.js?v=15-single-controller')
    for(let i=0;i<30&&typeof window.__ISA_OPEN_FAMILY_SOCIAL__!=='function';i++)await new Promise(r=>setTimeout(r,60))
    if(typeof window.__ISA_OPEN_FAMILY_SOCIAL__!=='function')throw new Error('A Nossa Rede ainda não terminou de carregar.')
    await window.__ISA_OPEN_FAMILY_SOCIAL__()
    return true
  }catch(e){console.warn('Nossa Rede externa:',e);toast(e?.message||'Não foi possível abrir a Nossa Rede agora.');return false}
  finally{loading=false;btn?.classList.remove('is-loading')}
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
let tries=0;const timer=setInterval(()=>{bind();if(++tries>40)clearInterval(timer)},180)
