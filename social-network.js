import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js'

const db=createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}})
const $=id=>document.getElementById(id)
let me=null,profile=null,familyProfiles=[],posts=[],selectedFiles=[],activeTheme='lilac',booted=false,refreshTimer=null
const mediaUrlCache=new Map()
const reactions=['💜','❤️','🥰','😂','👏','😮']
const quickEmoji=['💜','💕','✨','🥰','😂','😍','🌷','🫶','🔥','🎶','📚','☀️','🌙','🏡','🎉','💫']
const themes={pink:'#f4b6cf',lilac:'#c7b5ee',green:'#b8deb9',yellow:'#f5df92',blue:'#b9d9ef'}

function esc(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function toast(text){const t=$('toast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._social);t._social=setTimeout(()=>t.classList.add('hidden'),3200)}
function fmtTime(ts){const d=new Date(ts),now=new Date(),same=d.toDateString()===now.toDateString();return same?`Hoje, ${d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`:d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}
function avatarHtml(member,small=false){const ref=member?.avatar_ref||'';if(ref.startsWith('emoji:'))return `<div class="social-avatar">${esc(ref.slice(6))}</div>`;const initial=(member?.display_name||'?').trim().charAt(0).toUpperCase();return `<div class="social-avatar">${esc(initial||'💜')}</div>`}
function displayName(member,p=undefined){return (p?.display_name||member?.display_name||'Família').trim()}

async function identity(){
  const {data:{user}}=await db.auth.getUser();if(!user)return null
  const {data,error}=await db.from('family_members').select('id,family_id,display_name,relationship_label,role,avatar_ref,can_post_status').eq('auth_user_id',user.id).eq('active',true).single()
  if(error||!data)return null;me=data
  const {data:sp}=await db.from('social_profiles').select('*').eq('member_id',me.id).maybeSingle()
  if(!sp){
    const seed={member_id:me.id,family_id:me.family_id,display_name:me.display_name,bio:'',status_text:'',mood_emoji:'💜',activity_label:'',theme:'lilac'}
    const {data:newP}=await db.from('social_profiles').upsert(seed,{onConflict:'member_id'}).select().single();profile=newP||seed
  }else profile=sp
  activeTheme=profile.theme||'lilac';return me
}

function injectUi(){
  if($('socialNav'))return
  const css=document.createElement('link');css.rel='stylesheet';css.href='./social-network.css?v=2';document.head.appendChild(css)
  const nav=document.querySelector('.nav-tabs');if(!nav)return
  const btn=document.createElement('button');btn.className='nav-btn';btn.id='socialNav';btn.type='button';btn.innerHTML='🌸 <span>Nossa Rede</span>'
  const calendar=nav.querySelector('[data-tab="calendar"]');calendar?.after(btn)
  const content=document.querySelector('main.content');if(!content)return
  const panel=document.createElement('section');panel.id='socialPanel';panel.className='social-panel hidden';panel.innerHTML=`
    <div class="social-shell">
      <aside class="social-card social-side">
        <div class="social-brand">Nossa <span>Rede</span> ✨</div>
        <div id="socialMyProfile"></div>
      </aside>
      <section class="social-main">
        <div class="social-card social-topbar"><div><h2>Nosso cantinho social 💕</h2><small>Fotos, vídeos, momentos e atualizações da família</small></div><button id="socialRefresh" class="social-btn soft" type="button">↻</button></div>
        <div id="socialStatusStrip" class="social-status-strip"></div>
        <div class="social-card social-composer">
          <textarea id="socialCaption" maxlength="2200" placeholder="Compartilhe um momento, uma legenda, uma frase... ✨"></textarea>
          <div id="socialEmojiRow" class="social-emoji-row">${quickEmoji.map(e=>`<button type="button" data-social-emoji="${e}">${e}</button>`).join('')}</div>
          <div id="socialPreview" class="social-preview"></div>
          <div class="social-compose-actions">
            <label class="social-btn soft">🖼️ Fotos / vídeo<input id="socialMediaInput" class="social-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" multiple></label>
            <button id="socialEmojiBtn" class="social-btn soft" type="button">😊 Emoji</button>
            <input id="socialLocation" maxlength="80" placeholder="📍 Lugar (opcional)" style="flex:1;min-width:140px;border:1px solid #eadff0;border-radius:14px;padding:9px 11px;background:#fff">
            <button id="socialPublish" class="social-btn primary" type="button">Publicar</button>
          </div>
        </div>
        <div id="socialFeed" class="social-feed"></div>
      </section>
      <aside class="social-card social-right"><h3>Família agora 💫</h3><div id="socialFamilyList" class="social-family-list"></div></aside>
    </div>`
  content.appendChild(panel)
  const modal=document.createElement('div');modal.id='socialProfileModal';modal.className='social-modal';modal.innerHTML=`<div class="social-card social-modal-card"><h3>Personalizar meu perfil ✨</h3><div class="social-field"><label>Nome na Nossa Rede</label><input id="socialName" maxlength="50"></div><div class="social-field"><label>Bio</label><textarea id="socialBio" maxlength="240" rows="3" placeholder="Conte um pouquinho sobre você..."></textarea></div><div class="social-field"><label>Frase / atualização do dia</label><input id="socialStatus" maxlength="120" placeholder="Ex.: Um dia de cada vez ✨"></div><div class="social-field"><label>Como estou me sentindo</label><select id="socialMood"><option>💜</option><option>🥰</option><option>😊</option><option>😂</option><option>😴</option><option>🤩</option><option>😌</option><option>🥳</option><option>🤗</option><option>🤔</option><option>😎</option><option>💪</option></select></div><div class="social-field"><label>O que estou fazendo</label><select id="socialActivity"><option value="">Nada agora</option><option>🏫 Na escola</option><option>💼 No trabalho</option><option>📚 Estudando</option><option>🏡 Em casa</option><option>🎶 Ouvindo música</option><option>🎮 Jogando</option><option>🚗 Na estrada</option><option>☕ Relaxando</option><option>🛍️ Passeando</option><option>✈️ Viajando</option></select></div><div class="social-field"><label>Tema do perfil</label><div class="social-theme-grid">${Object.keys(themes).map(t=>`<button type="button" class="social-theme" data-theme="${t}" title="${t}"></button>`).join('')}</div></div><div class="social-modal-actions"><button id="socialProfileCancel" class="social-btn soft" type="button">Cancelar</button><button id="socialProfileSave" class="social-btn primary" type="button">Salvar perfil</button></div></div>`
  document.body.appendChild(modal)
  wireUi()
}

function allMainSections(){return [...document.querySelectorAll('main.content > section')]}
function openSocial(){
  allMainSections().forEach(s=>s.classList.add('hidden'));$('socialPanel')?.classList.remove('hidden')
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.id==='socialNav'))
  document.getElementById('mainView')?.classList.add('social-mode')
  loadAll(true).catch(e=>{console.error(e);toast('Não foi possível atualizar a Nossa Rede.')})
}
function leaveSocial(){
  $('socialPanel')?.classList.add('hidden');document.getElementById('mainView')?.classList.remove('social-mode')
}

function wireUi(){
  $('socialNav')?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openSocial()},true)
  document.querySelector('.nav-tabs')?.addEventListener('click',e=>{const b=e.target.closest('.nav-btn');if(b&&b.id!=='socialNav')leaveSocial()},true)
  $('socialRefresh').onclick=()=>loadAll(true)
  $('socialEmojiBtn').onclick=()=>$('socialEmojiRow').classList.toggle('show')
  document.querySelectorAll('[data-social-emoji]').forEach(b=>b.onclick=()=>{const ta=$('socialCaption');ta.value+=b.dataset.socialEmoji;ta.focus()})
  $('socialMediaInput').onchange=e=>{selectedFiles=[...e.target.files].slice(0,10);renderPreview()}
  $('socialPublish').onclick=publishPost
  $('socialProfileCancel').onclick=()=>closeProfileModal()
  $('socialProfileSave').onclick=saveProfile
  document.querySelectorAll('.social-theme').forEach(b=>b.onclick=()=>{activeTheme=b.dataset.theme;document.querySelectorAll('.social-theme').forEach(x=>x.classList.toggle('active',x.dataset.theme===activeTheme))})
  $('socialProfileModal').addEventListener('click',e=>{if(e.target.id==='socialProfileModal')closeProfileModal()})
}

function renderPreview(){
  const box=$('socialPreview');box.innerHTML='';for(const file of selectedFiles){const url=URL.createObjectURL(file),d=document.createElement('div');d.className='social-preview-item';d.innerHTML=file.type.startsWith('video/')?`<video src="${url}" muted></video>`:`<img src="${url}" alt="Prévia">`;box.appendChild(d)}
}

function openProfileModal(){
  $('socialName').value=profile?.display_name||me.display_name;$('socialBio').value=profile?.bio||'';$('socialStatus').value=profile?.status_text||'';$('socialMood').value=profile?.mood_emoji||'💜';$('socialActivity').value=profile?.activity_label||'';activeTheme=profile?.theme||'lilac';document.querySelectorAll('.social-theme').forEach(x=>x.classList.toggle('active',x.dataset.theme===activeTheme));$('socialProfileModal').classList.add('show')
}
function closeProfileModal(){$('socialProfileModal')?.classList.remove('show')}
async function saveProfile(){
  const payload={member_id:me.id,family_id:me.family_id,display_name:$('socialName').value.trim()||me.display_name,bio:$('socialBio').value.trim(),status_text:$('socialStatus').value.trim(),mood_emoji:$('socialMood').value,activity_label:$('socialActivity').value,theme:activeTheme,updated_at:new Date().toISOString()}
  const {data,error}=await db.from('social_profiles').upsert(payload,{onConflict:'member_id'}).select().single();if(error)return toast('Não foi possível salvar o perfil.');profile=data;closeProfileModal();toast('Perfil atualizado ✨');await loadAll(true)
}

async function mediaUrl(path,bucket='social-media'){
  const key=bucket+':'+path;if(mediaUrlCache.has(key))return mediaUrlCache.get(key)
  const {data,error}=await db.storage.from(bucket).createSignedUrl(path,3600);const url=error?'':data?.signedUrl||'';mediaUrlCache.set(key,url);return url
}
async function uploadFile(file,postId,idx){
  if(file.size>50*1024*1024)throw new Error('Cada arquivo pode ter até 50 MB.')
  const ext=(file.name.split('.').pop()|| (file.type.startsWith('video/')?'mp4':'jpg')).replace(/[^a-z0-9]/gi,'').toLowerCase();const path=`${me.family_id}/${me.id}/${postId}/${String(idx).padStart(2,'0')}-${crypto.randomUUID()}.${ext}`
  const {error}=await db.storage.from('social-media').upload(path,file,{contentType:file.type||undefined,upsert:false});if(error)throw error;return path
}

async function publishPost(){
  const caption=$('socialCaption').value.trim(),location=$('socialLocation').value.trim();if(!caption&&!selectedFiles.length)return toast('Escreva algo ou escolha uma foto/vídeo.')
  const btn=$('socialPublish');btn.disabled=true;btn.textContent='Publicando…'
  let post=null
  try{
    const {data,error}=await db.from('social_posts').insert({family_id:me.family_id,author_id:me.id,caption,location_label:location}).select().single();if(error)throw error;post=data
    const mediaRows=[]
    for(let i=0;i<selectedFiles.length;i++){const f=selectedFiles[i],path=await uploadFile(f,post.id,i);mediaRows.push({post_id:post.id,media_type:f.type.startsWith('video/')?'video':'image',storage_path:path,mime_type:f.type,sort_order:i})}
    if(mediaRows.length){const {error:me}=await db.from('social_post_media').insert(mediaRows);if(me)throw me}
    $('socialCaption').value='';$('socialLocation').value='';$('socialMediaInput').value='';selectedFiles=[];renderPreview();toast('Publicado na Nossa Rede 💕');await loadAll(true)
  }catch(e){console.error(e);if(post?.id)await db.from('social_posts').update({deleted_at:new Date().toISOString()}).eq('id',post.id);toast(e.message||'Não foi possível publicar.')}
  finally{btn.disabled=false;btn.textContent='Publicar'}
}

async function loadProfiles(){
  const {data,error}=await db.from('social_profiles').select('member_id,family_id,display_name,bio,status_text,mood_emoji,activity_label,theme,updated_at,family_members!social_profiles_member_id_fkey(id,display_name,relationship_label,avatar_ref)').eq('family_id',me.family_id).order('updated_at',{ascending:false});if(error)throw error;familyProfiles=data||[]
}
async function loadPosts(){
  const {data,error}=await db.from('social_posts').select('id,family_id,author_id,caption,location_label,created_at,updated_at,author:family_members!social_posts_author_id_fkey(id,display_name,relationship_label,avatar_ref),media:social_post_media(id,media_type,storage_path,mime_type,sort_order),reactions:social_post_reactions(member_id,reaction),comments:social_post_comments(id,author_id,body,created_at,deleted_at,author:family_members!social_post_comments_author_id_fkey(id,display_name,avatar_ref))').eq('family_id',me.family_id).is('deleted_at',null).order('created_at',{ascending:false}).limit(40);if(error)throw error;posts=data||[];for(const p of posts){p.media=(p.media||[]).sort((a,b)=>a.sort_order-b.sort_order);p.comments=(p.comments||[]).filter(c=>!c.deleted_at).sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));for(const m of p.media)m.url=await mediaUrl(m.storage_path)}
}
async function loadAll(force=false){
  if(!me)await identity();if(!me)return
  if(force)mediaUrlCache.clear();await Promise.all([loadProfiles(),loadPosts()]);renderAll()
}

function renderAll(){renderMyProfile();renderStatusStrip();renderFamily();renderFeed()}
function renderMyProfile(){
  const box=$('socialMyProfile');if(!box)return;const theme=themes[profile?.theme]||themes.lilac;box.innerHTML=`<div class="social-profile-head">${avatarHtml(me)}<div><strong>${esc(displayName(me,profile))}</strong><small>${esc(me.relationship_label||'Família')}</small></div></div><div class="social-bio">${esc(profile?.bio||'Adicione uma bio ao seu perfil ✨')}</div><div class="social-now"><div class="social-pill"><b>${esc(profile?.mood_emoji||'💜')}</b><span>${esc(profile?.status_text||'Sem frase do dia')}</span></div><div class="social-pill">${esc(profile?.activity_label||'✨ Livre agora')}</div></div><button id="socialEditProfile" class="social-btn primary" style="width:100%;background:linear-gradient(135deg,${theme},#aa91cb)" type="button">Personalizar perfil</button>`;$('socialEditProfile').onclick=openProfileModal
}
function renderStatusStrip(){
  const box=$('socialStatusStrip');if(!box)return;const withStatus=familyProfiles.filter(p=>p.status_text||p.activity_label).slice(0,12);box.innerHTML=withStatus.length?withStatus.map(p=>`<div class="social-status-card"><b>${esc(p.mood_emoji||'💜')}</b><strong>${esc(displayName(p.family_members,p))}</strong><small>${esc(p.activity_label||p.status_text||'')}</small></div>`).join(''):''
}
function renderFamily(){
  const box=$('socialFamilyList');if(!box)return;const known=new Map(familyProfiles.map(p=>[p.member_id,p]));box.innerHTML=familyProfiles.map(p=>`<div class="social-family-item">${avatarHtml(p.family_members,true)}<div><strong>${esc(displayName(p.family_members,p))}</strong><small>${esc(p.activity_label||p.status_text||'Sem atualização')}</small></div></div>`).join('')||'<div class="social-empty">A família vai aparecer aqui 💜</div>'
}

function carouselHtml(post){if(!post.media?.length)return'';return `<div class="social-carousel" data-carousel="${post.id}">${post.media.map((m,i)=>`<div class="social-slide ${i===0?'active':''}" data-slide="${i}">${m.media_type==='video'?`<video src="${esc(m.url)}" controls playsinline preload="metadata"></video>`:`<img src="${esc(m.url)}" loading="lazy" alt="Publicação de ${esc(displayName(post.author))}">`}</div>`).join('')}${post.media.length>1?`<button class="social-carousel-btn prev" data-carousel-prev="${post.id}">‹</button><button class="social-carousel-btn next" data-carousel-next="${post.id}">›</button><div class="social-dots">${post.media.map((_,i)=>`<span class="social-dot ${i===0?'active':''}" data-dot="${i}"></span>`).join('')}</div>`:''}</div>`}
function reactionSummary(post){const counts={};for(const r of post.reactions||[])counts[r.reaction]=(counts[r.reaction]||0)+1;return Object.entries(counts).map(([e,n])=>`${e} ${n}`).join('   ')}
function postHtml(post){
  const mine=post.author_id===me.id,myReaction=(post.reactions||[]).find(r=>r.member_id===me.id)?.reaction||'';return `<article class="social-card social-post" data-post="${post.id}"><div class="social-post-head">${avatarHtml(post.author,true)}<div class="grow"><strong>${esc(displayName(post.author,familyProfiles.find(x=>x.member_id===post.author_id)))}</strong><small>${esc(fmtTime(post.created_at))}${post.location_label?' • 📍 '+esc(post.location_label):''}</small></div>${mine?`<div class="social-post-menu"><button type="button" data-post-menu="${post.id}">⋯</button></div>`:''}</div>${post.caption?`<div class="social-caption">${esc(post.caption)}</div>`:''}${carouselHtml(post)}<div class="social-post-actions">${reactions.map(e=>`<button class="social-react ${myReaction===e?'mine':''}" type="button" data-react="${e}" data-post-id="${post.id}">${e}</button>`).join('')}<button class="social-react" type="button" data-more-react="${post.id}">＋</button></div><div class="social-reaction-summary">${esc(reactionSummary(post))}</div><div class="social-comments">${(post.comments||[]).slice(-6).map(c=>`<div class="social-comment"><strong>${esc(displayName(c.author))}</strong>${esc(c.body)}</div>`).join('')}<form class="social-comment-form" data-comment-form="${post.id}"><input maxlength="1200" placeholder="Comentar com carinho..."><button>➤</button></form></div></article>`
}
function renderFeed(){const box=$('socialFeed');if(!box)return;box.innerHTML=posts.length?posts.map(postHtml).join(''):'<div class="social-card social-empty">Ainda não tem publicação por aqui. Que tal inaugurar a Nossa Rede? 🌷</div>';wireFeed()}

function setCarousel(postId,delta){const c=document.querySelector(`[data-carousel="${CSS.escape(postId)}"]`);if(!c)return;const slides=[...c.querySelectorAll('.social-slide')],cur=slides.findIndex(s=>s.classList.contains('active')),next=(cur+delta+slides.length)%slides.length;slides.forEach((s,i)=>s.classList.toggle('active',i===next));c.querySelectorAll('.social-dot').forEach((d,i)=>d.classList.toggle('active',i===next))}
async function react(postId,reaction){const post=posts.find(p=>p.id===postId),mine=post?.reactions?.find(r=>r.member_id===me.id);if(mine?.reaction===reaction){await db.from('social_post_reactions').delete().eq('post_id',postId).eq('member_id',me.id)}else{await db.from('social_post_reactions').upsert({post_id:postId,member_id:me.id,reaction,updated_at:new Date().toISOString()},{onConflict:'post_id,member_id'})}await loadAll()}
async function addComment(postId,body){const text=body.trim();if(!text)return;const {error}=await db.from('social_post_comments').insert({post_id:postId,author_id:me.id,body:text});if(error)return toast('Não foi possível comentar.');await loadAll()}
async function editPost(postId){const p=posts.find(x=>x.id===postId);if(!p)return;const next=prompt('Editar legenda:',p.caption||'');if(next===null)return;const {error}=await db.from('social_posts').update({caption:next.trim(),updated_at:new Date().toISOString()}).eq('id',postId);if(error)return toast('Não foi possível editar.');await loadAll()}
async function deletePost(postId){if(!confirm('Excluir esta publicação da Nossa Rede?'))return;const {error}=await db.from('social_posts').update({deleted_at:new Date().toISOString()}).eq('id',postId);if(error)return toast('Não foi possível excluir.');toast('Publicação excluída.');await loadAll(true)}
function wireFeed(){
  document.querySelectorAll('[data-carousel-prev]').forEach(b=>b.onclick=()=>setCarousel(b.dataset.carouselPrev,-1));document.querySelectorAll('[data-carousel-next]').forEach(b=>b.onclick=()=>setCarousel(b.dataset.carouselNext,1));document.querySelectorAll('[data-react]').forEach(b=>b.onclick=()=>react(b.dataset.postId,b.dataset.react));document.querySelectorAll('[data-more-react]').forEach(b=>b.onclick=()=>{const r=prompt('Escolha uma reação: '+reactions.join(' '),'💜');if(r&&reactions.includes(r))react(b.dataset.moreReact,r)});document.querySelectorAll('[data-comment-form]').forEach(f=>f.onsubmit=e=>{e.preventDefault();const inp=f.querySelector('input');addComment(f.dataset.commentForm,inp.value)});document.querySelectorAll('[data-post-menu]').forEach(b=>b.onclick=()=>{const action=prompt('Digite E para editar ou X para excluir','E');if(action?.toUpperCase()==='E')editPost(b.dataset.postMenu);if(action?.toUpperCase()==='X')deletePost(b.dataset.postMenu)})
}

async function boot(){
  if(booted)return;booted=true;injectUi();const m=await identity().catch(()=>null);if(!m)return;await loadAll().catch(console.error)
  refreshTimer=setInterval(()=>{if(document.visibilityState==='visible'&&!$('socialPanel')?.classList.contains('hidden'))loadAll().catch(()=>{})},15000)
}
window.__ISA_OPEN_SOCIAL_CORE__=openSocial;if(!window.__ISA_OPEN_SOCIAL__)window.__ISA_OPEN_SOCIAL__=openSocial
function waitBoot(){const main=$('mainView');if(main&&!main.classList.contains('hidden')&&$('myName')?.textContent?.trim()!=='Família'){boot();return}let tries=0;const t=setInterval(()=>{if(main&&!main.classList.contains('hidden')&&$('myName')?.textContent?.trim()!=='Família'){clearInterval(t);boot()}else if(++tries>100)clearInterval(t)},150)}
waitBoot()
