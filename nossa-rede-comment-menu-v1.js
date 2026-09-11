import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js'
const db=createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}})
const $=id=>document.getElementById(id)
const accessToken=new URLSearchParams(location.hash.replace(/^#/, '')).get('acesso')||''
let activeForm=null,busy=false,scanTimer=0
const COMMENT_FORMS='.social-comment-form,.fs-comment-form,.fs75-comment-form'
const isExternal=()=>!!accessToken&&!!$('friendApp')
function toast(text){const t=$('friendToast')||$('toast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._nr8);t._nr8=setTimeout(()=>t.classList.add('hidden'),2600)}
function rootFor(el){return el?.closest?.('#familySocialOverlay,#socialPanel')||$('familySocialOverlay')||$('socialPanel')}
function postFor(el){const p=el?.closest?.('[data-fs75-post],[data-fs-post],[data-post]');if(!p)return null;return{el:p,id:p.dataset.fs75Post||p.dataset.fsPost||p.dataset.post||''}}
function inputFor(form){return form?.querySelector?.('input[type="text"],input:not([type]),textarea')||null}
function closePublicationMenus(){document.querySelectorAll('.nuvem-compose-menu.show').forEach(m=>{m.classList.remove('show');m.closest('.nuvem-compose-compact')?.querySelector('.nuvem-compose-plus')?.setAttribute('aria-expanded','false')})}
function ensureCommentLayout(){
  if($('nr8CommentIsolationCssV5'))return
  const s=document.createElement('style');s.id='nr8CommentIsolationCssV5';s.textContent=`
    /* Comentário é uma área própria: nunca herda o compositor de publicação. */
    #socialPanel .social-post,#familySocialOverlay .social-post,#familySocialOverlay .fs75-post{height:auto!important;max-height:none!important}
    #socialPanel .social-comments,#familySocialOverlay .social-comments,#familySocialOverlay .fs-comments,#familySocialOverlay .fs75-comments{
      display:block!important;visibility:visible!important;opacity:1!important;height:auto!important;max-height:none!important;
      overflow:visible!important;box-sizing:border-box!important;padding-bottom:16px!important
    }
    #socialPanel .social-comment-form,#familySocialOverlay .social-comment-form,#familySocialOverlay .fs-comment-form,#familySocialOverlay .fs75-comment-form{
      position:relative!important;inset:auto!important;display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;
      align-items:center!important;gap:8px!important;width:100%!important;max-width:100%!important;min-width:0!important;
      min-height:52px!important;height:auto!important;box-sizing:border-box!important;margin:8px 0 0!important;padding:2px 0 4px!important;
      overflow:visible!important;grid-template-columns:none!important
    }
    #socialPanel .social-comment-form>input,#socialPanel .social-comment-form>textarea,
    #familySocialOverlay .social-comment-form>input,#familySocialOverlay .social-comment-form>textarea,
    #familySocialOverlay .fs-comment-form>input,#familySocialOverlay .fs-comment-form>textarea,
    #familySocialOverlay .fs75-comment-form>input,#familySocialOverlay .fs75-comment-form>textarea{
      display:block!important;visibility:visible!important;opacity:1!important;position:static!important;inset:auto!important;transform:none!important;
      flex:1 1 120px!important;width:auto!important;max-width:100%!important;min-width:0!important;min-height:42px!important;
      grid-column:auto!important;grid-row:auto!important;box-sizing:border-box!important;margin:0!important
    }
    #socialPanel .social-comment-form>button:not(.isa-legacy-emoji-hidden),
    #familySocialOverlay .social-comment-form>button:not(.isa-legacy-emoji-hidden),
    #familySocialOverlay .fs-comment-form>button:not(.isa-legacy-emoji-hidden),
    #familySocialOverlay .fs75-comment-form>button:not(.isa-legacy-emoji-hidden){
      position:static!important;inset:auto!important;transform:none!important;float:none!important;grid-column:auto!important;grid-row:auto!important;
      flex:0 0 42px!important;width:42px!important;min-width:42px!important;max-width:42px!important;height:42px!important;min-height:42px!important;
      margin:0!important;padding:0!important;box-sizing:border-box!important;display:grid!important;place-items:center!important;border-radius:13px!important
    }
    #socialPanel .social-comment-form>.nr8-comment-plus,#familySocialOverlay .social-comment-form>.nr8-comment-plus,
    #familySocialOverlay .fs-comment-form>.nr8-comment-plus,#familySocialOverlay .fs75-comment-form>.nr8-comment-plus{
      flex-basis:40px!important;width:40px!important;min-width:40px!important;max-width:40px!important
    }
    /* Se algum compositor de publicação tiver sido injetado por engano dentro do comentário, somente ele é escondido. */
    #socialPanel .social-comment-form>.nuvem-compose-compact,
    #socialPanel .fs-comment-form>.nuvem-compose-compact,
    #socialPanel .fs75-comment-form>.nuvem-compose-compact,
    #familySocialOverlay .social-comment-form>.nuvem-compose-compact,
    #familySocialOverlay .fs-comment-form>.nuvem-compose-compact,
    #familySocialOverlay .fs75-comment-form>.nuvem-compose-compact{display:none!important}
    @media(max-width:520px){
      #socialPanel .social-comment-form,#familySocialOverlay .social-comment-form,#familySocialOverlay .fs-comment-form,#familySocialOverlay .fs75-comment-form{gap:5px!important}
      #socialPanel .social-comment-form>button:not(.isa-legacy-emoji-hidden),#familySocialOverlay .social-comment-form>button:not(.isa-legacy-emoji-hidden),#familySocialOverlay .fs-comment-form>button:not(.isa-legacy-emoji-hidden),#familySocialOverlay .fs75-comment-form>button:not(.isa-legacy-emoji-hidden){flex-basis:38px!important;width:38px!important;min-width:38px!important;max-width:38px!important;height:38px!important;min-height:38px!important}
      #socialPanel .social-comment-form>.nr8-comment-plus,#familySocialOverlay .social-comment-form>.nr8-comment-plus,#familySocialOverlay .fs-comment-form>.nr8-comment-plus,#familySocialOverlay .fs75-comment-form>.nr8-comment-plus{flex-basis:38px!important;width:38px!important;min-width:38px!important;max-width:38px!important}
    }
  `;document.head.appendChild(s)
}
function cleanWrongComposer(form){if(!form)return;[...form.children].filter(x=>x.matches?.('.nuvem-compose-compact,.nuvem-share-title,.nuvem-location-row,.nuvem-selected-tags')).forEach(x=>x.remove())}
async function authHeaders(){if(isExternal())return{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${CONFIG.SUPABASE_KEY}`};const {data:{session}}=await db.auth.getSession();if(!session?.access_token)throw new Error('Sessão não encontrada.');return{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${session.access_token}`}}
function ensureSheet(){let s=$('nr8CommentSheet');if(s)return s;s=document.createElement('div');s.id='nr8CommentSheet';s.className='nr8-comment-sheet';s.innerHTML=`<button type="button" data-cm="image"><b>🖼️</b>Foto</button><button type="button" data-cm="video"><b>🎥</b>Vídeo</button><button type="button" data-cm="audio"><b>🎙️</b>Áudio</button><button type="button" data-cm="tag"><b>@</b>Marcar</button>`;document.body.appendChild(s);s.addEventListener('click',e=>{const b=e.target.closest('button[data-cm]');if(!b)return;const a=b.dataset.cm;if(a==='tag')openTagPicker();else chooseMedia(a)});return s}
function placeSheet(btn){closePublicationMenus();const s=ensureSheet();activeForm=btn.closest(COMMENT_FORMS);if(!activeForm)return;s.classList.toggle('show');if(!s.classList.contains('show'))return;const r=btn.getBoundingClientRect();if(matchMedia('(max-width:760px)').matches){s.style.left='8px';s.style.right='8px';s.style.top='auto';s.style.bottom='92px'}else{const w=Math.min(430,innerWidth-24);let left=Math.max(12,Math.min(innerWidth-w-12,r.left));s.style.left=`${left}px`;s.style.right='auto';s.style.top=`${Math.max(12,r.top-110)}px`;s.style.bottom='auto'}}
function names(){const root=rootFor(activeForm);return[...root.querySelectorAll('.social-family-item strong,.fs-static-person strong')].map(x=>x.textContent.trim()).filter(Boolean)}
function openTagPicker(){const s=ensureSheet(),list=names();if(!list.length){toast('Os perfis permitidos ainda estão carregando.');return}s.innerHTML=list.slice(0,16).map(n=>`<button type="button" data-name="${n.replace(/"/g,'&quot;')}"><b>@</b>${n}</button>`).join('');s.querySelectorAll('[data-name]').forEach(b=>b.onclick=()=>{const input=inputFor(activeForm);if(input){const name=b.dataset.name;const before=input.value||'';input.value=before+(before&&!/\s$/.test(before)?' ':'')+`@${name} `;input.focus();input.dispatchEvent(new Event('input',{bubbles:true}))}resetSheet()})}
function resetSheet(){const s=ensureSheet();s.classList.remove('show');s.innerHTML=`<button type="button" data-cm="image"><b>🖼️</b>Foto</button><button type="button" data-cm="video"><b>🎥</b>Vídeo</button><button type="button" data-cm="audio"><b>🎙️</b>Áudio</button><button type="button" data-cm="tag"><b>@</b>Marcar</button>`}
function chooseMedia(kind){if(busy||!activeForm)return;const input=document.createElement('input');input.type='file';input.hidden=true;input.accept=kind==='image'?'image/jpeg,image/png,image/webp,image/gif':kind==='video'?'video/mp4,video/webm,video/quicktime':'audio/mpeg,audio/mp4,audio/x-m4a,audio/webm,audio/ogg,audio/wav';document.body.appendChild(input);input.onchange=async()=>{const file=input.files?.[0];input.remove();if(!file)return;await uploadCommentMedia(kind,file)};input.click();resetSheet()}
async function uploadCommentMedia(kind,file){const post=postFor(activeForm);if(!post?.id)return toast('Publicação não encontrada.');busy=true;try{toast(kind==='image'?'Enviando foto no comentário…':kind==='video'?'Enviando vídeo no comentário…':'Enviando áudio no comentário…');const form=new FormData();form.append('postId',post.id);form.append('kind',kind);form.append('file',file);if(isExternal())form.append('accessToken',accessToken);const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/social-comment-media`,{method:'POST',headers:await authHeaders(),body:form,cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error||'Não foi possível enviar a mídia.');toast('Comentário enviado 💕');await refreshFeed()}catch(e){toast(e?.message||'Não foi possível enviar o comentário.')}finally{busy=false}}
async function refreshFeed(){if(isExternal()){if(typeof window.__ISA_OPEN_FAMILY_SOCIAL__==='function')await window.__ISA_OPEN_FAMILY_SOCIAL__();setTimeout(scan,120)}else{$('socialRefresh')?.click();setTimeout(scan,220)}}
async function signed(postId,path){const r=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/social-comment-media`,{method:'POST',headers:{...(await authHeaders()),'Content-Type':'application/json'},body:JSON.stringify({action:'sign',postId,path,...(isExternal()?{accessToken}:{})}),cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error||'Mídia indisponível');return d.url||''}
function markerIn(el){let hit=null;const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);while(walker.nextNode()){const n=walker.currentNode;if(/\[\[isa_comment_media\|/.test(n.nodeValue||'')){hit=n;break}}return hit}
async function hydrateComment(el){if(el.dataset.nr8MediaHydrated==='1')return;const n=markerIn(el);if(!n)return;const m=(n.nodeValue||'').match(/\[\[isa_comment_media\|(image|video|audio)\|([^|\]]+)\|([^\]]*)\]\]/);if(!m)return;el.dataset.nr8MediaHydrated='1';const post=postFor(el);if(!post?.id)return;const [,kind,path,mime]=m;n.nodeValue=(n.nodeValue||'').replace(m[0],'').trim();const box=document.createElement('div');box.className=`nr8-comment-media nr8-comment-${kind}`;box.innerHTML='<span>Carregando mídia…</span>';el.appendChild(box);try{const url=await signed(post.id,path);if(!url)throw new Error('Mídia indisponível');if(kind==='image')box.innerHTML=`<img src="${url}" alt="Foto enviada no comentário">`;else if(kind==='video')box.innerHTML=`<video src="${url}" controls playsinline preload="metadata"></video>`;else box.innerHTML=`<audio src="${url}" controls preload="metadata"></audio>`}catch{box.innerHTML='<span>Mídia indisponível.</span>'}}
function decorateForm(form){cleanWrongComposer(form);if(form.dataset.nr8CommentMenu==='1')return;form.dataset.nr8CommentMenu='1';const plus=document.createElement('button');plus.type='button';plus.className='nr8-comment-plus';plus.textContent='+';plus.title='Adicionar foto, vídeo, áudio ou marcar alguém';plus.setAttribute('aria-label','Opções do comentário');form.prepend(plus)}
function scan(){ensureCommentLayout();document.querySelectorAll(COMMENT_FORMS).forEach(decorateForm);document.querySelectorAll('.social-comment,.fs-comment,.fs75-comment').forEach(el=>hydrateComment(el))}
document.addEventListener('pointerdown',e=>{const form=e.target.closest?.(COMMENT_FORMS);if(form)closePublicationMenus();const s=$('nr8CommentSheet');if(s?.classList.contains('show')&&!s.contains(e.target)&&!e.target.closest?.('.nr8-comment-plus'))resetSheet()},{capture:true})
document.addEventListener('focusin',e=>{if(e.target.closest?.(COMMENT_FORMS))closePublicationMenus()},{capture:true})
document.addEventListener('click',e=>{const plus=e.target.closest?.('.nr8-comment-plus');if(!plus||!plus.closest(COMMENT_FORMS))return;e.preventDefault();e.stopImmediatePropagation();closePublicationMenus();placeSheet(plus)},{capture:true})
function boot(){ensureCommentLayout();ensureSheet();scan();for(const feed of [$('socialFeed'),$('fsFeed'),$('fs75Feed')].filter(Boolean)){if(feed.dataset.nr8CommentObserved)return;feed.dataset.nr8CommentObserved='1';new MutationObserver(()=>{clearTimeout(scanTimer);scanTimer=setTimeout(scan,80)}).observe(feed,{childList:true,subtree:true})}}
boot();let tries=0;const t=setInterval(()=>{boot();scan();if(++tries>40)clearInterval(t)},300)
window.__ISA_COMMENT_MEDIA_MENU__={scan,open:placeSheet,close:resetSheet}
