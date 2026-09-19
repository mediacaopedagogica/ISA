import { CONFIG } from './config.js'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Quadro do Dia — controles isolados de lembrete/som por atividade.
// Não substitui nem re-renderiza o Quadro; apenas decora os cards existentes.
(function(){
  'use strict'
  if(window.__ISA_DAILY_TASK_REMINDERS_V1__)return
  window.__ISA_DAILY_TASK_REMINDERS_V1__=true

  const db=createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}})
  const cache=new Map()
  let bodyObserver=null,loading=false,lastSignature=''
  const $=id=>document.getElementById(id)
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))
  function toast(text){const t=$('toast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._dtr);t._dtr=setTimeout(()=>t.classList.add('hidden'),3300)}

  function ensureCss(){
    if($('dailyTaskReminderControlsCss'))return
    const s=document.createElement('style');s.id='dailyTaskReminderControlsCss';s.textContent=`
      #dailyTaskBoardModal .dtr-panel{width:100%;margin-top:10px;padding:10px 11px;border:1px solid rgba(211,190,224,.78);border-radius:18px;background:rgba(255,255,255,.58);display:flex;flex-wrap:wrap;align-items:center;gap:8px;color:#665271;font:800 11px/1.2 Inter,system-ui,sans-serif}
      #dailyTaskBoardModal .dtr-label{display:inline-flex;align-items:center;gap:6px;min-height:34px;padding:6px 10px;border-radius:999px;background:rgba(255,255,255,.82);border:1px solid rgba(220,203,229,.9);cursor:pointer;white-space:nowrap}
      #dailyTaskBoardModal .dtr-label input[type=checkbox]{width:17px;height:17px;accent-color:#b28add;cursor:pointer}
      #dailyTaskBoardModal .dtr-select{height:34px;border:1px solid rgba(220,203,229,.95);border-radius:999px;background:#fff;color:#5f4b6a;padding:0 28px 0 10px;font:800 11px Inter,system-ui,sans-serif;outline:none}
      #dailyTaskBoardModal .dtr-test{height:34px;border:1px solid #ecd4e6;border-radius:999px;background:#fff2f8;color:#80546f;padding:0 11px;font:900 11px Inter,system-ui,sans-serif;cursor:pointer}
      #dailyTaskBoardModal .dtr-test:hover{transform:translateY(-1px)}
      #dailyTaskBoardModal .dtr-readonly{display:inline-flex;align-items:center;gap:6px;margin-top:8px;padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.64);border:1px solid rgba(220,203,229,.74);color:#705a7c;font:800 10px Inter,system-ui,sans-serif}
      #dailyTaskBoardModal .dtr-panel.is-disabled .dtr-select,#dailyTaskBoardModal .dtr-panel.is-disabled .dtr-sound{opacity:.48}
      @media(max-width:600px){#dailyTaskBoardModal .dtr-panel{align-items:stretch}#dailyTaskBoardModal .dtr-label,#dailyTaskBoardModal .dtr-select,#dailyTaskBoardModal .dtr-test{min-height:38px}#dailyTaskBoardModal .dtr-select{max-width:100%}}
    `;document.head.appendChild(s)
  }

  async function load(ids){
    if(!ids.length||loading)return
    loading=true
    try{
      const {data,error}=await db.from('daily_task_items').select('id,reminder_enabled,reminder_minutes,sound_enabled,last_reminder_at').in('id',ids)
      if(error)throw error
      for(const row of data||[])cache.set(row.id,row)
    }catch(e){console.warn('Quadro: lembretes',e)}finally{loading=false}
  }

  async function save(id,patch){
    const next={...patch,last_reminder_at:new Date().toISOString()}
    const {error}=await db.from('daily_task_items').update(next).eq('id',id)
    if(error)throw error
    cache.set(id,{...(cache.get(id)||{}),...next})
  }

  function minutesOptions(selected){
    const vals=[[5,'5 min'],[10,'10 min'],[15,'15 min'],[30,'30 min'],[60,'1 hora'],[120,'2 horas'],[240,'4 horas'],[720,'12 horas'],[1440,'1 dia']]
    return vals.map(([v,l])=>`<option value="${v}" ${Number(selected)===v?'selected':''}>${l}</option>`).join('')
  }

  function decorate(card){
    if(!(card instanceof HTMLElement))return
    const id=card.dataset.task,conf=cache.get(id);if(!id||!conf)return
    const creator=!!card.querySelector('[data-edit],[data-duration],[data-time]')
    const renderSignature=[creator?'1':'0',conf.reminder_enabled?'1':'0',Number(conf.reminder_minutes)||30,conf.sound_enabled?'1':'0'].join('|')
    if(card.dataset.dtrRenderSignature===renderSignature&&card.querySelector(':scope > .dtr-panel,:scope > .dtr-readonly'))return
    card.dataset.dtrRenderSignature=renderSignature
    card.querySelectorAll(':scope > .dtr-panel,:scope > .dtr-readonly').forEach(el=>el.remove())

    if(!creator){
      if(!conf.reminder_enabled)return
      const info=document.createElement('div');info.className='dtr-readonly';info.innerHTML=`🔔 lembrete a cada ${Number(conf.reminder_minutes)||30} min ${conf.sound_enabled?'• 🔊 som ativo':''}`;card.appendChild(info);return
    }

    const panel=document.createElement('div');panel.className=`dtr-panel ${conf.reminder_enabled?'':'is-disabled'}`
    panel.innerHTML=`
      <label class="dtr-label"><input type="checkbox" data-dtr-enabled ${conf.reminder_enabled?'checked':''}> 🔔 Lembrar até concluir</label>
      <select class="dtr-select" data-dtr-minutes aria-label="Intervalo do lembrete">${minutesOptions(conf.reminder_minutes||30)}</select>
      <label class="dtr-label dtr-sound"><input type="checkbox" data-dtr-sound ${conf.sound_enabled?'checked':''}> 🔊 Som urgente</label>
      <button type="button" class="dtr-test" data-dtr-test>▶ Testar som</button>`
    const actions=card.querySelector(':scope > .dtb-card-actions');if(actions)card.insertBefore(panel,actions);else card.appendChild(panel)

    const enabled=panel.querySelector('[data-dtr-enabled]'),minutes=panel.querySelector('[data-dtr-minutes]'),sound=panel.querySelector('[data-dtr-sound]'),test=panel.querySelector('[data-dtr-test]')
    const lock=v=>{[enabled,minutes,sound,test].forEach(el=>{if(el)el.disabled=v})}
    enabled?.addEventListener('change',async()=>{lock(true);try{await save(id,{reminder_enabled:enabled.checked});conf.reminder_enabled=enabled.checked;panel.classList.toggle('is-disabled',!enabled.checked);toast(enabled.checked?'Lembrete desta atividade ativado 🔔':'Lembrete desta atividade desativado')}catch(e){enabled.checked=!enabled.checked;toast('Não foi possível alterar o lembrete.')}finally{lock(false)}})
    minutes?.addEventListener('change',async()=>{lock(true);try{const value=Math.max(5,Math.min(1440,Number(minutes.value)||30));await save(id,{reminder_minutes:value});conf.reminder_minutes=value;toast(`Lembrete: a cada ${value} min`)}catch(e){toast('Não foi possível alterar o intervalo.')}finally{lock(false)}})
    sound?.addEventListener('change',async()=>{lock(true);try{if(sound.checked){enabled.checked=true;await window.__ISA_URGENT_SOUND__?.enable?.();if('Notification'in window&&Notification.permission==='default'){try{await Notification.requestPermission()}catch{}}}await save(id,{sound_enabled:sound.checked,reminder_enabled:enabled.checked});conf.sound_enabled=sound.checked;conf.reminder_enabled=enabled.checked;panel.classList.toggle('is-disabled',!enabled.checked);if(sound.checked)await window.__ISA_URGENT_SOUND__?.play?.({urgent:true});toast(sound.checked?'Som urgente ativado para esta atividade 🔊':'Som desta atividade desativado')}catch(e){sound.checked=!sound.checked;toast('Não foi possível alterar o som.')}finally{lock(false)}})
    test?.addEventListener('click',async()=>{await window.__ISA_URGENT_SOUND__?.test?.()})
  }

  async function scan(force=false){
    ensureCss();const modal=$('dailyTaskBoardModal');if(!modal)return attachWhenReady()
    const body=$('dtbBody')||modal, cards=[...body.querySelectorAll('.dtb-item[data-task]')],ids=cards.map(c=>c.dataset.task).filter(Boolean)
    const signature=ids.join('|')
    if(force||signature!==lastSignature||ids.some(id=>!cache.has(id))){lastSignature=signature;await load(ids)}
    cards.forEach(decorate)
    if(!bodyObserver&&body){bodyObserver=new MutationObserver(()=>{clearTimeout(body._dtrTimer);body._dtrTimer=setTimeout(()=>scan(false),80)});bodyObserver.observe(body,{childList:true,subtree:true})}
  }

  let waitingObserver=null
  function attachWhenReady(){
    if(waitingObserver)return
    waitingObserver=new MutationObserver(()=>{if($('dailyTaskBoardModal')){waitingObserver.disconnect();waitingObserver=null;setTimeout(()=>scan(true),40)}})
    waitingObserver.observe(document.body,{childList:true,subtree:true})
  }

  document.addEventListener('click',e=>{if(e.target.closest('#dailyTaskTile'))setTimeout(()=>scan(true),100)},true)
  document.addEventListener('isa:approved-home-ready',()=>setTimeout(()=>scan(true),180))
  window.__ISA_DAILY_TASK_REMINDERS__={scan,refresh:()=>scan(true)}
  setTimeout(()=>scan(true),900)
})();
