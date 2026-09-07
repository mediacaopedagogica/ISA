import { CONFIG } from './config.js'

const $=id=>document.getElementById(id)
let diaryStatus=null
let studyPromise=null

function sessionToken(){
  try{
    const ref=new URL(CONFIG.SUPABASE_URL).hostname.split('.')[0]
    const raw=localStorage.getItem(`sb-${ref}-auth-token`)
    if(!raw)return null
    const d=JSON.parse(raw)
    return d?.access_token||d?.currentSession?.access_token||d?.session?.access_token||null
  }catch{return null}
}
async function rpc(name,args={}){
  const token=sessionToken();if(!token)throw new Error('Sem sessão')
  const r=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${name}`,{
    method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
    body:JSON.stringify(args),cache:'no-store'
  })
  let d=null;try{d=await r.json()}catch{}
  if(!r.ok)throw new Error(d?.message||d?.hint||d?.details||'Não foi possível consultar o diário.')
  return d
}
function toast(text){const t=$('toast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._di);t._di=setTimeout(()=>t.classList.add('hidden'),2200)}
function ensureCss(){
  if($('diaryIntegrationCss'))return
  const s=document.createElement('style');s.id='diaryIntegrationCss';s.textContent=`
  .diary-supervision-card{margin:14px 0;padding:16px;border-radius:22px;background:linear-gradient(145deg,#fbf7ff,#eee4ff);border:1px solid #eadff8;box-shadow:0 8px 22px rgba(92,70,110,.07)}
  .diary-supervision-card .diary-card-head{display:flex;align-items:center;gap:10px}.diary-supervision-card .diary-card-head>div{flex:1}.diary-supervision-card h3{margin:0 0 3px}.diary-supervision-card p{margin:5px 0;color:#807287;font-size:.84rem}.diary-status-pill{display:inline-flex;padding:6px 9px;border-radius:999px;background:#fff;color:#766381;font-size:.72rem;font-weight:900}.diary-status-pill.unlocked{background:#ffe7ef;color:#9a4f69}.diary-open-parent{margin-top:10px;border:0;border-radius:14px;padding:10px 13px;background:linear-gradient(145deg,#c8b5f3,#e9a9c8);color:#fff;font-weight:900}.plus-menu .isa-special-option{font-weight:850}
  `;document.head.appendChild(s)
}
function menuHas(id){return !!document.getElementById(id)}
function activeConversationId(){return document.querySelector('.chat-item.active[data-conv]')?.dataset.conv||null}
async function openStudies(){
  try{
    const hint=activeConversationId()||'private'
    window.__ISA_STUDY_SCOPE_HINT__=hint
    if(typeof window.__ISA_OPEN_STUDY__==='function')return window.__ISA_OPEN_STUDY__(hint)
    if(!studyPromise){
      studyPromise=new Promise((resolve,reject)=>{
        const existing=document.querySelector('script[data-study-bundle]')
        if(existing){existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return}
        const s=document.createElement('script');s.src='./study-bundle-v36.js?v=36';s.defer=true;s.dataset.studyBundle='1';s.onload=resolve;s.onerror=()=>reject(new Error('Falha ao carregar Estudos'));document.body.appendChild(s)
      })
    }
    await studyPromise
    if(typeof window.__ISA_OPEN_STUDY__!=='function')throw new Error('Estudos ainda não iniciou.')
    window.__ISA_OPEN_STUDY__(hint)
  }catch(e){console.error(e);toast('Não foi possível abrir Estudos agora.')}
}
function openDiary(){window.open('./diario.html','_blank','noopener')}
function ensureIsaPlus(){
  if(diaryStatus?.mode!=='child')return
  const btn=$('groupPlusBtn'),menu=$('groupPlusMenu'),composer=$('composer'),supervision=$('supervisionNotice')
  if(!btn||!menu||!composer)return
  const chatVisible=!$('chatPanel')?.classList.contains('hidden')
  const composerVisible=!composer.classList.contains('hidden')
  const supervisionOn=supervision&&!supervision.classList.contains('hidden')
  if(chatVisible&&composerVisible&&!supervisionOn)btn.classList.remove('hidden')
  if(!menuHas('isaStudyShortcut')){
    const study=document.createElement('button');study.id='isaStudyShortcut';study.type='button';study.className='isa-special-option';study.textContent='📚 Estudos';study.onclick=e=>{e.stopPropagation();menu.classList.add('hidden');openStudies()};menu.appendChild(study)
  }
  if(!menuHas('isaDiaryShortcut')){
    const diary=document.createElement('button');diary.id='isaDiaryShortcut';diary.type='button';diary.className='isa-special-option';diary.textContent='📔 Meu Diário';diary.onclick=e=>{e.stopPropagation();menu.classList.add('hidden');openDiary()};menu.appendChild(diary)
  }
}
function parentCardHtml(s){
  if(!s?.configured)return `<div class="diary-card-head"><span style="font-size:28px">📔</span><div><h3>Meu Diário</h3><p>A Isa ainda não criou a chave do diário.</p></div><span class="diary-status-pill">Aguardando</span></div>`
  if(s.parentalUnlocked)return `<div class="diary-card-head"><span style="font-size:28px">🛡️</span><div><h3>Meu Diário</h3><p>A proteção de segurança liberou o acesso parental.</p></div><span class="diary-status-pill unlocked">🔓 Liberado</span></div><button id="openDiaryParentBtn" class="diary-open-parent" type="button">Abrir diário por segurança</button>`
  return `<div class="diary-card-head"><span style="font-size:28px">📔</span><div><h3>Meu Diário</h3><p>Diário configurado e protegido.</p></div><span class="diary-status-pill">🔒 Protegido</span></div>`
}
function mountParentCard(){
  if(diaryStatus?.mode!=='parent')return
  const panel=$('supervisionPanel');if(!panel)return
  let card=$('diarySupervisionCard')
  if(!card){card=document.createElement('section');card.id='diarySupervisionCard';card.className='diary-supervision-card';const info=panel.querySelector('.supervision-info');if(info?.nextSibling)panel.insertBefore(card,info.nextSibling);else panel.prepend(card)}
  card.innerHTML=parentCardHtml(diaryStatus)
  $('openDiaryParentBtn')?.addEventListener('click',()=>window.open('./diario.html?parent=1','_blank','noopener'))
}
async function refresh(){
  if(!sessionToken())return
  try{diaryStatus=await rpc('diary_status',{});document.body.dataset.diaryMode=diaryStatus?.mode||'none';ensureIsaPlus();mountParentCard()}
  catch(e){console.warn('Diário:',e.message)}
}
ensureCss()
const obs=new MutationObserver(()=>{ensureIsaPlus();if(diaryStatus?.mode==='parent'&&!$('supervisionPanel')?.classList.contains('hidden'))mountParentCard()})
obs.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']})
document.querySelector('[data-tab="supervision"]')?.addEventListener('click',()=>setTimeout(refresh,80))
window.addEventListener('focus',refresh)
window.addEventListener('load',()=>setTimeout(refresh,700))
setInterval(()=>{if(document.visibilityState==='visible'&&sessionToken())refresh()},12000)
