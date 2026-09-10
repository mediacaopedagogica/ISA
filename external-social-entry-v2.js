// Nossa Rede externa — entrada única, leve e não bloqueante.
// O botão abre a interface primeiro; sincronização e enfeites acontecem depois.
const $=id=>document.getElementById(id)
let opening=false,corePromise=null,enhanceStarted=false
const wait=ms=>new Promise(r=>setTimeout(r,ms))

function toast(text){
  if(typeof window.__ISA_FRIEND_TOAST__==='function')return window.__ISA_FRIEND_TOAST__(text)
  const t=$('friendToast');if(!t)return
  t.textContent=text;t.classList.remove('hidden');clearTimeout(t._socialV2);t._socialV2=setTimeout(()=>t.classList.add('hidden'),3000)
}

function accessReady(){
  return window.__ISA_FRIEND_ACCESS_VALID__===true&&window.__ISA_FRIEND_BOOTSTRAP_STATE__==='ready'
}

async function ensureCore(){
  if(typeof window.__ISA_OPEN_FAMILY_SOCIAL__==='function')return window.__ISA_OPEN_FAMILY_SOCIAL__
  if(!corePromise){
    corePromise=import('./family-social.js?v=71-nonblocking-social').catch(error=>{corePromise=null;throw error})
  }
  await corePromise
  for(let i=0;i<20&&typeof window.__ISA_OPEN_FAMILY_SOCIAL__!=='function';i++)await wait(40)
  if(typeof window.__ISA_OPEN_FAMILY_SOCIAL__!=='function')throw new Error('A Nossa Rede não terminou de carregar.')
  return window.__ISA_OPEN_FAMILY_SOCIAL__
}

function revealShell(){
  const overlay=$('familySocialOverlay'),shell=$('fsShell'),loading=$('fsLoading')
  if(!overlay)return false
  overlay.classList.remove('hidden')
  document.documentElement.style.overflow='hidden'
  $('friendChatsTab')?.classList.remove('active')
  $('friendSocialBtn')?.classList.add('active')
  if(shell)shell.classList.remove('hidden')
  if(loading){
    loading.classList.remove('hidden')
    loading.textContent='Atualizando a Nossa Rede…'
    loading.style.cssText='padding:12px 16px;text-align:center;color:#8d7d95;font-size:12px;background:transparent'
  }
  return true
}

function revealAfterCore(){
  revealShell()
  requestAnimationFrame(revealShell)
  setTimeout(revealShell,60)
  setTimeout(revealShell,220)
}

function enhanceLater(){
  if(enhanceStarted)return
  enhanceStarted=true
  setTimeout(async()=>{
    const modules=[
      './nossa-rede-v4.js?v=11-social-open',
      './nossa-rede-policy-v5-loader.js?v=14-social-open',
      './nuvem-ui-ideas-v10.js?v=9-social-open',
      './nuvem-compose-compact-v1.js?v=9-social-open',
      './nuvem-carousel-v1.js?v=6-social-open',
      './nossa-rede-comment-menu-v1.js?v=7-social-open',
      './nossa-rede-header-cleanup-v1.js?v=4-social-open'
    ]
    await Promise.allSettled(modules.map(src=>import(src)))
    try{window.__ISA_ENHANCE_NOSSA_REDE__?.()}catch{}
    try{window.__ISA_NOSSA_REDE_V5__?.patch?.()}catch{}
    try{window.__ISA_NUVEM_UI_IDEAS__?.scan?.()}catch{}
    try{window.__ISA_NUVEM_COMPACT_COMPOSER__?.scan?.()}catch{}
    try{window.__ISA_NUVEM_CAROUSEL__?.scan?.()}catch{}
    try{window.__ISA_COMMENT_MEDIA_MENU__?.scan?.()}catch{}
    try{window.__ISA_NOSSA_REDE_HEADER_CLEANUP__?.()}catch{}
  },650)
}

async function openSocial(){
  if(opening){revealShell();return true}
  if(!accessReady()){
    toast('Seu acesso ainda está sendo validado. Tente novamente em um instante.')
    return false
  }
  opening=true
  const b=$('friendSocialBtn');b?.classList.add('is-loading')
  try{
    const open=await ensureCore()
    // family-social constrói o overlay no import. Mostramos já, antes de esperar o backend.
    revealAfterCore()
    const task=Promise.resolve().then(()=>open())
    // open() esconde o shell enquanto busca os dados; reabrimos a parte visual imediatamente.
    revealAfterCore()
    task.then(()=>{
      const loading=$('fsLoading'),shell=$('fsShell')
      if(shell)shell.classList.remove('hidden')
      if(loading&&String(loading.textContent||'').includes('Atualizando'))loading.classList.add('hidden')
    }).catch(error=>{
      console.warn('[Nossa Rede externa]',error)
      revealShell()
      const loading=$('fsLoading')
      if(loading)loading.innerHTML='<strong>A Nossa Rede abriu, mas não conseguiu atualizar agora.</strong><br><button id="fsRetryDirect" type="button" style="margin-top:8px;border:0;border-radius:12px;padding:8px 12px;background:#eadfff;color:#5f4d70;font-weight:900">Tentar atualizar</button>'
      setTimeout(()=>{$('fsRetryDirect')?.addEventListener('click',()=>openSocial(),{once:true})},0)
      toast(error?.message||'Não foi possível atualizar a Nossa Rede agora.')
    })
    enhanceLater()
    return true
  }catch(error){
    console.warn('[Nossa Rede externa]',error)
    toast(error?.message||'Não foi possível abrir a Nossa Rede.')
    return false
  }finally{
    opening=false;b?.classList.remove('is-loading')
  }
}

function handleClick(e){
  e.preventDefault()
  e.stopPropagation()
  e.stopImmediatePropagation()
  openSocial()
}

function bind(){
  const b=$('friendSocialBtn');if(!b)return false
  b.disabled=false;b.removeAttribute('disabled');b.removeAttribute('aria-disabled');b.classList.remove('hidden','is-locked')
  b.style.setProperty('pointer-events','auto','important');b.style.touchAction='manipulation'
  // Remove o onclick legado. Este arquivo é o único dono do clique da Nossa Rede externa.
  b.onclick=null
  if(b.dataset.singleSocialBound!=='71'){
    b.dataset.singleSocialBound='71'
    b.addEventListener('click',handleClick,true)
  }
  return true
}

window.__ISA_OPEN_EXTERNAL_SOCIAL_DIRECT__=openSocial
window.__ISA_BIND_EXTERNAL_SOCIAL_DIRECT__=bind
bind()
document.addEventListener('isa:friend-access-valid',bind)
document.addEventListener('isa:friend-portal-entered',()=>{bind();setTimeout(bind,120)})
