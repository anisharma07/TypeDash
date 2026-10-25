import type { ReadyPhase } from '../hooks/useReadyControls';
import { withHidden } from './classes';

interface FooterProps {
  leaveMatchVisible: boolean;
  onLeaveMatch: () => void;
  playerStatusVisible: boolean;
  readyLabel: string;
  readyPhase: ReadyPhase;
  onReady: () => void;
  insufficientPlayers: boolean;
}

/** The action bar: the ready button between rounds, "leave match" during one. */
export function Footer({
  leaveMatchVisible,
  onLeaveMatch,
  playerStatusVisible,
  readyLabel,
  readyPhase,
  onReady,
  insufficientPlayers,
}: FooterProps) {
  return (
    <footer className="foo">
      <div className={withHidden('player-status', !playerStatusVisible)}>
        <button type="button" className={`ready-btn btn ready-btn--${readyPhase}`} onClick={onReady}>
          {readyPhase === 'ready' && <i className="bx bx-check" aria-hidden="true"></i>}
          {readyLabel}
        </button>
        <kbd>Enter</kbd>
        <div className={withHidden('insuff-player', !insufficientPlayers)} role="status">
          Invite one more player to start
        </div>
      </div>
      <button
        type="button"
        className={withHidden('leave-match btn btn-secondary', !leaveMatchVisible)}
        onClick={onLeaveMatch}
      >
        Leave match
      </button>
      <p className="copyright">
        © <span className="current-year">{new Date().getFullYear()}</span> TypeDash
      </p>
    </footer>
  );
}
