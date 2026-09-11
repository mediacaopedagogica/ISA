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
let allowed=null,timer=0
async function load(){
  const {data:{user}}=await db.auth.getUser();if(!user)return
  const {data:me}=await db.from('family_members').select('id,family_id,display_name').eq('auth_user_id',user.id).eq('active',true).maybeSingle();if(!me)return
  const cards=[...document.querySelectorAll('#chatList [data-conv]')]
  const convIds=[...new Set(cards.map(x=>x.dataset.conv).filter(Boolean))]
  if(!convIds.length){allowed=null;apply();return}

  const [{data:s},{data:members},{data:cms,error}]=await Promise.all([
    db.from('family_chat_visibility').select('allowed_member_ids,max_people').eq('viewer_id',me.id).maybeSingle(),
    db.from('family_members').select('id,display_name').eq('family_id',me.family_id).eq('active',true),
    db.from('conversation_members').select('conversation_id,member_id').in('conversation_id',convIds)
  ])
  if(error)return

  const names=new Map((members||[]).map(x=>[String(x.id),x.display_name||'']))
  const by=new Map();for(const x of cms||[]){const cid=String(x.conversation_id);if(!by.has(cid))by.set(cid,[]);by.get(cid).push(String(x.member_id))}
  const configured=s?new Set((s.allowed_member_ids||[]).map(String)):null
  const maxPeople=Number(s?.max_people||20)
  const ok=new Set()

  for(const [conv,people] of by){
    const others=people.filter(id=>id!==String(me.id))
    const hardAllowed=others.every(id=>{const name=names.get(id);return !name||canSee(me.display_name,name)})
    const configuredAllowed=!configured||others.every(id=>configured.has(id))
    if(people.length<=maxPeople&&hardAllowed&&configuredAllowed)ok.add(conv)
  }
  allowed=ok;apply()
}
function apply(){
  document.querySelectorAll('#chatList [data-conv]').forEach(card=>{
    const show=!allowed||allowed.has(String(card.dataset.conv));card.classList.toggle('spv-hidden-chat',!show);card.setAttribute('aria-hidden',show?'false':'true')
  })
  window.__ISA_FAMILY_VISIBILITY__?.apply?.(document)
}
function schedule(){clearTimeout(timer);timer=setTimeout(()=>load().catch(()=>{}),120)}
const style=document.createElement('style');style.textContent='.spv-hidden-chat{display:none!important}';document.head.appendChild(style)
const list=$('chatList');if(list)new MutationObserver(schedule).observe(list,{childList:true,subtree:true});
setTimeout(schedule,400);document.addEventListener('isa:chat-opened',schedule);document.addEventListener('isa:friend-portal-entered',()=>window.__ISA_FAMILY_VISIBILITY__?.apply?.(document))
window.__ISA_REFRESH_CHAT_VISIBILITY__=schedule
