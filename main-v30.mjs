import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js'
async function __isaCore30(){
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY, {
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
})
const $=id=>document.getElementById(id)
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const views=['loginView','setupView','mainView']
let me=null,family=[],contactPermissions=[],conversations=[],activeConversation=null,activeMessages=[],activePolls=[],presenceMap={},globalChannel=null,chatChannel=null,typingTimer=null,typingMembers=new Map(),heartbeat=null
const photoObjectUrls=[]

const EMOJIS={
  'Recentes':[],
  'Carinhas':['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😍','🥰','😘','😋','😎','🤓','🥳','🤗','🤔','🫡','😴','😢','😭','😤','😡','😱','🤯','🥹','😌'],
  'Corações':['❤️','🩷','🧡','💛','💚','🩵','💙','💜','🤎','🖤','🤍','💖','💗','💓','💞','💕','💘','💝','❣️','❤️‍🔥','❤️‍🩹','🫶'],
  'Família':['👩','👨','👧','👦','👵','👴','👶','🧒','👨‍👩‍👧','👨‍👩‍👧‍👦','🙌','👏','👋','👍','🙏','💪'],
  'Animais':['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐸','🐵','🐥','🦄','🐢','🐬','🐳','🦋','🐞'],
  'Comida':['🍎','🍓','🍉','🍇','🍌','🍍','🥭','🍒','🥕','🌽','🍕','🍔','🍟','🍿','🍪','🍩','🍰','🧁','🍫','🍬','🥤','☕'],
  'Festa':['🎉','🎊','🎈','🎂','🎁','🎀','✨','🌟','⭐','💫','🎆','🎵','🎶','🎨','🏆','⚽','🎮'],
  'Natureza':['🌞','🌝','🌙','☀️','🌤️','🌈','☁️','❄️','🔥','💧','🌊','🌸','🌷','🌹','🌻','🌼','🌿','🍀','🌳'],
  'Objetos':['📱','💻','⌨️','🖥️','📷','📸','⏰','🔔','💡','📚','✏️','📝','🎒','🧸','🪄','🔑','🏠','🚗','✈️'],
  'Símbolos':['✅','❌','⚠️','❗','❓','‼️','💯','♻️','🔒','🔓','🛡️','🔔','📌','💬','💭','➡️','⬅️','⬆️','⬇️','➕','➖']
}
const EMOJI_NAMES={'😀':'feliz sorriso','😂':'risada','😊':'feliz fofo','🥰':'amor carinho','😍':'apaixonado','😭':'chorando triste','🥳':'festa aniversario','❤️':'coracao amor','🩷':'coracao rosa','💙':'coracao azul','💜':'coracao roxo','🫶':'carinho','👵':'avo vo','👨':'pai homem','👩':'mae mulher','👧':'menina filha','🎂':'bolo aniversario','🎉':'festa parabens','🌈':'arco iris','🌷':'flor','🔔':'notificacao','📌':'fixar'}
let emojiCategory='Carinhas'

function internalEmail(username){return `${username.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'.').replace(/^\.|\.$/g,'')}@nosso-cantinho.local`}
function showView(id){views.forEach(v=>$(v).classList.toggle('hidden',v!==id))}
function setStatus(id,text,ok=false){const el=$(id);el.textContent=text;el.style.color=ok?'#3d9968':'#a15472'}
function toast(text){const t=$('toast');t.textContent=text;t.classList.remove('hidden');clearTimeout(t._tm);t._tm=setTimeout(()=>t.classList.add('hidden'),2800)}
function roleLabel(role){return ({super_admin:'Mãe • Super Admin',super_parent:'Pai • Super Pais',trusted_adult:'Adulto de confiança',text_only:'Família • texto',child:'Perfil infantil'})[role]||role}
function isParent(){return ['super_admin','super_parent'].includes(me?.role)}
function isSuperAdmin(){return me?.role==='super_admin'}
function fmtTime(ts){return new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit'}).format(new Date(ts))}
function fmtDate(ts){return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(ts))}
function memberById(id){return family.find(x=>x.id===id)}
function isOnline(memberId){const p=presenceMap[memberId];return !!(p?.online && Date.now()-new Date(p.last_seen_at).getTime()<95000)}
function cpFor(childId,adultId){return contactPermissions.find(x=>x.child_id===childId&&x.adult_id===adultId&&x.active)}
function relationFor(other){
  if(!other)return 'Família'
  if(me?.role==='child'){
    const r=(other.relationship_label||'').toLowerCase()
    const map={'mãe':'Sua mãe','mae':'Sua mãe','pai':'Seu pai','avó':'Sua avó','avo':'Sua avó','vó':'Sua avó','vo':'Sua avó','avô':'Seu avô','tia':'Sua tia','tio':'Seu tio','prima':'Sua prima','primo':'Seu primo'}
    return map[r]||other.relationship_label||other.display_name
  }
  if(other.role==='child')return other.display_name
  return other.relationship_label||other.display_name
}
function directOther(conv){const ids=(conv.conversation_members||[]).map(x=>x.member_id);if(ids.includes(me?.id))return memberById(ids.find(id=>id!==me.id));const adults=ids.map(memberById).filter(Boolean);return adults.find(x=>x.role!=='child')||adults[0]}
function convTitle(conv){if(conv.type==='group')return conv.title||'Grupo';const other=directOther(conv);if((conv.conversation_members||[]).some(x=>x.member_id===me?.id))return other?.display_name||conv.title||'Conversa';return conv.title||'Conversa supervisionada'}
function convSubtitle(conv){if(conv.type==='group')return `${(conv.conversation_members||[]).length} familiares`;const other=directOther(conv);return relationFor(other)}
function openDialog(html){$('dialogContent').innerHTML=html;$('simpleDialog').showModal()}
function closeDialog(){$('simpleDialog').close()}

async function login(){
  const username=$('loginUsername').value.trim(),password=$('loginPassword').value
  if(!username||!password)return setStatus('loginMsg','Digite login e senha.')
  setStatus('loginMsg','Entrando...')
  const {error}=await supabase.auth.signInWithPassword({email:internalEmail(username),password})
  if(error)return setStatus('loginMsg','Não foi possível entrar. Confira login e senha.')
  await boot()
}

async function boot(){
  const {data:{user}}=await supabase.auth.getUser();if(!user){showView('loginView');return}
  const {data:member,error}=await supabase.from('family_members').select('*').eq('auth_user_id',user.id).eq('active',true).single()
  if(error||!member){await supabase.auth.signOut();showView('loginView');return setStatus('loginMsg','Perfil familiar não encontrado.')}
  me=member;showView('mainView');$('myName').textContent=me.display_name;$('myRole').textContent=roleLabel(me.role);$('parentsNav').classList.toggle('hidden',!isParent())
  await supabase.realtime.setAuth().catch(()=>{})
  await Promise.all([loadFamily(),loadConversations(),loadCalendar(),loadAlerts()])
  await upsertPresence(true);startHeartbeat();bindGlobalRealtime();renderNotifyBanner();renderBirthdayHero();switchTab('chats')
  const wanted=new URLSearchParams(location.search).get('conversation');if(wanted&&conversations.some(c=>c.id===wanted))openChat(wanted)
}

async function loadFamily(){
  const {data}=await supabase.from('family_members').select('*').order('display_name');family=(data||[]).filter(x=>isParent()||x.active)
  const {data:cps}=await supabase.from('contact_permissions').select('*');contactPermissions=cps||[]
  const ids=family.map(x=>x.id);const {data:presence}=ids.length?await supabase.from('presence_state').select('*').in('member_id',ids):{data:[]};presenceMap=Object.fromEntries((presence||[]).map(p=>[p.member_id,p]))
  $('familyGrid').innerHTML=family.map(m=>`<article class="family-card"><div class="avatar pastel-avatar">${m.role==='child'?'🌈':m.relationship_label==='Avó'?'👵':'🙂'}</div><h3>${esc(m.display_name)}</h3><p>${esc(m.relationship_label||'Família')}</p><small><i class="presence-dot ${isOnline(m.id)?'online':''}"></i>${isOnline(m.id)?'Online':'Offline'}${m.active?'':' • acesso pausado'}</small></article>`).join('')
  $('memberCount').textContent=family.filter(x=>x.active).length;$('onlineCount').textContent=family.filter(x=>isOnline(x.id)).length;renderAdminMembers();renderBirthdays()
}

async function loadConversations(){
  const {data,error}=await supabase.from('conversations').select('id,type,title,created_by,pinned_message_id,created_at,updated_at,conversation_members(member_id,last_read_at,joined_at)').order('updated_at',{ascending:false})
  if(error){console.error(error);return}
  conversations=data||[]
  const ids=conversations.map(c=>c.id),latestMap={}
  if(ids.length){const {data:recent}=await supabase.from('messages').select('id,conversation_id,sender_id,body,kind,sent_at').in('conversation_id',ids).is('deleted_at',null).order('sent_at',{ascending:false}).limit(500);for(const m of recent||[])if(!latestMap[m.conversation_id])latestMap[m.conversation_id]=m}
  const supervisorUnread={}
  if(isParent()){const {data:alerts}=await supabase.from('parental_alerts').select('conversation_id').eq('target_member_id',me.id).is('read_at',null);for(const a of alerts||[])if(a.conversation_id)supervisorUnread[a.conversation_id]=true}
  for(const c of conversations){
    const mine=(c.conversation_members||[]).find(x=>x.member_id===me.id),latest=latestMap[c.id]
    c._latest=latest;c._unread=!!(mine&&latest&&latest.sender_id!==me.id&&(!mine.last_read_at||new Date(latest.sent_at)>new Date(mine.last_read_at)))||!!supervisorUnread[c.id]
  }
  renderChatList()
}

function renderChatList(){
  $('chatList').innerHTML=conversations.map(c=>{const title=convTitle(c),sub=convSubtitle(c),preview=c._latest?(c._latest.kind==='photo'?'📷 Foto':c._latest.body||'Nova mensagem'):sub;return `<button class="chat-item ${activeConversation?.id===c.id?'active':''}" data-conv="${c.id}"><div class="avatar pastel-avatar">${c.type==='group'?'👨‍👩‍👧':'💬'}</div><div class="grow"><strong>${esc(title)} ${c._unread?'<span class="unread-star">★</span>':''}</strong><small>${esc(preview)}</small></div></button>`}).join('')||'<p class="muted" style="padding:12px">Nenhuma conversa ainda.</p>'
  document.querySelectorAll('[data-conv]').forEach(b=>b.addEventListener('click',()=>openChat(b.dataset.conv)))
}

async function openChat(id){
  activeConversation=conversations.find(c=>c.id===id);if(!activeConversation)return
  document.querySelectorAll('[data-conv]').forEach(x=>x.classList.toggle('active',x.dataset.conv===id));hidePanels();$('emptyState').classList.add('hidden');$('chatPanel').classList.remove('hidden')
  $('chatTitle').textContent=convTitle(activeConversation);$('chatSubtitle').textContent=convSubtitle(activeConversation);$('chatAvatar').textContent=activeConversation.type==='group'?'👨‍👩‍👧':'💬'
  const isGroup=activeConversation.type==='group';$('groupPlusBtn').classList.toggle('hidden',!isGroup);$('photoBtn').classList.toggle('hidden',isGroup||!canSendPhoto(activeConversation));$('messageInput').disabled=false
  await markRead(id);await Promise.all([loadMessages(id),loadPolls(id)]);renderTimeline();subscribeChat(id);await loadConversations()
}

function canSendPhoto(conv){
  if(!me?.can_send_photo)return false
  const ids=(conv.conversation_members||[]).map(x=>x.member_id),child=ids.map(memberById).find(x=>x?.role==='child');if(!child)return true
  if(me.role==='child')return !ids.map(memberById).filter(x=>x&&x.id!==me.id&&x.role!=='child').some(a=>!cpFor(me.id,a.id)?.allow_photo)
  return !!cpFor(child.id,me.id)?.allow_photo
}

async function loadMessages(id){
  photoObjectUrls.splice(0).forEach(u=>URL.revokeObjectURL(u));const {data,error}=await supabase.from('messages').select('*').eq('conversation_id',id).is('deleted_at',null).order('sent_at',{ascending:true}).limit(600);if(error){console.error(error);return}activeMessages=data||[]
}
async function loadPolls(id){const {data,error}=await supabase.from('polls').select('id,conversation_id,created_by,question,multiple_choice,created_at,closes_at,poll_options(id,label,sort_order),poll_votes(option_id,member_id)').eq('conversation_id',id).order('created_at');activePolls=error?[]:data||[]}

function renderTimeline(){
  const items=[...activeMessages.map(x=>({...x,_type:'message',_time:x.sent_at})),...activePolls.map(x=>({...x,_type:'poll',_time:x.created_at}))].sort((a,b)=>new Date(a._time)-new Date(b._time))
  $('messages').innerHTML=items.map(item=>item._type==='poll'?pollHtml(item):messageHtml(item)).join('')||'<div class="empty-state" style="height:auto;padding:50px 10px"><div class="big-emoji" style="font-size:45px">💌</div><p>Comece a conversa.</p></div>'
  document.querySelectorAll('[data-pin]').forEach(b=>b.addEventListener('click',()=>pinMessage(b.dataset.pin)))
  document.querySelectorAll('[data-vote]').forEach(b=>b.addEventListener('click',()=>votePoll(b.dataset.poll,b.dataset.vote)))
  hydratePhotos();renderPinnedBar();requestAnimationFrame(()=>$('messages').scrollTop=$('messages').scrollHeight)
}
function  messageHtml(m){const sender=memberById(m.sender_id),mine=m.sender_id===me.id;let content='';if(m.kind==='photo'){content=m.media_deleted_at||!m.media_ref?'<div class="photo-expired">📷 Esta foto temporária já expirou.</div>':`<div class="photo-loading" data-photo-path="${esc(m.media_ref)}">Carregando foto…</div>`}else content=`<div>${esc(m.body||'')}</div>`;return `<div class="message-row ${mine?'mine':''}" id="msg-${m.id}"><div class="bubble">${!mine?`<span class="sender">${esc(sender?.display_name||'Família')}</span>`:''}${content}<span class="meta">${fmtTime(m.sent_at)}</span></div><button class="pin-btn" data-pin="${m.id}" title="Fixar mensagem">📌</button></div>`}
function pollHtml(p){const votes=p.poll_votes||[],opts=[...(p.poll_options||[])].sort((a,b)=>a.sort_order-b.sort_order);return `<div class="poll-card" id="poll-${p.id}"><h4>📊 ${esc(p.question)}</h4>${opts.map(o=>{const count=votes.filter(v=>v.option_id===o.id).length,voted=votes.some(v=>v.option_id===o.id&&v.member_id===me.id);return `<button class="poll-option ${voted?'voted':''}" data-poll="${p.id}" data-vote="${o.id}"><span>${esc(o.label)}</span><strong>${count}</strong></button>`}).join('')}<small class="muted">${p.multiple_choice?'Pode marcar mais de uma opção':'Escolha uma opção'}</small></div>`}
async function hydratePhotos(){for(const el of document.querySelectorAll('[data-photo-path]')){const path=el.dataset.photoPath;try{const {data,error}=await supabase.storage.from('chat-temp').download(path);if(error)throw error;const url=URL.createObjectURL(data);photoObjectUrls.push(url);el.outerHTML=`<img class="chat-photo" src="${url}" alt="Foto enviada no chat">`}catch{el.outerHTML='<div class="photo-expired">📷 Foto indisponível ou expirada.</div>'}}}
function renderPinnedBar(){const id=activeConversation?.pinned_message_id,m=activeMessages.find(x=>x.id===id);if(!m){$('pinnedBar').classList.add('hidden');return}$('pinnedBar').innerHTML=`📌 <strong>Mensagem fixada:</strong> ${esc(m.kind==='photo'?'Foto':(m.body||'').slice(0,120))}`;$('pinnedBar').classList.remove('hidden');$('pinnedBar').onclick=()=>document.getElementById(`msg-${m.id}`)?.scrollIntoView({behavior:'smooth',block:'center'})}

async function sendMessage(){const body=$('messageInput').value.trim();if(!body||!activeConversation)return;const input=$('messageInput');input.value='';sendTyping(false);const {error}=await supabase.from('messages').insert({conversation_id:activeConversation.id,sender_id:me.id,kind:'text',body});if(error){toast('Não foi possível enviar.');input.value=body;return}await Promise.all([loadMessages(activeConversation.id),loadConversations()]);renderTimeline()}
async function sendPhoto(file){if(!activeConversation||!file)return;if(!canSendPhoto(activeConversation))return toast('Fotos não estão liberadas nesta conversa.');if(file.size>8*1024*1024)return toast('Use uma foto de até 8 MB.');const ext=(file.name.split('.').pop()||'jpg').replace(/[^a-z0-9]/gi,'').toLowerCase();const path=`${me.family_id}/${activeConversation.id}/${me.id}/${crypto.randomUUID()}.${ext}`;toast('Enviando foto…');const {error:upErr}=await supabase.storage.from('chat-temp').upload(path,file,{contentType:file.type,upsert:false});if(upErr)return toast('Não foi possível enviar a foto.');const expires=new Date(Date.now()+7*86400000).toISOString();const {error}=await supabase.from('messages').insert({conversation_id:activeConversation.id,sender_id:me.id,kind:'photo',media_provider:'supabase-storage',media_ref:path,media_mime:file.type,media_expires_at:expires});if(error){await supabase.storage.from('chat-temp').remove([path]);return toast('Não foi possível publicar a foto.')}await Promise.all([loadMessages(activeConversation.id),loadConversations()]);renderTimeline();toast('Foto enviada 💕')}

function subscribeChat(id){
  if(chatChannel)supabase.removeChannel(chatChannel);typingMembers.clear();renderTyping();chatChannel=supabase.channel(`conv:${id}`,{config:{private:true,broadcast:{ack:false}}}).on('broadcast',{event:'typing'},({payload})=>{if(!payload?.memberId||payload.memberId===me.id)return;if(payload.typing)typingMembers.set(payload.memberId,Date.now());else typingMembers.delete(payload.memberId);renderTyping()}).subscribe()
}
function sendTyping(typing=true){if(!chatChannel||!activeConversation)return;chatChannel.send({type:'broadcast',event:'typing',payload:{memberId:me.id,typing}}).catch(()=>{});if(typing){clearTimeout(typingTimer);typingTimer=setTimeout(()=>sendTyping(false),1300)}}
function renderTyping(){const now=Date.now();for(const [id,t] of typingMembers)if(now-t>2500)typingMembers.delete(id);const ids=[...typingMembers.keys()];if(!ids.length){$('typingLine').textContent='';return}if(activeConversation?.type==='direct'){const other=memberById(ids[0]);$('typingLine').innerHTML=`<span class="typing-dots">${esc(relationFor(other))} está digitando</span>`;return}const names=ids.map(id=>memberById(id)?.display_name).filter(Boolean);const txt=names.length===1?`${names[0]} está digitando`:names.length===2?`${names[0]} e ${names[1]} estão digitando`:`${names[0]} e outras pessoas estão digitando`;$('typingLine').innerHTML=`<span class="typing-dots">${esc(txt)}</span>`}

async function chatAction(action,payload={}){const {data,error}=await supabase.functions.invoke('chat-actions',{body:{action,...payload}});if(error)throw new Error(data?.error||error.message||'Erro no chat');if(data?.error)throw new Error(data.error);return data}
async function markRead(conversationId){try{await chatAction('mark_read',{conversationId});if(isParent())await supabase.from('parental_alerts').update({read_at:new Date().toISOString()}).eq('target_member_id',me.id).eq('conversation_id',conversationId).is('read_at',null)}catch{} }
async function pinMessage(messageId){try{const r=await chatAction('pin_message',{conversationId:activeConversation.id,messageId});activeConversation.pinned_message_id=r.pinnedMessageId||null;renderPinnedBar();toast(r.pinnedMessageId?'Mensagem fixada 📌':'Destaque removido')}catch(e){toast(e.message)}}
async function votePoll(pollId,optionId){try{await chatAction('vote_poll',{pollId,optionId});await loadPolls(activeConversation.id);renderTimeline()}catch(e){toast(e.message)}}

function openNewGroup(){
  let candidates=family.filter(x=>x.active&&x.id!==me.id);if(me.role==='child')candidates=candidates.filter(x=>cpFor(me.id,x.id)?.allow_text);else{const child=family.find(x=>x.role==='child');candidates=candidates.filter(x=>x.role!=='child'||cpFor(x.id,me.id)?.allow_text)}
  openDialog(`<h3>Novo grupo 👨‍👩‍👧</h3><label>Nome do grupo</label><input id="groupName" placeholder="Ex.: Aniversário da Vó"><p class="muted">Marque quem vai participar.</p><div class="check-list">${candidates.map(m=>`<label class="check-line"><input type="checkbox" data-group-member="${m.id}"> ${esc(m.display_name)} • ${esc(m.relationship_label||'Família')}</label>`).join('')}</div><button type="button" id="createGroupBtn" class="primary-btn">Criar grupo</button><p id="dialogMsg" class="status-text"></p>`)
  $('createGroupBtn').addEventListener('click',async()=>{const title=$('groupName').value.trim(),memberIds=[...document.querySelectorAll('[data-group-member]:checked')].map(x=>x.dataset.groupMember);if(title.length<2||!memberIds.length)return setStatus('dialogMsg','Dê um nome e escolha pelo menos uma pessoa.');try{$('createGroupBtn').disabled=true;const r=await chatAction('create_group',{title,memberIds});closeDialog();await loadConversations();await openChat(r.conversationId)}catch(e){setStatus('dialogMsg',e.message)}finally{$('createGroupBtn').disabled=false}})
}
function openPollDialog(){
  openDialog(`<h3>Nova enquete 📊</h3><label>Pergunta</label><input id="pollQuestion" placeholder="Ex.: Qual horário é melhor?"><label class="check-line"><input id="pollMultiple" type="checkbox"> Permitir mais de uma resposta</label><div id="pollOptions"><div class="option-row"><input class="poll-opt" placeholder="Opção 1"></div><div class="option-row"><input class="poll-opt" placeholder="Opção 2"></div></div><button type="button" id="addPollOption" class="soft-btn">＋ Opção</button><button type="button" id="createPollBtn" class="primary-btn">Criar enquete</button><p id="dialogMsg" class="status-text"></p>`)
  $('addPollOption').addEventListener('click',()=>{if(document.querySelectorAll('.poll-opt').length>=8)return;const d=document.createElement('div');d.className='option-row';d.innerHTML=`<input class="poll-opt" placeholder="Opção ${document.querySelectorAll('.poll-opt').length+1}"><button type="button" class="icon-btn">✕</button>`;d.querySelector('button').onclick=()=>d.remove();$('pollOptions').appendChild(d)})
  $('createPollBtn').addEventListener('click',async()=>{const question=$('pollQuestion').value.trim(),options=[...document.querySelectorAll('.poll-opt')].map(x=>x.value.trim()).filter(Boolean);if(question.length<3||options.length<2)return setStatus('dialogMsg','Informe a pergunta e pelo menos duas opções.');try{$('createPollBtn').disabled=true;await chatAction('create_poll',{conversationId:activeConversation.id,question,options,multipleChoice:$('pollMultiple').checked});closeDialog();await loadPolls(activeConversation.id);renderTimeline()}catch(e){setStatus('dialogMsg',e.message)}finally{$('createPollBtn').disabled=false}})
}

async function loadCalendar(){const {data}=await supabase.from('family_calendar').select('*').order('starts_at',{ascending:true});$('calendarList').innerHTML=(data||[]).map(e=>`<article class="calendar-item"><strong>${esc(e.title)}</strong><p>${esc(e.description||'')}</p><small>${fmtDate(e.starts_at)}${e.all_day?' • dia inteiro':''}</small></article>`).join('')||'<p class="muted">Nenhum evento cadastrado.</p>';renderBirthdays()}
function birthdayInfo(m){if(!m.birth_month||!m.birth_day)return null;const now=new Date(),y=now.getFullYear();let d=new Date(y,m.birth_month-1,m.birth_day);const today=new Date(y,now.getMonth(),now.getDate());if(d<today)d=new Date(y+1,m.birth_month-1,m.birth_day);return {date:d,days:Math.round((d-today)/86400000)}}
function renderBirthdays(){const list=family.map(m=>({m,b:birthdayInfo(m)})).filter(x=>x.b).sort((a,b)=>a.b.days-b.b.days);$('birthdayStrip').innerHTML=list.map(({m,b})=>`<article class="birthday-pill ${b.days===0?'today':''}"><strong>${b.days===0?'🎂 Hoje!':'🎈 '+String(m.birth_day).padStart(2,'0')+'/'+String(m.birth_month).padStart(2,'0')}</strong><div>${esc(m.display_name)} • ${esc(m.relationship_label||'Família')}</div><small>${b.days===0?'Mande uma mensagem especial 💕':b.days===1?'Amanhã':`Em ${b.days} dias`}</small></article>`).join('')}
function renderBirthdayHero(){if(me?.role!=='child')return $('birthdayHero').classList.add('hidden');const next=family.filter(m=>m.id!==me.id).map(m=>({m,b:birthdayInfo(m)})).filter(x=>x.b&&x.b.days<=7).sort((a,b)=>a.b.days-b.b.days)[0];if(!next)return $('birthdayHero').classList.add('hidden');const rel=relationFor(next.m).toLowerCase(),today=next.b.days===0;const title=today?`🎂 Hoje é aniversário ${rel.replace(/^sua|^seu/i,'d')}!`:`🎀 O aniversário ${rel.replace(/^sua|^seu/i,'d')} está chegando!`;const text=today?`Mande feliz aniversário e uma mensagem muito especial para ${next.m.display_name}.`:`Faltam ${next.b.days} dia${next.b.days===1?'':'s'} para o aniversário de ${next.m.display_name}.`;$('birthdayHero').innerHTML=`<div class="birthday-hero-icon">${today?'🎂':'🎀'}</div><div><h3>${esc(title)}</h3><p>${esc(text)}</p></div><button class="birthday-message-btn" data-bday-member="${next.m.id}">💖 Mandar mensagem especial</button>`;$('birthdayHero').classList.remove('hidden');document.querySelector('[data-bday-member]').onclick=()=>openBirthdayChat(next.m)}
async function openBirthdayChat(member){const conv=conversations.find(c=>c.type==='direct'&&(c.conversation_members||[]).some(x=>x.member_id===me.id)&&(c.conversation_members||[]).some(x=>x.member_id===member.id));if(!conv)return toast('Conversa não encontrada.');await openChat(conv.id);$('messageInput').value=`Feliz aniversário, ${member.display_name}! 🎂💖 `;$('messageInput').focus()}
function openEventDialog(){if(!isParent())return toast('Somente os responsáveis criam eventos nesta versão.');openDialog(`<h3>Novo evento 📅</h3><label>Título</label><input id="eventTitle" placeholder="Ex.: Almoço em família"><label>Descrição</label><textarea id="eventDesc" rows="3"></textarea><div class="dialog-grid"><label>Data<input id="eventDate" type="date"></label><label>Hora<input id="eventTime" type="time" value="12:00"></label></div><label class="check-line"><input id="eventAllDay" type="checkbox"> Dia inteiro</label><button type="button" id="saveEventBtn" class="primary-btn">Salvar evento</button><p id="dialogMsg" class="status-text"></p>`);$('saveEventBtn').onclick=async()=>{const title=$('eventTitle').value.trim(),date=$('eventDate').value,time=$('eventTime').value||'12:00';if(!title||!date)return setStatus('dialogMsg','Informe título e data.');try{$('saveEventBtn').disabled=true;await chatAction('create_event',{title,description:$('eventDesc').value.trim(),startsAt:new Date(`${date}T${time}:00`).toISOString(),allDay:$('eventAllDay').checked});closeDialog();await loadCalendar()}catch(e){setStatus('dialogMsg',e.message)}finally{$('saveEventBtn').disabled=false}}}

async function loadAlerts(){if(!isParent()){return}const {data}=await supabase.from('parental_alerts').select('*').eq('target_member_id',me.id).order('created_at',{ascending:false}).limit(30);const alerts=data||[];$('alertCount').textContent=alerts.filter(x=>!x.read_at).length;$('alertsList').innerHTML=alerts.map(a=>`<article class="alert-item"><strong>🔔 ${esc(a.title)}</strong><p>${esc(a.body||'')}</p><small>${fmtDate(a.created_at)} • ${fmtTime(a.created_at)}</small></article>`).join('')||'<p class="muted">Nenhum alerta.</p>'}
function renderAdminMembers(){if(!isParent())return;$('permissionsTable').innerHTML=family.map(m=>`<article class="member-admin-card"><div><strong>${esc(m.display_name)}</strong><small style="display:block;color:var(--muted)">${esc(m.relationship_label||'Família')} • ${roleLabel(m.role)}${m.active?'':' • pausado'}</small></div><div class="member-actions">${m.role!=='child'?`<button class="mini-action" data-perm="${m.id}">Permissões</button>`:''}${isSuperAdmin()&&m.id!==me.id?`<button class="mini-action" data-password="${m.id}">Senha</button><button class="mini-action warn" data-active="${m.id}" data-next="${m.active?'0':'1'}">${m.active?'Pausar':'Ativar'}</button>`:''}</div></article>`).join('');document.querySelectorAll('[data-perm]').forEach(b=>b.onclick=()=>openPermissionDialog(b.dataset.perm));document.querySelectorAll('[data-password]').forEach(b=>b.onclick=()=>openPasswordDialog(b.dataset.password));document.querySelectorAll('[data-active]').forEach(b=>b.onclick=()=>toggleMemberActive(b.dataset.active,b.dataset.next==='1'))}
async function adminAction(action,payload={}){const {data,error}=await supabase.functions.invoke('family-admin',{body:{action,...payload}});if(error)throw new Error(data?.error||error.message);if(data?.error)throw new Error(data.error);return data}
function openPermissionDialog(id){const m=memberById(id),child=family.find(x=>x.role==='child'),cp=child&&m.role!=='child'?cpFor(child.id,m.id):null;openDialog(`<h3>Permissões • ${esc(m.display_name)}</h3><p class="muted">Texto e emojis continuam disponíveis. Você pode liberar fotos e o contato com Isa.</p>${m.role!=='child'?`<label class="check-line"><input id="permIsa" type="checkbox" ${cp?'checked':''}> Pode conversar com Isa</label>`:''}<label class="check-line"><input id="permPhoto" type="checkbox" ${m.can_send_photo?'checked':''}> Pode enviar fotos</label><label class="check-line"><input id="permPoll" type="checkbox" ${m.can_create_poll?'checked':''}> Pode criar enquetes</label><label class="check-line"><input id="permCalendar" type="checkbox" ${m.can_manage_calendar?'checked':''}> Pode gerenciar calendário</label><button type="button" id="savePermBtn" class="primary-btn">Salvar</button><p id="dialogMsg" class="status-text"></p>`);$('savePermBtn').onclick=async()=>{try{await adminAction('set_permissions',{memberId:id,permissions:{text:true,photo:$('permPhoto').checked,poll:$('permPoll').checked,calendar:$('permCalendar').checked,audio:false,sticker:false,voice:false,video:false,status:false},allowChild:m.role==='child'?undefined:$('permIsa').checked});closeDialog();await Promise.all([loadFamily(),loadConversations()]);toast('Permissões atualizadas')}catch(e){setStatus('dialogMsg',e.message)}}}
function openPasswordDialog(id){const m=memberById(id);openDialog(`<h3>Nova senha • ${esc(m.display_name)}</h3><label>Nova senha</label><input id="newPass" type="password" autocomplete="new-password"><button type="button" id="savePassBtn" class="primary-btn">Redefinir senha</button><p id="dialogMsg" class="status-text"></p>`);$('savePassBtn').onclick=async()=>{const p=$('newPass').value;if(p.length<8)return setStatus('dialogMsg','Use pelo menos 8 caracteres.');try{await adminAction('reset_password',{memberId:id,newPassword:p});closeDialog();toast('Senha redefinida')}catch(e){setStatus('dialogMsg',e.message)}}}
async function toggleMemberActive(id,active){if(!confirm(`${active?'Ativar':'Pausar'} este acesso?`))return;try{await adminAction('set_active',{memberId:id,active});await loadFamily()}catch(e){toast(e.message)}}
function openNewMember(){if(!isSuperAdmin())return toast('Somente Mãe/Super Admin cria novos acessos.');openDialog(`<h3>Novo familiar 🌷</h3><div class="dialog-grid"><label>Login<input id="nmUser" placeholder="Ex.: Tio Carlos"></label><label>Nome exibido<input id="nmDisplay" placeholder="Carlos"></label><label>Parentesco<input id="nmRelation" placeholder="Tio, prima..."></label><label>Tipo<select id="nmRole"><option value="text_only">Família • texto</option><option value="trusted_adult">Adulto de confiança</option></select></label><label>Dia aniversário<input id="nmDay" type="number" min="1" max="31"></label><label>Mês<input id="nmMonth" type="number" min="1" max="12"></label><label>Ano (opcional)<input id="nmYear" type="number" min="1900" max="2100"></label><label>Senha inicial<input id="nmPass" type="password"></label></div><label class="check-line"><input id="nmIsa" type="checkbox"> Pode conversar com Isa</label><label class="check-line"><input id="nmPhoto" type="checkbox"> Pode enviar fotos</label><button type="button" id="createMemberBtn" class="primary-btn">Criar acesso</button><p id="dialogMsg" class="status-text"></p>`);$('createMemberBtn').onclick=async()=>{const username=$('nmUser').value.trim(),password=$('nmPass').value;if(username.length<2||password.length<8)return setStatus('dialogMsg','Informe login e senha de pelo menos 8 caracteres.');const n=id=>$(id).value?Number($(id).value):null;try{$('createMemberBtn').disabled=true;await adminAction('create_user',{username,password,displayName:$('nmDisplay').value.trim()||username,relationshipLabel:$('nmRelation').value.trim()||'Família',role:$('nmRole').value,birthDay:n('nmDay'),birthMonth:n('nmMonth'),birthYear:n('nmYear'),allowChild:$('nmIsa').checked,permissions:{text:true,photo:$('nmPhoto').checked,poll:false,calendar:false,audio:false,sticker:false,voice:false,video:false,status:false}});closeDialog();await Promise.all([loadFamily(),loadConversations()]);toast('Novo acesso criado 💕')}catch(e){setStatus('dialogMsg',e.message)}finally{$('createMemberBtn').disabled=false}}}

async function upsertPresence(online){if(!me)return;await supabase.from('presence_state').upsert({member_id:me.id,online,last_seen_at:new Date().toISOString(),device_label:navigator.userAgent.includes('Mobile')?'Celular':'Computador'},{onConflict:'member_id'}).catch(()=>{})}
function startHeartbeat(){clearInterval(heartbeat);heartbeat=setInterval(()=>{if(document.visibilityState==='visible')upsertPresence(true)},30000);document.addEventListener('visibilitychange',()=>upsertPresence(document.visibilityState==='visible'));window.addEventListener('pagehide',()=>upsertPresence(false))}
function bindGlobalRealtime(){if(globalChannel)supabase.removeChannel(globalChannel);globalChannel=supabase.channel(`family-ui-${me.id}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},async payload=>{if(!conversations.some(c=>c.id===payload.new.conversation_id))return;await loadConversations();if(activeConversation?.id===payload.new.conversation_id){await markRead(activeConversation.id);await loadMessages(activeConversation.id);renderTimeline()}}).on('postgres_changes',{event:'*',schema:'public',table:'family_calendar'},()=>loadCalendar()).on('postgres_changes',{event:'INSERT',schema:'public',table:'parental_alerts',filter:`target_member_id=eq.${me.id}`},async payload=>{await loadAlerts();playPing();if(document.visibilityState==='visible'&&Notification.permission==='granted')new Notification(payload.new.title||'Nosso Cantinho',{body:payload.new.body||'Chegou mensagem',icon:'icon.svg'})}).subscribe()}
function playPing(){if(!['child','super_admin','super_parent'].includes(me?.role))return;try{const c=new(window.AudioContext||window.webkitAudioContext)(),o=c.createOscillator(),g=c.createGain();o.frequency.value=660;g.gain.value=.05;o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.16)}catch{}}

function renderNotifyBanner(){const allowed=['child','super_admin','super_parent'].includes(me.role)&&('serviceWorker'in navigator)&&('PushManager'in window)&&('Notification'in window);$('notifyBanner').classList.toggle('hidden',!allowed||Notification.permission==='granted')}
function urlBase64ToUint8Array(base64String){const pad='='.repeat((4-base64String.length%4)%4),base64=(base64String+pad).replace(/-/g,'+').replace(/_/g,'/'),raw=atob(base64),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out}
async function enablePush(){try{const perm=await Notification.requestPermission();if(perm!=='granted')return toast('Notificações não foram autorizadas.');const reg=await navigator.serviceWorker.ready;let sub=await reg.pushManager.getSubscription();if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY)});const j=sub.toJSON();const {error}=await supabase.from('push_devices').upsert({member_id:me.id,platform:'web',endpoint:j.endpoint,p256dh:j.keys?.p256dh,auth_key:j.keys?.auth,device_name:navigator.userAgent.includes('Mobile')?'Celular':'Computador',enabled:true,child_message_alarm:true,updated_at:new Date().toISOString()},{onConflict:'member_id,endpoint'});if(error)throw error;$('notifyBanner').classList.add('hidden');toast('Notificações ativadas 🔔')}catch(e){console.error(e);toast('Não foi possível ativar as notificações neste navegador.')}}

function recentEmojis(){try{return JSON.parse(localStorage.getItem('nc_recent_emojis')||'[]').slice(0,24)}catch{return[]}}
function rememberEmoji(e){const l=[e,...recentEmojis().filter(x=>x!==e)].slice(0,24);localStorage.setItem('nc_recent_emojis',JSON.stringify(l))}
function renderEmoji(){EMOJIS.Recentes=recentEmojis();$('emojiTabs').innerHTML=Object.keys(EMOJIS).map(c=>`<button type="button" class="emoji-tab ${c===emojiCategory?'active':''}" data-emoji-cat="${esc(c)}">${c}</button>`).join('');const q=$('emojiSearch').value.trim().toLowerCase();const all=[...new Set(Object.values(EMOJIS).flat())];const list=q?all.filter(e=>(EMOJI_NAMES[e]||'').includes(q)):EMOJIS[emojiCategory];$('emojiGrid').innerHTML=(list||[]).map(e=>`<button type="button" class="emoji-cell" data-emoji="${e}">${e}</button>`).join('')||'<p class="muted">Nenhum emoji encontrado.</p>';document.querySelectorAll('[data-emoji-cat]').forEach(b=>b.onclick=()=>{emojiCategory=b.dataset.emojiCat;$('emojiSearch').value='';renderEmoji()});document.querySelectorAll('[data-emoji]').forEach(b=>b.onclick=()=>insertEmoji(b.dataset.emoji))}
function insertEmoji(e){const i=$('messageInput'),s=i.selectionStart??i.value.length,end=i.selectionEnd??i.value.length;i.value=i.value.slice(0,s)+e+i.value.slice(end);i.selectionStart=i.selectionEnd=s+e.length;i.focus();rememberEmoji(e)}
function openEmoji(){const p=$('emojiPicker');if(!p)return;p.classList.remove('hidden');renderEmoji();$('emojiSearch')?.focus()}
function closeEmoji(){const p=$('emojiPicker');if(p)p.classList.add('hidden')}

function hidePanels(){['chatPanel','familyPanel','calendarPanel','supervisionPanel','parentsPanel'].forEach(id=>$(id)?.classList.add('hidden'))}
function switchTab(tab){document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));hidePanels();$('emptyState')?.classList.add('hidden');if(tab==='chats'){if(activeConversation)$('chatPanel')?.classList.remove('hidden');else $('emptyState')?.classList.remove('hidden')}if(tab==='family')$('familyPanel')?.classList.remove('hidden');if(tab==='calendar'){$('calendarPanel')?.classList.remove('hidden');if(typeof renderCalendarMonth==='function')renderCalendarMonth()}if(tab==='supervision'&&isParent()){$('supervisionPanel')?.classList.remove('hidden');if(typeof renderSupervisionList==='function')renderSupervisionList()}if(tab==='parents'&&isParent())$('parentsPanel')?.classList.remove('hidden')}

function buildSetup(){const defs=[['Mãe','Super Admin'],['Pai','Super Pais'],['Evalda','Avó'],['Paloma','Tia'],['Isa','Perfil infantil']];$('setupAccounts').innerHTML=defs.map(([u,r])=>`<div class="setup-person"><strong>${u} • ${r}</strong><label>Senha</label><input type="password" data-setup-user="${u}" placeholder="Defina a senha deste acesso"><small class="muted">A senha vai direto para o sistema de autenticação.</small></div>`).join('')}
async function setupFamily(){const accounts=[...document.querySelectorAll('[data-setup-user]')].map(i=>({username:i.dataset.setupUser,password:i.value}));if(accounts.some(a=>a.password.length<8))return setStatus('setupMsg','Use senha de pelo menos 8 caracteres em todos os perfis.');setStatus('setupMsg','Ativando acessos...');const {data,error}=await supabase.functions.invoke('bootstrap-family',{body:{setupCode:$('setupCode').value,accounts}});if(error||data?.error)return setStatus('setupMsg',data?.error||'Não foi possível ativar.');setStatus('setupMsg','Acessos ativados! Agora entre com seu login.',true);setTimeout(()=>showView('loginView'),900)}

async function logoutNow(){
  const btn=$('logoutBtn');if(btn){btn.disabled=true;btn.textContent='Saindo…'}
  try{if(heartbeat)clearInterval(heartbeat)}catch{}
  try{await Promise.race([upsertPresence(false),new Promise(r=>setTimeout(r,500))])}catch{}
  try{await supabase.auth.signOut()}catch(e){console.warn('Falha ao encerrar sessão no servidor',e)}
  try{const ref=new URL(CONFIG.SUPABASE_URL).hostname.split('.')[0],key=`sb-${ref}-auth-token`;localStorage.removeItem(key);sessionStorage.removeItem(key)}catch{}
  location.replace('./?sair='+Date.now())
}

$('loginBtn').onclick=login;$('loginPassword').addEventListener('keydown',e=>{if(e.key==='Enter')login()});$('togglePassword').onclick=()=>{const i=$('loginPassword'),show=i.type==='password';i.type=show?'text':'password';$('togglePassword').textContent=show?'🙈':'👁️';$('togglePassword').title=show?'Ocultar senha':'Mostrar senha';$('togglePassword').setAttribute('aria-label',show?'Ocultar senha':'Mostrar senha');i.focus()}
$('openSetupBtn').onclick=()=>showView('setupView');$('closeSetupBtn').onclick=()=>showView('loginView');$('setupFamilyBtn').onclick=setupFamily
$('logoutBtn').onclick=logoutNow
$('sendBtn').onclick=sendMessage;$('messageInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage()}});$('messageInput').addEventListener('input',()=>sendTyping(true))
$('photoBtn').onclick=()=>$('photoInput').click();$('photoInput').onchange=e=>{const f=e.target.files?.[0];if(f)sendPhoto(f);e.target.value=''}

const picker=$('emojiPicker');
if(picker&&!$('emojiCloseBtn')){const head=document.createElement('div');head.className='emoji-picker-head';head.innerHTML='<strong>Emojis</strong><button type="button" id="emojiCloseBtn" class="emoji-close-btn" aria-label="Fechar emojis">✕</button>';picker.prepend(head)}
$('emojiPicker')?.addEventListener('click',e=>e.stopPropagation());$('emojiBtn').onclick=e=>{e.stopPropagation();openEmoji()};$('emojiCloseBtn')?.addEventListener('click',e=>{e.stopPropagation();closeEmoji()});$('emojiSearch').oninput=renderEmoji
document.addEventListener('click',e=>{if(!e.target.closest('.group-plus-wrap'))$('groupPlusMenu')?.classList.add('hidden')})
$('groupPlusBtn').onclick=e=>{e.stopPropagation();$('groupPlusMenu').classList.toggle('hidden')};document.querySelectorAll('[data-group-action]').forEach(b=>b.onclick=()=>{if(b.dataset.groupAction==='poll')openPollDialog();else if(b.dataset.groupAction==='photo'){$('photoInput').click()}$('groupPlusMenu').classList.add('hidden')})
$('newGroupBtn').onclick=openNewGroup;$('newEventBtn').onclick=()=>openEventDialog(calendarSelectedDate);$('newMemberBtn').onclick=openNewMember;$('enableNotificationsBtn').onclick=enablePush
$('mobileBackBtn').onclick=()=>{activeConversation=null;$('chatPanel').classList.add('hidden');$('emptyState').classList.remove('hidden');renderChatList()}
document.querySelectorAll('.nav-btn').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab))

const profileInfo=$('myName')?.parentElement;profileInfo?.querySelectorAll('small').forEach(s=>s.classList.add('hidden'))
if(!document.querySelector('link[href^="app-3d.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='app-3d.css?v=7';document.head.appendChild(l)}
if(!document.querySelector('link[href^="heart-polish.css"]')){const h=document.createElement('link');h.rel='stylesheet';h.href='heart-polish.css?v=7';document.head.appendChild(h)}
buildSetup();if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(console.warn);const {data:{session}}=await supabase.auth.getSession();session?boot():showView('loginView')
var activeSupervisionMode=false

function conversationHasChild(conv){
  const child=family.find(x=>x.role==='child');
  return !!child&&(conv.conversation_members||[]).some(x=>x.member_id===child.id)
}
function isConversationMember(conv){return !!me&&(conv.conversation_members||[]).some(x=>x.member_id===me.id)}
function supervisedTitle(conv){
  if(conv.type==='group')return `Grupo • ${conv.title||'Família'}`
  const members=(conv.conversation_members||[]).map(x=>memberById(x.member_id)).filter(Boolean)
  const child=members.find(x=>x.role==='child')
  const other=members.find(x=>x.role!=='child')
  if(child&&other)return `${child.display_name} ↔ ${other.display_name}`
  return conv.title||'Conversa da Isa'
}
function convTitle(conv){
  if(conv.type==='group')return conv.title||'Grupo'
  const other=directOther(conv)
  if(me?.role==='child'&&other)return `${other.display_name} · ${relationFor(other)}`
  if(isConversationMember(conv))return other?.display_name||conv.title||'Conversa'
  return supervisedTitle(conv)
}
function convSubtitle(conv){
  if(conv.type==='group')return `${(conv.conversation_members||[]).length} familiares`
  const other=directOther(conv)
  if(me?.role==='child')return relationFor(other)
  if(other)return isOnline(other.id)?'Online':'Offline'
  return 'Conversa'
}

async function loadFamily(){
  const {data}=await supabase.from('family_members').select('*').order('display_name');family=(data||[]).filter(x=>isParent()||x.active)
  const {data:cps}=await supabase.from('contact_permissions').select('*');contactPermissions=cps||[]
  const ids=family.map(x=>x.id);const {data:presence}=ids.length?await supabase.from('presence_state').select('*').in('member_id',ids):{data:[]};presenceMap=Object.fromEntries((presence||[]).map(p=>[p.member_id,p]))
  if($('familyGrid'))$('familyGrid').innerHTML=''
  $('supervisionNav')?.classList.toggle('hidden',!isParent())
  $('parentsNav')?.classList.toggle('hidden',!isParent())
  $('newMemberBtn')?.classList.toggle('hidden',!isSuperAdmin())
  $('memberCount').textContent=family.filter(x=>x.active).length;$('onlineCount').textContent=family.filter(x=>isOnline(x.id)).length
  renderAdminMembers();renderBirthdays();renderChatList();renderSupervisionList()
}

async function loadConversations(){
  const {data,error}=await supabase.from('conversations').select('id,type,title,created_by,pinned_message_id,created_at,updated_at,conversation_members(member_id,last_read_at,joined_at)').order('updated_at',{ascending:false})
  if(error){console.error(error);return}
  conversations=data||[]
  const ids=conversations.map(c=>c.id),latestMap={}
  if(ids.length){const {data:recent}=await supabase.from('messages').select('id,conversation_id,sender_id,body,kind,sent_at').in('conversation_id',ids).is('deleted_at',null).order('sent_at',{ascending:false}).limit(500);for(const m of recent||[])if(!latestMap[m.conversation_id])latestMap[m.conversation_id]=m}
  const supervisorUnread={}
  if(isParent()){const {data:alerts}=await supabase.from('parental_alerts').select('conversation_id').eq('target_member_id',me.id).is('read_at',null);for(const a of alerts||[])if(a.conversation_id)supervisorUnread[a.conversation_id]=true}
  for(const c of conversations){
    const mine=(c.conversation_members||[]).find(x=>x.member_id===me.id),latest=latestMap[c.id]
    c._latest=latest;c._isMember=!!mine;c._supervisorUnread=!!supervisorUnread[c.id]
    c._unread=!!(mine&&latest&&latest.sender_id!==me.id&&(!mine.last_read_at||new Date(latest.sent_at)>new Date(mine.last_read_at)))
  }
  renderChatList();renderSupervisionList()
}

function renderChatList(){
  if(!$('chatList'))return
  const own=conversations.filter(isConversationMember)
  $('chatList').innerHTML=own.map(c=>{const title=convTitle(c),sub=convSubtitle(c),preview=c._latest?(c._latest.kind==='photo'?'📷 Foto':c._latest.body||'Nova mensagem'):sub;return `<button class="chat-item ${activeConversation?.id===c.id&&!activeSupervisionMode?'active':''}" data-conv="${c.id}"><div class="avatar pastel-avatar">${c.type==='group'?'👨‍👩‍👧':'💌'}</div><div class="grow"><strong>${esc(title)} ${c._unread?'<span class="unread-star">★</span>':''}</strong><small>${esc(preview)}</small></div></button>`}).join('')||'<p class="muted" style="padding:12px">Nenhuma conversa ainda.</p>'
  document.querySelectorAll('[data-conv]').forEach(b=>b.addEventListener('click',()=>openChat(b.dataset.conv,false)))
}

function renderSupervisionList(){
  if(!$('supervisionList'))return
  if(!isParent()){$('supervisionList').innerHTML='';return}
  const childConvs=conversations.filter(conversationHasChild)
  $('supervisionList').innerHTML=childConvs.map(c=>{const preview=c._latest?(c._latest.kind==='photo'?'📷 Foto':c._latest.body||'Nova mensagem'):'Ainda sem mensagens';return `<button class="supervision-card" data-supervise="${c.id}"><div class="supervision-avatar">👀</div><div class="grow"><strong>${esc(supervisedTitle(c))} ${c._supervisorUnread?'<span class="unread-star">★</span>':''}</strong><small>${esc(preview)}</small></div><span class="supervision-arrow">›</span></button>`}).join('')||'<div class="supervision-empty">💜<strong>Nenhuma conversa da Isa disponível.</strong><span>Quando ela conversar com um familiar autorizado, aparecerá aqui.</span></div>'
  document.querySelectorAll('[data-supervise]').forEach(b=>b.onclick=()=>openChat(b.dataset.supervise,true))
}

async function openChat(id,fromSupervision=false){
  activeConversation=conversations.find(c=>c.id===id);if(!activeConversation)return
  activeSupervisionMode=!!fromSupervision
  document.querySelectorAll('[data-conv]').forEach(x=>x.classList.toggle('active',!activeSupervisionMode&&x.dataset.conv===id))
  hidePanels();$('emptyState').classList.add('hidden');$('chatPanel').classList.remove('hidden')
  const supervision=activeSupervisionMode&&isParent()&&conversationHasChild(activeConversation)
  $('chatTitle').textContent=supervision?supervisedTitle(activeConversation):convTitle(activeConversation)
  $('chatSubtitle').textContent=supervision?'Supervisão da Isa • somente leitura':convSubtitle(activeConversation)
  $('chatAvatar').textContent=supervision?'👀':activeConversation.type==='group'?'👨‍👩‍👧':'💌'
  $('supervisionNotice')?.classList.toggle('hidden',!supervision)
  $('composer')?.classList.toggle('hidden',supervision)
  const isGroup=activeConversation.type==='group';$('groupPlusBtn').classList.toggle('hidden',supervision||!isGroup);$('photoBtn').classList.toggle('hidden',supervision||isGroup||!canSendPhoto(activeConversation));$('messageInput').disabled=supervision
  if(!supervision)await markRead(id)
  await Promise.all([loadMessages(id),loadPolls(id)]);renderTimeline();subscribeChat(id);await loadConversations()
}

function hidePanels(){['chatPanel','familyPanel','calendarPanel','supervisionPanel','parentsPanel'].forEach(id=>$(id)?.classList.add('hidden'))}
function switchTab(tab){
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));hidePanels();$('emptyState').classList.add('hidden')
  if(tab==='chats'){activeSupervisionMode=false;$('supervisionNotice')?.classList.add('hidden');if(activeConversation&&isConversationMember(activeConversation))$('chatPanel').classList.remove('hidden');else $('emptyState').classList.remove('hidden')}
  if(tab==='calendar')$('calendarPanel').classList.remove('hidden')
  if(tab==='supervision'&&isParent()){activeSupervisionMode=true;renderSupervisionList();$('supervisionPanel').classList.remove('hidden')}
  if(tab==='parents'&&isParent())$('parentsPanel').classList.remove('hidden')
}
let calendarEvents=[]
let calendarCursor=new Date(new Date().getFullYear(),new Date().getMonth(),1)
let calendarSelectedDate=new Date(new Date().getFullYear(),new Date().getMonth(),new Date().getDate())
const avatarUrlCache=new Map()

function friendlyRoleLabel(role){
  return ({super_admin:'Mãe da Isa',super_parent:'Pai da Isa',trusted_adult:'Família da Isa',text_only:'Família da Isa',child:'Cantinho da Isa'})[role]||'Família'
}
function localDayKey(ts){const d=new Date(ts);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function dayLabelLocal(ts){
  const d=new Date(ts),now=new Date();const today=new Date(now.getFullYear(),now.getMonth(),now.getDate()),day=new Date(d.getFullYear(),d.getMonth(),d.getDate());
  const diff=Math.round((today-day)/86400000);if(diff===0)return 'Hoje';if(diff===1)return 'Ontem';
  return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'long',year:'numeric'}).format(d)
}
function defaultAvatar(member){
  if(!member)return '💌';if(member.role==='child')return '🌈';const r=(member.relationship_label||'').toLowerCase();if(r.includes('avó')||r.includes('vó'))return '👵';if(r.includes('pai'))return '👨';if(r.includes('mãe')||r.includes('mae'))return '👩';if(r.includes('tia'))return '🌷';return '🙂'
}
function avatarBox(member,extra='avatar pastel-avatar'){
  return `<div class="${extra}" data-avatar-id="${member?.id||''}">${defaultAvatar(member)}</div>`
}
async function avatarUrl(member){
  if(!member?.avatar_ref)return null
  const cached=avatarUrlCache.get(member.id);if(cached?.ref===member.avatar_ref)return cached.url
  if(cached?.url)URL.revokeObjectURL(cached.url)
  const {data,error}=await supabase.storage.from('profile-avatars').download(member.avatar_ref);if(error)return null
  const url=URL.createObjectURL(data);avatarUrlCache.set(member.id,{ref:member.avatar_ref,url});return url
}
async function hydrateAvatarElements(){
  for(const el of document.querySelectorAll('[data-avatar-id]')){
    const member=memberById(el.dataset.avatarId);if(!member?.avatar_ref)continue
    const url=await avatarUrl(member);if(!url||!el.isConnected)continue
    el.innerHTML=`<img src="${url}" alt="Foto de ${esc(member.display_name)}">`
  }
  if(me){const my=memberById(me.id)||me;const el=$('myAvatar');if(el){const url=await avatarUrl(my);el.innerHTML=url?`<img src="${url}" alt="Minha foto">`:defaultAvatar(my)}}
}
async function uploadMyAvatar(file){
  if(!file||!me)return;if(file.size>5*1024*1024)return toast('Use uma foto de até 5 MB.')
  const ext=(file.name.split('.').pop()||'jpg').replace(/[^a-z0-9]/gi,'').toLowerCase();const path=`${me.family_id}/${me.id}/avatar-${crypto.randomUUID()}.${ext}`
  toast('Salvando sua foto…');const {error:upErr}=await supabase.storage.from('profile-avatars').upload(path,file,{contentType:file.type,upsert:false});if(upErr)return toast('Não foi possível salvar a foto.')
  const {data,error}=await supabase.functions.invoke('profile-actions',{body:{action:'set_avatar',avatarRef:path}});if(error||data?.error){await supabase.storage.from('profile-avatars').remove([path]);return toast(data?.error||'Não foi possível atualizar o perfil.')}
  if(data?.oldRef&&data.oldRef!==path)await supabase.storage.from('profile-avatars').remove([data.oldRef]).catch(()=>{})
  me.avatar_ref=path;const f=family.find(x=>x.id===me.id);if(f)f.avatar_ref=path;const cached=avatarUrlCache.get(me.id);if(cached?.url)URL.revokeObjectURL(cached.url);avatarUrlCache.delete(me.id)
  await hydrateAvatarElements();renderChatList();renderSupervisionList();toast('Foto de perfil atualizada 💕')
}

function renderChatList(){
  if(!$('chatList'))return
  const own=conversations.filter(isConversationMember)
  $('chatList').innerHTML=own.map(c=>{const title=convTitle(c),sub=convSubtitle(c),preview=c._latest?(c._latest.kind==='photo'?'📷 Foto':c._latest.body||'Nova mensagem'):sub;const other=c.type==='direct'?directOther(c):null;return `<button class="chat-item ${activeConversation?.id===c.id&&!activeSupervisionMode?'active':''}" data-conv="${c.id}">${c.type==='group'?'<div class="avatar pastel-avatar">👨‍👩‍👧</div>':avatarBox(other)}<div class="grow"><strong>${esc(title)} ${c._unread?'<span class="unread-star">★</span>':''}</strong><small>${esc(preview)}</small></div></button>`}).join('')||'<p class="muted" style="padding:12px">Nenhuma conversa ainda.</p>'
  document.querySelectorAll('[data-conv]').forEach(b=>b.addEventListener('click',()=>openChat(b.dataset.conv,false)));hydrateAvatarElements()
}
function renderSupervisionList(){
  if(!$('supervisionList'))return;if(!isParent()){$('supervisionList').innerHTML='';return}
  const childConvs=conversations.filter(conversationHasChild)
  $('supervisionList').innerHTML=childConvs.map(c=>{const preview=c._latest?(c._latest.kind==='photo'?'📷 Foto':c._latest.body||'Nova mensagem'):'Ainda sem mensagens';return `<button class="supervision-card" data-supervise="${c.id}"><div class="supervision-avatar">👀</div><div class="grow"><strong>${esc(supervisedTitle(c))} ${c._supervisorUnread?'<span class="unread-star">★</span>':''}</strong><small>${esc(preview)}</small></div><span class="supervision-arrow">›</span></button>`}).join('')||'<div class="supervision-empty">💜<strong>Nenhuma conversa da Isa disponível.</strong><span>Quando ela conversar com um familiar autorizado, aparecerá aqui.</span></div>'
  document.querySelectorAll('[data-supervise]').forEach(b=>b.onclick=()=>openChat(b.dataset.supervise,true))
}
async function openChat(id,fromSupervision=false){
  activeConversation=conversations.find(c=>c.id===id);if(!activeConversation)return;activeSupervisionMode=!!fromSupervision
  document.querySelectorAll('[data-conv]').forEach(x=>x.classList.toggle('active',!activeSupervisionMode&&x.dataset.conv===id));hidePanels();$('emptyState').classList.add('hidden');$('chatPanel').classList.remove('hidden')
  const supervision=activeSupervisionMode&&isParent()&&conversationHasChild(activeConversation),other=activeConversation.type==='direct'?directOther(activeConversation):null
  $('chatTitle').textContent=supervision?supervisedTitle(activeConversation):convTitle(activeConversation);$('chatSubtitle').textContent=supervision?'Supervisão da Isa • somente leitura':convSubtitle(activeConversation)
  const av=$('chatAvatar');if(supervision){av.removeAttribute('data-avatar-id');av.innerHTML='👀'}else if(activeConversation.type==='group'){av.removeAttribute('data-avatar-id');av.innerHTML='👨‍👩‍👧'}else{av.dataset.avatarId=other?.id||'';av.innerHTML=defaultAvatar(other);hydrateAvatarElements()}
  $('supervisionNotice')?.classList.toggle('hidden',!supervision);$('composer')?.classList.toggle('hidden',supervision)
  const isGroup=activeConversation.type==='group';$('groupPlusBtn').classList.toggle('hidden',supervision||!isGroup);$('photoBtn').classList.toggle('hidden',supervision||isGroup||!canSendPhoto(activeConversation));$('messageInput').disabled=supervision
  if(!supervision)await markRead(id);await Promise.all([loadMessages(id),loadPolls(id)]);renderTimeline();subscribeChat(id);await loadConversations()
}

function messageHtml(m){
  const sender=memberById(m.sender_id),mine=m.sender_id===me.id;let content='';
  if(m.kind==='photo')content=m.media_deleted_at||!m.media_ref?'<div class="photo-expired">📷 Esta foto temporária já expirou.</div>':`<div class="photo-loading" data-photo-path="${esc(m.media_ref)}">Carregando foto…</div>`
  else content=`<div>${esc(m.body||'')}</div>`
  return `<div class="message-row ${mine?'mine':''}" id="msg-${m.id}"><div class="bubble ${mine?'own-message-clickable':''}" ${mine?`data-own-message="${m.id}" title="Clique para editar ou cancelar o envio"`:''}>${!mine?`<span class="sender">${esc(sender?.display_name||'Família')}</span>`:''}${content}<span class="meta">${m.edited_at?'<span class="edit-mark">editada • </span>':''}${fmtTime(m.sent_at)}</span></div><button class="pin-btn" data-pin="${m.id}" title="Fixar mensagem">📌</button></div>`
}
function renderTimeline(){
  const items=[...activeMessages.map(x=>({...x,_type:'message',_time:x.sent_at})),...activePolls.map(x=>({...x,_type:'poll',_time:x.created_at}))].sort((a,b)=>new Date(a._time)-new Date(b._time));let lastDay='';const html=[]
  for(const item of items){const key=localDayKey(item._time);if(key!==lastDay){html.push(`<div class="date-divider"><span>${esc(dayLabelLocal(item._time))}</span></div>`);lastDay=key}html.push(item._type==='poll'?pollHtml(item):messageHtml(item))}
  $('messages').innerHTML=html.join('')||'<div class="empty-state" style="height:auto;padding:50px 10px"><div class="big-emoji" style="font-size:45px">💌</div><p>Comece a conversa.</p></div>'
  document.querySelectorAll('[data-pin]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();pinMessage(b.dataset.pin)}));document.querySelectorAll('[data-vote]').forEach(b=>b.addEventListener('click',()=>votePoll(b.dataset.poll,b.dataset.vote)));document.querySelectorAll('[data-own-message]').forEach(b=>b.addEventListener('click',()=>openOwnMessageActions(b.dataset.ownMessage)))
  hydratePhotos();renderPinnedBar();requestAnimationFrame(()=>$('messages').scrollTop=$('messages').scrollHeight)
}
function openOwnMessageActions(id){
  if(activeSupervisionMode)return;const m=activeMessages.find(x=>x.id===id&&x.sender_id===me.id);if(!m)return
  openDialog(`<h3>Mensagem 💬</h3><p class="muted">O que você deseja fazer?</p>${m.kind==='text'?'<button type="button" id="editOwnMessageBtn" class="primary-btn">✏️ Editar mensagem</button>':''}<button type="button" id="cancelOwnMessageBtn" class="soft-btn danger-soft" style="width:100%;margin-top:10px">↩️ Cancelar envio</button>`)
  if(m.kind==='text')$('editOwnMessageBtn').onclick=()=>openEditMessageDialog(m)
  $('cancelOwnMessageBtn').onclick=()=>cancelOwnMessage(m)
}
function openEditMessageDialog(m){
  openDialog(`<h3>Editar mensagem ✏️</h3><textarea id="editMessageText" rows="5" maxlength="5000">${esc(m.body||'')}</textarea><button type="button" id="saveEditedMessageBtn" class="primary-btn">Salvar alteração</button><p id="dialogMsg" class="status-text"></p>`)
  $('saveEditedMessageBtn').onclick=async()=>{const body=$('editMessageText').value.trim();if(!body)return setStatus('dialogMsg','A mensagem não pode ficar vazia.');try{await chatAction('edit_message',{messageId:m.id,body});closeDialog();await loadMessages(activeConversation.id);renderTimeline();await loadConversations();toast('Mensagem editada')}catch(e){setStatus('dialogMsg',e.message)}}
}
async function cancelOwnMessage(m){
  if(!confirm('Cancelar o envio desta mensagem para todos?'))return;try{await chatAction('cancel_message',{messageId:m.id});closeDialog();await loadMessages(activeConversation.id);renderTimeline();await loadConversations();toast('Envio cancelado')}catch(e){toast(e.message)}
}

async function loadCalendar(){
  const {data,error}=await supabase.from('family_calendar').select('*').order('starts_at',{ascending:true});calendarEvents=error?[]:data||[];renderBirthdays();renderCalendarMonth()
}
function renderBirthdays(){if($('birthdayStrip')){$('birthdayStrip').innerHTML='';$('birthdayStrip').classList.add('hidden')}}
function fillCalendarSelectors(){
  const months=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];const ms=$('calendarMonthSelect'),ys=$('calendarYearSelect');if(!ms||!ys)return
  ms.innerHTML=months.map((m,i)=>`<option value="${i}" ${i===calendarCursor.getMonth()?'selected':''}>${m}</option>`).join('');const y=calendarCursor.getFullYear();ys.innerHTML=Array.from({length:15},(_,i)=>y-7+i).map(v=>`<option value="${v}" ${v===y?'selected':''}>${v}</option>`).join('')
}
function eventLocalDay(e){const d=new Date(e.starts_at);return new Date(d.getFullYear(),d.getMonth(),d.getDate())}
function sameDay(a,b){return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate()}
function renderCalendarMonth(){
  const grid=$('calendarGrid');if(!grid)return;fillCalendarSelectors();const y=calendarCursor.getFullYear(),m=calendarCursor.getMonth(),first=new Date(y,m,1),start=new Date(y,m,1-first.getDay()),today=new Date();today.setHours(0,0,0,0);const cells=[]
  for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);const events=calendarEvents.filter(e=>sameDay(eventLocalDay(e),d));const cls=['calendar-day'];if(d.getMonth()!==m)cls.push('outside');if(sameDay(d,today))cls.push('today');if(sameDay(d,calendarSelectedDate))cls.push('selected');cells.push(`<button type="button" class="${cls.join(' ')}" data-calendar-day="${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}"><span class="calendar-day-number">${d.getDate()}</span><span class="calendar-events-mini">${events.slice(0,2).map(e=>`<span class="calendar-mini-event">${esc(e.title)}</span>`).join('')}${events.length>2?`<span class="calendar-more">+${events.length-2}</span>`:''}</span></button>`)}
  grid.innerHTML=cells.join('');document.querySelectorAll('[data-calendar-day]').forEach(b=>b.onclick=()=>{const [yy,mm,dd]=b.dataset.calendarDay.split('-').map(Number);calendarSelectedDate=new Date(yy,mm-1,dd);if(calendarSelectedDate.getMonth()!==calendarCursor.getMonth()||calendarSelectedDate.getFullYear()!==calendarCursor.getFullYear())calendarCursor=new Date(yy,mm-1,1);renderCalendarMonth()});renderSelectedCalendarDay()
}
function renderSelectedCalendarDay(){
  const box=$('calendarDayDetails');if(!box)return;const events=calendarEvents.filter(e=>sameDay(eventLocalDay(e),calendarSelectedDate));const label=new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}).format(calendarSelectedDate)
  box.innerHTML=`<div class="calendar-detail-head"><strong>${esc(label)}</strong><button class="tiny-btn" id="addEventForDayBtn">＋ Evento</button></div>${events.map(e=>`<article class="calendar-detail-card">${e.created_by===me.id?`<button class="calendar-delete-btn" data-delete-event="${e.id}">Excluir</button>`:''}<strong>${esc(e.title)}</strong><p>${esc(e.description||'')}</p><small>${e.all_day?'Dia inteiro':fmtTime(e.starts_at)} • ${e.visibility_member_ids===null?'Compartilhado com todos':e.visibility_member_ids?.length?'Compartilhado':'Só para mim'}</small></article>`).join('')||'<div class="calendar-empty-day">Nenhum evento neste dia.</div>'}`
  $('addEventForDayBtn').onclick=()=>openEventDialog(calendarSelectedDate);document.querySelectorAll('[data-delete-event]').forEach(b=>b.onclick=()=>deleteCalendarEvent(b.dataset.deleteEvent))
}
function openEventDialog(defaultDate=calendarSelectedDate){
  const date=`${defaultDate.getFullYear()}-${String(defaultDate.getMonth()+1).padStart(2,'0')}-${String(defaultDate.getDate()).padStart(2,'0')}`;const others=family.filter(x=>x.active&&x.id!==me.id)
  openDialog(`<h3>Novo evento 📅</h3><label>Título</label><input id="eventTitle" placeholder="Ex.: Dentista"><label>Descrição</label><textarea id="eventDesc" rows="3"></textarea><div class="dialog-grid"><label>Data<input id="eventDate" type="date" value="${date}"></label><label>Hora<input id="eventTime" type="time" value="12:00"></label></div><label class="check-line"><input id="eventAllDay" type="checkbox"> Dia inteiro</label><h4>Quem pode ver?</h4><div class="visibility-picker"><label class="visibility-option"><input type="radio" name="eventVisibility" value="private" checked> 🔒 Só eu</label><label class="visibility-option"><input type="radio" name="eventVisibility" value="all"> 👨‍👩‍👧 Todos da família</label><label class="visibility-option"><input type="radio" name="eventVisibility" value="selected"> 💕 Escolher pessoas</label></div><div id="eventPeople" class="check-list hidden">${others.map(x=>`<label class="check-line"><input type="checkbox" data-event-person="${x.id}"> ${esc(x.display_name)}${me.role==='child'?` • ${esc(relationFor(x))}`:''}</label>`).join('')}</div><button type="button" id="saveEventBtn" class="primary-btn">Salvar evento</button><p id="dialogMsg" class="status-text"></p>`)
  document.querySelectorAll('[name="eventVisibility"]').forEach(r=>r.onchange=()=>$('eventPeople').classList.toggle('hidden',document.querySelector('[name="eventVisibility"]:checked').value!=='selected'))
  $('saveEventBtn').onclick=async()=>{const title=$('eventTitle').value.trim(),d=$('eventDate').value,time=$('eventTime').value||'12:00';if(!title||!d)return setStatus('dialogMsg','Informe título e data.');const mode=document.querySelector('[name="eventVisibility"]:checked').value;let visibilityMemberIds=null;if(mode==='private')visibilityMemberIds=[];if(mode==='selected')visibilityMemberIds=[...document.querySelectorAll('[data-event-person]:checked')].map(x=>x.dataset.eventPerson);try{$('saveEventBtn').disabled=true;await chatAction('create_event',{title,description:$('eventDesc').value.trim(),startsAt:new Date(`${d}T${time}:00`).toISOString(),allDay:$('eventAllDay').checked,visibilityMemberIds});closeDialog();await loadCalendar();toast('Evento salvo 📅')}catch(e){setStatus('dialogMsg',e.message)}finally{$('saveEventBtn').disabled=false}}
}
async function deleteCalendarEvent(id){if(!confirm('Excluir este evento?'))return;const {error}=await supabase.from('family_calendar').delete().eq('id',id).eq('created_by',me.id);if(error)return toast('Não foi possível excluir.');await loadCalendar();toast('Evento excluído')}
function renderBirthdayHero(){
  if(!me)return;const next=family.filter(m=>m.id!==me.id).map(m=>({m,b:birthdayInfo(m)})).filter(x=>x.b&&[0,1,2,3,4,5,6,7].includes(x.b.days)).sort((a,b)=>a.b.days-b.b.days)[0];if(!next)return $('birthdayHero').classList.add('hidden');const today=next.b.days===0;let title,text
  if(me.role==='child'){const rel=relationFor(next.m).toLowerCase();title=today?`🎂 Hoje é aniversário ${rel.replace(/^sua|^seu/i,'d')}!`:`🎀 O aniversário ${rel.replace(/^sua|^seu/i,'d')} está chegando!`;text=today?'Mande feliz aniversário e uma mensagem muito especial 💕':`Faltam ${next.b.days} dia${next.b.days===1?'':'s'}.`}
  else{title=today?`🎂 Hoje é aniversário de ${next.m.display_name}!`:`🎀 Aniversário de ${next.m.display_name} chegando`;text=today?'Que tal mandar uma mensagem especial? 💕':`Faltam ${next.b.days} dia${next.b.days===1?'':'s'}.`}
  $('birthdayHero').innerHTML=`<div class="birthday-hero-icon">${today?'🎂':'🎀'}</div><div><h3>${esc(title)}</h3><p>${esc(text)}</p></div><button class="birthday-message-btn" data-bday-member="${next.m.id}">💖 Mandar mensagem</button>`;$('birthdayHero').classList.remove('hidden');document.querySelector('[data-bday-member]').onclick=()=>openBirthdayChat(next.m)
}

function openNewGroup(){
  const child=family.find(x=>x.role==='child'&&x.active);let candidates=[]
  if(me.role==='child')candidates=family.filter(x=>x.active&&x.id!==me.id&&cpFor(me.id,x.id)?.allow_text)
  else if(['trusted_adult','text_only'].includes(me.role))candidates=family.filter(x=>x.active&&x.id!==me.id&&(x.role==='child'||['trusted_adult','text_only'].includes(x.role)))
  else candidates=family.filter(x=>x.active&&x.id!==me.id)
  openDialog(`<h3>Novo grupo 💕</h3><p class="muted">Todo grupo do Cantinho da Isa inclui a Isa.</p><label>Nome do grupo</label><input id="groupName" placeholder="Ex.: Meninas da família"><div class="check-list">${candidates.map(m=>`<label class="check-line"><input type="checkbox" data-group-member="${m.id}" ${m.role==='child'&&me.role!=='child'?'checked disabled':''}> ${esc(m.display_name)}${me.role==='child'?` • ${esc(relationFor(m))}`:''}</label>`).join('')}</div><button type="button" id="createGroupBtn" class="primary-btn">Criar grupo</button><p id="dialogMsg" class="status-text"></p>`)
  $('createGroupBtn').onclick=async()=>{const title=$('groupName').value.trim(),memberIds=[...document.querySelectorAll('[data-group-member]:checked')].map(x=>x.dataset.groupMember);if(title.length<2)return setStatus('dialogMsg','Dê um nome ao grupo.');if(me.role!=='child'&&child&&!memberIds.includes(child.id))memberIds.push(child.id);try{$('createGroupBtn').disabled=true;const r=await chatAction('create_group',{title,memberIds});closeDialog();await loadConversations();await openChat(r.conversationId,false)}catch(e){setStatus('dialogMsg',e.message)}finally{$('createGroupBtn').disabled=false}}
}
function openNewMember(){
  if(!isSuperAdmin())return toast('Somente a Keise cria novos acessos.');openDialog(`<h3>Novo familiar 🌷</h3><p class="muted">O novo acesso terá conversa individual somente com a Isa. Depois você pode ajustar permissões.</p><div class="dialog-grid"><label>Login<input id="nmUser" placeholder="Ex.: Tio Carlos"></label><label>Nome exibido<input id="nmDisplay" placeholder="Carlos"></label><label>Parentesco<input id="nmRelation" placeholder="Tio, prima..."></label><label>Tipo<select id="nmRole"><option value="text_only">Família</option><option value="trusted_adult">Adulto de confiança</option></select></label><label>Dia aniversário<input id="nmDay" type="number" min="1" max="31"></label><label>Mês<input id="nmMonth" type="number" min="1" max="12"></label><label>Ano (opcional)<input id="nmYear" type="number" min="1900" max="2100"></label><label>Senha inicial<input id="nmPass" type="password"></label></div><label class="check-line"><input id="nmPhoto" type="checkbox"> Pode enviar e receber fotos com a Isa</label><button type="button" id="createMemberBtn" class="primary-btn">Criar acesso</button><p id="dialogMsg" class="status-text"></p>`)
  $('createMemberBtn').onclick=async()=>{const username=$('nmUser').value.trim(),password=$('nmPass').value;if(username.length<2||password.length<8)return setStatus('dialogMsg','Informe login e senha de pelo menos 8 caracteres.');const n=id=>$(id).value?Number($(id).value):null;try{$('createMemberBtn').disabled=true;await adminAction('create_user',{username,password,displayName:$('nmDisplay').value.trim()||username,relationshipLabel:$('nmRelation').value.trim()||'Família',role:$('nmRole').value,birthDay:n('nmDay'),birthMonth:n('nmMonth'),birthYear:n('nmYear'),permissions:{text:true,photo:$('nmPhoto').checked,poll:false,calendar:true}});closeDialog();await Promise.all([loadFamily(),loadConversations()]);toast('Novo acesso criado 💕')}catch(e){setStatus('dialogMsg',e.message)}finally{$('createMemberBtn').disabled=false}}
}

async function bindGlobalRealtime(){
  if(globalChannel)supabase.removeChannel(globalChannel);globalChannel=supabase.channel(`family-ui-${me.id}`)
  .on('postgres_changes',{event:'*',schema:'public',table:'messages'},async payload=>{await loadConversations();if(activeConversation?.id===(payload.new?.conversation_id||payload.old?.conversation_id)){await loadMessages(activeConversation.id);renderTimeline()}})
  .on('postgres_changes',{event:'*',schema:'public',table:'conversation_members'},()=>loadConversations())
  .on('postgres_changes',{event:'*',schema:'public',table:'conversations'},()=>loadConversations())
  .on('postgres_changes',{event:'*',schema:'public',table:'family_calendar'},()=>loadCalendar())
  .on('postgres_changes',{event:'UPDATE',schema:'public',table:'family_members'},async()=>{await loadFamily();await hydrateAvatarElements()})
  .on('postgres_changes',{event:'INSERT',schema:'public',table:'parental_alerts',filter:`target_member_id=eq.${me.id}`},async payload=>{await loadAlerts();playPing();if(document.visibilityState==='visible'&&Notification.permission==='granted')new Notification(payload.new.title||'Cantinho da Isa',{body:payload.new.body||'Chegou mensagem',icon:'icon.svg'})}).subscribe()
}

async function boot(){
  const {data:{user}}=await supabase.auth.getUser();if(!user){showView('loginView');return}
  const {data:member,error}=await supabase.from('family_members').select('*').eq('auth_user_id',user.id).eq('active',true).single();if(error||!member){await supabase.auth.signOut();showView('loginView');return setStatus('loginMsg','Perfil familiar não encontrado.')}
  me=member;document.title='Cantinho da Isa 💕';showView('mainView');$('myName').textContent=me.display_name;$('myRole').textContent=friendlyRoleLabel(me.role);$('parentsNav').classList.toggle('hidden',!isParent());$('supervisionNav')?.classList.toggle('hidden',!isParent());
  switchTab('chats');if($('chatList'))$('chatList').innerHTML='<p class="muted" style="padding:12px">Carregando conversas…</p>';
  supabase.realtime.setAuth().catch(()=>{});
  await Promise.all([loadFamily(),loadConversations()]);
  hydrateAvatarElements().catch(()=>{});upsertPresence(true).catch(()=>{});startHeartbeat();bindGlobalRealtime();renderNotifyBanner();renderBirthdayHero();
  Promise.allSettled([loadCalendar(),loadAlerts()]).catch(()=>{});
  const wanted=new URLSearchParams(location.search).get('conversation');if(wanted&&conversations.some(c=>c.id===wanted)&&isConversationMember(conversations.find(c=>c.id===wanted)))openChat(wanted,false)
}

if($('myAvatarBtn'))$('myAvatarBtn').onclick=()=>$('profileAvatarInput').click()
if($('profileAvatarInput'))$('profileAvatarInput').onchange=e=>{const f=e.target.files?.[0];if(f)uploadMyAvatar(f);e.target.value=''}
if($('calendarPrevBtn'))$('calendarPrevBtn').onclick=()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()-1,1);renderCalendarMonth()}
if($('calendarNextBtn'))$('calendarNextBtn').onclick=()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+1,1);renderCalendarMonth()}
if($('calendarTodayBtn'))$('calendarTodayBtn').onclick=()=>{const n=new Date();calendarCursor=new Date(n.getFullYear(),n.getMonth(),1);calendarSelectedDate=new Date(n.getFullYear(),n.getMonth(),n.getDate());renderCalendarMonth()}
if($('calendarMonthSelect'))$('calendarMonthSelect').onchange=e=>{calendarCursor=new Date(calendarCursor.getFullYear(),Number(e.target.value),1);renderCalendarMonth()}
if($('calendarYearSelect'))$('calendarYearSelect').onchange=e=>{calendarCursor=new Date(Number(e.target.value),calendarCursor.getMonth(),1);renderCalendarMonth()}
}
await __isaCore30();

// Ferramentas extras carregam somente depois que o núcleo já iniciou.
const __isaOptionalModules30 = [
  './ui-fixes.js?v=30',
  './realtime-presence.js?v=30',
  './calendar-enhanced.js?v=30',
  './study.js?v=30',
  './study-document.js?v=30',
  './study-document-collab.js?v=30',
  './retention-notice.js?v=30',
  './study-randomizer.js?v=30',
  './study-flashcards.js?v=30',
  './study-flashcards-delete.js?v=30',
  './study-ideas.js?v=30',
  './study-mindmap.js?v=30',
  './study-periodic.js?v=30',
  './study-material-manager.js?v=30',
  './study-timer.js?v=30'
];
const __loadIsaOptional30 = () => Promise.allSettled(
  __isaOptionalModules30.map(p => import(p).catch(err => {
    console.error('Módulo opcional não carregou:', p, err);
    return null;
  }))
);
if ('requestIdleCallback' in window) requestIdleCallback(__loadIsaOptional30, { timeout: 2500 });
else setTimeout(__loadIsaOptional30, 1200);
