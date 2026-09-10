// Carrega recursos externos de forma leve. A Nossa Rede usa um único controlador, já presente no HTML.
async function safe(path){try{return await import(path)}catch(e){console.warn('Recurso externo não carregou:',path,e);return null}}
function later(ms,path,after){setTimeout(async()=>{await safe(path);try{after?.()}catch{}},ms)}
let started=false
function start(){
  if(started)return;started=true
  const name=String(window.__ISA_FRIEND_PERSON__?.name||document.getElementById('friendName')?.textContent||'').trim().toLowerCase()

  later(5,'./mobile-conversation-scroll-v2.js?v=1-visible-scroll')
  later(25,'./external-menu.js?v=7-audit-family',()=>window.__ISA_ENSURE_EXTERNAL_MENU__?.())
  setTimeout(()=>window.__ISA_BIND_EXTERNAL_SOCIAL_DIRECT__?.(),55)
  later(85,'./external-decoration-cleanup-v1.js?v=2-portal-only',()=>window.__ISA_EXTERNAL_DECOR_CLEANUP__?.())
  later(135,'./external-chat-tools.js?v=6-light-entry')
  later(165,'./collaborative-chat-postits-v2.js?v=2-cancel-reopen-fixers',()=>window.__ISA_COLLAB_POSTITS__?.scan?.())
  later(205,'./conversation-important-v2.js?v=4-collab-chat',()=>window.__ISA_IMPORTANT_BOARD__?.render?.())
  later(255,'./message-interactions-v1.js?v=7-full-emotions',()=>window.__ISA_REFRESH_MESSAGE_INTERACTIONS__?.())
  later(305,'./message-reaction-delegate-v2.js?v=4-expanded-emotions',()=>window.__ISA_REACTION_DELEGATE_REFRESH__?.())
  later(345,'./isa-social-emoji-suite-v1.js?v=1-full-isa-chat-emojis',()=>window.__ISA_SOCIAL_EMOJI_SUITE__?.scan?.())
  later(385,'./nuvem-reactions-v1.js?v=4-full-emotions',()=>window.__ISA_NUVEM_REACTIONS__?.apply?.())
  later(425,'./chat-rich-format-v1.js?v=4-selection-popover',()=>window.__ISA_REFRESH_RICH_CHAT__?.())
  later(475,'./chat-rich-format-guard-v2.js?v=2-no-empty-tags',()=>window.__ISA_CLEAN_EMPTY_CHAT_FORMATS__?.())
  later(545,'./familia-emoji-completo.js?v=9-controls')

  later(650,'./external-profile-parity-v1.js?v=2-keise-profile-parity',()=>window.__ISA_EXTERNAL_PROFILE_PARITY__?.start?.())
  later(720,'./social-profile-pages-v1.js?v=2-all-family-profile-parity',()=>window.__ISA_SOCIAL_PROFILE_PAGES__?.decorate?.())
  later(790,'./social-profile-directory-v1.js?v=2-all-family-profile-parity',()=>window.__ISA_SOCIAL_PROFILE_DIRECTORY__?.patch?.())
  later(860,'./social-reaction-names-v1.js?v=2-all-family-profile-parity',()=>window.__ISA_ENHANCE_REACTION_NAMES__?.())

  later(980,'./family-social-extras-v1.js?v=2-live-social-extras',()=>window.__ISA_FAMILY_SOCIAL_EXTRAS__?.scan?.(true))
  later(1010,'./nossa-rede-birthday-bridge-v1.js?v=1-live-birthdays',()=>window.__ISA_NOSSA_REDE_BIRTHDAYS__?.refresh?.())
  later(1030,'./nuvem-carousel-v1.js?v=7-edit-delete-api',()=>window.__ISA_NUVEM_CAROUSEL__?.scan?.())
  later(1050,'./nossa-rede-media-workflow-v4.js?v=1-rich-editor-runtime',()=>window.__ISA_NOSSA_REDE_MEDIA_WORKFLOW__?.scan?.())
  later(1090,'./profile-status-stickers.js?v=13-click-fix',()=>{window.__ISA_ENSURE_EXTERNAL_MENU__?.();window.__ISA_EXTERNAL_DECOR_CLEANUP__?.()})
  later(1220,'./profile-birthday-v1.js?v=4-social-birthday-bridge',()=>window.__ISA_PROFILE_BIRTHDAY__?.inject?.())
  later(1300,'./interaction-recovery-v2.js?v=1-chat-date',()=>window.__ISA_INTERACTION_RECOVERY__?.scan?.())
  later(1440,'./social-tag-notifications.js?v=2-live-tags',()=>window.__ISA_SOCIAL_TAG_NOTIFICATIONS__?.poll?.())
  later(1760,'./link-preview.js?v=13-controls')
  later(2010,'./nuvem-ui-ideas-v10.js?v=6-all-family-social',()=>window.__ISA_NUVEM_UI_IDEAS__?.scan?.())
  later(2070,'./nuvem-compose-compact-v1.js?v=11-flat-pink-live',()=>window.__ISA_NUVEM_COMPACT_COMPOSER__?.scan?.())
  later(2140,'./nuvem-carousel-v1.js?v=7-edit-delete-api',()=>window.__ISA_NUVEM_CAROUSEL__?.scan?.())
  later(2170,'./nossa-rede-media-workflow-v4.js?v=1-rich-editor-runtime',()=>window.__ISA_NOSSA_REDE_MEDIA_WORKFLOW__?.scan?.())
  later(2200,'./nossa-rede-header-cleanup-v1.js?v=4-all-family-final',()=>window.__ISA_NOSSA_REDE_HEADER_CLEANUP__?.())
  later(2260,'./nossa-rede-comment-menu-v1.js?v=4-all-family-final',()=>window.__ISA_COMMENT_MEDIA_MENU__?.scan?.())
  setTimeout(()=>{window.__ISA_COLLAB_POSTITS__?.scan?.();window.__ISA_SOCIAL_EMOJI_SUITE__?.scan?.();window.__ISA_FAMILY_SOCIAL_EXTRAS__?.scan?.(true);window.__ISA_NOSSA_REDE_BIRTHDAYS__?.refresh?.();window.__ISA_NOSSA_REDE_MEDIA_WORKFLOW__?.scan?.()},2330)

  if(name.includes('paloma')){
    later(1120,'./paloma-studies.js?v=9-click-fix',()=>window.__ISA_ENSURE_EXTERNAL_MENU__?.())
    later(2320,'./paloma-studies-advanced-mobile.js?v=8-controls')
    later(2700,'./paloma-study-desk.js?v=8-controls')
  }
}
if(window.__ISA_FRIEND_PORTAL_ENTERED__===true)start()
else document.addEventListener('isa:friend-portal-entered',start,{once:true})
setTimeout(()=>{if(window.__ISA_FRIEND_PORTAL_ENTERED__===true)start()},700)