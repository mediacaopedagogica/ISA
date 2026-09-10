/* Injeta a correção de rolagem das listas de conversa sem alterar o layout aprovado. */
(function(){
  if(document.getElementById('isaMobileConversationScrollV2'))return
  const l=document.createElement('link')
  l.id='isaMobileConversationScrollV2'
  l.rel='stylesheet'
  l.href='./mobile-conversation-scroll-v2.css?v=1-visible-scroll'
  document.head.appendChild(l)
})();
