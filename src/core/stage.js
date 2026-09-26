export const DESIGN_SIZE = Object.freeze({ width: 1920, height: 1080 });
export const MAX_PIXEL_RATIO = 2;

// The only viewport-to-design transform. Every visual layer inherits it.
export function createStageViewport(root, stage) {
  const listeners = new Set();
  let metrics;
  let resolutionQuery;
  let disposed = false;
  function update() {
    if (disposed) return;
    const viewportWidth = root.clientWidth;
    const viewportHeight = root.clientHeight;
    if (!viewportWidth || !viewportHeight) return;
    const scale = Math.max(viewportWidth / DESIGN_SIZE.width, viewportHeight / DESIGN_SIZE.height);
    metrics = {
      ...DESIGN_SIZE, viewportWidth, viewportHeight, scale,
      devicePixelRatio: Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO),
      // Canvas CSS dimensions remain in design units; include stage scale once.
      // Cap total buffer density too: at most 3840×2160, including on HiDPI 4K.
      pixelRatio: Math.min((window.devicePixelRatio || 1) * scale, MAX_PIXEL_RATIO),
    };
    stage.style.setProperty('--stage-scale', String(scale));
    listeners.forEach(listener => listener(metrics));
  }
  function watchResolution() {
    resolutionQuery?.removeEventListener('change', onResolutionChange);
    resolutionQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    resolutionQuery.addEventListener('change', onResolutionChange);
  }
  function onResolutionChange() { watchResolution(); update(); }
  const observer = new ResizeObserver(update);
  observer.observe(root);
  window.addEventListener('resize', update);
  window.addEventListener('orientationchange', update);
  document.addEventListener('fullscreenchange', update);
  watchResolution();
  update();
  return {
    update,
    get metrics() { return metrics; },
    subscribe(listener) { listeners.add(listener); if (metrics) listener(metrics); return () => listeners.delete(listener); },
    dispose() {
      disposed = true;
      observer.disconnect();
      resolutionQuery?.removeEventListener('change', onResolutionChange);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      document.removeEventListener('fullscreenchange', update);
      listeners.clear();
    },
  };
}
