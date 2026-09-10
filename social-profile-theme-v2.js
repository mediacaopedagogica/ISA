import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js?v=20260910-profile-theme-color-only'

const db=createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}})
const $=id=>document.getElementById(id)
const token=new URLSearchParams(location.hash.replace(/^#/, '')).get('acesso')||''
const QUICK={pink:'#f4b6cf',lilac:'#c7b5ee',green:'#b8deb9',yellow:'#f5df92',blue:'#b9d9ef'}
let state={theme:'lilac',themeColor:null},me=null,bound=false,scanTimer=0

const toast=text=>{const t=$('friendToast')||$('toast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._themeV2);t._themeV2=setTimeout(()=>t.classList.add('hidden'),2800)}
function mix(hex,alpha=.18){const n=parseInt(String(hex).replace('#',''),16);const r=n>>16,g=(n>>8)&255,b=n&255;return`rgba(${r},${g},${b},${alpha})`}
function accent(){return state.themeColor||QUICK[state.theme]||QUICK.lilac}
function profileHost(){return $('socialMyProfile')||$('fsMyProfile')}
function overlay(){return $('socialPanel')||$('familySocialOverlay')}
function modal(){return $('socialProfileModal')||$('fsProfileModal')}

function css(){if($('isaProfileThemeV2Css'))return;const s=document.createElement('style');s.id='isaProfileThemeV2Css';s.textContent=`
#socialPanel,#familySocialOverlay{--isa-profile-accent:#c7b5ee;--isa-profile-soft:rgba(199,181,238,.18)}
#socialPanel .social-side,#familySocialOverlay .social-side{position:relative;overflow:hidden;isolation:isolate;transition:background .25s,border-color .25s,box-shadow .25s}
#socialPanel .social-side>* ,#familySocialOverlay .social-side>*{position:relative;z-index:1}
#socialPanel .social-side.isa-profile-themed,#familySocialOverlay .social-side.isa-profile-themed{background:linear-gradient(145deg,#fff,color-mix(in srgb,var(--isa-profile-accent) 12%,#fff))!important;border-color:color-mix(in srgb,var(--isa-profile-accent) 42%,#fff)!important;box-shadow:0 18px 38px color-mix(in srgb,var(--isa-profile-accent) 18%,transparent)!important}
#socialPanel .social-side .social-pill,#familySocialOverlay .social-side .social-pill{background:linear-gradient(135deg,#fff,var(--isa-profile-soft))!important;border-color:color-mix(in srgb,var(--isa-profile-accent) 28%,#eee)!important}
#socialPanel .social-side .social-btn.primary,#familySocialOverlay .social-side .social-btn.primary{background:linear-gradient(135deg,var(--isa-profile-accent),color-mix(in srgb,var(--isa-profile-accent) 68%,#8d76bd))!important;color:#fff!important}
.isa-theme-extra{margin-top:9px;padding:10px;border:1px solid #eadff0;border-radius:15px;background:#fffafd}.isa-theme-extra>b{display:block;font-size:11px;color:#66516f;margin-bottom:6px}.isa-theme-color-row{display:flex;align-items:center;gap:9px}.isa-theme-color-row input[type=color]{width:58px;height:42px;border:1px solid #dfd2e7;border-radius:13px;padding:3px;background:#fff;cursor:pointer}.isa-theme-color-row span{font-size:10px;color:#8b7992;line-height:1.35;flex:1}.isa-theme-color-row button{border:0;border-radius:11px;padding:8px 10px;background:#eee4f6;color:#66516f;font-size:9px;font-weight:900;cursor:pointer}
.isa-profile-bg-editor{display:none!important}
@media(max-width:760px){.isa-theme-color-row{align-items:flex-start}}
`;document.head.appendChild(s)}

async function identity(){if(me)return me;const {data:{user}}=await db.auth.getUser();if(!user)return null;const {data}=await db.from('family_members').select('id,family_id,display_name').eq('auth_user_id',user.id).eq('active',true).maybeSingle();me=data;return me}
async function externalCall(action,payload={}){const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/friend-profile-style`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({token,action,...payload}),cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Não foi possível atualizar o tema.');return d}
async function loadState(){
  try{
    if(token&&window.__ISA_FRIEND_ACCESS_VALID__===true){const d=await externalCall('get');state={theme:d.theme||'lilac',themeColor:d.themeColor||null};apply();syncControls();return state}
    const who=await identity();if(!who)return state;const {data,error}=await db.from('social_profiles').select('theme,theme_color').eq('member_id',who.id).maybeSingle();if(error)throw error;state={theme:data?.theme||'lilac',themeColor:data?.theme_color||null};apply();syncControls();return state
  }catch(e){console.warn('Tema do perfil:',e);return state}
}
function apply(){css();const root=overlay(),host=profileHost(),side=host?.closest('.social-side');if(!root||!side)return;const c=accent();root.style.setProperty('--isa-profile-accent',c);root.style.setProperty('--isa-profile-soft',mix(c,.18));side.classList.add('isa-profile-themed');side.classList.remove('isa-profile-bg');side.style.removeProperty('background-image');side.style.removeProperty('background-position')}
function themeField(){const m=modal();if(!m)return null;const quick=m.querySelector('.social-theme-grid,.external-theme-swatches')||$('fsTheme')?.closest('.social-field');return quick?.closest('.social-field')||quick?.parentElement||null}
function inject(){css();document.querySelectorAll('.isa-profile-bg-editor').forEach(x=>x.remove());const field=themeField();if(!field)return false;if(!field.querySelector('.isa-theme-extra')){const d=document.createElement('div');d.className='isa-theme-extra';d.innerHTML=`<b>🎨 Todas as cores</b><div class="isa-theme-color-row"><input id="isaProfileThemeColor" type="color" value="${accent()}" aria-label="Escolher qualquer cor do tema"><span>Use uma das cores rápidas ou escolha qualquer cor aqui. A prévia muda na hora.</span><button id="isaThemeUseQuick" type="button">Usar cor rápida</button></div>`;field.appendChild(d);$('isaProfileThemeColor').addEventListener('input',e=>{state.themeColor=e.target.value;apply()});$('isaThemeUseQuick').onclick=()=>{state.themeColor=null;apply();syncControls()}}syncControls();return true}
function syncControls(){const c=$('isaProfileThemeColor');if(c)c.value=accent()}
function quickThemeFrom(el){const t=el?.dataset?.theme||($('fsTheme')?.value||'');return QUICK[t]?t:''}
function bindLiveTheme(){if(bound)return;bound=true;document.addEventListener('click',e=>{const b=e.target.closest?.('.social-theme,.external-theme-swatch');if(!b)return;const t=quickThemeFrom(b);if(!t)return;state.theme=t;state.themeColor=null;apply();syncControls()},true);document.addEventListener('change',e=>{if(e.target?.id==='fsTheme'){const t=e.target.value;if(QUICK[t]){state.theme=t;state.themeColor=null;apply();syncControls()}}},true);document.addEventListener('click',e=>{if(e.target.closest?.('#socialProfileSave,#fsProfileSave'))setTimeout(saveEnhancements,40)},true)}
async function saveEnhancements(){try{if(token&&window.__ISA_FRIEND_ACCESS_VALID__===true){if(state.themeColor)await externalCall('save_theme',{themeColor:state.themeColor});else await externalCall('clear_custom_theme');await loadState();return}const who=await identity();if(!who)return;const {error}=await db.from('social_profiles').update({theme_color:state.themeColor||null,updated_at:new Date().toISOString()}).eq('member_id',who.id);if(error)throw error;await loadState()}catch(e){toast(e.message||'Não foi possível salvar a cor do perfil.')}}
function scan(){clearTimeout(scanTimer);scanTimer=setTimeout(()=>{inject();apply()},40)}

bindLiveTheme();new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('isa:friend-access-valid',()=>setTimeout(()=>loadState().then(scan),100));document.addEventListener('isa:friend-portal-entered',()=>setTimeout(()=>loadState().then(scan),160));document.addEventListener('click',e=>{if(e.target.closest?.('#socialEditProfile,#fsEditProfile'))setTimeout(scan,20)},true);setTimeout(()=>loadState().then(scan),500);setTimeout(scan,1200)
window.__ISA_PROFILE_THEME_V2__={scan,loadState,apply}
