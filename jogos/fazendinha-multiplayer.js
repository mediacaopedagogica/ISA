import { CONFIG } from '../config.js'
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js'

const $=id=>document.getElementById(id)
const params=new URLSearchParams(location.search)
const player=(params.get('player')||'').toLowerCase()==='primo'?'primo':'isa'
const externalToken=new URLSearchParams(location.hash.replace(/^#/, '')).get('family')||''
const other=player==='isa'?'primo':'isa'
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

const stage=$('farmStage')
const scene=new THREE.Scene()
scene.background=new THREE.Color(0xbfe8ff)
scene.fog=new THREE.Fog(0xbfe8ff,28,48)
const camera=new THREE.PerspectiveCamera(43,1,.1,100)
camera.position.set(14,15,18);camera.lookAt(0,0,0)
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'})
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02
stage.appendChild(renderer.domElement)

scene.add(new THREE.HemisphereLight(0xdff5ff,0x60734a,1.9))
const sun=new THREE.DirectionalLight(0xfff4d0,2.35);sun.position.set(-10,18,8);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);sun.shadow.camera.left=-18;sun.shadow.camera.right=18;sun.shadow.camera.top=16;sun.shadow.camera.bottom=-16;scene.add(sun)

function noiseTexture(base,speck){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle=base;x.fillRect(0,0,256,256);for(let i=0;i<3600;i++){const a=Math.random()*.18+.04;x.fillStyle=`rgba(${speck},${a})`;x.fillRect(Math.random()*256,Math.random()*256,1+Math.random()*2,1+Math.random()*2)}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(9,7);t.colorSpace=THREE.SRGBColorSpace;return t}
const grassTex=noiseTexture('#7fb865','55,93,48')
const ground=new THREE.Mesh(new THREE.PlaneGeometry(28,20),new THREE.MeshStandardMaterial({map:grassTex,roughness:.96}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground)

const pathMat=new THREE.MeshStandardMaterial({color:0xc7a375,roughness:1})
const path1=new THREE.Mesh(new THREE.BoxGeometry(3.2,.06,20),pathMat);path1.position.set(1.8,.035,0);path1.receiveShadow=true;scene.add(path1)
const path2=new THREE.Mesh(new THREE.BoxGeometry(28,.06,2.2),pathMat);path2.position.set(0,.04,4.6);path2.receiveShadow=true;scene.add(path2)

function box(w,h,d,color,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.82}));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;scene.add(m);return m}
function addBarn(){const g=new THREE.Group();const body=new THREE.Mesh(new THREE.BoxGeometry(5,3.6,4),new THREE.MeshStandardMaterial({color:0xa64e3d,roughness:.8}));body.position.y=1.8;body.castShadow=body.receiveShadow=true;g.add(body);const roof=new THREE.Mesh(new THREE.ConeGeometry(3.65,2.2,4),new THREE.MeshStandardMaterial({color:0x5f342c,roughness:.88}));roof.rotation.y=Math.PI/4;roof.position.y=4.25;roof.scale.z=.86;roof.castShadow=true;g.add(roof);const door=new THREE.Mesh(new THREE.BoxGeometry(1.7,2.5,.12),new THREE.MeshStandardMaterial({color:0x5f3628}));door.position.set(0,1.25,2.06);g.add(door);g.position.set(7.8,0,-4.7);scene.add(g)}
function addTree(x,z,s=1){const g=new THREE.Group();const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.24,.32,2.4,9),new THREE.MeshStandardMaterial({color:0x7b4e2d,roughness:1}));trunk.position.y=1.2;trunk.castShadow=true;g.add(trunk);const leafMat=new THREE.MeshStandardMaterial({color:0x4f8f50,roughness:.92});for(const [dx,dy,dz,sc] of [[0,2.8,0,1.25],[-.65,2.55,.15,.9],[.65,2.55,.1,.95],[0,2.5,-.6,.9]]){const q=new THREE.Mesh(new THREE.SphereGeometry(sc,12,9),leafMat);q.position.set(dx,dy,dz);q.castShadow=true;g.add(q)}g.position.set(x,0,z);g.scale.setScalar(s);scene.add(g)}
function addFence(){const mat=new THREE.MeshStandardMaterial({color:0xb58b62,roughness:1});const post=(x,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(.18,1.15,.18),mat);m.position.set(x,.57,z);m.castShadow=true;scene.add(m)};for(let x=3.6;x<=11.8;x+=1.6){post(x,2.6);post(x,-2.6)};for(let z=-2.6;z<=2.6;z+=1.3){post(3.6,z);post(11.8,z)};for(const z of [-2.6,2.6]){const r=box(8.2,.12,.12,0xb58b62,7.7,.65,z);r.castShadow=true}for(const x of [3.6,11.8]){const r=box(.12,.12,5.2,0xb58b62,x,.65,0);r.castShadow=true}}
function addLake(){const lake=new THREE.Mesh(new THREE.CircleGeometry(2.5,48),new THREE.MeshPhysicalMaterial({color:0x68bfe6,transparent:true,opacity:.83,roughness:.18,metalness:.02}));lake.rotation.x=-Math.PI/2;lake.position.set(-9,.035,-5);scene.add(lake);const rim=new THREE.Mesh(new THREE.RingGeometry(2.45,2.85,48),new THREE.MeshStandardMaterial({color:0x9c815e,roughness:1}));rim.rotation.x=-Math.PI/2;rim.position.set(-9,.025,-5);scene.add(rim)}
addBarn();addFence();addLake();[[-11,6,1.1],[-7,7,.9],[11,6,.95],[-12,-1,.85],[-5,-7,1],[-1,-7,.8],[11,-7,1]].forEach(v=>addTree(...v))

const soilTexture=noiseTexture('#845434','86,50,31')
const plotPositions=[[-7,1.6],[-4.6,1.6],[-7,-.6],[-4.6,-.6],[-7,-2.8],[-4.6,-2.8],[-7,-5],[-4.6,-5]]
function makePlot(no,[x,z]){const g=new THREE.Group();g.userData={kind:'plot',id:no};const base=new THREE.Mesh(new THREE.BoxGeometry(1.95,.23,1.55),new THREE.MeshStandardMaterial({map:soilTexture.clone(),color:0xffffff,roughness:1}));base.position.y=.12;base.receiveShadow=true;base.userData=g.userData;g.add(base);for(let i=-1;i<=1;i++){const ridge=new THREE.Mesh(new THREE.BoxGeometry(1.65,.07,.13),new THREE.MeshStandardMaterial({color:0x6f452b,roughness:1}));ridge.position.set(0,.27,i*.38);g.add(ridge)}g.position.set(x,0,z);scene.add(g);plotMeshes.set(no,g);interactive.push(base)}
plotPositions.forEach((p,i)=>makePlot(i+1,p))

function chicken(){const g=new THREE.Group();const white=new THREE.MeshStandardMaterial({color:0xf7f2e6,roughness:.85});const body=new THREE.Mesh(new THREE.SphereGeometry(.46,18,12),white);body.scale.set(1.2,.9,1);body.position.y=.58;body.castShadow=true;g.add(body);const head=new THREE.Mesh(new THREE.SphereGeometry(.28,16,12),white);head.position.set(.38,.9,0);head.castShadow=true;g.add(head);const beak=new THREE.Mesh(new THREE.ConeGeometry(.1,.28,8),new THREE.MeshStandardMaterial({color:0xf2a33c}));beak.rotation.z=-Math.PI/2;beak.position.set(.68,.89,0);g.add(beak);return g}
function cow(){const g=new THREE.Group();const mat=new THREE.MeshStandardMaterial({color:0xf2eee7,roughness:.86});const body=new THREE.Mesh(new THREE.BoxGeometry(1.35,.75,.7),mat);body.position.y=.9;body.castShadow=true;g.add(body);const head=new THREE.Mesh(new THREE.BoxGeometry(.55,.55,.58),mat);head.position.set(.9,.95,0);head.castShadow=true;g.add(head);const spotMat=new THREE.MeshStandardMaterial({color:0x4d3a31});const spot=new THREE.Mesh(new THREE.BoxGeometry(.35,.77,.72),spotMat);spot.position.set(-.2,.92,0);g.add(spot);for(const x of [-.42,.42])for(const z of [-.23,.23]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.08,.1,.65,8),spotMat);leg.position.set(x,.37,z);g.add(leg)}return g}
function makeAnimal(key,type,x,z){const g=type==='vaca'?cow():chicken();g.position.set(x,0,z);g.userData={kind:'animal',id:key};g.traverse(o=>{if(o.isMesh){o.userData=g.userData;o.castShadow=true}});scene.add(g);animalMeshes.set(key,g);g.traverse(o=>{if(o.isMesh)interactive.push(o)})}
makeAnimal('galinha-1','galinha',6,-.8);makeAnimal('vaca-1','vaca',8.7,.7)

function labelSprite(text,color){const c=document.createElement('canvas');c.width=256;c.height=80;const x=c.getContext('2d');x.font='900 30px system-ui';x.textAlign='center';x.textBaseline='middle';x.fillStyle='rgba(255,255,255,.92)';x.beginPath();x.roundRect(8,8,240,64,20);x.fill();x.fillStyle=color;x.fillText(text,128,40);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false}));s.scale.set(2.6,.8,1);return s}
function makePlayer(key){const color=key==='isa'?0xf27fae:0x69a9e8;const g=new THREE.Group();const body=new THREE.Mesh(new THREE.CapsuleGeometry(.28,.65,6,12),new THREE.MeshStandardMaterial({color,roughness:.7}));body.position.y=.78;body.castShadow=true;g.add(body);const head=new THREE.Mesh(new THREE.SphereGeometry(.25,18,14),new THREE.MeshStandardMaterial({color:0xf1c7a7,roughness:.8}));head.position.y=1.45;head.castShadow=true;g.add(head);const label=labelSprite(key==='isa'?'Isa':'Primo',key==='isa'?'#c54b7d':'#3f79b7');label.position.y=2.15;g.add(label);scene.add(g);playerMeshes.set(key,{group:g,label})}
makePlayer('isa');makePlayer('primo')

function cropMesh(type,ready){const g=new THREE.Group(),green=new THREE.MeshStandardMaterial({color:0x4c9a50,roughness:.85});const scale=ready?1:.55;if(type==='milho'){for(const x of [-.38,0,.38]){const stem=new THREE.Mesh(new THREE.CylinderGeometry(.045,.06,1.2,8),green);stem.position.set(x,.65,0);g.add(stem);const ear=new THREE.Mesh(new THREE.CapsuleGeometry(.08,.22,4,8),new THREE.MeshStandardMaterial({color:0xf0cc48}));ear.position.set(x+.08,.7,0);ear.rotation.z=.35;g.add(ear)}}else if(type==='tomate'){for(const x of [-.35,.35]){const stem=new THREE.Mesh(new THREE.CylinderGeometry(.04,.06,.75,7),green);stem.position.set(x,.42,0);g.add(stem);const fruit=new THREE.Mesh(new THREE.SphereGeometry(.15,12,10),new THREE.MeshStandardMaterial({color:0xd95242}));fruit.position.set(x,.55,.14);g.add(fruit)}}else if(type==='morango'){for(const x of [-.38,0,.38]){const leaf=new THREE.Mesh(new THREE.SphereGeometry(.18,9,7),green);leaf.scale.set(1.4,.45,1.2);leaf.position.set(x,.26,0);g.add(leaf);const fruit=new THREE.Mesh(new THREE.ConeGeometry(.12,.25,10),new THREE.MeshStandardMaterial({color:0xe44f5e}));fruit.position.set(x,.18,.12);fruit.rotation.z=Math.PI;g.add(fruit)}}else{for(const x of [-.35,0,.35]){const leaf=new THREE.Mesh(new THREE.ConeGeometry(.11,.45,8),green);leaf.position.set(x,.36,0);g.add(leaf);if(ready){const carrot=new THREE.Mesh(new THREE.ConeGeometry(.1,.35,10),new THREE.MeshStandardMaterial({color:0xef8b36}));carrot.position.set(x,.19,0);carrot.rotation.z=Math.PI;g.add(carrot)}}}g.scale.setScalar(scale);return g}
function updatePlots(){for(const p of snapshot?.plots||[]){const g=plotMeshes.get(Number(p.no));if(!g)continue;const old=g.getObjectByName('crop');if(old)g.remove(old);const base=g.children[0];base.material.color.set(p.wateredAt?0x76503a:0xffffff);if(p.crop){const ready=p.readyAt&&Date.now()>=new Date(p.readyAt).getTime();const c=cropMesh(p.crop,ready);c.name='crop';c.position.y=.24;g.add(c)}}}
function updateAnimals(){for(const a of snapshot?.animals||[]){const g=animalMeshes.get(a.key);if(!g)continue;const ready=a.rewardReadyAt&&Date.now()>=new Date(a.rewardReadyAt).getTime();g.scale.setScalar(ready?1.08:1);g.userData.ready=!!ready}}
function updatePlayers(){for(const p of snapshot?.players||[]){const rec=playerMeshes.get(p.key);if(!rec)continue;rec.group.position.x=num(p.x);rec.group.position.z=num(p.z);if(rec.label.userData.name!==p.name){rec.group.remove(rec.label);rec.label=labelSprite(p.name||p.key,p.key==='isa'?'#c54b7d':'#3f79b7');rec.label.position.y=2.15;rec.label.userData.name=p.name;rec.group.add(rec.label)}}}
function updateHud(){const isa=playerData('isa')||{},primo=playerData('primo')||{},me=playerData(player)||{};$('isaName').textContent=isa.name||'Isa';$('primoName').textContent=primo.name||'Primo';$('isaScore').textContent=isa.score||0;$('primoScore').textContent=primo.score||0;$('sharedScore').textContent=snapshot?.room?.sharedScore||0;$('farmLevel').textContent=`nível ${snapshot?.room?.level||1}`;$('myCoins').textContent=me.coins??50;$('onlineState').textContent=isa.online&&primo.online?'🟢 os dois online':isa.online?'💗 Isa online':primo.online?'💙 Primo online':'aguardando os dois…';$('renameBtn').classList.toggle('hidden',player!=='primo')}
function applySnapshot(s){snapshot=s;updateHud();updatePlayers();updatePlots();updateAnimals()}

async function doAction(action,payload={}){if(!gameToken)return;try{const s=await rpc('farm_game_action',{p_token:gameToken,p_action:action,p_payload:payload});applySnapshot(s);setConnection(true,'Ao vivo')}catch(e){toast(e.message);setConnection(false,'Reconectando…')}}
async function refresh(){if(!gameToken||pollBusy)return;pollBusy=true;try{const s=await rpc('farm_game_snapshot',{p_token:gameToken});applySnapshot(s);setConnection(true,'Ao vivo')}catch(e){setConnection(false,'Sem conexão')}finally{pollBusy=false}}

function setTool(tool){selectedTool=tool;document.querySelectorAll('.tool').forEach(b=>b.classList.toggle('active',b.dataset.tool===tool))}
document.querySelectorAll('.tool').forEach(b=>b.onclick=()=>setTool(b.dataset.tool))
$('tipClose').onclick=()=>$('tipCard').remove()
$('renameBtn').onclick=async()=>{const current=playerData('primo')?.name||'Primo';const name=prompt('Como ele quer aparecer na fazendinha?',current);if(name?.trim())await doAction('rename',{name:name.trim()})}

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

async function boot(){try{if(player==='primo'&&!externalToken)throw new Error('Abra a fazendinha pelo acesso da Paloma neste celular.');const data=await rpc('farm_game_bootstrap',{p_player:player,p_external_token:player==='primo'?externalToken:null},player==='isa');gameToken=data.token;applySnapshot(data.snapshot);$('loadingCard').classList.add('hidden');setConnection(true,'Ao vivo');toast(player==='isa'?'Isa entrou na fazenda 💗':'Jogador 2 entrou na fazenda 💙');setInterval(refresh,650);setInterval(pollSignals,650);refresh();pollSignals()}catch(e){$('loadingCard').innerHTML=`<strong>Não foi possível entrar</strong><span>${String(e.message||e)}</span>`;setConnection(false,'Acesso necessário')}}

const clock=new THREE.Clock()
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04),speed=3.1*dt;if(keys.has('w')||keys.has('arrowup'))move(0,-speed);if(keys.has('s')||keys.has('arrowdown'))move(0,speed);if(keys.has('a')||keys.has('arrowleft'))move(-speed,0);if(keys.has('d')||keys.has('arrowright'))move(speed,0);const t=performance.now()*.001;animalMeshes.forEach((g,i)=>{g.rotation.y=Math.sin(t*.55+(i==='vaca-1'?1:0))*.18;g.position.y=Math.sin(t*1.8+(i==='vaca-1'?1:0))*.025});renderer.render(scene,camera)}
animate();boot()
