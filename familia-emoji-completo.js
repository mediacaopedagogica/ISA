const $=id=>document.getElementById(id)
const EMOJIS={
  'Recentes':['😀','😊','🥰','😍','😂','😄','🙂','😉','🤗','🥳','💜','🩷','❤️','💙','💚','✨','⭐','🌷'],
  'Carinhas':['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😍','🥰','😘','😋','😎','🤓','🥳','🤗','🤔','🫡','😴','😢','😭','😤','😡','😱','🤯','🥹','😌'],
  'Corações':['❤️','🩷','🧡','💛','💚','🩵','💙','💜','🤎','🖤','🤍','💖','💗','💓','💞','💕','💘','💝','❣️','❤️‍🔥','❤️‍🩹','🫶'],
  'Família':['👩','👨','👧','👦','👵','👴','👶','🧒','👨‍👩‍👧','👨‍👩‍👧‍👦','🙌','👏','👋','👍','🙏','💪'],
  'Animais':['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐸','🐵','🐥','🦄','🐢','🐬','🐳','🦋','🐞'],
  'Comida':['🍎','🍓','🍉','🍇','🍌','🍍','🥭','🍒','🥕','🌽','🍕','🍔','🍟','🍿','🍪','🍩','🍰','🧁','🍫','🍬','🥤','☕'],
  'Festa':['🎉','🎊','🎈','🎂','🎁','🎀','✨','🌟','⭐','💫','🎆','🎵','🎶','🎨','🏆','⚽','🎮'],
  'Natureza':['🌞','🌝','🌙','☀️','🌤️','🌈','☁️','❄️','🔥','💧','🌊','🌸','🌷','🌹','🌻','🌼','🌿','🍀','🌳'],
  'Objetos':['📱','💻','⌨️','🖥️','📷','📸','⏰','🔔','💡','📚','✏️','📝','🎒','🧸','🪄','🔑','🏠','🚗','✈️'],
  'Símbolos':['✅','❌','⚠️','❗','❓','‼️','💯','♻️','🔒','🔓','🛡️','🔔','📌','💬','💭','➡️','⬅️','⬆️','⬇️','➕','➖']
}
let category='Carinhas'
function all(){return [...new Set(Object.values(EMOJIS).flat())]}
function render(items){const grid=$('familyEmojiGrid');if(!grid)return;grid.innerHTML=items.map(e=>`<button type="button" class="friend-emoji-choice" data-family-emoji="${e}">${e}</button>`).join('');grid.querySelectorAll('[data-family-emoji]').forEach(b=>b.onclick=()=>{const i=$('friendMessageInput');if(!i)return;i.value+=b.dataset.familyEmoji;i.focus()})}
function pick(name){category=name;document.querySelectorAll('[data-family-emoji-tab]').forEach(b=>b.classList.toggle('active',b.dataset.familyEmojiTab===name));render(EMOJIS[name]||[])}
function build(){const bar=$('friendEmojiBar');if(!bar||bar.dataset.completeFamilyEmoji==='1')return;bar.dataset.completeFamilyEmoji='1';bar.classList.add('friend-emoji-picker');bar.innerHTML=`<div class="friend-emoji-top"><input id="familyEmojiSearch" type="search" placeholder="Buscar emoji..."><button id="familyEmojiClose" type="button" aria-label="Fechar">✕</button></div><div class="friend-emoji-tabs">${Object.keys(EMOJIS).map(n=>`<button type="button" data-family-emoji-tab="${n}">${n}</button>`).join('')}</div><div id="familyEmojiGrid" class="friend-emoji-grid"></div>`;bar.querySelectorAll('[data-family-emoji-tab]').forEach(b=>b.onclick=()=>pick(b.dataset.familyEmojiTab));$('familyEmojiClose').onclick=()=>bar.classList.add('hidden');$('familyEmojiSearch').oninput=e=>{const q=e.target.value.trim();render(q?all():EMOJIS[category]||[])};pick('Carinhas');const btn=$('friendEmojiBtn');if(btn){btn.onclick=e=>{e.stopPropagation();bar.classList.toggle('hidden')}}}
function start(){build();let n=0;const t=setInterval(()=>{build();if(++n>30)clearInterval(t)},200)}
start();window.addEventListener('load',start)
