import { Particles } from '../components/Particles';
import { Backdrop } from './components/Backdrop';
import { Footer } from './components/Footer';
import { LeaderboardModal } from './components/LeaderboardModal';
import { Navbar } from './components/Navbar';
import { RaceTrack } from './components/RaceTrack';
import { TimerPanel } from './components/TimerPanel';
import { TypingArea } from './components/TypingArea';
import { WrongIdNotice } from './components/WrongIdNotice';
import { defaultGameOptions, useGame } from './hooks/useGame';
import type { GameOptions } from './hooks/useGame';

export type GamePageProps = Partial<GameOptions>;

/**
 * The multiplayer page (legacy multiplayer.html + socket.js + multiplayer.js).
 * The props exist for tests and default to the browser: location.search,
 * socket.io, window.confirm and window.location.
 */
export function GamePage({
  search = window.location.search,
  createSocket = defaultGameOptions.createSocket,
  confirmLeave = defaultGameOptions.confirmLeave,
  navigate = defaultGameOptions.navigate,
}: GamePageProps) {
  const game = useGame({ search, createSocket, confirmLeave, navigate });
  const { round, leaderboard, ready, race } = game;
  const { view } = round;

  // Legacy overlay / transparent-overlay only ever receive `hidden`; clicking them closes the modals.
  return (
    <>
      <div className="leave-match-pop-up"></div>
      <WrongIdNotice visible={game.wrongId} />
      <Backdrop />
      <Particles />
      <Navbar username={game.profile.username} userId={game.profile.userId} onLeave={game.leaveGame} />

      <div className="middle-container">
        <LeaderboardModal
          open={leaderboard.open}
          onClose={leaderboard.close}
          level={leaderboard.level}
          onLevelChange={leaderboard.setLevel}
          onRefresh={leaderboard.refresh}
          joinId={leaderboard.joinId}
          refreshToken={leaderboard.refreshToken}
        />
        <div className="hero-container">
          <RaceTrack lanes={race.lanes} />
          <TimerPanel view={view} difficulty={ready.difficulty} onDifficultyChange={ready.setDifficulty} />
          <TypingArea
            text={view.text}
            gameKey={view.gameKey}
            enabled={view.enabled}
            ended={view.ended}
            timeLabel={view.timeLabel}
            timerRunning={view.timerRunning}
            timeUp={view.timeUp}
            onStats={round.onStats}
            onComplete={round.onComplete}
          />
        </div>
      </div>

      <Footer
        onToggleLeaderboard={leaderboard.toggle}
        leaveMatchVisible={view.leaveMatchVisible}
        onLeaveMatch={game.leaveMatchRequest}
        playerStatusVisible={view.playerStatusVisible}
        readyLabel={ready.label}
        readyStyle={ready.style}
        onReady={ready.onReadyBtnClick}
        insufficientPlayers={game.insufficientPlayers}
      />

      <div className="overlay hidden" onClick={leaderboard.close}></div>
      <div className="transparent-overlay hidden" onClick={leaderboard.close}></div>
    </>
  );
}
