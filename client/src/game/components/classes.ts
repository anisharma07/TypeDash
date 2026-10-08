/** `base` plus the legacy `hidden` class while `isHidden` (replaces classList.add/remove("hidden")). */
export function withHidden(base: string, isHidden: boolean): string {
  return isHidden ? `${base} hidden` : base;
}
