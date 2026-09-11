// Loader leve da Nossa Rede: preserva o visual aprovado e injeta somente as ferramentas atuais.
if(!document.getElementById('nossaRedePolicyV5Css')){const l=document.createElement('link');l.id='nossaRedePolicyV5Css';l.rel='stylesheet';l.href='./nossa-rede-policy-v5.css?v=2-organic-base';document.head.appendChild(l)}
if(!document.getElementById('nossaRedeMobileFixV1')){const l=document.createElement('link');l.id='nossaRedeMobileFixV1';l.rel='stylesheet';l.href='./nossa-rede-mobile-fix-v1.css?v=3-interaction-fix';document.head.appendChild(l)}
if(!document.getElementById('nossaRedeOrganicV6')){const l=document.createElement('link');l.id='nossaRedeOrganicV6';l.rel='stylesheet';l.href='./nossa-rede-organic-v6.css?v=1-approved-image';document.head.appendChild(l)}
if(!document.getElementById('nossaRedeOrganicV7Final')){const l=document.createElement('link');l.id='nossaRedeOrganicV7Final';l.rel='stylesheet';l.href='./nossa-rede-organic-v7-final.css?v=1-exact-approved-details';document.head.appendChild(l)}
if(!document.getElementById('nossaRedeOrganicV8Exact')){const l=document.createElement('link');l.id='nossaRedeOrganicV8Exact';l.rel='stylesheet';l.href='./nossa-rede-organic-v8-exact.css?v=1-cloud-comment-plus';document.head.appendChild(l)}
await import('./nossa-rede-ui-fixes-sep10.js?v=1-overlay-birthday-cover').catch(()=>null);
await import('./mobile-conversation-scroll-v2.js?v=1-visible-scroll').catch(()=>null);
await import('./nossa-rede-policy-v5.js?v=2-organic-layout');
await import('./nossa-rede-comment-menu-v1.js?v=4-all-family-final').catch(()=>null);
await import('./nuvem-compose-compact-v1.js?v=11-flat-pink-live').catch(()=>null);
await import('./nuvem-carousel-v1.js?v=7-edit-delete-api').catch(()=>null);
await import('./nossa-rede-media-workflow-v4.js?v=2-rich-editor-stable').catch(()=>null);
await import('./nossa-rede-editor-make-addon-v1.js?v=1-makeup-tools').catch(()=>null);
await import('./message-reaction-delegate-v2.js?v=4-expanded-emotions').catch(()=>null);
await import('./isa-social-emoji-suite-v1.js?v=1-full-isa-chat-emojis').catch(()=>null);
await import('./nossa-rede-single-comment-emoji-lock-v1.js?v=1-one-button-all-links').catch(()=>null);
await import('./nossa-rede-header-cleanup-v1.js?v=4-all-family-final').catch(()=>null);
await import('./nossa-rede-theme-story-lock-v1.js?v=1-theme-story-circle-effects').catch(()=>null);
window.__ISA_NOSSA_REDE_V5__?.patch?.();
window.__ISA_COMMENT_MEDIA_MENU__?.scan?.();
window.__ISA_NUVEM_COMPACT_COMPOSER__?.scan?.();
window.__ISA_NUVEM_CAROUSEL__?.scan?.();
window.__ISA_NOSSA_REDE_MEDIA_WORKFLOW__?.scan?.();
window.__ISA_PATCH_MEDIA_MAKE__?.();
window.__ISA_REACTION_DELEGATE_REFRESH__?.();
window.__ISA_SOCIAL_EMOJI_SUITE__?.scan?.();
window.__ISA_SINGLE_COMMENT_EMOJI_LOCK__?.scan?.();
window.__ISA_NOSSA_REDE_HEADER_CLEANUP__?.();
window.__ISA_THEME_STORY_LOCK__?.scan?.();