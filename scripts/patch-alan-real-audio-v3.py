from pathlib import Path


def replace_once(path, old, new):
    p=Path(path);text=p.read_text(encoding='utf-8')
    if new in text:return False
    if old not in text:raise SystemExit(f'Padrao nao encontrado em {path}: {old[:120]}')
    p.write_text(text.replace(old,new,1),encoding='utf-8');return True

# Estúdios por estilo: remove dependência de áudio remoto no navegador e usa pacote local.
replace_once('alan-genre-studios.js',
"import { CONFIG } from './config.js'\n",
"import { CONFIG } from './config.js'\nimport { playRealInstrument } from './alan-real-audio.js?v=1'\n")
replace_once('alan-genre-studios.js',
"const soundfontCache=new Map(),bufferCache=new Map()\nconst SOUNDFONT_ROOT='https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/'\n",
"")
old="""async function loadSoundfont(inst){if(soundfontCache.has(inst))return soundfontCache.get(inst);status(`Carregando timbre de ${inst.replaceAll('_',' ')}…`);const r=await fetch(`${SOUNDFONT_ROOT}${inst}-mp3.js`,{cache:'force-cache'});if(!r.ok)throw new Error('Timbre indisponível');const txt=await r.text();const a=txt.indexOf('{'),b=txt.lastIndexOf('}');if(a<0||b<a)throw new Error('Formato de timbre inválido');const data=JSON.parse(txt.slice(a,b+1));soundfontCache.set(inst,data);return data}
async function sampleBuffer(inst,note){const key=`${inst}:${note}`;if(bufferCache.has(key))return bufferCache.get(key);const sf=await loadSoundfont(inst),uri=sf[note]||sf.C4||Object.values(sf)[0];if(!uri)throw new Error('Amostra não encontrada');const arr=await (await fetch(uri)).arrayBuffer(),buf=await ensureAudio().decodeAudioData(arr.slice(0));bufferCache.set(key,buf);return buf}
function fallbackTone(freq=440,dur=.6){const ctx=ensureAudio(),o=ctx.createOscillator(),g=ctx.createGain();o.type='triangle';o.frequency.value=freq;g.gain.setValueAtTime(.0001,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.12,ctx.currentTime+.015);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+dur);o.connect(g).connect(ctx.destination);o.start();o.stop(ctx.currentTime+dur+.03)}
async function playSample(inst,note='C4',gain=.82){try{const ctx=ensureAudio(),buf=await sampleBuffer(inst,note),src=ctx.createBufferSource(),g=ctx.createGain();src.buffer=buf;g.gain.value=gain;src.connect(g).connect(ctx.destination);src.start();status(`♪ ${prettyInst(inst)} • ${note}`)}catch(e){console.warn(e);fallbackTone();status('A amostra real não carregou; usei som de reserva.') }}
"""
new="""async function playSample(inst,note='C4',gain=.82){
  try{
    status(`Carregando amostra real de ${prettyInst(inst)}…`)
    await playRealInstrument(inst,note,{gain})
    status(`♪ ${prettyInst(inst)} • ${note} • amostra real`)
  }catch(e){
    console.error('Amostra real local:',e)
    status('Amostra real indisponível nesta versão. Não foi usado som artificial.')
  }
}
"""
replace_once('alan-genre-studios.js',old,new)
replace_once('alan-genre-studios.js',
"<button id=\"agsOpenCifra\" class=\"ags-soft\" type=\"button\">↗ Abrir referência</button>",
"<button id=\"agsOpenCifra\" class=\"ags-soft\" type=\"button\">↗ Abrir Cifra Club / referência</button>")
replace_once('alan-genre-studios.js',
"A letra/cifra não é importada automaticamente de outros sites. O Alan pode escrever, colar conteúdo que tenha autorização para usar e imprimir o que estiver neste caderno.",
"O Cifra Club oferece impressão na própria página. Aqui o Alan pode abrir a referência e também imprimir o conteúdo que ele inserir no caderno do karaokê; o Cantinho não copia automaticamente páginas externas.")

# Oficina Musical: todos os instrumentos virtuais deixam de usar os osciladores como som principal.
replace_once('alan-studio-workshop.js',
"import { CONFIG } from './config.js'\n",
"import { CONFIG } from './config.js'\nimport { playRealInstrument } from './alan-real-audio.js?v=1'\n")
replace_once('alan-studio-workshop.js',
"<p>Cordas, casas e acordes para experimentar ideias. A guitarra elétrica usa timbre sintetizado próprio.</p>",
"<p>Cordas, casas e acordes para experimentar ideias com amostras reais de violão e guitarra elétrica.</p>")
replace_once('alan-studio-workshop.js',
"function playPiano(b){tone(noteFreq(b.dataset.note,Number(b.dataset.oct)),.85,'triangle',.11);b.classList.add('playing');setTimeout(()=>b.classList.remove('playing'),130);showNow(`🎹 ${b.dataset.piano}`)}",
"async function playPiano(b){b.classList.add('playing');setTimeout(()=>b.classList.remove('playing'),130);showNow(`🎹 ${b.dataset.piano} • carregando amostra real…`);try{await playRealInstrument('acoustic_grand_piano',b.dataset.piano,{gain:.78});showNow(`🎹 ${b.dataset.piano} • amostra real`)}catch(e){console.error(e);showNow('🎹 Timbre real indisponível — sem som artificial')}}")
replace_once('alan-studio-workshop.js',
"function renderDrums(){const box=$('alanDrums');if(!box||box.dataset.ready)return;box.dataset.ready='1';const pads=[['kick','🥁','Bumbo'],['snare','🪘','Caixa'],['hat','✨','Hi-hat'],['tom','🔴','Tom'],['crash','💥','Crash'],['ride','🔔','Ride'],['clap','👏','Clap'],['rim','🎯','Rim']];box.innerHTML=pads.map(p=>`<button class=\"alan-drum-pad\" data-drum=\"${p[0]}\" type=\"button\"><span>${p[1]}</span>${p[2]}</button>`).join('');box.querySelectorAll('[data-drum]').forEach(b=>b.onclick=()=>{noiseHit(b.dataset.drum==='clap'?'snare':b.dataset.drum==='rim'?'hat':b.dataset.drum);b.classList.add('hit');setTimeout(()=>b.classList.remove('hit'),100)})}",
"function renderDrums(){const box=$('alanDrums');if(!box||box.dataset.ready)return;box.dataset.ready='1';const pads=[['kick','🥁','Bumbo','C2'],['snare','🪘','Caixa','D2'],['hat','✨','Hi-hat','F#2'],['tom','🔴','Tom','A2'],['crash','💥','Crash','C3'],['ride','🔔','Ride','D3'],['clap','👏','Clap','E3'],['rim','🎯','Rim','F3']];box.innerHTML=pads.map(p=>`<button class=\"alan-drum-pad\" data-drum=\"${p[0]}\" data-drum-note=\"${p[3]}\" type=\"button\"><span>${p[1]}</span>${p[2]}</button>`).join('');box.querySelectorAll('[data-drum]').forEach(b=>b.onclick=async()=>{b.classList.add('hit');setTimeout(()=>b.classList.remove('hit'),100);showNow(`🥁 ${b.textContent.trim()} • amostra real`);try{await playRealInstrument('synth_drum',b.dataset.drumNote,{gain:.9})}catch(e){console.error(e);showNow('🥁 Timbre real indisponível — sem som artificial')}})}")
replace_once('alan-studio-workshop.js',
"pluck(noteFreq(n,Number(o)),0,electric);showNow(`🎸 ${n}${o}`)",
"playRealInstrument(electric?'electric_guitar_clean':'acoustic_guitar_steel',`${n}${o}`,{gain:.8}).catch(e=>{console.error(e);showNow('🎸 Timbre real indisponível — sem som artificial')});showNow(`🎸 ${n}${o} • amostra real`)")
replace_once('alan-studio-workshop.js',
"chords[b.dataset.chord].forEach((x,i)=>pluck(noteFreq(x[0],x[1]),i*.055,electric));showNow(`🎸 Acorde ${b.dataset.chord}`)",
"chords[b.dataset.chord].forEach((x,i)=>playRealInstrument(electric?'electric_guitar_clean':'acoustic_guitar_steel',`${x[0]}${x[1]}`,{gain:.72,delay:i*.055}).catch(console.error));showNow(`🎸 Acorde ${b.dataset.chord} • amostras reais`)")
old_strings="""function renderStrings(){const mk=(id,items,type)=>{const box=$(id);if(!box||box.dataset.ready)return;box.dataset.ready='1';box.innerHTML=items.map(x=>`<button class=\"alan-bow-string\" type=\"button\" data-bow=\"${x[0]}|${x[1]}\"><b>${x[0]}${x[1]}</b><small>${noteFreq(x[0],x[1]).toFixed(2)} Hz</small></button>`).join('');box.querySelectorAll('[data-bow]').forEach(b=>b.onclick=()=>{const[n,o]=b.dataset.bow.split('|');tone(noteFreq(n,Number(o)),1.15,type,.09);showNow(`🎻 ${n}${o}`)})};mk('alanViolin',[['G',3],['D',4],['A',4],['E',5]],'sawtooth');mk('alanCello',[['C',2],['G',2],['D',3],['A',3]],'triangle')}
"""
new_strings="""function renderStrings(){const mk=(id,items,inst,emoji)=>{const box=$(id);if(!box||box.dataset.ready)return;box.dataset.ready='1';box.innerHTML=items.map(x=>`<button class=\"alan-bow-string\" type=\"button\" data-bow=\"${x[0]}|${x[1]}\"><b>${x[0]}${x[1]}</b><small>${noteFreq(x[0],x[1]).toFixed(2)} Hz</small></button>`).join('');box.querySelectorAll('[data-bow]').forEach(b=>b.onclick=async()=>{const[n,o]=b.dataset.bow.split('|');showNow(`${emoji} ${n}${o} • carregando amostra real…`);try{await playRealInstrument(inst,`${n}${o}`,{gain:.78});showNow(`${emoji} ${n}${o} • amostra real`)}catch(e){console.error(e);showNow(`${emoji} Timbre real indisponível — sem som artificial`)}})};mk('alanViolin',[['G',3],['D',4],['A',4],['E',5]],'violin','🎻');mk('alanCello',[['C',2],['G',2],['D',3],['A',3]],'cello','🎻')}
"""
replace_once('alan-studio-workshop.js',old_strings,new_strings)
replace_once('alan-studio-workshop.js',
"box.querySelectorAll('[data-harm]').forEach(b=>b.onclick=()=>{const[n,o]=b.dataset.harm.split('|');tone(noteFreq(n,Number(o)),.75,'square',.055);showNow(`🪗 ${n}${o}`)})",
"box.querySelectorAll('[data-harm]').forEach(b=>b.onclick=async()=>{const[n,o]=b.dataset.harm.split('|');showNow(`🪗 ${n}${o} • carregando amostra real…`);try{await playRealInstrument('harmonica',`${n}${o}`,{gain:.75});showNow(`🪗 ${n}${o} • amostra real`)}catch(e){console.error(e);showNow('🪗 Timbre real indisponível — sem som artificial')}})")

# Cache bust somente dos extras; o núcleo do Cantinho permanece intocado.
replace_once('extras-loader.js',"./alan-studio-workshop.js?v=2-manual-score","./alan-studio-workshop.js?v=3-real-audio")
replace_once('extras-loader.js',"./alan-genre-studios.js?v=2-sampled-karaoke","./alan-genre-studios.js?v=3-local-real-samples")
replace_once('postboot-loader.js',"./extras-loader.js?v=38-alan-studios-score","./extras-loader.js?v=39-alan-real-audio")
replace_once('index.html',"./postboot-loader.js?v=18-alan-studios-score","./postboot-loader.js?v=19-alan-real-audio")

print('Alan real audio v3 patch applied')
