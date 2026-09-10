import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js'

const db=createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}})
const $=id=>document.getElementById(id)
const external=!!$('friendApp')
const token=new URLSearchParams(location.hash.replace(/^#/,'')).get('acesso')||''
let birthDate='',loading=null,saving=false

function toast(text){const t=$('friendToast')||$('toast')||$('pssToast');if(!t)return;t.textContent=text;t.classList.remove('hidden');t.classList.add('show');clearTimeout(t._birth);t._birth=setTimeout(()=>{t.classList.add('hidden');t.classList.remove('show')},2600)}
async function rpcAnon(name,args={}){const r=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${name}`,{method:'POST',cache:'no-store',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${CONFIG.SUPABASE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(args)});let d=null;try{d=await r.json()}catch{};if(!r.ok)throw new Error(d?.message||d?.hint||d?.details||'Não foi possível atualizar a data de nascimento.');return d}
function today(){return new Date().toISOString().slice(0,10)}
async function loadBirth(force=false){
  if(loading&&!force)return loading
  loading=(async()=>{
    try{
      if(external){const d=await rpcAnon('friend_portal_bootstrap',{p_token:token});birthDate=d?.friend?.birthDate||window.__ISA_FRIEND_PERSON__?.birthDate||''}
      else{const {data,error}=await db.rpc('my_profile_birth_date');if(error)throw error;birthDate=data?.birthDate||''}
      syncInputs();return birthDate
    }catch(e){console.warn('Data de nascimento:',e);return birthDate}
    finally{loading=null}
  })();return loading
}
async function saveBirth(value){
  if(saving)return false
  const date=String(value||'').trim();if(!date)return toast('Informe sua data de nascimento.'),false
  if(date>today())return toast('A data de nascimento não pode estar no futuro.'),false
  saving=true
  try{
    if(external){await rpcAnon('friend_portal_set_birth_date',{p_token:token,p_birth_date:date});if(window.__ISA_FRIEND_PERSON__)window.__ISA_FRIEND_PERSON__.birthDate=date}
    else{const {error}=await db.rpc('set_my_profile_birth_date',{p_birth_date:date});if(error)throw error}
    birthDate=date;syncInputs();toast('Data de nascimento salva 🎂');document.dispatchEvent(new CustomEvent('isa:birth-date-updated',{detail:{birthDate:date}}));return true
  }catch(e){toast(e?.message||'Não foi possível salvar a data de nascimento.');return false}
  finally{saving=false}
}
function ensureStyle(){if($('profileBirthdayStyle'))return;const s=document.createElement('style');s.id='profileBirthdayStyle';s.textContent=`
.pb-birth-card{margin:12px 0;padding:12px 13px;border:1px solid rgba(232,210,229,.92);border-radius:17px;background:linear-gradient(145deg,#fff9fd,#f5efff);box-shadow:0 6px 15px rgba(91,68,111,.07)}
.pb-birth-label{display:flex;align-items:center;gap:7px;margin-bottom:7px;color:#5c4d6c;font-size:12px;font-weight:900}.pb-required{font-size:9px;color:#b73b62;background:#ffe7ef;border-radius:999px;padding:3px 7px}.pb-birth-line{display:flex;gap:7px;align-items:center}.pb-birth-line input{flex:1;min-width:0;height:39px;border:1px solid #e4d7eb;border-radius:12px;background:#fff;padding:0 10px;color:#5b4e67}.pb-birth-save{height:39px;border:0;border-radius:12px;padding:0 12px;background:linear-gradient(145deg,#f4bfda,#cfbafa);color:#60466e;font-weight:900;cursor:pointer}.pb-birth-card small{display:block;margin-top:6px;color:#8d7e95;font-size:9px;line-height:1.35}.pb-birth-card.missing{outline:2px solid rgba(231,104,145,.22);background:linear-gradient(145deg,#fff7fa,#fff0f5)}
@media(max-width:620px){.pb-birth-line{align-items:stretch}.pb-birth-save{padding:0 9px;font-size:10px}}
`;document.head.appendChild(s)}
function cardHtml(hostId){return `<div class="pb-birth-card ${birthDate?'':'missing'}" data-birth-card="${hostId}"><div class="pb-birth-label">🎂 Data de nascimento <span class="pb-required">OBRIGATÓRIA</span></div><div class="pb-birth-line"><input type="date" required max="${today()}" data-birth-input aria-label="Data de nascimento"><button class="pb-birth-save" type="button" data-birth-save>Salvar</button></div><small>Usamos a data para destacar seu aniversário no Isa Chat e na Nossa Rede. Ela não altera suas conversas.</small></div>`}
function attach(container,anchor,position='afterend'){
  if(!container||container.querySelector('[data-birth-card]'))return
  const tmp=document.createElement('div');tmp.innerHTML=cardHtml(container.id||'profile');const card=tmp.firstElementChild
  if(anchor&&anchor.parentNode){if(position==='afterend')anchor.insertAdjacentElement('afterend',card);else anchor.insertAdjacentElement('beforebegin',card)}else container.prepend(card)
  const input=card.querySelector('[data-birth-input]');input.value=birthDate||''
  card.querySelector('[data-birth-save]').onclick=async()=>{const ok=await saveBirth(input.value);if(ok)card.classList.remove('missing')}
}
function inject(){
  ensureStyle()
  const ep=$('externalProfileModal')?.querySelector('.ep-card');if(ep)attach(ep,ep.querySelector('.ep-current'))
  const pss=$('pssStatusModal')?.querySelector('.pss-card');if(pss)attach(pss,pss.querySelector('.pss-head'))
  const mainSocial=$('socialProfileModal')?.querySelector('.social-modal-card');if(mainSocial)attach(mainSocial,mainSocial.querySelector('h3'))
  const extSocial=$('fsProfileModal')?.querySelector('.fs-profile-card');if(extSocial)attach(extSocial,extSocial.querySelector('h3'))
  syncInputs()
}
function syncInputs(){document.querySelectorAll('[data-birth-card]').forEach(card=>{const input=card.querySelector('[data-birth-input]');if(input)input.value=birthDate||'';card.classList.toggle('missing',!birthDate)})}
function firstMissingInput(){const card=[...document.querySelectorAll('[data-birth-card]')].find(c=>c.offsetParent!==null);return card?.querySelector('[data-birth-input]')||null}
async function guardProfileSave(e){
  const b=e.target.closest?.('#socialProfileSave,#fsProfileSave,#pssSaveStatus');if(!b)return
  if(birthDate)return
  e.preventDefault();e.stopImmediatePropagation();await loadBirth(true)
  if(birthDate)return b.click()
  inject();const input=firstMissingInput();input?.focus();input?.scrollIntoView({behavior:'smooth',block:'center'});toast('Preencha a data de nascimento para concluir o perfil.')
}
document.addEventListener('click',guardProfileSave,true)
const obs=new MutationObserver(()=>inject());obs.observe(document.documentElement,{childList:true,subtree:true})
ensureStyle();loadBirth().then(inject);setTimeout(inject,500);setTimeout(inject,1400)
window.__ISA_PROFILE_BIRTHDAY__={load:()=>loadBirth(true),inject,save:saveBirth,get:()=>birthDate}
