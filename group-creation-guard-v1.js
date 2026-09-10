// Cantinho da Isa — criação segura de grupos com permissão real.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js'
const db=createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}})
const $=id=>document.getElementById(id)
let dialogTimer=0,creatorPermission=null,creatorCheckAt=0

function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase()}
function currentName(){const q=norm(new URLSearchParams(location.search).get('perfil'));const n=norm($('myName')?.textContent);return q||n}
function isMainProfile(){return ['keise','alan','isa'].includes(currentName())}
function isMainCreator(){return isMainProfile()&&creatorPermission!==false}
function toast(text){const t=$('toast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._gg);t._gg=setTimeout(()=>t.classList.add('hidden'),2600)}
function setStatus(text){const s=$('dialogMsg');if(s){s.textContent=text;s.style.color='#aa3852'}else toast(text)}
function memberName(input){const label=input.closest('label');if(!label)return'';return norm((label.textContent||'').split('•')[0])}
function pairBlocked(names){const s=new Set(names.map(norm));return s.has('elion')&&(s.has('evalda')||s.has('vania'))}
function explainRule(){return 'Por privacidade familiar, Elion não pode ficar no mesmo grupo que Evalda ou Vânia.'}

async function refreshCreatorPermission(force=false){
  if(!isMainProfile()){creatorPermission=false;applyGroupAccess();return false}
  if(!force&&Date.now()-creatorCheckAt<5000)return creatorPermission!==false
  creatorCheckAt=Date.now()
  try{
    const {data:{user}}=await db.auth.getUser();if(!user)return creatorPermission!==false
    const {data,error}=await db.from('family_members').select('can_create_group').eq('auth_user_id',user.id).eq('active',true).maybeSingle()
    if(!error&&data)creatorPermission=data.can_create_group===true
  }catch{}
  applyGroupAccess();return creatorPermission!==false
}
function applyGroupAccess(){
  const allowed=isMainCreator(),b=$('newGroupBtn')
  if(b){b.classList.toggle('hidden',!allowed);if(allowed){b.style.removeProperty('display');b.title='Criar grupo'}else b.style.setProperty('display','none','important')}
  const sp=$('superParentsCreateGroupBtn');if(sp&&!allowed)sp.remove()
  if(allowed)ensureSuperParentsGroupButton()
}

function syncPairRules(){
  const checks=[...document.querySelectorAll('[data-group-member]')];if(!checks.length)return
  const selected=checks.filter(x=>x.checked).map(memberName)
  const hasElion=selected.includes('elion'),hasBlocked=selected.includes('evalda')||selected.includes('vania')
  for(const c of checks){
    const n=memberName(c);if(c.dataset.nativeDisabled==='1')continue
    const should=(hasElion&&(n==='evalda'||n==='vania'))||(hasBlocked&&n==='elion')
    c.disabled=should
    c.closest('label')?.classList.toggle('group-rule-disabled',should)
  }
}
async function createGroupFromDialog(btn){
  if(!await refreshCreatorPermission(true))return setStatus('A permissão para criar grupos está desativada para este perfil.')
  const title=String($('groupName')?.value||'').trim()
  const checks=[...document.querySelectorAll('[data-group-member]:checked')]
  const names=checks.map(memberName)
  if(title.length<2)return setStatus('Dê um nome ao grupo.')
  if(!checks.length)return setStatus('Escolha pelo menos uma pessoa para o grupo.')
  if(pairBlocked(names))return setStatus(explainRule())
  const memberIds=checks.map(x=>String(x.dataset.groupMember||'')).filter(Boolean)
  btn.disabled=true;btn.textContent='Criando…'
  try{
    const {data,error}=await db.functions.invoke('group-actions-v2',{body:{action:'create_group',title,memberIds}})
    if(error)throw error;if(data?.error)throw new Error(data.error)
    $('simpleDialog')?.close();toast('Grupo criado 💕')
    setTimeout(()=>location.reload(),650)
  }catch(e){setStatus(e?.message||'Não foi possível criar o grupo.');btn.disabled=false;btn.textContent='Criar grupo'}
}
function patchGroupDialog(){
  if(!isMainCreator())return
  const nameInput=$('groupName'),oldBtn=$('createGroupBtn');if(!nameInput||!oldBtn||oldBtn.dataset.groupGuard==='1')return
  const profile=currentName(),checks=[...document.querySelectorAll('[data-group-member]')]
  if(profile==='keise'||profile==='alan'){
    for(const c of checks){
      const n=memberName(c)
      if(n==='isa'&&c.disabled){c.disabled=false;c.checked=false;c.dataset.nativeDisabled='0'}
      else c.dataset.nativeDisabled=c.disabled?'1':'0'
    }
    const p=[...document.querySelectorAll('#dialogContent p.muted')].find(x=>/todo grupo.*isa/i.test(x.textContent||''));if(p)p.textContent='Escolha livremente os participantes, respeitando as regras de privacidade familiar.'
  }else checks.forEach(c=>c.dataset.nativeDisabled=c.disabled?'1':'0')
  let note=$('groupPrivacyRule')
  if(!note){note=document.createElement('div');note.id='groupPrivacyRule';note.className='group-privacy-rule';note.innerHTML='<strong>🔒 Regra de privacidade</strong><span>Elion não pode ficar no mesmo grupo que Evalda ou Vânia.</span>';oldBtn.parentNode.insertBefore(note,oldBtn)}
  checks.forEach(c=>c.addEventListener('change',()=>{
    const selected=[...document.querySelectorAll('[data-group-member]:checked')].map(memberName)
    if(pairBlocked(selected)){c.checked=false;setStatus(explainRule())}
    syncPairRules()
  }))
  syncPairRules()
  const btn=oldBtn.cloneNode(true);btn.dataset.groupGuard='1';oldBtn.replaceWith(btn);btn.addEventListener('click',()=>createGroupFromDialog(btn))
}
function ensureSuperParentsGroupButton(){
  if(currentName()!=='keise'||!isMainCreator())return
  const panel=$('parentsPanel'),head=panel?.querySelector('.panel-title');if(!head||$('superParentsCreateGroupBtn'))return
  const b=document.createElement('button');b.id='superParentsCreateGroupBtn';b.type='button';b.className='soft-btn';b.textContent='＋ Criar grupo';b.title='Criar um grupo com os familiares que você escolher'
  b.addEventListener('click',()=>{$('newGroupBtn')?.click();setTimeout(patchGroupDialog,30)})
  head.appendChild(b)
}
function ensureGeneralGroupAccess(){applyGroupAccess()}
function ensureCss(){if($('groupCreationGuardCss'))return;const l=document.createElement('style');l.id='groupCreationGuardCss';l.textContent='.group-privacy-rule{display:flex;gap:8px;align-items:flex-start;margin:10px 0;padding:10px 12px;border-radius:14px;background:#fff1f4;color:#8e4255;font-size:.82rem}.group-privacy-rule span{display:block}.group-rule-disabled{opacity:.48;filter:grayscale(.15)}#superParentsCreateGroupBtn{margin-left:8px}';document.head.appendChild(l)}
function scan(){ensureCss();applyGroupAccess();patchGroupDialog();refreshCreatorPermission()}
scan();document.addEventListener('DOMContentLoaded',scan,{once:true})
const dlg=$('simpleDialog');if(dlg)new MutationObserver(()=>{clearTimeout(dialogTimer);dialogTimer=setTimeout(patchGroupDialog,20)}).observe(dlg,{childList:true,subtree:true})
setInterval(()=>{if(document.visibilityState==='visible')refreshCreatorPermission()},5000)
window.__ISA_GROUP_RULES_REFRESH__=scan
window.__ISA_GROUP_PERMISSION_CHANGED__=enabled=>{creatorPermission=!!enabled;creatorCheckAt=Date.now();applyGroupAccess()}
