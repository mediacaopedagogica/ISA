import { CONFIG } from './config.js'

const $=id=>document.getElementById(id)
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const token=new URLSearchParams(location.hash.replace(/^#/, '')).get('acesso')||''
let friend=null,conversations=[],activeConversation=null,messageTimer=null,listTimer=null,presenceTimer=null
const photoCache=new Map()

async function rpc(name,args={},opts={}){
  const r=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${name}`,{
    method:'POST',
    headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${CONFIG.SUPABASE_KEY}`,'Content-Type':'application/json'},
    body:JSON.stringify(args),
    cache:'no-store',
    keepalive:!!opts.keepalive
  })
  let data=null;try{data=await r.json()}catch{}
  if(!r.ok){throw new Error(data?.message||data?.hint||data?.details||'Não foi possível acessar.')}
  return data
}
async function mediaJson(payload){
  const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/friend-media`,{
    method:'POST',
    headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${CONFIG.SUPABASE_KEY}`,'Content-Type':'application/json'},
    body:JSON.stringify(payload),cache:'no-store'
  })
  let data=null;try{data=await r.json()}catch{}
  if(!r.ok)throw new Error(data?.error||'Não foi possível carregar a imagem.')
  return data
}
async function mediaUpload(file){
  const form=new FormData();form.append('token',token);form.append('conversationId',activeConversation.id);form.append('file',file)
  const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/friend-media`,{
    method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${CONFIG.SUPABASE_KEY}`},body:form
  })
  let data=null;try{data=await r.json()}catch{}
  if(!r.ok)throw new Error(data?.error||'Não foi possível enviar a imagem.')
  return data
}
function toast(text){const el=$('friendToast');el.textContent=text;el.classList.remove('hidden');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.add('hidden'),2300)}
function fmtTime(ts){return new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit'}).format(new Date(ts))}

async function bootstrap(silent=false){
  if(!token){$('friendGateTitle').textContent='Este link não é válido';$('friendGateText').textContent='Peça um novo acesso à responsável da Isa.';return}
  try{
    const data=await rpc('friend_portal_bootstrap',{p_token:token})
    friend=data.friend;conversations=data.conversations||[]
    if(!silent){
      $('friendGateTitle').textContent=`Oi, ${friend.name}! 💜`
      $('friendGateText').textContent='Este é seu acesso pessoal ao Cantinho da Isa.'
      $('friendGateInfo').classList.remove('hidden')
      $('friendEnterBtn').classList.remove('hidden')
    }
    if($('friendChat')&&!$('friendChat').classList.contains('hidden'))renderConversationList()
  }catch(e){
    if(!silent){$('friendGateTitle').textContent='Acesso indisponível';$('friendGateText').textContent='Este link pode ter sido revogado ou substituído.';$('friendGateError').textContent=e.message}
  }
}

function renderConversationList(){
  $('friendName').textContent=friend?.name||'Amiga'
  $('friendConversationList').innerHTML=conversations.map(c=>`<button class="friend-conversation ${activeConversation?.id===c.id?'active':''}" data-friend-conv="${c.id}"><strong>${c.type==='group'?'👥 ':''}${esc(c.title||'Isa')}</strong><small>${esc(c.preview|| (c.type==='direct'?'Conversa direta com a Isa':(c.participants||[]).join(', ')))}</small></button>`).join('')||'<p class="muted">Nenhuma conversa disponível.</p>'
  document.querySelectorAll('[data-friend-conv]').forEach(b=>b.onclick=()=>openConversation(b.dataset.friendConv))
}

async function enterPortal(){
  $('friendEnterBtn').disabled=true
  try{
    await rpc('friend_portal_presence',{p_token:token,p_online:true})
    $('friendGate').classList.add('hidden');$('friendChat').classList.remove('hidden')
    renderConversationList();startTimers()
    const direct=conversations.find(c=>c.type==='direct')
    if(direct)await openConversation(direct.id)
  }catch(e){$('friendGateError').textContent=e.message}
  finally{$('friendEnterBtn').disabled=false}
}

async function refreshConversations(){
  try{await bootstrap(true);renderConversationList()}catch{}
}
async function openConversation(id){
  const c=conversations.find(x=>x.id===id);if(!c)return
  activeConversation=c
  $('friendEmpty').classList.add('hidden');$('friendThread').classList.remove('hidden');$('friendChat').classList.add('thread-open')
  $('friendThreadTitle').textContent=c.title||'Isa'
  $('friendThreadSubtitle').textContent=c.type==='direct'?'Conversa direta • somente texto':'Grupo criado pela Isa • atividades e trabalhos'
  $('friendPhotoBtn').classList.toggle('hidden',c.type!=='group')
  renderConversationList();await loadMessages(true)
}

async function getPhotoUrl(messageId){
  const cached=photoCache.get(messageId);if(cached&&cached.until>Date.now())return cached.url
  const data=await mediaJson({action:'signed_url',token,messageId})
  photoCache.set(messageId,{url:data.url,until:Date.now()+240000});return data.url
}
async function hydrateFriendPhotos(){
  const nodes=[...document.querySelectorAll('[data-friend-photo]')]
  for(const node of nodes){
    if(node.dataset.loaded==='1')continue
    try{const url=await getPhotoUrl(node.dataset.friendPhoto);node.innerHTML=`<img class="friend-photo" src="${url}" alt="Imagem enviada no grupo">`;node.dataset.loaded='1'}
    catch{node.innerHTML='<div class="friend-photo-note">📷 Imagem indisponível ou expirada.</div>';node.dataset.loaded='1'}
  }
}
async function loadMessages(forceScroll=false){
  if(!activeConversation)return
  try{
    const list=await rpc('friend_portal_messages',{p_token:token,p_conversation_id:activeConversation.id})
    const box=$('friendMessages'),atBottom=box.scrollHeight-box.scrollTop-box.clientHeight<90
    box.innerHTML=(list||[]).map(m=>{
      const mine=m.senderId===friend.id
      const read=mine?(Number(m.readCount||0)>0?(activeConversation.type==='direct'?'✓✓ Leu sua mensagem':`✓✓ Lida por ${m.readCount}`):'✓ Enviada'):''
      const content=m.kind==='text'?`<div>${esc(m.body)}</div>`:`<div class="friend-photo-wrap" data-friend-photo="${m.id}"><div class="friend-photo-note">📷 Carregando imagem do grupo…</div></div>`
      return `<div class="friend-msg ${mine?'mine':''}"><div class="friend-bubble">${!mine?`<span class="friend-sender">${esc(m.senderName)}</span>`:''}${content}<span class="friend-meta">${m.editedAt?'editada • ':''}${fmtTime(m.sentAt)}</span>${read?`<span class="friend-read">${read}</span>`:''}</div></div>`
    }).join('')||'<div class="friend-empty" style="height:auto;padding:40px"><p>Comece a conversa 💕</p></div>'
    hydrateFriendPhotos()
    if(forceScroll||atBottom)requestAnimationFrame(()=>box.scrollTop=box.scrollHeight)
  }catch(e){if(/revogado|inválido/i.test(e.message)){location.reload()}}
}

async function sendMessage(){
  const input=$('friendMessageInput'),body=input.value.trim();if(!body||!activeConversation)return
  $('friendSendBtn').disabled=true;input.value=''
  try{await rpc('friend_portal_send',{p_token:token,p_conversation_id:activeConversation.id,p_body:body});await loadMessages(true);await refreshConversations()}
  catch(e){input.value=body;toast(e.message)}finally{$('friendSendBtn').disabled=false;input.focus()}
}
async function sendGroupPhoto(file){
  if(!activeConversation||activeConversation.type!=='group')return toast('Imagens ficam disponíveis somente nos grupos de atividades.')
  if(!file)return
  if(file.size>6*1024*1024)return toast('Use uma imagem de até 6 MB.')
  const allowed=['image/jpeg','image/png','image/webp','image/gif'];if(!allowed.includes(file.type))return toast('Use JPG, PNG, WEBP ou GIF.')
  $('friendPhotoBtn').disabled=true;toast('Enviando imagem…')
  try{await mediaUpload(file);await loadMessages(true);await refreshConversations();toast('Imagem enviada no grupo 📚')}
  catch(e){toast(e.message)}finally{$('friendPhotoBtn').disabled=false}
}

async function setPresence(online,keepalive=false){
  if(!token||!friend)return
  try{await rpc('friend_portal_presence',{p_token:token,p_online:!!online},{keepalive})}catch{}
}
function startTimers(){
  clearInterval(messageTimer);clearInterval(listTimer);clearInterval(presenceTimer)
  messageTimer=setInterval(()=>{if(document.visibilityState==='visible')loadMessages(false)},2500)
  listTimer=setInterval(()=>{if(document.visibilityState==='visible')refreshConversations()},5000)
  presenceTimer=setInterval(()=>{if(document.visibilityState==='visible')setPresence(true)},15000)
}

$('friendEnterBtn').onclick=enterPortal
$('friendSendBtn').onclick=sendMessage
$('friendMessageInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage()}})
$('friendEmojiBtn').onclick=()=> $('friendEmojiBar').classList.toggle('hidden')
$('friendEmojiBar').querySelectorAll('button').forEach(b=>b.onclick=()=>{const i=$('friendMessageInput');i.value+=b.textContent;$('friendEmojiBar').classList.add('hidden');i.focus()})
$('friendPhotoBtn').onclick=()=>$('friendPhotoInput').click()
$('friendPhotoInput').onchange=e=>{const f=e.target.files?.[0];if(f)sendGroupPhoto(f);e.target.value=''}
$('friendBackBtn').onclick=()=>{$('friendChat').classList.remove('thread-open');if(innerWidth>780){$('friendThread').classList.add('hidden');$('friendEmpty').classList.remove('hidden')}activeConversation=null;$('friendPhotoBtn').classList.add('hidden');renderConversationList()}
document.addEventListener('visibilitychange',()=>setPresence(document.visibilityState==='visible'))
window.addEventListener('pagehide',()=>setPresence(false,true))

bootstrap(false)
