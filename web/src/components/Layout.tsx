import { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { VolumeControls } from './VolumeControls';
import './Layout.css';

export function Layout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [showVolumePanel, setShowVolumePanel] = useState(false);
  const volumePanelRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Close volume panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (volumePanelRef.current && !volumePanelRef.current.contains(event.target as Node)) {
        setShowVolumePanel(false);
      }
    };

    if (showVolumePanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVolumePanel]);

  return (
    <div className="layout">
      <header className="header">
        <div className="header-left">
          <Link to="/" className="logo">
            Roguelike Dungeon
          </Link>
          <nav className="nav">
            <Link to="/leaderboard">Leaderboard</Link>
            <Link to="/ghosts">Ghosts</Link>
            <Link to="/spectate">Spectate</Link>
            {isAuthenticated && <Link to="/friends">Friends</Link>}
            {isAuthenticated && <Link to="/play">Play</Link>}
          </nav>
        </div>
        <div className="header-right">
          <div className="volume-toggle-container" ref={volumePanelRef}>
            <button
              className="volume-toggle-btn"
              onClick={() => setShowVolumePanel(!showVolumePanel)}
              title="Audio Settings"
            >
              {'\u{1F50A}'}
            </button>
            {showVolumePanel && (
              <div className="volume-panel">
                <VolumeControls compact showSfx={false} />
              </div>
            )}
          </div>
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="username-link">
                {user?.display_name || user?.username}
              </Link>
              <button onClick={handleLogout} className="btn btn-secondary">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Register
              </Link>
            </>
          )}
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <p>Roguelike Dungeon Crawler &copy; 2024</p>
      </footer>
    </div>
  );
}
