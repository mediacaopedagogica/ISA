import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { CONFIG } from './config.js?v=20260910-single-core'

// Núcleo único do Cantinho.
// Os chunks legados possuem dois gatilhos de boot: um getSession() antigo no chunk-06
// e o boot final do chunk-09. Aqui o gatilho antigo é removido ANTES da execução.
if(!window.__ISA_CORE_SINGLE_PROMISE__){
  window.__ISA_SCRIPT_LOADED__=true
  window.__ISA_CORE_SINGLE_VERSION__='v1'

  window.__ISA_CORE_SINGLE_PROMISE__=(async()=>{
    const files=['chunk-00.txt','chunk-01.txt','chunk-02.txt','chunk-03.txt','chunk-04.txt','chunk-05.txt','chunk-06.txt','chunk-07.txt','chunk-08.txt','chunk-09.txt']
    const parts=await Promise.all(files.map(async(file,index)=>{
      const response=await fetch(`./${file}?v=47-single-core`,{cache:'no-store'})
      if(!response.ok)throw new Error(`Falha ao carregar ${file} (${response.status})`)
      let text=await response.text()
      if(index===6){
        const legacy="const {data:{session}}=await supabase.auth.getSession();session?boot():showView('loginView')"
        if(text.includes(legacy)){
          text=text.replace(legacy,"/* boot legado removido: chunk-09 é o único dono da abertura */")
        }else{
          // Não executa silenciosamente uma versão desconhecida que possa voltar a abrir o núcleo duas vezes.
          throw new Error('Assinatura do boot legado não encontrada no chunk-06.')
        }
      }
      return text
    }))

    const source=parts.join('')
    const finalBoots=(source.match(/await\s+boot\s*\(\s*\)\s*;/g)||[]).length
    const legacyBoots=(source.match(/getSession\s*\(\s*\)[\s\S]{0,120}?boot\s*\(/g)||[]).length
    if(finalBoots!==1||legacyBoots!==0){
      throw new Error(`Auditoria do núcleo falhou: boot final=${finalBoots}, boot legado=${legacyBoots}.`)
    }

    window.__ISA_CORE_STARTED__=true
    const run=new Function('createClient','CONFIG',`return (async()=>{${source}})()`)
    await run(createClient,CONFIG)
    window.__ISA_APP_READY__=true
    document.dispatchEvent(new CustomEvent('isa:core-ready'))
    return true
  })().catch(error=>{
    window.__ISA_APP_ERROR__=String(error?.message||error||'Erro desconhecido')
    console.error('[núcleo único] Falha ao iniciar Cantinho da Isa:',error)
    const main=document.getElementById('mainView'),setup=document.getElementById('setupView'),login=document.getElementById('loginView')
    main?.classList.add('hidden');setup?.classList.add('hidden');login?.classList.remove('hidden')
    const msg=document.getElementById('loginMsg');if(msg)msg.textContent='Não foi possível carregar o Cantinho. Atualize a página e tente novamente.'
    throw error
  })
}

await window.__ISA_CORE_SINGLE_PROMISE__
