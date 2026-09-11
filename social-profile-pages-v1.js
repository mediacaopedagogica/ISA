// Nossa Rede — perfis visitáveis, curiosidades opcionais e galeria própria.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js'
const db=createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}})
const $=id=>document.getElementById(id)
const token=new URLSearchParams(location.hash.replace(/^#/, '')).get('acesso')||''
const external=()=>!!token&&!!($('friendApp')||window.__ISA_FRIEND_PERSON__)
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ')
const FIELDS=[['sobre','💜 Sobre mim'],['curiosidades','✨ Curiosidades'],['filmes','🎬 Filmes favoritos'],['series','📺 Séries favoritas'],['desenhos','🧸 Desenhos favoritos'],['comida','🍽️ Comida favorita'],['musica','🎵 Música favorita'],['banda','🎸 Banda favorita'],['cantor','🎤 Cantor(a) favorito(a)'],['doce','🍰 Doce favorito'],['festas','🎉 Festas / comemorações'],['cidades','🗺️ Cidades que já conheci / passei']]
let mainMe=null,current=null,currentTab='profile',index={profiles:[],posts:new Map(),byName:new Map(),meId:''},busy=false,lastIndex=0

function toast(text){const t=$('friendToast')||$('toast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._spp);t._spp=setTimeout(()=>t.classList.add('hidden'),3000)}
function ensureCss(){if($('socialProfilePagesCss'))return;const l=document.createElement('link');l.id='socialProfilePagesCss';l.rel='stylesheet';l.href='./social-profile-pages-v1.css?v=2-profile-cover';document.head.appendChild(l)}
function socialRoot(el){return el?.closest?.('#socialPanel,#familySocialOverlay')||$('familySocialOverlay')||$('socialPanel')}
async function mainIdentity(){if(mainMe)return mainMe;const {data:{user}}=await db.auth.getUser();if(!user)return null;const {data,error}=await db.from('family_members').select('id,family_id,display_name,relationship_label').eq('auth_user_id',user.id).eq('active',true).maybeSingle();if(error||!data)return null;mainMe=data;return data}
async function externalCall(action,payload={},file=null){
  const url=`${CONFIG.SUPABASE_URL}/functions/v1/social-profile-details`
  if(file){const form=new FormData();form.append('token',token);form.append('action',action);form.append('file',file);if(payload.caption)form.append('caption',String(payload.caption));const r=await fetch(url,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY},body:form,cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error||'Não foi possível atualizar o perfil.');return d}
  const r=await fetch(url,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({token,action,...payload}),cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error||'Não foi possível abrir este perfil.');return d
}
async function friendSnapshot(){const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/friend-social`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({token,action:'bootstrap'}),cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error||'Não foi possível carregar a Nossa Rede.');return d}
async function signed(path){if(!path)return'';const {data}=await db.storage.from('social-media').createSignedUrl(path,3600);return data?.signedUrl||''}

async function refreshIndex(force=false){
  if(!force&&Date.now()-lastIndex<12000&&index.profiles.length)return index
  if(external()){
    const d=await friendSnapshot();const profiles=d.profiles||[];index={profiles,posts:new Map((d.posts||[]).map(p=>[String(p.id),String(p.authorId)])),byName:new Map(profiles.map(p=>[norm(p.name),p])),meId:d.me?.id||window.__ISA_FRIEND_PERSON__?.id||''}
  }else{
    const me=await mainIdentity();if(!me)return index
    const {data:sp,error}=await db.from('social_profiles').select('member_id,display_name,bio,status_text,mood_emoji,activity_label,social_avatar_ref,cover_ref,profile_details,family_members!social_profiles_member_id_fkey(id,display_name,relationship_label)').eq('family_id',me.family_id)
    if(error)throw error
    const profiles=(sp||[]).map(p=>({memberId:p.member_id,name:p.display_name||p.family_members?.display_name||'Família',relationship:p.family_members?.relationship_label||'Família',bio:p.bio||'',statusText:p.status_text||'',moodEmoji:p.mood_emoji||'💜',activityLabel:p.activity_label||'',avatarRef:p.social_avatar_ref||'',coverRef:p.cover_ref||'',details:p.profile_details||{}}))
    if(!profiles.some(p=>p.memberId===me.id))profiles.push({memberId:me.id,name:me.display_name,relationship:me.relationship_label||'Família'})
    const ids=[...document.querySelectorAll('#socialFeed .social-post[data-post]')].map(x=>x.dataset.post).filter(Boolean);let postRows=[];if(ids.length){const r=await db.from('social_posts').select('id,author_id').in('id',ids);postRows=r.data||[]}
    index={profiles,posts:new Map(postRows.map(p=>[String(p.id),String(p.author_id)])),byName:new Map(profiles.map(p=>[norm(p.name),p])),meId:me.id}
  }
  lastIndex=Date.now();return index
}
function byName(name){const n=norm(name);return index.byName.get(n)||index.profiles.find(p=>norm(p.name).split(' ')[0]===n.split(' ')[0])||null}

async function fetchMainProfile(targetId){
  const me=await mainIdentity();if(!me)throw new Error('Perfil não identificado.')
  const {data:m,error:mErr}=await db.from('family_members').select('id,family_id,display_name,relationship_label,active').eq('id',targetId).eq('family_id',me.family_id).eq('active',true).maybeSingle();if(mErr||!m)throw new Error('Este perfil não está disponível para você.')
  const {data:p,error:pErr}=await db.from('social_profiles').select('member_id,display_name,bio,status_text,mood_emoji,activity_label,theme,social_avatar_ref,cover_ref,status_expires_at,profile_details').eq('member_id',targetId).maybeSingle();if(pErr)throw pErr
  const {data:g,error:gErr}=await db.from('social_profile_gallery').select('id,storage_path,mime_type,caption,created_at').eq('member_id',targetId).order('created_at',{ascending:false}).limit(40);if(gErr)throw gErr
  const gallery=await Promise.all((g||[]).map(async x=>({id:x.id,url:await signed(x.storage_path),mime:x.mime_type||'image/jpeg',caption:x.caption||'',createdAt:x.created_at})))
  const [avatarUrl,coverUrl]=await Promise.all([p?.social_avatar_ref?signed(p.social_avatar_ref):'',p?.cover_ref?signed(p.cover_ref):''])
  return{memberId:m.id,name:p?.display_name||m.display_name,relationship:m.relationship_label||'Família',bio:p?.bio||'',statusText:p?.status_text||'',moodEmoji:p?.mood_emoji||'💜',activityLabel:p?.activity_label||'',theme:p?.theme||'lilac',avatarUrl,coverUrl,coverRef:p?.cover_ref||'',details:p?.profile_details||{},gallery,own:m.id===me.id}
}
async function fetchProfile(id){
  if(!external())return fetchMainProfile(id)
  const p=await externalCall('profile',{targetId:id})
  if(!p.coverUrl&&!p.cover_url){
    try{
      const ix=await refreshIndex();const src=(ix.profiles||[]).find(x=>String(x.memberId||x.member_id)===String(id))
      if(src){p.coverUrl=src.coverUrl||src.cover_url||'';p.coverRef=src.coverRef||src.cover_ref||''}
    }catch{}
  }
  if(!p.coverUrl&&p.cover_url)p.coverUrl=p.cover_url
  return p
}

function buildModal(){
  if($('socialProfilePage'))return
  const m=document.createElement('section');m.id='socialProfilePage';m.className='spp-modal';m.innerHTML=`<article class="spp-card"><div id="sppCover" class="spp-cover" hidden></div><header class="spp-head"><div id="sppAvatar" class="spp-avatar">💜</div><div class="spp-id"><h2 id="sppName">Perfil</h2><small id="sppRelation">Família</small><div id="sppNow" class="spp-now"></div></div><button id="sppClose" class="spp-close" type="button">✕</button></header><nav class="spp-tabs"><button class="spp-tab active" data-spp-tab="profile">👤 Perfil</button><button class="spp-tab" data-spp-tab="facts">✨ Curiosidades</button><button class="spp-tab" data-spp-tab="gallery">🖼️ Galeria</button></nav><div id="sppProfilePane" class="spp-pane active"></div><div id="sppFactsPane" class="spp-pane"></div><div id="sppGalleryPane" class="spp-pane"></div></article>`
  document.body.appendChild(m);$('sppClose').onclick=closeModal;m.onclick=e=>{if(e.target===m)closeModal()};m.querySelectorAll('[data-spp-tab]').forEach(b=>b.onclick=()=>showTab(b.dataset.sppTab));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&m.classList.contains('show'))closeModal()})
}
function closeModal(){$('socialProfilePage')?.classList.remove('show');current=null}
function showTab(tab){currentTab=tab;document.querySelectorAll('#socialProfilePage .spp-tab').forEach(b=>b.classList.toggle('active',b.dataset.sppTab===tab));$('sppProfilePane')?.classList.toggle('active',tab==='profile');$('sppFactsPane')?.classList.toggle('active',tab==='facts');$('sppGalleryPane')?.classList.toggle('active',tab==='gallery')}
function avatarHtml(p){return p.avatarUrl?`<img src="${esc(p.avatarUrl)}" alt="Foto de ${esc(p.name)}">`:esc((p.name||'?').charAt(0).toUpperCase())}
function renderCover(p){const c=$('sppCover');if(!c)return;const url=p.coverUrl||p.cover_url||'';if(!url){c.hidden=true;c.replaceChildren();return}c.hidden=false;c.innerHTML=`<img src="${esc(url)}" alt="Capa de ${esc(p.name||'perfil')}">`}
function detailCards(p){const d=p.details||{},rows=FIELDS.filter(([k])=>String(d[k]||'').trim());if(!rows.length)return'<div class="spp-empty">Ainda não há curiosidades preenchidas por aqui. 💜</div>';return`<div class="spp-facts">${rows.map(([k,l])=>`<div class="spp-fact"><b>${l}</b><span>${esc(d[k])}</span></div>`).join('')}</div>`}
function render(){
  const p=current;if(!p)return;buildModal();renderCover(p);$('sppAvatar').innerHTML=avatarHtml(p);$('sppName').textContent=p.name||'Perfil';$('sppRelation').textContent=p.relationship||'Família';$('sppNow').textContent=`${p.moodEmoji||'💜'} ${p.activityLabel||p.statusText||'Sem atualização agora'}`
  $('sppProfilePane').innerHTML=`<section class="spp-section"><h3>💜 Sobre ${esc(p.name)}</h3><p>${esc(p.bio||p.details?.sobre||'Ainda não adicionou uma descrição.')}</p></section>${p.own?`<div class="spp-actions"><button class="spp-btn primary" id="sppBasicEdit" type="button">📷 Editar foto, bio e status</button><button class="spp-btn" id="sppOpenFactsEdit" type="button">✨ Editar curiosidades</button></div>`:''}`
  $('sppFactsPane').innerHTML=`<section class="spp-section"><h3>✨ Gostos e curiosidades</h3>${detailCards(p)}${p.own?`<div class="spp-actions"><button class="spp-btn primary" id="sppFactsEdit" type="button">Editar informações</button></div><div id="sppEditor" class="spp-editor"><div class="spp-editor-grid">${FIELDS.map(([k,l],i)=>`<div class="spp-field ${i<2?'full':''}"><label>${l}</label><textarea data-spp-field="${k}" maxlength="${i<2?1200:600}" placeholder="Opcional">${esc(p.details?.[k]||'')}</textarea></div>`).join('')}</div><div class="spp-actions"><button class="spp-btn" id="sppEditCancel" type="button">Cancelar</button><button class="spp-btn primary" id="sppEditSave" type="button">Salvar</button></div></div>`:''}</section>`
  const gallery=(p.gallery||[]).filter(x=>x.url);$('sppGalleryPane').innerHTML=`<section class="spp-section"><h3>🖼️ Galeria de ${esc(p.name)}</h3>${p.own?`<div class="spp-gallery-add"><label class="spp-btn primary">＋ Adicionar foto<input id="sppGalleryInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif"></label><input id="sppGalleryCaption" class="spp-caption-input" maxlength="180" placeholder="Legenda opcional"></div>`:''}${gallery.length?`<div class="spp-gallery">${gallery.map(x=>`<figure class="spp-photo"><img src="${esc(x.url)}" loading="lazy" alt="Foto da galeria de ${esc(p.name)}">${x.caption?`<figcaption>${esc(x.caption)}</figcaption>`:''}${p.own?`<button type="button" class="spp-photo-remove" data-spp-remove="${esc(x.id)}" title="Remover foto">✕</button>`:''}</figure>`).join('')}</div>`:'<div class="spp-empty">A galeria ainda está vazia. As fotos aqui são opcionais. 🌷</div>'}</section>`
  if(p.own)wireOwn();showTab(currentTab)
}
function wireOwn(){
  $('sppBasicEdit')?.addEventListener('click',openBasicEditor);$('sppOpenFactsEdit')?.addEventListener('click',()=>{showTab('facts');$('sppEditor')?.classList.add('show')});$('sppFactsEdit')?.addEventListener('click',()=> $('sppEditor')?.classList.toggle('show'));$('sppEditCancel')?.addEventListener('click',()=> $('sppEditor')?.classList.remove('show'));$('sppEditSave')?.addEventListener('click',saveDetails)
  $('sppGalleryInput')?.addEventListener('change',async e=>{const f=e.target.files?.[0];e.target.value='';if(f)await uploadGallery(f)})
  document.querySelectorAll('#sppGalleryPane [data-spp-remove]').forEach(b=>b.onclick=()=>removeGallery(b.dataset.sppRemove))
}
function openBasicEditor(){const root=external()?$('familySocialOverlay'):$('socialPanel'),btn=root?.querySelector(external()?'#fsEditProfile':'#socialEditProfile');if(!btn)return toast('O editor do perfil ainda está carregando.');window.__ISA_SPP_BYPASS__=true;btn.click();window.__ISA_SPP_BYPASS__=false}
async function ensureMainProfile(){const me=await mainIdentity();if(!me)throw new Error('Perfil não identificado.');const {data}=await db.from('social_profiles').select('member_id').eq('member_id',me.id).maybeSingle();if(!data){const {error}=await db.from('social_profiles').insert({member_id:me.id,family_id:me.family_id,display_name:me.display_name,bio:'',status_text:'',mood_emoji:'💜',activity_label:'',theme:'lilac',profile_details:{}});if(error)throw error}return me}
async function saveDetails(){if(busy||!current?.own)return;busy=true;const btn=$('sppEditSave');if(btn){btn.disabled=true;btn.textContent='Salvando…'};try{const details={};document.querySelectorAll('#sppEditor [data-spp-field]').forEach(x=>{const v=x.value.trim();if(v)details[x.dataset.sppField]=v});if(external())await externalCall('save_details',{details});else{const me=await ensureMainProfile();const {error}=await db.from('social_profiles').update({profile_details:details,updated_at:new Date().toISOString()}).eq('member_id',me.id);if(error)throw error}current.details=details;$('sppEditor')?.classList.remove('show');toast('Curiosidades atualizadas ✨');await reopen(current.memberId,'facts')}catch(e){toast(e.message||'Não foi possível salvar.')}finally{busy=false;if(btn){btn.disabled=false;btn.textContent='Salvar'}}}
async function uploadGallery(file){if(busy||!current?.own)return;if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type))return toast('Use JPG, PNG, WEBP ou GIF.');if(file.size>8*1024*1024)return toast('A foto pode ter até 8 MB.');busy=true;try{const caption=$('sppGalleryCaption')?.value.trim()||'';if(external())await externalCall('upload_gallery',{caption},file);else{const me=await ensureMainProfile();const ext=(file.name.split('.').pop()||'jpg').replace(/[^a-z0-9]/gi,'').toLowerCase()||'jpg',path=`${me.family_id}/${me.id}/profile-gallery/${crypto.randomUUID()}.${ext}`;const {error:up}=await db.storage.from('social-media').upload(path,file,{contentType:file.type,upsert:false});if(up)throw up;const {error}=await db.from('social_profile_gallery').insert({family_id:me.family_id,member_id:me.id,storage_path:path,mime_type:file.type,caption});if(error){await db.storage.from('social-media').remove([path]);throw error}}toast('Foto adicionada à sua galeria 💕');await reopen(current.memberId,'gallery')}catch(e){toast(e.message||'Não foi possível adicionar a foto.')}finally{busy=false}}
async function removeGallery(id){if(busy||!current?.own)return;if(!confirm('Remover esta foto da sua galeria?'))return;busy=true;try{if(external())await externalCall('delete_gallery',{galleryId:id});else{const me=await mainIdentity();const {data:item}=await db.from('social_profile_gallery').select('storage_path').eq('id',id).eq('member_id',me.id).maybeSingle();const {error}=await db.from('social_profile_gallery').delete().eq('id',id).eq('member_id',me.id);if(error)throw error;if(item?.storage_path)await db.storage.from('social-media').remove([item.storage_path]).catch(()=>{})}toast('Foto removida da galeria.');await reopen(current.memberId,'gallery')}catch(e){toast(e.message||'Não foi possível remover a foto.')}finally{busy=false}}
async function reopen(id,tab=currentTab){currentTab=tab;current=await fetchProfile(id);render()}
async function openProfile(id,tab='profile'){if(!id)return;buildModal();currentTab=tab;$('socialProfilePage').classList.add('show');$('sppName').textContent='Carregando perfil…';$('sppProfilePane').innerHTML='<div class="spp-empty">Abrindo perfil…</div>';try{current=await fetchProfile(id);render()}catch(e){toast(e.message||'Este perfil não está disponível.');closeModal()}}

async function decorate(){
  const roots=[$('socialPanel'),$('familySocialOverlay')].filter(r=>r&&!r.classList.contains('hidden'));if(!roots.length)return
  try{await refreshIndex();for(const root of roots){
    const own=root.querySelector(external()?'#fsEditProfile':'#socialEditProfile');if(own){own.dataset.sppProfile=index.meId;own.classList.add('spp-clickable');own.textContent='Meu perfil'}
    const ownHead=root.querySelector('.social-side .social-profile-head');if(ownHead){ownHead.dataset.sppProfile=index.meId;ownHead.classList.add('spp-clickable')}
    root.querySelectorAll('.social-status-card').forEach(card=>{const p=byName(card.querySelector('strong')?.textContent||'');if(p){card.dataset.sppProfile=p.memberId;card.classList.add('spp-clickable')}})
    root.querySelectorAll('.social-post').forEach(post=>{const pid=post.dataset.post||post.dataset.fsPost||'',author=index.posts.get(String(pid))||byName(post.querySelector('.social-post-head strong')?.textContent||'')?.memberId;if(!author)return;const head=post.querySelector('.social-post-head');if(head){head.querySelector('.social-avatar')?.setAttribute('data-spp-profile',author);head.querySelector('.social-avatar')?.classList.add('spp-clickable');const name=head.querySelector('.grow strong');if(name){name.dataset.sppProfile=author;name.classList.add('spp-clickable')}}})
    root.querySelectorAll('[data-nr5-tag-link]').forEach(a=>{a.dataset.sppProfile=a.dataset.nr5TagLink;a.classList.add('spp-clickable')})
  }}catch(e){console.warn('Perfis da Nossa Rede:',e)}
}

document.addEventListener('click',e=>{if(window.__ISA_SPP_BYPASS__)return;const hit=e.target.closest?.('[data-spp-profile]');if(!hit||!socialRoot(hit))return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openProfile(hit.dataset.sppProfile)},true)
document.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const hit=e.target.closest?.('[data-spp-profile]');if(!hit)return;e.preventDefault();openProfile(hit.dataset.sppProfile)})
ensureCss();buildModal();let ticks=0;const timer=setInterval(()=>{decorate();if(++ticks>240)clearInterval(timer)},1200);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){lastIndex=0;decorate()}});window.addEventListener('focus',()=>{lastIndex=0;decorate()});
window.__ISA_OPEN_SOCIAL_PROFILE__=(id,tab)=>openProfile(id,tab);window.__ISA_SOCIAL_PROFILE_PAGES__={decorate,openProfile};