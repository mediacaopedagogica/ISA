// Entrada única da Nossa Rede nos acessos externos.
// A área social fica isolada do chat e dos demais módulos para não travar o portal.
const $=id=>document.getElementById(id)
let modulePromise=null,opening=false

function toast(text){
  if(typeof window.__ISA_FRIEND_TOAST__==='function')return window.__ISA_FRIEND_TOAST__(text)
  const t=$('friendToast');if(!t)return
  t.textContent=text;t.classList.remove('hidden');clearTimeout(t._socialEntry72);t._socialEntry72=setTimeout(()=>t.classList.add('hidden'),2800)
}
function ready(){return window.__ISA_FRIEND_ACCESS_VALID__===true&&window.__ISA_FRIEND_BOOTSTRAP_STATE__==='ready'}

async function ensureModule(){
  if(typeof window.__ISA_OPEN_EXTERNAL_SOCIAL_V72__==='function')return window.__ISA_OPEN_EXTERNAL_SOCIAL_V72__
  if(!modulePromise)modulePromise=import('./external-family-social-v72.js?v=1-standalone').catch(e=>{modulePromise=null;throw e})
  await modulePromise
  if(typeof window.__ISA_OPEN_EXTERNAL_SOCIAL_V72__!=='function')throw new Error('A Nossa Rede não terminou de iniciar.')
  return window.__ISA_OPEN_EXTERNAL_SOCIAL_V72__
}

async function openSocial(){
  if(opening)return true
  if(!ready()){toast('Seu acesso ainda está sendo validado.');return false}
  opening=true
  const b=$('friendSocialBtn');b?.classList.add('is-loading')
  try{
    const open=await ensureModule()
    return open()
  }catch(e){
    console.warn('[Nossa Rede]',e)
    toast(e?.message||'Não foi possível abrir a Nossa Rede.')
    return false
  }finally{opening=false;b?.classList.remove('is-loading')}
}

function handle(e){
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openSocial()
}
function bind(){
  const b=$('friendSocialBtn');if(!b)return false
  b.disabled=false;b.removeAttribute('disabled');b.removeAttribute('aria-disabled');b.classList.remove('hidden','is-locked')
  b.style.setProperty('pointer-events','auto','important');b.style.touchAction='manipulation';b.onclick=null
  if(b.dataset.socialStandalone72!=='1'){
    b.dataset.socialStandalone72='1'
    b.addEventListener('click',handle,true)
  }
  return true
}

window.__ISA_OPEN_EXTERNAL_SOCIAL_DIRECT__=openSocial
window.__ISA_BIND_EXTERNAL_SOCIAL_DIRECT__=bind
bind()
document.addEventListener('isa:friend-access-valid',bind)
document.addEventListener('isa:friend-portal-entered',()=>{bind();setTimeout(bind,80)})
