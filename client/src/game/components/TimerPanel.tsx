import type { Difficulty } from '../../types/socket';
import type { RoundView } from '../hooks/useRound';
import { Countdown } from './Countdown';
import { DifficultySelect } from './DifficultySelect';
import { Summary } from './Summary';
import { TrafficLight } from './TrafficLight';

interface TimerPanelProps {
  view: RoundView;
  difficulty: Difficulty;
  onDifficultyChange: (value: Difficulty) => void;
}

/** Legacy `div.timer`: traffic light, countdown, round summary and the level select. */
export function TimerPanel({ view, difficulty, onDifficultyChange }: TimerPanelProps) {
  return (
    <div className="timer">
      <TrafficLight light={view.light} />
      <Countdown counting={view.countdownVisible} number={view.countdownNumber} over={view.countOverVisible} />
      <Summary visible={view.summaryVisible} wpm={view.summaryWpm} accuracy={view.summaryAccuracy} />
      <DifficultySelect value={difficulty} onChange={onDifficultyChange} />
    </div>
  );
}
