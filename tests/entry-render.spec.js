import { test, expect } from '@playwright/test';

// CSS visibility alone cannot catch an invalid/black WebGL output frame.
test('camera entry keeps rendered scene pixels through the theatre handoff', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page.locator('#stage')).toHaveAttribute('data-state', 'ready', { timeout: 30000 });
  await page.keyboard.press('d');
  await page.locator('[data-act-two="CAMERA_ENTRY"]').click();
  const frames = await page.evaluate(async () => {
    // Import the same Vite-resolved GSAP instance used by the running timeline.
    const source = await (await fetch('/src/animation/timeline.js')).text();
    const { gsap } = await import(source.match(/from "([^"]*gsap[^"]*)"/)[1]);
    const timeline = gsap.globalTimeline.getChildren().find(item => item.labels?.FLYTHROUGH_START);
    const canvas = document.querySelector('#effects-canvas');
    const copy = document.createElement('canvas');
    copy.width = 320; copy.height = 180;
    const ctx = copy.getContext('2d', { willReadFrequently: true });
    return [3.6, 4.1, 4.6, 5.29, 5.31, 5.65, 6.5].map(time => {
      timeline.time(time, true);
      // Trigger a synchronous redraw, then read before WebGL clears its back buffer.
      document.querySelector('[data-tune="cameraSpeed"]').dispatchEvent(new Event('input', { bubbles: true }));
      ctx.drawImage(canvas, 0, 0, copy.width, copy.height);
      const pixels = ctx.getImageData(0, 0, copy.width, copy.height).data;
      let lit = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i] + pixels[i + 1] + pixels[i + 2] > 30) lit++;
      }
      return { time, lit, blackout: getComputedStyle(document.querySelector('#sequence-blackout')).opacity };
    });
  });
  for (const frame of frames) {
    expect(frame.lit, `Scene content at ${frame.time}s`).toBeGreaterThan(100);
    expect(frame.blackout).toBe('0');
  }
  expect(errors).toEqual([]);
});
