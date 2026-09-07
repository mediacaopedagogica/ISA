import { CONFIG } from './config.js'

const $=id=>document.getElementById(id)
const token=new URLSearchParams(location.hash.replace(/^#/, '')).get('acesso')||''
let relation=''

const categories={
  '😊 Rostos':['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥳','🤩','🥹','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🫣','🤭','🫢','🫡','🤫','🫠','😶','😐','😑','😬','🙄','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕'],
  '💜 Corações':['❤️','🩷','🧡','💛','💚','💙','🩵','💜','🤎','🖤','🩶','🤍','💔','❤️‍🔥','❤️‍🩹','💕','💞','💓','💗','💖','💘','💝','💟','❣️','💋','🫶','🤝','👏','🙌','👍','👎','👌','✌️','🤞','🤟','🤘','🤙','👋'],
  '🐾 Animais':['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🐞','🪲','🕷️','🐢','🐍','🦎','🐙','🦑','🦀','🐠','🐟','🐬','🐳','🦈'],
  '📚 Escola':['📚','📖','📕','📗','📘','📙','📓','📔','📒','📃','📄','📑','🔖','🏷️','✏️','✒️','🖊️','🖋️','📝','📌','📍','📎','🖇️','📐','📏','🧮','🎒','🏫','🎓','💡','🔬','🔭','🧪','🧫','🧬','🧠','🗺️','🌍','🧭','🖥️','💻','⌨️','🖱️','📱','🧩','✅','☑️','❌','⭐','🌟','✨','🏆','🥇'],
  '🎉 Diversos':['🎉','🎊','🎈','🎁','🎀','🌷','🌸','🌺','🌻','🌼','🌹','🪻','🍀','🌈','☀️','🌤️','☁️','🌙','⭐','🌟','✨','⚡','🔥','💫','🎵','🎶','🎧','🎤','🎸','🎹','🎨','🖌️','🧶','🪄','🎯','🎲','🧸','🍕','🍔','🍟','🍿','🍫','🍪','🍓','🍉','🍇','🍎','🍒','🥤','☕']
}

function ensureCss(){if(document.querySelector('link[href^="amiga-ui-enhanced.css"]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href='amiga-ui-enhanced.css?v=1';document.head.appendChild(l)}
function toast(text){const t=$('friendToast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._enh);t._enh=setTimeout(()=>t.classList.add('hidden'),2200)}
async function rpc(name,args={}){const r=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${CONFIG.SUPABASE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(args),cache:'no-store'});let d=null;try{d=await r.json()}catch{}if(!r.ok)throw new Error(d?.message||'Não foi possível acessar.');return d}
async function loadRelation(){try{const d=await rpc('friend_portal_bootstrap',{p_token:token});relation=String(d?.friend?.relationship||'')}catch{relation=''}}
function activeIsGroup(){return window.__FRIEND_MEDIA__?.activeType?.()==='group'||window.__FRIEND_ACTIVE_CONV_TYPE__==='group'}
function addMenuButton(menu,label,fn){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=async()=>{menu.classList.add('hidden');await fn()};menu.appendChild(b)}
function buildPlusMenu(){
  const menu=$('friendPlusMenu');if(!menu)return;menu.innerHTML=''
  addMenuButton(menu,'👤 Trocar perfil',()=>$('friendProfileEditBtn')?.click())
  const media=window.__FRIEND_MEDIA__,friendAccess=/amiga da isa/i.test(relation)
  if(friendAccess){
    addMenuButton(menu,'📚 Estudos',()=>toast('Estudos ficam disponíveis quando este acesso estiver ativo para trabalhos escolares.'))
    if(activeIsGroup()&&media){addMenuButton(menu,'📷 Tirar foto para atividade',()=>media.takePhoto());addMenuButton(menu,'🖼️ Enviar imagem para atividade',()=>media.chooseImage())}
  }else if(media){
    addMenuButton(menu,'📷 Tirar foto',()=>media.takePhoto())
    addMenuButton(menu,'🖼️ Enviar imagem',()=>media.chooseImage())
    addMenuButton(menu,'🎙️ Gravar áudio',()=>media.startRecording())
  }
}
function bindPlus(){const plus=$('friendPlusBtn'),menu=$('friendPlusMenu');if(!plus||!menu||plus.dataset.enhanced==='1')return;plus.dataset.enhanced='1';plus.onclick=e=>{e.stopPropagation();buildPlusMenu();menu.classList.toggle('hidden')};document.addEventListener('click',e=>{if(!e.target.closest('#friendPlusMenu')&&!e.target.closest('#friendPlusBtn'))menu.classList.add('hidden')})}
function emojiSearchText(emoji){return emoji}
function renderEmojiGrid(items){const grid=$('friendEmojiGrid');if(!grid)return;grid.innerHTML=items.map(e=>`<button type="button" class="friend-emoji-choice" data-emoji="${e}">${e}</button>`).join('');grid.querySelectorAll('[data-emoji]').forEach(b=>b.onclick=()=>{const i=$('friendMessageInput');i.value+=b.dataset.emoji;i.focus()})}
function selectCategory(name){document.querySelectorAll('[data-emoji-cat]').forEach(b=>b.classList.toggle('active',b.dataset.emojiCat===name));renderEmojiGrid(categories[name]||[])}
function buildEmojiPicker(){
  const bar=$('friendEmojiBar');if(!bar||bar.dataset.enhanced==='1')return;bar.dataset.enhanced='1';bar.classList.add('friend-emoji-picker')
  bar.innerHTML=`<div class="friend-emoji-top"><input id="friendEmojiSearch" type="search" placeholder="Buscar emoji"><button id="friendEmojiClose" type="button">✕</button></div><div class="friend-emoji-tabs">${Object.keys(categories).map(n=>`<button type="button" data-emoji-cat="${n}">${n}</button>`).join('')}</div><div id="friendEmojiGrid" class="friend-emoji-grid"></div>`
  bar.querySelectorAll('[data-emoji-cat]').forEach(b=>b.onclick=()=>selectCategory(b.dataset.emojiCat));$('friendEmojiClose').onclick=()=>bar.classList.add('hidden');$('friendEmojiSearch').oninput=e=>{const q=e.target.value.trim().toLowerCase(),all=Object.values(categories).flat();renderEmojiGrid(q?all.filter(x=>emojiSearchText(x).includes(q)):all)};selectCategory(Object.keys(categories)[0])
}
function bindEmoji(){buildEmojiPicker();const btn=$('friendEmojiBtn'),bar=$('friendEmojiBar');if(!btn||!bar||btn.dataset.enhanced==='1')return;btn.dataset.enhanced='1';btn.onclick=e=>{e.stopPropagation();bar.classList.toggle('hidden')};document.addEventListener('click',e=>{if(!e.target.closest('#friendEmojiBar')&&!e.target.closest('#friendEmojiBtn'))bar.classList.add('hidden')})}
async function init(){ensureCss();await loadRelation();bindPlus();bindEmoji()}
const obs=new MutationObserver(()=>{bindPlus();bindEmoji()});obs.observe(document.documentElement,{subtree:true,childList:true});window.addEventListener('load',()=>setTimeout(init,160));init()
