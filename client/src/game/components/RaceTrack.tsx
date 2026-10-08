import { ordinal } from '../../lib/gameRules';
import type { Lane } from '../hooks/useRaceTrack';
import { withHidden } from './classes';

function LaneRow({ lane }: { lane: Lane }) {
  const { id } = lane;
  const place = lane.rank === null ? null : ordinal(lane.rank);
  return (
    <div id={`${id}progress-bar`} className="progress-bar" style={{ order: lane.order }}>
      <div
        className={withHidden('status-circle', lane.circleHidden)}
        id={`${id}status`}
        style={{ backgroundColor: lane.statusColor }}
      ></div>
      <div id={`${id}user-rank`} className="user-rank-wpm">
        {place && (
          <>
            {place.rank}
            <sup>{place.suffix}</sup>
          </>
        )}
      </div>
      <div className="user-curr-wpm" id={`${id}wpm`}>
        {lane.wpmLabel}
      </div>
      <div id={`${id}nameid`} className={`player-name ${lane.isSelf ? 'player-you' : ''}`}>
        {/* user controlled: rendered as plain text only */}
        <p>{lane.isSelf ? 'YOU' : lane.username}</p>
      </div>
      <img
        src={`/images/avatars/${lane.avatar}.png`}
        alt="avatar"
        id={`${id}avatar`}
        className="user-avatar"
        style={{ left: lane.left }}
      />
      <img src="/images/dividerFigma@4x.png" alt="divider" className="progress-path" />
    </div>
  );
}

/** The static bar of the legacy HTML, shown until the first 'add user progress'. */
function PlaceholderLane() {
  return (
    <div id="progress-bar" className="progress-bar">
      <div className="status-circle"></div>
      <div className="player-name">
        <p>YOU:</p>
      </div>
      <div className="avatar-path">
        <img src="/images/dividerFigma.png" alt="divider" className="progress-path" />
      </div>
      <div className="user-curr-wpm" id="${user.id}wpm">
        0 wpm
      </div>
    </div>
  );
}

/** Legacy `.progress-space`: the race track with one lane per player, current player first. */
export function RaceTrack({ lanes }: { lanes: Lane[] | null }) {
  return (
    <div className="progress-space">
      <img src="/images/squares.png" alt="square1" className="square1" />
      <img src="/images/squares.png" alt="square2" className="square2" />
      <div className="progress-bar-container">
        {lanes === null ? <PlaceholderLane /> : lanes.map((lane) => <LaneRow key={lane.id} lane={lane} />)}
      </div>
    </div>
  );
}
