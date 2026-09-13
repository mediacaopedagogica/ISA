(function(){
  'use strict'
  if(window.__ISA_PWA_INSTALL_V1__)return
  window.__ISA_PWA_INSTALL_V1__=true

  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const approved=new Set(['keise','isa','alan'])
  let deferred=null

  function profile(){const q=norm(new URLSearchParams(location.search).get('perfil')),n=norm($('myName')?.textContent).split(/\s+/)[0];return approved.has(q)?q:(approved.has(n)?n:'')}
  function installed(){return window.matchMedia?.('(display-mode: standalone)')?.matches||window.navigator.standalone===true}
  function toast(text){const t=$('toast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._pwa);t._pwa=setTimeout(()=>t.classList.add('hidden'),4200)}

  function ensureHelp(){
    let m=$('isaInstallHelpModal');if(m)return m
    const style=document.createElement('style');style.id='isaInstallHelpCss';style.textContent=`
      #isaInstallHelpModal{position:fixed;inset:0;z-index:199500;display:grid;place-items:center;padding:16px;background:rgba(69,51,79,.34);backdrop-filter:blur(10px)}#isaInstallHelpModal.hidden{display:none!important}
      #isaInstallHelpModal .iih-card{width:min(560px,96vw);max-height:90dvh;overflow:auto;position:relative;padding:25px;border-radius:28px;border:1px solid rgba(255,255,255,.96);background:linear-gradient(145deg,#fffafd,#f3efff 55%,#eef9ff);box-shadow:0 28px 70px rgba(75,54,91,.22);font-family:Inter,"Segoe UI",sans-serif;color:#604d6b}
      #isaInstallHelpModal .iih-close{position:absolute;right:14px;top:14px;width:42px;height:42px;border:0;border-radius:14px;background:#efe7f4;color:#725f7b;font-size:22px;cursor:pointer}
      #isaInstallHelpModal .iih-icon{width:68px;height:68px;display:grid;place-items:center;border-radius:22px;background:linear-gradient(145deg,#ffe6f2,#e9e2ff);font-size:34px;box-shadow:0 9px 22px rgba(117,86,132,.12)}
      #isaInstallHelpModal h2{margin:13px 0 5px;font-size:27px;color:#543f60}#isaInstallHelpModal p{line-height:1.5;color:#806d88}
      #isaInstallHelpModal .iih-device{margin-top:10px;padding:13px 14px;border:1px solid #eadfec;border-radius:18px;background:rgba(255,255,255,.82);line-height:1.45;font-size:13px}#isaInstallHelpModal .iih-device strong{display:block;margin-bottom:3px;color:#675270}
      #isaInstallHelpModal .iih-note{margin-top:14px;padding:12px 14px;border-radius:16px;background:#fff0f7;color:#805b70;font-size:12px;font-weight:800}
      #isaInstallHelpModal .iih-native{width:100%;height:44px;margin-top:14px;border:0;border-radius:15px;background:linear-gradient(135deg,#ed81ba,#a98add);color:#fff;font-weight:900;cursor:pointer}
    `;document.head.appendChild(style)
    m=document.createElement('div');m.id='isaInstallHelpModal';m.className='hidden';m.innerHTML=`<div class="iih-card" role="dialog" aria-modal="true"><button class="iih-close" type="button" aria-label="Fechar">×</button><div class="iih-icon">📲</div><h2>Instalar o Cantinho</h2><p id="iihStatus"></p><button id="iihNative" class="iih-native hidden" type="button">Instalar neste aparelho</button><div class="iih-device"><strong>📱 Android</strong>No Chrome ou Edge, abra o menu do navegador e escolha <b>Instalar aplicativo</b> ou <b>Adicionar à tela inicial</b>.</div><div class="iih-device"><strong>🍎 iPhone / iPad</strong>Abra no Safari, toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>.</div><div class="iih-device"><strong>💻 Computador</strong>No Chrome ou Edge, use o ícone de instalação na barra de endereço ou o menu do navegador → <b>Instalar aplicativo</b>.</div><div class="iih-note">✨ A instalação é por aparelho. Então o mesmo perfil pode ficar instalado no celular, notebook e computador, cada um separadamente.</div></div>`
    document.body.appendChild(m);m.addEventListener('click',e=>{if(e.target===m||e.target.closest('.iih-close'))m.classList.add('hidden')});$('iihNative')?.addEventListener('click',nativeInstall);return m
  }

  async function nativeInstall(){
    if(!deferred){ensureHelp();$('iihStatus').textContent=installed()?'Neste aparelho o Cantinho já está instalado. Você pode instalar também nos outros aparelhos usando as instruções abaixo.':'O navegador não ofereceu o botão automático agora. Use as instruções abaixo para este aparelho.';$('iihNative').classList.add('hidden');return}
    const p=deferred;try{await p.prompt();const choice=await p.userChoice;if(choice?.outcome==='accepted'){deferred=null;toast('Cantinho instalado neste aparelho 💜')}else toast('Instalação cancelada. O botão continua disponível.')}catch{toast('Use as instruções de instalação mostradas na tela.')}finally{openHelp()}
  }
  function openHelp(){const m=ensureHelp();m.classList.remove('hidden');const native=$('iihNative');$('iihStatus').textContent=installed()?'Este aparelho já reconhece o Cantinho como app. O botão fica aqui porque você também pode instalar em outros aparelhos.':'Você pode instalar o Cantinho neste aparelho e repetir a instalação em cada celular ou computador.';native.classList.toggle('hidden',!deferred||installed())}

  function inject(){
    if(!profile())return false
    const grid=document.querySelector('#keiseApprovedHome .ka-grid');if(!grid)return false
    let b=$('isaInstallFeatureBtn');if(!b){b=document.createElement('button');b.id='isaInstallFeatureBtn';b.type='button';b.className='ka-feature';b.innerHTML='<span class="ka-feature-icon">📲</span><span>Instalar app</span>';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(deferred&&!installed())nativeInstall();else openHelp()},true);grid.appendChild(b)}
    b.title=installed()?'Instalado neste aparelho • ver opções para outros dispositivos':'Instalar o Cantinho neste aparelho';return true
  }

  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;inject()})
  window.addEventListener('appinstalled',()=>{deferred=null;inject();toast('Cantinho instalado neste aparelho 💜')})
  document.addEventListener('isa:approved-home-ready',inject);document.addEventListener('isa:keise-approved-home-built',inject)
  window.__ISA_PWA_INSTALL__={inject,isInstalled:installed,openHelp}
  setTimeout(inject,700);setTimeout(inject,1800)
})();
