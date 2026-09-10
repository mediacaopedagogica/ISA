// Cantinho da Isa • núcleo externo v2
// Carregamento clássico e independente: evita ficar preso em "Verificando seu acesso…".
(function(){
  if(window.__ISA_FRIEND_CORE_V2__) return;
  window.__ISA_FRIEND_CORE_V2__=true;

  const CONFIG={
    SUPABASE_URL:'https://srazofmrxzwqcavnhplq.supabase.co',
    SUPABASE_KEY:'sb_publishable_DkrgCnVQ6Fn2jBahb2fCPA_VOwWWAcr'
  };
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const token=new URLSearchParams(location.hash.replace(/^#/,'')).get('acesso')||'';
  const emojis=['😀','😊','🥰','😍','😂','😄','🙂','😉','🤗','🥳','💜','🩷','❤️','💙','💚','✨','⭐','🌷','🌸','🎉','👍','👏','🙏','📚'];
  let person=null,conversations=[],activeConversation=null,messageTimer=null,listTimer=null,presenceTimer=null,booting=false;
  const mediaCache=new Map();

  function toast(text){
    const el=$('friendToast');if(!el)return;
    el.textContent=text;el.classList.remove('hidden');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.add('hidden'),2600);
  }
  function fmtTime(ts){try{return new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit'}).format(new Date(ts))}catch{return''}}
  function stopTimers(){clearInterval(messageTimer);clearInterval(listTimer);clearInterval(presenceTimer);messageTimer=listTimer=presenceTimer=null}

  async function request(url,options={},timeoutMs=9000){
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);
    try{
      const r=await fetch(url,{...options,cache:'no-store',signal:controller.signal});
      let data=null;try{data=await r.json()}catch{}
      if(!r.ok)throw new Error(data?.message||data?.hint||data?.details||data?.error||'Não foi possível acessar.');
      return data;
    }catch(e){
      if(e?.name==='AbortError')throw new Error('A conexão demorou demais. Tente novamente.');
      throw e;
    }finally{clearTimeout(timer)}
  }
  function rpc(name,args={},timeoutMs=9000){
    return request(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${name}`,{
      method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify(args)
    },timeoutMs);
  }
  function edgeJson(slug,payload,timeoutMs=12000){
    return request(`${CONFIG.SUPABASE_URL}/functions/v1/${slug}`,{
      method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify(payload)
    },timeoutMs);
  }

  function gateLoading(){
    const title=$('friendGateTitle'),text=$('friendGateText'),err=$('friendGateError'),btn=$('friendEnterBtn');
    if(title)title.textContent='Verificando seu acesso…';if(text)text.textContent='Só um instante.';if(err)err.textContent='';
    if(btn){btn.classList.add('hidden');btn.disabled=false;btn.dataset.mode='enter';btn.textContent='Acessar 💜'}
  }
  function gateReady(){
    const title=$('friendGateTitle'),text=$('friendGateText'),err=$('friendGateError'),btn=$('friendEnterBtn');
    if(title)title.textContent=`Oi, ${person?.name||'família'}! 💜`;if(text)text.textContent='Este é seu acesso pessoal ao Cantinho da Isa.';if(err)err.textContent='';
    if(btn){btn.dataset.mode='enter';btn.textContent='Acessar 💜';btn.disabled=false;btn.classList.remove('hidden')}
  }
  function gateError(message){
    const title=$('friendGateTitle'),text=$('friendGateText'),err=$('friendGateError'),btn=$('friendEnterBtn');
    if(title)title.textContent='Não conseguimos conectar agora';if(text)text.textContent='Seu link continua disponível. Toque abaixo para tentar novamente.';if(err)err.textContent=message||'Falha de conexão.';
    if(btn){btn.dataset.mode='retry';btn.textContent='Tentar novamente';btn.disabled=false;btn.classList.remove('hidden')}
  }

  async function bootstrap(silent=false){
    if(booting)return false;booting=true;
    window.__ISA_FRIEND_BOOTSTRAP_STATE__='loading';
    if(!token){window.__ISA_FRIEND_BOOTSTRAP_STATE__='invalid';window.__ISA_FRIEND_ACCESS_VALID__=false;if(!silent)gateError('Este link não é válido.');booting=false;return false}
    if(!silent)gateLoading();
    try{
      let data;
      try{data=await rpc('friend_portal_bootstrap',{p_token:token},8000)}
      catch(first){await new Promise(r=>setTimeout(r,300));data=await rpc('friend_portal_bootstrap',{p_token:token},8000)}
      if(!data?.friend?.id)throw new Error('O perfil deste link não foi encontrado.');
      person=data.friend;conversations=Array.isArray(data.conversations)?data.conversations:[];
      window.__ISA_FRIEND_PERSON__=person;window.__ISA_FRIEND_ACCESS_VALID__=true;window.__ISA_FRIEND_BOOTSTRAP_STATE__='ready';
      document.dispatchEvent(new CustomEvent('isa:friend-access-valid',{detail:{id:person.id,name:person.name||''}}));
      if(!silent)gateReady();
      if($('friendChat')&&!$('friendChat').classList.contains('hidden'))renderConversationList();
      return true;
    }catch(e){
      window.__ISA_FRIEND_ACCESS_VALID__=false;window.__ISA_FRIEND_BOOTSTRAP_STATE__='error';
      document.dispatchEvent(new Event('isa:friend-access-invalid'));if(!silent)gateError(e?.message||'Falha de conexão.');return false;
    }finally{booting=false}
  }

  function ensureExitButton(){
    const host=document.querySelector('.friend-profile');if(!host)return null;let b=$('friendExitBtn');
    if(!b){b=document.createElement('button');b.id='friendExitBtn';b.type='button';b.className='friend-exit-btn';b.textContent='Sair';b.title='Sair deste acesso';host.appendChild(b)}return b;
  }
  function renderConversationList(){
    if($('friendName'))$('friendName').textContent=person?.name||'Família';if($('friendRelationship'))$('friendRelationship').textContent=person?.relationship||'Família';
    const box=$('friendConversationList');if(!box)return;
    box.innerHTML=conversations.map(c=>`<button class="friend-conversation ${activeConversation?.id===c.id?'active':''}" data-friend-conv="${esc(c.id)}" type="button"><strong>${c.type==='group'?'👥 ':''}${esc(c.title||'Isa')}</strong><small>${esc(c.preview||(c.type==='direct'?'Conversa com a Isa':(c.participants||[]).join(', ')))}</small></button>`).join('')||'<p class="muted">Nenhuma conversa disponível.</p>';
    box.querySelectorAll('[data-friend-conv]').forEach(b=>b.onclick=()=>openConversation(b.dataset.friendConv));ensureExitButton();
  }
  function enterPortal(){
    if(!person||!window.__ISA_FRIEND_ACCESS_VALID__){bootstrap(false);return}
    $('friendGate')?.classList.add('hidden');$('friendChat')?.classList.remove('hidden');document.body.classList.add('friend-portal-open');
    renderConversationList();startTimers();setPresence(true).catch(()=>{});window.__ISA_FRIEND_PORTAL_ENTERED__=true;
    document.dispatchEvent(new CustomEvent('isa:friend-portal-entered',{detail:{id:person.id,name:person.name||''}}));
    const direct=conversations.find(c=>c.type==='direct');if(direct&&!matchMedia('(max-width:780px)').matches)openConversation(direct.id).catch(e=>toast(e.message));
  }
  function exitPortal(){
    stopTimers();setPresence(false,true).catch(()=>{});activeConversation=null;window.__FRIEND_ACTIVE_CONV_TYPE__=null;window.__ISA_FRIEND_PORTAL_ENTERED__=false;
    $('friendChat')?.classList.remove('thread-open');$('friendChat')?.classList.add('hidden');$('friendGate')?.classList.remove('hidden');document.body.classList.remove('friend-portal-open');
    $('friendThread')?.classList.add('hidden');$('friendEmpty')?.classList.remove('hidden');gateReady();
  }
  async function refreshConversations(){
    try{
      const data=await rpc('friend_portal_bootstrap',{p_token:token},7000);if(data?.friend?.id){person=data.friend;conversations=Array.isArray(data.conversations)?data.conversations:[];window.__ISA_FRIEND_PERSON__=person;renderConversationList()}
    }catch{}
  }
  async function openConversation(id){
    const c=conversations.find(x=>String(x.id)===String(id));if(!c)return;
    activeConversation=c;window.__FRIEND_ACTIVE_CONV_TYPE__=c.type;$('friendEmpty')?.classList.add('hidden');$('friendThread')?.classList.remove('hidden');$('friendChat')?.classList.add('thread-open');
    if($('friendThreadTitle'))$('friendThreadTitle').textContent=c.title||'Isa';if($('friendThreadSubtitle'))$('friendThreadSubtitle').textContent=c.type==='group'?'Grupo da família':'Conversa direta';
    renderConversationList();await loadMessages(true);document.dispatchEvent(new Event('visibilitychange'));
  }

  async function mediaJson(payload){return edgeJson('friend-media',payload,10000)}
  async function getMediaUrl(messageId){const cached=mediaCache.get(messageId);if(cached&&cached.until>Date.now())return cached.url;const d=await mediaJson({action:'signed_url',token,messageId});mediaCache.set(messageId,{url:d.url,until:Date.now()+240000});return d.url}
  async function hydrateMedia(){
    for(const node of document.querySelectorAll('[data-family-photo]')){if(node.dataset.loaded==='1')continue;const id=node.dataset.familyPhoto;try{const url=await getMediaUrl(id);node.innerHTML=`<img class="friend-photo" src="${esc(url)}" alt="Imagem enviada">`;node.dataset.loaded='1'}catch{node.innerHTML='<div class="friend-photo-note">📷 Imagem indisponível.</div>';node.dataset.loaded='1'}}
    for(const node of document.querySelectorAll('[data-family-audio]')){if(node.dataset.loaded==='1')continue;const id=node.dataset.familyAudio;try{const url=await getMediaUrl(id),a=document.createElement('audio');a.controls=true;a.preload='metadata';a.src=url;a.className='friend-audio';a.style.width='min(360px,100%)';node.innerHTML='';node.appendChild(a);node.dataset.loaded='1'}catch{node.innerHTML='<div class="friend-photo-note">🎙️ Áudio indisponível.</div>';node.dataset.loaded='1'}}
  }
  async function loadMessages(forceScroll=false){
    if(!activeConversation)return;try{
      const list=await rpc('friend_portal_messages',{p_token:token,p_conversation_id:activeConversation.id},8000),box=$('friendMessages');if(!box)return;
      const atBottom=box.scrollHeight-box.scrollTop-box.clientHeight<90;
      box.innerHTML=(list||[]).map(m=>{const mine=String(m.senderId)===String(person.id),read=mine?(Number(m.readCount||0)>0?'✓✓ Lida':'✓ Enviada'):'';let content=m.kind==='photo'?`<div class="friend-photo-wrap" data-family-photo="${esc(m.id)}"><div class="friend-photo-note">📷 Carregando imagem…</div></div>`:m.kind==='audio'?`<div class="friend-audio-wrap" data-family-audio="${esc(m.id)}"><div class="friend-photo-note">🎙️ Carregando áudio…</div></div>`:`<div>${esc(m.body||'')}</div>`;return `<div class="friend-msg ${mine?'mine':''}" data-message-id="${esc(m.id)}"><div class="friend-bubble">${!mine?`<span class="friend-sender">${esc(m.senderName||'')}</span>`:''}${content}<span class="friend-meta">${fmtTime(m.sentAt)}</span>${read?`<span class="friend-read">${read}</span>`:''}</div></div>`}).join('')||'<div class="friend-empty" style="height:auto;padding:40px"><p>Comece a conversa 💕</p></div>';
      hydrateMedia();window.__ISA_REFRESH_MESSAGE_INTERACTIONS__?.();window.__ISA_REACTION_DELEGATE_REFRESH__?.();if(forceScroll||atBottom)requestAnimationFrame(()=>box.scrollTop=box.scrollHeight);
    }catch(e){toast(e?.message||'Não foi possível carregar as mensagens.')}
  }
  async function sendMessage(){
    const input=$('friendMessageInput'),body=input?.value.trim();if(!body||!activeConversation)return;if($('friendSendBtn'))$('friendSendBtn').disabled=true;input.value='';
    try{await rpc('friend_portal_send',{p_token:token,p_conversation_id:activeConversation.id,p_body:body},9000);await loadMessages(true);refreshConversations()}
    catch(e){input.value=body;toast(e?.message||'Não foi possível enviar.')}finally{if($('friendSendBtn'))$('friendSendBtn').disabled=false;input.focus()}
  }
  async function sendPhoto(file){
    if(!file||!activeConversation)return;if(file.size>6*1024*1024)return toast('Use uma imagem de até 6 MB.');
    const form=new FormData();form.append('token',token);form.append('conversationId',activeConversation.id);form.append('action','message');form.append('file',file);toast('Enviando imagem…');
    try{await request(`${CONFIG.SUPABASE_URL}/functions/v1/friend-media`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY},body:form},15000);await loadMessages(true);refreshConversations();toast('Imagem enviada 📷')}
    catch(e){toast(e?.message||'Não foi possível enviar a imagem.')}
  }
  async function setPresence(online,keepalive=false){if(!token||!person)return;try{await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/friend_portal_presence`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({p_token:token,p_online:!!online}),cache:'no-store',keepalive:!!keepalive})}catch{}}
  function startTimers(){stopTimers();const mobile=matchMedia('(max-width:780px)').matches;messageTimer=setInterval(()=>{if(document.visibilityState==='visible'&&activeConversation)loadMessages(false)},mobile?5000:3200);listTimer=setInterval(()=>{if(document.visibilityState==='visible')refreshConversations()},mobile?12000:7000);presenceTimer=setInterval(()=>{if(document.visibilityState==='visible')setPresence(true)},22000)}
  function buildEmoji(){const bar=$('friendEmojiBar');if(!bar)return;bar.innerHTML=emojis.map(e=>`<button type="button" data-emoji="${e}">${e}</button>`).join('');bar.querySelectorAll('[data-emoji]').forEach(b=>b.onclick=()=>{const i=$('friendMessageInput');if(i){i.value+=b.dataset.emoji;i.focus()}bar.classList.add('hidden')})}

  window.__ISA_FRIEND_TOKEN__=token;window.__ISA_FRIEND_GET_ACTIVE_CONVERSATION_ID__=()=>activeConversation?.id||null;window.__ISA_FRIEND_REFRESH_MESSAGES__=()=>loadMessages(true);window.__ISA_FRIEND_REFRESH_LIST__=()=>refreshConversations();window.__ISA_FRIEND_SEND_PHOTO_FILE__=sendPhoto;window.__ISA_FRIEND_TOAST__=toast;window.__ISA_FRIEND_ENTER_PORTAL__=enterPortal;window.__ISA_FRIEND_BOOTSTRAP__=()=>bootstrap(false);

  $('friendEnterBtn')?.addEventListener('click',()=>$('friendEnterBtn').dataset.mode==='retry'?bootstrap(false):enterPortal());
  $('friendSendBtn')?.addEventListener('click',sendMessage);
  $('friendMessageInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage()}});
  $('friendEmojiBtn')?.addEventListener('click',e=>{e.stopPropagation();$('friendEmojiBar')?.classList.toggle('hidden')});
  $('friendPhotoBtn')?.addEventListener('click',()=>$('friendPhotoInput')?.click());
  $('friendPhotoInput')?.addEventListener('change',e=>{const f=e.target.files?.[0];if(f)sendPhoto(f);e.target.value=''});
  $('friendBackBtn')?.addEventListener('click',()=>{$('friendChat')?.classList.remove('thread-open');if(innerWidth>780){$('friendThread')?.classList.add('hidden');$('friendEmpty')?.classList.remove('hidden')}activeConversation=null;window.__FRIEND_ACTIVE_CONV_TYPE__=null;renderConversationList()});
  document.addEventListener('click',e=>{if(e.target.closest?.('#friendExitBtn')){e.preventDefault();exitPortal();return}if(!e.target.closest?.('#friendEmojiBar')&&!e.target.closest?.('#friendEmojiBtn'))$('friendEmojiBar')?.classList.add('hidden')});
  document.addEventListener('visibilitychange',()=>setPresence(document.visibilityState==='visible'));window.addEventListener('pagehide',()=>setPresence(false,true));

  buildEmoji();bootstrap(false);
})();
