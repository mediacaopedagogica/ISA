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
    trackSegments: 160,
    physicalHalfWidth: 6.8
  }),
  steering: Object.freeze({
    lowSpeedDegrees: 34,
    highSpeedDegrees: 10,
    highSpeedKmh: 155,
    inputResponse: 8.8,
    centerResponse: 12.5
  }),
  drive: Object.freeze({
    launchForce: 9000,
    maxForce: 30000,
    reverseForce: 8500,
    rearBias: 0.70,
    frontBias: 0.30,
    maxForwardKmh: 205,
    maxReverseKmh: 55
  }),
  camera: Object.freeze({
    desktopDistance: 8.8,
    mobileDistance: 6.9,
    desktopHeight: 3.25,
    mobileHeight: 2.45,
    lookAhead: 10.5
  }),
  barrier: Object.freeze({
    lateralLimit: 5.25,
    recoveryLimit: 18
  })
});

export function assertDrivingContract(){
  const f = DRIVING.coordinateSystem.forwardLocal;
  if(f[0] !== 0 || f[1] !== 0 || f[2] !== 1) throw new Error('Driving contract: forward must be +Z');
  if(DRIVING.wheels.front.join(',') !== '2,3') throw new Error('Driving contract: front axle must be wheel indexes 2,3');
  if(DRIVING.wheels.rear.join(',') !== '0,1') throw new Error('Driving contract: rear axle must be wheel indexes 0,1');
  return true;
}
