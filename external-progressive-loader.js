// Carrega recursos externos de forma leve. A Nossa Rede é carregada somente ao toque no botão.
async function safe(path){try{return await import(path)}catch(e){console.warn('Recurso externo não carregou:',path,e);return null}}
function later(ms,path,after){setTimeout(async()=>{await safe(path);try{after?.()}catch{}},ms)}
let started=false
function start(){
  if(started)return;started=true
  const name=String(window.__ISA_FRIEND_PERSON__?.name||document.getElementById('friendName')?.textContent||'').trim().toLowerCase()

  // Primeiro apenas o indispensável para o portal responder aos cliques.
  later(25,'./external-menu.js?v=6-light-entry',()=>window.__ISA_ENSURE_EXTERNAL_MENU__?.())
  later(60,'./external-social-entry-v1.js?v=10-compact-composer',()=>window.__ISA_BIND_EXTERNAL_SOCIAL_DIRECT__?.())
  later(150,'./external-chat-tools.js?v=6-light-entry')
  later(260,'./message-interactions-v1.js?v=4-bubble-edge',()=>window.__ISA_REFRESH_MESSAGE_INTERACTIONS__?.())
  later(360,'./chat-rich-format-v1.js?v=4-selection-popover',()=>window.__ISA_REFRESH_RICH_CHAT__?.())
  later(430,'./chat-rich-format-guard-v2.js?v=2-no-empty-tags',()=>window.__ISA_CLEAN_EMPTY_CHAT_FORMATS__?.())
  later(520,'./familia-emoji-completo.js?v=9-controls')

  // Recursos secundários entram depois que a tela já pintou.
  later(1100,'./profile-status-stickers.js?v=13-click-fix',()=>window.__ISA_ENSURE_EXTERNAL_MENU__?.())
  later(1230,'./profile-birthday-v1.js?v=1-required',()=>window.__ISA_PROFILE_BIRTHDAY__?.inject?.())
  later(1450,'./social-tag-notifications.js?v=2-live-tags',()=>window.__ISA_SOCIAL_TAG_NOTIFICATIONS__?.poll?.())
  later(1800,'./link-preview.js?v=13-controls')
  later(2050,'./nuvem-ui-ideas-v10.js?v=4-tools-only',()=>window.__ISA_NUVEM_UI_IDEAS__?.scan?.())
  later(2100,'./nuvem-compose-compact-v1.js?v=2-compact-3d',()=>window.__ISA_NUVEM_COMPACT_COMPOSER__?.scan?.())

  // Estudos da Paloma continuam exclusivos e também são tardios.
  if(name.includes('paloma')){
    later(1150,'./paloma-studies.js?v=9-click-fix',()=>window.__ISA_ENSURE_EXTERNAL_MENU__?.())
    later(2200,'./paloma-studies-advanced-mobile.js?v=8-controls')
    later(2700,'./paloma-study-desk.js?v=8-controls')
  }
}
if(window.__ISA_FRIEND_PORTAL_ENTERED__===true)start()
else document.addEventListener('isa:friend-portal-entered',start,{once:true})
setTimeout(()=>{if(window.__ISA_FRIEND_PORTAL_ENTERED__===true)start()},700)
