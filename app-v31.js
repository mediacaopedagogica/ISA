(()=>{
  if(window.__ISA_LIGHT_BOOT__)return
  window.__ISA_LIGHT_BOOT__=true

  function css(id,href){
    let el=document.getElementById(id)
    if(el)return el
    el=document.createElement('link')
    el.id=id;el.rel='stylesheet';el.href=href
    document.head.appendChild(el)
    return el
  }
  function module(id,src){
    if(document.getElementById(id))return
    const s=document.createElement('script')
    s.id=id;s.type='module';s.src=src;s.async=true
    document.body.appendChild(s)
  }
  function fail(text){
    console.error(text)
    const msg=document.getElementById('loginMsg')
    if(msg){msg.textContent=text;msg.style.color='#a15472'}
  }

  // Visual aprovado: 3D pastel, responsivo e acabamento de corações.
  css('isaApp3dRestore','./app-3d.css?v=restore-1')
  css('isaMobileRestore','./mobile-responsive-v2.css?v=6-restore')
  css('isaHeartRestore','./heart-polish.css?v=restore-1')

  // Núcleo único e estável. Contém login, chat, leitura e presença Online/Offline.
  const core=document.createElement('script')
  core.id='isaCoreV34Restored'
  core.src='./app-v34.js?v=34-restored-1'
  core.async=false
  core.onload=()=>{
    // Estes módulos são pequenos e só ligam comportamento. Ferramentas pesadas continuam lazy.
    module('isaMobileJsRestore','./mobile-responsive-v2.js?v=6-restore')
    module('isaNotificationsRestore','./notifications-v2.js?v=4-restore')
    module('isaExtrasRestore','./extras-loader.js?v=13-restore')
  }
  core.onerror=()=>fail('Não foi possível carregar o núcleo do Cantinho. Recarregue a página.')
  document.body.appendChild(core)
})()
