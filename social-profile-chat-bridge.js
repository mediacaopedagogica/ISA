import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js'

// Nossa Rede: foto social independente da foto do Chat + conversa direta seguindo a mesma matriz social.
// Este módulo não altera family_members.avatar_ref (avatar do Chat).
const db=createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}})
const $=id=>document.getElementById(id)
const token=new URLSearchParams(location.hash.replace(/^#/, '')).get('acesso')||''
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ')
let directory=[],meId='',mainMe=null,lastFetch=0,busy=false

function isExternal(){return !!token&&!!(window.__ISA_FRIEND_PERSON__||$('friendName'))}
function toast(text){const t=$('friendToast')||$('toast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._socialBridge);t._socialBridge=setTimeout(()=>t.classList.add('hidden'),2800)}
function initial(name){return (String(name||'?').trim().charAt(0)||'💜').toUpperCase()}
function ext(file){const e=(file.name.split('.').pop()||'jpg').replace(/[^a-z0-9]/gi,'').toLowerCase();return e||'jpg'}
function validPhoto(file){if(!file)return'Escolha uma imagem.';if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type))return'Use JPG, PNG, WEBP ou GIF.';if(file.size>5*1024*1024)return'A foto pode ter até 5 MB.';return''}

async function externalApi(action,payload={}){
  const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/friend-social`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${CONFIG.SUPABASE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({token,action,...payload}),cache:'no-store'})
  let data={};try{data=await r.json()}catch{}
  if(!r.ok)throw new Error(data?.error||'Não foi possível atualizar a Nossa Rede.')
  return data
}
async function externalUploadAvatar(file){
  const form=new FormData();form.append('token',token);form.append('action','upload_avatar');form.append('file',file)
  const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/friend-social`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${CONFIG.SUPABASE_KEY}`},body:form,cache:'no-store'})
  let data={};try{data=await r.json()}catch{}
  if(!r.ok)throw new Error(data?.error||'Não foi possível atualizar a foto da Nossa Rede.')
  return data
}
async function externalOpenDirect(targetId){
  const r=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/friend_portal_open_direct`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${CONFIG.SUPABASE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({p_token:token,p_target_id:targetId}),cache:'no-store'})
  let data={};try{data=await r.json()}catch{}
  if(!r.ok)throw new Error(data?.message||data?.error||'Esta conversa não está disponível.')
  return data
}

async function getMainMe(){
  if(mainMe)return mainMe
  const {data:{user}}=await db.auth.getUser();if(!user)return null
  const {data,error}=await db.from('family_members').select('id,family_id,display_name').eq('auth_user_id',user.id).eq('active',true).single()
  if(error||!data)return null;mainMe=data;meId=data.id;return data
}
async function mainDirectory(){
  const me=await getMainMe();if(!me)return[]
  const {data,error}=await db.from('social_profiles').select('member_id,display_name,social_avatar_ref,family_members!social_profiles_member_id_fkey(id,display_name)').eq('family_id',me.family_id)
  if(error)throw error
  const rows=[]
  for(const p of data||[]){let avatarUrl='';if(p.social_avatar_ref){const {data:s}=await db.storage.from('social-media').createSignedUrl(p.social_avatar_ref,3600);avatarUrl=s?.signedUrl||''}rows.push({memberId:p.member_id,name:p.display_name||p.family_members?.display_name||'Família',avatarRef:p.social_avatar_ref||'',avatarUrl})}
  return rows
}
async function refreshDirectory(force=false){
  if(!force&&directory.length&&Date.now()-lastFetch<45000)return directory
  if(isExternal()){
    if(window.__ISA_FRIEND_ACCESS_VALID__!==true)return directory
    const snap=await externalApi('bootstrap');directory=snap.profiles||[];meId=snap.me?.id||window.__ISA_FRIEND_PERSON__?.id||''
  }else directory=await mainDirectory()
  lastFetch=Date.now();return directory
}
function byName(name){const n=norm(name);return directory.find(p=>norm(p.name)===n)||directory.find(p=>norm(p.name).split(' ')[0]===n.split(' ')[0])||null}
function ownProfile(){return directory.find(p=>p.memberId===meId)||byName(window.__ISA_FRIEND_PERSON__?.name||$('friendName')?.textContent||$('myName')?.textContent)}

function setAvatar(el,p,name){
  if(!el)return
  const src=p?.avatarUrl||''
  if(src){if(el.querySelector('img')?.src!==src)el.innerHTML=`<img src="${esc(src)}" alt="Foto de ${esc(name||p?.name||'perfil')}">`}
  else if(el.textContent!==initial(name||p?.name))el.textContent=initial(name||p?.name)
  el.dataset.socialAvatarIndependent='1'
}
function patchAvatars(){
  const roots=[$('socialPanel'),$('familySocialOverlay')].filter(Boolean)
  for(const root of roots){
    root.querySelectorAll('.social-profile-head').forEach(row=>{const name=row.querySelector('strong')?.textContent||'';setAvatar(row.querySelector('.social-avatar'),byName(name),name)})
    root.querySelectorAll('.social-family-item').forEach(row=>{const name=row.querySelector('strong')?.textContent||'';setAvatar(row.querySelector('.social-avatar'),byName(name),name)})
    root.querySelectorAll('.social-post-head').forEach(row=>{const name=row.querySelector('strong')?.textContent||'';setAvatar(row.querySelector('.social-avatar'),byName(name),name)})
  }
}

function addStyle(){if($('socialIndependentProfileStyle'))return;const s=document.createElement('style');s.id='socialIndependentProfileStyle';s.textContent=`
.social-independent-photo{display:flex;align-items:center;gap:12px;padding:12px;margin:10px 0;border-radius:18px;background:linear-gradient(145deg,#fff8fc,#f1ecff);border:1px solid #eee1f2}.social-independent-preview{width:74px;height:74px;flex:0 0 74px;border-radius:24px;overflow:hidden;display:grid;place-items:center;background:linear-gradient(145deg,#f6d7e7,#dcd0fa);font-size:30px;box-shadow:inset 0 0 0 1px #fff}.social-independent-preview img{width:100%;height:100%;object-fit:cover}.social-independent-info{min-width:0;flex:1}.social-independent-info strong{display:block;font-size:12px}.social-independent-info small{display:block;color:#87788e;font-size:9px;line-height:1.35;margin:3px 0 8px}.social-independent-actions{display:flex;gap:6px;flex-wrap:wrap}.social-independent-actions label,.social-independent-actions button{border:0;border-radius:11px;padding:7px 9px;background:#eadff5;color:#65506f;font-size:10px;font-weight:900;cursor:pointer}.social-independent-actions .remove{background:#fff0f3;color:#9f5668}.social-direct-btn{margin-left:auto!important;flex:0 0 auto;border:0;border-radius:10px;padding:6px 8px;background:#eee5f8;color:#695474;font-size:9px;font-weight:900;cursor:pointer}.social-family-item{position:relative}.social-family-item>div:not(.social-avatar){min-width:0;flex:1}.social-avatar img{width:100%;height:100%;object-fit:cover;display:block}
`;document.head.appendChild(s)}
function editorMarkup(prefix){const p=ownProfile(),name=p?.name||$('myName')?.textContent||$('friendName')?.textContent||'Perfil';return `<div class="social-independent-photo" data-social-photo-editor="${prefix}"><div class="social-independent-preview" id="${prefix}SocialPhotoPreview">${p?.avatarUrl?`<img src="${esc(p.avatarUrl)}" alt="Sua foto na Nossa Rede">`:esc(initial(name))}</div><div class="social-independent-info"><strong>Foto da Nossa Rede</strong><small>Esta foto aparece somente na Nossa Rede. A foto do Chat pode ser outra e não será alterada.</small><div class="social-independent-actions"><label>📷 Escolher foto<input id="${prefix}SocialPhotoInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden></label><button class="remove" id="${prefix}SocialPhotoRemove" type="button">Remover</button></div></div></div>`}
function ensureEditors(){
  addStyle()
  const main=$('socialProfileModal')?.querySelector('.social-modal-card');if(main&&!main.querySelector('[data-social-photo-editor="main"]')){main.querySelector('h3')?.insertAdjacentHTML('afterend',editorMarkup('main'));wireEditor('main')}
  const extModal=$('fsProfileModal')?.querySelector('.fs-profile-card');if(extModal&&!extModal.querySelector('[data-social-photo-editor="external"]')){extModal.querySelector('h3')?.insertAdjacentHTML('afterend',editorMarkup('external'));wireEditor('external')}
}
function updatePreview(prefix,p=ownProfile()){const el=$(`${prefix}SocialPhotoPreview`);if(!el)return;const name=p?.name||$('myName')?.textContent||$('friendName')?.textContent||'Perfil';el.innerHTML=p?.avatarUrl?`<img src="${esc(p.avatarUrl)}" alt="Sua foto na Nossa Rede">`:esc(initial(name))}
async function uploadMainAvatar(file){
  const me=await getMainMe();if(!me)throw new Error('Perfil não encontrado.')
  const {data:current}=await db.from('social_profiles').select('social_avatar_ref').eq('member_id',me.id).maybeSingle();const old=current?.social_avatar_ref||''
  const path=`${me.family_id}/${me.id}/profile/${crypto.randomUUID()}.${ext(file)}`
  const {error:up}=await db.storage.from('social-media').upload(path,file,{contentType:file.type,upsert:false});if(up)throw up
  let err=null
  if(current){const r=await db.from('social_profiles').update({social_avatar_ref:path,updated_at:new Date().toISOString()}).eq('member_id',me.id);err=r.error}
  else{const r=await db.from('social_profiles').insert({member_id:me.id,family_id:me.family_id,display_name:me.display_name,bio:'',status_text:'',mood_emoji:'💜',activity_label:'',theme:'lilac',social_avatar_ref:path});err=r.error}
  if(err){await db.storage.from('social-media').remove([path]);throw err}
  if(old&&old!==path)await db.storage.from('social-media').remove([old]).catch(()=>{})
}
async function removeMainAvatar(){const me=await getMainMe();if(!me)throw new Error('Perfil não encontrado.');const {data}=await db.from('social_profiles').select('social_avatar_ref').eq('member_id',me.id).maybeSingle();const old=data?.social_avatar_ref||'';const {error}=await db.from('social_profiles').update({social_avatar_ref:null,updated_at:new Date().toISOString()}).eq('member_id',me.id);if(error)throw error;if(old)await db.storage.from('social-media').remove([old]).catch(()=>{})}
function wireEditor(prefix){
  const input=$(`${prefix}SocialPhotoInput`),remove=$(`${prefix}SocialPhotoRemove`);if(!input||input.dataset.bound==='1')return;input.dataset.bound='1'
  input.onchange=async e=>{const file=e.target.files?.[0],problem=validPhoto(file);e.target.value='';if(problem)return toast(problem);if(busy)return;busy=true;try{toast('Atualizando a foto da Nossa Rede…');if(prefix==='external')await externalUploadAvatar(file);else await uploadMainAvatar(file);await refreshDirectory(true);updatePreview(prefix);patchAvatars();toast('Foto da Nossa Rede atualizada 💜 O Chat continua com a foto dele.')}catch(err){toast(err.message||'Não foi possível atualizar a foto.')}finally{busy=false}}
  remove.onclick=async()=>{if(busy)return;busy=true;try{if(prefix==='external')await externalApi('remove_avatar');else await removeMainAvatar();await refreshDirectory(true);updatePreview(prefix);patchAvatars();toast('Foto removida somente da Nossa Rede.')}catch(err){toast(err.message||'Não foi possível remover a foto.')}finally{busy=false}}
}

async function openDirect(p){
  if(!p?.memberId||p.memberId===meId)return
  if(busy)return;busy=true
  try{
    toast(`Abrindo conversa com ${p.name}…`)
    let data
    if(isExternal())data=await externalOpenDirect(p.memberId)
    else{const r=await db.rpc('social_open_direct',{p_target_id:p.memberId});if(r.error)throw r.error;data=r.data}
    const id=data?.conversationId||data?.conversation_id;if(!id)throw new Error('Não foi possível abrir a conversa.')
    sessionStorage.setItem('isa-social-chat-conversation',String(id));sessionStorage.setItem('isa-social-chat-mode','1')
    if(isExternal()){
      window.__ISA_CLOSE_FAMILY_SOCIAL__?.();$('familySocialOverlay')?.classList.add('hidden');await window.__ISA_FRIEND_REFRESH_LIST__?.();for(let i=0;i<30;i++){const b=document.querySelector(`[data-friend-conv="${CSS.escape(String(id))}"]`);if(b){b.click();sessionStorage.removeItem('isa-social-chat-conversation');break}await new Promise(r=>setTimeout(r,100))}
    }else{
      $('socialPanel')?.classList.add('hidden');document.getElementById('mainView')?.classList.remove('social-mode');document.querySelector('.nav-btn[data-tab="chats"]')?.click();
      for(let i=0;i<18;i++){const b=document.querySelector(`.chat-item[data-conv="${CSS.escape(String(id))}"]`);if(b){b.click();sessionStorage.removeItem('isa-social-chat-conversation');return}await new Promise(r=>setTimeout(r,120))}
      location.reload()
    }
  }catch(err){toast(err.message||'Esta conversa não está disponível.')}finally{busy=false}
}
function decorateDirectButtons(){
  for(const root of [$('socialPanel'),$('familySocialOverlay')].filter(Boolean))root.querySelectorAll('.social-family-item').forEach(row=>{
    const name=row.querySelector('strong')?.textContent||'',p=byName(name);if(!p||p.memberId===meId){row.querySelector('.social-direct-btn')?.remove();return}
    let b=row.querySelector('.social-direct-btn');if(!b){b=document.createElement('button');b.type='button';b.className='social-direct-btn';b.textContent='💬 Chat';row.appendChild(b)}b.dataset.targetId=p.memberId;b.onclick=e=>{e.preventDefault();e.stopPropagation();openDirect(p)}
  })
}
function filterSocialChatLists(){
  if(sessionStorage.getItem('isa-social-chat-mode')!=='1')return
  const allowed=new Set(directory.map(p=>norm(p.name)))
  document.querySelectorAll('#friendConversationList .friend-conversation').forEach(b=>{const title=norm(b.querySelector('strong')?.textContent||'');if(title&&!/grupo/.test(title)&&allowed.size&&!allowed.has(title.replace(/^👥\s*/,'')))b.style.display='none'})
  document.querySelectorAll('#chatList .chat-item').forEach(b=>{const title=norm(b.querySelector('strong')?.textContent||'').replace(/★/g,'').trim();if(title&&allowed.size&&!allowed.has(title)&&!title.includes('familia')&&!title.includes('grupo'))b.style.display='none'})
}
async function resumePending(){const id=sessionStorage.getItem('isa-social-chat-conversation');if(!id||isExternal())return;for(let i=0;i<80;i++){const b=document.querySelector(`.chat-item[data-conv="${CSS.escape(id)}"]`);if(b){document.querySelector('.nav-btn[data-tab="chats"]')?.click();b.click();sessionStorage.removeItem('isa-social-chat-conversation');return}await new Promise(r=>setTimeout(r,120))}}

async function sync(force=false){try{await refreshDirectory(force);ensureEditors();patchAvatars();decorateDirectButtons();filterSocialChatLists()}catch(e){console.warn('Nossa Rede perfil/chat:',e)}}
function schedule(force=false){[80,300,850,1600].forEach((ms,i)=>setTimeout(()=>sync(force&&i===0),ms))}

document.addEventListener('click',e=>{
  const social=e.target.closest?.('#friendSocialBtn,#socialNav,[data-ka-action="social"]');if(social)schedule(true)
  const chat=e.target.closest?.('#friendChatsTab,.isa-social-chat-link,[data-social-nav="chat"]');if(chat){sessionStorage.setItem('isa-social-chat-mode','1');schedule(false)}
  if(e.target.closest?.('#socialRefresh,#socialProfileSave,#fsProfileSave,[data-fs-react],[data-fs-comment]'))schedule(true)
},true)
document.addEventListener('isa:friend-portal-entered',()=>schedule(true))
window.__ISA_SOCIAL_PROFILE_CHAT_SYNC__=()=>sync(true)
window.__ISA_SOCIAL_OPEN_DIRECT__=openDirect
addStyle();schedule(true);resumePending()
setInterval(()=>{const visible=(!$('socialPanel')?.classList.contains('hidden'))||(!$('familySocialOverlay')?.classList.contains('hidden'));if(visible)sync(false)},4000)
