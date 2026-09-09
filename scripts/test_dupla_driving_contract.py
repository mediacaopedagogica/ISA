from pathlib import Path
import re

html = Path('jogos/dupla-na-pista-teste.html').read_text()
contract = Path('jogos/dupla-na-pista/src/config/driving-contract.js').read_text()

errors = []

def require(text, source, label):
    if text not in source:
        errors.append('MISSING: ' + label)

def forbid(text, source, label):
    if text in source:
        errors.append('FORBIDDEN: ' + label)

# Single coordinate convention.
require("forwardLocal: Object.freeze([0, 0, 1])", contract, 'single +Z vehicle forward')
require("front: Object.freeze([2, 3])", contract, 'front wheel indexes 2,3')
require("rear: Object.freeze([0, 1])", contract, 'rear wheel indexes 0,1')
require("fixedStep: 1 / 60", contract, '60 Hz physics contract')
forbid("new CANNON.Vec3(0,0,-1)", html, 'legacy -Z physicsForward')

# Playable build must actually use the contract and architecture.
require('pista viva v1.2.0', html, 'v1.2.0 build marker')
require("import {EventBus}", html, 'EventBus import')
require("import {RaceDirectorAgent}", html, 'RaceDirectorAgent import')
require("import {DRIVING,assertDrivingContract}", html, 'driving contract import')
require('assertDrivingContract();', html, 'runtime driving-contract assertion')
require('raceDirector.tick(', html, 'RaceDirectorAgent connected to runtime')

# Physical road must be continuous and old box seams removed.
require('new CANNON.Trimesh(verts,idx)', html, 'continuous physical road mesh')
forbid('barrierPhysMat', html, 'segmented physical guard-rail bodies')
forbid('new CANNON.Box(new CANNON.Vec3(11.5', html, 'overlapping 23m base road boxes')
forbid('physicsWorld.step(1/120', html, 'old 120 Hz / high-substep loop')
require('physicsWorld.step(DRIVING.physics.fixedStep,dt,DRIVING.physics.maxSubSteps)', html, 'contract-controlled physics step')

# Driver input / steering.
require('steerIn=(right?1:0)-(left?1:0)', html, 'explicit left/right steering sign')
require('for(const w of DRIVING.wheels.front)rv.setSteeringValue(pv.steer,w)', html, 'steering only on declared front axle')
require('for(const w of DRIVING.wheels.rear)rv.setSteeringValue(0,w)', html, 'rear axle not steered')
require("acc=enabled&&(keys.ArrowUp||keys.w||keys.W)", html, 'W/up acceleration input')
require("down=enabled&&(keys.ArrowDown||keys.s||keys.S)", html, 'S/down brake/reverse input')

# Camera must be behind the exact same physical forward vector before and during race.
require('addScaledVector(heading,-dist)', html, 'start camera behind vehicle forward')
require('addScaledVector(headingWorld,-(isMobile()?DRIVING.camera.mobileDistance:DRIVING.camera.desktopDistance))', html, 'race chase camera behind vehicle forward')
require('target=car.position.clone().addScaledVector(headingWorld,DRIVING.camera.lookAhead)', html, 'camera target ahead of vehicle')

# Remove duplicate legacy collision model and old state-driving sources.
forbid('function resolveVehicleCollision(', html, 'legacy OBB vehicle collision resolver')
forbid('function obbCollision(', html, 'legacy OBB collision engine')
require('applySoftBarrier(i,near)', html, 'non-sticking soft road boundary')
require('modelFix[i]', html, 'per-vehicle visual orientation hook')

# Sanity: triangle winding in physical road should face upward for +Z travel.
require('idx.push(n,nx,n+1,n+1,nx,nx+1)', html, 'upward-facing road triangle winding')

if errors:
    print('\n'.join(errors))
    raise SystemExit(1)

print('Dupla na Pista v1.2.0 driving contract: PASS')
print('Verified: +Z forward, front axle 2/3, chase camera behind, continuous road mesh, 60 Hz step, no legacy OBB/segmented rail physics, runtime agent connected.')
