import { CONFIG } from './config.js?v=20260910-external-root-fix'

const $=id=>document.getElementById(id)
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const token=new URLSearchParams(location.hash.replace(/^#/,'')).get('acesso')||''
const emojis=['😀','😊','🥰','😍','😂','😄','🙂','😉','🤗','🥳','💜','🩷','❤️','💙','💚','✨','⭐','🌷','🌸','🎉','👍','👏','🙏','📚']

let person=null
let conversations=[]
let activeConversation=null
let messageTimer=null
let listTimer=null
let presenceTimer=null
let bootstrapRun=0
const mediaCache=new Map()

function toast(text){
  const el=$('friendToast')
  if(!el)return
  el.textContent=text
  el.classList.remove('hidden')
  clearTimeout(el._t)
  el._t=setTimeout(()=>el.classList.add('hidden'),2600)
}

function fmtTime(ts){
  try{return new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit'}).format(new Date(ts))}
  catch{return''}
}

function stopTimers(){
  clearInterval(messageTimer);clearInterval(listTimer);clearInterval(presenceTimer)
  messageTimer=listTimer=presenceTimer=null
}

async function request(url,options={},timeoutMs=7000){
  const controller=new AbortController()
  const timer=setTimeout(()=>controller.abort(),timeoutMs)
  try{
    const response=await fetch(url,{...options,cache:'no-store',signal:controller.signal})
    let data=null
    try{data=await response.json()}catch{}
    if(!response.ok)throw new Error(data?.message||data?.hint||data?.details||data?.error||`Falha de conexão (${response.status})`)
    return data
  }catch(error){
    if(error?.name==='AbortError')throw new Error('A conexão demorou demais.')
    throw error
  }finally{clearTimeout(timer)}
}

/*
 * IMPORTANTE: CONFIG.SUPABASE_KEY é uma chave publishable (sb_publishable_*), não um JWT.
 * Ela deve ir em `apikey`; não em `Authorization: Bearer ...`.
 */
async function rpc(name,args={},opts={}){
  const keepalive=!!opts.keepalive
  if(keepalive){
    const response=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${name}`,{
      method:'POST',
      headers:{apikey:CONFIG.SUPABASE_KEY,'Content-Type':'application/json'},
      body:JSON.stringify(args),
      cache:'no-store',
      keepalive:true
    })
    let data=null;try{data=await response.json()}catch{}
    if(!response.ok)throw new Error(data?.message||data?.hint||data?.details||'Não foi possível acessar.')
    return data
  }
  return request(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${name}`,{
    method:'POST',
    headers:{apikey:CONFIG.SUPABASE_KEY,'Content-Type':'application/json'},
    body:JSON.stringify(args)
  },Number(opts.timeoutMs||7000))
}

/* Bootstrap por Edge Function: evita depender do PostgREST direto para validar o link. */
function edgeBootstrap(){
  return request(`${CONFIG.SUPABASE_URL}/functions/v1/friend-bootstrap`,{
    method:'POST',
    headers:{apikey:CONFIG.SUPABASE_KEY,'Content-Type':'application/json'},
    body:JSON.stringify({token})
  },5500)
}

async function loadBootstrapData(){
  try{
    return await edgeBootstrap()
  }catch(edgeError){
    console.warn('[acesso familiar] friend-bootstrap falhou; usando RPC direto',edgeError)
    return rpc('friend_portal_bootstrap',{p_token:token},{timeoutMs:5500})
  }
}

function gateLoading(){
  $('friendGateTitle').textContent='Verificando seu acesso…'
  $('friendGateText').textContent='Só um instante.'
  $('friendGateError').textContent=''
  const btn=$('friendEnterBtn')
  if(btn){btn.classList.add('hidden');btn.disabled=false;btn.dataset.mode='enter';btn.textContent='Acessar 💜'}
}

function gateReady(){
  $('friendGateTitle').textContent=`Oi, ${person?.name||'família'}! 💜`
  $('friendGateText').textContent='Este é seu acesso pessoal ao Cantinho da Isa.'
  $('friendGateError').textContent=''
  const btn=$('friendEnterBtn')
  if(btn){btn.dataset.mode='enter';btn.textContent='Acessar 💜';btn.disabled=false;btn.classList.remove('hidden')}
}

function gateError(message){
  window.__ISA_FRIEND_BOOTSTRAP_STATE__='error'
  window.__ISA_FRIEND_ACCESS_VALID__=false
  $('friendGateTitle').textContent='Não conseguimos conectar agora'
  $('friendGateText').textContent='Seu link continua válido. Toque abaixo para tentar novamente.'
  $('friendGateError').textContent=message||'Falha de conexão.'
  const btn=$('friendEnterBtn')
  if(btn){btn.disabled=false;btn.dataset.mode='retry';btn.textContent='Tentar novamente';btn.classList.remove('hidden')}
  document.dispatchEvent(new Event('isa:friend-access-invalid'))
}

async function bootstrap(silent=false){
  const run=++bootstrapRun
  window.__ISA_FRIEND_BOOTSTRAP_STATE__='loading'
  window.__ISA_FRIEND_ACCESS_VALID__=false

  if(!token){
    window.__ISA_FRIEND_BOOTSTRAP_STATE__='invalid'
    if(!silent){
      $('friendGateTitle').textContent='Este link não é válido'
      $('friendGateText').textContent='Peça um novo link pessoal.'
      $('friendGateError').textContent=''
    }
    document.dispatchEvent(new Event('isa:friend-access-invalid'))
    return false
  }

  if(!silent)gateLoading()

  /* watchdog independente: nunca mais deixa a tela em “Verificando...” para sempre */
  const watchdog=!silent?setTimeout(()=>{
    if(run===bootstrapRun&&window.__ISA_FRIEND_BOOTSTRAP_STATE__==='loading'){
      gateError('A validação demorou mais que o esperado.')
    }
  },11500):null

  try{
    const data=await loadBootstrapData()
    if(run!==bootstrapRun)return false
    if(!data?.friend?.id)throw new Error('O perfil deste link não foi encontrado.')

    person=data.friend
    conversations=Array.isArray(data.conversations)?data.conversations:[]
    window.__ISA_FRIEND_PERSON__=person
    window.__ISA_FRIEND_ACCESS_VALID__=true
    window.__ISA_FRIEND_BOOTSTRAP_STATE__='ready'
    document.dispatchEvent(new CustomEvent('isa:friend-access-valid',{detail:{id:person.id,name:person.name||''}}))

    if(!silent)gateReady()
    if($('friendChat')&&!$('friendChat').classList.contains('hidden'))renderConversationList()
    return true
  }catch(error){
    if(run!==bootstrapRun)return false
    if(!silent)gateError(error?.message||'Falha de conexão.')
    return false
  }finally{
    if(watchdog)clearTimeout(watchdog)
  }
}

function ensureExitButton(){
  const host=document.querySelector('.friend-profile')
  if(!host)return null
  let b=$('friendExitBtn')
  if(!b){
    b=document.createElement('button')
    b.id='friendExitBtn';b.type='button';b.className='friend-exit-btn';b.textContent='Sair';b.title='Sair deste acesso';b.setAttribute('aria-label','Sair deste acesso')
    host.appendChild(b)
  }
  return b
}

function renderConversationList(){
  if($('friendName'))$('friendName').textContent=person?.name||'Família'
  if($('friendRelationship'))$('friendRelationship').textContent=person?.relationship||'Família'
  const box=$('friendConversationList')
  if(!box)return
  box.innerHTML=conversations.map(c=>`<button class="friend-conversation ${activeConversation?.id===c.id?'active':''}" data-friend-conv="${esc(c.id)}" type="button"><strong>${c.type==='group'?'👥 ':''}${esc(c.title||'Isa')}</strong><small>${esc(c.preview||(c.type==='direct'?'Conversa com a Isa':(c.participants||[]).join(', ')))}</small></button>`).join('')||'<p class="muted">Nenhuma conversa disponível.</p>'
  box.querySelectorAll('[data-friend-conv]').forEach(b=>b.onclick=()=>openConversation(b.dataset.friendConv))
  ensureExitButton()
}

function enterPortal(){
  const btn=$('friendEnterBtn')
  if(!person||!window.__ISA_FRIEND_ACCESS_VALID__){bootstrap(false);return}
  if(btn)btn.disabled=true
  $('friendGate')?.classList.add('hidden')
  $('friendChat')?.classList.remove('hidden')
  document.body.classList.add('friend-portal-open')
  renderConversationList()
  startTimers()
  setPresence(true).catch(()=>{})
  window.__ISA_FRIEND_PORTAL_ENTERED__=true
  document.dispatchEvent(new CustomEvent('isa:friend-portal-entered',{detail:{id:person.id,name:person.name||''}}))
  const direct=conversations.find(c=>c.type==='direct')
  if(direct&&!matchMedia('(max-width:780px)').matches)openConversation(direct.id).catch(e=>toast(e?.message||'Não foi possível abrir a conversa.'))
  if(btn)btn.disabled=false
}

function exitPortal(){
  stopTimers();setPresence(false,true).catch(()=>{})
  activeConversation=null
  window.__FRIEND_ACTIVE_CONV_TYPE__=null
  window.__ISA_FRIEND_PORTAL_ENTERED__=false
  $('friendChat')?.classList.remove('thread-open')
  $('friendChat')?.classList.add('hidden')
  $('friendGate')?.classList.remove('hidden')
  document.body.classList.remove('friend-portal-open')
  $('friendThread')?.classList.add('hidden')
  $('friendEmpty')?.classList.remove('hidden')
  gateReady()
}

async function refreshConversations(){
  try{
    const data=await loadBootstrapData()
    if(data?.friend?.id){
      person=data.friend
      conversations=Array.isArray(data.conversations)?data.conversations:[]
      window.__ISA_FRIEND_PERSON__=person
      renderConversationList()
    }
  }catch{}
}

function refreshCallActionsNow(){
  const fire=()=>document.dispatchEvent(new Event('visibilitychange'))
  fire();setTimeout(fire,180);setTimeout(fire,650)
}

async function openConversation(id){
  const c=conversations.find(x=>String(x.id)===String(id))
  if(!c)return
  activeConversation=c
  window.__FRIEND_ACTIVE_CONV_TYPE__=c.type
  $('friendEmpty')?.classList.add('hidden')
  $('friendThread')?.classList.remove('hidden')
  $('friendChat')?.classList.add('thread-open')
  if($('friendThreadTitle'))$('friendThreadTitle').textContent=c.title||'Isa'
  if($('friendThreadSubtitle'))$('friendThreadSubtitle').textContent=c.type==='group'?'Grupo criado pela Isa':'Conversa direta com a Isa'
  renderConversationList();refreshCallActionsNow();await loadMessages(true)
}

async function mediaJson(payload){
  return request(`${CONFIG.SUPABASE_URL}/functions/v1/friend-media`,{
    method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify(payload)
  },10000)
}

async function uploadImage(file){
  if(!activeConversation)throw new Error('Abra uma conversa primeiro.')
  const form=new FormData()
  form.append('token',token);form.append('conversationId',activeConversation.id);form.append('action','message');form.append('file',file)
  return request(`${CONFIG.SUPABASE_URL}/functions/v1/friend-media`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY},body:form},15000)
}

async function getMediaUrl(messageId){
  const cached=mediaCache.get(messageId)
  if(cached&&cached.until>Date.now())return cached.url
  const data=await mediaJson({action:'signed_url',token,messageId})
  mediaCache.set(messageId,{url:data.url,until:Date.now()+240000})
  return data.url
}

async function hydrateMedia(){
  for(const node of document.querySelectorAll('[data-family-photo]')){
    if(node.dataset.loaded==='1')continue
    try{const url=await getMediaUrl(node.dataset.familyPhoto);node.innerHTML=`<img class="friend-photo" src="${esc(url)}" alt="Imagem enviada">`;node.dataset.loaded='1'}
    catch{node.innerHTML='<div class="friend-photo-note">📷 Imagem indisponível.</div>';node.dataset.loaded='1'}
  }
  for(const node of document.querySelectorAll('[data-family-audio]')){
    if(node.dataset.loaded==='1')continue
    try{
      const url=await getMediaUrl(node.dataset.familyAudio)
      const audio=document.createElement('audio');audio.controls=true;audio.preload='metadata';audio.src=url;audio.className='friend-audio';audio.style.width='min(360px,100%)';audio.style.maxWidth='100%';audio.setAttribute('controlsList','nodownload')
      node.innerHTML='';node.appendChild(audio);audio.load();node.dataset.loaded='1'
    }catch{node.innerHTML='<div class="friend-photo-note">🎙️ Áudio indisponível.</div>';node.dataset.loaded='1'}
  }
}

async function loadMessages(forceScroll=false){
  if(!activeConversation)return
  try{
    const list=await rpc('friend_portal_messages',{p_token:token,p_conversation_id:activeConversation.id},{timeoutMs:7000})
    const box=$('friendMessages')
    if(!box)return
    const atBottom=box.scrollHeight-box.scrollTop-box.clientHeight<90
    box.innerHTML=(list||[]).map(m=>{
      const mine=String(m.senderId)===String(person.id)
      const read=mine?(Number(m.readCount||0)>0?'✓✓ Lida':'✓ Enviada'):''
      let content
      if(m.kind==='photo')content=`<div class="friend-photo-wrap" data-family-photo="${esc(m.id)}"><div class="friend-photo-note">📷 Carregando imagem…</div></div>`
      else if(m.kind==='audio')content=`<div class="friend-audio-wrap" data-family-audio="${esc(m.id)}"><div class="friend-photo-note">🎙️ Carregando áudio…</div></div>`
      else content=`<div>${esc(m.body||'')}</div>`
      return `<div class="friend-msg ${mine?'mine':''}" data-message-id="${esc(m.id)}"><div class="friend-bubble">${!mine?`<span class="friend-sender">${esc(m.senderName||'')}</span>`:''}${content}<span class="friend-meta">${fmtTime(m.sentAt)}</span>${read?`<span class="friend-read">${read}</span>`:''}</div></div>`
    }).join('')||'<div class="friend-empty" style="height:auto;padding:40px"><p>Comece a conversa 💕</p></div>'
    hydrateMedia()
    window.__ISA_REFRESH_MESSAGE_INTERACTIONS__?.()
    window.__ISA_REACTION_DELEGATE_REFRESH__?.()
    if(forceScroll||atBottom)requestAnimationFrame(()=>box.scrollTop=box.scrollHeight)
  }catch(error){toast(error?.message||'Não foi possível carregar as mensagens.')}
}

async function sendMessage(){
  const input=$('friendMessageInput')
  const body=input?.value.trim()
  if(!body||!activeConversation)return
  $('friendSendBtn').disabled=true
  input.value=''
  try{
    await rpc('friend_portal_send',{p_token:token,p_conversation_id:activeConversation.id,p_body:body},{timeoutMs:7000})
    await loadMessages(true);refreshConversations()
  }catch(error){input.value=body;toast(error?.message||'Não foi possível enviar.')}
  finally{$('friendSendBtn').disabled=false;input.focus()}
}

async function sendPhoto(file){
  if(!file||!activeConversation)return
  if(file.size>6*1024*1024)return toast('Use uma imagem de até 6 MB.')
  if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type))return toast('Use JPG, PNG, WEBP ou GIF.')
  toast('Enviando imagem…')
  try{await uploadImage(file);await loadMessages(true);refreshConversations();toast('Imagem enviada 📷')}
  catch(error){toast(error?.message||'Não foi possível enviar a imagem.')}
}

function buildEmoji(){
  const bar=$('friendEmojiBar')
  if(!bar)return
  bar.innerHTML=emojis.map(e=>`<button type="button" data-emoji="${e}">${e}</button>`).join('')
  bar.querySelectorAll('[data-emoji]').forEach(b=>b.onclick=()=>{const input=$('friendMessageInput');if(input){input.value+=b.dataset.emoji;input.focus()}bar.classList.add('hidden')})
}

async function setPresence(online,keepalive=false){
  if(!token||!person)return
  try{await rpc('friend_portal_presence',{p_token:token,p_online:!!online},{keepalive,timeoutMs:5000})}catch{}
}

function startTimers(){
  stopTimers()
  const mobile=matchMedia('(max-width:780px)').matches
  messageTimer=setInterval(()=>{if(document.visibilityState==='visible'&&activeConversation)loadMessages(false)},mobile?5000:3200)
  listTimer=setInterval(()=>{if(document.visibilityState==='visible')refreshConversations()},mobile?12000:7000)
  presenceTimer=setInterval(()=>{if(document.visibilityState==='visible')setPresence(true)},22000)
}

window.__ISA_FRIEND_TOKEN__=token
window.__ISA_FRIEND_GET_ACTIVE_CONVERSATION_ID__=()=>activeConversation?.id||null
window.__ISA_FRIEND_REFRESH_MESSAGES__=()=>loadMessages(true)
window.__ISA_FRIEND_REFRESH_LIST__=()=>refreshConversations()
window.__ISA_FRIEND_SEND_PHOTO_FILE__=sendPhoto
window.__ISA_FRIEND_TOAST__=toast
window.__ISA_FRIEND_BOOTSTRAP__=()=>bootstrap(false)
window.__ISA_FRIEND_ENTER_PORTAL__=enterPortal

$('friendEnterBtn').onclick=()=>$('friendEnterBtn').dataset.mode==='retry'?bootstrap(false):enterPortal()
$('friendSendBtn').onclick=sendMessage
$('friendMessageInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage()}})
$('friendEmojiBtn').onclick=e=>{e.stopPropagation();$('friendEmojiBar').classList.toggle('hidden')}
$('friendPhotoBtn').onclick=()=>$('friendPhotoInput')?.click()
$('friendPhotoInput').onchange=e=>{const f=e.target.files?.[0];if(f)sendPhoto(f);e.target.value=''}
$('friendBackBtn').onclick=()=>{$('friendChat')?.classList.remove('thread-open');if(innerWidth>780){$('friendThread')?.classList.add('hidden');$('friendEmpty')?.classList.remove('hidden')}activeConversation=null;window.__FRIEND_ACTIVE_CONV_TYPE__=null;renderConversationList()}
document.addEventListener('click',e=>{if(e.target.closest?.('#friendExitBtn')){e.preventDefault();exitPortal();return}if(!e.target.closest?.('#friendEmojiBar')&&!e.target.closest?.('#friendEmojiBtn'))$('friendEmojiBar')?.classList.add('hidden')})
document.addEventListener('visibilitychange',()=>setPresence(document.visibilityState==='visible'))
window.addEventListener('pagehide',()=>setPresence(false,true))

buildEmoji()
bootstrap(false)
