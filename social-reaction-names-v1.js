import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js'

const db=createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}})
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const token=()=>new URLSearchParams(location.hash.replace(/^#/,'')).get('acesso')||''
let busy=false

function ensureStyle(){
  if(document.getElementById('socialReactionNamesStyle'))return
  const s=document.createElement('style');s.id='socialReactionNamesStyle';s.textContent=`
    .social-reaction-summary:not(:empty){cursor:pointer;display:inline-flex;align-items:center;gap:4px;min-height:28px;padding:4px 8px;border-radius:999px;transition:.16s ease;background:rgba(248,241,252,.72)}
    .social-reaction-summary:not(:empty):hover{background:#f0e5f7;transform:translateY(-1px)}
    .social-reaction-summary:not(:empty)::after{content:'• ver quem reagiu';font-size:10px;font-weight:850;color:#957ca1;margin-left:3px}
    #socialReactionNamesModal{position:fixed;inset:0;z-index:140000;display:none;place-items:center;padding:16px;background:rgba(47,34,54,.38);backdrop-filter:blur(7px)}
    #socialReactionNamesModal.show{display:grid}
    .srn-card{width:min(430px,94vw);max-height:min(620px,82dvh);overflow:auto;border:1px solid rgba(255,255,255,.95);border-radius:26px;padding:18px;background:linear-gradient(145deg,#fffafd,#f5eeff);box-shadow:0 22px 60px rgba(65,45,75,.22);color:#594c65}
    .srn-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:13px}.srn-head h3{margin:0;font-size:20px}.srn-close{border:0;width:36px;height:36px;border-radius:12px;background:#eee4f5;color:#65516e;font-size:18px;font-weight:900;cursor:pointer}
    .srn-row{display:grid;grid-template-columns:42px 1fr;gap:10px;align-items:start;padding:11px 12px;margin:8px 0;border-radius:18px;background:rgba(255,255,255,.84);box-shadow:0 5px 14px rgba(75,57,88,.06)}
    .srn-emoji{font-size:25px;text-align:center}.srn-names{font-size:13px;line-height:1.45}.srn-names strong{display:block;margin-bottom:2px;color:#6b5076}.srn-empty{padding:18px;text-align:center;color:#8f8095}
    @media(max-width:700px){.social-reaction-summary:not(:empty)::after{content:'• quem reagiu'}.srn-card{border-radius:22px;padding:15px}.srn-row{grid-template-columns:38px 1fr}}
  `;document.head.appendChild(s)
}
function ensureModal(){
  if(document.getElementById('socialReactionNamesModal'))return
  const m=document.createElement('div');m.id='socialReactionNamesModal';m.innerHTML=`<div class="srn-card" role="dialog" aria-modal="true" aria-labelledby="srnTitle"><div class="srn-head"><h3 id="srnTitle">Quem reagiu 💕</h3><button id="srnClose" class="srn-close" type="button" aria-label="Fechar">×</button></div><div id="srnBody"></div></div>`;document.body.appendChild(m)
  document.getElementById('srnClose').onclick=closeModal
  m.addEventListener('click',e=>{if(e.target===m)closeModal()})
}
function closeModal(){document.getElementById('socialReactionNamesModal')?.classList.remove('show')}
function showRows(groups){
  ensureModal();const body=document.getElementById('srnBody');if(!body)return
  body.innerHTML=groups.length?groups.map(g=>`<div class="srn-row"><div class="srn-emoji">${esc(g.emoji)}</div><div class="srn-names"><strong>${g.names.length} ${g.names.length===1?'pessoa':'pessoas'}</strong>${esc(g.names.join(', '))}</div></div>`).join(''):'<div class="srn-empty">Ainda não há reações nesta publicação.</div>'
  document.getElementById('socialReactionNamesModal')?.classList.add('show')
}
function groupRows(reactions,nameFor){
  const map=new Map()
  for(const r of reactions||[]){const emoji=r.reaction||'💜',id=r.member_id||r.memberId,name=nameFor(id)||'Familiar';if(!map.has(emoji))map.set(emoji,[]);map.get(emoji).push(name)}
  return [...map.entries()].map(([emoji,names])=>({emoji,names:[...new Set(names)]}))
}
async function internalRows(postId){
  const {data:{user}}=await db.auth.getUser();if(!user)throw new Error('Sessão não encontrada.')
  const {data:rx,error}=await db.from('social_post_reactions').select('member_id,reaction').eq('post_id',postId);if(error)throw error
  const ids=[...new Set((rx||[]).map(r=>r.member_id).filter(Boolean))];if(!ids.length)return[]
  const {data:members,error:me}=await db.from('family_members').select('id,display_name').in('id',ids);if(me)throw me
  const names=new Map((members||[]).map(m=>[m.id,m.display_name||'Familiar']))
  return groupRows(rx,id=>names.get(id))
}
async function externalRows(postId){
  const access=token();if(!access)throw new Error('Acesso familiar não encontrado.')
  const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/friend-social`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${CONFIG.SUPABASE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({token:access,action:'bootstrap'}),cache:'no-store'})
  const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data?.error||'Não foi possível carregar as reações.')
  const post=(data.posts||[]).find(p=>String(p.id)===String(postId));if(!post)return[]
  const names=new Map((data.profiles||[]).map(p=>[p.memberId,p.name||'Familiar']));if(data.me?.id)names.set(data.me.id,data.me.name||'Familiar')
  return groupRows(post.reactions||[],id=>names.get(id))
}
function toast(text){const t=document.getElementById('friendToast')||document.getElementById('toast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._srn);t._srn=setTimeout(()=>t.classList.add('hidden'),2500)}
async function openFrom(summary){
  if(busy||!summary?.textContent?.trim())return;busy=true
  try{
    const post=summary.closest('[data-post],[data-fs-post]');if(!post)return
    const external=post.hasAttribute('data-fs-post'),id=external?post.dataset.fsPost:post.dataset.post
    ensureModal();const body=document.getElementById('srnBody');if(body)body.innerHTML='<div class="srn-empty">Carregando quem reagiu…</div>';document.getElementById('socialReactionNamesModal')?.classList.add('show')
    const rows=external?await externalRows(id):await internalRows(id);showRows(rows)
  }catch(e){closeModal();toast(e?.message||'Não foi possível mostrar quem reagiu.')}
  finally{busy=false}
}
function enhanceSummaries(){document.querySelectorAll('.social-reaction-summary').forEach(el=>{if(el.dataset.srnReady)return;el.dataset.srnReady='1';el.tabIndex=el.textContent.trim()?0:-1;el.setAttribute('role',el.textContent.trim()?'button':'status');if(el.textContent.trim())el.setAttribute('aria-label','Ver quem reagiu a esta publicação')})}
function attachFeedObserver(feed){if(!feed||feed.dataset.srnObserved)return;feed.dataset.srnObserved='1';new MutationObserver(()=>enhanceSummaries()).observe(feed,{childList:true,subtree:true});enhanceSummaries()}
function boot(){ensureStyle();ensureModal();enhanceSummaries();attachFeedObserver(document.getElementById('socialFeed'));attachFeedObserver(document.getElementById('fsFeed'))}
document.addEventListener('click',e=>{const s=e.target.closest?.('.social-reaction-summary');if(s)openFrom(s)})
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target?.matches?.('.social-reaction-summary')){e.preventDefault();openFrom(e.target)}})
boot();let tries=0;const timer=setInterval(()=>{boot();if(++tries>24||((document.getElementById('socialFeed')?.dataset.srnObserved==='1')||(document.getElementById('fsFeed')?.dataset.srnObserved==='1')))clearInterval(timer)},500)
window.__ISA_ENHANCE_REACTION_NAMES__=boot
