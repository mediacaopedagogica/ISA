import { CONFIG } from './config.js'

const $=id=>document.getElementById(id)
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
let loading=false

function sessionToken(){
  try{const ref=new URL(CONFIG.SUPABASE_URL).hostname.split('.')[0],raw=localStorage.getItem(`sb-${ref}-auth-token`);if(!raw)return null;const data=JSON.parse(raw);return data?.access_token||data?.currentSession?.access_token||data?.session?.access_token||null}catch{return null}
}
async function rpc(name,args={}){const token=sessionToken();if(!token)throw new Error('Sessão não encontrada');const r=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(args),cache:'no-store'});let data=null;try{data=await r.json()}catch{};if(!r.ok)throw new Error(data?.message||data?.hint||data?.details||'Não foi possível concluir.');return data}
function toast(text){const t=$('toast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._ext);t._ext=setTimeout(()=>t.classList.add('hidden'),2200)}
function linkFor(token){const u=new URL('./acesso.html',location.href);u.hash=`acesso=${token}`;return u.toString()}
function ensureCss(){if(document.querySelector('link[href^="external-access.css"]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href='external-access.css?v=2';document.head.appendChild(l)}
function changed(){window.dispatchEvent(new CustomEvent('isa:external-access-changed'))}

function mount(){
  const panel=$('supervisionPanel');if(!panel||$('externalFriendsBox'))return
  ensureCss();const box=document.createElement('section');box.id='externalFriendsBox';box.className='external-friends-box hidden';box.innerHTML=`<div class="external-friends-head"><div><h3>Acessos externos da Isa 🌷</h3><p>Amigas e familiares podem entrar pelo próprio link. Keise e Alan podem pausar ou reativar o acesso temporariamente.</p></div></div><div id="externalCreateWrap"></div><div id="externalFriendList" class="external-friend-list"></div>`;const info=panel.querySelector('.supervision-info');if(info?.nextSibling)panel.insertBefore(box,info.nextSibling);else panel.appendChild(box)
}
async function load(){
  if(loading)return;mount();const box=$('externalFriendsBox');if(!box)return;loading=true
  try{
    const list=await rpc('external_friend_list',{});box.classList.remove('hidden');const canCreate=(list||[]).some(x=>!!x.token)
    $('externalCreateWrap').innerHTML=canCreate?`<div class="external-create-row"><input id="newExternalFriendName" maxlength="60" placeholder="Nome da amiga"><button id="createExternalFriendBtn" class="soft-btn" type="button">＋ Criar acesso</button></div>`:''
    if(canCreate)$('createExternalFriendBtn').onclick=createFriend
    $('externalFriendList').innerHTML=(list||[]).map(x=>{const status=!x.active?'revoked':x.paused?'paused':'active',label=status==='revoked'?'Revogado':status==='paused'?'Pausado':'Ativo',relation=esc(x.relationship||'Acesso por link');return `<article class="external-friend-card" data-ext-card="${x.memberId}"><div class="external-friend-name"><strong>${esc(x.name)}</strong><small>${relation}</small><span class="external-status ${status}">${label}</span></div><div class="external-friend-actions">${x.active?`<button class="${x.paused?'resume':'pause'}" data-ext-pause="${x.memberId}" data-paused="${x.paused?'1':'0'}">${x.paused?'▶ Reativar chat':'⏸ Desativar chat'}</button>`:''}${x.token?`<button data-ext-copy="${esc(x.token)}">🔗 Copiar link</button><button data-ext-regen="${x.memberId}">↻ Novo link</button><button class="danger" data-ext-revoke="${x.memberId}">Revogar</button>`:''}</div></article>`}).join('')||'<p class="muted">Nenhum acesso por link criado.</p>'
    document.querySelectorAll('[data-ext-pause]').forEach(b=>b.onclick=()=>togglePause(b));document.querySelectorAll('[data-ext-copy]').forEach(b=>b.onclick=()=>copyLink(b.dataset.extCopy));document.querySelectorAll('[data-ext-regen]').forEach(b=>b.onclick=()=>regenerate(b.dataset.extRegen));document.querySelectorAll('[data-ext-revoke]').forEach(b=>b.onclick=()=>revoke(b.dataset.extRevoke))
  }catch(e){box.classList.add('hidden')}finally{loading=false}
}
async function togglePause(btn){const paused=btn.dataset.paused==='1';btn.disabled=true;try{await rpc('external_friend_pause',{p_member_id:btn.dataset.extPause,p_paused:!paused});toast(paused?'Acesso ativado ✓':'Acesso pausado ✓');changed();await load()}catch(e){toast(e.message)}finally{btn.disabled=false}}
async function copyLink(token){try{await navigator.clipboard.writeText(linkFor(token));toast('Link copiado ✓')}catch{toast('Não foi possível copiar o link.')}}
async function createFriend(){const input=$('newExternalFriendName'),name=input?.value.trim();if(!name)return toast('Digite o nome da amiga.');const b=$('createExternalFriendBtn');b.disabled=true;try{const r=await rpc('external_friend_create',{p_name:name});input.value='';await navigator.clipboard.writeText(linkFor(r.token)).catch(()=>{});toast('Acesso criado e link copiado ✓');changed();await load()}catch(e){toast(e.message)}finally{b.disabled=false}}
async function regenerate(id){if(!confirm('Gerar um novo link? O link antigo deixará de funcionar.'))return;try{const r=await rpc('external_friend_regenerate',{p_member_id:id});await navigator.clipboard.writeText(linkFor(r.token)).catch(()=>{});toast('Novo link gerado e copiado ✓');await load()}catch(e){toast(e.message)}}
async function revoke(id){if(!confirm('Revogar este acesso? O link deixará de funcionar.'))return;try{await rpc('external_friend_revoke',{p_member_id:id});toast('Acesso revogado');changed();await load()}catch(e){toast(e.message)}}

mount();load()
