// Carrega recursos externos sem bloquear o chat e sem duplicar controladores.
async function safe(path){try{return await import(path)}catch(e){console.warn('Recurso externo não carregou:',path,e);return null}}
function later(ms,path,after){setTimeout(async()=>{await safe(path);try{after?.()}catch{}},ms)}
let started=false
function start(){
  if(started)return;started=true
  const name=String(window.__ISA_FRIEND_PERSON__?.name||document.getElementById('friendName')?.textContent||'').trim().toLowerCase()
  later(20,'./external-menu.js?v=5-simplified',()=>window.__ISA_ENSURE_EXTERNAL_MENU__?.())
  later(70,'./social-privacy-guard.js?v=1-family-rules',()=>window.__ISA_SOCIAL_PRIVACY__?.apply?.())
  later(100,'./family-settings.js?v=11-click-fix')
  later(220,'./nossa-rede-v4.js?v=3-family-rules',()=>{window.__ISA_ENHANCE_NOSSA_REDE__?.();window.__ISA_SOCIAL_PRIVACY__?.apply?.()})
  later(330,'./nossa-rede-policy-v5-loader.js?v=1-timeline-social',()=>window.__ISA_NOSSA_REDE_V5__?.patch?.())
  later(420,'./external-chat-tools.js?v=5-controls')
  later(620,'./familia-emoji-completo.js?v=9-controls')
  later(950,'./profile-status-stickers.js?v=13-click-fix',()=>window.__ISA_ENSURE_EXTERNAL_MENU__?.())
  later(1130,'./social-profile-chat-bridge.js?v=1-separated-photo-chat-rules',()=>window.__ISA_SOCIAL_PROFILE_CHAT_SYNC__?.())
  later(1400,'./link-preview.js?v=13-controls')
  if(name.includes('paloma')){
    later(760,'./paloma-studies.js?v=9-click-fix',()=>window.__ISA_ENSURE_EXTERNAL_MENU__?.())
    later(1700,'./paloma-studies-advanced-mobile.js?v=8-controls')
    later(2150,'./paloma-study-desk.js?v=8-controls')
  }
}
if(window.__ISA_FRIEND_PORTAL_ENTERED__===true)start()
else document.addEventListener('isa:friend-portal-entered',start,{once:true})
setTimeout(()=>{if(window.__ISA_FRIEND_PERSON__||window.__ISA_FRIEND_PORTAL_ENTERED__===true)start()},500)
