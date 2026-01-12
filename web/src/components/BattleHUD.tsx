/**
 * BattleHUD - Classic RPG-style battle menu for v6.3
 *
 * Features a hierarchical command menu system like classic JRPGs.
 */
import { useEffect, useCallback, useState } from 'react';
import { type BattleState, type BattleReinforcement } from '../types';
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

export function BattleHUD({ battle, onCommand, overviewComplete, onActionSelect, clickedTile, onTileClickHandled }: BattleHUDProps) {
  const { player, enemies, reinforcements = [], round, phase, biome } = battle;

  const [menuState, setMenuState] = useState<MenuState>('main');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const mainMenuItems: MenuItem[] = [
    { id: 'attack', label: 'ATTACK', shortcut: '1', description: 'Strike adjacent enemy' },
    { id: 'abilities', label: 'ABILITIES', shortcut: '2', description: 'Special abilities' },
    { id: 'defend', label: 'DEFEND', shortcut: '3', description: 'Brace for attacks' },
    { id: 'flee', label: 'FLEE', shortcut: '4', description: 'Attempt escape' },
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

  const executeCommand = useCallback((command: string) => {
    onCommand(command);
    setMenuState('main');
    setSelectedIndex(0);
    setPendingAction(null);
    onActionSelect?.(null);
  }, [onCommand, onActionSelect]);

  const handleSelect = useCallback((item: MenuItem) => {
    if (item.disabled) return;

    switch (item.id) {
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

    const { hasEnemy } = clickedTile;
    if (hasEnemy && pendingAction) {
      executeCommand(pendingAction);
    }
    onTileClickHandled?.();
  }, [clickedTile, menuState, pendingAction, phase, executeCommand, onTileClickHandled]);

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

      // Movement (always available)
      if (key === 'w' || key === 'arrowup') {
        if (e.shiftKey || menuState !== 'main' && menuState !== 'abilities') {
          executeCommand('MOVE_UP');
        } else {
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + currentItems.length) % currentItems.length);
        }
        return;
      }
      if (key === 's' || key === 'arrowdown') {
        if (e.shiftKey || menuState !== 'main' && menuState !== 'abilities') {
          executeCommand('MOVE_DOWN');
        } else {
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % currentItems.length);
        }
        return;
      }
      if (key === 'a' || key === 'arrowleft') {
        executeCommand('MOVE_LEFT');
        return;
      }
      if (key === 'd' || key === 'arrowright') {
        executeCommand('MOVE_RIGHT');
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

  // Reset on phase change
  useEffect(() => {
    if (phase === 'PLAYER_TURN') {
      setMenuState('main');
      setSelectedIndex(0);
      setPendingAction(null);
    }
  }, [phase]);

  const reinforcementGroups = groupReinforcements(reinforcements);
  const livingEnemies = enemies.filter(e => e.hp > 0);

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
        </div>
      </div>

      {/* Right panel - Enemies */}
      <div className="battle-panel battle-panel-right">
        <div className="bp-header">ENEMIES ({livingEnemies.length})</div>
        <div className="bp-content">
          {livingEnemies.slice(0, 3).map((enemy, i) => (
            <div key={enemy.entity_id} className="bp-enemy">
              <span>{enemy.symbol || 'E'} {enemy.name || `Enemy ${i+1}`}</span>
              <HealthBar current={enemy.hp} max={enemy.max_hp} showNumbers={false} />
            </div>
          ))}
          {reinforcementGroups.length > 0 && (
            <div className="bp-reinforcements">
              <span className="bp-incoming">INCOMING</span>
              {reinforcementGroups.slice(0, 2).map((g, i) => (
                <div key={i} className="bp-reinforce-entry">
                  {g.name} {g.count > 1 && `x${g.count}`} - {g.turns}T
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
                <p>Click enemy or press ENTER</p>
                <div className="cmd-buttons">
                  <button onClick={() => pendingAction && executeCommand(pendingAction)}>OK</button>
                  <button onClick={() => { setMenuState('main'); setPendingAction(null); onActionSelect?.(null); }}>Cancel</button>
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
          <div className="bp-hint">A/D to move | Shift+W/S to move</div>
        </div>
      )}

      {/* Enemy turn indicator */}
      {phase !== 'PLAYER_TURN' && (
        <div className="battle-waiting">Enemy Turn...</div>
      )}
    </div>
  );
}

export default BattleHUD;
