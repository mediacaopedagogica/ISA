// Mensagens: 1 toque/clique = copiar/baixar; 2 toques/cliques = reagir.
// Reação só é permitida nas mensagens recebidas. Mensagem própria mantém editar/cancelar do núcleo.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js'

const db=createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}})
const $=id=>document.getElementById(id)
const REACTIONS=['❤️','💜','🥰','😂','😮','👏','👍']
const friendToken=window.__ISA_FRIEND_TOKEN__||new URLSearchParams(location.hash.replace(/^#/, '')).get('acesso')||''
let meId='',busy=false,mainTimer=0,friendTimer=0

function ensureCss(){if($('messageInteractionsCss'))return;const l=document.createElement('link');l.id='messageInteractionsCss';l.rel='stylesheet';l.href='./message-interactions-v1.css?v=3-click-behavior';document.head.appendChild(l)}
function toast(text){const t=$('friendToast')||$('toast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._mi);t._mi=setTimeout(()=>t.classList.add('hidden'),2500)}
function messageId(row){return row?.dataset?.messageId||row?.id?.replace(/^msg-/,'')||''}
function bubble(row){return row?.querySelector('.bubble,.friend-bubble')}
function imageEl(row){return row?.querySelector('.bubble img,.friend-bubble img,.friend-photo')}
function isMine(row){return !!row?.classList?.contains('mine')}
function textOnly(row){const b=bubble(row);if(!b)return'';const c=b.cloneNode(true);c.querySelectorAll('.sender,.friend-sender,.meta,.friend-meta,.friend-read,.message-receipt,.mi-tools,.mi-reaction-summary,.edit-mark,.mi-important-flag').forEach(x=>x.remove());const raw=(c.textContent||'').trim();return typeof window.__ISA_STRIP_MESSAGE_FORMATTING__==='function'?window.__ISA_STRIP_MESSAGE_FORMATTING__(raw):raw}
function extFromBlob(blob){const t=blob?.type||'';if(t.includes('png'))return'png';if(t.includes('webp'))return'webp';if(t.includes('gif'))return'gif';if(t.includes('jpeg')||t.includes('jpg'))return'jpg';return'bin'}
async function copyText(text){if(!text)return toast('Não há texto para copiar.');try{await navigator.clipboard.writeText(text);toast('Mensagem copiada 📋')}catch{const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();toast('Mensagem copiada 📋')}}
function downloadText(row){const text=textOnly(row);if(!text)return toast('Não há texto para baixar.');const blob=new Blob([text],{type:'text/plain;charset=utf-8'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=`isa-chat-mensagem-${messageId(row).slice(0,8)||Date.now()}.txt`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2500);toast('Mensagem pronta para baixar ⬇️')}
async function imageBlob(row){const img=imageEl(row);if(!img?.src)throw new Error('A imagem ainda está carregando.');const r=await fetch(img.src,{cache:'no-store'});if(!r.ok)throw new Error('Não foi possível acessar a imagem.');return await r.blob()}
async function downloadImage(row){try{const blob=await imageBlob(row),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=`isa-chat-${messageId(row).slice(0,8)||Date.now()}.${extFromBlob(blob)}`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),3000);toast('Imagem pronta para baixar ⬇️')}catch(e){toast(e.message||'Não foi possível baixar a imagem.')}}
async function copyImage(row){try{const blob=await imageBlob(row);if(navigator.clipboard?.write&&window.ClipboardItem){let out=blob;if(blob.type!=='image/png'){const bmp=await createImageBitmap(blob),c=document.createElement('canvas');c.width=bmp.width;c.height=bmp.height;c.getContext('2d').drawImage(bmp,0,0);out=await new Promise(r=>c.toBlob(r,'image/png'))}await navigator.clipboard.write([new ClipboardItem({'image/png':out})]);toast('Imagem copiada 📋');return}const img=imageEl(row);await navigator.clipboard.writeText(img?.src||'');toast('Link da imagem copiado 📋')}catch{const img=imageEl(row);if(img?.src){try{await navigator.clipboard.writeText(img.src);toast('Link da imagem copiado 📋');return}catch{}}toast('Este navegador não permitiu copiar a imagem.')}}

function ensurePicker(){if($('miReactionPicker'))return;const p=document.createElement('div');p.id='miReactionPicker';p.className='mi-picker';p.innerHTML=REACTIONS.map(e=>`<button type="button" data-mi-react="${e}">${e}</button>`).join('');document.body.appendChild(p);p.querySelectorAll('[data-mi-react]').forEach(b=>b.onclick=async e=>{e.stopPropagation();const id=p.dataset.messageId;if(id)await react(id,b.dataset.miReact,p.dataset.external==='1');hidePicker()});document.addEventListener('click',e=>{if(!e.target.closest('#miReactionPicker'))hidePicker()})}
function showPicker(anchor,id,external,row){if(isMine(row))return;ensurePicker();const p=$('miReactionPicker'),r=anchor.getBoundingClientRect();p.dataset.messageId=id;p.dataset.external=external?'1':'0';p.classList.add('show');const w=Math.min(p.offsetWidth||280,innerWidth-12);const left=Math.max(6,Math.min(innerWidth-w-6,r.left+r.width/2-w/2));let top=r.top-(p.offsetHeight||48)-7;if(top<6)top=r.bottom+7;p.style.left=`${left}px`;p.style.top=`${top}px`}
function hidePicker(){$('miReactionPicker')?.classList.remove('show')}
function ensureMenu(){if($('miMessageMenu'))return;const m=document.createElement('div');m.id='miMessageMenu';m.className='mi-menu';document.body.appendChild(m);document.addEventListener('click',e=>{if(!e.target.closest('#miMessageMenu'))hideMenu()})}
function hideMenu(){$('miMessageMenu')?.classList.remove('show')}
function showReceivedMenu(anchor,row){
  if(isMine(row))return
  ensureMenu();const m=$('miMessageMenu'),hasImage=!!imageEl(row),hasText=!!textOnly(row)
  if(hasImage)m.innerHTML='<button type="button" data-do="copy">📋 Copiar imagem</button><button type="button" data-do="download">⬇️ Baixar imagem</button>'
  else if(hasText)m.innerHTML='<button type="button" data-do="copy">📋 Copiar mensagem</button><button type="button" data-do="download">⬇️ Baixar mensagem</button>'
  else return
  m.querySelector('[data-do="copy"]').onclick=()=>{hasImage?copyImage(row):copyText(textOnly(row));hideMenu()}
  m.querySelector('[data-do="download"]').onclick=()=>{hasImage?downloadImage(row):downloadText(row);hideMenu()}
  m.classList.add('show');const r=anchor.getBoundingClientRect(),w=m.offsetWidth||230,h=m.offsetHeight||100
  m.style.left=`${Math.max(6,Math.min(innerWidth-w-6,r.left+r.width/2-w/2))}px`;let top=r.bottom+6;if(top+h>innerHeight-6)top=Math.max(6,r.top-h-6);m.style.top=`${top}px`
}

async function getMainMe(){if(meId)return meId;const {data:{user}}=await db.auth.getUser();if(!user)return'';const {data}=await db.from('family_members').select('id').eq('auth_user_id',user.id).eq('active',true).maybeSingle();meId=data?.id||'';return meId}
async function friendApi(action,payload={}){const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/message-extras`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${CONFIG.SUPABASE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({token:friendToken,action,...payload}),cache:'no-store'});let d={};try{d=await r.json()}catch{}if(!r.ok)throw new Error(d?.error||'Não foi possível atualizar a reação.');return d}
async function listReactions(ids,external){if(!ids.length)return{items:[],mine:await getMainMe()};if(external){const d=await friendApi('list_reactions',{messageIds:ids});return{items:d.items||[],mine:d.meId||''}}const mine=await getMainMe();const {data,error}=await db.from('message_reactions').select('message_id,member_id,reaction').in('message_id',ids);if(error)throw error;return{items:data||[],mine}}
async function react(id,reaction,external){if(busy)return;busy=true;try{if(external)await friendApi('react',{messageId:id,reaction});else{const mine=await getMainMe();if(!mine)throw new Error('Perfil não identificado.');const {data:old}=await db.from('message_reactions').select('reaction').eq('message_id',id).eq('member_id',mine).maybeSingle();if(old?.reaction===reaction){const {error}=await db.from('message_reactions').delete().eq('message_id',id).eq('member_id',mine);if(error)throw error}else{const {error}=await db.from('message_reactions').upsert({message_id:id,member_id:mine,reaction,updated_at:new Date().toISOString()},{onConflict:'message_id,member_id'});if(error)throw error}}await refresh(external);toast('Reação atualizada 💜')}catch(e){toast(e.message||'Não foi possível reagir.')}finally{busy=false}}
function renderReactionSummary(row,items,mine){let box=row.querySelector('.mi-reaction-summary');if(!box){box=document.createElement('div');box.className='mi-reaction-summary';bubble(row)?.appendChild(box)}const grouped=new Map();for(const x of items){const g=grouped.get(x.reaction)||{count:0,mine:false};g.count++;if(x.member_id===mine)g.mine=true;grouped.set(x.reaction,g)}box.innerHTML=[...grouped].map(([r,g])=>`<span class="mi-reaction-badge ${g.mine?'mine':''}">${r}${g.count>1?` ${g.count}`:''}</span>`).join('');box.style.display=grouped.size?'flex':'none'}

function bindReceivedBubble(row,external){
  const id=messageId(row),b=bubble(row);if(!id||!b||isMine(row)||b.dataset.miReceivedBound==='1')return
  b.dataset.miReceivedBound='1';b.classList.add('mi-received-clickable')
  let last=0,singleTimer=0
  b.addEventListener('click',e=>{
    if(e.target.closest('button,a,input,video,audio')||String(window.getSelection?.()||''))return
    e.preventDefault();e.stopPropagation()
    const now=Date.now()
    if(now-last<330){clearTimeout(singleTimer);last=0;hideMenu();showPicker(b,id,external,row);return}
    last=now;clearTimeout(singleTimer);singleTimer=setTimeout(()=>{last=0;showReceivedMenu(b,row)},260)
  },false)
  b.addEventListener('dblclick',e=>{if(e.target.closest('button,a,input,video,audio'))return;e.preventDefault();e.stopPropagation();clearTimeout(singleTimer);last=0;hideMenu();showPicker(b,id,external,row)},false)
}
function decorateRow(row,external){const id=messageId(row);if(!id)return;row.dataset.messageId=id;if(!isMine(row))bindReceivedBubble(row,external);if(imageEl(row))imageEl(row).classList.add('mi-image-action')}
async function hydrateExternalIds(){const box=$('friendMessages'),conv=window.__ISA_FRIEND_GET_ACTIVE_CONVERSATION_ID__?.();if(!box||!conv||!friendToken)return[];const rows=[...box.querySelectorAll('.friend-msg')];if(!rows.length)return[];const r=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/friend_portal_messages`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${CONFIG.SUPABASE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({p_token:friendToken,p_conversation_id:conv}),cache:'no-store'});const list=await r.json().catch(()=>[]);if(!r.ok)return[];rows.forEach((row,i)=>{if(list?.[i]?.id)row.dataset.messageId=list[i].id});return rows}
async function refresh(external=false){try{const rows=external?await hydrateExternalIds():[...document.querySelectorAll('#messages .message-row[id^="msg-"]')];rows.forEach(r=>decorateRow(r,external));const ids=rows.map(messageId).filter(Boolean);if(!ids.length)return;const {items,mine}=await listReactions(ids,external);for(const row of rows)renderReactionSummary(row,items.filter(x=>x.message_id===messageId(row)),mine)}catch(e){console.warn('Interações de mensagens:',e)}}

// Mensagens próprias: o clique nativo continua responsável por Editar/Cancelar.
// Acrescentamos Copiar/Baixar somente dentro do diálogo da PRÓPRIA mensagem.
document.addEventListener('click',e=>{const own=e.target.closest?.('[data-own-message]');if(!own)return;const row=own.closest('.message-row');if(!row||!isMine(row))return;setTimeout(()=>{const c=$('dialogContent');if(!c||c.querySelector('[data-mi-dialog-copy]'))return;const hasImage=!!imageEl(row);const copy=document.createElement('button');copy.type='button';copy.dataset.miDialogCopy='1';copy.className='soft-btn';copy.style.cssText='width:100%;margin-top:10px';copy.textContent=hasImage?'📋 Copiar imagem':'📋 Copiar mensagem';copy.onclick=()=>hasImage?copyImage(row):copyText(textOnly(row));c.appendChild(copy);if(hasImage){const d=document.createElement('button');d.type='button';d.className='soft-btn';d.style.cssText='width:100%;margin-top:10px';d.textContent='⬇️ Baixar imagem';d.onclick=()=>downloadImage(row);c.appendChild(d)}} ,0)},false)

ensureCss();ensurePicker();ensureMenu()
const mainBox=$('messages');if(mainBox)new MutationObserver(()=>{clearTimeout(mainTimer);mainTimer=setTimeout(()=>refresh(false),90)}).observe(mainBox,{childList:true,subtree:true})
const friendBox=$('friendMessages');if(friendBox)new MutationObserver(()=>{clearTimeout(friendTimer);friendTimer=setTimeout(()=>refresh(true),100)}).observe(friendBox,{childList:true,subtree:true})
setTimeout(()=>{refresh(false);refresh(true)},420);setInterval(()=>{if(document.visibilityState==='visible'){if($('chatPanel')&&!$('chatPanel').classList.contains('hidden'))refresh(false);if($('friendThread')&&!$('friendThread').classList.contains('hidden'))refresh(true)}},4500)
window.__ISA_REFRESH_MESSAGE_INTERACTIONS__=()=>{refresh(false);refresh(true)}
