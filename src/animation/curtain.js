import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { curtainPhysics } from '../config/timing';
import { voidTreatment } from '../config/identity';
import { localAsset } from '../config/assets';

gsap.registerPlugin(CustomEase);

// A photographic fabric field reconstructed as overlapping independent pleats.
// Only transforms and overlay opacity animate; texture, clipping and layout stay fixed.
export function createCurtainOpeningTimeline(elements, timing, physics = curtainPhysics) {
  const travelEase = CustomEase.create('heavyVelvet', physics.travelEase);
  const timeline = gsap.timeline();
  const pleats = [];
  const shades = [];
  const highlights = [];
  for (const [side, panel] of [[-1, elements.left], [1, elements.right]]) {
    panel.replaceChildren();
    for (let index = 0; index < physics.pleatsPerSide; index++) {
      // Ordered from anchored outer edge to free inner hem on either side.
      const strip = document.createElement('div');
      strip.className = `fabric-pleat${index === physics.pleatsPerSide - 1 ? ' fabric-hem' : ''}`;
      const position = index / physics.pleatsPerSide;
      const sourcePosition = side === -1 ? position : 1 - (index + 1) / physics.pleatsPerSide;
      strip.style.width = `${100 / physics.pleatsPerSide * 1.08}%`;
      strip.style[side === -1 ? 'left' : 'right'] = `${position * 100}%`;
      strip.style.transformOrigin = side === -1 ? 'left center' : 'right center';
      // Each panel occupies 34% of the stage, beginning at 16% / 50%.
      // Horizontal coordinates match the reference. Vertically sample only hanging
      // fabric (below the swags), so the fixed valance never travels with the pleats.
      const stageX = (side === -1 ? 0.16 : 0.50) + sourcePosition * 0.34;
      const stageWidth = 0.34 / physics.pleatsPerSide * 1.08;
      strip.style.backgroundImage = `url("${localAsset('images/curtain-reference.jpg')}")`;
      strip.style.backgroundSize = `${100 / stageWidth}% 120.3125%`;
      strip.style.backgroundPosition = `${stageX / (1 - stageWidth) * 100}% 93%`;
      const shade = document.createElement('div');
      shade.className = 'fold-shadow';
      const highlight = document.createElement('div');
      highlight.className = 'fold-highlight';
      strip.append(shade, highlight);
      panel.append(strip);
      pleats.push(strip); shades.push(shade); highlights.push(highlight);
      const inner = index / (physics.pleatsPerSide - 1);
      const lag = (1 - inner) * physics.foldLag;
      // GSAP xPercent is relative to a pleat, so no per-frame geometry reads.
      const travel = side * index / 1.08 * 100;
      const scale = physics.gatheredWidth;
      const target = (compression) => ({
        xPercent: travel * (1 - compression), scaleX: compression,
      });
      timeline.to(strip, { ...target(1 - physics.resistanceTravel), duration: timing.mainTravelStart - timing.resistanceStart, ease: 'power2.in' }, timing.resistanceStart);
      timeline.to(strip, {
        ...target(scale - physics.overshoot),
        skewX: side * physics.edgeSkew * inner,
        duration: timing.mainTravelEnd - timing.mainTravelStart - lag,
        ease: travelEase,
      }, timing.mainTravelStart + lag);
      timeline.to(strip, {
        ...target(scale + physics.rebound), skewX: -side * physics.edgeSkew * inner * 0.3,
        duration: timing.settleRebound - timing.mainTravelEnd, ease: 'sine.inOut',
      }, timing.mainTravelEnd);
      timeline.to(strip, {
        ...target(scale), skewX: 0,
        duration: timing.curtainOpenDuration - timing.settleRebound, ease: 'sine.out',
      }, timing.settleRebound);
      timeline.to(shade, { opacity: physics.foldShadow * (0.75 + inner * 0.25), duration: timing.mainTravelEnd - timing.mainTravelStart, ease: travelEase }, timing.mainTravelStart);
      timeline.to(highlight, { opacity: physics.foldHighlight, xPercent: side * 9, duration: timing.mainTravelEnd - timing.mainTravelStart, ease: travelEase }, timing.mainTravelStart);
    }
  }
  const seam = elements.stage.querySelector('.central-seam-glow');
  const halo = elements.stage.querySelector('.seam-halo');
  const spill = elements.stage.querySelector('.screen-spill');
  const atmosphere = elements.stage.querySelector('.atmosphere');
  const pulse = elements.stage.querySelector('.inauguration-pulse');
  const seamTravel = elements.stage.querySelector('.seam-energy-travel');
  timeline.to(pulse, { opacity: 0.65, scale: 0.7, duration: timing.lightPeak, ease: 'power2.out' }, 0);
  timeline.to(pulse, { opacity: 0, scale: 1.6, duration: voidTreatment.pulseDuration - timing.lightPeak, ease: 'power1.out' }, timing.lightPeak);
  timeline.to(seamTravel, { opacity: 0.8, duration: timing.lightPeak }, 0);
  timeline.to(seamTravel, { y: -520, duration: voidTreatment.seamTravelDuration, ease: 'power2.inOut' }, timing.lightPeak);
  timeline.to(seamTravel, { opacity: 0, duration: 0.2 }, timing.lightPeak + voidTreatment.seamTravelDuration - 0.2);
  timeline.to(seam, { opacity: 1, scaleX: 1.9, duration: timing.lightPeak, ease: 'power1.out' }, 0);
  timeline.to(halo, { opacity: 0.8, scaleX: 1.5, duration: timing.lightPeak }, 0);
  timeline.to([seam, halo], { opacity: 0, scaleX: 5, duration: timing.seamFadeDuration, ease: 'power1.out' }, timing.seamFadeStart);
  timeline.fromTo(spill, { opacity: 0, scaleX: 0.025 }, { opacity: 0.5, scaleX: 0.7, duration: timing.spillFadeStart, ease: 'power2.in' }, timing.resistanceStart);
  timeline.to(spill, { opacity: 0, scaleX: 1, duration: timing.spillFadeDuration, ease: 'power1.out' }, timing.spillFadeStart + timing.resistanceStart);
  timeline.to(atmosphere, { opacity: 0.18, duration: timing.mainTravelEnd, ease: 'power1.inOut' }, 0);
  function reset() {
    gsap.set(pleats, { xPercent: 0, scaleX: 1, skewX: 0 });
    gsap.set(shades, { opacity: 0 });
    gsap.set(highlights, { opacity: 0, xPercent: 0 });
    gsap.set(seam, { opacity: 0.35, scaleX: 1 });
    gsap.set(halo, { opacity: 0.18, scaleX: 1 });
    gsap.set(spill, { opacity: 0, scaleX: 0.025 });
    gsap.set(atmosphere, { opacity: 1 });
    gsap.set(pulse, { opacity: 0, scale: 0.25 });
    gsap.set(seamTravel, { opacity: 0, y: 0 });
  }
  reset();
  return { timeline, reset };
}
