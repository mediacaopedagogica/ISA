// Nossa Rede — tema unificado + Stories protegidos.
// Correção localizada: não reconstrói feed, posts, comentários, capa, navegação ou permissões.
(function(){
  'use strict'
  if(window.__ISA_THEME_STORY_LOCK_V1__)return
  window.__ISA_THEME_STORY_LOCK_V1__=true

  const ROOTS='#socialPanel,#familySocialOverlay'
  const FILTERS={
    natural:'none',
    claro:'brightness(1.08) saturate(1.05)',
    quente:'sepia(.16) saturate(1.12) contrast(1.03)',
    frio:'saturate(.94) hue-rotate(9deg) brightness(1.03)',
    pb:'grayscale(1)',
    suave:'contrast(.92) brightness(1.06) saturate(.9)',
    contraste:'contrast(1.18) saturate(1.08)'
  }
  let editorInput=null,editorFile=null,editorFilter='natural',editorFit='cover',scanTimer=0

  function toast(text){
    const t=document.getElementById('friendToast')||document.getElementById('toast')
    if(!t)return
    t.textContent=text;t.classList.remove('hidden')
    clearTimeout(t._themeStoryToast)
    t._themeStoryToast=setTimeout(()=>t.classList.add('hidden'),2800)
  }

  function ensureCss(){
    if(document.getElementById('isaThemeStoryLockCss'))return
    const s=document.createElement('style')
    s.id='isaThemeStoryLockCss'
    s.textContent=`
      /* A cor/fundo escolhida em Configurações passa a alcançar toda a moldura da Nossa Rede. */
      #socialPanel,#familySocialOverlay{background:var(--nr5-bg)!important}
      #socialPanel .isa-social-header,#familySocialOverlay .isa-social-header{
        background:var(--nr5-bg)!important;
        border-color:rgba(255,255,255,.97)!important;
      }
      #socialPanel .social-side,#familySocialOverlay .social-side{
        background:var(--nr5-bg)!important;
        border:1px solid rgba(255,255,255,.96)!important;
      }
      #socialPanel .social-profile-head .social-avatar,#familySocialOverlay .social-profile-head .social-avatar{
        outline-color:var(--nr5-accent-soft)!important;
      }
      #socialPanel .isa-story-strip,#familySocialOverlay .isa-story-strip{
        background:var(--nr5-bg)!important;
        border-color:rgba(255,255,255,.94)!important;
      }

      /* Stories: miniaturas sempre circulares, proporcionais e sem deformação vertical. */
      #socialPanel .isa-story-list,#familySocialOverlay .isa-story-list{
        display:flex!important;align-items:flex-start!important;gap:12px!important;
        overflow-x:auto!important;overflow-y:hidden!important;
        min-height:92px!important;max-height:108px!important;padding:4px 2px 7px!important;
      }
      #socialPanel .isa-story-person,#familySocialOverlay .isa-story-person{
        appearance:none!important;-webkit-appearance:none!important;
        flex:0 0 76px!important;width:76px!important;min-width:76px!important;max-width:76px!important;
        height:auto!important;min-height:86px!important;max-height:100px!important;
        margin:0!important;padding:0!important;border:0!important;background:transparent!important;
        display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:flex-start!important;
        overflow:visible!important;cursor:pointer!important;pointer-events:auto!important;position:relative!important;z-index:2!important;
        color:#66536f!important;text-align:center!important;
      }
      #socialPanel .isa-story-ring,#familySocialOverlay .isa-story-ring{
        display:block!important;box-sizing:border-box!important;
        width:66px!important;height:66px!important;min-width:66px!important;min-height:66px!important;max-width:66px!important;max-height:66px!important;
        aspect-ratio:1/1!important;border-radius:50%!important;overflow:hidden!important;padding:3px!important;margin:0 auto!important;
        border:0!important;position:relative!important;cursor:pointer!important;
      }
      #socialPanel .isa-story-ring>img,#familySocialOverlay .isa-story-ring>img,
      #socialPanel .isa-story-ring>span,#familySocialOverlay .isa-story-ring>span{
        display:block!important;box-sizing:border-box!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;
        max-width:100%!important;max-height:100%!important;aspect-ratio:1/1!important;border-radius:50%!important;overflow:hidden!important;
        object-fit:cover!important;object-position:center!important;margin:0!important;padding:0!important;
      }
      #socialPanel .isa-story-ring>span,#familySocialOverlay .isa-story-ring>span{
        display:grid!important;place-items:center!important;background:#fff7fc!important;
      }
      #socialPanel .isa-story-person b,#familySocialOverlay .isa-story-person b{
        width:76px!important;max-width:76px!important;margin-top:6px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;
      }
      #socialPanel .isa-story-person small,#familySocialOverlay .isa-story-person small{max-width:76px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
      #socialPanel .isa-story-add,#familySocialOverlay .isa-story-add{font-size:27px!important;line-height:1!important;color:#8c73a2!important}

      /* Visualizador mantém o conteúdo do Story centralizado e inteiro. */
      .isa-story-viewer{z-index:2147482500!important}
      .isa-story-card{width:min(430px,96vw)!important;height:min(86dvh,760px)!important;max-height:86dvh!important;border-radius:26px!important}
      .isa-story-media{width:100%!important;height:100%!important;object-fit:contain!important;object-position:center!important}

      /* Editor pré-publicação do Story. */
      #isaStoryPreEditor{position:fixed;inset:0;z-index:2147483000;display:none;place-items:center;padding:12px;background:rgba(37,28,47,.72);backdrop-filter:blur(10px)}
      #isaStoryPreEditor.show{display:grid}
      .isa-story-editor-card{width:min(720px,96vw);max-height:94dvh;overflow:auto;border-radius:28px;padding:16px;background:#fffafd;border:1px solid #fff;box-shadow:0 28px 80px rgba(45,32,60,.32);color:#544667}
      .isa-story-editor-head{display:flex;align-items:center;gap:10px;margin-bottom:12px}.isa-story-editor-head>div{flex:1}.isa-story-editor-head h3{margin:0;font-size:18px}.isa-story-editor-head p{margin:3px 0 0;font-size:11px;color:#8c7d98}
      .isa-story-editor-preview{width:min(330px,78vw);aspect-ratio:9/16;margin:0 auto;border-radius:24px;overflow:hidden;background:#171419;display:grid;place-items:center;box-shadow:0 16px 38px rgba(68,48,84,.19)}
      .isa-story-editor-preview img,.isa-story-editor-preview video{width:100%;height:100%;display:block;object-position:center}.isa-story-editor-preview img[data-fit="cover"]{object-fit:cover}.isa-story-editor-preview img[data-fit="contain"]{object-fit:contain}.isa-story-editor-preview video{object-fit:contain}
      .isa-story-editor-tools{display:flex;flex-wrap:wrap;justify-content:center;gap:7px;margin:12px 0}.isa-story-editor-tools button{border:1px solid #eadfed;border-radius:999px;padding:8px 11px;background:#fff;color:#685673;font-size:10px;font-weight:900;cursor:pointer}.isa-story-editor-tools button.active{outline:2px solid var(--nr5-accent,#e65ca7);background:#fff4fa}
      .isa-story-editor-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:13px}.isa-story-editor-actions button{border:0;border-radius:14px;padding:10px 14px;font-weight:900;cursor:pointer}.isa-story-editor-cancel{background:#f1eaf5;color:#675672}.isa-story-editor-publish{background:linear-gradient(90deg,var(--nr5-accent-soft,#f4bad8),#cdbdf3);color:#5d4568}
      @media(max-width:760px){
        #socialPanel .isa-story-list,#familySocialOverlay .isa-story-list{min-height:84px!important;max-height:98px!important;gap:9px!important}
        #socialPanel .isa-story-person,#familySocialOverlay .isa-story-person{flex-basis:68px!important;width:68px!important;min-width:68px!important;max-width:68px!important}
        #socialPanel .isa-story-ring,#familySocialOverlay .isa-story-ring{width:58px!important;height:58px!important;min-width:58px!important;min-height:58px!important;max-width:58px!important;max-height:58px!important}
        #socialPanel .isa-story-person b,#familySocialOverlay .isa-story-person b{width:68px!important;max-width:68px!important}
        .isa-story-card{width:100vw!important;height:100dvh!important;max-height:none!important;border-radius:0!important}
        .isa-story-editor-card{width:100vw;height:100dvh;max-height:none;border-radius:0;padding:12px}.isa-story-editor-preview{height:64dvh;width:auto;max-width:92vw}
      }
    `
    document.head.appendChild(s)
  }

  function editor(){
    let m=document.getElementById('isaStoryPreEditor')
    if(m)return m
    m=document.createElement('div');m.id='isaStoryPreEditor'
    m.innerHTML=`<section class="isa-story-editor-card" role="dialog" aria-modal="true" aria-label="Editar Story antes de publicar">
      <div class="isa-story-editor-head"><div><h3>✨ Preparar Story</h3><p>A foto fica ajustada ao formato do Story antes de publicar.</p></div></div>
      <div id="isaStoryEditorPreview" class="isa-story-editor-preview"></div>
      <div id="isaStoryFitTools" class="isa-story-editor-tools"><button type="button" data-story-fit="cover" class="active">Preencher</button><button type="button" data-story-fit="contain">Mostrar inteira</button></div>
      <div id="isaStoryFilterTools" class="isa-story-editor-tools">${Object.keys(FILTERS).map(k=>`<button type="button" data-story-filter="${k}" class="${k==='natural'?'active':''}">${k==='pb'?'P&B':k[0].toUpperCase()+k.slice(1)}</button>`).join('')}</div>
      <div class="isa-story-editor-actions"><button type="button" class="isa-story-editor-cancel">Cancelar</button><button type="button" class="isa-story-editor-publish">Publicar Story</button></div>
    </section>`
    document.body.appendChild(m)
    m.querySelector('.isa-story-editor-cancel').onclick=cancelEditor
    m.querySelector('.isa-story-editor-publish').onclick=publishEditedStory
    m.addEventListener('click',e=>{
      if(e.target===m)return cancelEditor()
      const f=e.target.closest('[data-story-filter]')
      if(f){editorFilter=f.dataset.storyFilter;m.querySelectorAll('[data-story-filter]').forEach(x=>x.classList.toggle('active',x===f));syncPreview();return}
      const fit=e.target.closest('[data-story-fit]')
      if(fit){editorFit=fit.dataset.storyFit;m.querySelectorAll('[data-story-fit]').forEach(x=>x.classList.toggle('active',x===fit));syncPreview()}
    })
    return m
  }

  function syncPreview(){
    const m=editor(),img=m.querySelector('#isaStoryEditorPreview img')
    if(img){img.style.filter=FILTERS[editorFilter]||'none';img.dataset.fit=editorFit}
  }

  function openEditor(input,file){
    editorInput=input;editorFile=file;editorFilter='natural';editorFit='cover'
    const m=editor(),slot=m.querySelector('#isaStoryEditorPreview'),filters=m.querySelector('#isaStoryFilterTools'),fits=m.querySelector('#isaStoryFitTools')
    slot.innerHTML=''
    m.querySelectorAll('[data-story-filter]').forEach(x=>x.classList.toggle('active',x.dataset.storyFilter==='natural'))
    m.querySelectorAll('[data-story-fit]').forEach(x=>x.classList.toggle('active',x.dataset.storyFit==='cover'))
    const url=URL.createObjectURL(file)
    if(file.type.startsWith('video/')){
      const v=document.createElement('video');v.src=url;v.controls=true;v.autoplay=true;v.muted=true;v.playsInline=true;v.onloadeddata=()=>setTimeout(()=>URL.revokeObjectURL(url),1500);slot.appendChild(v);filters.style.display='none';fits.style.display='none'
    }else{
      const img=document.createElement('img');img.src=url;img.alt='Prévia do Story';img.dataset.fit='cover';img.onload=()=>setTimeout(()=>URL.revokeObjectURL(url),1500);slot.appendChild(img);filters.style.display='flex';fits.style.display='flex';syncPreview()
    }
    m.classList.add('show')
  }

  function cancelEditor(){
    const m=editor();m.classList.remove('show')
    if(editorInput)editorInput.value=''
    editorInput=null;editorFile=null
  }

  function imageToStory(file,filter,fit){
    return new Promise((resolve,reject)=>{
      const img=new Image(),url=URL.createObjectURL(file)
      img.onload=()=>{
        try{
          const W=1080,H=1920,c=document.createElement('canvas');c.width=W;c.height=H
          const ctx=c.getContext('2d',{alpha:false});ctx.fillStyle='#f7f2fb';ctx.fillRect(0,0,W,H);ctx.filter=FILTERS[filter]||'none'
          const iw=img.naturalWidth,ih=img.naturalHeight,scale=fit==='contain'?Math.min(W/iw,H/ih):Math.max(W/iw,H/ih)
          const dw=iw*scale,dh=ih*scale,dx=(W-dw)/2,dy=(H-dh)/2
          ctx.drawImage(img,dx,dy,dw,dh);URL.revokeObjectURL(url)
          c.toBlob(blob=>{
            if(!blob)return reject(new Error('Não foi possível preparar a foto.'))
            const base=(file.name||'story').replace(/\.[^.]+$/,'')
            resolve(new File([blob],`${base}-story.jpg`,{type:'image/jpeg',lastModified:Date.now()}))
          },'image/jpeg',.92)
        }catch(err){URL.revokeObjectURL(url);reject(err)}
      }
      img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Não foi possível abrir a foto.'))}
      img.src=url
    })
  }

  async function publishEditedStory(){
    if(!editorInput||!editorFile)return cancelEditor()
    const input=editorInput,file=editorFile
    try{
      let finalFile=file
      if(file.type.startsWith('image/')&&file.type!=='image/gif')finalFile=await imageToStory(file,editorFilter,editorFit)
      const dt=new DataTransfer();dt.items.add(finalFile);input.files=dt.files
      input.dataset.isaStoryEditorBypass='1'
      editor().classList.remove('show')
      editorInput=null;editorFile=null
      input.dispatchEvent(new Event('change',{bubbles:true}))
      toast('Story preparado. Publicando… 💕')
    }catch(err){toast(err.message||'Não foi possível preparar o Story.')}
  }

  // Intercepta a primeira seleção para editar; a segunda passagem é liberada ao uploader original.
  document.addEventListener('change',e=>{
    const input=e.target?.closest?.('[data-isa-story-input]')
    if(!input)return
    if(input.dataset.isaStoryEditorBypass==='1'){delete input.dataset.isaStoryEditorBypass;return}
    const file=input.files?.[0];if(!file)return
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()
    openEditor(input,file)
  },true)

  // Alguns acessos externos reconstruíam o Story depois que o onclick original era ligado.
  // A captura abaixo reaproveita o próprio handler oficial e garante abertura em qualquer perfil.
  document.addEventListener('click',e=>{
    const btn=e.target?.closest?.('[data-isa-story-author]')
    if(!btn||!btn.closest(ROOTS))return
    const root=btn.closest(ROOTS),author=btn.dataset.isaStoryAuthor||''
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()
    if(typeof btn.onclick==='function'){
      try{btn.onclick.call(btn,e)}catch(err){console.warn('Story:',err)}
      return
    }
    Promise.resolve(window.__ISA_FAMILY_SOCIAL_EXTRAS__?.ensureStories?.(root)).then(()=>{
      const esc=window.CSS?.escape?CSS.escape(author):author.replace(/["\\]/g,'\\$&')
      const fresh=root.querySelector(`[data-isa-story-author="${esc}"]`)
      if(fresh&&typeof fresh.onclick==='function')fresh.onclick.call(fresh,e)
      else toast('Não foi possível abrir este Story agora.')
    }).catch(()=>toast('Não foi possível abrir este Story agora.'))
  },true)

  function normalizeStories(root){
    root?.querySelectorAll?.('.isa-story-person').forEach(b=>{
      b.type='button';b.setAttribute('aria-label',b.dataset.isaStoryAuthor?'Abrir Story':'Adicionar Story')
    })
  }
  function scan(){
    ensureCss();document.querySelectorAll(ROOTS).forEach(normalizeStories)
  }
  function schedule(){clearTimeout(scanTimer);scanTimer=setTimeout(scan,50)}
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true})
  document.addEventListener('isa:friend-access-valid',schedule,{passive:true})
  document.addEventListener('isa:friend-portal-entered',schedule,{passive:true})
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule()})
  ensureCss();scan();[250,900,1800,3200].forEach(ms=>setTimeout(scan,ms))
  window.__ISA_THEME_STORY_LOCK__={scan,openEditor}
})()
