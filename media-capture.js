let activeCleanup=null

function ensureStyles(){
  if(document.getElementById('isaNativeMediaCss'))return
  const s=document.createElement('style');s.id='isaNativeMediaCss';s.textContent=`
  .isa-media-modal{position:fixed;inset:0;z-index:10000;background:rgba(49,36,61,.62);backdrop-filter:blur(8px);display:grid;place-items:center;padding:18px}
  .isa-media-card{width:min(620px,96vw);max-height:94vh;overflow:auto;border-radius:28px;background:linear-gradient(145deg,#fffafd,#f1e8ff);box-shadow:0 30px 80px rgba(55,39,72,.3);padding:18px}
  .isa-media-head{display:flex;align-items:center;gap:10px;margin-bottom:12px}.isa-media-head>div{flex:1}.isa-media-head h3{margin:0;font-size:1.12rem}.isa-media-head p{margin:3px 0 0;color:#88798f;font-size:.82rem}
  .isa-media-close{border:0;background:#fff;border-radius:13px;width:38px;height:38px;font-size:18px;cursor:pointer}
  .isa-camera-stage{position:relative;border-radius:22px;overflow:hidden;background:#211b27;aspect-ratio:4/3;display:grid;place-items:center}.isa-camera-stage video,.isa-camera-stage img{width:100%;height:100%;object-fit:cover}.isa-camera-stage canvas{display:none}
  .isa-media-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.isa-media-actions button{flex:1;min-width:120px;border:0;border-radius:14px;padding:11px 13px;font-weight:900;cursor:pointer;background:#eee5ff;color:#5f4e69}.isa-media-actions .primary{background:linear-gradient(145deg,#c4adf2,#e8a8c8);color:white}.isa-media-actions .danger{background:#ffe4ea;color:#a15268}
  .isa-recorder-stage{padding:25px 16px;border-radius:22px;background:linear-gradient(145deg,#fff5fa,#ece3ff);text-align:center}.isa-mic-orb{width:94px;height:94px;border-radius:50%;margin:0 auto 10px;display:grid;place-items:center;font-size:42px;background:#fff;box-shadow:0 13px 28px rgba(87,65,104,.12)}.isa-mic-orb.recording{animation:isaPulse 1.2s infinite}@keyframes isaPulse{50%{transform:scale(1.06);box-shadow:0 13px 34px rgba(231,118,153,.25)}}
  .isa-rec-time{font-size:1.65rem;font-weight:950;color:#6d5878}.isa-level{height:10px;border-radius:999px;background:#e9def1;overflow:hidden;margin:16px auto 5px;max-width:360px}.isa-level>span{display:block;height:100%;width:4%;background:linear-gradient(90deg,#c2aff0,#ec9ebb);transition:width .08s linear}.isa-rec-status{color:#88798f;font-size:.82rem;min-height:20px}.isa-audio-preview{width:100%;margin-top:15px}
  .isa-media-error{padding:18px;border-radius:18px;background:#fff0f3;color:#985066;text-align:center;font-weight:700}
  .isa-permission-help{margin-top:12px;padding:14px 16px;border-radius:18px;background:#fff;color:#65566d;box-shadow:0 6px 18px rgba(74,55,88,.08);font-size:.86rem;line-height:1.5;text-align:left}.isa-permission-help strong{display:block;margin-bottom:6px;color:#5f4d68}.isa-permission-help ol{margin:8px 0 0;padding-left:21px}.isa-permission-help small{display:block;margin-top:9px;color:#8c7f93}
  `;document.head.appendChild(s)
}
function errorText(err,kind){
  const n=err?.name||''
  if(n==='NotAllowedError'||n==='PermissionDeniedError')return kind==='camera'?'A câmera foi bloqueada pelo navegador.':'O microfone foi bloqueado pelo navegador.'
  if(n==='NotFoundError'||n==='DevicesNotFoundError')return kind==='camera'?'Nenhuma câmera foi encontrada neste aparelho.':'Nenhum microfone foi encontrado neste aparelho.'
  if(n==='NotReadableError'||n==='TrackStartError')return kind==='camera'?'A câmera está sendo usada por outro aplicativo. Feche o outro aplicativo e tente novamente.':'O microfone está sendo usado por outro aplicativo. Feche o outro aplicativo e tente novamente.'
  return kind==='camera'?'Não foi possível abrir a câmera neste aparelho.':'Não foi possível iniciar o gravador neste aparelho.'
}
function isDenied(err){const n=err?.name||'';return n==='NotAllowedError'||n==='PermissionDeniedError'}
async function permissionState(kind){
  try{if(!navigator.permissions?.query)return'unknown';const p=await navigator.permissions.query({name:kind==='camera'?'camera':'microphone'});return p?.state||'unknown'}catch{return'unknown'}
}
function permissionHelp(kind){
  const label=kind==='camera'?'câmera':'microfone'
  return `<div class="isa-permission-help"><strong>🔐 Como liberar ${label} no Edge/Chrome</strong><ol><li>Clique no ícone de <b>cadeado/ajustes</b> ao lado do endereço do Cantinho.</li><li>Abra <b>Permissões para este site</b>.</li><li>Em <b>${kind==='camera'?'Câmera':'Microfone'}</b>, escolha <b>Permitir</b>.</li><li>Volte ao Cantinho e clique em <b>Verificar novamente</b>.</li></ol><small>Se ainda não funcionar, verifique também se o Windows permite que o navegador use o ${label}.</small></div>`
}
function stopTracks(stream){try{stream?.getTracks?.().forEach(t=>t.stop())}catch{}}
function modal(title,subtitle){
  ensureStyles();activeCleanup?.();document.getElementById('isaNativeMediaModal')?.remove()
  const root=document.createElement('div');root.id='isaNativeMediaModal';root.className='isa-media-modal';root.innerHTML=`<section class="isa-media-card"><header class="isa-media-head"><div><h3>${title}</h3><p>${subtitle}</p></div><button class="isa-media-close" type="button" aria-label="Fechar">✕</button></header><div class="isa-media-body"></div></section>`;document.body.appendChild(root);return root
}
function showPermissionError(body,err,kind,retry,finish){
  const denied=isDenied(err)
  body.innerHTML=`<div class="isa-media-error">${errorText(err,kind)}</div>${denied?permissionHelp(kind):''}<div class="isa-media-actions"><button class="primary" data-retry type="button">${denied?'🔄 Verificar novamente':'Tentar novamente'}</button>${denied?'<button data-reload type="button">↻ Recarregar Cantinho</button>':''}<button data-cancel type="button">Fechar</button></div>`
  body.querySelector('[data-retry]').onclick=retry
  body.querySelector('[data-reload]')?.addEventListener('click',()=>location.reload())
  body.querySelector('[data-cancel]').onclick=()=>finish(null)
}

export async function capturePhoto(){
  if(!navigator.mediaDevices?.getUserMedia)throw new Error('Este navegador não oferece acesso direto à câmera.')
  return new Promise(async(resolve,reject)=>{
    let stream=null,closed=false,photoBlob=null,currentDevice=''
    const root=modal('📷 Tirar foto','A câmera abre aqui dentro do Cantinho.');const body=root.querySelector('.isa-media-body')
    const finish=(value=null)=>{if(closed)return;closed=true;stopTracks(stream);activeCleanup=null;root.remove();resolve(value)}
    activeCleanup=()=>finish(null);root.querySelector('.isa-media-close').onclick=()=>finish(null)
    async function open(deviceId=''){
      stopTracks(stream);body.innerHTML='<div class="isa-camera-stage"><div style="color:#fff">Abrindo câmera…</div></div>'
      try{
        stream=await navigator.mediaDevices.getUserMedia({video:deviceId?{deviceId:{exact:deviceId},width:{ideal:1280},height:{ideal:960}}:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:960}},audio:false})
        const video=document.createElement('video');video.autoplay=true;video.muted=true;video.playsInline=true;video.srcObject=stream
        const stage=document.createElement('div');stage.className='isa-camera-stage';stage.appendChild(video)
        const canvas=document.createElement('canvas');stage.appendChild(canvas)
        const actions=document.createElement('div');actions.className='isa-media-actions';actions.innerHTML='<button class="primary" data-cap type="button">📸 Capturar</button><button data-switch type="button">🔄 Trocar câmera</button><button data-cancel type="button">Cancelar</button>'
        body.innerHTML='';body.append(stage,actions);await video.play().catch(()=>{})
        const track=stream.getVideoTracks()[0];currentDevice=track?.getSettings?.().deviceId||deviceId
        const devices=(await navigator.mediaDevices.enumerateDevices().catch(()=>[])).filter(d=>d.kind==='videoinput');actions.querySelector('[data-switch]').style.display=devices.length>1?'':'none'
        actions.querySelector('[data-cancel]').onclick=()=>finish(null)
        actions.querySelector('[data-switch]').onclick=async()=>{const idx=Math.max(0,devices.findIndex(d=>d.deviceId===currentDevice));const next=devices[(idx+1)%devices.length];if(next)await open(next.deviceId)}
        actions.querySelector('[data-cap]').onclick=async()=>{
          const vw=video.videoWidth||1280,vh=video.videoHeight||960,max=1600,scale=Math.min(1,max/Math.max(vw,vh));canvas.width=Math.round(vw*scale);canvas.height=Math.round(vh*scale);canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height)
          photoBlob=await new Promise(r=>canvas.toBlob(r,'image/jpeg',.9));if(!photoBlob)return
          stopTracks(stream);stream=null;const img=document.createElement('img');img.src=URL.createObjectURL(photoBlob);stage.innerHTML='';stage.appendChild(img)
          actions.innerHTML='<button class="primary" data-use type="button">✓ Usar foto</button><button data-again type="button">↻ Tirar outra</button><button data-cancel type="button">Cancelar</button>'
          actions.querySelector('[data-use]').onclick=()=>{const f=new File([photoBlob],`foto-${Date.now()}.jpg`,{type:'image/jpeg'});finish(f)}
          actions.querySelector('[data-again]').onclick=()=>open(currentDevice)
          actions.querySelector('[data-cancel]').onclick=()=>finish(null)
        }
      }catch(err){stopTracks(stream);stream=null;showPermissionError(body,err,'camera',()=>open(deviceId),finish)}
    }
    await open()
  })
}

function bestMime(){
  if(!window.MediaRecorder)return ''
  return ['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/ogg','audio/mp4'].find(x=>MediaRecorder.isTypeSupported?.(x))||''
}
function extFor(type){return /ogg/i.test(type)?'ogg':/mp4|m4a/i.test(type)?'m4a':'webm'}
export async function recordAudio({maxMs=120000}={}){
  if(!navigator.mediaDevices?.getUserMedia)throw new Error('Este navegador não oferece acesso direto ao microfone.')
  if(!window.MediaRecorder)throw new Error('Este navegador não oferece gravação de áudio.')
  return new Promise(async(resolve,reject)=>{
    let stream=null,rec=null,chunks=[],started=0,timer=null,raf=null,ctx=null,source=null,analyser=null,closed=false,lastBlob=null,lastDuration=0
    const root=modal('🎙️ Gravar áudio','Grave, ouça e só depois escolha Enviar.');const body=root.querySelector('.isa-media-body')
    const cleanup=()=>{clearInterval(timer);cancelAnimationFrame(raf);try{if(rec?.state==='recording')rec.stop()}catch{};stopTracks(stream);try{source?.disconnect();analyser?.disconnect();ctx?.close()}catch{};stream=null;rec=null}
    const finish=(value=null)=>{if(closed)return;closed=true;cleanup();activeCleanup=null;root.remove();resolve(value)}
    activeCleanup=()=>finish(null);root.querySelector('.isa-media-close').onclick=()=>finish(null)
    function timeText(ms){const s=Math.floor(ms/1000);return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`}
    function meter(){if(!analyser)return;const arr=new Uint8Array(analyser.fftSize);analyser.getByteTimeDomainData(arr);let sum=0;for(const v of arr){const x=(v-128)/128;sum+=x*x}const rms=Math.sqrt(sum/arr.length);const p=Math.max(4,Math.min(100,Math.round(rms*380)));const el=body.querySelector('.isa-level span');if(el)el.style.width=p+'%';raf=requestAnimationFrame(meter)}
    async function start(){
      cleanup();chunks=[];lastBlob=null;body.innerHTML='<div class="isa-recorder-stage"><div class="isa-mic-orb">🎙️</div><div class="isa-rec-status">Solicitando acesso ao microfone…</div></div>'
      try{
        const state=await permissionState('audio');if(state==='denied'){const e=new DOMException('Microfone bloqueado','NotAllowedError');throw e}
        stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false})
        const mime=bestMime();rec=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);started=Date.now()
        body.innerHTML='<div class="isa-recorder-stage"><div class="isa-mic-orb recording">🎙️</div><div class="isa-rec-time">0:00</div><div class="isa-level"><span></span></div><div class="isa-rec-status">Gravando… fale normalmente.</div></div><div class="isa-media-actions"><button class="primary" data-stop type="button">■ Parar gravação</button><button data-cancel type="button">Cancelar</button></div>'
        try{ctx=new (window.AudioContext||window.webkitAudioContext)();source=ctx.createMediaStreamSource(stream);analyser=ctx.createAnalyser();analyser.fftSize=256;source.connect(analyser);meter()}catch{}
        rec.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)}
        rec.onerror=e=>{const st=body.querySelector('.isa-rec-status');if(st)st.textContent='O gravador encontrou um erro.'}
        rec.onstop=()=>{clearInterval(timer);cancelAnimationFrame(raf);lastDuration=Date.now()-started;lastBlob=new Blob(chunks,{type:rec.mimeType||'audio/webm'});stopTracks(stream);stream=null;preview()}
        rec.start(250);timer=setInterval(()=>{const elapsed=Date.now()-started;const el=body.querySelector('.isa-rec-time');if(el)el.textContent=timeText(elapsed);if(elapsed>=maxMs&&rec?.state==='recording')rec.stop()},250)
        body.querySelector('[data-stop]').onclick=()=>{if(rec?.state==='recording')rec.stop()};body.querySelector('[data-cancel]').onclick=()=>finish(null)
      }catch(err){cleanup();showPermissionError(body,err,'audio',start,finish)}
    }
    function preview(){
      if(!lastBlob?.size){body.innerHTML='<div class="isa-media-error">Não foi possível formar o áudio. Tente gravar novamente.</div><div class="isa-media-actions"><button data-again type="button">Gravar novamente</button><button data-cancel type="button">Fechar</button></div>';body.querySelector('[data-again]').onclick=start;body.querySelector('[data-cancel]').onclick=()=>finish(null);return}
      const url=URL.createObjectURL(lastBlob);body.innerHTML=`<div class="isa-recorder-stage"><div class="isa-mic-orb">🎧</div><div class="isa-rec-time">${timeText(lastDuration)}</div><div class="isa-rec-status">Ouça antes de enviar.</div><audio class="isa-audio-preview" controls src="${url}"></audio></div><div class="isa-media-actions"><button class="primary" data-use type="button">➤ Enviar áudio</button><button data-again type="button">↻ Gravar novamente</button><button data-cancel type="button">Cancelar</button></div>`
      body.querySelector('[data-use]').onclick=()=>{const type=lastBlob.type||'audio/webm';finish({file:new File([lastBlob],`audio-${Date.now()}.${extFor(type)}`,{type}),durationMs:lastDuration})}
      body.querySelector('[data-again]').onclick=()=>{URL.revokeObjectURL(url);start()};body.querySelector('[data-cancel]').onclick=()=>finish(null)
    }
    await start()
  })
}
