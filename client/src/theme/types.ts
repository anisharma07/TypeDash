export type ColorScheme = 'light' | 'dark';

export interface ThemeInfo {
  /** value of the `data-theme` attribute; the token block lives in themes.css (or base.css for the default) */
  slug: string;
  name: string;
  genre: string;
  scheme: ColorScheme;
  /** stylesheet URLs for the theme's faces, loaded when the theme is applied */
  fonts: readonly string[];
}

export interface Settings {
  theme: string;
  /** animated star background */
  starfield: boolean;
}
