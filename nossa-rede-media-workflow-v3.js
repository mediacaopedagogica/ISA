/* Compatibilidade: chamadas antigas do editor v3 usam o runtime v4 corrigido. */
await import('./nossa-rede-media-workflow-v4.js?v=1-rich-editor-runtime').catch(e=>console.warn('Editor de mídia v4 não carregou:',e));
window.__ISA_NOSSA_REDE_MEDIA_WORKFLOW__?.scan?.();
