from pathlib import Path
import re

ROOT = Path('.')


def read(path):
    return (ROOT / path).read_text()


def write(path, text):
    (ROOT / path).write_text(text)
    print('updated', path)


def must_replace(text, old, new, label):
    if old not in text:
        raise SystemExit(f'marker not found: {label}')
    return text.replace(old, new, 1)


# 1) External chat core: expose the stable hooks used by audio/profile/media modules.
p = 'familia-externa.js'
s = read(p)
marker = "buildEmoji();bootstrap(false)"
if '__ISA_FRIEND_GET_ACTIVE_CONVERSATION_ID__' not in s:
    hooks = """window.__ISA_FRIEND_TOKEN__=token
window.__ISA_FRIEND_TOAST__=toast
window.__ISA_FRIEND_GET_ACTIVE_CONVERSATION_ID__=()=>activeConversation?.id||null
window.__ISA_FRIEND_REFRESH_MESSAGES__=()=>loadMessages(true)
window.__ISA_FRIEND_REFRESH_LIST__=()=>refreshConversations()
window.__ISA_FRIEND_SEND_PHOTO_FILE__=sendPhoto
"""
    s = must_replace(s, marker, hooks + marker, 'external hooks')
write(p, s)

# 2) External chat tools: real camera capture + existing image upload + recorder in the composer.
p = 'external-chat-tools.js'
s = read(p)
if "capturePhoto" not in s.split('\n', 3)[0:3]:
    s = must_replace(
        s,
        "import { CONFIG } from './config.js?v=20260909-access-fix'\n",
        "import { CONFIG } from './config.js?v=20260909-access-fix'\nimport { capturePhoto } from './media-capture.js?v=5-external-camera'\n",
        'camera import',
    )
if 'async function takePhotoNow()' not in s:
    anchor = "function activeConversationId(){return window.__ISA_FRIEND_GET_ACTIVE_CONVERSATION_ID__?.()||null}\n"
    code = """function activeConversationId(){return window.__ISA_FRIEND_GET_ACTIVE_CONVERSATION_ID__?.()||null}
async function takePhotoNow(){
  if(!activeConversationId())return toast('Abra uma conversa para tirar a foto.')
  try{const file=await capturePhoto();if(file)await window.__ISA_FRIEND_SEND_PHOTO_FILE__?.(file)}catch(e){toast(e.message||'Não foi possível tirar a foto.')}
}
function ensureMediaButtons(){
  const composer=document.querySelector('.friend-composer');if(!composer)return false
  const image=$('friendPhotoBtn'),emoji=$('friendEmojiBtn')
  if(image){image.textContent='🖼️';image.title='Enviar imagem';image.setAttribute('aria-label','Enviar imagem')}
  let camera=$('friendCameraBtn')
  if(!camera){camera=document.createElement('button');camera.id='friendCameraBtn';camera.type='button';camera.className='emoji-btn';camera.textContent='📷';camera.title='Tirar foto';camera.setAttribute('aria-label','Tirar foto');if(image)image.insertAdjacentElement('beforebegin',camera);else composer.prepend(camera)}
  if(camera.dataset.externalCameraBound!=='1'){camera.dataset.externalCameraBound='1';camera.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();takePhotoNow()})}
  let audio=$('friendAudioBtn')
  if(audio&&emoji&&audio.nextElementSibling!==emoji)emoji.insertAdjacentElement('beforebegin',audio)
  return true
}
"""
    s = must_replace(s, anchor, code, 'camera/media buttons')
s = s.replace("function ensure(){addStyle();ensureAvatarControl();ensureAudioButton()}", "function ensure(){addStyle();ensureAvatarControl();ensureAudioButton();ensureMediaButtons()}")
write(p, s)

# 3) External pages: same complete menu/features on mobile and notebook.
def patch_external_page(path, mobile):
    s = read(path)
    # Current mobile already has the complete five-item nav. Bring desktop to the same structure.
    old_profile = '''        <div class="friend-profile">\n          <div class="friend-avatar" aria-hidden="true">💜</div>\n          <div><small id="friendRelationship">Família</small><strong id="friendName">Perfil</strong></div>\n          <button id="friendSettingsBtn" class="friend-settings-menu" type="button" title="Configurações" aria-label="Configurações">⚙️ <span>Configurações</span></button>\n        </div>\n        <nav class="family-primary-nav" aria-label="Navegação principal">\n          <button id="friendChatsTab" class="family-primary-tab active" type="button">💬 <span>Conversas</span></button>\n          <button id="friendSocialBtn" class="family-primary-tab is-locked" type="button" disabled aria-disabled="true">🌸 <span>Nossa Rede</span></button>\n        </nav>'''
    new_profile = '''        <div class="friend-profile">\n          <div class="friend-avatar" aria-hidden="true">💜</div>\n          <div><small id="friendRelationship">Família</small><strong id="friendName">Perfil</strong></div>\n        </div>\n        <nav class="family-primary-nav" aria-label="Menu principal">\n          <button id="friendChatsTab" class="family-primary-tab active" type="button">💬 <span>Chat</span></button>\n          <button id="friendSocialBtn" class="family-primary-tab" type="button">🌸 <span>Nossa Rede</span></button>\n          <button id="friendProfileMenuBtn" class="family-primary-tab" type="button">☁️ <span>Perfil</span></button>\n          <button id="friendStickerMenuBtn" class="family-primary-tab" type="button">✨ <span>Stickers</span></button>\n          <button id="friendSettingsBtn" class="family-primary-tab icon-only friend-settings-menu" type="button" title="Configurações" aria-label="Configurações">⚙️</button>\n        </nav>'''
    if old_profile in s:
        s = s.replace(old_profile, new_profile, 1)

    old_comp = '''          <div class="friend-composer">\n            <button id="friendPhotoBtn" class="emoji-btn" type="button" title="Enviar imagem">📷</button>\n            <input id="friendPhotoInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden>\n            <button id="friendEmojiBtn" class="emoji-btn" type="button" title="Emojis">😊</button>'''
    old_comp_mobile = '''          <div class="friend-composer">\n            <button id="friendPhotoBtn" class="emoji-btn" type="button" title="Enviar imagem" aria-label="Enviar imagem">📷</button>\n            <input id="friendPhotoInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden>\n            <button id="friendEmojiBtn" class="emoji-btn" type="button" title="Emojis" aria-label="Emojis">😊</button>'''
    new_comp = '''          <div class="friend-composer">\n            <button id="friendCameraBtn" class="emoji-btn" type="button" title="Tirar foto" aria-label="Tirar foto">📷</button>\n            <button id="friendPhotoBtn" class="emoji-btn" type="button" title="Enviar imagem" aria-label="Enviar imagem">🖼️</button>\n            <input id="friendPhotoInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden>\n            <button id="friendAudioBtn" class="emoji-btn external-audio-btn" type="button" title="Gravar áudio" aria-label="Gravar áudio">🎙️</button>\n            <button id="friendEmojiBtn" class="emoji-btn" type="button" title="Emojis" aria-label="Emojis">😊</button>'''
    if old_comp_mobile in s:
        s = s.replace(old_comp_mobile, new_comp, 1)
    elif old_comp in s:
        s = s.replace(old_comp, new_comp, 1)
    elif 'id="friendCameraBtn"' not in s:
        raise SystemExit(f'composer marker not found: {path}')

    # Cache bust the core module.
    s = re.sub(r"\.\/familia-externa\.js\?v=[^\"']+", "./familia-externa.js?v=11-all-family-features", s, count=1)

    # Replace the progressive loader with an immediate, parallel core feature load.
    start = s.find('    async function loadExtras(){')
    if start < 0:
        raise SystemExit(f'loadExtras not found: {path}')
    end = s.find('    if(window.__ISA_FRIEND_PORTAL_ENTERED__===true)loadExtras()', start)
    if end < 0:
        raise SystemExit(f'loadExtras end not found: {path}')
    study_advanced = './paloma-studies-advanced-mobile.js?v=6-all-family-features' if mobile else './paloma-studies-advanced.js?v=3-all-family-features'
    body = f'''    async function loadExtras(){{
      if(extrasStarted)return
      extrasStarted=true
      const name=String(window.__ISA_FRIEND_PERSON__?.name||'').trim().toLowerCase()
      const core=[
        './family-settings.js?v=9-all-family-features',
        './external-menu.js?v=2-all-family-features',
        './external-chat-tools.js?v=2-all-family-features',
        './familia-emoji-completo.js?v=7-all-family-features',
        './profile-status-stickers.js?v=8-all-family-features',
        './call-manager.js?v=14-all-family-features',
        './family-social.js?v=9-all-family-features'
      ]
      const loaded=await Promise.allSettled(core.map(src=>import(src)))
      loaded.forEach((r,i)=>{{if(r.status==='rejected')console.warn('Recurso principal não carregou:',core[i],r.reason)}})
      window.__ISA_ENSURE_FAMILY_SETTINGS__?.()
      window.__ISA_ENSURE_EXTERNAL_MENU__?.()
      window.__ISA_ENSURE_FAMILY_SOCIAL__?.()
      setTimeout(async()=>{{
        for(const src of['./link-preview.js?v=11-all-family-features','./games-menu.js?v=10-all-family-features','./games-menu-snake.js?v=6-all-family-features'])await safeImport(src)
      }},650)
      if(name.includes('paloma'))setTimeout(async()=>{{
        for(const src of['./paloma-studies.js?v=7-all-family-features','{study_advanced}','./paloma-study-desk.js?v=6-all-family-features'])await safeImport(src)
      }},1200)
    }}
'''
    s = s[:start] + body + s[end:]
    write(path, s)

patch_external_page('acesso-mobile.html', True)
patch_external_page('acesso.html', False)

# 4) Notebook/root profiles: gear-only settings and requested communication/profile tools load in first wave.
p = 'postboot-loader.js'
s = read(p)
s = s.replace("btn.innerHTML='⚙️ <span>Configurações</span>'", "btn.textContent='⚙️'")
needle = "btn.classList.remove('hidden');btn.type='button';btn.title='Configurações Gerais';btn.setAttribute('aria-label','Configurações Gerais');btn.setAttribute('data-settings-menu','1');btn.removeAttribute('data-tab')"
if needle in s:
    s = s.replace(needle, needle + ";btn.textContent='⚙️'", 1)

first_mobile = """const firstWave=dedicatedMobile?[\n  './mobile-native.js?v=5-native-tap',\n  './general-settings.js?v=9-profile-menu',\n  './profile-menu-guard.js?v=1-exact-menus',\n  './profile-actions.js?v=3-helper-only'\n]:[\n  './mobile-responsive-v2.js?v=17-native-tap',\n  './general-settings.js?v=9-profile-menu',\n  './profile-menu-guard.js?v=1-exact-menus',\n  './profile-actions.js?v=3-helper-only'\n]\nconst secondWave=[\n  './notifications-v2.js?v=10-progressive',\n  './profile-status-stickers.js?v=3-progressive',\n  './social-nav-guard.js?v=4-profile-menu'\n]\nconst thirdWave=[\n  ...(dedicatedMobile?['./call-manager.js?v=9-progressive']:[]),\n  './extras-loader.js?v=52-profile-menu'\n]"""
first_new = """const commonCore=[\n  './general-settings.js?v=10-all-family-features',\n  './profile-status-stickers.js?v=8-all-family-features',\n  './call-manager.js?v=14-all-family-features',\n  './family-media-menu-v2.js?v=10-all-family-features',\n  './social-nav-guard.js?v=5-all-family-features',\n  './profile-actions.js?v=6-all-family-features',\n  './profile-menu-guard.js?v=2-all-family-features'\n]\nconst firstWave=dedicatedMobile?[\n  './mobile-native.js?v=5-native-tap',\n  ...commonCore\n]:[\n  './mobile-responsive-v2.js?v=17-native-tap',\n  ...commonCore\n]\nconst secondWave=[\n  './notifications-v2.js?v=10-progressive'\n]\nconst thirdWave=[\n  './extras-loader.js?v=53-all-family-features'\n]"""
if first_mobile not in s:
    raise SystemExit('postboot wave marker not found')
s = s.replace(first_mobile, first_new, 1)
write(p, s)

# 5) Avoid loading media/calls a second time from extras-loader.
p = 'extras-loader.js'
s = read(p)
s = s.replace("    loadOnce('family-media','./family-media-menu-v2.js?v=9-audio-day'),\n", '')
s = s.replace("  if(!dedicatedMobile)jobs.push(loadOnce('calls','./call-manager.js?v=4-stable'))\n", '')
write(p, s)

# 6) Root profile menu: Perfil and Stickers become real top-level options for Keise, Alan and Isa.
p = 'profile-actions.js'
s = read(p)
s = s.replace("const status=addNavAction(nav,'profileStatusNav','☁️','Status',openStatus,settings)", "const status=addNavAction(nav,'profileStatusNav','☁️','Perfil',openStatus,settings)")
write(p, s)

p = 'profile-menu-guard.js'
s = read(p)
old = """  const settings=dynamic('settingsMenuBtn','[data-settings-menu=\"1\"]'),social=dynamic('socialNav'),test=dynamic('testGameNav'),studio=dynamic('alanStudioLauncher')||dynamic('alanStudioEntry')\n  const oldExtras=[$('profileStatusNav'),$('profileStickerNav'),$('profileGamesNav')]\n  oldExtras.forEach(el=>visible(el,false))"""
new = """  const settings=dynamic('settingsMenuBtn','[data-settings-menu=\"1\"]'),social=dynamic('socialNav'),test=dynamic('testGameNav'),studio=dynamic('alanStudioLauncher')||dynamic('alanStudioEntry')\n  const profileStatus=$('profileStatusNav'),profileSticker=$('profileStickerNav'),profileGames=$('profileGamesNav')\n  visible(profileStatus,true);visible(profileSticker,true);visible(profileGames,false)"""
if old not in s:
    raise SystemExit('profile menu extras marker not found')
s = s.replace(old, new, 1)
s = s.replace("if(isKeise)order=[chats,calendar,settings,social,supervision,parents,test]", "if(isKeise)order=[chats,calendar,settings,profileStatus,profileSticker,social,supervision,parents,test]")
s = s.replace("else if(isAlan)order=[chats,calendar,studio,settings,social]", "else if(isAlan)order=[chats,calendar,studio,settings,profileStatus,profileSticker,social]")
s = s.replace("else if(isIsa)order=[chats,settings,diary,study,social]", "else if(isIsa)order=[chats,settings,diary,study,profileStatus,profileSticker,social]")
s = s.replace("else order=[chats,settings,social]", "else order=[chats,settings,profileStatus,profileSticker,social]")
write(p, s)

print('Family feature sync v2 complete')
