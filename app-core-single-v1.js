import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js?v=20260910-single-core'

// Núcleo único do Cantinho.
// Mantém UM único boot automático: o boot final original do chunk-09.
// O bootstrap duplicado do chunk-06 é removido. Não fazemos getSession() antes do boot,
// evitando uma segunda espera/lock da camada Auth antes de getUser().
if(!window.__ISA_CORE_SINGLE_PROMISE__){
  window.__ISA_SCRIPT_LOADED__=true
  window.__ISA_CORE_SINGLE_VERSION__='v3-native-single-boot'
  window.__ISA_CORE_PHASE__='starting'

  window.__ISA_CORE_SINGLE_PROMISE__=(async()=>{
    const files=['chunk-00.txt','chunk-01.txt','chunk-02.txt','chunk-03.txt','chunk-04.txt','chunk-05.txt','chunk-06.txt','chunk-07.txt','chunk-08.txt','chunk-09.txt']

    const fetchChunk=async(file,index)=>{
      const controller=new AbortController()
      const timer=setTimeout(()=>controller.abort(),10000)
      try{
        const response=await fetch(`./${file}?v=49-native-single-boot`,{cache:'no-store',signal:controller.signal})
        if(!response.ok)throw new Error(`Falha ao carregar ${file} (${response.status})`)
        let text=await response.text()

        if(index===6){
          const legacy="const {data:{session}}=await supabase.auth.getSession();session?boot():showView('loginView')"
          if(!text.includes(legacy))throw new Error('Assinatura do bootstrap duplicado não encontrada no chunk-06.')
          text=text.replace(legacy,'/* bootstrap duplicado removido pelo núcleo único */')
        }

        if(index===9){
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
    const source=parts.join('\n')

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
    window.__ISA_CORE_PHASE__='error'
    console.error('[núcleo único] Falha ao iniciar Cantinho da Isa:',error)
    const main=document.getElementById('mainView'),setup=document.getElementById('setupView'),login=document.getElementById('loginView')
    main?.classList.add('hidden');setup?.classList.add('hidden');login?.classList.remove('hidden')
    const msg=document.getElementById('loginMsg')
    if(msg)msg.textContent='Não foi possível carregar o Cantinho. Atualize a página e tente novamente.'
    document.dispatchEvent(new CustomEvent('isa:core-error',{detail:{message:window.__ISA_APP_ERROR__,phase:window.__ISA_CORE_PHASE__}}))
    throw error
  })
}

await window.__ISA_CORE_SINGLE_PROMISE__
