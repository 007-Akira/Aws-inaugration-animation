export function bindControls({ root, viewport, presentation, start, debugStart, inspect, inspectActTwo, tune, previewFinal, reset, debug, startButton, report }) {
  async function fullscreen() {
    try {
      if (!document.fullscreenElement) await root.requestFullscreen();
      viewport.update();
    } catch (error) { report(`Fullscreen unavailable: ${error.message}`); }
  }
  const onKey = (event) => {
    // Cancel scroll defaults even for repeated keydown events in presentation mode.
    if (presentation && ['Space', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.target?.matches?.('input:not([type=range]):not([type=checkbox]), textarea, select') || event.target.isContentEditable) return;
    if (event.code==='Space' && event.target?.matches?.('input[type=checkbox]')) return;
    if (!debug.hidden && /^Digit[1-5]$/.test(event.code)) {
      event.preventDefault(); inspect((Number(event.code.slice(-1)) - 1) / 4); return;
    }
    switch (event.code) {
      case 'KeyF': event.preventDefault(); void fullscreen(); break;
      case 'KeyR': event.preventDefault(); reset(); break;
      case 'KeyD':
        event.preventDefault();
        if (!presentation) { debug.hidden = !debug.hidden; root.dataset.debug = String(!debug.hidden); }
        break;
      case 'Space':
        // A focused button must not accidentally start via Space outside debug mode.
        event.preventDefault();
        if (!debug.hidden) debugStart();
        break;
    }
  };
  const onClick = (event) => { if (event.button === 0) start(); };
  const debugStartButton = document.querySelector('#debug-start');
  const presets = document.querySelector('#curtain-presets');
  const onPreset = (event) => { const button = event.target.closest('[data-curtain-progress]'); if (button && !debug.hidden) inspect(Number(button.dataset.curtainProgress)); };
  presets.addEventListener('click', onPreset);
  const actPresets = document.querySelector('#act-two-presets');
  const tuningPanel = document.querySelector('#universe-tuning');
  const onActPreset = event => { const button = event.target.closest('[data-act-two]'); if (button && !debug.hidden) inspectActTwo(button.dataset.actTwo); };
  const onTune = event => { if (!debug.hidden && event.target.matches('[data-tune]')) { const value=event.target.type==='checkbox'?event.target.checked:Number(event.target.value); if(event.target.type!=='checkbox')event.target.nextElementSibling.value=value; tune(event.target.dataset.tune,value); } };
  actPresets.addEventListener('click', onActPreset);
  tuningPanel.addEventListener('input', onTune);
  const debugReset = document.querySelector('#debug-reset');
  const finalButton = document.querySelector('#debug-final');
  finalButton.addEventListener('click', previewFinal);
  const debugFullscreen = document.querySelector('#debug-fullscreen');
  startButton.addEventListener('click', onClick);
  debugStartButton.addEventListener('click', debugStart);
  debugReset.addEventListener('click', reset);
  debugFullscreen.addEventListener('click', fullscreen);
  window.addEventListener('keydown', onKey);
  const preventDefault = event => event.preventDefault();
  const blockedEvents = ['contextmenu', 'dragstart', 'selectstart'];
  if (presentation) blockedEvents.forEach(type => root.addEventListener(type, preventDefault));
  return () => {
    finalButton.removeEventListener('click', previewFinal);
    actPresets.removeEventListener('click', onActPreset);
    tuningPanel.removeEventListener('input', onTune);
    blockedEvents.forEach(type => root.removeEventListener(type, preventDefault));
    presets.removeEventListener('click', onPreset);
    startButton.removeEventListener('click', onClick);
    debugStartButton.removeEventListener('click', debugStart);
    debugReset.removeEventListener('click', reset);
    debugFullscreen.removeEventListener('click', fullscreen);
    window.removeEventListener('keydown', onKey);
  };
}
