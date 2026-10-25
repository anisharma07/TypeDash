import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures';
import { REPO_ROOT } from '../paths';
import { expectSummary, game, joinAsNew, raceText, startRace, typeInRace, waitForLobby } from '../helpers';

/** The README screenshots. Run with `npm run screenshots`; the files land in docs/screenshots. */
const OUT = join(REPO_ROOT, 'docs', 'screenshots');
mkdirSync(OUT, { recursive: true });

test.use({ realFonts: true, serverEnv: { SEED: '7' } });

const shot = (page: Page, name: string) => page.screenshot({ path: join(OUT, `${name}.png`) });
const settle = (page: Page) => page.evaluate(() => document.fonts.ready).then(() => page.waitForTimeout(800));

test('README screenshots', async ({ newPlayerPage }) => {
  // Home page and settings
  const visitor = await newPlayerPage();
  await visitor.goto('/index.html');
  await settle(visitor);
  await shot(visitor, 'home');
  await visitor.locator('.settings-button').click();
  await settle(visitor);
  await shot(visitor, 'settings');
  await visitor.close();

  // Three players: one race fills the leaderboard (results), a second one is caught mid-race
  const nova = await newPlayerPage();
  await joinAsNew(nova, { name: 'Nova', avatar: 3 });
  const orion = await newPlayerPage();
  await joinAsNew(orion, { name: 'Orion', avatar: 0 });
  const vega = await newPlayerPage();
  await joinAsNew(vega, { name: 'Vega', avatar: 12 });
  const all = [nova, orion, vega];
  await waitForLobby(all);

  await startRace(all);
  let text = await raceText(nova);
  await Promise.all([typeInRace(nova, text, 110), typeInRace(orion, text, 135), typeInRace(vega, text, 165)]);
  for (const p of all) await expectSummary(p);
  await expect(game(nova).easyRanks).toHaveCount(3);
  await settle(nova);
  await shot(nova, 'results');

  await startRace(all);
  text = await raceText(orion);
  const typing = [typeInRace(nova, text, 115), typeInRace(orion, text, 130), typeInRace(vega, text, 170)];
  await orion.waitForTimeout(9000);
  await shot(orion, 'race');
  await Promise.all(typing);

  // A 2x2 sheet of the home page in four themes
  const themes = ['arcade', 'almanac', 'terminal', 'riso'];
  const tiles: string[] = [];
  for (const slug of themes) {
    const page = await newPlayerPage({ storage: { 'typedash:theme': slug } });
    await page.goto('/index.html');
    await settle(page);
    tiles.push((await page.screenshot()).toString('base64'));
    await page.close();
  }
  const sheet = await newPlayerPage({ viewport: { width: 1440, height: 900 } });
  await sheet.setContent(`<body style="margin:0;display:grid;grid-template-columns:1fr 1fr;gap:8px;background:#0b0b14;padding:8px">
    ${tiles.map((t) => `<img style="width:100%;display:block;border-radius:6px" src="data:image/png;base64,${t}">`).join('')}
  </body>`);
  await sheet.waitForTimeout(300);
  await sheet.screenshot({ path: join(OUT, 'themes.png'), fullPage: true });

  // Phone: home and game side by side
  const phoneOptions = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
  const phoneHome = await newPlayerPage(phoneOptions);
  await phoneHome.goto('/index.html');
  await settle(phoneHome);
  const homeShot = (await phoneHome.screenshot()).toString('base64');
  const phoneGame = await newPlayerPage(phoneOptions);
  await joinAsNew(phoneGame, { name: 'Pocket', avatar: 9 });
  await game(phoneGame).leaderboardButton.click();
  await settle(phoneGame);
  const gameShot = (await phoneGame.screenshot()).toString('base64');
  const phones = await newPlayerPage({ viewport: { width: 860, height: 900 } });
  await phones.setContent(`<body style="margin:0;display:flex;gap:24px;justify-content:center;background:#0b0b14;padding:24px">
    ${[homeShot, gameShot].map((t) => `<img style="width:390px;border-radius:28px;border:6px solid #2a2a3a" src="data:image/png;base64,${t}">`).join('')}
  </body>`);
  await phones.waitForTimeout(300);
  await phones.screenshot({ path: join(OUT, 'mobile.png'), fullPage: true });

  for (const name of ['home', 'settings', 'results', 'race', 'themes', 'mobile']) {
    expect(readFileSync(join(OUT, `${name}.png`)).length).toBeGreaterThan(10_000);
  }
});
