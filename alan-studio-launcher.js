const $=id=>document.getElementById(id)
const who=()=>String($('myName')?.textContent||'').trim().toLowerCase()
if(who()!=='alan')throw new Error('alan-studio-launcher: perfil não autorizado')

let loading=false

function ensureLauncher(){
  if($('alanStudioEntry')||$('alanStudioLauncher'))return
  const nav=document.querySelector('.nav-tabs')
  if(!nav)return
  const btn=document.createElement('button')
  btn.id='alanStudioLauncher'
  btn.type='button'
  btn.className='nav-btn'
  btn.innerHTML='🎸 <span>Meu Estúdio</span>'
  btn.title='Abrir Estúdio do Alan'
  btn.addEventListener('click',openLazyStudio)
  const cal=nav.querySelector('[data-tab="calendar"]')
  if(cal?.nextSibling)nav.insertBefore(btn,cal.nextSibling)
  else nav.appendChild(btn)
}

async function openLazyStudio(){
  if(loading)return
  loading=true
  const btn=$('alanStudioLauncher')
  if(btn){btn.disabled=true;btn.innerHTML='⏳ <span>Abrindo Estúdio…</span>'}
  try{
    await Promise.all([
      import('./alan-studio.js?v=2-lazy'),
      import('./alan-studio-score.js?v=3-lazy'),
      import('./alan-band-management.js?v=2-lazy'),
      import('./alan-band-operations.js?v=2-lazy'),
      import('./alan-genre-studios.js?v=3-lazy')
    ])
    btn?.remove()
    requestAnimationFrame(()=>document.getElementById('alanStudioEntry')?.click())
  }catch(error){
    console.warn('Falha ao abrir Estúdio do Alan:',error)
    loading=false
    if(btn){btn.disabled=false;btn.innerHTML='🎸 <span>Meu Estúdio</span>'}
    const toast=$('toast')
    if(toast){
      toast.textContent='O Estúdio demorou para abrir. O chat continua disponível.'
      toast.classList.remove('hidden')
      setTimeout(()=>toast.classList.add('hidden'),3500)
    }
  }
}

ensureLauncher()
let tries=0
const timer=setInterval(()=>{
  ensureLauncher()
  if($('alanStudioLauncher')||$('alanStudioEntry')||++tries>30)clearInterval(timer)
},250)
