(function(){
  'use strict'
  if(window.__ISA_PWA_INSTALL_V1__)return
  window.__ISA_PWA_INSTALL_V1__=true

  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const approved=new Set(['keise','isa','alan'])
  let deferred=null

  function profile(){
    const q=norm(new URLSearchParams(location.search).get('perfil'))
    const n=norm($('myName')?.textContent).split(/\s+/)[0]
    return approved.has(q)?q:(approved.has(n)?n:'')
  }
  function installed(){return window.matchMedia?.('(display-mode: standalone)')?.matches||window.navigator.standalone===true}
  function toast(text){const t=$('toast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._pwa);t._pwa=setTimeout(()=>t.classList.add('hidden'),3600)}

  function remove(){ $('isaInstallFeatureBtn')?.remove() }
  function inject(){
    if(!profile()||installed()||!deferred){remove();return false}
    const grid=document.querySelector('#keiseApprovedHome .ka-grid');if(!grid)return false
    if($('isaInstallFeatureBtn'))return true
    const b=document.createElement('button');b.id='isaInstallFeatureBtn';b.type='button';b.className='ka-feature';b.innerHTML='<span class="ka-feature-icon">⬇️</span><span>Instalar app</span>'
    b.addEventListener('click',async e=>{e.preventDefault();e.stopPropagation();const p=deferred;if(!p)return;try{await p.prompt();const choice=await p.userChoice;if(choice?.outcome==='accepted'){deferred=null;remove();toast('Cantinho instalado 💜')}else toast('Instalação cancelada. Você pode instalar depois.')}catch{toast('Use o menu do Edge > Aplicativos > Instalar Cantinho da Isa.')}} ,true)
    grid.appendChild(b);return true
  }

  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;inject()})
  window.addEventListener('appinstalled',()=>{deferred=null;remove();toast('Cantinho instalado. O Edge/Windows agora pode oferecer Fixar na barra de tarefas e no Menu Iniciar. 💜')})
  document.addEventListener('isa:approved-home-ready',inject)
  document.addEventListener('isa:keise-approved-home-built',inject)
  window.__ISA_PWA_INSTALL__={inject,isInstalled:installed}
  setTimeout(inject,1000);setTimeout(inject,2200)
})();
