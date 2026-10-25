import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { HomePage } from './HomePage';
import { BoyNames, GirlNames } from '../data/names';
import { createFakeSocketFactory } from '../test-utils/FakeSocket';
import { navigateAvatar, pickRandomName, detectDevice, avatarHint } from './helpers';

// The page opens a socket for the online count; never a real one in tests.
vi.mock('../lib/socket', async () => {
  const { FakeSocket } = await import('../test-utils/FakeSocket');
  return { createSocket: () => new FakeSocket() };
});

const LEGACY_DOWN: Record<number, number> = {
  0: 8, 1: 8, 2: 9, 3: 10, 4: 11, 5: 12, 6: 13, 7: 14,
  8: 8, 9: 9, 10: 10, 11: 11, 12: 12, 13: 13, 14: 14,
};
const LEGACY_UP: Record<number, number> = {
  0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7,
  8: 1, 9: 2, 10: 3, 11: 4, 12: 5, 13: 6, 14: 7,
};

describe('helpers', () => {
  it('matches legacy navigation tables for every index', () => {
    for (let i = 0; i < 15; i++) {
      expect(navigateAvatar(i, 'ArrowDown')).toBe(LEGACY_DOWN[i]);
      expect(navigateAvatar(i, 'ArrowUp')).toBe(LEGACY_UP[i]);
      expect(navigateAvatar(i, 'ArrowRight')).toBe(i === 14 ? 0 : i + 1);
      expect(navigateAvatar(i, 'ArrowLeft')).toBe(i === 0 ? 14 : i - 1);
    }
  });
  it('hints only on fall-through', () => {
    expect(avatarHint(8, 'ArrowDown')).toBe('use up arrow to go up');
    expect(avatarHint(3, 'ArrowUp')).toBe('use down arrow to go down');
    expect(avatarHint(3, 'ArrowDown')).toBeUndefined();
  });
  it('picks names by toggle with injected rng', () => {
    const rng = vi.fn().mockReturnValueOnce(0.5).mockReturnValueOnce(0);
    expect(pickRandomName(true, rng)).toBe(GirlNames[Math.floor(0.5 * GirlNames.length)]);
    expect(rng).toHaveBeenCalledTimes(2);
    expect(pickRandomName(false, () => 0)).toBe(BoyNames[0]);
    expect(pickRandomName(true, () => 0.999999)).toBe(GirlNames[GirlNames.length - 1]);
  });
  it('detects device', () => {
    expect(detectDevice(499)).toBe('mobile');
    expect(detectDevice(500)).toBe('laptop');
  });
});

function checkedIndex(): number {
  return Array.from(document.querySelectorAll<HTMLInputElement>('.avatar-select-input')).findIndex(
    (r) => r.checked,
  );
}
const form = () => document.getElementById('entry-form') as HTMLFormElement;
const warning = () => document.querySelector('.max-char-warning')!;
const username = () => document.getElementById('username') as HTMLInputElement;
const key = (k: string, init: KeyboardEventInit = {}) =>
  fireEvent.keyDown(document, { key: k, ...init });

describe('HomePage', () => {
  beforeEach(() => {
    vi.stubGlobal('innerWidth', 1024);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders legacy structure, focuses username, one avatar checked', () => {
    render(<HomePage />);
    expect(document.querySelectorAll('.avatar-select-input')).toHaveLength(15);
    expect(checkedIndex()).toBeGreaterThanOrEqual(0);
    expect(document.activeElement).toBe(username());
    expect(form().getAttribute('action')).toBe('multiplayer.html');
    expect(document.getElementById('log-in')!.getAttribute('action')).toBe('multiplayer.html');
    expect(document.querySelector('.current-year')!.textContent).toBe(
      String(new Date().getFullYear()),
    );
  });

  it('submits the legacy fields (laptop)', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.2); // avatar index 3
    render(<HomePage />);
    await userEvent.type(username(), 'Bob');
    const fd = new FormData(form());
    expect(Object.fromEntries(fd.entries())).toEqual({
      image: 'avatar4',
      Device: 'laptop',
      username: 'Bob',
      identity: 'none',
    });
  });

  it('uses Device=mobile and keeps modal hidden under 500px', () => {
    vi.stubGlobal('innerWidth', 400);
    render(<HomePage />);
    expect(new FormData(form()).get('Device')).toBe('mobile');
    expect(document.querySelector('.rules-modal')!.classList.contains('hidden')).toBe(true);
  });

  it('shows max-char warning at exactly 10 chars only', async () => {
    render(<HomePage />);
    await userEvent.type(username(), '123456789');
    expect(warning().classList.contains('hidden')).toBe(true);
    await userEvent.type(username(), '0');
    expect(warning().classList.contains('hidden')).toBe(false);
    await userEvent.type(username(), '{Backspace}');
    expect(warning().classList.contains('hidden')).toBe(true);
  });

  it('arrow keys move the selection', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // index 0
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    render(<HomePage />);
    key('ArrowLeft');
    expect(checkedIndex()).toBe(14);
    key('ArrowRight');
    expect(checkedIndex()).toBe(0);
    key('ArrowDown');
    expect(checkedIndex()).toBe(8);
    key('ArrowDown');
    expect(checkedIndex()).toBe(8);
    expect(log).toHaveBeenCalledWith('use up arrow to go up');
    key('ArrowUp');
    expect(checkedIndex()).toBe(1);
  });

  it('Ctrl toggles gender; Alt rolls name by toggle and hides warning', async () => {
    render(<HomePage />);
    const toggler = document.getElementById('name-toggler') as HTMLInputElement;
    expect(toggler.checked).toBe(false);
    key('Control', { ctrlKey: true });
    expect(toggler.checked).toBe(true);
    await userEvent.type(username(), '1234567890');
    expect(warning().classList.contains('hidden')).toBe(false);
    key('Alt', { altKey: true });
    expect(GirlNames).toContain(username().value);
    expect(warning().classList.contains('hidden')).toBe(true);
    key('Control', { ctrlKey: true });
    key('Alt', { altKey: true });
    expect(BoyNames).toContain(username().value);
  });

  it('dice rolls a name, question mark toggles modal, Tab and backtick move focus', () => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole('button', { name: 'Roll a random name' }));
    expect(BoyNames).toContain(username().value);
    const modal = document.querySelector('.rules-modal')!;
    fireEvent.click(screen.getByRole('button', { name: 'Contact rules' }));
    expect(modal.classList.contains('hidden')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Contact rules' }));
    expect(modal.classList.contains('hidden')).toBe(true);

    const contact = document.getElementById('identity')!;
    key('Tab');
    expect(document.activeElement).toBe(contact);
    key('Tab');
    expect(document.activeElement).toBe(username());
    key('`');
    expect(document.activeElement).toBe(document.getElementById('user-join-id'));
  });

  it('prevents "=" and cleans up the listener on unmount (StrictMode)', () => {
    const { unmount } = render(
      <StrictMode>
        <HomePage />
      </StrictMode>,
    );
    const ev = new KeyboardEvent('keydown', { key: '=', cancelable: true });
    document.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    unmount();
    const ev2 = new KeyboardEvent('keydown', { key: '=', cancelable: true });
    document.dispatchEvent(ev2);
    expect(ev2.defaultPrevented).toBe(false);
  });

  it('renders usernames as text, never HTML', async () => {
    render(<HomePage />);
    await userEvent.type(username(), 'a');
    expect(document.querySelectorAll('script, img[onerror]')).toHaveLength(0);
  });
});

describe('page structure', () => {
  it('labels every field and keeps the form fields the game page reads', () => {
    render(<HomePage />);
    expect(screen.getByLabelText('Name')).toBe(username());
    expect(screen.getByLabelText('Raced before? Log in with your Player ID.')).toBe(
      document.getElementById('user-join-id'),
    );
    expect(screen.getByRole('switch', { name: /Girl names/ })).toBe(document.getElementById('name-toggler'));
    const names = Array.from(form().elements)
      .map((el) => (el as HTMLInputElement).name)
      .filter(Boolean);
    expect(new Set(names)).toEqual(new Set(['image', 'Device', 'username', 'identity']));
    // the legacy key-hint images are real <kbd> hints now
    expect(document.querySelectorAll('img:not(.avatars-select-image)')).toHaveLength(0);
    expect(Array.from(document.querySelectorAll('kbd'), (k) => k.textContent)).toEqual(
      expect.arrayContaining(['Enter', 'Alt', 'Ctrl', '`']),
    );
  });
});

describe('players online', () => {
  it('follows the server count over a socket that never joins, and closes it on unmount', () => {
    const f = createFakeSocketFactory();
    const { unmount } = render(
      <StrictMode>
        <HomePage createSocket={f.factory} />
      </StrictMode>,
    );
    // StrictMode mounts twice: the first socket is closed, one stays open
    expect(f.live()).toHaveLength(1);
    expect(document.querySelector('.players-online')).toBeNull();

    act(() => f.last().receive('players online', 4));
    expect(document.querySelector('.topbar .players-online-count')?.textContent).toBe('4');
    expect(document.querySelector('.players-online')).toHaveAttribute('title', '4 players online');
    act(() => f.last().receive('players online', 0));
    expect(document.querySelector('.players-online-count')?.textContent).toBe('0');

    expect(f.sockets.flatMap((s) => s.emitted)).toEqual([]);
    unmount();
    expect(f.live()).toHaveLength(0);
    expect(f.last().listenerCount()).toBe(0);
  });
});

describe('settings', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it('applies and saves the picked theme, and keeps keys away from the page while open', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // avatar index 0
    render(<HomePage />);
    expect(document.documentElement.dataset.theme).toBe('dash');
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    const dialog = screen.getByRole('dialog', { name: 'Settings' });

    fireEvent.click(screen.getByRole('radio', { name: /Terminal/ }));
    expect(document.documentElement.dataset.theme).toBe('terminal');
    expect(localStorage.getItem('typedash:theme')).toBe('terminal');
    expect(document.head.querySelector('link[data-theme-font*="Martian+Mono"]')).not.toBeNull();

    // the page moves the avatar on arrow keys; inside the dialog they belong to the theme radios
    fireEvent.keyDown(dialog, { key: 'ArrowRight' });
    expect(checkedIndex()).toBe(0);

    fireEvent.click(screen.getByRole('switch', { name: /Starfield/ }));
    expect(localStorage.getItem('typedash:starfield')).toBe('off');

    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('starts from the saved theme', () => {
    localStorage.setItem('typedash:theme', 'riso');
    render(<HomePage />);
    expect(document.documentElement.dataset.theme).toBe('riso');
  });

  it('falls back to the default theme for an unknown saved value', () => {
    localStorage.setItem('typedash:theme', 'no-such-theme');
    render(<HomePage />);
    expect(document.documentElement.dataset.theme).toBe('dash');
  });
});
