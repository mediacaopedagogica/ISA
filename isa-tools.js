const $=id=>document.getElementById(id)
let studyLoading=null
function isIsa(){return String($('myName')?.textContent||'').trim().toLowerCase()==='isa'}
function activeConversationId(){return document.querySelector('.chat-item.active[data-conv]')?.dataset.conv||'private'}
function ensureStudyBundle(){
  if(window.__ISA_OPEN_STUDY__)return Promise.resolve()
  if(studyLoading)return studyLoading
  studyLoading=new Promise((resolve,reject)=>{
    const existing=document.querySelector('script[data-study-bundle]')
    if(existing){existing.addEventListener('load',resolve,{once:true});setTimeout(resolve,500);return}
    const s=document.createElement('script');s.src='./study-bundle-v36.js?v=36';s.defer=true;s.dataset.studyBundle='1';s.onload=resolve;s.onerror=()=>reject(new Error('Não foi possível carregar Estudos.'));document.body.appendChild(s)
  })
  return studyLoading
}
function ensureMenu(){
  if(!isIsa())return
  const panel=$('chatPanel'),plus=$('groupPlusBtn'),menu=$('groupPlusMenu')
  if(!panel||!plus||!menu||panel.classList.contains('hidden'))return
  plus.classList.remove('hidden')
  if(!menu.querySelector('[data-isa-tool="study"]')){
    const b=document.createElement('button');b.type='button';b.dataset.isaTool='study';b.textContent='📚 Estudos';menu.prepend(b)
    b.onclick=async()=>{menu.classList.add('hidden');window.__ISA_STUDY_SCOPE_HINT__=activeConversationId();try{await ensureStudyBundle();setTimeout(()=>window.__ISA_OPEN_STUDY__?.(window.__ISA_STUDY_SCOPE_HINT__),30)}catch(e){alert(e.message)}}
  }
  if(!menu.querySelector('[data-isa-tool="diary"]')){
    const b=document.createElement('button');b.type='button';b.dataset.isaTool='diary';b.textContent='📔 Meu Diário';menu.prepend(b)
    b.onclick=()=>{menu.classList.add('hidden');location.href='./diario.html'}
  }
}
const obs=new MutationObserver(()=>ensureMenu())
obs.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']})
window.addEventListener('load',()=>setTimeout(ensureMenu,500))
setInterval(ensureMenu,1800)