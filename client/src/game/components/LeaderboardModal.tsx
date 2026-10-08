import { useEffect, useMemo, useState } from 'react';
import type { LeaderboardModalProps } from '../types';
import { buildBoards, fetchLeaderboard } from '../../lib/leaderboard';
import type { Boards, LeaderboardEntry } from '../../lib/leaderboard';

const EMPTY: Boards = { easy: [], medium: [] };

function RankCards({ entries, joinId }: { entries: LeaderboardEntry[]; joinId: number | null }) {
  return (
    <>
      {entries.map((p, i) => (
        <div
          key={`${p.joinId}-${p.device}-${i}`}
          // legacy used loose ==; compare numerically
          className={`rank-card ${joinId !== null && Number(p.joinId) === Number(joinId) ? 'me-rank-card' : ''}`}
        >
          <img src={`/images/avatars/${p.userAvatar}.png`} alt="user-avatar" className="leaderboard-avatar" />
          <p className="rank-player-name">
            {p.username}
            <span className="player-user-id">#{p.joinId}</span>
          </p>
          <p className="rank-player-wpm">{p.Highscore} wpm</p>
          <img src={`/images/${p.device}.png`} alt="device" className="device-icon" />
        </div>
      ))}
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
  const view = useMemo(
    () => ({ easy: boards.easy, medium: boards.medium }),
    [boards],
  );

  return (
    <div className={`leader-board-menu${open ? '' : ' hidden'}`}>
      <div className="ranking-section leaderboard-sections">
        <div className="leaderboard-heading">
          <button className="close-leaderboard" onClick={onClose}>
            &times;
          </button>
          <h1>LeaderBoard</h1>
          <img src="/images/filter-white.png" alt="filter" className="filter-logo" onClick={onRefresh} />
          <img src="/images/ctrl.png" alt="refresh" className="refresh-bind keyss" />
        </div>
        <div className="level-change">
          <img src="/images/tab.png" alt="tab-bind" className="level-change-bind keyss" />
          <div
            className={`easy${easyActive ? ' leaderboard-level-chosen' : ''}`}
            onClick={() => onLevelChange('easy')}
          >
            <p>Easy</p>
          </div>
          <div
            className={`medium${easyActive ? '' : ' leaderboard-level-chosen'}`}
            onClick={() => onLevelChange('medium')}
          >
            <p>Medium</p>
          </div>
        </div>
        <div className={`player-rankings-easy${easyActive ? '' : ' hidden'}`}>
          <RankCards entries={view.easy} joinId={joinId} />
        </div>
        <div className={`player-rankings-medium${easyActive ? ' hidden' : ''}`}>
          <RankCards entries={view.medium} joinId={joinId} />
        </div>
      </div>
    </div>
  );
}
