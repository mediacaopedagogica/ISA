// Nossa Rede v74 — controlador mínimo e prioritário dos acessos externos.
// Regra: o clique SEMPRE abre a tela que já existe no HTML. Dados e recursos entram depois.
(function(){
  'use strict'
  const $=id=>document.getElementById(id)
  let hydratePromise=null
  let hydrating=false

  function overlay(){return $('familySocialOverlay')}
  function stateBox(){return $('fsStaticLoadState')}

  function setState(kind,message){
    const box=stateBox();if(!box)return
    if(kind==='error'){
      box.innerHTML='<div><div class="fs-static-loader-bubble">🌸</div><strong>A Nossa Rede abriu.</strong><small>'+(message||'As publicações não conseguiram atualizar agora. Você pode tentar de novo sem sair desta tela.')+'</small><button id="fsStaticRetry" class="fs-static-retry" type="button">Tentar atualizar</button></div>'
      $('fsStaticRetry')?.addEventListener('click',function(e){e.preventDefault();hydrate(true)},{once:true})
      return
    }
    if(kind==='ready'){
      box.innerHTML='<div><div class="fs-static-loader-bubble">💕</div><strong>Nossa Rede aberta</strong><small>Atualizando os momentos da família…</small></div>'
      return
    }
    box.innerHTML='<div><div class="fs-static-loader-bubble">🌸</div><strong>Abrindo a Nossa Rede…</strong><small>'+(message||'Carregando perfil, momentos e publicações da família.')+'</small></div>'
  }

  function show(){
    const o=overlay();if(!o)return false
    o.classList.remove('hidden')
    o.setAttribute('aria-hidden','false')
    document.documentElement.style.overflow='hidden'
    document.body?.classList.add('nossa-rede-open')
    $('friendChatsTab')?.classList.remove('active')
    $('friendSocialBtn')?.classList.add('active')
    const person=window.__ISA_FRIEND_PERSON__
    const name=$('fsStaticName');if(name&&person?.name)name.textContent=person.name
    setState('ready')
    return true
  }

  function close(){
    const o=overlay();if(!o)return false
    o.classList.add('hidden')
    o.setAttribute('aria-hidden','true')
    document.documentElement.style.overflow=''
    document.body?.classList.remove('nossa-rede-open')
    $('friendSocialBtn')?.classList.remove('active')
    $('friendChatsTab')?.classList.add('active')
    return true
  }

  async function hydrate(force){
    if(hydrating&&!force)return true
    if(window.__ISA_FRIEND_ACCESS_VALID__!==true){
      setState('loading','A tela já abriu. Estamos só concluindo a validação do seu acesso.')
      return false
    }
    hydrating=true
    try{
      if(typeof window.__ISA_OPEN_EXTERNAL_SOCIAL_V72__!=='function'){
        if(!hydratePromise){
          hydratePromise=import('./external-family-social-v72.js?v=4-v74-direct').catch(function(error){hydratePromise=null;throw error})
        }
        await hydratePromise
      }
      const open=window.__ISA_OPEN_EXTERNAL_SOCIAL_V72__
      if(typeof open!=='function')throw new Error('O módulo de publicações não terminou de carregar.')
      const ok=await open()
      if(ok===false)throw new Error('A atualização dos momentos não foi concluída.')
      return true
    }catch(error){
      console.warn('[Nossa Rede v74] atualização falhou, mantendo a tela aberta',error)
      // Mesmo com erro de rede/módulo, a interface nunca volta a sumir.
      show()
      setState('error',error?.message||'Não foi possível atualizar as publicações agora.')
      return false
    }finally{
      hydrating=false
      $('friendSocialBtn')?.classList.remove('is-loading')
    }
  }

  function open(){
    const shown=show()
    if(!shown)return false
    $('friendSocialBtn')?.classList.add('is-loading')
    setTimeout(function(){hydrate(false)},0)
    return true
  }

  function captureOpen(e){
    const target=e.target?.closest?.('#friendSocialBtn')
    if(!target)return
    e.preventDefault()
    // Bloqueia controladores antigos/duplicados: só este controlador decide o clique.
    e.stopPropagation()
    e.stopImmediatePropagation()
    open()
  }

  function captureClose(e){
    const target=e.target?.closest?.('#fsCloseStatic')
    if(!target)return
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();close()
  }

  // Registrado por script clássico antes dos módulos: prioridade real no desktop e celular.
  document.addEventListener('click',captureOpen,true)
  document.addEventListener('click',captureClose,true)

  // Acessibilidade por teclado sem depender de outro controlador.
  document.addEventListener('keydown',function(e){
    if((e.key==='Enter'||e.key===' ')&&document.activeElement?.id==='friendSocialBtn'){
      e.preventDefault();open()
    }
    if(e.key==='Escape'&&!overlay()?.classList.contains('hidden'))close()
  },true)

  function bind(){
    const b=$('friendSocialBtn');if(!b)return false
    b.disabled=false
    b.removeAttribute('disabled')
    b.removeAttribute('aria-disabled')
    b.classList.remove('hidden','is-locked')
    b.style.setProperty('pointer-events','auto','important')
    b.style.setProperty('touch-action','manipulation','important')
    b.style.setProperty('position','relative','important')
    b.style.setProperty('z-index','999','important')
    return true
  }

  window.__ISA_OPEN_EXTERNAL_SOCIAL_DIRECT__=open
  window.__ISA_BIND_EXTERNAL_SOCIAL_DIRECT__=bind
  window.__ISA_CLOSE_EXTERNAL_SOCIAL_DIRECT__=close
  window.__ISA_CLOSE_FAMILY_SOCIAL__=close
  window.__ISA_HYDRATE_EXTERNAL_SOCIAL__=hydrate

  bind()
  document.addEventListener('isa:friend-access-valid',function(){bind();if(!overlay()?.classList.contains('hidden'))hydrate(true)})
  document.addEventListener('isa:friend-portal-entered',function(){bind();setTimeout(bind,60)})
  new MutationObserver(function(){bind()}).observe(document.documentElement,{subtree:true,childList:true})
})();
