import { capturePhoto, recordAudio } from './media-capture.js?v=3'

const $=id=>document.getElementById(id)
function toast(text){const t=$('toast')||$('friendToast');if(!t)return alert(text);t.textContent=text;t.classList.remove('hidden');clearTimeout(t._native);t._native=setTimeout(()=>t.classList.add('hidden'),2600)}
function assignFile(input,file){
  if(!input||!file)return false
  try{const dt=new DataTransfer();dt.items.add(file);input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));return true}catch(e){console.error('Arquivo capturado:',e);return false}
}
async function nativeCameraForFamily(menu){
  menu?.classList.add('hidden')
  try{const file=await capturePhoto();if(!file)return;const input=$('photoInput');if(!assignFile(input,file))toast('Não foi possível preparar a foto para envio.')}catch(e){toast(e.message||'Não foi possível abrir a câmera.')}
}
async function nativeRecorderForFamily(menu){
  menu?.classList.add('hidden')
  try{const result=await recordAudio();if(!result?.file)return;const input=$('familyAudioInput');if(!input){toast('O gravador ainda está iniciando. Tente novamente.');return}input.dataset.nativeDuration=String(result.durationMs||'');if(!assignFile(input,result.file))toast('Não foi possível preparar o áudio para envio.')}catch(e){toast(e.message||'Não foi possível iniciar o gravador.')}
}
function patchFamily(){
  const menu=$('groupPlusMenu');if(!menu)return false
  const camera=menu.querySelector('[data-family-media="camera"]'),record=menu.querySelector('[data-family-media="record"]')
  if(camera&&camera.dataset.native!=='1'){camera.dataset.native='1';camera.textContent='📷 Tirar foto';camera.onclick=e=>{e.stopPropagation();nativeCameraForFamily(menu)}}
  if(record&&record.dataset.native!=='1'){record.dataset.native='1';record.textContent='🎙️ Gravar áudio';record.onclick=e=>{e.stopPropagation();nativeRecorderForFamily(menu)}}
  return !!camera&&!!record
}
function patchFriend(){
  const media=window.__FRIEND_MEDIA__;if(!media||media.__nativeCapture)return false
  media.__nativeCapture=true
  media.takePhoto=async()=>{try{const file=await capturePhoto();if(file)await media.sendPhoto(file)}catch(e){toast(e.message||'Não foi possível abrir a câmera.')}}
  media.startRecording=async()=>{if(media.isFriend?.())return toast('Áudio fica disponível somente para a família.');try{const result=await recordAudio();if(result?.file)await media.sendAudio(result.file,result.durationMs)}catch(e){toast(e.message||'Não foi possível iniciar o gravador.')}}
  return true
}
function patch(){patchFamily();patchFriend()}
patch();setTimeout(patch,180);setTimeout(patch,700);setTimeout(patch,1800)
