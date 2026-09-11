import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js?v=20260911-birthday-bridge-all-family'

if(!window.__ISA_NOSSA_REDE_BIRTHDAY_BRIDGE_V1__){
  window.__ISA_NOSSA_REDE_BIRTHDAY_BRIDGE_V1__=true
  const db=createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}})
  const $=id=>document.getElementById(id)
  const token=new URLSearchParams(location.hash.replace(/^#/, '')).get('acesso')||''
  let timer=0,cache=null,cacheAt=0

  const external=()=>!!token&&!!($('friendApp')||window.__ISA_FRIEND_PERSON__)
  const root=()=>external()?$('familySocialOverlay'):$('socialPanel')
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  const pad=n=>String(n).padStart(2,'0')

  function birthParts(p){
    const date=String(p?.birthDate||p?.birth_date||'')
    const day=Number(p?.birthDay||p?.birth_day||date.slice(8,10))
    const month=Number(p?.birthMonth||p?.birth_month||date.slice(5,7))
    return day&&month?{day,month}:null
  }
  function daysUntil(p){
    const b=birthParts(p);if(!b)return 9999
    const now=new Date(),start=new Date(now.getFullYear(),now.getMonth(),now.getDate())
    let next=new Date(now.getFullYear(),b.month-1,b.day)
    if(next<start)next=new Date(now.getFullYear()+1,b.month-1,b.day)
    return Math.round((next-start)/86400000)
  }
  function labelFor(p){
    const n=daysUntil(p),b=birthParts(p)
    if(n===0)return 'Hoje 🎉'
    if(n===1)return 'Amanhã 🎈'
    if(n<=7)return `Em ${n} dias`
    return `${pad(b.day)}/${pad(b.month)}`
  }

  async function externalProfiles(){
    const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/friend-social`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({token,action:'bootstrap'}),cache:'no-store'})
    const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error||'Não foi possível carregar aniversários.')
    return {viewer:d.me||null,profiles:d.profiles||[]}
  }
  async function mainProfiles(){
    const {data:{user}}=await db.auth.getUser();if(!user)return{viewer:null,profiles:[]}
    const {data:me,error:mErr}=await db.from('family_members').select('id,family_id,display_name,birth_date,birth_day,birth_month,birth_year').eq('auth_user_id',user.id).eq('active',true).maybeSingle();if(mErr||!me)return{viewer:null,profiles:[]}
    const {data:members,error}=await db.from('family_members').select('id,display_name,relationship_label,birth_date,birth_day,birth_month,birth_year,active').eq('family_id',me.family_id).eq('active',true).order('display_name')
    if(error)throw error
    const viewer={id:me.id,name:me.display_name}
    const profiles=(members||[]).map(x=>({memberId:x.id,name:x.display_name,relationship:x.relationship_label,birthDate:x.birth_date,birthDay:x.birth_day,birthMonth:x.birth_month,birthYear:x.birth_year}))
    return{viewer,profiles}
  }
  async function load(force=false){
    if(!force&&cache&&Date.now()-cacheAt<12000)return cache
    cache=external()?await externalProfiles():await mainProfiles();cacheAt=Date.now();return cache
  }

  function style(){
    if($('isaBirthdayBridgeCss'))return
    const s=document.createElement('style');s.id='isaBirthdayBridgeCss';s.textContent=`
      .isa-birthday-space{margin:10px 0 14px;padding:12px 13px;border:1px solid rgba(237,215,232,.94);border-radius:21px;background:linear-gradient(135deg,rgba(255,249,253,.96),rgba(247,241,255,.96),rgba(239,250,255,.92));box-shadow:0 8px 22px rgba(101,74,117,.07)}
      .isa-birthday-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:9px}.isa-birthday-head strong{color:#614e6b;font-size:13px}.isa-birthday-head small{color:#98869f;font-size:9px}
      .isa-birthday-list{display:flex;gap:8px;overflow:auto;padding:2px 1px 4px}.isa-birthday-person{min-width:138px;display:flex;gap:8px;align-items:center;border:1px solid rgba(231,215,237,.9);border-radius:15px;background:rgba(255,255,255,.88);padding:8px 9px;color:#66536f;text-align:left}.isa-birthday-person .bday-icon{width:34px;height:34px;border-radius:12px;display:grid;place-items:center;background:linear-gradient(135deg,#ffe2ef,#eee4ff);font-size:18px}.isa-birthday-person b{display:block;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:90px}.isa-birthday-person small{display:block;color:#927f9a;font-size:9px;margin-top:2px}.isa-birthday-person.today{background:linear-gradient(135deg,#fff2c9,#ffe1ee,#eee4ff);box-shadow:0 8px 18px rgba(204,139,176,.14);border-color:#f3d5b4}.isa-birthday-person.tomorrow{background:linear-gradient(135deg,#fff8fd,#edf7ff)}
      .isa-birthday-empty{color:#9a899f;font-size:10px;padding:4px 1px}
      .isa-social-cover{width:calc(100% - 28px)!important;height:155px!important;margin:12px 14px 20px!important;border-radius:30px 14px 28px 16px!important;transform:rotate(-.35deg);border:5px solid rgba(255,255,255,.92)!important;box-shadow:0 16px 32px rgba(91,66,106,.16),0 0 0 1px rgba(225,208,234,.75)!important;background:linear-gradient(135deg,#f7dce9,#e8ddfa 50%,#dff4f7)!important;overflow:visible!important}
      .isa-social-cover::before{content:'✿';position:absolute;left:-10px;top:-12px;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#fff6fb;color:#d68ab6;font-size:18px;box-shadow:0 7px 15px rgba(86,63,98,.14);z-index:3}.isa-social-cover::after{content:'lembranças ✨';position:absolute;right:14px;bottom:-13px;padding:5px 10px;border-radius:9px;background:#fff7d7;color:#806579;font:700 9px/1.2 system-ui;transform:rotate(2.5deg);box-shadow:0 5px 11px rgba(88,68,99,.12);z-index:3}
      .isa-social-cover img,.isa-cover-placeholder{border-radius:24px 10px 22px 12px!important;overflow:hidden}.isa-cover-actions{right:8px!important;bottom:8px!important;transform:rotate(.35deg)}
      @media(max-width:760px){.isa-birthday-space{margin:7px 0 10px;border-radius:16px;padding:10px}.isa-birthday-person{min-width:124px}.isa-social-cover{width:calc(100% - 20px)!important;height:132px!important;margin:10px 10px 18px!important;border-radius:24px 12px 22px 13px!important}}
    `;document.head.appendChild(s)
  }

  function hostFor(r){
    return r?.querySelector('[data-social-birthdays],#socialBirthdays,#fsBirthdays,.social-birthdays')||null
  }
  async function render(force=false){
    style();const r=root();if(!r||r.classList.contains('hidden'))return
    const d=await load(force).catch(e=>{console.warn('Aniversários Nossa Rede:',e);return null});if(!d)return
    const upcoming=(d.profiles||[]).filter(p=>birthParts(p)).map(p=>({...p,_days:daysUntil(p)})).sort((a,b)=>a._days-b._days||String(a.name).localeCompare(String(b.name),'pt-BR')).slice(0,8)
    let box=hostFor(r)
    if(!box){box=document.createElement('section');box.className='isa-birthday-space';box.dataset.socialBirthdays='1';const status=r.querySelector('#socialStatusStrip,#fsStatusStrip,.social-status-strip'),composer=r.querySelector('.social-composer');if(status)status.insertAdjacentElement('afterend',box);else composer?.parentElement?.insertBefore(box,composer)}
    box.classList.add('isa-birthday-space')
    box.innerHTML=`<div class="isa-birthday-head"><strong>🎂 Aniversariantes</strong><small>Datas do perfil • atualização automática</small></div><div class="isa-birthday-list">${upcoming.length?upcoming.map(p=>`<div class="isa-birthday-person ${p._days===0?'today':p._days===1?'tomorrow':''}"><span class="bday-icon">${p._days===0?'🎉':p._days===1?'🎈':'🎂'}</span><div><b>${esc(p.name||'Família')}</b><small>${esc(labelFor(p))}</small></div></div>`).join(''):'<div class="isa-birthday-empty">As datas salvas no perfil aparecerão aqui automaticamente.</div>'}</div>`
  }
  function schedule(force=false){clearTimeout(timer);timer=setTimeout(()=>render(force),120)}
  document.addEventListener('isa:birth-date-updated',()=>{cache=null;cacheAt=0;schedule(true);window.__ISA_FAMILY_SOCIAL_EXTRAS__?.scan?.(true)})
  document.addEventListener('isa:friend-access-valid',()=>schedule(true));document.addEventListener('isa:friend-portal-entered',()=>schedule(true))
  document.addEventListener('click',e=>{if(e.target.closest?.('#socialNav,#friendSocialBtn,#socialRefresh,#fsRefresh'))setTimeout(()=>schedule(true),150)},true)
  new MutationObserver(()=>schedule(false)).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})
  style();schedule(true);setTimeout(()=>schedule(true),900);setTimeout(()=>schedule(true),2200)
  window.__ISA_NOSSA_REDE_BIRTHDAYS__={render:()=>render(true),refresh:()=>{cache=null;cacheAt=0;return render(true)}}
}
