from pathlib import Path

app = Path('app-v33.js')
source = app.read_text()

old = '      await Promise.all([loadFamily(), loadConversations()]);'
new = '''      const coreLoad = Promise.allSettled([loadFamily(), loadConversations()]);
      const coreBootResult = await Promise.race([
        coreLoad.then(() => "ready"),
        new Promise((resolve) => setTimeout(() => resolve("timeout"), 6500))
      ]);
      const bootChatList = $("chatList");
      if (coreBootResult === "timeout" && bootChatList && /Carregando conversas/i.test(bootChatList.textContent || "")) {
        bootChatList.innerHTML = '<div class="muted" style="padding:12px;line-height:1.5">As conversas demoraram para responder.<br><button id="conversationRetryBtn" type="button" class="tiny-btn" style="margin-top:8px">Tentar carregar novamente</button></div>';
        const retry = $("conversationRetryBtn");
        if (retry) retry.onclick = async () => {
          retry.disabled = true;
          retry.textContent = "Carregando…";
          await Promise.race([
            Promise.allSettled([loadFamily(), loadConversations()]),
            new Promise((resolve) => setTimeout(resolve, 6500))
          ]);
          if (/Carregando conversas|demoraram para responder/i.test(bootChatList.textContent || "")) {
            retry.disabled = false;
            retry.textContent = "Tentar carregar novamente";
          }
        };
      }'''

if 'const coreBootResult = await Promise.race' not in source:
    if old not in source:
        raise SystemExit('conversation boot await marker not found')
    source = source.replace(old, new, 1)
    app.write_text(source)

index = Path('index.html')
html = index.read_text()
html = html.replace('./app-v33.js?v=stable-52-avatar', './app-v33.js?v=stable-54-conversation-boot', 1)
html = html.replace('./app-v33.js?v=stable-53-alan-personal', './app-v33.js?v=stable-54-conversation-boot', 1)

old_extra = """    const main=document.getElementById('mainView'),name=String(document.getElementById('myName')?.textContent||'').trim();
    if(main&&!main.classList.contains('hidden')&&name&&name!=='Família'){"""
new_extra = """    const main=document.getElementById('mainView'),name=String(document.getElementById('myName')?.textContent||'').trim();
    const list=document.getElementById('chatList'),coreReady=!list||!/Carregando conversas/i.test(list.textContent||'');
    if(main&&!main.classList.contains('hidden')&&name&&name!=='Família'&&coreReady){"""
if 'coreReady=!list||!/Carregando conversas/i.test' not in html:
    if old_extra not in html:
        raise SystemExit('postboot readiness marker not found')
    html = html.replace(old_extra, new_extra, 1)

index.write_text(html)
print('conversation boot v2 patch applied')
