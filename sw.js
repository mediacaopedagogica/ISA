const CACHE_PREFIX='cantinho-isa-';

// V83 — shell aprovado sempre fresco.
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

// Push permanece disponível.
self.addEventListener('push',event=>{
  let data={};
  try{data=event.data?.json()||{}}catch{}
  const url=data?.data?.url||'./';
  event.waitUntil(self.registration.showNotification(data.title||'Cantinho da Isa 💕',{
    body:data.body||'Chegou uma nova notificação',
    icon:'icon.svg',
    badge:'icon.svg',
    tag:data.tag||'cantinho-isa',
    renotify:true,
    data:{url}
  }));
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
