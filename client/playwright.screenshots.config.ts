import { defineConfig } from '@playwright/test';
import base from './playwright.config';

/** Regenerates the README screenshots in docs/screenshots: `npm run screenshots` (needs internet for the fonts). */
export default defineConfig({
  ...base,
  testDir: './e2e/screenshots',
  testMatch: /.*\.shots\.ts/,
  fullyParallel: false,
  retries: 0,
  timeout: 180_000,
  projects: [{ name: 'screenshots', use: { ...base.use, viewport: { width: 1440, height: 900 } } }],
});
