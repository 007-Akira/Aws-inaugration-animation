// Act II timings are relative to the end of the approved 3.6s curtain sequence.
export const actTwoTiming = Object.freeze({
  entryDuration: 1.7,
  entryScale: 4.8,
  darknessDuration: 0.35,
  emergenceDuration: 0.85,
  flyDuration: 6.6,
  convergenceDuration: 0.85,
  burstDuration: 0.22,
  blackHold: 0.4,
});
export const universeConfig = Object.freeze({
  seed: 73421,
  cameraStartSpeed: 25,
  cameraEndSpeed: 200,
  particleCount: 2600,
  particleDepth: 650,
  fogDensity: 0.007,
  // Procedural, authored hero fly-bys: type, position, scale, Euler rotation.
  heroes: [
    ['network', [-10, 4.5, -48], 3.5, [0.10, 0.35, -0.08]],
    ['database', [-9, -0.6, -94], 2.1, [0.12, 0.05, -0.24]],
    ['cloud', [12, 6, -145], 2.5, [0.05, -0.18, 0.12]],
    ['network', [-14, 0, -202], 2.7, [-0.08, 0.1, 0.12]],
    ['code', [13, 3, -267], 3.5, [0.05, -0.4, -0.1]],
    ['cube', [-10, -6, -333], 3.0, [0.35, 0.45, 0.1]],
    ['compute', [10, 0, -408], 4.8, [-0.1, -0.45, 0.06]],
    ['architecture', [15, 8, -450], 3.5, [-0.15, -0.2, 0.14]],
  ],
});
export const debugDefaults = Object.freeze({
  cameraSpeed: 1, particleDensity: 1, streakIntensity: 1,
  orangeEnergy: 1, fogDepth: 1, cameraDrift: 1,
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
