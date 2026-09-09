import { CONFIG } from './config.js?v=20260909-access-fix'
import { capturePhoto } from './media-capture.js?v=5-external-camera'
import { capturePhoto } from './media-capture.js?v=5-external-camera'

const $=id=>document.getElementById(id)
const token=window.__ISA_FRIEND_TOKEN__||new URLSearchParams(location.hash.replace(/^#/, '')).get('acesso')||''
let recorder=null,stream=null,chunks=[],startedAt=0,stopTimer=null,busy=false

function toast(text){
  if(typeof window.__ISA_FRIEND_TOAST__==='function')return window.__ISA_FRIEND_TOAST__(text)
  const el=$('friendToast');if(!el)return
  el.textContent=text;el.classList.remove('hidden');clearTimeout(el._extToolsToast);el._extToolsToast=setTimeout(()=>el.classList.add('hidden'),2600)
}
function addStyle(){
  if($('externalChatToolsStyle'))return
  const s=document.createElement('style');s.id='externalChatToolsStyle';s.textContent=`
.friend-avatar.external-profile-avatar{position:relative;overflow:hidden;cursor:pointer;border:0;padding:0;background:linear-gradient(145deg,#fff0f7,#e7ddff);background-size:cover!important;background-position:center!important;color:transparent}.friend-avatar.external-profile-avatar.no-photo{color:inherit}.external-avatar-camera{position:absolute;right:-2px;bottom:-2px;width:23px;height:23px;border-radius:50%;display:grid;place-items:center;background:#fff;color:#6d5678;font-size:12px;box-shadow:0 3px 9px #614a7130;pointer-events:none}.external-audio-btn.is-recording{background:#ffe1e8!important;color:#a7445d!important;box-shadow:0 0 0 3px rgba(225,104,137,.16)!important;animation:externalAudioPulse 1s infinite}@keyframes externalAudioPulse{50%{transform:scale(1.06)}}
@media(max-width:780px){.external-avatar-camera{width:21px;height:21px;font-size:11px}.friend-composer .external-audio-btn,.friend-composer #friendCameraBtn{width:43px!important;height:43px!important;flex:0 0 43px!important}}
`;document.head.appendChild(s)
}
async function apiJson(payload){
  const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/friend-media`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${CONFIG.SUPABASE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(payload),cache:'no-store'})
  let data=null;try{data=await r.json()}catch{}
  if(!r.ok)throw new Error(data?.error||'Não foi possível concluir.')
  return data
}
async function uploadForm(form){
  const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/friend-media`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${CONFIG.SUPABASE_KEY}`},body:form,cache:'no-store'})
  let data=null;try{data=await r.json()}catch{}
  if(!r.ok)throw new Error(data?.error||'Não foi possível enviar.')
  return data
}
function activeConversationId(){return window.__ISA_FRIEND_GET_ACTIVE_CONVERSATION_ID__?.()||null}

async function uploadConversationImage(file){
  const conversationId=activeConversationId();if(!conversationId)throw new Error('Abra uma conversa primeiro.')
  if(!file)throw new Error('Imagem não encontrada.')
  if(file.size>6*1024*1024)throw new Error('Use uma imagem de até 6 MB.')
  if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type))throw new Error('Use JPG, PNG, WEBP ou GIF.')
  const form=new FormData();form.append('token',token);form.append('conversationId',conversationId);form.append('action','message');form.append('file',file)
  await uploadForm(form)
  await window.__ISA_FRIEND_REFRESH_MESSAGES__?.();await window.__ISA_FRIEND_REFRESH_LIST__?.()
}
async function takePhotoNow(){
  if(!activeConversationId())return toast('Abra uma conversa para tirar a foto.')
  try{const file=await capturePhoto();if(!file)return;toast('Enviando foto…');await uploadConversationImage(file);toast('Foto enviada 📷')}catch(e){toast(e.message||'Não foi possível tirar a foto.')}
}
function ensureMediaButtons(){
  const composer=document.querySelector('.friend-composer');if(!composer)return false
  const image=$('friendPhotoBtn'),emoji=$('friendEmojiBtn')
  if(image){image.textContent='🖼️';image.title='Enviar imagem';image.setAttribute('aria-label','Enviar imagem')}
  let camera=$('friendCameraBtn')
  if(!camera){camera=document.createElement('button');camera.id='friendCameraBtn';camera.type='button';camera.className='emoji-btn';camera.textContent='📷';camera.title='Tirar foto';camera.setAttribute('aria-label','Tirar foto');if(image)image.insertAdjacentElement('beforebegin',camera);else composer.prepend(camera)}
  if(camera.dataset.externalCameraBound!=='1'){camera.dataset.externalCameraBound='1';camera.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();takePhotoNow()})}
  let audio=$('friendAudioBtn')
  if(audio&&emoji&&audio.nextElementSibling!==emoji)emoji.insertAdjacentElement('beforebegin',audio)
  return true
}

async function loadAvatar(){
  const avatar=document.querySelector('.friend-avatar');if(!avatar)return
  const ref=String(window.__ISA_FRIEND_PERSON__?.avatarRef||'')
  if(!ref.startsWith('ext-profile:')){avatar.classList.add('no-photo');return}
  try{
    const data=await apiJson({action:'profile_signed_url',token})
    avatar.style.backgroundImage=`url("${String(data.url).replace(/"/g,'%22')}")`
    avatar.textContent='';avatar.classList.remove('no-photo');ensureCameraBadge(avatar)
  }catch{avatar.classList.add('no-photo')}
}
function ensureCameraBadge(avatar){
  let badge=avatar.querySelector('.external-avatar-camera')
  if(!badge){badge=document.createElement('span');badge.className='external-avatar-camera';badge.textContent='📷';avatar.appendChild(badge)}
}
function ensureAvatarControl(){
  const avatar=document.querySelector('.friend-avatar');if(!avatar)return false
  avatar.classList.add('external-profile-avatar');avatar.removeAttribute('aria-hidden');avatar.setAttribute('role','button');avatar.setAttribute('tabindex','0');avatar.title='Trocar foto de perfil';avatar.setAttribute('aria-label','Trocar foto de perfil');ensureCameraBadge(avatar)
  let input=$('externalProfilePhotoInput')
  if(!input){input=document.createElement('input');input.id='externalProfilePhotoInput';input.type='file';input.accept='image/jpeg,image/png,image/webp,image/gif';input.hidden=true;document.body.appendChild(input)}
  if(avatar.dataset.externalAvatarBound!=='1'){
    avatar.dataset.externalAvatarBound='1'
    const choose=()=>input.click()
    avatar.addEventListener('click',choose)
    avatar.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose()}})
    input.onchange=async()=>{
      const file=input.files?.[0];input.value='';if(!file)return
      if(file.size>6*1024*1024)return toast('Use uma foto de até 6 MB.')
      if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type))return toast('Use JPG, PNG, WEBP ou GIF.')
      const form=new FormData();form.append('token',token);form.append('action','profile');form.append('file',file)
      toast('Atualizando foto…')
      try{
        const data=await uploadForm(form)
        avatar.style.backgroundImage=`url("${String(data.url).replace(/"/g,'%22')}")`;avatar.textContent='';avatar.classList.remove('no-photo');ensureCameraBadge(avatar)
        if(window.__ISA_FRIEND_PERSON__)window.__ISA_FRIEND_PERSON__.avatarRef='ext-profile:updated'
        toast('Foto de perfil atualizada 📷')
      }catch(e){toast(e.message||'Não foi possível atualizar a foto.')}
    }
  }
  loadAvatar().catch(()=>{})
  return true
}

function preferredMime(){
  const types=['audio/webm;codecs=opus','audio/mp4','audio/webm','audio/ogg;codecs=opus']
  return types.find(t=>window.MediaRecorder?.isTypeSupported?.(t))||''
}
function stopTracks(){try{stream?.getTracks().forEach(t=>t.stop())}catch{}stream=null;clearTimeout(stopTimer);stopTimer=null}
function resetRecorder(){recorder=null;chunks=[];startedAt=0;stopTracks();const b=$('friendAudioBtn');if(b){b.classList.remove('is-recording');b.textContent='🎙️';b.title='Gravar áudio';b.setAttribute('aria-label','Gravar áudio')}}
async function uploadAudio(blob,durationMs){
  const conversationId=activeConversationId();if(!conversationId)throw new Error('Abra uma conversa antes de gravar o áudio.')
  if(blob.size>12*1024*1024)throw new Error('O áudio ficou grande demais. Grave uma mensagem mais curta.')
  const type=blob.type||'audio/webm',ext=type.includes('mp4')?'m4a':type.includes('ogg')?'ogg':'webm'
  const file=new File([blob],`audio-${Date.now()}.${ext}`,{type})
  const form=new FormData();form.append('token',token);form.append('conversationId',conversationId);form.append('action','message_audio');form.append('durationMs',String(durationMs||0));form.append('file',file)
  await uploadForm(form)
}
async function startRecording(){
  if(busy)return
  if(!activeConversationId())return toast('Abra uma conversa para gravar áudio.')
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)return toast('Este navegador não oferece gravação de áudio.')
  busy=true
  try{
    stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false})
    const mime=preferredMime(),opts=mime?{mimeType:mime}:undefined
    recorder=new MediaRecorder(stream,opts);chunks=[];startedAt=Date.now()
    recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)}
    recorder.onerror=()=>{toast('A gravação foi interrompida.');resetRecorder()}
    recorder.onstop=async()=>{
      const durationMs=Math.max(0,Date.now()-startedAt),type=recorder?.mimeType||chunks[0]?.type||mime||'audio/webm',blob=new Blob(chunks,{type})
      resetRecorder();busy=true
      try{if(blob.size){toast('Enviando áudio…');await uploadAudio(blob,durationMs);await window.__ISA_FRIEND_REFRESH_MESSAGES__?.();await window.__ISA_FRIEND_REFRESH_LIST__?.();toast('Áudio enviado 🎙️')}}catch(e){toast(e.message||'Não foi possível enviar o áudio.')}finally{busy=false}
    }
    recorder.start(250)
    const b=$('friendAudioBtn');if(b){b.classList.add('is-recording');b.textContent='⏹️';b.title='Parar e enviar áudio';b.setAttribute('aria-label','Parar e enviar áudio')}
    toast('Gravando… toque novamente para enviar.')
    stopTimer=setTimeout(()=>{if(recorder?.state==='recording')recorder.stop()},120000)
  }catch(e){resetRecorder();toast(e?.name==='NotAllowedError'?'Libere o microfone no navegador para gravar áudio.':(e.message||'Não foi possível iniciar o microfone.'))}finally{busy=false}
}
function toggleRecording(){if(recorder?.state==='recording'){recorder.stop();return}startRecording()}
function ensureAudioButton(){
  const composer=document.querySelector('.friend-composer');if(!composer)return false
  let b=$('friendAudioBtn')
  if(!b){b=document.createElement('button');b.id='friendAudioBtn';b.type='button';b.className='emoji-btn external-audio-btn';b.textContent='🎙️';b.title='Gravar áudio';b.setAttribute('aria-label','Gravar áudio');const emoji=$('friendEmojiBtn');if(emoji)emoji.insertAdjacentElement('beforebegin',b);else composer.prepend(b)}
  if(b.dataset.externalAudioBound!=='1'){b.dataset.externalAudioBound='1';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();toggleRecording()})}
  return true
}
function ensure(){addStyle();ensureAvatarControl();ensureAudioButton();ensureMediaButtons()}
function start(){
  if(window.__ISA_FRIEND_ACCESS_VALID__===true)ensure()
  document.addEventListener('isa:friend-access-valid',()=>setTimeout(ensure,0))
  document.addEventListener('isa:friend-portal-entered',()=>setTimeout(ensure,0))
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&recorder?.state==='recording')recorder.stop()})
  let tries=0;const timer=setInterval(()=>{ensure();if(++tries>=30)clearInterval(timer)},400)
}
start()
