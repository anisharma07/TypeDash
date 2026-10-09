import { StrictMode } from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createEngine, pressBackspace, pressSpace, typeChar } from '../../engine';
import type { EngineState, LetterModel } from '../../engine';
import type { TypingAreaProps, TypingStats } from '../types';
import { TypingArea } from './TypingArea';

// The real engine is implemented by another module; here it is replaced by a tiny fake
// with the same contract so these tests only cover the component. One test at the
// bottom switches to the real engine.
vi.mock('../../engine', () => ({
  createEngine: vi.fn(),
  typeChar: vi.fn(),
  pressSpace: vi.fn(),
  pressBackspace: vi.fn(),
}));

const createEngineMock = vi.mocked(createEngine);
const typeCharMock = vi.mocked(typeChar);
const pressSpaceMock = vi.mocked(pressSpace);
const pressBackspaceMock = vi.mocked(pressBackspace);

/* ---------- fake engine (same observable contract as engine/types.ts) ---------- */

function fakeCreate(text: string): EngineState {
  const words = text.split(' ').map((w) => ({
    letters: w.split('').map((char): LetterModel => ({ char, status: 'pending' })),
  }));
  const totalChars = words.reduce((n, w) => n + w.letters.length, 0);
  return {
    words,
    wordIndex: 0,
    letterIndex: 0,
    counter: 0,
    progress: 0,
    mistakes: 0,
    totalChars,
    wordCount: words.length,
    finished: false,
  };
}

function withWord(s: EngineState, letters: LetterModel[]): EngineState['words'] {
  return s.words.map((w, i) => (i === s.wordIndex ? { letters } : w));
}

function fakeType(s: EngineState, ch: string): EngineState {
  const letters = s.words[s.wordIndex].letters;
  if (s.letterIndex < letters.length) {
    const ok = letters[s.letterIndex].char === ch;
    const next = letters.map((l, i): LetterModel =>
      i === s.letterIndex ? { ...l, status: ok ? 'correct' : 'incorrect' } : l,
    );
    const last = s.wordIndex === s.words.length - 1 && s.letterIndex === letters.length - 1;
    return {
      ...s,
      words: withWord(s, next),
      letterIndex: s.letterIndex + 1,
      counter: s.counter + (ok ? 1 : 0),
      progress: s.progress + 1,
      mistakes: s.mistakes + (ok ? 0 : 1),
      finished: last,
    };
  }
  const extra: LetterModel = { char: ch, status: 'incorrect', extra: true };
  return {
    ...s,
    words: withWord(s, [...letters, extra]),
    letterIndex: letters.length + 1,
    mistakes: s.mistakes + 1,
  };
}

function fakeSpace(s: EngineState): EngineState {
  const letters = s.words[s.wordIndex].letters;
  const done = letters.every((l) => l.status === 'correct');
  if (!done || s.letterIndex === 0 || s.wordIndex === s.words.length - 1) return s;
  return { ...s, wordIndex: s.wordIndex + 1, letterIndex: 0, counter: s.counter + 1, progress: s.progress + 1 };
}

function fakeBackspace(s: EngineState): EngineState {
  if (s.letterIndex === 0) return s;
  const letters = s.words[s.wordIndex].letters;
  const prev = letters[s.letterIndex - 1];
  const next = prev.extra
    ? letters.slice(0, s.letterIndex - 1)
    : letters.map((l, i): LetterModel => (i === s.letterIndex - 1 ? { char: l.char, status: 'pending' } : l));
  return {
    ...s,
    words: withWord(s, next),
    letterIndex: s.letterIndex - 1,
    progress: prev.extra ? s.progress : s.progress - 1,
    counter: prev.status === 'correct' ? s.counter - 1 : s.counter,
  };
}

function useFakeEngine() {
  createEngineMock.mockImplementation(fakeCreate);
  typeCharMock.mockImplementation(fakeType);
  pressSpaceMock.mockImplementation(fakeSpace);
  pressBackspaceMock.mockImplementation(fakeBackspace);
}

/* ---------- helpers ---------- */

function setup(overrides: Partial<TypingAreaProps> = {}, strict = false) {
  const onStats = vi.fn<(s: TypingStats) => void>();
  const onComplete = vi.fn<(s: TypingStats) => void>();
  const props: TypingAreaProps = {
    text: 'ab cd',
    gameKey: 1,
    enabled: true,
    ended: false,
    timeLabel: '01:00',
    timerRunning: true,
    timeUp: false,
    onStats,
    onComplete,
    ...overrides,
  };
  const ui = (p: TypingAreaProps) => (strict ? <StrictMode><TypingArea {...p} /></StrictMode> : <TypingArea {...p} />);
  const utils = render(ui(props));
  const q = <T extends Element = HTMLElement>(sel: string) => {
    const el = utils.container.querySelector<T>(sel);
    if (!el) throw new Error(`missing ${sel}`);
    return el;
  };
  const rerender = (next: Partial<TypingAreaProps>) => {
    Object.assign(props, next);
    utils.rerender(ui({ ...props }));
  };
  return { ...utils, props, onStats, onComplete, q, rerender, user: userEvent.setup() };
}

const letterEls = (root: ParentNode) => Array.from(root.querySelectorAll('.letter'));
const classes = (el: Element) => Array.from(el.classList);

let consoleError: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.clearAllMocks();
  useFakeEngine();
  consoleError = vi.spyOn(console, 'error');
});
afterEach(() => {
  // React warnings (unknown tags, invalid nesting, act, keys) must never appear
  expect(consoleError).not.toHaveBeenCalled();
  vi.restoreAllMocks();
});

/* ---------- markup ---------- */

describe('markup', () => {
  it('reproduces the legacy .container structure and order', () => {
    const { q, container } = setup({ timeUp: false, enabled: false });
    const root = q('.container');
    expect(container.firstElementChild).toBe(root);
    expect(Array.from(root.children).map((c) => c.id || c.className)).toEqual([
      'time-up-warn hidden',
      'timerClass',
      'caps-lock hidden',
      'cursor',
      'text-content-div',
      'input-field',
    ]);
    expect(q('.time-up-warn > p')).toHaveTextContent('Time Up!');
    expect(q('.timerClass > h3 > strong.stopwatch')).toHaveTextContent('01:00');
    expect(q('.caps-lock > p > i.bx.bxs-lock-alt')).toBeInTheDocument();
    expect(q('.caps-lock p')).toHaveTextContent('Caps Lock');
    expect(q('#cursor')).toHaveClass('hidden');
    const div = q('.text-content-div');
    expect(Array.from(div.children).map((c) => c.id || c.className)).toEqual(['dummy-cursor hidden', 'text-content']);
    expect(div.lastElementChild?.tagName).toBe('P');
  });

  it('hidden input has the legacy attributes', () => {
    const { q } = setup();
    const input = q<HTMLInputElement>('input.input-field');
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('autocorrect', 'off');
    expect(input).toHaveAttribute('autocapitalize', 'off');
    expect(input).toHaveAttribute('autocomplete', 'off');
  });

  it('shows the placeholder sentence as plain text when there is no quote', () => {
    const { q } = setup({ text: null });
    const p = q('#text-content');
    expect(p).toHaveTextContent('Press Enter or Click on Get Ready button to start....');
    expect(p.children).toHaveLength(0);
    expect(createEngineMock).not.toHaveBeenCalled();
  });

  it('time-up banner, stopwatch label and running colour follow the props', () => {
    const { q, rerender } = setup({ timerRunning: false, timeLabel: '00:42' });
    expect(q('.stopwatch')).toHaveTextContent('00:42');
    expect(q('.stopwatch').style.color).toBe('');
    rerender({ timerRunning: true });
    expect(q('.stopwatch').style.color).toBe('rgb(226, 183, 20)');
    rerender({ timerRunning: false });
    expect(q('.stopwatch').style.color).toBe('');
    expect(q('.time-up-warn')).toHaveClass('hidden');
    rerender({ timeUp: true });
    expect(q('.time-up-warn')).not.toHaveClass('hidden');
  });
});

describe('quote rendering', () => {
  it('renders .word > .letter with current word/letter and no React warnings', () => {
    const { q } = setup({ text: 'ab cd' });
    const words = Array.from(q('#text-content').children);
    expect(words.map((w) => w.className)).toEqual(['word current', 'word']);
    expect(words.map((w) => w.textContent)).toEqual(['ab', 'cd']);
    expect(letterEls(q('#text-content')).map((l) => l.className)).toEqual([
      'letter current',
      'letter',
      'letter',
      'letter',
    ]);
    // each letter is a direct child of its word, no whitespace text nodes (inline-block layout depends on it)
    words.forEach((w) => expect(Array.from(w.childNodes).every((n) => n.nodeType === Node.ELEMENT_NODE)).toBe(true));
    expect(q('#text-content').childNodes).toHaveLength(2);
  });

  it('maps statuses to correctText / incorrectText / missed / extra', () => {
    createEngineMock.mockImplementation(() => ({
      words: [
        {
          letters: [
            { char: 'a', status: 'correct' },
            { char: 'b', status: 'incorrect' },
            { char: 'c', status: 'missed' },
            { char: 'd', status: 'pending' },
            { char: 'x', status: 'incorrect', extra: true },
          ],
        },
      ],
      wordIndex: 0,
      letterIndex: 3,
      counter: 0,
      progress: 0,
      mistakes: 0,
      totalChars: 4,
      wordCount: 1,
      finished: false,
    }));
    const { q } = setup({ text: 'abcd' });
    expect(letterEls(q('#text-content')).map(classes)).toEqual([
      ['letter', 'correctText'],
      ['letter', 'incorrectText'],
      ['letter', 'missed'],
      ['letter', 'current'],
      ['letter', 'incorrectText', 'extra'],
    ]);
  });

  it('renders quote text as text, never as HTML (stored XSS fix)', () => {
    const evil = '<img src=x onerror=alert(1)>';
    const { q } = setup({ text: evil });
    expect(q('#text-content').querySelector('img')).toBeNull();
    // words are separated by margins, not by text nodes (legacy too)
    expect(Array.from(q('#text-content').children).map((w) => w.textContent)).toEqual(['<img', 'src=x', 'onerror=alert(1)>']);
  });
});

/* ---------- input ---------- */

describe('input handling', () => {
  it('is disabled until enabled, and ignores typing while disabled', async () => {
    const { q, user, rerender } = setup({ enabled: false });
    const input = q<HTMLInputElement>('input');
    expect(input).toBeDisabled();
    await user.click(q('#text-content'));
    await user.keyboard('a');
    expect(typeCharMock).not.toHaveBeenCalled();
    rerender({ enabled: true });
    expect(input).toBeEnabled();
    await user.click(q('#text-content'));
    await user.keyboard('a');
    expect(typeCharMock).toHaveBeenCalledTimes(1);
  });

  it('typed characters call typeChar with the current engine state', async () => {
    const { q, user, onStats } = setup({ text: 'abc' });
    await user.click(q('#text-content'));
    await user.keyboard('az');
    expect(typeCharMock).toHaveBeenCalledTimes(2);
    expect(typeCharMock.mock.calls.map((c) => c[1])).toEqual(['a', 'z']);
    expect(typeCharMock.mock.calls[0][0].letterIndex).toBe(0);
    expect(typeCharMock.mock.calls[1][0].letterIndex).toBe(1);
    expect(letterEls(q('#text-content')).map((l) => l.className)).toEqual([
      'letter correctText',
      'letter incorrectText',
      'letter current',
    ]);
    expect(onStats).toHaveBeenLastCalledWith({ counter: 1, progress: 2, mistakes: 1, totalChars: 3, wordCount: 1 });
    expect(pressSpaceMock).not.toHaveBeenCalled();
    expect(pressBackspaceMock).not.toHaveBeenCalled();
  });

  it('space calls pressSpace (not typeChar) and clears the field', async () => {
    const { q, user } = setup({ text: 'ab cd' });
    const input = q<HTMLInputElement>('input');
    await user.click(q('#text-content'));
    await user.keyboard('ab');
    expect(input.value).toBe('ab');
    await user.keyboard(' ');
    expect(pressSpaceMock).toHaveBeenCalledTimes(1);
    expect(typeCharMock).toHaveBeenCalledTimes(2);
    expect(input.value).toBe('');
    expect(q('#text-content').children[1]).toHaveClass('current');
    // the field index restarts at 0: the next char is read from position 0
    await user.keyboard('c');
    expect(typeCharMock.mock.calls[2][1]).toBe('c');
  });

  it('space is still forwarded (and the field cleared) when the engine ignores it', async () => {
    const { q, user } = setup({ text: 'ab cd' });
    const input = q<HTMLInputElement>('input');
    await user.click(q('#text-content'));
    await user.keyboard('x ');
    expect(pressSpaceMock).toHaveBeenCalledTimes(1);
    expect(input.value).toBe('');
    expect(q('#text-content').children[0]).toHaveClass('current');
  });

  it('Backspace keydown is prevented, calls pressBackspace and clears the field', async () => {
    const { q, user } = setup({ text: 'abc' });
    const input = q<HTMLInputElement>('input');
    await user.click(q('#text-content'));
    await user.keyboard('ab');
    expect(fireEvent.keyDown(input, { key: 'Backspace' })).toBe(false); // preventDefault called
    expect(pressBackspaceMock).toHaveBeenCalledTimes(1);
    expect(input.value).toBe('');
    expect(letterEls(q('#text-content')).map((l) => l.className)).toEqual([
      'letter correctText',
      'letter current',
      'letter',
    ]);
    await user.keyboard('{Backspace}');
    expect(pressBackspaceMock).toHaveBeenCalledTimes(2);
  });

  it('a deletion on a soft keyboard (value got shorter) maps to pressBackspace', async () => {
    const { q, user } = setup({ text: 'abc' });
    const input = q<HTMLInputElement>('input');
    await user.click(q('#text-content'));
    await user.keyboard('ab');
    fireEvent.input(input, { target: { value: 'a' } });
    expect(pressBackspaceMock).toHaveBeenCalledTimes(1);
    expect(typeCharMock).toHaveBeenCalledTimes(2);
    expect(input.value).toBe('');
  });

  it('arrow keys, Home and End are prevented; ordinary keys are not', () => {
    const { q } = setup();
    const input = q<HTMLInputElement>('input');
    for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']) {
      expect(fireEvent.keyDown(input, { key })).toBe(false);
    }
    expect(fireEvent.keyDown(input, { key: 'a' })).toBe(true);
    expect(fireEvent.keyDown(input, { key: 'Enter' })).toBe(true);
  });

  it('paste is prevented', () => {
    const { q } = setup();
    expect(fireEvent.paste(q('input'))).toBe(false);
    expect(typeCharMock).not.toHaveBeenCalled();
  });

  it('collapses a text selection on keydown', () => {
    const { q } = setup();
    const input = q<HTMLInputElement>('input');
    input.value = 'abc';
    input.setSelectionRange(0, 3);
    expect(input.selectionStart).not.toBe(input.selectionEnd);
    fireEvent.keyDown(input, { key: 'a' });
    expect(input.selectionStart).toBe(input.selectionEnd);
  });

  it('any document keydown focuses the input; clicking the text focuses it too', async () => {
    const { q, user } = setup();
    const input = q<HTMLInputElement>('input');
    expect(document.activeElement).not.toBe(input);
    fireEvent.keyDown(document.body, { key: 'x' });
    expect(document.activeElement).toBe(input);
    input.blur();
    await user.click(q('#text-content'));
    expect(document.activeElement).toBe(input);
  });

  it('removes its document listener on unmount', () => {
    const { q, unmount } = setup();
    const input = q<HTMLInputElement>('input');
    unmount();
    const focus = vi.spyOn(input, 'focus');
    fireEvent.keyDown(document.body, { key: 'x' });
    expect(focus).not.toHaveBeenCalled();
  });

  it('caps-lock indicator follows getModifierState on keydown', () => {
    const { q } = setup();
    const input = q<HTMLInputElement>('input');
    const caps = q('.caps-lock');
    expect(caps).toHaveClass('hidden');
    fireEvent.keyDown(input, { key: 'A', modifierCapsLock: true });
    expect(caps).not.toHaveClass('hidden');
    fireEvent.keyDown(input, { key: 'a', modifierCapsLock: false });
    expect(caps).toHaveClass('hidden');
  });

  it('ignores all input once the engine reports finished', async () => {
    const { q, user, onComplete } = setup({ text: 'ab' });
    await user.click(q('#text-content'));
    await user.keyboard('ab');
    expect(onComplete).toHaveBeenCalledTimes(1);
    await user.keyboard('c{Backspace}');
    expect(typeCharMock).toHaveBeenCalledTimes(2);
    expect(pressBackspaceMock).not.toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

/* ---------- cursors ---------- */

describe('dummy cursor and real cursor', () => {
  it('dummy cursor shows once enabled, real cursor stays hidden until the first input', async () => {
    const { q, user, rerender } = setup({ enabled: false });
    expect(q('.dummy-cursor')).toHaveClass('hidden');
    expect(q('#cursor')).toHaveClass('hidden');
    rerender({ enabled: true });
    expect(q('.dummy-cursor')).not.toHaveClass('hidden');
    expect(q('#cursor')).toHaveClass('hidden');
    await user.click(q('#text-content'));
    await user.keyboard('a');
    expect(q('.dummy-cursor')).toHaveClass('hidden');
    expect(q('#cursor')).not.toHaveClass('hidden');
  });

  it('legacy quirk: a Backspace keydown alone does not reveal the real cursor', async () => {
    const { q, user } = setup();
    await user.click(q('#text-content'));
    await user.keyboard('{Backspace}');
    expect(q('.dummy-cursor')).not.toHaveClass('hidden');
    expect(q('#cursor')).toHaveClass('hidden');
  });

  it('both cursors are hidden when the round has ended', async () => {
    const { q, user, rerender } = setup();
    await user.click(q('#text-content'));
    await user.keyboard('a');
    rerender({ enabled: false, ended: true });
    expect(q('#cursor')).toHaveClass('hidden');
    expect(q('.dummy-cursor')).toHaveClass('hidden');
  });
});

/* ---------- ended ---------- */

describe('round end presentation', () => {
  it('disables the input, flags untyped letters incorrect, makes the text scrollable, clears the scroll', async () => {
    const { q, user, rerender } = setup({ text: 'ab cd' });
    const div = q('.text-content-div');
    expect(div.style.overflow).toBe('hidden');
    await user.click(q('#text-content'));
    await user.keyboard('a');
    q('#text-content').style.marginTop = '-72px';
    rerender({ enabled: false, ended: true });
    expect(q('input')).toBeDisabled();
    expect(div.style.overflow).toBe('auto');
    expect(q('#text-content').style.marginTop).toBe('');
    expect(letterEls(q('#text-content')).map((l) => l.className)).toEqual([
      'letter correctText',
      'letter incorrectText current',
      'letter incorrectText',
      'letter incorrectText',
    ]);
  });

  it('keeps correct/incorrect letters as they are and adds incorrectText to missed ones', () => {
    createEngineMock.mockImplementation(() => ({
      ...fakeCreate('abc'),
      words: [
        {
          letters: [
            { char: 'a', status: 'correct' },
            { char: 'b', status: 'incorrect' },
            { char: 'c', status: 'missed' },
          ],
        },
      ],
      letterIndex: 3,
    }));
    const { q } = setup({ text: 'abc', ended: true, enabled: false });
    expect(letterEls(q('#text-content')).map(classes)).toEqual([
      ['letter', 'correctText'],
      ['letter', 'incorrectText'],
      ['letter', 'missed', 'incorrectText'],
    ]);
  });

  it('does not run caret maths for typing after the round ended', async () => {
    const { q, rerender } = setup();
    rerender({ enabled: false, ended: true });
    fireEvent.input(q('input'), { target: { value: 'a' } });
    expect(typeCharMock).not.toHaveBeenCalled();
  });
});

/* ---------- gameKey ---------- */

describe('gameKey reset', () => {
  it('starts a fresh engine, caret and scroll for every new gameKey', async () => {
    const { q, user, rerender, onStats } = setup({ text: 'ab cd', gameKey: 1 });
    await user.click(q('#text-content'));
    await user.keyboard('ab ');
    q('#cursor').style.top = '10px';
    q('#cursor').style.left = '99px';
    q('#text-content').style.marginTop = '-72px';
    expect(q('#text-content').children[1]).toHaveClass('current');

    createEngineMock.mockClear();
    rerender({ gameKey: 2, text: 'xy zz' });
    expect(createEngineMock).toHaveBeenCalledWith('xy zz');
    expect(q('#cursor').style.top).toBe('53px');
    expect(q('#cursor').style.left).toBe('23px');
    expect(q('#text-content').style.marginTop).toBe('');
    expect(q('#cursor')).toHaveClass('hidden');
    expect(q('#text-content')).toHaveTextContent('xyzz');
    expect(letterEls(q('#text-content')).map((l) => l.className)).toEqual([
      'letter current',
      'letter',
      'letter',
      'letter',
    ]);
    expect(onStats).toHaveBeenLastCalledWith({ counter: 0, progress: 0, mistakes: 0, totalChars: 4, wordCount: 2 });
  });

  it('a new gameKey with the same text also resets typed progress', async () => {
    const { q, user, rerender } = setup({ text: 'ab', gameKey: 1 });
    await user.click(q('#text-content'));
    await user.keyboard('a');
    expect(q('.correctText')).toBeInTheDocument();
    rerender({ gameKey: 2 });
    expect(q('#text-content').querySelector('.correctText')).toBeNull();
  });

  it('an empty input value / index is reset with the new round', async () => {
    const { q, user, rerender } = setup({ text: 'abc', gameKey: 1 });
    await user.click(q('#text-content'));
    await user.keyboard('ab');
    rerender({ gameKey: 2, text: 'abc' });
    await user.click(q('#text-content'));
    await user.keyboard('a');
    // had the old index (2) survived, 'a' would have been read from position 2 of "a" -> deletion
    expect(pressBackspaceMock).not.toHaveBeenCalled();
    expect(typeCharMock.mock.calls.at(-1)?.[1]).toBe('a');
  });
});

/* ---------- onStats / onComplete ---------- */

describe.each([
  ['plain', false],
  ['StrictMode', true],
])('onStats / onComplete (%s)', (_name, strict) => {
  it('reports initial stats once, then once per state change, never while rendering', async () => {
    const { q, user, onStats } = setup({ text: 'ab' }, strict);
    expect(onStats).toHaveBeenCalledTimes(1);
    expect(onStats).toHaveBeenLastCalledWith({ counter: 0, progress: 0, mistakes: 0, totalChars: 2, wordCount: 1 });
    await user.click(q('#text-content'));
    await user.keyboard('a');
    expect(onStats).toHaveBeenCalledTimes(2);
    expect(onStats).toHaveBeenLastCalledWith({ counter: 1, progress: 1, mistakes: 0, totalChars: 2, wordCount: 1 });
    await user.keyboard('{Backspace}');
    expect(onStats).toHaveBeenCalledTimes(3);
    expect(onStats).toHaveBeenLastCalledWith({ counter: 0, progress: 0, mistakes: 0, totalChars: 2, wordCount: 1 });
  });

  it('does not report when the engine ignores the key (same state object)', async () => {
    const { q, user, onStats } = setup({ text: 'ab' }, strict);
    await user.click(q('#text-content'));
    await user.keyboard('{Backspace}'); // at the first letter: fake engine returns the same state
    expect(onStats).toHaveBeenCalledTimes(1);
  });

  it('calls onComplete exactly once, with the final stats, after the final onStats', async () => {
    const order: string[] = [];
    const { q, user, onStats, onComplete } = setup({ text: 'ab' }, strict);
    onStats.mockImplementation(() => order.push('stats'));
    onComplete.mockImplementation(() => order.push('complete'));
    await user.click(q('#text-content'));
    await user.keyboard('ab');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith({ counter: 2, progress: 2, mistakes: 0, totalChars: 2, wordCount: 1 });
    expect(order.slice(-2)).toEqual(['stats', 'complete']);
    // re-rendering with new props must not repeat it
    await user.keyboard('x');
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('does not call onComplete for an unfinished round, and again for the next round', async () => {
    const { q, user, onComplete, rerender } = setup({ text: 'ab', gameKey: 1 }, strict);
    await user.click(q('#text-content'));
    await user.keyboard('a');
    expect(onComplete).not.toHaveBeenCalled();
    await user.keyboard('b');
    expect(onComplete).toHaveBeenCalledTimes(1);
    rerender({ gameKey: 2, ended: false });
    await user.click(q('#text-content'));
    await user.keyboard('ab');
    expect(onComplete).toHaveBeenCalledTimes(2);
  });

  it('uses the latest callbacks, not the ones from mount', async () => {
    const { q, user, onStats, rerender } = setup({ text: 'ab' }, strict);
    const next = vi.fn();
    rerender({ onStats: next });
    await user.click(q('#text-content'));
    await user.keyboard('a');
    expect(next).toHaveBeenCalledTimes(1);
    expect(onStats).toHaveBeenCalledTimes(1);
  });
});

/* ---------- caret and scroll maths ---------- */

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}
const toRect = ({ left, top, width, height }: Box) => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
  x: left,
  y: top,
  toJSON: () => ({}),
});

/**
 * Fakes layout: boxes keyed by container / content div / "w<word>" / "w<word>l<letter>".
 * Word and letter boxes are SCROLL-AWARE: they move down by the current marginTop of
 * #text-content (negative = scrolled up), exactly like in a browser. This matters because
 * the caret computation re-measures after it scrolled.
 */
function mockLayout(boxes: Record<string, Box>) {
  const key = (el: HTMLElement): string | undefined => {
    if (el.classList.contains('container')) return 'container';
    if (el.classList.contains('text-content-div')) return 'content';
    if (el.classList.contains('word')) return `w${Array.from(el.parentElement!.children).indexOf(el)}`;
    if (el.classList.contains('letter')) {
      const word = el.parentElement!;
      return `w${Array.from(word.parentElement!.children).indexOf(word)}l${Array.from(word.children).indexOf(el)}`;
    }
    return undefined;
  };
  return vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const k = key(this);
    // words / letters not listed sit 10px below the top of the viewport (no scrolling)
    const fallback: Box = k === 'container' || k === 'content' || !k
      ? { left: 0, top: 0, width: 0, height: 0 }
      : { left: 120, top: boxes.content.top + 10, width: 20, height: 30 };
    const box = (k ? boxes[k] : undefined) ?? fallback;
    const isTextBox = k !== undefined && k !== 'container' && k !== 'content';
    const scroll = isTextBox ? parseFloat(document.getElementById('text-content')?.style.marginTop || '0') || 0 : 0;
    return toRect({ ...box, top: box.top + scroll }) as DOMRect;
  });
}

describe('cursor positioning and line scrolling', () => {
  const container: Box = { left: 100, top: 50, width: 800, height: 300 };
  const wide: Box = { left: 120, top: 70, width: 700, height: 108 };
  const narrow: Box = { left: 120, top: 70, width: 500, height: 108 };

  it('puts the cursor on the current letter: top = letterTop - containerTop + 2, left = letterLeft - containerLeft - 3', async () => {
    mockLayout({
      container,
      content: wide,
      w0: { left: 120, top: 80, width: 40, height: 30 },
      w0l0: { left: 120, top: 80, width: 20, height: 30 },
      w0l1: { left: 140, top: 80, width: 20, height: 30 },
    });
    const { q, user } = setup({ text: 'ab cd' });
    await user.click(q('#text-content'));
    await user.keyboard('a');
    expect(q('#cursor').style.top).toBe('32px'); // 80 - 50 + 2
    expect(q('#cursor').style.left).toBe('37px'); // 140 - 100 - 3
    expect(q('#text-content').style.marginTop).toBe('');
    expect(q('#cursor').style.transition).toBe('top 0.08s linear, left 0.08s linear');
  });

  it('after the last letter of a word the cursor sits at the right edge of the word', async () => {
    mockLayout({
      container,
      content: wide,
      w0: { left: 120, top: 80, width: 40, height: 30 },
      w0l0: { left: 120, top: 80, width: 20, height: 30 },
      w0l1: { left: 140, top: 80, width: 20, height: 30 },
    });
    const { q, user } = setup({ text: 'ab cd' });
    await user.click(q('#text-content'));
    await user.keyboard('ab');
    expect(q('#cursor').style.top).toBe('32px');
    expect(q('#cursor').style.left).toBe('57px'); // word right 160 - 100 - 3
  });

  it('wide layout (>600px): scrolls by two thirds of the viewport when the word is more than 90px below its top', async () => {
    mockLayout({
      container,
      content: wide, // height 108 -> a third is 36
      w0: { left: 120, top: 80, width: 40, height: 30 },
      w0l0: { left: 120, top: 80, width: 20, height: 30 },
      w1: { left: 170, top: 200, width: 40, height: 30 }, // 200 - 70 = 130 > 90
      w1l0: { left: 170, top: 200, width: 20, height: 30 },
    });
    const { q, user } = setup({ text: 'ab cd' });
    await user.click(q('#text-content'));
    await user.keyboard('ab ');
    // pass 1 scrolls by 2 * 36 and sets the cursor from the pre-scroll position (78);
    // pass 2 re-measures the scrolled layout (word now at 128 -> 58px below the top, no more scrolling)
    // and puts the cursor on the real letter position: 128 - 50 + 2
    expect(parseFloat(q('#text-content').style.marginTop)).toBeCloseTo(-72, 5);
    expect(parseFloat(q('#cursor').style.top)).toBeCloseTo(128 - 50 + 2, 5);
  });

  it('wide layout: 90px or less below the top does not scroll', async () => {
    mockLayout({
      container,
      content: wide,
      w1: { left: 170, top: 160, width: 40, height: 30 }, // exactly 90
      w1l0: { left: 170, top: 160, width: 20, height: 30 },
    });
    const { q, user } = setup({ text: 'ab cd' });
    await user.click(q('#text-content'));
    await user.keyboard('ab ');
    expect(q('#text-content').style.marginTop).toBe('');
    expect(q('#cursor').style.top).toBe('112px'); // 160 - 50 + 2
  });

  it('narrow layout (<=600px): scrolls by one third of the viewport past 60px', async () => {
    mockLayout({
      container,
      content: narrow,
      w1: { left: 170, top: 150, width: 40, height: 30 }, // 150 - 70 = 80 > 60 (but < 90)
      w1l0: { left: 170, top: 150, width: 20, height: 30 },
    });
    const { q, user } = setup({ text: 'ab cd' });
    await user.click(q('#text-content'));
    await user.keyboard('ab ');
    // pass 1 scrolls one third (36); pass 2 sees the word 44px below the top (< 60): stops, caret on the real letter
    expect(parseFloat(q('#text-content').style.marginTop)).toBeCloseTo(-36, 5);
    expect(parseFloat(q('#cursor').style.top)).toBeCloseTo(150 - 36 - 50 + 2, 5);
  });

  it('narrow layout: the same offset does not scroll in the wide layout (threshold differs)', async () => {
    mockLayout({
      container,
      content: wide,
      w1: { left: 170, top: 150, width: 40, height: 30 },
      w1l0: { left: 170, top: 150, width: 20, height: 30 },
    });
    const { q, user } = setup({ text: 'ab cd' });
    await user.click(q('#text-content'));
    await user.keyboard('ab ');
    expect(q('#text-content').style.marginTop).toBe('');
  });

  it('accumulates the scroll margin over successive scrolls (a scrolling Space re-measures and can scroll again)', async () => {
    mockLayout({
      container,
      content: narrow, // a third of the viewport is 36px, scroll threshold 60px
      w1: { left: 170, top: 150, width: 40, height: 30 },
      w1l0: { left: 170, top: 150, width: 20, height: 30 },
      w1l1: { left: 190, top: 150, width: 20, height: 30 },
      w2: { left: 220, top: 230, width: 40, height: 30 },
      w2l0: { left: 220, top: 230, width: 20, height: 30 },
    });
    const { q, user } = setup({ text: 'ab cd ef' });
    await user.click(q('#text-content'));
    await user.keyboard('ab ');
    // w1 starts 80px below the top: pass 1 scrolls 36 (44px left), pass 2 sees 44 < 60 and stops
    expect(parseFloat(q('#text-content').style.marginTop)).toBeCloseTo(-36, 5);
    await user.keyboard('cd'); // plain letters: one pass, nothing to scroll
    expect(parseFloat(q('#text-content').style.marginTop)).toBeCloseTo(-36, 5);
    await user.keyboard(' ');
    // w2 is 230 - 36 - 70 = 124px below the top: pass 1 -> -72 (88px), pass 2 -> -108 (52px), done
    expect(parseFloat(q('#text-content').style.marginTop)).toBeCloseTo(-108, 5);
    // when a pass scrolls, legacy sets the caret from the pre-scroll measurement WITHOUT the +2px offset:
    // pass 2 measured the word at 230 - 72 = 158 -> relativeTop 108, minus one third (36) = 72
    expect(parseFloat(q('#cursor').style.top)).toBeCloseTo(230 - 72 - 50 - 36, 5);
  });

  it('round end: finishing on the final keystroke re-applies the scroll after clearing it; a time-up end just clears it (legacy endGame())', async () => {
    const layout = {
      container,
      content: wide, // a third is 36
      w0: { left: 120, top: 80, width: 40, height: 30 },
      w0l0: { left: 120, top: 80, width: 20, height: 30 },
      w0l1: { left: 140, top: 80, width: 20, height: 30 },
      w1: { left: 170, top: 200, width: 40, height: 30 }, // 130px below the top: scrolls (> 90)
      w1l0: { left: 170, top: 200, width: 20, height: 30 },
      w1l1: { left: 190, top: 200, width: 20, height: 30 },
    };
    // (a) finished by typing: legacy endGame() cleared the offset, then the keystroke handler's trailing
    //     getLineAndCursor() measured the unscrolled layout and scrolled again, so the last line stays in view
    mockLayout(layout);
    const finished = setup({ text: 'ab cd' });
    await finished.user.click(finished.q('#text-content'));
    await finished.user.keyboard('ab cd');
    expect(finished.onComplete).toHaveBeenCalledTimes(1);
    finished.rerender({ enabled: false, ended: true });
    expect(parseFloat(finished.q('#text-content').style.marginTop)).toBeCloseTo(-72, 5);
    expect(finished.q('.text-content-div').style.overflow).toBe('auto');
    finished.unmount();
    // (b) ended by the clock with the quote unfinished: only the clear happens, the text shows from the top
    vi.restoreAllMocks();
    mockLayout(layout);
    const timedOut = setup({ text: 'ab cd' });
    await timedOut.user.click(timedOut.q('#text-content'));
    await timedOut.user.keyboard('ab ');
    expect(parseFloat(timedOut.q('#text-content').style.marginTop)).toBeCloseTo(-72, 5);
    timedOut.rerender({ enabled: false, ended: true });
    expect(timedOut.q('#text-content').style.marginTop).toBe('');
  });

  it('runs the caret computation once per letter, twice for an accepted Space and once for a rejected Space (legacy parity)', async () => {
    const spy = mockLayout({ container, content: wide });
    const { q, user } = setup({ text: 'ab cd' });
    await user.click(q('#text-content'));
    const contentMeasures = () =>
      spy.mock.contexts.filter((el) => (el as HTMLElement).classList?.contains('text-content-div')).length;
    const passesFor = async (keys: string) => {
      const before = contentMeasures();
      await user.keyboard(keys);
      return contentMeasures() - before;
    };
    expect(await passesFor('a')).toBe(1);
    expect(await passesFor(' ')).toBe(1); // rejected: the word is not complete, engine state unchanged
    expect(await passesFor('b')).toBe(1);
    expect(await passesFor(' ')).toBe(2); // accepted: spacePressed() + the trailing call of initTyping()
  });

  it('a soft-keyboard deletion (input event shorter than before) runs the caret computation twice, like legacy', async () => {
    const spy = mockLayout({ container, content: wide });
    const { q, user } = setup({ text: 'ab cd' });
    await user.click(q('#text-content'));
    await user.keyboard('a');
    const input = q<HTMLInputElement>('.input-field');
    const before = spy.mock.contexts.filter((el) => (el as HTMLElement).classList?.contains('text-content-div')).length;
    // soft keyboards delete through an input event without a Backspace keydown
    act(() => {
      input.value = '';
      input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward' }));
    });
    const after = spy.mock.contexts.filter((el) => (el as HTMLElement).classList?.contains('text-content-div')).length;
    expect(after - before).toBe(2);
  });

  it('steps back 36.1px (no transition) when backspacing above the viewport top', async () => {
    mockLayout({
      container,
      content: wide,
      w0: { left: 120, top: 80, width: 40, height: 30 },
      w0l0: { left: 120, top: 80, width: 20, height: 30 },
      w0l1: { left: 140, top: 60, width: 20, height: 30 },
    });
    const { q, user } = setup({ text: 'ab cd' });
    await user.click(q('#text-content'));
    await user.keyboard('a');
    q('#text-content').style.marginTop = '-72px';
    // backspace puts the caret back on word 0 whose MEASURED top (60) is above the content top (70).
    // The layout mock is scroll-aware, so give the unscrolled position: measured = base + marginTop(-72)
    mockLayout({
      container,
      content: wide,
      w0: { left: 120, top: 132, width: 40, height: 30 },
      w0l0: { left: 120, top: 132, width: 20, height: 30 },
      w0l1: { left: 140, top: 132, width: 20, height: 30 },
    });
    await user.keyboard('{Backspace}');
    expect(q('#cursor').style.transition).toBe('');
    expect(parseFloat(q('#text-content').style.marginTop)).toBeCloseTo(-72 + 36.1, 5);
    expect(parseFloat(q('#cursor').style.top)).toBeCloseTo(60 - 50 + 36.1, 5); // relativeTop + 36.1
  });

  it('a soft-keyboard deletion still ends up with the typing transition (legacy initTyping order)', async () => {
    mockLayout({ container, content: wide });
    const { q, user } = setup({ text: 'abc' });
    await user.click(q('#text-content'));
    await user.keyboard('ab');
    fireEvent.input(q('input'), { target: { value: 'a' } });
    expect(pressBackspaceMock).toHaveBeenCalledTimes(1);
    expect(q('#cursor').style.transition).toBe('top 0.08s linear, left 0.08s linear');
  });

  it('is computed after render and not for unrelated prop changes', async () => {
    const spy = mockLayout({ container, content: wide });
    const { q, user, rerender } = setup({ text: 'abc' });
    await user.click(q('#text-content'));
    await user.keyboard('a');
    const calls = spy.mock.calls.length;
    expect(calls).toBeGreaterThan(0);
    rerender({ timeLabel: '00:59' });
    expect(spy.mock.calls.length).toBe(calls);
  });

  it('does not crash when the engine returns a word index that is not rendered', async () => {
    mockLayout({ container, content: wide });
    typeCharMock.mockImplementation((s) => ({ ...s, wordIndex: 99 }));
    const { q, user } = setup({ text: 'abc' });
    await user.click(q('#text-content'));
    await user.keyboard('a');
    expect(q('#cursor')).toBeInTheDocument();
  });
});

/* ---------- real engine (skipped when engine.ts is still a stub) ---------- */

describe('with the real engine', () => {
  it('types a short quote to completion and decorates the ended state', async () => {
    const actual = await vi.importActual<typeof import('../../engine')>('../../engine');
    try {
      actual.createEngine('hi');
    } catch {
      return; // engine still a stub: nothing to verify here
    }
    createEngineMock.mockImplementation(actual.createEngine);
    typeCharMock.mockImplementation(actual.typeChar);
    pressSpaceMock.mockImplementation(actual.pressSpace);
    pressBackspaceMock.mockImplementation(actual.pressBackspace);

    const { q, user, onStats, onComplete, rerender } = setup({ text: 'hi yo' });
    await user.click(q('#text-content'));
    await user.keyboard('hx');
    expect(letterEls(q('#text-content')).slice(0, 2).map((l) => l.className)).toEqual([
      'letter correctText',
      'letter incorrectText',
    ]);
    await user.keyboard(' '); // strict space: word has a mistake -> ignored
    expect(q('#text-content').children[0]).toHaveClass('current');
    await user.keyboard('{Backspace}i ');
    expect(q('#text-content').children[1]).toHaveClass('current');
    await user.keyboard('yq');
    expect(onComplete).toHaveBeenCalledTimes(1);
    const stats = onComplete.mock.calls[0][0];
    expect(stats).toMatchObject({ totalChars: 4, wordCount: 2 });
    expect(onStats).toHaveBeenLastCalledWith(stats);
    rerender({ enabled: false, ended: true });
    expect(q('input')).toBeDisabled();
    expect(q('#text-content').querySelectorAll('.letter:not(.correctText):not(.incorrectText)')).toHaveLength(0);
  });
});
