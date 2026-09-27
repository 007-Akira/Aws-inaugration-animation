import { test, expect } from '@playwright/test';
import { sampleCameraPath } from '../src/core/cameraPath';
import { actTwoTiming, universeConfig, cameraDistance } from '../src/config/actTwo';
import { createFlybyCues } from '../src/core/flybyAudio';

test('weaving route increases clearance at every close pass and keeps forward travel', () => {
  const path = {};
  for (const [, [x, y, z], , , meta] of universeConfig.heroes) {
    if (meta.closePass === undefined) continue;
    let minimum = Infinity;
    for (let t = 0; t < actTwoTiming.flyDuration - actTwoTiming.convergenceDuration; t += .005) {
      sampleCameraPath(t, {}, path);
      minimum = Math.min(minimum, Math.hypot(x - path.x, y - path.y, z - path.z));
      expect(path.z).toBe(-cameraDistance(t));
    }
    expect(minimum, `clearance for close pass ${meta.closePass}`).toBeGreaterThan(Math.hypot(x, y) + .5);
  }
});

test('route is bounded, smooth, seekable and centered for entry and convergence', () => {
  const out = {}, convergence = actTwoTiming.flyDuration - actTwoTiming.convergenceDuration;
  for (const t of [-1, 0, convergence, actTwoTiming.flyDuration]) {
    const p = sampleCameraPath(t);
    expect(Math.abs(p.x)).toBe(0); expect(Math.abs(p.y)).toBe(0);
  }
  let previous = sampleCameraPath(0);
  for (let t = .01; t < actTwoTiming.flyDuration; t += .01) {
    const p = sampleCameraPath(t);
    expect(Math.abs(p.x)).toBeLessThanOrEqual(3.5);
    expect(Math.abs(p.y)).toBeLessThanOrEqual(1.2);
    expect(Math.hypot(p.x - previous.x, p.y - previous.y)).toBeLessThan(.15);
    expect(p.z).toBeLessThan(previous.z);
    previous = p;
  }
  const before = sampleCameraPath(4);
  sampleCameraPath(9, {}, out);
  expect(sampleCameraPath(4, {}, out)).toBe(out);
  expect(out).toEqual(before);
  expect(sampleCameraPath(4, { showHeroes: false }).x).toBe(0);
  expect(sampleCameraPath(4, { closePassCount: 0 }).x).toBe(0);
  const h = .001;
  for (const t of [0, convergence]) {
    const a = sampleCameraPath(t - h), b = sampleCameraPath(t + h);
    expect(Math.hypot(b.x - a.x, b.y - a.y) / (2 * h)).toBeLessThan(.01);
  }
});

test('whoosh peaks use the same curved route at default and tuned camera speeds', () => {
  for (const cameraSpeed of [.8, 1, 1.4]) {
    const cues = createFlybyCues({ cameraSpeed });
    for (const cue of cues) {
      const camera = sampleCameraPath(cue.closest, { cameraSpeed });
      const candidates = universeConfig.heroes.filter(hero => hero[4].closePass !== undefined);
      const distances = candidates.map(([, [x, y, z]]) => Math.hypot(x - camera.x, y - camera.y, z - camera.z));
      expect(Math.min(...distances.map(distance => Math.abs(distance - cue.distance)))).toBeLessThan(.0001);
      expect(cue.at + .7 / cue.rate).toBeCloseTo(cue.closest, 6);
    }
  }
});
