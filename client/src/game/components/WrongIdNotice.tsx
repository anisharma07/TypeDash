import { withHidden } from './classes';

/** Legacy `div.wrong-id`, shown for a join id the server does not know (or that is not a number). */
export function WrongIdNotice({ visible }: { visible: boolean }) {
  return (
    <div className={withHidden('wrong-id', !visible)}>
      <h1>WRONG JOIN ID....</h1>
      <h1>press esc --&gt; then Enter and try again</h1>
    </div>
  );
}
