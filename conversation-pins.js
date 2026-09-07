import { CONFIG } from './config.js'
const $=id=>document.getElementById(id)
let me=null,pins=new Map(),busy=false,scheduled=null
function token(){try{const ref=new URL(CONFIG.SUPABASE_URL).hostname.split('.')[0],raw=localStorage.getItem(`sb-${ref}-auth-token`);if(!raw)return'';const d=JSON.parse(raw);return d?.access_token||d?.currentSession?.access_token||d?.session?.access_token||''}catch{return''}}
function jwtSub(t){try{const p=t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(atob(p.padEnd(Math.ceil(p.length/4)*4,'='))).sub||''}catch{return''}}
async function rest(path,opt={}){const t=token();if(!t)throw new Error('Sem sessão');const r=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${path}`,{...opt,headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${t}`,'Content-Type':'application/json',...(opt.headers||{})},cache:'no-store'});let d=null;try{d=await r.json()}catch{}if(!r.ok)throw new Error(d?.message||'Não foi possível concluir.');return d}
async function identity(){if(me)return me;const t=token(),sub=t&&jwtSub(t);if(!sub)throw new Error('Sem sessão');const rows=await rest(`family_members?select=id&auth_user_id=eq.${encodeURIComponent(sub)}&active=eq.true&limit=1`);me=rows?.[0]||null;return me}
function notify(text){const t=$('toast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._pinTimer);t._pinTimer=setTimeout(()=>t.classList.add('hidden'),2200)}
async function loadPins(){const u=await identity();if(!u)return;const rows=await rest(`conversation_pins?select=conversation_id,marker,pinned_at&member_id=eq.${u.id}&order=pinned_at.asc`);pins=new Map((rows||[]).map(x=>[x.conversation_id,x]));apply()}
function markerIcon(marker){return marker==='heart'?'💜':'⭐'}
function schedule(){clearTimeout(scheduled);scheduled=setTimeout(apply,80)}
function apply(){
  const list=$('chatList');if(!list||busy)return;busy=true
  try{
    const cards=[...list.querySelectorAll('.chat-item[data-conv]')]
    cards.forEach(card=>{
      const id=card.dataset.conv,p=pins.get(id)
      card.classList.toggle('conversation-pinned',!!p)
      card.dataset.pinTime=p?.pinned_at||''
      let pin=card.querySelector('.conversation-pin-action')
      if(!pin){pin=document.createElement('span');pin.className='conversation-pin-action';pin.setAttribute('role','button');pin.setAttribute('tabindex','0');pin.setAttribute('aria-label','Fixar conversa');card.appendChild(pin)}
      pin.textContent=p?markerIcon(p.marker):'☆'
      pin.classList.toggle('is-pinned',!!p)
      pin.title=!p?'Fixar no topo com ⭐':p.marker==='star'?'Trocar para 💜':'Desfixar conversa'
    })
    const ordered=[...cards].sort((a,b)=>{
      const ap=pins.has(a.dataset.conv),bp=pins.has(b.dataset.conv)
      if(ap!==bp)return ap?-1:1
      if(ap&&bp)return String(pins.get(a.dataset.conv)?.pinned_at||'').localeCompare(String(pins.get(b.dataset.conv)?.pinned_at||''))
      return 0
    })
    const current=[...list.querySelectorAll('.chat-item[data-conv]')]
    const needsReorder=ordered.some((card,i)=>current[i]!==card)
    if(needsReorder){const frag=document.createDocumentFragment();ordered.forEach(c=>frag.appendChild(c));list.appendChild(frag)}
  }finally{busy=false}
}
async function persistPin(id,marker){
  const u=await identity();if(!u)throw new Error('Perfil não encontrado')
  if(marker){
    await rest('conversation_pins?on_conflict=member_id,conversation_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({member_id:u.id,conversation_id:id,marker,pinned_at:new Date().toISOString()})})
  }else{
    await rest(`conversation_pins?member_id=eq.${u.id}&conversation_id=eq.${encodeURIComponent(id)}`,{method:'DELETE',headers:{Prefer:'return=minimal'}})
  }
}
async function cyclePin(card){
  const id=card?.dataset.conv;if(!id)return
  const previous=pins.get(id)||null
  const next=!previous?'star':previous.marker==='star'?'heart':null
  const now=new Date().toISOString()
  if(next)pins.set(id,{conversation_id:id,marker:next,pinned_at:previous?.pinned_at||now});else pins.delete(id)
  apply()
  try{
    await persistPin(id,next)
    notify(next==='star'?'Conversa fixada no topo ⭐':next==='heart'?'Conversa fixada com 💜':'Conversa desfixada')
  }catch(err){
    console.error('Fixação:',err)
    if(previous)pins.set(id,previous);else pins.delete(id)
    apply();notify('Não foi possível salvar a fixação. Tente novamente.')
  }
}
function intercept(e){
  const a=e.target.closest('.conversation-pin-action');if(!a)return
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()
  const card=a.closest('.chat-item[data-conv]');if(card)cyclePin(card)
}
function start(){
  const list=$('chatList');if(!list)return
  list.addEventListener('click',intercept,true)
  list.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest('.conversation-pin-action'))intercept(e)},true)
  const obs=new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&n.matches?.('.chat-item[data-conv]'))))schedule()})
  obs.observe(list,{childList:true})
  loadPins().catch(err=>console.error('Fixações:',err))
}
start()
