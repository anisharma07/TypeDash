import {
  FORBIDDEN_ROUND_KEYS,
  avatarLeft,
  calcAccuracy,
  calcWpm,
  formatAccuracy,
  formatStopwatch,
  ordinal,
  parseGameParams,
  parseJoinRequest,
  progressPercent,
  quoteMetrics,
  secondsElapsed,
} from './gameRules';

describe('calcWpm', () => {
  it('is round(counter / 5 * 60 / seconds)', () => {
    expect(calcWpm(100, 60)).toBe(20);
    expect(calcWpm(10, 1)).toBe(120);
    expect(calcWpm(37, 20)).toBe(Math.round((37 / 5) * (60 / 20)));
    expect(calcWpm(7, 13)).toBe(Math.round((7 / 5) * (60 / 13)));
  });

  it('gives 0 (never NaN / Infinity) when no time has elapsed', () => {
    expect(calcWpm(0, 0)).toBe(0); // legacy: NaN
    expect(calcWpm(25, 0)).toBe(0); // legacy: Infinity
    expect(calcWpm(25, -3)).toBe(0);
    expect(calcWpm(NaN, 10)).toBe(0);
  });

  it('secondsElapsed is 60 minus the time left', () => {
    expect(secondsElapsed(60)).toBe(0);
    expect(secondsElapsed(59)).toBe(1);
    expect(secondsElapsed(0)).toBe(60);
  });
});

describe('accuracy', () => {
  it('floors 100 - mistakes / chars * 100', () => {
    expect(calcAccuracy(0, 100)).toBe(100);
    expect(calcAccuracy(3, 11)).toBe(72); // 72.72...
    expect(calcAccuracy(1, 3)).toBe(66); // 66.66...
  });

  it('is clamped at 0', () => {
    expect(calcAccuracy(50, 10)).toBe(0);
    expect(calcAccuracy(10, 10)).toBe(0);
  });

  it('is 0 for an empty quote (legacy NaN / -Infinity both rendered "0%")', () => {
    expect(calcAccuracy(0, 0)).toBe(0);
    expect(calcAccuracy(4, 0)).toBe(0);
  });

  it('formats with a percent sign', () => {
    expect(formatAccuracy(3, 11)).toBe('72%');
    expect(formatAccuracy(99, 11)).toBe('0%');
  });
});

describe('progressPercent', () => {
  it('truncates progress / (chars + words - 1) * 100', () => {
    expect(progressPercent(8, 11, 3)).toBe(61); // 8 / 13
    expect(progressPercent(13, 11, 3)).toBe(100);
    expect(progressPercent(0, 11, 3)).toBe(0);
    expect(progressPercent(1, 100, 20)).toBe(0); // 0.84 -> 0
  });

  it('gives 0 for an empty quote instead of NaN / Infinity', () => {
    expect(progressPercent(0, 0, 0)).toBe(0); // legacy -0
    expect(progressPercent(5, 0, 1)).toBe(0); // legacy Infinity
  });
});

describe('quoteMetrics', () => {
  it('counts words by single spaces and letters without spaces', () => {
    expect(quoteMetrics('the quick fox')).toEqual({ totalChars: 11, wordCount: 3 });
    expect(quoteMetrics('one')).toEqual({ totalChars: 3, wordCount: 1 });
    expect(quoteMetrics('')).toEqual({ totalChars: 0, wordCount: 1 });
  });
});

describe('formatStopwatch', () => {
  it('prints MM:SS', () => {
    expect(formatStopwatch(60)).toBe('01:00');
    expect(formatStopwatch(59)).toBe('00:59');
    expect(formatStopwatch(5)).toBe('00:05');
    expect(formatStopwatch(0)).toBe('00:00');
  });
});

describe('ordinal', () => {
  it('maps 1/2/3 to st/nd/rd and everything else to th (legacy quirk: 21 -> 21th)', () => {
    expect(ordinal(1)).toEqual({ rank: 1, suffix: 'st' });
    expect(ordinal(2)).toEqual({ rank: 2, suffix: 'nd' });
    expect(ordinal(3)).toEqual({ rank: 3, suffix: 'rd' });
    expect(ordinal(4).suffix).toBe('th');
    expect(ordinal(11).suffix).toBe('th');
    expect(ordinal(21).suffix).toBe('th');
    expect(ordinal(0).suffix).toBe('th');
  });
});

describe('avatarLeft', () => {
  it('is progress * 0.89 percent', () => {
    expect(avatarLeft(0)).toBe('0%');
    expect(avatarLeft(100)).toBe('89%');
    expect(avatarLeft(50)).toBe('44.5%');
  });
});

describe('parseJoinRequest', () => {
  it('treats a missing or empty join-id as a new player (legacy falsy check)', () => {
    expect(parseJoinRequest(null)).toEqual({ kind: 'new' });
    expect(parseJoinRequest('')).toEqual({ kind: 'new' });
  });

  it('parses plain integers to Numbers', () => {
    expect(parseJoinRequest('42')).toEqual({ kind: 'byId', joinId: 42 });
    expect(parseJoinRequest('0')).toEqual({ kind: 'byId', joinId: 0 });
    expect(parseJoinRequest('007')).toEqual({ kind: 'byId', joinId: 7 });
  });

  it.each(['abc', '12abc', '1.5', '-3', '+3', ' 4', '4 ', '1e3', '0x10', 'NaN', '9'.repeat(400)])(
    'rejects %j (must never be sent to the server)',
    (raw) => {
      expect(parseJoinRequest(raw)).toEqual({ kind: 'invalid', raw });
    },
  );
});

describe('parseGameParams', () => {
  it('reads join-id, username, image, identity and Device', () => {
    expect(parseGameParams('?username=ann&image=avatar3&identity=a%40b.c&Device=mobile')).toEqual({
      join: { kind: 'new' },
      username: 'ann',
      image: 'avatar3',
      identity: 'a@b.c',
      device: 'mobile',
    });
    expect(parseGameParams('?join-id=12').join).toEqual({ kind: 'byId', joinId: 12 });
  });

  it('gives null for absent parameters', () => {
    expect(parseGameParams('')).toEqual({ join: { kind: 'new' }, username: null, image: null, identity: null, device: null });
  });
});

describe('FORBIDDEN_ROUND_KEYS', () => {
  it('is the legacy list', () => {
    expect(FORBIDDEN_ROUND_KEYS).toEqual([
      'Alt', 'Control', 'Fn', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
      'PrintScreen', 'Insert', 'Delete', 'Tab',
    ]);
  });
});
