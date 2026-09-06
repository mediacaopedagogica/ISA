import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js'

// Núcleo primeiro: usa cache local sempre que possível.
const files=['chunk-00.txt','chunk-01.txt','chunk-02.txt','chunk-03.txt','chunk-04.txt','chunk-05.txt','chunk-06.txt','chunk-07.txt','chunk-08.txt','chunk-09.txt'];

try{
  const parts=await Promise.all(files.map(async f=>{
    const r=await fetch(f,{cache:'force-cache'});
    if(!r.ok)throw new Error(`Falha ao carregar ${f}`);
    return r.text();
  }));
  const run=new Function('createClient','CONFIG',`return (async()=>{${parts.join('')}})()`);
  await run(createClient,CONFIG);
}catch(error){
  console.error('Falha ao iniciar o núcleo do Cantinho da Isa:',error);
  const login=document.getElementById('loginView');
  const main=document.getElementById('mainView');
  const setup=document.getElementById('setupView');
  if(main)main.classList.add('hidden');
  if(setup)setup.classList.add('hidden');
  if(login)login.classList.remove('hidden');
  const msg=document.getElementById('loginMsg');
  if(msg)msg.textContent='Não foi possível carregar tudo. Atualize a página e tente novamente.';
}

// Complementos nunca atrasam login/chat. Entram depois, em paralelo e isolados.
const optionalModules=[
  './ui-fixes.js?v=22',
  './realtime-presence.js?v=22',
  './calendar-enhanced.js?v=22',
  './study.js?v=22',
  './study-document.js?v=22',
  './study-document-collab.js?v=22',
  './retention-notice.js?v=22',
  './study-randomizer.js?v=22',
  './study-flashcards.js?v=22',
  './study-flashcards-delete.js?v=22',
  './study-ideas.js?v=22',
  './study-mindmap.js?v=22',
  './study-periodic.js?v=22',
  './study-material-manager.js?v=22',
  './study-timer.js?v=22'
];

const loadOptional=()=>Promise.allSettled(optionalModules.map(modulePath=>
  import(modulePath).catch(error=>{console.error(`Módulo opcional não carregou: ${modulePath}`,error);throw error})
));

if('requestIdleCallback' in window){
  requestIdleCallback(()=>loadOptional(),{timeout:2500});
}else{
  setTimeout(()=>loadOptional(),1200);
}
