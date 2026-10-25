interface NavbarProps {
  username: string;
  userId: number | string;
  onLeave: () => void;
}

/** Legacy `nav.navbar`: user profile, leave-game icon and the key-binding hints. */
export function Navbar({ username, userId, onLeave }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="userProfile">
        <p className="current-user-username">{username}</p>
        <p>
          ID: #<span className="curr-user-id">{userId}</span>
        </p>
        <p></p>
      </div>
      <img src="/images/leave-game.png" alt="leave-game" className="leave-game" onClick={onLeave} />
      <img src="/images/exit-esc-in-bind.png" alt="exit" className="leave-game-bind keyss" />
      <img src="/images/typing.png" alt="type-dash" className="type-dash keyss" />
    </nav>
  );
}
