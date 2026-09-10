// Nossa Rede — controlador único dos acessos externos.
// Todos os links familiares usam a MESMA estrutura final aprovada, sem piscar a versão-base antiga.
(function(){
  'use strict'
  if(window.__ISA_EXTERNAL_SOCIAL_ALL_LINKS_V76__)return
  window.__ISA_EXTERNAL_SOCIAL_ALL_LINKS_V76__=true

  const $=id=>document.getElementById(id)
  let hydratePromise=null
  let hydrating=false
  let opening=false
  let lastTouchOpen=0
  const EMOJIS=['💜','💕','✨','🥰','😂','😍','🌷','🫶','🔥','🎶','📚','☀️','🌙','🏡','🎉','💫']

  function ensureCss(){
    const styles=[
      ['externalSocialBaseCurrent','./social-network.css?v=2-original'],
      ['externalNossaRedeV4Current','./nossa-rede-v4.css?v=1-approved'],
      ['externalNossaRedePolicyCurrent','./nossa-rede-policy-v5.css?v=2-organic-base'],
      ['externalNossaRedeMobileCurrent','./nossa-rede-mobile-fix-v1.css?v=3-interaction-fix'],
      ['externalNossaRedeOrganic6Current','./nossa-rede-organic-v6.css?v=1-approved-image'],
      ['externalNossaRedeOrganic7Current','./nossa-rede-organic-v7-final.css?v=1-exact-approved-details'],
      ['externalNossaRedeOrganic8Current','./nossa-rede-organic-v8-exact.css?v=1-cloud-comment-plus'],
      ['externalNossaRedeCompactCurrent','./nuvem-compose-compact-v1.css?v=5-pink-simple']
    ]
    for(const [id,href] of styles){if($(id))continue;const l=document.createElement('link');l.id=id;l.rel='stylesheet';l.href=href;document.head.appendChild(l)}
    if(!$('externalSocialFinalGate76')){
      const s=document.createElement('style');s.id='externalSocialFinalGate76';s.textContent=`
        #familySocialOverlay.external-social-preparing>.social-shell{visibility:hidden!important;opacity:0!important;pointer-events:none!important}
        #familySocialOverlay .external-social-wait76{display:none}
        #familySocialOverlay.external-social-preparing>.external-social-wait76{display:grid!important;position:fixed;inset:0;z-index:2147480000;place-items:center;padding:20px;background:radial-gradient(circle at 10% 10%,rgba(255,221,239,.92),transparent 30%),radial-gradient(circle at 90% 12%,rgba(230,219,255,.92),transparent 30%),linear-gradient(145deg,#fffafd,#faf6ff 52%,#eff8ff)}
        .external-social-wait76-card{width:min(390px,90vw);padding:24px 22px;text-align:center;border-radius:30px;background:rgba(255,255,255,.86);border:1px solid rgba(255,255,255,.98);box-shadow:0 22px 52px rgba(94,71,122,.14);backdrop-filter:blur(22px);color:#5f5272}
        .external-social-wait76-card b{display:block;font-size:18px;margin-top:7px}.external-social-wait76-card small{display:block;margin-top:5px;color:#8f8298}.external-social-wait76-heart{font-size:40px}.external-social-wait76-spin{width:28px;height:28px;margin:15px auto 0;border:4px solid #eadff3;border-top-color:#ef79b8;border-radius:50%;animation:externalSocialSpin76 .75s linear infinite}@keyframes externalSocialSpin76{to{transform:rotate(360deg)}}
      `;document.head.appendChild(s)
    }
  }

  function currentMarkup(){
    return `<button id="fsClose" type="button" aria-label="Fechar Nossa Rede" style="display:none"></button>
      <div id="fsSync" class="fs-sync hidden">Atualizando a Nossa Rede…</div>
      <div id="fsError" class="fs-error hidden"></div>
      <div class="social-shell">
        <aside class="social-card social-side">
          <div class="social-brand">Nossa <span>Rede</span> ✨</div>
          <div id="fsMyProfile"></div>
        </aside>
        <section class="social-main">
          <div class="social-card social-topbar"><div><h2>Nosso cantinho social 💕</h2><small>Fotos, vídeos, momentos e atualizações da família</small></div><button id="fsRefresh" class="social-btn soft" type="button">↻</button></div>
          <div id="fsStatusStrip" class="social-status-strip"></div>
          <div class="social-card social-composer">
            <textarea id="fsCaption" maxlength="2200" placeholder="Compartilhe um momento, uma legenda, uma frase... ✨"></textarea>
            <div id="fsEmojiRow" class="social-emoji-row">${EMOJIS.map(e=>`<button type="button" data-fs-emoji="${e}">${e}</button>`).join('')}</div>
            <div id="fsPreview" class="social-preview"></div>
            <div class="social-compose-actions">
              <label class="social-btn soft">🖼️ Fotos / vídeo<input id="fsMedia" class="social-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" multiple></label>
              <button id="fsEmojiBtn" class="social-btn soft" type="button">😊 Emoji</button>
              <input id="fsLocation" maxlength="80" placeholder="📍 Lugar (opcional)" style="flex:1;min-width:140px;border:1px solid #eadff0;border-radius:14px;padding:9px 11px;background:#fff">
              <button id="fsPublish" class="social-btn primary" type="button">Publicar</button>
            </div>
          </div>
          <div id="fsFeed" class="social-feed"></div>
        </section>
        <aside class="social-card social-right"><h3>Família agora 💫</h3><div id="fsFamilyList" class="social-family-list"></div></aside>
      </div>
      <div id="fsProfileModal" class="social-modal"><div class="social-card social-modal-card"><h3>Personalizar meu perfil ✨</h3><div class="social-field"><label>Nome na Nossa Rede</label><input id="fsName" maxlength="50"></div><div class="social-field"><label>Bio</label><textarea id="fsBio" maxlength="240" rows="3" placeholder="Conte um pouquinho sobre você..."></textarea></div><div class="social-field"><label>Frase / atualização do dia</label><input id="fsStatus" maxlength="120" placeholder="Ex.: Um dia de cada vez ✨"></div><div class="social-field"><label>Como estou me sentindo</label><select id="fsMood"><option>💜</option><option>🥰</option><option>😊</option><option>😂</option><option>😴</option><option>🤩</option><option>😌</option><option>🥳</option><option>🤗</option><option>🤔</option><option>😎</option><option>💪</option></select></div><div class="social-field"><label>O que estou fazendo</label><select id="fsActivity"><option value="">Nada agora</option><option>🏫 Na escola</option><option>💼 No trabalho</option><option>📚 Estudando</option><option>🏡 Em casa</option><option>🎶 Ouvindo música</option><option>🎮 Jogando</option><option>🚗 Na estrada</option><option>☕ Relaxando</option><option>🛍️ Passeando</option><option>✈️ Viajando</option></select></div><div class="social-field"><label>Tema do perfil</label><select id="fsTheme"><option value="pink">Rosa</option><option value="lilac">Lilás</option><option value="green">Verde</option><option value="yellow">Amarelo</option><option value="blue">Azul</option></select></div><div class="social-modal-actions"><button id="fsProfileCancel" class="social-btn soft" type="button">Cancelar</button><button id="fsProfileSave" class="social-btn primary" type="button">Salvar perfil</button></div></div></div>`
  }

  function overlay(){return $('familySocialOverlay')}
  function ensureCurrentScreen(){
    ensureCss();const o=overlay();if(!o)return false
    const legacy=!!o.querySelector('.fs-top,.fs-static-head,.fs-static-overlay')
    const incomplete=!$('fsCaption')||!o.querySelector('.social-shell')||!o.querySelector('.social-topbar')
    if(legacy||incomplete){o.innerHTML=currentMarkup();o.className='social-panel hidden';o.setAttribute('aria-hidden','true');o.dataset.currentSocial='final-approved'}
    return true
  }

  function ensureWait(){
    const o=overlay();if(!o)return null
    let w=o.querySelector(':scope > .external-social-wait76')
    if(!w){w=document.createElement('div');w.className='external-social-wait76';w.innerHTML='<div class="external-social-wait76-card"><div class="external-social-wait76-heart">💗</div><b>Abrindo a Nossa Rede</b><small>Preparando o visual atual e os momentos da família…</small><div class="external-social-wait76-spin"></div></div>';o.prepend(w)}
    return w
  }
  function preparing(on){const o=overlay();if(!o)return;o.classList.toggle('external-social-preparing',!!on);if(on)ensureWait();else o.querySelector(':scope > .external-social-wait76')?.remove()}
  function show(){if(!ensureCurrentScreen())return false;const o=overlay();o.classList.remove('hidden');o.setAttribute('aria-hidden','false');document.documentElement.style.overflow='hidden';document.body?.classList.add('nossa-rede-open');$('friendChatsTab')?.classList.remove('active');$('friendSocialBtn')?.classList.add('active');return true}
  function close(){const o=overlay();if(!o)return false;preparing(false);o.classList.add('hidden');o.setAttribute('aria-hidden','true');document.documentElement.style.overflow='';document.body?.classList.remove('nossa-rede-open');$('friendSocialBtn')?.classList.remove('active');$('friendChatsTab')?.classList.add('active');return true}
  function showDataError(message){const e=$('fsError');if(!e)return;e.innerHTML=`${String(message||'Não foi possível atualizar as publicações agora.')} <button id="fsRetry" type="button">Tentar atualizar</button>`;e.classList.remove('hidden');$('fsRetry')?.addEventListener('click',ev=>{ev.preventDefault();hydrate(true)},{once:true})}

  async function ensureVisualCurrent(){
    await Promise.allSettled([
      import('./nossa-rede-v4.js?v=12-all-family-final'),
      import('./nossa-rede-policy-v5-loader.js?v=12-all-family-final'),
      import('./nuvem-compose-compact-v1.js?v=10-all-family-final'),
      import('./nossa-rede-header-cleanup-v1.js?v=4-all-family-final'),
      import('./nuvem-carousel-v1.js?v=6-all-family-final'),
      import('./nossa-rede-comment-menu-v1.js?v=4-all-family-final')
    ])
    window.__ISA_ENHANCE_NOSSA_REDE__?.();window.__ISA_NOSSA_REDE_V5__?.patch?.();window.__ISA_NUVEM_COMPACT_COMPOSER__?.scan?.();window.__ISA_NOSSA_REDE_HEADER_CLEANUP__?.();window.__ISA_NUVEM_CAROUSEL__?.scan?.();window.__ISA_COMMENT_MEDIA_MENU__?.scan?.()
  }

  async function ensureDataCore(){
    if(typeof window.__ISA_OPEN_EXTERNAL_SOCIAL_V72__==='function')return window.__ISA_OPEN_EXTERNAL_SOCIAL_V72__
    if(!hydratePromise)hydratePromise=import('./external-family-social-v72.js?v=8-all-family-final').catch(error=>{hydratePromise=null;throw error})
    await hydratePromise
    return window.__ISA_OPEN_EXTERNAL_SOCIAL_V72__
  }

  async function hydrate(force){
    if(hydrating&&!force)return true
    if(window.__ISA_FRIEND_ACCESS_VALID__!==true)return false
    hydrating=true
    try{
      await ensureVisualCurrent()
      const open=await ensureDataCore();if(typeof open!=='function')throw new Error('A Nossa Rede não terminou de iniciar.')
      const ok=await open();await ensureVisualCurrent();return ok!==false
    }catch(error){console.warn('[Nossa Rede] dados não atualizaram; tela mantida',error);showDataError(error?.message);return false}
    finally{hydrating=false}
  }

  async function open(){
    if(opening)return true
    if(!show())return false
    opening=true;preparing(true);$('friendSocialBtn')?.classList.add('is-loading')
    try{
      if(window.__ISA_FRIEND_ACCESS_VALID__!==true){
        await ensureVisualCurrent().catch(()=>null)
        return false
      }
      await ensureVisualCurrent()
      await hydrate(false)
      return true
    }catch(error){console.warn('[Nossa Rede] abertura protegida',error);showDataError(error?.message);return false}
    finally{preparing(false);opening=false;$('friendSocialBtn')?.classList.remove('is-loading')}
  }

  function stop(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()}
  function capturePointer(e){const b=e.target?.closest?.('#friendSocialBtn');if(!b||e.pointerType!=='touch')return;lastTouchOpen=Date.now();stop(e);open()}
  function captureClick(e){const b=e.target?.closest?.('#friendSocialBtn');if(!b)return;stop(e);if(Date.now()-lastTouchOpen<650)return;open()}
  function captureClose(e){const b=e.target?.closest?.('#fsClose,#fsCloseStatic');if(!b)return;stop(e);close()}
  document.addEventListener('pointerup',capturePointer,true)
  document.addEventListener('click',captureClick,true)
  document.addEventListener('click',captureClose,true)
  document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&document.activeElement?.id==='friendSocialBtn'){e.preventDefault();open()}if(e.key==='Escape'&&!overlay()?.classList.contains('hidden'))close()},true)

  function bind(){const b=$('friendSocialBtn');if(!b)return false;b.disabled=false;b.removeAttribute('disabled');b.removeAttribute('aria-disabled');b.classList.remove('hidden','is-locked');b.style.setProperty('pointer-events','auto','important');b.style.setProperty('touch-action','manipulation','important');b.style.setProperty('position','relative','important');b.style.setProperty('z-index','999','important');return true}
  function preload(){ensureCurrentScreen();bind();if(window.__ISA_FRIEND_ACCESS_VALID__===true){ensureVisualCurrent().catch(()=>null);ensureDataCore().catch(()=>null)}}

  window.__ISA_OPEN_EXTERNAL_SOCIAL_DIRECT__=open
  window.__ISA_BIND_EXTERNAL_SOCIAL_DIRECT__=bind
  window.__ISA_CLOSE_EXTERNAL_SOCIAL_DIRECT__=close
  window.__ISA_CLOSE_FAMILY_SOCIAL__=close
  window.__ISA_HYDRATE_EXTERNAL_SOCIAL__=hydrate
  window.__ISA_PRELOAD_EXTERNAL_SOCIAL__=preload

  preload()
  document.addEventListener('isa:friend-access-valid',()=>{preload();if(!overlay()?.classList.contains('hidden'))open()})
  document.addEventListener('isa:friend-portal-entered',()=>{preload();setTimeout(bind,60)})
  new MutationObserver(()=>bind()).observe(document.documentElement,{subtree:true,childList:true})
})();
