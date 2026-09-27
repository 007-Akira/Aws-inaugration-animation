import './styles.css';
import { timing } from './config/timing';
import { assetManifest } from './config/assets';
import { createStageViewport } from './core/stage';
import { createState } from './core/state';
import { AssetLoader } from './core/assetLoader';
import { FlybyAudio } from './core/flybyAudio';
import { VideoManager } from './core/video';
import { bindControls } from './core/controls';
import { createDebug } from './core/debug';
import { createMasterTimeline } from './animation/timeline';
import { createTheatreAtmosphere } from './animation/atmosphere';
import { createFinalReveal } from './animation/final';
import { createUniverse } from './scene/universe';
import { createEffects } from './animation/effects';

const select = (selector) => document.querySelector(selector);
const elements = {
  theatre: select('#theatre'), effects: select('.effects'), burst: select('#energy-burst'), blackout: select('#sequence-blackout'),
  stage: select('#stage'), left: select('.curtain-left'), right: select('.curtain-right'),
  interaction: select('.interaction'), reveal: select('.reveal'),
};
const root = select('#app');
const presentation = new URLSearchParams(window.location.search).get('presentation') === 'true';
root.dataset.presentation = String(presentation);
root.dataset.debug = 'false';
const viewport = createStageViewport(root, elements.stage);
const startButton = select('#start-button');
const status = select('#status-message');
const state = createState();
const loader = new AssetLoader(assetManifest);
let debug;
let clickSound;
function stopClickSound() {
  if (clickSound) { clickSound.pause(); clickSound.currentTime = 0; }
}
const report = (error) => { console.warn(error); debug?.report(error); };
const flybyAudio = new FlybyAudio(report);
const video = new VideoManager(select('#cinematic-video'), report);
const effects = createEffects(select('#effects-canvas'), viewport, report);
const universe = createUniverse(effects);
const atmosphere = createTheatreAtmosphere(select('#theatre-dust'));
const finalReveal = createFinalReveal(effects, elements.blackout, select('#final-announcement'));
const master = createMasterTimeline(elements, timing, {
  universe, atmosphere,
  onPlaybackTime: time => flybyAudio.update(time),
  onPhase: phase => { if (root.dataset.phase !== phase) root.dataset.phase = phase; },
  onFinalReveal: () => {
    finalReveal.start();
    document.dispatchEvent(new CustomEvent('FINAL_REVEAL_START', { detail: { source: 'inauguration' } }));
  },
  onComplete: () => {
    if (state.current !== 'playing') return;
    state.set('complete');
  },
});
state.subscribe((current) => {
  elements.stage.dataset.state = current;
  root.dataset.state = current;
  startButton.disabled = current !== 'ready';
  select('#start-label').textContent = current === 'loading' ? 'LOADING' : current === 'error' ? 'ASSETS UNAVAILABLE' : 'CLICK TO INAUGURATE';
});
elements.stage.dataset.state = state.current;
function start() {
  if (state.current !== 'ready') return;
  state.set('playing');
  flybyAudio.start(universe.tuning);
  if (clickSound) {
    clickSound.currentTime = 0;
    void clickSound.play().catch(error => { if (error.name !== 'AbortError') report(error); });
  }
  startButton.blur();
  status.textContent = '';
  master.play();
}
let inspecting = false;
function syncTuningControls() {
  select('#universe-tuning').querySelectorAll('input').forEach(input => {
    const value=universe.tuning[input.dataset.tune];
    if(input.type==='checkbox')input.checked=value;
    else {input.value=value;input.nextElementSibling.value=value;}
  });
}
function resetForInspection() {
  const values={...universe.tuning};reset();Object.assign(universe.tuning,values);syncTuningControls();
}
function reset() {
  flybyAudio.reset();
  stopClickSound();
  inspecting = false;
  finalReveal.stop();
  master.reset();
  video.reset();
  syncTuningControls();
  elements.reveal.setAttribute('aria-hidden', 'true');
  if (state.current === 'playing' || state.current === 'complete') state.set('ready');
}
function inspect(progress) {
  if (state.current === 'loading' || state.current === 'error') return;
  reset();
  if (progress === 0) return;
  state.set('playing');
  master.inspect(progress);
  inspecting = true;
  debug.report('Inspection paused. R / 1 restores the closed state; Space replays from closed.');
}
function inspectActTwo(label) {
  if (state.current === 'loading' || state.current === 'error') return;
  resetForInspection(); state.set('playing'); master.inspectLabel(label); inspecting = true;
  debug.report('Act II paused. Space replays from closed. Checkpoints never dispatch reveal events.');
}
function tune(name, value) {
  if (name in universe.tuning) {
    universe.tuning[name]=value;
    if(flybyAudio.active)flybyAudio.reconfigure(universe.tuning,master.timeline.time()-master.labels.FLYTHROUGH_START);
    master.redraw();
  }
}
function previewFinal() {
  if (state.current === 'loading' || state.current === 'error') return;
  reset(); state.set('playing'); master.inspectLabel('FINAL_REVEAL_START');
  finalReveal.start({ immediate: true }); state.set('complete'); inspecting = true;
}
function debugStart() { if (inspecting) resetForInspection(); start(); }
debug = createDebug({ panel: select('#debug'), state, timeline: master.timeline, loader, universe, root });
const unbind = bindControls({ root, viewport, presentation, start, debugStart, inspect, inspectActTwo, tune, previewFinal, reset, debug: select('#debug'), startButton, report });
async function initializeAssets() {
  // Finish timed asset I/O before synchronous GPU/environment warm-up can block it.
  const result = await loader.load();
  const graphicsReady = await universe.prepare();
  let flybyReady = false;
  try {
    if (loader.get('flybyWhoosh')) { await flybyAudio.prepare(loader.get('flybyWhoosh')); flybyReady = true; }
  } catch (error) { report(error); }
  clickSound = loader.get('inaugurationClick');
  if (clickSound) { clickSound.volume = 0.55; clickSound.loop = false; }
  video.attach(loader.get('intro'));
  let finalReady = false;
  if (result.ready && graphicsReady) {
    try { finalReady = await finalReveal.prepare(); }
    catch (error) { report(error); }
  }
  if (result.ready && graphicsReady && finalReady && flybyReady) {
    state.set('ready');
    if (new URLSearchParams(location.search).get('final') === 'true') previewFinal();
  }
  else {
    state.set('error');
    status.textContent = graphicsReady ? 'A required asset could not load. Check local files and reload.' : '3D graphics unavailable. Enable hardware acceleration in Chrome and reload.';
  }
  if (result.failed.length) debug.report(result.failed.map((asset) => `${asset.id}: ${asset.error}`).join('; '));
}
void initializeAssets();

if (import.meta.hot) import.meta.hot.dispose(() => {
  flybyAudio.dispose(); stopClickSound(); unbind(); master.dispose(); video.reset(); finalReveal.dispose(); universe.dispose(); effects.dispose(); viewport.dispose(); debug.dispose();
});
