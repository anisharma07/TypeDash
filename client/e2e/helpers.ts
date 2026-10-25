import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

export const STATUS_READY = 'rgb(3, 202, 11)';
export const STATUS_NOT_READY = 'rgb(255, 72, 72)';

/** Locators of the game page. */
export function game(page: Page) {
  return {
    username: page.locator('.current-user-username'),
    playerId: page.locator('.curr-user-id'),
    online: page.locator('.players-online'),
    onlineCount: page.locator('.players-online-count'),
    leaderboardButton: page.locator('.leaderboard-button'),
    leaveButton: page.locator('.leave-game'),
    settingsButton: page.locator('.settings-button'),
    leaderboard: page.locator('.leader-board-menu'),
    easyTab: page.getByRole('tab', { name: 'Easy' }),
    mediumTab: page.getByRole('tab', { name: 'Medium' }),
    easyRanks: page.locator('.player-rankings-easy .rank-card'),
    mediumRanks: page.locator('.player-rankings-medium .rank-card'),
    lanes: page.locator('.progress-bar'),
    lane: (name: string) => page.locator('.progress-bar').filter({ has: page.locator('.player-name', { hasText: name }) }),
    selfLane: page.locator('.progress-bar').filter({ has: page.locator('.player-you') }),
    difficulty: page.locator('#DifficultySelect'),
    ready: page.locator('.ready-btn'),
    insufficient: page.locator('.insuff-player'),
    leaveMatch: page.locator('.leave-match'),
    countdown: page.locator('.countdown'),
    countdownNumber: page.locator('.countdown-number'),
    goBanner: page.locator('.countdown-over'),
    stopwatch: page.locator('.stopwatch'),
    text: page.locator('#text-content'),
    words: page.locator('#text-content .word'),
    input: page.locator('.input-field'),
    timeUp: page.locator('.time-up-warn'),
    summaryWpm: page.locator('#wordsPerMinute'),
    summaryAccuracy: page.locator('#terminal-accuracy'),
    wrongId: page.locator('.wrong-id'),
  };
}

export interface JoinOptions {
  name: string;
  /** 0-based index of the ship on the home page */
  avatar?: number;
}

/** Registers a new player from the home page and waits for the Player ID. Returns it. */
export async function joinAsNew(page: Page, { name, avatar }: JoinOptions): Promise<string> {
  await page.goto('/index.html');
  if (avatar !== undefined) await page.locator('.avatars-select-image').nth(avatar).click();
  await page.locator('#username').fill(name);
  await page.locator('.submitBtn').click();
  await page.waitForURL(/multiplayer\.html/);
  const id = game(page).playerId;
  await expect(id).toHaveText(/^\d{6}$/);
  return (await id.textContent())!.trim();
}

/** Logs in with an existing Player ID from the home page. */
export async function joinById(page: Page, id: string): Promise<void> {
  await page.goto('/index.html');
  await page.locator('#user-join-id').fill(id);
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL(/join-id=/);
}

/** Waits until every page shows the lane of every other player (the lobby is in sync). */
export async function waitForLobby(pages: Page[]): Promise<void> {
  for (const page of pages) await expect(game(page).lanes).toHaveCount(pages.length);
}

/** Readies every page and waits for the countdown, then for the typing field to open (about 10 s). */
export async function startRace(pages: Page[]): Promise<void> {
  await waitForLobby(pages);
  for (const page of pages) await game(page).ready.click();
  for (const page of pages) await expect(game(page).countdown).toBeVisible();
  for (const page of pages) await expect(game(page).input).toBeEnabled({ timeout: 15_000 });
}

/** The text of the round exactly as it must be typed (words are separate elements in the page). */
export async function raceText(page: Page): Promise<string> {
  return page.$$eval('#text-content .word', (words) => words.map((w) => w.textContent ?? '').join(' '));
}

/**
 * Types into the race. `delay` is ms per key: 40 is about 300 wpm, 120 about 100 wpm.
 * Keep it at 30 or more: the server ignores scores above 400 wpm as impossible.
 */
export async function typeInRace(page: Page, text: string, delay = 40): Promise<void> {
  await game(page).input.focus();
  await page.keyboard.type(text, { delay });
}

/** Waits for the round summary of a page (shown when that player's round is over). */
export async function expectSummary(page: Page): Promise<void> {
  await expect(game(page).summaryWpm).toBeVisible({ timeout: 75_000 });
}

/** A raw Socket.IO client, for poking the server the way no browser would. */
export function rawSocket(url: string): Socket {
  return io(url, { transports: ['websocket'], forceNew: true, reconnection: false });
}

export function connected(socket: Socket): Promise<void> {
  if (socket.connected) return Promise.resolve();
  return new Promise((resolve, reject) => {
    socket.once('connect', () => resolve());
    socket.once('connect_error', reject);
  });
}

/** Resolves with the next value of a server event, or rejects after `ms`. */
export function nextEvent<T = unknown>(socket: Socket, event: string, ms = 5000): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`no "${event}" within ${ms} ms`)), ms);
    socket.once(event, (...args: T[]) => {
      clearTimeout(timer);
      resolve(args);
    });
  });
}

/** The count the server reports to a brand-new visitor: proves it is up and answering sockets. */
export async function playersOnline(url: string): Promise<number> {
  const socket = rawSocket(url);
  try {
    const [count] = await nextEvent<number>(socket, 'players online');
    return count!;
  } finally {
    socket.disconnect();
  }
}
