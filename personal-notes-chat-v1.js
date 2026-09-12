// Cantinho da Isa — Notas pessoais de Keise, Isa e Alan.
// Camada aditiva: não altera o motor de conversas, apenas reconhece as três conversas privadas já criadas no Supabase.
(function(){
  'use strict'
  if(window.__ISA_PERSONAL_NOTES_CHAT_V1__)return
  window.__ISA_PERSONAL_NOTES_CHAT_V1__=true

  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const NOTES={
    keise:{id:'08d3d957-d0ca-47f7-8382-1a69c1b6ddd3',a:'#ffd9e8',b:'#ded4ff',c:'#d7f2ff'},
    isa:{id:'cf056f81-7f03-427f-8e34-41cefd2dd247',a:'#eadcff',b:'#d9ccff',c:'#f5edff'},
    alan:{id:'64673bad-1c4e-47c6-a665-62f95cc73a17',a:'#d9f0ff',b:'#cbe7ff',c:'#eef8ff'}
  }
  const profile=()=>{
    const q=norm(new URLSearchParams(location.search).get('perfil'))
    const n=norm($('myName')?.textContent)
    for(const p of Object.keys(NOTES))if(q===p||n===p||n.startsWith(p+' '))return p
    return''
  }
  const cfg=()=>NOTES[profile()]||null

  function ensureCss(){
    if($('isaPersonalNotesCss'))return
    const s=document.createElement('style');s.id='isaPersonalNotesCss';s.textContent=`
      .isa-personal-notes-card{position:relative!important;border-color:color-mix(in srgb,var(--notes-b,#dccfff) 62%,#fff)!important;background:linear-gradient(135deg,var(--notes-a,#f7e5ff),var(--notes-b,#e7dcff) 55%,var(--notes-c,#e8f7ff))!important;box-shadow:0 10px 25px color-mix(in srgb,var(--notes-b,#cfc0ee) 22%,transparent)!important}
      .isa-personal-notes-card .avatar{background:rgba(255,255,255,.72)!important;box-shadow:0 5px 14px rgba(91,70,110,.10)!important}
      .isa-personal-notes-card strong{color:#584667!important}
      .isa-personal-notes-card small{color:#786b83!important}
      body.isa-personal-notes-active #chatPanel{--notes-a:#f7e5ff;--notes-b:#e7dcff;--notes-c:#e8f7ff;background:linear-gradient(145deg,var(--notes-a),#fff 40%,var(--notes-c))!important}
      body.isa-personal-notes-active #chatPanel .chat-header{background:linear-gradient(100deg,color-mix(in srgb,var(--notes-a) 72%,#fff),#fff 48%,color-mix(in srgb,var(--notes-c) 72%,#fff))!important;border-bottom-color:color-mix(in srgb,var(--notes-b) 48%,#eee)!important}
      body.isa-personal-notes-active #composer{background:rgba(255,255,255,.86)!important;border-top-color:color-mix(in srgb,var(--notes-b) 48%,#eee)!important;backdrop-filter:blur(12px)}
      body.isa-personal-notes-active #groupManageBtn,
      body.isa-personal-notes-active #groupPlusBtn{display:none!important}
      body.isa-personal-notes-active #isaNotesPostitBtn{display:none!important}
      .isa-notes-private-chip{display:inline-flex;align-items:center;gap:5px;margin-left:7px;padding:5px 8px;border-radius:999px;background:rgba(255,255,255,.74);border:1px solid rgba(255,255,255,.9);font-size:9px;font-weight:900;color:#776681;white-space:nowrap}
      @media(max-width:650px){.isa-notes-private-chip{display:none}}
    `;document.head.appendChild(s)
  }
  function setTheme(){
    const c=cfg();if(!c)return
    document.documentElement.style.setProperty('--notes-a',c.a)
    document.documentElement.style.setProperty('--notes-b',c.b)
    document.documentElement.style.setProperty('--notes-c',c.c)
  }
  function isNotesId(id){const c=cfg();return !!c&&String(id||'')===c.id}
  function cards(){
    const c=cfg();if(!c)return[]
    return [...document.querySelectorAll(`[data-conv="${c.id}"],[data-ka-conv="${c.id}"],[data-source-conv="${c.id}"]`)]
  }
  function decorateCards(){
    const c=cfg();if(!c)return
    setTheme()
    cards().forEach(card=>{
      card.classList.add('isa-personal-notes-card')
      card.style.setProperty('--notes-a',c.a);card.style.setProperty('--notes-b',c.b);card.style.setProperty('--notes-c',c.c)
      card.dataset.personalNotes='1'
      const av=card.querySelector('.avatar');if(av&&av.dataset.notesIcon!=='1'){av.dataset.notesIcon='1';av.textContent='📝'}
    })
  }
  function activeId(){
    const native=document.querySelector('#chatList .chat-item.active[data-conv],#chatList [data-conv][aria-current="true"]')
    if(native?.dataset.conv)return String(native.dataset.conv)
    const approved=document.querySelector('#kaConversationList .ka-conv-card.active[data-source-conv],#kaConversationList .ka-conv-card.active[data-ka-conv]')
    return String(approved?.dataset.sourceConv||approved?.dataset.kaConv||'')
  }
  function importantText(btn){
    return String(btn?.textContent||'').replace(/📌/g,'').replace(/\s+/g,' ').trim().toLocaleLowerCase('pt-BR')
  }
  function keepSingleImportantEntry(on){
    $('isaNotesPostitBtn')?.remove()
    if(!on)return
    const head=$('chatPanel')?.querySelector('.chat-header');if(!head)return
    const buttons=[...head.querySelectorAll('button')].filter(b=>importantText(b)==='importante')
    if(buttons.length<2)return
    const canonical=head.querySelector('.isa-important-open')||buttons[0]
    buttons.forEach(b=>{if(b!==canonical)b.remove()})
  }
  function activeState(){
    const c=cfg(),panel=$('chatPanel');if(!c||!panel)return
    const on=!panel.classList.contains('hidden')&&isNotesId(activeId())
    document.body.classList.toggle('isa-personal-notes-active',on)
    if(on){
      setTheme();const title=$('chatTitle'),sub=$('chatSubtitle');if(title&&title.textContent!=='Notas')title.textContent='Notas';if(sub&&sub.textContent!=='Suas notas pessoais • só você vê')sub.textContent='Suas notas pessoais • só você vê'
      let chip=$('isaNotesPrivateChip');const head=panel.querySelector('.chat-header .grow');if(!chip&&head){chip=document.createElement('span');chip.id='isaNotesPrivateChip';chip.className='isa-notes-private-chip';chip.textContent='🔒 pessoal';head.appendChild(chip)}
      keepSingleImportantEntry(true)
    }else{$('isaNotesPrivateChip')?.remove();keepSingleImportantEntry(false)}
  }
  function scan(){ensureCss();decorateCards();activeState()}
  let queued=false
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;scan()})}
  new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']})
  document.addEventListener('isa:approved-home-ready',schedule,{passive:true})
  document.addEventListener('isa:chat-opened',schedule,{passive:true})
  window.addEventListener('pageshow',schedule,{once:true})
  scan();setTimeout(scan,500);setTimeout(scan,1400)
  window.__ISA_PERSONAL_NOTES_CHAT__={scan,profile,activeId}
})();
