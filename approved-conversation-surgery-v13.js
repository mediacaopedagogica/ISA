// Cantinho da Isa — cirurgia do layout legado, fase 1.
// O motor antigo pode continuar atualizando #chatList, mas a home aprovada não é mais destruída/recriada por essas atualizações.
(function(){
  'use strict'
  if(window.__ISA_APPROVED_CONVERSATION_SURGERY_V13__)return
  window.__ISA_APPROVED_CONVERSATION_SURGERY_V13__=true

  // Bloqueia os estabilizadores antigos que removiam/reanexavam todos os cards e provocavam piscadas.
  window.__ISA_APPROVED_STABILITY_V11__=true
  window.__ISA_APPROVED_CONVERSATION_STABILITY__=true

  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const approvedProfiles=new Set(['keise','isa','alan'])
  const requested=()=>norm(new URLSearchParams(location.search).get('perfil'))
  const profile=()=>{
    const q=requested(),n=norm($('myName')?.textContent)
    for(const p of approvedProfiles)if(q===p||n===p||n.startsWith(p+' '))return p
    return''
  }
  const homeActive=()=>document.body.classList.contains('keise-home-active')&&!document.body.classList.contains('keise-panel-active')
  const orderKey=()=>`isa-approved-conversation-order-v2:${profile()||'familia'}`
  const pinKey=id=>`isa-nuvem-pin-style-v3:${profile()||'familia'}:${id}`
  const avatarMemory=new Map()
  let sourceObserver=null,timer=0,patchedTarget=null,legacyReplace=null,legacyAppend=null

  function readJSON(key,fallback){try{const v=JSON.parse(localStorage.getItem(key)||'null');return v??fallback}catch{return fallback}}
  function writeJSON(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
  function readPin(id){try{return localStorage.getItem(pinKey(id))||''}catch{return''}}
  function idOf(card){return String(card?.dataset?.sourceConv||card?.dataset?.kaConv||card?.dataset?.conv||'')}
  function sourceCards(){const s=$('chatList');return s?[...s.querySelectorAll('.chat-item[data-conv]')].filter(x=>!x.classList.contains('hidden')&&getComputedStyle(x).display!=='none'):[]}
  function targetCards(){const t=$('kaConversationList');return t?[...t.querySelectorAll(':scope > .ka-conv-card[data-source-conv],:scope > .ka-conv-card[data-ka-conv]')]:[]}
  function cloneSource(orig){
    const id=String(orig?.dataset?.conv||'');if(!id)return null
    const c=orig.cloneNode(true);c.removeAttribute('id');c.querySelectorAll('[id]').forEach(x=>x.removeAttribute('id'));c.classList.add('ka-conv-card');c.removeAttribute('data-conv');c.dataset.kaConv=id;c.dataset.sourceConv=id;c.querySelectorAll('[data-conv]').forEach(x=>x.removeAttribute('data-conv'));return c
  }
  function avatarNode(card){return card?.querySelector?.('.avatar,[data-avatar-id]')||null}
  function realAvatar(node){return !!node?.querySelector?.('img[src]')}
  function memberId(node){return String(node?.dataset?.avatarId||'')}

  function patchCard(existing,incoming){
    if(!existing||!incoming)return existing
    const id=idOf(existing)||idOf(incoming);if(!id)return existing
    existing.classList.toggle('active',incoming.classList.contains('active'))
    const eg=existing.querySelector('.grow'),ig=incoming.querySelector('.grow')
    if(eg&&ig&&eg.innerHTML!==ig.innerHTML)eg.innerHTML=ig.innerHTML

    const ea=avatarNode(existing),ia=avatarNode(incoming)
    if(ea&&ia){
      const oldMember=memberId(ea),newMember=memberId(ia),currentReal=realAvatar(ea),incomingReal=realAvatar(ia)
      if(incomingReal&&(!currentReal||oldMember!==newMember)){
        ea.innerHTML=ia.innerHTML;if(newMember)ea.dataset.avatarId=newMember;avatarMemory.set(id,{member:newMember,html:ia.innerHTML})
      }else if(currentReal){
        if(!avatarMemory.has(id))avatarMemory.set(id,{member:oldMember,html:ea.innerHTML})
      }else{
        const saved=avatarMemory.get(id)
        if(saved?.html&&(!saved.member||!newMember||saved.member===newMember))ea.innerHTML=saved.html
        else if(ea.innerHTML!==ia.innerHTML)ea.innerHTML=ia.innerHTML
        if(newMember)ea.dataset.avatarId=newMember
      }
    }
    existing.dataset.kaConv=id;existing.dataset.sourceConv=id
    return existing
  }

  function rememberOrder(cards){
    const current=cards.map(idOf).filter(Boolean);let saved=readJSON(orderKey(),[]);if(!Array.isArray(saved))saved=[]
    const known=new Set(saved);for(const id of current)if(!known.has(id)){saved.push(id);known.add(id)}
    saved=saved.filter(id=>current.includes(id));writeJSON(orderKey(),saved);return saved
  }
  function applyStableOrder(){
    const box=$('kaConversationList'),cards=targetCards();if(!box||cards.length<2)return
    const saved=rememberOrder(cards),rank=new Map(saved.map((id,i)=>[id,i]))
    const desired=cards.slice().sort((a,b)=>{const ai=idOf(a),bi=idOf(b),ap=readPin(ai)?0:1,bp=readPin(bi)?0:1;if(ap!==bp)return ap-bp;return(rank.get(ai)??999999)-(rank.get(bi)??999999)})
    const currentIds=cards.map(idOf).join('|'),desiredIds=desired.map(idOf).join('|');if(currentIds===desiredIds)return
    desired.forEach((card,i)=>{const at=box.children[i];if(at!==card)Node.prototype.insertBefore.call(box,card,at||null)})
  }

  function guardLegacyRenderer(){
    const target=$('kaConversationList');if(!target||patchedTarget===target)return false
    patchedTarget=target
    legacyReplace=target.replaceChildren.bind(target);legacyAppend=target.appendChild.bind(target)
    try{
      Object.defineProperty(target,'replaceChildren',{configurable:true,value:function(...nodes){
        const cards=targetCards()
        // O renderer legado chama replaceChildren() antes de reconstruir tudo. Se a home já tem cards, preserva o DOM atual.
        if(homeActive()&&cards.length&&nodes.length===0){target.dataset.surgeryLegacyClearBlocked='1';return}
        return legacyReplace(...nodes)
      }})
      Object.defineProperty(target,'appendChild',{configurable:true,value:function(node){
        if(homeActive()&&node?.nodeType===1&&node.classList?.contains('ka-empty-note')&&targetCards().length)return node
        if(homeActive()&&node?.nodeType===1&&node.classList?.contains('ka-conv-card')){
          const id=idOf(node),existing=id?[...targetCards()].find(c=>idOf(c)===id):null
          if(existing){patchCard(existing,node);return existing}
          const added=legacyAppend(node);schedule(40);return added
        }
        return legacyAppend(node)
      }})
      target.dataset.surgeryV13='1';return true
    }catch(error){console.warn('Cirurgia de conversas:',error);return false}
  }

  function reconcile(){
    timer=0;if(!approvedProfiles.has(profile())||!homeActive())return false
    guardLegacyRenderer()
    const target=$('kaConversationList'),src=sourceCards();if(!target)return false
    const current=targetCards(),byId=new Map(current.map(c=>[idOf(c),c]))
    if(!src.length){applyStableOrder();return true}

    const seen=new Set();let created=false
    for(const orig of src){
      const id=String(orig.dataset.conv||'');if(!id||seen.has(id))continue;seen.add(id)
      const incoming=cloneSource(orig);if(!incoming)continue
      const existing=byId.get(id)
      if(existing)patchCard(existing,incoming)
      else{legacyAppend?legacyAppend(incoming):Node.prototype.appendChild.call(target,incoming);created=true}
    }
    // Só remove após o motor entregar uma lista válida e não vazia; vazios transitórios nunca apagam a home aprovada.
    for(const [id,card] of byId)if(!seen.has(id)){card.remove();avatarMemory.delete(id)}
    applyStableOrder()
    if(created)setTimeout(()=>window.__ISA_NUVEM_PIN_PICKER__?.scan?.(),0)
    return true
  }
  function schedule(delay=120){clearTimeout(timer);timer=setTimeout(reconcile,delay)}

  function bindSource(){
    const source=$('chatList');if(!source||sourceObserver?._target===source)return
    try{sourceObserver?.disconnect()}catch{}
    sourceObserver=new MutationObserver(()=>schedule(90));sourceObserver._target=source
    sourceObserver.observe(source,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','src']})
  }
  function start(){guardLegacyRenderer();bindSource();reconcile()}

  document.addEventListener('isa:approved-home-ready',()=>{start();schedule(0)},{passive:true})
  document.addEventListener('isa:keise-approved-home-built',()=>{start();schedule(0)},{passive:true})
  document.addEventListener('isa:pin-style-changed',e=>{
    const id=String(e.detail?.conversationId||''),style=String(e.detail?.style||'')
    if(id){try{style?localStorage.setItem(pinKey(id),style):localStorage.removeItem(pinKey(id))}catch{}}
    schedule(0)
  },{passive:true})
  document.addEventListener('isa:profile-updated',()=>{avatarMemory.clear();schedule(180)},{passive:true})
  window.addEventListener('pageshow',()=>{start();schedule(0)},{once:true})

  // API compatível com módulos já existentes, sem o comportamento legado de desanexar todos os cards.
  window.__ISA_APPROVED_STABILITY__={scan:reconcile,schedule,stabilizeConversations:reconcile,stabilizeAvatar:()=>true}
  window.__ISA_STABILIZE_APPROVED_CONVERSATIONS__=()=>{schedule(0);return true}
  window.__ISA_APPROVED_CONVERSATION_SURGERY__={start,reconcile,schedule,applyStableOrder,guardLegacyRenderer}

  start();setTimeout(start,120);setTimeout(()=>schedule(0),600)
})();
