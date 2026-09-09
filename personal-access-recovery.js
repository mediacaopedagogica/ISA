(()=>{
  const params=new URLSearchParams(location.search)
  const personal=params.get('entrada')==='pessoal'
  const requested=(params.get('perfil')||'').trim()
  if(!personal||!requested)return

  const clearAuthStorage=()=>{
    for(const store of [localStorage,sessionStorage]){
      const keys=[]
      for(let i=0;i<store.length;i++){
        const key=store.key(i)||''
        if((key.startsWith('sb-')&&key.endsWith('-auth-token'))||key.startsWith('isa:personal-access:'))keys.push(key)
      }
      keys.forEach(key=>{try{store.removeItem(key)}catch{}})
    }
  }

  let exiting=false
  const hardLogout=()=>{
    if(exiting)return
    exiting=true
    const btn=document.getElementById('logoutBtn')
    if(btn){btn.disabled=true;btn.textContent='Saindo…'}
    clearAuthStorage()
    try{navigator.serviceWorker?.controller?.postMessage?.({type:'ISA_SESSION_CLEARED'})}catch{}
    const target=new URL('./',location.href)
    target.searchParams.set('logout','1')
    target.searchParams.set('_cb',String(Date.now()))
    target.hash=''
    location.replace(target.href)
  }

  // O botão Sair precisa funcionar mesmo se o núcleo ficar esperando uma consulta.
  document.addEventListener('pointerup',event=>{
    if(event.target.closest?.('#logoutBtn')){
      event.preventDefault()
      event.stopImmediatePropagation()
      hardLogout()
    }
  },true)
  document.addEventListener('keydown',event=>{
    if((event.key==='Enter'||event.key===' ')&&event.target.closest?.('#logoutBtn')){
      event.preventDefault()
      hardLogout()
    }
  },true)

  const makeShellInteractive=()=>{
    const main=document.getElementById('mainView')
    if(!main||main.classList.contains('hidden'))return
    main.style.pointerEvents='auto'
    main.querySelectorAll('button,[role="button"],.chat-item').forEach(el=>{
      if(!el.disabled)el.style.pointerEvents='auto'
    })
  }

  let checks=0
  const timer=setInterval(()=>{
    makeShellInteractive()
    const main=document.getElementById('mainView')
    const name=String(document.getElementById('myName')?.textContent||'').trim()
    const list=document.getElementById('chatList')
    if(main&&!main.classList.contains('hidden')&&name&&name!=='Família'){
      window.__ISA_HIDE_BOOT_GUARD__?.()
      if(list&&!/Carregando conversas/i.test(list.textContent||'')){
        clearInterval(timer)
        return
      }
    }
    if(++checks>=100)clearInterval(timer)
  },120)

  window.__ISA_PERSONAL_ACCESS_RECOVERY__={requested,hardLogout,makeShellInteractive}
})()
