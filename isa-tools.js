const $=id=>document.getElementById(id)
let studyLoading=null
function isIsa(){return String($('myName')?.textContent||'').trim().toLowerCase()==='isa'}
function toast(text){const t=$('toast');if(!t){alert(text);return}t.textContent=text;t.classList.remove('hidden');clearTimeout(t._isaTools);t._isaTools=setTimeout(()=>t.classList.add('hidden'),2800)}
function waitStudyReady(timeout=5000){return new Promise((resolve,reject)=>{const start=Date.now(),tick=()=>{if(typeof window.__ISA_OPEN_STUDY__==='function')return resolve();if(Date.now()-start>timeout)return reject(new Error('Estudos carregou, mas não conseguiu iniciar.'));setTimeout(tick,50)};tick()})}
function ensureStudyBundle(){
  if(typeof window.__ISA_OPEN_STUDY__==='function')return Promise.resolve()
  if(studyLoading)return studyLoading
  studyLoading=new Promise((resolve,reject)=>{
    const existing=document.querySelector('script[data-study-bundle]')
    if(existing){waitStudyReady().then(resolve,reject);return}
    const s=document.createElement('script');s.src='./study-bundle-v36.js?v=37';s.async=true;s.dataset.studyBundle='1'
    s.onload=()=>waitStudyReady().then(resolve,reject)
    s.onerror=()=>reject(new Error('Não foi possível carregar Estudos.'))
    document.body.appendChild(s)
  }).catch(e=>{studyLoading=null;throw e})
  return studyLoading
}
function setActiveNav(tab){document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab))}
async function openStudy(){
  if(!isIsa())return
  const b=$('studyNav');if(b){b.disabled=true;b.dataset.loading='1'}
  toast('Abrindo Estudos…')
  try{
    window.__ISA_STUDY_SCOPE_HINT__='private'
    window.__ISA_MOBILE_SHOW_CONTENT__?.('panel')
    await ensureStudyBundle()
    await window.__ISA_OPEN_STUDY__('private')
    setActiveNav('study')
  }catch(e){console.error(e);toast(e.message||'Não foi possível abrir Estudos.')}
  finally{if(b){b.disabled=false;delete b.dataset.loading}}
}
function openDiary(){if(isIsa())location.href='./diario.html?v=capa-3d-2'}
async function openAlarm(){
  if(!isIsa())return
  try{
    await import('./calendar-alarm.js?v=4')
    const hiddenBtn=$('newAlarmBtn')
    if(hiddenBtn){hiddenBtn.style.display='none';hiddenBtn.click();return}
    toast('Não foi possível abrir o Alarme agora.')
  }catch(e){console.error(e);toast('Não foi possível abrir o Alarme.')}
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
  menu.querySelectorAll('[data-isa-tool="study"],[data-isa-tool="diary"]').forEach(n=>n.remove())
  plus.classList.remove('hidden')
  let alarm=menu.querySelector('[data-isa-tool="alarm"]')
  if(!alarm){alarm=document.createElement('button');alarm.type='button';alarm.dataset.isaTool='alarm';alarm.textContent='⏰ Criar alarme';menu.prepend(alarm)}
  if(!alarm.dataset.bound){alarm.dataset.bound='1';alarm.addEventListener('click',async()=>{menu.classList.add('hidden');await openAlarm()})}
}
function start(){
  wireNav();ensureConversationMenu()
  const list=$('chatList');if(list&&!list.dataset.isaToolsV4){list.dataset.isaToolsV4='1';list.addEventListener('click',e=>{if(e.target.closest('.chat-item[data-conv]'))setTimeout(ensureConversationMenu,80)})}
  document.querySelector('[data-tab="chats"]')?.addEventListener('click',()=>setTimeout(ensureConversationMenu,70))
  setTimeout(()=>{wireNav();ensureConversationMenu()},250)
}
start()
