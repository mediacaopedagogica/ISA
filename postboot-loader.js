const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitForApp(timeout=12000){
  const start=Date.now();
  while(Date.now()-start<timeout){
    const main=document.getElementById('mainView');
    const name=String(document.getElementById('myName')?.textContent||'').trim();
    if(window.__ISA_APP_READY__ && main && !main.classList.contains('hidden') && name && name!=='Família') return true;
    if(window.__ISA_APP_ERROR__) throw new Error(window.__ISA_APP_ERROR__);
    await sleep(80);
  }
  throw new Error('O Cantinho demorou para concluir a entrada.');
}

try{
  await waitForApp();
  await Promise.allSettled([
    import('./mobile-responsive-v2.js?v=10-stable'),
    import('./notifications-v2.js?v=6-stable'),
    import('./extras-loader.js?v=10-stable')
  ]);
  window.__ISA_EXTRAS_READY__=true;
}catch(error){
  console.error('Pós-inicialização:',error);
  window.__ISA_POSTBOOT_ERROR__=String(error?.message||error||'Erro');
}
