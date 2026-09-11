import { CONFIG } from './config.js?v=20260911-external-birthday-sidebar'

// Aniversários no perfil externo: usa a mesma matriz de privacidade do backend.
const $=id=>document.getElementById(id)
const token=new URLSearchParams(location.hash.replace(/^#/, '')).get('acesso')||''
let timer=0,cache=null,cacheAt=0
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const pad=n=>String(n).padStart(2,'0')

function parts(p){
  const d=String(p?.birthDate||p?.birth_date||'')
  const day=Number(p?.birthDay||p?.birth_day||d.slice(8,10))
  const month=Number(p?.birthMonth||p?.birth_month||d.slice(5,7))
  return day&&month?{day,month}:null
}
function daysUntil(p){
  const b=parts(p);if(!b)return 9999
  const now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate())
  let next=new Date(now.getFullYear(),b.month-1,b.day)
  if(next<today)next=new Date(now.getFullYear()+1,b.month-1,b.day)
  return Math.round((next-today)/86400000)
}
async function load(force=false){
  if(!token)return null
  if(!force&&cache&&Date.now()-cacheAt<15000)return cache
  const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/family-birthdays`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({token}),cache:'no-store'})
  const d=await r.json().catch(()=>({}))
  if(!r.ok)throw new Error(d?.error||'Não foi possível carregar aniversários.')
  cache=d;cacheAt=Date.now();return d
}
function style(){
  if($('externalBirthdaySidebarStyle'))return
  const s=document.createElement('style');s.id='externalBirthdaySidebarStyle';s.textContent=`
  .external-birthday-box{margin:13px 0 6px;padding:10px;border:1px solid rgba(233,214,235,.95);border-radius:20px;background:linear-gradient(145deg,rgba(255,248,253,.96),rgba(248,241,255,.96));box-shadow:0 8px 20px rgba(91,67,106,.06)}
  .external-birthday-title{display:flex;align-items:center;gap:6px;margin:0 2px 8px;color:#66506f;font-size:12px;font-weight:900}
  .external-birthday-list{display:grid;gap:8px}
  .external-birthday-person{display:flex;align-items:center;gap:10px;min-height:50px;padding:8px 10px;border:1px solid #eaddea;border-radius:16px;background:rgba(255,255,255,.92);box-shadow:0 4px 12px rgba(92,67,108,.04)}
  .external-birthday-icon{width:34px;height:34px;flex:0 0 34px;border-radius:12px;display:grid;place-items:center;background:linear-gradient(135deg,#ffe3ef,#eee4ff);font-size:18px}
  .external-birthday-person b{display:block;color:#614d6d;font-size:11px}.external-birthday-person small{display:block;margin-top:2px;color:#95839c;font-size:9px}
  .external-birthday-empty{padding:8px 4px;color:#97869d;font-size:10px}
  @media(max-width:760px){.external-birthday-box{border-radius:18px;padding:9px}.external-birthday-person{min-height:48px}}
  `;document.head.appendChild(s)
}
function host(){return document.querySelector('.friend-sidebar')}
function renderRows(rows){
  return rows.map(p=>{const b=parts(p);return `<div class="external-birthday-person" data-birthday-member-id="${esc(p.memberId||'')}"><span class="external-birthday-icon">🎂</span><span><b>${esc(p.name||'Família')}</b><small>${pad(b.day)}/${pad(b.month)}</small></span></div>`}).join('')
}
async function render(force=false){
  const h=host();if(!h||!token)return false
  style();const d=await load(force).catch(e=>{console.warn('[aniversários externos]',e);return null});if(!d)return false
  const rows=(d.profiles||[]).filter(p=>parts(p)).map(p=>({...p,_days:daysUntil(p)})).sort((a,b)=>a._days-b._days||String(a.name).localeCompare(String(b.name),'pt-BR'))
  let box=$('externalBirthdaySidebar')
  if(!box){box=document.createElement('section');box.id='externalBirthdaySidebar';box.className='external-birthday-box';const note=h.querySelector('.friend-link-note');if(note)note.insertAdjacentElement('beforebegin',box);else h.appendChild(box)}
  box.innerHTML=`<div class="external-birthday-title">🎂 <span>Aniversariantes</span></div><div class="external-birthday-list">${rows.length?renderRows(rows):'<div class="external-birthday-empty">Nenhum aniversário disponível para este perfil.</div>'}</div>`
  return true
}
function schedule(force=false,delay=80){clearTimeout(timer);timer=setTimeout(()=>render(force),delay)}
document.addEventListener('isa:friend-access-valid',()=>schedule(true,60))
document.addEventListener('isa:friend-portal-entered',()=>schedule(true,80))
document.addEventListener('isa:birth-date-updated',()=>{cache=null;cacheAt=0;schedule(true,50)})
new MutationObserver(()=>{if(!$('externalBirthdaySidebar'))schedule(false,120)}).observe(document.documentElement,{childList:true,subtree:true})
style();schedule(true,250);setTimeout(()=>schedule(true,700),700)
window.__ISA_EXTERNAL_BIRTHDAYS__={render:()=>render(true),refresh:()=>{cache=null;cacheAt=0;return render(true)}}
