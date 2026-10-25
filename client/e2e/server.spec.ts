import { test, expect } from './fixtures';
import type { Socket } from 'socket.io-client';
import { connected, joinAsNew, game, nextEvent, playersOnline, rawSocket } from './helpers';
import type { RoomUser } from '../src/types/socket';

/**
 * The server must survive anything a client can send: messages out of order, from sockets that never joined,
 * with payloads of the wrong type, size or range, and a database that is down. Every test here also fails
 * if the server process dies or logs an error (see the `server` fixture).
 */

const CLIENT_EVENTS = [
  'join',
  'join by Id',
  'ready status',
  'not ready',
  'set leave match true',
  'leave match',
  'progress',
  'user score',
  'get rank',
] as const;

const deep: Record<string, unknown> = {};
let cursor = deep;
for (let i = 0; i < 50; i++) cursor = (cursor.next = {}) as Record<string, unknown>;

/** Payloads of every wrong shape. NaN and Infinity travel as null over JSON. */
const GARBAGE: unknown[] = [
  undefined,
  null,
  0,
  -1,
  1e308,
  Number.NaN,
  true,
  '',
  'x',
  'x'.repeat(10_000),
  '<script>alert(1)</script>',
  [],
  [1, 2, 3],
  {},
  { wpm: 'fast', quoteLevel: 'hard', userDevice: 5 },
  { wpm: 1e9, quoteLevel: 1, userDevice: 'mobile' },
  { username: { nested: true }, userAvatar: ['avatar1'], userIdentity: 42 },
  { __proto__: { polluted: true } },
  deep,
  new Uint8Array([1, 2, 3]),
];

const sockets: Socket[] = [];
function client(url: string): Socket {
  const socket = rawSocket(url);
  sockets.push(socket);
  return socket;
}
test.afterEach(() => {
  for (const socket of sockets.splice(0)) socket.disconnect();
});

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Joins a raw socket as a new player and returns its Player ID. */
async function join(socket: Socket, username = 'Bot'): Promise<number> {
  await connected(socket);
  const answer = nextEvent<number>(socket, 'joining id');
  socket.emit('join', { username, userAvatar: 'avatar2', userIdentity: 'none' });
  const [id] = await answer;
  return id!;
}

async function leaderboard(url: string) {
  const res = await fetch(`${url}/get-users-leaderboard`);
  return { status: res.status, rows: (await res.json()) as Array<Record<string, any>> };
}

test.describe('server', () => {
  test('serves the pages, assets and leaderboard, and 404s the rest', async ({ request, server }) => {
    for (const path of ['/', '/index.html', '/multiplayer.html']) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(200);
      expect(res.headers()['content-type']).toContain('text/html');
    }
    const ship = await request.get('/images/avatars/avatar1.png');
    expect(ship.status()).toBe(200);
    expect(ship.headers()['content-type']).toContain('image/png');

    const board = await request.get('/get-users-leaderboard');
    expect(board.status()).toBe(200);
    expect(await board.json()).toEqual([]);

    for (const path of ['/nope', '/images/avatars/avatar99.png', '/%2e%2e/%2e%2e/app.js', '/..%2f..%2fpackage.json']) {
      expect((await request.get(path)).status(), path).toBe(404);
    }
    expect((await request.post('/get-users-leaderboard')).status()).toBe(404);
    expect(await playersOnline(server.url)).toBe(0);
  });

  test('ignores every message from a socket that never joined', async ({ server }) => {
    const observer = client(server.url);
    await join(observer, 'Observer');
    await pause(300); // let the observer's own join announcements arrive first
    const broadcasts: string[] = [];
    observer.onAny((event: string) => broadcasts.push(event));

    const stranger = client(server.url);
    await connected(stranger);
    for (const event of CLIENT_EVENTS.filter((e) => e !== 'join' && e !== 'join by Id')) {
      for (const payload of GARBAGE) stranger.emit(event, payload, payload);
      stranger.emit(event);
    }
    await pause(500);

    expect(broadcasts).toEqual([]);
    expect(await playersOnline(server.url)).toBe(1);
  });

  test('a join with broken details still makes a clean player', async ({ server }) => {
    const observer = client(server.url);
    await join(observer, 'Observer');

    const payloads: unknown[] = [
      null,
      5,
      'just a string',
      [],
      {},
      { username: { nested: true }, userAvatar: 7, userIdentity: ['x'] },
      { username: 'x'.repeat(500), userAvatar: 'avatar99', userIdentity: 'y'.repeat(5000) },
      { username: '   ', userAvatar: '../../etc/passwd', userIdentity: '' },
      { username: '<img src=x onerror=alert(1)>', userAvatar: 'avatar15', userIdentity: 'none' },
    ];
    for (const payload of payloads) {
      const socket = client(server.url);
      await connected(socket);
      const id = nextEvent<number>(socket, 'joining id');
      const lanes = nextEvent<RoomUser[]>(observer, 'add user progress');
      socket.emit('join', payload);
      const [joinId] = await id;
      expect(String(joinId)).toMatch(/^\d{6}$/);

      const [users] = await lanes;
      const player = users!.find((u) => u.id === socket.id)!;
      expect(typeof player.username).toBe('string');
      expect(player.username.length).toBeGreaterThan(0);
      expect(player.username.length).toBeLessThanOrEqual(10);
      expect(player.avatar).toMatch(/^avatar([1-9]|1[0-5])$/);
    }

    const { rows } = await leaderboard(server.url);
    expect(rows).toHaveLength(payloads.length + 1);
    for (const row of rows) {
      expect(typeof row.userContact).toBe('string');
      expect(row.userContact.length).toBeLessThanOrEqual(100);
    }
    expect(await playersOnline(server.url)).toBe(payloads.length + 1);
  });

  test('a junk Player ID gets the wrong-ID answer; a real one logs in', async ({ server }) => {
    const owner = client(server.url);
    const id = await join(owner, 'Vega');

    const junk: unknown[] = ['abc', -1, 0, 12, 12345, 1234567, 1e21, 123456.5, '123456abc', ' ', null, {}, [], true, Number.NaN, 999999];
    for (const value of junk) {
      const socket = client(server.url);
      await connected(socket);
      const wrong = nextEvent(socket, 'wrong join id error');
      socket.emit('join by Id', value);
      await wrong;
      socket.disconnect();
    }

    for (const value of [id, String(id)]) {
      const socket = client(server.url);
      await connected(socket);
      const ok = nextEvent<number | string>(socket, 'joining by id');
      socket.emit('join by Id', value);
      const [joinId, username] = await ok;
      expect(joinId).toBe(id);
      expect(username).toBe('Vega');
    }
    expect(await playersOnline(server.url)).toBe(3);
  });

  test('one connection is one player, however often it asks to join', async ({ server }) => {
    const owner = client(server.url);
    const id = await join(owner, 'Vega');
    owner.emit('join', { username: 'Again' });
    owner.emit('join by Id', id);
    owner.emit('join', { username: 'Again' });
    await pause(300);
    expect(await playersOnline(server.url)).toBe(1);
  });

  test('progress and speed are kept in range', async ({ server }) => {
    const a = client(server.url);
    const b = client(server.url);
    await join(a, 'A');
    await join(b, 'B');

    const cases: Array<[unknown, unknown, number, number]> = [
      [1e9, -50, 100, 0],
      ['abc', 'NaN', 0, 0],
      [null, undefined, 0, 0],
      [50, 99_999, 50, 400],
      [42.5, 61.6, 42.5, 62],
    ];
    for (const [value, wpm, progress, currWpm] of cases) {
      const update = nextEvent<RoomUser[]>(b, 'user progress');
      a.emit('progress', value, wpm);
      const [users] = await update;
      const me = users!.find((u) => u.id === a.id)!;
      expect([me.progress, me.currWpm]).toEqual([progress, currWpm]);
    }
  });

  test('scores count only from a race, once, and within human limits', async ({ server }) => {
    const a = client(server.url);
    const b = client(server.url);
    const aId = await join(a, 'A');
    await join(b, 'B');
    const best = async () => (await leaderboard(server.url)).rows.find((r) => r.joinId === aId)!.highScore;

    a.emit('user score', { wpm: 50, quoteLevel: 0, userDevice: 'laptop' }); // no race yet
    await pause(300);
    expect((await best()).Easy.Laptop).toBe(0);

    const start = nextEvent(a, 'start game');
    a.emit('ready status', 'easy');
    b.emit('ready status', 'easy');
    await start;

    for (const bogus of [{ wpm: 1000 }, { wpm: 'fast' }, { wpm: -5 }, { wpm: 0 }, null, 'x', { wpm: Number.NaN }]) {
      a.emit('user score', bogus);
    }
    await pause(300);
    expect(await best()).toEqual({ Easy: { Mobile: 0, Laptop: 0 }, Medium: { Mobile: 0, Laptop: 0 } });

    const saved = nextEvent(a, 'update user leaderboard');
    a.emit('user score', { wpm: 77.4, quoteLevel: 1, userDevice: 'mobile' });
    await saved;
    a.emit('user score', { wpm: 120, quoteLevel: 1, userDevice: 'mobile' }); // second score of the same race
    await pause(300);
    expect((await best()).Medium.Mobile).toBe(77);
  });

  test('an unknown level counts as easy', async ({ server }) => {
    const a = client(server.url);
    const b = client(server.url);
    await join(a, 'A');
    await join(b, 'B');
    const start = nextEvent<{ quoteFromServer: string; levelOfQuote: number }>(a, 'start game');
    a.emit('ready status', { level: 'medium' });
    b.emit('ready status', 'impossible');
    const [payload] = await start;
    expect(payload!.levelOfQuote).toBe(0);
    expect(payload!.quoteFromServer.split(' ')).toHaveLength(33);
  });

  test('every message with every kind of junk, from joined players, leaves the server healthy', async ({ server }) => {
    const a = client(server.url);
    const b = client(server.url);
    await join(a, 'A');
    await join(b, 'B');
    for (const event of CLIENT_EVENTS) {
      for (const payload of GARBAGE) {
        a.emit(event, payload, payload);
        b.emit(event, payload);
      }
    }
    await pause(800);
    expect(await playersOnline(server.url)).toBe(2);
    const { status, rows } = await leaderboard(server.url);
    expect(status).toBe(200);
    expect(rows).toHaveLength(2);
  });

  test('a flood of players joining and leaving leaves nothing behind', async ({ server }) => {
    const crowd = Array.from({ length: 60 }, () => client(server.url));
    await Promise.all(crowd.map((s, i) => join(s, `P${i}`)));
    expect(await playersOnline(server.url)).toBe(60);
    for (const s of crowd) {
      s.emit('ready status', 'easy');
      s.emit('progress', 10, 10);
      s.disconnect();
    }
    await expect.poll(() => playersOnline(server.url)).toBe(0);
  });

  test('leaving at awkward moments leaves no ghost player', async ({ server }) => {
    const owner = client(server.url);
    const id = await join(owner, 'Vega');
    owner.disconnect();
    await expect.poll(() => playersOnline(server.url)).toBe(0);

    for (let i = 0; i < 10; i++) {
      const quick = client(server.url);
      await connected(quick);
      quick.emit('join by Id', id); // the database lookup is still running...
      quick.disconnect(); // ...when the player is already gone
    }
    const hasty = client(server.url);
    await connected(hasty);
    hasty.emit('join', { username: 'Hasty' });
    hasty.disconnect();
    await pause(500);
    await expect.poll(() => playersOnline(server.url)).toBe(0);
  });
});

test.describe('server with the database down', () => {
  test.use({
    serverEnv: { FAKE_DB_FAIL: '1' },
    allowServerErrors: true,
    ignoreConsole: [/Failed to load resource.*500/],
  });

  test('keeps serving and racing, and answers the leaderboard with an error', async ({ server, page, newPlayerPage }) => {
    const { status, rows } = await leaderboard(server.url);
    expect(status).toBe(500);
    expect(rows).toEqual([]);

    const lost = client(server.url);
    await connected(lost);
    const wrong = nextEvent(lost, 'wrong join id error');
    lost.emit('join by Id', 123456);
    await wrong;

    // the UI still works: two players join and a race starts
    await joinAsNew(page, { name: 'Nova' });
    await expect(page.locator('.player-rankings-easy .rank-empty')).toBeVisible();
    const orion = await newPlayerPage();
    await joinAsNew(orion, { name: 'Orion' });
    for (const p of [page, orion]) await game(p).ready.click();
    await expect(game(page).countdown).toBeVisible();

    expect(server.logs()).toContain('[error]');
    expect(await playersOnline(server.url)).toBe(2);
  });
});
