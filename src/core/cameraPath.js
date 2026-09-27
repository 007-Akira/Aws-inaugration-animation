import { actTwoTiming, cameraDistance, universeConfig } from '../config/actTwo';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const smooth = value => { const t = clamp(value, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };

// Deterministic lateral avoidance for the authored close passes, not a physics
// integrator. Sampling any time directly gives the same route on replay/seek.
// Coordinates are relative to the end of camera entry (universe adds entryTravel).
export function sampleCameraPath(time, tuning = {}, out = {}) {
  const t = clamp(time, 0, actTwoTiming.flyDuration);
  const distance = cameraDistance(t) * (tuning.cameraSpeed ?? 1);
  let x = 0, y = 0;
  if (tuning.showHeroes !== false) {
    universeConfig.heroes.forEach((hero, index) => {
      const [, position, , , meta] = hero;
      if (meta.closePass === undefined || meta.closePass >= (tuning.closePassCount ?? 6) ||
          index >= Math.ceil(universeConfig.heroes.length * (tuning.heroObjectDensity ?? 1))) return;
      const depth = -position[2];
      const span = 60 + depth * .1;
      const u = (distance - depth) / span;
      if (Math.abs(u) >= 1) return;
      // Zero first/second derivatives at each edge keep the steering unhurried.
      const weight = (1 - u * u) ** 3;
      x -= Math.sign(position[0]) * 3.2 * weight;
      y -= Math.sign(position[1]) * .95 * weight;
    });
  }
  const convergence = actTwoTiming.flyDuration - actTwoTiming.convergenceDuration;
  const envelope = smooth(t / .8) * (1 - smooth((t - (convergence - 1.2)) / 1.2));
  const amount = tuning.cameraDrift ?? 1;
  out.x = clamp(x, -3.5, 3.5) * envelope * amount;
  out.y = clamp(y, -1.2, 1.2) * envelope * amount;
  out.z = -distance;
  return out;
}
