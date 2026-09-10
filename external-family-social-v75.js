import { CONFIG } from './config.js?v=20260910-social-v75'

// Nossa Rede v75: NUNCA remove ou recria #familySocialOverlay.
// A tela já existe no HTML; este módulo somente preenche os dados e ativa os controles.
const $=id=>document.getElementById(id)
const token=new URLSearchParams(location.hash.replace(/^#/, '')).get('acesso')||''
const reactions=['🩷','🩵','💜','😂','😍','🌸','🥰','✨']
const quickEmoji=['🩷','🩵','💜','💕','✨','🥰','😂','😍','🌸','🌷','🫶','🎶','📚','☀️','🌙','🏡','🎉','💫']
let state={me:null,profiles:[],posts:[]}
let files=[]
let mounted=false
let busy=false
let refreshRun=0

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]))
const ready=()=>!!token&&window.__ISA_FRIEND_ACCESS_VALID__===true
const overlay=()=>$('familySocialOverlay')

function toast(text){
  if(typeof window.__ISA_FRIEND_TOAST__==='function')return window.__ISA_FRIEND_TOAST__(text)
  const t=$('friendToast');if(!t)return
  t.textContent=text;t.classList.remove('hidden');clearTimeout(t._social75);t._social75=setTimeout(()=>t.classList.add('hidden'),2800)
}

async function api(action,payload={},timeout=8500){
  if(!ready())throw new Error('Este acesso ainda não foi validado.')
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout)
  try{
    const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/friend-social`,{
      method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,'Content-Type':'application/json'},
      body:JSON.stringify({token,action,...payload}),cache:'no-store',signal:controller.signal
    })
    let data={};try{data=await r.json()}catch{}
    if(!r.ok)throw new Error(data?.error||data?.message||'Não foi possível atualizar a Nossa Rede.')
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
  if(!$('externalSocialBaseCss75')){const l=document.createElement('link');l.id='externalSocialBaseCss75';l.rel='stylesheet';l.href='./social-network.css?v=75-existing-overlay';document.head.appendChild(l)}
  if($('externalSocialStyle75'))return
  const s=document.createElement('style');s.id='externalSocialStyle75';s.textContent=`
  #familySocialOverlay .fs75-sync{padding:8px 13px;text-align:center;font-size:11px;color:#8c7b94;background:rgba(255,255,255,.5)}
  #familySocialOverlay .fs75-sync.hidden,#familySocialOverlay .fs75-error.hidden{display:none!important}
  #familySocialOverlay .fs75-error{margin:9px auto;width:min(720px,calc(100% - 18px));padding:10px 12px;border-radius:15px;background:#fff0f5;color:#85536b;text-align:center;font-size:11px}
  #familySocialOverlay .fs75-error button{margin-left:7px;border:0;border-radius:11px;background:#eadfff;color:#614f70;padding:7px 10px;font-weight:900}
  #familySocialOverlay .fs75-textarea{width:100%;min-height:92px;resize:vertical;border:1px solid #eee2f1;border-radius:19px;background:#fff;padding:15px;color:#65566d;font:inherit;box-sizing:border-box;outline:none}
  #familySocialOverlay .fs75-textarea:focus{border-color:#d9bce7;box-shadow:0 0 0 3px rgba(222,190,235,.18)}
  #familySocialOverlay .fs75-emoji{display:flex;gap:5px;overflow:auto;padding:9px 0 2px}.fs75-emoji button{flex:0 0 auto;border:0;border-radius:11px;background:#f7f1fa;padding:7px 8px;cursor:pointer}
  #familySocialOverlay .fs75-actions{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-top:10px}.fs75-actions label,.fs75-actions button{border:0;border-radius:13px;padding:9px 11px;font-weight:900;cursor:pointer}.fs75-actions label{background:#f5edf9;color:#755f80}.fs75-actions input[type=file]{display:none}.fs75-location{flex:1;min-width:150px;border:1px solid #eadff0;border-radius:13px;padding:9px 10px;background:#fff}.fs75-publish{margin-left:auto;background:linear-gradient(145deg,#ef8fc3,#cf8bdc);color:#fff}.fs75-preview{display:flex;gap:5px;overflow:auto;margin-top:7px}.fs75-preview span{flex:0 0 auto;border-radius:10px;background:#f7f1fa;padding:6px 8px;font-size:10px}
  #familySocialOverlay .fs75-profile-button{width:100%;margin-top:9px;border:0;border-radius:13px;padding:9px;background:#eee4f7;color:#665374;font-weight:900;cursor:pointer}
  #familySocialOverlay .fs75-post{padding:0;overflow:hidden;margin-top:12px}.fs75-post-head{display:flex;gap:9px;align-items:center;padding:13px}.fs75-avatar{width:39px;height:39px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(145deg,#fbd9e9,#ddd2ff);font-weight:950}.fs75-grow{flex:1;min-width:0}.fs75-post-head strong,.fs75-post-head small{display:block}.fs75-post-head small{color:#9b8ca0;font-size:9px}.fs75-caption{padding:0 13px 12px;white-space:pre-wrap;overflow-wrap:anywhere}.fs75-media{display:grid;grid-template-columns:1fr 1fr;gap:2px;background:#eee}.fs75-media.one{grid-template-columns:1fr}.fs75-media img,.fs75-media video{width:100%;height:min(55vw,430px);object-fit:contain;background:#171419;display:block}.fs75-reactions{display:flex;gap:5px;flex-wrap:wrap;padding:10px 13px 5px}.fs75-react{border:0;border-radius:11px;background:#f7f1fa;padding:7px 9px;cursor:pointer}.fs75-react.mine{background:#eadbf3;outline:1px solid #c9afd8}.fs75-summary{padding:0 13px 8px;font-size:10px;color:#8d7e94}.fs75-comments{padding:8px 13px 13px;border-top:1px solid #f0e7f2}.fs75-comment{font-size:11px;margin:5px 0}.fs75-comment strong{margin-right:5px}.fs75-comment-form{display:flex;gap:6px;margin-top:8px}.fs75-comment-form input{flex:1;min-width:0;border:1px solid #eadff0;border-radius:12px;padding:9px}.fs75-comment-form button{border:0;border-radius:11px;background:#c8acd7;color:white;padding:0 12px;font-weight:900}.fs75-delete{border:0;border-radius:10px;background:#fff0f3;color:#a44f68;padding:6px 8px;font-size:9px;font-weight:900}
  #familySocialOverlay .fs75-modal{position:fixed;inset:0;z-index:120050;display:none;place-items:center;background:rgba(45,33,52,.36);backdrop-filter:blur(7px);padding:12px}.fs75-modal.show{display:grid!important}.fs75-modal-card{width:min(500px,96vw);max-height:92dvh;overflow:auto;padding:17px}.fs75-modal-card label{display:grid;gap:4px;margin:8px 0;font-size:10px;font-weight:900}.fs75-modal-card input,.fs75-modal-card textarea,.fs75-modal-card select{border:1px solid #eadff0;border-radius:12px;padding:9px;background:#fff}.fs75-modal-actions{display:flex;justify-content:flex-end;gap:7px;margin-top:11px}.fs75-modal-actions button{border:0;border-radius:11px;padding:8px 11px;font-weight:900}.fs75-save{background:#c9a9dc;color:#fff}
  @media(max-width:780px){#familySocialOverlay .fs75-media img,#familySocialOverlay .fs75-media video{height:min(86vw,430px)}#familySocialOverlay .fs75-actions{align-items:stretch}.fs75-location{width:100%;flex-basis:100%}.fs75-publish{margin-left:auto}}
  `;document.head.appendChild(s)
}

function fmt(ts){try{const d=new Date(ts),now=new Date();return d.toDateString()===now.toDateString()?`Hoje, ${d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`:d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}catch{return''}}
function initial(name='?'){return String(name||'?').trim().charAt(0).toUpperCase()||'?'}
function profileFor(id){return (state.profiles||[]).find(p=>String(p.memberId)===String(id))||null}
function myProfile(){return profileFor(state.me?.id)||state.me?.profile||{}}

function mount(){
  const o=overlay();if(!o)throw new Error('A tela da Nossa Rede não existe neste acesso.')
  if(mounted&&$('fs75Feed'))return o
  ensureStyle();mounted=true
  // Mantém o MESMO #familySocialOverlay. Apenas transforma o conteúdo interno em conteúdo ativo.
  const wrap=o.querySelector('.fs-static-wrap')
  if(!wrap)throw new Error('Estrutura da Nossa Rede não encontrada.')
  wrap.innerHTML=`
    <aside class="fs-static-card fs-static-profile"><div class="fs-static-logo">Nossa <span>Rede</span> ✨</div><div id="fs75MyProfile"><div class="fs-static-avatar">💜</div><strong>Seu perfil</strong><small>Atualizando…</small></div></aside>
    <main class="fs-static-main"><section id="fs75Composer" class="fs-static-card fs-static-welcome"><div class="fs-static-handwrite">Compartilhe bons momentos e recordações 💕</div><textarea id="fs75Caption" class="fs75-textarea" maxlength="2200" placeholder="Compartilhe um momento, uma frase, uma foto... ✨"></textarea><div class="fs75-emoji">${quickEmoji.map(e=>`<button type="button" data-fs75-emoji="${e}">${e}</button>`).join('')}</div><div id="fs75Preview" class="fs75-preview"></div><div class="fs75-actions"><label>🖼️ Upload<input id="fs75Media" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" multiple></label><input id="fs75Location" class="fs75-location" maxlength="80" placeholder="📍 Localização (opcional)"><button id="fs75Publish" class="fs75-publish" type="button">Publicar</button></div></section><div id="fs75Error" class="fs75-error hidden"></div><div id="fs75Sync" class="fs75-sync hidden">Atualizando a Nossa Rede…</div><section id="fs75Feed" class="fs-static-feed"><h3>Momentos da família 🌷</h3><div class="fs-static-loader"><div><div class="fs-static-loader-bubble">🌸</div><strong>Atualizando publicações…</strong></div></div></section></main>
    <aside class="fs-static-card fs-static-side"><h3>Família agora 💫</h3><div id="fs75Family"><div class="fs-static-person"><div class="fs-static-mini">💕</div><div><strong>Atualizando…</strong><small>Como todos estão hoje</small></div></div></div></aside>`
  if(!$('fs75ProfileModal')){const m=document.createElement('div');m.id='fs75ProfileModal';m.className='fs75-modal';m.innerHTML=`<div class="fs-static-card fs75-modal-card"><h3>Personalizar meu perfil ✨</h3><label>Nome<input id="fs75Name" maxlength="50"></label><label>Bio<textarea id="fs75Bio" maxlength="240" rows="3"></textarea></label><label>Frase do dia<input id="fs75Status" maxlength="120"></label><label>Como estou<select id="fs75Mood"><option>🩷</option><option>🩵</option><option>💜</option><option>🥰</option><option>😊</option><option>😂</option><option>😴</option><option>🤩</option><option>😌</option><option>🥳</option></select></label><label>O que estou fazendo<select id="fs75Activity"><option value="">Nada agora</option><option>🏫 Na escola</option><option>💼 No trabalho</option><option>📚 Estudando</option><option>🏡 Em casa</option><option>🎶 Ouvindo música</option><option>🎮 Jogando</option><option>☕ Relaxando</option><option>🛍️ Passeando</option><option>✈️ Viajando</option></select></label><div class="fs75-modal-actions"><button id="fs75Cancel" type="button">Cancelar</button><button id="fs75Save" class="fs75-save" type="button">Salvar</button></div></div>`;o.appendChild(m)}
  wire()
  return o
}

function showError(message){const e=$('fs75Error');if(!e)return;e.innerHTML=`${esc(message)} <button id="fs75Retry" type="button">Tentar atualizar</button>`;e.classList.remove('hidden');$('fs75Retry').onclick=refresh}
function hideError(){$('fs75Error')?.classList.add('hidden')}
function sync(on){$('fs75Sync')?.classList.toggle('hidden',!on)}

function renderProfile(){
  const box=$('fs75MyProfile');if(!box)return
  const p=myProfile(),name=p.name||state.me?.name||window.__ISA_FRIEND_PERSON__?.name||'Família'
  box.innerHTML=`<div class="fs-static-avatar">${esc(initial(name))}</div><strong>${esc(name)}</strong><small>${esc(p.bio||state.me?.relationship||window.__ISA_FRIEND_PERSON__?.relationship||'Família')}</small><div class="fs-static-person" style="margin-top:10px"><div class="fs-static-mini">${esc(p.moodEmoji||'💜')}</div><div><strong>${esc(p.statusText||'Como estou hoje')}</strong><small>${esc(p.activityLabel||'Sem atualização agora')}</small></div></div><button id="fs75EditProfile" class="fs75-profile-button" type="button">Personalizar perfil</button>`
}
function renderFamily(){
  const box=$('fs75Family');if(!box)return
  box.innerHTML=(state.profiles||[]).map(p=>`<div class="fs-static-person"><div class="fs-static-mini">${esc(p.moodEmoji||'💕')}</div><div><strong>${esc(p.name||'Família')}</strong><small>${esc(p.activityLabel||p.statusText||'Sem atualização')}</small></div></div>`).join('')||'<div class="fs-static-person"><div class="fs-static-mini">💕</div><div><strong>Família</strong><small>As atualizações aparecerão aqui.</small></div></div>'
}
function mediaHtml(post){if(!post.media?.length)return'';return `<div class="fs75-media ${post.media.length===1?'one':''}">${post.media.map(m=>m.type==='video'?`<video src="${esc(m.url)}" controls playsinline preload="metadata"></video>`:`<img src="${esc(m.url)}" loading="lazy" alt="Publicação">`).join('')}</div>`}
function reactionSummary(post){const c={};for(const r of post.reactions||[])c[r.reaction]=(c[r.reaction]||0)+1;return Object.entries(c).map(([e,n])=>`${e} ${n}`).join('   ')}
function postHtml(post){
  const mine=String(post.authorId)===String(state.me?.id),myReaction=(post.reactions||[]).find(r=>String(r.memberId)===String(state.me?.id))?.reaction||''
  return `<article class="fs-static-card fs75-post" data-fs75-post="${esc(post.id)}"><div class="fs75-post-head"><div class="fs75-avatar">${esc(initial(post.author?.name))}</div><div class="fs75-grow"><strong>${esc(post.author?.name||'Família')}</strong><small>${esc(fmt(post.createdAt))}${post.locationLabel?' • 📍 '+esc(post.locationLabel):''}</small></div>${mine?`<button class="fs75-delete" data-fs75-delete="${esc(post.id)}" type="button">Excluir</button>`:''}</div>${post.caption?`<div class="fs75-caption">${esc(post.caption)}</div>`:''}${mediaHtml(post)}<div class="fs75-reactions">${reactions.map(e=>`<button class="fs75-react ${myReaction===e?'mine':''}" data-fs75-react="${e}" data-fs75-id="${esc(post.id)}" type="button">${e}</button>`).join('')}</div><div class="fs75-summary">${esc(reactionSummary(post))}</div><div class="fs75-comments">${(post.comments||[]).slice(-8).map(c=>`<div class="fs75-comment"><strong>${esc(c.authorName||'Família')}</strong>${esc(c.body)}</div>`).join('')}<form class="fs75-comment-form" data-fs75-comment="${esc(post.id)}"><input maxlength="1200" placeholder="Comentar com carinho..."><button>➤</button></form></div></article>`
}
function renderFeed(){const box=$('fs75Feed');if(!box)return;box.innerHTML='<h3>Momentos da família 🌷</h3>'+((state.posts||[]).length?(state.posts||[]).map(postHtml).join(''):'<div class="fs-static-card" style="padding:18px;margin-top:10px;text-align:center">Ainda não tem publicação por aqui. Que tal inaugurar a Nossa Rede? 🌷</div>')}
function render(){renderProfile();renderFamily();renderFeed();const composer=$('fs75Composer');if(composer)composer.style.display=state.me?.canPost===false?'none':''}

async function refresh(){
  mount();const run=++refreshRun
  if(!ready()){showError('Este acesso ainda não foi validado.');return false}
  sync(true);hideError()
  try{const data=await api('bootstrap');if(run!==refreshRun)return false;state=data||{me:null,profiles:[],posts:[]};render();hideError();return true}
  catch(e){if(run===refreshRun)showError(e?.message||'Não foi possível atualizar agora.');return false}
  finally{if(run===refreshRun)sync(false)}
}

function preview(){const b=$('fs75Preview');if(b)b.innerHTML=files.map(f=>`<span>${f.type.startsWith('video/')?'🎬':'🖼️'} ${esc(f.name.slice(0,25))}</span>`).join('')}
async function publish(){
  if(busy)return
  const caption=$('fs75Caption')?.value.trim()||'',locationLabel=$('fs75Location')?.value.trim()||''
  if(!caption&&!files.length)return toast('Escreva algo ou escolha uma foto/vídeo.')
  busy=true;const b=$('fs75Publish');if(b){b.disabled=true;b.textContent='Publicando…'}
  try{const created=await api('create_post',{caption,locationLabel});for(const f of files)await upload(created.id,f);$('fs75Caption').value='';$('fs75Location').value='';$('fs75Media').value='';files=[];preview();await refresh();toast('Publicado na Nossa Rede 💕')}
  catch(e){toast(e?.message||'Não foi possível publicar.')}
  finally{busy=false;if(b){b.disabled=false;b.textContent='Publicar'}}
}
function openProfile(){const p=myProfile();$('fs75Name').value=p.name||state.me?.name||window.__ISA_FRIEND_PERSON__?.name||'';$('fs75Bio').value=p.bio||'';$('fs75Status').value=p.statusText||'';$('fs75Mood').value=p.moodEmoji||'💜';$('fs75Activity').value=p.activityLabel||'';$('fs75ProfileModal').classList.add('show')}
async function saveProfile(){try{await api('save_profile',{name:$('fs75Name').value,bio:$('fs75Bio').value,statusText:$('fs75Status').value,moodEmoji:$('fs75Mood').value,activityLabel:$('fs75Activity').value});$('fs75ProfileModal').classList.remove('show');await refresh();toast('Perfil atualizado ✨')}catch(e){toast(e?.message||'Não foi possível salvar o perfil.')}}

function wire(){
  const o=overlay();if(!o||o.dataset.wired75==='1')return;o.dataset.wired75='1'
  $('fs75Publish').onclick=publish;$('fs75Cancel').onclick=()=>$('fs75ProfileModal').classList.remove('show');$('fs75Save').onclick=saveProfile
  $('fs75Media').onchange=e=>{files=[...e.target.files].slice(0,3);preview();if(e.target.files.length>3)toast('O carrossel aceita até 3 fotos ou vídeos. ✨')}
  $('fs75ProfileModal').onclick=e=>{if(e.target.id==='fs75ProfileModal')$('fs75ProfileModal').classList.remove('show')}
  o.addEventListener('click',async e=>{
    const emoji=e.target.closest?.('[data-fs75-emoji]');if(emoji){const t=$('fs75Caption');t.value+=emoji.dataset.fs75Emoji;t.focus();return}
    if(e.target.closest?.('#fs75EditProfile')){openProfile();return}
    const react=e.target.closest?.('[data-fs75-react]');if(react){try{await api('react',{postId:react.dataset.fs75Id,reaction:react.dataset.fs75React});await refresh()}catch(err){toast(err.message)}return}
    const del=e.target.closest?.('[data-fs75-delete]');if(del){if(!confirm('Excluir esta publicação da Nossa Rede?'))return;try{await api('delete_post',{postId:del.dataset.fs75Delete});await refresh();toast('Publicação excluída.')}catch(err){toast(err.message)}return}
  })
  o.addEventListener('submit',async e=>{const f=e.target.closest?.('[data-fs75-comment]');if(!f)return;e.preventDefault();const i=f.querySelector('input'),body=i.value.trim();if(!body)return;try{i.disabled=true;await api('comment',{postId:f.dataset.fs75Comment,body});await refresh()}catch(err){toast(err.message)}finally{i.disabled=false}})
}

function hydrate(){mount();return refresh()}

window.__ISA_HYDRATE_EXTERNAL_SOCIAL_V75__=hydrate
window.__ISA_REFRESH_EXTERNAL_SOCIAL_V75__=refresh
window.__ISA_EXTERNAL_SOCIAL_V75_MOUNT__=mount
