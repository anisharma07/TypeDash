import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';
import { game, joinAsNew } from './helpers';
import { THEMES } from '../src/theme/theme';

const dialog = (page: Page) => page.getByRole('dialog', { name: 'Settings' });
const htmlTheme = (page: Page) => page.evaluate(() => document.documentElement.dataset.theme);

async function openSettings(page: Page) {
  await page.locator('.settings-button').click();
  await expect(dialog(page)).toBeVisible();
}

test.describe('settings dialog', () => {
  test('opens from the top bar, focuses the chosen theme, and Esc closes it', async ({ page }) => {
    await page.goto('/index.html');
    await openSettings(page);
    await expect(dialog(page).locator('input[name="theme"]:checked')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeHidden();
    await expect(page.locator('.settings-button')).toBeFocused();
  });

  test('the close button and a click outside close it; a click inside does not', async ({ page }) => {
    await page.goto('/index.html');
    await openSettings(page);
    await dialog(page).getByRole('heading', { name: 'Settings' }).click();
    await expect(dialog(page)).toBeVisible();
    await page.getByRole('button', { name: 'Close settings' }).click();
    await expect(dialog(page)).toBeHidden();

    await openSettings(page);
    await page.mouse.click(10, 10); // the backdrop
    await expect(dialog(page)).toBeHidden();
  });

  test('Tab keeps focus inside the dialog', async ({ page }) => {
    await page.goto('/index.html');
    await openSettings(page);
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      expect(await dialog(page).evaluate((el) => el.contains(document.activeElement))).toBe(true);
    }
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Shift+Tab');
      expect(await dialog(page).evaluate((el) => el.contains(document.activeElement))).toBe(true);
    }
  });

  test('lists every theme and filters dark and light ones', async ({ page }) => {
    await page.goto('/index.html');
    await openSettings(page);
    const options = dialog(page).locator('.theme-option');
    const filter = (name: string) => dialog(page).getByRole('group', { name: 'Show themes' }).getByRole('button', { name });

    await expect(options).toHaveCount(THEMES.length);
    await filter('Dark').click();
    await expect(filter('Dark')).toHaveAttribute('aria-pressed', 'true');
    await expect(options).toHaveCount(THEMES.filter((t) => t.scheme === 'dark').length);
    await expect(options.locator('.theme-option-meta', { hasText: 'Light' })).toHaveCount(0);

    await filter('Light').click();
    await expect(options).toHaveCount(THEMES.filter((t) => t.scheme === 'light').length);
    await expect(options.locator('.theme-option-meta', { hasText: 'Dark' })).toHaveCount(0);

    await filter('All').click();
    await expect(options).toHaveCount(THEMES.length);
  });

  test('a picked theme applies at once, survives a reload and carries over to the game', async ({ page }) => {
    await page.goto('/index.html');
    expect(await htmlTheme(page)).toBe('dash');
    const before = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

    await openSettings(page);
    await dialog(page).locator('.theme-option', { hasText: 'Almanac' }).click();
    expect(await htmlTheme(page)).toBe('almanac');
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).not.toBe(before);

    await page.reload();
    expect(await htmlTheme(page)).toBe('almanac');

    await joinAsNew(page, { name: 'Nova' });
    expect(await htmlTheme(page)).toBe('almanac');
    await openSettings(page);
    await expect(dialog(page).locator('input[value="almanac"]')).toBeChecked();
  });

  test('arrow keys move through the themes', async ({ page }) => {
    await page.goto('/index.html');
    await openSettings(page);
    await page.keyboard.press('ArrowRight');
    expect(await htmlTheme(page)).toBe(THEMES[1]!.slug);
    await page.keyboard.press('ArrowLeft');
    expect(await htmlTheme(page)).toBe(THEMES[0]!.slug);
  });

  test('a theme change in one tab reaches the other open tabs', async ({ page, context }) => {
    await page.goto('/index.html');
    const second = await context.newPage();
    await second.goto('/index.html');

    await openSettings(page);
    await dialog(page).locator('.theme-option', { hasText: 'Terminal' }).click();
    await expect.poll(() => htmlTheme(second)).toBe('terminal');
  });

  test('the starfield can be switched off and stays off', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('canvas')).toHaveCount(1);
    await openSettings(page);
    const starfield = dialog(page).getByRole('switch');
    await expect(starfield).toBeChecked();
    await starfield.click({ force: true });
    await expect(starfield).not.toBeChecked();
    await expect(page.locator('canvas')).toHaveCount(0);

    await page.reload();
    await expect(page.locator('canvas')).toHaveCount(0);
    await openSettings(page);
    await dialog(page).getByRole('switch').click({ force: true });
    await expect(page.locator('canvas')).toHaveCount(1);
  });

  test('an unknown saved theme falls back to the default', async ({ newPlayerPage }) => {
    const page = await newPlayerPage({ storage: { 'typedash:theme': 'no-such-theme' } });
    await page.goto('/index.html');
    await expect.poll(() => htmlTheme(page)).toBe('dash');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('keys pressed in the dialog never reach the game behind it', async ({ page }) => {
    let confirmAsked = false;
    page.on('dialog', (d) => {
      confirmAsked = true;
      void d.dismiss();
    });
    await joinAsNew(page, { name: 'Nova' });
    const g = game(page);
    await openSettings(page);

    await page.keyboard.press('Enter');
    await page.keyboard.press('`');
    await page.keyboard.press('Alt');
    await page.keyboard.press('Escape'); // closes the dialog only
    await expect(dialog(page)).toBeHidden();

    expect(confirmAsked).toBe(false);
    await expect(g.ready).toHaveText('Get Ready');
    await expect(g.leaderboard).toBeVisible();
    await expect(g.difficulty).toHaveValue('easy');
  });
});

test.describe('theme applied before the app loads', () => {
  test.use({ ignoreConsole: [/Failed to load resource/] });

  test('the saved theme is set by the inline script, even without the app script', async ({ newPlayerPage }) => {
    const page = await newPlayerPage({ storage: { 'typedash:theme': 'riso' } });
    await page.route(/\/assets\/.*\.js$/, (route) => route.abort());
    await page.goto('/index.html');
    expect(await htmlTheme(page)).toBe('riso');
  });
});
