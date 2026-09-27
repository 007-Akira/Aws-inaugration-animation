import { gsap } from 'gsap';
import { voidTreatment } from '../config/identity';
import { curtainPhysics } from '../config/timing';
import { actTwoTiming, universeConfig, entryDuration, entryEase } from '../config/actTwo';
import { createCurtainOpeningTimeline } from './curtain';

export function createMasterTimeline(elements, timing, { universe, atmosphere, onComplete, onFinalReveal, onPhase, onPlaybackTime = () => {} }) {
  const curtain = createCurtainOpeningTimeline(elements, timing);
  const entry = timing.curtainOpenDuration;
  const fly = entry + actTwoTiming.entryDuration + actTwoTiming.darknessDuration;
  const climax = fly + actTwoTiming.flyDuration - actTwoTiming.convergenceDuration;
  const burst = fly + actTwoTiming.flyDuration;
  const black = burst + actTwoTiming.burstDuration;
  const final = black + actTwoTiming.blackHold;
  let rendering = false, startedAt = 0;
  let raf = 0, fired = false, blackStartedAt = null, completionTimer = 0;
  // A slow GPU frame must not shorten the *visible* black hold through timeline catch-up.
  function finishAfterBlackHold() {
    stopRendering();
    blackStartedAt ??= performance.now();
    const remaining = actTwoTiming.blackHold * 1000 - (performance.now() - blackStartedAt);
    if (remaining > 0) { completionTimer = window.setTimeout(finishAfterBlackHold, remaining); return; }
    if (!fired) { fired = true; onPhase('FINAL_REVEAL_START'); onFinalReveal(); onComplete(); }
  }
  const timeline = gsap.timeline({ paused: true, onComplete: finishAfterBlackHold });
  const labels = {
    CAMERA_ENTRY: entry, VOID_BRIDGE: entry + actTwoTiming.entryDuration + actTwoTiming.darknessDuration * 0.5, FLYTHROUGH_START: fly,
    FLYTHROUGH_MID: fly + actTwoTiming.flyDuration * 0.5,
    FLYTHROUGH_FAST: fly + actTwoTiming.flyDuration * 0.77,
    CLIMAX: climax, FINAL_REVEAL_START: final,
  };
  timeline.addLabel('curtainOpen', 0).add(curtain.timeline, 0);
  timeline.to(elements.interaction, { autoAlpha: 0, duration: timing.interactionFadeDuration }, 0);
  timeline.addLabel('curtainSettled', entry);
  Object.entries(labels).forEach(([name, time]) => timeline.addLabel(name, time));
  // Expand only the theatre coordinate space; responsive cover stays on its parent.
  timeline.to(elements.theatre, { scale: actTwoTiming.entryScale, duration: actTwoTiming.entryDuration, ease: 'power2.in' }, entry);
  timeline.set(elements.theatre, { visibility: 'hidden' }, entry + actTwoTiming.entryDuration);
  timeline.to(universe.controls, { voidOpacity: voidTreatment.openingOpacity, duration: timing.curtainOpenDuration - timing.resistanceStart, ease: 'power1.inOut' }, timing.resistanceStart);
  timeline.to(universe.controls, { entryProgress: 1, particleSpeed: 2, streakLength: 1.8, duration: entryDuration, ease: entryEase }, entry);
  timeline.to(elements.theatre.querySelector('.atmosphere'), { opacity: 0.04, duration: actTwoTiming.entryDuration }, entry);
  timeline.to(universe.controls, { orangeBlend: 1, duration: actTwoTiming.flyDuration * (1 - voidTreatment.orangeStartFraction), ease: 'power2.in' }, fly + actTwoTiming.flyDuration * voidTreatment.orangeStartFraction);
  // Build the destination while the fabric is opening, then continue the same reveal
  // through the camera push. There is no scene-wide switch at FLYTHROUGH_START.
  const worldBuildStart = timing.spillFadeStart;
  timeline.to(universe.controls, { emergence: 1, duration: fly + actTwoTiming.emergenceDuration - worldBuildStart, ease: 'sine.out' }, worldBuildStart);
  timeline.to(universe.controls, {
    cameraSpeed: universeConfig.cameraEndSpeed, particleSpeed: 12, streakLength: 25,
    orangeEnergyIntensity: 3.5, objectDensity: 1, cameraShake: 0.24,
    duration: actTwoTiming.flyDuration, ease: 'power2.in',
  }, fly);
  timeline.to(universe.controls, { collapse: 1, duration: actTwoTiming.convergenceDuration, ease: 'power2.in' }, climax);
  timeline.to(elements.burst, { opacity: 1, duration: actTwoTiming.burstDuration * 0.35, ease: 'power3.in' }, burst);
  timeline.to(elements.burst, { opacity: 0, duration: actTwoTiming.burstDuration * 0.65, ease: 'power2.out' }, burst + actTwoTiming.burstDuration * 0.35);
  timeline.set(elements.blackout, { opacity: 1 }, black);
  timeline.to({}, { duration: actTwoTiming.blackHold }, black);
  function phase() {
    const time = timeline.time();
    return time >= final - 0.0001 && fired ? 'FINAL_REVEAL_START' : time >= black ? 'BLACK_HOLD' : time >= burst ? 'ENERGY_BURST' : time >= climax ? 'CLIMAX' : time >= labels.FLYTHROUGH_FAST ? 'FLYTHROUGH_FAST' : time >= fly ? 'FLYTHROUGH' : time >= entry + actTwoTiming.entryDuration ? 'VOID_BRIDGE' : time >= entry ? 'CAMERA_ENTRY' : 'CURTAIN';
  }
  function draw() {
    const time = timeline.time();
    if (time < black) universe.render(time - fly);
    if (time <= entry + actTwoTiming.entryDuration) atmosphere.render(time);
  }
  function renderLoop() {
    if (!rendering) return;
    timeline.time(Math.min(timeline.duration(), (performance.now() - startedAt) / 1000), false);
    draw();
    if (rendering) raf = requestAnimationFrame(renderLoop);
  }
  function stopRendering() { rendering = false; cancelAnimationFrame(raf); raf = 0; }
  timeline.eventCallback('onUpdate', () => {
    if (rendering) onPlaybackTime(timeline.time() - fly);
    if (timeline.time() >= black && blackStartedAt === null) { blackStartedAt = performance.now(); }
    onPhase(phase());
  });
  function reset() {
    stopRendering(); clearTimeout(completionTimer); completionTimer = 0; fired = false; blackStartedAt = null;
    timeline.pause(0, true);
    curtain.reset(); universe.reset(); atmosphere.reset();
    gsap.set(elements.interaction, { autoAlpha: 1 });
    gsap.set(elements.reveal, { autoAlpha: 0 });
    gsap.set(elements.theatre, { scale: 1, visibility: 'visible' });
    gsap.set(elements.effects, { autoAlpha: 1 });
    gsap.set([elements.burst, elements.blackout], { opacity: 0 });
    onPhase('CURTAIN');
  }
  reset();
  return {
    timeline, labels, reset, redraw: draw,
    play: () => {
      stopRendering(); timeline.pause(0, true); startedAt = performance.now();
      rendering = true; raf = requestAnimationFrame(renderLoop);
    },
    inspectLabel: (label) => {
      if (!(label in labels)) return;
      stopRendering(); timeline.pause(labels[label], true);
      if (label === 'FLYTHROUGH_START') timeline.time(fly + 0.35, true);
      onPhase(label === 'FINAL_REVEAL_START' ? label : phase()); draw();
    },
    inspect: (progress) => {
      stopRendering(); timeline.pause();
      if (progress === 1) { timeline.time(entry, true); onPhase('CURTAIN'); draw(); return; }
      const hem = elements.left.querySelector('.fabric-hem');
      const desiredScale = 1 - progress * (1 - curtainPhysics.gatheredWidth);
      let low = timing.resistanceStart, high = timing.mainTravelEnd;
      for (let i = 0; i < 20; i++) {
        const middle = (low + high) / 2; timeline.time(middle, true);
        if (Number(gsap.getProperty(hem, 'scaleX')) > desiredScale) low = middle; else high = middle;
      }
      timeline.time((low + high) / 2, true); draw();
    },
    dispose: () => { stopRendering(); clearTimeout(completionTimer); timeline.kill(); },
  };
}
