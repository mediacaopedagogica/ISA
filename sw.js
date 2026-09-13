const CACHE_PREFIX='cantinho-isa-';

// V86 — shell aprovado sempre fresco + notificações inteligentes isoladas.
// Navegação, JS e CSS nunca voltam de um cache antigo; isso evita o layout legado reaparecer.
self.addEventListener('install',event=>{
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  let url;try{url=new URL(req.url)}catch{return}
  if(url.origin!==self.location.origin)return;
  const important=req.mode==='navigate'||['document','script','style'].includes(req.destination)||/\.(?:html?|js|css)$/i.test(url.pathname);
  if(!important)return;
  event.respondWith(fetch(req,{cache:'no-store'}));
});

async function applyAppBadge(value){
  const n=Math.max(0,Number(value)||0);
  try{
    if(n>0&&typeof self.navigator?.setAppBadge==='function')await self.navigator.setAppBadge(n);
    else if(n===0&&typeof self.navigator?.clearAppBadge==='function')await self.navigator.clearAppBadge();
  }catch{}
}

async function broadcastBadge(badgeCount,conversationId=''){
  try{
    const list=await clients.matchAll({type:'window',includeUncontrolled:true});
    await Promise.all(list.map(client=>{
      try{return client.postMessage({type:'isa-push-badge',badgeCount,conversationId})}catch{return null}
    }));
  }catch{}
}

async function openNotificationUrl(url){
  const list=await clients.matchAll({type:'window',includeUncontrolled:true});
  for(const client of list){
    if('focus' in client){
      try{await client.navigate(url)}catch{}
      return client.focus();
    }
  }
  return clients.openWindow(url);
}

// Push: mantém o comportamento aprovado e acrescenta badge/deep-link sem tocar no motor do Chat.
self.addEventListener('push',event=>{
  let data={};
  try{data=event.data?.json()||{}}catch{}
  const extra=data?.data||{};
  const url=extra.url||'./';
  const urgent=!!data.urgent;
  const sound=!!data.sound;
  const badgeCount=Math.max(0,Number(data.badgeCount)||0);
  const options={
    body:data.body||'Chegou uma nova notificação',
    icon:'icon.svg',
    badge:'icon.svg',
    tag:data.tag||'cantinho-isa',
    renotify:true,
    silent:false,
    data:{
      url,
      urgent,
      sound,
      conversationId:extra.conversationId||'',
      messageId:extra.messageId||'',
      recipientProfile:extra.recipientProfile||'',
      badgeCount,
      readUrl:extra.readUrl||'',
      readToken:extra.readToken||''
    }
  };
  if(Array.isArray(data.vibrate))options.vibrate=data.vibrate;
  if(data.requireInteraction===true)options.requireInteraction=true;
  if(Array.isArray(data.actions)&&data.actions.length)options.actions=data.actions.slice(0,2);

  event.waitUntil(Promise.all([
    self.registration.showNotification(data.title||'Cantinho da Isa 💕',options),
    applyAppBadge(badgeCount),
    clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>Promise.all(list.map(client=>{
      try{return client.postMessage({type:'isa-urgent-notification',title:data.title||'Cantinho da Isa 💕',body:options.body,tag:options.tag,url,urgent,sound,badgeCount,conversationId:options.data.conversationId})}catch{return null}
    })))
  ]));
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const data=event.notification.data||{};
  let url=data.url||'./';

  event.waitUntil((async()=>{
    if(event.action==='read'&&data.readUrl&&data.readToken){
      try{
        const response=await fetch(data.readUrl,{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({token:data.readToken}),
          cache:'no-store'
        });
        if(response.ok){
          const result=await response.json().catch(()=>({}));
          const unreadCount=Math.max(0,Number(result?.unreadCount)||0);
          await applyAppBadge(unreadCount);
          await broadcastBadge(unreadCount,data.conversationId||'');
          return;
        }
      }catch{}
    }

    // Fallback seguro para notificações antigas que ainda não possuam token de leitura.
    if(event.action==='read'){
      try{const u=new URL(url,self.location.origin);u.searchParams.set('marcar','lida');url=u.href}catch{}
    }
    return openNotificationUrl(url);
  })());
});

// Ponte isolada de Background Sync: não envia mensagens sozinha e não altera o Chat.
// Apenas acorda uma janela aberta do Cantinho para que o módulo offline processe a fila.
self.addEventListener('sync',event=>{
  if(event.tag!=='isa-offline-chat-outbox')return;
  event.waitUntil(
    clients.matchAll({type:'window',includeUncontrolled:true})
      .then(list=>Promise.all(list.map(client=>{
        try{return client.postMessage({type:'isa:background-sync'})}catch{return null}
      })))
  );
});
