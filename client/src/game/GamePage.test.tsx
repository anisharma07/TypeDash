import { StrictMode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { LeaderboardModalProps, TypingAreaProps, TypingStats } from './types';
import type { RoomUser } from '../types/socket';
import { createFakeSocketFactory } from '../test-utils/FakeSocket';
import type { FakeSocket } from '../test-utils/FakeSocket';
import { GamePage } from './GamePage';

// TypingArea / LeaderboardModal / Particles are built elsewhere against the contracts in game/types.ts.
const mocks = vi.hoisted(() => ({
  typing: null as TypingAreaProps | null,
  board: null as LeaderboardModalProps | null,
}));

vi.mock('./components/TypingArea', async () => {
  const { createElement } = await import('react');
  return {
    TypingArea: (props: TypingAreaProps) => {
      mocks.typing = props;
      return createElement('div', { 'data-testid': 'typing' });
    },
  };
});
vi.mock('./components/LeaderboardModal', async () => {
  const { createElement } = await import('react');
  return {
    LeaderboardModal: (props: LeaderboardModalProps) => {
      mocks.board = props;
      return createElement('div', { 'data-testid': 'board', className: props.open ? 'leader-board-menu' : 'leader-board-menu hidden' });
    },
  };
});
vi.mock('../components/Particles', () => ({ Particles: () => null }));

const typing = (): TypingAreaProps => {
  if (!mocks.typing) throw new Error('TypingArea not rendered');
  return mocks.typing;
};
const board = (): LeaderboardModalProps => {
  if (!mocks.board) throw new Error('LeaderboardModal not rendered');
  return mocks.board;
};

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

const stats = (over: Partial<TypingStats> = {}): TypingStats => ({
  counter: 0,
  progress: 0,
  mistakes: 0,
  totalChars: 11,
  wordCount: 3,
  ...over,
});

const QUOTE = 'the quick fox'; // 11 letters, 3 words -> progress denominator 13

interface Setup {
  f: ReturnType<typeof createFakeSocketFactory>;
  socket: () => FakeSocket;
  confirmLeave: ReturnType<typeof vi.fn<(message: string) => boolean>>;
  navigate: ReturnType<typeof vi.fn<(url: string) => void>>;
  unmount: () => void;
  /** advance fake time inside act() */
  tick: (ms: number) => void;
  /** deliver a server event to the live socket inside act() */
  server: FakeSocket['receive'];
}

function setup(search = '?username=ann&image=avatar3&identity=a@b.c&Device=Laptop', strict = true, confirm = true): Setup {
  const f = createFakeSocketFactory();
  const confirmLeave = vi.fn<(message: string) => boolean>(() => confirm);
  const navigate = vi.fn<(url: string) => void>();
  const page = <GamePage search={search} createSocket={f.factory} confirmLeave={confirmLeave} navigate={navigate} />;
  const { unmount } = render(strict ? <StrictMode>{page}</StrictMode> : page);
  const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
  tick(0); // flush the deferred join
  return {
    f,
    socket: () => f.last(),
    confirmLeave,
    navigate,
    unmount,
    tick,
    server: ((event, ...args) => act(() => f.last().receive(event, ...args))) as FakeSocket['receive'],
  };
}

const q = (selector: string): HTMLElement => {
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`missing ${selector}`);
  return el;
};
const isHidden = (selector: string) => q(selector).classList.contains('hidden');
const key = (k: string, init: KeyboardEventInit = {}) => act(() => fireEvent.keyDown(document, { key: k, ...init }));

beforeEach(() => {
  vi.useFakeTimers();
  mocks.typing = null;
  mocks.board = null;
});
afterEach(() => {
  vi.useRealTimers();
});

/** Joins, adds two lanes (me + bob) and starts a round with QUOTE at level 1. Returns the setup. */
function startedRound(search?: string): Setup {
  const s = setup(search);
  s.server('add user progress', [user('bob'), user('me', { username: 'ann' })]);
  s.server('start game', { quoteFromServer: QUOTE, levelOfQuote: 1 });
  return s;
}

describe('socket lifecycle', () => {
  it('emits join exactly once under StrictMode (mount, cleanup, mount)', () => {
    const s = setup('?username=ann&image=avatar3&identity=a@b.c');
    expect(s.f.sockets.length).toBe(2); // StrictMode discarded the first one
    expect(s.f.sockets[0]?.disconnectCalls).toBe(1);
    expect(s.f.sockets[0]?.emitted).toEqual([]);
    expect(s.f.live().length).toBe(1);
    const joins = s.f.sockets.flatMap((x) => x.emitsOf('join'));
    expect(joins).toEqual([[{ username: 'ann', userAvatar: 'avatar3', userIdentity: 'a@b.c' }]]);
    expect(s.socket().emitsOf('join by Id')).toEqual([]);
  });

  it('emits join once without StrictMode too', () => {
    const s = setup('?username=ann', false);
    expect(s.f.sockets.length).toBe(1);
    expect(s.socket().emitsOf('join')).toEqual([[{ username: 'ann', userAvatar: null, userIdentity: null }]]);
  });

  it('does not emit before the deferred timer fires', () => {
    const f = createFakeSocketFactory();
    render(<GamePage search="?username=a" createSocket={f.factory} />);
    expect(f.last().emitted).toEqual([]);
    act(() => void vi.advanceTimersByTime(0));
    expect(f.last().emittedNames()).toEqual(['join']);
  });

  it('emits "join by Id" with a Number when join-id is present (and no join)', () => {
    const s = setup('?join-id=4711&username=ignored');
    const byId = s.f.sockets.flatMap((x) => x.emitsOf('join by Id'));
    expect(byId).toEqual([[4711]]);
    expect(typeof byId[0]?.[0]).toBe('number');
    expect(s.f.sockets.flatMap((x) => x.emitsOf('join'))).toEqual([]);
  });

  it('treats an empty join-id as a new player (legacy falsy check)', () => {
    const s = setup('?join-id=&username=ann');
    expect(s.socket().emittedNames()).toEqual(['join']);
  });

  it.each(['abc', '12abc', '1.5', '-3', ' 7', '1e3'])(
    'never sends the invalid join-id %j to the server and shows the WRONG JOIN ID notice',
    (raw) => {
      const s = setup(`?join-id=${encodeURIComponent(raw)}`);
      expect(s.f.sockets.flatMap((x) => x.emitted)).toEqual([]);
      expect(isHidden('.wrong-id')).toBe(false);
      expect(screen.getByText('WRONG JOIN ID....')).toBeInTheDocument();
      // Enter must not reach a server that has no such player
      key('Enter');
      expect(s.f.sockets.flatMap((x) => x.emitted)).toEqual([]);
    },
  );

  it('keeps the notice hidden for a valid join-id', () => {
    setup('?join-id=5');
    expect(isHidden('.wrong-id')).toBe(true);
  });

  it('subscribes to the handled events only and cleans everything up on unmount', () => {
    const s = setup();
    const socket = s.socket();
    expect(socket.listenerCount('display board')).toBe(0);
    expect(socket.listenerCount('game users')).toBe(0);
    expect(socket.listenerCount('start game')).toBe(1);
    s.unmount();
    expect(socket.listenerCount()).toBe(0);
    expect(socket.disconnectCalls).toBe(1);
  });

  it('shows the notice when the server rejects the id', () => {
    const s = setup('?join-id=99');
    expect(isHidden('.wrong-id')).toBe(true);
    s.server('wrong join id error');
    expect(isHidden('.wrong-id')).toBe(false);
  });
});

describe('navbar and leaderboard refresh', () => {
  it('"joining id" shows the URL username and the new id and refreshes the leaderboard', () => {
    const s = setup('?username=ann');
    expect(q('.current-user-username').textContent).toBe('Username');
    expect(q('.curr-user-id').textContent).toBe('123234');
    const token = board().refreshToken;
    s.server('joining id', 777);
    expect(q('.current-user-username').textContent).toBe('ann');
    expect(q('.curr-user-id').textContent).toBe('777');
    expect(board().joinId).toBe(777);
    expect(board().refreshToken).toBe(token + 1);
  });

  it('"joining by id" shows the server username and bumps the refresh token', () => {
    const s = setup('?join-id=12');
    const token = board().refreshToken;
    s.server('joining by id', 12, 'bob');
    expect(q('.current-user-username').textContent).toBe('bob');
    expect(q('.curr-user-id').textContent).toBe('12');
    expect(board().joinId).toBe(12);
    expect(board().refreshToken).toBe(token + 1);
  });

  it('renders an XSS-looking username as inert text', () => {
    const evil = '<img src=x onerror="window.__pwned=1"><script>window.__pwned=2</script>';
    const s = setup('?join-id=12');
    s.server('joining by id', 12, evil);
    expect(q('.current-user-username').textContent).toBe(evil);
    expect(document.querySelector('.userProfile img')).toBeNull();
    expect(document.querySelector('img[src="x"]')).toBeNull();
    expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined();
  });

  it('"update user leaderboard" and the modal filter button refresh the leaderboard', () => {
    const s = setup();
    const token = board().refreshToken;
    s.server('update user leaderboard');
    expect(board().refreshToken).toBe(token + 1);
    act(() => board().onRefresh());
    expect(board().refreshToken).toBe(token + 2);
  });

  it('starts with the leaderboard open and shows the current year', () => {
    setup();
    expect(board().open).toBe(true);
    expect(q('.current-year').textContent).toBe(String(new Date().getFullYear()));
  });
});

describe('race track', () => {
  it('shows the static placeholder bar until the first lane update', () => {
    setup();
    expect(document.querySelectorAll('.progress-bar').length).toBe(1);
    expect(q('.progress-bar .player-name').textContent).toBe('YOU:');
  });

  it('renders the current player first, as YOU, with the others in server order', () => {
    const s = setup();
    s.server('add user progress', [
      user('bob', { username: 'bob', avatar: 'avatar2' }),
      user('me', { username: 'ann' }),
      user('cy', { username: 'cy' }),
    ]);
    const bars = [...document.querySelectorAll('.progress-bar-container > .progress-bar')];
    expect(bars.map((b) => b.id)).toEqual(['meprogress-bar', 'bobprogress-bar', 'cyprogress-bar']);
    expect(q('#menameid').textContent).toBe('YOU');
    expect(q('#menameid').classList.contains('player-you')).toBe(true);
    expect(q('#bobnameid').textContent).toBe('bob');
    expect(q('#bobnameid').classList.contains('player-you')).toBe(false);
    expect(q('#bobavatar').getAttribute('src')).toBe('/images/avatars/avatar2.png');
    expect(q('#bobwpm').textContent).toBe('0 wpm');
  });

  it('"remove user progress" re-renders the track', () => {
    const s = setup();
    s.server('add user progress', [user('me'), user('bob')]);
    expect(document.querySelectorAll('.progress-bar-container > .progress-bar').length).toBe(2);
    s.server('remove user progress', [user('me')]);
    expect(document.querySelectorAll('.progress-bar-container > .progress-bar').length).toBe(1);
  });

  it('renders XSS-looking lane usernames as inert text', () => {
    const evil = '<img src=x onerror="window.__pwned=1">';
    const s = setup();
    s.server('add user progress', [user('me'), user('eve', { username: evil })]);
    expect(q('#evenameid').textContent).toBe(evil);
    expect(document.querySelector('#evenameid img')).toBeNull();
    expect(document.querySelector('img[src="x"]')).toBeNull();
    expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined();
  });

  it('"user progress" reorders lanes by currWpm (own lane first), moves avatars and labels wpm', () => {
    const s = setup();
    s.server('add user progress', [user('a'), user('me'), user('b'), user('c')]);
    s.server('user progress', [
      user('a', { currWpm: 20, progress: 10 }),
      user('me', { currWpm: 5, progress: 50 }),
      user('b', { currWpm: 90, progress: 100 }),
      user('c', { currWpm: 20, progress: 0 }),
    ]);
    const order = (id: string) => q(`#${id}progress-bar`).style.order;
    expect(order('me')).toBe('1');
    expect(order('b')).toBe('2');
    expect(order('a')).toBe('3'); // ties keep the server order
    expect(order('c')).toBe('4');
    expect(q('#bwpm').textContent).toBe('90 wpm');
    expect(q('#mewpm').textContent).toBe('5 wpm');
    expect(q('#bavatar').style.left).toBe('89%');
    expect(q('#meavatar').style.left).toBe('44.5%');
    expect(q('#aavatar').style.left).toBe(`${10 * 0.89}%`);
    expect(q('#cavatar').style.left).toBe('0%');
  });

  it('ignores progress for a player that has no lane instead of crashing', () => {
    const s = setup();
    s.server('add user progress', [user('me')]);
    expect(() => s.server('user progress', [user('ghost', { currWpm: 99 }), user('me', { currWpm: 7, progress: 10 })])).not.toThrow();
    expect(q('#mewpm').textContent).toBe('7 wpm');
    expect(q('#meprogress-bar').style.order).toBe('1');
  });

  it('colours the status circles for sendStatusReady / sendStatusNotReady', () => {
    const s = setup();
    s.server('add user progress', [user('me'), user('bob')]);
    s.server('sendStatusReady', 'bob');
    expect(q('#bobstatus').style.backgroundColor).toBe('rgb(3, 202, 11)'); // #03ca0b
    s.server('sendStatusNotReady', 'bob');
    expect(q('#bobstatus').style.backgroundColor).toBe('rgb(255, 72, 72)'); // #ff4848
    expect(q('#mestatus').style.backgroundColor).toBe('');
    expect(() => s.server('sendStatusReady', 'nobody')).not.toThrow();
  });

  it('a new add/remove event rebuilds the lanes and drops their transient state (legacy innerHTML rebuild)', () => {
    const s = setup();
    s.server('add user progress', [user('me'), user('bob')]);
    s.server('sendStatusReady', 'bob');
    s.server('user progress', [user('me', { currWpm: 9, progress: 30 }), user('bob')]);
    s.server('add user progress', [user('me'), user('bob'), user('cy')]);
    expect(q('#bobstatus').style.backgroundColor).toBe('');
    expect(q('#mewpm').textContent).toBe('0 wpm');
    expect(q('#meavatar').style.left).toBe('');
    expect(q('#meprogress-bar').style.order).toBe('');
  });

  it.each([
    [1, '1st'],
    [2, '2nd'],
    [3, '3rd'],
    [4, '4th'],
    [12, '12th'],
  ])('"set player rank" %i renders %s with a <sup> suffix', (rank, text) => {
    const s = setup();
    s.server('add user progress', [user('me'), user('bob')]);
    s.server('set player rank', { playerId: 'bob', rank });
    const el = q('#bobuser-rank');
    expect(el.textContent).toBe(text);
    expect(el.querySelector('sup')?.textContent).toBe(text.replace(/^\d+/, ''));
    expect(q('#meuser-rank').textContent).toBe('');
    expect(() => s.server('set player rank', { playerId: 'nobody', rank: 1 })).not.toThrow();
  });
});

describe('insufficient players', () => {
  it('shows "invite 1 more player" for 5 seconds', () => {
    const s = setup();
    expect(isHidden('.insuff-player')).toBe(true);
    s.server('insufficient players');
    expect(isHidden('.insuff-player')).toBe(false);
    expect(q('.insuff-player').textContent).toBe('invite 1 more player');
    s.tick(4999);
    expect(isHidden('.insuff-player')).toBe(false);
    s.tick(1);
    expect(isHidden('.insuff-player')).toBe(true);
  });
});

describe('ready controls', () => {
  it('Get Ready -> Ready emits "ready status" with the selected level and hides the leaderboard', () => {
    const s = setup();
    const btn = q('.ready-btn');
    expect(btn.textContent).toBe('Get Ready');
    expect(btn.getAttribute('style')).toBeNull();
    fireEvent.click(btn);
    expect(btn.textContent).toBe('Ready');
    expect(btn.style.background).toBe('rgb(0, 82, 3)');
    expect(btn.style.color).toBe('white');
    expect(s.socket().emitsOf('ready status')).toEqual([['easy']]);
    expect(board().open).toBe(false);
  });

  it('Ready -> Get Ready emits "not ready" and shows the leaderboard again', () => {
    const s = setup();
    fireEvent.click(q('.ready-btn'));
    fireEvent.click(q('.ready-btn'));
    expect(q('.ready-btn').textContent).toBe('Get Ready');
    expect(q('.ready-btn').style.background).toBe('rgb(28, 28, 28)');
    expect(s.socket().emittedNames()).toEqual(['join', 'ready status', 'not ready']);
    expect(board().open).toBe(true);
  });

  it('sends the difficulty chosen in the select', () => {
    const s = setup();
    fireEvent.change(q('#DifficultySelect'), { target: { value: 'medium' } });
    fireEvent.click(q('.ready-btn'));
    expect(s.socket().emitsOf('ready status')).toEqual([['medium']]);
  });

  it('Enter toggles ready and prevents the default (so a focused button is not clicked twice)', () => {
    const s = setup();
    const notPrevented = fireEvent.keyDown(document, { key: 'Enter' });
    expect(notPrevented).toBe(false);
    expect(s.socket().emitsOf('ready status')).toEqual([['easy']]);
    key('Enter');
    expect(s.socket().emitsOf('not ready')).toEqual([[]]);
  });

  it('Leave match emits "leave match"', () => {
    const s = startedRound();
    fireEvent.click(screen.getByText('Leave match'));
    expect(s.socket().emitsOf('leave match')).toEqual([[]]);
  });
});

describe('key bindings (lobby)', () => {
  it('Escape asks for confirmation and navigates to /index.html only when confirmed', () => {
    const yes = setup();
    key('Escape');
    expect(yes.confirmLeave).toHaveBeenCalledWith('Are you sure you want to leave the game?');
    expect(yes.navigate).toHaveBeenCalledWith('/index.html');
  });

  it('Escape does not navigate when the confirmation is declined', () => {
    const no = setup('?username=a', true, false);
    key('Escape');
    expect(no.confirmLeave).toHaveBeenCalledTimes(1);
    expect(no.navigate).not.toHaveBeenCalled();
  });

  it('the leave-game icon asks for confirmation too', () => {
    const s = setup();
    fireEvent.click(screen.getByAltText('leave-game'));
    expect(s.confirmLeave).toHaveBeenCalledTimes(1);
    expect(s.navigate).toHaveBeenCalledWith('/index.html');
  });

  it('backtick toggles the leaderboard; the footer button too', () => {
    setup();
    expect(board().open).toBe(true);
    key('`');
    expect(board().open).toBe(false);
    key('`');
    expect(board().open).toBe(true);
    fireEvent.click(q('.leaderboard-button'));
    expect(board().open).toBe(false);
  });

  it('Tab switches the leaderboard level Easy <-> Medium and is prevented', () => {
    setup();
    expect(board().level).toBe('easy');
    expect(fireEvent.keyDown(document, { key: 'Tab' })).toBe(false);
    expect(board().level).toBe('medium');
    key('Tab');
    expect(board().level).toBe('easy');
    act(() => board().onLevelChange('medium'));
    expect(board().level).toBe('medium');
  });

  it('Control refreshes the leaderboard (only with ctrlKey set)', () => {
    setup();
    const token = board().refreshToken;
    key('Control');
    expect(board().refreshToken).toBe(token);
    key('Control', { ctrlKey: true });
    expect(board().refreshToken).toBe(token + 1);
  });

  it('Alt toggles the difficulty select (only with altKey set)', () => {
    setup();
    const select = q('#DifficultySelect') as HTMLSelectElement;
    key('Alt');
    expect(select.value).toBe('easy');
    key('Alt', { altKey: true });
    expect(select.value).toBe('medium');
    key('Alt', { altKey: true });
    expect(select.value).toBe('easy');
  });
});

describe('round lifecycle', () => {
  it('"start game" resets the page for the countdown', () => {
    const s = setup();
    s.server('add user progress', [user('me'), user('bob')]);
    s.server('user progress', [user('me', { currWpm: 30, progress: 40 }), user('bob', { currWpm: 10, progress: 20 })]);
    s.server('set player rank', { playerId: 'bob', rank: 2 });
    fireEvent.click(q('.ready-btn')); // ready, leaderboard closed
    s.socket().clearEmitted();

    s.server('start game', { quoteFromServer: QUOTE, levelOfQuote: 1 });

    expect(typing().text).toBe(QUOTE);
    expect(typing().gameKey).toBe(1);
    expect(typing().enabled).toBe(false);
    expect(typing().ended).toBe(false);
    expect(typing().timeLabel).toBe('01:00');
    expect(typing().timerRunning).toBe(false);
    expect(typing().timeUp).toBe(false);
    // lanes reset
    expect(q('#mewpm').textContent).toBe('0 wpm');
    expect(q('#bobwpm').textContent).toBe('0 wpm');
    expect(q('#meavatar').style.left).toBe('0%');
    expect(q('#bobuser-rank').textContent).toBe('');
    // chrome
    expect(board().open).toBe(false);
    expect(isHidden('.countdown')).toBe(false);
    expect(q('.countdown-number').textContent).toBe('10');
    expect(isHidden('.leave-match')).toBe(false);
    expect(isHidden('.player-status')).toBe(true);
    expect(q('#mestatus').classList.contains('hidden')).toBe(true);
    expect(q('#bobstatus').classList.contains('hidden')).toBe(true);
    expect(isHidden('.showWpm')).toBe(true);
    expect(isHidden('.chk_accuracy')).toBe(true);
    // the ready button is reset and the server told
    expect(q('.ready-btn').textContent).toBe('Get Ready');
    expect(s.socket().emittedNames()).toEqual(['not ready']);
  });

  it('runs the countdown, the traffic light and the start of the match on the legacy timeline', () => {
    const s = startedRound();
    const red = q('.red-circle');
    const yellow = q('.yellow-circle');
    const green = q('.green-circle');
    const num = q('.countdown-number');

    s.tick(1000); // value 9: 9 % 3 === 0 -> red
    expect(num.textContent).toBe('9');
    expect([red.style.transform, yellow.style.transform, green.style.transform]).toEqual(['scale(1.4)', 'scale(1)', 'scale(1)']);
    s.tick(1000); // 8 % 3 === 2 -> yellow
    expect(num.textContent).toBe('8');
    expect([red.style.transform, yellow.style.transform, green.style.transform]).toEqual(['scale(1)', 'scale(1.4)', 'scale(1)']);
    s.tick(1000); // 7 % 3 === 1 -> green
    expect(num.textContent).toBe('7');
    expect([red.style.transform, yellow.style.transform, green.style.transform]).toEqual(['scale(1)', 'scale(1)', 'scale(1.4)']);
    s.tick(1000); // 6 -> red again
    expect(red.style.transform).toBe('scale(1.4)');
    s.tick(5000); // 5,4,3,2,1
    expect(num.textContent).toBe('1');
    expect(typing().enabled).toBe(false);
    expect(isHidden('.countdown')).toBe(false);
    expect(s.socket().emitsOf('progress')).toEqual([]);

    s.tick(1000); // t = 10: value 0 + startMatchCountdown
    expect(isHidden('.countdown')).toBe(true);
    expect(isHidden('.countdown-over')).toBe(false);
    expect(q('.countdown-over').textContent).toBe('start typing...');
    expect(green.style.transform).toBe('scale(1)');
    expect(red.style.backgroundColor).toBe('rgb(3, 202, 11)');
    expect(yellow.style.backgroundColor).toBe('rgb(3, 202, 11)');
    expect(typing().enabled).toBe(true);
    expect(typing().timerRunning).toBe(true);
    expect(typing().timeLabel).toBe('01:00');
    expect(num.textContent).toBe('10'); // reset after the countdown

    s.tick(1000); // t = 11: first timer tick + light +1s
    expect(typing().timeLabel).toBe('00:59');
    expect([red, yellow, green].map((c) => c.style.backgroundColor)).toEqual(['green', 'green', 'green']);
    s.tick(1000); // t = 12
    expect([red, yellow, green].map((c) => c.style.backgroundColor)).toEqual(['rgb(3, 202, 11)', 'rgb(3, 202, 11)', 'rgb(3, 202, 11)']);
    s.tick(1000); // t = 13
    expect([red, yellow, green].map((c) => c.style.backgroundColor)).toEqual(['green', 'green', 'green']);
    expect(isHidden('.countdown-over')).toBe(false);
    s.tick(1000); // t = 14
    expect([red, yellow, green].map((c) => c.style.backgroundColor)).toEqual(['rgb(255, 0, 0)', 'rgb(255, 213, 5)', 'rgb(3, 202, 11)']);
    expect(isHidden('.countdown-over')).toBe(true);
  });

  it('emits "progress" every second once the match started, with the percent and wpm', () => {
    const s = startedRound();
    s.tick(10_000);
    expect(s.socket().emitsOf('progress')).toEqual([]);
    act(() => typing().onStats(stats({ counter: 10, progress: 8, mistakes: 1 })));
    s.tick(1000); // 59 s left, 1 s elapsed
    expect(s.socket().emitsOf('progress')).toEqual([[61, 120]]); // trunc(8/13*100), round(10/5*60/1)
    act(() => typing().onStats(stats({ counter: 20, progress: 13, mistakes: 1 })));
    s.tick(1000); // 58 s left, 2 s elapsed
    expect(s.socket().emitsOf('progress')[1]).toEqual([100, 120]);
    expect(typing().timeLabel).toBe('00:58');
  });

  it('ends the round when the clock reaches 0: payloads, order and summary', () => {
    const s = startedRound('?username=ann&Device=Laptop');
    s.tick(10_000);
    act(() => typing().onStats(stats({ counter: 100, progress: 13, mistakes: 3 })));
    s.socket().clearEmitted();
    s.tick(59_000);
    expect(s.socket().emitsOf('progress').length).toBe(59);
    expect(typing().ended).toBe(false);
    expect(typing().timeLabel).toBe('00:01');
    expect(s.socket().emittedNames()).not.toContain('user score');

    s.tick(1000); // 60th tick: time is up
    const names = s.socket().emittedNames();
    expect(names.slice(-5)).toEqual(['progress', 'set leave match true', 'progress', 'user score', 'get rank']);
    expect(names.filter((n) => n === 'progress').length).toBe(61); // 60 ticks + the one inside endGame
    expect(s.socket().emitsOf('progress').at(-1)).toEqual([100, 20]);
    expect(s.socket().emitsOf('user score')).toEqual([[{ wpm: 20, quoteLevel: 1, userDevice: 'Laptop' }]]);
    expect(s.socket().emitsOf('set leave match true')).toEqual([[]]);
    expect(s.socket().emitsOf('get rank')).toEqual([[]]);

    expect(typing().ended).toBe(true);
    expect(typing().enabled).toBe(false);
    expect(typing().timeLabel).toBe('00:00');
    expect(typing().timeUp).toBe(true); // "Time Up!" only when the clock reached 0
    expect(isHidden('.showWpm')).toBe(false);
    expect(isHidden('.chk_accuracy')).toBe(false);
    expect(q('#wordsPerMinute').textContent).toBe('20');
    expect(q('#terminal-accuracy').textContent).toBe('72%'); // floor(100 - 3/11*100)
    expect(isHidden('.leave-match')).toBe(true);
    expect(isHidden('.player-status')).toBe(false);
    expect(q('#mestatus').classList.contains('hidden')).toBe(false);
    expect(board().open).toBe(true); // closed by 'start game', toggled by endGame

    // the timer is stopped
    s.socket().clearEmitted();
    s.tick(5000);
    expect(s.socket().emitted).toEqual([]);
  });

  it('sends userDevice null when the Device parameter is missing', () => {
    const s = startedRound('?username=ann');
    s.tick(10_000);
    act(() => typing().onComplete(stats()));
    expect(s.socket().emitsOf('user score')[0]?.[0]).toMatchObject({ userDevice: null, quoteLevel: 1 });
  });

  it('ends early when the text is completed: wpm over the elapsed time, no "Time Up!"', () => {
    const s = startedRound('?username=ann&Device=mobile');
    s.tick(10_000 + 20_000); // 20 s of typing
    s.socket().clearEmitted();
    act(() => typing().onComplete(stats({ counter: 50, progress: 13, mistakes: 0 })));
    expect(s.socket().emittedNames()).toEqual(['set leave match true', 'progress', 'user score', 'get rank']);
    expect(s.socket().emitsOf('progress')).toEqual([[100, 30]]); // round(50/5*60/20)
    expect(s.socket().emitsOf('user score')).toEqual([[{ wpm: 30, quoteLevel: 1, userDevice: 'mobile' }]]);
    expect(typing().timeUp).toBe(false);
    expect(typing().timeLabel).toBe('00:40');
    expect(q('#terminal-accuracy').textContent).toBe('100%');
    s.socket().clearEmitted();
    s.tick(3000); // the interval was cleared
    expect(s.socket().emitted).toEqual([]);
  });

  it('computes wpm 0 (not NaN / Infinity) when the round ends before the first timer tick', () => {
    const s = startedRound();
    s.tick(10_000); // match started, timeLeft still 60
    s.socket().clearEmitted();
    act(() => typing().onComplete(stats({ counter: 40, progress: 13, mistakes: 0 })));
    expect(s.socket().emitsOf('progress')).toEqual([[100, 0]]);
    expect(s.socket().emitsOf('user score')).toEqual([[{ wpm: 0, quoteLevel: 1, userDevice: 'Laptop' }]]);
    expect(q('#wordsPerMinute').textContent).toBe('0');
    expect(typing().timeLabel).toBe('01:00');
  });

  it('"end game on request" ends the round like a normal end', () => {
    const s = startedRound();
    s.tick(10_000 + 5000);
    act(() => typing().onStats(stats({ counter: 25, progress: 5, mistakes: 0 })));
    s.socket().clearEmitted();
    s.server('end game on request');
    expect(s.socket().emittedNames()).toEqual(['set leave match true', 'progress', 'user score', 'get rank']);
    expect(s.socket().emitsOf('user score')).toEqual([[{ wpm: 60, quoteLevel: 1, userDevice: 'Laptop' }]]);
    expect(typing().ended).toBe(true);
    expect(isHidden('.player-status')).toBe(false);
  });

  it('QUIRK: a repeated endGame toggles the leaderboard again and re-sends the score', () => {
    const s = startedRound();
    s.tick(10_000 + 5000);
    s.server('end game on request');
    expect(board().open).toBe(true);
    s.server('end game on request');
    expect(board().open).toBe(false);
    expect(s.socket().emitsOf('user score').length).toBe(2);
  });

  it('switches the key bindings: round mode swallows the forbidden keys, endGame restores the lobby bindings', () => {
    const s = startedRound();
    s.socket().clearEmitted();
    for (const k of ['Alt', 'Control', 'Fn', 'F1', 'F5', 'F12', 'PrintScreen', 'Insert', 'Delete', 'Tab']) {
      expect(fireEvent.keyDown(document, { key: k }), `${k} is prevented`).toBe(false);
    }
    expect(fireEvent.keyDown(document, { key: 'a' })).toBe(true);
    // lobby bindings are off during the round
    expect(fireEvent.keyDown(document, { key: 'Enter' })).toBe(true);
    expect(fireEvent.keyDown(document, { key: '`' })).toBe(true);
    key('Escape');
    expect(s.confirmLeave).not.toHaveBeenCalled();
    expect(s.socket().emitted).toEqual([]);
    expect(board().open).toBe(false);

    s.tick(10_000 + 2000);
    s.server('end game on request');
    s.socket().clearEmitted();
    expect(fireEvent.keyDown(document, { key: 'Enter' })).toBe(false);
    expect(s.socket().emittedNames()).toEqual(['ready status']);
    key('Escape');
    expect(s.confirmLeave).toHaveBeenCalledTimes(1);
  });

  it('a second round starts clean: new gameKey, lanes reset, summary hidden, no leftovers from the first', () => {
    const s = startedRound();
    s.tick(10_000 + 3000);
    act(() => typing().onStats(stats({ counter: 15, progress: 6, mistakes: 0 })));
    s.server('user progress', [user('me', { currWpm: 60, progress: 50 }), user('bob', { currWpm: 20, progress: 10 })]);
    s.server('end game on request');
    s.server('set player rank', { playerId: 'me', rank: 1 });
    expect(q('#meuser-rank').textContent).toBe('1st');
    expect(typing().gameKey).toBe(1);
    s.socket().clearEmitted();

    s.server('start game', { quoteFromServer: 'abc de', levelOfQuote: 0 });
    expect(typing().gameKey).toBe(2);
    expect(typing().text).toBe('abc de');
    expect(typing().ended).toBe(false);
    expect(typing().timeUp).toBe(false);
    expect(typing().timeLabel).toBe('01:00');
    expect(isHidden('.showWpm')).toBe(true);
    expect(q('#meuser-rank').textContent).toBe('');
    expect(q('#mewpm').textContent).toBe('0 wpm');
    expect(q('#meavatar').style.left).toBe('0%');

    s.tick(10_000);
    s.socket().clearEmitted();
    act(() => typing().onStats(stats({ counter: 5, progress: 3, mistakes: 0, totalChars: 5, wordCount: 2 })));
    s.tick(1000);
    // 5 letters + 2 words - 1 = 6, so 3/6; quoteLevel of the new round
    expect(s.socket().emitsOf('progress')).toEqual([[50, 60]]);
    act(() => typing().onComplete(stats({ counter: 5, progress: 6, mistakes: 0 })));
    expect(s.socket().emitsOf('user score').at(-1)).toEqual([{ wpm: 60, quoteLevel: 0, userDevice: 'Laptop' }]);
  });

  it('survives an empty quote without NaN or Infinity in the emitted numbers', () => {
    const s = setup();
    s.server('start game', { quoteFromServer: '', levelOfQuote: 0 });
    s.tick(10_000 + 1000);
    const values = s.socket().emitsOf('progress').flat();
    expect(values.every((v) => Number.isFinite(v))).toBe(true);
  });

  it('cancels every timer when the page unmounts mid-round', () => {
    const s = startedRound();
    s.tick(3000);
    s.socket().clearEmitted();
    const socket = s.socket();
    s.unmount();
    s.tick(120_000);
    expect(socket.emitted).toEqual([]);
    expect(socket.listenerCount()).toBe(0);
    expect(socket.disconnectCalls).toBe(1);
  });

  it('cancels the match timer when unmounted during the timed phase', () => {
    const s = startedRound();
    s.tick(10_000 + 5000);
    const socket = s.socket();
    socket.clearEmitted();
    s.unmount();
    s.tick(60_000);
    expect(socket.emitted).toEqual([]);
  });
});

describe('page chrome', () => {
  it('keeps the legacy structure and class names the stylesheets rely on', () => {
    setup();
    for (const selector of [
      '.leave-match-pop-up',
      '.wrong-id.hidden',
      '.background-blend',
      '.background > div',
      'img.right-planet',
      'img.left-planet.keyss',
      'nav.navbar .userProfile .current-user-username',
      'nav.navbar img.leave-game',
      'img.leave-game-bind.keyss',
      'img.type-dash.keyss',
      '.middle-container .hero-container .progress-space .progress-bar-container',
      '.hero-container .timer .circles .red-circle',
      '.timer .countdown.hidden .countdown-number',
      '.timer .countdown-over.hidden',
      '.timer .showWpm.details.hidden #wordsPerMinute',
      '.timer .chk_accuracy.details.hidden #terminal-accuracy',
      '.timer .dropdown #DifficultySelect',
      'footer.foo .leaderboard-button img.leaderboard-bind.keyss',
      'footer.foo button.leave-match.hidden',
      'footer.foo .player-status .ready-btn',
      'footer.foo .player-status .insuff-player.hidden',
      'footer.foo .glitch-wrapper .glitch[data-glitch="copyright"]',
      '.overlay.hidden',
      '.transparent-overlay.hidden',
    ]) {
      expect(document.querySelector(selector), selector).not.toBeNull();
    }
  });

  it('renders the leave-match button hidden and the ready area visible before the first round', () => {
    setup();
    expect(isHidden('.leave-match')).toBe(true);
    expect(isHidden('.player-status')).toBe(false);
    expect(typing().text).toBeNull();
    expect(typing().enabled).toBe(false);
    expect(q('.timer .countdown').classList.contains('hidden')).toBe(true);
  });
});
