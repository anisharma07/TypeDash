import { withHidden } from './classes';

/** Full-screen notice for a join id the server does not know (or that is not a number). */
export function WrongIdNotice({ visible }: { visible: boolean }) {
  return (
    <div className={withHidden('wrong-id', !visible)} role="alert">
      <div className="wrong-id-card">
        <h1>That Player ID does not exist</h1>
        <p>
          Press <kbd>Esc</kbd> to go back, then check the ID or join as a new player.
        </p>
      </div>
    </div>
  );
}
