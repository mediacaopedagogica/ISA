const $=id=>document.getElementById(id)
let studyLoading=null
const studyModules=['./study.js','./study-document.js','./study-document-collab.js','./retention-notice.js','./study-randomizer.js','./study-flashcards.js','./study-flashcards-delete.js','./study-ideas.js','./study-mindmap.js','./study-periodic.js','./study-material-manager.js','./study-timer.js']
function isIsa(){return String($('myName')?.textContent||'').trim().toLowerCase()==='isa'}
function toast(text,ms=3200){const t=$('toast');if(!t){alert(text);return}t.textContent=text;t.classList.remove('hidden');clearTimeout(t._isaTools);t._isaTools=setTimeout(()=>t.classList.add('hidden'),ms)}
async function ensureStudyModules(){
  if(typeof window.__ISA_OPEN_STUDY__==='function')return true
  if(studyLoading)return studyLoading
  studyLoading=(async()=>{
    for(const path of studyModules){
      try{await import(`${path}?v=40-stable`)}catch(e){console.warn('Módulo de Estudos indisponível:',path,e)}
    }
    if(typeof window.__ISA_OPEN_STUDY__!=='function')throw new Error('Estudos não conseguiu iniciar.')
    return true
  })().catch(e=>{studyLoading=null;throw e})
  return studyLoading
}
function setActiveNav(tab){document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab))}
async function openStudy(){
  if(!isIsa())return
  const b=$('studyNav');if(b){b.disabled=true;b.dataset.loading='1';b.setAttribute('aria-busy','true')}
  toast('Abrindo Estudos…',1600)
  try{
    window.__ISA_STUDY_SCOPE_HINT__='private'
    await ensureStudyModules()
    window.__ISA_MOBILE_SHOW_CONTENT__?.('panel')
    await Promise.resolve(window.__ISA_OPEN_STUDY__('private'))
    setActiveNav('study')
  }catch(e){console.error('Estudos:',e);toast(e.message||'Não foi possível abrir Estudos.',4200);studyLoading=null}
  finally{if(b){b.disabled=false;delete b.dataset.loading;b.removeAttribute('aria-busy')}}
}
function openDiary(){if(isIsa())location.href='./diario.html?v=capa-3d-2'}
async function openAlarm(){
  if(!isIsa())return
  try{await import('./calendar-alarm.js?v=4');const hiddenBtn=$('newAlarmBtn');if(hiddenBtn){hiddenBtn.style.display='none';hiddenBtn.click();return}toast('Não foi possível abrir o Alarme agora.')}
  catch(e){console.error(e);toast('Não foi possível abrir o Alarme.')}
}
function wireNav(){
  const diary=$('diaryNav'),study=$('studyNav')
  if(!isIsa()){diary?.classList.add('hidden');study?.classList.add('hidden');return}
  diary?.classList.remove('hidden');study?.classList.remove('hidden')
  if(diary&&!diary.dataset.isaBound){diary.dataset.isaBound='1';diary.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openDiary()},true)}
  if(study&&!study.dataset.isaBound){study.dataset.isaBound='1';study.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openStudy()},true)}
}
function ensureConversationMenu(){
  const menu=$('groupPlusMenu'),plus=$('groupPlusBtn'),panel=$('chatPanel')
  if(!menu||!plus||!panel||panel.classList.contains('hidden')||!isIsa())return
  plus.classList.remove('hidden')
  let study=menu.querySelector('[data-isa-tool="study"]')
  if(!study){study=document.createElement('button');study.type='button';study.dataset.isaTool='study';study.textContent='📚 Estudos';menu.prepend(study)}
  if(!study.dataset.bound){study.dataset.bound='1';study.addEventListener('click',async()=>{menu.classList.add('hidden');await openStudy()})}
  let alarm=menu.querySelector('[data-isa-tool="alarm"]')
  if(!alarm){alarm=document.createElement('button');alarm.type='button';alarm.dataset.isaTool='alarm';alarm.textContent='⏰ Criar alarme';menu.prepend(alarm)}
  if(!alarm.dataset.bound){alarm.dataset.bound='1';alarm.addEventListener('click',async()=>{menu.classList.add('hidden');await openAlarm()})}
}
function wireOnce(){
  wireNav();ensureConversationMenu()
  const list=$('chatList');if(list&&!list.dataset.isaToolsV7){list.dataset.isaToolsV7='1';list.addEventListener('click',e=>{if(e.target.closest('.chat-item[data-conv]'))setTimeout(ensureConversationMenu,90)})}
  const chats=document.querySelector('[data-tab="chats"]');if(chats&&!chats.dataset.isaToolsV7){chats.dataset.isaToolsV7='1';chats.addEventListener('click',()=>setTimeout(ensureConversationMenu,80))}
}
function start(){
  wireOnce()
  const main=$('mainView'),name=$('myName')
  if(main&&!main.dataset.isaToolsObserved){main.dataset.isaToolsObserved='1';new MutationObserver(()=>setTimeout(wireOnce,0)).observe(main,{attributes:true,attributeFilter:['class']})}
  if(name&&!name.dataset.isaToolsObserved){name.dataset.isaToolsObserved='1';new MutationObserver(()=>setTimeout(wireOnce,0)).observe(name,{childList:true,characterData:true,subtree:true})}
  let tries=0;const retry=()=>{wireOnce();if(++tries<24)setTimeout(retry,500)};retry()
}
start()
