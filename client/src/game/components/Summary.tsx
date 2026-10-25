import { withHidden } from './classes';

interface SummaryProps {
  visible: boolean;
  wpm: number;
  /** already formatted, e.g. "97%" (the initial value is the bare "0") */
  accuracy: string;
}

/** The round result: speed and accuracy, shown once the player's round is over. */
export function Summary({ visible, wpm, accuracy }: SummaryProps) {
  return (
    <>
      <div className={withHidden('showWpm details', !visible)}>
        <strong id="wordsPerMinute">{wpm}</strong>
        <span>wpm</span>
      </div>
      <div className={withHidden('chk_accuracy details', !visible)}>
        <strong id="terminal-accuracy">{accuracy}</strong>
        <span>accuracy</span>
      </div>
    </>
  );
}
