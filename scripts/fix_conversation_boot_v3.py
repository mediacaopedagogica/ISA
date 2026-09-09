from pathlib import Path

app = Path('app-v33.js')
s = app.read_text()

# Undo the accidental timeout block inserted in the permissions/admin refresh path.
accidental_start = '          const coreLoad = Promise.allSettled([loadFamily(), loadConversations()]);\n      const coreBootResult = await Promise.race(['
accidental_end = '      }\n           toast("Permiss\\xF5es atualizadas");'
if accidental_start in s and accidental_end in s:
    a = s.index(accidental_start)
    b = s.index(accidental_end, a)
    s = s[:a] + '          await Promise.all([loadFamily(), loadConversations()]);\n' + s[b + len('      }\n'):]

# Patch only the real application boot sequence.
boot_marker = '    async function boot() {'
if boot_marker not in s:
    raise SystemExit('active boot function not found')
head, boot = s.split(boot_marker, 1)
old = '      await Promise.all([loadFamily(), loadConversations()]);'
new = '''      const coreLoad = Promise.allSettled([loadFamily(), loadConversations()]);
      await Promise.race([
        coreLoad,
        new Promise((resolve) => setTimeout(resolve, 6500))
      ]);
      const bootChatList = $("chatList");
      if (bootChatList && /Carregando conversas/i.test(bootChatList.textContent || "")) {
        bootChatList.innerHTML = '<div class="muted" style="padding:12px;line-height:1.5">As conversas demoraram para responder.<br><button id="conversationRetryBtn" type="button" class="tiny-btn" style="margin-top:8px">Tentar carregar novamente</button></div>';
        const retry = $("conversationRetryBtn");
        if (retry) retry.onclick = async () => {
          retry.disabled = true;
          retry.textContent = "Carregando…";
          bootChatList.innerHTML = '<p class="muted" style="padding:12px">Carregando conversas…</p>';
          await Promise.race([
            Promise.allSettled([loadFamily(), loadConversations()]),
            new Promise((resolve) => setTimeout(resolve, 6500))
          ]);
          if (/Carregando conversas/i.test(bootChatList.textContent || "")) {
            bootChatList.innerHTML = '<div class="muted" style="padding:12px;line-height:1.5">Ainda não foi possível atualizar as conversas. O restante do Cantinho continua disponível.<br><button id="conversationRetryBtn2" type="button" class="tiny-btn" style="margin-top:8px">Tentar novamente</button></div>';
            const retry2 = $("conversationRetryBtn2");
            if (retry2) retry2.onclick = () => location.reload();
          }
        };
      }'''
if 'const bootChatList = $("chatList");' not in boot:
    if old not in boot:
        raise SystemExit('active boot await marker not found')
    boot = boot.replace(old, new, 1)
else:
    print('active boot already contains recovery block')
s = head + boot_marker + boot
app.write_text(s)

index = Path('index.html')
h = index.read_text()
h = h.replace('./app-v33.js?v=stable-54-conversation-boot', './app-v33.js?v=stable-55-conversation-boot', 1)
h = h.replace('./app-v33.js?v=stable-52-avatar', './app-v33.js?v=stable-55-conversation-boot', 1)
index.write_text(h)

print('conversation boot v3 active patch applied')
