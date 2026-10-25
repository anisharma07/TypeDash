import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'boxicons/css/boxicons.min.css';
import '../styles/base.css';
import '../theme/themes.css';
import '../styles/home.css';
import { applyTheme, readSettings } from '../theme/theme';
import { HomePage } from './HomePage';

// Start loading the theme's fonts before React renders (the attribute itself is set by the inline script).
applyTheme(readSettings().theme);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HomePage />
  </StrictMode>,
);
