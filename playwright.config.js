import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  // Each test owns a WebGL context, sometimes at 4K; serialize GPU workloads.
  workers: 1,
  timeout: 60000,
  use: { baseURL: 'http://127.0.0.1:5173', viewport: { width: 1920, height: 1080 } },
  webServer: { command: 'npm run dev -- --host 127.0.0.1', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI },
});
