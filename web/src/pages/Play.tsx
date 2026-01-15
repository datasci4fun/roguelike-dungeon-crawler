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
import { StatusHUD } from '../components/StatusHUD';
import { StatsHUD } from '../components/StatsHUD';
import { GameMessagesPanel } from '../components/GameMessagesPanel';
import { Minimap } from '../components/Minimap';
import { ChatPanel } from '../components/ChatPanel';
import { TouchControls } from '../components/TouchControls';
import { AchievementToast } from '../components/AchievementToast';
import { FeatSelector } from '../components/FeatSelector';
import { DebugToast } from '../components/DebugToast';
import { GameOver } from '../components/GameOver';
import { GameOverCutscene, type DeathFateId } from '../components/GameOverCutscene';
import { VictoryCutscene, type VictoryLegacyId } from '../components/VictoryCutscene';
import { LoreCodex } from '../components/LoreCodex';
import { CharacterWindow } from '../components/CharacterWindow';
import { BattleRenderer3D } from '../components/BattleRenderer3D';
import { BattleHUD, type SelectedAction, type TileCoord } from '../components/BattleHUD';
import { TransitionCurtain } from '../components/TransitionCurtain';
import { Graphics3DErrorBoundary } from '../components/ErrorBoundary';
import { GameAnnouncer } from '../components/GameAnnouncer';
import { GAME_STATE_MUSIC } from '../config/audioConfig';
import './Play.css';

export function Play() {
  const { isAuthenticated, isLoading, token } = useAuth();
  const navigate = useNavigate();
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [isGameMessagesCollapsed, setIsGameMessagesCollapsed] = useState(false);
  const [isMinimapCollapsed, setIsMinimapCollapsed] = useState(false);
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
  const [deathCutsceneComplete, setDeathCutsceneComplete] = useState(false);
  const [deathFate, setDeathFate] = useState<DeathFateId>('unknown');
  const [victoryCutsceneComplete, setVictoryCutsceneComplete] = useState(false);
  const [victoryLegacy, setVictoryLegacy] = useState<VictoryLegacyId>('unknown');
  const [showLoreJournal, setShowLoreJournal] = useState(false);
  const [pendingNewLore, setPendingNewLore] = useState<{ lore_id: string; title: string } | null>(null);
  const [battleOverviewComplete, setBattleOverviewComplete] = useState(false);
  const [battleSelectedAction, setBattleSelectedAction] = useState<SelectedAction>(null);
  const [battleClickedTile, setBattleClickedTile] = useState<{ tile: TileCoord; hasEnemy: boolean } | null>(null);

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

  // Track scene container size for responsive renderer
  const sceneContainerRef = useRef<HTMLDivElement>(null);
  const [sceneSize, setSceneSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const container = sceneContainerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setSceneSize({ width: rect.width, height: rect.height });
      }
    };

    // Initial size
    updateSize();

    // Watch for resize
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);

    return () => observer.disconnect();
  }, [showSceneView]);

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
      setDeathCutsceneComplete(false);
      setDeathFate('unknown');
      setVictoryCutsceneComplete(false);
      setVictoryLegacy('unknown');
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

  // Track new lore discoveries for notification
  useEffect(() => {
    if (gameState?.new_lore) {
      setPendingNewLore(gameState.new_lore);
    }
  }, [gameState?.new_lore]);

  // Reset battle state when entering a new battle
  useEffect(() => {
    if (gameState?.battle) {
      // New battle started - reset state
      setBattleOverviewComplete(false);
      setBattleSelectedAction(null);
      setBattleClickedTile(null);
    }
  }, [gameState?.battle?.floor_level, gameState?.battle?.biome]);

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

  // Handler for closing lore journal (clears pending notification)
  const handleCloseLoreJournal = useCallback(() => {
    setShowLoreJournal(false);
    setPendingNewLore(null);
  }, []);

  // Handler for opening lore journal (from CharacterWindow Journal tab)
  const handleOpenLoreJournal = useCallback(() => {
    setShowLoreJournal(true);
  }, []);

  // Cheat hotkeys (dev/testing) - F1-F6 keys
  useEffect(() => {
    const handleCheatKey = (e: KeyboardEvent) => {
      // Only handle F1-F6 keys
      const cheatMap: Record<string, string> = {
        'F1': 'CHEAT_GOD_MODE',
        'F2': 'CHEAT_KILL_ALL',
        'F3': 'CHEAT_HEAL',
        'F4': 'CHEAT_NEXT_FLOOR',
        'F5': 'CHEAT_REVEAL_MAP',
        'F6': 'CHEAT_SPAWN_LORE',
        'F7': 'CHEAT_SHOW_ZONES',
      };

      const cheatCommand = cheatMap[e.key];
      if (cheatCommand) {
        e.preventDefault();
        sendCommand(cheatCommand);
      }
    };

    window.addEventListener('keydown', handleCheatKey);
    return () => window.removeEventListener('keydown', handleCheatKey);
  }, [sendCommand]);

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
              <div className="scene-wrapper" ref={sceneContainerRef}>
                {/* v6.3: Battle mode always uses Three.js renderer */}
                {gameState?.battle ? (
                  <>
                    <Graphics3DErrorBoundary name="BattleRenderer">
                      <BattleRenderer3D
                        battle={gameState.battle}
                        onOverviewComplete={() => setBattleOverviewComplete(true)}
                        selectedAction={battleSelectedAction}
                        onTileClick={(tile, hasEnemy) => setBattleClickedTile({ tile, hasEnemy })}
                        events={gameState.events}
                      />
                    </Graphics3DErrorBoundary>
                    <BattleHUD
                      battle={gameState.battle}
                      onCommand={(cmd) => sendCommand(cmd)}
                      overviewComplete={battleOverviewComplete}
                      onActionSelect={setBattleSelectedAction}
                      clickedTile={battleClickedTile}
                      onTileClickHandled={() => setBattleClickedTile(null)}
                      events={gameState.events}
                    />
                  </>
                ) : use3DMode ? (
                  <Graphics3DErrorBoundary name="FirstPersonRenderer3D">
                    <FirstPersonRenderer3D
                      view={gameState?.first_person_view}
                      settings={{ biome: 'dungeon', useTileGrid }}
                      width={sceneSize.width}
                      height={sceneSize.height}
                      deathCamActive={gameState?.game_state === 'DEAD'}
                      fieldPulse={gameState?.field_pulse}
                      zoneOverlay={gameState?.zone_overlay}
                    />
                  </Graphics3DErrorBoundary>
                ) : (
                  <Graphics3DErrorBoundary name="FirstPersonRenderer">
                    <FirstPersonRenderer
                      view={gameState?.first_person_view}
                      settings={{ biome: 'dungeon', useTileGrid }}
                      width={sceneSize.width}
                      height={sceneSize.height}
                      enableAnimations={true}
                      debugShowWireframe={showWireframe}
                      debugShowOccluded={showOccluded}
                      onCorridorInfo={handleCorridorInfo}
                    />
                  </Graphics3DErrorBoundary>
                )}
                {/* Stats HUD overlay (top-left) - hide during battle */}
                {gameState?.player && !gameState?.battle && (
                  <StatsHUD
                    level={gameState.player.level}
                    className={gameState.player.class?.name}
                    health={gameState.player.health}
                    maxHealth={gameState.player.max_health}
                    xp={gameState.player.xp}
                    xpToLevel={gameState.player.xp_to_level}
                    attack={gameState.player.attack}
                    defense={gameState.player.defense}
                    kills={gameState.player.kills}
                  />
                )}
                {/* Character HUD overlay - hide during battle */}
                {gameState?.player?.race && !gameState?.battle && (
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
                {/* Status HUD overlay (Field Pulse, Artifacts, Vows) - hide during battle */}
                {!gameState?.battle && (
                  <StatusHUD
                    fieldPulse={gameState?.field_pulse}
                    artifacts={gameState?.player?.artifacts}
                  />
                )}
                {/* Game Messages Panel (bottom-left) - hide during battle */}
                {gameState?.messages && !gameState?.battle && (
                  <GameMessagesPanel
                    messages={gameState.messages}
                    isCollapsed={isGameMessagesCollapsed}
                    onToggle={() => setIsGameMessagesCollapsed(prev => !prev)}
                  />
                )}
                {/* Minimap (bottom-right) - hide during battle */}
                {gameState?.first_person_view?.top_down_window && !gameState?.battle && (
                  <Minimap
                    tiles={gameState.first_person_view.top_down_window}
                    playerFacing={gameState.first_person_view.facing}
                    dungeonLevel={gameState.dungeon?.level || 1}
                    isCollapsed={isMinimapCollapsed}
                    onToggle={() => setIsMinimapCollapsed(prev => !prev)}
                  />
                )}
                {/* Character Window Modal (includes inventory tab) - inside scene container */}
                {(gameState?.ui_mode === 'CHARACTER' || gameState?.ui_mode === 'INVENTORY') && gameState?.player && (
                  <CharacterWindow
                    player={gameState.player}
                    onClose={() => sendCommand('ESCAPE')}
                    inventory={gameState.inventory}
                    onInventoryNavigate={(dir) => sendCommand(dir === 'up' ? 'INVENTORY_UP' : 'INVENTORY_DOWN')}
                    onInventorySelect={(index) => sendCommand('INVENTORY_SELECT', { index })}
                    onInventoryUse={() => sendCommand('INVENTORY_USE')}
                    onInventoryDrop={() => sendCommand('INVENTORY_DROP')}
                    onInventoryRead={() => sendCommand('INVENTORY_READ')}
                    equipment={gameState.equipment}
                    onUnequip={(slot) => sendCommand(`UNEQUIP_${slot.toUpperCase()}`)}
                    initialTab={gameState.ui_mode === 'INVENTORY' ? 'inventory' : 'stats'}
                    loreJournal={gameState.lore_journal}
                    onOpenLoreCodex={handleOpenLoreJournal}
                  />
                )}
                {/* Lore Codex Modal - inside scene container */}
                {showLoreJournal && gameState?.lore_journal && (
                  <LoreCodex
                    entries={gameState.lore_journal.entries}
                    discoveredCount={gameState.lore_journal.discovered_count}
                    totalCount={gameState.lore_journal.total_count}
                    onClose={handleCloseLoreJournal}
                    initialEntryId={pendingNewLore?.lore_id}
                  />
                )}
                {/* v6.1: Transition Curtain - contained within scene view */}
                <TransitionCurtain
                  transition={gameState?.transition}
                  onSkip={() => sendCommand('SKIP')}
                />

                {/* Death Cutscene - contained within scene view */}
                {showGameOver === 'death' && !deathCutsceneComplete && (
                  <GameOverCutscene
                    onComplete={() => setDeathCutsceneComplete(true)}
                    onSkip={() => setDeathCutsceneComplete(true)}
                    onMusicChange={handleGameOverMusic}
                    onFateSelected={setDeathFate}
                  />
                )}

                {/* Victory Cutscene - contained within scene view */}
                {showGameOver === 'victory' && !victoryCutsceneComplete && (
                  <VictoryCutscene
                    onComplete={() => setVictoryCutsceneComplete(true)}
                    onSkip={() => setVictoryCutsceneComplete(true)}
                    onMusicChange={handleGameOverMusic}
                    onLegacySelected={setVictoryLegacy}
                  />
                )}

                {/* Game Over Stats - contained within scene view */}
                {showGameOver && gameState?.player && (
                  (showGameOver === 'death' && deathCutsceneComplete) ||
                  (showGameOver === 'victory' && victoryCutsceneComplete)
                ) && (
                  <GameOver
                    type={showGameOver}
                    stats={{
                      level: gameState.player.level,
                      kills: gameState.player.kills,
                      dungeonLevel: gameState.dungeon?.level,
                    }}
                    onPlayAgain={handleNewGame}
                    onMusicChange={handleGameOverMusic}
                    deathFate={deathFate}
                    victoryLegacy={victoryLegacy}
                  />
                )}
              </div>
            )}
          </div>

          <div className="game-controls" role="group" aria-label="View settings">
            <label className="scene-toggle">
              <input
                type="checkbox"
                checked={showSceneView}
                onChange={(e) => setShowSceneView(e.target.checked)}
                aria-describedby="scene-view-desc"
              />
              First-Person View
              <span id="scene-view-desc" className="visually-hidden">
                Toggle the first-person dungeon view
              </span>
            </label>

            <label className="scene-toggle">
              <input
                type="checkbox"
                checked={useTileGrid}
                onChange={(e) => setUseTileGrid(e.target.checked)}
                disabled={!showSceneView}
                aria-describedby="tile-grid-desc"
              />
              Tile Grid
              <span id="tile-grid-desc" className="visually-hidden">
                Show tile grid overlay on dungeon floor
              </span>
            </label>

            <label className="scene-toggle">
              <input
                type="checkbox"
                checked={use3DMode}
                onChange={(e) => setUse3DMode(e.target.checked)}
                disabled={!showSceneView}
                aria-describedby="3d-mode-desc"
              />
              3D Mode
              <span id="3d-mode-desc" className="visually-hidden">
                Use Three.js 3D rendering instead of canvas 2D
              </span>
            </label>

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

      {/* New Lore Notification Bar */}
      {pendingNewLore && !showLoreJournal && (
        <div className="lore-notification">
          <span className="lore-notification-icon">?</span>
          <span className="lore-notification-text">
            New lore discovered: <strong>{pendingNewLore.title}</strong>
          </span>
          <span className="lore-notification-hint">Press [J] to read</span>
        </div>
      )}

      {/* v6.5.1 med-06: Screen reader announcements */}
      <GameAnnouncer gameState={gameState} events={gameState?.events} />
    </div>
  );
}
