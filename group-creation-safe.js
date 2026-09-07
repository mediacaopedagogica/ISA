import { CONFIG } from './config.js'
const $=id=>document.getElementById(id)
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
function token(){try{const ref=new URL(CONFIG.SUPABASE_URL).hostname.split('.')[0],raw=localStorage.getItem(`sb-${ref}-auth-token`);if(!raw)return'';const d=JSON.parse(raw);return d?.access_token||d?.currentSession?.access_token||d?.session?.access_token||''}catch{return''}}
function jwtSub(t){try{const p=t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(atob(p.padEnd(Math.ceil(p.length/4)*4,'='))).sub||''}catch{return''}}
async function rest(path){const t=token();if(!t)throw new Error('Sem sessão');const r=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${path}`,{headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${t}`},cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error(d?.message||'Não foi possível carregar.');return d}
async function edge(body){const t=token();const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/chat-actions`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${t}`,'Content-Type':'application/json'},body:JSON.stringify(body)});let d={};try{d=await r.json()}catch{}if(!r.ok||d?.error)throw new Error(d?.error||'Não foi possível criar o grupo.');return d}
async function me(){const t=token(),sub=jwtSub(t);if(!sub)return null;return (await rest(`family_members?select=id,family_id,role&auth_user_id=eq.${encodeURIComponent(sub)}&active=eq.true&limit=1`))?.[0]||null}
async function openSafeGroup(){
  const actor=await me();if(actor?.role!=='child')return
  const friends=await rest(`family_members?family_id=eq.${actor.family_id}&active=eq.true&relationship_label=ilike.*Amiga*&select=id,display_name,relationship_label&order=display_name.asc`)
  const dlg=$('simpleDialog'),content=$('dialogContent');if(!dlg||!content)return
  content.innerHTML=`<h3>Novo grupo de estudos 👥</h3><p class="muted">A Isa participa automaticamente. Escolha somente as amigas que farão parte deste grupo.</p><label>Nome do grupo</label><input id="safeGroupName" maxlength="80" placeholder="Ex.: Trabalho de Ciências"><div class="check-list">${friends.length?friends.map(f=>`<label class="check-line"><input type="checkbox" data-safe-friend="${f.id}"> ${esc(f.display_name)}</label>`).join(''):'<p class="muted">Nenhuma amiga está ativa no momento.</p>'}</div><button id="safeCreateGroup" class="primary-btn" type="button" ${friends.length?'':'disabled'}>Criar grupo</button><p id="safeGroupMsg" class="status-text"></p>`
  dlg.showModal()
  $('safeCreateGroup')?.addEventListener('click',async()=>{const title=$('safeGroupName').value.trim(),ids=[...document.querySelectorAll('[data-safe-friend]:checked')].map(x=>x.dataset.safeFriend);if(title.length<2){$('safeGroupMsg').textContent='Dê um nome ao grupo.';return}if(!ids.length){$('safeGroupMsg').textContent='Escolha pelo menos uma amiga.';return}const b=$('safeCreateGroup');b.disabled=true;try{await edge({action:'create_group',title,memberIds:ids});dlg.close();location.reload()}catch(e){$('safeGroupMsg').textContent=e.message;b.disabled=false}})
}
function start(){const b=$('newGroupBtn');if(!b||b.dataset.safeGroup)return;b.dataset.safeGroup='1';b.addEventListener('click',e=>{if(String($('myName')?.textContent||'').trim().toLowerCase()!=='isa')return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openSafeGroup().catch(err=>console.error(err))},true)}
start();setTimeout(start,300)
