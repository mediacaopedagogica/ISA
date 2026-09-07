import { CONFIG } from './config.js'

const $=id=>document.getElementById(id)
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const token=new URLSearchParams(location.hash.replace(/^#/, '')).get('acesso')||''
let friend=null,conversations=[],activeConversation=null,messageTimer=null,listTimer=null,presenceTimer=null,recording=null,recordTimer=null
const mediaCache=new Map()

async function rpc(name,args={},opts={}){
  const r=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${CONFIG.SUPABASE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(args),cache:'no-store',keepalive:!!opts.keepalive})
  let data=null;try{data=await r.json()}catch{}
  if(!r.ok)throw new Error(data?.message||data?.hint||data?.details||'Não foi possível acessar.')
  return data
}
async function mediaJson(payload){
  const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/friend-media`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${CONFIG.SUPABASE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(payload),cache:'no-store'})
  let data=null;try{data=await r.json()}catch{}
  if(!r.ok)throw new Error(data?.error||'Não foi possível carregar a mídia.')
  return data
}
async function mediaUpload(file,action='message',durationMs=null){
  if(!activeConversation)throw new Error('Abra uma conversa primeiro.')
  const form=new FormData();form.append('token',token);form.append('conversationId',activeConversation.id);form.append('action',action);form.append('file',file);if(durationMs)form.append('durationMs',String(durationMs))
  const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/friend-media`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${CONFIG.SUPABASE_KEY}`},body:form})
  let data=null;try{data=await r.json()}catch{}
  if(!r.ok)throw new Error(data?.error||'Não foi possível enviar a mídia.')
  return data
}
function toast(text){const el=$('friendToast');if(!el)return;el.textContent=text;el.classList.remove('hidden');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.add('hidden'),2400)}
function fmtTime(ts){return new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit'}).format(new Date(ts))}
function isFriend(){return /amiga/i.test(friend?.relationship||'')}

async function bootstrap(silent=false){
  if(!token){$('friendGateTitle').textContent='Este link não é válido';$('friendGateText').textContent='Peça um novo acesso à responsável da Isa.';return}
  try{
    const data=await rpc('friend_portal_bootstrap',{p_token:token});friend=data.friend;conversations=data.conversations||[]
    if(!silent){$('friendGateTitle').textContent=`Oi, ${friend.name}! 💜`;$('friendGateText').textContent='Este é seu acesso pessoal ao Cantinho da Isa.';$('friendGateInfo').classList.remove('hidden');$('friendEnterBtn').classList.remove('hidden')}
    if($('friendChat')&&!$('friendChat').classList.contains('hidden'))renderConversationList()
  }catch(e){if(!silent){$('friendGateTitle').textContent='Acesso indisponível';$('friendGateText').textContent='Este link pode ter sido revogado ou substituído.';$('friendGateError').textContent=e.message}}
}
function renderConversationList(){
  $('friendName').textContent=friend?.name||'Família'
  $('friendConversationList').innerHTML=conversations.map(c=>`<button class="friend-conversation ${activeConversation?.id===c.id?'active':''}" data-friend-conv="${c.id}"><strong>${c.type==='group'?'👥 ':''}${esc(c.title||'Isa')}</strong><small>${esc(c.preview||(c.type==='direct'?'Conversa direta com a Isa':(c.participants||[]).join(', ')))}</small></button>`).join('')||'<p class="muted">Nenhuma conversa disponível.</p>'
  document.querySelectorAll('[data-friend-conv]').forEach(b=>b.onclick=()=>openConversation(b.dataset.friendConv))
}
async function enterPortal(){
  $('friendEnterBtn').disabled=true
  try{await rpc('friend_portal_presence',{p_token:token,p_online:true});$('friendGate').classList.add('hidden');$('friendChat').classList.remove('hidden');renderConversationList();startTimers();const direct=conversations.find(c=>c.type==='direct');if(direct)await openConversation(direct.id)}
  catch(e){$('friendGateError').textContent=e.message}finally{$('friendEnterBtn').disabled=false}
}
async function refreshConversations(){try{await bootstrap(true);renderConversationList()}catch{}}
async function openConversation(id){
  const c=conversations.find(x=>x.id===id);if(!c)return;activeConversation=c;window.__FRIEND_ACTIVE_CONV_TYPE__=c.type
  $('friendEmpty').classList.add('hidden');$('friendThread').classList.remove('hidden');$('friendChat').classList.add('thread-open');$('friendThreadTitle').textContent=c.title||'Isa'
  $('friendThreadSubtitle').textContent=c.type==='group'?'Grupo criado pela Isa • atividades e trabalhos':isFriend()?'Conversa direta com a Isa • somente texto':'Conversa direta com a Isa'
  $('friendPhotoBtn').classList.toggle('hidden',c.type!=='group');renderConversationList();await loadMessages(true)
}
async function getMediaUrl(messageId){const cached=mediaCache.get(messageId);if(cached&&cached.until>Date.now())return cached.url;const data=await mediaJson({action:'signed_url',token,messageId});mediaCache.set(messageId,{url:data.url,until:Date.now()+240000});return data.url}
async function hydrateFriendMedia(){
  for(const node of [...document.querySelectorAll('[data-friend-photo],[data-friend-audio]')]){
    if(node.dataset.loaded==='1')continue
    const id=node.dataset.friendPhoto||node.dataset.friendAudio
    try{const url=await getMediaUrl(id);if(node.dataset.friendAudio){node.innerHTML=`<audio class="friend-audio" controls preload="metadata" src="${url}"></audio>`}else node.innerHTML=`<img class="friend-photo" src="${url}" alt="Imagem enviada">`;node.dataset.loaded='1'}
    catch{node.innerHTML=`<div class="friend-photo-note">${node.dataset.friendAudio?'🎙️ Áudio':'📷 Imagem'} indisponível ou expirado.</div>`;node.dataset.loaded='1'}
  }
}
async function loadMessages(forceScroll=false){
  if(!activeConversation)return
  try{
    const list=await rpc('friend_portal_messages',{p_token:token,p_conversation_id:activeConversation.id}),box=$('friendMessages'),atBottom=box.scrollHeight-box.scrollTop-box.clientHeight<90
    box.innerHTML=(list||[]).map(m=>{
      const mine=m.senderId===friend.id,read=mine?(Number(m.readCount||0)>0?(activeConversation.type==='direct'?'✓✓ Leu sua mensagem':`✓✓ Lida por ${m.readCount}`):'✓ Enviada'):''
      let content='';if(m.kind==='text')content=`<div>${esc(m.body)}</div>`;else if(m.kind==='audio')content=`<div class="friend-photo-wrap" data-friend-audio="${m.id}"><div class="friend-photo-note">🎙️ Carregando áudio…</div></div>`;else content=`<div class="friend-photo-wrap" data-friend-photo="${m.id}"><div class="friend-photo-note">📷 Carregando imagem…</div></div>`
      return `<div class="friend-msg ${mine?'mine':''}"><div class="friend-bubble">${!mine?`<span class="friend-sender">${esc(m.senderName)}</span>`:''}${content}<span class="friend-meta">${m.editedAt?'editada • ':''}${fmtTime(m.sentAt)}</span>${read?`<span class="friend-read">${read}</span>`:''}</div></div>`
    }).join('')||'<div class="friend-empty" style="height:auto;padding:40px"><p>Comece a conversa 💕</p></div>'
    hydrateFriendMedia();if(forceScroll||atBottom)requestAnimationFrame(()=>box.scrollTop=box.scrollHeight)
  }catch(e){if(/revogado|inválido/i.test(e.message))location.reload()}
}
async function sendMessage(){const input=$('friendMessageInput'),body=input.value.trim();if(!body||!activeConversation)return;$('friendSendBtn').disabled=true;input.value='';try{await rpc('friend_portal_send',{p_token:token,p_conversation_id:activeConversation.id,p_body:body});await loadMessages(true);await refreshConversations()}catch(e){input.value=body;toast(e.message)}finally{$('friendSendBtn').disabled=false;input.focus()}}
async function sendPhoto(file){
  if(!activeConversation||!file)return;if(file.size>6*1024*1024)return toast('Use uma imagem de até 6 MB.');if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type))return toast('Use JPG, PNG, WEBP ou GIF.')
  if(isFriend()&&activeConversation.type!=='group')return toast('Imagens ficam disponíveis para amigas somente nos grupos de atividades.')
  toast('Enviando imagem…');try{await mediaUpload(file,'message');await loadMessages(true);await refreshConversations();toast('Imagem enviada 📷')}catch(e){toast(e.message)}
}
async function sendAudio(file,durationMs=null){
  if(!activeConversation||!file)return;if(isFriend())return toast('Áudio fica disponível somente para a família.');if(file.size>12*1024*1024)return toast('Use um áudio de até 12 MB.');if(!String(file.type||'').startsWith('audio/'))return toast('Escolha um arquivo de áudio.')
  toast('Enviando áudio…');try{await mediaUpload(file,'audio',durationMs);await loadMessages(true);await refreshConversations();toast('Áudio enviado 🎙️')}catch(e){toast(e.message)}
}
function takePhoto(){const i=$('friendPhotoInput');if(!i)return;i.setAttribute('accept','image/*');i.setAttribute('capture','environment');i.click();setTimeout(()=>i.removeAttribute('capture'),1000)}
function chooseImage(){const i=$('friendPhotoInput');if(!i)return;i.removeAttribute('capture');i.setAttribute('accept','image/jpeg,image/png,image/webp,image/gif');i.click()}
function ensureAudioInput(){if($('friendAudioInput'))return;const i=document.createElement('input');i.id='friendAudioInput';i.type='file';i.accept='audio/*';i.hidden=true;i.onchange=e=>{const f=e.target.files?.[0];if(f)sendAudio(f);e.target.value=''};document.body.appendChild(i)}
function chooseAudio(){ensureAudioInput();$('friendAudioInput').click()}
async function startRecording(){
  if(isFriend())return toast('Áudio fica disponível somente para a família.');if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)return toast('Este navegador não oferece gravação de áudio.')
  try{const stream=await navigator.mediaDevices.getUserMedia({audio:true}),mime=['audio/webm;codecs=opus','audio/webm','audio/ogg','audio/mp4'].find(x=>MediaRecorder.isTypeSupported?.(x))||'',rec=new MediaRecorder(stream,mime?{mimeType:mime}:undefined),chunks=[],started=Date.now();recording={rec,stream,chunks,started};rec.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};rec.onstop=async()=>{clearInterval(recordTimer);$('friendRecordingPop')?.remove();stream.getTracks().forEach(t=>t.stop());const blob=new Blob(chunks,{type:rec.mimeType||'audio/webm'}),ext=blob.type.includes('mp4')?'m4a':blob.type.includes('ogg')?'ogg':'webm',file=new File([blob],`audio-${Date.now()}.${ext}`,{type:blob.type});recording=null;await sendAudio(file,Date.now()-started)};rec.start(300);showRecording();recordTimer=setInterval(updateRecording,1000);setTimeout(()=>{if(recording?.rec.state==='recording')recording.rec.stop()},120000)}catch{toast('Não foi possível acessar o microfone.')}
}
function showRecording(){ensureAudioCss();$('friendRecordingPop')?.remove();const d=document.createElement('div');d.id='friendRecordingPop';d.className='friend-recording-pop';d.innerHTML='<span class="friend-record-dot"></span><strong>Gravando <span id="friendRecTime">0:00</span></strong><button type="button" id="friendStopRec">■ Parar e enviar</button>';document.body.appendChild(d);$('friendStopRec').onclick=()=>{if(recording?.rec.state==='recording')recording.rec.stop()}}
function updateRecording(){if(!recording)return;const s=Math.floor((Date.now()-recording.started)/1000);if($('friendRecTime'))$('friendRecTime').textContent=`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`}
function ensureAudioCss(){if($('friendAudioCss'))return;const s=document.createElement('style');s.id='friendAudioCss';s.textContent='.friend-audio{display:block;width:min(330px,72vw);margin:5px 0}.friend-recording-pop{position:fixed;left:50%;bottom:76px;transform:translateX(-50%);z-index:180;background:#fff6fb;border-radius:18px;padding:12px 14px;box-shadow:0 16px 38px rgba(80,58,96,.2);display:flex;align-items:center;gap:10px}.friend-recording-pop button{border:0;border-radius:12px;padding:8px 10px;background:#ffdfe9;font-weight:900}.friend-record-dot{width:10px;height:10px;border-radius:50%;background:#e45670;animation:frpulse 1s infinite}@keyframes frpulse{50%{opacity:.35}}';document.head.appendChild(s)}
window.__FRIEND_MEDIA__={takePhoto,chooseImage,startRecording,chooseAudio,sendPhoto,sendAudio,isFriend:()=>isFriend(),activeType:()=>activeConversation?.type||null}

async function setPresence(online,keepalive=false){if(!token||!friend)return;try{await rpc('friend_portal_presence',{p_token:token,p_online:!!online},{keepalive})}catch{}}
function startTimers(){clearInterval(messageTimer);clearInterval(listTimer);clearInterval(presenceTimer);messageTimer=setInterval(()=>{if(document.visibilityState==='visible')loadMessages(false)},2500);listTimer=setInterval(()=>{if(document.visibilityState==='visible')refreshConversations()},5000);presenceTimer=setInterval(()=>{if(document.visibilityState==='visible')setPresence(true)},15000)}

$('friendEnterBtn').onclick=enterPortal
$('friendSendBtn').onclick=sendMessage
$('friendMessageInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage()}})
$('friendEmojiBtn').onclick=()=> $('friendEmojiBar').classList.toggle('hidden')
$('friendEmojiBar').querySelectorAll('button').forEach(b=>b.onclick=()=>{const i=$('friendMessageInput');i.value+=b.textContent;$('friendEmojiBar').classList.add('hidden');i.focus()})
$('friendPhotoBtn').onclick=chooseImage
$('friendPhotoInput').onchange=e=>{const f=e.target.files?.[0];if(f)sendPhoto(f);e.target.value=''}
$('friendBackBtn').onclick=()=>{$('friendChat').classList.remove('thread-open');if(innerWidth>780){$('friendThread').classList.add('hidden');$('friendEmpty').classList.remove('hidden')}activeConversation=null;window.__FRIEND_ACTIVE_CONV_TYPE__=null;$('friendPhotoBtn').classList.add('hidden');renderConversationList()}
document.addEventListener('visibilitychange',()=>setPresence(document.visibilityState==='visible'))
window.addEventListener('pagehide',()=>setPresence(false,true))
ensureAudioCss();ensureAudioInput();bootstrap(false)
