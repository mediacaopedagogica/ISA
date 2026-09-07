let activeCleanup=null

function ensureStyles(){
  if(document.getElementById('isaNativeMediaCss'))return
  const s=document.createElement('style')
  s.id='isaNativeMediaCss'
  s.textContent=`
  .isa-media-modal{position:fixed;inset:0;z-index:10000;background:rgba(49,36,61,.62);backdrop-filter:blur(8px);display:grid;place-items:center;padding:18px}
  .isa-media-card{width:min(620px,96vw);max-height:94vh;overflow:auto;border-radius:28px;background:linear-gradient(145deg,#fffafd,#f1e8ff);box-shadow:0 30px 80px rgba(55,39,72,.3);padding:18px}
  .isa-media-head{display:flex;align-items:center;gap:10px;margin-bottom:12px}.isa-media-head>div{flex:1}.isa-media-head h3{margin:0;font-size:1.12rem}.isa-media-head p{margin:3px 0 0;color:#88798f;font-size:.82rem}
  .isa-media-close{border:0;background:#fff;border-radius:13px;width:38px;height:38px;font-size:18px;cursor:pointer}
  .isa-camera-stage{position:relative;border-radius:22px;overflow:hidden;background:#211b27;aspect-ratio:4/3;display:grid;place-items:center}.isa-camera-stage video,.isa-camera-stage img{width:100%;height:100%;object-fit:cover}.isa-camera-stage canvas{display:none}
  .isa-media-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.isa-media-actions button{flex:1;min-width:120px;border:0;border-radius:14px;padding:11px 13px;font-weight:900;cursor:pointer;background:#eee5ff;color:#5f4e69}.isa-media-actions .primary{background:linear-gradient(145deg,#c4adf2,#e8a8c8);color:#fff}.isa-media-actions .danger{background:#ffe4ea;color:#a15268}
  .isa-recorder-stage{padding:26px 16px;border-radius:22px;background:linear-gradient(145deg,#fff5fa,#ece3ff);text-align:center}.isa-mic-orb{width:100px;height:100px;border-radius:50%;margin:0 auto 12px;display:grid;place-items:center;font-size:44px;background:#fff;box-shadow:0 13px 28px rgba(87,65,104,.12)}.isa-mic-orb.recording{animation:isaPulse 1.2s infinite}.isa-mic-orb.paused{opacity:.62}@keyframes isaPulse{50%{transform:scale(1.06);box-shadow:0 13px 34px rgba(231,118,153,.25)}}
  .isa-rec-time{font-size:1.9rem;font-weight:950;color:#6d5878}.isa-level{height:11px;border-radius:999px;background:#e9def1;overflow:hidden;margin:16px auto 7px;max-width:380px}.isa-level>span{display:block;height:100%;width:4%;background:linear-gradient(90deg,#c2aff0,#ec9ebb);transition:width .08s linear}.isa-rec-status{color:#88798f;font-size:.85rem;min-height:22px}.isa-mic-label{margin-top:6px;color:#9a8ca2;font-size:.76rem}.isa-audio-preview{width:100%;margin-top:16px}.isa-media-error{padding:18px;border-radius:18px;background:#fff0f3;color:#985066;text-align:left;font-weight:700}.isa-help{margin-top:12px;padding:14px 16px;border-radius:18px;background:#fff;color:#65566d;box-shadow:0 6px 18px rgba(74,55,88,.08);font-size:.85rem;line-height:1.5}.isa-help strong{display:block;margin-bottom:6px}
  `
  document.head.appendChild(s)
}

function stopTracks(stream){try{stream?.getTracks?.().forEach(t=>t.stop())}catch{}}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]))}
function modal(title,subtitle){
  ensureStyles();activeCleanup?.();document.getElementById('isaNativeMediaModal')?.remove()
  const root=document.createElement('div')
  root.id='isaNativeMediaModal';root.className='isa-media-modal'
  root.innerHTML=`<section class="isa-media-card"><header class="isa-media-head"><div><h3>${title}</h3><p>${subtitle}</p></div><button class="isa-media-close" type="button" aria-label="Fechar">✕</button></header><div class="isa-media-body"></div></section>`
  document.body.appendChild(root);return root
}
function mediaError(err,kind){
  const n=err?.name||''
  if(n==='NotAllowedError'||n==='PermissionDeniedError')return kind==='camera'?'A câmera não pôde ser aberta. Verifique a permissão do site e do Windows.':'O Cantinho não conseguiu abrir o microfone. A permissão do site pode estar liberada, mas o Windows ou outro aplicativo pode estar impedindo o acesso.'
  if(n==='NotFoundError'||n==='DevicesNotFoundError')return kind==='camera'?'Nenhuma câmera foi encontrada.':'Nenhum microfone foi encontrado.'
  if(n==='NotReadableError'||n==='TrackStartError')return kind==='camera'?'A câmera está ocupada por outro aplicativo.':'O microfone está ocupado por outro aplicativo.'
  return kind==='camera'?'Não foi possível abrir a câmera.':'Não foi possível iniciar a gravação.'
}
function showError(body,err,kind,retry,finish){
  body.innerHTML=`<div class="isa-media-error">${mediaError(err,kind)}</div><div class="isa-help"><strong>O que tentar</strong>${kind==='audio'?'<div>1. Feche Teams, Meet, Discord ou outro gravador.<br>2. Confirme no Windows que aplicativos da área de trabalho podem usar o microfone.<br>3. Clique em <b>Testar novamente</b>.</div>':'<div>Feche aplicativos que estejam usando a câmera e tente novamente.</div>'}</div><div class="isa-media-actions"><button class="primary" data-retry type="button">Testar novamente</button><button data-cancel type="button">Fechar</button></div>`
  body.querySelector('[data-retry]').onclick=retry
  body.querySelector('[data-cancel]').onclick=()=>finish(null)
}

export async function capturePhoto(){
  if(!navigator.mediaDevices?.getUserMedia)throw new Error('Este navegador não oferece acesso direto à câmera.')
  return new Promise(async resolve=>{
    let stream=null,closed=false,photoBlob=null,currentDevice=''
    const root=modal('📷 Tirar foto','A câmera abre aqui dentro do Cantinho.');const body=root.querySelector('.isa-media-body')
    const finish=(value=null)=>{if(closed)return;closed=true;stopTracks(stream);activeCleanup=null;root.remove();resolve(value)}
    activeCleanup=()=>finish(null);root.querySelector('.isa-media-close').onclick=()=>finish(null)
    async function open(deviceId=''){
      stopTracks(stream);body.innerHTML='<div class="isa-camera-stage"><div style="color:#fff">Abrindo câmera…</div></div>'
      try{
        stream=await navigator.mediaDevices.getUserMedia({video:deviceId?{deviceId:{exact:deviceId},width:{ideal:1280},height:{ideal:960}}:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:960}},audio:false})
        const video=document.createElement('video');video.autoplay=true;video.muted=true;video.playsInline=true;video.srcObject=stream
        const stage=document.createElement('div');stage.className='isa-camera-stage';stage.appendChild(video);const canvas=document.createElement('canvas');stage.appendChild(canvas)
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
          actions.querySelector('[data-use]').onclick=()=>finish(new File([photoBlob],`foto-${Date.now()}.jpg`,{type:'image/jpeg'}))
          actions.querySelector('[data-again]').onclick=()=>open(currentDevice);actions.querySelector('[data-cancel]').onclick=()=>finish(null)
        }
      }catch(err){stopTracks(stream);stream=null;showError(body,err,'camera',()=>open(deviceId),finish)}
    }
    await open()
  })
}

function bestMime(){if(!window.MediaRecorder)return'';return ['audio/webm','audio/ogg','audio/mp4','audio/webm;codecs=opus','audio/ogg;codecs=opus'].find(x=>MediaRecorder.isTypeSupported?.(x))||''}
function plainAudioMime(type){const raw=String(type||'').trim().toLowerCase();if(raw.startsWith('audio/ogg'))return'audio/ogg';if(raw.startsWith('audio/mp4')||raw.startsWith('audio/m4a'))return'audio/mp4';return'audio/webm'}
function extFor(type){return /ogg/i.test(type)?'ogg':/mp4|m4a/i.test(type)?'m4a':'webm'}
function timeText(ms){const s=Math.max(0,Math.floor(ms/1000));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`}

export async function recordAudio({maxMs=120000}={}){
  if(!navigator.mediaDevices?.getUserMedia)throw new Error('Este navegador não oferece acesso direto ao microfone.')
  if(!window.MediaRecorder)throw new Error('Este navegador não oferece gravação de áudio.')
  return new Promise(resolve=>{
    let stream=null,rec=null,chunks=[],closed=false,timer=null,raf=null,ctx=null,source=null,analyser=null
    let startedAt=0,pausedAt=0,pausedTotal=0,lastBlob=null,lastDuration=0
    const root=modal('🎙️ Gravador do Cantinho','Grave aqui, ouça e só depois envie.');const body=root.querySelector('.isa-media-body')
    const stopMeter=()=>{cancelAnimationFrame(raf);try{source?.disconnect();analyser?.disconnect();ctx?.close()}catch{};source=null;analyser=null;ctx=null}
    const cleanup=()=>{clearInterval(timer);stopMeter();try{if(rec?.state==='recording'||rec?.state==='paused')rec.stop()}catch{};stopTracks(stream);stream=null;rec=null}
    const finish=(value=null)=>{if(closed)return;closed=true;cleanup();activeCleanup=null;root.remove();resolve(value)}
    activeCleanup=()=>finish(null);root.querySelector('.isa-media-close').onclick=()=>finish(null)

    function elapsed(){return Date.now()-startedAt-pausedTotal-(pausedAt?Date.now()-pausedAt:0)}
    function meter(){if(!analyser)return;const arr=new Uint8Array(analyser.fftSize);analyser.getByteTimeDomainData(arr);let sum=0;for(const v of arr){const x=(v-128)/128;sum+=x*x}const rms=Math.sqrt(sum/arr.length),p=Math.max(4,Math.min(100,Math.round(rms*380)));const el=body.querySelector('.isa-level span');if(el)el.style.width=p+'%';raf=requestAnimationFrame(meter)}

    async function begin(){
      chunks=[];lastBlob=null;pausedTotal=0;pausedAt=0
      body.innerHTML='<div class="isa-recorder-stage"><div class="isa-mic-orb">🎙️</div><div class="isa-rec-status">Abrindo o microfone…</div></div>'
      try{
        stream=await navigator.mediaDevices.getUserMedia({audio:true,video:false})
        const track=stream.getAudioTracks()[0],label=track?.label||'Microfone do aparelho',mime=bestMime()
        rec=new MediaRecorder(stream,mime?{mimeType:mime}:undefined)
        startedAt=Date.now()
        body.innerHTML=`<div class="isa-recorder-stage"><div class="isa-mic-orb recording">🎙️</div><div class="isa-rec-time">0:00</div><div class="isa-level"><span></span></div><div class="isa-rec-status">Gravando… fale normalmente.</div><div class="isa-mic-label">${esc(label)}</div></div><div class="isa-media-actions"><button data-pause type="button">⏸ Pausar</button><button class="primary" data-stop type="button">■ Parar</button><button data-cancel type="button">Cancelar</button></div>`
        try{ctx=new (window.AudioContext||window.webkitAudioContext)();source=ctx.createMediaStreamSource(stream);analyser=ctx.createAnalyser();analyser.fftSize=256;source.connect(analyser);meter()}catch{}
        rec.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)}
        rec.onerror=()=>{const st=body.querySelector('.isa-rec-status');if(st)st.textContent='O gravador encontrou um erro.'}
        rec.onstop=()=>{
          clearInterval(timer);stopMeter();lastDuration=elapsed();lastBlob=new Blob(chunks,{type:plainAudioMime(rec.mimeType||'audio/webm')});stopTracks(stream);stream=null;preview()
        }
        rec.start(250)
        timer=setInterval(()=>{const ms=elapsed(),el=body.querySelector('.isa-rec-time');if(el)el.textContent=timeText(ms);if(ms>=maxMs&&(rec?.state==='recording'||rec?.state==='paused'))rec.stop()},200)
        body.querySelector('[data-pause]').onclick=()=>{
          const b=body.querySelector('[data-pause]'),orb=body.querySelector('.isa-mic-orb'),st=body.querySelector('.isa-rec-status')
          if(rec?.state==='recording'){rec.pause();pausedAt=Date.now();b.textContent='▶ Continuar';orb.classList.remove('recording');orb.classList.add('paused');st.textContent='Gravação pausada.'}
          else if(rec?.state==='paused'){rec.resume();pausedTotal+=Date.now()-pausedAt;pausedAt=0;b.textContent='⏸ Pausar';orb.classList.remove('paused');orb.classList.add('recording');st.textContent='Gravando… fale normalmente.'}
        }
        body.querySelector('[data-stop]').onclick=()=>{if(rec?.state==='recording'||rec?.state==='paused')rec.stop()}
        body.querySelector('[data-cancel]').onclick=()=>finish(null)
      }catch(err){stopTracks(stream);stream=null;showError(body,err,'audio',ready,finish)}
    }

    function ready(){
      body.innerHTML='<div class="isa-recorder-stage"><div class="isa-mic-orb">🎙️</div><div class="isa-rec-time">0:00</div><div class="isa-rec-status">Pronto para gravar.</div></div><div class="isa-media-actions"><button class="primary" data-start type="button">● Iniciar gravação</button><button data-cancel type="button">Cancelar</button></div>'
      body.querySelector('[data-start]').onclick=begin
      body.querySelector('[data-cancel]').onclick=()=>finish(null)
    }

    function preview(){
      if(!lastBlob?.size){body.innerHTML='<div class="isa-media-error">Não foi possível formar o áudio.</div><div class="isa-media-actions"><button class="primary" data-again type="button">Gravar novamente</button><button data-cancel type="button">Fechar</button></div>';body.querySelector('[data-again]').onclick=ready;body.querySelector('[data-cancel]').onclick=()=>finish(null);return}
      const url=URL.createObjectURL(lastBlob)
      body.innerHTML=`<div class="isa-recorder-stage"><div class="isa-mic-orb">🎧</div><div class="isa-rec-time">${timeText(lastDuration)}</div><div class="isa-rec-status">Ouça antes de enviar.</div><audio class="isa-audio-preview" controls src="${url}"></audio></div><div class="isa-media-actions"><button class="primary" data-use type="button">➤ Enviar áudio</button><button data-again type="button">↻ Gravar novamente</button><button data-cancel type="button">Cancelar</button></div>`
      body.querySelector('[data-use]').onclick=()=>{const type=plainAudioMime(lastBlob.type||'audio/webm');URL.revokeObjectURL(url);finish({file:new File([lastBlob],`audio-${Date.now()}.${extFor(type)}`,{type}),durationMs:lastDuration})}
      body.querySelector('[data-again]').onclick=()=>{URL.revokeObjectURL(url);ready()}
      body.querySelector('[data-cancel]').onclick=()=>{URL.revokeObjectURL(url);finish(null)}
    }

    ready()
  })
}