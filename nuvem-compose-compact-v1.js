/* Nossa Rede — compositor compacto: + rosa, menu simples e frase manuscrita. */
import('./nossa-rede-final-lock-v1.js?v=1-stable-current').catch(()=>null);
(function(){
  const q=(s,r=document)=>r?.querySelector?.(s)||null,qa=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])];
  const TITLE='Compartilhe bons momentos e recordações 💕';
  import('./message-reaction-delegate-v2.js?v=3-pastel-reactions').then(()=>window.__ISA_REACTION_DELEGATE_REFRESH__?.()).catch(()=>null);

  function forceTitlePatch(){
    if(!document.getElementById('nuvemShareTitleInlineCss')){
      const s=document.createElement('style');s.id='nuvemShareTitleInlineCss';s.textContent=`
        #socialPanel .social-composer::before,#familySocialOverlay .social-composer::before{content:none!important;display:none!important}
        #socialPanel .social-composer::after,#familySocialOverlay .social-composer::after{content:none!important;display:none!important}
        #socialPanel .nuvem-share-title,#familySocialOverlay .nuvem-share-title{
          display:block!important;width:fit-content!important;max-width:340px!important;margin:0 0 12px 2px!important;padding:0!important;
          font-family:"Segoe Print","Bradley Hand","Comic Sans MS",cursive!important;font-size:22px!important;line-height:1.12!important;
          font-style:italic!important;font-weight:800!important;letter-spacing:.1px!important;color:#ef58a8!important;
          text-shadow:0 1px 0 rgba(255,255,255,.98),0 3px 9px rgba(239,88,168,.12)!important;
          transform:rotate(-1deg)!important;text-align:left!important
        }
        @media(max-width:760px){#socialPanel .nuvem-share-title,#familySocialOverlay .nuvem-share-title{font-size:18px!important;max-width:270px!important;line-height:1.16!important}}
      `;document.head.appendChild(s)
    }
    qa('#socialPanel .social-composer,#familySocialOverlay .social-composer').forEach(comp=>{
      qa(':scope > .nuvem-share-title',comp).slice(1).forEach(x=>x.remove());
      let t=q(':scope > .nuvem-share-title',comp);
      if(!t){t=document.createElement('div');t.className='nuvem-share-title';const ta=q('textarea',comp);comp.insertBefore(t,ta||comp.firstChild)}
      t.textContent=TITLE;
    });
  }

  forceTitlePatch();
  if(window.__NUVEM_COMPOSE_COMPACT_V1__){
    let t=0;const o=new MutationObserver(()=>{clearTimeout(t);t=setTimeout(forceTitlePatch,90)});o.observe(document.documentElement,{childList:true,subtree:true});
    [250,700,1400,2600].forEach(ms=>setTimeout(forceTitlePatch,ms));return;
  }
  window.__NUVEM_COMPOSE_COMPACT_V1__=true;

  function css(){
    let l=document.getElementById('nuvemComposeCompactCss');
    if(!l){l=document.createElement('link');l.id='nuvemComposeCompactCss';l.rel='stylesheet';document.head.appendChild(l)}
    l.href='./nuvem-compose-compact-v1.css?v=5-pink-simple';
    if(document.head.lastElementChild!==l)document.head.appendChild(l);
  }
  function ensureTitle(comp){forceTitlePatch();return q(':scope > .nuvem-share-title',comp)}
  function ids(root){return root?.id==='familySocialOverlay'?{media:'fsMedia',location:'fsLocation',publish:'fsPublish'}:{media:'socialMediaInput',location:'socialLocation',publish:'socialPublish'}}
  function closeMenus(except=null){qa('.nuvem-compose-menu.show').forEach(m=>{if(m!==except){m.classList.remove('show');m.closest('.nuvem-compose-compact')?.querySelector('.nuvem-compose-plus')?.setAttribute('aria-expanded','false')}})}
  function clickMark(comp){const b=q('[data-compose="mark"]',comp)||q('.nr5-tag-add',comp);if(b){b.click();return true}return false}
  function syncSelected(comp,wrap){const tags=q('.nr5-selected-tags',comp);if(tags&&tags.parentElement!==wrap)wrap.appendChild(tags);const has=!!tags&&!!q('.nr5-selected-tag',tags);wrap.classList.toggle('has-tags',has)}

  function decorate(root){
    const comp=q('.social-composer',root);if(!comp)return false;css();ensureTitle(comp);
    const map=ids(root),media=document.getElementById(map.media),loc=document.getElementById(map.location),publish=document.getElementById(map.publish);
    if(!media||!publish)return false;
    if(comp.dataset.nuvemCompact==='1'){
      ensureTitle(comp);const sel=q('.nuvem-selected-tags',comp);if(sel)syncSelected(comp,sel);return true;
    }
    comp.dataset.nuvemCompact='1';comp.classList.add('nuvem-compact-ready');
    const emojiRow=q('.social-emoji-row',comp);emojiRow?.classList.remove('show');
    const box=document.createElement('div');box.className='nuvem-compose-compact';
    box.innerHTML=`<div class="nuvem-compose-menu" role="menu">
      <button type="button" data-nuvem-compose="upload" role="menuitem"><span class="nuvem-icon-soft upload">🖼️</span><b>Upload</b><small>1, 2 ou 3 fotos/vídeos</small></button>
      <button type="button" data-nuvem-compose="mark" role="menuitem"><span class="nuvem-icon-soft mark">@</span><b>Marcar</b><small>opcional</small></button>
      <button type="button" data-nuvem-compose="location" role="menuitem"><span class="nuvem-icon-soft location">📍</span><b>Localização</b><small>opcional</small></button>
    </div><div class="nuvem-location-row"></div><div class="nuvem-selected-tags"></div><div class="nuvem-compose-bar"><button class="nuvem-compose-plus" type="button" aria-label="Adicionar opções" aria-expanded="false">＋</button><span class="nuvem-compose-spacer"></span><button class="nuvem-compose-emoji" type="button" aria-label="Adicionar emoji" title="Emoji">😊</button></div>`;
    const oldActions=q('.social-compose-actions',comp),preview=q('#socialPreview,#fsPreview',comp);
    (oldActions||preview||emojiRow||q('textarea',comp))?.insertAdjacentElement('afterend',box);
    const bar=q('.nuvem-compose-bar',box),menu=q('.nuvem-compose-menu',box),plus=q('.nuvem-compose-plus',box),emoji=q('.nuvem-compose-emoji',box),locationRow=q('.nuvem-location-row',box),selected=q('.nuvem-selected-tags',box);
    bar.appendChild(publish);
    if(loc){locationRow.appendChild(loc);loc.placeholder='📍 Localização (opcional)'}
    syncSelected(comp,selected);
    plus.onclick=e=>{e.preventDefault();e.stopPropagation();const opening=!menu.classList.contains('show');closeMenus(menu);menu.classList.toggle('show',opening);plus.setAttribute('aria-expanded',opening?'true':'false')};
    q('[data-nuvem-compose="upload"]',menu).onclick=e=>{e.preventDefault();menu.classList.remove('show');plus.setAttribute('aria-expanded','false');media.multiple=true;media.click()};
    q('[data-nuvem-compose="mark"]',menu).onclick=e=>{e.preventDefault();menu.classList.remove('show');plus.setAttribute('aria-expanded','false');if(!clickMark(comp)){const ta=q('textarea',comp);if(ta){ta.value+=(ta.value?' ':'')+'@';ta.focus()}}};
    q('[data-nuvem-compose="location"]',menu).onclick=e=>{e.preventDefault();menu.classList.remove('show');plus.setAttribute('aria-expanded','false');locationRow.classList.toggle('show');if(locationRow.classList.contains('show'))setTimeout(()=>loc?.focus(),30)};
    emoji.onclick=e=>{e.preventDefault();e.stopPropagation();emojiRow?.classList.toggle('show');if(emojiRow?.classList.contains('show'))emojiRow.scrollIntoView({behavior:'smooth',block:'nearest'})};
    return true;
  }

  function scan(){css();forceTitlePatch();['socialPanel','familySocialOverlay'].forEach(id=>{const root=document.getElementById(id);if(root)decorate(root)})}
  document.addEventListener('pointerdown',e=>{if(!e.target.closest?.('.nuvem-compose-compact'))closeMenus()},true);
  const obs=new MutationObserver(()=>{clearTimeout(obs._t);obs._t=setTimeout(scan,90)});obs.observe(document.documentElement,{childList:true,subtree:true});
  scan();[250,700,1400,2600].forEach(ms=>setTimeout(scan,ms));
  window.__ISA_NUVEM_COMPACT_COMPOSER__={scan};
})();
