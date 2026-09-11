import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js?v=20260911-unified-profile-photo'

// Uma única foto de perfil para Chat + Nossa Rede.
// Camada aditiva: não substitui os uploaders existentes; apenas sincroniza o outro lado.
if(!window.__ISA_PROFILE_PHOTO_UNIFIED_SYNC_V1__){
  window.__ISA_PROFILE_PHOTO_UNIFIED_SYNC_V1__=true
  const db=createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}})
  const $=id=>document.getElementById(id)
  const token=new URLSearchParams(location.hash.replace(/^#/, '')).get('acesso')||''
  const allowed=new Set(['image/jpeg','image/png','image/webp','image/gif'])
  let me=null,copyTimer=0

  function toast(text){
    const t=$('friendToast')||$('toast')||$('pssToast');if(!t)return
    t.textContent=text;t.classList.remove('hidden');t.classList.add('show')
    clearTimeout(t._unifiedPhoto);t._unifiedPhoto=setTimeout(()=>{t.classList.add('hidden');t.classList.remove('show')},2800)
  }
  function extension(file){return((file?.name||'photo.jpg').split('.').pop()||'jpg').replace(/[^a-z0-9]/gi,'').toLowerCase()||'jpg'}
  function valid(file){return!!file&&allowed.has(file.type)&&file.size<=5*1024*1024}

  async function identity(){
    if(me)return me
    const {data:{user}}=await db.auth.getUser();if(!user)throw new Error('Perfil não identificado.')
    const {data,error}=await db.from('family_members').select('id,family_id,display_name,avatar_ref').eq('auth_user_id',user.id).eq('active',true).maybeSingle()
    if(error||!data)throw error||new Error('Perfil não identificado.')
    me=data;return me
  }

  async function syncMainSocial(file){
    const who=await identity()
    const {data:current}=await db.from('social_profiles').select('member_id,social_avatar_ref').eq('member_id',who.id).maybeSingle()
    const old=current?.social_avatar_ref||''
    const path=`${who.family_id}/${who.id}/profile/${crypto.randomUUID()}.${extension(file)}`
    const {error:up}=await db.storage.from('social-media').upload(path,file,{contentType:file.type,upsert:false});if(up)throw up
    let error=null
    if(current?.member_id){
      ;({error}=await db.from('social_profiles').update({social_avatar_ref:path,updated_at:new Date().toISOString()}).eq('member_id',who.id))
    }else{
      ;({error}=await db.from('social_profiles').insert({member_id:who.id,family_id:who.family_id,display_name:who.display_name,social_avatar_ref:path,updated_at:new Date().toISOString()}))
    }
    if(error){await db.storage.from('social-media').remove([path]).catch(()=>{});throw error}
    if(old&&old!==path)await db.storage.from('social-media').remove([old]).catch(()=>{})
    window.__ISA_SOCIAL_PROFILE_CHAT_SYNC__?.()
  }

  async function syncMainChat(file){
    const who=await identity()
    const path=`${who.family_id}/${who.id}/avatar-${crypto.randomUUID()}.${extension(file)}`
    const {error:up}=await db.storage.from('profile-avatars').upload(path,file,{contentType:file.type,upsert:false});if(up)throw up
    const {data,error}=await db.functions.invoke('profile-actions',{body:{action:'set_avatar',avatarRef:path}})
    if(error||data?.error){await db.storage.from('profile-avatars').remove([path]).catch(()=>{});throw new Error(data?.error||error?.message||'Não foi possível sincronizar a foto do Chat.')}
    if(data?.oldRef&&data.oldRef!==path)await db.storage.from('profile-avatars').remove([data.oldRef]).catch(()=>{})
    who.avatar_ref=path
    const url=URL.createObjectURL(file),avatar=$('myAvatar')
    if(avatar)avatar.innerHTML=`<img src="${url}" alt="Minha foto">`
    setTimeout(()=>URL.revokeObjectURL(url),60000)
  }

  async function externalUpload(endpoint,action,file){
    if(!token)throw new Error('Acesso familiar não identificado.')
    const form=new FormData();form.append('token',token);form.append('action',action);form.append('file',file)
    const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/${endpoint}`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY},body:form,cache:'no-store'})
    const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error||'Não foi possível sincronizar a foto.');return d
  }
  async function syncExternalSocial(file){
    await externalUpload('friend-social','upload_avatar',file)
    try{await window.__ISA_EXTERNAL_PROFILE_PARITY__?.refreshEverything?.()}catch{}
    try{await window.__ISA_REFRESH_EXTERNAL_SOCIAL_V72__?.()}catch{}
  }
  async function syncExternalChat(file){
    const d=await externalUpload('friend-media','profile',file)
    const url=d?.url||d?.avatarUrl||''
    const avatar=document.querySelector('.friend-profile .friend-avatar,#friendAvatar')
    if(avatar&&url){avatar.style.backgroundImage=`url("${url}")`;avatar.classList.add('has-photo')}
  }

  function scanCopy(){
    document.querySelectorAll('.social-independent-info').forEach(box=>{
      const b=box.querySelector('strong'),s=box.querySelector('small');if(b)b.textContent='Foto do perfil';if(s)s.textContent='Ao escolher uma foto, ela aparece no Chat e na Nossa Rede.'
    })
    document.querySelectorAll('.external-profile-photo-copy').forEach(box=>{
      const b=box.querySelector('b'),s=box.querySelector('small');if(b)b.textContent='Foto do perfil';if(s)s.textContent='Ao escolher uma foto, ela aparece no Chat e na Nossa Rede.'
    })
  }
  function scheduleCopy(){clearTimeout(copyTimer);copyTimer=setTimeout(scanCopy,60)}

  // Captura o arquivo antes que o uploader original limpe o input.
  // Não cancela nem substitui o evento: o fluxo que já funcionava continua intacto.
  document.addEventListener('change',e=>{
    const input=e.target
    if(!(input instanceof HTMLInputElement)||input.type!=='file')return
    const id=input.id
    if(!['profileAvatarInput','mainSocialPhotoInput','epPhoto','externalProfilePhotoInput','externalSocialPhotoInput'].includes(id))return
    const file=input.files?.[0];if(!valid(file))return
    Promise.resolve().then(async()=>{
      try{
        if(id==='profileAvatarInput')await syncMainSocial(file)
        else if(id==='mainSocialPhotoInput')await syncMainChat(file)
        else if(id==='epPhoto')await syncExternalSocial(file)
        else await syncExternalChat(file)
        setTimeout(async()=>{
          scanCopy()
          try{window.__ISA_SOCIAL_PROFILE_CHAT_SYNC__?.()}catch{}
          try{await window.__ISA_EXTERNAL_PROFILE_PARITY__?.refreshEverything?.()}catch{}
          toast('Foto sincronizada no Chat e na Nossa Rede 💜')
        },750)
      }catch(err){
        console.warn('Sincronização da foto de perfil:',err)
        setTimeout(()=>toast('A foto foi salva, mas a sincronização com o outro perfil não terminou.'),750)
      }
    })
  },true)

  new MutationObserver(scheduleCopy).observe(document.documentElement,{childList:true,subtree:true})
  scanCopy();setTimeout(scanCopy,700);setTimeout(scanCopy,1800)
  window.__ISA_PROFILE_PHOTO_UNIFIED_SYNC__={scan:scanCopy}
}
