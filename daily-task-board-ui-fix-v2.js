// Quadro do Dia da Isa — correção visual cirúrgica.
// Escopo: somente #dailyTaskBoardModal. Não altera Chat, Nossa Rede, boot, perfis ou permissões.
(function(){
  const STYLE_ID='dailyTaskBoardUiFixV2Style';

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      /* Os post-its decorativos passam a ocupar fluxo próprio, abaixo do quadro.
         Assim nunca cobrem tarefa, checkbox, progresso ou rodapé. */
      #dailyTaskBoardModal .dtb-board-sticky{
        position:relative !important;
        inset:auto !important;
        left:auto !important;
        right:auto !important;
        top:auto !important;
        bottom:auto !important;
        z-index:2 !important;
        display:inline-flex !important;
        width:auto !important;
        min-width:118px;
        max-width:190px;
        min-height:0 !important;
        margin:16px 10px 0 0 !important;
        padding:10px 14px !important;
        border-radius:14px !important;
        transform:rotate(-1.2deg) !important;
        vertical-align:top;
        pointer-events:none;
      }
      #dailyTaskBoardModal .dtb-board-sticky.right{
        transform:rotate(1.2deg) !important;
      }

      /* Ações explícitas do responsável: editar e excluir. */
      #dailyTaskBoardModal .dtb-card-actions{
        margin-top:4px;
        display:flex;
        flex-wrap:wrap;
        gap:8px;
        align-items:center;
      }
      #dailyTaskBoardModal .dtb-edit-trigger,
      #dailyTaskBoardModal .dtb-remove.dtb-remove-explicit{
        position:static !important;
        inset:auto !important;
        width:auto !important;
        height:34px !important;
        min-width:0 !important;
        border:1px solid rgba(214,187,219,.86) !important;
        border-radius:999px !important;
        padding:7px 12px !important;
        display:inline-flex !important;
        align-items:center;
        justify-content:center;
        gap:5px;
        background:rgba(255,255,255,.72) !important;
        color:#6b5577 !important;
        font:900 11px/1 Inter,system-ui,sans-serif !important;
        box-shadow:0 5px 12px rgba(92,67,108,.07);
        cursor:pointer;
        z-index:3 !important;
      }
      #dailyTaskBoardModal .dtb-remove.dtb-remove-explicit{
        color:#9b536a !important;
        background:rgba(255,240,246,.88) !important;
        border-color:#f0cfda !important;
      }
      #dailyTaskBoardModal .dtb-edit-trigger:hover,
      #dailyTaskBoardModal .dtb-remove.dtb-remove-explicit:hover{
        transform:translateY(-1px);
      }
      #dailyTaskBoardModal .dtb-task-edit.dtb-edit-focus{
        background:#fff !important;
        border-color:#cda6d5 !important;
        box-shadow:0 0 0 3px rgba(218,188,229,.28) !important;
      }

      @media(max-width:860px){
        #dailyTaskBoardModal .dtb-board-sticky{
          display:inline-flex !important;
          max-width:calc(50% - 12px);
          font-size:11px !important;
        }
      }
      @media(max-width:520px){
        #dailyTaskBoardModal .dtb-board-sticky{
          display:flex !important;
          width:100% !important;
          max-width:none !important;
          margin:10px 0 0 !important;
          transform:none !important;
        }
        #dailyTaskBoardModal .dtb-card-actions{
          width:100%;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function enhanceCreatorCard(card){
    if(!(card instanceof HTMLElement)) return;
    const input=card.querySelector('.dtb-task-edit[data-edit]');
    if(!input) return; // Isa vê o quadro, mas só Keise edita/exclui.

    const remove=card.querySelector('.dtb-remove[data-remove]');
    let actions=card.querySelector(':scope > .dtb-card-actions');
    if(!actions){
      actions=document.createElement('div');
      actions.className='dtb-card-actions';
      card.appendChild(actions);
    }

    if(!actions.querySelector('.dtb-edit-trigger')){
      const edit=document.createElement('button');
      edit.type='button';
      edit.className='dtb-edit-trigger';
      edit.textContent='✏️ Editar';
      edit.title='Editar esta tarefa';
      edit.setAttribute('aria-label','Editar esta tarefa');
      edit.addEventListener('click',()=>{
        input.classList.add('dtb-edit-focus');
        input.focus();
        input.select?.();
        const clear=()=>input.classList.remove('dtb-edit-focus');
        input.addEventListener('blur',clear,{once:true});
      });
      actions.appendChild(edit);
    }

    if(remove){
      remove.classList.add('dtb-remove-explicit');
      remove.textContent='🗑️ Excluir';
      remove.title='Excluir esta tarefa';
      remove.setAttribute('aria-label','Excluir esta tarefa');
      if(remove.parentElement!==actions) actions.appendChild(remove); // mover preserva o onclick original
    }
  }

  function scan(){
    ensureStyle();
    const modal=document.getElementById('dailyTaskBoardModal');
    if(!modal) return;
    modal.querySelectorAll('.dtb-item').forEach(enhanceCreatorCard);
  }

  let scheduled=false;
  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;scan();});
  }

  ensureStyle();
  document.addEventListener('click',e=>{
    if(e.target.closest('#dailyTaskTile,#dailyTaskBoardModal')) setTimeout(schedule,0);
  },true);
  document.addEventListener('isa:approved-home-ready',()=>setTimeout(schedule,80));
  window.addEventListener('pageshow',()=>setTimeout(schedule,120),{once:true});

  const observer=new MutationObserver(mutations=>{
    if(mutations.some(m=>m.addedNodes.length||m.type==='childList')) schedule();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  window.__ISA_DAILY_TASK_BOARD_UI_FIX_V2__={scan};
  schedule();
})();
