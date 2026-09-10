// Impede que o dashboard legado apareça por cima/antes da interface final aprovada.
(function(){
  const $=id=>document.getElementById(id)
  const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  const profile=()=>{const q=norm(new URLSearchParams(location.search).get('perfil')),n=norm($('myName')?.textContent);for(const p of ['keise','isa','alan'])if(q===p||n===p||n.startsWith(p+' '))return p;return''}
  function css(){if($('isaApprovedShellLockCss'))return;const s=document.createElement('style');s.id='isaApprovedShellLockCss';s.textContent=`
    body.isa-approved-shell-lock #mainView>.sidebar{visibility:hidden!important;opacity:0!important;pointer-events:none!important}
    body.isa-approved-shell-lock #emptyState{display:none!important}
    body.isa-approved-shell-lock.keise-home-active #mainView>.sidebar,
    body.isa-approved-shell-lock.approved-family-dashboard.keise-home-active #mainView>.sidebar{display:none!important;width:0!important;min-width:0!important;max-width:0!important;overflow:hidden!important}
    #isaApprovedShellShield{position:fixed;inset:0;z-index:118900;display:grid;place-items:center;background:radial-gradient(circle at 18% 14%,#fff0f6 0 18%,transparent 42%),radial-gradient(circle at 86% 12%,#eee4ff 0 18%,transparent 42%),#f8f2fb;pointer-events:none;transition:opacity .18s ease}
    #isaApprovedShellShield.hidden{opacity:0;visibility:hidden}
    #isaApprovedShellShield>div{padding:22px 28px;border-radius:28px;background:rgba(255,255,255,.88);box-shadow:0 18px 48px rgba(95,70,110,.11);color:#66516f;font:800 14px/1.4 Inter,"Segoe UI",sans-serif;text-align:center}
    #isaApprovedShellShield b{display:block;font-size:28px;margin-bottom:7px;color:#d88ebc}
  `;document.head.appendChild(s)}
  function shield(){let el=$('isaApprovedShellShield');if(el)return el;el=document.createElement('div');el.id='isaApprovedShellShield';el.innerHTML='<div><b>♥</b>Abrindo seu Cantinho…</div>';document.body.appendChild(el);return el}
  function ready(){return !!$('keiseApprovedHome')&&!$('keiseApprovedHome').classList.contains('hidden')&&!!$('keiseApprovedTopbar')&&!$('keiseApprovedTopbar').classList.contains('hidden')}
  function apply(){css();const p=profile();if(!p)return false;document.body.classList.add('isa-approved-shell-lock');const main=$('mainView');if(main&&!main.classList.contains('hidden')&&!document.body.classList.contains('keise-panel-active'))shield();if(ready())$(`isaApprovedShellShield`)?.classList.add('hidden');return true}
  function recover(){if(!apply())return;const p=profile();if(p==='keise')window.__ISA_SHOW_KEISE_HOME__?.();else if(p==='isa'||p==='alan')window.__ISA_SHOW_APPROVED_PROFILE_HOME__?.();setTimeout(()=>{if(ready())$('isaApprovedShellShield')?.classList.add('hidden')},80)}
  const obs=new MutationObserver(()=>{apply();if(ready())$('isaApprovedShellShield')?.classList.add('hidden')});obs.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']})
  document.addEventListener('isa:approved-home-ready',recover);setInterval(()=>{if(profile()&&!document.body.classList.contains('keise-panel-active'))recover()},1400)
  apply();setTimeout(recover,80);setTimeout(recover,500);setTimeout(()=>$('isaApprovedShellShield')?.classList.add('hidden'),6500)
  window.__ISA_APPROVED_SHELL_LOCK__={apply,recover}
})();