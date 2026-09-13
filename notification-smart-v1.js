// Cantinho da Isa — Notificações Inteligentes v1
// Camada isolada: badge PWA + deep-link de push para a conversa exata.
// Não altera o motor do Chat, dashboards, Nossa Rede ou permissões.
import { CONFIG } from './config.js'

if(!window.__ISA_SMART_NOTIFICATIONS_V1__){
  window.__ISA_SMART_NOTIFICATIONS_V1__=true

  const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  const APPROVED=new Set(['keise','isa','alan'])
  let deepLinkDone=false,badgeTimer=0

  function token(){
    try{
      const ref=new URL(CONFIG.SUPABASE_URL).hostname.split('.')[0]
      const raw=localStorage.getItem(`sb-${ref}-auth-token`)
      if(!raw)return''
      const d=JSON.parse(raw)
      return d?.access_token||d?.currentSession?.access_token||d?.session?.access_token||''
    }catch{return''}
  }

  async function unreadCount(){
    const t=token();if(!t)return null
    try{
      const r=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/get_my_unread_message_count`,{
        method:'POST',
        headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${t}`,'Content-Type':'application/json'},
        body:'{}',cache:'no-store'
      })
      if(!r.ok)return null
      const n=Number(await r.json())
      return Number.isFinite(n)?Math.max(0,n):0
    }catch{return null}
  }

  async function setBadge(value){
    const n=Math.max(0,Number(value)||0)
    try{
      if(n>0&&typeof navigator.setAppBadge==='function')await navigator.setAppBadge(n)
      else if(n===0&&typeof navigator.clearAppBadge==='function')await navigator.clearAppBadge()
    }catch{}
    return n
  }

  async function refreshBadge(){
    clearTimeout(badgeTimer)
    const n=await unreadCount()
    if(n!==null)await setBadge(n)
    return n
  }

  function scheduleBadge(delay=850){
    clearTimeout(badgeTimer)
    badgeTimer=setTimeout(()=>refreshBadge(),delay)
  }

  function nativeClick(el){
    try{HTMLElement.prototype.click.call(el);return true}catch{}
    try{return el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}))}catch{return false}
  }

  function cleanDeepLink(){
    try{
      const u=new URL(location.href)
      u.searchParams.delete('abrir')
      u.searchParams.delete('conversation')
      u.searchParams.delete('conv')
      u.searchParams.delete('marcar')
      history.replaceState(history.state,'',u.pathname+(u.searchParams.toString()?`?${u.searchParams}`:'')+u.hash)
    }catch{}
  }

  function openDeepLink(){
    if(deepLinkDone)return true
    const q=new URLSearchParams(location.search)
    const id=String(q.get('conversation')||q.get('conv')||'').trim()
    const requested=String(q.get('perfil')||'').trim().toLowerCase()
    const wantsChat=q.get('abrir')==='chat'||q.has('conversation')||q.has('conv')
    if(!wantsChat||!UUID.test(id))return false

    let attempts=0
    const tryOpen=()=>{
      if(deepLinkDone)return
      if(window.__ISA_APP_READY__===true){
        const approvedProfile=APPROVED.has(requested)
        const approvedApi=window.__ISA_APPROVED_DASHBOARD__

        // Caminho principal: a notificação entrega só o UUID e reutiliza o
        // roteador aprovado já existente. Não cria nem intercepta outro roteador.
        if(approvedProfile&&typeof approvedApi?.openConversation==='function'){
          let opened=false
          try{opened=approvedApi.openConversation(id)===true}catch{}
          if(opened){
            deepLinkDone=true
            cleanDeepLink()
            scheduleBadge(1300)
            return
          }
        }else if(approvedProfile){
          // Compatibilidade apenas enquanto o dashboard termina de publicar a API.
          const approved=[...document.querySelectorAll('#kaConversationList [data-ka-conv]')]
            .find(x=>String(x.dataset.kaConv||'')===id)
          if(approved){
            deepLinkDone=true
            nativeClick(approved)
            cleanDeepLink()
            scheduleBadge(1300)
            return
          }
        }else{
          const card=[...document.querySelectorAll('#chatList .chat-item[data-conv]')]
            .find(x=>String(x.dataset.conv||'')===id)
          if(card){
            deepLinkDone=true
            nativeClick(card)
            cleanDeepLink()
            scheduleBadge(1300)
            return
          }
        }
      }
      if(++attempts<60)setTimeout(tryOpen,180)
    }
    tryOpen();return true
  }

  if('serviceWorker'in navigator){
    navigator.serviceWorker.addEventListener('message',event=>{
      const d=event.data||{}
      if(d.type!=='isa-urgent-notification'&&d.type!=='isa-push-badge')return
      if(Number.isFinite(Number(d.badgeCount)))setBadge(Number(d.badgeCount))
      else scheduleBadge(450)
    })
  }

  document.addEventListener('click',e=>{
    if(e.target?.closest?.('#chatList .chat-item[data-conv],#kaConversationList [data-ka-conv]'))scheduleBadge(1200)
  },true)
  document.addEventListener('isa:approved-home-ready',()=>{openDeepLink();scheduleBadge(700)})
  document.addEventListener('isa:keise-approved-home-built',()=>{openDeepLink();scheduleBadge(700)})
  document.addEventListener('isa:final-shell-ready',()=>{openDeepLink();scheduleBadge(700)})
  window.addEventListener('focus',()=>scheduleBadge(300))
  window.addEventListener('pageshow',()=>{openDeepLink();scheduleBadge(500)})
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){openDeepLink();scheduleBadge(350)}})

  setTimeout(openDeepLink,350)
  setTimeout(()=>refreshBadge(),900)
  setInterval(()=>{if(document.visibilityState==='visible')refreshBadge()},60000)

  window.__ISA_SMART_NOTIFICATIONS__={refreshBadge,openDeepLink,setBadge}
}
