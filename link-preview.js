const URL_RE=/((?:https?:\/\/|www\.)[^\s<]+)/gi
let linkifyTimer=null

function cleanUrl(raw){return String(raw||'').replace(/[\])},.!?;:]+$/,'')}
function normalizeUrl(raw){const c=cleanUrl(raw);return /^www\./i.test(c)?`https://${c}`:c}
function parseVideo(raw){
  let u;try{u=new URL(normalizeUrl(raw))}catch{return null}
  const h=u.hostname.replace(/^www\./,'').toLowerCase()
  if(h==='youtu.be'){
    const id=u.pathname.split('/').filter(Boolean)[0];if(id)return {type:'youtube',src:`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`}
  }
  if(h.endsWith('youtube.com')){
    let id=u.searchParams.get('v')
    if(!id){const p=u.pathname.split('/').filter(Boolean);if(['shorts','embed','live'].includes(p[0]))id=p[1]}
    if(id)return {type:'youtube',src:`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`}
  }
  if(h==='vimeo.com'||h.endsWith('.vimeo.com')){
    const id=u.pathname.split('/').filter(Boolean).find(x=>/^\d+$/.test(x));if(id)return {type:'vimeo',src:`https://player.vimeo.com/video/${id}`}
  }
  if(/\.(mp4|webm|ogg)$/i.test(u.pathname))return {type:'direct',src:u.href}
  return null
}
function ensureUi(){
  if(document.getElementById('isaLinkPreviewCss'))return
  const s=document.createElement('style');s.id='isaLinkPreviewCss';s.textContent=`
  .isa-chat-link{color:#7356b7;text-decoration:underline;text-decoration-thickness:1.5px;text-underline-offset:2px;overflow-wrap:anywhere;font-weight:750}.isa-chat-link:visited{color:#8d5b9f}
  .isa-video-open{display:inline-flex;align-items:center;gap:6px;margin:7px 0 1px;border:0;border-radius:12px;padding:7px 10px;background:#eee5ff;color:#645273;font-weight:900;cursor:pointer;box-shadow:0 5px 12px rgba(79,59,93,.08)}
  .isa-video-drawer{position:fixed;z-index:9800;right:18px;top:78px;width:min(440px,calc(100vw - 36px));max-height:calc(100vh - 96px);border-radius:24px;background:linear-gradient(145deg,#fffafd,#f0e8ff);box-shadow:0 24px 70px rgba(55,38,70,.28);padding:14px;display:none}.isa-video-drawer.open{display:block}.isa-video-head{display:flex;gap:10px;align-items:center;margin-bottom:10px}.isa-video-head strong{flex:1;color:#654f70}.isa-video-close{border:0;width:36px;height:36px;border-radius:12px;background:#fff;cursor:pointer;font-size:18px}.isa-video-frame{position:relative;width:100%;aspect-ratio:16/9;border-radius:18px;overflow:hidden;background:#211a28}.isa-video-frame iframe,.isa-video-frame video{position:absolute;inset:0;width:100%;height:100%;border:0;background:#000}.isa-video-url{display:block;margin-top:9px;color:#7356b7;overflow-wrap:anywhere;font-size:.78rem}
  @media(max-width:760px){.isa-video-drawer{left:10px;right:10px;top:auto;bottom:10px;width:auto;max-height:75vh}}
  `;document.head.appendChild(s)
  const d=document.createElement('aside');d.id='isaVideoDrawer';d.className='isa-video-drawer';d.innerHTML='<div class="isa-video-head"><span>🎬</span><strong>Visualizar vídeo</strong><button class="isa-video-close" type="button" aria-label="Fechar">✕</button></div><div id="isaVideoFrame" class="isa-video-frame"></div><a id="isaVideoOriginal" class="isa-video-url" target="_blank" rel="noopener noreferrer">Abrir link original ↗</a>';document.body.appendChild(d);d.querySelector('.isa-video-close').onclick=closeVideo
}
function closeVideo(){const d=document.getElementById('isaVideoDrawer');if(!d)return;d.classList.remove('open');const f=document.getElementById('isaVideoFrame');if(f)f.innerHTML=''}
function openVideo(url){
  const href=normalizeUrl(url);ensureUi();const v=parseVideo(href);if(!v)return window.open(href,'_blank','noopener,noreferrer')
  const d=document.getElementById('isaVideoDrawer'),f=document.getElementById('isaVideoFrame'),a=document.getElementById('isaVideoOriginal');f.innerHTML='';a.href=href
  if(v.type==='direct'){const el=document.createElement('video');el.controls=true;el.autoplay=false;el.preload='metadata';el.src=v.src;f.appendChild(el)}
  else{const el=document.createElement('iframe');el.src=v.src;el.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';el.referrerPolicy='strict-origin-when-cross-origin';el.allowFullscreen=true;el.title='Vídeo compartilhado';f.appendChild(el)}
  d.classList.add('open')
}
function splitTextNode(node){
  const text=node.nodeValue||'';URL_RE.lastIndex=0;if(!URL_RE.test(text))return;URL_RE.lastIndex=0
  const frag=document.createDocumentFragment();let last=0,m
  while((m=URL_RE.exec(text))){
    if(m.index>last)frag.appendChild(document.createTextNode(text.slice(last,m.index)))
    const raw=m[0],display=cleanUrl(raw),url=normalizeUrl(raw),trail=raw.slice(display.length),a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.className='isa-chat-link';a.textContent=display;a.onclick=e=>e.stopPropagation();frag.appendChild(a)
    if(parseVideo(url)){const spacer=document.createTextNode(' '),b=document.createElement('button');b.type='button';b.className='isa-video-open';b.textContent='▶ Ver vídeo';b.dataset.videoUrl=url;b.onclick=e=>{e.preventDefault();e.stopPropagation();openVideo(url)};frag.append(spacer,b)}
    if(trail)frag.appendChild(document.createTextNode(trail));last=m.index+raw.length
  }
  if(last<text.length)frag.appendChild(document.createTextNode(text.slice(last)));node.replaceWith(frag)
}
function candidateRoots(){return [...document.querySelectorAll('#messages .bubble > div:not(.photo-loading):not(.photo-expired):not([class*="audio"]), #friendMessages .friend-bubble > div:not(.friend-photo-wrap):not(.friend-photo-note)')]}
function linkify(){
  ensureUi();for(const root of candidateRoots()){
    if(root.dataset.linkified==='1')continue
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement?.closest('a,button,script,style')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(splitTextNode);root.dataset.linkified='1'
  }
}
function schedule(){clearTimeout(linkifyTimer);linkifyTimer=setTimeout(linkify,80)}
function observeBox(id){const box=document.getElementById(id);if(!box||box.dataset.linkPreviewObserved==='1')return;box.dataset.linkPreviewObserved='1';const obs=new MutationObserver(schedule);obs.observe(box,{childList:true,subtree:true})}
ensureUi();observeBox('messages');observeBox('friendMessages');schedule()
