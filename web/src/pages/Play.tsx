import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGameSocket } from '../hooks/useGameSocket';
import { GameTerminal } from '../components/GameTerminal';
import './Play.css';

export function Play() {
  const { isAuthenticated, isLoading, token } = useAuth();
  const navigate = useNavigate();

  const {
    status,
    gameState,
    error,
    connect,
    disconnect,
    sendCommand,
    newGame,
    quit,
  } = useGameSocket(token);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Connect to game server when authenticated
  useEffect(() => {
    if (isAuthenticated && token && status === 'disconnected') {
      connect();
    }
  }, [isAuthenticated, token, status, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Handle new game - also handles "press enter to play again"
  const handleNewGame = useCallback(() => {
    if (gameState?.game_state === 'DEAD' || gameState?.game_state === 'VICTORY' || !gameState) {
      newGame();
    }
  }, [gameState, newGame]);

  // Handle command from terminal
  const handleCommand = useCallback(
    (command: string) => {
      // If dead or victory, treat any key as new game request
      if (gameState?.game_state === 'DEAD' || gameState?.game_state === 'VICTORY') {
        if (command === 'ANY_KEY' || command === 'CONFIRM') {
          newGame();
          return;
        }
      }
      sendCommand(command);
    },
    [gameState, sendCommand, newGame]
  );

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
      <div className="game-container">
        {error && (
          <div className="game-error">
            <span className="error-icon">!</span>
            <span>{error}</span>
            <button onClick={connect} className="retry-btn">
              Retry
            </button>
          </div>
        )}

        <div className="terminal-wrapper">
          <GameTerminal
            gameState={gameState}
            onCommand={handleCommand}
            onNewGame={handleNewGame}
            onQuit={quit}
            isConnected={status === 'connected'}
          />
        </div>

        <div className="game-status">
          <span
            className={`status-indicator ${status}`}
            title={`Status: ${status}`}
          />
          <span className="status-text">
            {status === 'connecting' && 'Connecting...'}
            {status === 'connected' && (gameState ? `Turn ${gameState.turn}` : 'Ready')}
            {status === 'disconnected' && 'Disconnected'}
            {status === 'error' && 'Connection Error'}
          </span>
        </div>
      </div>
    </div>
  );
}
