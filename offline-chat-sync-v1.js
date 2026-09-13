// Cantinho da Isa — fila offline isolada do Chat.
// Regra de segurança: só intercepta envio quando navigator.onLine === false.
// Quando online, o motor nativo do Chat continua intocado.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js'

const db=createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}})
const DB_NAME='isa-chat-offline-v1'
const STORE='outbox'
let flushing=false
let lastConversationId=''

function toast(text){
  const t=document.getElementById('toast')
  if(!t){console.info(text);return}
  t.textContent=text;t.classList.remove('hidden')
  clearTimeout(t._offlineSync);t._offlineSync=setTimeout(()=>t.classList.add('hidden'),3200)
}
function openDb(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,1)
    req.onupgradeneeded=()=>{
      const d=req.result
      if(!d.objectStoreNames.contains(STORE)){
        const s=d.createObjectStore(STORE,{keyPath:'id',autoIncrement:true})
        s.createIndex('created_at','created_at')
      }
    }
    req.onsuccess=()=>resolve(req.result)
    req.onerror=()=>reject(req.error)
  })
}
async function tx(mode,fn){
  const d=await openDb()
  return new Promise((resolve,reject)=>{
    const t=d.transaction(STORE,mode),s=t.objectStore(STORE)
    let result
    try{result=fn(s,t)}catch(e){d.close();reject(e);return}
    t.oncomplete=()=>{d.close();resolve(result)}
    t.onerror=()=>{d.close();reject(t.error)}
    t.onabort=()=>{d.close();reject(t.error||new Error('Transação cancelada'))}
  })
}
async function add(entry){return tx('readwrite',s=>s.add({...entry,created_at:new Date().toISOString()}))}
async function remove(id){return tx('readwrite',s=>s.delete(id))}
async function all(){
  const d=await openDb()
  return new Promise((resolve,reject)=>{
    const t=d.transaction(STORE,'readonly'),r=t.objectStore(STORE).getAll()
    r.onsuccess=()=>resolve((r.result||[]).sort((a,b)=>String(a.created_at).localeCompare(String(b.created_at))))
    r.onerror=()=>reject(r.error)
    t.oncomplete=()=>d.close();t.onerror=()=>d.close()
  })
}
async function pending(){try{return (await all()).length}catch{return 0}}

function conversationId(){
  const active=document.querySelector('#chatList .chat-item.active[data-conv]')?.dataset?.conv
  if(active)return String(active)
  const q=new URLSearchParams(location.search).get('conversation')||new URLSearchParams(location.search).get('conv')
  return String(lastConversationId||q||'')
}
function rememberConversation(target){
  const card=target?.closest?.('#kaConversationList [data-ka-conv],#chatList [data-conv],[data-source-conv]')
  const id=card?.dataset?.kaConv||card?.dataset?.conv||card?.dataset?.sourceConv
  if(id)lastConversationId=String(id)
}
async function identity(){
  const {data:{user}}=await db.auth.getUser()
  if(!user)throw new Error('Sessão indisponível')
  const {data,error}=await db.from('family_members').select('id,family_id,display_name,active').eq('auth_user_id',user.id).eq('active',true).maybeSingle()
  if(error||!data)throw error||new Error('Perfil não encontrado')
  return data
}
async function requestSync(){
  if(!('serviceWorker'in navigator))return
  try{
    const reg=await navigator.serviceWorker.ready
    if(reg?.sync?.register)await reg.sync.register('isa-offline-chat-outbox')
  }catch{}
}
async function queueText(){
  const input=document.getElementById('messageInput')
  const body=String(input?.value||'').trim(),conv=conversationId()
  if(!body)return false
  if(!conv){toast('Abra uma conversa antes de enviar.');return false}
  await add({type:'text',conversation_id:conv,body})
  if(input){input.value='';try{input.dispatchEvent(new Event('input',{bubbles:true}))}catch{}}
  await requestSync();toast('Sem internet: mensagem guardada para enviar depois. 💌')
  return true
}
async function queuePhoto(file){
  if(!file)return false
  const conv=conversationId()
  if(!conv){toast('Abra uma conversa antes de enviar a foto.');return false}
  if(file.size>8*1024*1024){toast('Use uma foto de até 8 MB.');return false}
  if(!String(file.type||'').startsWith('image/')){toast('Este arquivo não é uma imagem.');return false}
  await add({type:'photo',conversation_id:conv,file,name:file.name||'foto.jpg',mime:file.type||'image/jpeg'})
  await requestSync();toast('Sem internet: foto guardada para enviar depois. 📷')
  return true
}
function extOf(name,mime){
  const raw=(String(name||'').split('.').pop()||'').replace(/[^a-z0-9]/gi,'').toLowerCase()
  if(raw)return raw
  if(mime==='image/png')return'png';if(mime==='image/webp')return'webp';if(mime==='image/gif')return'gif';return'jpg'
}
async function sendEntry(entry,me){
  if(entry.type==='text'){
    const {error}=await db.from('messages').insert({conversation_id:entry.conversation_id,sender_id:me.id,kind:'text',body:entry.body})
    if(error)throw error
    return
  }
  if(entry.type==='photo'){
    const ext=extOf(entry.name,entry.mime),path=`${me.family_id}/${entry.conversation_id}/${me.id}/${crypto.randomUUID()}.${ext}`
    const {error:upErr}=await db.storage.from('chat-temp').upload(path,entry.file,{contentType:entry.mime||'image/jpeg',upsert:false})
    if(upErr)throw upErr
    const expires=new Date(Date.now()+7*24*60*60*1000).toISOString()
    const {error:msgErr}=await db.from('messages').insert({conversation_id:entry.conversation_id,sender_id:me.id,kind:'photo',media_provider:'supabase-storage',media_ref:path,media_mime:entry.mime||'image/jpeg',media_expires_at:expires})
    if(msgErr){try{await db.storage.from('chat-temp').remove([path])}catch{};throw msgErr}
  }
}
async function flush(){
  if(flushing||!navigator.onLine)return 0
  flushing=true
  let sent=0
  try{
    const entries=await all();if(!entries.length)return 0
    const me=await identity()
    for(const entry of entries){
      try{await sendEntry(entry,me);await remove(entry.id);sent++}catch(e){console.warn('Fila offline: item mantido para nova tentativa',e)}
    }
    if(sent){toast(`${sent} ${sent===1?'mensagem enviada':'itens enviados'} após reconectar. 💜`);try{await window.__ISA_SMART_NOTIFICATIONS__?.refreshBadge?.()}catch{}}
    return sent
  }catch(e){console.warn('Fila offline:',e);return sent}
  finally{flushing=false}
}

// Apenas memoriza a conversa; não interfere no roteamento existente.
document.addEventListener('pointerdown',e=>rememberConversation(e.target),true)
document.addEventListener('click',async e=>{
  rememberConversation(e.target)
  if(navigator.onLine)return
  const send=e.target?.closest?.('#sendBtn')
  if(!send)return
  e.preventDefault();e.stopImmediatePropagation()
  try{await queueText()}catch(err){console.warn(err);toast('Não foi possível guardar a mensagem offline.')}
},true)
document.addEventListener('keydown',async e=>{
  if(navigator.onLine||e.key!=='Enter'||e.shiftKey||e.target?.id!=='messageInput')return
  e.preventDefault();e.stopImmediatePropagation()
  try{await queueText()}catch(err){console.warn(err);toast('Não foi possível guardar a mensagem offline.')}
},true)
document.addEventListener('change',async e=>{
  if(navigator.onLine||e.target?.id!=='photoInput')return
  const file=e.target.files?.[0];if(!file)return
  e.preventDefault();e.stopImmediatePropagation()
  try{await queuePhoto(file)}catch(err){console.warn(err);toast('Não foi possível guardar a foto offline.')}
  try{e.target.value=''}catch{}
},true)

window.addEventListener('online',()=>setTimeout(flush,120))
window.addEventListener('pageshow',()=>{if(navigator.onLine)setTimeout(flush,350)})
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&navigator.onLine)setTimeout(flush,250)})
navigator.serviceWorker?.addEventListener?.('message',e=>{if(e.data?.type==='isa:background-sync')flush()})
setTimeout(()=>{if(navigator.onLine)flush()},900)
window.__ISA_OFFLINE_CHAT_SYNC__={flush,pending}
