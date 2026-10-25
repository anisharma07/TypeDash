import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end UI tests: the real server (app.js) with an in-memory database, driven through real browsers.
 * Every test starts its own server on a free port (see e2e/fixtures.ts), so tests run in parallel without
 * sharing a lobby. Run from client/: `npm run e2e` (see e2e/README.md).
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Races run on real timers (10 s countdown, 60 s rounds), so give tests room.
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Set PW_CHROMIUM_PATH to use an installed Chromium-based browser instead of Playwright's own build.
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
});
