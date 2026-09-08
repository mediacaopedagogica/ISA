import { CONFIG } from './config.js'

const $=id=>document.getElementById(id)
const norm=v=>String(v||'').trim().toLowerCase()
if(norm($('myName')?.textContent)!=='keise') throw new Error('controle do Estúdio do Alan: perfil não autorizado')

function getAuth(){
  const seek=o=>{if(!o||typeof o!=='object')return'';if(typeof o.access_token==='string')return o.access_token;for(const v of Object.values(o)){const t=seek(v);if(t)return t}return''}
  for(const store of [localStorage,sessionStorage]){try{for(let i=0;i<store.length;i++){const k=store.key(i)||'';if(!/auth-token/i.test(k))continue;let raw=store.getItem(k)||'';if(raw.startsWith('base64-')){try{raw=atob(raw.slice(7))}catch{}}try{const t=seek(JSON.parse(raw));if(t)return t}catch{}}}catch{}}
  return''
}

async function rpc(name,args={}){
  const token=getAuth();if(!token)throw new Error('Sessão da Keise não encontrada.')
  const r=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${name}`,{method:'POST',cache:'no-store',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(args)})
  let data=null;try{data=await r.json()}catch{}
  if(!r.ok)throw new Error(data?.message||'Não foi possível alterar o acesso ao Estúdio do Alan.')
  return data
}

let enabled=false,busy=false

function ensureStyle(){
  if($('keiseAlanStudioControlStyle'))return
  const s=document.createElement('style');s.id='keiseAlanStudioControlStyle';s.textContent=`
  #keiseAlanStudioControl{margin:18px 0;padding:18px;border-radius:22px;border:1px solid rgba(132,95,166,.16);background:linear-gradient(145deg,rgba(255,255,255,.92),rgba(246,239,252,.9));box-shadow:0 12px 30px rgba(88,63,103,.08)}
  #keiseAlanStudioControl .kasc-row{display:flex;align-items:center;gap:14px;flex-wrap:wrap}.kasc-icon{font-size:30px}.kasc-main{flex:1;min-width:210px}.kasc-main strong{display:block;font-size:16px;color:#5f4a6a}.kasc-main small{display:block;margin-top:4px;color:#7d6b83;line-height:1.45}.kasc-state{font-weight:900;border-radius:999px;padding:7px 11px;font-size:12px}.kasc-state.on{background:#e6f6eb;color:#2f7545}.kasc-state.off{background:#f4edf7;color:#785c86}.kasc-btn{border:0;border-radius:13px;padding:10px 14px;font-weight:900;cursor:pointer;background:linear-gradient(135deg,#bda1e5,#e5a9c8);color:#4b3856;box-shadow:0 8px 18px rgba(120,88,146,.16)}.kasc-btn:disabled{opacity:.55;cursor:wait}.kasc-note{margin-top:10px;font-size:12px;color:#8b778f}
  @media(max-width:650px){#keiseAlanStudioControl{padding:14px}.kasc-btn{width:100%}}
  `;document.head.appendChild(s)
}

function ensureCard(){
  if($('keiseAlanStudioControl'))return $('keiseAlanStudioControl')
  const panel=$('parentsPanel');if(!panel)return null
  ensureStyle()
  const card=document.createElement('section');card.id='keiseAlanStudioControl';card.innerHTML=`<div class="kasc-row"><div class="kasc-icon">🎸</div><div class="kasc-main"><strong>Estúdio do Alan</strong><small>Você decide quando a área musical completa do Alan fica disponível para ele.</small></div><span id="kascState" class="kasc-state off">Desativado</span><button id="kascToggle" class="kasc-btn" type="button">Ativar para Alan</button></div><div class="kasc-note">Desativar não apaga repertório, partituras, cachês, editais ou dados já salvos. Apenas esconde e bloqueia o carregamento da área até você ativar novamente.</div>`
  const cards=panel.querySelector('.parent-cards');if(cards?.nextSibling)panel.insertBefore(card,cards.nextSibling);else panel.appendChild(card)
  $('kascToggle').addEventListener('click',toggle)
  return card
}

function render(){
  ensureCard();const st=$('kascState'),btn=$('kascToggle');if(!st||!btn)return
  st.textContent=enabled?'Ativado':'Desativado';st.className=`kasc-state ${enabled?'on':'off'}`
  btn.textContent=enabled?'Desativar para Alan':'Ativar para Alan';btn.disabled=busy
}

async function toggle(){
  if(busy)return;busy=true;render()
  try{enabled=(await rpc('keise_set_alan_studio_access',{p_enabled:!enabled}))===true}
  catch(error){console.warn(error);const t=$('toast');if(t){t.textContent='Não foi possível alterar o acesso do Estúdio do Alan.';t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),3500)}}
  busy=false;render()
}

async function start(){
  ensureCard();render()
  try{enabled=(await rpc('alan_studio_feature_status'))===true}catch(error){console.warn(error);enabled=false}
  render()
}

start()
