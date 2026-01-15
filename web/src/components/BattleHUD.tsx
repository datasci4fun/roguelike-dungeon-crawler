/**
 * BattleHUD - Classic RPG-style battle menu for v6.3
 *
 * Features a hierarchical command menu system like classic JRPGs.
 */
import { useEffect, useCallback, useState, useRef } from 'react';
import { type BattleState, type BattleReinforcement, type TurnOrderEntry, type GameEvent } from '../types';
import './BattleHUD.css';

export type SelectedAction = 'move' | 'attack' | 'ability1' | 'ability2' | 'ability3' | 'ability4' | null;

export interface TileCoord {
  x: number;
  y: number;
}

interface BattleHUDProps {
  battle: BattleState;
  onCommand: (command: string) => void;
  overviewComplete: boolean;
  onActionSelect?: (action: SelectedAction) => void;
  clickedTile?: { tile: TileCoord; hasEnemy: boolean } | null;
  onTileClickHandled?: () => void;
  events?: GameEvent[];  // v6.11: For tracking current enemy turn
}

type MenuState = 'main' | 'abilities' | 'items' | 'target' | 'confirm';

interface MenuItem {
  id: string;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  description?: string;
}

function HealthBar({ current, max, showNumbers = true }: { current: number; max: number; showNumbers?: boolean }) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  const color = percentage > 60 ? '#44ff44' : percentage > 30 ? '#ffff44' : '#ff4444';

  return (
    <div className="rpg-health-bar">
      <div className="rpg-health-track">
        <div
          className="rpg-health-fill"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
        {showNumbers && <span className="rpg-health-text">{current}/{max}</span>}
      </div>
    </div>
  );
}

function groupReinforcements(reinforcements: BattleReinforcement[]) {
  const groups: Record<string, { count: number; turns: number; isElite: boolean }> = {};
  for (const r of reinforcements) {
    const key = `${r.enemy_name}-${r.turns_until_arrival}`;
    if (!groups[key]) {
      groups[key] = { count: 0, turns: r.turns_until_arrival, isElite: r.is_elite };
    }
    groups[key].count++;
  }
  return Object.entries(groups)
    .map(([key, data]) => ({ name: key.split('-')[0], ...data }))
    .sort((a, b) => a.turns - b.turns);
}

// Helper: Get icon for entity type
function getEntityIcon(entry: TurnOrderEntry): string {
  if (entry.is_player) return '⚔';
  if (entry.is_boss) return '👑';
  if (entry.is_elite) return '★';
  return '👹';
}

// Helper: Get CSS class for entity type
function getEntityClass(entry: TurnOrderEntry): string {
  if (entry.is_player) return 'player';
  if (entry.is_boss) return 'boss';
  if (entry.is_elite) return 'elite';
  return 'enemy';
}

// v6.12: Combatants Panel - Consolidated turn order + enemies
function CombatantsPanel({ turnOrder, currentActingId, isPlayerTurn, reinforcements }: {
  turnOrder: TurnOrderEntry[];
  currentActingId: string | null;
  isPlayerTurn: boolean;
  reinforcements: { name: string; count: number; turns: number; isElite: boolean }[];
}) {
  if (!turnOrder || turnOrder.length === 0) return null;

  const enemyCount = turnOrder.filter(e => !e.is_player).length;

  return (
    <div className="battle-panel battle-panel-combatants">
      <div className="bp-header">COMBATANTS (Enemies: {enemyCount})</div>
      <div className="bp-content">
        <div className="combatants-list">
          {turnOrder.map((entry) => {
            const isActive = isPlayerTurn
              ? entry.is_player
              : entry.entity_id === currentActingId;
            const entryClass = getEntityClass(entry);
            const hpPercent = Math.max(0, Math.min(100, (entry.hp / entry.max_hp) * 100));

            return (
              <div
                key={entry.entity_id}
                className={`combatant-entry ${entryClass} ${isActive ? 'active' : ''}`}
              >
                <span className="combatant-icon">{getEntityIcon(entry)}</span>
                <span className="combatant-name">{entry.display_id || entry.name}</span>
                <div className="combatant-hp-bar">
                  <div
                    className="combatant-hp-fill"
                    style={{ width: `${hpPercent}%` }}
                  />
                  <span className="combatant-hp-text">{entry.hp}/{entry.max_hp}</span>
                </div>
                {isActive && <span className="combatant-active-marker">◄</span>}
              </div>
            );
          })}
        </div>
        {reinforcements.length > 0 && (
          <div className="combatants-reinforcements">
            <div className="reinforcements-header">▼ INCOMING</div>
            {reinforcements.slice(0, 3).map((g, i) => (
              <div key={i} className={`reinforcement-entry ${g.turns <= 2 ? 'urgent' : ''}`}>
                {g.isElite && '★'} {g.name} {g.count > 1 && `x${g.count}`} ({g.turns}T)
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// v6.12: Initiative Timeline - Bottom horizontal strip
function InitiativeTimeline({ turnOrder, currentActingId, isPlayerTurn }: {
  turnOrder: TurnOrderEntry[];
  currentActingId: string | null;
  isPlayerTurn: boolean;
}) {
  if (!turnOrder || turnOrder.length === 0) return null;

  return (
    <div className="initiative-timeline">
      <span className="timeline-label">INITIATIVE:</span>
      <div className="timeline-icons">
        {turnOrder.map((entry, i) => {
          const isActive = isPlayerTurn
            ? entry.is_player
            : entry.entity_id === currentActingId;
          const entryClass = getEntityClass(entry);

          return (
            <span key={entry.entity_id} className="timeline-entry">
              <span
                className={`timeline-icon ${entryClass} ${isActive ? 'active' : ''}`}
                title={`${entry.display_id || entry.name} (${entry.hp}/${entry.max_hp})`}
              >
                {getEntityIcon(entry)}
              </span>
              {i < turnOrder.length - 1 && <span className="timeline-arrow">→</span>}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function BattleHUD({ battle, onCommand, overviewComplete, onActionSelect, clickedTile, onTileClickHandled, events }: BattleHUDProps) {
  const { player, reinforcements = [], round, phase, biome } = battle;

  const [menuState, setMenuState] = useState<MenuState>('main');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // Track actions used this turn (for multi-action turn system)
  const [hasMovedThisTurn, setHasMovedThisTurn] = useState(false);
  const [hasActedThisTurn, setHasActedThisTurn] = useState(false);

  // Track round number to detect new turns (use ref to avoid re-render issues)
  const lastRoundRef = useRef(round);

  // v6.11: Track current acting entity for turn order highlighting
  const [currentActingEnemyId, setCurrentActingEnemyId] = useState<string | null>(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);

  // v6.11: Extract current acting enemy from events
  useEffect(() => {
    if (!events) return;

    // Check for turn phase events (process in order they appear)
    for (const event of events) {
      if (event.type === 'PLAYER_TURN_START') {
        setIsPlayerTurn(true);
        setCurrentActingEnemyId(null);
      } else if (event.type === 'PLAYER_TURN_END') {
        setIsPlayerTurn(false);
      } else if (event.type === 'ENEMY_TURN_START') {
        setCurrentActingEnemyId(event.data.enemy_id as string);
      } else if (event.type === 'ENEMY_TURN_END') {
        // Keep showing the last acting enemy until next turn starts
      }
    }
  }, [events]);

  const mainMenuItems: MenuItem[] = [
    { id: 'move', label: 'MOVE', shortcut: '1', description: 'Move to adjacent tile', disabled: hasMovedThisTurn },
    { id: 'attack', label: 'ATTACK', shortcut: '2', description: 'Strike adjacent enemy', disabled: hasActedThisTurn },
    { id: 'abilities', label: 'ABILITIES', shortcut: '3', description: 'Special abilities', disabled: hasActedThisTurn },
    { id: 'defend', label: 'DEFEND', shortcut: '4', description: 'Brace for attacks', disabled: hasActedThisTurn },
    { id: 'end_turn', label: 'END TURN', shortcut: '5', description: 'End your turn' },
    { id: 'flee', label: 'FLEE', shortcut: '6', description: 'Attempt escape' },
  ];

  const abilityMenuItems: MenuItem[] = [
    { id: 'ability1', label: 'Strike', shortcut: '1', description: 'Basic attack' },
    { id: 'ability2', label: 'Power Attack', shortcut: '2', description: 'Heavy hit' },
    { id: 'ability3', label: 'Whirlwind', shortcut: '3', description: 'Hit all adjacent' },
    { id: 'back', label: 'BACK', shortcut: 'ESC' },
  ];

  const getCurrentMenuItems = (): MenuItem[] => {
    switch (menuState) {
      case 'abilities': return abilityMenuItems;
      default: return mainMenuItems;
    }
  };

  const currentItems = getCurrentMenuItems();

  const executeCommand = useCallback((command: string, isMove = false) => {
    onCommand(command);

    if (isMove) {
      // After moving, return to main menu but track that we moved
      setHasMovedThisTurn(true);
      setMenuState('main');
      setSelectedIndex(0);
      setPendingAction(null);
      onActionSelect?.(null);
    } else if (command === 'END_TURN') {
      // End turn resets everything (backend will switch to enemy turn)
      setMenuState('main');
      setSelectedIndex(0);
      setPendingAction(null);
      onActionSelect?.(null);
    } else {
      // Combat action (attack/ability/defend) - mark as acted, return to menu
      setHasActedThisTurn(true);
      setMenuState('main');
      setSelectedIndex(0);
      setPendingAction(null);
      onActionSelect?.(null);
    }
  }, [onCommand, onActionSelect]);

  const handleSelect = useCallback((item: MenuItem) => {
    if (item.disabled) return;

    switch (item.id) {
      case 'move':
        onActionSelect?.('move');
        setMenuState('target');
        setPendingAction('MOVE');
        break;
      case 'attack':
        onActionSelect?.('attack');
        setMenuState('target');
        setPendingAction('ATTACK');
        break;
      case 'abilities':
        setMenuState('abilities');
        setSelectedIndex(0);
        break;
      case 'defend':
        executeCommand('WAIT');
        break;
      case 'end_turn':
        executeCommand('END_TURN');
        break;
      case 'flee':
        setMenuState('confirm');
        setPendingAction('FLEE');
        break;
      case 'ability1':
      case 'ability2':
      case 'ability3':
      case 'ability4':
        onActionSelect?.(item.id as SelectedAction);
        setMenuState('target');
        setPendingAction(`ABILITY_${item.id.charAt(item.id.length - 1)}`);
        break;
      case 'back':
        setMenuState('main');
        setSelectedIndex(0);
        onActionSelect?.(null);
        break;
    }
  }, [executeCommand, onActionSelect]);

  const handleConfirm = useCallback((confirmed: boolean) => {
    if (confirmed && pendingAction) {
      executeCommand(pendingAction);
    } else {
      setMenuState('main');
      setPendingAction(null);
    }
  }, [pendingAction, executeCommand]);

  // Handle tile clicks from the 3D renderer
  useEffect(() => {
    if (!clickedTile || phase !== 'PLAYER_TURN' || menuState !== 'target') return;

    const { tile, hasEnemy } = clickedTile;

    // Check if we've already acted/moved this turn (prevent double actions)
    if (pendingAction === 'MOVE' && hasMovedThisTurn) {
      onTileClickHandled?.();
      return;
    }
    if (pendingAction !== 'MOVE' && hasActedThisTurn) {
      onTileClickHandled?.();
      return;
    }

    if (pendingAction === 'MOVE') {
      // For movement, calculate direction based on clicked tile vs player position
      const dx = tile.x - player.arena_x;
      const dy = tile.y - player.arena_y;

      // Only allow adjacent tiles (Manhattan distance of 1) and NOT enemy tiles
      if (Math.abs(dx) + Math.abs(dy) === 1 && !hasEnemy) {
        let moveCmd = '';
        if (dx === 1) moveCmd = 'MOVE_RIGHT';
        else if (dx === -1) moveCmd = 'MOVE_LEFT';
        else if (dy === 1) moveCmd = 'MOVE_DOWN';
        else if (dy === -1) moveCmd = 'MOVE_UP';

        if (moveCmd) {
          executeCommand(moveCmd, true);  // true = isMove
        }
      }
    } else if (hasEnemy && pendingAction) {
      // For attack/ability, require clicking on enemy
      executeCommand(pendingAction);
    }
    onTileClickHandled?.();
  }, [clickedTile, menuState, pendingAction, phase, player.arena_x, player.arena_y, executeCommand, onTileClickHandled, hasMovedThisTurn, hasActedThisTurn]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!overviewComplete || phase !== 'PLAYER_TURN') return;

      const key = e.key.toLowerCase();

      // Confirmation
      if (menuState === 'confirm') {
        if (key === 'y' || key === 'enter') handleConfirm(true);
        else if (key === 'n' || key === 'escape') handleConfirm(false);
        return;
      }

      // Target selection
      if (menuState === 'target') {
        if (key === 'escape') {
          setMenuState('main');
          setPendingAction(null);
          onActionSelect?.(null);
        } else if (key === 'enter' || key === ' ') {
          if (pendingAction) executeCommand(pendingAction);
        }
        return;
      }

      // Menu navigation (W/S or arrows to navigate menu)
      if (key === 'w' || key === 'arrowup') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + currentItems.length) % currentItems.length);
        return;
      }
      if (key === 's' || key === 'arrowdown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % currentItems.length);
        return;
      }

      // Menu select
      if (key === 'enter' || key === ' ') {
        const item = currentItems[selectedIndex];
        if (item) handleSelect(item);
        return;
      }

      if (key === 'escape') {
        if (menuState !== 'main') {
          setMenuState('main');
          setSelectedIndex(0);
          onActionSelect?.(null);
        }
        return;
      }

      // Number shortcuts
      const num = parseInt(key);
      if (num >= 1 && num <= currentItems.length) {
        const item = currentItems[num - 1];
        if (item && !item.disabled) handleSelect(item);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, menuState, selectedIndex, currentItems, pendingAction, overviewComplete, handleSelect, handleConfirm, executeCommand, onActionSelect]);

  // Reset on new round (new turn cycle)
  useEffect(() => {
    if (round !== lastRoundRef.current) {
      lastRoundRef.current = round;
      setMenuState('main');
      setSelectedIndex(0);
      setPendingAction(null);
      // Reset turn tracking for new turn
      setHasMovedThisTurn(false);
      setHasActedThisTurn(false);
    }
  }, [round]);

  // Also reset menu state when phase becomes PLAYER_TURN (for initial setup)
  useEffect(() => {
    if (phase === 'PLAYER_TURN') {
      setMenuState('main');
      setSelectedIndex(0);
      setPendingAction(null);
    }
  }, [phase]);

  const reinforcementGroups = groupReinforcements(reinforcements);

  return (
    <div className="battle-hud">
      {/* Top bar - centered */}
      <div className="battle-top-bar">
        <span className="btb-biome">{biome}</span>
        <span className="btb-sep">|</span>
        <span className="btb-round">Round {round}</span>
        <span className="btb-sep">|</span>
        <span className={`btb-phase ${phase === 'PLAYER_TURN' ? 'player' : 'enemy'}`}>
          {phase === 'PLAYER_TURN' ? 'YOUR TURN' : 'ENEMY TURN'}
        </span>
      </div>

      {/* Left panel - Player */}
      <div className="battle-panel battle-panel-left">
        <div className="bp-header">HERO</div>
        <div className="bp-content">
          <HealthBar current={player.hp} max={player.max_hp} />
          <div className="bp-stats">
            <span>ATK {player.attack}</span>
            <span>DEF {player.defense}</span>
          </div>
          {/* Turn state indicators */}
          <div className="turn-state-indicators">
            <span className={`turn-state ${hasMovedThisTurn ? 'completed' : ''}`}>
              {hasMovedThisTurn ? '✓' : '○'} MOVE
            </span>
            <span className={`turn-state ${hasActedThisTurn ? 'completed' : ''}`}>
              {hasActedThisTurn ? '✓' : '○'} ACTION
            </span>
          </div>
        </div>
      </div>

      {/* Right panel - Combatants (consolidated turn order + enemies) */}
      {battle.turn_order && battle.turn_order.length > 0 && (
        <CombatantsPanel
          turnOrder={battle.turn_order}
          currentActingId={currentActingEnemyId}
          isPlayerTurn={isPlayerTurn}
          reinforcements={reinforcementGroups}
        />
      )}

      {/* Bottom-left command menu */}
      {phase === 'PLAYER_TURN' && overviewComplete && (
        <div className="battle-panel battle-panel-commands">
          <div className="bp-header">
            {menuState === 'main' ? 'COMMANDS' :
             menuState === 'abilities' ? 'ABILITIES' :
             menuState === 'target' ? 'SELECT TARGET' :
             menuState === 'confirm' ? 'CONFIRM' : 'COMMANDS'}
          </div>
          <div className="bp-content">
            {(menuState === 'main' || menuState === 'abilities') && (
              <div className="cmd-menu">
                {currentItems.map((item, i) => (
                  <div
                    key={item.id}
                    className={`cmd-item ${i === selectedIndex ? 'selected' : ''} ${item.disabled ? 'disabled' : ''}`}
                    onClick={() => handleSelect(item)}
                  >
                    <span className="cmd-key">{item.shortcut}</span>
                    <span className="cmd-label">{item.label}</span>
                    {i === selectedIndex && <span className="cmd-cursor">◀</span>}
                  </div>
                ))}
              </div>
            )}

            {menuState === 'target' && (
              <div className="cmd-target">
                <p>{pendingAction === 'MOVE' ? 'Click adjacent tile to move' : 'Click enemy to attack'}</p>
                <div className="cmd-buttons">
                  <button onClick={() => { setMenuState('main'); setPendingAction(null); onActionSelect?.(null); }}>Cancel (ESC)</button>
                </div>
              </div>
            )}

            {menuState === 'confirm' && (
              <div className="cmd-confirm">
                <p>Flee from battle?</p>
                <div className="cmd-buttons">
                  <button onClick={() => handleConfirm(true)}>Yes</button>
                  <button onClick={() => handleConfirm(false)}>No</button>
                </div>
              </div>
            )}
          </div>
          <div className="bp-hint">W/S: Navigate | Enter: Select | ESC: Cancel</div>
        </div>
      )}

      {/* Enemy turn indicator */}
      {phase !== 'PLAYER_TURN' && (
        <div className="battle-waiting">Enemy Turn...</div>
      )}

      {/* Bottom initiative timeline */}
      {battle.turn_order && battle.turn_order.length > 0 && (
        <InitiativeTimeline
          turnOrder={battle.turn_order}
          currentActingId={currentActingEnemyId}
          isPlayerTurn={isPlayerTurn}
        />
      )}
    </div>
  );
}

export default BattleHUD;
