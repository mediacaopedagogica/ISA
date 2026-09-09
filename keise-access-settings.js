import {CONFIG} from './config.js'

const currentName=()=>String(document.getElementById('myName')?.textContent||'').trim().toLowerCase()
if(currentName()!=='keise') throw new Error('Configuração de acesso indisponível para este perfil')

function getSession(){
  for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i)||''
    if(!key.startsWith('sb-')||!key.endsWith('-auth-token')) continue
    try{
      const raw=JSON.parse(localStorage.getItem(key)||'null')
      const token=raw?.access_token||raw?.currentSession?.access_token||raw?.session?.access_token
      if(token) return {token,key}
    }catch{}
  }
  return null
}
function jwtSub(token){
  try{
    const part=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')
    const json=decodeURIComponent(atob(part).split('').map(c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join(''))
    return JSON.parse(json)?.sub||null
  }catch{return null}
}
async function api(path,options={}){
  const session=getSession(); if(!session) throw new Error('Sessão não encontrada. Entre novamente no Cantinho.')
  const res=await fetch(`${CONFIG.SUPABASE_URL}${path}`,{
    ...options,
    headers:{
      apikey:CONFIG.SUPABASE_KEY,
      Authorization:`Bearer ${session.token}`,
      'Content-Type':'application/json',
      ...(options.headers||{})
    }
  })
  if(!res.ok){
    let msg='Não foi possível salvar.'
    try{const j=await res.json();msg=j.message||j.error_description||j.hint||msg}catch{}
    throw new Error(msg)
  }
  if(res.status===204)return null
  const text=await res.text();return text?JSON.parse(text):null
}

if(!document.getElementById('keiseAccessSettingsStyle')){
  const style=document.createElement('style');style.id='keiseAccessSettingsStyle'
  style.textContent=`
  #accessSettingsPanel{position:fixed;inset:0;z-index:130000;background:rgba(25,18,35,.52);backdrop-filter:blur(12px);display:grid;place-items:center;padding:18px;font-family:Inter,system-ui,sans-serif}
  #accessSettingsPanel.hidden{display:none!important}.access-card{width:min(470px,94vw);border-radius:26px;background:#fffafc;color:#5b4a66;border:1px solid #fff;box-shadow:0 24px 70px rgba(65,40,80,.22);padding:22px}.access-head{display:flex;align-items:flex-start;gap:12px}.access-head button{margin-left:auto;border:0;border-radius:12px;background:#efe7f6;color:#684f78;padding:8px 10px;cursor:pointer}.access-card h2{margin:0 0 4px}.access-card p{margin:0;color:#88758f;font-size:13px}.access-form{display:grid;gap:12px;margin-top:18px}.access-form label{display:grid;gap:6px;font-weight:800;font-size:13px}.access-form input{width:100%;padding:12px 13px;border-radius:14px;border:1px solid #dfd2e8;background:#fff;color:#4f4059;outline:none}.access-form input:focus{border-color:#b99bd3;box-shadow:0 0 0 3px #cbb0df2b}.access-pass{position:relative}.access-pass input{padding-right:48px}.access-pass button{position:absolute;right:6px;top:6px;width:38px;height:38px;border:0;border-radius:10px;background:#f0e8f5;cursor:pointer}.access-save{border:0;border-radius:14px;padding:12px 14px;background:linear-gradient(135deg,#a985c7,#d49bb8);color:#fff;font-weight:900;cursor:pointer}.access-status{min-height:18px;font-size:12px;margin-top:8px!important}.access-note{margin-top:12px!important;padding:10px 12px;border-radius:13px;background:#f4eef7;color:#796681!important}.access-save:disabled{opacity:.6;cursor:wait}`
  document.head.appendChild(style)
}

function build(){
  if(document.getElementById('accessSettingsPanel'))return
  const panel=document.createElement('section')
  panel.id='accessSettingsPanel';panel.className='hidden'
  panel.innerHTML=`<div class="access-card"><div class="access-head"><div><h2>🔐 Meu acesso</h2><p>Edite o login e a senha usados para entrar no Cantinho.</p></div><button id="accessClose" type="button">✕</button></div><div class="access-form"><label>Login<input id="accessUsername" maxlength="32" autocomplete="username" placeholder="Ex.: MÃE"></label><label>Nova senha<div class="access-pass"><input id="accessPassword" type="password" minlength="6" maxlength="64" autocomplete="new-password" placeholder="Deixe em branco para manter a atual"><button id="accessEye" type="button" aria-label="Mostrar senha">👁️</button></div></label><button id="accessSave" class="access-save" type="button">Salvar acesso</button></div><p id="accessStatus" class="access-status"></p><p class="access-note">A alteração vale no próximo login. Sua sessão atual continua aberta.</p></div>`
  document.body.appendChild(panel)
  document.getElementById('accessClose').onclick=()=>panel.classList.add('hidden')
  panel.addEventListener('click',e=>{if(e.target===panel)panel.classList.add('hidden')})
  document.getElementById('accessEye').onclick=()=>{const input=document.getElementById('accessPassword');const show=input.type==='password';input.type=show?'text':'password';document.getElementById('accessEye').textContent=show?'🙈':'👁️'}
  document.getElementById('accessSave').onclick=save
}
async function loadCurrent(){
  const session=getSession();if(!session)return
  const sub=jwtSub(session.token);if(!sub)return
  try{
    const rows=await api(`/rest/v1/family_members?select=username&auth_user_id=eq.${encodeURIComponent(sub)}&limit=1`,{method:'GET'})
    if(Array.isArray(rows)&&rows[0]?.username)document.getElementById('accessUsername').value=rows[0].username
  }catch{}
}
async function save(){
  const username=document.getElementById('accessUsername').value.trim()
  const password=document.getElementById('accessPassword').value
  const status=document.getElementById('accessStatus'),btn=document.getElementById('accessSave')
  if(username.length<2){status.textContent='Digite um login válido.';return}
  if(password&&password.length<6){status.textContent='A senha precisa ter pelo menos 6 caracteres.';return}
  btn.disabled=true;status.textContent='Salvando...'
  try{
    await api('/rest/v1/rpc/update_my_login_credentials',{method:'POST',body:JSON.stringify({p_username:username,p_password:password||null})})
    document.getElementById('accessPassword').value=''
    status.textContent='✅ Acesso atualizado. Use o novo login e senha na próxima entrada.'
  }catch(error){status.textContent=`⚠️ ${error.message||'Não foi possível salvar.'}`}
  finally{btn.disabled=false}
}
function open(){build();document.getElementById('accessSettingsPanel').classList.remove('hidden');loadCurrent()}

// API pública usada pelo dashboard aprovado: não criamos mais um botão invisível na navegação antiga.
build()
window.__ISA_OPEN_ACCESS_SETTINGS__=open
