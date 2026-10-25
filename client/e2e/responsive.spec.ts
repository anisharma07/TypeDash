import { test, expect } from './fixtures';
import type { Locator, Page } from '@playwright/test';
import { game, joinAsNew, raceText, startRace, typeInRace } from './helpers';

// Real fonts: whether a row fits depends on the width of the text. Offline, the fonts fail to load (ignored here).
test.use({ realFonts: true, ignoreConsole: [/Failed to load resource|ERR_INTERNET_DISCONNECTED|ERR_NAME_NOT_RESOLVED/] });

/** Phone, small tablet, tablet, laptop and desktop widths. */
const WIDTHS = [320, 390, 768, 1024, 1440];

/** Nothing may stick out sideways: no page scroll, and no visible element past the right edge. */
async function fitsWidth(page: Page): Promise<void> {
  const result = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const outside: string[] = [];
    for (const el of document.querySelectorAll('body *')) {
      if (el.closest('.hidden, [hidden]') || el.tagName === 'CANVAS') continue;
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.position === 'fixed') continue;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.right > vw + 1) outside.push(`${el.tagName.toLowerCase()}.${el.className} (right ${Math.round(r.right)})`);
    }
    return { scroll: document.documentElement.scrollWidth, vw, outside: outside.slice(0, 5) };
  });
  expect(result.outside, `elements past the right edge at ${result.vw}px`).toEqual([]);
  expect(result.scroll).toBeLessThanOrEqual(result.vw);
}

/** The control is on screen and big enough to hit. */
async function reachable(control: Locator): Promise<void> {
  await expect(control).toBeInViewport();
  const box = (await control.boundingBox())!;
  expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(24);
}

for (const width of WIDTHS) {
  const size = { width, height: width < 500 ? 844 : 900 };
  const mobile = width < 500 ? { isMobile: true, hasTouch: true } : {};

  test.describe(`at ${width}px`, () => {
    test('the home page fits and its controls are reachable', async ({ newPlayerPage }) => {
      const page = await newPlayerPage({ viewport: size, ...mobile });
      await page.goto('/index.html');
      await page.evaluate(() => document.fonts.ready);
      await fitsWidth(page);
      await reachable(page.locator('.settings-button'));
      await page.locator('#username').scrollIntoViewIfNeeded();
      await reachable(page.locator('#username'));
      await reachable(page.getByRole('button', { name: 'Roll a random name' }));
      await page.locator('.submitBtn').scrollIntoViewIfNeeded();
      await reachable(page.locator('.submitBtn'));
    });

    test('the game page fits in the lobby and in a race, with Leave always on screen', async ({ newPlayerPage }) => {
      const page = await newPlayerPage({ viewport: size, ...mobile });
      await joinAsNew(page, { name: 'Maximilian' });
      await page.evaluate(() => document.fonts.ready);
      await fitsWidth(page);
      const g = game(page);
      await reachable(g.leaveButton);
      await reachable(g.settingsButton);
      await reachable(g.ready);
      // the lobby hint is never clipped
      expect(await page.locator('.text-content-div').evaluate((el) => el.scrollHeight <= el.clientHeight)).toBe(true);

      const other = await newPlayerPage();
      await joinAsNew(other, { name: 'Orion' });
      await startRace([page, other]);
      await fitsWidth(page);
      await reachable(g.leaveMatch);
      await typeInRace(page, (await raceText(page)).split(' ').slice(0, 3).join(' '));
      await expect(page.locator('#text-content .correctText').first()).toBeInViewport();
    });

    test('the settings dialog fits', async ({ newPlayerPage }) => {
      const page = await newPlayerPage({ viewport: size, ...mobile });
      await page.goto('/index.html');
      await page.locator('.settings-button').click();
      const dialog = page.getByRole('dialog', { name: 'Settings' });
      await expect(dialog).toBeVisible();
      const box = (await dialog.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      await reachable(page.getByRole('button', { name: 'Close settings' }));
    });
  });
}
