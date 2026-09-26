import { gsap } from 'gsap';
import { createFinalTitle } from '../scene/finalTitle';
import { createFinalScene } from '../scene/finalScene';
import { finalConfig } from '../config/final';

export function createFinalReveal(effects, blackout, announcement) {
  const title = createFinalTitle();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let world, raf = 0, startedAt = 0, fade, active = false, impactSent = false, offset = 0;
  function draw(now) {
    if (!active) return;
    const elapsed = (now - startedAt) / 1000 + offset;
    const time = reducedMotion.matches ? finalConfig.calmAfter + 4 : elapsed;
    world.update(time, effects.renderer.getPixelRatio(), reducedMotion.matches);
    title.update(time); effects.render(world.scene, world.camera);
    if (!impactSent && time >= finalConfig.revealDuration) {
      impactSent = true;
      announcement.textContent = 'AWS Student Builder Group TKMCE';
      if (!offset) {
        document.dispatchEvent(new CustomEvent('TKMCE_IMPACT', { detail: { title: 'TKMCE', elapsed: time } }));
        document.dispatchEvent(new CustomEvent('FINAL_TITLE_IMPACT', { detail: { title: 'TKMCE', elapsed: time } }));
      }
    }
    // One owned loop; reset cancels it before the theatre takes back the renderer.
    raf = reducedMotion.matches ? 0 : requestAnimationFrame(draw);
  }
  function onMotionChange() {
    if (!active) return;
    cancelAnimationFrame(raf); raf = requestAnimationFrame(draw);
  }
  reducedMotion.addEventListener('change', onMotionChange);
  function stop() {
    active = false; cancelAnimationFrame(raf); raf = 0; fade?.kill(); fade = null;
    impactSent = false; offset = 0; title.reset(); announcement.textContent = '';
    world?.update(0); effects.reset();
  }
  return {
    async prepare() {
      if (!effects.renderer) return false;
      const targets = await title.prepare();
      world = createFinalScene(targets);
      world.update(0, effects.renderer.getPixelRatio());
      await effects.renderer.compileAsync(world.scene, world.camera);
      // Warm all final buffers while the closed theatre covers the shared canvas.
      effects.renderer.render(world.scene, world.camera);
      effects.render();
      return true;
    },
    start({ immediate = false } = {}) {
      if (!world) return;
      stop(); offset = immediate ? finalConfig.calmAfter : 0;
      startedAt = performance.now(); active = true; title.show(); draw(startedAt);
      if (immediate) gsap.set(blackout, { opacity: 0 });
      else fade = gsap.to(blackout, { opacity: 0, duration: 0.85, ease: 'power1.inOut' });
    },
    stop,
    dispose() { stop(); reducedMotion.removeEventListener('change', onMotionChange); world?.dispose(); title.dispose(); },
  };
}
