import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import type { ChangeEvent } from 'react';
import { Particles } from '../components/Particles';
import { PlayersOnline, usePlayersOnline } from '../components/PlayersOnline';
import type { PresenceSocket } from '../components/PlayersOnline';
import { SettingsDialog } from '../components/SettingsDialog';
import { AVATARS } from '../data/avatars';
import { createSocket as createRealSocket } from '../lib/socket';
import { useSettings } from '../theme/useSettings';
import {
  avatarHint,
  detectDevice,
  isAvatarKey,
  navigateAvatar,
  pickRandomName,
  randomAvatarIndex,
} from './helpers';

export interface HomePageProps {
  /** for tests; defaults to the real socket.io connection */
  createSocket?: () => PresenceSocket;
}

export function HomePage({ createSocket = createRealSocket }: HomePageProps) {
  const playersOnline = usePlayersOnline(createSocket);
  const [avatar, setAvatar] = useState<number>(() => randomAvatarIndex());
  const [username, setUsername] = useState('');
  const [isGirl, setIsGirl] = useState(false);
  const [device] = useState<'mobile' | 'laptop'>(() => detectDevice(window.innerWidth));
  const [warning, setWarning] = useState(false);
  // Legacy: modal starts hidden (static class) and is forced hidden on mobile.
  const [modalHidden, setModalHidden] = useState(true);
  const { settings, update } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const usernameRef = useRef<HTMLInputElement>(null);
  const contactRef = useRef<HTMLInputElement>(null);
  const joinIdRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef(avatar);
  const girlRef = useRef(isGirl);

  const rollName = () => {
    setUsername(pickRandomName(girlRef.current));
    usernameRef.current?.focus();
  };
  const rollNameRef = useRef(rollName);
  // "Latest value" refs for the document key handler below. They are written after commit, not during render
  // (render must stay pure: a discarded concurrent render would otherwise leak its values into the handler).
  useLayoutEffect(() => {
    avatarRef.current = avatar;
    girlRef.current = isGirl;
    rollNameRef.current = rollName;
  });

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'Control') {
        event.preventDefault();
        setIsGirl((g) => !g);
      }
      if (event.altKey && event.key === 'Alt') {
        rollNameRef.current();
        setWarning(false);
        event.preventDefault();
      }
      if (isAvatarKey(event.key)) {
        event.preventDefault();
        const current = avatarRef.current;
        const hint = avatarHint(current, event.key);
        if (hint) console.log(hint);
        const next = navigateAvatar(current, event.key);
        avatarRef.current = next;
        setAvatar(next);
      }
      if (event.key === 'Tab') {
        event.preventDefault();
        if (document.activeElement === usernameRef.current) contactRef.current?.focus();
        else usernameRef.current?.focus();
      }
      if (event.key === '=') {
        event.preventDefault();
      }
      if (event.key === '`') {
        event.preventDefault();
        joinIdRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const onUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    setWarning(e.target.value.length === 10);
  };

  return (
    <>
      {settings.starfield && <Particles theme={settings.theme} />}
      <header className="topbar">
        <span className="wordmark">
          TypeDash<span className="wordmark-caret" aria-hidden="true"></span>
        </span>
        <div className="topbar-actions">
          <PlayersOnline count={playersOnline} />
          <button
            type="button"
            className="icon-btn settings-button"
            aria-label="Settings"
            onClick={() => setSettingsOpen(true)}
          >
            <i className="bx bx-cog" aria-hidden="true"></i>
          </button>
        </div>
      </header>

      <main className="home-main">
        <section className="home-intro" aria-labelledby="home-title">
          <h1 id="home-title">Race your friends, word by word.</h1>
          <p className="lede">Everyone types the same text at once. Your best speed stays on the leaderboard.</p>
          <ol className="steps">
            <li>Pick a ship and a name.</li>
            <li>
              Press <kbd>Enter</kbd> when you are ready.
            </li>
            <li>Type the text before anyone else.</li>
          </ol>

          <div className="returning">
            <label htmlFor="user-join-id">Raced before? Log in with your Player ID.</label>
            <form action="multiplayer.html" method="get" id="log-in">
              <input
                type="number"
                name="join-id"
                id="user-join-id"
                className="text-input"
                placeholder="6-digit ID"
                max={999999}
                min={100000}
                required
                ref={joinIdRef}
              />
              <button type="submit" className="btn btn-secondary">
                Log in
              </button>
              <kbd title="Jump to the Player ID box">`</kbd>
            </form>
          </div>
        </section>

        <form id="entry-form" action="multiplayer.html" method="get" className="join-card">
          <fieldset className="avatar-div">
            <legend className="field-head">
              Your ship
              <span className="key-hints" aria-hidden="true">
                <kbd>←</kbd>
                <kbd>↑</kbd>
                <kbd>↓</kbd>
                <kbd>→</kbd>
              </span>
            </legend>
            <div className="avatars">
              {AVATARS.map((name, i) => (
                <label key={name}>
                  <input
                    type="radio"
                    name="image"
                    value={name}
                    id={name}
                    className="avatar-select-input visually-hidden"
                    checked={avatar === i}
                    onChange={() => setAvatar(i)}
                  />
                  <img src={`images/avatars/${name}.png`} alt={name} className="avatars-select-image" />
                </label>
              ))}
            </div>
          </fieldset>

          <div className="username-identity">
            <div className="details">
              <div className="field-head">
                <label htmlFor="username">Name</label>
                <p className={warning ? 'max-char-warning' : 'max-char-warning hidden'} role="status">
                  10 characters at most
                </p>
              </div>
              <input type="hidden" name="Device" value={device} className="Device-logged-in" />
              <div className="name-row">
                <input
                  type="text"
                  id="username"
                  name="username"
                  className="text-input"
                  maxLength={10}
                  minLength={3}
                  autoComplete="off"
                  placeholder="Nickname, or roll one"
                  required
                  ref={usernameRef}
                  value={username}
                  onChange={onUsernameChange}
                />
                <button
                  type="button"
                  className="icon-btn random-name-dice"
                  aria-label="Roll a random name"
                  onClick={rollName}
                >
                  <i className="bx bx-dice-5" aria-hidden="true"></i>
                </button>
                <kbd title="Roll a random name">Alt</kbd>
              </div>
              <label className="switch-row name-list">
                <span>
                  <span className="switch-label">Girl names</span>
                  <span className="switch-hint">
                    Random names come from this list <kbd>Ctrl</kbd>
                  </span>
                </span>
                <input
                  type="checkbox"
                  id="name-toggler"
                  role="switch"
                  className="switch"
                  checked={isGirl}
                  onChange={(e) => setIsGirl(e.target.checked)}
                />
              </label>
            </div>

            {/* The contact field and its rules are switched off (always hidden, sent as "none"), as in the original. */}
            <div className="details contact-page">
              <div className={modalHidden ? 'rules-modal hidden' : 'rules-modal'}>
                <h2>Exciting prize for winners</h2>
                <ul>
                  <li>To participate, fill the contact else type none.</li>
                  <li>Format: Name/contact.</li>
                  <li>
                    contact may be email id, phone no., insta id, or any other social media through which we can
                    reach you out.
                  </li>
                </ul>
              </div>
              <label htmlFor="identity" className="hidden">
                Contact:
              </label>
              <input
                type="text"
                id="identity"
                name="identity"
                autoComplete="off"
                placeholder="Name/contact"
                defaultValue="none"
                className="hidden"
                required
                ref={contactRef}
              />
              <button
                type="button"
                className="question-mark hidden"
                aria-label="Contact rules"
                onClick={() => setModalHidden((h) => !h)}
              >
                ?
              </button>
            </div>
          </div>

          <div className="btn-div">
            <button className="submitBtn btn btn-primary">
              Join the race
              <i className="bx bx-right-arrow-alt" aria-hidden="true"></i>
            </button>
            <kbd>Enter</kbd>
          </div>
        </form>
      </main>

      <footer className="foo site-footer">
        <p>
          © <span className="current-year">{new Date().getFullYear()}</span> TypeDash
        </p>
      </footer>

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={update}
      />
    </>
  );
}
