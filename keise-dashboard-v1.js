// Compatibilidade: o layout antigo da Keise foi aposentado.
// Qualquer referência histórica a este arquivo encaminha para o ÚNICO layout aprovado.
(async()=>{
  try{
    if(!window.__ISA_KEISE_APPROVED_LAYOUT__){
      await import('./keise-approved-layout-final.js?v=1-last-approved')
    }
    window.__ISA_SHOW_KEISE_HOME__?.()
  }catch(error){
    console.warn('Keise approved layout:',error)
  }
})()
