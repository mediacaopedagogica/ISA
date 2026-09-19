import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js?v=20260911-family-visibility'
const db=createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}})
const $=id=>document.getElementById(id)
const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim()
const alias={'tia vania':'vania','vania':'vania','vânia':'vania','keise pamela':'keise','keise pâmela':'keise'}
const only={
  elion:new Set(['elion','isa','keise','alan','davi','paloma']),
  evalda:new Set(['evalda','isa','alan','keise','paloma','vania']),
  paloma:new Set(['paloma','keise','alan','davi','isa','evalda','vania']),
  silvane:new Set(['silvane','alan','keise','isa'])
}
const key=v=>{const n=norm(v);return alias[n]||n.split(' ')[0]||''}
function canSee(viewer,target){
  if(window.__ISA_FAMILY_VISIBILITY__?.allowed)return window.__ISA_FAMILY_VISIBILITY__.allowed(viewer,target)
  const v=key(viewer),t=key(target);if(!v||!t||v===t)return true
  if(v==='davi')return t!=='silvane'
  return only[v]?only[v].has(t):true
}
let allowed=null,timer=0,conversationTypes=new Map(),lastConvSignature='',lastLoadedAt=0,meCache=null
const LOAD_TTL=60000
async function identity(force=false){
  if(meCache&&!force)return meCache
  const {data:{user}}=await db.auth.getUser();if(!user)return null
  const {data:me}=await db.from('family_members').select('id,family_id,display_name').eq('auth_user_id',user.id).eq('active',true).maybeSingle()
  if(me)meCache=me
  return me||null
}
async function load(force=false){
  const cards=[...document.querySelectorAll('#chatList [data-conv]')]
  const convIds=[...new Set(cards.map(x=>String(x.dataset.conv||'')).filter(Boolean))]
  const signature=convIds.slice().sort().join('|')
  // Vazios transitórios durante um re-render nunca apagam a política já calculada.
  if(!convIds.length){apply();return}
  if(!force&&signature===lastConvSignature&&Date.now()-lastLoadedAt<LOAD_TTL){apply();return}

  const me=await identity();if(!me)return
  const [{data:s},{data:members},{data:cms,error},{data:convRows,error:convError}]=await Promise.all([
    db.from('family_chat_visibility').select('allowed_member_ids,max_people').eq('viewer_id',me.id).maybeSingle(),
    db.from('family_members').select('id,display_name').eq('family_id',me.family_id).eq('active',true),
    db.from('conversation_members').select('conversation_id,member_id').in('conversation_id',convIds),
    db.from('conversations').select('id,type').in('id',convIds)
  ])
  if(error||convError)return

  const names=new Map((members||[]).map(x=>[String(x.id),x.display_name||'']))
  const by=new Map();for(const x of cms||[]){const cid=String(x.conversation_id);if(!by.has(cid))by.set(cid,[]);by.get(cid).push(String(x.member_id))}
  // Mescla tipos já conhecidos. Assim um retorno parcial nunca transforma grupo em conversa direta.
  for(const x of convRows||[])conversationTypes.set(String(x.id),String(x.type||'direct'))
  const configured=s?new Set((s.allowed_member_ids||[]).map(String)):null
  const maxPeople=Number(s?.max_people||20)
  const ok=new Set()

  for(const [conv,people] of by){
    const type=conversationTypes.get(conv)||'direct'
    const others=people.filter(id=>id!==String(me.id))
    const hardAllowed=others.every(id=>{const name=names.get(id);return !name||canSee(me.display_name,name)})
    // Super Pais controla conversas DIRETAS. Grupo já criado, do qual a pessoa é membro,
    // permanece visível; continuam valendo apenas as restrições familiares fixas e o limite do grupo.
    const configuredAllowed=type==='group'?true:(!configured||others.every(id=>configured.has(id)))
    const sizeAllowed=type==='group'?people.length<=maxPeople:true
    if(sizeAllowed&&hardAllowed&&configuredAllowed)ok.add(conv)
  }
  // Se uma leitura vier parcial, preserva apenas cards já permitidos e ainda presentes no DOM.
  if(allowed)for(const id of convIds)if(!by.has(id)&&allowed.has(id))ok.add(id)
  allowed=ok;lastConvSignature=signature;lastLoadedAt=Date.now();apply()
}
function apply(){
  document.querySelectorAll('#chatList [data-conv]').forEach(card=>{
    const id=String(card.dataset.conv||'')
    const type=conversationTypes.get(id)||''
    if(type)card.dataset.chatVisibilityType=type
    const show=!allowed||allowed.has(id);card.classList.toggle('spv-hidden-chat',!show);card.setAttribute('aria-hidden',show?'false':'true')
  })
  window.__ISA_FAMILY_VISIBILITY__?.apply?.(document)
}
function schedule(force=false){clearTimeout(timer);timer=setTimeout(()=>load(force).catch(()=>{}),120)}
const style=document.createElement('style');style.textContent='.spv-hidden-chat{display:none!important}';document.head.appendChild(style)
const list=$('chatList');if(list)new MutationObserver(()=>schedule(false)).observe(list,{childList:true,subtree:true});
setTimeout(()=>schedule(true),400)
document.addEventListener('isa:chat-opened',()=>schedule(false))
document.addEventListener('isa:family-visibility-updated',()=>schedule(true))
document.addEventListener('isa:family-conversations-approved',()=>schedule(true))
document.addEventListener('isa:friend-portal-entered',()=>window.__ISA_FAMILY_VISIBILITY__?.apply?.(document))
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&Date.now()-lastLoadedAt>LOAD_TTL)schedule(true)})
window.__ISA_REFRESH_CHAT_VISIBILITY__=()=>schedule(true)
