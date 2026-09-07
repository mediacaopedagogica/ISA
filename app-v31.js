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

  // Visual aprovado. CSS não bloqueia o login e mantém 3D/corações/mobile.
  css('isaApp3dRestore','./app-3d.css?v=restore-37')
  css('isaMobileRestore','./mobile-responsive-v2.css?v=7-restore')
  css('isaHeartRestore','./heart-polish.css?v=restore-37')
  css('isaChatCardsRestore','./chat-cards-3d-v2.css?v=3-restore')

  // Núcleo único: login, chat, leitura e presença Online/Offline.
  const core=document.createElement('script')
  core.id='isaCoreV34Restored'
  core.src='./app-v34.js?v=34-restored-37'
  core.async=false
  core.onload=()=>{
    // Só conectores pequenos. Recursos pesados ficam lazy no extras-loader.
    module('isaMobileJsRestore','./mobile-responsive-v2.js?v=7-restore')
    module('isaNotificationsRestore','./notifications-v2.js?v=5-restore')
    module('isaExtrasRestore','./extras-loader.js?v=14-restore')
  }
  core.onerror=()=>fail('Não foi possível carregar o núcleo do Cantinho. Recarregue a página.')
  document.body.appendChild(core)
})()
