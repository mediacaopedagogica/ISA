import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js?v=20260910-super-pais-v3'
const db=createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}})
const $=id=>document.getElementById(id)
const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ')
let me=null,members=[],settings=new Map(),mounted=false,retries=0,retryTimer=0,activeViewer=''

function toast(t){const e=$('toast');if(!e)return;e.textContent=t;e.classList.remove('hidden');clearTimeout(e._spv);e._spv=setTimeout(()=>e.classList.add('hidden'),3000)}
async function identity(force=false){if(me&&!force)return me;const {data:{user}}=await db.auth.getUser();if(!user)return null;const {data}=await db.from('family_members').select('id,family_id,display_name,relationship_label,role').eq('auth_user_id',user.id).eq('active',true).maybeSingle();me=data;return me}

// Só bloqueia as combinações familiares realmente proibidas. Todo o restante pode ser aprovado no Super Pais.
function allowedByHardRule(viewer,target){
  if(!viewer||!target||viewer.id===target.id)return false
  const a=norm(viewer.display_name),b=norm(target.display_name)
  const pair=new Set([a,b])
  if(pair.has('elion')&&pair.has('evalda'))return false
  if(pair.has('elion')&&pair.has('vania'))return false
  if(pair.has('elion')&&pair.has('silvane'))return false
  return true
}
async function load(){
  const who=await identity();if(!who||!['super_admin','super_parent'].includes(String(who.role)))return false
  const [mr,sr]=await Promise.all([
    db.from('family_members').select('id,display_name,relationship_label,role').eq('family_id',who.family_id).eq('active',true).order('display_name'),
    db.from('family_chat_visibility').select('viewer_id,allowed_member_ids,max_people').eq('family_id',who.family_id)
  ])
  if(mr.error)throw mr.error;if(sr.error)throw sr.error;members=mr.data||[];settings=new Map((sr.data||[]).map(x=>[x.viewer_id,x]));return true
}
function style(){if($('superPaisVisibilityStyle'))return;const s=document.createElement('style');s.id='superPaisVisibilityStyle';s.textContent=`
.spv-card{margin:14px 0 20px;padding:16px;border:1px solid #eadff1;border-radius:22px;background:linear-gradient(145deg,#fff9fd,#f4efff);box-shadow:0 12px 28px rgba(96,73,114,.08)}.spv-head{display:flex;gap:10px;justify-content:space-between;align-items:flex-start;flex-wrap:wrap}.spv-head h3{margin:0;color:#594561}.spv-head small{display:block;color:#907e97;margin-top:4px;line-height:1.35}.spv-person-tabs{display:flex;gap:7px;overflow:auto;padding:11px 0 9px;scrollbar-width:thin}.spv-person{border:1px solid #e5d8ec;background:#fff;border-radius:14px;padding:8px 11px;white-space:nowrap;font-weight:850;color:#6c5875;cursor:pointer}.spv-person.active{background:#eadcf7;border-color:#cbb0df;box-shadow:0 5px 12px rgba(100,75,120,.08)}.spv-view-title{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:3px 0 8px;color:#604c69}.spv-view-title b{font-size:12px}.spv-view-title small{font-size:9px;color:#95839c}.spv-options{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:8px 0}.spv-choice{display:flex;align-items:center;gap:7px;padding:10px;border:1px solid #eadff0;border-radius:13px;background:#fff;color:#66556d;font-size:12px;cursor:pointer}.spv-choice input{accent-color:#b995d2}.spv-choice:has(input:checked){background:linear-gradient(135deg,#fff,#f3e9fb);border-color:#d6bee4}.spv-bottom{display:flex;gap:10px;align-items:end;justify-content:flex-end;flex-wrap:wrap;margin-top:11px}.spv-bottom label{display:grid;gap:4px;font-size:10px;font-weight:800;color:#7b6983}.spv-bottom select{border:1px solid #dfd1e7;border-radius:12px;padding:9px;background:#fff}.spv-save{border:0;border-radius:13px;padding:10px 15px;background:linear-gradient(135deg,#dc8fc4,#ac91dc);color:#fff;font-weight:900;cursor:pointer}.spv-save:disabled{opacity:.6;cursor:wait}.spv-locknote{font-size:10px;color:#927e99;margin-top:9px;padding:8px 10px;border-radius:12px;background:#faf6fc}.spv-empty{color:#95859c;padding:10px 0}.spv-count{font-size:9px;color:#8d7995;font-weight:800}
@media(max-width:650px){.spv-card{padding:12px}.spv-options{grid-template-columns:1fr 1fr}.spv-choice{padding:9px 7px;font-size:11px}.spv-bottom{align-items:stretch}.spv-bottom label,.spv-save{width:100%}.spv-bottom select{width:100%}}@media(max-width:390px){.spv-options{grid-template-columns:1fr}}
`;document.head.appendChild(s)}
function effective(viewer){const s=settings.get(viewer.id);if(s)return new Set((s.allowed_member_ids||[]).map(String));return new Set(members.filter(t=>allowedByHardRule(viewer,t)).map(t=>String(t.id)))}
function updateCount(){const n=document.querySelectorAll('#spvEditor [data-spv-member]:checked').length,c=$('spvSelectedCount');if(c)c.textContent=`${n} conversa${n===1?'':'s'} aprovada${n===1?'':'s'}`}
function renderViewer(viewerId){
  const viewer=members.find(x=>String(x.id)===String(viewerId)),box=$('spvEditor');if(!viewer||!box)return
  activeViewer=String(viewer.id)
  const chosen=effective(viewer),setting=settings.get(viewer.id),max=setting?.max_people||Math.min(8,Math.max(2,members.length))
  const available=members.filter(t=>allowedByHardRule(viewer,t))
  const blocked=members.filter(t=>t.id!==viewer.id&&!allowedByHardRule(viewer,t))
  box.innerHTML=`<div class="spv-view-title"><b>Conversas que aparecerão para ${viewer.display_name}</b><small id="spvSelectedCount"></small></div><div class="spv-options">${available.map(t=>`<label class="spv-choice"><input type="checkbox" data-spv-member="${t.id}" ${chosen.has(String(t.id))?'checked':''}><span>💬 ${t.display_name}</span></label>`).join('')}</div>${blocked.length?`<div class="spv-locknote">🔒 Restrições fixas: ${blocked.map(x=>x.display_name).join(', ')} não podem ser liberados para ${viewer.display_name}.</div>`:''}<div class="spv-bottom"><label>Máximo de pessoas em grupos<select id="spvMax">${Array.from({length:Math.max(1,Math.min(11,members.length-1))},(_,i)=>i+2).map(n=>`<option value="${n}" ${Number(max)===n?'selected':''}>Até ${n} pessoas</option>`).join('')}</select></label><button id="spvSave" class="spv-save" type="button">Aprovar conversas de ${viewer.display_name}</button></div>`
  box.querySelectorAll('[data-spv-member]').forEach(x=>x.addEventListener('change',updateCount));updateCount();$('spvSave').onclick=()=>save(viewer)
}
async function ensureDirect(viewerId,targetId){
  const {data,error}=await db.rpc('ensure_family_direct_conversation',{p_viewer:viewerId,p_target:targetId})
  if(error)throw error
  return data
}
async function save(viewer){
  const btn=$('spvSave');if(btn){btn.disabled=true;btn.textContent='Aplicando…'}
  try{
    const ids=[...document.querySelectorAll('#spvEditor [data-spv-member]:checked')].map(x=>x.dataset.spvMember),max=Number($('spvMax')?.value||8)
    const safeIds=ids.filter(id=>{const t=members.find(x=>String(x.id)===String(id));return t&&allowedByHardRule(viewer,t)})
    const row={viewer_id:viewer.id,family_id:me.family_id,allowed_member_ids:safeIds,max_people:max,updated_by:me.id,updated_at:new Date().toISOString()}
    const {error}=await db.from('family_chat_visibility').upsert(row,{onConflict:'viewer_id'});if(error)throw error
    settings.set(viewer.id,row)
    const results=await Promise.allSettled(safeIds.map(id=>ensureDirect(viewer.id,id)))
    const failed=results.filter(x=>x.status==='rejected')
    if(failed.length)console.warn('Algumas conversas não puderam ser criadas:',failed)
    toast(`Conversas de ${viewer.display_name} aprovadas 💜`)
    document.dispatchEvent(new CustomEvent('isa:family-visibility-updated',{detail:{viewerId:viewer.id,allowedMemberIds:safeIds,maxPeople:max}}))
    document.dispatchEvent(new CustomEvent('isa:family-conversations-approved',{detail:{viewerId:viewer.id,allowedMemberIds:safeIds}}))
    window.__ISA_FAMILY_CHAT_VISIBILITY__?.refresh?.()
  }catch(error){toast('Não foi possível aplicar: '+(error?.message||'erro inesperado'))}
  finally{if(btn){btn.disabled=false;btn.textContent=`Aprovar conversas de ${viewer.display_name}`}}
}
function render(){
  const panel=$('parentsPanel');if(!panel)return false
  style();let card=$('superPaisVisibilityCard')
  if(!card){card=document.createElement('section');card.id='superPaisVisibilityCard';card.className='spv-card';card.innerHTML=`<div class="spv-head"><div><h3>👑 Conversas de cada pessoa</h3><small>Escolha qualquer familiar abaixo e aprove exatamente quem poderá aparecer no chat dela. Ao aprovar, a conversa direta é criada automaticamente quando ainda não existir.</small></div></div><div id="spvPersonTabs" class="spv-person-tabs"></div><div id="spvEditor" class="spv-empty">Carregando familiares…</div>`;const before=$('permissionsTable')?.previousElementSibling||$('permissionsTable');if(before?.parentElement)before.parentElement.insertBefore(card,before);else panel.appendChild(card)}
  mounted=true;const tabs=$('spvPersonTabs'),selected=activeViewer&&members.some(m=>String(m.id)===activeViewer)?activeViewer:String(members[0]?.id||'')
  tabs.innerHTML=members.map(m=>`<button type="button" class="spv-person ${String(m.id)===selected?'active':''}" data-spv-viewer="${m.id}">${m.display_name}</button>`).join('')
  tabs.onclick=e=>{const b=e.target.closest('[data-spv-viewer]');if(!b)return;tabs.querySelectorAll('.spv-person').forEach(x=>x.classList.toggle('active',x===b));renderViewer(b.dataset.spvViewer)}
  if(selected)renderViewer(selected);return true
}
async function start(force=false){try{if(force){me=null;mounted=false}if(await load())return render()}catch(e){console.warn('Super Pais:',e)}return false}
function retry(){clearTimeout(retryTimer);if(retries++>30)return;retryTimer=setTimeout(async()=>{if(!(await start()))retry()},220)}
start().then(ok=>{if(!ok)retry()});document.addEventListener('isa:parent-panel-opened',()=>start(true));document.addEventListener('click',e=>{if(e.target.closest?.('[data-tab="parents"],#parentsNav'))setTimeout(()=>start(true),100)},true)
window.__ISA_SUPER_PAIS_VISIBILITY__={start,renderViewer,allowedByHardRule,ensureDirect}
