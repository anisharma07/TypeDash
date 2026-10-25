import { createRequire } from 'node:module';
import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';
import { REPO_ROOT } from './paths';
import {
  expectSummary,
  game,
  joinAsNew,
  raceText,
  startRace,
  typeInRace,
  waitForLobby,
} from './helpers';

const { quotes } = createRequire(import.meta.url)(`${REPO_ROOT}/utils/quotes.js`) as { quotes: string[] };

/** Two players in the lobby. */
async function twoPlayers(page: Page, newPlayerPage: () => Promise<Page>) {
  await joinAsNew(page, { name: 'Nova' });
  const orion = await newPlayerPage();
  await joinAsNew(orion, { name: 'Orion' });
  await waitForLobby([page, orion]);
  return [page, orion] as const;
}

const letters = (page: Page, word: number) => page.locator('#text-content .word').nth(word).locator('.letter');

/** How far along the track a lane's ship is, in % (its inline `left`). */
async function shipPosition(page: Page, name: string): Promise<number> {
  const style = (await game(page).lane(name).locator('.user-avatar').getAttribute('style')) ?? '';
  const match = /left:\s*([\d.]+)%/.exec(style);
  return match ? Number(match[1]) : 0;
}

test.describe('a race', () => {
  test('counts down, opens the text, and both players finish with a result', async ({ page, newPlayerPage }) => {
    const [nova, orion] = await twoPlayers(page, newPlayerPage);
    for (const p of [nova, orion]) await game(p).ready.click();

    const g = game(nova);
    await expect(g.countdown).toBeVisible();
    await expect(g.countdownNumber).toHaveText(/^\d+$/);
    await expect(g.input).toBeDisabled();
    await expect(g.leaveMatch).toBeVisible();
    await expect(g.ready).toBeHidden();
    await expect(g.leaderboard).toBeHidden();
    await expect(g.stopwatch).toHaveText('01:00');
    const text = await raceText(nova);
    expect(text.split(' ')).toHaveLength(33); // easy: 33 random words
    expect(await raceText(orion)).toBe(text); // everyone types the same text

    // keys typed before the start do nothing
    await nova.keyboard.type('zzz');
    await expect(nova.locator('#text-content .incorrectText')).toHaveCount(0);

    await expect(g.input).toBeEnabled({ timeout: 15_000 });
    await expect(g.goBanner).toBeVisible();
    await expect(g.stopwatch).toHaveText(/^00:5\d$/, { timeout: 3000 });

    await Promise.all([typeInRace(nova, text, 40), typeInRace(orion, text, 90)]);
    await expectSummary(nova);
    await expectSummary(orion);

    for (const p of [nova, orion]) {
      await expect(game(p).summaryAccuracy).toHaveText('100%');
      expect(Number(await game(p).summaryWpm.textContent())).toBeGreaterThan(0);
      await expect(game(p).ready).toHaveText('Get Ready');
      await expect(game(p).leaveMatch).toBeHidden();
      await expect(game(p).leaderboard).toBeVisible();
    }
    // the faster player is first on both screens
    await expect(game(nova).selfLane.locator('.user-rank-wpm')).toHaveText('1st');
    await expect(game(orion).lane('Nova').locator('.user-rank-wpm')).toHaveText('1st');
    await expect(game(orion).selfLane.locator('.user-rank-wpm')).toHaveText('2nd');

    // both scores reach the leaderboard, best first, the viewer's own row highlighted
    await expect(game(orion).easyRanks).toHaveCount(2);
    await expect(game(orion).easyRanks.first().locator('.rank-player-name')).toContainText('Nova');
    await expect(game(orion).easyRanks.nth(1)).toHaveClass(/me-rank-card/);
    await expect(game(orion).easyRanks.first().getByRole('img', { name: 'Laptop' })).toBeVisible();
  });

  test('letters turn right or wrong as you type; space waits for a correct word', async ({ page, newPlayerPage }) => {
    const [nova, orion] = await twoPlayers(page, newPlayerPage);
    await startRace([nova, orion]);
    const text = await raceText(nova);
    const [first, second] = text.split(' ') as [string, string];

    await typeInRace(nova, first[0]!);
    await expect(letters(nova, 0).first()).toHaveClass(/correctText/);

    const wrong = first[1] === 'q' ? 'z' : 'q';
    await nova.keyboard.type(wrong);
    await expect(letters(nova, 0).nth(1)).toHaveClass(/incorrectText/);

    // a space is ignored while the word has a mistake
    await nova.keyboard.press('Space');
    await expect(nova.locator('#text-content .word.current')).toHaveText(first);

    await nova.keyboard.press('Backspace');
    await expect(letters(nova, 0).nth(1)).not.toHaveClass(/incorrectText|correctText/);
    await nova.keyboard.type(first.slice(1));
    await expect(letters(nova, 0)).toHaveCount(first.length);

    // letters past the end of the word are marked as extra
    await nova.keyboard.type('xy');
    await expect(nova.locator('#text-content .word').first().locator('.extra')).toHaveCount(2);
    await nova.keyboard.press('Backspace');
    await nova.keyboard.press('Backspace');
    await expect(nova.locator('#text-content .extra')).toHaveCount(0);

    await nova.keyboard.press('Space');
    await expect(nova.locator('#text-content .word.current')).toHaveText(second);

    // Nova's ship moves and her speed shows up on Orion's screen
    await expect.poll(() => shipPosition(orion, 'Nova'), { timeout: 5000 }).toBeGreaterThan(0);
    await expect(game(orion).lane('Nova').locator('.user-curr-wpm')).not.toHaveText('0 wpm', { timeout: 5000 });
  });

  test('a fixed mistake still lowers accuracy', async ({ page, newPlayerPage }) => {
    const [nova, orion] = await twoPlayers(page, newPlayerPage);
    await startRace([nova, orion]);
    const text = await raceText(nova);
    const wrong = text[0] === 'q' ? 'z' : 'q';

    await typeInRace(nova, wrong);
    await nova.keyboard.press('Backspace');
    await nova.keyboard.type(text);
    await expectSummary(nova);
    const accuracy = parseInt((await game(nova).summaryAccuracy.textContent())!, 10);
    expect(accuracy).toBeLessThan(100);
    expect(accuracy).toBeGreaterThan(90);
  });

  test('pasting the text does nothing', async ({ newPlayerPage }) => {
    const nova = await newPlayerPage({ permissions: ['clipboard-read', 'clipboard-write'] });
    const orion = await newPlayerPage();
    await joinAsNew(nova, { name: 'Nova' });
    await joinAsNew(orion, { name: 'Orion' });
    await startRace([nova, orion]);
    const text = await raceText(nova);
    await nova.evaluate((t) => navigator.clipboard.writeText(t), text);
    await game(nova).input.focus();
    await nova.keyboard.press('ControlOrMeta+V');
    await expect(nova.locator('#text-content .correctText')).toHaveCount(0);
    await expect(game(nova).summaryWpm).toBeHidden();
  });

  test('lobby keys are switched off during a race', async ({ page, newPlayerPage }) => {
    let confirmAsked = false;
    page.on('dialog', (d) => {
      confirmAsked = true;
      void d.dismiss();
    });
    const [nova, orion] = await twoPlayers(page, newPlayerPage);
    await startRace([nova, orion]);
    await nova.keyboard.press('Escape');
    await nova.keyboard.press('`');
    await nova.keyboard.press('Enter');
    await nova.keyboard.press('Alt');
    expect(confirmAsked).toBe(false);
    await expect(game(nova).leaderboard).toBeHidden();
    await expect(game(nova).difficulty).toHaveValue('easy');
    await expect(game(nova).leaveMatch).toBeVisible();
  });

  test('the round ends for everyone once every player leaves the match', async ({ page, newPlayerPage }) => {
    const [nova, orion] = await twoPlayers(page, newPlayerPage);
    await startRace([nova, orion]);
    await typeInRace(nova, (await raceText(nova)).split(' ')[0]!);

    await game(nova).leaveMatch.click();
    await nova.waitForTimeout(500);
    await expect(game(orion).summaryWpm).toBeHidden(); // one player leaving does not end it

    await game(orion).leaveMatch.click();
    await expectSummary(nova);
    await expectSummary(orion);
    await expect(game(nova).ready).toHaveText('Get Ready');
  });

  test('the round ends when the minute is up', async ({ page, newPlayerPage }) => {
    test.setTimeout(120_000);
    const [nova, orion] = await twoPlayers(page, newPlayerPage);
    await startRace([nova, orion]);
    await typeInRace(nova, (await raceText(nova)).split(' ')[0]!);

    await expect(game(nova).timeUp).toBeVisible({ timeout: 70_000 });
    await expect(game(nova).stopwatch).toHaveText('00:00');
    await expectSummary(nova);
    await expectSummary(orion);
    // untyped letters are marked wrong at the end
    await expect(nova.locator('#text-content .incorrectText').first()).toBeVisible();
    await expect(game(nova).input).toBeDisabled();
  });

  test('the majority picks the level; a tie goes to easy', async ({ page, newPlayerPage }) => {
    await joinAsNew(page, { name: 'Nova' });
    const orion = await newPlayerPage();
    await joinAsNew(orion, { name: 'Orion' });
    const vega = await newPlayerPage();
    await joinAsNew(vega, { name: 'Vega' });
    const all = [page, orion, vega];
    await waitForLobby(all);

    await game(page).difficulty.selectOption('medium');
    await game(orion).difficulty.selectOption('medium');
    await startRace(all);
    expect(quotes).toContain(await raceText(page));

    for (const p of all) await game(p).leaveMatch.click();
    for (const p of all) await expectSummary(p);

    // one medium, one easy: a tie
    await vega.close();
    await waitForLobby([page, orion]);
    await game(orion).difficulty.selectOption('easy');
    await startRace([page, orion]);
    expect((await raceText(page)).split(' ')).toHaveLength(33);
  });

  test('a medium race score goes on the Medium board', async ({ page, newPlayerPage }) => {
    const [nova, orion] = await twoPlayers(page, newPlayerPage);
    for (const p of [nova, orion]) await game(p).difficulty.selectOption('medium');
    await startRace([nova, orion]);
    await typeInRace(nova, await raceText(nova));
    await expectSummary(nova);
    await game(nova).mediumTab.click();
    await expect(game(nova).mediumRanks).toHaveCount(1);
    await expect(game(nova).mediumRanks.first()).toHaveClass(/me-rank-card/);
    await game(nova).easyTab.click();
    await expect(game(nova).easyRanks).toHaveCount(0);
  });

  test('a phone score is saved as a mobile score', async ({ page, newPlayerPage }) => {
    await joinAsNew(page, { name: 'Nova' });
    const phone = await newPlayerPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await joinAsNew(phone, { name: 'Pocket' });
    await startRace([page, phone]);
    await typeInRace(phone, await raceText(phone));
    await expectSummary(phone);
    const row = game(page).easyRanks.filter({ hasText: 'Pocket' });
    await game(page).leaderboardButton.click(); // Nova is still racing: open the board to look
    await expect(row.getByRole('img', { name: 'Mobile' })).toBeAttached();
  });

  test('the leaderboard keeps a player’s best score', async ({ page, newPlayerPage }) => {
    test.setTimeout(120_000);
    const [nova, orion] = await twoPlayers(page, newPlayerPage);
    const best = async () => Number(await game(nova).easyRanks.first().locator('.rank-player-wpm strong').textContent());

    await startRace([nova, orion]);
    await typeInRace(nova, await raceText(nova), 40);
    await expectSummary(nova);
    await expect(game(nova).easyRanks).toHaveCount(1);
    const first = await best();
    await game(orion).leaveMatch.click();
    await expectSummary(orion);

    // a slower second race does not replace it
    await startRace([nova, orion]);
    await typeInRace(nova, await raceText(nova), 120);
    await expectSummary(nova);
    const slower = Number(await game(nova).summaryWpm.textContent());
    expect(slower).toBeLessThan(first);
    await nova.getByRole('button', { name: 'Refresh leaderboard' }).click();
    await nova.waitForTimeout(500);
    expect(await best()).toBe(first);
  });

  test('a second race starts fresh', async ({ page, newPlayerPage }) => {
    const [nova, orion] = await twoPlayers(page, newPlayerPage);
    await startRace([nova, orion]);
    const firstText = await raceText(nova);
    await Promise.all([typeInRace(nova, firstText), typeInRace(orion, firstText)]);
    await expectSummary(nova);
    await expectSummary(orion);

    await startRace([nova, orion]);
    const g = game(nova);
    await expect(g.summaryWpm).toBeHidden();
    await expect(nova.locator('#text-content .correctText')).toHaveCount(0);
    await expect(g.selfLane.locator('.user-rank-wpm')).toHaveText('');
    const secondText = await raceText(nova);
    expect(secondText).not.toBe(firstText);
    await typeInRace(nova, secondText);
    await expectSummary(nova);
    await expect(g.summaryAccuracy).toHaveText('100%');
  });

  test('a player who drops out mid-race does not stop the others', async ({ page, newPlayerPage }) => {
    const [nova, orion] = await twoPlayers(page, newPlayerPage);
    await startRace([nova, orion]);
    await orion.close();
    await expect(game(nova).lanes).toHaveCount(1);
    await typeInRace(nova, await raceText(nova));
    await expectSummary(nova);
    await expect(game(nova).summaryAccuracy).toHaveText('100%');
  });

  test('someone joining mid-race waits in the lobby, then races next time', async ({ page, newPlayerPage }) => {
    const [nova, orion] = await twoPlayers(page, newPlayerPage);
    await startRace([nova, orion]);

    const vega = await newPlayerPage();
    await joinAsNew(vega, { name: 'Vega' });
    await expect(game(vega).ready).toHaveText('Get Ready');
    await expect(game(vega).input).toBeDisabled();
    await expect(game(nova).lanes).toHaveCount(3);

    const text = await raceText(nova);
    await Promise.all([typeInRace(nova, text), typeInRace(orion, text)]);
    await expectSummary(nova);
    await expectSummary(orion);
    await expect(game(vega).summaryWpm).toBeHidden();

    await startRace([nova, orion, vega]);
    expect(await raceText(vega)).toBe(await raceText(nova));
  });
});
