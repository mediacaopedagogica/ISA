// Configurações Gerais — disponível para todos os perfis, notebook e mobile.
// Preferências ficam separadas por perfil neste aparelho. Fundo enviado pelo usuário é salvo no IndexedDB.
const $=id=>document.getElementById(id)
const sleep=ms=>new Promise(r=>setTimeout(r,ms))

const PRESETS={
  default:{name:'Padrão atual',group:'Padrão',preview:'linear-gradient(135deg,#fff7fb,#eee4ff)',css:null},
  light:{name:'Cores claras',group:'Cores claras',preview:'linear-gradient(135deg,#fff8f2,#f8e7ee 34%,#e9edf8 68%,#e8f4e9)',css:{color:'#f5efe9',image:'radial-gradient(circle at 14% 18%,rgba(244,188,205,.42) 0 13%,transparent 14%),radial-gradient(circle at 82% 22%,rgba(196,190,229,.42) 0 14%,transparent 15%),radial-gradient(circle at 35% 76%,rgba(183,221,200,.38) 0 16%,transparent 17%),linear-gradient(145deg,#fffaf5,#f3edf7 48%,#eef7f0)',size:'auto'}},
  dark:{name:'Cores escuras',group:'Cores escuras',preview:'linear-gradient(135deg,#11151b,#352843 45%,#11343a)',css:{color:'#11151b',image:'radial-gradient(circle at 16% 18%,rgba(112,88,142,.34) 0 14%,transparent 15%),radial-gradient(circle at 82% 72%,rgba(53,119,121,.28) 0 17%,transparent 18%),linear-gradient(145deg,#10151b,#282231 55%,#102a2d)',size:'auto'}},
  pink:{name:'Rosa',group:'Cores sólidas',preview:'#efbfd2',css:{color:'#efbfd2',image:'linear-gradient(rgba(255,255,255,.12),rgba(255,255,255,.12))',size:'auto'}},
  lilac:{name:'Lilás',group:'Cores sólidas',preview:'#c8b7e7',css:{color:'#c8b7e7',image:'linear-gradient(rgba(255,255,255,.12),rgba(255,255,255,.12))',size:'auto'}},
  blue:{name:'Azul',group:'Cores sólidas',preview:'#b9d9ee',css:{color:'#b9d9ee',image:'linear-gradient(rgba(255,255,255,.13),rgba(255,255,255,.13))',size:'auto'}},
  green:{name:'Verde',group:'Cores sólidas',preview:'#b9dfc6',css:{color:'#b9dfc6',image:'linear-gradient(rgba(255,255,255,.13),rgba(255,255,255,.13))',size:'auto'}},
  yellow:{name:'Amarelo',group:'Cores sólidas',preview:'#f3dda2',css:{color:'#f3dda2',image:'linear-gradient(rgba(255,255,255,.15),rgba(255,255,255,.15))',size:'auto'}},
  beige:{name:'Bege',group:'Cores sólidas',preview:'#e7d5bd',css:{color:'#e7d5bd',image:'linear-gradient(rgba(255,255,255,.12),rgba(255,255,255,.12))',size:'auto'}},
  bright:{name:'Brilho',group:'Brilho',preview:'radial-gradient(circle at 30% 25%,#ff6b70 0 16%,transparent 17%),radial-gradient(circle at 70% 70%,#62d2c2 0 19%,transparent 20%),#6547c5',css:{color:'#33256e',image:'radial-gradient(circle at 8% 18%,rgba(255,87,99,.78) 0 7%,transparent 8%),radial-gradient(circle at 28% 78%,rgba(255,207,68,.72) 0 8%,transparent 9%),radial-gradient(circle at 58% 25%,rgba(78,217,198,.68) 0 8%,transparent 9%),radial-gradient(circle at 82% 73%,rgba(239,84,193,.62) 0 9%,transparent 10%),linear-gradient(145deg,#40309b,#6a4fd2 52%,#3aa8b2)',size:'220px 220px'}},
  geometric:{name:'Geométrico',group:'Padrões',preview:'linear-gradient(30deg,#ded7c4 12%,transparent 12.5%,transparent 87%,#ded7c4 87.5%),#f5f0e3',css:{color:'#ece5d3',image:'linear-gradient(30deg,rgba(255,255,255,.32) 12%,transparent 12.5%,transparent 87%,rgba(255,255,255,.32) 87.5%),linear-gradient(150deg,rgba(117,102,83,.11) 12%,transparent 12.5%,transparent 87%,rgba(117,102,83,.11) 87.5%),linear-gradient(30deg,rgba(117,102,83,.08) 12%,transparent 12.5%,transparent 87%,rgba(117,102,83,.08) 87.5%)',size:'74px 128px'}},
  hearts:{name:'Corações pastel',group:'Padrões',preview:'linear-gradient(135deg,#fbe1eb,#e1e8ff 46%,#ddf2e4)',css:{color:'#f7eef5',image:`url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="170" height="140" viewBox="0 0 170 140"><g fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".34" stroke-width="4"><path stroke="#e8a8c5" d="M30 39c-16-12-31 11-4 31 27-20 12-43 4-31Z"/><path stroke="#a8c8e8" d="M116 23c-15-11-29 10-4 29 25-19 11-40 4-29Z"/><path stroke="#b8a7df" d="M86 91c-14-10-27 9-4 27 23-18 10-37 4-27Z"/><path stroke="#acd7b5" d="M145 105c-12-9-24 8-3 24 20-16 9-33 3-24Z"/><path stroke="#e7cd7c" d="M35 111c-11-8-22 7-3 22 19-15 8-30 3-22Z"/></g></svg>`) }")`,size:'170px 140px'}},
  custom:{name:'Minha foto',group:'Sua imagem',preview:'linear-gradient(135deg,#efe7f7,#ffe4ee)',css:null}
}

function profileId(){
  return String($('myName')?.textContent||'familia').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_-]+/g,'-')||'familia'
}
function storageKey(){return `isa-general-settings-v2:${profileId()}`}
function defaults(){return{wallpaper:'default',fontScale:1,reduceMotion:false}}
function readSettings(){try{return{...defaults(),...JSON.parse(localStorage.getItem(storageKey())||'{}')}}catch{return defaults()}}
function writeSettings(v){localStorage.setItem(storageKey(),JSON.stringify(v))}
let settings=readSettings(),customData=''

function toast(text){const t=$('toast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._generalSettings);t._generalSettings=setTimeout(()=>t.classList.add('hidden'),3000)}

const DB_NAME='cantinho-isa-preferences',STORE='wallpapers'
function openDb(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE)};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function getCustom(){try{const db=await openDb();return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),r=tx.objectStore(STORE).get(profileId());r.onsuccess=()=>resolve(r.result||'');r.onerror=()=>reject(r.error)})}catch{return''}}
async function setCustom(data){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(data,profileId());tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}
async function deleteCustom(){try{const db=await openDb();await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(profileId());tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}catch{}}

const css=document.createElement('style');css.id='generalSettingsStyles';css.textContent=`
#generalSettingsPanel{position:fixed;inset:0;z-index:140000;background:rgba(28,20,38,.48);backdrop-filter:blur(12px);display:grid;place-items:center;padding:18px;font-family:Inter,"Segoe UI",system-ui,sans-serif}#generalSettingsPanel.hidden{display:none!important}.general-settings-card{width:min(780px,96vw);max-height:92vh;overflow:auto;border-radius:28px;background:#fffafc;color:#5d4e66;border:1px solid rgba(255,255,255,.96);box-shadow:0 24px 80px rgba(62,38,76,.24);padding:20px}.general-settings-head{display:flex;align-items:center;gap:12px;position:sticky;top:-20px;background:#fffafcee;padding:6px 0 12px;z-index:2;backdrop-filter:blur(8px)}.general-settings-head>div{flex:1}.general-settings-head h2{margin:0 0 3px;font-size:22px}.general-settings-head p{margin:0;color:#8b7c91;font-size:12px}.general-settings-close{border:0;width:38px;height:38px;border-radius:12px;background:#f0e8f5;color:#684f78;font-weight:900}.gs-section{padding:15px 0;border-top:1px solid #eee5f2}.gs-section:first-of-type{border-top:0}.gs-section h3{margin:0 0 4px;font-size:16px}.gs-section>p{margin:0 0 12px;color:#8b7c91;font-size:12px}.gs-wallpapers{display:grid;grid-template-columns:repeat(5,minmax(92px,1fr));gap:10px}.gs-wallpaper{border:2px solid transparent;border-radius:17px;background:#fff;padding:6px;text-align:left;box-shadow:0 6px 18px rgba(85,65,100,.07)}.gs-wallpaper.active{border-color:#b396d1;box-shadow:0 0 0 3px rgba(188,158,216,.15)}.gs-wallpaper-preview{display:block;width:100%;aspect-ratio:.82;border-radius:12px;background-size:cover;background-position:center;border:1px solid rgba(75,55,90,.08)}.gs-wallpaper-name{display:block;font-size:10px;font-weight:900;margin:6px 3px 2px}.gs-wallpaper-group{display:block;font-size:8px;color:#98899f;margin:0 3px 3px}.gs-upload-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:12px}.gs-btn{border:0;border-radius:13px;padding:10px 13px;background:#eee5ff;color:#65527a;font-weight:900}.gs-btn.primary{background:linear-gradient(135deg,#a98acb,#d59dbb);color:white}.gs-btn.danger{background:#ffe8ee;color:#a45169}.gs-file{display:none}.gs-setting-row{display:flex;align-items:center;gap:12px;padding:10px 0}.gs-setting-row>div{flex:1}.gs-setting-row strong{display:block;font-size:13px}.gs-setting-row small{display:block;color:#93839a;font-size:10px;margin-top:2px}.gs-size-options{display:flex;gap:6px}.gs-size-options button{border:1px solid #e6dbea;border-radius:11px;background:#fff;padding:8px 11px;font-weight:900}.gs-size-options button.active{background:#e9ddfb;border-color:#c0a6df}.gs-switch{position:relative;width:48px;height:28px}.gs-switch input{opacity:0;width:1px;height:1px;position:absolute}.gs-switch span{position:absolute;inset:0;border-radius:999px;background:#ddd1e3;transition:.2s}.gs-switch span:after{content:'';position:absolute;width:22px;height:22px;border-radius:50%;left:3px;top:3px;background:#fff;box-shadow:0 2px 8px #0002;transition:.2s}.gs-switch input:checked+span{background:#ad8dcc}.gs-switch input:checked+span:after{transform:translateX(20px)}
html[data-isa-font-scale="90"] #messages .bubble,html[data-isa-font-scale="90"] #messageInput{font-size:90%}html[data-isa-font-scale="115"] #messages .bubble,html[data-isa-font-scale="115"] #messageInput{font-size:115%}html[data-isa-reduce-motion="1"] *,html[data-isa-reduce-motion="1"] *:before,html[data-isa-reduce-motion="1"] *:after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}
@media(max-width:850px){.general-settings-card{width:100%;height:min(92dvh,760px);max-height:92dvh;border-radius:24px 24px 18px 18px;padding:15px}.general-settings-head{top:-15px}.gs-wallpapers{grid-template-columns:repeat(3,minmax(82px,1fr));gap:8px}.gs-setting-row{align-items:flex-start}.gs-size-options button{padding:7px 9px}}
@media(max-width:390px){.gs-wallpapers{grid-template-columns:repeat(2,minmax(90px,1fr))}}
`;document.head.appendChild(css)

function applyWallpaper(){
  const box=$('messages');if(!box)return
  box.style.removeProperty('background');box.style.removeProperty('background-color');box.style.removeProperty('background-image');box.style.removeProperty('background-size');box.style.removeProperty('background-position');box.style.removeProperty('background-repeat');box.style.removeProperty('background-attachment')
  const id=settings.wallpaper||'default',p=PRESETS[id]||PRESETS.default
  if(id==='default')return
  if(id==='custom'){
    if(customData){box.style.setProperty('background-color','#eee8ef','important');box.style.setProperty('background-image',`linear-gradient(rgba(255,255,255,.08),rgba(255,255,255,.08)),url("${customData}")`,'important');box.style.setProperty('background-size','cover','important');box.style.setProperty('background-position','center','important');box.style.setProperty('background-repeat','no-repeat','important');box.style.setProperty('background-attachment','local','important')}
    return
  }
  if(p.css){box.style.setProperty('background-color',p.css.color,'important');box.style.setProperty('background-image',p.css.image,'important');box.style.setProperty('background-size',p.css.size||'auto','important');box.style.setProperty('background-position','center','important')}
}
function applySettings(){
  document.documentElement.dataset.isaFontScale=settings.fontScale===.9?'90':settings.fontScale===1.15?'115':'100'
  document.documentElement.dataset.isaReduceMotion=settings.reduceMotion?'1':'0'
  applyWallpaper();renderSelection()
}

function wallpaperButtons(){return Object.entries(PRESETS).map(([id,p])=>`<button class="gs-wallpaper" type="button" data-gs-wallpaper="${id}"><span class="gs-wallpaper-preview" style="background:${p.preview}"></span><span class="gs-wallpaper-name">${p.name}</span><span class="gs-wallpaper-group">${p.group}</span></button>`).join('')}
function build(){
  if($('generalSettingsPanel'))return
  const panel=document.createElement('section');panel.id='generalSettingsPanel';panel.className='hidden';panel.setAttribute('aria-hidden','true');panel.innerHTML=`<div class="general-settings-card"><div class="general-settings-head"><div><h2>⚙️ Configurações Gerais</h2><p>Personalize o seu Cantinho neste aparelho.</p></div><button id="generalSettingsClose" class="general-settings-close" type="button" aria-label="Fechar">✕</button></div><section class="gs-section"><h3>💬 Fundo do chat</h3><p>Escolha um fundo do próprio Cantinho ou use uma foto sua. A escolha é individual para cada perfil neste aparelho.</p><div class="gs-wallpapers">${wallpaperButtons()}</div><div class="gs-upload-row"><label class="gs-btn primary" for="generalWallpaperUpload">🖼️ Escolher foto do aparelho</label><input id="generalWallpaperUpload" class="gs-file" type="file" accept="image/jpeg,image/png,image/webp"><button id="generalWallpaperRemove" class="gs-btn danger" type="button">Remover foto enviada</button></div></section><section class="gs-section"><h3>🔤 Texto e movimento</h3><div class="gs-setting-row"><div><strong>Tamanho das mensagens</strong><small>Ajuste sem alterar o restante do aplicativo.</small></div><div class="gs-size-options"><button type="button" data-gs-size=".9">A−</button><button type="button" data-gs-size="1">A</button><button type="button" data-gs-size="1.15">A＋</button></div></div><div class="gs-setting-row"><div><strong>Reduzir animações</strong><small>Deixa transições mais discretas.</small></div><label class="gs-switch"><input id="generalReduceMotion" type="checkbox"><span></span></label></div></section><section class="gs-section"><button id="generalSettingsReset" class="gs-btn" type="button">↺ Restaurar configurações padrão</button></section></div>`;document.body.appendChild(panel)
  $('generalSettingsClose').onclick=close
  panel.addEventListener('click',e=>{if(e.target===panel)close()})
  panel.addEventListener('keydown',e=>{if(e.key==='Escape')close()})
  panel.querySelectorAll('[data-gs-wallpaper]').forEach(b=>b.onclick=async()=>{const id=b.dataset.gsWallpaper;if(id==='custom'&&!customData){$('generalWallpaperUpload').click();return}settings.wallpaper=id;writeSettings(settings);applySettings();toast(`Fundo ${PRESETS[id].name} aplicado ✨`)})
  panel.querySelectorAll('[data-gs-size]').forEach(b=>b.onclick=()=>{settings.fontScale=Number(b.dataset.gsSize);writeSettings(settings);applySettings()})
  $('generalReduceMotion').onchange=e=>{settings.reduceMotion=!!e.target.checked;writeSettings(settings);applySettings()}
  $('generalWallpaperUpload').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{customData=await compressImage(file);await setCustom(customData);settings.wallpaper='custom';writeSettings(settings);applySettings();toast('Sua foto foi aplicada ao fundo do chat 💕')}catch(err){console.error(err);toast('Não foi possível usar essa imagem. Tente JPG, PNG ou WebP.')}finally{e.target.value=''}}
  $('generalWallpaperRemove').onclick=async()=>{customData='';await deleteCustom();if(settings.wallpaper==='custom')settings.wallpaper='default';writeSettings(settings);applySettings();toast('Foto enviada removida.')}
  $('generalSettingsReset').onclick=()=>{settings=defaults();writeSettings(settings);applySettings();toast('Configurações padrão restauradas.')}
}
function renderSelection(){const panel=$('generalSettingsPanel');if(!panel)return;panel.querySelectorAll('[data-gs-wallpaper]').forEach(b=>b.classList.toggle('active',b.dataset.gsWallpaper===settings.wallpaper));panel.querySelectorAll('[data-gs-size]').forEach(b=>b.classList.toggle('active',Number(b.dataset.gsSize)===settings.fontScale));if($('generalReduceMotion'))$('generalReduceMotion').checked=!!settings.reduceMotion;const c=panel.querySelector('[data-gs-wallpaper="custom"] .gs-wallpaper-preview');if(c&&customData)c.style.background=`linear-gradient(rgba(255,255,255,.10),rgba(255,255,255,.10)),url("${customData}") center/cover`}
function open(){build();settings=readSettings();applySettings();const p=$('generalSettingsPanel');p.classList.remove('hidden');p.setAttribute('aria-hidden','false')}
function close(){const p=$('generalSettingsPanel');p?.classList.add('hidden');p?.setAttribute('aria-hidden','true')}

function bindExistingSettingsButton(){
  // O Cantinho já possui um botão de Configurações junto aos demais controles.
  // Este módulo só fornece o painel: não cria atalhos abaixo de Sair nem sobre as conversas.
  $('generalSettingsNav')?.remove();$('generalSettingsFab')?.remove();
  const nodes=[...document.querySelectorAll('button,a,[role="button"]')];
  const btn=nodes.find(el=>{
    if(el.closest('#generalSettingsPanel'))return false;
    if(el.id==='accessSettingsNav'||el.id==='logoutBtn')return false;
    const label=`${el.textContent||''} ${el.title||''} ${el.getAttribute('aria-label')||''}`.toLowerCase();
    return /configura(c|ç)(a|ã)o|configura(c|ç)(o|õ)es|settings/.test(label);
  });
  if(btn&&btn.dataset.generalSettingsBound!=='1'){
    btn.dataset.generalSettingsBound='1';
    btn.addEventListener('click',e=>{e.preventDefault();open()});
  }
}

async function compressImage(file){
  if(file.size>18*1024*1024)throw new Error('Imagem muito grande')
  const url=URL.createObjectURL(file)
  try{
    const img=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=url})
    const max=1600,ratio=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)),w=Math.max(1,Math.round(img.naturalWidth*ratio)),h=Math.max(1,Math.round(img.naturalHeight*ratio)),canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='#f3edf4';ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);return canvas.toDataURL('image/jpeg',.82)
  }finally{URL.revokeObjectURL(url)}
}

async function boot(){
  build();bindExistingSettingsButton();customData=await getCustom();settings=readSettings();applySettings();
  let tries=0;const timer=setInterval(()=>{bindExistingSettingsButton();applyWallpaper();if(++tries>40)clearInterval(timer)},250)
  const obs=new MutationObserver(()=>{bindExistingSettingsButton();if($('messages'))applyWallpaper()});obs.observe(document.getElementById('mainView')||document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']})
  window.__ISA_OPEN_GENERAL_SETTINGS__=open
}

boot().catch(console.error)
