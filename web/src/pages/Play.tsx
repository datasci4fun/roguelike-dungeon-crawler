import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGameSocket } from '../hooks/useGameSocket';
import { useChatSocket } from '../hooks/useChatSocket';
import { GameTerminal } from '../components/GameTerminal';
import { ChatPanel } from '../components/ChatPanel';
import { AchievementToast } from '../components/AchievementToast';
import './Play.css';

export function Play() {
  const { isAuthenticated, isLoading, token } = useAuth();
  const navigate = useNavigate();
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);

  // Game WebSocket
  const {
    status: gameStatus,
    gameState,
    error: gameError,
    newAchievements,
    connect: connectGame,
    disconnect: disconnectGame,
    sendCommand,
    newGame,
    quit,
    clearAchievements,
  } = useGameSocket(token);

  // Chat WebSocket
  const {
    status: chatStatus,
    messages,
    onlineUsers,
    currentUserId,
    connect: connectChat,
    disconnect: disconnectChat,
    sendMessage,
    sendWhisper,
  } = useChatSocket(token);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Connect to both servers when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      if (gameStatus === 'disconnected') {
        connectGame();
      }
      if (chatStatus === 'disconnected') {
        connectChat();
      }
    }
  }, [isAuthenticated, token, gameStatus, chatStatus, connectGame, connectChat]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectGame();
      disconnectChat();
    };
  }, [disconnectGame, disconnectChat]);

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

  // Toggle chat collapse
  const toggleChat = useCallback(() => {
    setIsChatCollapsed((prev) => !prev);
  }, []);

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
      <div className="play-layout">
        <div className="game-container">
          {gameError && (
            <div className="game-error">
              <span className="error-icon">!</span>
              <span>{gameError}</span>
              <button onClick={connectGame} className="retry-btn">
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
              isConnected={gameStatus === 'connected'}
            />
          </div>

          <div className="game-status">
            <span
              className={`status-indicator ${gameStatus}`}
              title={`Game: ${gameStatus}`}
            />
            <span className="status-text">
              {gameStatus === 'connecting' && 'Connecting...'}
              {gameStatus === 'connected' && (gameState ? `Turn ${gameState.turn}` : 'Ready')}
              {gameStatus === 'disconnected' && 'Disconnected'}
              {gameStatus === 'error' && 'Connection Error'}
            </span>
          </div>
        </div>

        <div className="chat-container">
          <ChatPanel
            status={chatStatus}
            messages={messages}
            onlineUsers={onlineUsers}
            currentUserId={currentUserId}
            onSendMessage={sendMessage}
            onSendWhisper={sendWhisper}
            onConnect={connectChat}
            isCollapsed={isChatCollapsed}
            onToggleCollapse={toggleChat}
          />
        </div>
      </div>

      {/* Achievement Toast */}
      {newAchievements.length > 0 && (
        <AchievementToast
          achievements={newAchievements}
          onDismiss={clearAchievements}
        />
      )}
    </div>
  );
}
