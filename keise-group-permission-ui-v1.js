import { CONFIG } from './config.js'

const $=id=>document.getElementById(id)
const norm=v=>String(v||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
let targetId=''

function token(){
  try{
    const ref=new URL(CONFIG.SUPABASE_URL).hostname.split('.')[0]
    const raw=localStorage.getItem(`sb-${ref}-auth-token`);if(!raw)return''
    const d=JSON.parse(raw);return d?.access_token||d?.currentSession?.access_token||d?.session?.access_token||''
  }catch{return''}
}
function toast(text){const t=$('toast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._kgp);t._kgp=setTimeout(()=>t.classList.add('hidden'),2600)}
async function familyAdmin(memberId,enabled){
  const auth=token();if(!auth)throw new Error('Sessão não encontrada.')
  const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/family-admin`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${auth}`,'Content-Type':'application/json'},body:JSON.stringify({action:'set_permissions',memberId,permissions:{group:!!enabled}}),cache:'no-store'})
  const data=await r.json().catch(()=>({}));if(!r.ok||data?.error)throw new Error(data?.error||'Não foi possível salvar a permissão de grupos.');return data
}
async function currentPermission(memberId){
  const auth=token();if(!auth)return true
  const r=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/family_members?id=eq.${encodeURIComponent(memberId)}&select=can_create_group`,{headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${auth}`},cache:'no-store'})
  const data=await r.json().catch(()=>[]);return r.ok&&Array.isArray(data)&&data[0]?data[0].can_create_group!==false:true
}
function ensureStyle(){
  if($('keiseGroupPermissionStyle'))return
  const s=document.createElement('style');s.id='keiseGroupPermissionStyle';s.textContent=`
    .kgp-wrap{margin:8px 0 12px;padding:10px 12px;border:1px solid #eadff0;border-radius:15px;background:linear-gradient(145deg,#fff9fd,#f5efff)}
    .kgp-wrap .check-line{margin:0!important}.kgp-note{display:block;margin:5px 0 0 27px;color:#8b7993;font-size:10px;line-height:1.35}
  `;document.head.appendChild(s)
}
async function patchPermissionDialog(memberId=targetId){
  const dlg=$('simpleDialog'),content=$('dialogContent');if(!dlg||!content||!dlg.open||$('permGroup'))return
  const heading=content.querySelector('h3');if(!heading||!norm(heading.textContent).includes('permissoes')||!norm(heading.textContent).includes('keise'))return
  targetId=memberId||targetId;if(!targetId)return
  ensureStyle()
  const save=$('savePermBtn');if(!save)return
  const wrap=document.createElement('div');wrap.className='kgp-wrap';wrap.innerHTML=`<label class="check-line"><input id="permGroup" type="checkbox"> Pode criar grupos</label><small class="kgp-note">Keise pode montar grupos escolhendo os familiares permitidos. Elion nunca poderá ficar no mesmo grupo que Evalda ou Vânia.</small>`
  save.insertAdjacentElement('beforebegin',wrap)
  const input=$('permGroup');input.checked=await currentPermission(targetId)
  if(save.dataset.kgpBound==='1')return
  save.dataset.kgpBound='1';const original=save.onclick
  save.onclick=async e=>{
    const enabled=$('permGroup')?.checked??true
    try{save.disabled=true;await familyAdmin(targetId,enabled)}catch(err){save.disabled=false;const msg=$('dialogMsg');if(msg)msg.textContent=err?.message||'Não foi possível salvar a permissão de grupos.';else toast(err?.message||'Não foi possível salvar.');return}
    save.disabled=false
    if(typeof original==='function')return original.call(save,e)
    dlg.close();toast('Permissões atualizadas')
  }
}
document.addEventListener('click',e=>{
  const b=e.target.closest?.('[data-perm]');if(!b)return
  targetId=b.dataset.perm||'';setTimeout(()=>patchPermissionDialog(targetId),0);setTimeout(()=>patchPermissionDialog(targetId),80)
},true)
const dlg=$('simpleDialog');if(dlg)new MutationObserver(()=>patchPermissionDialog(targetId)).observe(dlg,{attributes:true,attributeFilter:['open'],childList:true,subtree:true})
window.__ISA_PATCH_KEISE_GROUP_PERMISSION__=()=>patchPermissionDialog(targetId)
