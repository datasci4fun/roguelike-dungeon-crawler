import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Play.css';

export function Play() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="play-loading">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="play">
      <div className="game-placeholder">
        <h2>Game Terminal</h2>
        <p>
          The xterm.js terminal will be integrated here in a future update.
        </p>
        <p className="hint">
          This will connect to the WebSocket game server and render the
          roguelike game in the browser.
        </p>
      </div>
    </div>
  );
}
