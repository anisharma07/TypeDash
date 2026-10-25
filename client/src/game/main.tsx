import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'boxicons/css/boxicons.min.css';
import '../styles/root.css';
import '../styles/game.css';
import '../styles/sockets.css';
import '../styles/gradient.css';
import '../styles/glitch.css';
import '../styles/game-overrides.css';
import { GamePage } from './GamePage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GamePage />
  </StrictMode>,
);
