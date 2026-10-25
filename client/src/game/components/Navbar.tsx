import { PlayersOnline } from '../../components/PlayersOnline';

interface NavbarProps {
  username: string;
  userId: number | string;
  playersOnline: number | null;
  onLeave: () => void;
  onToggleLeaderboard: () => void;
  onOpenSettings: () => void;
}

/** The game page's top bar: wordmark, the player's name and ID, the online count and the page actions with their keys. */
export function Navbar({ username, userId, playersOnline, onLeave, onToggleLeaderboard, onOpenSettings }: NavbarProps) {
  return (
    <nav className="navbar topbar">
      <span className="wordmark">
        TypeDash<span className="wordmark-caret" aria-hidden="true"></span>
      </span>
      <div className="userProfile">
        {/* user controlled: rendered as plain text only */}
        <p className="current-user-username">{username}</p>
        <p className="user-id">
          ID <span className="curr-user-id">{userId}</span>
        </p>
      </div>
      <div className="topbar-actions">
        <PlayersOnline count={playersOnline} />
        <button type="button" className="btn-ghost leaderboard-button" onClick={onToggleLeaderboard}>
          <i className="bx bx-trophy" aria-hidden="true"></i>
          <span className="action-label">Leaderboard</span>
          <kbd>`</kbd>
        </button>
        <button type="button" className="icon-btn settings-button" aria-label="Settings" onClick={onOpenSettings}>
          <i className="bx bx-cog" aria-hidden="true"></i>
        </button>
        <button type="button" className="btn-ghost leave-game" aria-label="Leave game" onClick={onLeave}>
          <i className="bx bx-log-out" aria-hidden="true"></i>
          <span className="action-label">Leave</span>
          <kbd>Esc</kbd>
        </button>
      </div>
    </nav>
  );
}
