const CACHE_PREFIX='cantinho-isa-';

// V85 — shell aprovado sempre fresco + notificações inteligentes isoladas.
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
    data:{url,urgent,sound,conversationId:extra.conversationId||'',messageId:extra.messageId||'',recipientProfile:extra.recipientProfile||'',badgeCount}
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
  let url=event.notification.data?.url||'./';
  if(event.action==='read'){
    try{const u=new URL(url,self.location.origin);u.searchParams.set('marcar','lida');url=u.href}catch{}
  }
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(const client of list){
      if('focus' in client){client.navigate(url);return client.focus()}
    }
    return clients.openWindow(url);
  }));
});
