import { withHidden } from './classes';

interface CountdownProps {
  /** "Starting in N" visible */
  counting: boolean;
  number: number;
  /** "Go" visible */
  over: boolean;
}

/** The pre-race countdown and the "go" line that follows it. */
export function Countdown({ counting, number, over }: CountdownProps) {
  return (
    <>
      <div className={withHidden('countdown', !counting)} aria-live="polite">
        <p>
          Starting in <span className="countdown-number">{number}</span>
        </p>
      </div>
      <div className={withHidden('countdown-over', !over)} aria-live="polite">
        <p>Go, start typing</p>
      </div>
    </>
  );
}
