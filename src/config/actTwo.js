// Act II timings are relative to the end of the approved 3.6s curtain sequence.
export const actTwoTiming = Object.freeze({
  entryDuration: 1.7,
  entryScale: 4.8,
  darknessDuration: 0.35,
  emergenceDuration: 0.85,
  flyDuration: 10.6,
  convergenceDuration: 0.85,
  burstDuration: 0.22,
  blackHold: 0.4,
});
export const universeConfig = Object.freeze({
  seed: 73421,
  cameraStartSpeed: 25,
  cameraEndSpeed: 200,
  particleCount: 3200,
  particleDepth: 950,
  fogDensity: 0.0022,
  // Procedural, authored hero fly-bys: type, position, scale, Euler rotation.
  heroes: [
    ['network', [-12,5,-48], 2.8, [.1,.35,-.08], {whoosh:false}],
    ['cloud', [17,8,-165], 2.8, [.05,-.18,.12], {whoosh:false}],
    ['neural', [-17,-7,-300], 2.5, [-.08,.1,.12], {whoosh:false}],
    ['compute', [-6,1.8,-78.4], 3.6, [.08,.38,-.08], {closePass:0}],
    ['database', [6,-3.4,-128.4], 3.1, [.12,-.22,.15], {closePass:1}],
    ['network', [-6.3,4,-187], 3.4, [.2,.3,-.1], {closePass:2}],
    ['cube', [6,-3.5,-263.2], 3.8, [.35,.45,.1], {closePass:3}],
    ['code', [-6.2,1,-350.5], 2.8, [.03,.15,-.03], {closePass:4}],
    ['serverless', [6.5,2,-493.1], 3.0, [-.15,.2,.14], {closePass:5}],
  ],
});
export const debugDefaults = Object.freeze({
  cameraSpeed:1, particleDensity:1, streakIntensity:1, orangeEnergy:1, fogDepth:1, cameraDrift:1,
  heroObjectDensity:1, secondaryObjectDensity:1, starDensity:1, midgroundDensity:1,
  closePassCount:6, streakLength:1, fogDensity:1, bloomStrength:1, orangeEnergyIntensity:1,
  showHeroes:true, showSecondary:true, showStars:true, showStreaks:true, showFog:true,
});
// Integrates v(t) = start + (end - start) * (t / duration)^3.
// A closed-form path makes frame drops, debug seeking and replay deterministic.
export function cameraDistance(seconds, instantaneousSpeed) {
  const t = Math.max(0, Math.min(seconds, actTwoTiming.flyDuration));
  const speed = instantaneousSpeed ?? universeConfig.cameraStartSpeed +
    (universeConfig.cameraEndSpeed - universeConfig.cameraStartSpeed) * (t / actTwoTiming.flyDuration) ** 3;
  return universeConfig.cameraStartSpeed * t + (speed - universeConfig.cameraStartSpeed) * t / 4;
}

// Integral of smoothstep velocity: starts at rest and joins Act II at 25 units/s.
export const entryDuration = actTwoTiming.entryDuration + actTwoTiming.darknessDuration;
export const entryTravel = entryDuration * universeConfig.cameraStartSpeed / 2;
export const entryEase = progress => 2 * progress ** 3 - progress ** 4;
