import { test, expect } from '@playwright/test';

test('one-shot playback, debug gating, reset and replay', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const stage = page.locator('#stage');
  await expect(stage).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('#debug')).toBeHidden();
  await page.keyboard.press('Space');
  await expect(stage).toHaveAttribute('data-state', 'ready');
  await page.locator('#start-button').click();
  await expect(stage).toHaveAttribute('data-state', 'playing');
  await page.waitForTimeout(500);
  await page.keyboard.press('r');
  await expect(stage).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('.reveal')).toBeHidden();
  expect(await page.locator('.curtain-left').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m41)).toBe(0);
  await page.keyboard.press('d');
  await expect(page.locator('#debug')).toBeVisible();
  await page.keyboard.press('Space');
  await page.waitForTimeout(3000);
  await page.mouse.click(960, 540);
  await page.keyboard.press('Space');
  await expect(stage).toHaveAttribute('data-state', 'complete', { timeout: 25000 });
  await expect(page.locator('.reveal')).toBeHidden();
  await expect(page.locator('.central-seam-glow')).toHaveCSS('opacity', '0');
  await page.mouse.click(960, 540);
  await expect(stage).toHaveAttribute('data-state', 'complete', { timeout: 25000 });
  await page.keyboard.press('r');
  await expect(stage).toHaveAttribute('data-state', 'ready');
  await page.screenshot({ path: 'test-results/stage-ready.png' });
  expect(errors).toEqual([]);
});

test('shared 1920×1080 stage covers desktop and unusual viewports', async ({ page }) => {
  await page.goto('/');
  for (const size of [
    { width: 1920, height: 1080 }, { width: 1366, height: 768 },
    { width: 1536, height: 864 }, { width: 2560, height: 1440 },
    { width: 3840, height: 2160 }, { width: 1000, height: 900 },
    { width: 2560, height: 1080 }, { width: 800, height: 1200 },
  ]) {
    await page.setViewportSize(size);
    const scale = Math.max(size.width / 1920, size.height / 1080);
    await expect.poll(async () => (await page.locator('#stage').boundingBox()).width).toBeCloseTo(1920 * scale, 1);
    const box = await page.locator('#stage').boundingBox();
    expect(box.width / box.height).toBeCloseTo(16 / 9, 5);
    expect(box.x).toBeLessThanOrEqual(0.01);
    expect(box.y).toBeLessThanOrEqual(0.01);
    expect(box.x + box.width).toBeGreaterThanOrEqual(size.width - 0.01);
    expect(box.y + box.height).toBeGreaterThanOrEqual(size.height - 0.01);
    for (const layer of ['.environment', '.curtains', '.cinema-screen', '.atmosphere', '.reveal', '.effects']) {
      const layerBox = await page.locator(layer).boundingBox();
      // Hidden title retains its authored dimensions but boundingBox returns null.
      if (layerBox) expect(layerBox).toEqual(box);
    }
    const shape = await page.locator('.click-motif').boundingBox();
    expect(shape.width).toBeCloseTo(84 * scale, 1);
    expect(shape.height).toBeCloseTo(shape.width, 1);
    expect(await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }))).toEqual(size);
  }
});

test('preloader gates critical failures and tolerates optional failures', async ({ page }) => {
  await page.goto('/');
  const results = await page.evaluate(async () => {
    const { AssetLoader } = await import('/src/core/assetLoader.js');
    const good = { id: 'image', type: 'image', src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', critical: true };
    const bad = { id: 'bad', type: 'image', src: 'data:image/png;base64,invalid' };
    const optional = new AssetLoader([good, bad]);
    const critical = new AssetLoader([{ ...bad, critical: true }]);
    return { optional: await optional.load(), summary: optional.summary, critical: await critical.load() };
  });
  expect(results.optional.ready).toBe(true);
  expect(results.summary).toEqual({ total: 2, loaded: 1, settled: 2, failed: 1 });
  expect(results.critical.ready).toBe(false);
});

test('required asset loading prevents interaction until resolved', async ({ page }) => {
  await page.route('**/src/config/assets.js*', route => route.fulfill({
    contentType: 'application/javascript',
    body: "export const localAsset = path => '/assets/' + path; export const assetManifest = [{ id: 'required', type: 'image', src: '/missing-required.png', critical: true }];",
  }));
  await page.route('**/missing-required.png', async route => {
    await new Promise(resolve => setTimeout(resolve, 400));
    await route.fulfill({ status: 404, body: '' });
  });
  await page.goto('/');
  await expect(page.locator('#start-button')).toBeDisabled();
  await page.keyboard.press('d');
  await page.keyboard.press('Space');
  await expect(page.locator('#stage')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#start-button')).toBeDisabled();
  await expect(page.locator('#status-message')).toContainText('required asset');
  await page.keyboard.press('r');
  await expect(page.locator('#stage')).toHaveAttribute('data-state', 'error');
});

test('physical inspection presets gather fabric and reset exactly', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#stage')).toHaveAttribute('data-state', 'ready');
  const snapshot = () => page.locator('.fabric-pleat, .fold-shadow, .fold-highlight, .central-seam-glow, .seam-halo, .screen-spill, .atmosphere, .inauguration-pulse, .seam-energy-travel, .interaction').evaluateAll(nodes => nodes.map(node => ({ transform: getComputedStyle(node).transform, opacity: getComputedStyle(node).opacity, visibility: getComputedStyle(node).visibility })));
  const initial = await snapshot();
  await page.keyboard.press('Digit3');
  expect(await snapshot()).toEqual(initial);
  await page.keyboard.press('d');
  for (const [key, opening] of [['Digit2', 0.25], ['Digit3', 0.5], ['Digit4', 0.75], ['Digit5', 1]]) {
    await page.keyboard.press(key);
    const scale = await page.locator('.curtain-left .fabric-hem').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m11);
    expect(scale).toBeCloseTo(1 - opening * 0.77, 2);
    const paused = await snapshot();
    await page.waitForTimeout(100);
    expect(await snapshot()).toEqual(paused);
    await page.keyboard.press('r');
    expect(await snapshot()).toEqual(initial);
  }
  await page.getByRole('button', { name: '3 · 50% open' }).click();
  await page.keyboard.press('Space');
  await expect(page.locator('#stage')).toHaveAttribute('data-state', 'complete', { timeout: 25000 });
  await page.keyboard.press('r');
  expect(await snapshot()).toEqual(initial);
});

test('presentation mode blocks accidental UI and restores the cursor on reset', async ({ page }) => {
  await page.goto('/?presentation=true');
  await expect(page.locator('#stage')).toHaveAttribute('data-state', 'ready');
  await page.keyboard.press('d');
  await expect(page.locator('#debug')).toBeHidden();
  await page.keyboard.press('Space');
  await expect(page.locator('#stage')).toHaveAttribute('data-state', 'ready');
  expect(await page.locator('#app').evaluate(root => ['contextmenu', 'dragstart', 'selectstart'].every(type => !root.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }))))).toBe(true);
  await expect(page.locator('#app')).toHaveCSS('user-select', 'none');
  await page.keyboard.press('PageDown');
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await page.locator('#start-button').click();
  await expect(page.locator('#app')).toHaveCSS('cursor', 'none');
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.evaluate(() => window.dispatchEvent(new Event('orientationchange')));
  await expect(page.locator('#stage')).toHaveAttribute('data-state', 'complete', { timeout: 25000 });
  await expect(page.locator('#app')).toHaveCSS('cursor', 'none');
  await page.keyboard.press('r');
  await expect(page.locator('#app')).not.toHaveCSS('cursor', 'none');
  await expect(page.locator('#stage')).toHaveAttribute('data-state', 'ready');
});

test('fullscreen uses the cinematic root and debug restores the cursor', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#stage')).toHaveAttribute('data-state', 'ready');
  await page.keyboard.press('f');
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id)).toBe('app');
  await page.locator('#start-button').click();
  await expect(page.locator('#app')).toHaveCSS('cursor', 'none');
  await page.keyboard.press('d');
  await expect(page.locator('#debug')).toBeVisible();
  await expect(page.locator('#app')).not.toHaveCSS('cursor', 'none');
  await page.keyboard.press('d');
  await expect(page.locator('#app')).toHaveCSS('cursor', 'none');
  await page.evaluate(() => document.exitFullscreen());
  await page.keyboard.press('r');
  await expect(page.locator('#app')).not.toHaveCSS('cursor', 'none');
});

test('effects share design coordinates and cap HiDPI drawing buffers', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 3840, height: 2160 }, deviceScaleFactor: 3 });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:5173');
  await expect(page.locator('#stage')).toHaveAttribute('data-state', 'ready', { timeout: 30000 });
  const result = await page.evaluate(async () => {
    const { createStageViewport } = await import('/src/core/stage.js');
    const { createEffects } = await import('/src/animation/effects.js');
    const viewport = createStageViewport(document.querySelector('#app'), document.querySelector('#stage'));
    const effects = createEffects(document.createElement('canvas'), viewport);
    const renderer = effects.initialize();
    if (!renderer) throw new Error('Test browser could not initialize WebGL');
    const buffer = [renderer.domElement.width, renderer.domElement.height];
    const result = { buffer, aspect: effects.camera.aspect, ratio: renderer.getPixelRatio(), cappedDpr: viewport.metrics.devicePixelRatio };
    effects.dispose(); viewport.dispose();
    return result;
  });
  expect(result).toEqual({ buffer: [3840, 2160], aspect: 16 / 9, ratio: 2, cappedDpr: 2 });
  await context.close();
});
