(()=>{
  if(window.__ISA_LIGHT_BOOT__)return;
  window.__ISA_LIGHT_BOOT__=true;
  window.__ISA_SCRIPT_LOADED__=true;

  const profileRaw=(new URLSearchParams(location.search).get('perfil')||'').trim();
  const profile=['Keise','Alan','Isa'].find(n=>n.toLowerCase()===profileRaw.toLowerCase())||'';

  if(!document.getElementById('isaChatCardsCss')){
    const link=document.createElement('link');
    link.id='isaChatCardsCss';
    link.rel='stylesheet';
    link.href='./chat-cards-3d-v2.css?v=46';
    document.head.appendChild(link);
  }

  const showError=(text)=>{
    const login=document.getElementById('loginView');
    const main=document.getElementById('mainView');
    if(main)main.classList.add('hidden');
    if(login)login.classList.remove('hidden');
    const msg=document.getElementById('loginMsg');
    if(msg){msg.textContent=text;msg.style.color='#a15472';}
  };

  import('./app.js?v=46').catch(error=>{
    console.error('Falha ao carregar o Cantinho:',error);
    showError('Não foi possível abrir o Cantinho. Atualize a página e tente novamente.');
  });

  if(profile){
    const started=Date.now();
    const timer=setInterval(()=>{
      const main=document.getElementById('mainView');
      const login=document.getElementById('loginView');
      if(main&&!main.classList.contains('hidden')){clearInterval(timer);return;}
      if(login&&!login.classList.contains('hidden')){clearInterval(timer);return;}
      if(Date.now()-started>20000){
        clearInterval(timer);
        showError(`Não foi possível abrir como ${profile}. Tente o link novamente.`);
      }
    },300);
  }
})();
