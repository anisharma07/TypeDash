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
      <div id={`${id}nameid`} className={`player-name ${lane.isSelf ? 'player-you' : ''}`}>
        {/* user controlled: rendered as plain text only */}
        <p>{lane.isSelf ? 'YOU' : lane.username}</p>
      </div>
      <div className="lane-track">
        <div className="lane-run">
          <img
            src={`/images/avatars/${lane.avatar}.png`}
            alt="avatar"
            id={`${id}avatar`}
            className="user-avatar"
            style={{ left: lane.left }}
          />
        </div>
      </div>
      <div className="user-curr-wpm" id={`${id}wpm`}>
        {lane.wpmLabel}
      </div>
      <div id={`${id}user-rank`} className="user-rank-wpm">
        {place && (
          <>
            {place.rank}
            <sup>{place.suffix}</sup>
          </>
        )}
      </div>
    </div>
  );
}

/** Shown until the first 'add user progress'. */
function PlaceholderLane() {
  return (
    <div id="progress-bar" className="progress-bar">
      <div className="status-circle"></div>
      <div className="player-name player-you">
        <p>YOU</p>
      </div>
      <div className="lane-track"></div>
      <div className="user-curr-wpm">0 wpm</div>
      <div className="user-rank-wpm"></div>
    </div>
  );
}

/** The race track: one lane per player, current player first; the avatar's `left` is the player's progress. */
export function RaceTrack({ lanes }: { lanes: Lane[] | null }) {
  return (
    <section className="progress-space" aria-label="Race track">
      <div className="progress-bar-container">
        {lanes === null ? (
          <PlaceholderLane />
        ) : (
          lanes.map((lane) => <LaneRow key={`${lane.generation}:${lane.id}`} lane={lane} />)
        )}
      </div>
    </section>
  );
}
