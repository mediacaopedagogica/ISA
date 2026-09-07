const $=id=>document.getElementById(id)
let loading=false,loaded=false
const modules=['./study.js','./study-document.js','./study-document-collab.js','./retention-notice.js','./study-randomizer.js','./study-flashcards.js','./study-flashcards-delete.js','./study-ideas.js','./study-mindmap.js','./study-periodic.js','./study-material-manager.js','./study-timer.js']
function isIsa(){return String($('myName')?.textContent||'').trim().toLowerCase()==='isa'}
function chatOpen(){return !$('chatPanel')?.classList.contains('hidden')}
async function ensureStudy(){
 if(loaded)return true;if(loading)return false;loading=true
 try{
   for(const m of modules){try{await import(m)}catch(e){console.warn('Módulo de Estudos indisponível:',m,e)}}
   loaded=typeof window.__ISA_OPEN_STUDY__==='function';return loaded
 }finally{loading=false}
}
async function openStudy(){
 const btn=$('studyPlusBtn');if(btn)btn.disabled=true
 try{
   const ok=await ensureStudy();if(!ok)throw new Error('Não foi possível carregar Estudos.')
   window.__ISA_STUDY_SCOPE_HINT__='private';await window.__ISA_OPEN_STUDY__('private')
 }catch(e){const t=$('toast');if(t){t.textContent=e.message||'Não foi possível abrir Estudos.';t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),2200)}}
 finally{if(btn)btn.disabled=false;$('groupPlusMenu')?.classList.add('hidden')}
}
function mount(){
 const plus=$('groupPlusBtn'),menu=$('groupPlusMenu');if(!plus||!menu)return
 let study=$('studyPlusBtn');if(!study){study=document.createElement('button');study.type='button';study.id='studyPlusBtn';study.innerHTML='📚 Estudos';study.onclick=openStudy;menu.prepend(study)}
 if(isIsa()&&chatOpen())plus.classList.remove('hidden')
 if(!isIsa())study.classList.add('hidden');else study.classList.remove('hidden')
}
const obs=new MutationObserver(mount);obs.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']})
window.addEventListener('load',()=>setTimeout(mount,200));mount()
