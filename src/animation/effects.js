import { createComposer } from '../scene/postprocessing';
import { Scene, PerspectiveCamera, WebGLRenderer, ACESFilmicToneMapping } from 'three';

// Renderer ownership stays separate from procedural scene resources and timeline state.
export function createEffects(canvas, viewport, report = console.warn) {
  const scene = new Scene();
  const camera = new PerspectiveCamera(45, 16 / 9, 0.1, 100);
  camera.position.z = 5;
  let renderer, postprocessing;
  let activeScene = scene, activeCamera = camera;
  let dimensions, allocated;
  function resize(metrics) {
    dimensions = metrics;
    camera.aspect = metrics.width / metrics.height;
    camera.updateProjectionMatrix();
    if (!renderer) return;
    const key = `${metrics.width}:${metrics.height}:${metrics.pixelRatio}`;
    if (allocated !== key) {
      renderer.setPixelRatio(metrics.pixelRatio);
      renderer.setSize(metrics.width, metrics.height, false);
      allocated = key;
    }
    postprocessing?.resize(metrics.width,metrics.height,metrics.pixelRatio);
    draw();
  }
  function draw() {
    if (!renderer) return;
    renderer.info.reset();
    // The approved final galaxy bypasses Act II bloom entirely.
    if(postprocessing && activeScene===scene) {
      const mapping=renderer.toneMapping,exposure=renderer.toneMappingExposure;
      renderer.toneMapping=ACESFilmicToneMapping;renderer.toneMappingExposure=.9;
      try { postprocessing.composer.render(); }
      finally { renderer.toneMapping=mapping;renderer.toneMappingExposure=exposure; }
    }
    else renderer.render(activeScene,activeCamera);
  }
  const unsubscribe = viewport.subscribe(resize);
  return {
    scene, camera,
    get renderer() { return renderer; },
    get scenePixelRatio() { return postprocessing ? postprocessing.composer.readBuffer.width/dimensions.width : renderer?.getPixelRatio()??1; },
    initialize() {
      if (renderer) return renderer;
      try {
        renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.info.autoReset = false;
        renderer.setClearColor(0x000000, 0);
        renderer.transmissionResolutionScale = 0.5;
        resize(dimensions);
        postprocessing = createComposer(renderer,scene,camera,dimensions.width,dimensions.height);
        return renderer;
      } catch (error) { report(error); return null; }
    },
    async prepare() {
      const active = this.initialize();
      if (!active) return false;
      const mapping=active.toneMapping;active.toneMapping=ACESFilmicToneMapping;
      try { await active.compileAsync(scene, camera); return true; }
      catch (error) { report(error); return false; }
      finally { active.toneMapping=mapping; }
    },
    render(nextScene = scene, nextCamera = camera) { activeScene = nextScene; activeCamera = nextCamera; draw(); },
    setBloomStrength(value) { if(postprocessing) postprocessing.bloomPass.strength=value; },
    reset() { renderer?.clear(); },
    dispose() { unsubscribe(); postprocessing?.dispose(); renderer?.dispose(); },
  };
}
