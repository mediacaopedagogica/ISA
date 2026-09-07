// Carregador isolado da área avançada da Paloma no celular.
// Ele evita que alterações visuais feitas pelo próprio módulo avancado
// disparem o MutationObserver dele em ciclo e travem os toques da tela.
const NativeMutationObserver=window.MutationObserver

class PalomaMobileMutationObserver extends NativeMutationObserver{
  constructor(callback){
    super((records,observer)=>{
      const useful=records.filter(record=>{
        let target=record.target
        if(target?.nodeType!==1)target=target?.parentElement
        if(!target?.closest)return true
        // Estes dois pontos são atualizados pelo próprio módulo avançado.
        // Ignorá-los impede realimentação infinita sem esconder mudanças reais
        // feitas pelo editor/base dos Estudos.
        if(target.closest('.ps-coming'))return false
        if(target.closest('#psaEditorMeta'))return false
        return true
      })
      if(useful.length)callback(useful,observer)
    })
  }
}

window.MutationObserver=PalomaMobileMutationObserver
try{
  await import('./paloma-studies-advanced.js?v=2-mobile-stable')
}finally{
  window.MutationObserver=NativeMutationObserver
}
