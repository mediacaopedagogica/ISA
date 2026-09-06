from pathlib import Path

# Presence + notifications for all profiles
p=Path('chunk-05.txt'); s=p.read_text(encoding='utf-8')
old="""async function upsertPresence(online){
  if(!me)return;
  const stamp=new Date().toISOString(),device=navigator.userAgent.includes('Mobile')?'Celular':'Computador';
  presenceMap[me.id]={...(presenceMap[me.id]||{}),member_id:me.id,online,last_seen_at:stamp,device_label:device};
  refreshPresenceUI();
  await supabase.from('presence_state').upsert({member_id:me.id,online,last_seen_at:stamp,device_label:device},{onConflict:'member_id'}).catch(()=>{});
}"""
new="""async function upsertPresence(online){
  if(!me)return false;
  const stamp=new Date().toISOString(),device=navigator.userAgent.includes('Mobile')?'Celular':'Computador';
  presenceMap[me.id]={...(presenceMap[me.id]||{}),member_id:me.id,online,last_seen_at:stamp,device_label:device};
  refreshPresenceUI();
  try{
    const {data,error}=await supabase.functions.invoke('presence-actions',{body:{online,deviceLabel:device}});
    if(error||data?.error){console.warn('Falha ao registrar presença',data?.error||error?.message);return false}
    const seen=data?.lastSeenAt||stamp;
    presenceMap[me.id]={...(presenceMap[me.id]||{}),member_id:me.id,online,last_seen_at:seen,device_label:device};
    refreshPresenceUI();
    return true;
  }catch(error){console.warn('Falha ao registrar presença',error);return false}
}"""
if old not in s: raise SystemExit('presence function pattern not found')
s=s.replace(old,new)
s=s.replace("function playPing(){if(!['child','super_admin','super_parent'].includes(me?.role))return;","function playPing(){if(!me)return;")
s=s.replace("function renderNotifyBanner(){const allowed=['child','super_admin','super_parent'].includes(me.role)&&('serviceWorker'in navigator)&&('PushManager'in window)&&('Notification'in window);","function renderNotifyBanner(){const allowed=!!me&&('serviceWorker'in navigator)&&('PushManager'in window)&&('Notification'in window);")
p.write_text(s,encoding='utf-8')

# Better Edge Function error messages
p=Path('chunk-02.txt'); s=p.read_text(encoding='utf-8')
old="async function chatAction(action,payload={}){const {data,error}=await supabase.functions.invoke('chat-actions',{body:{action,...payload}});if(error)throw new Error(data?.error||error.message||'Erro no chat');if(data?.error)throw new Error(data.error);return data}"
new="""async function chatAction(action,payload={}){
  const {data,error}=await supabase.functions.invoke('chat-actions',{body:{action,...payload}});
  if(error){
    let detail=data?.error||error.message||'Erro no chat';
    try{if(error.context?.clone){const body=await error.context.clone().json();detail=body?.error||detail}}catch{}
    throw new Error(detail);
  }
  if(data?.error)throw new Error(data.error);
  return data;
}"""
if old not in s: raise SystemExit('chatAction pattern not found')
p.write_text(s.replace(old,new),encoding='utf-8')

# Read receipts + hide pin while supervising
p=Path('chunk-08.txt'); s=p.read_text(encoding='utf-8')
start=s.index('function messageHtml(m){')
end=s.index('\nfunction renderTimeline(){',start)
replacement="""function messageReadReceipt(m){
  if(m.sender_id!==me.id)return '';
  const conv=conversations.find(c=>c.id===m.conversation_id)||activeConversation;
  if(!conv)return '';
  const others=(conv.conversation_members||[]).filter(x=>x.member_id!==me.id);
  if(!others.length)return '';
  const read=others.filter(x=>x.last_read_at&&new Date(x.last_read_at)>=new Date(m.sent_at));
  if(conv.type==='direct')return read.length?'<span class=\"read-receipt read\">✓✓ Leu sua mensagem</span>':'<span class=\"read-receipt\">✓ Enviada</span>';
  return read.length?`<span class=\"read-receipt read\">✓✓ Lida por ${read.length}</span>`:'<span class=\"read-receipt\">✓ Enviada</span>';
}
function messageHtml(m){
  const sender=memberById(m.sender_id),mine=m.sender_id===me.id;let content='';
  if(m.kind==='photo')content=m.media_deleted_at||!m.media_ref?'<div class=\"photo-expired\">📷 Esta foto temporária já expirou.</div>':`<div class=\"photo-loading\" data-photo-path=\"${esc(m.media_ref)}\">Carregando foto…</div>`
  else content=`<div>${esc(m.body||'')}</div>`
  const receipt=mine?messageReadReceipt(m):'';
  const canPin=!activeSupervisionMode&&isConversationMember(activeConversation);
  return `<div class=\"message-row ${mine?'mine':''}\" id=\"msg-${m.id}\"><div class=\"bubble ${mine?'own-message-clickable':''}\" ${mine?`data-own-message=\"${m.id}\" title=\"Clique para editar ou cancelar o envio\"`:''}>${!mine?`<span class=\"sender\">${esc(sender?.display_name||'Família')}</span>`:''}${content}<span class=\"meta\">${m.edited_at?'<span class=\"edit-mark\">editada • </span>':''}${fmtTime(m.sent_at)}</span>${receipt}</div>${canPin?`<button class=\"pin-btn\" data-pin=\"${m.id}\" title=\"Fixar mensagem\">📌</button>`:''}</div>`
}"""
s=s[:start]+replacement+s[end:]
p.write_text(s,encoding='utf-8')

# Re-render reads in realtime + correct hidden-page notifications
p=Path('chunk-09.txt'); s=p.read_text(encoding='utf-8')
old=".on('postgres_changes',{event:'*',schema:'public',table:'conversation_members'},()=>loadConversations())"
new=""".on('postgres_changes',{event:'*',schema:'public',table:'conversation_members'},async()=>{
    const activeId=activeConversation?.id;
    await loadConversations();
    if(activeId){activeConversation=conversations.find(c=>c.id===activeId)||activeConversation;if($('chatPanel')&&!$('chatPanel').classList.contains('hidden'))renderTimeline()}
  })"""
if old not in s: raise SystemExit('conversation_members listener pattern not found')
s=s.replace(old,new)
s=s.replace("document.visibilityState==='visible'&&Notification.permission==='granted'","document.visibilityState!=='visible'&&Notification.permission==='granted'")
boot_old="hydrateAvatarElements().catch(()=>{});upsertPresence(true).catch(()=>{});startHeartbeat();bindGlobalRealtime();renderNotifyBanner();renderBirthdayHero();"
boot_new="hydrateAvatarElements().catch(()=>{});upsertPresence(true).catch(()=>{});startHeartbeat();bindGlobalRealtime();renderNotifyBanner();if('Notification'in window&&Notification.permission==='granted')enablePush();renderBirthdayHero();"
if boot_old not in s: raise SystemExit('boot notification pattern not found')
s=s.replace(boot_old,boot_new)
p.write_text(s,encoding='utf-8')

# Force CSS refresh
p=Path('chunk-06.txt'); s=p.read_text(encoding='utf-8')
s=s.replace('app-3d.css?v=7','app-3d.css?v=33').replace('heart-polish.css?v=7','heart-polish.css?v=33')
p.write_text(s,encoding='utf-8')

# Fix clipped panels and add read receipt styling
p=Path('heart-polish.css'); s=p.read_text(encoding='utf-8')
marker='/* v33 stability fixes */'
if marker not in s:
    s += '''\n\n/* v33 stability fixes */\n.content{min-height:0!important}\n.panel-pad{overflow-y:auto!important;overflow-x:hidden!important;padding-bottom:max(72px,env(safe-area-inset-bottom))!important;scrollbar-gutter:stable}\n#supervisionPanel,#parentsPanel,#calendarPanel{overscroll-behavior:contain}\n.supervision-list,.permissions-table,.alerts-list,.calendar-day-details{padding-bottom:28px!important}\n.read-receipt{display:block;margin-top:3px;font-size:10px;text-align:right;color:#9b8ca4;font-weight:700}\n.read-receipt.read{color:#7a5fc8}\n@media(max-width:850px){.panel-pad{height:calc(100dvh - 220px)!important;padding-bottom:max(84px,env(safe-area-inset-bottom))!important}}\n'''
p.write_text(s,encoding='utf-8')

# General notification copy + v33 entry
p=Path('index.html'); s=p.read_text(encoding='utf-8')
s=s.replace('Isa, Keise e Alan podem receber alertas de novas mensagens.','Receba alertas de novas mensagens e lembretes neste aparelho.')
s=s.replace('./app-v32.js?v=32','./app-v33.js?v=33')
p.write_text(s,encoding='utf-8')
