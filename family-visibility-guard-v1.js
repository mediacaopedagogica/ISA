// Isa Chat — matriz central de visibilidade familiar.
// Mantém Rede Social, aniversários, diretório de perfis e conversas coerentes entre si.
(function(){
  if(window.__ISA_FAMILY_VISIBILITY_GUARD_V1__)return
  window.__ISA_FAMILY_VISIBILITY_GUARD_V1__=true

  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim()
  const ALIASES={
    'tia vania':'vania','vânia':'vania','vania':'vania',
    'keise pamela':'keise','keise pâmela':'keise','mae':'keise','mãe':'keise'
  }
  const KNOWN=['keise','evalda','isa','alan','elion','silvane','davi','paloma','vania']
  const ONLY={
    elion:new Set(['elion','isa','keise','alan','davi','paloma']),
    evalda:new Set(['evalda','isa','alan','keise','paloma','vania']),
    paloma:new Set(['paloma','keise','alan','davi','isa','evalda','vania']),
    silvane:new Set(['silvane','alan','keise','isa'])
  }
  const BLOCK={
    davi:new Set(['silvane'])
  }

  function key(value){
    const n=norm(value)
    if(!n)return''
    if(ALIASES[n])return ALIASES[n]
    const first=n.split(' ')[0]
    return ALIASES[first]||first
  }
  function viewer(){
    return key(
      window.__ISA_FRIEND_PERSON__?.name ||
      document.getElementById('friendName')?.textContent ||
      document.getElementById('myName')?.textContent ||
      new URLSearchParams(location.search).get('perfil') ||
      document.body?.dataset?.profile || ''
    )
  }
  function allowed(viewerName,targetName){
    const v=key(viewerName),t=key(targetName)
    if(!v||!t)return true
    if(v===t)return true
    if(ONLY[v])return ONLY[v].has(t)
    if(BLOCK[v])return !BLOCK[v].has(t)
    return true
  }
  function forbiddenNames(v=viewer()){
    return KNOWN.filter(n=>!allowed(v,n))
  }
  function candidateKey(el){
    if(!el)return''
    const vals=[
      el.dataset?.name,el.dataset?.profileName,el.dataset?.personName,el.dataset?.person,
      el.querySelector?.('[data-name]')?.dataset?.name,
      el.querySelector?.('.name,.person-name,.profile-name')?.textContent,
      el.querySelector?.('b')?.textContent,
      el.querySelector?.('strong')?.textContent
    ].filter(Boolean)
    for(const v of vals){const k=key(v);if(KNOWN.includes(k))return k}
    const text=norm(el.textContent||'')
    for(const n of KNOWN){
      const labels=n==='vania'?['tia vania','vania']:n==='keise'?['keise pamela','keise']: [n]
      if(labels.some(label=>text===label||text.startsWith(label+' ')||text.includes(' '+label+' ')))return n
    }
    return''
  }
  function directChatKey(card){
    const title=card?.querySelector?.('strong,.chat-name,.friend-conversation-name,.conversation-title')?.textContent||''
    const n=norm(title.replace(/[★☆]/g,''))
    if(!n||/\b(grupo|familia|família)\b/.test(n)||String(title).includes('👥'))return''
    const k=key(n)
    return KNOWN.includes(k)?k:''
  }
  function setVisible(el,show){
    if(!el)return
    if(show){
      if(el.dataset.familyVisibilityHidden==='1'){
        delete el.dataset.familyVisibilityHidden
        el.removeAttribute('aria-hidden')
      }
      return
    }
    if(el.dataset.familyVisibilityHidden!=='1'){
      el.dataset.familyVisibilityHidden='1'
      el.setAttribute('aria-hidden','true')
    }
  }
  function filterNamed(selector,root=document){
    const v=viewer();if(!v)return
    root.querySelectorAll?.(selector).forEach(el=>{
      const target=candidateKey(el)
      if(target)setVisible(el,allowed(v,target))
    })
  }
  function filterPosts(root=document){
    const v=viewer();if(!v)return
    root.querySelectorAll?.('.social-post,.fs-post').forEach(post=>{
      const name=post.querySelector('.social-post-head strong,.fs-post-head strong,.grow strong')?.textContent||''
      const target=key(name)
      if(target&&KNOWN.includes(target))setVisible(post,allowed(v,target))
      if(post.dataset.familyVisibilityHidden==='1')return
      post.querySelectorAll('.social-comment,.fs-comment').forEach(comment=>{
        const ck=key(comment.querySelector('strong')?.textContent||'')
        if(ck&&KNOWN.includes(ck))setVisible(comment,allowed(v,ck))
      })
    })
  }
  function filterChats(root=document){
    const v=viewer();if(!v)return
    root.querySelectorAll?.('#chatList .chat-item,#chatList [data-conv],#friendConversationList .friend-conversation,#friendConversationList [data-friend-conv]').forEach(card=>{
      const target=directChatKey(card)
      if(target)setVisible(card,allowed(v,target))
    })
  }
  function filterMenus(root=document){
    const v=viewer();if(!v)return
    root.querySelectorAll?.('.isa-create-sheet button[data-name],[data-mention-name],[data-tag-name]').forEach(el=>{
      const target=key(el.dataset.name||el.dataset.mentionName||el.dataset.tagName||el.textContent||'')
      if(target&&KNOWN.includes(target))setVisible(el,allowed(v,target))
    })
  }
  function apply(root=document){
    filterNamed('.social-family-item,.social-status-card,.fs-status-card,.spd-person,.isa-birthday-person,#birthdayStrip .birthday-pill',root)
    filterPosts(root)
    filterChats(root)
    filterMenus(root)
  }
  function toast(text){
    const t=document.getElementById('friendToast')||document.getElementById('toast')
    if(!t)return
    t.textContent=text;t.classList.remove('hidden');clearTimeout(t._familyVisibility);t._familyVisibility=setTimeout(()=>t.classList.add('hidden'),2400)
  }
  function blockedTargetFromClick(target){
    const v=viewer();if(!v)return''
    const row=target.closest?.('.social-family-item,.spd-person,.social-status-card,.fs-status-card,.chat-item,.friend-conversation,[data-conv],[data-friend-conv]')
    if(!row)return''
    const k=row.matches?.('.chat-item,.friend-conversation,[data-conv],[data-friend-conv]')?directChatKey(row):candidateKey(row)
    return k&&!allowed(v,k)?k:''
  }

  if(!document.getElementById('familyVisibilityGuardStyle')){
    const s=document.createElement('style');s.id='familyVisibilityGuardStyle';s.textContent='[data-family-visibility-hidden="1"]{display:none!important}';document.head.appendChild(s)
  }

  document.addEventListener('click',e=>{
    const blocked=blockedTargetFromClick(e.target)
    if(!blocked)return
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();toast('Este perfil não está disponível para esta conta.')
  },true)

  let queued=false
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply(document)})}
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})
  ;['isa:friend-access-valid','isa:friend-portal-entered','isa:chat-opened','isa:approved-home-ready','isa:keise-approved-home-built','isa:birth-date-updated'].forEach(evt=>document.addEventListener(evt,()=>setTimeout(schedule,0)))
  document.addEventListener('click',e=>{if(e.target.closest?.('#friendSocialBtn,#socialNav,[data-ka-action="social"],[data-approved-action="calendar"],[data-tab="calendar"]'))setTimeout(schedule,60)},true)

  window.__ISA_FAMILY_VISIBILITY__={norm,key,viewer,allowed,forbiddenNames,apply,schedule}
  apply();setTimeout(schedule,350);setTimeout(schedule,1000);setTimeout(schedule,2200)
})();
