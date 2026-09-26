import { Scene, PerspectiveCamera, WebGLRenderer } from 'three';

// Renderer ownership stays separate from procedural scene resources and timeline state.
export function createEffects(canvas, viewport, report = console.warn) {
  const scene = new Scene();
  const camera = new PerspectiveCamera(45, 16 / 9, 0.1, 100);
  camera.position.z = 5;
  let renderer;
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
    renderer.render(activeScene, activeCamera);
  }
  const unsubscribe = viewport.subscribe(resize);
  return {
    scene, camera,
    get renderer() { return renderer; },
    initialize() {
      if (renderer) return renderer;
      try {
        renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setClearColor(0x000000, 0);
        resize(dimensions);
        return renderer;
      } catch (error) { report(error); return null; }
    },
    async prepare() {
      const active = this.initialize();
      if (!active) return false;
      try { await active.compileAsync(scene, camera); return true; }
      catch (error) { report(error); return false; }
    },
    render(nextScene = scene, nextCamera = camera) { activeScene = nextScene; activeCamera = nextCamera; renderer?.render(activeScene, activeCamera); },
    reset() { renderer?.clear(); },
    dispose() { unsubscribe(); renderer?.dispose(); },
  };
}
