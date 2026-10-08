import { withHidden } from './classes';

interface CountdownProps {
  /** "starting in N s..." visible */
  counting: boolean;
  number: number;
  /** "start typing..." visible */
  over: boolean;
}

/** Legacy `.countdown` and `.countdown-over` blocks. */
export function Countdown({ counting, number, over }: CountdownProps) {
  return (
    <>
      <div className={withHidden('countdown', !counting)}>
        <p>
          starting in <span className="countdown-number">{number}</span>s...
        </p>
      </div>
      <div className={withHidden('countdown-over', !over)}>
        <p>start typing...</p>
      </div>
    </>
  );
}
