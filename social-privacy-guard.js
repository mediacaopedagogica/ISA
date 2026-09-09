// Isa Chat — regras de privacidade da Nossa Rede.
// Aplica as mesmas regras no núcleo autenticado e nos acessos externos.
(function(){
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ')
  const MAP={
    elion:new Set(['elion','isa','keise','alan','davi']),
    evalda:new Set(['evalda','isa','alan','keise','paloma','vania']),
    paloma:new Set(['paloma','keise','alan','davi','isa','evalda']),
    vania:null, // todos, exceto Elion
    davi:null,
    isa:null,
    keise:null,
    alan:null
  }
  const ALIASES={
    'tia vania':'vania',
    'vânia':'vania',
    'vania':'vania',
    'mãe':'keise',
    'mae':'keise',
    'keise pamela':'keise'
  }
  function key(name){const n=norm(name);return ALIASES[n]||n.split(' ')[0]||''}
  function viewer(){
    return key(window.__ISA_FRIEND_PERSON__?.name||document.getElementById('friendName')?.textContent||document.getElementById('myName')?.textContent||new URLSearchParams(location.search).get('perfil')||'')
  }
  function allowed(viewerName,targetName){
    const v=key(viewerName),t=key(targetName)
    if(!v||!t)return true
    if(v===t)return true
    if(v==='vania')return t!=='elion'
    const set=MAP[v]
    return set?set.has(t):true
  }
  function forbiddenNames(v=viewer()){
    const known=['isa','keise','alan','davi','paloma','vania','evalda','elion']
    return known.filter(n=>!allowed(v,n))
  }
  function removeNode(node){try{node.remove()}catch{node.style.setProperty('display','none','important')}}
  function authorFromPost(post){return post.querySelector('.social-post-head strong,.fs-post-head strong')?.textContent||post.querySelector('.grow strong')?.textContent||''}
  function sanitizeRoot(root=document){
    const v=viewer();if(!v)return
    root.querySelectorAll?.('.social-family-item').forEach(el=>{const n=el.querySelector('strong')?.textContent||'';if(n&&!allowed(v,n))removeNode(el)})
    root.querySelectorAll?.('.social-status-card').forEach(el=>{const n=el.querySelector('strong')?.textContent||'';if(n&&!allowed(v,n))removeNode(el)})
    root.querySelectorAll?.('.social-post').forEach(post=>{const n=authorFromPost(post);if(n&&!allowed(v,n)){removeNode(post);return}
      post.querySelectorAll('.social-comment,.fs-comment').forEach(c=>{const cn=c.querySelector('strong')?.textContent||'';if(cn&&!allowed(v,cn))removeNode(c)})
    })
    // Menus de marcação criados dinamicamente pelo layout aprovado.
    root.querySelectorAll?.('.isa-create-sheet button[data-name]').forEach(b=>{if(!allowed(v,b.dataset.name||b.textContent))removeNode(b)})
  }
  function stripForbiddenMentions(input){
    const v=viewer();if(!v||!input)return
    let text=input.value||''
    const bad=forbiddenNames(v)
    bad.forEach(n=>{const names=n==='vania'?['vania','vânia','tia vania']:n==='keise'?['keise','keise pamela']: [n];names.forEach(label=>{const re=new RegExp('(^|\\s)@'+label.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')+'(?=\\s|$|[.,;:!?])','ig');text=text.replace(re,'$1')})})
    if(text!==input.value){input.value=text;input.dispatchEvent(new Event('change',{bubbles:true}));toast('Essa marcação não está disponível neste perfil.')}
  }
  function toast(text){
    const t=document.getElementById('friendToast')||document.getElementById('toast');if(!t)return
    t.textContent=text;t.classList.remove('hidden');clearTimeout(t._privacy);t._privacy=setTimeout(()=>t.classList.add('hidden'),2300)
  }
  function wireInputs(){
    document.querySelectorAll('#fsCaption,#socialCaption').forEach(input=>{
      if(input.dataset.socialPrivacyBound==='1')return
      input.dataset.socialPrivacyBound='1'
      input.addEventListener('input',()=>stripForbiddenMentions(input))
      input.addEventListener('paste',()=>setTimeout(()=>stripForbiddenMentions(input),0))
    })
  }
  function apply(){sanitizeRoot(document);wireInputs()}
  let queued=false
  const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply()})})
  observer.observe(document.documentElement,{childList:true,subtree:true})
  document.addEventListener('isa:friend-access-valid',()=>setTimeout(apply,0))
  document.addEventListener('isa:friend-portal-entered',()=>setTimeout(apply,0))
  document.addEventListener('click',e=>{if(e.target.closest?.('#friendSocialBtn,#socialNav,[data-ka-action="social"]'))setTimeout(apply,80)},true)
  window.__ISA_SOCIAL_PRIVACY__={viewer,allowed,apply,forbiddenNames}
  apply();setTimeout(apply,500);setTimeout(apply,1500)
})();
