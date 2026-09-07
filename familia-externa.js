import { CONFIG } from './config.js'
const $=id=>document.getElementById(id)
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const token=new URLSearchParams(location.hash.replace(/^#/, '')).get('acesso')||''
let person=null,conversations=[],activeConversation=null,messageTimer=null,listTimer=null,presenceTimer=null
const mediaCache=new Map()
const emojis=['😀','😊','🥰','😍','😂','😄','🙂','😉','🤗','🥳','💜','🩷','❤️','💙','💚','✨','⭐','🌷','🌸','🎉','👍','👏','🙏','📚']

async function rpc(name,args={},opts={}){
  const r=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${CONFIG.SUPABASE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(args),cache:'no-store',keepalive:!!opts.keepalive})
  let data=null;try{data=await r.json()}catch{}
  if(!r.ok)throw new Error(data?.message||data?.hint||data?.details||'Não foi possível acessar.')
  return data
}
async function mediaJson(payload){
  const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/friend-media`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${CONFIG.SUPABASE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(payload),cache:'no-store'})
  let data=null;try{data=await r.json()}catch{}
  if(!r.ok)throw new Error(data?.error||'Não foi possível carregar a imagem.')
  return data
}
async function uploadImage(file){
  if(!activeConversation)throw new Error('Abra uma conversa primeiro.')
  const form=new FormData();form.append('token',token);form.append('conversationId',activeConversation.id);form.append('action','message');form.append('file',file)
  const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/friend-media`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${CONFIG.SUPABASE_KEY}`},body:form})
  let data=null;try{data=await r.json()}catch{}
  if(!r.ok)throw new Error(data?.error||'Não foi possível enviar a imagem.')
  return data
}
function toast(text){const el=$('friendToast');if(!el)return;el.textContent=text;el.classList.remove('hidden');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.add('hidden'),2300)}
function fmtTime(ts){return new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit'}).format(new Date(ts))}
async function bootstrap(silent=false){
  if(!token){$('friendGateTitle').textContent='Este link não é válido';$('friendGateText').textContent='Peça um novo link pessoal.';return}
  try{
    const data=await rpc('friend_portal_bootstrap',{p_token:token});person=data.friend;conversations=data.conversations||[]
    if(!silent){$('friendGateTitle').textContent=`Oi, ${person.name}! 💜`;$('friendGateText').textContent='Este é seu acesso pessoal ao Cantinho da Isa.';$('friendEnterBtn').classList.remove('hidden')}
    if($('friendChat')&&!$('friendChat').classList.contains('hidden'))renderConversationList()
  }catch(e){if(!silent){$('friendGateTitle').textContent='Acesso indisponível';$('friendGateText').textContent='Este link pode ter sido substituído.';$('friendGateError').textContent=e.message}}
}
function renderConversationList(){
  $('friendName').textContent=person?.name||'Família'
  $('friendRelationship').textContent=person?.relationship||'Família'
  $('friendConversationList').innerHTML=conversations.map(c=>`<button class="friend-conversation ${activeConversation?.id===c.id?'active':''}" data-friend-conv="${c.id}"><strong>${c.type==='group'?'👥 ':''}${esc(c.title||'Isa')}</strong><small>${esc(c.preview||(c.type==='direct'?'Conversa com a Isa':(c.participants||[]).join(', ')))}</small></button>`).join('')||'<p class="muted">Nenhuma conversa disponível.</p>'
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
  $('friendEmpty').classList.add('hidden');$('friendThread').classList.remove('hidden');$('friendChat').classList.add('thread-open');$('friendThreadTitle').textContent=c.title||'Isa';$('friendThreadSubtitle').textContent=c.type==='group'?'Grupo criado pela Isa':'Conversa direta com a Isa';renderConversationList();await loadMessages(true)
  setTimeout(()=>window.dispatchEvent(new Event('focus')),100)
}
async function getMediaUrl(messageId){const cached=mediaCache.get(messageId);if(cached&&cached.until>Date.now())return cached.url;const data=await mediaJson({action:'signed_url',token,messageId});mediaCache.set(messageId,{url:data.url,until:Date.now()+240000});return data.url}
async function hydrateMedia(){
  for(const node of [...document.querySelectorAll('[data-family-photo]')]){
    if(node.dataset.loaded==='1')continue;const id=node.dataset.familyPhoto
    try{const url=await getMediaUrl(id);node.innerHTML=`<img class="friend-photo" src="${url}" alt="Imagem enviada">`;node.dataset.loaded='1'}catch{node.innerHTML='<div class="friend-photo-note">📷 Imagem expirada.</div>';node.dataset.loaded='1'}
  }
}
async function loadMessages(forceScroll=false){
  if(!activeConversation)return
  try{
    const list=await rpc('friend_portal_messages',{p_token:token,p_conversation_id:activeConversation.id}),box=$('friendMessages'),atBottom=box.scrollHeight-box.scrollTop-box.clientHeight<90
    box.innerHTML=(list||[]).map(m=>{const mine=m.senderId===person.id,read=mine?(Number(m.readCount||0)>0?'✓✓ Lida':'✓ Enviada'):'';let content=m.kind==='photo'?`<div class="friend-photo-wrap" data-family-photo="${m.id}"><div class="friend-photo-note">📷 Carregando imagem…</div></div>`:`<div>${esc(m.body||'')}</div>`;return `<div class="friend-msg ${mine?'mine':''}"><div class="friend-bubble">${!mine?`<span class="friend-sender">${esc(m.senderName)}</span>`:''}${content}<span class="friend-meta">${fmtTime(m.sentAt)}</span>${read?`<span class="friend-read">${read}</span>`:''}</div></div>`}).join('')||'<div class="friend-empty" style="height:auto;padding:40px"><p>Comece a conversa 💕</p></div>'
    hydrateMedia();if(forceScroll||atBottom)requestAnimationFrame(()=>box.scrollTop=box.scrollHeight)
  }catch(e){toast(e.message)}
}
async function sendMessage(){const input=$('friendMessageInput'),body=input.value.trim();if(!body||!activeConversation)return;$('friendSendBtn').disabled=true;input.value='';try{await rpc('friend_portal_send',{p_token:token,p_conversation_id:activeConversation.id,p_body:body});await loadMessages(true);await refreshConversations()}catch(e){input.value=body;toast(e.message)}finally{$('friendSendBtn').disabled=false;input.focus()}}
async function sendPhoto(file){if(!file||!activeConversation)return;if(file.size>6*1024*1024)return toast('Use uma imagem de até 6 MB.');if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type))return toast('Use JPG, PNG, WEBP ou GIF.');toast('Enviando imagem…');try{await uploadImage(file);await loadMessages(true);await refreshConversations();toast('Imagem enviada 📷')}catch(e){toast(e.message)}}
function chooseImage(){const i=$('friendPhotoInput');i?.click()}
function buildEmoji(){const bar=$('friendEmojiBar');if(!bar)return;bar.innerHTML=emojis.map(e=>`<button type="button" data-emoji="${e}">${e}</button>`).join('');bar.querySelectorAll('[data-emoji]').forEach(b=>b.onclick=()=>{const i=$('friendMessageInput');i.value+=b.dataset.emoji;bar.classList.add('hidden');i.focus()})}
async function setPresence(online,keepalive=false){if(!token||!person)return;try{await rpc('friend_portal_presence',{p_token:token,p_online:!!online},{keepalive})}catch{}}
function startTimers(){clearInterval(messageTimer);clearInterval(listTimer);clearInterval(presenceTimer);messageTimer=setInterval(()=>{if(document.visibilityState==='visible')loadMessages(false)},2500);listTimer=setInterval(()=>{if(document.visibilityState==='visible')refreshConversations()},5000);presenceTimer=setInterval(()=>{if(document.visibilityState==='visible')setPresence(true)},15000)}

$('friendEnterBtn').onclick=enterPortal
$('friendSendBtn').onclick=sendMessage
$('friendMessageInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage()}})
$('friendEmojiBtn').onclick=e=>{e.stopPropagation();$('friendEmojiBar').classList.toggle('hidden')}
$('friendPhotoBtn').onclick=chooseImage
$('friendPhotoInput').onchange=e=>{const f=e.target.files?.[0];if(f)sendPhoto(f);e.target.value=''}
$('friendBackBtn').onclick=()=>{$('friendChat').classList.remove('thread-open');if(innerWidth>780){$('friendThread').classList.add('hidden');$('friendEmpty').classList.remove('hidden')}activeConversation=null;window.__FRIEND_ACTIVE_CONV_TYPE__=null;renderConversationList()}
document.addEventListener('click',e=>{if(!e.target.closest('#friendEmojiBar')&&!e.target.closest('#friendEmojiBtn'))$('friendEmojiBar').classList.add('hidden')})
document.addEventListener('visibilitychange',()=>setPresence(document.visibilityState==='visible'))
window.addEventListener('pagehide',()=>setPresence(false,true))
buildEmoji();bootstrap(false)
