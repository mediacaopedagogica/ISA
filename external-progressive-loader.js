// Carrega recursos externos sem bloquear o chat e sem duplicar controladores.
async function safe(path){try{return await import(path)}catch(e){console.warn('Recurso externo não carregou:',path,e);return null}}
function later(ms,path,after){setTimeout(async()=>{await safe(path);try{after?.()}catch{}},ms)}
let started=false
function start(){
  if(started)return;started=true
  const name=String(window.__ISA_FRIEND_PERSON__?.name||document.getElementById('friendName')?.textContent||'').trim().toLowerCase()
  later(20,'./external-menu.js?v=5-simplified',()=>window.__ISA_ENSURE_EXTERNAL_MENU__?.())
  later(100,'./family-settings.js?v=11-click-fix')
  later(260,'./external-chat-tools.js?v=5-controls')
  later(480,'./familia-emoji-completo.js?v=9-controls')
  later(900,'./profile-status-stickers.js?v=13-click-fix',()=>window.__ISA_ENSURE_EXTERNAL_MENU__?.())
  later(1350,'./link-preview.js?v=13-controls')
  if(name.includes('paloma')){
    later(720,'./paloma-studies.js?v=9-click-fix',()=>window.__ISA_ENSURE_EXTERNAL_MENU__?.())
    later(1650,'./paloma-studies-advanced-mobile.js?v=8-controls')
    later(2100,'./paloma-study-desk.js?v=8-controls')
  }
}
if(window.__ISA_FRIEND_PORTAL_ENTERED__===true)start()
else document.addEventListener('isa:friend-portal-entered',start,{once:true})
setTimeout(()=>{if(window.__ISA_FRIEND_PERSON__||window.__ISA_FRIEND_PORTAL_ENTERED__===true)start()},500)
