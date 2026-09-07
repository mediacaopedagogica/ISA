const desktopNotebook=()=>{
  const params=new URLSearchParams(location.search)
  return params.get('mobile')!=='1'&&!/acesso-mobile\.html$/i.test(location.pathname)&&matchMedia('(min-width:851px)').matches
}

function desktopCSSFor(key){
  const common=`
    html,body{width:100%!important;height:100%!important;min-height:100%!important;overflow:hidden!important}
    body{overscroll-behavior:none!important}
    .app{height:100vh!important;max-height:100vh!important;max-width:none!important;padding:10px 14px!important;overflow:hidden!important;display:flex!important;flex-direction:column!important}
    .top{flex:0 0 auto!important;margin-bottom:9px!important;gap:10px!important;align-items:center!important}
    .brand .m{font-size:clamp(30px,3.8vw,48px)!important;line-height:.82!important}
    .brand .d{font-size:clamp(31px,4vw,50px)!important;line-height:.9!important}
    .spark{font-size:26px!important;top:-10px!important}
    .ribbon{padding:5px 18px!important;font-size:12px!important}
    .stat,.restart{min-height:64px!important;padding:7px 8px!important;border-radius:15px!important}
    .small{font-size:10px!important}.count{font-size:21px!important}.hearts{font-size:20px!important}
    .layout{flex:1!important;min-height:0!important;overflow:hidden!important}
    .bottom{display:none!important}
  `
  if(key==='bricks')return common+`
    .top{grid-template-columns:1.55fr .52fr .52fr .45fr!important}
    .layout{display:block!important}
    .board{width:100%!important;height:100%!important;min-height:0!important;aspect-ratio:auto!important;border-radius:20px!important}
    .side{display:none!important}
    .bricks{padding:3.2% 2.6% 0!important;gap:2% .8%!important}
    .brick{font-size:clamp(19px,2vw,27px)!important}
  `
  if(key==='tetris')return common+`
    .top{grid-template-columns:1.6fr .5fr .5fr .48fr!important}
    .layout{display:grid!important;grid-template-columns:minmax(250px,38%) minmax(320px,1fr)!important;gap:12px!important;align-items:stretch!important}
    .boardWrap{height:100%!important;min-height:0!important;display:flex!important;align-items:center!important;justify-content:center!important}
    .board{height:100%!important;width:auto!important;max-width:100%!important;aspect-ratio:1/2!important;border-radius:18px!important}
    .side{min-height:0!important;padding:9px!important;gap:7px!important;border-radius:18px!important;overflow:hidden!important}
    .panel{padding:8px 10px!important;border-radius:13px!important}
    .panel h2{font-size:16px!important;margin:0 0 5px!important}
    .nextBox{height:82px!important;border-radius:12px!important}
    .nextBox canvas{width:96px!important;height:74px!important}
    .status{font-size:12px!important;min-height:18px!important}
    .controls{gap:6px!important}
    .ctrl{padding:8px 6px!important;border-radius:11px!important;font-size:16px!important}
    .ctrl.big{padding:8px!important;font-size:12px!important}
    .help{padding:8px 10px!important;border-radius:13px!important;font-size:11px!important;line-height:1.3!important}
  `
  return common+`
    .top{grid-template-columns:1.6fr .5fr .5fr .48fr!important}
    .layout{display:grid!important;grid-template-columns:minmax(0,1fr) 280px!important;gap:12px!important;align-items:stretch!important}
    .board{height:100%!important;width:auto!important;max-width:100%!important;aspect-ratio:1.04/1!important;justify-self:center!important;border-radius:18px!important}
    .side{min-height:0!important;padding:9px!important;gap:7px!important;border-radius:18px!important;overflow:hidden!important}
    .panel{padding:8px 10px!important;border-radius:13px!important}
    .panel h2{font-size:16px!important;margin:0 0 5px!important}
    .nextBubble{width:48px!important;height:48px!important;margin:5px auto!important;border-width:3px!important}
    .status{font-size:11px!important;line-height:1.25!important;min-height:28px!important}
    .help{padding:8px 10px!important;border-radius:13px!important;font-size:11px!important;line-height:1.3!important}
    .side .panel:last-child{font-size:11px!important}
    .side .panel:last-child p{margin:4px 0 0!important;font-size:10px!important}
  `
}

function gameKey(frame){
  let path=''
  try{path=new URL(frame.src,location.href).pathname.toLowerCase()}catch{}
  if(path.includes('bricks-pastel'))return'bricks'
  if(path.includes('tetris-pastel'))return'tetris'
  if(path.includes('bubble-shooter-pastel'))return'bubbles'
  return''
}

function applyNotebookFit(frame){
  if(!desktopNotebook()||!frame)return
  const key=gameKey(frame);if(!key)return
  try{
    const doc=frame.contentDocument
    if(!doc?.head)return
    let style=doc.getElementById('cantinhoEmbeddedNotebookStyle')
    if(!style){style=doc.createElement('style');style.id='cantinhoEmbeddedNotebookStyle';doc.head.appendChild(style)}
    style.textContent=desktopCSSFor(key)
    doc.documentElement.dataset.cantinhoNotebook='1'
    const fire=()=>{try{frame.contentWindow?.dispatchEvent(new Event('resize'))}catch{}}
    fire();setTimeout(fire,80);setTimeout(fire,280)
  }catch(error){console.warn('Ajuste notebook do joguinho:',error)}
}

function wireFrame(){
  if(!desktopNotebook())return false
  const frame=document.getElementById('cantinhoGameFrame')
  if(!frame)return false
  if(frame.dataset.notebookFitWired!=='1'){
    frame.dataset.notebookFitWired='1'
    frame.addEventListener('load',()=>applyNotebookFit(frame))
  }
  applyNotebookFit(frame)
  return true
}

if(desktopNotebook()){
  wireFrame()
  const obs=new MutationObserver(()=>wireFrame())
  obs.observe(document.documentElement,{childList:true,subtree:true})
  window.addEventListener('resize',()=>wireFrame())
}
