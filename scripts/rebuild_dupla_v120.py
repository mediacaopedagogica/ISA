from pathlib import Path
import re

p = Path('jogos/dupla-na-pista-teste.html')
s = p.read_text()

if 'pista viva v1.2.0' in s:
    print('v1.2.0 already applied')
    raise SystemExit(0)
if 'pista viva v1.1.4' not in s:
    raise SystemExit('expected v1.1.4 marker not found')

s = s.replace(
    'Build privada • pista viva v1.1.4 • movimento livre + colisão suave',
    'Build privada • pista viva v1.2.0 • direção reconstruída + câmera traseira',
    1,
)

old_import = "import * as THREE from 'three';import {OrbitControls} from 'three/addons/controls/OrbitControls.js';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/+esm';"
new_import = old_import + "import {EventBus} from './dupla-na-pista/src/core/event-bus.js';import {RaceDirectorAgent} from './dupla-na-pista/src/agents/race-director-agent.js';import {DRIVING,assertDrivingContract} from './dupla-na-pista/src/config/driving-contract.js';assertDrivingContract();"
if old_import not in s:
    raise SystemExit('import marker not found')
s = s.replace(old_import, new_import, 1)

race_marker = 'let race=RACES[0];'
agent_code = "let race=RACES[0];const eventBus=new EventBus(),raceDirector=new RaceDirectorAgent({eventBus});eventBus.on('world:crowd-event',()=>msg('👏 A torcida vibrou!'));eventBus.on('world:farm-event',()=>msg('🐄 Movimento na fazenda à frente'));eventBus.on('driver:assist-suggestion',()=>msg('↺ Dica: alivie o acelerador, alinhe e use a ré se necessário'));"
if race_marker not in s:
    raise SystemExit('race marker not found')
s = s.replace(race_marker, agent_code, 1)

# Replace the hundreds of overlapping road/rail boxes with one continuous triangle mesh per lane.
physics_pattern = r"const physicsWorld=new CANNON\.World\(\{gravity:new CANNON\.Vec3\(0,-9\.82,0\)\}\);.*?buildPhysicalTrack\(TRACK_A\);buildPhysicalTrack\(TRACK_B\);"
physics_code = """const physicsWorld=new CANNON.World({gravity:new CANNON.Vec3(0,-9.82,0)});physicsWorld.broadphase=new CANNON.SAPBroadphase(physicsWorld);physicsWorld.allowSleep=true;physicsWorld.defaultContactMaterial.friction=.04;physicsWorld.defaultContactMaterial.restitution=.01;const roadPhysMat=new CANNON.Material('road'),chassisPhysMat=new CANNON.Material('chassis');physicsWorld.addContactMaterial(new CANNON.ContactMaterial(chassisPhysMat,roadPhysMat,{friction:.12,restitution:.01,contactEquationStiffness:8e6,contactEquationRelaxation:4}));physicsWorld.addContactMaterial(new CANNON.ContactMaterial(chassisPhysMat,chassisPhysMat,{friction:.06,restitution:.08,contactEquationStiffness:8e6,contactEquationRelaxation:4}));
function buildPhysicalTrack(track){const N=DRIVING.physics.trackSegments,half=DRIVING.physics.physicalHalfWidth,verts=[],idx=[];for(let i=0;i<N;i++){const t=i/N,l=roadPoint(t,track,-half,-.05),r=roadPoint(t,track,half,-.05);verts.push(l.x,l.y,l.z,r.x,r.y,r.z)}for(let i=0;i<N;i++){const n=i*2,nx=((i+1)%N)*2;idx.push(n,nx,n+1,n+1,nx,nx+1)}const body=new CANNON.Body({mass:0,material:roadPhysMat});body.addShape(new CANNON.Trimesh(verts,idx));physicsWorld.addBody(body)}buildPhysicalTrack(TRACK_A);buildPhysicalTrack(TRACK_B);"""
s, n = re.subn(physics_pattern, physics_code, s, count=1, flags=re.S)
if n != 1:
    raise SystemExit(f'physics/track rebuild failed: {n}')

if 'let vehiclePhysics=[];const modelFix=new THREE.Quaternion();' not in s:
    raise SystemExit('modelFix marker not found')
s = s.replace(
    'let vehiclePhysics=[];const modelFix=new THREE.Quaternion();',
    "let vehiclePhysics=[];const visualYawOffset=[0,0],modelFix=visualYawOffset.map(a=>new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),a));",
    1,
)

vehicle_pattern = r"function makePhysicsVehicle\(i\)\{.*?\}vehiclePhysics=\[makePhysicsVehicle\(0\),makePhysicsVehicle\(1\)\];"
vehicle_code = """function makePhysicsVehicle(i){const t=i?.022:.012,f=frameAt(t),q=roadPoint(t,tracks[i],0,.035),yaw=Math.atan2(f.tan.x,f.tan.z),body=new CANNON.Body({mass:1780,material:chassisPhysMat,linearDamping:.004,angularDamping:.16,allowSleep:false});body.addShape(new CANNON.Box(new CANNON.Vec3(1.02,.40,2.34)),new CANNON.Vec3(0,.18,0));body.position.set(q.x,q.y+1.08,q.z);body.quaternion.setFromEuler(0,yaw,0,'XYZ');const rv=new CANNON.RaycastVehicle({chassisBody:body,indexRightAxis:DRIVING.coordinateSystem.rightAxis,indexForwardAxis:DRIVING.coordinateSystem.forwardAxis,indexUpAxis:DRIVING.coordinateSystem.upAxis}),base={radius:.43,directionLocal:new CANNON.Vec3(0,-1,0),suspensionStiffness:38,suspensionRestLength:.34,frictionSlip:2.9,dampingRelaxation:2.4,dampingCompression:4.2,maxSuspensionForce:100000,rollInfluence:.045,axleLocal:new CANNON.Vec3(-1,0,0),maxSuspensionTravel:.30,customSlidingRotationalSpeed:-28,useCustomSlidingRotationalSpeed:true};for(const pt of [[-.9,0,-1.48],[.9,0,-1.48],[-.9,0,1.48],[.9,0,1.48]])rv.addWheel({...base,chassisConnectionPointLocal:new CANNON.Vec3(...pt)});rv.addToWorld(physicsWorld);return{body,vehicle:rv,steer:0,throttleHold:0}}vehiclePhysics=[makePhysicsVehicle(0),makePhysicsVehicle(1)];"""
s, n = re.subn(vehicle_pattern, vehicle_code, s, count=1, flags=re.S)
if n != 1:
    raise SystemExit(f'vehicle rebuild failed: {n}')

old_forward = "function physicsForward(pv){const v=new CANNON.Vec3(0,0,-1);pv.body.quaternion.vmult(v,v);return v}"
new_forward = "function physicsForward(pv){const a=DRIVING.coordinateSystem.forwardLocal,v=new CANNON.Vec3(a[0],a[1],a[2]);pv.body.quaternion.vmult(v,v);return v}"
if old_forward not in s:
    raise SystemExit('old forward marker not found')
s = s.replace(old_forward, new_forward, 1)

state_pattern = r"states=\[0,1\]\.map\(i=>\(\{t:i\?\.022:\.012,lat:0,speed:0,fuel:78,coins:240,motor:92,tires:88,susp:85,lap:1,turbo:72,totalKm:0,.*?\}\)\);"
state_code = "states=[0,1].map(i=>({t:i?.022:.012,lat:0,speed:0,fuel:78,coins:240,motor:92,tires:88,susp:85,lap:1,turbo:72,totalKm:0,collisionCooldown:0,prevT:i?.022:.012,prevLapT:i?.022:.012,stuckSeconds:0}));"
s, n = re.subn(state_pattern, state_code, s, count=1, flags=re.S)
if n != 1:
    raise SystemExit(f'state cleanup failed: {n}')

input_pattern = r"function setRaycastInput\(i,enabled,dt=\.016\)\{.*?\}\n\nfunction zoneAt"
input_code = """function setRaycastInput(i,enabled,dt=.016){const pv=vehiclePhysics[i],rv=pv.vehicle,b=pv.body,s=states[i],fw=physicsForward(pv),signed=b.velocity.dot(fw),kmh=Math.abs(signed)*3.6,left=enabled&&(keys.ArrowLeft||keys.a||keys.A),right=enabled&&(keys.ArrowRight||keys.d||keys.D),acc=enabled&&(keys.ArrowUp||keys.w||keys.W),down=enabled&&(keys.ArrowDown||keys.s||keys.S),steerIn=(right?1:0)-(left?1:0),speedRatio=THREE.MathUtils.clamp(kmh/DRIVING.steering.highSpeedKmh,0,1),maxSteer=THREE.MathUtils.degToRad(THREE.MathUtils.lerp(DRIVING.steering.lowSpeedDegrees,DRIVING.steering.highSpeedDegrees,speedRatio)),target=steerIn*maxSteer;pv.steer=THREE.MathUtils.lerp(pv.steer,target,1-Math.exp(-(steerIn?DRIVING.steering.inputResponse:DRIVING.steering.centerResponse)*dt));for(const w of DRIVING.wheels.front)rv.setSteeringValue(pv.steer,w);for(const w of DRIVING.wheels.rear)rv.setSteeringValue(0,w);pv.throttleHold=acc?Math.min(2.0,pv.throttleHold+dt*2.25):Math.max(0,pv.throttleHold-dt*3.8);const ramp=THREE.MathUtils.clamp(pv.throttleHold/1.35,0,1),ease=ramp*ramp*(3-2*ramp),motorHealth=Math.max(.4,s.motor/100);let engine=0,brake=0;if(!enabled){brake=70;pv.throttleHold=0}else if(acc){if(signed<-.5){brake=600}else{const force=THREE.MathUtils.lerp(DRIVING.drive.launchForce,DRIVING.drive.maxForce,ease),speedFade=kmh<DRIVING.drive.maxForwardKmh?1:Math.max(.04,1-(kmh-DRIVING.drive.maxForwardKmh)/30);engine=-force*motorHealth*speedFade}}else if(down){pv.throttleHold=0;if(signed>.5){brake=820}else{const speedFade=kmh<DRIVING.drive.maxReverseKmh?1:Math.max(.04,1-(kmh-DRIVING.drive.maxReverseKmh)/15);engine=DRIVING.drive.reverseForce*motorHealth*speedFade}}else{brake=0}const onRoad=Math.abs(s.lat)<4.5,grip=(onRoad?2.9:1.65)*THREE.MathUtils.clamp(s.tires/100,.58,1);for(let w=0;w<4;w++){rv.setBrake(brake,w);rv.wheelInfos[w].frictionSlip=grip}const rearEach=engine*DRIVING.drive.rearBias/2,frontEach=engine*DRIVING.drive.frontBias/2;for(const w of DRIVING.wheels.rear)rv.applyEngineForce(rearEach,w);for(const w of DRIVING.wheels.front)rv.applyEngineForce(frontEach,w)}

function zoneAt"""
s, n = re.subn(input_pattern, input_code, s, count=1, flags=re.S)
if n != 1:
    raise SystemExit(f'input rebuild failed: {n}')

if 'cars[i].quaternion.copy(q).multiply(modelFix);' not in s:
    raise SystemExit('visual orientation marker not found')
s = s.replace('cars[i].quaternion.copy(q).multiply(modelFix);', 'cars[i].quaternion.copy(q).multiply(modelFix[i]);', 1)

reset_pattern = r"Object\.assign\(states\[i\],\{t,lat:0,x:q\.x,z:q\.z,yaw:.*?,prevLapT:t\}\);"
s, n = re.subn(reset_pattern, "Object.assign(states[i],{t,lat:0,speed:0,lap:1,totalKm:0,turbo:72,collisionCooldown:0,prevT:t,prevLapT:t,stuckSeconds:0});", s, count=1, flags=re.S)
if n != 1:
    raise SystemExit(f'reset cleanup failed: {n}')

follow_pattern = r"function followStart\(\)\{.*?\}"
follow_code = """function followStart(){orientCar(active);const car=cars[active],pv=vehiclePhysics[active],fw=physicsForward(pv),heading=new THREE.Vector3(fw.x,0,fw.z).normalize(),dist=isMobile()?DRIVING.camera.mobileDistance:DRIVING.camera.desktopDistance,height=isMobile()?DRIVING.camera.mobileHeight:DRIVING.camera.desktopHeight;camera.position.copy(car.position).addScaledVector(heading,-dist).add(new THREE.Vector3(0,height,0));orbit.enabled=true;orbit.target.copy(car.position).addScaledVector(heading,DRIVING.camera.lookAhead*.55).add(new THREE.Vector3(0,.85,0));orbit.update()}"""
s, n = re.subn(follow_pattern, follow_code, s, count=1, flags=re.S)
if n != 1:
    raise SystemExit(f'followStart rebuild failed: {n}')

legacy_pattern = r"function carAxes\(s\)\{.*?\}function nearestRoadState"
s, n = re.subn(legacy_pattern, 'function nearestRoadState', s, count=1, flags=re.S)
if n != 1:
    raise SystemExit(f'legacy collision cleanup failed: {n}')

nearest_end = "return{t:bestT,lat:rel.dot(bestF.side),f:bestF,q:bestQ,dist:Math.sqrt(bestD)}}"
soft = """return{t:bestT,lat:rel.dot(bestF.side),f:bestF,q:bestQ,dist:Math.sqrt(bestD)}}function applySoftBarrier(i,near){const s=states[i],pv=vehiclePhysics[i],pen=Math.abs(s.lat)-DRIVING.barrier.lateralLimit;if(pen<=0)return;const sg=Math.sign(s.lat)||1,out=new CANNON.Vec3(near.f.side.x*sg,0,near.f.side.z*sg),outSpeed=pv.body.velocity.dot(out);if(outSpeed>0){const normalRemove=outSpeed*(1+DRIVING.barrier.restitution);pv.body.velocity.x-=out.x*normalRemove;pv.body.velocity.z-=out.z*normalRemove}const inward=Math.min(.10,.018+pen*.12);pv.body.position.x-=out.x*inward;pv.body.position.z-=out.z*inward;pv.body.angularVelocity.y*=.88}"""
if nearest_end not in s:
    raise SystemExit('nearestRoadState marker not found')
s = s.replace(nearest_end, soft, 1)

if 'physicsWorld.step(1/120,dt,8);' not in s:
    raise SystemExit('old 120Hz step not found')
s = s.replace('physicsWorld.step(1/120,dt,8);', 'physicsWorld.step(DRIVING.physics.fixedStep,dt,DRIVING.physics.maxSubSteps);', 1)

loop_marker = "for(let i=0;i<2;i++){const s=states[i],pv=vehiclePhysics[i],near=i===0?near0:near1;if(pv.body.position.y<near.q.y-2.2||Math.abs(s.lat)>18){"
if loop_marker not in s:
    raise SystemExit('recovery marker not found')
s = s.replace(loop_marker, "for(let i=0;i<2;i++){const s=states[i],pv=vehiclePhysics[i],near=i===0?near0:near1;applySoftBarrier(i,near);if(pv.body.position.y<near.q.y-2.2||Math.abs(s.lat)>DRIVING.barrier.recoveryLimit){", 1)

old_cam = "desired=car.position.clone().addScaledVector(headingWorld,isMobile()?-6.9:-8.8).add(new THREE.Vector3(0,isMobile()?2.5:3.3,0));target=car.position.clone().addScaledVector(headingWorld,isMobile()?8.5:10.5).add(new THREE.Vector3(0,.85,0))"
if old_cam not in s:
    raise SystemExit('camera marker not found')
s = s.replace(old_cam, "desired=car.position.clone().addScaledVector(headingWorld,-(isMobile()?DRIVING.camera.mobileDistance:DRIVING.camera.desktopDistance)).add(new THREE.Vector3(0,isMobile()?DRIVING.camera.mobileHeight:DRIVING.camera.desktopHeight,0));target=car.position.clone().addScaledVector(headingWorld,DRIVING.camera.lookAhead).add(new THREE.Vector3(0,.85,0))", 1)
s = s.replace("camera.position.lerp(desired,1-Math.pow(.0017,dt));", "camera.position.lerp(desired,1-Math.exp(-DRIVING.camera.smoothing*dt));", 1)

agent_marker = 'const slip=pv.vehicle.sliding?1:.05;let desired,target;'
if agent_marker not in s:
    raise SystemExit('agent tick marker not found')
s = s.replace(agent_marker, "const slip=pv.vehicle.sliding?1:.05,throttlePressed=!!(keys.ArrowUp||keys.w||keys.W);s.stuckSeconds=throttlePressed&&Math.abs(s.speed)<.8?(s.stuckSeconds||0)+dt:0;raceDirector.tick({race:{running:true,zone:zoneAt(s.t)},vehicle:{speedKmh:Math.abs(s.speed)*3.6,stuckSeconds:s.stuckSeconds}},dt);let desired,target;", 1)

required = [
    'pista viva v1.2.0',
    'CANNON.Trimesh',
    'steerIn=(right?1:0)-(left?1:0)',
    'for(const w of DRIVING.wheels.front)rv.setSteeringValue',
    'addScaledVector(heading,-dist)',
    'addScaledVector(headingWorld,-(isMobile()?',
    'physicsWorld.step(DRIVING.physics.fixedStep',
    'raceDirector.tick',
    'modelFix[i]',
]
missing = [x for x in required if x not in s]
if missing:
    raise SystemExit('post-patch missing: ' + ', '.join(missing))

forbidden = [
    'new CANNON.Vec3(0,0,-1)',
    'barrierPhysMat',
    'new CANNON.Box(new CANNON.Vec3(11.5',
    'resolveVehicleCollision(',
    'physicsWorld.step(1/120',
]
bad = [x for x in forbidden if x in s]
if bad:
    raise SystemExit('post-patch forbidden: ' + ', '.join(bad))

p.write_text(s)
print('Dupla v1.2.0 audited rebuild applied successfully')
