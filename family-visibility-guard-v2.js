// Isa Chat — reforço de privacidade familiar v2.
// Complementa a matriz existente sem reabrir itens que já foram ocultados por outras regras.
(function(){
  'use strict'
  if(window.__ISA_FAMILY_VISIBILITY_GUARD_V2__)return
  window.__ISA_FAMILY_VISIBILITY_GUARD_V2__=true

  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim()
  const alias=n=>({
    'tia vania':'vania','vânia':'vania','vania':'vania',
    'keise pamela':'keise','keise pâmela':'keise','mae':'keise','mãe':'keise'
  }[n]||n.split(' ')[0]||'')
  const key=v=>alias(norm(v))
  const KNOWN=['keise','evalda','isa','alan','elion','silvane','davi','paloma','vania']
  const ONLY={
    elion:new Set(['elion','isa','keise','alan','davi','paloma']),
    evalda:new Set(['evalda','isa','alan','keise','paloma','vania']),
    paloma:new Set(['paloma','keise','alan','davi','isa','evalda','vania']),
    silvane:new Set(['silvane','alan','keise','isa'])
  }
  const BLOCK={
    davi:new Set(['silvane']),
    vania:new Set(['elion','silvane'])
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
  function allowed(v,t){
    v=key(v);t=key(t)
    if(!v||!t||v===t)return true
    if(ONLY[v])return ONLY[v].has(t)
    if(BLOCK[v])return !BLOCK[v].has(t)
    return true
  }
  function candidate(el){
    if(!el)return''
    const values=[el.dataset?.name,el.dataset?.profileName,el.dataset?.personName,el.dataset?.person,
      el.querySelector?.('[data-name]')?.dataset?.name,
      el.querySelector?.('.name,.person-name,.profile-name')?.textContent,
      el.querySelector?.('b,strong')?.textContent].filter(Boolean)
    for(const v of values){const k=key(v);if(KNOWN.includes(k))return k}
    const text=norm(el.textContent||'')
    for(const n of KNOWN){
      const labels=n==='vania'?['tia vania','vania']:n==='keise'?['keise pamela','keise']:[n]
      if(labels.some(x=>text===x||text.startsWith(x+' ')||text.includes(' '+x+' ')))return n
    }
    return''
  }
  function hideIfBlocked(el){
    const v=viewer(),t=candidate(el)
    if(!v||!t)return
    if(!allowed(v,t)){el.dataset.familyVisibilityV2Hidden='1';el.setAttribute('aria-hidden','true')}
    else if(el.dataset.familyVisibilityV2Hidden==='1'){delete el.dataset.familyVisibilityV2Hidden;el.removeAttribute('aria-hidden')}
  }
  function apply(root=document){
    root.querySelectorAll?.([
      '.social-family-item','.social-status-card','.fs-status-card','.spd-person','.isa-birthday-person',
      '#birthdayStrip .birthday-pill','.external-birthday-person','.chat-item','.friend-conversation',
      '[data-conv]','[data-friend-conv]','.social-post','.fs-post'
    ].join(',')).forEach(hideIfBlocked)
  }
  if(!document.getElementById('familyVisibilityGuardV2Style')){
    const s=document.createElement('style');s.id='familyVisibilityGuardV2Style';s.textContent='[data-family-visibility-v2-hidden="1"]{display:none!important}';document.head.appendChild(s)
  }
  let queued=false
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply(document)})}
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true})
  ;['isa:friend-access-valid','isa:friend-portal-entered','isa:chat-opened','isa:birth-date-updated'].forEach(e=>document.addEventListener(e,schedule))
  apply();setTimeout(schedule,250);setTimeout(schedule,900)
  window.__ISA_FAMILY_VISIBILITY_V2__={viewer,allowed,apply,schedule}
})();
