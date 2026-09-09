from pathlib import Path

app=Path('app-v33.js')
s=app.read_text()
start=s.index('    function openPermissionDialog(id) {')
end=s.index('    function openPasswordDialog(id) {', start)
block=s[start:end]
close='          closeDialog();\n'
a=block.index(close)+len(close)
b=block.index('          toast(', a)
block=block[:a]+'          await Promise.all([loadFamily(), loadConversations()]);\n'+block[b:]
s=s[:start]+block+s[end:]
app.write_text(s)

idx=Path('index.html')
h=idx.read_text().replace('./app-v33.js?v=stable-56-conversation-boot','./app-v33.js?v=stable-57-conversation-boot',1)
idx.write_text(h)
print('admin refresh cleaned; live boot recovery preserved')
