// Entrada única da Nossa Rede nos acessos externos.
// A tela existe no próprio HTML; este módulo abre a interface primeiro e carrega os dados depois.
const $=id=>document.getElementById(id)
let modulePromise=null,opening=false

function toast(text){
  if(typeof window.__ISA_FRIEND_TOAST__==='function')return window.__ISA_FRIEND_TOAST__(text)
  const t=$('friendToast');if(!t)return
  t.textContent=text;t.classList.remove('hidden');clearTimeout(t._socialEntry73);t._socialEntry73=setTimeout(()=>t.classList.add('hidden'),2800)
}
function accessValid(){return window.__ISA_FRIEND_ACCESS_VALID__===true}
function staticOverlay(){return $('familySocialOverlay')}
function staticState(){return $('fsStaticLoadState')}

function setStaticState(mode,message){
  const box=staticState();if(!box)return
  if(mode==='error'){
    box.innerHTML=`<div><div class="fs-static-loader-bubble">🌸</div><strong>Não consegui atualizar as publicações agora.</strong><small>${message||'A tela da Nossa Rede continua disponível. Tente novamente.'}</small><button id="fsStaticRetry" class="fs-static-retry" type="button">Tentar novamente</button></div>`
    $('fsStaticRetry')?.addEventListener('click',()=>openSocial(true),{once:true})
    return
  }
  box.innerHTML=`<div><div class="fs-static-loader-bubble">🌸</div><strong>${mode==='validating'?'Confirmando seu acesso…':'Abrindo a Nossa Rede…'}</strong><small>${message||'Carregando perfil, momentos e publicações da família.'}</small></div>`
}

function showStaticScreen(){
  const o=staticOverlay();if(!o)return false
  o.classList.remove('hidden');o.setAttribute('aria-hidden','false')
  document.documentElement.style.overflow='hidden'
  $('friendChatsTab')?.classList.remove('active');$('friendSocialBtn')?.classList.add('active')
  const person=window.__ISA_FRIEND_PERSON__
  const name=$('fsStaticName');if(name&&person?.name)name.textContent=person.name
  return true
}
function closeStaticScreen(){
  const o=staticOverlay();if(!o)return
  o.classList.add('hidden');o.setAttribute('aria-hidden','true')
  document.documentElement.style.overflow=''
  $('friendSocialBtn')?.classList.remove('active');$('friendChatsTab')?.classList.add('active')
}

async function ensureModule(){
  if(typeof window.__ISA_OPEN_EXTERNAL_SOCIAL_V72__==='function')return window.__ISA_OPEN_EXTERNAL_SOCIAL_V72__
  if(!modulePromise)modulePromise=import('./external-family-social-v72.js?v=2-static-screen').catch(e=>{modulePromise=null;throw e})
  await modulePromise
  if(typeof window.__ISA_OPEN_EXTERNAL_SOCIAL_V72__!=='function')throw new Error('A Nossa Rede não terminou de iniciar.')
  return window.__ISA_OPEN_EXTERNAL_SOCIAL_V72__
}

async function openSocial(force=false){
  showStaticScreen()
  if(opening&&!force)return true
  if(!accessValid()){
    setStaticState('validating','Seu link já está aberto; falta apenas concluir a validação do acesso.')
    toast('Seu acesso ainda está sendo validado.')
    return false
  }
  opening=true
  const b=$('friendSocialBtn');b?.classList.add('is-loading')
  setStaticState('loading')
  try{
    const open=await ensureModule()
    const ok=await open()
    return ok!==false
  }catch(e){
    console.warn('[Nossa Rede]',e)
    // A tela não desaparece se a parte de dados falhar.
    showStaticScreen();setStaticState('error',e?.message||'Não foi possível atualizar a Nossa Rede.')
    toast('A tela abriu, mas as publicações não atualizaram.')
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
  if(b.dataset.socialStandalone73!=='1'){
    b.dataset.socialStandalone73='1'
    b.addEventListener('click',handle,true)
  }
  const close=$('fsCloseStatic');
  if(close&&close.dataset.socialClose73!=='1'){
    close.dataset.socialClose73='1';close.addEventListener('click',e=>{e.preventDefault();closeStaticScreen()},true)
  }
  return true
}

window.__ISA_OPEN_EXTERNAL_SOCIAL_DIRECT__=openSocial
window.__ISA_BIND_EXTERNAL_SOCIAL_DIRECT__=bind
window.__ISA_CLOSE_EXTERNAL_SOCIAL_DIRECT__=closeStaticScreen
bind()
document.addEventListener('isa:friend-access-valid',()=>{bind();if(!staticOverlay()?.classList.contains('hidden'))openSocial(true)})
document.addEventListener('isa:friend-portal-entered',()=>{bind();setTimeout(bind,80)})
