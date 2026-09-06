from pathlib import Path

# Helper + counts + group button visibility support
p=Path('chunk-07.txt'); s=p.read_text(encoding='utf-8')
if 'function isExternalFriend(m)' not in s:
    s=s.replace('var activeSupervisionMode=false\n', "var activeSupervisionMode=false\nfunction isExternalFriend(m){return (m?.relationship_label||'').trim().toLowerCase()==='amiga da isa'}\n")
s=s.replace("$('memberCount').textContent=family.filter(x=>x.active).length;", "$('memberCount').textContent=family.filter(x=>x.active&&!isExternalFriend(x)).length;")
old="renderAdminMembers();renderBirthdays();renderChatList();renderSupervisionList()"
new="renderAdminMembers();renderBirthdays();renderChatList();renderSupervisionList();if(isSuperAdmin())loadExternalFriendAccesses().catch(console.warn)"
if old in s: s=s.replace(old,new)
p.write_text(s,encoding='utf-8')

# Family admin list excludes external friends
p=Path('chunk-04.txt'); s=p.read_text(encoding='utf-8')
s=s.replace("$('permissionsTable').innerHTML=family.map(m=>", "$('permissionsTable').innerHTML=family.filter(m=>!isExternalFriend(m)).map(m=>")
p.write_text(s,encoding='utf-8')

# Photos: friend direct remains blocked by contact permission, groups are pedagogical
p=Path('chunk-01.txt'); s=p.read_text(encoding='utf-8')
start=s.find('function canSendPhoto(conv){')
end=s.find('\n\nasync function loadMessages',start)
if start<0 or end<0: raise SystemExit('canSendPhoto not found')
replacement="""function canSendPhoto(conv){
  if(!me||!conv)return false
  if(conv.type==='group')return me.role==='child'?true:!!me.can_send_photo
  if(!me.can_send_photo)return false
  const ids=(conv.conversation_members||[]).map(x=>x.member_id),child=ids.map(memberById).find(x=>x?.role==='child');if(!child)return true
  if(me.role==='child')return !ids.map(memberById).filter(x=>x&&x.id!==me.id&&x.role!=='child').some(a=>!cpFor(me.id,a.id)?.allow_photo)
  return !!cpFor(child.id,me.id)?.allow_photo
}"""
s=s[:start]+replacement+s[end:]
p.write_text(s,encoding='utf-8')

# External friend manager + Isa-only group creation button
p=Path('chunk-09.txt'); s=p.read_text(encoding='utf-8')
if 'async function loadExternalFriendAccesses()' not in s:
    marker='async function boot(){'
    pos=s.find(marker)
    if pos<0: raise SystemExit('boot marker not found')
    functions=r'''
let externalFriendAccesses=[]
function externalFriendUrl(token){const base=new URL('./amiga.html',location.href);base.hash='acesso='+encodeURIComponent(token);return base.href}
async function copyExternalFriendLink(token){
  const url=externalFriendUrl(token)
  try{await navigator.clipboard.writeText(url);toast('Link copiado 💜')}
  catch{const t=document.createElement('textarea');t.value=url;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();toast('Link copiado 💜')}
}
function ensureExternalFriendManager(){
  if(!isSuperAdmin()||!$('parentsPanel'))return null
  let wrap=$('externalFriendsManager');if(wrap)return wrap
  wrap=document.createElement('section');wrap.id='externalFriendsManager';wrap.className='external-friends-manager'
  wrap.innerHTML=`<div class="external-friends-head"><div><h3>Acessos externos da Isa 🌷</h3><p>Crie um link pessoal para cada amiga. Não usa login nem senha e pode ser revogado a qualquer momento.</p></div></div><div class="external-friend-create"><input id="externalFriendName" maxlength="60" placeholder="Nome da amiga"><button id="createExternalFriendBtn" class="soft-btn" type="button">＋ Criar acesso</button></div><div class="external-friend-safety">🔒 Cada link identifica uma única amiga. No privado, ela conversa somente com a Isa e apenas por texto. Fotos ficam disponíveis somente nos grupos criados pela Isa para atividades e trabalhos.</div><div id="externalFriendsList" class="external-friends-list"></div>`
  const alertHeading=[...$('parentsPanel').querySelectorAll('h3')].find(h=>/Alertas recentes/i.test(h.textContent||''))
  if(alertHeading)alertHeading.before(wrap);else $('parentsPanel').appendChild(wrap)
  $('createExternalFriendBtn').onclick=createExternalFriendAccess
  $('externalFriendName').addEventListener('keydown',e=>{if(e.key==='Enter')createExternalFriendAccess()})
  return wrap
}
async function loadExternalFriendAccesses(){
  const wrap=ensureExternalFriendManager();if(!wrap)return
  const box=$('externalFriendsList');box.innerHTML='<p class="muted">Carregando acessos…</p>'
  const {data,error}=await supabase.rpc('external_friend_list')
  if(error){box.innerHTML='<p class="muted">Não foi possível carregar os acessos externos.</p>';throw error}
  externalFriendAccesses=Array.isArray(data)?data:[]
  box.innerHTML=externalFriendAccesses.map(x=>`<article class="external-friend-card ${x.active?'':'revoked'}"><div class="external-friend-avatar">🌷</div><div class="external-friend-info"><strong>${esc(x.name)}</strong><small>${x.active?'Link ativo':'Link revogado'}${x.lastUsedAt?' • usado recentemente':''}</small></div><div class="external-friend-actions">${x.active?`<button type="button" class="mini-action" data-ext-copy="${x.memberId}">Copiar link</button>`:''}<button type="button" class="mini-action" data-ext-new="${x.memberId}">${x.active?'Novo link':'Reativar'}</button>${x.active?`<button type="button" class="mini-action warn" data-ext-revoke="${x.memberId}">Revogar</button>`:''}</div></article>`).join('')||'<p class="muted">Nenhum acesso externo criado.</p>'
  document.querySelectorAll('[data-ext-copy]').forEach(b=>b.onclick=()=>{const x=externalFriendAccesses.find(v=>v.memberId===b.dataset.extCopy);if(x?.token)copyExternalFriendLink(x.token)})
  document.querySelectorAll('[data-ext-new]').forEach(b=>b.onclick=()=>regenerateExternalFriend(b.dataset.extNew))
  document.querySelectorAll('[data-ext-revoke]').forEach(b=>b.onclick=()=>revokeExternalFriend(b.dataset.extRevoke))
}
async function createExternalFriendAccess(){
  const input=$('externalFriendName'),name=input?.value.trim();if(!name)return toast('Digite o nome da amiga.')
  const btn=$('createExternalFriendBtn');btn.disabled=true
  try{const {data,error}=await supabase.rpc('external_friend_create',{p_name:name});if(error)throw error;input.value='';await Promise.all([loadFamily(),loadConversations(),loadExternalFriendAccesses()]);if(data?.token)await copyExternalFriendLink(data.token);toast(`Acesso de ${name} criado 💜`)}
  catch(e){toast(e.message||'Não foi possível criar o acesso.')}finally{btn.disabled=false}
}
async function regenerateExternalFriend(memberId){
  const x=externalFriendAccesses.find(v=>v.memberId===memberId);if(!x)return
  if(x.active&&!confirm(`Gerar um novo link para ${x.name}? O link atual deixará de funcionar.`))return
  try{const {data,error}=await supabase.rpc('external_friend_regenerate',{p_member_id:memberId});if(error)throw error;await Promise.all([loadFamily(),loadConversations(),loadExternalFriendAccesses()]);if(data?.token)await copyExternalFriendLink(data.token);toast(`Novo link de ${x.name} pronto`)}catch(e){toast(e.message||'Não foi possível gerar outro link.')}
}
async function revokeExternalFriend(memberId){
  const x=externalFriendAccesses.find(v=>v.memberId===memberId);if(!x||!confirm(`Revogar o acesso de ${x.name}? O link deixará de funcionar imediatamente.`))return
  try{const {error}=await supabase.rpc('external_friend_revoke',{p_member_id:memberId});if(error)throw error;await Promise.all([loadFamily(),loadConversations(),loadExternalFriendAccesses()]);toast(`Acesso de ${x.name} revogado`)}catch(e){toast(e.message||'Não foi possível revogar.')}
}

'''
    s=s[:pos]+functions+s[pos:]

old="me=member;document.title='Cantinho da Isa 💕';showView('mainView');$('myName').textContent=me.display_name;$('myRole').textContent=friendlyRoleLabel(me.role);$('parentsNav').classList.toggle('hidden',!isParent());$('supervisionNav')?.classList.toggle('hidden',!isParent());"
new="me=member;document.title='Cantinho da Isa 💕';showView('mainView');$('myName').textContent=me.display_name;$('myRole').textContent=friendlyRoleLabel(me.role);$('parentsNav').classList.toggle('hidden',!isParent());$('supervisionNav')?.classList.toggle('hidden',!isParent());$('newGroupBtn')?.classList.toggle('hidden',me.role!=='child');"
if old not in s: raise SystemExit('boot role line not found')
s=s.replace(old,new)
boot_load="hydrateAvatarElements().catch(()=>{});upsertPresence(true).catch(()=>{});startHeartbeat();bindGlobalRealtime();renderNotifyBanner();if('Notification'in window&&Notification.permission==='granted')enablePush();renderBirthdayHero();"
boot_new="hydrateAvatarElements().catch(()=>{});upsertPresence(true).catch(()=>{});startHeartbeat();bindGlobalRealtime();renderNotifyBanner();if('Notification'in window&&Notification.permission==='granted')enablePush();renderBirthdayHero();if(isSuperAdmin())loadExternalFriendAccesses().catch(console.warn);"
if boot_load in s:s=s.replace(boot_load,boot_new)
p.write_text(s,encoding='utf-8')

# CSS
p=Path('heart-polish.css'); s=p.read_text(encoding='utf-8')
if '/* v35 external friend links */' not in s:
    s += r'''

/* v35 external friend links */
.external-friends-manager{margin:26px 0;padding:18px;border-radius:24px;background:linear-gradient(145deg,rgba(255,245,251,.96),rgba(241,235,255,.96));box-shadow:0 10px 0 rgba(197,178,218,.16),inset 2px 3px 5px #fff}
.external-friends-head h3{margin:0 0 5px}.external-friends-head p{margin:0;color:#8d7f94;font-size:.86rem}
.external-friend-create{display:grid;grid-template-columns:1fr auto;gap:9px;margin:14px 0}.external-friend-create input{border:1px solid #eadcf1;border-radius:15px;padding:11px 13px;background:#fff;outline:0}
.external-friend-safety{padding:11px 13px;border-radius:16px;background:linear-gradient(145deg,#fff4c9,#eaf8ef);font-size:.78rem;color:#796c7e;margin-bottom:12px}
.external-friends-list{display:grid;gap:9px}.external-friend-card{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:11px;padding:11px 12px;border-radius:18px;background:#fff;box-shadow:0 5px 0 rgba(198,181,213,.14)}.external-friend-card.revoked{opacity:.68}
.external-friend-avatar{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(145deg,#fff0b9,#ffdce9,#e6dcff)}.external-friend-info strong,.external-friend-info small{display:block}.external-friend-info small{color:#95859b;margin-top:2px}.external-friend-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
@media(max-width:700px){.external-friend-create{grid-template-columns:1fr}.external-friend-card{grid-template-columns:auto 1fr}.external-friend-actions{grid-column:1/-1;justify-content:flex-start}}
'''
p.write_text(s,encoding='utf-8')

# Version switch
p=Path('index.html'); s=p.read_text(encoding='utf-8')
s=s.replace('./app-v34.js?v=34','./app-v35.js?v=35')
p.write_text(s,encoding='utf-8')
