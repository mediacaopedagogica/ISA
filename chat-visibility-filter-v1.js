import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js?v=20260910-chat-visibility'
const db=createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}})
const $=id=>document.getElementById(id)
let allowed=null,timer=0
async function load(){
  const {data:{user}}=await db.auth.getUser();if(!user)return
  const {data:me}=await db.from('family_members').select('id,family_id').eq('auth_user_id',user.id).eq('active',true).maybeSingle();if(!me)return
  const {data:s}=await db.from('family_chat_visibility').select('allowed_member_ids,max_people').eq('viewer_id',me.id).maybeSingle();if(!s){allowed=null;apply();return}
  const {data:cms,error}=await db.from('conversation_members').select('conversation_id,member_id').in('conversation_id',[...document.querySelectorAll('#chatList [data-conv]')].map(x=>x.dataset.conv).filter(Boolean));if(error)return
  const by=new Map();for(const x of cms||[]){if(!by.has(x.conversation_id))by.set(x.conversation_id,[]);by.get(x.conversation_id).push(x.member_id)}
  const ids=new Set(s.allowed_member_ids||[]),ok=new Set();for(const [conv,people] of by){const others=people.filter(id=>id!==me.id);if(people.length<=Number(s.max_people||20)&&others.every(id=>ids.has(id)))ok.add(conv)}allowed=ok;apply()
}
function apply(){document.querySelectorAll('#chatList [data-conv]').forEach(card=>{const show=!allowed||allowed.has(card.dataset.conv);card.classList.toggle('spv-hidden-chat',!show);card.setAttribute('aria-hidden',show?'false':'true')})}
function schedule(){clearTimeout(timer);timer=setTimeout(()=>load().catch(()=>{}),120)}
const style=document.createElement('style');style.textContent='.spv-hidden-chat{display:none!important}';document.head.appendChild(style)
const list=$('chatList');if(list)new MutationObserver(schedule).observe(list,{childList:true,subtree:true});
setTimeout(schedule,400);document.addEventListener('isa:chat-opened',schedule)
window.__ISA_REFRESH_CHAT_VISIBILITY__=schedule
