import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Particles } from '../components/Particles';
import { AVATARS } from '../data/avatars';
import {
  avatarHint,
  detectDevice,
  isAvatarKey,
  navigateAvatar,
  pickRandomName,
  randomAvatarIndex,
} from './helpers';

export function HomePage() {
  const [avatar, setAvatar] = useState<number>(() => randomAvatarIndex());
  const [username, setUsername] = useState('');
  const [isGirl, setIsGirl] = useState(false);
  const [device] = useState<'mobile' | 'laptop'>(() => detectDevice(window.innerWidth));
  const [warning, setWarning] = useState(false);
  // Legacy: modal starts hidden (static class) and is forced hidden on mobile.
  const [modalHidden, setModalHidden] = useState(true);

  const usernameRef = useRef<HTMLInputElement>(null);
  const contactRef = useRef<HTMLInputElement>(null);
  const joinIdRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef(avatar);
  const girlRef = useRef(isGirl);
  avatarRef.current = avatar;
  girlRef.current = isGirl;

  const rollName = () => {
    setUsername(pickRandomName(girlRef.current));
    usernameRef.current?.focus();
  };
  const rollNameRef = useRef(rollName);
  rollNameRef.current = rollName;

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
      <img src="images/left-hand.png" alt="left" className="left-hand" />
      <img src="images/right-hand.png" alt="right" className="right-hand" />
      <div className="background">
        <div></div>
        <div></div>
      </div>

      <Particles />
      <nav className="navbar">
        <img src="images/typing.png" alt="LOGO" className="typing-logo" />
        <img src="images/type-on-phone.png" alt="type-on-phone" className="typing-on-phone" />
      </nav>
      <form id="entry-form" action="multiplayer.html" method="get" className="">
        <div className="avatar-div focus-glassmorphism ">
          <img src="./images/arrows.png" alt="arrow-keys" className="arrows-indicator" />
          <div className="select-avatar">
            <p>SELECT AVATAR</p>
          </div>
          <div className="avatars">
            {AVATARS.map((name, i) => (
              <label key={name}>
                <input
                  type="radio"
                  name="image"
                  value={name}
                  id={name}
                  className="avatar-select-input"
                  checked={avatar === i}
                  onChange={() => setAvatar(i)}
                />
                <img
                  src={`images/avatars/${name}.png`}
                  alt={name}
                  className="avatars-select-image"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="username-identity glassmorphism">
          <img src="images/tab.png" alt="tab" className="focus-tab" />
          <div className="details-box">
            <div className="details">
              <p className={warning ? 'max-char-warning' : 'max-char-warning hidden'}>
                maximum 10 characters allowed!
              </p>
              <label htmlFor="username">Username:</label>
              <input type="hidden" name="Device" value={device} className="Device-logged-in" />
              <input
                type="text"
                id="username"
                name="username"
                maxLength={10}
                minLength={3}
                autoComplete="off"
                placeholder="nick-name/choose random"
                required
                ref={usernameRef}
                value={username}
                onChange={onUsernameChange}
              />
              <img src="images/alt.png" alt="alt" className="alt-key" />
              <img src="images/ctrl.png" alt="alt" className="ctrl-key" />
              <img
                src="images/randomdice.png"
                alt="dice-roll"
                className="random-name-dice"
                onClick={rollName}
              />
              <label className="ui-switch">
                <input
                  type="checkbox"
                  id="name-toggler"
                  checked={isGirl}
                  onChange={(e) => setIsGirl(e.target.checked)}
                />
                <div className="slider">
                  <div className="circle"></div>
                </div>
              </label>
            </div>

            <div className="details contact-page">
              <img
                src="images/modal-binding.png"
                alt="modalbind"
                className="rules-modal-bind hidden"
              />

              <div className={modalHidden ? 'rules-modal hidden' : 'rules-modal'}>
                <h2>Exciting prize for winners</h2>
                <ul>
                  <li>To participate, fill the contact else type none.</li>
                  <li>Format: Name/contact.</li>
                  <li>
                    contact may be email id, phone no., insta id, or any other social media
                    through which we can reach you out.
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
              <img
                src="images/question-mark.png"
                alt="question-mark"
                className="question-mark hidden"
                onClick={() => setModalHidden((h) => !h)}
              />
            </div>
          </div>
        </div>
        <div className="btn-div">
          <button className="submitBtn glassmorphism">
            JOIN GAME
            <img src="images/enter.png" alt="enter" className="enter-key" />
          </button>
        </div>
      </form>

      <footer className="foo">
        <form action="multiplayer.html" method="get" id="log-in">
          <input
            type="number"
            name="join-id"
            id="user-join-id"
            placeholder="Enter user-id"
            max={999999}
            min={100000}
            required
            ref={joinIdRef}
          />
          <img src="images/log-in-bind.png" alt="loginbind" className="log-in-bind" />

          <button type="submit">LOG IN</button>
        </form>
        <div className="glitch-wrapper">
          <div className="glitch" data-glitch="copyright">
            copyright
          </div>
          <i className="bx bx-copyright"></i>
          <p className="current-year">{new Date().getFullYear()}</p>
        </div>
      </footer>
    </>
  );
}
