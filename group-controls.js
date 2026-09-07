import './v36-loader.js?v=36'
import './profile-mascot.js?v=1'
import { CONFIG } from './config.js'
const $=id=>document.getElementById(id)
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
let actorCache=null,lastConv=null
function token(){try{const ref=new URL(CONFIG.SUPABASE_URL).hostname.split('.')[0],raw=localStorage.getItem(`sb-${ref}-auth-token`);if(!raw)return null;const d=JSON.parse(raw);return d?.access_token||d?.currentSession?.access_token||d?.session?.access_token||null}catch{return null}}
function jwtSub(t){try{const p=t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(decodeURIComponent(escape(atob(p.padEnd(Math.ceil(p.length/4)*4,'='))))).sub}catch{return null}}
async function rest(path){const t=token();if(!t)throw new Error('Sem sessão');const r=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${path}`,{headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${t}`},cache:'no-store'});let d=null;try{d=await r.json()}catch{}if(!r.ok)throw new Error(d?.message||'Não foi possível carregar.');return d}
async function edge(body){const t=token();if(!t)throw new Error('Sem sessão');const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/chat-actions`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${t}`,'Content-Type':'application/json'},body:JSON.stringify(body)});let d=null;try{d=await r.json()}catch{}if(!r.ok||d?.error)throw new Error(d?.error||'Não foi possível concluir.');return d}
async function actor(){if(actorCache)return actorCache;const t=token(),sub=t&&jwtSub(t);if(!sub)throw new Error('Sem sessão');const d=await rest(`family_members?auth_user_id=eq.${encodeURIComponent(sub)}&active=eq.true&select=id,family_id,role,display_name&limit=1`);actorCache=d?.[0]||null;return actorCache}
function toast(s){const t=$('toast');if(!t)return;t.textContent=s;t.classList.remove('hidden');clearTimeout(t._grp);t._grp=setTimeout(()=>t.classList.add('hidden'),2100)}
function activeId(){return document.querySelector('.chat-item.active[data-conv]')?.dataset.conv||null}
async function syncButton(){
  const id=activeId(),header=document.querySelector('#chatPanel .chat-header');if(!header)return
  let b=$('groupManageBtn');if(!b){b=document.createElement('button');b.id='groupManageBtn';b.type='button';b.className='icon-btn hidden';b.title='Editar grupo';b.textContent='⚙️';header.appendChild(b);b.onclick=openManager}
  if(!id){b.classList.add('hidden');return}
  try{const a=await actor();if(!['child','super_admin'].includes(a?.role)){b.classList.add('hidden');return}const c=await rest(`conversations?id=eq.${encodeURIComponent(id)}&select=id,type,title&limit=1`);b.classList.toggle('hidden',c?.[0]?.type!=='group')}catch{b.classList.add('hidden')}
}
async function refreshDirectPresence(){
  const id=activeId(),sub=$('chatSubtitle');if(!id||!sub||$('chatPanel')?.classList.contains('hidden'))return
  try{
    const a=await actor(),c=(await rest(`conversations?id=eq.${encodeURIComponent(id)}&select=id,type&limit=1`))?.[0];if(!c||c.type!=='direct')return
    const cms=await rest(`conversation_members?conversation_id=eq.${encodeURIComponent(id)}&select=member_id`);const other=(cms||[]).map(x=>x.member_id).find(x=>x!==a.id);if(!other)return
    const ps=(await rest(`presence_state?member_id=eq.${encodeURIComponent(other)}&select=online,last_seen_at&limit=1`))?.[0];const fresh=ps?.last_seen_at&&(Date.now()-new Date(ps.last_seen_at).getTime()<45000);const online=!!ps?.online&&fresh
    if(online){sub.textContent='Online';sub.classList.add('is-online')}
    else{sub.classList.remove('is-online');if(ps?.last_seen_at){const d=new Date(ps.last_seen_at),same=d.toDateString()===new Date().toDateString();sub.textContent=same?`visto hoje às ${d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`:`visto em ${d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}`}else{sub.textContent='Offline'}}
  }catch{}
}
async function openManager(){
  const id=activeId();if(!id)return
  try{
    const a=await actor(),conv=(await rest(`conversations?id=eq.${encodeURIComponent(id)}&select=id,type,title&limit=1`))?.[0];if(!conv||conv.type!=='group')return
    const cms=await rest(`conversation_members?conversation_id=eq.${encodeURIComponent(id)}&select=member_id`),current=new Set((cms||[]).map(x=>x.member_id))
    const fam=await rest(`family_members?family_id=eq.${encodeURIComponent(a.family_id)}&active=eq.true&select=id,display_name,role,relationship_label&order=display_name.asc`)
    const dlg=$('simpleDialog'),content=$('dialogContent');if(!dlg||!content)return
    content.innerHTML=`<h3>Editar grupo 👥</h3><label>Nome do grupo</label><input id="editGroupName" maxlength="80" value="${esc(conv.title||'Grupo')}"><p class="muted">Escolha quem continua no grupo. A Isa permanece sempre.</p><div class="check-list">${(fam||[]).map(m=>`<label class="check-line"><input type="checkbox" data-edit-member="${m.id}" ${current.has(m.id)?'checked':''} ${m.role==='child'?'checked disabled':''}> ${esc(m.display_name)} • ${esc(m.relationship_label||'Família')}</label>`).join('')}</div><button id="saveGroupEditBtn" class="primary-btn" type="button">Salvar alterações</button><button id="deleteGroupBtn" class="text-btn" type="button" style="color:#a34e66">Excluir grupo</button><p id="editGroupMsg" class="status-text"></p>`
    dlg.showModal()
    $('saveGroupEditBtn').onclick=async()=>{const title=$('editGroupName').value.trim(),memberIds=[...document.querySelectorAll('[data-edit-member]:checked')].map(x=>x.dataset.editMember);try{$('saveGroupEditBtn').disabled=true;await edge({action:'update_group',conversationId:id,title,memberIds});dlg.close();toast('Grupo atualizado ✓');setTimeout(()=>location.reload(),450)}catch(e){$('editGroupMsg').textContent=e.message}finally{$('saveGroupEditBtn').disabled=false}}
    $('deleteGroupBtn').onclick=async()=>{if(!confirm('Excluir este grupo? As mensagens e materiais ligados a ele também serão removidos.'))return;try{$('deleteGroupBtn').disabled=true;await edge({action:'delete_group',conversationId:id});dlg.close();toast('Grupo excluído');setTimeout(()=>location.reload(),450)}catch(e){$('editGroupMsg').textContent=e.message}finally{$('deleteGroupBtn').disabled=false}}
  }catch(e){toast(e.message)}
}
setInterval(()=>{const id=activeId();if(id!==lastConv){lastConv=id;syncButton();refreshDirectPresence()}else if(document.visibilityState==='visible'){refreshDirectPresence()}},4000)
document.querySelector('[data-tab="chats"]')?.addEventListener('click',()=>setTimeout(()=>{syncButton();refreshDirectPresence()},120))
window.addEventListener('focus',refreshDirectPresence)
