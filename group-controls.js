import { CONFIG } from './config.js'
const $=id=>document.getElementById(id)
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
let actorCache=null,syncTimer=null
function token(){try{const ref=new URL(CONFIG.SUPABASE_URL).hostname.split('.')[0],raw=localStorage.getItem(`sb-${ref}-auth-token`);if(!raw)return null;const d=JSON.parse(raw);return d?.access_token||d?.currentSession?.access_token||d?.session?.access_token||null}catch{return null}}
function jwtSub(t){try{const p=t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(decodeURIComponent(escape(atob(p.padEnd(Math.ceil(p.length/4)*4,'='))))).sub}catch{return null}}
async function rest(path){const t=token();if(!t)throw new Error('Sem sessão');const r=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${path}`,{headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${t}`},cache:'no-store'});let d=null;try{d=await r.json()}catch{}if(!r.ok)throw new Error(d?.message||'Não foi possível carregar.');return d}
async function edge(body){const t=token();if(!t)throw new Error('Sem sessão');const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/chat-actions`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${t}`,'Content-Type':'application/json'},body:JSON.stringify(body)});let d=null;try{d=await r.json()}catch{}if(!r.ok||d?.error)throw new Error(d?.error||'Não foi possível concluir.');return d}
async function actor(){if(actorCache)return actorCache;const t=token(),sub=t&&jwtSub(t);if(!sub)throw new Error('Sem sessão');const d=await rest(`family_members?auth_user_id=eq.${encodeURIComponent(sub)}&active=eq.true&select=id,family_id,role,display_name&limit=1`);actorCache=d?.[0]||null;return actorCache}
function toast(s){const t=$('toast');if(!t)return;t.textContent=s;t.classList.remove('hidden');clearTimeout(t._grp);t._grp=setTimeout(()=>t.classList.add('hidden'),2100)}
function activeId(){return document.querySelector('.chat-item.active[data-conv]')?.dataset.conv||null}
function scheduleSync(delay=120){clearTimeout(syncTimer);syncTimer=setTimeout(syncButton,delay)}
async function syncButton(){
  const id=activeId(),header=document.querySelector('#chatPanel .chat-header');if(!header)return
  let b=$('groupManageBtn');if(!b){b=document.createElement('button');b.id='groupManageBtn';b.type='button';b.className='icon-btn hidden';b.title='Editar grupo';b.textContent='⚙️';header.appendChild(b);b.onclick=openManager}
  if(!id){b.classList.add('hidden');return}
  try{const a=await actor();if(!['child','super_admin'].includes(a?.role)){b.classList.add('hidden');return}const c=await rest(`conversations?id=eq.${encodeURIComponent(id)}&select=id,type,title&limit=1`);b.classList.toggle('hidden',c?.[0]?.type!=='group')}catch{b.classList.add('hidden')}
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
const chatList=$('chatList');if(chatList&&!chatList.dataset.groupControlsBound){chatList.dataset.groupControlsBound='1';chatList.addEventListener('click',e=>{if(e.target.closest('.chat-item[data-conv]'))scheduleSync()})}
document.querySelector('[data-tab="chats"]')?.addEventListener('click',()=>scheduleSync())
const panel=$('chatPanel');if(panel){const obs=new MutationObserver(()=>{if(!panel.classList.contains('hidden'))scheduleSync(80)});obs.observe(panel,{attributes:true,attributeFilter:['class']})}
window.addEventListener('focus',()=>scheduleSync(50))
scheduleSync(200)
