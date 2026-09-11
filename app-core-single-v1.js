import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js?v=20260910-single-core'

// Núcleo único do Cantinho.
// Mantém UM único boot automático: o boot final original do chunk-09.
// O bootstrap duplicado do chunk-06 é removido. Não fazemos getSession() antes do boot,
// evitando uma segunda espera/lock da camada Auth antes de getUser().
if(!window.__ISA_CORE_SINGLE_PROMISE__){
  window.__ISA_SCRIPT_LOADED__=true
  window.__ISA_CORE_SINGLE_VERSION__='v4-authenticated-boot-audit'
  window.__ISA_CORE_PHASE__='starting'

  window.__ISA_CORE_SINGLE_PROMISE__=(async()=>{
    const files=['chunk-00.txt','chunk-01.txt','chunk-02.txt','chunk-03.txt','chunk-04.txt','chunk-05.txt','chunk-06.txt','chunk-07.txt','chunk-08.txt','chunk-09.txt']

    const fetchChunk=async(file,index)=>{
      const controller=new AbortController()
      const timer=setTimeout(()=>controller.abort(),10000)
      try{
        const response=await fetch(`./${file}?v=50-authenticated-boot-audit`,{cache:'no-store',signal:controller.signal})
        if(!response.ok)throw new Error(`Falha ao carregar ${file} (${response.status})`)
        let text=await response.text()

        if(index===6){
          const legacy="const {data:{session}}=await supabase.auth.getSession();session?boot():showView('loginView')"
          if(!text.includes(legacy))throw new Error('Assinatura do bootstrap duplicado não encontrada no chunk-06.')
          text=text.replace(legacy,'/* bootstrap duplicado removido pelo núcleo único */')
        }

        if(index===9){
          // Instrumenta o boot autenticado sem reescrever sua lógica visual.
          // Se Supabase ou a carga inicial travarem, teremos etapa + timeout em vez de spinner infinito.
          const authCall="const {data:{user}}=await supabase.auth.getUser();"
          const memberCall="const {data:member,error}=await supabase.from('family_members').select('*').eq('auth_user_id',user.id).eq('active',true).single();"
          const initialData="await Promise.all([loadFamily(),loadConversations()]);"
          if(!text.includes(authCall))throw new Error('Etapa auth-user não encontrada no boot final.')
          if(!text.includes(memberCall))throw new Error('Etapa member-profile não encontrada no boot final.')
          if(!text.includes(initialData))throw new Error('Etapa family-conversations não encontrada no boot final.')

          text=text.replace(authCall,"window.__ISA_CORE_PHASE__='auth-user';document.dispatchEvent(new CustomEvent('isa:core-phase',{detail:{phase:'auth-user'}}));const {data:{user}}=await __isaBootTimeout(supabase.auth.getUser(),9000,'autenticação da sessão');")
          text=text.replace(memberCall,"window.__ISA_CORE_PHASE__='member-profile';document.dispatchEvent(new CustomEvent('isa:core-phase',{detail:{phase:'member-profile'}}));const {data:member,error}=await __isaBootTimeout(supabase.from('family_members').select('*').eq('auth_user_id',user.id).eq('active',true).single(),9000,'perfil familiar');")
          text=text.replace(initialData,"window.__ISA_CORE_PHASE__='family-conversations';document.dispatchEvent(new CustomEvent('isa:core-phase',{detail:{phase:'family-conversations'}}));await __isaBootTimeout(Promise.all([loadFamily(),loadConversations()]),12000,'conversas e familiares');window.__ISA_CORE_PHASE__='core-data-ready';document.dispatchEvent(new CustomEvent('isa:core-phase',{detail:{phase:'core-data-ready'}}));")

          const finalTrigger=/\n\s*await\s+boot\s*\(\s*\)\s*;\s*$/
          if(!finalTrigger.test(text))throw new Error('Boot final canônico não encontrado no chunk-09.')
          text=text.replace(finalTrigger,`
window.__ISA_CORE_PHASE__='boot-running';
document.dispatchEvent(new CustomEvent('isa:core-boot-start'));
await boot();
window.__ISA_CORE_PHASE__='boot-complete';
document.dispatchEvent(new CustomEvent('isa:core-boot-complete'));
`)
        }
        return text
      }catch(error){
        if(error?.name==='AbortError')throw new Error(`Tempo esgotado ao carregar ${file}.`)
        throw error
      }finally{clearTimeout(timer)}
    }

    window.__ISA_CORE_PHASE__='loading-chunks'
    const parts=await Promise.all(files.map(fetchChunk))
    const source=`
const __isaBootTimeout=(promise,ms,label)=>new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error('Tempo esgotado em '+label+' ('+ms+' ms).')),ms);
  Promise.resolve(promise).then(value=>{clearTimeout(timer);resolve(value)},error=>{clearTimeout(timer);reject(error)});
});
`+parts.join('\n')

    // Não pode restar o bootstrap de sessão do chunk-06 e deve existir exatamente
    // um marcador de boot automático injetado acima. O await boot() de login()
    // continua dentro da função login e só roda quando a pessoa clica em Entrar.
    if(source.includes("session?boot():showView('loginView')"))throw new Error('Bootstrap duplicado do chunk-06 ainda presente.')
    if((source.match(/isa:core-boot-start/g)||[]).length!==1)throw new Error('Boot automático canônico não ficou único.')

    window.__ISA_CORE_STARTED__=true
    window.__ISA_CORE_PHASE__='executing-core'
    const run=new Function('createClient','CONFIG',`return (async()=>{${source}})()`)
    await run(createClient,CONFIG)

    window.__ISA_APP_READY__=true
    window.__ISA_CORE_PHASE__='ready'
    document.dispatchEvent(new CustomEvent('isa:core-ready',{detail:{version:window.__ISA_CORE_SINGLE_VERSION__}}))
    return true
  })().catch(error=>{
    window.__ISA_APP_ERROR__=String(error?.message||error||'Erro desconhecido')
    const failedPhase=window.__ISA_CORE_PHASE__||'desconhecida'
    window.__ISA_CORE_FAILED_PHASE__=failedPhase
    window.__ISA_CORE_PHASE__='error'
    console.error('[núcleo único] Falha ao iniciar Cantinho da Isa:',error)
    const main=document.getElementById('mainView'),setup=document.getElementById('setupView'),login=document.getElementById('loginView')
    main?.classList.add('hidden');setup?.classList.add('hidden');login?.classList.remove('hidden')
    const msg=document.getElementById('loginMsg')
    if(msg)msg.textContent=`Não foi possível carregar o Cantinho (${failedPhase}). Tente novamente.`
    document.dispatchEvent(new CustomEvent('isa:core-error',{detail:{message:window.__ISA_APP_ERROR__,phase:failedPhase}}))
    throw error
  })
}

await window.__ISA_CORE_SINGLE_PROMISE__
