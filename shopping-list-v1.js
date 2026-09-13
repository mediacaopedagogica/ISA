import { CONFIG } from './config.js'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

(function(){
  'use strict'
  if(window.__ISA_SHOPPING_LIST_V1__)return
  window.__ISA_SHOPPING_LIST_V1__=true

  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const allowed=new Set(['keise','isa','alan'])
  const sb=createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}})
  const state={data:null,editing:null,open:false,busy:false,timer:null}

  function profile(){const q=norm(new URLSearchParams(location.search).get('perfil')),n=norm($('myName')?.textContent).split(/\s+/)[0];return allowed.has(q)?q:(allowed.has(n)?n:'')}
  function isKeise(){return state.data?.actor?.isKeise===true||profile()==='keise'}
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]))}
  function toast(text){const t=$('toast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._shop);t._shop=setTimeout(()=>t.classList.add('hidden'),3300)}
  function localDate(v){if(!v)return'';try{return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(v))}catch{return''}}
  function inputDate(v){if(!v)return'';const d=new Date(v),z=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`}
  function member(id){return state.data?.members?.find(m=>m.id===id)||null}
  function canManage(){return isKeise()}

  async function api(action,payload={}){
    const {data:{session}}=await sb.auth.getSession();if(!session)throw new Error('Entre novamente no Cantinho para usar a Lista de Compras.')
    const {data,error}=await sb.functions.invoke('shopping-list-actions',{body:{action,...payload}})
    if(error)throw new Error(error.message||'Não foi possível atualizar a Lista de Compras.');if(data?.error)throw new Error(data.error);return data
  }
  function ensureCss(){if($('isaShoppingCssLink'))return;const l=document.createElement('link');l.id='isaShoppingCssLink';l.rel='stylesheet';l.href='./shopping-list-v1.css?v=3-suggestions';document.head.appendChild(l)}

  function ensureModal(){
    ensureCss();let modal=$('isaShoppingModal');if(modal)return modal
    modal=document.createElement('div');modal.id='isaShoppingModal';modal.className='hidden';modal.innerHTML=`
      <div class="isl-shell" role="dialog" aria-modal="true" aria-labelledby="islTitle">
        <button class="isl-close" type="button" data-isl-close aria-label="Fechar">×</button>
        <div class="isl-head"><div class="isl-bag">🛒</div><div class="isl-title"><h2 id="islTitle">Lista de Compras</h2><p id="islSubtitle">Organize o que falta comprar.</p></div></div>
        <div id="islMembers" class="isl-members"></div><div id="islProgress" class="isl-progress"></div>
        <form id="islForm" class="isl-form">
          <div class="isl-field"><label id="islItemLabel">Item</label><input id="islName" maxlength="120" placeholder="Ex.: Leite" required></div>
          <div class="isl-field"><label>Quantidade</label><input id="islQty" maxlength="60" placeholder="Ex.: 2 un."></div>
          <div class="isl-field isl-owner-only"><label>Quem vai comprar?</label><select id="islAssigned"><option value="">Sem responsável</option></select></div>
          <div class="isl-field isl-owner-only"><label>Até quando?</label><input id="islDue" type="datetime-local"></div>
          <div class="isl-field isl-owner-only"><label>Lembrar de quanto em quanto?</label><select id="islReminder"><option value="5">5 min</option><option value="10">10 min</option><option value="15">15 min</option><option value="30">30 min</option><option value="60" selected>1 hora</option><option value="120">2 horas</option><option value="240">4 horas</option><option value="720">12 horas</option><option value="1440">1 dia</option></select></div>
          <button id="islSaveBtn" class="isl-save" type="submit">＋ Adicionar</button>
          <div class="isl-reminder-row isl-owner-only">
            <label class="isl-switch"><input id="islReminderEnabled" type="checkbox" checked><span>🔔 Lembrar até marcar como comprado</span></label>
            <label class="isl-switch"><input id="islSoundEnabled" type="checkbox"><span>🔊 Som urgente</span></label>
            <button id="islTestSound" class="isl-test-sound" type="button">▶ Testar som</button>
          </div>
        </form>
        <button id="islCancelEdit" class="isl-cancel-edit" type="button">Cancelar edição</button>
        <div id="islError" class="isl-error hidden"></div>
        <section id="islSuggestions" class="isl-suggestions hidden"><div class="isl-section-head"><div><span class="isl-section-kicker">💡 IDEIAS</span><h3 id="islSuggestionsTitle">Sugestões</h3></div><span id="islSuggestionsCount" class="isl-count"></span></div><div id="islSuggestionGrid" class="isl-suggestion-grid"></div></section>
        <div id="islGrid" class="isl-grid"></div>
        <div id="islNote" class="isl-note">🔔 Os lembretes continuam enquanto o item estiver pendente.</div>
      </div>`
    document.body.appendChild(modal);modal.addEventListener('click',onClick);$('islForm')?.addEventListener('submit',save);$('islCancelEdit')?.addEventListener('click',resetForm)
    $('islTestSound')?.addEventListener('click',()=>window.__ISA_URGENT_SOUND__?.test?.())
    $('islSoundEnabled')?.addEventListener('change',async()=>{if($('islSoundEnabled').checked){$('islReminderEnabled').checked=true;await window.__ISA_URGENT_SOUND__?.enable?.();if('Notification'in window&&Notification.permission==='default'){try{await Notification.requestPermission()}catch{}}await window.__ISA_URGENT_SOUND__?.play?.({urgent:true})}})
    return modal
  }

  function showError(text=''){const e=$('islError');if(!e)return;e.textContent=text;e.classList.toggle('hidden',!text)}
  function applyRoleUi(){
    const owner=isKeise();document.querySelectorAll('#isaShoppingModal .isl-owner-only').forEach(el=>el.classList.toggle('hidden',!owner))
    if($('islSubtitle'))$('islSubtitle').textContent=owner?'Você organiza a lista. Isa e Alan podem enviar sugestões para você.':'Você pode marcar o que já foi comprado e sugerir novos itens para Keise.'
    if($('islItemLabel'))$('islItemLabel').textContent=owner?'Item':'O que você quer sugerir?'
    if($('islSaveBtn')&&!state.editing)$('islSaveBtn').textContent=owner?'＋ Adicionar':'💡 Sugerir para Keise'
    if($('islNote'))$('islNote').textContent=owner?'🔔 Você decide o responsável, o intervalo e se cada item terá alerta sonoro.':'💡 A sugestão chega para Keise, que decide se entra na Lista de Compras.'
  }
  function renderSuggestions(){
    const box=$('islSuggestions'),grid=$('islSuggestionGrid'),rows=state.data?.suggestions||[];if(!box||!grid)return
    box.classList.toggle('hidden',!rows.length);if(!rows.length){grid.innerHTML='';return}
    $('islSuggestionsTitle').textContent=isKeise()?'Sugestões para você':'Minhas sugestões aguardando Keise';$('islSuggestionsCount').textContent=`${rows.length}`
    grid.innerHTML=rows.map(s=>{const who=member(s.suggested_by);return `<article class="isl-suggestion-card"><div class="isl-suggestion-icon">💡</div><div class="isl-suggestion-main"><strong>${esc(s.item_name)}</strong>${s.quantity?`<small>Quantidade: ${esc(s.quantity)}</small>`:''}${isKeise()?`<small>Sugerido por ${esc(who?.display_name||'familiar')}</small>`:'<small>Aguardando a Keise ✨</small>'}</div>${isKeise()?`<div class="isl-suggestion-actions"><button type="button" data-isl-accept-suggestion="${s.id}" class="isl-suggestion-accept">✓ Colocar na lista</button><button type="button" data-isl-decline-suggestion="${s.id}" class="isl-suggestion-decline">Agora não</button></div>`:''}</article>`}).join('')
  }
  function render(){
    if(!state.data)return;ensureModal();applyRoleUi();const {members,items}=state.data
    $('islMembers').innerHTML=members.map(m=>`<span class="isl-chip">${norm(m.display_name).startsWith('alan')?'🎸':norm(m.display_name).startsWith('isa')?'💜':'🌷'} ${esc(m.display_name)}</span>`).join('')
    const select=$('islAssigned'),current=select?.value||'';if(select){select.innerHTML='<option value="">Sem responsável</option>'+members.map(m=>`<option value="${m.id}">${esc(m.display_name)}</option>`).join('');if([...select.options].some(o=>o.value===current))select.value=current}
    const total=items.length,done=items.filter(i=>i.purchased).length,pct=total?Math.round(done*100/total):0;$('islProgress').innerHTML=`<div class="isl-progress-top"><span>${done} de ${total} comprados</span><span>${pct}% ⭐</span></div><div class="isl-track"><div class="isl-fill" style="width:${pct}%"></div></div>`
    renderSuggestions();const grid=$('islGrid');if(!items.length){grid.innerHTML='<div class="isl-empty">🛍️ A lista ainda está vazia.<br><small>'+(isKeise()?'Adicione o primeiro item acima.':'Você pode mandar uma sugestão para Keise acima.')+'</small></div>';return}
    grid.innerHTML=items.map(item=>{const assigned=member(item.assigned_to),due=localDate(item.due_at),reminder=item.reminder_enabled!==false;return `<article class="isl-card ${item.purchased?'purchased':''}" data-item="${item.id}"><button type="button" class="isl-check" data-isl-toggle="${item.id}" aria-label="${item.purchased?'Marcar como pendente':'Marcar como comprado'}">${item.purchased?'✓':''}</button><div class="isl-main"><div class="isl-name">${esc(item.emoji||'🛒')} ${esc(item.item_name)}</div>${item.quantity?`<div class="isl-qty">Quantidade: ${esc(item.quantity)}</div>`:''}<div class="isl-meta">${assigned?`<span class="isl-chip">👤 ${esc(assigned.display_name)}</span>`:'<span class="isl-chip">👤 sem responsável</span>'}${due?`<span class="isl-chip">⏰ ${due}</span>`:''}<span class="isl-chip">${reminder?`🔔 ${Number(item.reminder_minutes)||60} min`:'🔕 sem lembrete'}</span>${item.sound_enabled?'<span class="isl-chip isl-sound-chip">🔊 som urgente</span>':''}<span class="isl-chip">${item.purchased?'✅ comprado':'🛒 pendente'}</span></div>${canManage()?`<div class="isl-actions"><button class="isl-action" type="button" data-isl-edit="${item.id}">✏️ Editar</button><button class="isl-action danger" type="button" data-isl-delete="${item.id}">🗑️ Excluir</button></div>`:''}</div></article>`}).join('')
  }

  async function refresh(silent=false){if(state.busy)return;state.busy=true;try{state.data=await api('get');showError();render()}catch(e){if(!silent){showError(e.message);toast(e.message)}}finally{state.busy=false}}
  function resetForm(){state.editing=null;$('islForm')?.reset();if($('islReminder'))$('islReminder').value='60';if($('islReminderEnabled'))$('islReminderEnabled').checked=true;if($('islSoundEnabled'))$('islSoundEnabled').checked=false;$('islSaveBtn').textContent=isKeise()?'＋ Adicionar':'💡 Sugerir para Keise';$('islCancelEdit').classList.remove('show');showError();applyRoleUi()}
  function editItem(item){if(!isKeise())return;state.editing=item.id;$('islName').value=item.item_name||'';$('islQty').value=item.quantity||'';$('islAssigned').value=item.assigned_to||'';$('islDue').value=inputDate(item.due_at);$('islReminder').value=String(item.reminder_minutes||60);$('islReminderEnabled').checked=item.reminder_enabled!==false;$('islSoundEnabled').checked=!!item.sound_enabled;$('islSaveBtn').textContent='💾 Salvar alteração';$('islCancelEdit').classList.add('show');$('islName').focus()}

  async function save(e){
    e.preventDefault();if(state.busy)return;const payload={itemName:$('islName').value,quantity:$('islQty').value}
    if(isKeise())Object.assign(payload,{assignedTo:$('islAssigned').value||null,dueAt:$('islDue').value||null,reminderEnabled:$('islReminderEnabled').checked,reminderMinutes:Number($('islReminder').value||60),soundEnabled:$('islSoundEnabled').checked})
    if(payload.soundEnabled)payload.reminderEnabled=true;state.busy=true;$('islSaveBtn').disabled=true
    try{if(!isKeise()){await api('suggest',payload);toast('Sugestão enviada para Keise 💡')}else if(state.editing){await api('edit',{itemId:state.editing,...payload});toast('Item atualizado ✨')}else{await api('add',payload);toast('Item adicionado 🛒')}resetForm()}catch(e){showError(e.message);toast(e.message)}finally{state.busy=false;$('islSaveBtn').disabled=false;await refresh()}
  }
  async function resolveSuggestion(id,accept){try{await api('resolve_suggestion',{suggestionId:id,accept});toast(accept?'Sugestão colocada na lista ✅':'Sugestão arquivada 💜');await refresh()}catch(err){toast(err.message)}}
  async function onClick(e){
    if(e.target.closest('[data-isl-close]')||e.target===e.currentTarget){close();return}
    const a=e.target.closest('[data-isl-accept-suggestion]');if(a){await resolveSuggestion(a.dataset.islAcceptSuggestion,true);return}const d=e.target.closest('[data-isl-decline-suggestion]');if(d){await resolveSuggestion(d.dataset.islDeclineSuggestion,false);return}
    const toggle=e.target.closest('[data-isl-toggle]');if(toggle){const item=state.data?.items?.find(i=>i.id===toggle.dataset.islToggle);if(!item)return;try{await api('toggle',{itemId:item.id,purchased:!item.purchased});toast(item.purchased?'Voltou para pendente 🛒':'Item comprado ✅');await refresh()}catch(err){toast(err.message)}return}
    const edit=e.target.closest('[data-isl-edit]');if(edit){const item=state.data?.items?.find(i=>i.id===edit.dataset.islEdit);if(item)editItem(item);return}
    const del=e.target.closest('[data-isl-delete]');if(del){const item=state.data?.items?.find(i=>i.id===del.dataset.islDelete);if(!item||!confirm(`Excluir “${item.item_name}”?`))return;try{await api('delete',{itemId:item.id});toast('Item excluído');resetForm();await refresh()}catch(err){toast(err.message)}}
  }

  async function open(){if(!profile())return;ensureModal().classList.remove('hidden');state.open=true;await refresh();clearInterval(state.timer);state.timer=setInterval(()=>state.open&&refresh(true),15000)}
  function close(){state.open=false;$('isaShoppingModal')?.classList.add('hidden');clearInterval(state.timer);state.timer=null;resetForm()}
  function injectButton(){if(!profile())return false;const grid=document.querySelector('#keiseApprovedHome .ka-grid');if(!grid)return false;if($('isaShoppingFeatureBtn'))return true;const b=document.createElement('button');b.id='isaShoppingFeatureBtn';b.type='button';b.className='ka-feature';b.innerHTML='<span class="ka-feature-icon">🛒</span><span>Compras</span>';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();open()},true);grid.appendChild(b);return true}
  function scan(){ensureModal();injectButton();if(new URLSearchParams(location.search).get('abrir')==='compras'&&profile()&&!state.open)setTimeout(open,150)}
  window.__ISA_SHOPPING_LIST__={open,close,refresh,scan};document.addEventListener('isa:approved-home-ready',scan);document.addEventListener('isa:keise-approved-home-built',scan);document.addEventListener('DOMContentLoaded',scan,{once:true});scan();setTimeout(scan,800);setTimeout(scan,1900)
})();
