from __future__ import annotations
from pathlib import Path
import json
import re
import time
import urllib.request

OUT=Path('alan-real-samples-v1.js')
ROOTS=[
    'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/',
    'https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/gh-pages/FluidR3_GM/',
    'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/',
]
REQUESTS={
    'accordion':['C3','G3','C4','G4','C5','G5','C6'],
    'acoustic_guitar_steel':['E2','A2','D3','G3','B3','E4'],
    'acoustic_guitar_nylon':['E2','A2','D3','G3','B3','E4'],
    'electric_guitar_clean':['E2','A2','D3','G3','B3','E4'],
    'acoustic_grand_piano':['C3','F3','C4','F4','C5','F5','C6'],
    'harmonica':['C4','G4','C5','G5','C6','G6','C7'],
    'violin':['G3','D4','A4','E5'],
    'cello':['C2','G2','D3','A3'],
    'synth_drum':['C2','D2','F#2','A2','C3','D3','E3','F3'],
    'tinkle_bell':['C6'],
}
BASE={'C':0,'D':2,'E':4,'F':5,'G':7,'A':9,'B':11}

def midi(note:str)->int:
    m=re.fullmatch(r'([A-G])([#b]?)(-?\d)',note)
    if not m:return 60
    semi=BASE[m.group(1)]+(1 if m.group(2)=='#' else -1 if m.group(2)=='b' else 0)
    return (int(m.group(3))+1)*12+semi

def fetch_font(inst:str)->dict[str,str]:
    errors=[]
    for root in ROOTS:
        url=f'{root}{inst}-mp3.js'
        for attempt in range(2):
            try:
                req=urllib.request.Request(url,headers={'User-Agent':'Cantinho-da-Isa-build/1.0','Accept':'*/*'})
                with urllib.request.urlopen(req,timeout=45) as r:
                    text=r.read().decode('utf-8')
                a=text.find('{');b=text.rfind('}')
                if a<0 or b<a:raise RuntimeError('objeto JSON não encontrado')
                data=json.loads(text[a:b+1])
                if not isinstance(data,dict) or not data:raise RuntimeError('soundfont vazio')
                print(f'{inst}: fonte obtida de {root}')
                return data
            except Exception as e:
                errors.append(f'{url} tentativa {attempt+1}: {e}')
                time.sleep(1.2)
    raise RuntimeError('\n'.join(errors))

def nearest_key(data:dict[str,str],target:str)->str:
    if target in data:return target
    # MIDI.js costuma nomear sustenidos como bemóis; a busca por MIDI resolve isso.
    tm=midi(target)
    valid=[]
    for k in data:
        try:valid.append((abs(midi(k)-tm),k))
        except Exception:pass
    if not valid:raise KeyError(target)
    valid.sort()
    return valid[0][1]

bundle={}
for inst,notes in REQUESTS.items():
    data=fetch_font(inst)
    chosen={}
    for target in notes:
        src=nearest_key(data,target)
        value=data[src]
        if not isinstance(value,str) or not value.startswith('data:audio/'):
            raise RuntimeError(f'{inst} {src}: amostra inválida')
        chosen[target]=value
        print(f'  {target} <- {src}')
    bundle[inst]=chosen

payload=json.dumps(bundle,ensure_ascii=False,separators=(',',':'))
OUT.write_text('// Gerado no GitHub Actions a partir de amostras FluidR3_GM.\nexport const ALAN_REAL_SAMPLES='+payload+'\n',encoding='utf-8')
print(f'Gerado {OUT} com {OUT.stat().st_size/1024:.1f} KiB e {sum(len(v) for v in bundle.values())} amostras locais.')
