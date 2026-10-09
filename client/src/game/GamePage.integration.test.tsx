import { StrictMode } from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import type { RoomUser } from '../types/socket';
import { createFakeSocketFactory } from '../test-utils/FakeSocket';
import type { FakeSocket } from '../test-utils/FakeSocket';
import { GamePage } from './GamePage';
import { LeaderboardModal } from './components/LeaderboardModal';

/**
 * GamePage wired to the REAL TypingArea, engine and LeaderboardModal (GamePage.test.tsx mocks the first and
 * last, TypingArea.test.tsx uses jest functions, so nothing else exercises the real seams between them:
 * onStats/onComplete into the round state machine, progress percentages, gameKey-driven remounts, caret
 * visibility, timer hygiene across rounds).
 */

vi.mock('../components/Particles', () => ({ Particles: () => null }));

const user = (id: string, over: Partial<RoomUser> = {}): RoomUser => ({
  id,
  username: id,
  wpm: 0,
  avatar: 'avatar1',
  userJoinId: 1,
  status: false,
  progress: 0,
  currWpm: 0,
  ...over,
});

const QUOTE = 'the quick fox';
const SEARCH = '?username=ann&image=avatar3&identity=x&Device=Laptop';

function setup(strict: boolean) {
  const factory = createFakeSocketFactory();
  const page = (
    <GamePage search={SEARCH} createSocket={factory.factory} confirmLeave={() => true} navigate={() => undefined} />
  );
  const rendered = render(strict ? <StrictMode>{page}</StrictMode> : page);
  const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
  tick(0); // the deferred join emit
  const server: FakeSocket['receive'] = ((event, ...args) =>
    act(() => factory.last().receive(event, ...args))) as FakeSocket['receive'];
  return { factory, rendered, tick, server, socket: () => factory.last() };
}
type Setup = ReturnType<typeof setup>;

const q = (selector: string) => document.querySelector<HTMLElement>(selector)!;
const isHidden = (selector: string) => q(selector).classList.contains('hidden');
const input = () => q('input.input-field') as HTMLInputElement;

/** Types like a soft/hard keyboard into the hidden input: the field accumulates the word, one input event per char. */
function typeText(text: string) {
  for (const ch of text) {
    act(() => {
      const el = input();
      el.value += ch;
      fireEvent.input(el);
    });
  }
}

function start(s: Setup, quote = QUOTE) {
  s.server('add user progress', [user('bob'), user('me', { username: 'ann' })]);
  s.server('start game', { quoteFromServer: quote, levelOfQuote: 1 });
  s.tick(10_000);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => [] })));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe.each([[true], [false]])('GamePage + real TypingArea + real engine (StrictMode=%s)', (strict) => {
  it('a full correct run: progress 100, summary, lobby restored, input disabled, one score', () => {
    const s = setup(strict);
    start(s);
    expect(input().disabled).toBe(false);
    s.socket().clearEmitted();
    typeText(QUOTE);
    const names = s.socket().emittedNames();
    expect(names.filter((n) => n === 'user score')).toHaveLength(1);
    expect(names.filter((n) => n === 'get rank')).toHaveLength(1);
    expect(names.filter((n) => n === 'set leave match true')).toHaveLength(1);
    expect(s.socket().emitsOf('progress').at(-1)?.[0]).toBe(100);
    expect(input().disabled).toBe(true);
    expect(isHidden('.showWpm')).toBe(false);
    expect(q('#terminal-accuracy').textContent).toBe('100%');
    expect(isHidden('.time-up-warn')).toBe(true);
    expect(isHidden('.leader-board-menu')).toBe(false);
    // further ticks do nothing
    s.socket().clearEmitted();
    s.tick(5000);
    expect(s.socket().emitted).toEqual([]);
    // the lobby key bindings are back: Enter readies up
    act(() => void fireEvent.keyDown(document, { key: 'Enter' }));
    expect(s.socket().emitsOf('ready status')).toHaveLength(1);
  });

  it('a timeout with partial text: unfinished letters flagged, later typing ignored, Time Up shown', () => {
    const s = setup(strict);
    start(s);
    typeText('the qu');
    s.tick(60_000);
    expect(isHidden('.time-up-warn')).toBe(false);
    // 'the' + 'qu' are typed (5 letters); every other letter of the quote is shown as incorrect
    expect(document.querySelectorAll('.letter.incorrectText')).toHaveLength(QUOTE.replace(/ /g, '').length - 5);
    const before = s.socket().emitted.length;
    typeText('x');
    expect(s.socket().emitted).toHaveLength(before);
    expect(document.querySelectorAll('.letter.correctText')).toHaveLength(5);
  });

  it('a second round starts from a fresh engine with an empty input', () => {
    const s = setup(strict);
    start(s);
    typeText('the qu');
    s.tick(60_000);
    act(() => void fireEvent.keyDown(document, { key: 'Enter' }));
    s.server('start game', { quoteFromServer: 'ab cd', levelOfQuote: 0 });
    s.tick(10_000);
    expect(document.querySelectorAll('.word')).toHaveLength(2);
    expect(document.querySelectorAll('.letter.correctText')).toHaveLength(0);
    expect(input().value).toBe('');
    s.socket().clearEmitted();
    typeText('ab cd');
    expect(s.socket().emitsOf('progress').at(-1)?.[0]).toBe(100);
    expect(s.socket().emitsOf('user score')).toHaveLength(1);
  });

  it("other players' progress events do not disturb the engine", () => {
    const s = setup(strict);
    start(s);
    typeText('the ');
    s.server('user progress', [user('bob', { currWpm: 50, progress: 30 }), user('me', { currWpm: 10, progress: 20 })]);
    typeText('quick fox');
    expect(s.socket().emitsOf('user score')).toHaveLength(1);
  });

  it('a round ended during the countdown still arms typing at t=10 and shows the caret (legacy)', () => {
    const s = setup(strict);
    s.server('add user progress', [user('bob'), user('me', { username: 'ann' })]);
    s.server('start game', { quoteFromServer: QUOTE, levelOfQuote: 1 });
    s.tick(3000);
    s.server('end game on request'); // every player pressed "Leave match" while the lights counted down
    expect(input().disabled).toBe(true);
    s.tick(7000); // t = 10 s: the legacy start timer was never cancelled
    expect(input().disabled).toBe(false);
    expect(isHidden('.dummy-cursor')).toBe(false); // the blinking caret waits for the first key...
    typeText('t');
    expect(isHidden('#cursor')).toBe(false); // ...and the real caret follows the typing
    expect(isHidden('.dummy-cursor')).toBe(true);
    expect(document.querySelectorAll('.letter.correctText')).toHaveLength(1);
  });
});

describe.each([[true], [false]])('timer hygiene (StrictMode=%s)', (strict) => {
  it('unmounting in the middle of the countdown leaves no live timer', () => {
    const s = setup(strict);
    s.server('add user progress', [user('bob'), user('me')]);
    s.server('start game', { quoteFromServer: QUOTE, levelOfQuote: 1 });
    s.tick(3000);
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    s.rendered.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('unmounting during the timed phase leaves no live timer', () => {
    const s = setup(strict);
    s.server('add user progress', [user('bob'), user('me')]);
    s.server('start game', { quoteFromServer: QUOTE, levelOfQuote: 1 });
    s.tick(15_000);
    s.rendered.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('a new "start game" while the start-light sequence runs cancels the old timers and finishes the sequence', () => {
    const s = setup(strict);
    s.server('add user progress', [user('bob'), user('me')]);
    s.server('start game', { quoteFromServer: QUOTE, levelOfQuote: 1 });
    s.tick(10_000 + 1500); // the match started 1.5 s ago; the 4 s light sequence is half-way
    expect(isHidden('.countdown-over')).toBe(false);
    expect(vi.getTimerCount()).toBeGreaterThanOrEqual(4); // match interval + the three light timeouts still pending
    s.server('end game on request'); // e.g. everybody pressed "Leave match"
    s.server('start game', { quoteFromServer: 'ab cd', levelOfQuote: 0 });
    // fresh round: only the countdown interval and the start timer; nothing leaked from round 1
    expect(vi.getTimerCount()).toBe(2);
    // legacy's leaked timers finished the sequence during the next countdown; here it is finished immediately
    expect(isHidden('.countdown')).toBe(false);
    expect(isHidden('.countdown-over')).toBe(true);
    expect(q('.red-circle').style.backgroundColor).toBe('rgb(255, 0, 0)');
    expect(q('.yellow-circle').style.backgroundColor).toBe('rgb(255, 213, 5)');
    expect(q('.green-circle').style.backgroundColor).toBe('rgb(3, 202, 11)');
    s.tick(5000);
    expect(isHidden('.countdown-over')).toBe(true);
    expect(q('.red-circle').style.backgroundColor).toBe('rgb(255, 0, 0)');
  });

  it('round 2 finishes cleanly after round 1 timed out: one score, no stray ticks', () => {
    const s = setup(strict);
    s.server('add user progress', [user('bob'), user('me')]);
    s.server('start game', { quoteFromServer: QUOTE, levelOfQuote: 1 });
    s.tick(10_000 + 60_000);
    s.server('start game', { quoteFromServer: 'ab cd', levelOfQuote: 0 });
    s.tick(10_000);
    s.socket().clearEmitted();
    typeText('ab cd');
    s.tick(5000);
    expect(s.socket().emitsOf('user score')).toHaveLength(1);
    s.tick(120_000); // the round already ended: no timer may emit progress any more
    expect(s.socket().emitsOf('progress').filter((p) => p[0] !== 100)).toEqual([]);
  });
});

describe('GamePage + real LeaderboardModal', () => {
  const players = [
    { joinId: 111111, username: 'zed', userAvatar: 'avatar2', highScore: { Easy: { Mobile: 0, Laptop: 50 }, Medium: { Mobile: 0, Laptop: 0 } } },
    { joinId: 222222, username: 'amy', userAvatar: 'avatar3', highScore: { Easy: { Mobile: 70, Laptop: 0 }, Medium: { Mobile: 0, Laptop: 30 } } },
  ];

  it('fetches, renders sorted rows, highlights the joined player and re-fetches on "update user leaderboard"', async () => {
    vi.useRealTimers(); // real promises/timeouts: this test awaits the fetch chain
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200, json: async () => players }));
    vi.stubGlobal('fetch', fetchMock);
    const factory = createFakeSocketFactory();
    render(
      <StrictMode>
        <GamePage search="?username=amy&image=avatar3" createSocket={factory.factory} confirmLeave={() => true} navigate={() => undefined} />
      </StrictMode>,
    );
    const settle = () => act(async () => void (await new Promise((resolve) => setTimeout(resolve, 20))));
    await settle();
    await act(async () => {
      factory.last().receive('joining id', 222222);
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    const afterJoin = fetchMock.mock.calls.length;
    const rows = [...document.querySelectorAll('.player-rankings-easy .rank-card')];
    expect(rows[0]!.textContent).toContain('amy'); // 70 wpm beats zed's 50
    expect(rows[0]!.className).toContain('me-rank-card');
    expect(rows[1]!.className).not.toContain('me-rank-card');
    await act(async () => {
      factory.last().receive('update user leaderboard');
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(fetchMock.mock.calls.length).toBe(afterJoin + 1);
  });
});

describe('LeaderboardModal fetch lifecycle', () => {
  it('aborts the in-flight request when the refresh token changes or the modal unmounts', () => {
    const signals: AbortSignal[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init: RequestInit) => {
        signals.push(init.signal as AbortSignal);
        return new Promise(() => undefined);
      }),
    );
    const props = {
      open: true,
      onClose: () => undefined,
      level: 'easy' as const,
      onLevelChange: () => undefined,
      onRefresh: () => undefined,
      joinId: null,
    };
    const r = render(<LeaderboardModal {...props} refreshToken={0} />);
    expect(signals).toHaveLength(1);
    r.rerender(<LeaderboardModal {...props} refreshToken={1} />);
    expect(signals).toHaveLength(2);
    expect(signals[0]!.aborted).toBe(true);
    expect(signals[1]!.aborted).toBe(false);
    r.unmount();
    expect(signals[1]!.aborted).toBe(true);
  });
});

describe('unusual quotes through the real TypingArea and engine', () => {
  it.each([
    ['a double space', 'ab  cd'],
    ['a leading space', ' ab'],
    ['a trailing space', 'ab '],
    ['a single character', 'a'],
    ['an empty quote', ''],
    ['HTML-looking text', '<b>x</b> &amp; "q"'],
  ])('%s: the round starts, accepts typing and ends without throwing or non-finite numbers', (_name, quote) => {
    const s = setup(true);
    s.server('add user progress', [user('bob'), user('me')]);
    s.server('start game', { quoteFromServer: quote, levelOfQuote: 1 });
    s.tick(10_000);
    typeText(quote);
    s.tick(60_000);
    const numbers = s.socket().emitsOf('progress').flat();
    expect(numbers.every((value) => Number.isFinite(value))).toBe(true);
    expect(s.socket().emitsOf('user score').length).toBeGreaterThanOrEqual(1);
  });

  it('shows quote text literally, never as markup', () => {
    const s = setup(false);
    start(s, '<img src=x onerror=alert(1)> hi');
    expect(document.querySelector('#text-content img')).toBeNull();
    // words are separate elements (the legacy markup too), so the text has no space characters between them
    expect(q('#text-content').textContent).toContain('<imgsrc=xonerror=alert(1)>');
  });
});
