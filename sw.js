const CACHE_PREFIX='cantinho-isa-';

// Modo de recuperação: o Service Worker não intercepta navegação nem arquivos.
// Isso impede versões antigas do app de prenderem a página em cache.
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

// Push permanece disponível; somente o cache/interceptação foi desligado.
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
