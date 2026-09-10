import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js?v=20260910-super-pais-v2'
const db=createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}})
const $=id=>document.getElementById(id)
const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ')
let me=null,members=[],settings=new Map(),mounted=false,retries=0,retryTimer=0

function toast(t){const e=$('toast');if(!e)return;e.textContent=t;e.classList.remove('hidden');clearTimeout(e._spv);e._spv=setTimeout(()=>e.classList.add('hidden'),2600)}
async function identity(force=false){if(me&&!force)return me;const {data:{user}}=await db.auth.getUser();if(!user)return null;const {data}=await db.from('family_members').select('id,family_id,display_name,relationship_label,role').eq('auth_user_id',user.id).eq('active',true).maybeSingle();me=data;return me}
function allowedByHardRule(viewer,target){
  if(viewer.id===target.id)return false
  const v=norm(viewer.display_name),t=norm(target.display_name)
  if(v==='elion')return ['isa','keise','alan','davi'].includes(t)
  if(v==='evalda')return ['isa','alan','keise','paloma','vania'].includes(t)
  if(v==='paloma')return ['keise','alan','davi','isa','evalda'].includes(t)
  if(v==='vania')return t!=='elion'
  if(v==='silvane')return ['alan','isa','keise'].includes(t)
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
.spv-card{margin:18px 0;padding:16px;border:1px solid #eadff1;border-radius:22px;background:linear-gradient(145deg,#fff9fd,#f4efff);box-shadow:0 12px 28px rgba(96,73,114,.08)}.spv-head{display:flex;gap:10px;justify-content:space-between;align-items:flex-start;flex-wrap:wrap}.spv-head h3{margin:0;color:#594561}.spv-head small{display:block;color:#907e97;margin-top:3px}.spv-person-tabs{display:flex;gap:7px;overflow:auto;padding:10px 0}.spv-person{border:1px solid #e5d8ec;background:#fff;border-radius:14px;padding:8px 11px;white-space:nowrap;font-weight:850;color:#6c5875;cursor:pointer}.spv-person.active{background:#eadcf7;border-color:#cbb0df}.spv-options{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:8px;margin:8px 0}.spv-choice{display:flex;align-items:center;gap:7px;padding:9px 10px;border:1px solid #eadff0;border-radius:13px;background:#fff;color:#66556d;font-size:12px}.spv-choice.locked{opacity:.52;background:#f5f1f6}.spv-choice input{accent-color:#b995d2}.spv-bottom{display:flex;gap:10px;align-items:end;justify-content:flex-end;flex-wrap:wrap;margin-top:10px}.spv-bottom label{display:grid;gap:4px;font-size:10px;font-weight:800;color:#7b6983}.spv-bottom select{border:1px solid #dfd1e7;border-radius:12px;padding:9px;background:#fff}.spv-save{border:0;border-radius:13px;padding:10px 15px;background:linear-gradient(135deg,#dc8fc4,#ac91dc);color:#fff;font-weight:900;cursor:pointer}.spv-locknote{font-size:10px;color:#927e99;margin-top:8px}.spv-empty{color:#95859c;padding:10px 0}
`;document.head.appendChild(s)}
function effective(viewer){const s=settings.get(viewer.id);if(s)return new Set(s.allowed_member_ids||[]);return new Set(members.filter(t=>allowedByHardRule(viewer,t)).map(t=>t.id))}
function renderViewer(viewerId){
  const viewer=members.find(x=>x.id===viewerId),box=$('spvEditor');if(!viewer||!box)return
  const chosen=effective(viewer),setting=settings.get(viewer.id),max=setting?.max_people||Math.min(8,Math.max(2,members.length))
  box.innerHTML=`<div class="spv-options">${members.filter(x=>x.id!==viewer.id).map(t=>{const hard=allowedByHardRule(viewer,t);return `<label class="spv-choice ${hard?'':'locked'}"><input type="checkbox" data-spv-member="${t.id}" ${chosen.has(t.id)&&hard?'checked':''} ${hard?'':'disabled'}><span>${hard?'👤':'🔒'} ${t.display_name}</span></label>`}).join('')}</div><div class="spv-locknote">🔒 As proibições fixas ficam acima desta escolha. Uma caixa marcada nunca libera uma combinação bloqueada.</div><div class="spv-bottom"><label>Máximo de pessoas em grupos<select id="spvMax">${Array.from({length:Math.max(1,Math.min(11,members.length-1))},(_,i)=>i+2).map(n=>`<option value="${n}" ${Number(max)===n?'selected':''}>Até ${n} pessoas</option>`).join('')}</select></label><button id="spvSave" class="spv-save" type="button">Salvar para ${viewer.display_name}</button></div>`
  $('spvSave').onclick=()=>save(viewer)
}
async function save(viewer){
  const ids=[...document.querySelectorAll('#spvEditor [data-spv-member]:checked')].map(x=>x.dataset.spvMember),max=Number($('spvMax')?.value||8)
  const safeIds=ids.filter(id=>{const t=members.find(x=>x.id===id);return t&&allowedByHardRule(viewer,t)})
  const row={viewer_id:viewer.id,family_id:me.family_id,allowed_member_ids:safeIds,max_people:max,updated_by:me.id,updated_at:new Date().toISOString()}
  const {error}=await db.from('family_chat_visibility').upsert(row,{onConflict:'viewer_id'});if(error)return toast('Não foi possível salvar: '+error.message)
  settings.set(viewer.id,row);toast(`Conversas de ${viewer.display_name} atualizadas 💜`);document.dispatchEvent(new CustomEvent('isa:family-visibility-updated',{detail:{viewerId:viewer.id,allowedMemberIds:safeIds,maxPeople:max}}))
}
function render(){
  const panel=$('parentsPanel');if(!panel)return false
  style();let card=$('superPaisVisibilityCard')
  if(!card){card=document.createElement('section');card.id='superPaisVisibilityCard';card.className='spv-card';card.innerHTML=`<div class="spv-head"><div><h3>👑 Quem aparece no chat</h3><small>Escolha, perfil por perfil, quais familiares podem aparecer e o limite de participantes.</small></div></div><div id="spvPersonTabs" class="spv-person-tabs"></div><div id="spvEditor" class="spv-empty">Carregando familiares…</div>`;const anchor=$('permissionsTable')?.parentElement||panel;anchor.appendChild(card)}
  mounted=true;const tabs=$('spvPersonTabs');tabs.innerHTML=members.map((m,i)=>`<button type="button" class="spv-person ${i===0?'active':''}" data-spv-viewer="${m.id}">${m.display_name}</button>`).join('')
  tabs.onclick=e=>{const b=e.target.closest('[data-spv-viewer]');if(!b)return;tabs.querySelectorAll('.spv-person').forEach(x=>x.classList.toggle('active',x===b));renderViewer(b.dataset.spvViewer)}
  if(members[0])renderViewer(members[0].id);return true
}
async function start(force=false){try{if(force){me=null;mounted=false}if(await load())return render()}catch(e){console.warn('Super Pais:',e)}return false}
function retry(){clearTimeout(retryTimer);if(retries++>30)return;retryTimer=setTimeout(async()=>{if(!(await start()))retry()},220)}
start().then(ok=>{if(!ok)retry()});document.addEventListener('isa:parent-panel-opened',()=>start(true));document.addEventListener('click',e=>{if(e.target.closest?.('[data-tab="parents"],#parentsNav'))setTimeout(()=>start(true),100)},true)
window.__ISA_SUPER_PAIS_VISIBILITY__={start,renderViewer,allowedByHardRule}
