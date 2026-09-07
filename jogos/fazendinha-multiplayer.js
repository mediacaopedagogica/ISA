import { CONFIG } from '../config.js'
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js'

const $=id=>document.getElementById(id)
const params=new URLSearchParams(location.search)
const player=(params.get('player')||'').toLowerCase()==='primo'?'primo':'isa'
const externalToken=new URLSearchParams(location.hash.replace(/^#/, '')).get('family')||''
const other=player==='isa'?'primo':'isa'
const guestStoreKey='cantinho-farm-guest-v2'
const avatarColors={pink:0xf27fae,blue:0x68a9e9,green:0x68b879,orange:0xe79a54,purple:0x9a76d7,red:0xdf6e72,teal:0x55b8ad}
let gameToken='',snapshot=null,pollBusy=false,selectedTool='plant',lastMoveAt=0,lastSignal=0,signalBusy=false
let voiceOn=false,localStream=null,peer=null,pendingOffer=null,pendingIce=[],offerSent=false
const plotMeshes=new Map(),animalMeshes=new Map(),playerMeshes=new Map(),interactive=[]
const keys=new Set()

function getAuth(){
  const seek=o=>{if(!o||typeof o!=='object')return'';if(typeof o.access_token==='string')return o.access_token;for(const v of Object.values(o)){const t=seek(v);if(t)return t}return''}
  for(const store of [localStorage,sessionStorage]){try{for(let i=0;i<store.length;i++){const k=store.key(i)||'';if(!/auth-token/i.test(k))continue;let raw=store.getItem(k)||'';if(raw.startsWith('base64-')){try{raw=atob(raw.slice(7))}catch{}}try{const t=seek(JSON.parse(raw));if(t)return t}catch{}}}catch{}}
  return''
}
async function rpc(name,args={},isaAuth=false){
  const bearer=isaAuth?getAuth():CONFIG.SUPABASE_KEY
  if(isaAuth&&!bearer)throw new Error('Abra a Fazendinha pelo acesso da Isa para entrar como jogadora 1.')
  const r=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${name}`,{method:'POST',cache:'no-store',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${bearer}`,'Content-Type':'application/json'},body:JSON.stringify(args)})
  let data=null;try{data=await r.json()}catch{}
  if(!r.ok)throw new Error(data?.message||data?.hint||data?.details||'Não foi possível sincronizar a fazenda.')
  return data
}
function toast(text,ms=2100){const t=$('toast');t.textContent=text;t.classList.remove('hidden');clearTimeout(t._hide);t._hide=setTimeout(()=>t.classList.add('hidden'),ms)}
function setConnection(ok,text){const b=$('connectionBadge');b.textContent=text;b.classList.toggle('ok',ok);b.classList.toggle('bad',ok===false)}
function playerData(key){return snapshot?.players?.find(p=>p.key===key)}
function num(v){const n=Number(v);return Number.isFinite(n)?n:0}
function readGuest(){try{return JSON.parse(localStorage.getItem(guestStoreKey)||'null')}catch{return null}}
function saveGuest(data){try{localStorage.setItem(guestStoreKey,JSON.stringify(data))}catch{}}
function clearGuest(){try{localStorage.removeItem(guestStoreKey)}catch{}}

function askGuestIdentity(existing={},allowCancel=false){
  return new Promise(resolve=>{
    const overlay=$('guestIdentity'),form=$('guestIdentityForm'),name=$('guestName'),cancel=$('identityCancel'),error=$('guestIdentityError')
    name.value=existing.name||''
    const avatar=existing.avatar||'blue'
    const radio=form.querySelector(`input[name="guestAvatar"][value="${avatar}"]`)||form.querySelector('input[name="guestAvatar"]')
    if(radio)radio.checked=true
    error.textContent=''
    cancel.classList.toggle('hidden',!allowCancel)
    overlay.classList.remove('hidden')
    setTimeout(()=>name.focus(),60)
    const cleanup=()=>{form.onsubmit=null;cancel.onclick=null;overlay.classList.add('hidden')}
    form.onsubmit=e=>{e.preventDefault();const value=name.value.trim();if(value.length<2){error.textContent='Digite o nome do jogador.';return}const av=form.querySelector('input[name="guestAvatar"]:checked')?.value||'blue';cleanup();resolve({name:value.slice(0,20),avatar:av})}
    cancel.onclick=()=>{cleanup();resolve(null)}
  })
}

const stage=$('farmStage')
const scene=new THREE.Scene()
scene.background=new THREE.Color(0xc9ecff)
scene.fog=new THREE.FogExp2(0xc9ecff,.013)
const camera=new THREE.PerspectiveCamera(40,1,.1,120)
camera.position.set(15.5,16.5,20.5);camera.lookAt(0,.4,0)
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',alpha:false})
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.8));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08
stage.appendChild(renderer.domElement)

scene.add(new THREE.HemisphereLight(0xe8f8ff,0x526345,1.55))
const sun=new THREE.DirectionalLight(0xfff0c9,3.15);sun.position.set(-11,20,10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-20;sun.shadow.camera.right=20;sun.shadow.camera.top=18;sun.shadow.camera.bottom=-18;sun.shadow.bias=-.00035;scene.add(sun)
const fill=new THREE.DirectionalLight(0xb8dfff,.65);fill.position.set(12,10,-10);scene.add(fill)

function canvasTexture(base,spots,lines=false){
  const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.fillStyle=base;x.fillRect(0,0,512,512)
  for(let i=0;i<9000;i++){const a=.025+Math.random()*.13;x.fillStyle=`rgba(${spots},${a})`;const s=.5+Math.random()*2.5;x.fillRect(Math.random()*512,Math.random()*512,s,s)}
  if(lines){for(let i=0;i<90;i++){x.strokeStyle=`rgba(${spots},${.025+Math.random()*.08})`;x.lineWidth=.4+Math.random()*1.3;x.beginPath();x.moveTo(0,Math.random()*512);x.bezierCurveTo(150,Math.random()*512,360,Math.random()*512,512,Math.random()*512);x.stroke()}}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;return t
}
const grassTex=canvasTexture('#74ae5d','39,79,37',true);grassTex.repeat.set(11,8)
const dirtTex=canvasTexture('#b78d60','94,63,38',true);dirtTex.repeat.set(8,5)
const soilTex=canvasTexture('#70482d','45,25,13',true);soilTex.repeat.set(3,2)
const woodTex=canvasTexture('#8a5432','54,27,13',true);woodTex.repeat.set(2,5)
const roofTex=canvasTexture('#654036','36,20,18',true);roofTex.repeat.set(4,5)

const groundGeo=new THREE.PlaneGeometry(29,21,48,34)
const pos=groundGeo.attributes.position
for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i);const edge=Math.max(Math.abs(x)/14.5,Math.abs(y)/10.5);const n=(Math.sin(x*.9)+Math.cos(y*1.17)+Math.sin((x+y)*.51))*.018;pos.setZ(i,n-(Math.max(0,edge-.82)**2)*.22)}
groundGeo.computeVertexNormals()
const ground=new THREE.Mesh(groundGeo,new THREE.MeshStandardMaterial({map:grassTex,roughness:.98,color:0xf4fff1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground)

function pathPlane(w,h,x,z,rot=0){const g=new THREE.PlaneGeometry(w,h,18,10);const a=g.attributes.position;for(let i=0;i<a.count;i++){const px=a.getX(i),py=a.getY(i);a.setZ(i,(Math.sin(px*2.1)+Math.cos(py*2.4))*.008)}g.computeVertexNormals();const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:dirtTex,roughness:1,color:0xf4d4a5}));m.rotation.x=-Math.PI/2;m.rotation.z=rot;m.position.set(x,.035,z);m.receiveShadow=true;scene.add(m);return m}
pathPlane(3.2,20,1.8,0);pathPlane(28,2.35,0,4.6)

function addPathPebbles(){const geo=new THREE.DodecahedronGeometry(.055,0),mat=new THREE.MeshStandardMaterial({color:0xa17e59,roughness:1});const mesh=new THREE.InstancedMesh(geo,mat,150);const d=new THREE.Object3D();let k=0;for(let i=0;i<150;i++){const vertical=Math.random()<.52;const x=vertical?1.8+(Math.random()-.5)*2.7:-13+Math.random()*26;const z=vertical?-9+Math.random()*18:4.6+(Math.random()-.5)*1.8;d.position.set(x,.09,z);const s=.6+Math.random()*1.3;d.scale.set(s,.45+Math.random()*.35,s);d.rotation.set(Math.random(),Math.random()*Math.PI,Math.random());d.updateMatrix();mesh.setMatrixAt(k++,d.matrix)}mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh)}
addPathPebbles()

function addGrassAndFlowers(){
  const grassGeo=new THREE.ConeGeometry(.035,.28,3),grassMat=new THREE.MeshStandardMaterial({color:0x4f8b43,roughness:.95,side:THREE.DoubleSide});const grass=new THREE.InstancedMesh(grassGeo,grassMat,560);const d=new THREE.Object3D();let k=0
  while(k<560){const x=-13.4+Math.random()*26.8,z=-9.3+Math.random()*18.6;const onPath=Math.abs(x-1.8)<1.9||Math.abs(z-4.6)<1.45;const inBarn=x>3.2&&x<12.2&&z>-3&&z<3;if(onPath||inBarn)continue;d.position.set(x,.12,z);d.rotation.set((Math.random()-.5)*.15,Math.random()*Math.PI,(Math.random()-.5)*.15);const s=.55+Math.random()*1.25;d.scale.set(s,s,s);d.updateMatrix();grass.setMatrixAt(k++,d.matrix)}grass.castShadow=true;scene.add(grass)
  const colors=[0xffffff,0xffe27a,0xf6a9c7,0xc9b8ff],geo=new THREE.SphereGeometry(.045,7,5);colors.forEach((color,idx)=>{const m=new THREE.MeshStandardMaterial({color,roughness:.8});const flowers=new THREE.InstancedMesh(geo,m,28);for(let i=0;i<28;i++){let x,z;do{x=-13+Math.random()*26;z=-9+Math.random()*18}while(Math.abs(x-1.8)<2||Math.abs(z-4.6)<1.5||(x>3&&x<12&&z>-3&&z<3));d.position.set(x,.16+Math.random()*.05,z);const s=.7+Math.random()*.7;d.scale.set(s,s,s);d.updateMatrix();flowers.setMatrixAt(i,d.matrix)}flowers.castShadow=true;scene.add(flowers)})
}
addGrassAndFlowers()

function cylBetween(a,b,r,mat,segments=10){const mid=a.clone().add(b).multiplyScalar(.5),len=a.distanceTo(b);const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r*1.05,len,segments),mat);m.position.copy(mid);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());m.castShadow=true;m.receiveShadow=true;return m}
function addBarn(){
  const g=new THREE.Group();g.position.set(7.8,0,-4.7);g.name='farmBarnRealistic'
  const red=new THREE.MeshStandardMaterial({color:0x9d4637,roughness:.9,map:woodTex});const trim=new THREE.MeshStandardMaterial({color:0xd9c7a8,roughness:.85});const dark=new THREE.MeshStandardMaterial({color:0x493025,roughness:.92});const roofMat=new THREE.MeshStandardMaterial({color:0x56352f,roughness:.94,map:roofTex})
  const body=new THREE.Mesh(new THREE.BoxGeometry(5.2,3.55,4.15),red);body.position.y=1.8;body.castShadow=body.receiveShadow=true;g.add(body)
  for(let x=-2.35;x<=2.35;x+=.52){const seam=new THREE.Mesh(new THREE.BoxGeometry(.025,3.3,.035),dark);seam.position.set(x,1.78,2.09);g.add(seam)}
  for(let x=-2.25;x<=2.25;x+=1.15){const beam=new THREE.Mesh(new THREE.BoxGeometry(.12,3.7,.12),trim);beam.position.set(x,1.82,2.12);beam.castShadow=true;g.add(beam)}
  const leftRoof=new THREE.Mesh(new THREE.BoxGeometry(5.75,.18,3.0),roofMat);leftRoof.rotation.x=-.55;leftRoof.position.set(0,4.15,-1.18);leftRoof.castShadow=true;g.add(leftRoof)
  const rightRoof=new THREE.Mesh(new THREE.BoxGeometry(5.75,.18,3.0),roofMat);rightRoof.rotation.x=.55;rightRoof.position.set(0,4.15,1.18);rightRoof.castShadow=true;g.add(rightRoof)
  for(let x=-2.35;x<=2.35;x+=.58){for(const z of [-1.15,1.15]){const sh=new THREE.Mesh(new THREE.BoxGeometry(.48,.035,2.72),new THREE.MeshStandardMaterial({color:0x67433a,roughness:1}));sh.rotation.x=z<0?-.55:.55;sh.position.set(x,4.22,z);g.add(sh)}}
  const door=new THREE.Mesh(new THREE.BoxGeometry(1.85,2.65,.12),dark);door.position.set(.2,1.34,2.14);door.castShadow=true;g.add(door)
  const frameTop=new THREE.Mesh(new THREE.BoxGeometry(2.08,.14,.16),trim);frameTop.position.set(.2,2.7,2.2);g.add(frameTop);for(const x of [-.82,1.22]){const q=new THREE.Mesh(new THREE.BoxGeometry(.14,2.75,.16),trim);q.position.set(x,1.35,2.2);g.add(q)}
  const windowFrame=new THREE.Mesh(new THREE.BoxGeometry(1.2,.9,.12),trim);windowFrame.position.set(-1.55,3.05,2.15);g.add(windowFrame);const glass=new THREE.Mesh(new THREE.PlaneGeometry(.94,.64),new THREE.MeshPhysicalMaterial({color:0x90c9db,roughness:.18,metalness:.05,transparent:true,opacity:.65}));glass.position.set(-1.55,3.05,2.23);g.add(glass)
  const baleMat=new THREE.MeshStandardMaterial({color:0xcda953,roughness:1});for(let i=0;i<2;i++){const bale=new THREE.Mesh(new THREE.CylinderGeometry(.52,.52,.85,18),baleMat);bale.rotation.z=Math.PI/2;bale.position.set(-3+i*.15,.55,-.3+i*.9);bale.castShadow=true;g.add(bale)}
  const lantern=new THREE.PointLight(0xffb85c,1.8,5);lantern.position.set(1.6,2.5,2.5);g.add(lantern);const lamp=new THREE.Mesh(new THREE.SphereGeometry(.11,10,8),new THREE.MeshStandardMaterial({color:0xffc56d,emissive:0xff9b3d,emissiveIntensity:1.2}));lamp.position.copy(lantern.position);g.add(lamp)
  scene.add(g)
}

function addTree(x,z,s=1,seed=1){
  const g=new THREE.Group();const trunkMat=new THREE.MeshStandardMaterial({color:0x6a4229,roughness:1,map:woodTex});const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.28,.42,2.65,12),trunkMat);trunk.position.y=1.32;trunk.rotation.z=(seed%3-1)*.035;trunk.castShadow=true;g.add(trunk)
  const branchEnds=[[-.75,2.45,.1],[.72,2.55,.2],[-.15,2.7,-.75],[.18,2.6,.72]];for(const [bx,by,bz] of branchEnds)g.add(cylBetween(new THREE.Vector3(0,1.8,0),new THREE.Vector3(bx,by,bz),.095,trunkMat,9))
  const greens=[0x3f7e43,0x4e914b,0x5b9d52,0x39763e];for(let i=0;i<14;i++){const a=i/14*Math.PI*2+seed*.37,r=.35+((i*37)%9)/12,yy=2.35+((i*19)%7)*.14;const q=new THREE.Mesh(new THREE.IcosahedronGeometry(.58+((i*11)%5)*.055,2),new THREE.MeshStandardMaterial({color:greens[(i+seed)%greens.length],roughness:.94}));q.position.set(Math.cos(a)*r,yy,Math.sin(a)*r*.82);q.scale.y=.8+((i*13)%4)*.08;q.castShadow=true;g.add(q)}
  g.position.set(x,0,z);g.scale.setScalar(s);scene.add(g)
}

function addFence(){const mat=new THREE.MeshStandardMaterial({color:0x9a7048,roughness:1,map:woodTex});const posts=[];for(let x=3.6;x<=11.8;x+=1.55){posts.push([x,-2.6],[x,2.6])}for(let z=-1.1;z<=1.1;z+=1.3){posts.push([3.6,z],[11.8,z])}for(const [x,z] of posts){const p=new THREE.Mesh(new THREE.CylinderGeometry(.1,.13,1.25,10),mat);p.position.set(x,.62,z);p.castShadow=true;scene.add(p)}for(const z of [-2.6,2.6]){for(const y of [.48,.88])scene.add(cylBetween(new THREE.Vector3(3.6,y,z),new THREE.Vector3(11.8,y,z),.065,mat,8))}for(const x of [3.6,11.8]){for(const y of [.48,.88])scene.add(cylBetween(new THREE.Vector3(x,y,-2.6),new THREE.Vector3(x,y,2.6),.065,mat,8))}}
function addLake(){
  const lake=new THREE.Mesh(new THREE.CircleGeometry(2.55,72),new THREE.MeshPhysicalMaterial({color:0x65b9d9,transparent:true,opacity:.78,roughness:.12,metalness:.02,clearcoat:.55,clearcoatRoughness:.16}));lake.rotation.x=-Math.PI/2;lake.scale.set(1.18,.88,1);lake.position.set(-9,.045,-5);scene.add(lake)
  const rockMat=new THREE.MeshStandardMaterial({color:0x8c826f,roughness:1});for(let i=0;i<30;i++){const a=i/30*Math.PI*2,r=2.72;const q=new THREE.Mesh(new THREE.DodecahedronGeometry(.22+Math.random()*.08,0),rockMat);q.position.set(-9+Math.cos(a)*r*1.18,.13,-5+Math.sin(a)*r*.88);q.scale.y=.62;q.rotation.y=a;q.castShadow=true;scene.add(q)}
  const lilyMat=new THREE.MeshStandardMaterial({color:0x4d9a54,roughness:.7,side:THREE.DoubleSide});for(const [dx,dz,s] of [[-.9,-.3,.34],[.4,.6,.29],[1.0,-.5,.23]]){const l=new THREE.Mesh(new THREE.CircleGeometry(s,18),lilyMat);l.rotation.x=-Math.PI/2;l.position.set(-9+dx,.07,-5+dz);scene.add(l)}
}

addBarn();addFence();addLake();[[-11,6,1.08,1],[-7,7,.93,2],[11,6,.96,3],[-12,-1,.88,4],[-5,-7,1.03,5],[-1,-7,.84,6],[11,-7,1.02,7]].forEach(v=>addTree(...v))

const plotPositions=[[-7,1.6],[-4.6,1.6],[-7,-.6],[-4.6,-.6],[-7,-2.8],[-4.6,-2.8],[-7,-5],[-4.6,-5]]
function makePlot(no,[x,z]){const g=new THREE.Group();g.userData={kind:'plot',id:no};const soil=new THREE.Mesh(new THREE.BoxGeometry(1.75,.18,1.35),new THREE.MeshStandardMaterial({map:soilTex,color:0xffffff,roughness:1}));soil.position.y=.2;soil.receiveShadow=true;soil.userData=g.userData;g.add(soil);const wood=new THREE.MeshStandardMaterial({color:0x865432,map:woodTex,roughness:1});for(const [w,d,px,pz] of [[2.05,.16,0,.75],[2.05,.16,0,-.75],[.16,1.65,.95,0],[.16,1.65,-.95,0]]){const b=new THREE.Mesh(new THREE.BoxGeometry(w,.32,d),wood);b.position.set(px,.23,pz);b.castShadow=true;b.receiveShadow=true;g.add(b)}for(let i=-1;i<=1;i++){const ridge=new THREE.Mesh(new THREE.CylinderGeometry(.055,.075,1.55,10),new THREE.MeshStandardMaterial({color:0x5f3a25,roughness:1}));ridge.rotation.z=Math.PI/2;ridge.position.set(0,.34,i*.36);g.add(ridge)}g.position.set(x,0,z);scene.add(g);plotMeshes.set(no,g);interactive.push(soil)}
plotPositions.forEach((p,i)=>makePlot(i+1,p))

function chicken(){const g=new THREE.Group();const white=new THREE.MeshStandardMaterial({color:0xf8f4e8,roughness:.88}),red=new THREE.MeshStandardMaterial({color:0xc94f4f,roughness:.8}),orange=new THREE.MeshStandardMaterial({color:0xe3a340,roughness:.85});const body=new THREE.Mesh(new THREE.SphereGeometry(.46,24,18),white);body.scale.set(1.2,.92,1);body.position.y=.62;body.castShadow=true;g.add(body);for(const z of [-.34,.34]){const wing=new THREE.Mesh(new THREE.SphereGeometry(.26,18,12),new THREE.MeshStandardMaterial({color:0xe9e2d2,roughness:.9}));wing.scale.set(1,.65,.35);wing.position.set(-.03,.65,z);wing.castShadow=true;g.add(wing)}const head=new THREE.Mesh(new THREE.SphereGeometry(.27,22,16),white);head.position.set(.42,.94,0);head.castShadow=true;g.add(head);const beak=new THREE.Mesh(new THREE.ConeGeometry(.1,.28,10),orange);beak.rotation.z=-Math.PI/2;beak.position.set(.7,.92,0);g.add(beak);for(let i=-1;i<=1;i++){const comb=new THREE.Mesh(new THREE.SphereGeometry(.065,10,8),red);comb.position.set(.35+i*.08,1.22,0);g.add(comb)}for(const z of [-.12,.12]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.34,8),orange);leg.position.set(0,.22,z);g.add(leg)}return g}
function cow(){const g=new THREE.Group();const white=new THREE.MeshStandardMaterial({color:0xf1eee7,roughness:.88}),dark=new THREE.MeshStandardMaterial({color:0x49372f,roughness:.9}),pink=new THREE.MeshStandardMaterial({color:0xe8aaa3,roughness:.84});const body=new THREE.Mesh(new THREE.CapsuleGeometry(.48,1.05,8,20),white);body.rotation.z=Math.PI/2;body.position.y=1.0;body.castShadow=true;g.add(body);const head=new THREE.Mesh(new THREE.SphereGeometry(.43,24,18),white);head.scale.set(1.05,.95,.9);head.position.set(.98,1.08,0);head.castShadow=true;g.add(head);const muzzle=new THREE.Mesh(new THREE.SphereGeometry(.26,20,14),pink);muzzle.scale.set(1.1,.7,.9);muzzle.position.set(1.32,.93,0);g.add(muzzle);for(const z of [-.34,.34]){const ear=new THREE.Mesh(new THREE.SphereGeometry(.16,14,10),dark);ear.scale.set(1,.45,.7);ear.position.set(.9,1.38,z);g.add(ear)}for(const x of [-.45,.45])for(const z of [-.27,.27]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.075,.085,.7,10),dark);leg.position.set(x,.46,z);g.add(leg)}for(const [x,y,z,s] of [[-.25,1.28,.43,.28],[.2,.86,-.44,.23],[.55,1.2,.3,.2]]){const spot=new THREE.Mesh(new THREE.SphereGeometry(s,16,10),dark);spot.scale.set(1.4,.7,.25);spot.position.set(x,y,z);g.add(spot)}return g}
function makeAnimal(key,type,x,z){const g=type==='vaca'?cow():chicken();g.position.set(x,0,z);g.userData={kind:'animal',id:key};g.traverse(o=>{if(o.isMesh){o.userData=g.userData;o.castShadow=true}});scene.add(g);animalMeshes.set(key,g);g.traverse(o=>{if(o.isMesh)interactive.push(o)})}
makeAnimal('galinha-1','galinha',6,-.8);makeAnimal('vaca-1','vaca',8.7,.7)

function labelSprite(text,color){const c=document.createElement('canvas');c.width=384;c.height=96;const x=c.getContext('2d');x.font='900 34px system-ui';x.textAlign='center';x.textBaseline='middle';x.fillStyle='rgba(255,255,255,.94)';x.beginPath();x.roundRect(12,10,360,76,24);x.fill();x.shadowColor='rgba(0,0,0,.14)';x.shadowBlur=10;x.fillStyle=color;x.fillText(text,192,49);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false}));s.scale.set(3.15,.8,1);return s}
function makePlayer(key){const tone=key==='isa'?'pink':'blue',color=avatarColors[tone];const g=new THREE.Group();const cloth=new THREE.MeshStandardMaterial({color,roughness:.78}),skin=new THREE.MeshStandardMaterial({color:0xeec19f,roughness:.82}),hair=new THREE.MeshStandardMaterial({color:0x5b3829,roughness:.92});const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.26,.52,7,14),cloth);torso.position.y=1.0;torso.castShadow=true;g.add(torso);const head=new THREE.Mesh(new THREE.SphereGeometry(.29,24,18),skin);head.position.y=1.62;head.castShadow=true;g.add(head);const hairCap=new THREE.Mesh(new THREE.SphereGeometry(.3,22,14,0,Math.PI*2,0,Math.PI*.55),hair);hairCap.position.y=1.68;hairCap.castShadow=true;g.add(hairCap);for(const x of [-.16,.16]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.055,.07,.48,10),new THREE.MeshStandardMaterial({color:0x36445b,roughness:.9}));leg.position.set(x,.45,0);g.add(leg);const shoe=new THREE.Mesh(new THREE.SphereGeometry(.09,12,8),new THREE.MeshStandardMaterial({color:0x3f302b,roughness:.9}));shoe.scale.set(1.25,.55,1.5);shoe.position.set(x,.18,.045);g.add(shoe)}for(const x of [-.37,.37]){const arm=new THREE.Mesh(new THREE.CylinderGeometry(.045,.05,.48,10),skin);arm.position.set(x,1.05,0);arm.rotation.z=x<0?-.2:.2;g.add(arm)}const label=labelSprite(key==='isa'?'Isa':'Jogador 2',key==='isa'?'#c54b7d':'#3f79b7');label.position.y=2.35;g.add(label);scene.add(g);playerMeshes.set(key,{group:g,label,torso,tone})}
makePlayer('isa');makePlayer('primo')

function cropMesh(type,ready){const g=new THREE.Group(),green=new THREE.MeshStandardMaterial({color:0x3f8b46,roughness:.86}),darkGreen=new THREE.MeshStandardMaterial({color:0x2e6f38,roughness:.9});const scale=ready?1:.58;if(type==='milho'){for(const x of [-.42,0,.42]){const stem=new THREE.Mesh(new THREE.CylinderGeometry(.035,.055,1.25,9),green);stem.position.set(x,.68,0);g.add(stem);for(const side of [-1,1]){const leaf=new THREE.Mesh(new THREE.ConeGeometry(.055,.5,8),darkGreen);leaf.position.set(x+side*.08,.55,0);leaf.rotation.z=side*.65;g.add(leaf)}const ear=new THREE.Mesh(new THREE.CapsuleGeometry(.075,.2,5,9),new THREE.MeshStandardMaterial({color:0xe7c247,roughness:.8}));ear.position.set(x+.08,.75,.03);ear.rotation.z=.35;g.add(ear)}}else if(type==='tomate'){for(const x of [-.35,.35]){const stem=new THREE.Mesh(new THREE.CylinderGeometry(.035,.05,.8,8),green);stem.position.set(x,.45,0);g.add(stem);for(const z of [-.14,.12]){const fruit=new THREE.Mesh(new THREE.SphereGeometry(.14,16,12),new THREE.MeshStandardMaterial({color:0xd64d3f,roughness:.72}));fruit.position.set(x,.55,z);g.add(fruit)}}}else if(type==='morango'){for(const x of [-.4,0,.4]){for(let i=0;i<3;i++){const leaf=new THREE.Mesh(new THREE.SphereGeometry(.13,12,9),green);leaf.scale.set(1.5,.38,1);leaf.position.set(x+(i-1)*.08,.3,(i%2?-.08:.08));g.add(leaf)}const fruit=new THREE.Mesh(new THREE.ConeGeometry(.12,.24,12),new THREE.MeshStandardMaterial({color:0xdc4f5b,roughness:.72}));fruit.position.set(x,.2,.13);fruit.rotation.z=Math.PI;g.add(fruit)}}else{for(const x of [-.38,0,.38]){for(let i=0;i<4;i++){const leaf=new THREE.Mesh(new THREE.ConeGeometry(.055,.45,8),green);leaf.position.set(x,.4,0);leaf.rotation.z=(i-1.5)*.35;leaf.rotation.y=i*Math.PI/2;g.add(leaf)}if(ready){const carrot=new THREE.Mesh(new THREE.ConeGeometry(.1,.36,12),new THREE.MeshStandardMaterial({color:0xe98635,roughness:.75}));carrot.position.set(x,.2,0);carrot.rotation.z=Math.PI;g.add(carrot)}}}g.scale.setScalar(scale);return g}
function updatePlots(){for(const p of snapshot?.plots||[]){const g=plotMeshes.get(Number(p.no));if(!g)continue;const old=g.getObjectByName('crop');if(old)g.remove(old);const base=g.children[0];base.material.color.set(p.wateredAt?0x7d6049:0xffffff);if(p.crop){const ready=p.readyAt&&Date.now()>=new Date(p.readyAt).getTime();const c=cropMesh(p.crop,ready);c.name='crop';c.position.y=.28;g.add(c)}}}
function updateAnimals(){for(const a of snapshot?.animals||[]){const g=animalMeshes.get(a.key);if(!g)continue;const ready=a.rewardReadyAt&&Date.now()>=new Date(a.rewardReadyAt).getTime();g.scale.setScalar(ready?1.06:1);g.userData.ready=!!ready}}
function updatePlayers(){for(const p of snapshot?.players||[]){const rec=playerMeshes.get(p.key);if(!rec)continue;rec.group.position.x=num(p.x);rec.group.position.z=num(p.z);const tone=p.key==='isa'?'pink':(p.avatar||'blue'),hex=avatarColors[tone]||avatarColors.blue;if(rec.tone!==tone){rec.torso.material.color.setHex(hex);rec.tone=tone}if(rec.label.userData.name!==p.name){rec.group.remove(rec.label);rec.label=labelSprite(p.name||p.key,p.key==='isa'?'#c54b7d':'#3f79b7');rec.label.position.y=2.35;rec.label.userData.name=p.name;rec.group.add(rec.label)}}}
function updateHud(){const isa=playerData('isa')||{},primo=playerData('primo')||{},me=playerData(player)||{};const primoName=primo.name||'Jogador 2';$('isaName').textContent=isa.name||'Isa';$('primoName').textContent=primoName;$('legendIsa').textContent=isa.name||'Isa';$('legendPrimo').textContent=primoName;$('isaScore').textContent=isa.score||0;$('primoScore').textContent=primo.score||0;$('sharedScore').textContent=snapshot?.room?.sharedScore||0;$('farmLevel').textContent=`nível ${snapshot?.room?.level||1}`;$('myCoins').textContent=me.coins??50;$('onlineState').textContent=isa.online&&primo.online?'🟢 os dois online':isa.online?'💗 Isa online':primo.online?`💙 ${primoName} online`:'aguardando os dois…';$('renameBtn').classList.toggle('hidden',player!=='primo')}
function applySnapshot(s){snapshot=s;updateHud();updatePlayers();updatePlots();updateAnimals()}

async function doAction(action,payload={}){if(!gameToken)return;try{const s=await rpc('farm_game_action',{p_token:gameToken,p_action:action,p_payload:payload});applySnapshot(s);setConnection(true,'Ao vivo')}catch(e){toast(e.message);setConnection(false,'Reconectando…')}}
async function refresh(){if(!gameToken||pollBusy)return;pollBusy=true;try{const s=await rpc('farm_game_snapshot',{p_token:gameToken});applySnapshot(s);setConnection(true,'Ao vivo')}catch{setConnection(false,'Sem conexão')}finally{pollBusy=false}}
function setTool(tool){selectedTool=tool;document.querySelectorAll('.tool').forEach(b=>b.classList.toggle('active',b.dataset.tool===tool))}
document.querySelectorAll('.tool').forEach(b=>b.onclick=()=>setTool(b.dataset.tool))
$('tipClose').onclick=()=>$('tipCard').remove()
$('renameBtn').onclick=async()=>{const current=playerData('primo')||{};const id=await askGuestIdentity({name:current.name||'',avatar:current.avatar||'blue'},true);if(id){await doAction('identity',id);const saved=readGuest()||{};saveGuest({...saved,name:id.name,avatar:id.avatar})}}

const ray=new THREE.Raycaster(),pointer=new THREE.Vector2()
function targetFromEvent(e){const rect=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-rect.left)/rect.width)*2-1;pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;ray.setFromCamera(pointer,camera);const hits=ray.intersectObjects(interactive,true);for(const h of hits){let o=h.object;while(o&&o!==scene){if(o.userData?.kind)return o.userData;o=o.parent}}return null}
renderer.domElement.addEventListener('pointerup',async e=>{const t=targetFromEvent(e);if(!t)return;if(t.kind==='plot'){const n=Number(t.id);if(selectedTool==='plant')await doAction('plant',{plot:n,crop:$('cropSelect').value});else if(selectedTool==='water')await doAction('water',{plot:n});else if(selectedTool==='harvest')await doAction('harvest',{plot:n});else toast('Para canteiros use Plantar, Regar ou Colher.')}else if(t.kind==='animal'){if(selectedTool==='feed')await doAction('feed',{animal:t.id});else if(selectedTool==='collect')await doAction('collect',{animal:t.id});else toast('Para os animais use Alimentar ou Coletar.')}})

function move(dx,dz){const me=playerData(player);if(!me)return;const x=Math.max(-11,Math.min(11,num(me.x)+dx)),z=Math.max(-7,Math.min(8,num(me.z)+dz));me.x=x;me.z=z;updatePlayers();const now=Date.now();if(now-lastMoveAt>120){lastMoveAt=now;doAction('move',{x,z})}}
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'].includes(e.key)){e.preventDefault();keys.add(e.key.toLowerCase())}})
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()))
document.querySelectorAll('[data-move]').forEach(b=>{const d=b.dataset.move;let timer=null;const step=()=>{if(d==='up')move(0,-.45);if(d==='down')move(0,.45);if(d==='left')move(-.45,0);if(d==='right')move(.45,0)};b.addEventListener('pointerdown',e=>{e.preventDefault();step();timer=setInterval(step,150)});for(const ev of ['pointerup','pointercancel','pointerleave'])b.addEventListener(ev,()=>{clearInterval(timer);timer=null})})
function resize(){const w=stage.clientWidth,h=stage.clientHeight;camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();renderer.setSize(w,h,false)}
window.addEventListener('resize',resize);resize()

function makePeer(){const p=new RTCPeerConnection({iceCandidatePoolSize:6,iceServers:[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']},{urls:'stun:stun.cloudflare.com:3478'}]});p.onicecandidate=e=>{if(e.candidate)sendSignal('ice',e.candidate.toJSON?e.candidate.toJSON():e.candidate).catch(()=>{})};p.ontrack=e=>{const s=e.streams?.[0]||new MediaStream([e.track]);$('remoteAudio').srcObject=s;$('remoteAudio').play().catch(()=>{});$('voiceState').textContent='🎤 Conversa ao vivo';$('voiceState').classList.remove('hidden')};p.onconnectionstatechange=()=>{if(p.connectionState==='connected'){$('voiceState').textContent='🎤 Conversa ao vivo';$('voiceState').classList.remove('hidden')}else if(['failed','closed'].includes(p.connectionState)){$('voiceState').textContent='🎤 Reconecte o microfone'}};return p}
async function sendSignal(kind,payload){if(!gameToken)return;await rpc('farm_signal_send',{p_token:gameToken,p_target:other,p_kind:kind,p_payload:payload||{}})}
async function ensurePeer(){if(peer)return peer;peer=makePeer();if(localStream)localStream.getTracks().forEach(t=>peer.addTrack(t,localStream));return peer}
async function startOffer(){if(player!=='isa'||!voiceOn||offerSent)return;const p=await ensurePeer();const offer=await p.createOffer();await p.setLocalDescription(offer);offerSent=true;await sendSignal('offer',p.localDescription.toJSON?p.localDescription.toJSON():p.localDescription)}
async function acceptOffer(off){if(!voiceOn){pendingOffer=off;toast('🎤 O outro jogador quer conversar. Toque no microfone para entrar.',3000);return}const p=await ensurePeer();await p.setRemoteDescription(new RTCSessionDescription(off));for(const c of pendingIce.splice(0)){try{await p.addIceCandidate(c)}catch{}}const ans=await p.createAnswer();await p.setLocalDescription(ans);await sendSignal('answer',p.localDescription.toJSON?p.localDescription.toJSON():p.localDescription)}
async function handleSignal(s){if(s.kind==='ready'){if(voiceOn&&player==='isa')await startOffer();else if(!voiceOn)toast('🎤 O outro jogador ligou o microfone.',1800)}else if(s.kind==='offer'){pendingOffer=s.payload;await acceptOffer(s.payload)}else if(s.kind==='answer'){if(peer&&voiceOn&&!peer.currentRemoteDescription){await peer.setRemoteDescription(new RTCSessionDescription(s.payload));for(const c of pendingIce.splice(0)){try{await peer.addIceCandidate(c)}catch{}}}}else if(s.kind==='ice'){const c=new RTCIceCandidate(s.payload);if(peer?.remoteDescription)try{await peer.addIceCandidate(c)}catch{}else pendingIce.push(c)}else if(s.kind==='hangup'){stopVoice(false);toast('O outro jogador desligou o microfone.')}}
async function pollSignals(){if(!gameToken||signalBusy)return;signalBusy=true;try{const list=await rpc('farm_signal_poll',{p_token:gameToken,p_after:lastSignal});for(const s of list||[]){lastSignal=Math.max(lastSignal,Number(s.id)||0);await handleSignal(s)}}catch{}finally{signalBusy=false}}
async function startVoice(){try{if(!navigator.mediaDevices?.getUserMedia)throw new Error('O navegador não liberou o microfone.');localStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});voiceOn=true;$('voiceBtn').classList.add('on');$('voiceBtn').textContent='🔇';$('voiceState').textContent='🎤 Microfone ligado';$('voiceState').classList.remove('hidden');await sendSignal('ready',{at:Date.now()});if(pendingOffer)await acceptOffer(pendingOffer);if(player==='isa')setTimeout(()=>startOffer().catch(()=>{}),300)}catch(e){toast(e.message||'Não foi possível abrir o microfone.')}}
function stopVoice(notify=true){voiceOn=false;offerSent=false;pendingOffer=null;pendingIce=[];try{peer?.close()}catch{};peer=null;for(const t of localStream?.getTracks?.()||[])try{t.stop()}catch{};localStream=null;$('remoteAudio').srcObject=null;$('voiceBtn').classList.remove('on');$('voiceBtn').textContent='🎤';$('voiceState').classList.add('hidden');if(notify&&gameToken)sendSignal('hangup',{at:Date.now()}).catch(()=>{})}
$('voiceBtn').onclick=()=>voiceOn?stopVoice(true):startVoice()
window.addEventListener('beforeunload',()=>{try{stopVoice(true)}catch{}})

async function bootstrapGuest(){
  let saved=readGuest(),setup=null
  if(!saved?.token)setup=await askGuestIdentity(saved||{},false)
  const args={p_player:'primo',p_external_token:externalToken,p_guest_token:saved?.token||null,p_guest_name:setup?.name||null,p_guest_avatar:setup?.avatar||null}
  try{return await rpc('farm_game_bootstrap',args)}catch(e){if(saved?.token&&/identidade|reconhecida/i.test(e.message||'')){clearGuest();saved=null;setup=await askGuestIdentity({},false);return rpc('farm_game_bootstrap',{p_player:'primo',p_external_token:externalToken,p_guest_token:null,p_guest_name:setup.name,p_guest_avatar:setup.avatar})}throw e}
}
async function boot(){try{let data;if(player==='primo'){if(!externalToken)throw new Error('Abra a fazendinha pelo acesso da Paloma neste celular.');data=await bootstrapGuest();if(data?.identity?.guestToken)saveGuest({token:data.identity.guestToken,name:data.identity.name,avatar:data.identity.avatar})}else data=await rpc('farm_game_bootstrap',{p_player:'isa',p_external_token:null,p_guest_token:null,p_guest_name:null,p_guest_avatar:null},true);gameToken=data.token;applySnapshot(data.snapshot);$('loadingCard').classList.add('hidden');setConnection(true,'Ao vivo');toast(player==='isa'?'Isa entrou na fazenda 💗':`${data.identity?.name||'Jogador 2'} entrou na fazenda 💙`);setInterval(refresh,650);setInterval(pollSignals,650);refresh();pollSignals()}catch(e){$('loadingCard').innerHTML=`<strong>Não foi possível entrar</strong><span>${String(e.message||e)}</span>`;setConnection(false,'Acesso necessário')}}

const clock=new THREE.Clock()
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04),speed=3.1*dt;if(keys.has('w')||keys.has('arrowup'))move(0,-speed);if(keys.has('s')||keys.has('arrowdown'))move(0,speed);if(keys.has('a')||keys.has('arrowleft'))move(-speed,0);if(keys.has('d')||keys.has('arrowright'))move(speed,0);const t=performance.now()*.001;animalMeshes.forEach((g,k)=>{g.rotation.y=Math.sin(t*.55+(k==='vaca-1'?1:0))*.14;g.position.y=Math.sin(t*1.8+(k==='vaca-1'?1:0))*.018});renderer.render(scene,camera)}
animate();boot()
