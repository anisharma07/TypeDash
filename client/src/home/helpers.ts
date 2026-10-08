import { AVATAR_COUNT } from '../data/avatars';
import { BoyNames, GirlNames } from '../data/names';

export type RandomFn = () => number;
export type AvatarKey = 'ArrowRight' | 'ArrowLeft' | 'ArrowDown' | 'ArrowUp';

/**
 * Legacy getRandomName: draws BOTH random numbers (girl first, then boy)
 * before choosing the list by the toggle.
 */
export function pickRandomName(isGirl: boolean, random: RandomFn = Math.random): string {
  const girlIdx = Math.floor(random() * GirlNames.length);
  const boyIdx = Math.floor(random() * BoyNames.length);
  return isGirl ? GirlNames[girlIdx]! : BoyNames[boyIdx]!;
}

export function randomAvatarIndex(random: RandomFn = Math.random): number {
  return Math.floor(random() * AVATAR_COUNT);
}

/** Legacy: window.innerWidth < 500 -> mobile, else laptop. */
export function detectDevice(width: number): 'mobile' | 'laptop' {
  return width < 500 ? 'mobile' : 'laptop';
}

/** Legacy ArrowDown table: 0->8, 1->8, 2..7 -> index+7; index >= 8 stays. */
function down(i: number): number {
  if (i === 0) return 8;
  if (i >= 1 && i <= 7) return i + 7;
  return i;
}

/** Legacy ArrowUp table: 8..14 -> index-7; index <= 7 stays. */
function up(i: number): number {
  return i >= 8 && i <= 14 ? i - 7 : i;
}

export function navigateAvatar(index: number, key: AvatarKey): number {
  switch (key) {
    case 'ArrowRight':
      return index === AVATAR_COUNT - 1 ? 0 : index + 1;
    case 'ArrowLeft':
      return index === 0 ? AVATAR_COUNT - 1 : index - 1;
    case 'ArrowDown':
      return down(index);
    case 'ArrowUp':
      return up(index);
  }
}

/** The legacy default fall-through console messages (selection unchanged). */
export function avatarHint(index: number, key: AvatarKey): string | undefined {
  if (key === 'ArrowDown' && index >= 8) return 'use up arrow to go up';
  if (key === 'ArrowUp' && index <= 7) return 'use down arrow to go down';
  return undefined;
}

export function isAvatarKey(key: string): key is AvatarKey {
  return (
    key === 'ArrowRight' || key === 'ArrowLeft' || key === 'ArrowDown' || key === 'ArrowUp'
  );
}
