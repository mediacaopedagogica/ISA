// Proteção localizada: Mover para chat só pode disparar uma vez por toque/clique.
(function(){
  if(window.__ISA_POSTIT_MOVE_ONCE_V1__)return;window.__ISA_POSTIT_MOVE_ONCE_V1__=true
  if(!document.getElementById('isaPostitMoveOnceCss')){const s=document.createElement('style');s.id='isaPostitMoveOnceCss';s.textContent='[data-note-move][data-isa-moving="1"]{opacity:.55!important;pointer-events:none!important}.isa-postit-duplicate-hidden{display:none!important}';document.head.appendChild(s)}
  document.addEventListener('click',e=>{const b=e.target.closest?.('[data-note-move]');if(!b)return;if(b.dataset.isaMoving==='1'){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();return}b.dataset.isaMoving='1';b.disabled=true;setTimeout(()=>{if(b.isConnected){b.disabled=false;delete b.dataset.isaMoving}},2400)},true)
  let queued=false
  function scan(){queued=false;const rows=[...document.querySelectorAll('#messages .message-row,#friendMessages .friend-msg')],groups=new Map();for(const row of rows){let p=null;try{if(row.dataset.isaPostitPayload)p=JSON.parse(decodeURIComponent(row.dataset.isaPostitPayload))}catch{}if(!p?.id)continue;if(!groups.has(p.id))groups.set(p.id,[]);groups.get(p.id).push(row)}for(const a of groups.values())a.forEach((r,i)=>r.classList.toggle('isa-postit-duplicate-hidden',i<a.length-1))}
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(scan)}
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('isa:chat-opened',schedule);document.addEventListener('isa:friend-portal-entered',schedule);setTimeout(scan,500)
  window.__ISA_POSTIT_MOVE_ONCE__={scan,schedule}
})();
