from pathlib import Path
p=Path('chunk-09.txt')
s=p.read_text(encoding='utf-8')
old="if(activeConversation?.id===convId){await loadMessages(activeConversation.id);renderTimeline()}"
new="if(activeConversation?.id===convId){if(!activeSupervisionMode)await markRead(convId);await loadMessages(activeConversation.id);renderTimeline()}"
if old not in s:
    raise SystemExit('active conversation realtime pattern not found')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')

p=Path('index.html')
s=p.read_text(encoding='utf-8')
if './app-v33.js?v=33' not in s:
    raise SystemExit('v33 entry not found')
s=s.replace('./app-v33.js?v=33','./app-v34.js?v=34')
p.write_text(s,encoding='utf-8')
