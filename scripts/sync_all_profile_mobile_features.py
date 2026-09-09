from pathlib import Path


def replace(path, old, new, count=1):
    p = Path(path)
    s = p.read_text()
    if old not in s:
        raise SystemExit(f"marker not found in {path}: {old[:90]}")
    p.write_text(s.replace(old, new, count))


replace(
    'games-menu.js',
    "const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR')",
    "const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'')",
)
replace(
    'games-menu.js',
    "function eligible(){const n=currentName();return['isa','paloma','elion','vania','davi'].includes(n)}",
    "function eligible(){const n=currentName();return['isa','keise','alan','paloma','elion','vania','davi'].includes(n)}",
)
replace(
    'games-menu.js',
    "function wireMain(){if(isExternal()||currentName()!=='isa')return;",
    "function wireMain(){if(isExternal()||!eligible())return;",
)

replace(
    'games-menu-snake.js',
    "const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR')",
    "const norm=v=>String(v||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'')",
)
replace(
    'games-menu-snake.js',
    "function eligible(){const n=currentName();return n==='isa'||n==='paloma'}",
    "function eligible(){const n=currentName();return['isa','keise','alan','paloma','elion','vania','davi'].includes(n)}",
)

p = Path('extras-loader.js')
s = p.read_text()
old = """    loadOnce('social-network','./social-network.js?v=3-family-feed'),
    loadOnce('social-network-bridge','./social-network-bridge-v2.js?v=3-touch-open')
  ]"""
new = """    loadOnce('social-network','./social-network.js?v=3-family-feed'),
    loadOnce('social-network-bridge','./social-network-bridge-v2.js?v=3-touch-open'),
    loadOnce('games','./games-menu.js?v=6-all-profiles'),
    loadOnce('snake-game','./games-menu-snake.js?v=2-all-profiles')
  ]
  if(!dedicatedMobile)jobs.push(loadOnce('games-notebook-fit','./games-notebook-fit.js?v=2-all-profiles'))"""
if old not in s:
    raise SystemExit('extras core marker not found')
s = s.replace(old, new, 1)
s = s.replace("    jobs.push(loadOnce('games','./games-menu.js?v=3-mobile-games'))\n", '', 1)
s = s.replace("    jobs.push(loadOnce('snake-game','./games-menu-snake.js?v=1'))\n", '', 1)
s = s.replace("    if(!dedicatedMobile)jobs.push(loadOnce('games-notebook-fit','./games-notebook-fit.js?v=1'))\n", '', 1)
p.write_text(s)

replace(
    'profile-status-stickers.js',
    "const textHost=host.querySelector('div:last-child');textHost?.appendChild(cloud);",
    "const textHost=host.querySelector('.friend-profile>div:nth-child(2)')||host.querySelector('div');textHost?.appendChild(cloud);",
)
p = Path('profile-status-stickers.js')
s = p.read_text()
marker = "function openSticker(){$('pssStickerModal').classList.add('show');drawSticker()}"
if marker not in s:
    raise SystemExit('sticker open marker not found')
s = s.replace(
    marker,
    marker + "\nwindow.__ISA_OPEN_PROFILE_STATUS__=()=>{if(!canPostStatus)return toast('Status não está liberado para este perfil.');openStatusModal()}\nwindow.__ISA_OPEN_STICKER_CREATOR__=()=>{if(!canSendSticker)return toast('Stickers não estão liberados para este perfil.');openSticker()}",
    1,
)
p.write_text(s)

p = Path('acesso-mobile.html')
s = p.read_text()
s = s.replace('./family-settings.js?v=2-mobile-notebook', './family-settings.js?v=3-all-links')
s = s.replace('./games-menu.js?v=5-family-all', './games-menu.js?v=6-all-profiles')
s = s.replace('./games-menu-snake.js?v=1', './games-menu-snake.js?v=2-all-profiles')
s = s.replace('./profile-status-stickers.js?v=1-all-family-mobile', './profile-status-stickers.js?v=2-all-links')
if './profile-actions.js?v=1-all-links' not in s:
    s = s.replace('</body>', '  <script type="module" src="./profile-actions.js?v=1-all-links"></script>\n</body>')
p.write_text(s)

p = Path('postboot-loader.js')
s = p.read_text()
s = s.replace("  './extras-loader.js?v=48-settings-social-v3',", "  './extras-loader.js?v=49-all-profile-features',")
s = s.replace(
    "  './profile-status-stickers.js?v=1-all-profiles'",
    "  './profile-status-stickers.js?v=2-all-links',\n  './profile-actions.js?v=1-all-links'",
)
p.write_text(s)

p = Path('index.html')
s = p.read_text()
s = s.replace('./postboot-loader.js?v=29-single-settings-entry', './postboot-loader.js?v=30-all-profile-mobile-actions')
p.write_text(s)

checks = {
    'games-menu.js': ["'keise'", "'alan'", "normalize('NFD')"],
    'extras-loader.js': ['v=6-all-profiles', 'games-notebook-fit'],
    'acesso-mobile.html': ['profile-actions.js?v=1-all-links', 'profile-status-stickers.js?v=2-all-links'],
    'postboot-loader.js': ['profile-actions.js?v=1-all-links', 'v=49-all-profile-features'],
    'profile-status-stickers.js': ['__ISA_OPEN_PROFILE_STATUS__', '__ISA_OPEN_STICKER_CREATOR__'],
}
for path, needles in checks.items():
    text = Path(path).read_text()
    missing = [x for x in needles if x not in text]
    if missing:
        raise SystemExit(f'{path} missing {missing}')

print('All-profile mobile feature sync applied')
