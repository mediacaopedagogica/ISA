import { CONFIG } from '../config.js'
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js'
import { Sky } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/objects/Sky.js'
import { RoundedBoxGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/geometries/RoundedBoxGeometry.js'

const $=id=>document.getElementById(id)
const params=new URLSearchParams(location.search)
const player=(params.get('player')||'isa').toLowerCase()==='primo'?'primo':'isa'
let gameToken='',snapshot=null,pollBusy=false,selectedTool='plant',actionBusy=false
const keys=new Set(),plotMeshes=new Map(),animalMeshes=new Map(),playerMeshes=new Map(),interactive=[],fx=[]
const own={x:-2,z:4,target:null,lastInput:0,lastSent:0,sending:false,loaded:false}

function getAuth(){
  const seek=o=>{if(!o||typeof o!=='object')return'';if(typeof o.access_token==='string')return o.access_token;for(const v of Object.values(o)){const t=seek(v);if(t)return t}return''}
  for(const store of [localStorage,sessionStorage]){try{for(let i=0;i<store.length;i++){const k=store.key(i)||'';if(!/auth-token/i.test(k))continue;let raw=store.getItem(k)||'';if(raw.startsWith('base64-')){try{raw=atob(raw.slice(7))}catch{}}try{const t=seek(JSON.parse(raw));if(t)return t}catch{}}}catch{}}
  return''
}
async function rpc(name,args={},isaAuth=false){
  const bearer=isaAuth?getAuth():CONFIG.SUPABASE_KEY
  if(isaAuth&&!bearer)throw new Error('Abra a Fazendinha pelo acesso da Isa.')
  const r=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${name}`,{method:'POST',cache:'no-store',headers:{apikey:CONFIG.SUPABASE_KEY,Authorization:`Bearer ${bearer}`,'Content-Type':'application/json'},body:JSON.stringify(args)})
  let data=null;try{data=await r.json()}catch{}
  if(!r.ok)throw new Error(data?.message||data?.hint||data?.details||'Não foi possível sincronizar a fazenda.')
  return data
}
function toast(text,ms=2300){const el=$('toast');if(!el)return;el.textContent=text;el.classList.remove('hidden');clearTimeout(el._hide);el._hide=setTimeout(()=>el.classList.add('hidden'),ms)}
function setConnection(ok,text){const b=$('connectionBadge');if(!b)return;b.textContent=text;b.classList.toggle('ok',ok);b.classList.toggle('bad',ok===false)}
function playerData(k){return snapshot?.players?.find(p=>p.key===k)}
const num=v=>Number.isFinite(Number(v))?Number(v):0
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v))

const stage=$('farmStage')
const scene=new THREE.Scene()
scene.fog=new THREE.Fog(0xc9d9c5,34,74)
const camera=new THREE.PerspectiveCamera(42,1,.1,180)
camera.position.set(18.4,14.7,25.8)
camera.lookAt(0,1,-1.8)
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'})
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.8))
renderer.shadowMap.enabled=true
renderer.shadowMap.type=THREE.PCFSoftShadowMap
renderer.outputColorSpace=THREE.SRGBColorSpace
renderer.toneMapping=THREE.ACESFilmicToneMapping
renderer.toneMappingExposure=1.08
renderer.domElement.tabIndex=0
renderer.domElement.style.outline='none'
stage.appendChild(renderer.domElement)

// Céu atmosférico realista, sem usar imagem estática.
const sky=new Sky();sky.scale.setScalar(120);scene.add(sky)
const su=sky.material.uniforms;su.turbidity.value=7.2;su.rayleigh.value=2.0;su.mieCoefficient.value=.006;su.mieDirectionalG.value=.78
const sunVector=new THREE.Vector3().setFromSphericalCoords(1,THREE.MathUtils.degToRad(90-34),THREE.MathUtils.degToRad(225));su.sunPosition.value.copy(sunVector)
scene.add(new THREE.HemisphereLight(0xdff2ff,0x455533,1.15))
const sun=new THREE.DirectionalLight(0xffe3b0,4.2);sun.position.set(-18,24,13);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-25;sun.shadow.camera.right=25;sun.shadow.camera.top=22;sun.shadow.camera.bottom=-22;sun.shadow.camera.near=.5;sun.shadow.camera.far=70;sun.shadow.bias=-.0003;scene.add(sun)
const fill=new THREE.DirectionalLight(0xaed8ff,.85);fill.position.set(18,12,-15);scene.add(fill)
const warm=new THREE.PointLight(0xffd29d,.55,28);warm.position.set(-7,6,10);scene.add(warm)

function canvasTex(base,dark,repeatX=4,repeatY=4,grain=8500){
  const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.fillStyle=base;x.fillRect(0,0,512,512)
  for(let i=0;i<grain;i++){const a=.025+Math.random()*.13;x.fillStyle=`rgba(${dark},${a})`;const s=.35+Math.random()*2.7;x.fillRect(Math.random()*512,Math.random()*512,s,s)}
  for(let i=0;i<110;i++){x.strokeStyle=`rgba(${dark},${.018+Math.random()*.055})`;x.lineWidth=.4+Math.random()*1.5;x.beginPath();x.moveTo(0,Math.random()*512);x.bezierCurveTo(150,Math.random()*512,350,Math.random()*512,512,Math.random()*512);x.stroke()}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeatX,repeatY);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t
}
const grassTex=canvasTex('#668f49','39,68,30',14,10,12000)
const dirtTex=canvasTex('#9e784e','74,47,27',8,6,9500)
const soilTex=canvasTex('#57341f','34,18,10',3,2,9000)
const woodTex=canvasTex('#765039','48,27,15',3,7,10000)
const whiteWood=canvasTex('#ddd0b5','105,86,62',5,7,9000)
const roofTex=canvasTex('#9b452c','58,26,18',7,6,10000)
const redWood=canvasTex('#7e3029','47,18,16',5,8,10000)
const stoneTex=canvasTex('#9c927f','70,65,57',5,5,9000)

const materials={}
function pmat(name,color,rough=.88,map=null,extra={}){
  const opts={color,roughness:rough,map:map||null,...extra};if(map){opts.bumpMap=map;opts.bumpScale=.035}
  const m=new THREE.MeshStandardMaterial(opts);materials[name]=m;return m
}
function phys(color,rough=.4,metal=.0,extra={}){return new THREE.MeshPhysicalMaterial({color,roughness:rough,metalness:metal,...extra})}
function M(geo,material,x=0,y=0,z=0){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;return m}
function beam(a,b,r,material,segments=12){const mid=a.clone().add(b).multiplyScalar(.5),len=a.distanceTo(b),m=M(new THREE.CylinderGeometry(r,r*1.06,len,segments),material);m.position.copy(mid);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());return m}

// Texturas fotográficas opcionais. Se falharem, o jogo mantém as texturas procedurais.
const loader=new THREE.TextureLoader();loader.setCrossOrigin('anonymous')
function upgradeTexture(url,targets,repeat){loader.load(url,t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());for(const m of targets){m.map=t;m.bumpMap=t;m.bumpScale=.025;m.needsUpdate=true}},undefined,()=>{})}

const groundMat=pmat('ground',0xeaf5e4,.98,grassTex)
const groundGeo=new THREE.PlaneGeometry(42,30,110,80),gp=groundGeo.attributes.position
for(let i=0;i<gp.count;i++){const x=gp.getX(i),y=gp.getY(i),edge=Math.max(Math.abs(x)/21,Math.abs(y)/15);const h=Math.sin(x*.28)*.11+Math.cos(y*.35)*.08+Math.sin((x+y)*.17)*.07+Math.sin(x*.83+y*.41)*.025;gp.setZ(i,h-Math.max(0,edge-.82)**2*.65)}
groundGeo.computeVertexNormals()
const ground=M(groundGeo,groundMat);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;ground.userData={kind:'ground'};scene.add(ground)

const pathMat=pmat('path',0xd0a86d,1,dirtTex)
function path(w,h,x,z,rot=0){const g=new THREE.PlaneGeometry(w,h,30,18),p=g.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,(Math.sin(p.getX(i)*1.4)+Math.cos(p.getY(i)*1.8))*.018);g.computeVertexNormals();const m=M(g,pathMat,x,.06,z);m.rotation.x=-Math.PI/2;m.rotation.z=rot;m.receiveShadow=true;scene.add(m);return m}
path(4.3,27,1.6,.2);path(39,2.9,.2,5.25);path(9,2.0,-11.4,-.6,.28);path(8,1.9,11.5,-.4,-.25)

// Montanhas em camadas ao fundo para profundidade semelhante à referência.
function ridge(z,baseY,amp,color,seed){
  const n=70,verts=[],idx=[];for(let i=0;i<=n;i++){const x=-42+i*(84/n),y=baseY+Math.sin(i*.31+seed)*amp*.45+Math.sin(i*.13+seed*2)*amp*.55+Math.sin(i*.77)*amp*.12;verts.push(x,-5,z,x,y,z)}
  for(let i=0;i<n;i++){const a=i*2,b=a+1,c=a+2,d=a+3;idx.push(a,c,b,c,d,b)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(idx);g.computeVertexNormals();const m=new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,fog:true});const o=new THREE.Mesh(g,m);scene.add(o)
}
ridge(-42,10,5.0,0x78957d,1.2);ridge(-50,12.3,7.2,0x6f8190,2.8);ridge(-58,14,8.8,0x76838e,4.1)

function addPebbles(){const geo=new THREE.DodecahedronGeometry(.06,0),mat=pmat('pebbles',0x81705a,1),ins=new THREE.InstancedMesh(geo,mat,280),d=new THREE.Object3D();for(let i=0;i<280;i++){const vertical=Math.random()<.47;const x=vertical?1.6+(Math.random()-.5)*3.5:-18+Math.random()*36,z=vertical?-11.6+Math.random()*23.2:5.25+(Math.random()-.5)*2.3;d.position.set(x,.13,z);const s=.45+Math.random()*1.75;d.scale.set(s,.4+Math.random()*.45,s);d.rotation.set(Math.random(),Math.random()*6.28,Math.random());d.updateMatrix();ins.setMatrixAt(i,d.matrix)}ins.castShadow=true;ins.receiveShadow=true;scene.add(ins)}addPebbles()

function addVegetation(){
  const d=new THREE.Object3D(),grassGeo=new THREE.ConeGeometry(.025,.28,4),grassMat=pmat('grassBlade',0x376d32,.95),ins=new THREE.InstancedMesh(grassGeo,grassMat,1250);let k=0
  while(k<1250){const x=-19.6+Math.random()*39.2,z=-13.5+Math.random()*27;if(Math.abs(x-1.6)<2.5||Math.abs(z-5.25)<1.9||(x>4&&x<17&&z>-4&&z<4)||(x<-6&&z<-5.3)||(x<-7&&x>-15&&z>-3&&z<3))continue;d.position.set(x,.14,z);d.rotation.set(0,Math.random()*6.28,(Math.random()-.5)*.22);const s=.45+Math.random()*1.65;d.scale.set(s,s,s);d.updateMatrix();ins.setMatrixAt(k++,d.matrix)}ins.castShadow=true;scene.add(ins)
  const flowerColors=[0xffffff,0xffd96a,0xf2a9c8,0xbca9f2,0xf08b65],fGeo=new THREE.SphereGeometry(.045,10,7);for(const col of flowerColors){const flowers=new THREE.InstancedMesh(fGeo,pmat(`f${col}`,col,.72),55);for(let i=0;i<55;i++){let x,z;do{x=-18+Math.random()*36;z=-12.5+Math.random()*25}while(Math.abs(x-1.6)<2.4||Math.abs(z-5.25)<1.7);d.position.set(x,.18+Math.random()*.12,z);const s=.65+Math.random()*.9;d.scale.set(s,s,s);d.updateMatrix();flowers.setMatrixAt(i,d.matrix)}flowers.castShadow=true;scene.add(flowers)}
}
addVegetation()

function rounded(w,h,d,r=.12,seg=3){return new RoundedBoxGeometry(w,h,d,seg,r)}
const houseWall=pmat('houseWall',0xf2e8d2,.92,whiteWood),houseTrim=pmat('houseTrim',0x765039,.9,woodTex),houseRoof=pmat('houseRoof',0xa64a2e,.88,roofTex)
const barnRed=pmat('barnRed',0x883029,.93,redWood),barnTrim=pmat('barnTrim',0xe0c7a2,.9,whiteWood),barnDark=pmat('barnDark',0x412b22,.96,woodTex),barnRoof=pmat('barnRoof',0x665047,.94,woodTex)
const fenceMat=pmat('fence',0x805738,.96,woodTex)

function addWindow(g,x,y,z,w=1.15,h=1.25){const frame=M(rounded(w,h,.13,.05),houseTrim,x,y,z);g.add(frame);const glass=M(new THREE.PlaneGeometry(w-.18,h-.18),phys(0x76b5c8,.08,.05,{transparent:true,opacity:.72,clearcoat:.7,clearcoatRoughness:.08}),x,y,z+.08);g.add(glass);g.add(M(new THREE.BoxGeometry(.055,h-.18,.035),houseTrim,x,y,z+.13));g.add(M(new THREE.BoxGeometry(w-.18,.055,.035),houseTrim,x,y,z+.13));for(const sx of [-w*.65,w*.65]){const sh=M(rounded(.32,h,.11,.04),pmat('shutter',0x5f7046,.9,woodTex),x+sx,y,z+.02);g.add(sh)}}
function flowerBox(g,x,y,z){g.add(M(rounded(1.15,.22,.32,.05),houseTrim,x,y,z));for(let i=0;i<8;i++){const stem=M(new THREE.CylinderGeometry(.015,.02,.28,6),pmat('flowerStem',0x3d793a,.9),x-.47+i*.135,y+.18,z+.03);g.add(stem);const f=M(new THREE.SphereGeometry(.07,10,7),pmat(`flowerBox${i}`,i%2?0xe96682:0xffd75d,.7),x-.47+i*.135,y+.34,z+.03);g.add(f)}}
function addHouse(){
  const g=new THREE.Group();g.position.set(-11.0,0,-.4)
  g.add(M(rounded(6.6,3.35,4.8,.16),houseWall,0,1.68,0))
  // Siding horizontal fino para quebrar o efeito de bloco liso.
  for(let y=.28;y<3.15;y+=.24)g.add(M(new THREE.BoxGeometry(6.66,.025,.035),houseTrim,0,y,2.42))
  const r1=M(new THREE.BoxGeometry(7.45,.22,3.65),houseRoof,0,4.05,-1.38);r1.rotation.x=-.61;g.add(r1);const r2=M(new THREE.BoxGeometry(7.45,.22,3.65),houseRoof,0,4.05,1.38);r2.rotation.x=.61;g.add(r2)
  // Telhas em faixas.
  for(let x=-3.35;x<=3.35;x+=.38){for(const z of [-1.39,1.39]){const sh=M(new THREE.BoxGeometry(.31,.035,3.25),pmat(`tile${x}${z}`,0x94402c,.98),x,4.12,z);sh.rotation.x=z<0?-.61:.61;g.add(sh)}}
  // Varanda, corrimão e colunas.
  g.add(M(rounded(6.9,.22,2.05,.07),houseTrim,0,.18,2.75));for(const x of [-2.85,-1.45,1.45,2.85])g.add(M(new THREE.CylinderGeometry(.075,.095,2.85,12),houseTrim,x,1.5,3.24));const porchRoof=M(new THREE.BoxGeometry(7.1,.16,2.3),houseRoof,0,2.92,2.68);porchRoof.rotation.x=.06;g.add(porchRoof)
  for(const x of [-2.7,-1.8,1.75,2.65])g.add(M(new THREE.CylinderGeometry(.045,.05,.72,10),houseTrim,x,.62,3.2));for(const y of [.45,.82])g.add(beam(new THREE.Vector3(-3.0,y,3.2),new THREE.Vector3(-1.35,y,3.2),.035,houseTrim,8));for(const y of [.45,.82])g.add(beam(new THREE.Vector3(1.35,y,3.2),new THREE.Vector3(3.0,y,3.2),.035,houseTrim,8))
  // Porta e janelas detalhadas.
  g.add(M(rounded(1.05,2.35,.14,.05),pmat('door',0x6c4b35,.88,woodTex),.35,1.25,2.46));g.add(M(new THREE.SphereGeometry(.055,10,8),pmat('knob',0xc8a25b,.3),.73,1.25,2.58));addWindow(g,-2.0,1.85,2.47);addWindow(g,2.12,1.85,2.47);flowerBox(g,-2.0,1.12,2.66);flowerBox(g,2.12,1.12,2.66)
  // Chaminé em tijolos.
  const chimney=pmat('chimney',0xa15b43,.92,stoneTex);g.add(M(rounded(.68,2.1,.72,.06),chimney,-2.25,4.1,-.6));for(let y=3.35;y<5;y+=.22)g.add(M(new THREE.BoxGeometry(.71,.025,.75),houseTrim,-2.25,y,-.6))
  // Vasos na varanda.
  for(const [x,z,c] of [[-2.9,2.9,0xd9807c],[2.8,2.9,0xe4c55b],[-1.25,3.0,0xb880d8]]){g.add(M(new THREE.CylinderGeometry(.18,.14,.28,14),pmat(`pot${x}`,0x9a5b3f,.92),x,.38,z));const bush=M(new THREE.SphereGeometry(.28,18,12),pmat(`potb${x}`,0x4f8844,.92),x,.68,z);bush.scale.set(1.15,.8,1.05);g.add(bush);for(let i=0;i<4;i++)g.add(M(new THREE.SphereGeometry(.045,8,6),pmat(`potf${x}${i}`,c,.7),x+(i-1.5)*.08,.83,z+.06))}
  // Banco da varanda.
  g.add(M(rounded(1.35,.14,.42,.05),houseTrim,-.95,.62,3.05));for(const x of [-1.5,-.4])g.add(M(new THREE.BoxGeometry(.08,.62,.08),houseTrim,x,.35,3.05));g.add(M(new THREE.BoxGeometry(1.35,.5,.08),houseTrim,-.95,.9,3.25))
  const lamp=new THREE.PointLight(0xffb65c,1.75,5);lamp.position.set(1.25,2.25,3.4);g.add(lamp);g.add(M(new THREE.SphereGeometry(.095,12,9),new THREE.MeshStandardMaterial({color:0xffd08a,emissive:0xff8e35,emissiveIntensity:1.7}),1.25,2.25,3.4));scene.add(g)
}

function xBrace(g,x,y,z,w,h,material){const a=beam(new THREE.Vector3(x-w/2,y-h/2,z),new THREE.Vector3(x+w/2,y+h/2,z),.055,material,8);const b=beam(new THREE.Vector3(x+w/2,y-h/2,z),new THREE.Vector3(x-w/2,y+h/2,z),.055,material,8);g.add(a,b)}
function addBarn(){
  const g=new THREE.Group();g.position.set(9.8,0,-4.6)
  g.add(M(rounded(7.4,4.55,5.7,.12),barnRed,0,2.28,0));for(let x=-3.35;x<=3.35;x+=.52)g.add(M(new THREE.BoxGeometry(.025,4.1,.04),barnDark,x,2.2,2.88))
  const r1=M(new THREE.BoxGeometry(8.2,.23,4.1),barnRoof,0,5.2,-1.62);r1.rotation.x=-.56;g.add(r1);const r2=M(new THREE.BoxGeometry(8.2,.23,4.1),barnRoof,0,5.2,1.62);r2.rotation.x=.56;g.add(r2)
  // Porta aberta com interior escuro e portas laterais com X.
  g.add(M(new THREE.PlaneGeometry(3.25,3.5),new THREE.MeshStandardMaterial({color:0x211711,roughness:1}),.25,1.85,2.9));for(const sx of [-1.9,2.4]){const door=M(rounded(1.55,3.45,.16,.04),barnRed,sx,1.82,3.0);g.add(door);xBrace(g,sx,1.82,3.1,1.25,2.8,barnTrim)}
  for(const x of [-1.55,2.05])g.add(M(new THREE.BoxGeometry(.15,3.7,.2),barnTrim,x,1.9,3.06));g.add(M(new THREE.BoxGeometry(3.85,.16,.2),barnTrim,.25,3.72,3.06))
  // Janela do sótão.
  g.add(M(rounded(1.25,1.0,.12,.05),barnTrim,0,4.25,2.96));g.add(M(new THREE.PlaneGeometry(.96,.72),phys(0x6c9bab,.12,.02,{transparent:true,opacity:.55}),0,4.25,3.04));xBrace(g,0,4.25,3.1,.9,.7,barnTrim)
  // Fardos e barris.
  const hay=pmat('hay',0xc7a04f,.98);for(let i=0;i<7;i++){const bale=M(rounded(1.05,.72,.82,.08),hay,-2.7+(i%2)*1.15,.45+Math.floor(i/2)*.73,1.95);g.add(bale)}for(const x of [-3.45,3.35]){const barrel=M(new THREE.CylinderGeometry(.35,.38,.78,18),pmat(`barrel${x}`,0x714a31,.94,woodTex),x,.45,2.15);barrel.rotation.z=Math.PI/2;g.add(barrel)}
  const lamp=new THREE.PointLight(0xffa746,2.1,7);lamp.position.set(2.75,2.9,3.35);g.add(lamp);g.add(M(new THREE.SphereGeometry(.11,12,9),new THREE.MeshStandardMaterial({color:0xffc26b,emissive:0xff8730,emissiveIntensity:1.9}),2.75,2.9,3.35));scene.add(g)
}

function addSilo(){const g=new THREE.Group();g.position.set(5.2,0,-8.0);const metal=phys(0xbfc6c4,.28,.68),band=phys(0x727a77,.35,.72);g.add(M(new THREE.CylinderGeometry(1.15,1.25,5.8,36),metal,0,2.9,0));for(let y=.55;y<5.6;y+=.5)g.add(M(new THREE.TorusGeometry(1.22,.032,10,36),band,0,y,0));g.add(M(new THREE.ConeGeometry(1.28,1.35,36),metal,0,6.25,0));const pipe=M(new THREE.CylinderGeometry(.12,.12,4.8,14),band,1.25,3.1,0);pipe.rotation.z=-.05;g.add(pipe);scene.add(g)}
function addWindmill(){const g=new THREE.Group();g.position.set(15.8,0,-8.4);const metal=phys(0x746c5e,.5,.45);for(const [x,z] of [[-.5,-.35],[.5,-.35],[-.5,.35],[.5,.35]])g.add(beam(new THREE.Vector3(x,0,z),new THREE.Vector3(x*.3,6.2,z*.3),.05,metal,10));for(let y=1;y<5.8;y+=1.05){g.add(beam(new THREE.Vector3(-.43,y,-.28),new THREE.Vector3(.43,y,.28),.032,metal,8));g.add(beam(new THREE.Vector3(.43,y,-.28),new THREE.Vector3(-.43,y,.28),.032,metal,8))}const blades=new THREE.Group();for(let i=0;i<10;i++){const b=M(new THREE.BoxGeometry(.15,2.65,.045),pmat(`wind${i}`,0x8d816e,.7),0,1.33,0);b.rotation.z=i*Math.PI/5;blades.add(b)}blades.position.set(0,6.25,.22);g.add(blades);scene.add(g);return blades}

function addLake(){const water=phys(0x4fa7c7,.05,.05,{transparent:true,opacity:.82,clearcoat:1,clearcoatRoughness:.04,reflectivity:.8});const lake=M(new THREE.CircleGeometry(3.75,110),water,-10.2,.055,-7.4);lake.rotation.x=-Math.PI/2;lake.scale.set(1.22,.85,1);lake.name='lakeWater';scene.add(lake);const rock=pmat('lakeRock',0x8a8274,.98,stoneTex);for(let i=0;i<48;i++){const a=i/48*Math.PI*2,r=3.95,q=M(new THREE.DodecahedronGeometry(.18+Math.random()*.16,1),rock,-10.2+Math.cos(a)*r*1.2,.13,-7.4+Math.sin(a)*r*.85);q.scale.y=.55+Math.random()*.2;q.rotation.y=a;scene.add(q)}const reed=pmat('reed',0x4e7435,.9);for(let i=0;i<62;i++){const a=Math.random()*Math.PI*2,r=3.2+Math.random()*.9,q=M(new THREE.CylinderGeometry(.013,.024,.7+Math.random()*.65,7),reed,-10.2+Math.cos(a)*r*1.16,.42,-7.4+Math.sin(a)*r*.82);q.rotation.z=(Math.random()-.5)*.22;scene.add(q)}for(const [dx,dz,s] of [[-.8,.1,.34],[.45,.55,.3],[1.3,-.5,.24]]){const l=M(new THREE.CircleGeometry(s,22),pmat(`lily${dx}`,0x4c8b4d,.74),-10.2+dx,.075,-7.4+dz);l.rotation.x=-Math.PI/2;scene.add(l)}}

function addTree(x,z,s=1,seed=1,fruit=false){const g=new THREE.Group(),trunk=pmat(`trunk${seed}`,0x5b3b27,.98,woodTex);g.add(M(new THREE.CylinderGeometry(.28,.48,3.25,18),trunk,0,1.62,0));[[-.75,2.65,.15],[.72,2.75,.22],[-.2,2.9,-.7],[.28,2.82,.72]].forEach(v=>g.add(beam(new THREE.Vector3(0,2.0,0),new THREE.Vector3(...v),.085,trunk,10)));const greens=[0x376a38,0x437d3e,0x528e46,0x608f4b];for(let i=0;i<16;i++){const a=i/16*Math.PI*2+seed*.37,r=.28+((i*29)%9)/10,yy=2.6+((i*17)%7)*.16,q=M(new THREE.SphereGeometry(.62+((i*11)%4)*.06,20,15),pmat(`leaf${seed}${i}`,greens[(i+seed)%4],.93),Math.cos(a)*r,yy,Math.sin(a)*r*.83);q.scale.set(1.1,.78+((i*7)%4)*.07,1);g.add(q)}if(fruit){for(let i=0;i<14;i++){const a=i/14*Math.PI*2,r=.45+Math.random()*.55,fr=M(new THREE.SphereGeometry(.075,10,8),pmat(`fruit${seed}${i}`,i%3?0xe55e3f:0xe1b83d,.7),Math.cos(a)*r,2.55+Math.random()*1.1,Math.sin(a)*r*.8);g.add(fr)}}g.position.set(x,0,z);g.scale.setScalar(s);scene.add(g)}

function addFenceRect(x1,x2,z1,z2){const posts=[];for(let x=x1;x<=x2+.01;x+=1.55){posts.push([x,z1],[x,z2])}for(let z=z1+1.4;z<z2;z+=1.4){posts.push([x1,z],[x2,z])}posts.forEach(([x,z])=>scene.add(M(new THREE.CylinderGeometry(.085,.13,1.25,12),fenceMat,x,.63,z)));for(const z of [z1,z2])for(const y of [.46,.88])scene.add(beam(new THREE.Vector3(x1,y,z),new THREE.Vector3(x2,y,z),.055,fenceMat,10));for(const x of [x1,x2])for(const y of [.46,.88])scene.add(beam(new THREE.Vector3(x,y,z1),new THREE.Vector3(x,y,z2),.055,fenceMat,10))}

function addMarket(){const g=new THREE.Group();g.position.set(12.6,0,7.3);const wood=pmat('marketWood',0x805336,.94,woodTex);g.add(M(rounded(4.1,.32,1.7,.08),wood,0,.78,0));for(const x of [-1.75,1.75]){g.add(M(new THREE.BoxGeometry(.12,2.3,.12),wood,x,1.65,-.55));g.add(M(new THREE.BoxGeometry(.12,2.3,.12),wood,x,1.65,.55))}const stripeMats=[pmat('stripeA',0xf5efe2,.75),pmat('stripeB',0xc96355,.75)];for(let i=0;i<10;i++){const aw=M(new THREE.BoxGeometry(.42,.09,2.2),stripeMats[i%2],-1.9+i*.42,2.85,0);aw.rotation.z=-.02;g.add(aw)}const produce=[0xd84a34,0xe6a43a,0x7fa64d,0xd9c07b];for(let r=0;r<2;r++)for(let i=0;i<8;i++){const q=M(new THREE.SphereGeometry(.12,12,9),pmat(`prod${r}${i}`,produce[(i+r)%4],.74),-1.45+i*.42,1.08+r*.28,.25-r*.35);g.add(q)}scene.add(g)}
function addWheelbarrow(){const g=new THREE.Group();g.position.set(-4.8,0,6.8);const metal=phys(0x66716d,.48,.45),wood=pmat('wbwood',0x805238,.9,woodTex);const tub=M(new THREE.BoxGeometry(1.45,.45,.9),metal,0,.65,0);tub.rotation.z=-.12;g.add(tub);const wh=M(new THREE.TorusGeometry(.32,.085,12,24),pmat('wheel',0x2f2b28,.95),-.75,.35,0);wh.rotation.y=Math.PI/2;g.add(wh);for(const z of [-.28,.28])g.add(beam(new THREE.Vector3(.2,.45,z),new THREE.Vector3(1.45,.85,z),.045,wood,8));scene.add(g)}
function addSunflowers(){for(let i=0;i<18;i++){const x=-17+i%6*.42,z=6.6+Math.floor(i/6)*.48;scene.add(M(new THREE.CylinderGeometry(.018,.025,1.1,7),pmat(`sfstem${i}`,0x417b38,.88),x,.55,z));const head=M(new THREE.SphereGeometry(.13,12,9),pmat(`sfhead${i}`,0x6a4728,.74),x,1.15,z);scene.add(head);for(let p=0;p<8;p++){const pet=M(new THREE.SphereGeometry(.07,10,7),pmat(`sfpet${i}${p}`,0xf0c52e,.72),x+Math.cos(p*Math.PI/4)*.15,1.15+Math.sin(p*Math.PI/4)*.15,z);pet.scale.set(1.2,.6,.5);scene.add(pet)}}}

addHouse();addBarn();addSilo();const windBlades=addWindmill();addLake();addFenceRect(4.2,16.2,-2.8,3.15);addMarket();addWheelbarrow();addSunflowers()
[[-18,7.7,1.22,1,false],[-14.8,9.3,1.02,2,true],[-10.4,9.6,.94,3,true],[-5.5,10.2,.92,4,false],[10.8,9.5,1.05,5,true],[16.8,6.2,1.0,6,false],[-18,-.5,1.02,7,false],[-16.5,-9.7,1.14,8,false],[-4,-11,.9,9,true],[17,-1.2,.9,10,false],[17,-10.2,1.04,11,false]].forEach(v=>addTree(...v))

// Horta interativa.
const soilMat=pmat('soil',0x5b3822,1,soilTex),bedWood=pmat('bedWood',0x775033,.98,woodTex)
const plotPositions=[[-7.4,2.6],[-4.9,2.6],[-7.4,.25],[-4.9,.25],[-7.4,-2.1],[-4.9,-2.1],[-7.4,-4.45],[-4.9,-4.45]]
function makePlot(no,[x,z]){const g=new THREE.Group();g.position.set(x,0,z);g.userData={kind:'plot',id:no};const soil=M(rounded(2.0,.2,1.58,.06),soilMat,0,.22,0);soil.userData=g.userData;g.add(soil);[[2.3,.18,0,.88],[2.3,.18,0,-.88],[.18,1.95,1.08,0],[.18,1.95,-1.08,0]].forEach(([w,d,xx,zz])=>g.add(M(rounded(w,.34,d,.04),bedWood,xx,.27,zz)));for(let i=-1;i<=1;i++){const ridge=M(new THREE.CylinderGeometry(.055,.075,1.68,12),pmat(`ridge${no}${i}`,0x4b2d1d,1),0,.36,i*.39);ridge.rotation.z=Math.PI/2;g.add(ridge)}scene.add(g);plotMeshes.set(no,g);interactive.push(soil)}plotPositions.forEach((p,i)=>makePlot(i+1,p))

// Modelos orgânicos mais suaves e detalhados.
function eye(g,x,y,z){g.add(M(new THREE.SphereGeometry(.035,10,8),pmat(`eye${Math.random()}`,0x171411,.55),x,y,z))}
function cow(){const g=new THREE.Group(),white=pmat('cowWhite',0xf2eee5,.87),black=pmat('cowBlack',0x342b28,.9),pink=pmat('cowPink',0xe5aaa1,.82),horn=pmat('cowHorn',0xd9c59b,.82);const b=M(new THREE.CapsuleGeometry(.6,1.35,10,28),white,0,1.08,0);b.rotation.z=Math.PI/2;g.add(b);const head=M(new THREE.SphereGeometry(.48,28,22),white,1.22,1.18,0);head.scale.set(1.08,.95,.9);g.add(head);const muzzle=M(new THREE.SphereGeometry(.29,22,16),pink,1.58,1.0,0);muzzle.scale.set(1.12,.72,.9);g.add(muzzle);for(const z of [-.34,.34]){const ear=M(new THREE.SphereGeometry(.18,18,12),black,1.05,1.49,z);ear.scale.set(1,.42,.75);g.add(ear);const h=M(new THREE.ConeGeometry(.055,.28,12),horn,1.15,1.68,z*.7);h.rotation.z=z<0?-.45:.45;g.add(h)}for(const x of [-.52,.52])for(const z of [-.32,.32])g.add(M(new THREE.CylinderGeometry(.065,.085,.82,12),black,x,.48,z));for(const [x,y,z,s] of [[-.35,1.25,.53,.3],[.25,.9,-.52,.24],[.62,1.28,.38,.21],[-.7,.93,-.42,.2]]){const spot=M(new THREE.SphereGeometry(s,20,14),black,x,y,z);spot.scale.set(1.5,.65,.22);g.add(spot)}eye(g,1.48,1.31,.32);eye(g,1.48,1.31,-.32);const udder=M(new THREE.SphereGeometry(.23,16,12),pink,-.15,.55,0);udder.scale.set(1.2,.55,.85);g.add(udder);const tail=beam(new THREE.Vector3(-1.2,1.25,0),new THREE.Vector3(-1.55,.75,.08),.035,black,8);g.add(tail);return g}
function chicken(){const g=new THREE.Group(),white=pmat('chWhite',0xf7f2e5,.88),red=pmat('chRed',0xcb4e43,.78),orange=pmat('chOrange',0xe09a38,.78);const b=M(new THREE.SphereGeometry(.48,28,22),white,0,.66,0);b.scale.set(1.25,.96,1);g.add(b);for(const z of [-.34,.34]){const w=M(new THREE.SphereGeometry(.28,20,14),pmat(`wing${z}`,0xe5dccb,.92),-.04,.7,z);w.scale.set(1,.62,.35);g.add(w)}g.add(M(new THREE.SphereGeometry(.29,24,18),white,.45,1.01,0));const beak=M(new THREE.ConeGeometry(.1,.3,12),orange,.76,.99,0);beak.rotation.z=-Math.PI/2;g.add(beak);for(let i=-1;i<=1;i++)g.add(M(new THREE.SphereGeometry(.065,12,9),red,.37+i*.08,1.31,0));eye(g,.63,1.09,.22);eye(g,.63,1.09,-.22);for(const z of [-.13,.13])g.add(M(new THREE.CylinderGeometry(.022,.026,.36,8),orange,0,.25,z));return g}
function pig(){const g=new THREE.Group(),body=pmat('pigBody',0xe7a098,.88),dark=pmat('pigDark',0xba6f69,.84);const b=M(new THREE.CapsuleGeometry(.47,.9,9,24),body,0,.78,0);b.rotation.z=Math.PI/2;g.add(b);g.add(M(new THREE.SphereGeometry(.4,24,18),body,.88,.85,0));const sn=M(new THREE.CylinderGeometry(.2,.25,.2,20),dark,1.24,.77,0);sn.rotation.z=Math.PI/2;g.add(sn);for(const z of [-.22,.22]){const ear=M(new THREE.ConeGeometry(.1,.26,10),dark,.78,1.19,z);ear.rotation.z=Math.PI;g.add(ear);eye(g,1.12,.94,z*.9)}for(const x of [-.38,.38])for(const z of [-.26,.26])g.add(M(new THREE.CylinderGeometry(.05,.065,.48,10),dark,x,.34,z));return g}
function sheep(){const g=new THREE.Group(),face=pmat('sheepFace',0x51463d,.9),wool=pmat('wool',0xf4efe4,.97);for(const [x,y,z,s] of [[0,.92,0,.56],[-.42,.92,0,.4],[.42,.92,0,.4],[0,1.22,.08,.4],[-.2,1.12,.38,.3],[.2,1.06,-.38,.3]])g.add(M(new THREE.SphereGeometry(s,20,15),wool,x,y,z));g.add(M(new THREE.SphereGeometry(.31,20,15),face,.82,.98,0));eye(g,1.02,1.07,.18);eye(g,1.02,1.07,-.18);for(const x of [-.3,.3])for(const z of [-.22,.22])g.add(M(new THREE.CylinderGeometry(.045,.055,.52,9),face,x,.36,z));return g}
function horse(){const g=new THREE.Group(),body=pmat('horseBody',0x875336,.88),dark=pmat('horseDark',0x30251f,.93);const b=M(new THREE.CapsuleGeometry(.44,1.22,9,24),body,0,1.28,0);b.rotation.z=Math.PI/2;g.add(b);const neck=M(new THREE.CylinderGeometry(.22,.35,1.12,16),body,.78,1.63,0);neck.rotation.z=-.42;g.add(neck);g.add(M(new THREE.SphereGeometry(.33,22,17),body,1.18,1.98,0));for(const x of [-.5,.5])for(const z of [-.25,.25])g.add(M(new THREE.CylinderGeometry(.05,.075,1.08,12),dark,x,.55,z));for(let i=0;i<6;i++)g.add(M(new THREE.ConeGeometry(.06,.35,8),dark,.68+i*.08,1.75+i*.06,0));eye(g,1.4,2.07,.2);eye(g,1.4,2.07,-.2);return g}
function dog(){const g=new THREE.Group(),body=pmat('dogBody',0xc38b4e,.88),dark=pmat('dogDark',0x563724,.9);const b=M(new THREE.CapsuleGeometry(.25,.65,7,20),body,0,.5,0);b.rotation.z=Math.PI/2;g.add(b);g.add(M(new THREE.SphereGeometry(.28,20,15),body,.62,.67,0));for(const z of [-.19,.19]){const e=M(new THREE.ConeGeometry(.1,.31,10),dark,.55,.95,z);e.rotation.z=Math.PI;g.add(e);eye(g,.82,.74,z*.8)}const tail=beam(new THREE.Vector3(-.55,.62,0),new THREE.Vector3(-.95,.98,.05),.035,dark,8);g.add(tail);return g}
function addAnimal(key,type,x,z,interactiveFlag=false,scale=1){const factory={vaca:cow,galinha:chicken,porco:pig,ovelha:sheep,cavalo:horse,cachorro:dog}[type],g=factory();g.position.set(x,0,z);g.scale.setScalar(scale);g.userData={kind:interactiveFlag?'animal':'decor',id:key,type,baseX:x,baseZ:z,phase:Math.random()*6.2};g.traverse(o=>{if(o.isMesh&&interactiveFlag)o.userData={kind:'animal',id:key}});scene.add(g);animalMeshes.set(key,g);if(interactiveFlag)g.traverse(o=>{if(o.isMesh)interactive.push(o)});return g}
addAnimal('vaca-1','vaca',9.3,.2,true,1.05);addAnimal('galinha-1','galinha',6.1,-.75,true,.95);addAnimal('pig-a','porco',13.1,1.35,false,.9);addAnimal('pig-b','porco',14.2,.35,false,.85);addAnimal('pig-c','porco',13.8,2.15,false,.72);addAnimal('sheep-a','ovelha',12.2,-1.2,false,.92);addAnimal('sheep-b','ovelha',13.6,-1.65,false,.86);addAnimal('sheep-c','ovelha',14.7,-1.0,false,.8);addAnimal('horse-a','cavalo',5.25,-2.05,false,1.0);addAnimal('dog-a','cachorro',-8.7,4.1,false,.9)

function labelSprite(text,color){const c=document.createElement('canvas');c.width=448;c.height=112;const x=c.getContext('2d');x.font='800 35px system-ui';x.textAlign='center';x.textBaseline='middle';x.fillStyle='rgba(255,255,255,.94)';x.beginPath();x.roundRect(16,12,416,88,26);x.fill();x.shadowColor='rgba(0,0,0,.13)';x.shadowBlur=8;x.fillStyle=color;x.fillText(text,224,57);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false}));s.scale.set(3.3,.82,1);return s}
function makePlayer(key){
  const g=new THREE.Group(),cloth=pmat(`cloth${key}`,key==='isa'?0xdc5a8e:0x4f93d5,.78),skin=pmat(`skin${key}`,0xe9b790,.82),hair=pmat(`hair${key}`,0x493027,.94),jeans=pmat(`jeans${key}`,0x35577c,.9),shoeM=pmat(`shoe${key}`,0x342a26,.95)
  const torso=M(new THREE.CapsuleGeometry(.28,.56,8,18),cloth,0,1.08,0);g.add(torso);g.add(M(new THREE.SphereGeometry(.31,26,20),skin,0,1.75,0));g.add(M(new THREE.SphereGeometry(.32,24,16,0,Math.PI*2,0,Math.PI*.58),hair,0,1.82,0))
  const legs=[],arms=[];for(const x of [-.17,.17]){const leg=M(new THREE.CylinderGeometry(.055,.072,.55,12),jeans,x,.49,0);g.add(leg);legs.push(leg);const sh=M(new THREE.SphereGeometry(.095,14,10),shoeM,x,.18,.07);sh.scale.set(1.3,.55,1.6);g.add(sh)}for(const x of [-.38,.38]){const arm=M(new THREE.CylinderGeometry(.045,.055,.52,12),skin,x,1.08,0);arm.rotation.z=x<0?-.18:.18;g.add(arm);arms.push(arm)}
  const label=labelSprite(key==='isa'?'Isa':'Jogador 2',key==='isa'?'#c54b7d':'#3f79b7');label.position.y=2.52;g.add(label);scene.add(g);playerMeshes.set(key,{group:g,label,torso,legs,arms,walk:0,prop:null,actionUntil:0})
}
makePlayer('isa');makePlayer('primo')

function cropMesh(type,ready){const g=new THREE.Group(),green=pmat(`cropG${type}`,0x33783a,.84),deep=pmat(`cropD${type}`,0x235c2e,.9),growth=ready?1:.58;if(type==='milho'){for(const x of [-.45,0,.45]){g.add(M(new THREE.CylinderGeometry(.03,.05,1.35,10),green,x,.73,0));for(const s of [-1,1]){const l=M(new THREE.ConeGeometry(.055,.54,10),deep,x+s*.08,.58,0);l.rotation.z=s*.68;g.add(l)}g.add(M(new THREE.CapsuleGeometry(.075,.21,6,10),pmat(`ear${x}`,0xe7c03e,.75),x+.08,.82,.03))}}else if(type==='tomate'){for(const x of [-.36,.36]){g.add(M(new THREE.CylinderGeometry(.032,.05,.9,10),green,x,.49,0));for(const z of [-.17,.14])g.add(M(new THREE.SphereGeometry(.15,18,14),pmat(`tom${x}${z}`,0xc63c31,.7),x,.61,z))}}else if(type==='morango'){for(const x of [-.42,0,.42]){for(let i=0;i<4;i++){const l=M(new THREE.SphereGeometry(.13,14,10),green,x+(i-1.5)*.06,.32,i%2?-.08:.08);l.scale.set(1.45,.36,1);g.add(l)}const fr=M(new THREE.ConeGeometry(.12,.25,14),pmat(`straw${x}`,0xd84152,.7),x,.21,.14);fr.rotation.z=Math.PI;g.add(fr)}}else{for(const x of [-.4,0,.4]){for(let i=0;i<5;i++){const l=M(new THREE.ConeGeometry(.05,.47,10),green,x,.42,0);l.rotation.z=(i-2)*.27;l.rotation.y=i*Math.PI*.4;g.add(l)}if(ready){const c=M(new THREE.ConeGeometry(.1,.38,14),pmat(`carrot${x}`,0xe17c2a,.72),x,.2,0);c.rotation.z=Math.PI;g.add(c)}}}g.scale.setScalar(growth);return g}
function updatePlots(){for(const p of snapshot?.plots||[]){const g=plotMeshes.get(Number(p.no));if(!g)continue;const old=g.getObjectByName('crop');if(old)g.remove(old);g.children[0].material.color.set(p.wateredAt?0x4b2e20:0x5b3822);if(p.crop){const ready=p.readyAt&&Date.now()>=new Date(p.readyAt).getTime(),c=cropMesh(p.crop,ready);c.name='crop';c.position.y=.28;g.add(c)}}}
function updateAnimals(){for(const a of snapshot?.animals||[]){const g=animalMeshes.get(a.key);if(g)g.userData.ready=!!(a.rewardReadyAt&&Date.now()>=new Date(a.rewardReadyAt).getTime())}}
function updatePlayers(){for(const p of snapshot?.players||[]){const rec=playerMeshes.get(p.key);if(!rec)continue;if(p.key===player&&own.loaded){rec.group.position.x=own.x;rec.group.position.z=own.z}else{rec.group.position.x=num(p.x);rec.group.position.z=num(p.z)}if(rec.label.userData.name!==p.name){rec.group.remove(rec.label);rec.label=labelSprite(p.name||p.key,p.key==='isa'?'#c54b7d':'#3f79b7');rec.label.position.y=2.52;rec.label.userData.name=p.name;rec.group.add(rec.label)}}}
function updateHud(){const isa=playerData('isa')||{},primo=playerData('primo')||{},me=playerData(player)||{};$('isaName').textContent=isa.name||'Isa';$('legendIsa').textContent=isa.name||'Isa';$('primoName').textContent=primo.name||'Jogador 2 🔒';$('isaScore').textContent=isa.score||0;$('primoScore').textContent=primo.score||0;$('sharedScore').textContent=snapshot?.room?.sharedScore||0;$('farmLevel').textContent=`nível ${snapshot?.room?.level||1}`;$('myCoins').textContent=me.coins??50;$('onlineState').textContent='🚧 teste exclusivo da Isa'}
function applySnapshot(s){snapshot=s;updateHud();updatePlayers();updatePlots();updateAnimals()}
async function doAction(action,payload={}){if(!gameToken)return;const s=await rpc('farm_game_action',{p_token:gameToken,p_action:action,p_payload:payload});applySnapshot(s);setConnection(true,'Ao vivo');return s}
async function refresh(){if(!gameToken||pollBusy)return;pollBusy=true;try{const s=await rpc('farm_game_snapshot',{p_token:gameToken});applySnapshot(s);setConnection(true,'Ao vivo')}catch{setConnection(false,'Reconectando…')}finally{pollBusy=false}}

function markMove(){own.lastInput=Date.now();const rec=playerMeshes.get(player);if(rec){rec.group.position.x=own.x;rec.group.position.z=own.z}}
function moveLocal(dx,dz,keepTarget=false){if(!keepTarget)own.target=null;own.x=clamp(own.x+dx,-15.8,15.8);own.z=clamp(own.z+dz,-10.3,10.3);markMove();queueMove()}
function queueMove(force=false){if(!gameToken||own.sending)return;const now=Date.now();if(!force&&now-own.lastSent<175)return;own.lastSent=now;own.sending=true;const sentX=own.x,sentZ=own.z;rpc('farm_game_action',{p_token:gameToken,p_action:'move',p_payload:{x:sentX,z:sentZ}}).then(s=>{snapshot=s;updateHud();updatePlots();updateAnimals();updatePlayers();setConnection(true,'Ao vivo')}).catch(()=>setConnection(false,'Reconectando…')).finally(()=>{own.sending=false;if(Math.hypot(own.x-sentX,own.z-sentZ)>.08)setTimeout(()=>queueMove(true),35)})}

const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let pointerDown=null
function setPointer(e){const r=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;ray.setFromCamera(pointer,camera)}
function interactiveTarget(e){setPointer(e);const hits=ray.intersectObjects(interactive,true);for(const h of hits){let o=h.object;while(o&&o!==scene){if(o.userData?.kind)return o.userData;o=o.parent}}return null}
function groundTarget(e){setPointer(e);const h=ray.intersectObject(ground,false)[0];return h?.point?{x:h.point.x,z:h.point.z}:null}
renderer.domElement.addEventListener('pointerdown',e=>{renderer.domElement.focus({preventScroll:true});pointerDown={x:e.clientX,y:e.clientY}})

function setTool(t){selectedTool=t;document.querySelectorAll('.tool').forEach(b=>b.classList.toggle('active',b.dataset.tool===t))}
document.querySelectorAll('.tool').forEach(b=>b.onclick=()=>setTool(b.dataset.tool))
$('tipClose')?.addEventListener('click',()=>$('tipCard')?.remove())
function targetPos(t){if(t.kind==='plot')return plotMeshes.get(Number(t.id))?.position.clone()||null;if(t.kind==='animal')return animalMeshes.get(t.id)?.position.clone()||null;return null}
function distanceTo(v){return Math.hypot(own.x-v.x,own.z-v.z)}
function approach(v){const d=new THREE.Vector2(own.x-v.x,own.z-v.z);if(d.length()<1.45)return;d.normalize().multiplyScalar(1.28);own.target={x:v.x+d.x,z:v.z+d.y};own.lastInput=Date.now()}
function waitNear(v,max=5200){return new Promise(resolve=>{const st=performance.now();const tick=()=>{if(distanceTo(v)<1.62||performance.now()-st>max){resolve();return}requestAnimationFrame(tick)};tick()})}

function spawnParticle(start,end,color,count=25,size=.055,duration=720,arc=.55){const geo=new THREE.SphereGeometry(size,10,7);for(let i=0;i<count;i++){const material=new THREE.MeshPhysicalMaterial({color,roughness:.25,transparent:true,opacity:.9,clearcoat:.3}),m=new THREE.Mesh(geo,material);m.position.copy(start);scene.add(m);fx.push({m,start:start.clone(),end:end.clone(),born:performance.now()+i*14,duration,arc:arc*(.65+Math.random()*.7),spin:Math.random()*4})}}
function puff(pos,color=0x6a472f){for(let i=0;i<18;i++){const m=M(new THREE.SphereGeometry(.055+Math.random()*.05,10,7),new THREE.MeshStandardMaterial({color,transparent:true,opacity:.68,roughness:1}),pos.x+(Math.random()-.5)*.55,.28+Math.random()*.28,pos.z+(Math.random()-.5)*.55);scene.add(m);fx.push({m,puff:true,born:performance.now(),duration:620,dx:(Math.random()-.5)*.7,dz:(Math.random()-.5)*.7})}}
function floatReward(pos,kind){const m=M(kind==='milk'?new THREE.CylinderGeometry(.14,.17,.42,16):new THREE.SphereGeometry(.18,16,12),new THREE.MeshPhysicalMaterial({color:kind==='milk'?0xf4f0e8:0xfff2c9,roughness:.4,clearcoat:.25}),pos.x,1.25,pos.z);scene.add(m);fx.push({m,float:true,born:performance.now(),duration:1150})}
function makeWateringCan(){const g=new THREE.Group(),metal=phys(0x6d8f95,.28,.52);g.add(M(new THREE.CylinderGeometry(.18,.2,.35,16),metal,0,0,0));const spout=M(new THREE.CylinderGeometry(.035,.06,.48,12),metal,.25,.05,0);spout.rotation.z=-1.05;g.add(spout);const handle=M(new THREE.TorusGeometry(.19,.035,10,20,Math.PI),metal,-.02,.17,0);handle.rotation.z=Math.PI/2;g.add(handle);return g}
function makeBasket(){const g=new THREE.Group(),matB=pmat('basket',0x9f6d39,.85,woodTex);const bowl=M(new THREE.CylinderGeometry(.28,.2,.26,18,1,true),matB,0,0,0);g.add(bowl);const h=M(new THREE.TorusGeometry(.23,.035,10,20,Math.PI),matB,0,.2,0);h.rotation.x=Math.PI/2;g.add(h);return g}
function makeFeedBucket(){const g=new THREE.Group(),m=phys(0x69757a,.3,.52);g.add(M(new THREE.CylinderGeometry(.22,.17,.32,18),m,0,0,0));return g}
function setActionProp(kind,target){const rec=playerMeshes.get(player);if(!rec)return;if(rec.prop){rec.group.remove(rec.prop);rec.prop=null}let prop=null;if(kind==='water')prop=makeWateringCan();else if(kind==='harvest')prop=makeBasket();else if(kind==='feed'||kind==='collect')prop=makeFeedBucket();if(prop){prop.position.set(.5,1.0,.18);prop.rotation.z=-.25;rec.group.add(prop);rec.prop=prop}rec.actionUntil=performance.now()+900;const dx=target.x-own.x,dz=target.z-own.z;if(Math.abs(dx)+Math.abs(dz)>.01)rec.group.rotation.y=Math.atan2(dx,dz)}
async function animateWorldAction(t){const pos=targetPos(t);if(!pos)return;approach(pos);await waitNear(pos);own.target=null;queueMove(true);const start=new THREE.Vector3(own.x,.98,own.z);setActionProp(selectedTool,pos)
  if(t.kind==='plot'){
    if(selectedTool==='plant'){puff(pos,0x624128);spawnParticle(start,new THREE.Vector3(pos.x,.4,pos.z),0x4e301d,13,.042,560,.35);await doAction('plant',{plot:Number(t.id),crop:$('cropSelect').value});toast('🌱 Sementes plantadas!')}
    else if(selectedTool==='water'){spawnParticle(new THREE.Vector3(own.x,.95,own.z),new THREE.Vector3(pos.x,.32,pos.z),0x55b9e8,58,.045,760,.4);await doAction('water',{plot:Number(t.id)});toast('💧 Canteiro regado!')}
    else if(selectedTool==='harvest'){const p=snapshot?.plots?.find(x=>Number(x.no)===Number(t.id)),color={cenoura:0xe98635,milho:0xe6c247,tomate:0xd64d3f,morango:0xdc4f5b}[p?.crop]||0xf0c85a;spawnParticle(new THREE.Vector3(pos.x,.75,pos.z),start,color,24,.08,820,.82);puff(pos,0x63432b);await doAction('harvest',{plot:Number(t.id)});toast('🧺 Colheita feita!')}
    else toast('Para a horta escolha Plantar, Regar ou Colher.')
  }else if(t.kind==='animal'){
    if(selectedTool==='feed'){spawnParticle(start,new THREE.Vector3(pos.x,.65,pos.z),0xd3b24d,28,.05,720,.52);await doAction('feed',{animal:t.id});toast('🌾 Animal alimentado!')}
    else if(selectedTool==='collect'){floatReward(pos,t.id.includes('vaca')?'milk':'egg');await doAction('collect',{animal:t.id});toast('✨ Produto coletado!')}
    else toast('Para os animais escolha Alimentar ou Coletar.')
  }
}
renderer.domElement.addEventListener('pointerup',async e=>{if(pointerDown&&Math.hypot(e.clientX-pointerDown.x,e.clientY-pointerDown.y)>8){pointerDown=null;return}pointerDown=null;if(actionBusy)return;const t=interactiveTarget(e);if(t){actionBusy=true;try{await animateWorldAction(t)}catch(err){toast(err.message||'Ainda não é possível fazer isso.')}finally{actionBusy=false};return}const g=groundTarget(e);if(g){own.target={x:clamp(g.x,-15.8,15.8),z:clamp(g.z,-10.3,10.3)};own.lastInput=Date.now()}})

window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(k)){e.preventDefault();keys.add(k);own.target=null}},true)
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()),true)
window.addEventListener('blur',()=>keys.clear())
document.querySelectorAll('[data-move]').forEach(b=>{const d=b.dataset.move;let timer=null;const step=()=>{if(d==='up')moveLocal(0,-.44);if(d==='down')moveLocal(0,.44);if(d==='left')moveLocal(-.44,0);if(d==='right')moveLocal(.44,0)};b.addEventListener('pointerdown',e=>{e.preventDefault();step();timer=setInterval(step,110)});for(const ev of ['pointerup','pointercancel','pointerleave'])b.addEventListener(ev,()=>{clearInterval(timer);timer=null})})

function editNick(){const overlay=$('guestIdentity'),form=$('guestIdentityForm'),input=$('guestName'),cancel=$('identityCancel'),err=$('guestIdentityError');input.value=playerData(player)?.name||'Isa';err.textContent='';overlay.classList.remove('hidden');setTimeout(()=>input.focus(),50);const close=()=>{overlay.classList.add('hidden');form.onsubmit=null;cancel.onclick=null};cancel.onclick=close;form.onsubmit=async e=>{e.preventDefault();const name=input.value.trim();if(name.length<2){err.textContent='Digite um Nick com pelo menos 2 caracteres.';return}try{await doAction('nick',{name});close();toast('✨ Nick atualizado!')}catch(x){err.textContent=x.message||'Não foi possível salvar.'}}}
$('renameBtn')?.addEventListener('click',editNick)
$('voiceBtn')?.addEventListener('click',()=>toast('🎤 O microfone multiplayer será liberado junto com o segundo jogador.'))
function resize(){const w=stage.clientWidth,h=stage.clientHeight;camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();renderer.setSize(w,h,false)}window.addEventListener('resize',resize);resize()

async function boot(){try{if(player!=='isa')throw new Error('Fazendinha Família Feliz em construção. O segundo jogador será liberado após aprovação.');const data=await rpc('farm_game_bootstrap',{p_player:'isa',p_external_token:null,p_guest_token:null,p_guest_name:null,p_guest_avatar:null},true);gameToken=data.token;snapshot=data.snapshot;const me=playerData('isa');own.x=num(me?.x??-2);own.z=num(me?.z??4);own.loaded=true;applySnapshot(snapshot);$('loadingCard').classList.add('hidden');setConnection(true,'Ao vivo');toast('🌾 Cenário de realismo ampliado carregado');setInterval(refresh,900);refresh();renderer.domElement.focus({preventScroll:true})}catch(e){$('loadingCard').innerHTML=`<strong>Não foi possível entrar</strong><span>${String(e.message||e)}</span>`;setConnection(false,'Acesso necessário')}}

// Atualiza mapas para textura fotográfica se o navegador conseguir carregá-los.
upgradeTexture('https://threejs.org/examples/textures/terrain/grasslight-big.jpg',[groundMat],[10,8])
upgradeTexture('https://threejs.org/examples/textures/hardwood2_diffuse.jpg',[houseTrim,barnDark,barnRoof,fenceMat,bedWood],[4,7])

const clock=new THREE.Clock()
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.035),speed=4.35*dt;let dx=0,dz=0;if(keys.has('w')||keys.has('arrowup'))dz-=speed;if(keys.has('s')||keys.has('arrowdown'))dz+=speed;if(keys.has('a')||keys.has('arrowleft'))dx-=speed;if(keys.has('d')||keys.has('arrowright'))dx+=speed;if(dx||dz)moveLocal(dx,dz);else if(own.target){const vx=own.target.x-own.x,vz=own.target.z-own.z,dist=Math.hypot(vx,vz);if(dist<.07){own.target=null;queueMove(true)}else{const s=Math.min(speed*1.18,dist);moveLocal(vx/dist*s,vz/dist*s,true)}}
  const rec=playerMeshes.get(player);if(rec){const moving=!!(dx||dz||own.target);rec.walk+=dt*(moving?9:2);if(moving){const vx=dx||((own.target?.x??own.x)-own.x),vz=dz||((own.target?.z??own.z)-own.z);if(Math.abs(vx)+Math.abs(vz)>.001)rec.group.rotation.y=Math.atan2(vx,vz);rec.legs[0].rotation.x=Math.sin(rec.walk)*.45;rec.legs[1].rotation.x=-Math.sin(rec.walk)*.45;rec.arms[0].rotation.x=-Math.sin(rec.walk)*.28;rec.arms[1].rotation.x=Math.sin(rec.walk)*.28;rec.group.position.y=Math.abs(Math.sin(rec.walk))*0.025}else{rec.legs.forEach(l=>l.rotation.x*=.82);rec.arms.forEach(a=>a.rotation.x*=.82);rec.group.position.y*=.8}if(rec.actionUntil&&performance.now()>rec.actionUntil&&rec.prop){rec.group.remove(rec.prop);rec.prop=null;rec.actionUntil=0}}
  const t=performance.now()*.001;animalMeshes.forEach(g=>{const ph=g.userData.phase||0;if(g.userData.kind==='decor'){g.rotation.y=Math.sin(t*.2+ph)*.25;g.position.x=g.userData.baseX+Math.sin(t*.17+ph)*.11;g.position.z=g.userData.baseZ+Math.cos(t*.15+ph)*.09}else g.rotation.y=Math.sin(t*.26+ph)*.12;g.position.y=Math.sin(t*1.05+ph)*.008});windBlades.rotation.z-=dt*.42
  const lake=scene.getObjectByName('lakeWater');if(lake){lake.material.opacity=.78+Math.sin(t*.8)*.025;lake.rotation.z=Math.sin(t*.12)*.01}
  const now=performance.now();for(let i=fx.length-1;i>=0;i--){const f=fx[i],elapsed=now-f.born;if(elapsed<0)continue;const q=Math.min(1,elapsed/f.duration);if(f.puff){f.m.position.x+=f.dx*dt;f.m.position.z+=f.dz*dt;f.m.position.y+=.35*dt;f.m.material.opacity=(1-q)*.65;f.m.scale.setScalar(1+q*1.6)}else if(f.float){f.m.position.y+=.85*dt;f.m.rotation.y+=2.2*dt;f.m.scale.setScalar(1+Math.sin(q*Math.PI)*.32)}else{f.m.position.lerpVectors(f.start,f.end,q);f.m.position.y+=Math.sin(q*Math.PI)*f.arc;f.m.rotation.x+=f.spin*dt;if(f.m.material.transparent)f.m.material.opacity=.9*(1-q*.25)}if(q>=1){scene.remove(f.m);f.m.geometry?.dispose?.();f.m.material?.dispose?.();fx.splice(i,1)}}renderer.render(scene,camera)}
animate();boot()
