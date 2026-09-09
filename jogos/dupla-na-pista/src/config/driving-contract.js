export const DRIVING = Object.freeze({
  coordinateSystem: Object.freeze({
    upAxis: 1,
    rightAxis: 0,
    forwardAxis: 2,
    forwardLocal: Object.freeze([0, 0, 1]),
    label: '+Z is the single source of truth for vehicle forward'
  }),
  wheels: Object.freeze({
    rear: Object.freeze([0, 1]),
    front: Object.freeze([2, 3])
  }),
  physics: Object.freeze({
    fixedStep: 1 / 60,
    maxSubSteps: 3,
    trackSegments: 320,
    physicalHalfWidth: 5.6
  }),
  steering: Object.freeze({
    lowSpeedDegrees: 36,
    highSpeedDegrees: 9,
    highSpeedKmh: 160,
    inputResponse: 9.5,
    centerResponse: 13.5
  }),
  drive: Object.freeze({
    launchForce: 10500,
    maxForce: 33000,
    reverseForce: 9000,
    rearBias: 0.72,
    frontBias: 0.28,
    maxForwardKmh: 210,
    maxReverseKmh: 52
  }),
  camera: Object.freeze({
    desktopDistance: 9.2,
    mobileDistance: 7.2,
    desktopHeight: 3.15,
    mobileHeight: 2.45,
    lookAhead: 11.0,
    smoothing: 7.8
  }),
  barrier: Object.freeze({
    lateralLimit: 5.15,
    recoveryLimit: 20,
    restitution: 0.12,
    tangentialRetention: 0.94
  })
});

export function assertDrivingContract(){
  const f = DRIVING.coordinateSystem.forwardLocal;
  if(f[0] !== 0 || f[1] !== 0 || f[2] !== 1) throw new Error('Driving contract: forward must be +Z');
  if(DRIVING.wheels.front.join(',') !== '2,3') throw new Error('Driving contract: front axle must be wheel indexes 2,3');
  if(DRIVING.wheels.rear.join(',') !== '0,1') throw new Error('Driving contract: rear axle must be wheel indexes 0,1');
  if(DRIVING.physics.fixedStep !== 1/60) throw new Error('Driving contract: physics step must be 60 Hz');
  return true;
}
