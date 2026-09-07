import { CONFIG } from './config.js'
const $=id=>document.getElementById(id)
let hiddenIds=new Set(),applyTimer=null
function token(){try{const ref=new URL(CONFIG.SUPABASE_URL).hostname.split('.')[0],raw=localStorage.getItem(`sb-${ref}-auth-token`);if(!raw)return'';const d=JSON.parse(raw);return d?.access_token||d?.currentSession?.access_token||d?.session?.access_token||''}catch{return''}}
async function rpc(){const t=token();if(!t)return[];const r=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/paused_external_direct_conversations`,{method:'POST',cache:'no-store',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${t}`,'Content-Type':'application/json'},body:'{}'});if(!r.ok)return[];return await r.json()}
function apply(){const list=$('chatList');if(!list)return;list.querySelectorAll('[data-conv]').forEach(el=>{const hide=hiddenIds.has(el.dataset.conv);el.classList.toggle('paused-friend-hidden',hide);el.setAttribute('aria-hidden',hide?'true':'false')})}
function schedule(){clearTimeout(applyTimer);applyTimer=setTimeout(apply,80)}
async function refresh(){hiddenIds=new Set((await rpc())||[]);apply()}
function start(){const list=$('chatList');if(!list)return;const style=document.createElement('style');style.textContent='.paused-friend-hidden{display:none!important}';document.head.appendChild(style);const obs=new MutationObserver(schedule);obs.observe(list,{childList:true,subtree:true});window.addEventListener('isa:external-access-changed',refresh);refresh()}
start()
