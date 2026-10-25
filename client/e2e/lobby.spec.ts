import { test, expect } from './fixtures';
import { STATUS_NOT_READY, STATUS_READY, game, joinAsNew, joinById, playersOnline, waitForLobby } from './helpers';

test.describe('game lobby', () => {
  test('a new player gets a Player ID, a lane and the leaderboard', async ({ page }) => {
    await joinAsNew(page, { name: 'Nova', avatar: 2 });
    const g = game(page);
    await expect(g.username).toHaveText('Nova');
    await expect(g.lanes).toHaveCount(1);
    await expect(g.selfLane.locator('.player-name')).toHaveText('YOU');
    await expect(g.selfLane.locator('.user-avatar')).toHaveAttribute('src', '/images/avatars/avatar3.png');
    await expect(g.selfLane.locator('.user-curr-wpm')).toHaveText('0 wpm');
    await expect(g.onlineCount).toHaveText('1');
    await expect(g.leaderboard).toBeVisible();
    await expect(page.locator('.player-rankings-easy .rank-empty')).toHaveText(/No scores yet/);
    await expect(g.ready).toHaveText('Get Ready');
    await expect(g.leaveMatch).toBeHidden();
    await expect(g.stopwatch).toHaveText('00:00');
  });

  test('the leaderboard opens and closes by button, backtick and close icon', async ({ page }) => {
    await joinAsNew(page, { name: 'Nova' });
    const g = game(page);
    await g.leaderboardButton.click();
    await expect(g.leaderboard).toBeHidden();
    await g.leaderboardButton.click();
    await expect(g.leaderboard).toBeVisible();
    await page.keyboard.press('`');
    await expect(g.leaderboard).toBeHidden();
    await page.keyboard.press('`');
    await expect(g.leaderboard).toBeVisible();
    await page.getByRole('button', { name: 'Close leaderboard' }).click();
    await expect(g.leaderboard).toBeHidden();
  });

  test('Tab and the tabs switch the leaderboard level; Ctrl and the icon refresh it', async ({ page }) => {
    await joinAsNew(page, { name: 'Nova' });
    const g = game(page);
    await expect(g.easyTab).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Tab');
    await expect(g.mediumTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.player-rankings-medium')).toBeVisible();
    await expect(page.locator('.player-rankings-easy')).toBeHidden();
    await g.easyTab.click();
    await expect(g.easyTab).toHaveAttribute('aria-selected', 'true');

    let request = page.waitForRequest('**/get-users-leaderboard');
    await page.keyboard.press('Control');
    await request;
    request = page.waitForRequest('**/get-users-leaderboard');
    await page.getByRole('button', { name: 'Refresh leaderboard' }).click();
    await request;
  });

  test('players see each other arrive and leave', async ({ page, newPlayerPage }) => {
    await joinAsNew(page, { name: 'Nova' });
    const orion = await newPlayerPage();
    await joinAsNew(orion, { name: 'Orion', avatar: 0 });

    await waitForLobby([page, orion]);
    await expect(game(page).lane('Orion')).toHaveCount(1);
    await expect(game(page).lane('Orion').locator('.user-avatar')).toHaveAttribute('src', '/images/avatars/avatar1.png');
    await expect(game(orion).lane('Nova')).toHaveCount(1);
    await expect(game(page).onlineCount).toHaveText('2');
    // the current player's lane always comes first
    await expect(game(page).lanes.first().locator('.player-name')).toHaveText('YOU');
    await expect(game(orion).lanes.first().locator('.player-name')).toHaveText('YOU');

    await orion.close();
    await expect(game(page).lanes).toHaveCount(1);
    await expect(game(page).onlineCount).toHaveText('1');
  });

  test('getting ready alone asks for one more player, then the notice goes away', async ({ page }) => {
    await joinAsNew(page, { name: 'Nova' });
    const g = game(page);
    await g.ready.click();
    await expect(g.ready).toHaveText('Ready');
    await expect(g.insufficient).toBeVisible();
    await expect(g.insufficient).toHaveText('Invite one more player to start');
    await expect(g.insufficient).toBeHidden({ timeout: 7000 });
  });

  test('Enter toggles ready, and the other player sees the status light change', async ({ page, newPlayerPage }) => {
    await joinAsNew(page, { name: 'Nova' });
    const orion = await newPlayerPage();
    await joinAsNew(orion, { name: 'Orion' });
    await waitForLobby([page, orion]);
    const novaAsSeenByOrion = game(orion).lane('Nova').locator('.status-circle');

    await page.keyboard.press('Enter');
    await expect(game(page).ready).toHaveText('Ready');
    await expect(game(page).leaderboard).toBeHidden();
    await expect(novaAsSeenByOrion).toHaveCSS('background-color', STATUS_READY);

    await page.keyboard.press('Enter');
    await expect(game(page).ready).toHaveText('Get Ready');
    await expect(game(page).leaderboard).toBeVisible();
    await expect(novaAsSeenByOrion).toHaveCSS('background-color', STATUS_NOT_READY);
  });

  test('Alt and the select change the level', async ({ page }) => {
    await joinAsNew(page, { name: 'Nova' });
    const g = game(page);
    await expect(g.difficulty).toHaveValue('easy');
    await page.keyboard.press('Alt');
    await expect(g.difficulty).toHaveValue('medium');
    await page.keyboard.press('Alt');
    await expect(g.difficulty).toHaveValue('easy');
    await g.difficulty.selectOption('medium');
    await expect(g.difficulty).toHaveValue('medium');
  });

  test('leaving asks first: cancel stays, OK goes home', async ({ page }) => {
    await joinAsNew(page, { name: 'Nova' });
    const g = game(page);

    page.once('dialog', (d) => {
      expect(d.message()).toBe('Are you sure you want to leave the game?');
      void d.dismiss();
    });
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/multiplayer\.html/);

    page.once('dialog', (d) => void d.dismiss());
    await g.leaveButton.click();
    await expect(page).toHaveURL(/multiplayer\.html/);

    page.once('dialog', (d) => void d.accept());
    await g.leaveButton.click();
    await page.waitForURL(/\/index\.html$/);
    await expect(page.locator('.players-online-count')).toHaveText('0');
  });

  test('a returning player logs in with their Player ID', async ({ page, newPlayerPage }) => {
    const id = await joinAsNew(page, { name: 'Vega', avatar: 11 });
    await page.close();

    const later = await newPlayerPage();
    await joinById(later, id);
    const g = game(later);
    await expect(g.username).toHaveText('Vega');
    await expect(g.playerId).toHaveText(id);
    await expect(g.selfLane.locator('.user-avatar')).toHaveAttribute('src', '/images/avatars/avatar12.png');
  });

  test('an unknown Player ID shows a notice, and Esc goes back home', async ({ page }) => {
    await joinById(page, '999999');
    await expect(game(page).wrongId).toBeVisible();
    await expect(game(page).wrongId).toContainText('That Player ID does not exist');
    page.once('dialog', (d) => void d.accept());
    await page.keyboard.press('Escape');
    await page.waitForURL(/\/index\.html$/);
  });

  test('a malformed Player ID in the address never reaches the server', async ({ page, server }) => {
    for (const bad of ['abc', '-1', '1e5', '12.5', '%3Cscript%3E']) {
      await page.goto(`/multiplayer.html?join-id=${bad}`);
      await expect(game(page).wrongId).toBeVisible();
    }
    expect(await playersOnline(server.url)).toBe(0);
  });

  test('opening the game page with no details still joins safely', async ({ page }) => {
    await page.goto('/multiplayer.html');
    const g = game(page);
    await expect(g.playerId).toHaveText(/^\d{6}$/);
    await expect(g.selfLane.locator('.user-avatar')).toHaveAttribute('src', '/images/avatars/avatar1.png');
    await expect(g.onlineCount).toHaveText('1');
  });

  test('an address with a made-up ship falls back to a real one', async ({ page, newPlayerPage }) => {
    await page.goto('/multiplayer.html?image=../../etc/passwd&username=Hacker&Device=laptop&identity=none');
    await expect(game(page).playerId).toHaveText(/^\d{6}$/);
    const other = await newPlayerPage();
    await joinAsNew(other, { name: 'Orion' });
    await expect(game(other).lane('Hacker').locator('.user-avatar')).toHaveAttribute('src', '/images/avatars/avatar1.png');
  });
});
