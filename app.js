import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js'
import './study.js'
import './study-document.js'
const files=['chunk-00.txt','chunk-01.txt','chunk-02.txt','chunk-03.txt','chunk-04.txt','chunk-05.txt','chunk-06.txt','chunk-07.txt','chunk-08.txt','chunk-09.txt'];
const parts=await Promise.all(files.map(async f=>{const r=await fetch(f,{cache:'no-store'});if(!r.ok)throw new Error(`Falha ao carregar ${f}`);return r.text()}));
const run=new Function('createClient','CONFIG',`return (async()=>{${parts.join('')}})()`);
await run(createClient,CONFIG);
