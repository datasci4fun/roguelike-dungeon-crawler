import { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { VolumeControls } from './VolumeControls';
import './Layout.css';

export function Layout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [showVolumePanel, setShowVolumePanel] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const volumePanelRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (volumePanelRef.current && !volumePanelRef.current.contains(event.target as Node)) {
        setShowVolumePanel(false);
      }
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const closeDropdown = () => {
    setOpenDropdown(null);
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="header-left">
          <Link to="/" className="logo">
            Roguelike Dungeon
          </Link>
          <nav className="nav" ref={navRef}>
            {/* Game Dropdown */}
            <div className="nav-dropdown">
              <button
                className={`nav-dropdown-trigger ${openDropdown === 'game' ? 'active' : ''}`}
                onClick={() => toggleDropdown('game')}
              >
                Game
                <span className="dropdown-arrow">▾</span>
              </button>
              {openDropdown === 'game' && (
                <div className="nav-dropdown-menu">
                  <Link to="/features" onClick={closeDropdown}>
                    <span className="menu-icon">✦</span>
                    Features
                  </Link>
                  <Link to="/roadmap" onClick={closeDropdown}>
                    <span className="menu-icon">🗺️</span>
                    Roadmap
                  </Link>
                  <Link to="/changelog" onClick={closeDropdown}>
                    <span className="menu-icon">📋</span>
                    Patch Notes
                  </Link>
                  <Link to="/lore" onClick={closeDropdown}>
                    <span className="menu-icon">📜</span>
                    Lore & Story
                  </Link>
                  <Link to="/bestiary" onClick={closeDropdown}>
                    <span className="menu-icon">👹</span>
                    Bestiary
                  </Link>
                  <Link to="/items" onClick={closeDropdown}>
                    <span className="menu-icon">⚔️</span>
                    Item Compendium
                  </Link>
                  <Link to="/guide" onClick={closeDropdown}>
                    <span className="menu-icon">📖</span>
                    Adventurer's Guide
                  </Link>
                </div>
              )}
            </div>

            {/* About Dropdown */}
            <div className="nav-dropdown">
              <button
                className={`nav-dropdown-trigger ${openDropdown === 'about' ? 'active' : ''}`}
                onClick={() => toggleDropdown('about')}
              >
                About
                <span className="dropdown-arrow">▾</span>
              </button>
              {openDropdown === 'about' && (
                <div className="nav-dropdown-menu">
                  <Link to="/about" onClick={closeDropdown}>
                    <span className="menu-icon">🤖</span>
                    Built by AI
                  </Link>
                  <Link to="/presentation" onClick={closeDropdown}>
                    <span className="menu-icon">📊</span>
                    Case Study
                  </Link>
                </div>
              )}
            </div>

            {/* Community Dropdown */}
            <div className="nav-dropdown">
              <button
                className={`nav-dropdown-trigger ${openDropdown === 'community' ? 'active' : ''}`}
                onClick={() => toggleDropdown('community')}
              >
                Community
                <span className="dropdown-arrow">▾</span>
              </button>
              {openDropdown === 'community' && (
                <div className="nav-dropdown-menu">
                  <Link to="/leaderboard" onClick={closeDropdown}>
                    <span className="menu-icon">🏆</span>
                    Leaderboard
                  </Link>
                  <Link to="/ghosts" onClick={closeDropdown}>
                    <span className="menu-icon">👻</span>
                    Ghosts
                  </Link>
                  <Link to="/spectate" onClick={closeDropdown}>
                    <span className="menu-icon">👁</span>
                    Spectate
                  </Link>
                  {isAuthenticated && (
                    <Link to="/friends" onClick={closeDropdown}>
                      <span className="menu-icon">👥</span>
                      Friends
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Dev Tools Dropdown */}
            <div className="nav-dropdown">
              <button
                className={`nav-dropdown-trigger ${openDropdown === 'devtools' ? 'active' : ''}`}
                onClick={() => toggleDropdown('devtools')}
              >
                Dev Tools
                <span className="dropdown-arrow">▾</span>
              </button>
              {openDropdown === 'devtools' && (
                <div className="nav-dropdown-menu">
                  <Link to="/system-status" onClick={closeDropdown}>
                    <span className="menu-icon">📡</span>
                    System Status
                  </Link>
                  <Link to="/build-info" onClick={closeDropdown}>
                    <span className="menu-icon">🏗️</span>
                    Build Info
                  </Link>
                  <Link to="/log-viewer" onClick={closeDropdown}>
                    <span className="menu-icon">📜</span>
                    Log Viewer
                  </Link>
                  <Link to="/error-tracker" onClick={closeDropdown}>
                    <span className="menu-icon">🐛</span>
                    Error Tracker
                  </Link>
                  <Link to="/profiler" onClick={closeDropdown}>
                    <span className="menu-icon">⏱️</span>
                    Profiler
                  </Link>
                  <Link to="/session-inspector" onClick={closeDropdown}>
                    <span className="menu-icon">👤</span>
                    Sessions
                  </Link>
                  <Link to="/feature-flags" onClick={closeDropdown}>
                    <span className="menu-icon">🚩</span>
                    Feature Flags
                  </Link>
                  <Link to="/env-config" onClick={closeDropdown}>
                    <span className="menu-icon">⚙️</span>
                    Env Config
                  </Link>
                  <Link to="/dependencies" onClick={closeDropdown}>
                    <span className="menu-icon">📦</span>
                    Dependencies
                  </Link>
                  <Link to="/routes" onClick={closeDropdown}>
                    <span className="menu-icon">🔀</span>
                    Route Explorer
                  </Link>
                  <Link to="/metrics" onClick={closeDropdown}>
                    <span className="menu-icon">📈</span>
                    Metrics
                  </Link>
                  <Link to="/codebase-health" onClick={closeDropdown}>
                    <span className="menu-icon">🩺</span>
                    Codebase Health
                  </Link>
                  <div className="menu-divider" />
                  <Link to="/db-explorer" onClick={closeDropdown}>
                    <span className="menu-icon">🗄️</span>
                    DB Explorer
                  </Link>
                  <Link to="/cache-inspector" onClick={closeDropdown}>
                    <span className="menu-icon">⚡</span>
                    Cache Inspector
                  </Link>
                  <Link to="/api-playground" onClick={closeDropdown}>
                    <span className="menu-icon">🧪</span>
                    API Playground
                  </Link>
                  <Link to="/ws-monitor" onClick={closeDropdown}>
                    <span className="menu-icon">🔌</span>
                    WS Monitor
                  </Link>
                  <div className="menu-divider" />
                  <Link to="/audio-jukebox" onClick={closeDropdown}>
                    <span className="menu-icon">🎵</span>
                    Audio Jukebox
                  </Link>
                </div>
              )}
            </div>

            {/* Play Button - Prominent for authenticated users */}
            {isAuthenticated && (
              <Link to="/play" className="nav-play-btn">
                ▶ Play
              </Link>
            )}
          </nav>
        </div>
        <div className="header-right">
          <div className="volume-toggle-container" ref={volumePanelRef}>
            <button
              className="volume-toggle-btn"
              onClick={() => setShowVolumePanel(!showVolumePanel)}
              title="Audio Settings"
            >
              🔊
            </button>
            {showVolumePanel && (
              <div
                className="volume-panel"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
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
