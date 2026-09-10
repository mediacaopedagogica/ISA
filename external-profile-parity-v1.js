import { CONFIG } from './config.js?v=20260910-profile-parity'

// Acessos externos: o perfil da Nossa Rede deve ter exatamente a mesma estrutura do perfil principal:
// Perfil + Curiosidades + Galeria, editor com foto social independente, status e tema.
const $=id=>document.getElementById(id)
const token=new URLSearchParams(location.hash.replace(/^#/, '')).get('acesso')||''
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const themes=[['pink','#efb0ce'],['lilac','#b9a9e6'],['green','#add8b0'],['yellow','#f3df95'],['blue','#b3d5ea']]
const moods=['💜','🥰','😊','😂','😴','🤩','😌','🥳','🤗','🤔','😎','💪']
const activities=[['','Nada agora'],['🏫 Na escola','🏫 Na escola'],['💼 No trabalho','💼 No trabalho'],['📚 Estudando','📚 Estudando'],['🏡 Em casa','🏡 Em casa'],['🎶 Ouvindo música','🎶 Ouvindo música'],['🎮 Jogando','🎮 Jogando'],['🚗 Na estrada','🚗 Na estrada'],['☕ Relaxando','☕ Relaxando'],['🛍️ Passeando','🛍️ Passeando'],['✈️ Viajando','✈️ Viajando']]
let own=null,busy=false,stackPromise=null,modalObserver=null,patchQueued=false

function toast(text){
  if(typeof window.__ISA_FRIEND_TOAST__==='function')return window.__ISA_FRIEND_TOAST__(text)
  const t=$('friendToast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._profileParity);t._profileParity=setTimeout(()=>t.classList.add('hidden'),2800)
}
function initial(name){return (String(name||'?').trim().charAt(0)||'💜').toUpperCase()}
function ready(){return !!token&&window.__ISA_FRIEND_ACCESS_VALID__===true}

async function friendApi(action,payload={}){
  if(!ready())throw new Error('Este acesso ainda não foi validado.')
  const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/friend-social`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({token,action,...payload}),cache:'no-store'})
  const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error||'Não foi possível atualizar o perfil.');return d
}
async function uploadAvatar(file){
  if(!ready())throw new Error('Este acesso ainda não foi validado.')
  const form=new FormData();form.append('token',token);form.append('action','upload_avatar');form.append('file',file)
  const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/friend-social`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY},body:form,cache:'no-store'})
  const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error||'Não foi possível atualizar a foto da Nossa Rede.');return d
}
async function refreshOwn(){
  if(!ready())return null
  const d=await friendApi('bootstrap');const id=d?.me?.id||window.__ISA_FRIEND_PERSON__?.id||''
  own=(d?.profiles||[]).find(p=>String(p.memberId)===String(id))||d?.me?.profile||null
  if(own&&!own.memberId)own={...own,memberId:id,name:own.display_name||d?.me?.name||window.__ISA_FRIEND_PERSON__?.name||'Perfil'}
  updatePhotoPreview();return own
}

function addStyle(){
  if($('externalProfileParityStyle'))return
  const s=document.createElement('style');s.id='externalProfileParityStyle';s.textContent=`
  #fsProfileModal .external-profile-photo{display:flex;align-items:center;gap:13px;margin:10px 0 15px;padding:12px;border:1px solid #eee1f2;border-radius:19px;background:linear-gradient(145deg,#fff8fc,#f2ecff)}
  #fsProfileModal .external-profile-photo-preview{width:72px;height:72px;flex:0 0 72px;border-radius:23px;overflow:hidden;display:grid;place-items:center;background:linear-gradient(145deg,#f7d9e8,#ddd2fa);box-shadow:inset 0 0 0 1px #fff;font-size:29px;font-weight:950;color:#624e6d}
  #fsProfileModal .external-profile-photo-preview img{width:100%;height:100%;object-fit:cover;display:block}
  #fsProfileModal .external-profile-photo-copy{min-width:0;flex:1}#fsProfileModal .external-profile-photo-copy b{display:block;font-size:12px;color:#66516f}#fsProfileModal .external-profile-photo-copy small{display:block;margin:3px 0 8px;color:#94829b;font-size:9px;line-height:1.35}
  #fsProfileModal .external-profile-photo-actions{display:flex;gap:6px;flex-wrap:wrap}#fsProfileModal .external-profile-photo-actions label,#fsProfileModal .external-profile-photo-actions button{border:0;border-radius:11px;padding:7px 9px;background:#eadff5;color:#66516f;font-size:10px;font-weight:900;cursor:pointer}#fsProfileModal .external-profile-photo-actions .remove{background:#fff0f3;color:#9d586b}
  #fsProfileModal #fsTheme{position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important}
  #fsProfileModal .external-theme-swatches{display:grid;grid-template-columns:repeat(5,minmax(52px,1fr));gap:7px;margin-top:4px}
  #fsProfileModal .external-theme-swatch{height:43px;border-radius:14px;border:2px solid #fff;box-shadow:0 0 0 1px #dacde0;cursor:pointer;padding:0}.external-theme-swatch.active{outline:2px solid #72597e;outline-offset:1px}
  #fsProfileModal .social-modal-card{width:min(560px,96vw);max-height:92dvh;overflow:auto}
  @media(max-width:760px){#fsProfileModal{align-items:stretch;padding:0}#fsProfileModal .social-modal-card{width:100vw;max-width:none;height:100dvh;max-height:100dvh;border-radius:0;padding:14px 10px calc(18px + env(safe-area-inset-bottom))}.external-theme-swatches{grid-template-columns:repeat(5,1fr)!important}#fsProfileModal .external-profile-photo{align-items:flex-start}}
  `;document.head.appendChild(s)
}

function ensureSelectOptions(){
  const mood=$('fsMood'),activity=$('fsActivity')
  if(mood&&mood.dataset.profileParityOptions!=='1'){
    const current=mood.value||'💜';mood.innerHTML=moods.map(x=>`<option>${x}</option>`).join('');mood.value=moods.includes(current)?current:'💜';mood.dataset.profileParityOptions='1'
  }
  if(activity&&activity.dataset.profileParityOptions!=='1'){
    const current=activity.value||'';activity.innerHTML=activities.map(([v,l])=>`<option value="${esc(v)}">${esc(l)}</option>`).join('');activity.value=activities.some(([v])=>v===current)?current:'';activity.dataset.profileParityOptions='1'
  }
}
function ensurePhotoEditor(card){
  if(card.querySelector('[data-external-profile-photo]'))return
  const title=card.querySelector('h3');if(!title)return
  title.insertAdjacentHTML('afterend',`<section class="external-profile-photo" data-external-profile-photo="1"><div id="externalProfilePhotoPreview" class="external-profile-photo-preview">💜</div><div class="external-profile-photo-copy"><b>Foto da Nossa Rede</b><small>Esta foto aparece somente na Nossa Rede. A foto do Chat pode ser outra e não será alterada.</small><div class="external-profile-photo-actions"><label>📷 Escolher foto<input id="externalProfilePhotoInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden></label><button id="externalProfilePhotoRemove" class="remove" type="button">Remover</button></div></div></section>`)
  const input=$('externalProfilePhotoInput'),remove=$('externalProfilePhotoRemove')
  input?.addEventListener('change',async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type))return toast('Use JPG, PNG, WEBP ou GIF.');if(file.size>5*1024*1024)return toast('A foto pode ter até 5 MB.');if(busy)return;busy=true;try{toast('Atualizando a foto da Nossa Rede…');const d=await uploadAvatar(file);own={...(own||{}),avatarUrl:d.avatarUrl||'',avatarRef:d.avatarRef||''};updatePhotoPreview();await refreshEverything();toast('Foto da Nossa Rede atualizada 💜')}catch(err){toast(err?.message||'Não foi possível atualizar a foto.')}finally{busy=false}})
  remove?.addEventListener('click',async()=>{if(busy)return;busy=true;try{await friendApi('remove_avatar');if(own)own={...own,avatarUrl:'',avatarRef:''};updatePhotoPreview();await refreshEverything();toast('Foto removida somente da Nossa Rede.')}catch(err){toast(err?.message||'Não foi possível remover a foto.')}finally{busy=false}})
}
function ensureThemeSwatches(){
  const select=$('fsTheme');if(!select)return
  const field=select.closest('.social-field')||select.parentElement;if(!field)return
  let box=field.querySelector('.external-theme-swatches')
  if(!box){
    box=document.createElement('div');box.className='external-theme-swatches';box.setAttribute('role','group');box.setAttribute('aria-label','Tema do perfil');box.innerHTML=themes.map(([v,c])=>`<button type="button" class="external-theme-swatch" data-theme="${v}" style="background:${c}" aria-label="Tema ${v}"></button>`).join('');field.appendChild(box)
    box.addEventListener('click',e=>{const b=e.target.closest('[data-theme]');if(!b)return;select.value=b.dataset.theme;select.dispatchEvent(new Event('change',{bubbles:true}));syncThemes()})
  }
  syncThemes()
}
function syncThemes(){const value=$('fsTheme')?.value||'lilac';document.querySelectorAll('#fsProfileModal .external-theme-swatch').forEach(b=>b.classList.toggle('active',b.dataset.theme===value))}
function updatePhotoPreview(){const p=$('externalProfilePhotoPreview');if(!p)return;const name=own?.name||window.__ISA_FRIEND_PERSON__?.name||$('friendName')?.textContent||'Perfil';p.innerHTML=own?.avatarUrl?`<img src="${esc(own.avatarUrl)}" alt="Foto de ${esc(name)} na Nossa Rede">`:esc(initial(name))}

function patch(){
  if(!$('friendApp'))return false
  addStyle();const modal=$('fsProfileModal'),card=modal?.querySelector('.social-modal-card,.fs-profile-card');if(!modal||!card)return false
  ensurePhotoEditor(card);ensureSelectOptions();ensureThemeSwatches();updatePhotoPreview()
  if(!modalObserver){modalObserver=new MutationObserver(()=>{if(modal.classList.contains('show')){ensureSelectOptions();syncThemes();refreshOwn().catch(()=>{})}});modalObserver.observe(modal,{attributes:true,attributeFilter:['class']})}
  return true
}
function schedulePatch(){if(patchQueued)return;patchQueued=true;requestAnimationFrame(()=>{patchQueued=false;patch()})}

async function loadProfileStack(){
  if(stackPromise)return stackPromise
  stackPromise=(async()=>{
    await import('./social-profile-pages-v1.js?v=2-all-family-profile-parity')
    await import('./social-profile-directory-v1.js?v=2-all-family-profile-parity').catch(()=>null)
    await import('./social-reaction-names-v1.js?v=2-all-family-profile-parity').catch(()=>null)
    window.__ISA_SOCIAL_PROFILE_PAGES__?.decorate?.();window.__ISA_SOCIAL_PROFILE_DIRECTORY__?.patch?.();window.__ISA_ENHANCE_REACTION_NAMES__?.()
    return true
  })().catch(err=>{stackPromise=null;throw err})
  return stackPromise
}
async function refreshEverything(){
  try{await window.__ISA_REFRESH_EXTERNAL_SOCIAL_V72__?.()}catch{}
  await refreshOwn().catch(()=>{})
  window.__ISA_SOCIAL_PROFILE_PAGES__?.decorate?.();window.__ISA_SOCIAL_PROFILE_DIRECTORY__?.patch?.();window.__ISA_ENHANCE_REACTION_NAMES__?.()
}
async function start(){
  patch();await loadProfileStack().catch(err=>console.warn('[perfil completo] módulos não carregaram',err));await refreshOwn().catch(()=>{});patch();window.__ISA_SOCIAL_PROFILE_PAGES__?.decorate?.()
}

document.addEventListener('isa:friend-access-valid',()=>start())
document.addEventListener('isa:friend-portal-entered',()=>start())
document.addEventListener('click',e=>{if(e.target?.closest?.('#fsEditProfile')&&window.__ISA_SPP_BYPASS__===true)setTimeout(()=>{patch();refreshOwn().catch(()=>{})},0)},true)
new MutationObserver(schedulePatch).observe(document.documentElement,{childList:true,subtree:true})
if(window.__ISA_FRIEND_ACCESS_VALID__===true)start();else patch()
window.__ISA_EXTERNAL_PROFILE_PARITY__={patch,start,loadProfileStack,refreshOwn,refreshEverything}
