// Reações robustas: dois cliques no notebook ou dois toques no celular abrem emojis ao lado da mensagem/imagem.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js'

if(!window.__ISA_REACTION_DELEGATE_V4__){
  window.__ISA_REACTION_DELEGATE_V4__=true
  const db=createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}})
  const $=id=>document.getElementById(id)
  const EMOJIS=['🩷','🩵','💜','❤️','😂','😍','🌸','🥰','✨','😢','🙏','😡','🤩','😭','🤔','🥳','😱','👏','👍']
  const friendToken=window.__ISA_FRIEND_TOKEN__||new URLSearchParams(location.hash.replace(/^#/, '')).get('acesso')||''
  const lastTouch=new WeakMap()
  let meId='',busy=false,retryTimer=0

  function toast(text){const t=$('friendToast')||$('toast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._doubleReact);t._doubleReact=setTimeout(()=>t.classList.add('hidden'),2200)}
  function rowFrom(target){return target?.closest?.('#messages .message-row[id^="msg-"],#friendMessages .friend-msg')||null}
  function bubbleFrom(row){return row?.querySelector?.('.bubble,.friend-bubble')||null}
  function messageId(row){return row?.dataset?.messageId||String(row?.id||'').replace(/^msg-/,'')||''}
  function external(row){return !!row?.closest?.('#friendMessages')}
  function interactive(target){return !!target?.closest?.('button,a,input,textarea,select,video,audio,[contenteditable="true"]')}

  function ensureCss(){
    if($('isaDoubleReactionCss'))return
    const s=document.createElement('style');s.id='isaDoubleReactionCss';s.textContent=`
      #isaDoubleReactionPicker{position:fixed;z-index:2147483640;display:none;align-items:center;gap:6px;padding:8px 9px;border-radius:18px;background:rgba(255,255,255,.97);border:1px solid rgba(255,255,255,.98);box-shadow:0 14px 34px rgba(71,48,86,.23);backdrop-filter:blur(15px);-webkit-backdrop-filter:blur(15px);max-width:min(620px,94vw);flex-wrap:wrap}
      #isaDoubleReactionPicker.show{display:flex}
      #isaDoubleReactionPicker button{width:38px;height:38px;flex:0 0 38px;border:1px solid rgba(255,255,255,.98);border-radius:50%;display:grid;place-items:center;cursor:pointer;font-size:22px;line-height:1;background:linear-gradient(145deg,#fff,#fff8fc 58%,#f1e8f8);box-shadow:0 5px 10px rgba(83,57,99,.13),inset 0 2px 2px rgba(255,255,255,.98);transition:transform .12s ease}
      #isaDoubleReactionPicker button:hover{transform:translateY(-2px) scale(1.07)}
      #messages [data-double-react="1"],#friendMessages [data-double-react="1"]{cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
      @media(max-width:760px){#isaDoubleReactionPicker{max-width:94vw;max-height:150px;overflow:auto;gap:4px;padding:7px}#isaDoubleReactionPicker button{width:35px;height:35px;flex-basis:35px;font-size:20px}}
    `;document.head.appendChild(s)
  }

  function ensurePicker(){
    ensureCss();let p=$('isaDoubleReactionPicker');if(p)return p
    p=document.createElement('div');p.id='isaDoubleReactionPicker';p.setAttribute('role','menu');p.innerHTML=EMOJIS.map(e=>`<button type="button" data-double-reaction="${e}" aria-label="Reagir com ${e}">${e}</button>`).join('');document.body.appendChild(p)
    p.addEventListener('click',async e=>{const b=e.target.closest('[data-double-reaction]');if(!b||busy)return;e.preventDefault();e.stopPropagation();const id=p.dataset.messageId,ext=p.dataset.external==='1';if(!id)return;await react(id,b.dataset.doubleReaction,ext);hidePicker()})
    document.addEventListener('pointerdown',e=>{if(p.classList.contains('show')&&!p.contains(e.target)&&!e.target.closest?.('[data-double-react="1"]'))hidePicker()},{capture:true,passive:true})
    return p
  }
  function hidePicker(){const p=$('isaDoubleReactionPicker');if(p)p.classList.remove('show')}
  function positionPicker(p,anchor){const r=anchor.getBoundingClientRect();p.classList.add('show');const w=Math.min(p.offsetWidth||520,innerWidth-12),h=p.offsetHeight||100;let left=r.right+7,top=r.top+r.height/2-h/2;if(left+w>innerWidth-6)left=Math.max(6,r.left-w-7);if(left<6)left=Math.max(6,Math.min(innerWidth-w-6,r.left+r.width/2-w/2));top=Math.max(6,Math.min(innerHeight-h-6,top));p.style.left=`${left}px`;p.style.top=`${top}px`}

  async function hydrateExternalIds(){
    const box=$('friendMessages'),conv=window.__ISA_FRIEND_GET_ACTIVE_CONVERSATION_ID__?.();if(!box||!conv||!friendToken)return[]
    const rows=[...box.querySelectorAll('.friend-msg')];if(!rows.length||rows.every(messageId))return rows
    try{
      const r=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/friend_portal_messages`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({p_token:friendToken,p_conversation_id:conv}),cache:'no-store'}),list=await r.json().catch(()=>[])
      if(r.ok)rows.forEach((row,i)=>{if(list?.[i]?.id)row.dataset.messageId=list[i].id})
    }catch{}
    return rows
  }
  async function getMainMe(){if(meId)return meId;const {data:{user}}=await db.auth.getUser();if(!user)return'';const {data}=await db.from('family_members').select('id').eq('auth_user_id',user.id).eq('active',true).maybeSingle();meId=data?.id||'';return meId}
  async function react(id,reaction,ext){
    if(busy)return;busy=true
    try{
      if(ext){
        const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/message-extras`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({token:friendToken,action:'react',messageId:id,reaction}),cache:'no-store'}),d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error||'Não foi possível reagir.')
      }else{
        const mine=await getMainMe();if(!mine)throw new Error('Perfil não identificado.')
        const {data:old}=await db.from('message_reactions').select('reaction').eq('message_id',id).eq('member_id',mine).maybeSingle()
        if(old?.reaction===reaction){const {error}=await db.from('message_reactions').delete().eq('message_id',id).eq('member_id',mine);if(error)throw error}
        else{const {error}=await db.from('message_reactions').upsert({message_id:id,member_id:mine,reaction,updated_at:new Date().toISOString()},{onConflict:'message_id,member_id'});if(error)throw error}
      }
      window.__ISA_REFRESH_MESSAGE_INTERACTIONS__?.();toast('Reação atualizada 💜')
    }catch(e){toast(e?.message||'Não foi possível reagir.')}finally{busy=false}
  }

  async function openPicker(row,attempt=0){
    if(!row)return false
    if(external(row)&&!messageId(row))await hydrateExternalIds()
    const id=messageId(row),anchor=bubbleFrom(row),p=ensurePicker();
    if(id&&anchor){p.dataset.messageId=id;p.dataset.external=external(row)?'1':'0';$('miReactionPicker')?.classList.remove('show');$('miMessageMenu')?.classList.remove('show');positionPicker(p,anchor);setTimeout(()=>$('miMessageMenu')?.classList.remove('show'),330);return true}
    window.__ISA_REFRESH_MESSAGE_INTERACTIONS__?.();if(attempt<4){clearTimeout(retryTimer);retryTimer=setTimeout(()=>openPicker(row,attempt+1),90+attempt*70)}return false
  }

  function onDoubleClick(e){const row=rowFrom(e.target);if(!row||interactive(e.target))return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openPicker(row)}
  function onPointerUp(e){if(e.pointerType!=='touch')return;const row=rowFrom(e.target);if(!row||interactive(e.target))return;const now=Date.now(),prev=lastTouch.get(row)||0;lastTouch.set(row,now);if(now-prev<=390){lastTouch.set(row,0);e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openPicker(row)}}

  document.addEventListener('dblclick',onDoubleClick,true)
  document.addEventListener('pointerup',onPointerUp,true)

  function mark(){document.querySelectorAll('#messages .message-row[id^="msg-"],#friendMessages .friend-msg').forEach(row=>{const b=bubbleFrom(row);if(b){b.style.position='relative';b.dataset.doubleReact='1';b.title='Dois cliques/toques para reagir'}})}
  const obs=new MutationObserver(()=>{clearTimeout(obs._t);obs._t=setTimeout(mark,70)});obs.observe(document.documentElement,{childList:true,subtree:true})
  ensurePicker();mark();[350,900,1900].forEach(ms=>setTimeout(mark,ms))
  window.__ISA_REACTION_DELEGATE_REFRESH__=()=>{mark();if($('friendMessages'))hydrateExternalIds()}
}
