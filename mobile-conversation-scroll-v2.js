/* Injeta a correção de rolagem das listas de conversa sem alterar o layout aprovado. */
(function(){
  if(!document.getElementById('isaMobileConversationScrollV2')){
    const l=document.createElement('link')
    l.id='isaMobileConversationScrollV2'
    l.rel='stylesheet'
    l.href='./mobile-conversation-scroll-v2.css?v=3-vertical-all-mobile'
    document.head.appendChild(l)
  }
})();
import('./nossa-rede-profile-search-v1.js?v=2-family-profile-search').then(()=>window.__ISA_NOSSA_REDE_PROFILE_SEARCH__?.scan?.()).catch(()=>{});
import('./nossa-rede-birthday-card-v2.js?v=1-next-15-days').then(()=>window.__ISA_BIRTHDAY_CARD_V2__?.scan?.()).catch(()=>{});
import('./postit-move-once-guard-v1.js?v=1-idempotent-move').then(()=>window.__ISA_POSTIT_MOVE_ONCE__?.scan?.()).catch(()=>{});
