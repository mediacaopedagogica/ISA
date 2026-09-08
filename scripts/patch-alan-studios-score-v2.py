from pathlib import Path


def replace_once(path: str, old: str, new: str) -> bool:
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    if new in text:
        return False
    if old not in text:
        raise SystemExit(f'Padrao nao encontrado em {path}: {old[:100]}')
    p.write_text(text.replace(old, new, 1), encoding='utf-8')
    return True


# Corrige a leitura das alturas na pauta manual e reutiliza um unico AudioContext.
replace_once(
    'alan-score-study-v2.js',
    "let state=structuredClone(DEFAULT),loaded=false,saveTimer=null,tool='quarter',snap=true,drawing=false,currentStroke=null,dragId=null,dragOffset={x:0,y:0}",
    "let state=structuredClone(DEFAULT),loaded=false,saveTimer=null,tool='quarter',snap=true,drawing=false,currentStroke=null,dragId=null,dragOffset={x:0,y:0},scoreAudioCtx=null",
)
replace_once(
    'alan-score-study-v2.js',
    "const PITCH_TREBLE=['F5','E5','D5','C5','B4','A4','G4','F4','E4','D4','C4','B3','A3']\nconst PITCH_BASS=['A3','G3','F3','E3','D3','C3','B2','A2','G2','F2','E2','D2','C2']",
    "const DIATONIC=['C','D','E','F','G','A','B']",
)
replace_once(
    'alan-score-study-v2.js',
    "function pitchFor(y){const staff=nearestStaff(y),idx=clamp(Math.round((staff+72-y)/9),0,12),arr=page().clef==='bass'?PITCH_BASS:PITCH_TREBLE;return arr[idx]||''}",
    "function shiftDiatonic(anchor,stepsDown){const m=/^([A-G])(\\d)$/.exec(anchor);if(!m)return anchor;let letter=DIATONIC.indexOf(m[1]),oct=Number(m[2]);const dir=stepsDown>=0?-1:1;for(let i=0;i<Math.abs(stepsDown);i++){letter+=dir;if(letter<0){letter=6;oct--}else if(letter>6){letter=0;oct++}}return `${DIATONIC[letter]}${oct}`}\nfunction pitchFor(y){const staff=nearestStaff(y),steps=Math.round((y-staff)/9),anchor=page().clef==='bass'?'A3':'F5';return shiftDiatonic(anchor,steps)}",
)
replace_once(
    'alan-score-study-v2.js',
    "function playPitch(pitch,dur=.5,delay=0){const C=new (window.AudioContext||window.webkitAudioContext)(),o=C.createOscillator(),g=C.createGain(),t=C.currentTime+delay;o.type='sine';o.frequency.value=pitchFreq(pitch);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.11,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(C.destination);o.start(t);o.stop(t+dur+.03);setTimeout(()=>C.close(),(delay+dur+.2)*1000)}",
    "function playPitch(pitch,dur=.5,delay=0){if(!scoreAudioCtx)scoreAudioCtx=new (window.AudioContext||window.webkitAudioContext)();const C=scoreAudioCtx;if(C.state==='suspended')C.resume();const o=C.createOscillator(),g=C.createGain(),t=C.currentTime+delay;o.type='sine';o.frequency.value=pitchFreq(pitch);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.11,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(C.destination);o.start(t);o.stop(t+dur+.03)}",
)

# Permite sair e voltar ao Karaoque criando uma nova fonte para o novo elemento de audio.
replace_once(
    'alan-genre-studios.js',
    "mediaSource=null,mixDest=null,backingGain=null",
    "mediaSource=null,mediaElement=null,mixDest=null,backingGain=null",
)
replace_once(
    'alan-genre-studios.js',
    "if(!mediaSource){mediaSource=ctx.createMediaElementSource(audio);backingGain=ctx.createGain();mediaSource.connect(backingGain);backingGain.connect(ctx.destination)}",
    "if(mediaElement!==audio){mediaSource=ctx.createMediaElementSource(audio);mediaElement=audio;backingGain=ctx.createGain();mediaSource.connect(backingGain);backingGain.connect(ctx.destination)}",
)

# Bump de cache do carregador principal, sem alterar o nucleo estavel do app.
replace_once(
    'index.html',
    "./postboot-loader.js?v=17-alan-band-operations",
    "./postboot-loader.js?v=18-alan-studios-score",
)

print('Alan studios + score v2 patch applied')
