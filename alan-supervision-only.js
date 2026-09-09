const who=()=>String(document.getElementById('myName')?.textContent||'').trim().toLowerCase()

if(who()==='alan'){
  let applying=false
  let queued=false

  function enforceAlanSupervisionOnly(){
    if(applying)return
    applying=true
    try{
      const parentsNav=document.getElementById('parentsNav')
      const parentsPanel=document.getElementById('parentsPanel')
      const supervisionNav=document.getElementById('supervisionNav')
      const role=document.getElementById('myRole')

      if(parentsNav){
        if(!parentsNav.classList.contains('hidden'))parentsNav.classList.add('hidden')
        if(parentsNav.getAttribute('aria-hidden')!=='true')parentsNav.setAttribute('aria-hidden','true')
        if(parentsNav.getAttribute('tabindex')!=='-1')parentsNav.setAttribute('tabindex','-1')
        if(!parentsNav.disabled)parentsNav.disabled=true
      }
      if(parentsPanel&&!parentsPanel.classList.contains('hidden'))parentsPanel.classList.add('hidden')
      if(supervisionNav){
        if(supervisionNav.classList.contains('hidden'))supervisionNav.classList.remove('hidden')
        if(supervisionNav.hasAttribute('aria-hidden'))supervisionNav.removeAttribute('aria-hidden')
        if(supervisionNav.disabled)supervisionNav.disabled=false
      }
      if(role&&role.textContent!=='Pai • Supervisão da Isa')role.textContent='Pai • Supervisão da Isa'
    }finally{
      applying=false
    }
  }

  function scheduleEnforce(){
    if(queued)return
    queued=true
    queueMicrotask(()=>{
      queued=false
      enforceAlanSupervisionOnly()
    })
  }

  document.addEventListener('click',event=>{
    const target=event.target.closest?.('#parentsNav,[data-tab="parents"]')
    if(!target)return
    event.preventDefault()
    event.stopImmediatePropagation()
    enforceAlanSupervisionOnly()
    document.getElementById('supervisionNav')?.click()
  },true)

  enforceAlanSupervisionOnly()

  // Observa somente os controles que realmente precisam ser protegidos.
  // Antes o observer ficava no <body> inteiro e reagia a TODA mudança de classe
  // do chat, causando ciclos de atualização e travamentos principalmente no perfil Alan.
  const observer=new MutationObserver(scheduleEnforce)
  const parentsNav=document.getElementById('parentsNav')
  const parentsPanel=document.getElementById('parentsPanel')
  const supervisionNav=document.getElementById('supervisionNav')
  if(parentsNav)observer.observe(parentsNav,{attributes:true,attributeFilter:['class','disabled','aria-hidden','tabindex']})
  if(parentsPanel)observer.observe(parentsPanel,{attributes:true,attributeFilter:['class']})
  if(supervisionNav)observer.observe(supervisionNav,{attributes:true,attributeFilter:['class','disabled','aria-hidden']})

  window.__ISA_ALAN_SUPERVISION__={enforce:enforceAlanSupervisionOnly,observer}
}
