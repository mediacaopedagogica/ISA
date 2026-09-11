// Nossa Rede — trava canônica para o botão de emoji dos comentários.
// Regra fixa: cada barra de comentário pode exibir UM único botão 😊 que abre a paleta.
// Não altera o botão +, o campo de texto, o botão de enviar, reações, feed ou qualquer outro recurso.
(function(){
  'use strict'
  if(window.__ISA_SINGLE_COMMENT_EMOJI_LOCK_V1__)return
  window.__ISA_SINGLE_COMMENT_EMOJI_LOCK_V1__=true

  const FORM_SELECTOR='.social-comment-form,.fs-comment-form,.fs75-comment-form'
  const DUP_SELECTOR='.isa-comment-emoji-btn,.isa-comment-emoji-trigger,.nr10-comment-emoji'
  let timer=0

  function ensureCss(){
    if(document.getElementById('isaSingleCommentEmojiLockCss'))return
    const s=document.createElement('style')
    s.id='isaSingleCommentEmojiLockCss'
    s.textContent=`
      /* Evita até o piscar momentâneo de botões duplicados enquanto os módulos terminam de carregar. */
      ${FORM_SELECTOR}:has(> .isa-comment-emoji-btn) > .isa-comment-emoji-trigger,
      ${FORM_SELECTOR}:has(> .isa-comment-emoji-btn) > .nr10-comment-emoji,
      ${FORM_SELECTOR}:not(:has(> .isa-comment-emoji-btn)):has(> .isa-comment-emoji-trigger) > .nr10-comment-emoji{display:none!important}
    `
    document.head.appendChild(s)
  }

  function normalize(form){
    if(!form?.isConnected)return
    const buttons=[...form.querySelectorAll(DUP_SELECTOR)]
    if(!buttons.length)return

    // Mantém primeiro o botão do módulo social-base, pois ele já abre a paleta completa.
    // Se esse botão não existir em um acesso legado, preserva o botão da suíte global.
    const keep=buttons.find(b=>b.classList.contains('isa-comment-emoji-btn'))
      ||buttons.find(b=>b.classList.contains('isa-comment-emoji-trigger'))
      ||buttons[0]

    for(const button of buttons){
      if(button!==keep)button.remove()
    }
    keep.dataset.isaSingleCommentEmoji='1'
    keep.setAttribute('aria-label','Abrir emojis do comentário')
    form.dataset.isaSingleCommentEmojiLock='1'
  }

  function scan(root=document){
    ensureCss()
    if(root?.matches?.(FORM_SELECTOR))normalize(root)
    root?.querySelectorAll?.(FORM_SELECTOR).forEach(normalize)
  }

  function schedule(delay=35){
    clearTimeout(timer)
    timer=setTimeout(()=>scan(),delay)
  }

  const observer=new MutationObserver(mutations=>{
    for(const mutation of mutations){
      if(mutation.type!=='childList')continue
      for(const node of mutation.addedNodes){
        if(node.nodeType!==1)continue
        if(node.matches?.(FORM_SELECTOR)||node.matches?.(DUP_SELECTOR)||node.querySelector?.(FORM_SELECTOR)||node.querySelector?.(DUP_SELECTOR)){
          schedule(0)
          return
        }
      }
    }
  })
  observer.observe(document.documentElement,{childList:true,subtree:true})

  for(const eventName of ['isa:social-opened','isa:social-rendered','isa:friend-access-valid','isa:friend-portal-entered']){
    document.addEventListener(eventName,()=>schedule(0),{passive:true})
  }
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule(0)})

  ensureCss()
  scan()
  ;[120,500,1100,2400,4200].forEach(ms=>setTimeout(()=>scan(),ms))
  window.__ISA_SINGLE_COMMENT_EMOJI_LOCK__={scan,normalize}
})()
