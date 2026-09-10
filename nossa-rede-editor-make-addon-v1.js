/* Complemento do editor: aba Make com presets e detalhes cosméticos divertidos. */
(function(){
  if(window.__ISA_NOSSA_REDE_MAKE_ADDON__)return;window.__ISA_NOSSA_REDE_MAKE_ADDON__=true
  let timer=0
  function patch(){
    const o=document.getElementById('isaMediaEditorV3');if(!o||o.dataset.makeAddon==='1')return false
    const tabs=o.querySelector('.isa-editor-tabs'),party=o.querySelector('[data-tab="party"]');if(!tabs)return false
    const tab=document.createElement('button');tab.type='button';tab.className='isa-editor-tab';tab.dataset.tab='make';tab.textContent='💄 Make';tabs.insertBefore(tab,party||null)
    const panel=document.createElement('div');panel.className='isa-editor-panel';panel.dataset.panel='make';panel.innerHTML='<div class="isa-editor-grid"><button class="isa-editor-choice" type="button" data-filter="make"><span class="big">💄</span>Make rosa</button><button class="isa-editor-choice" type="button" data-filter="glow"><span class="big">✨</span>Glow</button><button class="isa-editor-choice" type="button" data-filter="rose"><span class="big">🌷</span>Rosé</button><button class="isa-editor-choice" type="button" data-sticker="💄"><span class="big">💄</span>Batom</button><button class="isa-editor-choice" type="button" data-sticker="💋"><span class="big">💋</span>Beijinho</button><button class="isa-editor-choice" type="button" data-sticker="👄"><span class="big">👄</span>Lábios</button><button class="isa-editor-choice" type="button" data-sticker="🎀"><span class="big">🎀</span>Laço</button><button class="isa-editor-choice" type="button" data-sticker="✨"><span class="big">✨</span>Brilhinhos</button></div><small style="display:block;margin-top:8px;color:#96839b;font-size:9px">Os itens são opcionais e podem ser combinados com filtros, emojis e dizeres.</small>'
    const partyPanel=o.querySelector('[data-panel="party"]');partyPanel?.parentElement?.insertBefore(panel,partyPanel)
    o.dataset.makeAddon='1';return true
  }
  new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(patch,60)}).observe(document.documentElement,{childList:true,subtree:true})
  patch();[300,900,1800].forEach(ms=>setTimeout(patch,ms))
  window.__ISA_PATCH_MEDIA_MAKE__=patch
})();
