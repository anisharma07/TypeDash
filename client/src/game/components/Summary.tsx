import { withHidden } from './classes';

interface SummaryProps {
  visible: boolean;
  wpm: number;
  /** already formatted, e.g. "97%" (the initial value is the bare "0") */
  accuracy: string;
}

/** Legacy `.showWpm` and `.chk_accuracy` blocks (both carry the `details` class). */
export function Summary({ visible, wpm, accuracy }: SummaryProps) {
  return (
    <>
      <div className={withHidden('showWpm details', !visible)}>
        <h3>
          Score: <strong id="wordsPerMinute">{wpm}</strong> wpm
        </h3>
      </div>
      <div className={withHidden('chk_accuracy details', !visible)}>
        <h3 className="acurate">
          Accuracy: <strong id="terminal-accuracy">{accuracy}</strong>
        </h3>
      </div>
    </>
  );
}
