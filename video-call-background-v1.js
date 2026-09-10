/* Fundo opcional para videochamadas do Isa Chat.
   O padrão continua sendo câmera normal. A pessoa escolhe Desfocar ou faz upload de uma imagem.
   O recorte da pessoa é feito em tempo real no navegador com MediaPipe Selfie Segmentation. */
(function(){
  if(window.__ISA_VIDEO_CALL_BG_V1__)return;window.__ISA_VIDEO_CALL_BG_V1__=true
  const $=id=>document.getElementById(id)
  let sender=null,sourceTrack=null,sourceStream=null,processedTrack=null,hiddenVideo=null,canvas=null,ctx=null,segmenter=null,segmenterPromise=null
  let mode='none',bgImage=null,bgUrl='',raf=0,lastFrame=0,frameBusy=false,internalSwap=false,sessionSeen=false

  function css(){if($('isaCallBgCss'))return;const s=document.createElement('style');s.id='isaCallBgCss';s.textContent=`
  .isa-call-card.video{position:relative}.isa-call-bg-panel{position:absolute;z-index:20;left:50%;bottom:82px;transform:translateX(-50%);width:min(520px,calc(100% - 24px));padding:12px;border:1px solid #ffffff35;border-radius:20px;background:rgba(34,26,40,.94);box-shadow:0 20px 55px #0008;backdrop-filter:blur(18px);display:none}.isa-call-bg-panel.show{display:block}.isa-call-bg-head{display:flex;align-items:center;gap:8px;color:#fff;margin-bottom:9px}.isa-call-bg-head b{flex:1}.isa-call-bg-close{border:0;width:30px;height:30px;border-radius:10px;background:#ffffff18;color:#fff;cursor:pointer}.isa-call-bg-options{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.isa-call-bg-option,.isa-call-bg-upload{min-height:62px;border:1px solid #ffffff28;border-radius:15px;background:#ffffff12;color:#fff;display:grid;place-items:center;text-align:center;padding:8px;font-size:11px;font-weight:900;cursor:pointer}.isa-call-bg-option.active,.isa-call-bg-upload.active{outline:2px solid #e4a7d8;background:#ffffff22}.isa-call-bg-upload input{display:none}.isa-call-bg-preview{margin-top:9px;display:flex;align-items:center;gap:9px;color:#d9cadf;font-size:10px}.isa-call-bg-thumb{width:46px;height:34px;border-radius:9px;background:#ffffff12 center/cover no-repeat;flex:0 0 auto}.isa-call-bg-status{flex:1;line-height:1.35}.isa-call-bg-working{opacity:.72}.isa-call-bg-hidden-video,.isa-call-bg-canvas{position:fixed!important;left:-10000px!important;top:-10000px!important;width:2px!important;height:2px!important;opacity:0!important;pointer-events:none!important}.isa-call-control[data-bg-on="1"]{box-shadow:0 0 0 2px #e7a8db inset!important}
  @media(max-width:620px){.isa-call-bg-panel{position:fixed;left:10px;right:10px;bottom:86px;transform:none;width:auto}.isa-call-bg-options{grid-template-columns:1fr 1fr}.isa-call-bg-upload{grid-column:1/-1}}
  `;document.head.appendChild(s)}
  function toast(text){const t=$('friendToast')||$('toast')||$('isaCallError');if(!t)return;if(t.id==='isaCallError'){t.textContent=text;t.classList.remove('isa-call-hide');return}t.textContent=text;t.classList.remove('hidden');clearTimeout(t._callBg);t._callBg=setTimeout(()=>t.classList.add('hidden'),2700)}
  function isVideoCall(){return !!document.querySelector('#isaActiveCall .isa-call-card.video')}
  function imageCover(c,image){const sw=image.naturalWidth||image.videoWidth||image.width||1,sh=image.naturalHeight||image.videoHeight||image.height||1,dw=c.width,dh=c.height,scale=Math.max(dw/sw,dh/sh),w=sw*scale,h=sh*scale;c.getContext('2d').drawImage(image,(dw-w)/2,(dh-h)/2,w,h)}

  function loadScript(src){return new Promise((resolve,reject)=>{const old=[...document.scripts].find(s=>s.src===src);if(old){if(window.SelfieSegmentation)return resolve();old.addEventListener('load',resolve,{once:true});old.addEventListener('error',reject,{once:true});return}const s=document.createElement('script');s.src=src;s.async=true;s.crossOrigin='anonymous';s.onload=resolve;s.onerror=()=>reject(new Error('Não foi possível carregar o recorte de fundo.'));document.head.appendChild(s)})}
  async function getSegmenter(){
    if(segmenter)return segmenter
    if(segmenterPromise)return segmenterPromise
    segmenterPromise=(async()=>{
      const base='https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/'
      await loadScript(base+'selfie_segmentation.js')
      if(typeof window.SelfieSegmentation!=='function')throw new Error('Recorte de fundo indisponível neste navegador.')
      const s=new window.SelfieSegmentation({locateFile:file=>base+file})
      s.setOptions({modelSelection:1,selfieMode:true})
      s.onResults(drawResults);segmenter=s;return s
    })().catch(e=>{segmenterPromise=null;throw e})
    return segmenterPromise
  }
  function ensureProcessor(){
    if(!hiddenVideo){hiddenVideo=document.createElement('video');hiddenVideo.className='isa-call-bg-hidden-video';hiddenVideo.autoplay=true;hiddenVideo.muted=true;hiddenVideo.playsInline=true;document.body.appendChild(hiddenVideo)}
    if(!canvas){canvas=document.createElement('canvas');canvas.className='isa-call-bg-canvas';document.body.appendChild(canvas);ctx=canvas.getContext('2d',{alpha:false})}
    const mobile=matchMedia('(max-width:620px)').matches;canvas.width=mobile?480:720;canvas.height=mobile?270:405
  }
  function drawResults(results){
    if(!ctx||!canvas||mode==='none')return
    const w=canvas.width,h=canvas.height
    ctx.save();ctx.clearRect(0,0,w,h)
    ctx.drawImage(results.segmentationMask,0,0,w,h)
    ctx.globalCompositeOperation='source-in';ctx.filter='none';ctx.drawImage(results.image,0,0,w,h)
    ctx.globalCompositeOperation='destination-over'
    if(mode==='image'&&bgImage){ctx.filter='none';imageCover(canvas,bgImage)}
    else{ctx.filter='blur(20px)';ctx.drawImage(results.image,-24,-24,w+48,h+48);ctx.filter='none'}
    ctx.restore()
  }
  async function loop(ts){
    if(mode==='none'||!hiddenVideo||!segmenter||!isVideoCall())return
    raf=requestAnimationFrame(loop);if(frameBusy||ts-lastFrame<55||hiddenVideo.readyState<2)return;lastFrame=ts;frameBusy=true
    try{await segmenter.send({image:hiddenVideo})}catch(e){console.warn('Fundo da videochamada:',e)}finally{frameBusy=false}
  }
  async function setSenderTrack(track){if(!sender||!track)return false;internalSwap=true;try{await sender.replaceTrack(track);return true}finally{internalSwap=false}}
  function localPreview(track){const v=$('isaLocalVideo');if(!v||!track)return;v.srcObject=new MediaStream([track]);v.play().catch(()=>{})}
  async function startEffect(nextMode){
    if(!sender||!sourceTrack||!isVideoCall())return toast('A câmera ainda está iniciando.')
    mode=nextMode;updateUi();ensureProcessor()
    try{
      await getSegmenter();hiddenVideo.srcObject=new MediaStream([sourceTrack]);await hiddenVideo.play().catch(()=>{})
      if(processedTrack){try{processedTrack.stop()}catch{};processedTrack=null}
      const out=canvas.captureStream(matchMedia('(max-width:620px)').matches?15:18);processedTrack=out.getVideoTracks()[0];processedTrack.contentHint='motion'
      await setSenderTrack(processedTrack);localPreview(processedTrack);cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);updateUi();toast(nextMode==='image'?'Fundo aplicado à videochamada ✨':'Fundo desfocado ✨')
    }catch(e){console.warn(e);await clearEffect();toast(e.message||'Não foi possível aplicar o fundo.')}
  }
  async function clearEffect(){
    mode='none';cancelAnimationFrame(raf);raf=0;frameBusy=false
    if(processedTrack){try{processedTrack.stop()}catch{};processedTrack=null}
    if(sender&&sourceTrack)try{await setSenderTrack(sourceTrack)}catch{}
    if(sourceTrack)localPreview(sourceTrack);updateUi()
  }
  function loadBackground(file){
    if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type))return toast('Use JPG, PNG ou WEBP.');if(file.size>12*1024*1024)return toast('A imagem pode ter até 12 MB.')
    if(bgUrl)URL.revokeObjectURL(bgUrl);bgUrl=URL.createObjectURL(file);const img=new Image();img.onload=()=>{bgImage=img;startEffect('image')};img.onerror=()=>toast('Não foi possível abrir esta imagem.');img.src=bgUrl;const status=$('isaCallBgStatus');if(status)status.textContent='Preparando o recorte automático da pessoa…';updateUi()
  }
  function updateUi(){
    const btn=$('isaCallBackgroundBtn');if(btn)btn.dataset.bgOn=mode==='none'?'0':'1'
    document.querySelectorAll('[data-call-bg]').forEach(b=>b.classList.toggle('active',b.dataset.callBg===mode))
    const up=$('isaCallBgUpload');if(up)up.classList.toggle('active',mode==='image')
    const thumb=$('isaCallBgThumb');if(thumb)thumb.style.backgroundImage=bgUrl?`url("${bgUrl}")`:''
    const st=$('isaCallBgStatus');if(st)st.textContent=mode==='image'?'Imagem escolhida • recorte automático ativo':mode==='blur'?'Seu ambiente está desfocado; você continua em destaque.':'Sem fundo virtual • câmera normal.'
  }
  function ensureUi(){
    css();const card=document.querySelector('#isaActiveCall .isa-call-card.video'),controls=card?.querySelector('.isa-call-controls');if(!card||!controls)return false;sessionSeen=true
    if(!$('isaCallBackgroundBtn')){const b=document.createElement('button');b.id='isaCallBackgroundBtn';b.type='button';b.className='isa-call-control';b.textContent='🖼️ Fundo';b.title='Fundo opcional da videochamada';const sw=$('isaSwitch');sw?.insertAdjacentElement('afterend',b);if(!b.parentNode)controls.insertBefore(b,controls.lastElementChild);b.onclick=()=>{ensurePanel();$('isaCallBgPanel')?.classList.toggle('show')}}
    ensurePanel();updateUi();return true
  }
  function ensurePanel(){
    const card=document.querySelector('#isaActiveCall .isa-call-card.video');if(!card||$('isaCallBgPanel'))return
    const p=document.createElement('div');p.id='isaCallBgPanel';p.className='isa-call-bg-panel';p.innerHTML=`<div class="isa-call-bg-head"><b>🖼️ Fundo da videochamada</b><button id="isaCallBgClose" class="isa-call-bg-close" type="button">✕</button></div><div class="isa-call-bg-options"><button type="button" class="isa-call-bg-option" data-call-bg="none">📷<br>Sem fundo</button><button type="button" class="isa-call-bg-option" data-call-bg="blur">✨<br>Desfocar</button><label id="isaCallBgUpload" class="isa-call-bg-upload">📁<br>Enviar imagem<input id="isaCallBgInput" type="file" accept="image/jpeg,image/png,image/webp"></label></div><div class="isa-call-bg-preview"><div id="isaCallBgThumb" class="isa-call-bg-thumb"></div><span id="isaCallBgStatus" class="isa-call-bg-status">Sem fundo virtual • câmera normal.</span></div>`;card.appendChild(p)
    $('isaCallBgClose').onclick=()=>p.classList.remove('show');p.querySelector('[data-call-bg="none"]').onclick=clearEffect;p.querySelector('[data-call-bg="blur"]').onclick=()=>startEffect('blur');$('isaCallBgInput').onchange=e=>{const f=e.target.files?.[0];e.target.value='';if(f)loadBackground(f)}
  }
  function captureSender(track,stream,s){if(track?.kind!=='video'||!isVideoCall())return;sender=s;sourceTrack=track;sourceStream=stream||new MediaStream([track]);setTimeout(ensureUi,0)}
  function hookRtc(){
    if(window.__ISA_VIDEO_CALL_BG_RTC_HOOK__)return;window.__ISA_VIDEO_CALL_BG_RTC_HOOK__=true
    const add=RTCPeerConnection?.prototype?.addTrack;if(add)RTCPeerConnection.prototype.addTrack=function(track,...streams){const s=add.call(this,track,...streams);captureSender(track,streams[0],s);return s}
    const replace=RTCRtpSender?.prototype?.replaceTrack;if(replace)RTCRtpSender.prototype.replaceTrack=async function(track){const wasInternal=internalSwap&&this===sender;const r=await replace.call(this,track);if(this===sender&&track?.kind==='video'&&!wasInternal&&track!==processedTrack){sourceTrack=track;sourceStream=new MediaStream([track]);if(mode!=='none')setTimeout(()=>startEffect(mode),120)}return r}
  }
  function cleanupSession(){if(!sessionSeen)return;sessionSeen=false;cancelAnimationFrame(raf);raf=0;frameBusy=false;if(processedTrack)try{processedTrack.stop()}catch{};processedTrack=null;sender=null;sourceTrack=null;sourceStream=null;mode='none';if(hiddenVideo)hiddenVideo.srcObject=null}
  hookRtc();css();new MutationObserver(()=>{if(isVideoCall())ensureUi();else cleanupSession()}).observe(document.documentElement,{childList:true,subtree:true});setInterval(()=>{if(isVideoCall())ensureUi()},700)
  window.__ISA_VIDEO_CALL_BACKGROUND__={open:()=>{ensureUi();$('isaCallBgPanel')?.classList.add('show')},clear:clearEffect,applyBlur:()=>startEffect('blur')}
})();