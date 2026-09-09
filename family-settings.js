// Configurações dos acessos pessoais da família.
// Um único botão de engrenagem no menu principal; nunca sobre a conversa.
const $=id=>document.getElementById(id)
const PALETTES={
  default:{label:'Padrão',bg:''},
  pink:{label:'Rosa',bg:'linear-gradient(145deg,#fff4f7,#f7cbd9)'},
  blue:{label:'Azul',bg:'linear-gradient(145deg,#f4faff,#cfe7f8)'},
  lilac:{label:'Lilás',bg:'linear-gradient(145deg,#fbf7ff,#ddcff5)'},
  yellow:{label:'Amarelo',bg:'linear-gradient(145deg,#fffdf2,#f8e7ad)'},
  green:{label:'Verde',bg:'linear-gradient(145deg,#f7fff8,#cfeacf)'},
  pastel:{label:'Pastel',bg:'radial-gradient(circle at 12% 18%,rgba(244,181,205,.55) 0 10%,transparent 11%),radial-gradient(circle at 82% 16%,rgba(177,211,244,.55) 0 12%,transparent 13%),radial-gradient(circle at 25% 80%,rgba(193,226,194,.55) 0 11%,transparent 12%),radial-gradient(circle at 78% 76%,rgba(211,190,240,.52) 0 12%,transparent 13%),linear-gradient(145deg,#fffafc,#fff9e9)'},
  hearts:{label:'Corações',bg:'radial-gradient(circle at 18% 22%,rgba(245,180,205,.35) 0 7%,transparent 8%),radial-gradient(circle at 76% 30%,rgba(180,205,242,.34) 0 8%,transparent 9%),radial-gradient(circle at 42% 72%,rgba(201,181,235,.34) 0 8%,transparent 9%),linear-gradient(145deg,#fffafd,#f7f2ff)'},
  dots:{label:'Poá',bg:'radial-gradient(circle,rgba(179,150,215,.22) 0 4px,transparent 5px),radial-gradient(circle,rgba(239,165,199,.20) 0 4px,transparent 5px),linear-gradient(145deg,#fffafd,#f4f5ff);background-size:34px 34px,34px 34px,auto;background-position:0 0,17px 17px,0 0'},
  clouds:{label:'Nuvens',bg:'radial-gradient(ellipse at 18% 20%,rgba(255,255,255,.95) 0 8%,transparent 9%),radial-gradient(ellipse at 70% 32%,rgba(255,255,255,.92) 0 10%,transparent 11%),radial-gradient(ellipse at 35% 72%,rgba(255,255,255,.9) 0 9%,transparent 10%),linear-gradient(145deg,#e9f5ff,#eee7ff)'},
  flowers:{label:'Flores',bg:'radial-gradient(circle at 15% 20%,#ffd7e7 0 4px,#fff4f8 5px 8px,transparent 9px),radial-gradient(circle at 72% 28%,#d9cdf8 0 4px,#f5f0ff 5px 8px,transparent 9px),radial-gradient(circle at 42% 75%,#d8efd8 0 4px,#f3fff4 5px 8px,transparent 9px),linear-gradient(145deg,#fffdf8,#fff5fb)'}
}
const FONTS={
  modern:{label:'Moderna',css:'Inter,"Segoe UI",system-ui,sans-serif'},
  playful:{label:'Lúdica',css:'"Comic Sans MS","Trebuchet MS",cursive'},
  rounded:{label:'Redonda',css:'"Arial Rounded MT Bold","Trebuchet MS",sans-serif'},
  soft:{label:'Suave',css:'"Trebuchet MS","Segoe UI",sans-serif'},
  serious:{label:'Séria',css:'Georgia,"Times New Roman",serif'}
}
function profileKey(){
  const name=String($('friendName')?.textContent||'familia').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_-]+/g,'-')||'familia'
  return `isa-family-settings-v2:${name}`
}
function legacyKey(){return profileKey().replace('v2:','v1:')}
function read(){
  try{
    const current=JSON.parse(localStorage.getItem(profileKey())||'null')
    if(current)return{wallpaper:'default',fontSize:1,fontFace:'modern',reduce:false,...current}
    const old=JSON.parse(localStorage.getItem(legacyKey())||'null')||{}
    return{wallpaper:old.wallpaper||'default',fontSize:Number(old.font||1),fontFace:'modern',reduce:!!old.reduce}
  }catch{return{wallpaper:'default',fontSize:1,fontFace:'modern',reduce:false}}
}
function save(v){try{localStorage.setItem(profileKey(),JSON.stringify(v))}catch{}}
let state=read(),customWallpaperUrl=''

function dbOpen(){return new Promise((resolve,reject)=>{const r=indexedDB.open('cantinho-isa-family-preferences',1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('wallpapers'))r.result.createObjectStore('wallpapers')};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function customGet(){try{const db=await dbOpen();return await new Promise((resolve,reject)=>{const r=db.transaction('wallpapers','readonly').objectStore('wallpapers').get(profileKey());r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error)})}catch{return null}}
async function customPut(file){const db=await dbOpen();await new Promise((resolve,reject)=>{const r=db.transaction('wallpapers','readwrite').objectStore('wallpapers').put(file,profileKey());r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error)})}
async function customDelete(){try{const db=await dbOpen();await new Promise((resolve,reject)=>{const r=db.transaction('wallpapers','readwrite').objectStore('wallpapers').delete(profileKey());r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error)})}catch{}}
function setCustomUrl(blob){if(customWallpaperUrl)URL.revokeObjectURL(customWallpaperUrl);customWallpaperUrl=blob?URL.createObjectURL(blob):'';return customWallpaperUrl}

function addStyle(){
  if($('familySettingsStyle'))return
  const s=document.createElement('style');s.id='familySettingsStyle';s.textContent=`
.friend-settings-menu{flex:0 0 42px;width:42px;height:42px;border:1px solid rgba(167,131,188,.18);border-radius:14px;padding:0;background:linear-gradient(145deg,#fff,#eee6ff);color:#65546f;font-weight:900;font-size:20px;line-height:1;box-shadow:0 5px 0 rgba(183,160,209,.18);cursor:pointer;display:inline-grid!important;place-items:center;visibility:visible!important;opacity:1!important}.friend-settings-menu:active{transform:translateY(2px);box-shadow:0 3px 0 rgba(183,160,209,.18)}.friend-settings-menu span{display:none!important}.friend-profile>div:nth-child(2){min-width:0;flex:1}
#familySettingsPanel{position:fixed;inset:0;z-index:150000;display:grid;place-items:center;padding:16px;background:rgba(42,29,51,.38);backdrop-filter:blur(10px);pointer-events:auto}#familySettingsPanel.hidden{display:none!important;pointer-events:none!important}.fsp-card{width:min(680px,96vw);max-height:90dvh;overflow:auto;border-radius:26px;background:#fffafd;color:#5d4e66;padding:18px;border:1px solid #fff;box-shadow:0 25px 80px #49375433}.fsp-head{display:flex;align-items:center;gap:10px}.fsp-head>div{flex:1}.fsp-head h2{margin:0;font-size:20px}.fsp-head p{margin:3px 0 0;color:#8e8096;font-size:11px}.fsp-close{width:38px;height:38px;border:0;border-radius:12px;background:#f1e9f6;color:#675272;font-size:18px}.fsp-section{padding:14px 0;border-top:1px solid #eee5f2}.fsp-section h3{margin:0 0 4px;font-size:15px}.fsp-section p{margin:0 0 10px;color:#8e8096;font-size:11px}.fsp-grid{display:grid;grid-template-columns:repeat(5,minmax(72px,1fr));gap:8px}.fsp-bg{border:2px solid transparent;border-radius:15px;background:#fff;padding:5px;box-shadow:0 5px 15px #6d55751a}.fsp-bg.active{border-color:#b69bd2}.fsp-preview{display:block;aspect-ratio:1.15;border-radius:10px;border:1px solid #0000000d;background-size:cover!important;background-position:center!important}.fsp-bg small{display:block;margin:5px 2px 2px;font-weight:850;color:#685675}.fsp-row{display:flex;align-items:center;gap:10px;padding:7px 0}.fsp-row>div:first-child{flex:1}.fsp-buttons{display:flex;gap:6px;flex-wrap:wrap}.fsp-buttons button{border:1px solid #e4d9e9;border-radius:10px;background:#fff;padding:8px 10px;font-weight:900;color:#65546f}.fsp-buttons button.active{background:#eadffc}.fsp-upload{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.fsp-upload label,.fsp-upload button{border:1px solid #e4d9e9;border-radius:12px;background:#fff;padding:9px 11px;font-weight:900;color:#65546f;cursor:pointer}.fsp-upload input{display:none}.fsp-toggle{width:48px;height:28px}.fsp-toggle input{width:20px;height:20px;accent-color:#a887c8}.friend-settings-reduce *{animation-duration:.001ms!important;transition-duration:.001ms!important}
@media(min-width:781px){.fsp-card{width:min(700px,90vw)}}
@media(max-width:780px){.fsp-card{width:100%;max-height:92dvh;border-radius:22px 22px 14px 14px}.fsp-grid{grid-template-columns:repeat(3,minmax(72px,1fr))}.fsp-row{align-items:flex-start;flex-direction:column}.fsp-row>div:first-child{width:100%}}
`;document.head.appendChild(s)
}
async function apply(){
  const box=$('friendMessages')
  if(box){
    box.style.removeProperty('background');box.style.removeProperty('background-image');box.style.removeProperty('background-color');box.style.removeProperty('background-size');box.style.removeProperty('background-position')
    if(state.wallpaper==='custom'){
      let blob=await customGet();if(blob){const url=setCustomUrl(blob);box.style.setProperty('background-image',`linear-gradient(rgba(255,255,255,.15),rgba(255,255,255,.15)),url("${url}")`,'important');box.style.setProperty('background-size','cover','important');box.style.setProperty('background-position','center','important')}
    }else{
      const p=PALETTES[state.wallpaper]||PALETTES.default
      if(p.bg){const parts=p.bg.split(';');box.style.setProperty('background',parts[0],'important');for(const x of parts.slice(1)){const [k,...v]=x.split(':');if(k&&v.length)box.style.setProperty(k.trim(),v.join(':').trim(),'important')}}
    }
    const ff=FONTS[state.fontFace]?.css||FONTS.modern.css
    box.style.setProperty('font-family',ff,'important')
    box.style.setProperty('font-size',`${state.fontSize||1}em`,'important')
  }
  const input=$('friendMessageInput');if(input){input.style.setProperty('font-family',FONTS[state.fontFace]?.css||FONTS.modern.css,'important');input.style.setProperty('font-size',`${state.fontSize||1}em`,'important')}
  document.body.classList.toggle('friend-settings-reduce',!!state.reduce)
  document.querySelectorAll('[data-fsp-bg]').forEach(b=>b.classList.toggle('active',b.dataset.fspBg===state.wallpaper))
  document.querySelectorAll('[data-fsp-size]').forEach(b=>b.classList.toggle('active',Number(b.dataset.fspSize)===Number(state.fontSize)))
  document.querySelectorAll('[data-fsp-face]').forEach(b=>b.classList.toggle('active',b.dataset.fspFace===state.fontFace))
  const r=$('fspReduce');if(r)r.checked=!!state.reduce
}
function buildPanel(){
  if($('familySettingsPanel'))return
  const panel=document.createElement('section');panel.id='familySettingsPanel';panel.className='hidden';panel.innerHTML=`<div class="fsp-card"><div class="fsp-head"><div><h2>⚙️ Configurações</h2><p>Personalize seu Cantinho neste aparelho.</p></div><button id="fspClose" class="fsp-close" type="button">✕</button></div><section class="fsp-section"><h3>💬 Fundo da conversa</h3><p>Cores pastéis, estampas ou uma imagem sua.</p><div class="fsp-grid">${Object.entries(PALETTES).map(([id,p])=>`<button class="fsp-bg" data-fsp-bg="${id}" type="button"><span class="fsp-preview" style="background:${p.bg||'linear-gradient(145deg,#fffdfd,#f9f5ff)'}"></span><small>${p.label}</small></button>`).join('')}<button class="fsp-bg" data-fsp-bg="custom" type="button"><span id="fspCustomPreview" class="fsp-preview" style="background:linear-gradient(145deg,#eee7ff,#ffe8f2)"></span><small>Minha imagem</small></button></div><div class="fsp-upload"><label>🖼️ Fazer upload<input id="fspWallpaperInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif"></label><button id="fspWallpaperRemove" type="button">Remover imagem</button></div></section><section class="fsp-section"><h3>🔤 Tipografia da conversa</h3><p>Escolha entre estilos mais lúdicos, suaves ou sérios.</p><div class="fsp-row"><div>Estilo</div><div class="fsp-buttons">${Object.entries(FONTS).map(([id,f])=>`<button data-fsp-face="${id}" type="button" style="font-family:${f.css}">${f.label}</button>`).join('')}</div></div><div class="fsp-row"><div>Tamanho</div><div class="fsp-buttons"><button data-fsp-size=".9" type="button">A−</button><button data-fsp-size="1" type="button">A</button><button data-fsp-size="1.15" type="button">A＋</button></div></div><div class="fsp-row"><div>Reduzir animações</div><label class="fsp-toggle"><input id="fspReduce" type="checkbox"></label></div></section></div>`
  document.body.appendChild(panel)
  $('fspClose').onclick=()=>panel.classList.add('hidden')
  panel.onclick=e=>{if(e.target===panel)panel.classList.add('hidden')}
  panel.querySelectorAll('[data-fsp-bg]').forEach(b=>b.onclick=()=>{if(b.dataset.fspBg==='custom'&&!customWallpaperUrl)return $('fspWallpaperInput').click();state.wallpaper=b.dataset.fspBg;save(state);apply()})
  panel.querySelectorAll('[data-fsp-size]').forEach(b=>b.onclick=()=>{state.fontSize=Number(b.dataset.fspSize);save(state);apply()})
  panel.querySelectorAll('[data-fsp-face]').forEach(b=>b.onclick=()=>{state.fontFace=b.dataset.fspFace;save(state);apply()})
  $('fspReduce').onchange=e=>{state.reduce=!!e.target.checked;save(state);apply()}
  $('fspWallpaperInput').onchange=async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;if(!file.type.startsWith('image/'))return;if(file.size>8*1024*1024)return alert('Escolha uma imagem de até 8 MB.');await customPut(file);const url=setCustomUrl(file);$('fspCustomPreview').style.backgroundImage=`url("${url}")`;state.wallpaper='custom';save(state);apply()}
  $('fspWallpaperRemove').onclick=async()=>{await customDelete();setCustomUrl(null);$('fspCustomPreview').style.backgroundImage='';if(state.wallpaper==='custom')state.wallpaper='default';save(state);apply()}
  customGet().then(blob=>{if(blob){const url=setCustomUrl(blob);const p=$('fspCustomPreview');if(p)p.style.backgroundImage=`url("${url}")`}})
}
function ensureButton(){
  const menu=document.querySelector('.family-primary-nav'),fallback=document.querySelector('.friend-profile'),host=menu||fallback;if(!host)return null
  const duplicates=[...document.querySelectorAll('#friendSettingsBtn')]
  let b=duplicates[0]||null;duplicates.slice(1).forEach(x=>x.remove())
  if(!b){b=document.createElement('button');b.id='friendSettingsBtn';b.type='button';host.appendChild(b)}
  if(b.parentNode!==host)host.appendChild(b)
  b.classList.add('friend-settings-menu');if(menu)b.classList.add('family-primary-tab','icon-only')
  b.classList.remove('hidden');b.type='button';b.title='Configurações';b.setAttribute('aria-label','Configurações');if(b.textContent!=='⚙️')b.textContent='⚙️';b.style.removeProperty('display');b.style.removeProperty('visibility');b.style.removeProperty('opacity')
  if(b.dataset.familySettingsBound!=='1'){b.dataset.familySettingsBound='1';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();buildPanel();state=read();apply();$('familySettingsPanel').classList.remove('hidden')})}
  return b
}
function boot(){
  addStyle();buildPanel();ensureButton();state=read();apply()
  let n=0;const t=setInterval(()=>{ensureButton();if(++n>30)clearInterval(t)},300)
  window.__ISA_ENSURE_FAMILY_SETTINGS__=ensureButton
}
boot()
