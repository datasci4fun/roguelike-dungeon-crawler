import { useEffect, useCallback, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { useChatSocket } from '../hooks/useChatSocket';
import { useAudioManager } from '../hooks/useAudioManager';
import { useSfxGameEvents, useSfxCommands } from '../hooks/useSfxGameEvents';
import { useDebugRenderer } from '../hooks/useDebugRenderer';
import { GameTerminal } from '../components/GameTerminal';
import { FirstPersonRenderer, FirstPersonRenderer3D, type CorridorInfoEntry } from '../components/SceneRenderer';
import { CharacterHUD } from '../components/CharacterHUD';
import { ChatPanel } from '../components/ChatPanel';
import { TouchControls } from '../components/TouchControls';
import { AchievementToast } from '../components/AchievementToast';
import { FeatSelector } from '../components/FeatSelector';
import { DebugToast } from '../components/DebugToast';
import { GameOver } from '../components/GameOver';
import { LoreJournal } from '../components/LoreJournal';
import { GAME_STATE_MUSIC } from '../config/audioConfig';
import './Play.css';

export function Play() {
  const { isAuthenticated, isLoading, token } = useAuth();
  const navigate = useNavigate();
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSceneView, setShowSceneView] = useState(true);
  const [useTileGrid, setUseTileGrid] = useState(() => {
    try { return localStorage.getItem('useTileGrid') === '1'; } catch { return false; }
  });
  const [use3DMode, setUse3DMode] = useState(() => {
    try { return localStorage.getItem('use3DMode') === '1'; } catch { return false; }
  });
  const [showGameOver, setShowGameOver] = useState<'death' | 'victory' | null>(null);
  const [showLoreJournal, setShowLoreJournal] = useState(false);

  // Debug renderer controls (F8/F9/F10 hotkeys)
  const {
    debugEnabled,
    showWireframe,
    showOccluded,
    toggleWireframe,
    toggleOccluded,
    captureSnapshot,
    copySnapshotToClipboard,
    toastMessage,
    clearToast,
  } = useDebugRenderer();
  const corridorInfoRef = useRef<CorridorInfoEntry[]>([]);

  // Audio management
  const { crossfadeTo, isUnlocked, unlockAudio } = useAudioManager();
  const lastLevelRef = useRef<number | null>(null);

  // Sound effects
  const { playMove, playMenuConfirm } = useSfxCommands();

  // Game context (shared WebSocket)
  const {
    status: gameStatus,
    gameState,
    error: gameError,
    newAchievements,
    connect: connectGame,
    sendCommand,
    quit,
    clearAchievements,
    selectFeat,
  } = useGame();

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

  // Connect chat when authenticated
  useEffect(() => {
    if (isAuthenticated && token && chatStatus === 'disconnected') {
      connectChat();
    }
  }, [isAuthenticated, token, chatStatus, connectChat]);

  // Redirect to home if no active game (after quit or game end)
  useEffect(() => {
    if (gameStatus === 'connected' && !gameState) {
      // Give a brief moment for game state to arrive
      const timeout = setTimeout(() => {
        if (!gameState) {
          // Go to home page - user can start a new game from there
          navigate('/');
        }
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [gameStatus, gameState, navigate]);

  // Cleanup chat on unmount (game connection managed by context)
  useEffect(() => {
    return () => {
      disconnectChat();
    };
  }, [disconnectChat]);

  // Trigger SFX based on game state changes
  useSfxGameEvents(gameState);

  // Unlock audio on first interaction
  const handleAudioUnlock = useCallback(() => {
    if (!isUnlocked) {
      unlockAudio();
    }
  }, [isUnlocked, unlockAudio]);

  // Play level-appropriate music based on dungeon level
  useEffect(() => {
    if (!isUnlocked || !gameState?.dungeon) return;

    // Don't change music if game is over (that's handled separately)
    if (gameState.game_state === 'DEAD' || gameState.game_state === 'VICTORY') return;

    const level = gameState.dungeon.level;
    if (level === lastLevelRef.current) return;

    lastLevelRef.current = level;
    const trackKey = `dungeon-${level}`;
    const trackId = GAME_STATE_MUSIC[trackKey] || GAME_STATE_MUSIC['dungeon-1'];

    if (trackId) {
      crossfadeTo(trackId);
    }
  }, [gameState?.dungeon?.level, gameState?.game_state, isUnlocked, crossfadeTo]);

  // Detect game over state and show cinematic overlay
  useEffect(() => {
    if (gameState?.game_state === 'DEAD') {
      setShowGameOver('death');
    } else if (gameState?.game_state === 'VICTORY') {
      setShowGameOver('victory');
    }
  }, [gameState?.game_state]);

  // Handle music change from GameOver component
  const handleGameOverMusic = useCallback((trackId: string) => {
    if (isUnlocked) {
      crossfadeTo(trackId);
    }
  }, [isUnlocked, crossfadeTo]);

  // Handle new game - redirect to character creation
  const handleNewGame = useCallback(() => {
    if (gameState?.game_state === 'DEAD' || gameState?.game_state === 'VICTORY' || !gameState) {
      setShowGameOver(null);
      navigate('/character-creation');
    }
  }, [gameState, navigate]);

  // Handle command from terminal
  const handleCommand = useCallback(
    (command: string) => {
      // If dead or victory, treat any key as new game request -> go to character creation
      if (gameState?.game_state === 'DEAD' || gameState?.game_state === 'VICTORY') {
        if (command === 'ANY_KEY' || command === 'CONFIRM') {
          playMenuConfirm();
          navigate('/character-creation');
          return;
        }
      }

      // No game state - shouldn't happen, but ignore
      if (!gameState) {
        return;
      }

      // Play movement sounds
      if (command.startsWith('MOVE_')) {
        playMove();
      }

      sendCommand(command);
    },
    [gameState, sendCommand, navigate, playMove, playMenuConfirm]
  );

  // Toggle chat collapse
  const toggleChat = useCallback(() => {
    setIsChatCollapsed((prev) => !prev);
  }, []);

  // Toggle mobile chat modal
  const toggleMobileChat = useCallback(() => {
    setIsMobileChatOpen((prev) => {
      if (!prev) {
        // Opening chat, clear unread count
        setUnreadCount(0);
      }
      return !prev;
    });
  }, []);

  // Track unread messages when mobile chat is closed
  useEffect(() => {
    if (!isMobileChatOpen && messages.length > 0) {
      setUnreadCount((prev) => prev + 1);
    }
  }, [messages.length, isMobileChatOpen]);

  // Persist tile grid preference
  useEffect(() => {
    try { localStorage.setItem('useTileGrid', useTileGrid ? '1' : '0'); } catch {}
  }, [useTileGrid]);

  // Persist 3D mode preference
  useEffect(() => {
    try { localStorage.setItem('use3DMode', use3DMode ? '1' : '0'); } catch {}
  }, [use3DMode]);

  // Debug hotkeys (F8: wireframe, F9: occluded, F10: snapshot)
  useEffect(() => {
    if (!debugEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger hotkeys when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'F8':
          e.preventDefault();
          toggleWireframe();
          break;
        case 'F9':
          e.preventDefault();
          toggleOccluded();
          break;
        case 'F10':
          e.preventDefault();
          const snapshot = captureSnapshot(
            gameState?.first_person_view,
            gameState?.player ? { x: gameState.player.x, y: gameState.player.y } : undefined,
            corridorInfoRef.current
          );
          if (snapshot) {
            copySnapshotToClipboard(snapshot);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    debugEnabled,
    toggleWireframe,
    toggleOccluded,
    captureSnapshot,
    copySnapshotToClipboard,
    gameState?.first_person_view,
    gameState?.player,
  ]);

  // Lore Journal hotkey (J key)
  useEffect(() => {
    const handleJournalKey = (e: KeyboardEvent) => {
      // Don't trigger when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      // Don't trigger when in a game UI mode (inventory, dialog, etc)
      if (gameState?.ui_mode && gameState.ui_mode !== 'GAME') {
        return;
      }

      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        setShowLoreJournal((prev) => !prev);
      } else if (e.key === 'Escape' && showLoreJournal) {
        e.preventDefault();
        setShowLoreJournal(false);
      }
    };

    window.addEventListener('keydown', handleJournalKey);
    return () => window.removeEventListener('keydown', handleJournalKey);
  }, [gameState?.ui_mode, showLoreJournal]);

  // Callback to capture corridor info from renderer
  const handleCorridorInfo = useCallback((info: CorridorInfoEntry[]) => {
    corridorInfoRef.current = info;
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
    <div className="play" onClick={handleAudioUnlock}>
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

          <div className="game-views">
            <div className="terminal-wrapper">
              <GameTerminal
                gameState={gameState}
                onCommand={handleCommand}
                onNewGame={handleNewGame}
                onQuit={quit}
                isConnected={gameStatus === 'connected'}
              />
            </div>

            {showSceneView && (
              <div className="scene-wrapper">
                {use3DMode ? (
                  <FirstPersonRenderer3D
                    view={gameState?.first_person_view}
                    settings={{ biome: 'dungeon', useTileGrid }}
                    width={800}
                    height={600}
                  />
                ) : (
                  <FirstPersonRenderer
                    view={gameState?.first_person_view}
                    settings={{ biome: 'dungeon', useTileGrid }}
                    width={800}
                    height={600}
                    enableAnimations={true}
                    debugShowWireframe={showWireframe}
                    debugShowOccluded={showOccluded}
                    onCorridorInfo={handleCorridorInfo}
                  />
                )}
                {/* Character HUD overlay */}
                {gameState?.player?.race && (
                  <CharacterHUD
                    race={gameState.player.race}
                    playerClass={gameState.player.class}
                    abilities={gameState.player.abilities}
                    passives={gameState.player.passives}
                    health={gameState.player.health}
                    maxHealth={gameState.player.max_health}
                    showAbilities={true}
                    compact={false}
                  />
                )}
              </div>
            )}
          </div>

          <div className="game-controls">
            <label className="scene-toggle">
              <input
                type="checkbox"
                checked={showSceneView}
                onChange={(e) => setShowSceneView(e.target.checked)}
              />
              First-Person View
            </label>

            <label className="scene-toggle">
              <input
                type="checkbox"
                checked={useTileGrid}
                onChange={(e) => setUseTileGrid(e.target.checked)}
                disabled={!showSceneView}
              />
              Tile Grid
            </label>

            <label className="scene-toggle">
              <input
                type="checkbox"
                checked={use3DMode}
                onChange={(e) => setUse3DMode(e.target.checked)}
                disabled={!showSceneView}
              />
              3D Mode
            </label>

            <button
              className="journal-btn"
              onClick={() => setShowLoreJournal(true)}
              title="Open Lore Journal (J)"
            >
              Journal
              {gameState?.lore_journal && gameState.lore_journal.discovered_count > 0 && (
                <span className="journal-count">
                  {gameState.lore_journal.discovered_count}
                </span>
              )}
            </button>
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

      {/* Touch Controls (mobile only) */}
      <TouchControls
        onCommand={handleCommand}
        onNewGame={handleNewGame}
        uiMode={gameState?.ui_mode}
        isConnected={gameStatus === 'connected'}
        gameActive={!!gameState && gameState.game_state === 'PLAYING'}
      />

      {/* Mobile Chat Toggle Button */}
      <button
        className="mobile-chat-toggle"
        onClick={toggleMobileChat}
        aria-label="Toggle chat"
      >
        <span className="chat-icon">💬</span>
        {unreadCount > 0 && (
          <span className="unread-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {/* Mobile Chat Modal */}
      {isMobileChatOpen && (
        <div className="mobile-chat-overlay" onClick={toggleMobileChat}>
          <div className="mobile-chat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-chat-header">
              <span>Chat</span>
              <button className="mobile-chat-close" onClick={toggleMobileChat}>
                ×
              </button>
            </div>
            <ChatPanel
              status={chatStatus}
              messages={messages}
              onlineUsers={onlineUsers}
              currentUserId={currentUserId}
              onSendMessage={sendMessage}
              onSendWhisper={sendWhisper}
              onConnect={connectChat}
              isCollapsed={false}
              onToggleCollapse={() => {}}
            />
          </div>
        </div>
      )}

      {/* Feat Selection Modal */}
      {gameState?.player?.pending_feat_selection && gameState?.player?.available_feats && (
        <FeatSelector
          availableFeats={gameState.player.available_feats}
          onSelectFeat={selectFeat}
          isStartingFeat={gameState.player.level === 1}
        />
      )}

      {/* Achievement Toast */}
      {newAchievements.length > 0 && (
        <AchievementToast
          achievements={newAchievements}
          onDismiss={clearAchievements}
        />
      )}

      {/* Debug Toast */}
      <DebugToast message={toastMessage} onDismiss={clearToast} />

      {/* Game Over Overlay */}
      {showGameOver && gameState?.player && (
        <GameOver
          type={showGameOver}
          stats={{
            level: gameState.player.level,
            kills: gameState.player.kills,
            dungeonLevel: gameState.dungeon?.level,
          }}
          onPlayAgain={handleNewGame}
          onMusicChange={handleGameOverMusic}
        />
      )}

      {/* Lore Journal Modal */}
      {showLoreJournal && gameState?.lore_journal && (
        <LoreJournal
          entries={gameState.lore_journal.entries}
          discoveredCount={gameState.lore_journal.discovered_count}
          totalCount={gameState.lore_journal.total_count}
          onClose={() => setShowLoreJournal(false)}
        />
      )}
    </div>
  );
}
