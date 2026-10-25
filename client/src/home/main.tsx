import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'boxicons/css/boxicons.min.css';
import '../styles/root.css';
import '../styles/index.css';
import '../styles/glitch.css';
import '../styles/gradient.css';
import '../styles/switch.css';
import { HomePage } from './HomePage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HomePage />
  </StrictMode>,
);
