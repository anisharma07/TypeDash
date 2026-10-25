import { test, expect } from './fixtures';
import { game, joinAsNew } from './helpers';
import { BoyNames, GirlNames } from '../src/data/names';

const checkedShip = (page: import('@playwright/test').Page) =>
  page.$$eval('.avatar-select-input', (inputs) => inputs.findIndex((i) => (i as HTMLInputElement).checked));

test.describe('home page', () => {
  test('shows the landing page with every ship and the name field focused', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page).toHaveTitle(/TypeDash/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Race your friends, word by word.');
    await expect(page.locator('.avatars-select-image')).toHaveCount(15);
    expect(await checkedShip(page)).toBeGreaterThanOrEqual(0);
    await expect(page.locator('#username')).toBeFocused();
    await expect(page.locator('.current-year')).toHaveText(String(new Date().getFullYear()));
    await expect(page.locator('.players-online-count')).toHaveText('0');
    await expect(page.locator('.players-online')).toHaveAttribute('title', '0 players online');
  });

  test('the online count follows players joining and leaving', async ({ page, newPlayerPage }) => {
    await page.goto('/index.html');
    await expect(page.locator('.players-online-count')).toHaveText('0');

    const nova = await newPlayerPage();
    await joinAsNew(nova, { name: 'Nova' });
    await expect(page.locator('.players-online-count')).toHaveText('1');
    await expect(page.locator('.players-online')).toHaveAttribute('title', '1 player online');

    const orion = await newPlayerPage();
    await joinAsNew(orion, { name: 'Orion' });
    await expect(page.locator('.players-online-count')).toHaveText('2');
    await expect(game(nova).onlineCount).toHaveText('2');

    await orion.close();
    await expect(page.locator('.players-online-count')).toHaveText('1');
    await expect(game(nova).onlineCount).toHaveText('1');
  });

  test('a home page visitor is not counted as a player', async ({ page, newPlayerPage }) => {
    await page.goto('/index.html');
    const other = await newPlayerPage();
    await other.goto('/index.html');
    await expect(other.locator('.players-online-count')).toHaveText('0');
    await expect(page.locator('.players-online-count')).toHaveText('0');
  });

  test('clicking a ship selects it', async ({ page }) => {
    await page.goto('/index.html');
    for (const index of [0, 7, 14]) {
      await page.locator('.avatars-select-image').nth(index).click();
      expect(await checkedShip(page)).toBe(index);
    }
  });

  test('arrow keys move through the ships and wrap around', async ({ page }) => {
    await page.goto('/index.html');
    await page.locator('.avatars-select-image').nth(0).click();
    await page.locator('#username').focus();

    await page.keyboard.press('ArrowLeft');
    expect(await checkedShip(page)).toBe(14);
    await page.keyboard.press('ArrowRight');
    expect(await checkedShip(page)).toBe(0);
    await page.keyboard.press('ArrowRight');
    expect(await checkedShip(page)).toBe(1);
    await page.keyboard.press('ArrowDown');
    expect(await checkedShip(page)).toBe(8);
    await page.keyboard.press('ArrowDown'); // already on the second row: stays
    expect(await checkedShip(page)).toBe(8);
    await page.keyboard.press('ArrowUp');
    expect(await checkedShip(page)).toBe(1);
    await page.keyboard.press('ArrowUp'); // already on the first row: stays
    expect(await checkedShip(page)).toBe(1);
  });

  test('the dice and Alt roll a name from the boy list, or the girl list when switched', async ({ page }) => {
    await page.goto('/index.html');
    const name = page.locator('#username');
    const girls = page.locator('#name-toggler');

    await page.getByRole('button', { name: 'Roll a random name' }).click();
    expect(BoyNames).toContain(await name.inputValue());
    await expect(name).toBeFocused();

    await page.keyboard.press('Alt');
    expect(BoyNames).toContain(await name.inputValue());

    await page.locator('.switch-row.name-list').click();
    await expect(girls).toBeChecked();
    for (let i = 0; i < 5; i++) {
      await page.getByRole('button', { name: 'Roll a random name' }).click();
      expect(GirlNames).toContain(await name.inputValue());
    }

    await page.keyboard.press('Control');
    await expect(girls).not.toBeChecked();
    await page.keyboard.press('Control');
    await expect(girls).toBeChecked();
  });

  test('names stop at 10 characters and say so', async ({ page }) => {
    await page.goto('/index.html');
    const warning = page.locator('.max-char-warning');
    await expect(warning).toBeHidden();
    await page.locator('#username').pressSequentially('Supercalifragilistic');
    await expect(page.locator('#username')).toHaveValue('Supercalif');
    await expect(warning).toBeVisible();
    await expect(warning).toHaveText('10 characters at most');
    await page.locator('#username').press('Backspace');
    await expect(warning).toBeHidden();
  });

  test('joining needs a name of at least 3 characters', async ({ page }) => {
    await page.goto('/index.html');
    await page.locator('.submitBtn').click();
    await expect(page).toHaveURL(/index\.html$/);
    expect(await page.locator('#username').evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);

    await page.locator('#username').fill('Al');
    await page.locator('.submitBtn').click();
    await expect(page).toHaveURL(/index\.html$/);
    expect(await page.locator('#username').evaluate((el: HTMLInputElement) => el.validity.tooShort)).toBe(true);
  });

  test('joining sends the ship, name and device, and the game page uses them', async ({ page }) => {
    await page.goto('/index.html');
    await page.locator('.avatars-select-image').nth(4).click();
    await page.locator('#username').fill('Nova');
    await page.locator('#username').press('Enter');
    await page.waitForURL(/multiplayer\.html/);

    const params = new URL(page.url()).searchParams;
    expect(params.get('username')).toBe('Nova');
    expect(params.get('image')).toBe('avatar5');
    expect(params.get('Device')).toBe('laptop');
    expect(params.get('identity')).toBe('none');

    const g = game(page);
    await expect(g.username).toHaveText('Nova');
    await expect(g.playerId).toHaveText(/^\d{6}$/);
    await expect(g.selfLane.locator('.user-avatar')).toHaveAttribute('src', '/images/avatars/avatar5.png');
  });

  test('a phone joins as a mobile player', async ({ newPlayerPage }) => {
    const phone = await newPlayerPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await phone.goto('/index.html');
    await phone.locator('#username').fill('Pocket');
    await phone.locator('.submitBtn').tap();
    await phone.waitForURL(/multiplayer\.html/);
    expect(new URL(phone.url()).searchParams.get('Device')).toBe('mobile');
  });

  test('backtick jumps to the Player ID box, which only takes a 6-digit ID', async ({ page }) => {
    await page.goto('/index.html');
    await page.keyboard.press('`');
    const idBox = page.locator('#user-join-id');
    await expect(idBox).toBeFocused();

    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/index\.html$/);

    for (const bad of ['12345', '1234567']) {
      await idBox.fill(bad);
      await page.getByRole('button', { name: 'Log in' }).click();
      await expect(page).toHaveURL(/index\.html$/);
      expect(await idBox.evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(false);
    }

    await idBox.fill('123456');
    await idBox.press('Enter');
    await page.waitForURL(/multiplayer\.html\?join-id=123456/);
  });

  test('markup in a name is shown as plain text everywhere', async ({ page, newPlayerPage }) => {
    const name = '<i>hi</i>';
    await joinAsNew(page, { name });
    await expect(game(page).username).toHaveText(name);
    await expect(page.locator('.current-user-username i')).toHaveCount(0);

    const other = await newPlayerPage();
    await joinAsNew(other, { name: 'Orion' });
    await expect(game(other).lane(name)).toHaveCount(1);
    await expect(other.locator('.player-name i')).toHaveCount(0);
  });
});
