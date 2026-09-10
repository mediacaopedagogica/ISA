import './video-call-background-v1.js?v=1-upload-optional'

const $=id=>document.getElementById(id)

function toast(text){
  const el=$('friendToast')||$('toast');if(!el)return
  el.textContent=text;el.classList.remove('hidden');clearTimeout(el._profileActionsTimer);el._profileActionsTimer=setTimeout(()=>el.classList.add('hidden'),2600)
}
async function retry(action,label){
  for(let i=0;i<24;i++){
    try{if(action())return true}catch{}
    await new Promise(r=>setTimeout(r,100))
  }
  toast(`${label} ainda está carregando. Tente novamente em um instante.`);return false
}
function openSettings(){return retry(()=>{if(typeof window.__ISA_OPEN_GENERAL_SETTINGS__==='function'){window.__ISA_OPEN_GENERAL_SETTINGS__();return true}const b=$('settingsMenuBtn');if(!b)return false;b.click();return true},'Configurações')}
function openStatus(){return retry(()=>{if(typeof window.__ISA_OPEN_PROFILE_STATUS__==='function'){window.__ISA_OPEN_PROFILE_STATUS__();return true}const b=document.querySelector('.pss-profile-edit')||$('pssProfileCloud');if(!b)return false;b.click();return true},'Perfil')}
function openSticker(){return retry(()=>{if(typeof window.__ISA_OPEN_STICKER_CREATOR__==='function'){window.__ISA_OPEN_STICKER_CREATOR__();return true}const b=$('pssStickerBtn');if(!b)return false;b.click();return true},'Criador de Stickers')}
function openGames(){return retry(()=>{if(typeof window.__CANTINHO_OPEN_GAMES__!=='function')return false;window.__CANTINHO_OPEN_GAMES__();return true},'Joguinhos')}

// Este módulo agora só oferece os atalhos para outros componentes.
// A navegação principal é controlada pelo menu específico de cada perfil.
window.__ISA_PROFILE_ACTIONS__={openSettings,openStatus,openSticker,openGames}
window.__ISA_ENSURE_PROFILE_ACTIONS__=()=>true
