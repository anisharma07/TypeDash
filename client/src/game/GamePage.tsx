import { useState } from 'react';
import { Particles } from '../components/Particles';
import { SettingsDialog } from '../components/SettingsDialog';
import { useSettings } from '../theme/useSettings';
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
  const { settings, update } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="game">
      <WrongIdNotice visible={game.wrongId} />
      {settings.starfield && <Particles theme={settings.theme} />}
      <Navbar
        username={game.profile.username}
        userId={game.profile.userId}
        playersOnline={game.playersOnline}
        onLeave={game.leaveGame}
        onToggleLeaderboard={leaderboard.toggle}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className={`middle-container${leaderboard.open ? ' with-board' : ''}`}>
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
      </main>

      <Footer
        leaveMatchVisible={view.leaveMatchVisible}
        onLeaveMatch={game.leaveMatchRequest}
        playerStatusVisible={view.playerStatusVisible}
        readyLabel={ready.label}
        readyPhase={ready.phase}
        onReady={ready.onReadyBtnClick}
        insufficientPlayers={game.insufficientPlayers}
      />

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={update}
      />
    </div>
  );
}
