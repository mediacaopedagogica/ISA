/*
 * Nuvem — carrossel 1/2/3 mídias na Nossa Rede.
 * Permite adicionar arquivos em etapas (inclusive no celular), limita novas publicações
 * a 3 mídias e transforma publicações externas com 2+ itens em carrossel deslizável.
 */
(function(){
  if(window.__ISA_NUVEM_CAROUSEL_V1__)return;
  window.__ISA_NUVEM_CAROUSEL_V1__=true;

  const q=(s,r=document)=>r?.querySelector?.(s)||null;
  const qa=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])];
  const stash=new WeakMap(),beforeOpen=new WeakMap();
  let scanTimer=0;

  function css(){
    if(document.getElementById('nuvemCarouselCss'))return;
    const s=document.createElement('style');s.id='nuvemCarouselCss';s.textContent=`
      .nuvem-media-count{display:inline-flex;align-items:center;gap:5px;margin:7px 0 2px;padding:5px 9px;border-radius:999px;background:linear-gradient(145deg,#fff,#f3edff);border:1px solid rgba(255,255,255,.98);box-shadow:0 6px 13px rgba(80,58,107,.10);color:#65527a;font-size:10px;font-weight:900}
      .nuvem-media-count:before{content:'▣';color:#9b63db;font-size:13px}
      #socialPreview.social-preview{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(92px,1fr))!important;gap:8px!important;overflow:visible!important}
      #socialPreview .social-preview-item{min-width:0!important;height:150px!important;border-radius:18px!important;overflow:hidden!important;background:#f8f3fc!important;box-shadow:0 8px 18px rgba(77,55,102,.10)!important}
      #socialPreview .social-preview-item img,#socialPreview .social-preview-item video{width:100%!important;height:100%!important;object-fit:cover!important}

      .nuvem-fs-carousel{position:relative!important;display:block!important;overflow:hidden!important;background:#f7f1fb!important;border-radius:20px!important;touch-action:pan-y!important}
      .nuvem-fs-track{display:flex!important;width:100%!important;transition:transform .32s cubic-bezier(.22,.75,.28,1)!important;will-change:transform!important}
      .nuvem-fs-track>img,.nuvem-fs-track>video{flex:0 0 100%!important;width:100%!important;max-width:100%!important;height:min(72vw,520px)!important;object-fit:contain!important;background:#171419!important;display:block!important}
      .nuvem-carousel-arrow{position:absolute;z-index:5;top:50%;transform:translateY(-50%);width:40px;height:40px;border:1px solid rgba(255,255,255,.94);border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.88);backdrop-filter:blur(12px);box-shadow:0 8px 18px rgba(55,39,73,.20);color:#75469e;font-size:27px;line-height:1;cursor:pointer}
      .nuvem-carousel-arrow.prev{left:9px}.nuvem-carousel-arrow.next{right:9px}
      .nuvem-carousel-dots{position:absolute;z-index:5;left:50%;bottom:11px;transform:translateX(-50%);display:flex;align-items:center;gap:6px;padding:5px 8px;border-radius:999px;background:rgba(255,255,255,.80);backdrop-filter:blur(9px)}
      .nuvem-carousel-dot{width:7px;height:7px;border:0;border-radius:50%;padding:0;background:#d1c4df;box-shadow:none}.nuvem-carousel-dot.active{width:19px;border-radius:999px;background:#a666d8}
      .nuvem-carousel-counter{position:absolute;z-index:5;right:10px;top:10px;padding:5px 8px;border-radius:999px;background:rgba(55,39,70,.62);color:white;font:800 10px/1 Inter,"Segoe UI",sans-serif;backdrop-filter:blur(8px)}
      .social-carousel{touch-action:pan-y!important;position:relative!important}
      .social-carousel>.nuvem-carousel-counter{right:10px;top:10px}
      .nuvem-upload-hint{font-size:9px!important;color:#8b79a0!important;font-weight:750!important}
      @media(max-width:620px){
        #socialPreview .social-preview-item{height:112px!important}
        .nuvem-carousel-arrow{width:35px;height:35px;font-size:23px}
        .nuvem-fs-track>img,.nuvem-fs-track>video{height:min(92vw,470px)!important}
      }
    `;document.head.appendChild(s);
  }

  function toast(input,text){
    const external=!!input.closest?.('#familySocialOverlay');const t=document.getElementById(external?'friendToast':'toast');
    if(!t)return; t.textContent=text;t.classList.remove('hidden');clearTimeout(t._carousel);t._carousel=setTimeout(()=>t.classList.add('hidden'),2600);
  }
  function fileKey(f){return `${f.name}|${f.size}|${f.lastModified}|${f.type}`}
  function dedupe(list){const seen=new Set();return list.filter(f=>{const k=fileKey(f);if(seen.has(k))return false;seen.add(k);return true})}
  function setFiles(input,files){
    try{const dt=new DataTransfer();files.forEach(f=>dt.items.add(f));input.files=dt.files;return true}catch(e){console.warn('Carrossel: navegador não permitiu combinar seleções.',e);return false}
  }
  function counterFor(input){
    const comp=input.closest?.('.social-composer');if(!comp)return null;
    let c=q('.nuvem-media-count',comp);if(!c){c=document.createElement('div');c.className='nuvem-media-count';const preview=q('#socialPreview,#fsPreview',comp);(preview||input).insertAdjacentElement('afterend',c)}return c;
  }
  function updateCounter(input,files=stash.get(input)||[...input.files||[]]){
    const c=counterFor(input);if(!c)return;c.textContent=`${files.length} de 3 mídias selecionadas`;c.style.display=files.length?'inline-flex':'none';
    const menu=input.closest?.('.social-composer')?.querySelector?.('[data-nuvem-compose="upload"] small');if(menu){menu.textContent='1, 2 ou 3 fotos/vídeos';menu.classList.add('nuvem-upload-hint')}
  }
  function resetIfPublished(input){
    const comp=input.closest?.('.social-composer'),preview=q('#socialPreview,#fsPreview',comp);const pub=q('#socialPublish,#fsPublish',comp);
    if(input.value===''&&(!preview||preview.children.length===0)&&(!pub||!/Publicando/i.test(pub.textContent||''))){stash.set(input,[]);beforeOpen.set(input,[]);updateCounter(input,[])}
  }
  function bindInput(input){
    if(!input||input.dataset.nuvemCarouselBound==='1')return;
    input.dataset.nuvemCarouselBound='1';input.multiple=true;
    const snapshot=()=>{const now=input.value?[...input.files]:[];beforeOpen.set(input,now);if(!now.length&&q('#socialPreview,#fsPreview',input.closest?.('.social-composer'))?.children.length===0)stash.set(input,[])};
    input.addEventListener('pointerdown',snapshot,true);input.addEventListener('click',snapshot,true);
    input.addEventListener('change',e=>{
      const chosen=[...input.files],base=beforeOpen.get(input)||stash.get(input)||[];let merged=dedupe([...base,...chosen]);const hadExtra=merged.length>3;merged=merged.slice(0,3);
      if(base.length||hadExtra)setFiles(input,merged);stash.set(input,merged);updateCounter(input,merged);if(hadExtra)toast(input,'O carrossel aceita até 3 fotos ou vídeos. ✨');
    },true);
    updateCounter(input,[]);
  }

  function swipe(el,prev,next){
    if(!el||el.dataset.nuvemSwipe==='1')return;el.dataset.nuvemSwipe='1';let x=0,y=0,active=false;
    el.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;active=true;x=e.clientX;y=e.clientY},{passive:true});
    el.addEventListener('pointerup',e=>{if(!active)return;active=false;const dx=e.clientX-x,dy=e.clientY-y;if(Math.abs(dx)>42&&Math.abs(dx)>Math.abs(dy)*1.25){dx<0?next():prev()}},{passive:true});
  }

  function decorateMain(car){
    if(!car)return;const slides=qa(':scope > .social-slide',car);if(!slides.length)return;
    let c=q(':scope > .nuvem-carousel-counter',car);if(!c){c=document.createElement('span');c.className='nuvem-carousel-counter';car.appendChild(c)}
    const update=()=>{const idx=Math.max(0,slides.findIndex(s=>s.classList.contains('active')));c.textContent=`${idx+1} / ${slides.length}`;c.style.display=slides.length>1?'block':'none'};
    update();
    if(car.dataset.nuvemMainCarousel!=='1'){
      car.dataset.nuvemMainCarousel='1';const prev=()=>q('[data-carousel-prev]',car)?.click(),next=()=>q('[data-carousel-next]',car)?.click();swipe(car,prev,next);
      new MutationObserver(update).observe(car,{subtree:true,attributes:true,attributeFilter:['class']});
    }
  }

  function decorateExternal(grid){
    if(!grid||grid.dataset.nuvemCarousel==='1')return;
    const media=qa(':scope > img,:scope > video',grid);if(!media.length)return;
    if(media.length===1){grid.dataset.nuvemCarousel='single';return}
    grid.dataset.nuvemCarousel='1';grid.classList.add('nuvem-fs-carousel');
    const track=document.createElement('div');track.className='nuvem-fs-track';media.forEach(m=>track.appendChild(m));grid.prepend(track);
    let index=0;
    const prev=document.createElement('button'),next=document.createElement('button'),dots=document.createElement('div'),count=document.createElement('span');
    prev.type=next.type='button';prev.className='nuvem-carousel-arrow prev';next.className='nuvem-carousel-arrow next';prev.textContent='‹';next.textContent='›';dots.className='nuvem-carousel-dots';count.className='nuvem-carousel-counter';
    media.forEach((_,i)=>{const d=document.createElement('button');d.type='button';d.className='nuvem-carousel-dot';d.dataset.index=String(i);dots.appendChild(d)});
    grid.append(prev,next,dots,count);
    const go=n=>{index=(n+media.length)%media.length;track.style.transform=`translateX(-${index*100}%)`;qa('.nuvem-carousel-dot',dots).forEach((d,i)=>d.classList.toggle('active',i===index));count.textContent=`${index+1} / ${media.length}`;media.forEach((m,i)=>{if(i!==index&&m.tagName==='VIDEO')try{m.pause()}catch{}})};
    prev.onclick=e=>{e.preventDefault();e.stopPropagation();go(index-1)};next.onclick=e=>{e.preventDefault();e.stopPropagation();go(index+1)};dots.onclick=e=>{const d=e.target.closest?.('.nuvem-carousel-dot');if(d)go(Number(d.dataset.index)||0)};swipe(grid,()=>go(index-1),()=>go(index+1));go(0);
  }

  function scan(){
    css();['socialMediaInput','fsMedia'].forEach(id=>bindInput(document.getElementById(id)));
    qa('.social-carousel').forEach(decorateMain);qa('.fs-media-grid').forEach(decorateExternal);
    ['socialMediaInput','fsMedia'].forEach(id=>{const inp=document.getElementById(id);if(inp)resetIfPublished(inp)});
  }
  const obs=new MutationObserver(()=>{clearTimeout(scanTimer);scanTimer=setTimeout(scan,80)});obs.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(e.target.closest?.('#socialPublish,#fsPublish'))setTimeout(scan,500)},true);
  scan();[300,800,1500,2600,5000].forEach(ms=>setTimeout(scan,ms));
  window.__ISA_NUVEM_CAROUSEL__={scan};
})();
