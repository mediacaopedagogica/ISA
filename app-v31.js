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
  function showLogin(){
    document.getElementById('loginView')?.classList.remove('hidden')
  }
  function personalOverlay(text='Entrando no seu Cantinho…'){
    let el=document.getElementById('personalBootOverlay')
    if(!el){
      el=document.createElement('div')
      el.id='personalBootOverlay'
      el.style.cssText='position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 15% 15%,#fff0f6 0 18%,transparent 42%),radial-gradient(circle at 86% 12%,#eee4ff 0 18%,transparent 42%),#f8f2fb;color:#65536f;font-family:Inter,Segoe UI,system-ui,sans-serif'
      el.innerHTML='<div style="width:min(440px,94vw);padding:34px 28px;text-align:center;border-radius:32px;background:rgba(255,255,255,.86);border:1px solid rgba(255,255,255,.96);box-shadow:0 20px 55px rgba(95,70,110,.14)"><div style="font-size:52px;color:#dca7c9">♥</div><h2 id="personalBootTitle" style="margin:10px 0 8px">Abrindo seu Cantinho…</h2><p id="personalBootText" style="margin:0;color:#92849a">Entrando…</p></div>'
      document.body.appendChild(el)
    }
    const p=document.getElementById('personalBootText');if(p)p.textContent=text
    return el
  }
  function fail(text,personal=false){
    console.error(text)
    if(personal){
      const el=personalOverlay(text)
      const title=document.getElementById('personalBootTitle');if(title)title.textContent='Não foi possível abrir'
      let b=el.querySelector('button')
      if(!b){b=document.createElement('button');b.type='button';b.textContent='Tentar novamente';b.style.cssText='margin-top:18px;border:0;border-radius:16px;padding:12px 18px;background:#e8dcff;color:#655078;font-weight:800;cursor:pointer';b.onclick=()=>location.reload();el.firstElementChild?.appendChild(b)}
      document.getElementById('loginView')?.classList.add('hidden')
      return
    }
    showLogin()
    const msg=document.getElementById('loginMsg')
    if(msg){msg.textContent=text;msg.style.color='#a15472'}
  }

  css('isaApp3dRestore','./app-3d.css?v=restore-37')
  css('isaMobileRestore','./mobile-responsive-v2.css?v=7-restore')
  css('isaHeartRestore','./heart-polish.css?v=restore-37')
  css('isaChatCardsRestore','./chat-cards-3d-v2.css?v=3-restore')

  const params=new URLSearchParams(location.search)
  const hash=new URLSearchParams(location.hash.replace(/^#/,''))
  const personal=params.get('entry')==='personal-v43'
  const accessToken=hash.get('access_token')||''
  const refreshToken=hash.get('refresh_token')||''

  function loadCore(personalMode=false){
    if(document.getElementById('isaCoreV34Restored'))return
    if(personalMode){
      const overlay=personalOverlay('Carregando suas conversas…')
      const main=document.getElementById('mainView')
      const login=document.getElementById('loginView')
      const watch=()=>{
        if(main&&!main.classList.contains('hidden')){overlay.remove();observer.disconnect();return}
        if(login&&!login.classList.contains('hidden')){
          login.classList.add('hidden')
          fail('A sessão foi criada, mas o perfil não abriu corretamente. Tente novamente.',true)
          observer.disconnect()
        }
      }
      const observer=new MutationObserver(watch)
      if(main)observer.observe(main,{attributes:true,attributeFilter:['class']})
      if(login)observer.observe(login,{attributes:true,attributeFilter:['class']})
      setTimeout(()=>{
        if(main?.classList.contains('hidden'))personalOverlay('Ainda carregando…')
      },5000)
    }else{
      showLogin()
    }

    const core=document.createElement('script')
    core.id='isaCoreV34Restored'
    core.src='./app-v34.js?v=34-restored-43'
    core.async=false
    core.onload=()=>{
      module('isaMobileJsRestore','./mobile-responsive-v2.js?v=7-restore')
      module('isaNotificationsRestore','./notifications-v2.js?v=5-restore')
      module('isaExtrasRestore','./extras-loader.js?v=14-restore')
    }
    core.onerror=()=>fail('Não foi possível carregar o núcleo do Cantinho. Recarregue a página.',personalMode)
    document.body.appendChild(core)
  }

  ;(async()=>{
    if(!personal){loadCore(false);return}
    personalOverlay('Confirmando sua sessão…')
    if(!accessToken||!refreshToken){
      fail('A chave da sessão não chegou completa ao aplicativo.',true)
      return
    }
    try{
      const [{createClient},{CONFIG}]=await Promise.all([
        import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'),
        import('./config.js')
      ])
      const sb=createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}})
      const {error}=await sb.auth.setSession({access_token:accessToken,refresh_token:refreshToken})
      if(error)throw error
      const {data:{user},error:userError}=await sb.auth.getUser()
      if(userError||!user)throw userError||new Error('Sessão sem usuário')
      history.replaceState(null,'','./?entry=personal-v43')
      loadCore(true)
    }catch(e){
      fail(e?.message||'Não foi possível confirmar sua sessão.',true)
    }
  })()
})()
