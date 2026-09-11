import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js?v=20260911-profile-theme-stable'

const db=createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}})
const $=id=>document.getElementById(id)
const token=new URLSearchParams(location.hash.replace(/^#/, '')).get('acesso')||''
const QUICK={pink:'#f4b6cf',lilac:'#c7b5ee',green:'#b8deb9',yellow:'#f5df92',blue:'#b9d9ef'}
let state={theme:'lilac',themeColor:null},me=null,bound=false,loading=null,waitTimer=0,waitCount=0

const toast=text=>{const t=$('friendToast')||$('toast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._themeV2);t._themeV2=setTimeout(()=>t.classList.add('hidden'),2800)}
function mix(hex,alpha=.18){const h=String(hex||'').replace('#','');if(!/^[0-9a-f]{6}$/i.test(h))return`rgba(199,181,238,${alpha})`;const n=parseInt(h,16);return`rgba(${n>>16},${(n>>8)&255},${n&255},${alpha})`}
function accent(){return state.themeColor||QUICK[state.theme]||QUICK.lilac}
function roots(){return[$('socialPanel'),$('familySocialOverlay')].filter(Boolean)}
function modal(){return $('socialProfileModal')||$('fsProfileModal')}
function profileHost(root){return root?.querySelector?.('#socialMyProfile,#fsMyProfile')||$('socialMyProfile')||$('fsMyProfile')}

function css(){
  if($('isaProfileThemeV2Css'))return
  const s=document.createElement('style');s.id='isaProfileThemeV2Css';s.textContent=`
#socialPanel,#familySocialOverlay{--isa-profile-accent:#c7b5ee;--isa-profile-soft:rgba(199,181,238,.18);--isa-profile-veil:rgba(199,181,238,.10);--isa-profile-line:rgba(199,181,238,.34);--isa-profile-shadow:rgba(199,181,238,.18)}
#socialPanel.isa-profile-theme-live,#familySocialOverlay.isa-profile-theme-live{
  background:radial-gradient(circle at 8% 8%,var(--isa-profile-soft),transparent 29%),radial-gradient(circle at 92% 10%,var(--isa-profile-veil),transparent 30%),linear-gradient(145deg,color-mix(in srgb,var(--isa-profile-accent) 10%,#fffafd),#faf6ff 52%,color-mix(in srgb,var(--isa-profile-accent) 8%,#eef8ff))!important;
  transition:background .24s ease!important
}
#socialPanel.isa-profile-theme-live .social-card,#familySocialOverlay.isa-profile-theme-live .social-card,
#socialPanel.isa-profile-theme-live .isa-story-strip,#familySocialOverlay.isa-profile-theme-live .isa-story-strip,
#socialPanel.isa-profile-theme-live .isa-birthday-card,#familySocialOverlay.isa-profile-theme-live .isa-birthday-card,
#socialPanel.isa-profile-theme-live .isa-status-card-wrap,#familySocialOverlay.isa-profile-theme-live .isa-status-card-wrap,
#socialPanel.isa-profile-theme-live .isa-custom-card,#familySocialOverlay.isa-profile-theme-live .isa-custom-card,
#socialPanel.isa-profile-theme-live .nuvem-compose-compact,#familySocialOverlay.isa-profile-theme-live .nuvem-compose-compact{
  border-color:var(--isa-profile-line)!important;
  box-shadow:0 16px 36px var(--isa-profile-shadow)!important;
  background:linear-gradient(145deg,rgba(255,255,255,.97),color-mix(in srgb,var(--isa-profile-accent) 11%,#fff))!important;
  transition:background .22s ease,border-color .22s ease,box-shadow .22s ease!important
}
#socialPanel.isa-profile-theme-live .social-side,#familySocialOverlay.isa-profile-theme-live .social-side,
#socialPanel.isa-profile-theme-live .social-topbar,#familySocialOverlay.isa-profile-theme-live .social-topbar,
#socialPanel.isa-profile-theme-live .social-composer,#familySocialOverlay.isa-profile-theme-live .social-composer,
#socialPanel.isa-profile-theme-live .social-right,#familySocialOverlay.isa-profile-theme-live .social-right{
  border-color:var(--isa-profile-line)!important;
  background:linear-gradient(145deg,rgba(255,255,255,.98),color-mix(in srgb,var(--isa-profile-accent) 12%,#fff))!important
}
#socialPanel.isa-profile-theme-live .social-pill,#familySocialOverlay.isa-profile-theme-live .social-pill,
#socialPanel.isa-profile-theme-live .social-status-card,#familySocialOverlay.isa-profile-theme-live .social-status-card,
#socialPanel.isa-profile-theme-live .social-family-item,#familySocialOverlay.isa-profile-theme-live .social-family-item,
#socialPanel.isa-profile-theme-live .isa-side-link,#familySocialOverlay.isa-profile-theme-live .isa-side-link,
#socialPanel.isa-profile-theme-live .isa-compose-chip,#familySocialOverlay.isa-profile-theme-live .isa-compose-chip,
#socialPanel.isa-profile-theme-live .isa-custom-option,#familySocialOverlay.isa-profile-theme-live .isa-custom-option{
  border-color:color-mix(in srgb,var(--isa-profile-accent) 30%,#eee)!important;
  background:linear-gradient(135deg,#fff,var(--isa-profile-soft))!important
}
#socialPanel.isa-profile-theme-live .social-btn.primary,#familySocialOverlay.isa-profile-theme-live .social-btn.primary,
#socialPanel.isa-profile-theme-live .spp-primary,#familySocialOverlay.isa-profile-theme-live .spp-primary,
#socialPanel.isa-profile-theme-live .isa-birthday-btn,#familySocialOverlay.isa-profile-theme-live .isa-birthday-btn,
#socialPanel.isa-profile-theme-live .isa-mobile-plus,#familySocialOverlay.isa-profile-theme-live .isa-mobile-plus{
  background:linear-gradient(135deg,var(--isa-profile-accent),color-mix(in srgb,var(--isa-profile-accent) 68%,#8065ad))!important;color:#fff!important;box-shadow:0 8px 18px color-mix(in srgb,var(--isa-profile-accent) 28%,transparent)!important
}
#socialPanel.isa-profile-theme-live .social-brand span,#familySocialOverlay.isa-profile-theme-live .social-brand span,
#socialPanel.isa-profile-theme-live .nuvem-share-title,#familySocialOverlay.isa-profile-theme-live .nuvem-share-title,
#socialPanel.isa-profile-theme-live .isa-right-title,#familySocialOverlay.isa-profile-theme-live .isa-right-title,
#socialPanel.isa-profile-theme-live .isa-social-logo-heart,#familySocialOverlay.isa-profile-theme-live .isa-social-logo-heart{
  color:color-mix(in srgb,var(--isa-profile-accent) 78%,#c94f9c)!important
}
#socialPanel.isa-profile-theme-live .social-post,#familySocialOverlay.isa-profile-theme-live .social-post{border-color:color-mix(in srgb,var(--isa-profile-accent) 28%,#eee)!important}
#socialPanel.isa-profile-theme-live .isa-mobile-bottom,#familySocialOverlay.isa-profile-theme-live .isa-mobile-bottom{border-color:var(--isa-profile-line)!important;background:color-mix(in srgb,var(--isa-profile-accent) 8%,rgba(255,255,255,.97))!important}
#socialPanel.isa-profile-theme-live .isa-story-ring,#familySocialOverlay.isa-profile-theme-live .isa-story-ring{box-shadow:0 0 0 3px color-mix(in srgb,var(--isa-profile-accent) 72%,#fff)!important}
.isa-theme-extra{margin-top:9px;padding:10px;border:1px solid #eadff0;border-radius:15px;background:#fffafd}.isa-theme-extra>b{display:block;font-size:11px;color:#66516f;margin-bottom:6px}.isa-theme-color-row{display:flex;align-items:center;gap:9px}.isa-theme-color-row input[type=color]{width:58px;height:42px;border:1px solid #dfd2e7;border-radius:13px;padding:3px;background:#fff;cursor:pointer}.isa-theme-color-row span{font-size:10px;color:#8b7992;line-height:1.35;flex:1}.isa-theme-color-row button{border:0;border-radius:11px;padding:8px 10px;background:#eee4f6;color:#66516f;font-size:9px;font-weight:900;cursor:pointer}.isa-profile-bg-editor{display:none!important}
@media(max-width:760px){.isa-theme-color-row{align-items:flex-start}}
  `;document.head.appendChild(s)
}

async function identity(){if(me)return me;const {data:{user}}=await db.auth.getUser();if(!user)return null;const {data}=await db.from('family_members').select('id,family_id,display_name').eq('auth_user_id',user.id).eq('active',true).maybeSingle();me=data;return me}
async function externalCall(action,payload={}){const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/friend-profile-style`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({token,action,...payload}),cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Não foi possível atualizar o tema.');return d}
async function loadState(force=false){
  if(loading&&!force)return loading
  loading=(async()=>{
    try{
      if(token&&window.__ISA_FRIEND_ACCESS_VALID__===true){const d=await externalCall('get');state={theme:d.theme||'lilac',themeColor:d.themeColor||null};apply();inject();syncControls();return state}
      const who=await identity();if(!who)return state
      const {data,error}=await db.from('social_profiles').select('theme,theme_color').eq('member_id',who.id).maybeSingle();if(error)throw error
      state={theme:data?.theme||'lilac',themeColor:data?.theme_color||null};apply();inject();syncControls();return state
    }catch(e){console.warn('Tema do perfil:',e);return state}
  })().finally(()=>loading=null)
  return loading
}
function apply(){
  css();const c=accent()
  for(const root of roots()){
    root.style.setProperty('--isa-profile-accent',c);root.style.setProperty('--isa-profile-soft',mix(c,.18));root.style.setProperty('--isa-profile-veil',mix(c,.10));root.style.setProperty('--isa-profile-line',mix(c,.34));root.style.setProperty('--isa-profile-shadow',mix(c,.18));root.classList.add('isa-profile-theme-live');root.dataset.profileThemeColor=c
    const side=profileHost(root)?.closest('.social-side');if(side){side.classList.add('isa-profile-themed');side.classList.remove('isa-profile-bg');side.style.removeProperty('background-image');side.style.removeProperty('background-position')}
  }
  document.dispatchEvent(new CustomEvent('isa:theme-applied',{detail:{color:c,theme:state.theme}}));return roots().length>0
}
function themeField(){const m=modal();if(!m)return null;const quick=m.querySelector('.social-theme-grid,.external-theme-swatches')||$('fsTheme')?.closest('.social-field');return quick?.closest('.social-field')||quick?.parentElement||null}
function inject(){
  css();document.querySelectorAll('.isa-profile-bg-editor').forEach(x=>x.remove());const field=themeField();if(!field)return false
  if(!field.querySelector('.isa-theme-extra')){
    const d=document.createElement('div');d.className='isa-theme-extra';d.innerHTML=`<b>🎨 Todas as cores</b><div class="isa-theme-color-row"><input id="isaProfileThemeColor" type="color" value="${accent()}" aria-label="Escolher qualquer cor do tema"><span>A cor escolhida muda a Nossa Rede inteira, sem mover nenhum elemento.</span><button id="isaThemeUseQuick" type="button">Usar cor rápida</button></div>`;field.appendChild(d)
    $('isaProfileThemeColor')?.addEventListener('input',e=>{state.themeColor=e.target.value;apply()})
    $('isaThemeUseQuick')?.addEventListener('click',()=>{state.themeColor=null;apply();syncControls()})
  }
  syncControls();return true
}
function syncControls(){const c=$('isaProfileThemeColor');if(c)c.value=accent()}
function quickThemeFrom(el){const t=el?.dataset?.theme||($('fsTheme')?.value||'');return QUICK[t]?t:''}
function previewQuick(t){if(!QUICK[t])return;state.theme=t;state.themeColor=null;apply();syncControls()}
async function saveEnhancements(){
  try{
    if(token&&window.__ISA_FRIEND_ACCESS_VALID__===true){if(state.themeColor)await externalCall('save_theme',{themeColor:state.themeColor});else await externalCall('clear_custom_theme');await loadState(true);return}
    const who=await identity();if(!who)return
    const {error}=await db.from('social_profiles').update({theme_color:state.themeColor||null,updated_at:new Date().toISOString()}).eq('member_id',who.id);if(error)throw error
    await loadState(true)
  }catch(e){toast(e.message||'Não foi possível salvar a cor do perfil.')}
}
function scan(){inject();apply()}
function waitForUi(){clearTimeout(waitTimer);if(roots().length||++waitCount>18){scan();return}waitTimer=setTimeout(waitForUi,160)}
function bind(){
  if(bound)return;bound=true
  document.addEventListener('click',e=>{
    const b=e.target.closest?.('.social-theme,.external-theme-swatch');if(b){const t=quickThemeFrom(b);if(t)previewQuick(t);return}
    if(e.target.closest?.('#socialProfileSave,#fsProfileSave'))setTimeout(saveEnhancements,180)
    if(e.target.closest?.('#socialEditProfile,#fsEditProfile,#socialNav,#friendSocialBtn'))setTimeout(()=>loadState().then(scan),40)
  },true)
  document.addEventListener('input',e=>{if(e.target?.id==='isaProfileThemeColor'){state.themeColor=e.target.value;apply()}},true)
  document.addEventListener('change',e=>{if(e.target?.id==='fsTheme'||e.target?.id==='socialTheme')previewQuick(e.target.value)},true)
  document.addEventListener('isa:profile-theme-preview',e=>previewQuick(e.detail?.theme),{passive:true})
  for(const ev of ['isa:social-opened','isa:social-rendered','isa:social-profile-editor-opened','isa:friend-access-valid','isa:friend-portal-entered'])document.addEventListener(ev,()=>loadState().then(scan),{passive:true})
  document.addEventListener('isa:profile-updated',()=>setTimeout(()=>loadState(true).then(scan),60),{passive:true})
}

css();bind();waitForUi();setTimeout(()=>loadState().then(scan),260)
window.__ISA_PROFILE_THEME_V2__={scan,loadState,apply,inject,get state(){return{...state}}}
