import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js?v=20260910-emoji-suite'

if(!window.__ISA_SOCIAL_EMOJI_SUITE_V1__){
  window.__ISA_SOCIAL_EMOJI_SUITE_V1__=true
  const db=createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}})
  const $=id=>document.getElementById(id)
  const PRIMARY=['🩷','🩵','💜','😂','😍','🌸','🥰','✨','👏']
  const FULL=['🩷','🩵','💜','❤️','😂','😍','🌸','🥰','✨','👏','👍','😢','🙏','😡','🤩','😭','🤔','🥳','😱','😮','😊','🫶','🔥','🎉','💫','😴','😎','💪','🎶','📚','☀️','🌙','🏡']
  const friendToken=window.__ISA_FRIEND_TOKEN__||new URLSearchParams(location.hash.replace(/^#/, '')).get('acesso')||''
  let mainMemberId='',busy=false,scanTimer=0

  function toast(text){const t=$('friendToast')||$('toast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._emojiSuite);t._emojiSuite=setTimeout(()=>t.classList.add('hidden'),2300)}
  function isExternal(){return !!$('friendApp')&&!!friendToken}
  function socialOpen(){return !$('socialPanel')?.classList.contains('hidden')||!$('familySocialOverlay')?.classList.contains('hidden')}

  function ensureCss(){
    if($('isaSocialEmojiSuiteCss'))return
    const s=document.createElement('style');s.id='isaSocialEmojiSuiteCss';s.textContent=`
      .isa-social-emoji-strip{display:flex!important;gap:7px!important;align-items:center!important;flex-wrap:wrap!important;margin:8px 0 4px!important}
      .isa-social-emoji-chip,.isa-social-more-emoji,.isa-comment-emoji-trigger{width:43px!important;height:43px!important;flex:0 0 43px!important;border:1px solid rgba(211,199,221,.95)!important;border-radius:14px!important;display:grid!important;place-items:center!important;background:linear-gradient(145deg,#fff,#fff9fc 58%,#f3ecfa)!important;box-shadow:0 4px 10px rgba(91,61,107,.10),inset 0 1px 1px #fff!important;font-size:23px!important;line-height:1!important;cursor:pointer!important;padding:0!important;transition:transform .12s ease,box-shadow .12s ease!important}
      .isa-social-emoji-chip:hover,.isa-social-more-emoji:hover,.isa-comment-emoji-trigger:hover{transform:translateY(-2px) scale(1.04)!important;box-shadow:0 7px 14px rgba(91,61,107,.15)!important}
      .isa-social-emoji-chip.is-mine{background:linear-gradient(145deg,#f9d5e9,#eee2ff)!important;outline:2px solid rgba(202,157,222,.35)!important}
      .isa-social-more-emoji{font-size:22px!important;color:#72587e!important;font-weight:900!important}
      #isaSocialEmojiPalette{position:fixed;z-index:2147483641;display:none;grid-template-columns:repeat(8,42px);gap:6px;padding:10px;border-radius:20px;background:rgba(255,255,255,.97);border:1px solid rgba(255,255,255,.98);box-shadow:0 18px 42px rgba(71,48,86,.24);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);max-width:calc(100vw - 20px)}
      #isaSocialEmojiPalette.show{display:grid}
      #isaSocialEmojiPalette button{width:42px;height:42px;border:0;border-radius:13px;background:linear-gradient(145deg,#fff,#f7f0fb);display:grid;place-items:center;font-size:22px;cursor:pointer}
      .isa-comment-emoji-trigger{width:40px!important;height:40px!important;flex-basis:40px!important;font-size:21px!important;border-radius:13px!important}
      .isa-social-comment-form-ready{align-items:center!important}
      @media(max-width:760px){#isaSocialEmojiPalette{grid-template-columns:repeat(6,40px);gap:5px;max-height:270px;overflow:auto}#isaSocialEmojiPalette button{width:40px;height:40px;font-size:21px}.isa-social-emoji-chip,.isa-social-more-emoji{width:40px!important;height:40px!important;flex-basis:40px!important;font-size:21px!important}}
    `;document.head.appendChild(s)
  }

  function palette(){
    ensureCss();let p=$('isaSocialEmojiPalette');if(p)return p
    p=document.createElement('div');p.id='isaSocialEmojiPalette';p.setAttribute('role','menu');p.innerHTML=FULL.map(e=>`<button type="button" data-isa-palette-emoji="${e}" aria-label="Emoji ${e}">${e}</button>`).join('');document.body.appendChild(p)
    p.addEventListener('click',async e=>{const b=e.target.closest('[data-isa-palette-emoji]');if(!b)return;e.preventDefault();e.stopPropagation();const emoji=b.dataset.isaPaletteEmoji,mode=p.dataset.mode||'',postId=p.dataset.postId||'',targetId=p.dataset.targetId||'';hidePalette();if(mode==='text'){const target=$(targetId);if(target){insertEmoji(target,emoji)}}else if(mode==='react'&&postId){await react(postId,emoji,p.dataset.external==='1')}})
    document.addEventListener('pointerdown',e=>{if(p.classList.contains('show')&&!p.contains(e.target)&&!e.target.closest?.('[data-isa-open-palette]'))hidePalette()},{capture:true,passive:true})
    return p
  }
  function hidePalette(){const p=$('isaSocialEmojiPalette');if(p)p.classList.remove('show')}
  function placePalette(anchor,opts={}){const p=palette(),r=anchor.getBoundingClientRect();p.dataset.mode=opts.mode||'text';p.dataset.postId=opts.postId||'';p.dataset.targetId=opts.targetId||'';p.dataset.external=opts.external?'1':'0';p.classList.add('show');const w=p.offsetWidth||390,h=p.offsetHeight||210;let left=r.left,top=r.bottom+7;if(left+w>innerWidth-8)left=Math.max(8,innerWidth-w-8);if(top+h>innerHeight-8)top=Math.max(8,r.top-h-7);p.style.left=`${Math.max(8,left)}px`;p.style.top=`${Math.max(8,top)}px`}
  function insertEmoji(input,emoji){const start=input.selectionStart??input.value.length,end=input.selectionEnd??start;input.value=input.value.slice(0,start)+emoji+input.value.slice(end);const pos=start+emoji.length;try{input.setSelectionRange(pos,pos)}catch{}input.dispatchEvent(new Event('input',{bubbles:true}));input.focus()}

  function composerTargets(){return [[$('socialEmojiRow'),$('socialCaption'),'socialCaption'],[$('fsEmojiRow'),$('fsCaption'),'fsCaption']].filter(x=>x[0]&&x[1])}
  function patchComposers(){
    for(const [row,input,inputId] of composerTargets()){
      if(row.dataset.isaEmojiSuite==='1')continue
      row.dataset.isaEmojiSuite='1';row.classList.add('isa-social-emoji-strip','show')
      row.innerHTML=PRIMARY.map(e=>`<button class="isa-social-emoji-chip" type="button" data-isa-insert-emoji="${e}" data-target="${inputId}">${e}</button>`).join('')+`<button class="isa-social-more-emoji" type="button" data-isa-open-palette="text" data-target="${inputId}" aria-label="Mais emojis">＋</button>`
    }
  }

  function postInfo(actions){
    const article=actions.closest('[data-post],[data-fs-post]');if(!article)return null
    return {article,id:article.dataset.post||article.dataset.fsPost||'',external:!!article.dataset.fsPost||!!article.closest('#familySocialOverlay')}
  }
  function currentReaction(article,external){
    const old=[...article.querySelectorAll('.social-react.mine,.fs-react.mine,[data-react].mine,[data-fs-react].mine')][0]
    return old?.dataset?.react||old?.dataset?.fsReact||old?.textContent?.trim()||''
  }
  function patchReactionRows(){
    const rows=[...document.querySelectorAll('#socialFeed .social-post-actions,#familySocialOverlay .fs-reactions,#familySocialOverlay .social-post-actions')]
    for(const row of rows){
      const info=postInfo(row);if(!info?.id)continue
      const mine=currentReaction(info.article,info.external)
      const signature=`${info.id}:${mine}`;if(row.dataset.isaEmojiSignature===signature)continue
      row.dataset.isaEmojiSignature=signature;row.classList.add('isa-social-emoji-strip')
      row.innerHTML=PRIMARY.map(e=>`<button class="isa-social-emoji-chip ${mine===e?'is-mine':''}" type="button" data-isa-social-react="${e}" data-post-id="${info.id}" data-external="${info.external?'1':'0'}">${e}</button>`).join('')+`<button class="isa-social-more-emoji" type="button" data-isa-open-palette="react" data-post-id="${info.id}" data-external="${info.external?'1':'0'}" aria-label="Mais reações">＋</button>`
    }
  }

  function patchComments(){
    const forms=[...document.querySelectorAll('#socialFeed .social-comment-form,#familySocialOverlay .fs-comment-form,#familySocialOverlay .social-comment-form')]
    for(const form of forms){
      if(form.dataset.isaEmojiSuite==='1')continue
      const input=form.querySelector('input,textarea');if(!input)continue
      form.dataset.isaEmojiSuite='1';form.classList.add('isa-social-comment-form-ready')
      if(!input.id)input.id='isaCommentInput'+Math.random().toString(36).slice(2,9)
      const btn=document.createElement('button');btn.type='button';btn.className='isa-comment-emoji-trigger';btn.textContent='😊';btn.setAttribute('aria-label','Emojis no comentário');btn.dataset.isaOpenPalette='text';btn.dataset.target=input.id
      const submit=form.querySelector('button[type="submit"],button:not([type])');if(submit)form.insertBefore(btn,submit);else form.appendChild(btn)
    }
  }

  async function getMainMember(){if(mainMemberId)return mainMemberId;const {data:{user}}=await db.auth.getUser();if(!user)return'';const {data}=await db.from('family_members').select('id').eq('auth_user_id',user.id).eq('active',true).maybeSingle();mainMemberId=data?.id||'';return mainMemberId}
  async function react(postId,reaction,external){
    if(busy)return;busy=true
    try{
      if(external){
        if(!friendToken)throw new Error('Acesso familiar não identificado.')
        const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/friend-social`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({token:friendToken,action:'react',postId,reaction}),cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error||'Não foi possível reagir.');await window.__ISA_REFRESH_EXTERNAL_SOCIAL_V72__?.()
      }else{
        const member=await getMainMember();if(!member)throw new Error('Perfil não identificado.')
        const {data:old}=await db.from('social_post_reactions').select('reaction').eq('post_id',postId).eq('member_id',member).maybeSingle()
        if(old?.reaction===reaction){const {error}=await db.from('social_post_reactions').delete().eq('post_id',postId).eq('member_id',member);if(error)throw error}
        else{const {error}=await db.from('social_post_reactions').upsert({post_id:postId,member_id:member,reaction,updated_at:new Date().toISOString()},{onConflict:'post_id,member_id'});if(error)throw error}
        $('socialRefresh')?.click()
      }
      toast('Reação atualizada '+reaction)
    }catch(e){toast(e?.message||'Não foi possível reagir.')}
    finally{busy=false;setTimeout(scan,160)}
  }

  function patchDoubleReactionPicker(){
    const p=$('isaDoubleReactionPicker');if(!p||p.dataset.isaExpanded==='1')return
    p.dataset.isaExpanded='1';p.innerHTML=FULL.slice(0,20).map(e=>`<button type="button" data-double-reaction="${e}" aria-label="Reagir com ${e}">${e}</button>`).join('')
  }

  function scan(){ensureCss();patchComposers();patchReactionRows();patchComments();patchDoubleReactionPicker()}
  document.addEventListener('click',async e=>{
    const insert=e.target.closest?.('[data-isa-insert-emoji]');if(insert){e.preventDefault();e.stopPropagation();const target=$(insert.dataset.target);if(target)insertEmoji(target,insert.dataset.isaInsertEmoji);return}
    const more=e.target.closest?.('[data-isa-open-palette]');if(more){e.preventDefault();e.stopPropagation();placePalette(more,{mode:more.dataset.isaOpenPalette,targetId:more.dataset.target||'',postId:more.dataset.postId||'',external:more.dataset.external==='1'});return}
    const r=e.target.closest?.('[data-isa-social-react]');if(r){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();await react(r.dataset.postId,r.dataset.isaSocialReact,r.dataset.external==='1')}
  },true)

  const obs=new MutationObserver(()=>{clearTimeout(scanTimer);scanTimer=setTimeout(scan,90)});obs.observe(document.documentElement,{childList:true,subtree:true})
  scan();[350,900,1700,2800].forEach(ms=>setTimeout(scan,ms))
  document.addEventListener('isa:friend-portal-entered',()=>setTimeout(scan,120))
  document.addEventListener('isa:friend-access-valid',()=>setTimeout(scan,120))
  window.__ISA_SOCIAL_EMOJI_SUITE__={scan,PRIMARY,FULL}
}
