import { useEffect, useState } from 'react';
import type { LeaderboardModalProps } from '../types';
import { buildBoards, fetchLeaderboard } from '../../lib/leaderboard';
import type { Boards, LeaderboardEntry } from '../../lib/leaderboard';

const EMPTY: Boards = { easy: [], medium: [] };

const DEVICE = {
  computer: { icon: 'bx-laptop', label: 'Laptop' },
  iphone: { icon: 'bx-mobile', label: 'Mobile' },
} as const;

function RankCards({ entries, joinId }: { entries: LeaderboardEntry[]; joinId: number | null }) {
  if (entries.length === 0) {
    return <li className="rank-empty">No scores yet. Finish a race to get on the board.</li>;
  }
  return (
    <>
      {entries.map((p, i) => {
        const device = DEVICE[p.device];
        return (
          <li
            key={`${p.joinId}-${p.device}-${i}`}
            // legacy used loose ==; compare numerically
            className={`rank-card ${joinId !== null && Number(p.joinId) === Number(joinId) ? 'me-rank-card' : ''}`}
          >
            <span className="rank-position">{i + 1}</span>
            <img src={`/images/avatars/${p.userAvatar}.png`} alt="" className="leaderboard-avatar" />
            <p className="rank-player-name">
              {p.username}
              <span className="player-user-id">{`#${p.joinId}`}</span>
            </p>
            <p className="rank-player-wpm">
              <strong>{p.Highscore}</strong> wpm
            </p>
            <i className={`device-icon bx ${device.icon}`} role="img" aria-label={device.label} title={device.label}></i>
          </li>
        );
      })}
    </>
  );
}

export function LeaderboardModal({
  open,
  onClose,
  level,
  onLevelChange,
  onRefresh,
  joinId,
  refreshToken,
}: LeaderboardModalProps) {
  const [boards, setBoards] = useState<Boards>(EMPTY);

  useEffect(() => {
    const ctrl = new AbortController();
    let ignore = false;
    fetchLeaderboard(ctrl.signal)
      .then((players) => {
        if (!ignore) setBoards(buildBoards(players));
      })
      .catch(() => {
        // keep the previous lists on failure
      });
    return () => {
      ignore = true;
      ctrl.abort();
    };
  }, [refreshToken]);

  const easyActive = level === 'easy';

  return (
    <aside className={`leader-board-menu${open ? '' : ' hidden'}`} aria-labelledby="leaderboard-title">
      <div className="ranking-section leaderboard-sections">
        <div className="leaderboard-heading">
          <h2 id="leaderboard-title">Leaderboard</h2>
          <button type="button" className="icon-btn filter-logo" aria-label="Refresh leaderboard" onClick={onRefresh}>
            <i className="bx bx-refresh" aria-hidden="true"></i>
          </button>
          <button type="button" className="icon-btn close-leaderboard" aria-label="Close leaderboard" onClick={onClose}>
            <i className="bx bx-x" aria-hidden="true"></i>
          </button>
        </div>
        <div className="level-change" role="tablist" aria-label="Level">
          <button
            type="button"
            role="tab"
            aria-selected={easyActive}
            className={`easy${easyActive ? ' leaderboard-level-chosen' : ''}`}
            onClick={() => onLevelChange('easy')}
          >
            Easy
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!easyActive}
            className={`medium${easyActive ? '' : ' leaderboard-level-chosen'}`}
            onClick={() => onLevelChange('medium')}
          >
            Medium
          </button>
        </div>
        <ol className={`player-rankings-easy${easyActive ? '' : ' hidden'}`}>
          <RankCards entries={boards.easy} joinId={joinId} />
        </ol>
        <ol className={`player-rankings-medium${easyActive ? ' hidden' : ''}`}>
          <RankCards entries={boards.medium} joinId={joinId} />
        </ol>
        <p className="leaderboard-keys">
          <kbd>Tab</kbd> level <kbd>Ctrl</kbd> refresh <kbd>`</kbd> close
        </p>
      </div>
    </aside>
  );
}
