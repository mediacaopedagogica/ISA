import { CONFIG } from './config.js?v=20260910-social-v72'

const $=id=>document.getElementById(id)
const token=new URLSearchParams(location.hash.replace(/^#/, '')).get('acesso')||''
const reactions=['💜','❤️','🥰','😂','👏','😮']
const quickEmoji=['💜','💕','✨','🥰','😂','😍','🌷','🫶','🔥','🎶','📚','☀️','🌙','🏡','🎉','💫']
let state={me:null,profiles:[],posts:[]},files=[],busy=false,built=false

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const ready=()=>!!token&&window.__ISA_FRIEND_ACCESS_VALID__===true

function toast(text){
  if(typeof window.__ISA_FRIEND_TOAST__==='function')return window.__ISA_FRIEND_TOAST__(text)
  const t=$('friendToast');if(!t)return
  t.textContent=text;t.classList.remove('hidden');clearTimeout(t._social72);t._social72=setTimeout(()=>t.classList.add('hidden'),3000)
}

async function api(action,payload={},timeout=7500){
  if(!ready())throw new Error('Este acesso ainda não foi validado.')
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout)
  try{
    const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/friend-social`,{
      method:'POST',
      headers:{apikey:CONFIG.SUPABASE_KEY,'Content-Type':'application/json'},
      body:JSON.stringify({token,action,...payload}),
      cache:'no-store',signal:controller.signal
    })
    let data={};try{data=await r.json()}catch{}
    if(!r.ok)throw new Error(data?.error||'Não foi possível atualizar a Nossa Rede.')
    return data
  }catch(e){
    if(e?.name==='AbortError')throw new Error('A atualização demorou demais. Tente novamente.')
    throw e
  }finally{clearTimeout(timer)}
}

async function upload(postId,file){
  const form=new FormData();form.append('token',token);form.append('action','upload_media');form.append('postId',postId);form.append('file',file)
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000)
  try{
    const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/friend-social`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY},body:form,cache:'no-store',signal:controller.signal})
    let data={};try{data=await r.json()}catch{}
    if(!r.ok)throw new Error(data?.error||'Não foi possível enviar a mídia.')
    return data
  }catch(e){if(e?.name==='AbortError')throw new Error('O envio demorou demais.');throw e}
  finally{clearTimeout(timer)}
}

function ensureStyle(){
  if(!$('externalSocialBaseCss72')){
    const l=document.createElement('link');l.id='externalSocialBaseCss72';l.rel='stylesheet';l.href='./social-network.css?v=72-external-standalone';document.head.appendChild(l)
  }
  if($('externalSocialStyle72'))return
  const s=document.createElement('style');s.id='externalSocialStyle72';s.textContent=`
    #familySocialOverlay{position:fixed;inset:0;z-index:120000;background:linear-gradient(145deg,#fff9fc,#f4efff 54%,#eff8ff);overflow:auto;color:#594d66;overscroll-behavior:contain}
    #familySocialOverlay.hidden{display:none!important}
    #familySocialOverlay .fs-top{position:sticky;top:0;z-index:30;display:flex;align-items:center;gap:10px;padding:10px 14px;background:#fffafdf2;backdrop-filter:blur(16px);border-bottom:1px solid #eee3f2}
    #familySocialOverlay .fs-top .grow{flex:1}#familySocialOverlay .fs-top strong{font-size:16px}#familySocialOverlay .fs-top small{display:block;color:#8d7d95;font-size:10px}
    #familySocialOverlay .fs-close{border:0;border-radius:13px;background:#eee5f6;color:#695674;padding:9px 12px;font-weight:900;cursor:pointer}
    #familySocialOverlay .social-shell{min-height:calc(100dvh - 60px)}
    #familySocialOverlay .social-status-strip{grid-column:1/-1}
    #familySocialOverlay .fs-sync{display:flex;align-items:center;gap:8px;justify-content:center;min-height:32px;padding:7px 12px;font-size:11px;color:#897890;background:rgba(255,255,255,.48)}
    #familySocialOverlay .fs-sync.hidden{display:none!important}
    #familySocialOverlay .fs-error{margin:10px auto;width:min(720px,calc(100% - 20px));padding:11px 13px;border-radius:16px;background:#fff0f5;color:#88526b;text-align:center;font-size:11px}
    #familySocialOverlay .fs-error.hidden{display:none!important}
    #familySocialOverlay .fs-error button{margin-left:8px;border:0;border-radius:11px;background:#eadfff;color:#5f4d70;padding:7px 10px;font-weight:900}
    #familySocialOverlay .fs-profile-button{width:100%;margin-top:8px}
    #familySocialOverlay .fs-file-note{font-size:10px;color:#8f8293;margin-top:7px}
    #familySocialOverlay .fs-preview{display:flex;gap:6px;overflow:auto;margin-top:8px}#familySocialOverlay .fs-preview span{flex:0 0 auto;padding:7px 9px;border-radius:11px;background:#f4edf7;font-size:10px}
    #familySocialOverlay .fs-post-delete{border:0;background:#fff0f2;color:#a94f63;border-radius:10px;padding:6px 8px;font-size:10px;font-weight:900}
    #familySocialOverlay .fs-media-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px;background:#eee;overflow:hidden}#familySocialOverlay .fs-media-grid.one{grid-template-columns:1fr}
    #familySocialOverlay .fs-media-grid img,#familySocialOverlay .fs-media-grid video{width:100%;height:min(55vw,430px);object-fit:contain;background:#171419;display:block}
    #familySocialOverlay .fs-reactions{display:flex;gap:5px;flex-wrap:wrap;padding:10px 14px 6px}.fs-react{border:0;border-radius:11px;background:#f7f1fa;padding:7px 9px;cursor:pointer}.fs-react.mine{background:#eadbf3;outline:1px solid #c5abd7}
    #familySocialOverlay .fs-comments{padding:8px 14px 14px;border-top:1px solid #f0e7f2}.fs-comment{font-size:11px;margin:5px 0}.fs-comment strong{margin-right:5px}
    #familySocialOverlay .fs-comment-form{display:flex;gap:6px;margin-top:8px}.fs-comment-form input{flex:1;min-width:0;border:1px solid #eadff0;border-radius:12px;padding:9px 10px}.fs-comment-form button{border:0;border-radius:11px;background:#c8acd7;color:white;padding:0 12px;font-weight:900}
    #familySocialOverlay .fs-profile-modal{position:fixed;inset:0;z-index:120010;display:none;place-items:center;background:#2d21345c;backdrop-filter:blur(7px);padding:14px}.fs-profile-modal.show{display:grid!important}.fs-profile-card{width:min(520px,96vw);max-height:92vh;overflow:auto;padding:18px}.fs-profile-card label{display:grid;gap:4px;margin:9px 0;font-size:10px;font-weight:900}.fs-profile-card input,.fs-profile-card textarea,.fs-profile-card select{border:1px solid #eadff0;border-radius:12px;padding:10px;background:#fff}.fs-modal-actions{display:flex;justify-content:flex-end;gap:7px;margin-top:12px}
    @media(max-width:780px){#familySocialOverlay .social-shell{display:block;padding:9px}#familySocialOverlay .fs-top{padding-top:max(9px,env(safe-area-inset-top));padding-left:max(10px,env(safe-area-inset-left));padding-right:max(10px,env(safe-area-inset-right))}#familySocialOverlay .social-side{position:static;margin-bottom:9px}#familySocialOverlay .social-right{display:block;position:static;margin-top:10px}#familySocialOverlay .fs-media-grid img,#familySocialOverlay .fs-media-grid video{height:min(85vw,430px)}}
  `;document.head.appendChild(s)
}

function fmt(ts){
  const d=new Date(ts),now=new Date()
  return d.toDateString()===now.toDateString()?`Hoje, ${d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`:d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})
}
function profileFor(id){return state.profiles.find(p=>String(p.memberId)===String(id))||null}
function myProfile(){return profileFor(state.me?.id)||state.me?.profile||{}}
function initial(name='?'){return String(name||'?').trim().charAt(0).toUpperCase()||'?'}

function renderProfile(){
  const box=$('fsMyProfile72');if(!box)return
  const p=myProfile(),name=p.name||state.me?.name||window.__ISA_FRIEND_PERSON__?.name||'Família'
  box.innerHTML=`<div class="social-profile-head"><div class="social-avatar">${esc(initial(name))}</div><div><strong>${esc(name)}</strong><small>${esc(state.me?.relationship||window.__ISA_FRIEND_PERSON__?.relationship||'Família')}</small></div></div><div class="social-bio">${esc(p.bio||'Adicione uma bio ao seu perfil ✨')}</div><div class="social-now"><div class="social-pill"><b>${esc(p.moodEmoji||'💜')}</b><span>${esc(p.statusText||'Sem frase do dia')}</span></div><div class="social-pill">${esc(p.activityLabel||'✨ Livre agora')}</div></div><button id="fsEditProfile72" class="social-btn primary fs-profile-button" type="button">Personalizar perfil</button>`
}
function renderStatuses(){
  const box=$('fsStatusStrip72');if(!box)return
  const rows=(state.profiles||[]).filter(p=>p.statusText||p.activityLabel).slice(0,14)
  box.innerHTML=rows.map(p=>`<div class="social-status-card"><b>${esc(p.moodEmoji||'💜')}</b><strong>${esc(p.name||'Família')}</strong><small>${esc(p.activityLabel||p.statusText||'')}</small></div>`).join('')
}
function renderFamily(){
  const box=$('fsFamilyList72');if(!box)return
  box.innerHTML=(state.profiles||[]).map(p=>`<div class="social-family-item"><div class="social-avatar">${esc(initial(p.name))}</div><div><strong>${esc(p.name||'Família')}</strong><small>${esc(p.activityLabel||p.statusText||'Sem atualização')}</small></div></div>`).join('')||'<div class="social-empty">A família vai aparecer aqui 💜</div>'
}
function mediaHtml(post){
  if(!post.media?.length)return''
  return `<div class="fs-media-grid ${post.media.length===1?'one':''}">${post.media.map(m=>m.type==='video'?`<video src="${esc(m.url)}" controls playsinline preload="metadata"></video>`:`<img src="${esc(m.url)}" loading="lazy" alt="Publicação">`).join('')}</div>`
}
function reactionSummary(post){const c={};for(const r of post.reactions||[])c[r.reaction]=(c[r.reaction]||0)+1;return Object.entries(c).map(([e,n])=>`${e} ${n}`).join('   ')}
function postHtml(post){
  const mine=String(post.authorId)===String(state.me?.id),myReaction=(post.reactions||[]).find(r=>String(r.memberId)===String(state.me?.id))?.reaction||''
  return `<article class="social-card social-post" data-fs72-post="${esc(post.id)}"><div class="social-post-head"><div class="social-avatar">${esc(initial(post.author?.name))}</div><div class="grow"><strong>${esc(post.author?.name||'Família')}</strong><small>${esc(fmt(post.createdAt))}${post.locationLabel?' • 📍 '+esc(post.locationLabel):''}</small></div>${mine?`<button class="fs-post-delete" data-fs72-delete="${esc(post.id)}" type="button">Excluir</button>`:''}</div>${post.caption?`<div class="social-caption">${esc(post.caption)}</div>`:''}${mediaHtml(post)}<div class="fs-reactions">${reactions.map(e=>`<button class="fs-react ${myReaction===e?'mine':''}" data-fs72-react="${e}" data-fs72-id="${esc(post.id)}" type="button">${e}</button>`).join('')}</div><div class="social-reaction-summary">${esc(reactionSummary(post))}</div><div class="fs-comments">${(post.comments||[]).slice(-8).map(c=>`<div class="fs-comment"><strong>${esc(c.authorName||'Família')}</strong>${esc(c.body)}</div>`).join('')}<form class="fs-comment-form" data-fs72-comment="${esc(post.id)}"><input maxlength="1200" placeholder="Comentar com carinho..."><button>➤</button></form></div></article>`
}
function renderFeed(){
  const box=$('fsFeed72');if(!box)return
  box.innerHTML=(state.posts||[]).length?(state.posts||[]).map(postHtml).join(''):'<div class="social-card social-empty">Ainda não tem publicação por aqui. Que tal inaugurar a Nossa Rede? 🌷</div>'
}
function render(){renderProfile();renderStatuses();renderFamily();renderFeed();const composer=$('fsComposer72');if(composer)composer.style.display=state.me?.canPost===false?'none':''}

function build(){
  if(built&&$('familySocialOverlay'))return
  ensureStyle();built=true
  $('familySocialOverlay')?.remove()
  const o=document.createElement('section');o.id='familySocialOverlay';o.className='hidden';o.innerHTML=`
    <div class="fs-top"><div>🌸</div><div class="grow"><strong>Nossa Rede</strong><small>Rede social privada da família 💕</small></div><button id="fsClose72" class="fs-close" type="button">✕ Fechar</button></div>
    <div id="fsSync72" class="fs-sync hidden">Atualizando a Nossa Rede…</div>
    <div id="fsError72" class="fs-error hidden"></div>
    <div id="fsShell" class="social-shell">
      <aside class="social-card social-side"><div class="social-brand">Nossa <span>Rede</span> ✨</div><div id="fsMyProfile72"><div class="social-empty">Carregando perfil…</div></div></aside>
      <section class="social-main"><div id="fsStatusStrip72" class="social-status-strip"></div><div id="fsComposer72" class="social-card social-composer"><textarea id="fsCaption72" maxlength="2200" placeholder="Compartilhe um momento, uma frase, uma foto... ✨"></textarea><div class="social-emoji-row show">${quickEmoji.map(e=>`<button type="button" data-fs72-emoji="${e}">${e}</button>`).join('')}</div><div id="fsPreview72" class="fs-preview"></div><div class="social-compose-actions"><label class="social-btn soft">🖼️ Fotos / vídeo<input id="fsMedia72" class="social-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" multiple></label><input id="fsLocation72" maxlength="80" placeholder="📍 Lugar (opcional)" style="flex:1;min-width:140px;border:1px solid #eadff0;border-radius:14px;padding:9px 11px;background:#fff"><button id="fsPublish72" class="social-btn primary" type="button">Publicar</button></div><div class="fs-file-note">Escolha 1, 2 ou 3 fotos/vídeos. Com mais de uma, vira carrossel.</div></div><div id="fsFeed72" class="social-feed"><div class="social-card social-empty">Atualizando publicações…</div></div></section>
      <aside class="social-card social-right"><h3>Família agora 💫</h3><div id="fsFamilyList72" class="social-family-list"><div class="social-empty">Atualizando…</div></div></aside>
    </div>
    <div id="fsProfileModal72" class="fs-profile-modal"><div class="social-card fs-profile-card"><h3>Personalizar meu perfil ✨</h3><label>Nome na Nossa Rede<input id="fsName72" maxlength="50"></label><label>Bio<textarea id="fsBio72" maxlength="240" rows="3"></textarea></label><label>Frase do dia<input id="fsStatus72" maxlength="120"></label><label>Como estou me sentindo<select id="fsMood72"><option>💜</option><option>🥰</option><option>😊</option><option>😂</option><option>😴</option><option>🤩</option><option>😌</option><option>🥳</option><option>🤗</option><option>🤔</option><option>😎</option><option>💪</option></select></label><label>O que estou fazendo<select id="fsActivity72"><option value="">Nada agora</option><option>🏫 Na escola</option><option>💼 No trabalho</option><option>📚 Estudando</option><option>🏡 Em casa</option><option>🎶 Ouvindo música</option><option>🎮 Jogando</option><option>🚗 Na estrada</option><option>☕ Relaxando</option><option>🛍️ Passeando</option><option>✈️ Viajando</option></select></label><label>Tema<select id="fsTheme72"><option value="lilac">Lilás</option><option value="pink">Rosa</option><option value="blue">Azul</option><option value="green">Verde</option><option value="yellow">Amarelo</option></select></label><div class="fs-modal-actions"><button id="fsProfileCancel72" class="social-btn soft" type="button">Cancelar</button><button id="fsProfileSave72" class="social-btn primary" type="button">Salvar</button></div></div></div>`
  document.body.appendChild(o)
  wire()
}

function showError(message){const e=$('fsError72');if(!e)return;e.innerHTML=`${esc(message)} <button id="fsRetry72" type="button">Tentar atualizar</button>`;e.classList.remove('hidden');$('fsRetry72').onclick=refresh}
function hideError(){$('fsError72')?.classList.add('hidden')}
function sync(show){$('fsSync72')?.classList.toggle('hidden',!show)}

async function refresh(){
  if(!ready())return showError('Este acesso ainda não foi validado.')
  sync(true);hideError()
  try{state=await api('bootstrap');render();hideError()}
  catch(e){showError(e?.message||'Não foi possível atualizar agora.')}
  finally{sync(false)}
}

function preview(){const b=$('fsPreview72');if(b)b.innerHTML=files.map(f=>`<span>${f.type.startsWith('video/')?'🎬':'🖼️'} ${esc(f.name.slice(0,26))}</span>`).join('')}
async function publish(){
  if(busy)return
  const caption=$('fsCaption72')?.value.trim()||'',location=$('fsLocation72')?.value.trim()||''
  if(!caption&&!files.length)return toast('Escreva algo ou escolha uma foto/vídeo.')
  busy=true;const b=$('fsPublish72');if(b){b.disabled=true;b.textContent='Publicando…'}
  try{
    const created=await api('create_post',{caption,locationLabel:location})
    for(const f of files)await upload(created.id,f)
    $('fsCaption72').value='';$('fsLocation72').value='';$('fsMedia72').value='';files=[];preview();await refresh();toast('Publicado na Nossa Rede 💕')
  }catch(e){toast(e?.message||'Não foi possível publicar.')}
  finally{busy=false;if(b){b.disabled=false;b.textContent='Publicar'}}
}
function openProfile(){
  const p=myProfile();$('fsName72').value=p.name||state.me?.name||window.__ISA_FRIEND_PERSON__?.name||'';$('fsBio72').value=p.bio||'';$('fsStatus72').value=p.statusText||'';$('fsMood72').value=p.moodEmoji||'💜';$('fsActivity72').value=p.activityLabel||'';$('fsTheme72').value=p.theme||'lilac';$('fsProfileModal72').classList.add('show')
}
async function saveProfile(){
  try{await api('save_profile',{name:$('fsName72').value,bio:$('fsBio72').value,statusText:$('fsStatus72').value,moodEmoji:$('fsMood72').value,activityLabel:$('fsActivity72').value,theme:$('fsTheme72').value});$('fsProfileModal72').classList.remove('show');await refresh();toast('Perfil atualizado ✨')}
  catch(e){toast(e?.message||'Não foi possível salvar o perfil.')}
}
function close(){const o=$('familySocialOverlay');o?.classList.add('hidden');$('fsProfileModal72')?.classList.remove('show');document.documentElement.style.overflow='';$('friendSocialBtn')?.classList.remove('active');$('friendChatsTab')?.classList.add('active')}

function wire(){
  const o=$('familySocialOverlay');if(!o||o.dataset.wired72==='1')return;o.dataset.wired72='1'
  $('fsClose72').onclick=close;$('fsPublish72').onclick=publish;$('fsProfileCancel72').onclick=()=>$('fsProfileModal72').classList.remove('show');$('fsProfileSave72').onclick=saveProfile
  $('fsProfileModal72').onclick=e=>{if(e.target.id==='fsProfileModal72')$('fsProfileModal72').classList.remove('show')}
  $('fsMedia72').onchange=e=>{files=[...e.target.files].slice(0,3);preview();if(e.target.files.length>3)toast('O carrossel aceita até 3 fotos ou vídeos. ✨')}
  o.addEventListener('click',async e=>{
    const emoji=e.target.closest?.('[data-fs72-emoji]');if(emoji){const t=$('fsCaption72');t.value+=emoji.dataset.fs72Emoji;t.focus();return}
    const edit=e.target.closest?.('#fsEditProfile72');if(edit){openProfile();return}
    const react=e.target.closest?.('[data-fs72-react]');if(react){try{await api('react',{postId:react.dataset.fs72Id,reaction:react.dataset.fs72React});await refresh()}catch(err){toast(err.message)}return}
    const del=e.target.closest?.('[data-fs72-delete]');if(del){if(!confirm('Excluir esta publicação da Nossa Rede?'))return;try{await api('delete_post',{postId:del.dataset.fs72Delete});await refresh();toast('Publicação excluída.')}catch(err){toast(err.message)}return}
  })
  o.addEventListener('submit',async e=>{const f=e.target.closest?.('[data-fs72-comment]');if(!f)return;e.preventDefault();const i=f.querySelector('input'),body=i.value.trim();if(!body)return;try{i.disabled=true;await api('comment',{postId:f.dataset.fs72Comment,body});await refresh()}catch(err){toast(err.message)}finally{i.disabled=false}})
}

function open(){
  if(!ready()){toast('Seu acesso ainda está sendo validado.');return false}
  build();$('familySocialOverlay').classList.remove('hidden');document.documentElement.style.overflow='hidden';$('friendChatsTab')?.classList.remove('active');$('friendSocialBtn')?.classList.add('active')
  // A interface aparece primeiro. A rede sincroniza em seguida, sem tela branca/preta e sem travar a navegação.
  requestAnimationFrame(()=>refresh())
  return true
}

window.__ISA_OPEN_EXTERNAL_SOCIAL_V72__=open
window.__ISA_CLOSE_FAMILY_SOCIAL__=close
window.__ISA_REFRESH_EXTERNAL_SOCIAL_V72__=refresh
