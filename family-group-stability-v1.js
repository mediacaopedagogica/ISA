// Cantinho da Isa — proteção cirúrgica do grupo Família contra remoções transitórias.
(function(){
  'use strict'
  if(window.__ISA_FAMILY_GROUP_STABILITY_V1__)return
  window.__ISA_FAMILY_GROUP_STABILITY_V1__=true

  const GROUP_ID='271ce839-07ab-4cc8-8375-cbc96457b308'
  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const approved=()=>{
    const q=norm(new URLSearchParams(location.search).get('perfil'))
    const n=norm($('myName')?.textContent)
    return ['keise','isa','alan'].some(p=>q===p||n===p||n.startsWith(p+' '))
  }
  const home=()=>approved()&&document.body.classList.contains('keise-home-active')&&!document.body.classList.contains('keise-panel-active')
  const source=()=>document.querySelector(`#chatList .chat-item[data-conv="${GROUP_ID}"]`)
  const target=()=>document.querySelector(`#kaConversationList .ka-conv-card[data-ka-conv="${GROUP_ID}"]`)
  let lastSourceSeen=0,observer=null,timer=0

  function protect(){
    clearTimeout(timer)
    if(!home())return
    const src=source();if(src)lastSourceSeen=Date.now()
    const card=target();if(!card||card.dataset.familyGroupProtected==='1')return
    card.dataset.familyGroupProtected='1'
    const nativeRemove=card.remove.bind(card)
    card.remove=function(){
      const stillExists=!!source()
      if(stillExists||Date.now()-lastSourceSeen<1800){
        clearTimeout(timer);timer=setTimeout(protect,220)
        return card
      }
      return nativeRemove()
    }
  }

  function bind(){
    const box=$('kaConversationList');if(!box||observer?._target===box)return
    try{observer?.disconnect()}catch{}
    observer=new MutationObserver(()=>requestAnimationFrame(protect));observer._target=box
    observer.observe(box,{childList:true,subtree:false})
    protect()
  }

  document.addEventListener('isa:approved-home-ready',()=>{bind();protect()},{passive:true})
  document.addEventListener('isa:keise-approved-home-built',()=>{bind();protect()},{passive:true})
  window.addEventListener('pageshow',bind,{once:true})
  bind();setTimeout(bind,600)
  window.__ISA_FAMILY_GROUP_STABILITY__={protect,get groupId(){return GROUP_ID}}
})();
