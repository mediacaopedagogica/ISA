const GAME_URL='./jogos/bricks-pastel.html'
const $=id=>document.getElementById(id)
const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR')

function currentName(){
  const main=norm($('myName')?.textContent)
  if(main&&main!=='família')return main
  const external=norm($('friendName')?.textContent)
  if(external&&external!=='perfil')return external
  return ''
}
function eligible(){const n=currentName();return n==='isa'||n==='paloma'}
function isExternal(){return !!$('friendApp')}

function injectStyles(){
  if($('cantinhoGamesStyles'))return
  const s=document.createElement('style');s.id='cantinhoGamesStyles';s.textContent=`
  .cantinho-games-overlay{position:fixed;inset:0;z-index:2147482000;background:rgba(43,31,70,.58);backdrop-filter:blur(10px);display:grid;place-items:center;padding:18px}
  .cantinho-games-overlay.hidden{display:none!important}
  .cantinho-games-shell{width:min(1040px,96vw);height:min(780px,94dvh);background:linear-gradient(145deg,#fffdf8,#fff1fa 52%,#f1ecff);border:2px solid rgba(255,255,255,.95);border-radius:28px;box-shadow:0 24px 70px rgba(51,37,94,.32);overflow:hidden;display:flex;flex-direction:column;color:#44316f}
  .cantinho-games-head{display:flex;align-items:center;gap:10px;padding:14px 16px;background:rgba(255,255,255,.78);border-bottom:1px solid #eadff3}.cantinho-games-head strong{font-size:18px;flex:1}.cantinho-games-close,.cantinho-games-back{border:0;border-radius:14px;min-width:42px;height:42px;background:#fff;box-shadow:0 5px 14px #6b4a8b22;cursor:pointer;font-weight:900;color:#59417d}.cantinho-games-back.hidden{display:none!important}
  .cantinho-games-hub{padding:22px;overflow:auto;flex:1}.cantinho-games-intro{text-align:center;margin:4px auto 20px;max-width:620px}.cantinho-games-intro h2{margin:0 0 7px;font-size:clamp(26px,4vw,42px);color:#6d48ac}.cantinho-games-intro p{margin:0;color:#7a6a8d;font-weight:700}
  .cantinho-games-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,290px));gap:18px;justify-content:center}.cantinho-game-card{border:2px solid #fff;background:linear-gradient(145deg,#fff,#fff3fb);border-radius:24px;padding:18px;box-shadow:0 12px 28px #6a438d25;cursor:pointer;text-align:left;color:#44316f;transition:transform .18s ease,box-shadow .18s ease}.cantinho-game-card:hover{transform:translateY(-3px);box-shadow:0 16px 34px #6a438d34}.cantinho-game-art{height:150px;border-radius:19px;background:linear-gradient(145deg,#211b59,#352d78);display:grid;grid-template-columns:repeat(4,1fr);gap:7px;padding:22px;margin-bottom:14px;overflow:hidden}.cantinho-game-art span{border:2px solid #fff;border-radius:7px;box-shadow:inset 0 5px #fff4,inset 0 -6px #0002}.cantinho-game-art span:nth-child(5n+1){background:#ef72a8}.cantinho-game-art span:nth-child(5n+2){background:#72b4e9}.cantinho-game-art span:nth-child(5n+3){background:#a86bdc}.cantinho-game-art span:nth-child(5n+4){background:#83cf7d}.cantinho-game-art span:nth-child(5n){background:#f4bc35}.cantinho-game-card h3{margin:0 0 5px;font-size:21px}.cantinho-game-card p{margin:0;color:#806f91;font-weight:650;line-height:1.35}
  .cantinho-game-frame-wrap{flex:1;min-height:0}.cantinho-game-frame-wrap.hidden{display:none!important}.cantinho-game-frame{width:100%;height:100%;border:0;background:#e9e3ff;display:block}
  .cantinho-games-popwrap{position:relative;display:flex;align-items:center}.cantinho-games-pop{position:absolute;left:0;bottom:calc(100% + 9px);z-index:9999;min-width:170px;padding:7px;background:#fff;border:1px solid #eadff3;border-radius:15px;box-shadow:0 12px 28px #4d366b2e}.cantinho-games-pop.hidden{display:none!important}.cantinho-games-pop button{width:100%;border:0;background:transparent;border-radius:10px;padding:10px 12px;text-align:left;cursor:pointer;font-weight:800;color:#4f3a72}.cantinho-games-pop button:hover{background:#f5efff}
  @media(max-width:700px){.cantinho-games-overlay{padding:0}.cantinho-games-shell{width:100vw;height:100dvh;border-radius:0;border:0}.cantinho-games-head{padding-top:max(12px,env(safe-area-inset-top));}.cantinho-games-hub{padding:16px}.cantinho-games-grid{grid-template-columns:1fr}.cantinho-game-card{max-width:420px;width:100%;justify-self:center}.cantinho-game-art{height:130px}}
  `;document.head.appendChild(s)
}

function ensureOverlay(){
  injectStyles()
  let overlay=$('cantinhoGamesOverlay');if(overlay)return overlay
  overlay=document.createElement('div');overlay.id='cantinhoGamesOverlay';overlay.className='cantinho-games-overlay hidden';overlay.innerHTML=`
    <section class="cantinho-games-shell" role="dialog" aria-modal="true" aria-label="Joguinhos">
      <header class="cantinho-games-head"><button id="cantinhoGamesBack" class="cantinho-games-back hidden" type="button">←</button><strong id="cantinhoGamesTitle">🎮 Joguinhos</strong><button id="cantinhoGamesClose" class="cantinho-games-close" type="button">✕</button></header>
      <div id="cantinhoGamesHub" class="cantinho-games-hub"><div class="cantinho-games-intro"><h2>Joguinhos ✨</h2><p>Um cantinho só para relaxar e jogar.</p></div><div class="cantinho-games-grid"><button id="openBricksPastel" class="cantinho-game-card" type="button"><div class="cantinho-game-art">${'<span></span>'.repeat(12)}</div><h3>🧱 Bricks Pastel</h3><p>Quebre os tijolos coloridos sem deixar a bolinha cair.</p></button></div></div>
      <div id="cantinhoGameFrameWrap" class="cantinho-game-frame-wrap hidden"><iframe id="cantinhoGameFrame" class="cantinho-game-frame" title="Bricks Pastel" loading="eager"></iframe></div>
    </section>`
  document.body.appendChild(overlay)
  const hub=$('cantinhoGamesHub'),wrap=$('cantinhoGameFrameWrap'),frame=$('cantinhoGameFrame'),back=$('cantinhoGamesBack'),title=$('cantinhoGamesTitle')
  function showHub(){frame.src='about:blank';wrap.classList.add('hidden');hub.classList.remove('hidden');back.classList.add('hidden');title.textContent='🎮 Joguinhos'}
  function close(){overlay.classList.add('hidden');showHub()}
  $('cantinhoGamesClose').onclick=close
  back.onclick=showHub
  $('openBricksPastel').onclick=()=>{hub.classList.add('hidden');wrap.classList.remove('hidden');back.classList.remove('hidden');title.textContent='🧱 Bricks Pastel';frame.src=GAME_URL+'?v=1'}
  overlay.addEventListener('click',e=>{if(e.target===overlay)close()})
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.classList.contains('hidden'))close()})
  return overlay
}
function openGames(){if(!eligible())return;ensureOverlay().classList.remove('hidden')}
window.__CANTINHO_OPEN_GAMES__=openGames

function wireMain(){
  if(isExternal()||currentName()!=='isa')return
  const plus=$('groupPlusBtn'),menu=$('groupPlusMenu');if(!plus||!menu)return
  plus.classList.remove('hidden')
  if(menu.querySelector('[data-cantinho-games]'))return
  const b=document.createElement('button');b.type='button';b.dataset.cantinhoGames='1';b.textContent='🎮 Joguinhos';b.onclick=()=>{menu.classList.add('hidden');openGames()};menu.appendChild(b)
}
function wirePaloma(){
  if(!isExternal()||currentName()!=='paloma')return
  const composer=document.querySelector('.friend-composer');if(!composer||$('palomaGamesPlus'))return
  const wrap=document.createElement('div');wrap.className='cantinho-games-popwrap';wrap.innerHTML='<button id="palomaGamesPlus" class="emoji-btn" type="button" title="Mais opções">＋</button><div id="palomaGamesPop" class="cantinho-games-pop hidden"><button type="button" data-open-games>🎮 Joguinhos</button></div>'
  composer.insertBefore(wrap,composer.firstChild)
  const btn=$('palomaGamesPlus'),pop=$('palomaGamesPop');btn.onclick=e=>{e.stopPropagation();pop.classList.toggle('hidden')};pop.querySelector('[data-open-games]').onclick=()=>{pop.classList.add('hidden');openGames()};document.addEventListener('click',e=>{if(!wrap.contains(e.target))pop.classList.add('hidden')})
}
function wire(){if(!eligible())return;ensureOverlay();wireMain();wirePaloma()}
const observer=new MutationObserver(wire);observer.observe(document.body,{childList:true,subtree:true,characterData:true});
let tries=0;const timer=setInterval(()=>{wire();if(++tries>120)clearInterval(timer)},500);wire()
