// Carrega os recursos dos links externos sem travar o chat principal.
const wait=ms=>new Promise(r=>setTimeout(r,ms))
async function safe(path){try{return await import(path)}catch(e){console.warn('Recurso externo não carregou:',path,e);return null}}
function later(ms,path,after){setTimeout(async()=>{await safe(path);try{after?.()}catch{}},ms)}
let started=false
function start(){
  if(started)return;started=true
  const name=String(window.__ISA_FRIEND_PERSON__?.name||document.getElementById('friendName')?.textContent||'').trim().toLowerCase()
  later(20,'./external-menu.js?v=4-progressive',()=>window.__ISA_ENSURE_EXTERNAL_MENU__?.())
  later(80,'./family-settings.js?v=10-progressive',()=>window.__ISA_ENSURE_FAMILY_SETTINGS__?.())
  later(300,'./external-chat-tools.js?v=4-progressive')
  later(520,'./familia-emoji-completo.js?v=8-progressive')
  later(760,'./profile-status-stickers.js?v=11-settings-lazy',()=>window.__ISA_ENSURE_EXTERNAL_MENU__?.())
  later(1050,'./call-manager.js?v=16-progressive')
  later(1400,'./link-preview.js?v=12-progressive')
  // Nossa Rede e Joguinhos também são carregados sob demanda pelos botões.
  if(name.includes('paloma')){
    later(900,'./paloma-studies.js?v=8-paloma-menu',()=>window.__ISA_ENSURE_EXTERNAL_MENU__?.())
    later(1700,'./paloma-studies-advanced-mobile.js?v=7-progressive')
    later(2100,'./paloma-study-desk.js?v=7-progressive')
  }
}
if(window.__ISA_FRIEND_PORTAL_ENTERED__===true)start()
else document.addEventListener('isa:friend-portal-entered',start,{once:true})
// Caso o evento já tenha ocorrido antes deste módulo ser avaliado.
setTimeout(()=>{if(window.__ISA_FRIEND_PERSON__||window.__ISA_FRIEND_PORTAL_ENTERED__===true)start()},500)
