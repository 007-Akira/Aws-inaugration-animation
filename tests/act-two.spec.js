import { test, expect } from '@playwright/test';

test('Act II has actual Z travel, silent checkpoints and complete reset', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page.locator('#stage')).toHaveAttribute('data-state', 'ready', { timeout: 30000 });
  await page.evaluate(() => { window.revealEvents = 0; document.addEventListener('FINAL_REVEAL_START', () => window.revealEvents++); });
  await page.keyboard.press('d');
  let lastZ = 0;
  for (const label of ['FLYTHROUGH_START', 'FLYTHROUGH_MID', 'FLYTHROUGH_FAST', 'CLIMAX']) {
    await page.locator(`[data-act-two="${label}"]`).click();
    await expect.poll(async () => Number(await page.locator('#debug-camera').textContent())).toBeLessThan(lastZ);
    const z = Number(await page.locator('#debug-camera').textContent());
    expect(z).toBeLessThan(lastZ); lastZ = z;
    await expect(page.locator('.effects')).toBeVisible();
    await expect(page.locator('#theatre')).toBeHidden();
    const calls = Number(await page.locator('#debug-draws').textContent());
    expect(calls).toBeGreaterThan(5); // Includes capped bloom passes and the glass transmission pass.
    expect(calls).toBeLessThan(200);
  }
  const speed = page.locator('[data-tune="cameraSpeed"]');
  await speed.fill('1.4'); await speed.dispatchEvent('input');
  await expect.poll(async () => Number(await page.locator('#debug-camera').textContent())).toBeLessThan(lastZ * 1.2);
  await speed.focus(); await page.keyboard.press('r');
  await expect(page.locator('#stage')).toHaveAttribute('data-state', 'ready');
  await expect(speed).toHaveValue('1');
  await expect(page.locator('.effects')).toBeVisible();
  expect(await page.locator('#theatre').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m11)).toBe(1);
  await page.locator('[data-act-two="FINAL_REVEAL_START"]').click();
  await expect(page.locator('#sequence-blackout')).toHaveCSS('opacity', '1');
  expect(await page.evaluate(() => window.revealEvents)).toBe(0);
  await page.keyboard.press('r');
  await expect(page.locator('#sequence-blackout')).toHaveCSS('opacity', '0');
  expect(errors).toEqual([]);
});

test('continuous entry finishes with one reveal event after 400ms black hold', async ({ page }) => {
  await page.goto('/?presentation=true');
  await expect(page.locator('#stage')).toHaveAttribute('data-state', 'ready', { timeout: 30000 });
  await page.evaluate(() => {
    window.revealTimes = []; window.blackStart = 0;
    new MutationObserver(() => {
      if (document.querySelector('#app').dataset.phase === 'BLACK_HOLD' && !window.blackStart) window.blackStart = performance.now();
    }).observe(document.querySelector('#app'), { attributes: true, attributeFilter: ['data-phase'] });
    document.addEventListener('FINAL_REVEAL_START', () => { window.blackAtCue = getComputedStyle(document.querySelector('#sequence-blackout')).opacity; window.revealTimes.push(performance.now()); });
  });
  await page.locator('#start-button').click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'CAMERA_ENTRY', { timeout: 10000 });
  await page.waitForTimeout(450);
  expect(await page.locator('#theatre').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m11)).toBeGreaterThan(1);
  await expect(page.locator('.effects')).toBeVisible();
  await expect(page.locator('#stage')).toHaveAttribute('data-state', 'complete', { timeout: 25000 });
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'FINAL_REVEAL_START');
  expect(await page.evaluate(() => window.blackAtCue)).toBe('1');
  await expect(page.locator('#sequence-blackout')).toHaveCSS('opacity', '0');
  await expect(page.locator('#final-announcement')).toHaveText('AWS Student Builder Group TKMCE', { timeout: 12000 });
  const event = await page.evaluate(() => ({ count: window.revealTimes.length, hold: window.revealTimes[0] - window.blackStart }));
  expect(event.count).toBe(1); expect(event.hold).toBeGreaterThanOrEqual(360);
  await page.mouse.click(960, 540);
  expect(await page.evaluate(() => window.revealTimes.length)).toBe(1);
  await page.keyboard.press('r');
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'CURTAIN');
  await expect(page.locator('#theatre')).toBeVisible();
  await expect(page.locator('.effects')).toBeVisible();
  // Abort a second real run during its black hold; no delayed cue may survive R.
  await page.evaluate(() => {
    const observer = new MutationObserver(() => {
      if (document.querySelector('#app').dataset.phase === 'BLACK_HOLD') {
        observer.disconnect();
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyR', bubbles: true }));
      }
    });
    observer.observe(document.querySelector('#app'), { attributes: true, attributeFilter: ['data-phase'] });
  });
  await page.locator('#start-button').click();
  await expect(page.locator('#stage')).toHaveAttribute('data-state', 'playing');
  await expect(page.locator('#stage')).toHaveAttribute('data-state', 'ready', { timeout: 25000 });
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.revealTimes.length)).toBe(1);
});
