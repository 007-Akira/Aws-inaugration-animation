import { test, expect } from '@playwright/test';
import { entryDuration, entryTravel, entryEase, actTwoTiming, cameraDistance, universeConfig } from '../src/config/actTwo';

test('one persistent void continues from the curtain opening into the technology scene', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/');
  await expect(page.locator('#stage')).toHaveAttribute('data-state', 'ready', { timeout: 30000 });
  await page.evaluate(() => { window.originalEffectsCanvas = document.querySelector('#effects-canvas'); });
  await expect(page.locator('.effects')).toHaveCSS('opacity', '1');
  await page.keyboard.press('d');
  await page.keyboard.press('Digit5');
  await expect(page.locator('#theatre')).toBeVisible();
  await expect(page.locator('.cinema-screen')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await page.locator('[data-act-two="VOID_BRIDGE"]').click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'VOID_BRIDGE');
  await expect(page.locator('#theatre')).toBeHidden();
  await expect.poll(async () => Number(await page.locator('#debug-camera').textContent())).toBeCloseTo(-entryTravel * entryEase((entryDuration - actTwoTiming.darknessDuration / 2) / entryDuration), 0);
  await expect(page.locator('.effects')).toHaveCSS('opacity', '1');
  await page.locator('[data-act-two="FLYTHROUGH_MID"]').click();
  await expect.poll(async () => Number(await page.locator('#debug-camera').textContent())).toBeLessThan(-100);
  expect(await page.evaluate(() => document.querySelector('#effects-canvas') === window.originalEffectsCanvas)).toBe(true);
  await page.keyboard.press('r');
  await expect(page.locator('#theatre')).toBeVisible();
  await expect(page.locator('.inauguration-pulse')).toHaveCSS('opacity', '0');
  await expect(page.locator('.seam-energy-travel')).toHaveCSS('opacity', '0');
  await expect(page.locator('.effects')).toHaveCSS('opacity', '1');
  expect(errors).toEqual([]);
});


test('camera velocity joins entry and flythrough without a pause or jump', () => {
  const h = 0.0001;
  const before = entryTravel * (entryEase(1) - entryEase(1 - h / entryDuration)) / h;
  const after = cameraDistance(h) / h;
  expect(before).toBeCloseTo(universeConfig.cameraStartSpeed, 4);
  expect(after).toBeCloseTo(before, 4);
  expect(entryEase(h / entryDuration) * entryTravel / h).toBeLessThan(0.001);
});
