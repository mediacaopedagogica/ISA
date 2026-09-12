// Cantinho da Isa — mantém um único botão oficial "📌 Importante" por conversa.
// Cirúrgico: não recria cabeçalhos, não altera o painel de post-its e não interfere em mensagens.
(function(){
  'use strict'
  if(window.__ISA_IMPORTANT_SINGLETON_V1__)return
  window.__ISA_IMPORTANT_SINGLETON_V1__=true

  const headers=()=>[
    document.querySelector('#chatPanel .chat-header'),
    document.querySelector('#friendThread .friend-thread-head')
  ].filter(Boolean)

  const label=btn=>String(btn?.textContent||'')
    .replace(/📌/g,'')
    .replace(/\s+/g,' ')
    .trim()
    .toLocaleLowerCase('pt-BR')

  function cleanHeader(head){
    if(!head)return false
    const canonical=head.querySelector('.isa-important-open')
    // Só limpa quando o botão oficial do painel "Conversa importante" já existe.
    // Assim nenhum outro recurso é removido durante o carregamento.
    if(!canonical)return false
    const same=[...head.querySelectorAll('button')].filter(btn=>label(btn)==='importante')
    for(const btn of same)if(btn!==canonical)btn.remove()
    return true
  }

  function scan(){headers().forEach(cleanHeader)}

  function bind(){
    for(const head of headers()){
      if(head.dataset.importantSingletonBound==='1')continue
      head.dataset.importantSingletonBound='1'
      new MutationObserver(()=>queueMicrotask(()=>cleanHeader(head))).observe(head,{childList:true})
    }
    scan()
  }

  document.addEventListener('isa:chat-opened',bind,{passive:true})
  document.addEventListener('isa:friend-portal-entered',bind,{passive:true})
  window.addEventListener('pageshow',bind,{once:true})
  bind();setTimeout(bind,400);setTimeout(bind,1200)

  window.__ISA_IMPORTANT_SINGLETON__={scan:bind,cleanHeader}
})();
