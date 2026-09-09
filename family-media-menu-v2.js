import { CONFIG } from './config.js'
import { capturePhoto, recordAudio } from './media-capture.js?v=4-audio-file-mime'

const $=id=>document.getElementById(id)
let me=null,audioHydrateBusy=false,audioHydrateTimer=null
const dedicatedMobile=new URLSearchParams(location.search).get('mobile')==='1'

function sessionToken(){
  try{
    const ref=new URL(CONFIG.SUPABASE_URL).hostname.split('.')[0]
    const raw=localStorage.getItem(`sb-${ref}-auth-token`)
    if(!raw)return null
    const d=JSON.parse(raw)
    return d?.access_token||d?.currentSession?.access_token||d?.session?.access_token||null
  }catch{return null}
}
function jwtSub(token){try{return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).sub||null}catch{return null}}
async function identity(){
  if(me)return me
  const token=sessionToken();if(!token)throw new Error('Sem sessão')
  const sub=jwtSub(token)
  const r=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/family_members?select=id,family_id,display_name,relationship_label,role&auth_user_id=eq.${encodeURIComponent(sub)}&active=eq.true&limit=1`,{headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${token}`}})
  const rows=await r.json();if(!r.ok||!rows?.[0])throw new Error('Perfil não encontrado')
  me=rows[0];return me
}
function toast(text){const t=$('toast');if(!t)return alert(text);t.textContent=text;t.classList.remove('hidden');clearTimeout(t._fm2);t._fm2=setTimeout(()=>t.classList.add('hidden'),3000)}
function activeConv(){return document.querySelector('.chat-item.active[data-conv]')?.dataset.conv||null}
function isSupervision(){return !$('supervisionNotice')?.classList.contains('hidden')}
function isChatOpen(){return $('chatPanel')&&!$('chatPanel').classList.contains('hidden')}
function fmtTime(ts){try{return new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit'}).format(new Date(ts))}catch{return''}}
async function conversationHasFriend(id){
  const token=sessionToken();if(!token||!id)return false
  const r=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/conversation_members?select=family_members(relationship_label)&conversation_id=eq.${id}`,{headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${token}`},cache:'no-store'})
  if(!r.ok)return false
  const rows=await r.json();return rows.some(x=>/amiga/i.test(x.family_members?.relationship_label||''))
}
function fileExt(file,fallback){return (file?.name?.split('.').pop()||fallback).replace(/[^a-z0-9]/gi,'').toLowerCase()||fallback}
function uploadMime(file,kind){
  const raw=String(file?.type||'').trim().toLowerCase()
  if(kind==='audio'){
    if(raw.startsWith('audio/webm'))return 'audio/webm'
    if(raw.startsWith('audio/ogg'))return 'audio/ogg'
    if(raw.startsWith('audio/mp4')||raw.startsWith('audio/m4a'))return 'audio/mp4'
    return 'audio/webm'
  }
  return raw||'image/jpeg'
}
async function uploadMedia(file,kind,{duration=null,maxMb=12}={}){
  const id=activeConv();if(!id||!file)return
  if(kind==='audio'&&await conversationHasFriend(id))return toast('Áudio fica disponível somente nas conversas da família.')
  if(file.size>maxMb*1024*1024)return toast(`Use um arquivo de até ${maxMb} MB.`)
  const token=sessionToken();if(!token)return toast('Entre novamente no Cantinho.')
  let path=''
  try{
    const u=await identity()
    const fallback=kind==='audio'?'webm':'jpg',ext=fileExt(file,fallback),contentType=uploadMime(file,kind)
    const uploadFile=kind==='audio'&&file.type!==contentType?new File([file],file.name||`audio-${Date.now()}.${ext}`,{type:contentType}):file
    path=`${u.family_id}/${id}/${u.id}/${crypto.randomUUID()}.${ext}`
    toast(kind==='audio'?'Enviando áudio…':'Enviando foto…')
    const up=await fetch(`${CONFIG.SUPABASE_URL}/storage/v1/object/chat-temp/${path}`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${token}`,'Content-Type':contentType,'x-upsert':'false'},body:uploadFile})
    if(!up.ok){let d=null;try{d=await up.json()}catch{};throw new Error(d?.message||`Não foi possível enviar ${kind==='audio'?'o áudio':'a foto'}.`)}
    const expires=new Date(Date.now()+(kind==='audio'?1:7)*86400000).toISOString()
    const payload={conversation_id:id,sender_id:u.id,kind,media_provider:'supabase-storage',media_ref:path,media_mime:contentType,media_expires_at:expires}
    if(kind==='audio')payload.media_duration_ms=duration||null
    const ins=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/messages`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(payload)})
    if(!ins.ok){await fetch(`${CONFIG.SUPABASE_URL}/storage/v1/object/chat-temp/${path}`,{method:'DELETE',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${token}`}}).catch(()=>{});let d=null;try{d=await ins.json()}catch{};throw new Error(d?.message||`${kind==='audio'?'Áudio':'Foto'} não permitido nesta conversa.`)}
    toast(kind==='audio'?'Áudio enviado 🎙️':'Foto enviada 📷')
    if(kind==='audio'){scheduleHydrate(120);setTimeout(()=>scheduleHydrate(0),700)}
  }catch(e){console.error('Envio de mídia:',e);toast(e.message||'Não foi possível enviar.')}
}
async function sendNativePhoto(){
  try{const file=await capturePhoto();if(file)await uploadMedia(file,'photo',{maxMb:10})}catch(e){toast(e.message||'Não foi possível tirar a foto.')}
}
function chooseImage(){const i=$('photoInput');if(!i)return;i.removeAttribute('capture');i.setAttribute('accept','image/jpeg,image/png,image/webp,image/gif');i.click()}
async function startNativeRecording(){
  const id=activeConv();if(!id)return
  if(await conversationHasFriend(id))return toast('Áudio fica disponível somente nas conversas da família.')
  try{const result=await recordAudio();if(result?.file)await uploadMedia(result.file,'audio',{duration:result.durationMs,maxMb:12})}catch(e){toast(e.message||'Não foi possível iniciar o gravador.')}
}
async function signed(path){
  const token=sessionToken();if(!token)throw new Error('Sem sessão')
  const r=await fetch(`${CONFIG.SUPABASE_URL}/storage/v1/object/sign/chat-temp/${path}`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({expiresIn:300})})
  const d=await r.json();if(!r.ok)throw new Error('Não foi possível liberar o áudio.')
  const raw=d.signedURL||d.signedUrl;if(!raw)throw new Error('URL do áudio indisponível.')
  if(/^https?:\/\//i.test(raw))return raw
  return `${CONFIG.SUPABASE_URL}/storage/v1${raw.startsWith('/')?'':'/'}${raw}`
}
function ensureAudioBubble(m){
  let row=document.getElementById(`msg-${m.id}`)
  if(!row){
    const box=$('messages');if(!box)return null
    const mine=!!me&&m.sender_id===me.id
    row=document.createElement('div');row.className=`message-row ${mine?'mine':''}`;row.id=`msg-${m.id}`;row.dataset.audioSynthetic='1'
    row.innerHTML=`<div class="bubble">${mine?'':'<span class="sender">Família</span>'}<span class="meta">${fmtTime(m.sent_at)}</span></div>`
    box.appendChild(row)
    requestAnimationFrame(()=>{box.scrollTop=box.scrollHeight})
  }
  return row.querySelector('.bubble')
}
async function hydrateAudio(){
  if(audioHydrateBusy||!isChatOpen())return
  const id=activeConv(),token=sessionToken();if(!id||!token)return
  audioHydrateBusy=true
  try{
    if(!me)await identity().catch(()=>null)
    const r=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/messages?select=id,sender_id,sent_at,media_ref,media_mime,media_expires_at,media_deleted_at,deleted_at&conversation_id=eq.${id}&kind=eq.audio&deleted_at=is.null&order=sent_at.asc`,{headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${token}`},cache:'no-store'})
    if(!r.ok)return
    for(const m of await r.json()){
      const bubble=ensureAudioBubble(m);if(!bubble||bubble.querySelector('.chat-audio'))continue
      const expired=m.media_expires_at&&new Date(m.media_expires_at).getTime()<=Date.now()
      if(!m.media_ref||m.media_deleted_at||expired){if(!bubble.querySelector('.audio-unavailable'))bubble.insertAdjacentHTML('afterbegin','<div class="photo-expired audio-unavailable">🎙️ Áudio expirado após 1 dia.</div>');continue}
      try{
        const url=await signed(m.media_ref)
        const a=document.createElement('audio');a.className='chat-audio';a.controls=true;a.preload='metadata';a.src=url;a.style.display='block';a.style.width='min(360px,100%)';a.style.maxWidth='100%';a.setAttribute('controlsList','nodownload');bubble.prepend(a);a.load()
      }catch{
        if(!bubble.querySelector('.audio-unavailable'))bubble.insertAdjacentHTML('afterbegin','<div class="photo-expired audio-unavailable">🎙️ Áudio indisponível.</div>')
      }
    }
  }finally{audioHydrateBusy=false}
}
function scheduleHydrate(delay=220){clearTimeout(audioHydrateTimer);audioHydrateTimer=setTimeout(hydrateAudio,delay)}
function addCompactCss(){
  if($('compactChatToolsCss'))return
  const s=document.createElement('style');s.id='compactChatToolsCss';s.textContent=`
  #chatPanel,.chat-header,.messages,.composer{min-width:0!important;max-width:100%!important;box-sizing:border-box!important}.chat-header>.grow{min-width:0!important;overflow:hidden!important}.chat-header h3,.chat-header small{max-width:100%!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}.messages{overflow-x:hidden!important}.bubble{overflow-wrap:anywhere!important}.messages img,.messages video{max-width:100%!important;height:auto!important}
  #chatPanel .isa-call-actions{display:none!important}.composer.compact-chat-tools{display:grid!important;grid-template-columns:42px minmax(0,1fr) 42px!important;align-items:end!important;gap:7px!important;width:100%!important;max-width:100%!important;overflow:visible!important}.composer.compact-chat-tools>.group-plus-wrap{grid-column:1!important;grid-row:1!important}.composer.compact-chat-tools>#photoBtn,.composer.compact-chat-tools>#pssStickerBtn,.composer.compact-chat-tools>.emoji-wrap>#emojiBtn{display:none!important}.composer.compact-chat-tools>.emoji-wrap{grid-column:1!important;grid-row:1!important;width:0!important;height:0!important;min-width:0!important;overflow:visible!important;position:relative!important}.composer.compact-chat-tools>textarea{grid-column:2!important;grid-row:1!important;width:100%!important;max-width:100%!important;min-width:0!important;margin:0!important}.composer.compact-chat-tools>.send-btn{grid-column:3!important;grid-row:1!important;margin:0!important}.composer.compact-chat-tools .plus-menu{min-width:235px!important;max-height:min(430px,65dvh)!important;overflow:auto!important}
  @media(max-width:850px){.composer.compact-chat-tools{grid-template-columns:42px minmax(0,1fr) 42px!important;padding-left:8px!important;padding-right:8px!important}.composer.compact-chat-tools .plus-menu{position:fixed!important;left:8px!important;right:8px!important;bottom:calc(60px + env(safe-area-inset-bottom))!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:5px!important;min-width:0!important;max-height:48dvh!important;padding:8px!important}.composer.compact-chat-tools .plus-menu.hidden{display:none!important}.composer.compact-chat-tools .plus-menu button{min-height:45px!important}.bubble{max-width:min(88%,calc(100vw - 42px))!important}}
  `;document.head.appendChild(s)
}
async function openSticker(){
  try{
    await import('./profile-status-stickers.js?v=14-plus-menu')
    await import('./sticker-bg-remover.js?v=1-ai-cutout')
    for(let i=0;i<20&&typeof window.__ISA_OPEN_STICKER_CREATOR__!=='function';i++)await new Promise(r=>setTimeout(r,70))
    window.__ISA_ENSURE_STICKER_BG_REMOVER__?.()
    if(typeof window.__ISA_OPEN_STICKER_CREATOR__==='function')window.__ISA_OPEN_STICKER_CREATOR__();else toast('O criador de stickers ainda está carregando.')
  }catch{toast('Não foi possível abrir o criador de stickers.')}
}
function openEmoji(){const b=$('emojiBtn');if(b)b.click();else toast('Os emojis ainda estão carregando.')}
async function launchCall(kind){
  try{
    await import('./call-manager.js?v=18-plus-menu')
    const id=kind==='video'?'isaVideoCall':'isaVoiceCall'
    for(let i=0;i<20&&!$(id);i++){document.dispatchEvent(new Event('visibilitychange'));await new Promise(r=>setTimeout(r,80))}
    const b=$(id);if(!b)return toast('A chamada ainda está carregando. Tente novamente.')
    b.click()
  }catch{toast('Não foi possível iniciar a chamada.')}
}
function ensureMenu(){
  if(!isChatOpen()||isSupervision())return
  addCompactCss()
  const plus=$('groupPlusBtn'),menu=$('groupPlusMenu'),composer=$('composer');if(!plus||!menu||!composer)return
  plus.classList.remove('hidden');composer.classList.add('compact-chat-tools')
  menu.querySelector('[data-group-action="photo"]')?.classList.add('hidden')
  menu.querySelectorAll('[data-family-media]').forEach(n=>n.remove())
  const items=[
    ['sticker','✨ Criar sticker',openSticker],
    ['camera','📷 Tirar foto',sendNativePhoto],
    ['image','🖼️ Enviar imagem',chooseImage],
    ['record','🎙️ Gravar áudio',startNativeRecording],
    ['emoji','😊 Emojis',openEmoji],
    ['voice','📞 Chamada de voz',()=>launchCall('voice')],
    ['video','🎥 Videochamada',()=>launchCall('video')]
  ]
  for(const [key,label,fn] of items){const b=document.createElement('button');b.type='button';b.dataset.familyMedia=key;b.textContent=label;b.onclick=async()=>{menu.classList.add('hidden');await fn()};menu.appendChild(b)}
  scheduleHydrate(120)
}
function bindLifecycle(){
  ensureMenu()
  const messages=$('messages');if(messages&&!messages.dataset.audioHydrateObservedV2){messages.dataset.audioHydrateObservedV2='1';const obs=new MutationObserver(()=>scheduleHydrate());obs.observe(messages,{childList:true,subtree:true})}
  const list=$('chatList');if(list&&!list.dataset.familyMediaV2Bound){list.dataset.familyMediaV2Bound='1';list.addEventListener('click',e=>{if(e.target.closest('.chat-item[data-conv]'))setTimeout(()=>{ensureMenu();scheduleHydrate()},140)})}
  document.querySelector('[data-tab="chats"]')?.addEventListener('click',()=>setTimeout(ensureMenu,80))
  setInterval(()=>{if(document.visibilityState==='visible'&&isChatOpen()){ensureMenu();scheduleHydrate(0)}},3000)
}
bindLifecycle()
