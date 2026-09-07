from pathlib import Path

p=Path('chunk-08.txt')
s=p.read_text(encoding='utf-8')

old="""function avatarBox(member,extra='avatar pastel-avatar'){
  return `<div class=\"${extra}\" data-avatar-id=\"${member?.id||''}\">${defaultAvatar(member)}</div>`
}
async function avatarUrl(member){
  if(!member?.avatar_ref)return null
  const cached=avatarUrlCache.get(member.id);if(cached?.ref===member.avatar_ref)return cached.url
  if(cached?.url)URL.revokeObjectURL(cached.url)
  const {data,error}=await supabase.storage.from('profile-avatars').download(member.avatar_ref);if(error)return null
  const url=URL.createObjectURL(data);avatarUrlCache.set(member.id,{ref:member.avatar_ref,url});return url
}
async function hydrateAvatarElements(){
  for(const el of document.querySelectorAll('[data-avatar-id]')){
    const member=memberById(el.dataset.avatarId);if(!member?.avatar_ref)continue
    const url=await avatarUrl(member);if(!url||!el.isConnected)continue
    el.innerHTML=`<img src=\"${url}\" alt=\"Foto de ${esc(member.display_name)}\">`
  }
  if(me){const my=memberById(me.id)||me;const el=$('myAvatar');if(el){const url=await avatarUrl(my);el.innerHTML=url?`<img src=\"${url}\" alt=\"Minha foto\">`:defaultAvatar(my)}}
}
"""
new="""function avatarEmoji(member){
  const ref=String(member?.avatar_ref||'');
  return ref.startsWith('emoji:')?ref.slice(6):''
}
function avatarDisplay(member){return avatarEmoji(member)||defaultAvatar(member)}
function avatarBox(member,extra='avatar pastel-avatar'){
  return `<div class=\"${extra}\" data-avatar-id=\"${member?.id||''}\">${avatarDisplay(member)}</div>`
}
async function avatarUrl(member){
  if(!member?.avatar_ref||avatarEmoji(member))return null
  const cached=avatarUrlCache.get(member.id);if(cached?.ref===member.avatar_ref)return cached.url
  if(cached?.url)URL.revokeObjectURL(cached.url)
  const {data,error}=await supabase.storage.from('profile-avatars').download(member.avatar_ref);if(error)return null
  const url=URL.createObjectURL(data);avatarUrlCache.set(member.id,{ref:member.avatar_ref,url});return url
}
async function hydrateAvatarElements(){
  for(const el of document.querySelectorAll('[data-avatar-id]')){
    const member=memberById(el.dataset.avatarId);if(!member||!el.isConnected)continue
    const emoji=avatarEmoji(member)
    if(emoji){el.textContent=emoji;continue}
    if(!member.avatar_ref){el.textContent=defaultAvatar(member);continue}
    const url=await avatarUrl(member);if(!el.isConnected)continue
    el.innerHTML=url?`<img src=\"${url}\" alt=\"Foto de ${esc(member.display_name)}\">`:defaultAvatar(member)
  }
  if(me){
    const my=memberById(me.id)||me,el=$('myAvatar');if(el){
      const emoji=avatarEmoji(my)
      if(emoji)el.textContent=emoji
      else if(my.avatar_ref){const url=await avatarUrl(my);el.innerHTML=url?`<img src=\"${url}\" alt=\"Minha foto\">`:defaultAvatar(my)}
      else el.textContent=defaultAvatar(my)
    }
  }
}
"""
if old not in s:
    raise SystemExit('avatar block not found')
s=s.replace(old,new)
s=s.replace("av.innerHTML=defaultAvatar(other);hydrateAvatarElements()","av.innerHTML=avatarDisplay(other);hydrateAvatarElements()")
p.write_text(s,encoding='utf-8')

p=Path('index.html')
s=p.read_text(encoding='utf-8')
s=s.replace('app-v33.js?v=stable-51','app-v33.js?v=stable-52-avatar')
p.write_text(s,encoding='utf-8')
