import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';
import { THEMES } from '../src/theme/theme';

/**
 * Every theme on both pages: it applies, nothing errors, nothing spills sideways, and the main text is
 * readable (WCAG contrast against the page background).
 */

function contrastOf(page: Page, selector: string): Promise<number> {
  return page.evaluate((sel) => {
    const parse = (c: string): number[] => {
      const ctx = document.createElement('canvas').getContext('2d')!;
      ctx.fillStyle = c; // normalises oklch(), color-mix() and friends to rgb / hex
      ctx.fillRect(0, 0, 1, 1);
      return Array.from(ctx.getImageData(0, 0, 1, 1).data);
    };
    const lum = ([r, g, b]: number[]) => {
      const f = (v: number) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!);
    };
    // the nearest ancestor with an opaque background is what the text sits on
    const el = document.querySelector(sel)!;
    let bgEl: Element | null = el;
    let bg = 'rgba(0, 0, 0, 0)';
    while (bgEl) {
      const c = getComputedStyle(bgEl).backgroundColor;
      if (parse(c)[3] === 255) {
        bg = c;
        break;
      }
      bgEl = bgEl.parentElement;
    }
    if (!bgEl) bg = getComputedStyle(document.documentElement).backgroundColor;
    const a = lum(parse(getComputedStyle(el).color));
    const b = lum(parse(bg));
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  }, selector);
}

async function noSidewaysScroll(page: Page): Promise<void> {
  const { scroll, client } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(scroll, 'page scrolls sideways').toBeLessThanOrEqual(client);
}

for (const theme of THEMES) {
  test(`theme "${theme.name}" renders both pages cleanly`, async ({ newPlayerPage }) => {
    const page = await newPlayerPage({ storage: { 'typedash:theme': theme.slug, 'typedash:starfield': 'off' } });

    await page.goto('/index.html');
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe(theme.slug);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await noSidewaysScroll(page);
    expect(await contrastOf(page, '#home-title'), 'headline contrast').toBeGreaterThanOrEqual(3);
    expect(await contrastOf(page, '.lede'), 'body text contrast').toBeGreaterThanOrEqual(4.5);

    await page.locator('#username').fill('Nova');
    await page.locator('.submitBtn').click();
    await page.waitForURL(/multiplayer\.html/);
    await expect(page.locator('.curr-user-id')).toHaveText(/^\d{6}$/);
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(theme.slug);
    await noSidewaysScroll(page);
    expect(await contrastOf(page, '#text-content'), 'race text contrast').toBeGreaterThanOrEqual(4.5);
  });
}
