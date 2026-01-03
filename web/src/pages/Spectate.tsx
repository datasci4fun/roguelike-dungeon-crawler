import { useState, useEffect, useCallback } from 'react';
import { spectatorApi, getSpectateWsUrl } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { GameTerminal } from '../components/GameTerminal';
import './Spectate.css';

interface ActiveGame {
  session_id: string;
  username: string;
  level: number;
  turn_count: number;
  spectator_count: number;
  started_at: string;
}

export function Spectate() {
  const { token } = useAuth();
  const [games, setGames] = useState<ActiveGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [spectating, setSpectating] = useState<string | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Fetch active games
  const fetchGames = useCallback(async () => {
    try {
      setLoading(true);
      const data = await spectatorApi.getActiveGames();
      setGames(data.games);
      setError(null);
    } catch (err) {
      setError('Failed to load active games');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
    // Refresh every 10 seconds
    const interval = setInterval(fetchGames, 10000);
    return () => clearInterval(interval);
  }, [fetchGames]);

  // Connect to spectate a game
  const startSpectating = useCallback((sessionId: string) => {
    const wsUrl = getSpectateWsUrl(sessionId, token || undefined);
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setSpectating(sessionId);
      setError(null);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'spectate_state' || data.type === 'game_state') {
        setGameState(data);
      } else if (data.type === 'error') {
        setError(data.message);
      }
    };

    socket.onerror = () => {
      setError('Connection error');
    };

    socket.onclose = () => {
      setSpectating(null);
      setGameState(null);
    };

    setWs(socket);
  }, [token]);

  // Stop spectating
  const stopSpectating = useCallback(() => {
    if (ws) {
      ws.close();
      setWs(null);
    }
    setSpectating(null);
    setGameState(null);
  }, [ws]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [ws]);

  // If spectating, show the game view
  if (spectating && gameState) {
    const playerName = games.find(g => g.session_id === spectating)?.username || 'Unknown';
    return (
      <div className="spectate-view">
        <div className="spectate-header">
          <h2>Spectating: {playerName}</h2>
          <button onClick={stopSpectating} className="btn btn-secondary">
            Stop Watching
          </button>
        </div>
        <div className="spectate-terminal">
          <GameTerminal
            gameState={gameState}
            isSpectator={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="spectate-page">
      <h1>Watch Live Games</h1>
      <p className="subtitle">Spectate other players in real-time</p>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading active games...</div>
      ) : games.length === 0 ? (
        <div className="no-games">
          <p>No active games right now.</p>
          <p>Check back later or start your own game!</p>
        </div>
      ) : (
        <div className="games-list">
          <table>
            <thead>
              <tr>
                <th>Player</th>
                <th>Level</th>
                <th>Turns</th>
                <th>Spectators</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {games.map((game) => (
                <tr key={game.session_id}>
                  <td className="player-name">{game.username}</td>
                  <td>{game.level}</td>
                  <td>{game.turn_count}</td>
                  <td>{game.spectator_count}</td>
                  <td>
                    <button
                      onClick={() => startSpectating(game.session_id)}
                      className="btn btn-primary btn-small"
                    >
                      Watch
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button onClick={fetchGames} className="btn btn-secondary refresh-btn">
        Refresh
      </button>
    </div>
  );
}
