from pathlib import Path

app = Path('app-v33.js')
s = app.read_text()

# Revert the timeout block that v2 accidentally placed in the permissions refresh path.
needle = '          const coreLoad = Promise.allSettled([loadFamily(), loadConversations()]);\n      const coreBootResult = await Promise.race(['
if needle in s:
    start = s.index(needle)
    toast = s.find('           toast("Permiss\\xF5es atualizadas");', start)
    if toast != -1:
        s = s[:start] + '          await Promise.all([loadFamily(), loadConversations()]);\n' + s[toast:]

# app-v33 currently contains more than one bundled boot function. The last one is the live app boot.
boot_marker = '    async function boot() {'
if boot_marker not in s:
    raise SystemExit('boot marker not found')
head, boot = s.rsplit(boot_marker, 1)
old = '      await Promise.all([loadFamily(), loadConversations()]);'
recovery = '''      const coreLoad = Promise.allSettled([loadFamily(), loadConversations()]);
      await Promise.race([
        coreLoad,
        new Promise((resolve) => setTimeout(resolve, 6500))
      ]);
      const bootChatList = $("chatList");
      if (bootChatList && /Carregando conversas/i.test(bootChatList.textContent || "")) {
        bootChatList.innerHTML = '<div class="muted" style="padding:12px;line-height:1.5">As conversas demoraram para responder.<br><button id="conversationRetryBtn" type="button" class="tiny-btn" style="margin-top:8px">Tentar carregar novamente</button></div>';
        const retry = $("conversationRetryBtn");
        if (retry) retry.onclick = async () => {
          bootChatList.innerHTML = '<p class="muted" style="padding:12px">Carregando conversas…</p>';
          await Promise.race([
            Promise.allSettled([loadFamily(), loadConversations()]),
            new Promise((resolve) => setTimeout(resolve, 6500))
          ]);
          if (/Carregando conversas/i.test(bootChatList.textContent || "")) {
            bootChatList.innerHTML = '<div class="muted" style="padding:12px;line-height:1.5">Ainda não foi possível atualizar as conversas. O restante do Cantinho continua disponível.<br><button id="conversationRetryBtn2" type="button" class="tiny-btn" style="margin-top:8px">Tentar novamente</button></div>';
            const retry2 = $("conversationRetryBtn2");
            if (retry2) retry2.onclick = async () => {
              bootChatList.innerHTML = '<p class="muted" style="padding:12px">Carregando conversas…</p>';
              await Promise.race([
                Promise.allSettled([loadFamily(), loadConversations()]),
                new Promise((resolve) => setTimeout(resolve, 6500))
              ]);
              if (/Carregando conversas/i.test(bootChatList.textContent || "")) {
                bootChatList.innerHTML = '<div class="muted" style="padding:12px;line-height:1.5">Conexão com as conversas indisponível no momento. As outras áreas continuam funcionando.</div>';
              }
            };
          }
        };
      }'''

pre_hydrate = boot.split('      hydrateAvatarElements().catch(() => {', 1)[0]
if 'const bootChatList = $("chatList");' not in pre_hydrate:
    if old not in pre_hydrate:
        raise SystemExit('live boot await marker not found')
    boot = boot.replace(old, recovery, 1)

s = head + boot_marker + boot
app.write_text(s)

index = Path('index.html')
h = index.read_text()
for version in ['stable-52-avatar','stable-54-conversation-boot','stable-55-conversation-boot']:
    h = h.replace('./app-v33.js?v=' + version, './app-v33.js?v=stable-56-conversation-boot', 1)
index.write_text(h)
print('conversation boot v4 patched final live boot')
