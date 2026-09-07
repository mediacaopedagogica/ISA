import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js'

window.__ISA_SCRIPT_LOADED__=true;

const files=['chunk-00.txt','chunk-01.txt','chunk-02.txt','chunk-03.txt','chunk-04.txt','chunk-05.txt','chunk-06.txt','chunk-07.txt','chunk-08.txt','chunk-09.txt'];

try{
  const parts=await Promise.all(files.map(async f=>{
    const r=await fetch(`${f}?v=46`,{cache:'no-store'});
    if(!r.ok)throw new Error(`Falha ao carregar ${f}`);
    return r.text();
  }));
  const run=new Function('createClient','CONFIG',`return (async()=>{${parts.join('')}})()`);
  await run(createClient,CONFIG);
  window.__ISA_APP_READY__=true;
}catch(error){
  console.error('Falha ao iniciar o núcleo do Cantinho da Isa:',error);
  window.__ISA_APP_ERROR__=String(error?.message||error||'Erro desconhecido');
  const login=document.getElementById('loginView');
  const main=document.getElementById('mainView');
  const setup=document.getElementById('setupView');
  if(main)main.classList.add('hidden');
  if(setup)setup.classList.add('hidden');
  if(login)login.classList.remove('hidden');
  const msg=document.getElementById('loginMsg');
  if(msg)msg.textContent='Não foi possível carregar o Cantinho. Atualize a página e tente novamente.';
}

const optionalModules=[
  './ui-fixes.js?v=46',
  './realtime-presence.js?v=46',
  './calendar-enhanced.js?v=46',
  './study.js?v=46',
  './study-document.js?v=46',
  './study-document-collab.js?v=46',
  './retention-notice.js?v=46',
  './study-randomizer.js?v=46',
  './study-flashcards.js?v=46',
  './study-flashcards-delete.js?v=46',
  './study-ideas.js?v=46',
  './study-mindmap.js?v=46',
  './study-periodic.js?v=46',
  './study-material-manager.js?v=46',
  './study-timer.js?v=46'
];

const loadOptional=()=>Promise.allSettled(optionalModules.map(modulePath=>
  import(modulePath).catch(error=>{console.error(`Módulo opcional não carregou: ${modulePath}`,error);throw error})
));

if('requestIdleCallback' in window){
  requestIdleCallback(()=>loadOptional(),{timeout:2500});
}else{
  setTimeout(()=>loadOptional(),1200);
}
