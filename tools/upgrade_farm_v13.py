from pathlib import Path
import re

p = Path('jogos/fazendinha-experience-v6.js')
s = p.read_text()

# Softer light / less clipped whites and blacks.
s = s.replace("scene.fog=new THREE.Fog(0xc9d8c4,38,78)", "scene.fog=new THREE.Fog(0xcbd8c3,32,72)")
s = s.replace("renderer.toneMappingExposure=.98", "renderer.toneMappingExposure=.82")
s = s.replace("sk.turbidity.value=6.7;sk.rayleigh.value=2.1;sk.mieCoefficient.value=.006;sk.mieDirectionalG.value=.78", "sk.turbidity.value=9.5;sk.rayleigh.value=1.45;sk.mieCoefficient.value=.0045;sk.mieDirectionalG.value=.74")
s = s.replace("new THREE.HemisphereLight(0xe6f5ff,0x425232,1.2)", "new THREE.HemisphereLight(0xeaf4ff,0x526342,.92)")
s = s.replace("const sun=new THREE.DirectionalLight(0xffe3ad,4.35)", "const sun=new THREE.DirectionalLight(0xffdfad,3.15)")
s = s.replace("const fill=new THREE.DirectionalLight(0xa9d6ff,.8)", "const fill=new THREE.DirectionalLight(0xb5d8ff,.55)")

# The v12 individual roof tiles were positioned as horizontal strips and looked like
# floating blades. Replace them with continuous sloped PBR panels + ridge caps.
house_roof = re.compile(r"for\(const side of \[-1,1\]\)for\(let row=0;row<8;row\+\+\)for\(let col=0;col<13;col\+\+\)\{.*?g\.add\(tile\)\}", re.S)
replacement_house = """for(const side of [-1,1]){const panel=M(new THREE.BoxGeometry(7.65,.18,3.75),shingle,0,4.16,side*1.42);panel.rotation.x=side*.56;g.add(panel);const gutter=M(new THREE.CylinderGeometry(.05,.05,7.7,10),phys(0x64625e,.42,.44),0,3.04,side*3.03);gutter.rotation.z=Math.PI/2;g.add(gutter)}const ridgeRoof=M(new THREE.CylinderGeometry(.105,.105,7.75,12),shingle,0,5.18,0);ridgeRoof.rotation.z=Math.PI/2;g.add(ridgeRoof);for(let x=-3.45;x<=3.45;x+=.3){const cap=M(new THREE.BoxGeometry(.25,.08,.5),shingle,x,5.18,0);g.add(cap)}"""
s, n1 = house_roof.subn(replacement_house, s, count=1)
if n1 != 1:
    raise SystemExit(f'house roof patch failed: {n1}')

barn_roof = re.compile(r"for\(const side of \[-1,1\]\)for\(let row=0;row<9;row\+\+\)for\(let col=0;col<14;col\+\+\)\{.*?g\.add\(tile\)\}", re.S)
replacement_barn = """for(const side of [-1,1]){const panel=M(new THREE.BoxGeometry(8.28,.2,4.2),roofBarn,0,5.16,side*1.62);panel.rotation.x=side*.57;g.add(panel)}const barnRidge=M(new THREE.CylinderGeometry(.12,.12,8.38,12),roofBarn,0,6.38,0);barnRidge.rotation.z=Math.PI/2;g.add(barnRidge);for(let x=-3.75;x<=3.75;x+=.32){g.add(M(new THREE.BoxGeometry(.26,.09,.55),roofBarn,x,6.38,0))}"""
s, n2 = barn_roof.subn(replacement_barn, s, count=1)
if n2 != 1:
    raise SystemExit(f'barn roof patch failed: {n2}')

# Make grass less like black vertical sticks.
s = s.replace("new THREE.PlaneGeometry(.055,.42),bladeMat=new THREE.MeshStandardMaterial({color:0x355f2f,roughness:1,side:THREE.DoubleSide});const blades=new THREE.InstancedMesh(bladeGeo,bladeMat,1450)",
              "new THREE.PlaneGeometry(.032,.23),bladeMat=new THREE.MeshStandardMaterial({color:0x628c47,roughness:1,side:THREE.DoubleSide});const blades=new THREE.InstancedMesh(bladeGeo,bladeMat,2200)")
s = s.replace("for(let i=0;i<1450;i++)", "for(let i=0;i<2200;i++)", 1)
s = s.replace("o.position.set(x,.18,z)", "o.position.set(x,.105,z)", 1)
s = s.replace("const sc=.55+rnd()*1.15", "const sc=.58+rnd()*.78", 1)

# Use a textured CC0 cow and dog, and add a CC0 chicken source. Keep other animals
# but smooth their normals so their facets are less visible.
cow_old = "https://threejs.org/manual/examples/resources/models/animals/Cow.gltf"
cow_new = "https://raw.githubusercontent.com/jakubkrzysztofsikora/choyce-engine/c55f1ab2050d11b51e2e4181d156c6877cef5668/data/models/third_party/styloo_animals/Cow.glb"
s = s.replace(cow_old, cow_new)
s = s.replace("'vaca-1':{url:'" + cow_new + "',scale:.64,interactive:true},", "'vaca-1':{url:'" + cow_new + "',scale:.50,interactive:true},\n  'galinha-1':{url:'https://raw.githubusercontent.com/jakubkrzysztofsikora/choyce-engine/c55f1ab2050d11b51e2e4181d156c6877cef5668/data/models/third_party/styloo_animals/chicken.glb',scale:.30,interactive:true},")
s = s.replace("'dog-a':{url:'https://threejs.org/manual/examples/resources/models/animals/Pug.gltf',scale:.62}", "'dog-a':{url:'https://raw.githubusercontent.com/jakubkrzysztofsikora/choyce-engine/c55f1ab2050d11b51e2e4181d156c6877cef5668/data/models/third_party/styloo_animals/dog.glb',scale:.34}")
s = s.replace("'pig-a':{url:'https://threejs.org/manual/examples/resources/models/animals/Pig.gltf',scale:.58}", "'pig-a':{url:'https://threejs.org/manual/examples/resources/models/animals/Pig.gltf',scale:.43}")
s = s.replace("'pig-b':{url:'https://threejs.org/manual/examples/resources/models/animals/Pig.gltf',scale:.53}", "'pig-b':{url:'https://threejs.org/manual/examples/resources/models/animals/Pig.gltf',scale:.39}")
s = s.replace("'sheep-a':{url:'https://threejs.org/manual/examples/resources/models/animals/Sheep.gltf',scale:.60}", "'sheep-a':{url:'https://threejs.org/manual/examples/resources/models/animals/Sheep.gltf',scale:.45}")
s = s.replace("'sheep-b':{url:'https://threejs.org/manual/examples/resources/models/animals/Sheep.gltf',scale:.55}", "'sheep-b':{url:'https://threejs.org/manual/examples/resources/models/animals/Sheep.gltf',scale:.41}")

old_traverse = "model.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;if(spec.interactive){o.userData={kind:'animal',id:key};interactive.push(o)}}})"
new_traverse = "model.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.geometry?.computeVertexNormals?.();const mats=Array.isArray(o.material)?o.material:[o.material];for(const mm of mats){if(mm){mm.flatShading=false;mm.roughness=Math.max(.55,mm.roughness??.7);mm.needsUpdate=true}}if(spec.interactive){o.userData={kind:'animal',id:key};interactive.push(o)}}})"
if old_traverse in s:
    s = s.replace(old_traverse, new_traverse)

p.write_text(s)
print('v13 source patch applied')
