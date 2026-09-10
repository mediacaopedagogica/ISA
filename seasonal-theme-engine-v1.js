import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js?v=20260910-seasonal-artwork'

if(!window.__ISA_SEASONAL_THEME_ENGINE_V1__){
  window.__ISA_SEASONAL_THEME_ENGINE_V1__=true
  const db=createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}})
  const $=id=>document.getElementById(id)
  const token=new URLSearchParams(location.hash.replace(/^#/, '')).get('acesso')||''
  const ASSET={
    birthdayCake:'./assets/seasonal/birthday-cake.webp',
    birthdayConfetti:'./assets/seasonal/birthday-confetti.webp',
    christmas:'./assets/seasonal/christmas-garland.webp',
    newyear:'./assets/seasonal/newyear-fireworks.webp',
    storyFrame:'./assets/seasonal/story-cover-frame.webp'
  }
  let timer=0,cache=null,cacheAt=0

  const external=()=>!!token&&!!($('friendApp')||window.__ISA_FRIEND_PERSON__)
  const root=()=>external()?$('familySocialOverlay'):$('socialPanel')
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ')
  const birthParts=p=>{const d=String(p?.birthDate||p?.birth_date||'');const day=Number(p?.birthDay||p?.birth_day||d.slice(8,10)),month=Number(p?.birthMonth||p?.birth_month||d.slice(5,7));return day&&month?{day,month}:null}
  function relation(day,month){const now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate()),target=new Date(now.getFullYear(),month-1,day);let diff=Math.round((target-today)/86400000);if(diff<0)target=new Date(now.getFullYear()+1,month-1,day),diff=Math.round((target-today)/86400000);return diff}
  function calendarTheme(){const d=new Date(),m=d.getMonth()+1,day=d.getDate();if(m===12&&day>=24&&day<=26)return'christmas';if((m===12&&day===31)||(m===1&&day===1))return'newyear';return''}
  function hardAllowed(viewer,target){if(!viewer||!target||String(viewer.id)===String(target.id))return true;const v=norm(viewer.name||viewer.display_name),t=norm(target.name||target.display_name);if(v==='elion')return['isa','keise','alan','davi'].includes(t);if(v==='evalda')return['isa','alan','keise','paloma','vania'].includes(t);if(v==='paloma')return['keise','alan','davi','isa','evalda'].includes(t);if(v==='vania'||v==='silvane')return t!=='elion';return true}

  async function getPeople(force=false){
    if(!force&&cache&&Date.now()-cacheAt<15000)return cache
    if(external()){
      const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/friend-social`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({token,action:'bootstrap'}),cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error||'seasonal bootstrap');cache={viewer:d.me||null,people:d.profiles||[]}
    }else{
      const {data:{user}}=await db.auth.getUser();if(!user)return{viewer:null,people:[]}
      const {data:me}=await db.from('family_members').select('id,family_id,display_name').eq('auth_user_id',user.id).eq('active',true).maybeSingle();if(!me)return{viewer:null,people:[]}
      const {data:members}=await db.from('family_members').select('id,display_name,birth_date,birth_day,birth_month,active').eq('family_id',me.family_id).eq('active',true)
      const viewer={id:me.id,name:me.display_name};cache={viewer,people:(members||[]).filter(p=>hardAllowed(viewer,{id:p.id,name:p.display_name})).map(p=>({memberId:p.id,name:p.display_name,birthDate:p.birth_date,birthDay:p.birth_day,birthMonth:p.birth_month}))}
    }
    cacheAt=Date.now();return cache
  }

  function css(){if($('isaSeasonalArtworkCss'))return;const s=document.createElement('style');s.id='isaSeasonalArtworkCss';s.textContent=`
    #socialPanel,#familySocialOverlay{position:relative}
    .isa-season-art{position:absolute;z-index:40;pointer-events:none;user-select:none;object-fit:contain;filter:drop-shadow(0 8px 14px rgba(85,62,99,.12));animation:isaSeasonFloat 3.8s ease-in-out infinite}
    .isa-season-art.garland{left:50%;top:3px;transform:translateX(-50%);width:min(720px,80vw);height:105px;object-fit:contain;object-position:top center;animation:none;opacity:.96}
    .isa-season-art.fireworks{right:2.5%;top:48px;width:min(185px,22vw);opacity:.82}
    .isa-season-art.birthday-cake{right:20px;top:86px;width:104px;opacity:.96}
    .isa-season-art.birthday-confetti{right:116px;top:46px;width:108px;opacity:.90;animation-delay:.4s}
    .isa-birthday-avatar-accent{position:absolute!important;z-index:7!important;pointer-events:none!important;width:38px!important;height:38px!important;object-fit:contain!important;right:-11px!important;top:-16px!important;filter:drop-shadow(0 5px 8px rgba(112,73,119,.15))}
    .isa-story-ring{position:relative;isolation:isolate}.isa-story-ring::after{content:'';position:absolute;inset:-9px;z-index:2;pointer-events:none;background:url('${ASSET.storyFrame}') center/100% 100% no-repeat;opacity:.26;border-radius:50%}
    .isa-social-cover{position:relative}.isa-social-cover>.isa-approved-cover-frame{position:absolute;inset:-12px -10px;z-index:4;pointer-events:none;width:calc(100% + 20px);height:calc(100% + 24px);object-fit:fill;opacity:.34}
    @keyframes isaSeasonFloat{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-4px) rotate(1deg)}}
    @media(max-width:760px){.isa-season-art.garland{width:94vw;height:76px;top:1px}.isa-season-art.fireworks{width:92px;top:58px;right:1%}.isa-season-art.birthday-cake{width:76px;top:78px;right:6px}.isa-season-art.birthday-confetti{width:72px;top:54px;right:76px}.isa-birthday-avatar-accent{width:30px!important;height:30px!important;right:-8px!important;top:-12px!important}}
  `;document.head.appendChild(s)}
  function clear(){document.querySelectorAll('.isa-season-art,.isa-birthday-avatar-accent,.isa-approved-cover-frame').forEach(x=>x.remove());document.querySelectorAll('[data-isa-birthday-today],[data-isa-birthday-eve]').forEach(x=>{delete x.dataset.isaBirthdayToday;delete x.dataset.isaBirthdayEve})}
  function art(cls,src,alt=''){const img=document.createElement('img');img.className=`isa-season-art ${cls}`;img.src=src;img.alt=alt;img.decoding='async';return img}
  function decorateStories(people){
    const r=root();if(!r)return;const today=new Map(),eve=new Map();for(const p of people){const b=birthParts(p);if(!b)continue;const d=relation(b.day,b.month);if(d===0)today.set(String(p.memberId||p.id),p);if(d===1)eve.set(String(p.memberId||p.id),p)}
    r.querySelectorAll('[data-isa-story-author]').forEach(btn=>{const id=String(btn.dataset.isaStoryAuthor||'');const ring=btn.querySelector('.isa-story-ring');if(!ring)return;if(today.has(id)||eve.has(id)){const im=document.createElement('img');im.className='isa-birthday-avatar-accent';im.src=ASSET.birthdayConfetti;im.alt='';ring.appendChild(im);if(today.has(id))btn.dataset.isaBirthdayToday='1';else btn.dataset.isaBirthdayEve='1'}})
  }
  function decorateCover(){const r=root(),cover=r?.querySelector('.isa-social-cover');if(!cover||cover.querySelector('.isa-approved-cover-frame'))return;const im=document.createElement('img');im.className='isa-approved-cover-frame';im.src=ASSET.storyFrame;im.alt='';cover.prepend(im)}
  async function render(force=false){
    css();const r=root();if(!r||r.classList.contains('hidden'))return;clear();const d=await getPeople(force).catch(()=>({people:[]})),people=d.people||[];const cal=calendarTheme();
    if(cal==='christmas')r.appendChild(art('garland',ASSET.christmas));
    if(cal==='newyear')r.appendChild(art('fireworks',ASSET.newyear));
    const birthdayToday=people.filter(p=>{const b=birthParts(p);return b&&relation(b.day,b.month)===0});
    if(birthdayToday.length){r.appendChild(art('birthday-cake',ASSET.birthdayCake));r.appendChild(art('birthday-confetti',ASSET.birthdayConfetti))}
    decorateStories(people);decorateCover()
  }
  function schedule(force=false){clearTimeout(timer);timer=setTimeout(()=>render(force),90)}
  new MutationObserver(()=>schedule(false)).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})
  document.addEventListener('isa:birth-date-updated',()=>{cache=null;cacheAt=0;schedule(true)})
  document.addEventListener('isa:friend-access-valid',()=>schedule(true));document.addEventListener('isa:friend-portal-entered',()=>schedule(true))
  document.addEventListener('click',e=>{if(e.target.closest?.('#socialNav,#friendSocialBtn,#socialRefresh,#fsRefresh'))setTimeout(()=>schedule(true),160)},true)
  css();schedule(true);setTimeout(()=>schedule(true),900);setTimeout(()=>schedule(true),2200)
  window.__ISA_SEASONAL_THEME_ENGINE__={render:()=>render(true),refresh:()=>{cache=null;cacheAt=0;return render(true)},assets:ASSET}
}