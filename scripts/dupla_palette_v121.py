from pathlib import Path

p=Path('jogos/dupla-na-pista-teste.html')
s=p.read_text()

if 'pista viva v1.2.1' in s:
    print('v1.2.1 already applied')
    raise SystemExit(0)
if 'pista viva v1.2.0' not in s:
    raise SystemExit('expected v1.2.0 marker not found')

s=s.replace(
    'Build privada • pista viva v1.2.0 • direção reconstruída + câmera traseira',
    'Build privada • pista viva v1.2.1 • paleta Isa + marca personalizada',
    1,
)

old_palette="const palette=['#f3f3ef','#17191c','#777f85','#316a98','#9d2b36','#d58cae','#755b98','#486b50','#c3a979'];palette.forEach(c=>{const b=document.createElement('button');b.className='swatch';b.style.background=c;b.onclick=()=>{paintLists[active].forEach(m=>{m.color?.set(c);if('clearcoat'in m){m.clearcoat=1;m.clearcoatRoughness=.1}m.needsUpdate=true});msg('🎨 Cor aplicada')};$('swatches').appendChild(b)});"
new_palette="""const basePaintColors=paintLists.map(list=>list.map(m=>m.color?.clone?.()||null));const palette=[{id:'original',name:'Sem cor • marca da Isa',color:null},{id:'pink',name:'Rosinha',color:'#f3a9c5'},{id:'lilac',name:'Lilás',color:'#b9a4e8'},{id:'green',name:'Verde',color:'#a9d7ad'},{id:'yellow',name:'Amarelo',color:'#f3d77d'}];function applyPaintOption(opt){paintLists[active].forEach((m,idx)=>{if(!m.color)return;if(opt.color)m.color.set(opt.color);else if(basePaintColors[active][idx])m.color.copy(basePaintColors[active][idx]);if('clearcoat'in m){m.clearcoat=.9;m.clearcoatRoughness=.12}m.needsUpdate=true});msg(opt.color?opt.name+' aplicada':'Cor original + marca da Isa')}palette.forEach(opt=>{const b=document.createElement('button');b.className='swatch'+(opt.color?'':' original');b.title=opt.name;b.setAttribute('aria-label',opt.name);b.style.background=opt.color||'linear-gradient(135deg,#f7f3ee 0 45%,#d8c9bb 45% 55%,#f7f3ee 55% 100%)';b.onclick=()=>applyPaintOption(opt);$('swatches').appendChild(b)});"""
if old_palette not in s:
    raise SystemExit('old palette marker not found')
s=s.replace(old_palette,new_palette,1)

cars_marker="const names=[params.get('nickA')||'Piloto 1',params.get('nickB')||'Piloto 2'],cars=[vehicleA,vehicleB],tracks=[TRACK_A,TRACK_B],paintLists=[paintA,paintB],states="
if cars_marker not in s:
    raise SystemExit('cars marker not found')
brand_code="""const names=[params.get('nickA')||'Piloto 1',params.get('nickB')||'Piloto 2'],cars=[vehicleA,vehicleB],tracks=[TRACK_A,TRACK_B],paintLists=[paintA,paintB];function makeIsaBrandTexture(){const c=document.createElement('canvas');c.width=768;c.height=224;const g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);g.textAlign='center';g.textBaseline='middle';g.font='900 118px Inter,Arial,sans-serif';g.lineWidth=12;g.strokeStyle='rgba(30,24,36,.65)';g.strokeText('ISA',325,112);g.fillStyle='#fff';g.fillText('ISA',325,112);g.save();g.translate(575,112);g.scale(1.08,1.08);g.beginPath();g.moveTo(0,43);g.bezierCurveTo(-62,2,-54,-55,-12,-55);g.bezierCurveTo(12,-55,29,-39,34,-21);g.bezierCurveTo(39,-39,56,-55,80,-55);g.bezierCurveTo(122,-55,130,2,68,43);g.lineTo(34,67);g.closePath();g.strokeStyle='rgba(30,24,36,.65)';g.lineWidth=13;g.stroke();g.fillStyle='#f2a8c4';g.fill();g.restore();const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t}const isaBrandTexture=makeIsaBrandTexture();function addIsaBrand(car){const geo=new THREE.PlaneGeometry(1.42,.43),make=()=>new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:isaBrandTexture,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false})),a=make(),b=make();a.position.set(1.065,.69,.03);a.rotation.y=-Math.PI/2;b.position.set(-1.065,.69,.03);b.rotation.y=Math.PI/2;a.renderOrder=b.renderOrder=9;car.add(a,b)}cars.forEach(addIsaBrand);const states="""
s=s.replace(cars_marker,brand_code,1)

# Optional quick color control: keep it working, but map its chosen color as a custom override.
old_quick="$('quickColor').oninput=e=>paintLists[active].forEach(m=>{m.color?.set(e.target.value);m.needsUpdate=true});"
new_quick="$('quickColor').oninput=e=>{const custom={name:'Cor personalizada',color:e.target.value};applyPaintOption(custom)};"
if old_quick in s:
    s=s.replace(old_quick,new_quick,1)

# Make the 'original' swatch visibly distinct without adding more palette colors.
css_marker='.swatch{width:29px;height:29px;border-radius:50%;border:2px solid #ffffff6b}'
if css_marker in s:
    s=s.replace(css_marker,css_marker+'.swatch.original{box-shadow:inset 0 0 0 3px #ffffff55,0 0 0 1px #0006}',1)

p.write_text(s)
print('Dupla v1.2.1 palette + Isa brand applied')
