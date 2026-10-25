import type { CSSProperties } from 'react';
import { withHidden } from './classes';

interface FooterProps {
  onToggleLeaderboard: () => void;
  leaveMatchVisible: boolean;
  onLeaveMatch: () => void;
  playerStatusVisible: boolean;
  readyLabel: string;
  readyStyle: CSSProperties | undefined;
  onReady: () => void;
  insufficientPlayers: boolean;
}

/** Legacy `footer.foo`: leaderboard button, leave match, ready controls and the glitch copyright. */
export function Footer({
  onToggleLeaderboard,
  leaveMatchVisible,
  onLeaveMatch,
  playerStatusVisible,
  readyLabel,
  readyStyle,
  onReady,
  insufficientPlayers,
}: FooterProps) {
  return (
    <footer className="foo">
      <div className="leaderboard-button" onClick={onToggleLeaderboard}>
        <img src="/images/log-in-bind.png" alt="leaderboard" className="leaderboard-bind keyss" />
        <img src="/images/leaderboardIcon.png" alt="" className="leaderboard-logo" />
      </div>
      <button className={withHidden('leave-match', !leaveMatchVisible)} onClick={onLeaveMatch}>
        Leave match
      </button>
      <div className={withHidden('player-status', !playerStatusVisible)}>
        <img src="/images/enter.png" alt="enter" className="ready-btn-bind keyss" />
        <button className="ready-btn" style={readyStyle} onClick={onReady}>
          {readyLabel}
        </button>
        <div className={withHidden('insuff-player', !insufficientPlayers)}>invite 1 more player</div>
      </div>
      <div className="glitch-wrapper">
        <div className="glitch" data-glitch="copyright">
          copyright
        </div>
        <i className="bx bx-copyright"></i>
        <p className="current-year">{new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
