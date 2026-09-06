import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js'

// O núcleo do Cantinho da Isa carrega primeiro. Ferramentas extras nunca podem
// impedir login, chat, calendário ou supervisão de iniciarem.
const files=['chunk-00.txt','chunk-01.txt','chunk-02.txt','chunk-03.txt','chunk-04.txt','chunk-05.txt','chunk-06.txt','chunk-07.txt','chunk-08.txt','chunk-09.txt'];

try{
  const parts=await Promise.all(files.map(async f=>{
    const r=await fetch(`${f}?core=21`,{cache:'no-store'});
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

// Complementos carregam depois do núcleo e de forma isolada. Se um deles
// apresentar erro, o restante do aplicativo continua funcionando normalmente.
const optionalModules=[
  './ui-fixes.js?v=21',
  './realtime-presence.js?v=21',
  './calendar-enhanced.js?v=21',
  './study.js?v=21',
  './study-document.js?v=21',
  './study-document-collab.js?v=21',
  './retention-notice.js?v=21',
  './study-randomizer.js?v=21',
  './study-flashcards.js?v=21',
  './study-flashcards-delete.js?v=21',
  './study-ideas.js?v=21',
  './study-mindmap.js?v=21',
  './study-periodic.js?v=21',
  './study-material-manager.js?v=21',
  './study-timer.js?v=21'
];

for(const modulePath of optionalModules){
  try{
    await import(modulePath);
  }catch(error){
    console.error(`Módulo opcional não carregou: ${modulePath}`,error);
  }
}
