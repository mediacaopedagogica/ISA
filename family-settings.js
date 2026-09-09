// Configurações dos acessos pessoais da família.
// Um único botão no cabeçalho/menu lateral; nunca sobre a conversa.
const $=id=>document.getElementById(id)
const PALETTES={
  default:{label:'Padrão',bg:''},
  pink:{label:'Rosa',bg:'linear-gradient(145deg,#fff4f7,#f7cbd9)'},
  blue:{label:'Azul',bg:'linear-gradient(145deg,#f4faff,#cfe7f8)'},
  lilac:{label:'Lilás',bg:'linear-gradient(145deg,#fbf7ff,#ddcff5)'},
  yellow:{label:'Amarelo',bg:'linear-gradient(145deg,#fffdf2,#f8e7ad)'},
  green:{label:'Verde',bg:'linear-gradient(145deg,#f7fff8,#cfeacf)'},
  pastel:{label:'Pastel',bg:'radial-gradient(circle at 12% 18%,rgba(244,181,205,.55) 0 10%,transparent 11%),radial-gradient(circle at 82% 16%,rgba(177,211,244,.55) 0 12%,transparent 13%),radial-gradient(circle at 25% 80%,rgba(193,226,194,.55) 0 11%,transparent 12%),radial-gradient(circle at 78% 76%,rgba(211,190,240,.52) 0 12%,transparent 13%),linear-gradient(145deg,#fffafc,#fff9e9)'},
  hearts:{label:'Corações',bg:'radial-gradient(circle at 18% 22%,rgba(245,180,205,.35) 0 7%,transparent 8%),radial-gradient(circle at 76% 30%,rgba(180,205,242,.34) 0 8%,transparent 9%),radial-gradient(circle at 42% 72%,rgba(201,181,235,.34) 0 8%,transparent 9%),linear-gradient(145deg,#fffafd,#f7f2ff)'}
}
function profileKey(){
  const name=String($('friendName')?.textContent||'familia').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_-]+/g,'-')||'familia'
  return `isa-family-settings-v1:${name}`
}
function read(){try{return{wallpaper:'default',font:1,reduce:false,...JSON.parse(localStorage.getItem(profileKey())||'{}')}}catch{return{wallpaper:'default',font:1,reduce:false}}}
function save(v){try{localStorage.setItem(profileKey(),JSON.stringify(v))}catch{}}
let state=read()

function addStyle(){
  if($('familySettingsStyle'))return
  const s=document.createElement('style');s.id='familySettingsStyle';s.textContent=`
.friend-settings-menu{margin-left:auto;flex:0 0 auto;border:1px solid rgba(167,131,188,.18);border-radius:14px;padding:9px 11px;background:linear-gradient(145deg,#fff,#eee6ff);color:#65546f;font-weight:900;box-shadow:0 5px 0 rgba(183,160,209,.18);cursor:pointer;display:inline-flex;align-items:center;gap:6px}.friend-settings-menu:active{transform:translateY(2px);box-shadow:0 3px 0 rgba(183,160,209,.18)}.friend-settings-menu span{font-size:.76rem}.friend-profile>div:nth-child(2){min-width:0;flex:1}
#familySettingsPanel{position:fixed;inset:0;z-index:150000;display:grid;place-items:center;padding:16px;background:rgba(42,29,51,.38);backdrop-filter:blur(10px)}#familySettingsPanel.hidden{display:none!important}.fsp-card{width:min(620px,96vw);max-height:90dvh;overflow:auto;border-radius:26px;background:#fffafd;color:#5d4e66;padding:18px;border:1px solid #fff;box-shadow:0 25px 80px #49375433}.fsp-head{display:flex;align-items:center;gap:10px}.fsp-head>div{flex:1}.fsp-head h2{margin:0;font-size:20px}.fsp-head p{margin:3px 0 0;color:#8e8096;font-size:11px}.fsp-close{width:38px;height:38px;border:0;border-radius:12px;background:#f1e9f6;color:#675272;font-size:18px}.fsp-section{padding:14px 0;border-top:1px solid #eee5f2}.fsp-section h3{margin:0 0 4px;font-size:15px}.fsp-section p{margin:0 0 10px;color:#8e8096;font-size:11px}.fsp-grid{display:grid;grid-template-columns:repeat(4,minmax(72px,1fr));gap:8px}.fsp-bg{border:2px solid transparent;border-radius:15px;background:#fff;padding:5px;box-shadow:0 5px 15px #6d55751a}.fsp-bg.active{border-color:#b69bd2}.fsp-preview{display:block;aspect-ratio:1.15;border-radius:10px;border:1px solid #0000000d}.fsp-bg small{display:block;margin:5px 2px 2px;font-weight:850;color:#685675}.fsp-row{display:flex;align-items:center;gap:10px;padding:7px 0}.fsp-row>div{flex:1}.fsp-buttons{display:flex;gap:6px}.fsp-buttons button{border:1px solid #e4d9e9;border-radius:10px;background:#fff;padding:8px 10px;font-weight:900}.fsp-buttons button.active{background:#eadffc}.fsp-toggle{width:48px;height:28px}.fsp-toggle input{width:20px;height:20px;accent-color:#a887c8}.friend-settings-font-small .friend-bubble,.friend-settings-font-small #friendMessageInput{font-size:90%!important}.friend-settings-font-large .friend-bubble,.friend-settings-font-large #friendMessageInput{font-size:115%!important}.friend-settings-reduce *{animation-duration:.001ms!important;transition-duration:.001ms!important}
@media(max-width:480px){.friend-settings-menu{width:42px;height:42px;padding:8px;justify-content:center}.friend-settings-menu span{display:none}.fsp-card{width:100%;max-height:92dvh;border-radius:22px 22px 14px 14px}.fsp-grid{grid-template-columns:repeat(3,minmax(72px,1fr))}}
`;document.head.appendChild(s)
}
function apply(){
  const box=$('friendMessages')
  if(box){
    box.style.removeProperty('background');box.style.removeProperty('background-image');box.style.removeProperty('background-color')
    const p=PALETTES[state.wallpaper]||PALETTES.default
    if(p.bg)box.style.setProperty('background',p.bg,'important')
  }
  document.body.classList.toggle('friend-settings-font-small',state.font===.9)
  document.body.classList.toggle('friend-settings-font-large',state.font===1.15)
  document.body.classList.toggle('friend-settings-reduce',!!state.reduce)
  document.querySelectorAll('[data-fsp-bg]').forEach(b=>b.classList.toggle('active',b.dataset.fspBg===state.wallpaper))
  document.querySelectorAll('[data-fsp-font]').forEach(b=>b.classList.toggle('active',Number(b.dataset.fspFont)===state.font))
  const r=$('fspReduce');if(r)r.checked=!!state.reduce
}
function buildPanel(){
  if($('familySettingsPanel'))return
  const panel=document.createElement('section');panel.id='familySettingsPanel';panel.className='hidden';panel.innerHTML=`<div class="fsp-card"><div class="fsp-head"><div><h2>⚙️ Configurações</h2><p>Personalize este acesso do Cantinho.</p></div><button id="fspClose" class="fsp-close" type="button">✕</button></div><section class="fsp-section"><h3>💬 Fundo do chat</h3><p>Escolha o fundo que você prefere neste aparelho.</p><div class="fsp-grid">${Object.entries(PALETTES).map(([id,p])=>`<button class="fsp-bg" data-fsp-bg="${id}" type="button"><span class="fsp-preview" style="background:${p.bg||'linear-gradient(145deg,#fffdfd,#f9f5ff)'}"></span><small>${p.label}</small></button>`).join('')}</div></section><section class="fsp-section"><h3>🔤 Mensagens</h3><div class="fsp-row"><div>Tamanho do texto</div><div class="fsp-buttons"><button data-fsp-font=".9" type="button">A−</button><button data-fsp-font="1" type="button">A</button><button data-fsp-font="1.15" type="button">A＋</button></div></div><div class="fsp-row"><div>Reduzir animações</div><label class="fsp-toggle"><input id="fspReduce" type="checkbox"></label></div></section></div>`
  document.body.appendChild(panel)
  $('fspClose').onclick=()=>panel.classList.add('hidden')
  panel.onclick=e=>{if(e.target===panel)panel.classList.add('hidden')}
  panel.querySelectorAll('[data-fsp-bg]').forEach(b=>b.onclick=()=>{state.wallpaper=b.dataset.fspBg;save(state);apply()})
  panel.querySelectorAll('[data-fsp-font]').forEach(b=>b.onclick=()=>{state.font=Number(b.dataset.fspFont);save(state);apply()})
  $('fspReduce').onchange=e=>{state.reduce=!!e.target.checked;save(state);apply()}
}
function ensureButton(){
  const row=document.querySelector('.friend-profile');if(!row)return null
  let b=$('friendSettingsBtn')
  if(!b){b=document.createElement('button');b.id='friendSettingsBtn';b.className='friend-settings-menu';b.type='button';b.title='Configurações';b.setAttribute('aria-label','Configurações');b.innerHTML='⚙️ <span>Configurações</span>';row.appendChild(b)}
  if(b.dataset.familySettingsBound!=='1'){b.dataset.familySettingsBound='1';b.onclick=e=>{e.preventDefault();e.stopPropagation();buildPanel();state=read();apply();$('familySettingsPanel').classList.remove('hidden')}}
  return b
}
function boot(){addStyle();buildPanel();ensureButton();state=read();apply();let n=0;const t=setInterval(()=>{ensureButton();apply();if(++n>30)clearInterval(t)},300)}
boot()
