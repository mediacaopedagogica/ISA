// Cantinho da Isa — correções de regressão do dashboard CANÔNICO.
// Regra: corrigir integração sem reconstruir o layout e sem remover funcionalidades já aprovadas.
(function(){
  'use strict'
  if(window.__ISA_APPROVED_REGRESSION_FIXES_V12__)return
  window.__ISA_APPROVED_REGRESSION_FIXES_V12__=true

  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const approved=()=>{
    const requested=norm(new URLSearchParams(location.search).get('perfil'))
    const current=norm($('myName')?.textContent)
    return ['keise','isa','alan'].some(p=>requested===p||current===p||current.startsWith(p+' '))
  }

  // Metadado público para auditorias futuras: esta home é a referência dourada e não pode ser substituída.
  window.__ISA_CANONICAL_GOLDEN_MASTER__={
    version:'2026-09-11-v12',
    reference:'assets/reference/keise-approved-home-final.webp',
    shell:'keiseApprovedHome+keiseApprovedTopbar'
  }

  function ensureCss(){
    if($('approvedRegressionCssV12'))return
    const s=document.createElement('style')
    s.id='approvedRegressionCssV12'
    s.textContent=`
      /* O fixador sempre pertence ao card; nunca pode ficar solto na página. */
      #kaConversationList .ka-conv-card[data-source-conv],
      #kaConversationListStable .ka-conv-card[data-source-conv]{position:relative!important;padding-right:58px!important}
      #kaConversationList .ka-conv-card[data-source-conv]>.nuvem-pin-picker-trigger,
      #kaConversationListStable .ka-conv-card[data-source-conv]>.nuvem-pin-picker-trigger{right:10px!important;top:50%!important;transform:translateY(-50%)!important}
      /* O aniversário nativo continua funcional, mas agora aparece dentro da home canônica. */
      #keiseApprovedHome>#birthdayHero{width:100%;margin:16px 0 2px!important}
    `
    document.head.appendChild(s)
  }

  function repairPins(){
    if(!approved())return
    document.querySelectorAll('.nuvem-pin-picker-trigger').forEach(btn=>{
      const card=btn.closest('#chatList .chat-item[data-conv],#friendConversationList .friend-conversation[data-friend-conv],#kaConversationList .ka-conv-card[data-source-conv],#kaConversationListStable .ka-conv-card[data-source-conv]')
      if(!card){btn.remove();return}
      if(card.matches('#kaConversationList .ka-conv-card,#kaConversationListStable .ka-conv-card'))card.style.setProperty('position','relative','important')
    })
  }

  function mountBirthdayHero(){
    if(!approved())return false
    const home=$('keiseApprovedHome'),birthday=$('birthdayHero')
    if(!home||!birthday)return false
    if(birthday.parentElement!==home){
      const hero=home.querySelector('.ka-hero')
      if(hero)hero.insertAdjacentElement('afterend',birthday)
      else home.prepend(birthday)
    }
    return true
  }

  // O controlador aprovado espera esta API. A build do Teste já existia, mas não exportava a função.
  if(typeof window.__ISA_OPEN_KEISE_TEST__!=='function'){
    window.__ISA_OPEN_KEISE_TEST__=async()=>{
      try{
        if(!$('testGamePanel'))await import('./keise-game-test.js?v=11-approved-direct-open')
        const nav=window.__ISA_ENSURE_TEST_GAME_NAV__?.()||$('testGameNav')
        if(nav){HTMLElement.prototype.click.call(nav);return true}
        const panel=$('testGamePanel')
        if(panel){panel.classList.remove('hidden');document.documentElement.style.overflow='hidden';return true}
      }catch(error){console.warn('Teste privado:',error)}
      return false
    }
  }

  let listObserver=null
  function bindConversationList(){
    const list=$('kaConversationList')||$('kaConversationListStable')
    if(!list||listObserver?._target===list)return
    try{listObserver?.disconnect()}catch{}
    listObserver=new MutationObserver(()=>requestAnimationFrame(repairPins))
    listObserver._target=list
    listObserver.observe(list,{childList:true,subtree:true})
  }

  function apply(){ensureCss();mountBirthdayHero();repairPins();bindConversationList()}
  for(const ev of ['isa:approved-home-ready','isa:keise-approved-home-built','isa:core-ready','isa:core-boot-complete','isa:pin-style-changed'])document.addEventListener(ev,apply,{passive:true})
  window.addEventListener('pageshow',apply,{once:true})
  apply();setTimeout(apply,350);setTimeout(apply,1200)
  window.__ISA_APPROVED_REGRESSION_FIXES__={apply,repairPins,mountBirthdayHero}
})();
