import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js?v=20260911-cover-story-lock-v16'

// Nossa Rede — composição CANÔNICA protegida.
// Ordem fixa: capa > Stories 24h > compositor > feed.
// Não recria a Nossa Rede e não move nenhum outro bloco.
if(!window.__ISA_NOSSA_REDE_COVER_STORY_LOCK_V16__){
  window.__ISA_NOSSA_REDE_COVER_STORY_LOCK_V16__=true
  const db=createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}})
  const $=id=>document.getElementById(id)
  const token=new URLSearchParams(location.hash.replace(/^#/, '')).get('acesso')||''
  const external=()=>!!token&&!!($('familySocialOverlay')||window.__ISA_FRIEND_PERSON__)
  const root=()=>external()?$('familySocialOverlay'):$('socialPanel')
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  let me=null,coverUrl='',coverRef='',busy=null,timer=0,observer=null

  window.__ISA_NOSSA_REDE_LAYOUT_LOCK__={
    version:'2026-09-11-v16',
    order:['cover','stories-24h','composer','feed'],
    coverRecommended:'1600 × 600 px',
    protected:true
  }

  function css(){
    if($('isaCoverStoryLockV16Css'))return
    const s=document.createElement('style');s.id='isaCoverStoryLockV16Css';s.textContent=`
      #socialPanel,#familySocialOverlay{--isa-cover-accent:var(--isa-profile-accent,#c7b5ee)}
      #socialPanel .isa-main-cover-slot,#familySocialOverlay .isa-main-cover-slot{
        position:relative;isolation:isolate;width:100%;height:clamp(148px,18vw,220px);overflow:hidden;
        border:1px solid color-mix(in srgb,var(--isa-cover-accent) 30%,#eadfea);border-radius:28px;
        background:
          radial-gradient(circle at 15% 22%,color-mix(in srgb,var(--isa-cover-accent) 20%,transparent),transparent 30%),
          radial-gradient(circle at 86% 18%,rgba(255,210,231,.38),transparent 28%),
          linear-gradient(135deg,#fffafd,color-mix(in srgb,var(--isa-cover-accent) 12%,#fff),#f1f7ff);
        box-shadow:0 16px 36px color-mix(in srgb,var(--isa-cover-accent) 15%,transparent);
        margin:0 0 14px!important;flex:none!important
      }
      #socialPanel .isa-main-cover-slot img,#familySocialOverlay .isa-main-cover-slot img{
        position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;z-index:0
      }
      #socialPanel .isa-main-cover-slot.has-cover:after,#familySocialOverlay .isa-main-cover-slot.has-cover:after{
        content:"";position:absolute;inset:0;z-index:1;pointer-events:none;
        background:linear-gradient(180deg,rgba(255,255,255,.03) 35%,rgba(47,30,58,.18) 100%)
      }
      .isa-main-cover-placeholder{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:20px;color:#7d6888;font-size:12px;font-weight:800;z-index:1}
      .isa-main-cover-placeholder span{display:block;font-size:30px;margin-bottom:5px}
      .isa-main-cover-tools{position:absolute;right:12px;bottom:11px;z-index:3;display:flex;gap:7px;align-items:center;flex-wrap:wrap;justify-content:flex-end}
      .isa-main-cover-size{padding:6px 9px;border-radius:999px;background:rgba(255,255,255,.90);backdrop-filter:blur(10px);color:#725f7c;font-size:9px;font-weight:800;border:1px solid rgba(255,255,255,.82);box-shadow:0 5px 15px rgba(83,60,96,.08)}
      .isa-main-cover-edit{border:0;border-radius:999px;background:rgba(255,255,255,.94);backdrop-filter:blur(10px);padding:8px 11px;color:#674f74;font-size:10px;font-weight:900;cursor:pointer;box-shadow:0 6px 17px rgba(83,60,96,.12)}
      .isa-main-cover-edit:hover{transform:translateY(-1px)}
      #socialPanel .isa-story-strip[data-cover-story-order="1"],#familySocialOverlay .isa-story-strip[data-cover-story-order="1"]{margin:0 0 15px!important;width:100%!important;position:relative!important;order:initial!important}
      /* A cor escolhida pertence ao layout, inclusive à faixa superior da Nossa Rede. */
      #socialPanel.isa-profile-theme-live .social-topbar,#familySocialOverlay.isa-profile-theme-live .social-topbar,
      #socialPanel.isa-profile-theme-live .nuvem-social-top,#familySocialOverlay.isa-profile-theme-live .nuvem-social-top{
        background:
          radial-gradient(circle at 7% 30%,color-mix(in srgb,var(--isa-profile-accent) 16%,transparent),transparent 25%),
          linear-gradient(100deg,color-mix(in srgb,var(--isa-profile-accent) 10%,#fffafc),#fff 46%,color-mix(in srgb,var(--isa-profile-accent) 13%,#eef5ff))!important;
        border-color:color-mix(in srgb,var(--isa-profile-accent) 30%,#eee)!important;
        box-shadow:0 12px 28px color-mix(in srgb,var(--isa-profile-accent) 15%,transparent)!important
      }
      #familySocialOverlay.isa-profile-theme-live .fs-static-wrap{background:linear-gradient(145deg,color-mix(in srgb,var(--isa-profile-accent) 8%,#fffafd),#faf7ff 54%,color-mix(in srgb,var(--isa-profile-accent) 8%,#eff7ff))!important}
      @media(max-width:760px){
        #socialPanel .isa-main-cover-slot,#familySocialOverlay .isa-main-cover-slot{height:142px;border-radius:22px;margin-bottom:11px!important}
        .isa-main-cover-tools{right:8px;bottom:8px;gap:5px}.isa-main-cover-size{font-size:8px;padding:5px 7px}.isa-main-cover-edit{font-size:9px;padding:7px 9px}
        #socialPanel .isa-story-strip[data-cover-story-order="1"],#familySocialOverlay .isa-story-strip[data-cover-story-order="1"]{margin-bottom:12px!important}
      }
    `;document.head.appendChild(s)
  }

  async function signed(path){if(!path)return'';const {data}=await db.storage.from('social-media').createSignedUrl(path,3600);return data?.signedUrl||''}
  async function internalData(force=false){
    if(me&&!force&&coverUrl)return{coverUrl,coverRef}
    const {data:{user}}=await db.auth.getUser();if(!user)return{coverUrl:'',coverRef:''}
    const {data:m}=await db.from('family_members').select('id,family_id').eq('auth_user_id',user.id).eq('active',true).maybeSingle();if(!m)return{coverUrl:'',coverRef:''};me=m
    const {data:p}=await db.from('social_profiles').select('cover_ref').eq('member_id',m.id).maybeSingle();coverRef=p?.cover_ref||'';coverUrl=coverRef?await signed(coverRef):'';return{coverUrl,coverRef}
  }
  async function externalData(){
    if(window.__ISA_FRIEND_ACCESS_VALID__!==true)return{coverUrl:'',coverRef:''}
    const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/friend-social`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({token,action:'bootstrap'}),cache:'no-store'})
    const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Não foi possível carregar a capa.')
    const id=d?.me?.id||window.__ISA_FRIEND_PERSON__?.id;const p=(d?.profiles||[]).find(x=>String(x.memberId||x.member_id)===String(id))||d?.me?.profile||{}
    coverUrl=p.coverUrl||p.cover_url||'';coverRef=p.coverRef||p.cover_ref||'';return{coverUrl,coverRef}
  }
  async function info(force=false){return external()?externalData():internalData(force)}
  function mainHost(r){return r?.querySelector?.('.social-main,.fs-static-main')||null}
  function composer(r){return r?.querySelector?.('.social-composer,#fs75Composer,.fs-static-welcome')||null}

  function applyAccent(r){
    const c=r?.dataset?.profileThemeColor||window.__ISA_PROFILE_THEME_V2__?.state?.themeColor||''
    if(c)r.style.setProperty('--isa-cover-accent',c)
  }
  function renderCover(slot,url){
    slot.classList.toggle('has-cover',!!url)
    const img=url?`<img src="${esc(url)}" alt="Capa do perfil">`:'<div class="isa-main-cover-placeholder"><div><span>🌷</span>Seu espaço de capa</div></div>'
    slot.innerHTML=`${img}<div class="isa-main-cover-tools"><small class="isa-main-cover-size">Ideal: 1600 × 600 px</small><button type="button" class="isa-main-cover-edit" data-isa-main-cover-edit>📷 ${url?'Trocar capa':'Adicionar capa'}</button></div>`
    slot.querySelector('[data-isa-main-cover-edit]')?.addEventListener('click',()=>{
      const api=window.__ISA_NOSSA_REDE_MEDIA_WORKFLOW__
      if(api?.pickCover)api.pickCover();else document.querySelector('[data-isa-media-destination="cover"]')?.click()
      ;[1500,4000,9000,18000].forEach(ms=>setTimeout(()=>refresh(true),ms))
    },{once:true})
  }

  async function mount(force=false){
    css();const r=root();if(!r||r.classList.contains('hidden'))return false
    applyAccent(r)
    const host=mainHost(r);if(!host)return false
    let stories=r.querySelector('.isa-story-strip')
    if(!stories){try{await window.__ISA_FAMILY_SOCIAL_EXTRAS__?.ensureStories?.(r)}catch{};stories=r.querySelector('.isa-story-strip')}
    let slot=r.querySelector('.isa-main-cover-slot')
    if(!slot){slot=document.createElement('section');slot.className='isa-main-cover-slot';slot.dataset.coverStoryLock='1'}
    const comp=composer(r)
    if(stories){
      if(slot.parentElement!==stories.parentElement||slot.nextElementSibling!==stories)stories.parentElement?.insertBefore(slot,stories)
      stories.dataset.coverStoryOrder='1'
      if(comp&&stories.nextElementSibling!==comp&&comp.parentElement===stories.parentElement)stories.insertAdjacentElement('afterend',comp)
    }else if(comp){comp.parentElement?.insertBefore(slot,comp)}
    const d=await info(force).catch(()=>({coverUrl:''}));renderCover(slot,d.coverUrl||'')
    bindObserver(r);return true
  }

  function bindObserver(r){
    const host=mainHost(r);if(!host||observer?._target===host)return
    try{observer?.disconnect()}catch{}
    observer=new MutationObserver(()=>{
      const s=r.querySelector('.isa-story-strip'),c=r.querySelector('.isa-main-cover-slot')
      if(!c||(s&&c.nextElementSibling!==s))schedule(false,60)
    });observer._target=host;observer.observe(host,{childList:true,subtree:false})
  }
  function schedule(force=false,delay=90){clearTimeout(timer);timer=setTimeout(()=>mount(force),delay)}
  async function refresh(force=true){coverUrl='';coverRef='';return mount(force)}

  for(const ev of ['isa:social-opened','isa:social-rendered','isa:friend-access-valid','isa:friend-portal-entered','isa:profile-updated','isa:theme-applied'])document.addEventListener(ev,()=>schedule(ev==='isa:profile-updated',70),{passive:true})
  document.addEventListener('click',e=>{if(e.target.closest?.('#socialNav,#friendSocialBtn,[data-social-open]'))schedule(false,120)},true)
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule(false,120)})
  window.addEventListener('pageshow',()=>schedule(true,250),{once:true})
  window.__ISA_NOSSA_REDE_COVER_STORY__={mount,refresh,get lock(){return{...window.__ISA_NOSSA_REDE_LAYOUT_LOCK__}}}
  css();setTimeout(()=>mount(true),760)
}
