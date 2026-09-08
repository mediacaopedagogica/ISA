const who=()=>String(document.getElementById('myName')?.textContent||'').trim().toLowerCase()
if(who()!=='alan') throw new Error('alan-supervision-only: perfil não autorizado')

function enforceAlanSupervisionOnly(){
  const parentsNav=document.getElementById('parentsNav')
  const parentsPanel=document.getElementById('parentsPanel')
  const supervisionNav=document.getElementById('supervisionNav')
  const role=document.getElementById('myRole')

  if(parentsNav){
    parentsNav.classList.add('hidden')
    parentsNav.setAttribute('aria-hidden','true')
    parentsNav.setAttribute('tabindex','-1')
    parentsNav.disabled=true
  }
  if(parentsPanel) parentsPanel.classList.add('hidden')
  if(supervisionNav){
    supervisionNav.classList.remove('hidden')
    supervisionNav.removeAttribute('aria-hidden')
    supervisionNav.disabled=false
  }
  if(role) role.textContent='Pai • Supervisão da Isa'
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
const observer=new MutationObserver(enforceAlanSupervisionOnly)
observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','disabled']})
let checks=0
const timer=setInterval(()=>{
  enforceAlanSupervisionOnly()
  if(++checks>=30) clearInterval(timer)
},500)
