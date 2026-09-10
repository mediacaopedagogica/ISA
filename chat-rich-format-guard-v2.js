// Evita marcadores vazios como [m=#fff09a][/m] no campo de mensagem.
const $=id=>document.getElementById(id)
function toast(text){const t=$('friendToast')||$('toast');if(!t)return;t.textContent=text;t.classList.remove('hidden');clearTimeout(t._fmtGuard);t._fmtGuard=setTimeout(()=>t.classList.add('hidden'),2200)}
function inputFor(el){const host=el?.closest?.('.mi-format-toolbar')?.parentElement;if(host?.classList.contains('friend-composer'))return $('friendMessageInput');return $('messageInput')}
function clean(input){if(!input)return;let v=input.value||'',next=v;for(let i=0;i<3;i++){next=next.replace(/\[(b|i|u)\]\s*\[\/\1\]/gi,'').replace(/\[(?:m|c)=#[0-9a-f]{6}\]\s*\[\/(?:m|c)\]/gi,'').replace(/\[f=(?:rounded|clean|serif|mono|hand)\]\s*\[\/f\]/gi,'').replace(/\[s=(?:8[0-9]|9[0-9]|1[0-7][0-9]|180)\]\s*\[\/s\]/gi,'')}if(next!==v){const pos=Math.min(input.selectionStart??next.length,next.length);input.value=next;input.setSelectionRange?.(pos,pos)}}
function hasSelection(input){return !!input&&Number(input.selectionEnd)>Number(input.selectionStart)}
document.addEventListener('click',e=>{const btn=e.target.closest?.('.mi-format-toolbar [data-fmt]');if(!btn)return;const kind=btn.dataset.fmt;if(kind==='important')return;const input=inputFor(btn);if(!hasSelection(input)){e.preventDefault();e.stopImmediatePropagation();clean(input);toast('Selecione primeiro o trecho que deseja formatar.');input?.focus()}},true)
document.addEventListener('change',e=>{const ctl=e.target.closest?.('.mi-format-toolbar [data-fmt-font],.mi-format-toolbar [data-fmt-color]');if(!ctl)return;const input=inputFor(ctl);if(!hasSelection(input)){e.preventDefault();e.stopImmediatePropagation();if(ctl.matches('[data-fmt-font]'))ctl.value='';clean(input);toast('Selecione primeiro o trecho que deseja formatar.');input?.focus()}},true)
for(const id of ['messageInput','friendMessageInput']){$(id)?.addEventListener('input',e=>clean(e.currentTarget))}
setTimeout(()=>{clean($('messageInput'));clean($('friendMessageInput'))},250)
window.__ISA_CLEAN_EMPTY_CHAT_FORMATS__=()=>{clean($('messageInput'));clean($('friendMessageInput'))}
