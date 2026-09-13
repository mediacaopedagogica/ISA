(function(){
  'use strict'
  if(window.__ISA_PWA_INSTALL_V1__)return
  window.__ISA_PWA_INSTALL_V1__=true

  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const approved=new Set(['keise','isa','alan'])
  let deferred=window.__ISA_PWA_INSTALL_PROMPT__||null
  let installing=false

  function profile(){const q=norm(new URLSearchParams(location.search).get('perfil')),n=norm($('myName')?.textContent).split(/\s+/)[0];return approved.has(q)?q:(approved.has(n)?n:'')}
  function installed(){return window.__ISA_PWA_INSTALLED__===true||window.matchMedia?.('(display-mode: standalone)')?.matches||window.navigator.standalone===true}
  function isIOS(){return /iPad|iPhone|iPod/.test(navigator.userAgent)||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1}
  function toast(text){const t=$('toast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._pwa);t._pwa=setTimeout(()=>t.classList.add('hidden'),3300)}

  function syncButton(){
    const b=$('isaInstallFeatureBtn')
    if(installed()){
      b?.remove()
      return false
    }
    if(b){
      b.disabled=installing
      b.setAttribute('aria-label','Instalar o Cantinho neste aparelho')
      b.title='Instalar o Cantinho neste aparelho'
      b.innerHTML=`<span class="ka-feature-icon">📲</span><span>${installing?'Instalando…':'Instalar'}</span>`
    }
    return true
  }

  async function installNow(){
    if(installed()){syncButton();return true}
    if(installing)return false
    let promptEvent=deferred||window.__ISA_PWA_INSTALL_PROMPT__||null

    if(!promptEvent&&'serviceWorker'in navigator){
      try{await Promise.race([navigator.serviceWorker.ready,new Promise(resolve=>setTimeout(resolve,900))])}catch{}
      await new Promise(resolve=>setTimeout(resolve,180))
      promptEvent=deferred||window.__ISA_PWA_INSTALL_PROMPT__||null
    }

    if(!promptEvent){
      if(isIOS())toast('No iPhone/iPad: Compartilhar → Adicionar à Tela de Início.')
      else toast('A instalação ainda não foi liberada pelo navegador. Atualize a página e toque em Instalar.')
      return false
    }

    installing=true;syncButton()
    try{
      await promptEvent.prompt()
      const choice=await promptEvent.userChoice
      if(choice?.outcome==='accepted'){
        deferred=null
        window.__ISA_PWA_INSTALL_PROMPT__=null
        toast('Instalando o Cantinho…')
        setTimeout(syncButton,700)
        return true
      }
      toast('Instalação cancelada.')
      return false
    }catch(error){
      console.warn('Instalação PWA:',error)
      toast('Não foi possível abrir a instalação agora.')
      return false
    }finally{
      installing=false;syncButton()
    }
  }

  function inject(){
    if(!profile())return false
    if(installed()){syncButton();return true}
    const grid=document.querySelector('#keiseApprovedHome .ka-grid');if(!grid)return false
    let b=$('isaInstallFeatureBtn')
    if(!b){
      b=document.createElement('button')
      b.id='isaInstallFeatureBtn';b.type='button';b.className='ka-feature'
      b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();installNow()},true)
      grid.appendChild(b)
    }
    syncButton();return true
  }

  function capture(e){
    if(e){e.preventDefault?.();deferred=e;window.__ISA_PWA_INSTALL_PROMPT__=e}
    else deferred=window.__ISA_PWA_INSTALL_PROMPT__||deferred
    inject()
  }

  window.addEventListener('beforeinstallprompt',capture)
  window.addEventListener('isa:pwa-install-ready',()=>capture())
  window.addEventListener('appinstalled',()=>{
    deferred=null;window.__ISA_PWA_INSTALL_PROMPT__=null;window.__ISA_PWA_INSTALLED__=true
    syncButton();toast('Cantinho instalado 💜')
  })
  document.addEventListener('isa:approved-home-ready',inject)
  document.addEventListener('isa:keise-approved-home-built',inject)
  window.__ISA_PWA_INSTALL__={inject,isInstalled:installed,install:installNow,openHelp:installNow}
  setTimeout(inject,350);setTimeout(inject,1100)
})();
