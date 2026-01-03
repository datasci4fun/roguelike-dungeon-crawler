import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

export function Layout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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
            {isAuthenticated && <Link to="/play">Play</Link>}
          </nav>
        </div>
        <div className="header-right">
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
