const CACHE_PREFIX='cantinho-isa-';

// V84 — shell aprovado sempre fresco + ponte de alertas urgentes.
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

// Push: mantém o comportamento atual e acrescenta vibração/alerta persistente quando solicitado.
self.addEventListener('push',event=>{
  let data={};
  try{data=event.data?.json()||{}}catch{}
  const url=data?.data?.url||'./';
  const urgent=!!data.urgent;
  const sound=!!data.sound;
  const options={
    body:data.body||'Chegou uma nova notificação',
    icon:'icon.svg',
    badge:'icon.svg',
    tag:data.tag||'cantinho-isa',
    renotify:true,
    silent:false,
    data:{url,urgent,sound}
  };
  if(Array.isArray(data.vibrate))options.vibrate=data.vibrate;
  if(data.requireInteraction===true)options.requireInteraction=true;

  event.waitUntil(Promise.all([
    self.registration.showNotification(data.title||'Cantinho da Isa 💕',options),
    clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>Promise.all(list.map(client=>{
      try{return client.postMessage({type:'isa-urgent-notification',title:data.title||'Cantinho da Isa 💕',body:options.body,tag:options.tag,url,urgent,sound})}catch{return null}
    })))
  ]));
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const url=event.notification.data?.url||'./';
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(const client of list){
      if('focus' in client){client.navigate(url);return client.focus()}
    }
    return clients.openWindow(url);
  }));
});
