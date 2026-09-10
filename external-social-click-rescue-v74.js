// Nossa Rede — controlador prioritário dos acessos externos.
// O clique abre imediatamente a MESMA estrutura visual atual da Nossa Rede; dados entram depois.
(function(){
  'use strict'
  const $=id=>document.getElementById(id)
  let hydratePromise=null
  let hydrating=false

  const EMOJIS=['🩷','🩵','💜','💕','✨','🥰','😂','😍','🌸','🌷','🫶','🎶','📚','☀️','🌙','🏡','🎉','💫']

  function ensureCss(){
    const styles=[
      ['externalSocialBaseCurrent','./social-network.css?v=4-family-private'],
      ['externalNossaRedeV4Current','./nossa-rede-v4.css?v=1-approved'],
      ['externalNossaRedePolicyCurrent','./nossa-rede-policy-v5.css?v=2-organic-base'],
      ['externalNossaRedeMobileCurrent','./nossa-rede-mobile-fix-v1.css?v=3-interaction-fix'],
      ['externalNossaRedeOrganic6Current','./nossa-rede-organic-v6.css?v=1-approved-image'],
      ['externalNossaRedeOrganic7Current','./nossa-rede-organic-v7-final.css?v=1-exact-approved-details'],
      ['externalNossaRedeOrganic8Current','./nossa-rede-organic-v8-exact.css?v=1-cloud-comment-plus'],
      ['externalNossaRedeCompactCurrent','./nuvem-compose-compact-v1.css?v=5-pink-simple']
    ]
    for(const [id,href] of styles){if($(id))continue;const l=document.createElement('link');l.id=id;l.rel='stylesheet';l.href=href;document.head.appendChild(l)}
  }

  function currentMarkup(){
    return `<div class="fs-top"><div aria-hidden="true">🌸</div><div class="grow"><strong>Nossa Rede</strong><small>Rede social privada da família 💕</small></div><button id="fsClose" class="fs-close" type="button">✕ Fechar</button></div>
      <div id="fsSync" class="fs-sync hidden">Atualizando a Nossa Rede…</div>
      <div id="fsError" class="fs-error hidden"></div>
      <div id="fsShell" class="social-shell">
        <aside class="social-card social-side"><div class="social-brand">Nossa <span>Rede</span> ✨</div><div id="fsMyProfile"><div class="social-profile-head"><div class="social-avatar">💜</div><div><strong id="fsSkeletonName">Seu perfil</strong><small>Família</small></div></div><div class="social-bio">Seu espaço na Nossa Rede.</div><div class="social-now"><div class="social-pill"><b>💜</b><span>Como estou hoje</span></div><div class="social-pill">✨ Atualizando…</div></div><button id="fsEditProfile" class="social-btn primary fs-profile-button" type="button">Meu perfil</button></div></aside>
        <section class="social-main"><div id="fsStatusStrip" class="social-status-strip"></div><div class="social-card social-composer"><textarea id="fsCaption" maxlength="2200" placeholder="Compartilhe um momento, uma frase, uma foto... ✨"></textarea><div class="social-emoji-row show">${EMOJIS.map(e=>`<button type="button" data-fs-emoji="${e}">${e}</button>`).join('')}</div><div id="fsPreview" class="fs-preview"></div><div class="social-compose-actions"><label class="social-btn soft">🖼️ Fotos / vídeo<input id="fsMedia" class="social-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" multiple></label><input id="fsLocation" maxlength="80" placeholder="📍 Localização (opcional)" style="flex:1;min-width:140px;border:1px solid #eadff0;border-radius:14px;padding:9px 11px;background:#fff"><button id="fsPublish" class="social-btn primary" type="button">Publicar</button></div></div><div id="fsFeed" class="social-feed"><div class="social-card social-empty">Atualizando os momentos da família… 🌷</div></div></section>
        <aside class="social-card social-right"><h3>Família agora 💫</h3><div id="fsFamilyList" class="social-family-list"><div class="social-empty">Atualizando…</div></div></aside>
      </div>
      <div id="fsProfileModal" class="fs-profile-modal"><div class="social-card fs-profile-card"><h3>Personalizar meu perfil ✨</h3><label>Nome na Nossa Rede<input id="fsName" maxlength="50"></label><label>Bio<textarea id="fsBio" maxlength="240" rows="3"></textarea></label><label>Frase do dia<input id="fsStatus" maxlength="120"></label><label>Como estou me sentindo<select id="fsMood"><option>🩷</option><option>🩵</option><option>💜</option><option>🥰</option><option>😊</option><option>😂</option><option>😴</option><option>🤩</option><option>😌</option><option>🥳</option></select></label><label>O que estou fazendo<select id="fsActivity"><option value="">Nada agora</option><option>🏫 Na escola</option><option>💼 No trabalho</option><option>📚 Estudando</option><option>🏡 Em casa</option><option>🎶 Ouvindo música</option><option>🎮 Jogando</option><option>☕ Relaxando</option><option>🛍️ Passeando</option><option>✈️ Viajando</option></select></label><label>Tema<select id="fsTheme"><option value="lilac">Lilás</option><option value="pink">Rosa</option><option value="blue">Azul</option><option value="green">Verde</option><option value="yellow">Amarelo</option></select></label><div class="fs-modal-actions"><button id="fsProfileCancel" class="social-btn soft" type="button">Cancelar</button><button id="fsProfileSave" class="social-btn primary" type="button">Salvar</button></div></div></div>`
  }

  function overlay(){return $('familySocialOverlay')}

  function ensureCurrentScreen(){
    ensureCss()
    const o=overlay();if(!o)return false
    // Se ainda for a tela provisória/antiga, transforma o MESMO elemento na estrutura atual.
    if(!$('fsCaption')||!o.querySelector('.social-shell')){
      o.innerHTML=currentMarkup()
      o.classList.remove('fs-static-overlay')
      o.classList.add('social-panel')
      o.dataset.currentSocial='1'
    }
    const person=window.__ISA_FRIEND_PERSON__
    const n=$('fsSkeletonName');if(n&&person?.name)n.textContent=person.name
    return true
  }

  function show(){
    if(!ensureCurrentScreen())return false
    const o=overlay();o.classList.remove('hidden');o.setAttribute('aria-hidden','false')
    document.documentElement.style.overflow='hidden';document.body?.classList.add('nossa-rede-open')
    $('friendChatsTab')?.classList.remove('active');$('friendSocialBtn')?.classList.add('active')
    return true
  }

  function close(){
    const o=overlay();if(!o)return false
    o.classList.add('hidden');o.setAttribute('aria-hidden','true')
    document.documentElement.style.overflow='';document.body?.classList.remove('nossa-rede-open')
    $('friendSocialBtn')?.classList.remove('active');$('friendChatsTab')?.classList.add('active')
    return true
  }

  function showDataError(message){
    const e=$('fsError');if(!e)return
    e.innerHTML=`${String(message||'Não foi possível atualizar as publicações agora.')} <button id="fsRetry" type="button">Tentar atualizar</button>`
    e.classList.remove('hidden');$('fsRetry')?.addEventListener('click',ev=>{ev.preventDefault();hydrate(true)},{once:true})
  }

  async function ensureVisualCurrent(){
    await import('./nossa-rede-v4.js?v=10-external-current').catch(()=>null)
    await import('./nuvem-compose-compact-v1.js?v=8-external-current').catch(()=>null)
    await import('./nossa-rede-header-cleanup-v1.js?v=2-external-current').catch(()=>null)
    await import('./nuvem-carousel-v1.js?v=4-external-current').catch(()=>null)
    window.__ISA_ENHANCE_NOSSA_REDE__?.();window.__ISA_NUVEM_COMPACT_COMPOSER__?.scan?.();window.__ISA_NOSSA_REDE_HEADER_CLEANUP__?.();window.__ISA_NUVEM_CAROUSEL__?.scan?.()
  }

  async function hydrate(force){
    if(hydrating&&!force)return true
    if(window.__ISA_FRIEND_ACCESS_VALID__!==true)return false
    hydrating=true
    try{
      await ensureVisualCurrent()
      if(typeof window.__ISA_OPEN_EXTERNAL_SOCIAL_V72__!=='function'){
        if(!hydratePromise)hydratePromise=import('./external-family-social-v72.js?v=6-current-layout-no-replace').catch(error=>{hydratePromise=null;throw error})
        await hydratePromise
      }
      const open=window.__ISA_OPEN_EXTERNAL_SOCIAL_V72__
      if(typeof open!=='function')throw new Error('A Nossa Rede não terminou de iniciar.')
      const ok=await open()
      await ensureVisualCurrent()
      return ok!==false
    }catch(error){console.warn('[Nossa Rede] dados não atualizaram; tela mantida',error);show();showDataError(error?.message);return false}
    finally{hydrating=false;$('friendSocialBtn')?.classList.remove('is-loading')}
  }

  function open(){if(!show())return false;$('friendSocialBtn')?.classList.add('is-loading');setTimeout(()=>hydrate(false),0);return true}
  function capture(e){const b=e.target?.closest?.('#friendSocialBtn');if(!b)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();open()}
  function captureClose(e){const b=e.target?.closest?.('#fsClose,#fsCloseStatic');if(!b)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();close()}

  document.addEventListener('click',capture,true);document.addEventListener('click',captureClose,true)
  document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&document.activeElement?.id==='friendSocialBtn'){e.preventDefault();open()}if(e.key==='Escape'&&!overlay()?.classList.contains('hidden'))close()},true)

  function bind(){const b=$('friendSocialBtn');if(!b)return false;b.disabled=false;b.removeAttribute('disabled');b.removeAttribute('aria-disabled');b.classList.remove('hidden','is-locked');b.style.setProperty('pointer-events','auto','important');b.style.setProperty('touch-action','manipulation','important');b.style.setProperty('position','relative','important');b.style.setProperty('z-index','999','important');return true}
  window.__ISA_OPEN_EXTERNAL_SOCIAL_DIRECT__=open;window.__ISA_BIND_EXTERNAL_SOCIAL_DIRECT__=bind;window.__ISA_CLOSE_EXTERNAL_SOCIAL_DIRECT__=close;window.__ISA_CLOSE_FAMILY_SOCIAL__=close;window.__ISA_HYDRATE_EXTERNAL_SOCIAL__=hydrate
  ensureCurrentScreen();bind()
  document.addEventListener('isa:friend-access-valid',()=>{bind();const n=$('fsSkeletonName');if(n&&window.__ISA_FRIEND_PERSON__?.name)n.textContent=window.__ISA_FRIEND_PERSON__.name;if(!overlay()?.classList.contains('hidden'))hydrate(true)})
  document.addEventListener('isa:friend-portal-entered',()=>{bind();setTimeout(bind,60)})
  new MutationObserver(bind).observe(document.documentElement,{subtree:true,childList:true})
})();
