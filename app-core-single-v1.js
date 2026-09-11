import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js?v=20260910-single-core'

// Núcleo único do Cantinho.
// Os chunks históricos possuem gatilhos automáticos próprios. Aqui TODOS os gatilhos
// de abertura são removidos e a sessão é iniciada uma única vez, depois que o código
// inteiro já foi montado. O boot() usado pelo login continua existindo normalmente.
if(!window.__ISA_CORE_SINGLE_PROMISE__){
  window.__ISA_SCRIPT_LOADED__=true
  window.__ISA_CORE_SINGLE_VERSION__='v2-deterministic-start'

  window.__ISA_CORE_SINGLE_PROMISE__=(async()=>{
    const files=['chunk-00.txt','chunk-01.txt','chunk-02.txt','chunk-03.txt','chunk-04.txt','chunk-05.txt','chunk-06.txt','chunk-07.txt','chunk-08.txt','chunk-09.txt']

    const fetchChunk=async(file,index)=>{
      const controller=new AbortController()
      const timer=setTimeout(()=>controller.abort(),10000)
      try{
        const response=await fetch(`./${file}?v=48-single-core-deterministic`,{cache:'no-store',signal:controller.signal})
        if(!response.ok)throw new Error(`Falha ao carregar ${file} (${response.status})`)
        let text=await response.text()

        // chunk-06: remove o bootstrap legado baseado em getSession().
        if(index===6){
          const legacy="const {data:{session}}=await supabase.auth.getSession();session?boot():showView('loginView')"
          if(!text.includes(legacy))throw new Error('Assinatura do bootstrap legado não encontrada no chunk-06.')
          text=text.replace(legacy,'/* bootstrap legado removido pelo núcleo único */')
        }

        // chunk-09: remove SOMENTE o await boot() de nível superior no fim do arquivo.
        // O await boot() dentro de login() no chunk-00 é legítimo e permanece intacto.
        if(index===9){
          const finalTrigger=/\n\s*await\s+boot\s*\(\s*\)\s*;\s*$/
          if(!finalTrigger.test(text))throw new Error('Gatilho final de boot não encontrado no chunk-09.')
          text=text.replace(finalTrigger,'\n/* gatilho final removido: startup controlado pelo núcleo único */\n')
        }
        return text
      }catch(error){
        if(error?.name==='AbortError')throw new Error(`Tempo esgotado ao carregar ${file}.`)
        throw error
      }finally{clearTimeout(timer)}
    }

    const parts=await Promise.all(files.map(fetchChunk))
    const source=parts.join('\n')

    // Auditoria: depois da limpeza, nenhum bootstrap automático histórico pode sobrar.
    // O único "await boot()" aceitável é o de login(), que roda apenas após login manual.
    const legacySessionBoots=(source.match(/getSession\s*\(\s*\)[\s\S]{0,180}?boot\s*\(/g)||[]).length
    const trailingBoot=/await\s+boot\s*\(\s*\)\s*;\s*$/.test(source)
    if(legacySessionBoots!==0||trailingBoot){
      throw new Error(`Auditoria do núcleo falhou: bootstrap legado=${legacySessionBoots}, boot final=${trailingBoot?'presente':'removido'}.`)
    }

    window.__ISA_CORE_STARTED__=true
    const startup=`
      ${source}
      // Startup canônico: exatamente uma decisão de sessão para toda abertura da página.
      const __isaStartupSession = await supabase.auth.getSession();
      if(__isaStartupSession?.data?.session){
        await boot();
      }else{
        showView('loginView');
      }
    `
    const run=new Function('createClient','CONFIG',`return (async()=>{${startup}})()`)
    await run(createClient,CONFIG)

    window.__ISA_APP_READY__=true
    document.dispatchEvent(new CustomEvent('isa:core-ready',{detail:{version:window.__ISA_CORE_SINGLE_VERSION__}}))
    return true
  })().catch(error=>{
    window.__ISA_APP_ERROR__=String(error?.message||error||'Erro desconhecido')
    console.error('[núcleo único] Falha ao iniciar Cantinho da Isa:',error)
    const main=document.getElementById('mainView'),setup=document.getElementById('setupView'),login=document.getElementById('loginView')
    main?.classList.add('hidden');setup?.classList.add('hidden');login?.classList.remove('hidden')
    const msg=document.getElementById('loginMsg')
    if(msg)msg.textContent='Não foi possível carregar o Cantinho. Atualize a página e tente novamente.'
    document.dispatchEvent(new CustomEvent('isa:core-error',{detail:{message:window.__ISA_APP_ERROR__}}))
    throw error
  })
}

await window.__ISA_CORE_SINGLE_PROMISE__
