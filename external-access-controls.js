import { CONFIG } from './config.js'

const $=id=>document.getElementById(id)
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))

function sessionToken(){
  try{
    const ref=new URL(CONFIG.SUPABASE_URL).hostname.split('.')[0]
    const raw=localStorage.getItem(`sb-${ref}-auth-token`)
    if(!raw)return null
    const data=JSON.parse(raw)
    if(data?.access_token)return data.access_token
    if(data?.currentSession?.access_token)return data.currentSession.access_token
    if(data?.session?.access_token)return data.session.access_token
  }catch{}
  return null
}
async function rpc(name,args={}){
  const token=sessionToken();if(!token)throw new Error('Sessão não encontrada')
  const r=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(args),cache:'no-store'})
  let data=null;try{data=await r.json()}catch{}
  if(!r.ok)throw new Error(data?.message||data?.hint||data?.details||'Não foi possível concluir.')
  return data
}
function toast(text){const t=$('toast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._ext);t._ext=setTimeout(()=>t.classList.add('hidden'),2200)}
function linkFor(token){const u=new URL('./amiga.html',location.href);u.hash=`acesso=${token}`;return u.toString()}
function mount(){
  const panel=$('parentsPanel');if(!panel||$('externalFriendsBox'))return
  if(!document.querySelector('link[href^="external-access.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='external-access.css?v=1';document.head.appendChild(l)}
  const box=document.createElement('section');box.id='externalFriendsBox';box.className='external-friends-box hidden';box.innerHTML=`<div class="external-friends-head"><div><h3>Acessos das amigas da Isa 🌷</h3><p>Pausar mantém o mesmo link e bloqueia o acesso temporariamente.</p></div></div><div id="externalCreateWrap"></div><div id="externalFriendList" class="external-friend-list"></div>`
  const alertsTitle=[...panel.querySelectorAll('h3')].find(x=>/Alertas recentes/i.test(x.textContent||''));panel.insertBefore(box,alertsTitle||panel.lastChild)
}
async function load(){
  mount();const box=$('externalFriendsBox');if(!box)return
  try{
    const list=await rpc('external_friend_list',{})
    box.classList.remove('hidden')
    const canCreate=(list||[]).some(x=>!!x.token)
    $('externalCreateWrap').innerHTML=canCreate?`<div class="external-create-row"><input id="newExternalFriendName" maxlength="60" placeholder="Nome da amiga"><button id="createExternalFriendBtn" class="soft-btn" type="button">＋ Criar acesso</button></div>`:''
    if(canCreate)$('createExternalFriendBtn').onclick=createFriend
    $('externalFriendList').innerHTML=(list||[]).map(x=>{
      const status=!x.active?'revoked':x.paused?'paused':'active';const label=status==='revoked'?'Revogado':status==='paused'?'Pausado':'Ativo'
      return `<article class="external-friend-card" data-ext-card="${x.memberId}"><div class="external-friend-name"><strong>${esc(x.name)}</strong><small>Link pessoal de acesso</small><span class="external-status ${status}">${label}</span></div><div class="external-friend-actions">${x.active?`<button class="${x.paused?'resume':'pause'}" data-ext-pause="${x.memberId}" data-paused="${x.paused?'1':'0'}">${x.paused?'▶ Reativar':'⏸ Pausar'}</button>`:''}${x.token?`<button data-ext-copy="${esc(x.token)}">🔗 Copiar link</button><button data-ext-regen="${x.memberId}">↻ Novo link</button><button class="danger" data-ext-revoke="${x.memberId}">Revogar</button>`:''}</div></article>`
    }).join('')||'<p class="muted">Nenhum acesso externo criado.</p>'
    document.querySelectorAll('[data-ext-pause]').forEach(b=>b.onclick=()=>togglePause(b))
    document.querySelectorAll('[data-ext-copy]').forEach(b=>b.onclick=()=>copyLink(b.dataset.extCopy))
    document.querySelectorAll('[data-ext-regen]').forEach(b=>b.onclick=()=>regenerate(b.dataset.extRegen))
    document.querySelectorAll('[data-ext-revoke]').forEach(b=>b.onclick=()=>revoke(b.dataset.extRevoke))
  }catch(e){box.classList.add('hidden')}
}
async function togglePause(btn){
  const paused=btn.dataset.paused==='1';btn.disabled=true
  try{await rpc('external_friend_pause',{p_member_id:btn.dataset.extPause,p_paused:!paused});toast(paused?'Acesso reativado ✓':'Acesso pausado ✓');await load()}
  catch(e){toast(e.message)}finally{btn.disabled=false}
}
async function copyLink(token){try{await navigator.clipboard.writeText(linkFor(token));toast('Link copiado ✓')}catch{toast('Não foi possível copiar o link.') }}
async function createFriend(){
  const input=$('newExternalFriendName'),name=input?.value.trim();if(!name)return toast('Digite o nome da amiga.')
  const b=$('createExternalFriendBtn');b.disabled=true
  try{const r=await rpc('external_friend_create',{p_name:name});input.value='';await navigator.clipboard.writeText(linkFor(r.token)).catch(()=>{});toast('Acesso criado e link copiado ✓');await load()}
  catch(e){toast(e.message)}finally{b.disabled=false}
}
async function regenerate(id){if(!confirm('Gerar um novo link? O link antigo deixará de funcionar.'))return;try{const r=await rpc('external_friend_regenerate',{p_member_id:id});await navigator.clipboard.writeText(linkFor(r.token)).catch(()=>{});toast('Novo link gerado e copiado ✓');await load()}catch(e){toast(e.message)}}
async function revoke(id){if(!confirm('Revogar este acesso? O link deixará de funcionar.'))return;try{await rpc('external_friend_revoke',{p_member_id:id});toast('Acesso revogado');await load()}catch(e){toast(e.message)}}

mount()
document.querySelector('[data-tab="parents"]')?.addEventListener('click',()=>setTimeout(load,80))
const obs=new MutationObserver(()=>{if(!$('parentsPanel')?.classList.contains('hidden'))load()})
if($('parentsPanel'))obs.observe($('parentsPanel'),{attributes:true,attributeFilter:['class']})
