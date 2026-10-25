export const AVATAR_COUNT = 15;

/** avatar1..avatar15, in legacy DOM order. */
export const AVATARS: readonly string[] = Array.from(
  { length: AVATAR_COUNT },
  (_, i) => `avatar${i + 1}`,
);
