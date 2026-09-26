import { gsap } from 'gsap';
export function createDebug({ panel, state, timeline, loader, universe, root }) {
  const fields = Object.fromEntries(['state', 'progress', 'assets', 'fps', 'details'].map((name) => [name, document.querySelector(`#debug-${name}`)]));
  let frames = 0;
  let previous = performance.now();
  let message = '';
  const update = () => {
    if (panel.hidden) { frames = 0; previous = performance.now(); return; }
    frames++;
    const now = performance.now();
    if (now - previous < 250) return;
    document.querySelector('#debug-phase').textContent = root.dataset.phase;
    document.querySelector('#debug-camera').textContent = universe.telemetry.cameraZ.toFixed(1);
    document.querySelector('#debug-draws').textContent = universe.telemetry.drawCalls;
    fields.state.textContent = state.current;
    fields.progress.textContent = `${Math.round(timeline.progress() * 100)}%`;
    const { loaded, total, failed } = loader.summary;
    fields.assets.textContent = `${loaded} / ${total}${failed ? ` (${failed} failed)` : ''}`;
    fields.fps.textContent = String(Math.round(frames * 1000 / (now - previous)));
    fields.details.textContent = message;
    document.querySelector('#debug-start').disabled = ['loading', 'error'].includes(state.current);
    frames = 0;
    previous = now;
  };
  gsap.ticker.add(update);
  return { report(value) { message = value instanceof Error ? value.message : String(value); }, dispose() { gsap.ticker.remove(update); } };
}
