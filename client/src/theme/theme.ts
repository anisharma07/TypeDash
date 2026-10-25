import { HALLMARK_THEMES } from './themeList';
import type { Settings, ThemeInfo } from './types';

/** TypeDash's own theme; its tokens are the `:root` block of styles/base.css. */
export const DEFAULT_THEME: ThemeInfo = {
  slug: 'dash',
  name: 'Dash',
  genre: 'TypeDash',
  scheme: 'dark',
  fonts: [
    'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Poppins:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap',
  ],
};

export const THEMES: readonly ThemeInfo[] = [DEFAULT_THEME, ...HALLMARK_THEMES];

export const SETTINGS_PREFIX = 'typedash:';
/** Also read by the inline script in index.html / multiplayer.html, which applies the theme before first paint. */
const THEME_KEY = `${SETTINGS_PREFIX}theme`;
const STARFIELD_KEY = `${SETTINGS_PREFIX}starfield`;

export function findTheme(slug: string | null | undefined): ThemeInfo {
  return THEMES.find((t) => t.slug === slug) ?? DEFAULT_THEME;
}

// Storage can be missing or throw (private windows, blocked site data): settings then live for the page only.
function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // keep the in-memory value
  }
}

export function readSettings(): Settings {
  return { theme: findTheme(read(THEME_KEY)).slug, starfield: read(STARFIELD_KEY) !== 'off' };
}

export function saveSettings(settings: Settings): void {
  write(THEME_KEY, settings.theme);
  write(STARFIELD_KEY, settings.starfield ? 'on' : 'off');
}

/** Adds the theme's font stylesheets once; fonts of earlier themes stay loaded so switching back is instant. */
function loadFonts(theme: ThemeInfo): void {
  const loaded = new Set(
    Array.from(document.head.querySelectorAll<HTMLLinkElement>('link[data-theme-font]'), (l) => l.dataset.themeFont),
  );
  for (const href of theme.fonts) {
    if (loaded.has(href)) continue;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.themeFont = href;
    document.head.appendChild(link);
  }
}

export function applyTheme(slug: string): void {
  const theme = findTheme(slug);
  document.documentElement.dataset.theme = theme.slug;
  loadFonts(theme);
}
