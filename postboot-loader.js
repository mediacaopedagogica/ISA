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

const dedicatedMobile=new URLSearchParams(location.search).get('mobile')==='1'
const common=[
  './general-settings.js?v=1-all-profiles',
  './notifications-v2.js?v=9-stable',
  './extras-loader.js?v=48-settings-social-v3'
]
const paths=dedicatedMobile?[
  './call-manager.js?v=7-mobile-fast',
  './mobile-native.js?v=3-no-blank',
  ...common
]:[
  './mobile-responsive-v2.js?v=15-android-touch',
  ...common
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
