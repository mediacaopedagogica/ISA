/* Cantinho da Isa — estabilidade canônica V11 para Keise, Isa e Alan.
   Mantém ordem/fixadores/foto estáveis e impede camadas legadas de reaparecerem no dashboard aprovado. */
(function(){
  'use strict'
  if(window.__ISA_APPROVED_STABILITY_V11__)return
  window.__ISA_APPROVED_STABILITY_V11__=true

  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const APPROVED=new Set(['keise','isa','alan'])
  const requested=()=>norm(new URLSearchParams(location.search).get('perfil'))
  const identified=()=>norm($('myName')?.textContent)
  const profile=()=>{const r=requested(),n=identified();for(const p of APPROVED)if(r===p||n===p||n.startsWith(p+' '))return p;return''}
  const approved=()=>APPROVED.has(profile())
  const homeMode=()=>document.body.classList.contains('keise-home-active')&&!document.body.classList.contains('keise-panel-active')
  const whoKey=()=>profile()||'familia'
  const orderKey=()=>`isa-approved-conversation-order-v1:${whoKey()}`
  const pinKey=id=>`isa-nuvem-pin-style-v3:${whoKey()}:${id}`
  let running=false,scheduled=0,targetObserver=null,sourceObserver=null,avatarObserver=null,lastRealAvatar=''

  function readJSON(key,fallback){try{const v=JSON.parse(localStorage.getItem(key)||'null');return v??fallback}catch{return fallback}}
  function writeJSON(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
  function readPin(id){try{return localStorage.getItem(pinKey(id))||''}catch{return''}}

  function stableInnerHtmlGuard(){
    if(window.__ISA_STABLE_INNERHTML_GUARD__)return
    const desc=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML')
    if(!desc?.get||!desc?.set)return
    const clean=value=>String(value??'')
      .replace(/([?&](?:token|expires|signature|x-amz-[^=&]+)=[^&"'<>\s]*)/gi,'')
      .replace(/[?&]+(?=["'])/g,'')
    try{
      Object.defineProperty(Element.prototype,'innerHTML',{
        configurable:desc.configurable,enumerable:desc.enumerable,get:desc.get,
        set:function(value){
          const guarded=this?.classList?.contains('isa-story-strip')||this?.classList?.contains('isa-social-cover')
          if(guarded){
            const sig=clean(value),prev=this.__isaStableHtmlSignature
            if(prev===sig)return value
            try{Object.defineProperty(this,'__isaStableHtmlSignature',{value:sig,writable:true,configurable:true})}catch{this.__isaStableHtmlSignature=sig}
          }
          return desc.set.call(this,value)
        }
      })
      window.__ISA_STABLE_INNERHTML_GUARD__=true
    }catch{}
  }

  function ensureCss(){
    if($('approvedStabilityCssV11'))return
    const s=document.createElement('style');s.id='approvedStabilityCssV11';s.textContent=`
      body.isa-approved-single-owner.keise-home-active #keiseDesktopTopbar,
      body.isa-approved-single-owner.keise-home-active #keiseHomeDashboard,
      body.isa-approved-single-owner.keise-home-active .kd-side-menu,
      body.isa-approved-single-owner.keise-home-active #approvedProfileHome,
      body.isa-approved-single-owner.keise-home-active #approvedPanelBack,
      body.isa-approved-single-owner.keise-home-active #kaPanelBack{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}
      body.isa-approved-single-owner.keise-home-active #keiseApprovedHome,
      body.isa-approved-single-owner.keise-home-active #keiseApprovedTopbar{display:block;visibility:visible!important;opacity:1!important;pointer-events:auto!important}
      #kaConversationList{display:flex;flex-direction:column}
      #kaConversationList>.ka-conv-card{flex:0 0 auto}
      #kaAvatarContent img,#kaTopAvatar img{width:100%;height:100%;object-fit:cover;display:block}
    `;document.head.appendChild(s)
  }

  function cleanLegacy(){
    if(!approved()||!homeMode())return
    document.querySelectorAll('#keiseDesktopTopbar,#keiseHomeDashboard,.kd-side-menu,#approvedProfileHome,#approvedPanelBack,#kaPanelBack,#isaFinalShellShield,#isaFinalShellShieldV2,#isaApprovedShellShield,#isaKeiseApprovedGuard').forEach(el=>el.remove())
    const main=$('mainView');if(main)main.classList.add('approved-shell-mounted')
    $('keiseApprovedTopbar')?.classList.remove('hidden');$('keiseApprovedHome')?.classList.remove('hidden')
  }

  function cardId(card){return String(card?.dataset?.sourceConv||card?.dataset?.kaConv||'')}
  function rememberOrder(cards){
    let saved=readJSON(orderKey(),[]);if(!Array.isArray(saved))saved=[]
    const known=new Set(saved),current=cards.map(cardId).filter(Boolean)
    for(const id of current)if(!known.has(id)){saved.push(id);known.add(id)}
    saved=saved.filter(id=>current.includes(id))
    writeJSON(orderKey(),saved);return saved
  }
  function stabilizeConversations(){
    const box=$('kaConversationList');if(!approved()||!box||!homeMode())return
    const cards=[...box.querySelectorAll(':scope > .ka-conv-card[data-source-conv],:scope > .ka-conv-card[data-ka-conv]')]
    if(!cards.length)return
    const order=rememberOrder(cards),rank=new Map(order.map((id,i)=>[id,i]))
    cards.sort((a,b)=>{
      const ai=cardId(a),bi=cardId(b),ap=readPin(ai)?0:1,bp=readPin(bi)?0:1
      if(ap!==bp)return ap-bp
      return (rank.get(ai)??999999)-(rank.get(bi)??999999)
    })
    const frag=document.createDocumentFragment();cards.forEach(c=>frag.appendChild(c));box.appendChild(frag)
    try{window.__ISA_NUVEM_PIN_PICKER__?.scan?.()}catch{}
  }

  function sourceHasRealAvatar(){const src=$('myAvatar');return !!src?.querySelector?.('img[src]')}
  function sourceAvatarHtml(){const src=$('myAvatar');return src?.innerHTML?.trim()||''}
  function sourceIsIntentionalMascot(){return !!$('myAvatarBtn')?.classList?.contains('mascot-avatar')&&!sourceHasRealAvatar()}
  function stabilizeAvatar(){
    if(!approved())return
    const html=sourceAvatarHtml(),real=sourceHasRealAvatar()
    if(real&&html)lastRealAvatar=html
    else if(sourceIsIntentionalMascot()&&html)lastRealAvatar=''
    const desired=real?html:(sourceIsIntentionalMascot()?html:(lastRealAvatar||html))
    if(!desired)return
    for(const id of ['kaAvatarContent','kaTopAvatar']){
      const el=$(id);if(el&&el.innerHTML!==desired)el.innerHTML=desired
    }
  }

  function bindTarget(){
    const box=$('kaConversationList');if(box&&targetObserver?._target!==box){
      try{targetObserver?.disconnect()}catch{}
      targetObserver=new MutationObserver(()=>schedule())
      targetObserver._target=box;targetObserver.observe(box,{childList:true,subtree:true})
    }
  }
  function bindSource(){
    const box=$('chatList');if(box&&sourceObserver?._target!==box){
      try{sourceObserver?.disconnect()}catch{}
      sourceObserver=new MutationObserver(()=>schedule())
      sourceObserver._target=box;sourceObserver.observe(box,{childList:true,subtree:true,characterData:true})
    }
    const root=$('myAvatar')?.parentElement||$('myAvatar');if(root&&avatarObserver?._target!==root){
      try{avatarObserver?.disconnect()}catch{}
      avatarObserver=new MutationObserver(()=>schedule())
      avatarObserver._target=root;avatarObserver.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['src','class']})
    }
  }

  function scan(){
    if(running||!approved())return false
    running=true
    try{ensureCss();cleanLegacy();bindTarget();bindSource();stabilizeAvatar();stabilizeConversations();return true}
    finally{running=false}
  }
  function schedule(delay=0){clearTimeout(scheduled);scheduled=setTimeout(()=>{scheduled=0;scan()},delay)}

  stableInnerHtmlGuard();ensureCss()
  for(const ev of ['isa:approved-home-ready','isa:keise-approved-home-built','isa:final-shell-ready','isa:core-ready','isa:core-boot-complete','isa:pin-style-changed','isa:profile-updated'])document.addEventListener(ev,()=>schedule(0))
  window.addEventListener('pageshow',()=>schedule(0),{once:true})
  setTimeout(()=>schedule(0),0);setTimeout(()=>schedule(0),500);setTimeout(()=>schedule(0),1400)
  window.__ISA_APPROVED_STABILITY__={scan,schedule,stabilizeConversations,stabilizeAvatar}
})();
