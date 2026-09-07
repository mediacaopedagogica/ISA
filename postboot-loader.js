// Carrega os recursos complementares sem bloquear nem esconder o app principal.
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function loadWithRetry(path){
  try{return await import(path)}
  catch(first){
    console.warn('Primeira tentativa falhou:',path,first)
    await wait(320)
    const sep=path.includes('?')?'&':'?'
    return import(`${path}${sep}retry=${Date.now()}`)
  }
}

const paths=[
  './mobile-interaction-guard.js?v=1',
  './mobile-responsive-v2.js?v=14-mobiletap',
  './notifications-v2.js?v=9-stable',
  './extras-loader.js?v=13-noloop'
]
const results=await Promise.allSettled(paths.map(loadWithRetry))
window.__ISA_EXTRAS_READY__=true
window.__ISA_EXTRAS_RESULTS__=results.map((r,i)=>({index:i,path:paths[i],ok:r.status==='fulfilled',error:r.status==='rejected'?String(r.reason?.message||r.reason||'Erro'):null}))

const failed=results.filter(r=>r.status==='rejected')
failed.forEach((r,i)=>console.warn('Módulo complementar não carregou',i,r.reason))
if(failed.length){
  const t=document.getElementById('toast')
  if(t){
    t.textContent='Alguns recursos extras demoraram para carregar. O Cantinho continua disponível.'
    t.classList.remove('hidden')
    setTimeout(()=>t.classList.add('hidden'),4200)
  }
}
