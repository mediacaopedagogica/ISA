import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js?v=20260911-birthday-calendar-all-family'

// Calendário/aniversários do layout aprovado. Mantém o motor legado, mas o strip visível passa a ter um dono estável.
if(!window.__ISA_APPROVED_BIRTHDAY_CALENDAR_V15__){
  window.__ISA_APPROVED_BIRTHDAY_CALENDAR_V15__=true
  const db=createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}})
  const $=id=>document.getElementById(id)
  const ASSET={cake:'./assets/seasonal/birthday-cake.webp',confetti:'./assets/seasonal/birthday-confetti.webp'}
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  const pad=n=>String(n).padStart(2,'0')
  let me=null,people=[],loading=null,timer=0,stripObserver=null

  function css(){if($('approvedBirthdayCalendarV15Css'))return;const s=document.createElement('style');s.id='approvedBirthdayCalendarV15Css';s.textContent=`
    #birthdayStrip[data-birthday-surgery="1"]{display:flex!important;gap:9px!important;overflow:auto!important;padding:8px 2px 12px!important;margin:2px 0 10px!important;scrollbar-width:thin!important}
    #birthdayStrip[data-birthday-surgery="1"] .birthday-pill{min-width:154px!important;flex:0 0 154px!important;border:1px solid #eaddea!important;border-radius:17px!important;padding:10px 11px!important;background:linear-gradient(145deg,#fff,#f8f1ff)!important;color:#66536f!important;box-shadow:0 7px 17px rgba(91,68,111,.08)!important}
    #birthdayStrip[data-birthday-surgery="1"] .birthday-pill.today{background:linear-gradient(135deg,#fff2c9,#ffe2ee,#eee4ff)!important;border-color:#f0d0bc!important}
    #birthdayStrip[data-birthday-surgery="1"] .birthday-pill strong{display:block;font-size:11px!important;margin-bottom:4px}#birthdayStrip[data-birthday-surgery="1"] .birthday-pill div{font-size:11px;font-weight:850}#birthdayStrip[data-birthday-surgery="1"] .birthday-pill small{display:block;font-size:9px;margin-top:4px;color:#927f9a}
    body.isa-birthday-day-live #keiseApprovedHome{position:relative;background:radial-gradient(circle at 92% 8%,rgba(255,226,238,.74),transparent 23%),radial-gradient(circle at 82% 18%,rgba(238,228,255,.72),transparent 28%),linear-gradient(145deg,#fffafd,#faf6ff)!important}
    body.isa-birthday-day-live #calendarPanel{background:radial-gradient(circle at 93% 8%,rgba(255,226,238,.56),transparent 25%),linear-gradient(145deg,#fffafd,#faf6ff)!important}
    .isa-approved-birthday-art{position:absolute!important;z-index:8!important;pointer-events:none!important;user-select:none!important;object-fit:contain!important;filter:drop-shadow(0 8px 15px rgba(95,65,111,.13))!important}.isa-approved-birthday-art.cake{right:18px!important;top:82px!important;width:86px!important}.isa-approved-birthday-art.confetti{right:92px!important;top:48px!important;width:84px!important;opacity:.9!important}
    .isa-birthday-today-note{margin:4px 0 10px;padding:9px 12px;border-radius:15px;background:linear-gradient(135deg,#fff6cf,#ffe7f0,#eee7ff);color:#68546f;font-size:10px;font-weight:850;border:1px solid #f0d9ca}
    @media(max-width:760px){.isa-approved-birthday-art.cake{right:5px!important;top:72px!important;width:64px!important}.isa-approved-birthday-art.confetti{right:60px!important;top:50px!important;width:58px!important}#birthdayStrip[data-birthday-surgery="1"] .birthday-pill{min-width:138px!important;flex-basis:138px!important}}
  `;document.head.appendChild(s)}

  function parts(p){const d=String(p?.birthDate||p?.birth_date||'');const day=Number(p?.birthDay||p?.birth_day||d.slice(8,10)),month=Number(p?.birthMonth||p?.birth_month||d.slice(5,7));return day&&month?{day,month}:null}
  function days(p){const b=parts(p);if(!b)return 9999;const now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate());let date=new Date(now.getFullYear(),b.month-1,b.day);if(date<today)date=new Date(now.getFullYear()+1,b.month-1,b.day);return Math.round((date-today)/86400000)}
  function label(p){const n=days(p),b=parts(p);if(n===0)return'Hoje 🎉';if(n===1)return'Amanhã 🎈';if(n<=7)return`Em ${n} dias`;return`${pad(b.day)}/${pad(b.month)}`}

  async function identity(){if(me)return me;const {data:{user}}=await db.auth.getUser();if(!user)return null;const {data}=await db.from('family_members').select('id,family_id,display_name').eq('auth_user_id',user.id).eq('active',true).maybeSingle();me=data||null;return me}
  async function load(force=false){
    if(loading&&!force)return loading
    loading=(async()=>{
      const who=await identity();if(!who)return[]
      const {data,error}=await db.from('family_members').select('id,display_name,relationship_label,birth_date').eq('family_id',who.family_id).eq('active',true).order('display_name');if(error)throw error
      people=(data||[]).map(x=>({id:x.id,name:x.display_name,relationship:x.relationship_label||'Família',birthDate:x.birth_date}));return people
    })().catch(e=>{console.warn('Calendário de aniversários:',e);return people}).finally(()=>loading=null);return loading
  }

  function renderStrip(){
    const strip=$('birthdayStrip');if(!strip)return false
    const list=people.filter(p=>parts(p)).map(p=>({...p,_days:days(p)})).sort((a,b)=>a._days-b._days||String(a.name).localeCompare(String(b.name),'pt-BR'))
    strip.dataset.birthdaySurgery='1';strip.classList.remove('hidden');strip.innerHTML=list.length?list.map(p=>`<article class="birthday-pill ${p._days===0?'today':''}"><strong>${p._days===0?'🎂 Hoje!':'🎈 '+pad(parts(p).day)+'/'+pad(parts(p).month)}</strong><div>${esc(p.name)} • ${esc(p.relationship)}</div><small>${esc(label(p))}</small></article>`).join(''):'<div class="isa-birthday-today-note">🎂 As datas de aniversário salvas nos perfis aparecerão aqui automaticamente.</div>'
    bindStripObserver();return true
  }
  function removeArt(){document.querySelectorAll('.isa-approved-birthday-art,.isa-birthday-today-note[data-home-birthday]').forEach(x=>x.remove());document.body.classList.remove('isa-birthday-day-live')}
  function renderTodayArt(){
    removeArt();const today=people.filter(p=>parts(p)&&days(p)===0);if(!today.length)return false
    document.body.classList.add('isa-birthday-day-live');const home=$('keiseApprovedHome');if(home){const cake=document.createElement('img');cake.className='isa-approved-birthday-art cake';cake.src=ASSET.cake;cake.alt='';const conf=document.createElement('img');conf.className='isa-approved-birthday-art confetti';conf.src=ASSET.confetti;conf.alt='';home.append(cake,conf);const note=document.createElement('div');note.className='isa-birthday-today-note';note.dataset.homeBirthday='1';note.textContent=`🎉 Hoje é aniversário de ${today.map(x=>x.name).join(' e ')}!`;const head=home.querySelector('.ka-conv-head');head?.insertAdjacentElement('beforebegin',note)}
    return true
  }
  function bindStripObserver(){const strip=$('birthdayStrip');if(!strip||stripObserver?._target===strip)return;try{stripObserver?.disconnect()}catch{};stripObserver=new MutationObserver(()=>{if(strip.classList.contains('hidden')||strip.dataset.birthdaySurgery!=='1')schedule(50)});stripObserver._target=strip;stripObserver.observe(strip,{attributes:true,attributeFilter:['class'],childList:true})}
  async function refresh(force=false){if(!$('birthdayStrip')&&!$('calendarPanel')&&!$('keiseApprovedHome'))return false;css();await load(force);renderStrip();renderTodayArt();window.__ISA_SEASONAL_THEME_ENGINE__?.refresh?.();return true}
  function schedule(delay=80){clearTimeout(timer);timer=setTimeout(()=>refresh(false),delay)}

  document.addEventListener('isa:birth-date-updated',()=>refresh(true),{passive:true})
  document.addEventListener('isa:approved-home-ready',()=>schedule(60),{passive:true})
  document.addEventListener('isa:keise-approved-home-built',()=>schedule(60),{passive:true})
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-approved-action="calendar"],[data-tab="calendar"],#calendarTodayBtn,#calendarPrevBtn,#calendarNextBtn'))setTimeout(()=>refresh(false),80)},true)
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh(true)})
  window.addEventListener('pageshow',()=>setTimeout(()=>refresh(true),350),{once:true})
  window.__ISA_APPROVED_BIRTHDAY_CALENDAR__={refresh,renderStrip,renderTodayArt,get people(){return people.slice()}}
  css();setTimeout(()=>refresh(true),700)
}
