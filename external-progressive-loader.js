// Carrega recursos externos sem bloquear o chat e sem duplicar controladores.
async function safe(path){try{return await import(path)}catch(e){console.warn('Recurso externo não carregou:',path,e);return null}}
function later(ms,path,after){setTimeout(async()=>{await safe(path);try{after?.()}catch{}},ms)}
let started=false
function start(){
  if(started)return;started=true
  const name=String(window.__ISA_FRIEND_PERSON__?.name||document.getElementById('friendName')?.textContent||'').trim().toLowerCase()
  later(20,'./external-menu.js?v=5-simplified',()=>window.__ISA_ENSURE_EXTERNAL_MENU__?.())
  later(35,'./external-social-entry-v1.js?v=1-direct',()=>window.__ISA_BIND_EXTERNAL_SOCIAL_DIRECT__?.())
  later(70,'./social-privacy-guard.js?v=1-family-rules',()=>window.__ISA_SOCIAL_PRIVACY__?.apply?.())
  later(100,'./family-settings.js?v=11-click-fix')
  // Núcleo social externo carregado ANTES das camadas visuais: evita botão Nossa Rede sem destino.
  later(150,'./family-social.js?v=13-direct-entry',()=>window.__ISA_ENSURE_FAMILY_SOCIAL__?.())
  later(250,'./nossa-rede-v4.js?v=3-family-rules',()=>{window.__ISA_ENHANCE_NOSSA_REDE__?.();window.__ISA_SOCIAL_PRIVACY__?.apply?.()})
  later(340,'./nossa-rede-policy-v5-loader.js?v=2-social-profiles',()=>window.__ISA_NOSSA_REDE_V5__?.patch?.())
  later(410,'./social-profile-pages-v1.js?v=1-profiles-gallery',()=>window.__ISA_SOCIAL_PROFILE_PAGES__?.decorate?.())
  later(455,'./social-profile-directory-v1.js?v=1-visible-only',()=>window.__ISA_SOCIAL_PROFILE_DIRECTORY__?.patch?.())
  later(510,'./external-chat-tools.js?v=5-controls')
  later(620,'./message-interactions-v1.js?v=3-click-behavior',()=>window.__ISA_REFRESH_MESSAGE_INTERACTIONS__?.())
  later(670,'./chat-rich-format-v1.js?v=1-rich-chat',()=>window.__ISA_REFRESH_RICH_CHAT__?.())
  later(720,'./familia-emoji-completo.js?v=9-controls')
  later(900,'./social-tag-notifications.js?v=2-live-tags',()=>window.__ISA_SOCIAL_TAG_NOTIFICATIONS__?.poll?.())
  later(1030,'./profile-status-stickers.js?v=13-click-fix',()=>window.__ISA_ENSURE_EXTERNAL_MENU__?.())
  // Mantém a foto social independente da foto do Chat; o v5 oculta qualquer atalho de Chat dentro da Nossa Rede.
  later(1160,'./social-profile-chat-bridge.js?v=1-separated-photo-chat-rules',()=>window.__ISA_SOCIAL_PROFILE_CHAT_SYNC__?.())
  later(1380,'./link-preview.js?v=13-controls')
  if(name.includes('paloma')){
    later(790,'./paloma-studies.js?v=9-click-fix',()=>window.__ISA_ENSURE_EXTERNAL_MENU__?.())
    later(1720,'./paloma-studies-advanced-mobile.js?v=8-controls')
    later(2150,'./paloma-study-desk.js?v=8-controls')
  }
}
if(window.__ISA_FRIEND_PORTAL_ENTERED__===true)start()
else document.addEventListener('isa:friend-portal-entered',start,{once:true})
setTimeout(()=>{if(window.__ISA_FRIEND_PERSON__||window.__ISA_FRIEND_PORTAL_ENTERED__===true)start()},500)
