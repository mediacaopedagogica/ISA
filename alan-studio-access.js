import { CONFIG } from './config.js'

function getAuth(){
  const seek=o=>{if(!o||typeof o!=='object')return'';if(typeof o.access_token==='string')return o.access_token;for(const v of Object.values(o)){const t=seek(v);if(t)return t}return''}
  for(const store of [localStorage,sessionStorage]){
    try{
      for(let i=0;i<store.length;i++){
        const k=store.key(i)||''
        if(!/auth-token/i.test(k))continue
        let raw=store.getItem(k)||''
        if(raw.startsWith('base64-')){try{raw=atob(raw.slice(7))}catch{}}
        try{const t=seek(JSON.parse(raw));if(t)return t}catch{}
      }
    }catch{}
  }
  return''
}

async function rpc(name,args={}){
  const token=getAuth()
  if(!token)throw new Error('Sessão não encontrada.')
  const r=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${name}`,{
    method:'POST',cache:'no-store',
    headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
    body:JSON.stringify(args)
  })
  let data=null;try{data=await r.json()}catch{}
  if(!r.ok)throw new Error(data?.message||'Não foi possível verificar o acesso ao Estúdio do Alan.')
  return data
}

export async function isAlanStudioEnabled(){
  try{return (await rpc('alan_studio_feature_status'))===true}
  catch(error){console.warn('Estúdio do Alan bloqueado por segurança:',error);return false}
}
