from pathlib import Path

# Keep optional modules out of the way until the core conversation list has finished booting.
p = Path('index.html')
s = p.read_text()
if 'personal-access-recovery.js?v=1-alan' not in s:
    marker = '<script defer src="./mobile-interaction-guard.js?v=4-early"></script>'
    if marker not in s:
        raise SystemExit('index mobile guard marker not found')
    s = s.replace(
        marker,
        '<script defer src="./personal-access-recovery.js?v=1-alan"></script>\n'
        '<script defer src="./mobile-interaction-guard.js?v=5-personal"></script>',
        1,
    )
else:
    s = s.replace('./mobile-interaction-guard.js?v=4-early', './mobile-interaction-guard.js?v=5-personal')
s = s.replace('./app-v33.js?v=stable-52-avatar', './app-v33.js?v=stable-53-alan-personal')
old = """    const main=document.getElementById('mainView'),name=String(document.getElementById('myName')?.textContent||'').trim();
    if(main&&!main.classList.contains('hidden')&&name&&name!=='Família'){"""
new = """    const main=document.getElementById('mainView'),name=String(document.getElementById('myName')?.textContent||'').trim();
    const list=document.getElementById('chatList'),coreReady=!list||!/Carregando conversas/i.test(list.textContent||'');
    if(main&&!main.classList.contains('hidden')&&name&&name!=='Família'&&coreReady){"""
if old in s:
    s = s.replace(old, new, 1)
elif 'coreReady=!list||!/Carregando conversas/i.test' not in s:
    raise SystemExit('index extras gate marker not found')
p.write_text(s)

# The same personal link now always opens the repaired build, not a stale browser copy.
p = Path('acesso-v41.html')
s = p.read_text()
old_redirect = "u.searchParams.set('v','54');u.hash='';"
new_redirect = "u.searchParams.set('v','55');u.searchParams.set('_cb',String(Date.now()));u.hash='';"
if old_redirect in s:
    s = s.replace(old_redirect, new_redirect, 1)
elif "u.searchParams.set('v','55')" not in s:
    raise SystemExit('personal access redirect marker not found')
p.write_text(s)

# Do not leave the whole UI waiting forever on a family/conversation fetch.
p = Path('app-v33.js')
s = p.read_text()
needle = 'await Promise.all([loadFamily(), loadConversations()]);'
anchor = s.find('Carregando conversas')
if anchor < 0:
    raise SystemExit('chat loading anchor not found')
pos = s.find(needle, anchor)
if pos >= 0:
    replacement = '''const coreBoot = Promise.allSettled([loadFamily(), loadConversations()]);
      await Promise.race([coreBoot, new Promise((resolve) => setTimeout(resolve, 5e3))]);
      const bootChatList = $("chatList");
      if (bootChatList && /Carregando conversas/i.test(bootChatList.textContent || "")) {
        bootChatList.innerHTML = '<div class="muted" style="padding:12px;line-height:1.45">As conversas demoraram para carregar.<br><button id="conversationRetryBtn" type="button" class="tiny-btn" style="margin-top:8px">Tentar novamente</button></div>';
        const retry = $("conversationRetryBtn");
        if (retry) retry.onclick = () => location.reload();
      }'''
    s = s[:pos] + replacement + s[pos + len(needle):]
elif 'const coreBoot = Promise.allSettled([loadFamily(), loadConversations()]);' not in s:
    raise SystemExit('core boot marker not found')
p.write_text(s)

print('Alan personal access v55 patched')
