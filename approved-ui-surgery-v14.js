import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js?v=20260911-ui-surgery-v14'

// Cantinho da Isa — cirurgia visual fase 2.
// Não substitui os motores existentes: corrige duplicações e expõe recursos que já existem.
if(!window.__ISA_APPROVED_UI_SURGERY_V14__){
  window.__ISA_APPROVED_UI_SURGERY_V14__=true
  const db=createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}})
  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ')
  const APPROVED=new Set(['keise','isa','alan'])
  const requested=()=>norm(new URLSearchParams(location.search).get('perfil'))
  const current=()=>norm($('myName')?.textContent)
  const profile=()=>{const q=requested(),n=current();for(const p of APPROVED)if(q===p||n===p||n.startsWith(p+' '))return p;return''}
  const token=new URLSearchParams(location.hash.replace(/^#/, '')).get('acesso')||''
  const external=()=>!!token&&!!($('friendApp')||window.__ISA_FRIEND_PERSON__)
  const rootSocial=()=>external()?$('familySocialOverlay'):$('socialPanel')
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  const pad=n=>String(n).padStart(2,'0')
  let observer=null,timer=0,me=null,coverBusy=false,birthdayBusy=false

  function toast(text){const t=$('friendToast')||$('toast')||$('pssToast');if(!t){console.info(text);return}t.textContent=text;t.classList.remove('hidden');t.classList.add('show');clearTimeout(t._uiSurgery);t._uiSurgery=setTimeout(()=>{t.classList.add('hidden');t.classList.remove('show')},2600)}

  function ensureCss(){
    if($('approvedUiSurgeryV14Css'))return
    const s=document.createElement('style');s.id='approvedUiSurgeryV14Css';s.textContent=`
      .social-comment-form.isa-comment-surgery,.fs-comment-form.isa-comment-surgery,.fs75-comment-form.isa-comment-surgery{display:flex!important;flex-direction:row!important;align-items:center!important;gap:8px!important;min-height:48px!important}
      .isa-comment-surgery>input,.isa-comment-surgery>textarea{flex:1 1 auto!important;min-width:0!important}
      .isa-comment-surgery>.nr8-comment-plus,.isa-comment-surgery>.isa-comment-emoji-trigger,.isa-comment-surgery>.isa-comment-emoji-btn,.isa-comment-surgery>button[type="submit"],.isa-comment-surgery>button:not([type]){position:static!important;inset:auto!important;transform:none!important;margin:0!important;flex:0 0 42px!important;width:42px!important;height:42px!important;min-width:42px!important;max-width:42px!important;padding:0!important;display:grid!important;place-items:center!important;border-radius:13px!important}
      .isa-comment-surgery>.isa-comment-emoji-btn.isa-legacy-emoji-hidden{display:none!important}
      .isa-cover-edit-v14{margin:11px 0 13px;padding:11px;border:1px solid #eaddea;border-radius:17px;background:linear-gradient(145deg,#fffafd,#f6f1ff)}
      .isa-cover-edit-head{display:flex;align-items:center;justify-content:space-between;gap:9px;margin-bottom:8px}.isa-cover-edit-head b{color:#62516d;font-size:12px}.isa-cover-dimension{font-size:9px;color:#94829a;white-space:nowrap}
      .isa-cover-preview-v14{height:96px;border-radius:14px;border:1px dashed #d9cce1;background:linear-gradient(135deg,#ffeaf4,#eee5ff,#e7f7ff);overflow:hidden;display:grid;place-items:center;color:#8e7b97;font-size:10px;text-align:center;background-size:cover!important;background-position:center!important}
      .isa-cover-preview-v14.has-cover{border-style:solid}.isa-cover-actions-v14{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px}.isa-cover-actions-v14 label,.isa-cover-actions-v14 button{border:1px solid #e3d6e8;border-radius:11px;background:#fff;padding:8px 10px;color:#66536f;font-size:10px;font-weight:900;cursor:pointer}.isa-cover-actions-v14 input{display:none}.isa-cover-actions-v14 small{font-size:9px;color:#97849e;flex:1;min-width:160px}
      .isa-birthday-space-v14{margin:10px 0 14px;padding:12px 13px;border:1px solid rgba(237,215,232,.94);border-radius:21px;background:linear-gradient(135deg,rgba(255,249,253,.96),rgba(247,241,255,.96),rgba(239,250,255,.92));box-shadow:0 8px 22px rgba(101,74,117,.07)}
      .isa-birthday-space-v14 .isa-birthday-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}.isa-birthday-space-v14 .isa-birthday-head strong{font-size:12px;color:#62516d}.isa-birthday-space-v14 .isa-birthday-head small{font-size:9px;color:#96849d}
      .isa-birthday-space-v14 .isa-birthday-list{display:flex;gap:8px;overflow:auto;padding:2px 1px 4px}.isa-birthday-space-v14 .isa-birthday-person{min-width:132px;display:flex;gap:8px;align-items:center;border:1px solid #eaddeb;border-radius:15px;background:#fff;padding:8px 9px;color:#66536f}.isa-birthday-space-v14 .bday-icon{width:34px;height:34px;border-radius:12px;display:grid;place-items:center;background:linear-gradient(135deg,#ffe2ef,#eee4ff);font-size:18px}.isa-birthday-space-v14 b{display:block;font-size:10px}.isa-birthday-space-v14 small{display:block;font-size:9px;color:#927f9a;margin-top:2px}.isa-birthday-space-v14 .today{background:linear-gradient(135deg,#fff2c9,#ffe1ee,#eee4ff)}
      .gss.isa-chat-colors-v14 .isa-color-setting{display:grid;grid-template-columns:minmax(160px,1fr) auto;gap:10px;align-items:center;padding:8px 0}.isa-color-setting+.isa-color-setting{border-top:1px solid #eee5f2}.isa-color-setting b{display:block;font-size:11px;color:#66536f}.isa-color-setting small{display:block;margin-top:2px;color:#95849c;font-size:9px}.isa-color-tools{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end}.isa-color-tools input[type=color]{width:48px;height:38px;border:1px solid #dfd3e5;border-radius:11px;padding:3px;background:#fff;cursor:pointer}.isa-color-dot{width:25px!important;height:25px!important;border-radius:50%!important;border:2px solid #fff!important;box-shadow:0 0 0 1px #ddcfe4!important;padding:0!important}.isa-color-reset{border:1px solid #e3d8e8;border-radius:10px;background:#fff;color:#6d5a77;padding:7px 9px;font-size:9px;font-weight:900;cursor:pointer}
      @media(max-width:700px){.isa-cover-edit-head{align-items:flex-start;flex-direction:column;gap:2px}.isa-cover-preview-v14{height:82px}.gss.isa-chat-colors-v14 .isa-color-setting{grid-template-columns:1fr}.isa-color-tools{justify-content:flex-start}.isa-comment-surgery{gap:6px!important}}
    `;document.head.appendChild(s)
  }

  // ---------- Comentários: uma única ação de emoji ----------
  function dedupeCommentForm(form){
    if(!form)return
    form.classList.add('isa-comment-surgery')
    const submit=form.querySelector('button[type="submit"]')||[...form.querySelectorAll('button')].find(b=>!b.type||b.type==='submit'&&!/😊/.test(b.textContent||''))||form.querySelector('button:last-child')
    const emojiButtons=[...form.querySelectorAll('button')].filter(b=>b!==submit&&(b.classList.contains('isa-comment-emoji-trigger')||b.classList.contains('isa-comment-emoji-btn')||(b.textContent||'').trim()==='😊'))
    if(emojiButtons.length<2)return
    const keep=emojiButtons.find(b=>b.classList.contains('isa-comment-emoji-trigger'))||emojiButtons[0]
    for(const b of emojiButtons)if(b!==keep)b.remove()
  }
  function dedupeComments(){document.querySelectorAll('.social-comment-form,.fs-comment-form,.fs75-comment-form').forEach(dedupeCommentForm)}

  // ---------- Aniversários + arte automática do dia ----------
  function birthParts(p){const d=String(p?.birthDate||p?.birth_date||'');const day=Number(p?.birthDay||p?.birth_day||d.slice(8,10)),month=Number(p?.birthMonth||p?.birth_month||d.slice(5,7));return day&&month?{day,month}:null}
  function daysUntil(p){const b=birthParts(p);if(!b)return 9999;const now=new Date(),start=new Date(now.getFullYear(),now.getMonth(),now.getDate());let next=new Date(now.getFullYear(),b.month-1,b.day);if(next<start)next=new Date(now.getFullYear()+1,b.month-1,b.day);return Math.round((next-start)/86400000)}
  function birthLabel(p){const n=daysUntil(p),b=birthParts(p);if(n===0)return'Hoje 🎉';if(n===1)return'Amanhã 🎈';if(n<=7)return`Em ${n} dias`;return`${pad(b.day)}/${pad(b.month)}`}
  async function identity(){if(me)return me;const {data:{user}}=await db.auth.getUser();if(!user)return null;const {data}=await db.from('family_members').select('id,family_id,display_name').eq('auth_user_id',user.id).eq('active',true).maybeSingle();me=data||null;return me}
  async function birthdayData(){
    if(external()){
      const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/friend-social`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({token,action:'bootstrap'}),cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error||'Não foi possível carregar aniversários.');return d.profiles||[]
    }
    const who=await identity();if(!who)return[]
    const {data,error}=await db.from('family_members').select('id,display_name,birth_date').eq('family_id',who.family_id).eq('active',true).order('display_name');if(error)throw error
    let allowed=null;try{const {data:v}=await db.from('family_chat_visibility').select('allowed_member_ids').eq('viewer_id',who.id).maybeSingle();if(Array.isArray(v?.allowed_member_ids))allowed=new Set(v.allowed_member_ids.map(String))}catch{}
    return(data||[]).filter(x=>x.id===who.id||!allowed||allowed.has(String(x.id))).map(x=>({memberId:x.id,name:x.display_name,birthDate:x.birth_date}))
  }
  function birthdayHost(r){return r?.querySelector('[data-social-birthdays],#socialBirthdays,#fsBirthdays,.social-birthdays,.isa-birthday-space')||null}
  async function fallbackBirthdays(){
    const r=rootSocial();if(!r||r.classList.contains('hidden')||birthdayBusy)return false
    if(birthdayHost(r))return true
    birthdayBusy=true
    try{
      const people=await birthdayData(),upcoming=people.filter(p=>birthParts(p)).map(p=>({...p,_days:daysUntil(p)})).sort((a,b)=>a._days-b._days||String(a.name||'').localeCompare(String(b.name||''),'pt-BR')).slice(0,8)
      const box=document.createElement('section');box.className='isa-birthday-space isa-birthday-space-v14';box.dataset.socialBirthdays='1';box.innerHTML=`<div class="isa-birthday-head"><strong>🎂 Aniversariantes</strong><small>datas do perfil • automático</small></div><div class="isa-birthday-list">${upcoming.length?upcoming.map(p=>`<div class="isa-birthday-person ${p._days===0?'today':''}"><span class="bday-icon">${p._days===0?'🎉':p._days===1?'🎈':'🎂'}</span><div><b>${esc(p.name||'Família')}</b><small>${esc(birthLabel(p))}</small></div></div>`).join(''):'<div style="font-size:10px;color:#96849d;padding:4px">As datas salvas no perfil aparecerão aqui.</div>'}</div>`
      const status=r.querySelector('#socialStatusStrip,#fsStatusStrip,.social-status-strip'),composer=r.querySelector('.social-composer,.fs-composer');if(status)status.insertAdjacentElement('afterend',box);else composer?.parentElement?.insertBefore(box,composer);return !!box.isConnected
    }catch(e){console.warn('Fallback de aniversários:',e);return false}finally{birthdayBusy=false}
  }
  async function refreshBirthdaySystems(){
    try{if(!window.__ISA_NOSSA_REDE_BIRTHDAYS__)await import('./nossa-rede-birthday-bridge-v1.js?v=2-open-event-fix');await window.__ISA_NOSSA_REDE_BIRTHDAYS__?.refresh?.()}catch(e){console.warn('Aniversários:',e)}
    setTimeout(()=>fallbackBirthdays(),260)
    try{if(!window.__ISA_SEASONAL_THEME_ENGINE__)await import('./seasonal-theme-engine-v1.js?v=3-birthday-live');await window.__ISA_SEASONAL_THEME_ENGINE__?.refresh?.()}catch(e){console.warn('Tema de aniversário:',e)}
  }

  // ---------- Capa do perfil visível no editor ----------
  async function externalCall(action,payload={},file=null){
    const url=`${CONFIG.SUPABASE_URL}/functions/v1/friend-social`
    if(file){const form=new FormData();form.append('token',token);form.append('action',action);form.append('file',file);Object.entries(payload).forEach(([k,v])=>form.append(k,String(v??'')));const r=await fetch(url,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY},body:form,cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Não foi possível atualizar a capa.');return d}
    const r=await fetch(url,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({token,action,...payload}),cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Não foi possível atualizar a capa.');return d
  }
  async function ownCover(){
    if(external()){const d=await externalCall('bootstrap');const id=d.me?.id||window.__ISA_FRIEND_PERSON__?.id;return(d.profiles||[]).find(p=>String(p.memberId||p.member_id)===String(id))?.coverUrl||''}
    const who=await identity();if(!who)return'';const {data,error}=await db.from('social_profiles').select('cover_ref').eq('member_id',who.id).maybeSingle();if(error||!data?.cover_ref)return'';const {data:signed}=await db.storage.from('social-media').createSignedUrl(data.cover_ref,3600);return signed?.signedUrl||''
  }
  async function uploadCover(file){
    if(coverBusy)return;if(!file?.type?.startsWith('image/'))return toast('Escolha uma imagem para a capa.');if(file.size>8*1024*1024)return toast('A capa pode ter até 8 MB.')
    coverBusy=true
    try{
      if(external())await externalCall('upload_cover',{},file)
      else{
        const who=await identity();if(!who)throw new Error('Perfil não identificado.')
        const {data:oldRow}=await db.from('social_profiles').select('cover_ref').eq('member_id',who.id).maybeSingle();const old=oldRow?.cover_ref||''
        const ext=(file.name.split('.').pop()||'jpg').replace(/[^a-z0-9]/gi,'').toLowerCase(),path=`${who.family_id}/${who.id}/cover/${crypto.randomUUID()}.${ext}`
        const up=await db.storage.from('social-media').upload(path,file,{contentType:file.type,upsert:false});if(up.error)throw up.error
        const save=await db.from('social_profiles').update({cover_ref:path,updated_at:new Date().toISOString()}).eq('member_id',who.id);if(save.error){await db.storage.from('social-media').remove([path]).catch(()=>{});throw save.error}
        if(old)await db.storage.from('social-media').remove([old]).catch(()=>{})
      }
      toast('Capa atualizada ✨');document.dispatchEvent(new CustomEvent('isa:social-profile-cover-updated'));await syncCoverEditors(true);window.__ISA_FAMILY_SOCIAL_EXTRAS__?.scan?.(true);window.__ISA_SEASONAL_THEME_ENGINE__?.refresh?.()
    }catch(e){toast(e?.message||'Não foi possível atualizar a capa.')}finally{coverBusy=false}
  }
  async function removeCover(){
    if(coverBusy)return;coverBusy=true
    try{
      if(external())await externalCall('remove_cover')
      else{const who=await identity();if(!who)throw new Error('Perfil não identificado.');const {data:q}=await db.from('social_profiles').select('cover_ref').eq('member_id',who.id).maybeSingle();const old=q?.cover_ref||'';const u=await db.from('social_profiles').update({cover_ref:null,updated_at:new Date().toISOString()}).eq('member_id',who.id);if(u.error)throw u.error;if(old)await db.storage.from('social-media').remove([old]).catch(()=>{})}
      toast('Capa removida.');document.dispatchEvent(new CustomEvent('isa:social-profile-cover-updated'));await syncCoverEditors(true);window.__ISA_FAMILY_SOCIAL_EXTRAS__?.scan?.(true)
    }catch(e){toast(e?.message||'Não foi possível remover a capa.')}finally{coverBusy=false}
  }
  function coverCards(){return[$('socialProfileModal')?.querySelector('.social-modal-card'),$('fsProfileModal')?.querySelector('.fs-profile-card')].filter(Boolean)}
  async function syncCoverEditors(force=false){
    ensureCss();for(const card of coverCards()){
      let editor=card.querySelector('.isa-cover-edit-v14');if(!editor){editor=document.createElement('div');editor.className='isa-cover-edit-v14';editor.innerHTML=`<div class="isa-cover-edit-head"><b>🖼️ Capa do perfil</b><span class="isa-cover-dimension">Recomendado: 1200 × 420 px</span></div><div class="isa-cover-preview-v14" data-cover-preview>Prévia da capa</div><div class="isa-cover-actions-v14"><label>📷 Escolher capa<input type="file" data-cover-file accept="image/jpeg,image/png,image/webp,image/gif"></label><button type="button" data-cover-remove>Remover</button><small>JPG, PNG, WebP ou GIF • até 8 MB</small></div>`;const birth=card.querySelector('[data-birth-card]'),title=card.querySelector('h3');if(birth)birth.insertAdjacentElement('afterend',editor);else title?.insertAdjacentElement('afterend',editor);editor.querySelector('[data-cover-file]').addEventListener('change',e=>{const f=e.target.files?.[0];e.target.value='';if(f)uploadCover(f)});editor.querySelector('[data-cover-remove]').addEventListener('click',removeCover)}
      if(force||!editor.dataset.coverLoaded){editor.dataset.coverLoaded='1';const url=await ownCover().catch(()=>''),preview=editor.querySelector('[data-cover-preview]');if(preview){preview.style.backgroundImage=url?`url("${url}")`:'';preview.textContent=url?'':'Prévia da capa';preview.classList.toggle('has-cover',!!url)}}
    }
  }

  // ---------- Cores das conversas e do layout do chat ----------
  const colorKey=()=>`isa-chat-colors-v14:${profile()||'familia'}`
  const COLOR_DEFAULT={conversation:'',chat:''}
  const QUICK=['#f3c6de','#d8c6f2','#c8e2f5','#cbe8d2','#f5e2a8']
  function readColors(){try{return{...COLOR_DEFAULT,...JSON.parse(localStorage.getItem(colorKey())||'{}')}}catch{return{...COLOR_DEFAULT}}}
  let colors=readColors()
  function saveColors(){try{localStorage.setItem(colorKey(),JSON.stringify(colors))}catch{}}
  function applyChatColors(){
    let s=$('isaChatColorsV14Style');if(!s){s=document.createElement('style');s.id='isaChatColorsV14Style';document.head.appendChild(s)}
    const cc=colors.conversation,chat=colors.chat,parts=[]
    if(cc)parts.push(`#kaConversationList .ka-conv-card{background:linear-gradient(145deg,#fff,color-mix(in srgb,${cc} 34%,#fff))!important;border-color:color-mix(in srgb,${cc} 52%,#fff)!important;box-shadow:0 9px 20px color-mix(in srgb,${cc} 20%,transparent)!important}#kaConversationList .ka-conv-card.active{outline:2px solid color-mix(in srgb,${cc} 68%,#fff)!important}`)
    if(chat)parts.push(`#chatPanel{border-color:color-mix(in srgb,${chat} 34%,#fff)!important}#chatPanel .chat-header,#chatPanel #composer{background:linear-gradient(145deg,#fff,color-mix(in srgb,${chat} 18%,#fff))!important;border-color:color-mix(in srgb,${chat} 38%,#fff)!important}#chatPanel #sendBtn,#chatPanel #photoBtn,#chatPanel #emojiBtn,#chatPanel #groupPlusBtn{background:linear-gradient(145deg,${chat},color-mix(in srgb,${chat} 70%,#fff))!important;border-color:color-mix(in srgb,${chat} 62%,#fff)!important;color:#5f4d69!important}`)
    s.textContent=parts.join('\n');syncColorControls()
  }
  function syncColorControls(){const c=$('isaConversationColor'),h=$('isaChatLayoutColor');if(c)c.value=colors.conversation||'#d8c6f2';if(h)h.value=colors.chat||'#f3c6de'}
  function injectChatColorSettings(){
    const panel=$('generalSettingsPanel'),box=panel?.querySelector('.gsc');if(!box||box.querySelector('.isa-chat-colors-v14'))return false
    const sec=document.createElement('section');sec.className='gss isa-chat-colors-v14';sec.innerHTML=`<h3>🎨 Cores do Chat</h3><p>Personalize sem alterar a posição dos elementos.</p><div class="isa-color-setting"><div><b>Botões das conversas</b><small>Muda a cor dos cards da lista de conversas.</small></div><div class="isa-color-tools"><input id="isaConversationColor" type="color" value="${colors.conversation||'#d8c6f2'}" aria-label="Cor dos botões das conversas">${QUICK.map(c=>`<button type="button" class="isa-color-dot" data-color-target="conversation" data-color="${c}" style="background:${c}" aria-label="Usar ${c}"></button>`).join('')}<button type="button" class="isa-color-reset" data-color-reset="conversation">Padrão</button></div></div><div class="isa-color-setting"><div><b>Layout do chat</b><small>Muda cabeçalho, barra de envio e botões do chat.</small></div><div class="isa-color-tools"><input id="isaChatLayoutColor" type="color" value="${colors.chat||'#f3c6de'}" aria-label="Cor do layout do chat">${QUICK.map(c=>`<button type="button" class="isa-color-dot" data-color-target="chat" data-color="${c}" style="background:${c}" aria-label="Usar ${c}"></button>`).join('')}<button type="button" class="isa-color-reset" data-color-reset="chat">Padrão</button></div></div>`
    const bubble=[...box.querySelectorAll('.gss')].find(x=>/cores das mensagens/i.test(x.querySelector('h3')?.textContent||''));if(bubble)bubble.insertAdjacentElement('afterend',sec);else box.appendChild(sec)
    $('isaConversationColor')?.addEventListener('input',e=>{colors.conversation=e.target.value;saveColors();applyChatColors()});$('isaChatLayoutColor')?.addEventListener('input',e=>{colors.chat=e.target.value;saveColors();applyChatColors()})
    sec.addEventListener('click',e=>{const q=e.target.closest('[data-color-target]');if(q){colors[q.dataset.colorTarget]=q.dataset.color;saveColors();applyChatColors();return}const r=e.target.closest('[data-color-reset]');if(r){colors[r.dataset.colorReset]='';saveColors();applyChatColors()}})
    syncColorControls();return true
  }

  function scan(){
    ensureCss();dedupeComments();injectChatColorSettings();syncCoverEditors(false).catch(()=>{});applyChatColors()
    const r=rootSocial();if(r&&!r.classList.contains('hidden')&&!birthdayHost(r))setTimeout(fallbackBirthdays,80)
  }
  function schedule(delay=70){clearTimeout(timer);timer=setTimeout(scan,delay)}
  function start(){
    ensureCss();scan();if(!observer){observer=new MutationObserver(ms=>{if(ms.some(m=>m.type==='childList'||m.type==='attributes'))schedule()});observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']})}
  }

  document.addEventListener('isa:social-opened',()=>{setTimeout(()=>{scan();refreshBirthdaySystems();syncCoverEditors(true)},70)},{passive:true})
  document.addEventListener('isa:social-rendered',()=>schedule(30),{passive:true})
  document.addEventListener('isa:social-profile-editor-opened',()=>setTimeout(()=>syncCoverEditors(true),40),{passive:true})
  document.addEventListener('isa:birth-date-updated',()=>setTimeout(refreshBirthdaySystems,80),{passive:true})
  document.addEventListener('isa:profile-updated',()=>setTimeout(()=>syncCoverEditors(true),100),{passive:true})
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-approved-action="social"],#socialNav,#socialRefresh,#fsRefresh,#socialEditProfile,#fsEditProfile'))setTimeout(()=>{scan();refreshBirthdaySystems()},120)},true)
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){schedule(40);setTimeout(refreshBirthdaySystems,100)}})
  window.addEventListener('pageshow',()=>{schedule(0);setTimeout(refreshBirthdaySystems,500)},{once:true})

  window.__ISA_APPROVED_UI_SURGERY__={scan,dedupeComments,refreshBirthdays:refreshBirthdaySystems,syncCoverEditors,applyChatColors}
  start();setTimeout(scan,350);setTimeout(()=>refreshBirthdaySystems(),1100)
}
