/**
 * BattleOverlay - Tactical battle mode overlay for v6.0.5
 *
 * Displays the battle arena, entities, and UI controls during tactical combat.
 * Includes reinforcement tracking, keyboard controls, artifact status,
 * and v6.1 arena overview pan on battle start.
 */
import { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { type BattleState, type BattleEntity, type BattleReinforcement } from '../types';
import './BattleOverlay.css';

interface BattleOverlayProps {
  battle: BattleState;
  onCommand: (command: string) => void;
}

// Tile rendering configuration
const TILE_SIZE = 32;

const TILE_COLORS: Record<string, string> = {
  '.': '#2a2a3a', // Floor
  '#': '#444455', // Wall
  '~': '#ff6633', // Lava
  '=': '#aaddff', // Ice
  '\u2248': '#3366aa', // Deep water (approx symbol)
  '!': '#88ff88', // Poison gas
  '+': '#8b4513', // Door
  ' ': '#1a1a2a', // Empty/void
};

// Hazard tiles for highlighting during overview
const HAZARD_TILES = ['~', '=', '\u2248', '!'];

function getTileColor(tile: string): string {
  return TILE_COLORS[tile] || TILE_COLORS['.'];
}

function isHazardTile(tile: string): boolean {
  return HAZARD_TILES.includes(tile);
}

function getEntitySymbol(entity: BattleEntity): string {
  if (entity.is_player) return '@';
  return 'E';
}

function getEntityColor(entity: BattleEntity): string {
  if (entity.is_player) return '#ffff00';
  return '#ff4444';
}

function HealthBar({ current, max }: { current: number; max: number }) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  const color = percentage > 60 ? '#44ff44' : percentage > 30 ? '#ffff44' : '#ff4444';

  return (
    <div className="health-bar">
      <div
        className="health-bar-fill"
        style={{ width: `${percentage}%`, backgroundColor: color }}
      />
      <span className="health-bar-text">{current}/{max}</span>
    </div>
  );
}

// Group reinforcements by type and turns
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
    .map(([key, data]) => ({
      name: key.split('-')[0],
      ...data,
    }))
    .sort((a, b) => a.turns - b.turns);
}

// v6.1: Overview phases
type OverviewPhase = 'zoom_out' | 'pan_enemies' | 'pan_player' | 'settle' | 'done';

// v6.1: Phase durations (ms) - base timings, scaled by arena size
const OVERVIEW_BASE_TIMINGS = {
  zoom_out: 250,
  pan_enemies: 450,
  pan_player: 450,
  settle: 350,
};

// Arena size -> timing multiplier (larger arenas get slightly longer overview)
function getTimingMultiplier(width: number, height: number): number {
  const area = width * height;
  if (area <= 63) return 1.0;      // 9x7 = 63
  if (area <= 99) return 1.15;    // 11x9 = 99
  return 1.3;                      // 11x11 = 121+
}

// Generate a unique key for a battle to detect new battles
function getBattleKey(battle: BattleState): string {
  return `${battle.floor_level}-${battle.biome}-${battle.arena_width}x${battle.arena_height}`;
}

export function BattleOverlay({ battle, onCommand }: BattleOverlayProps) {
  const {
    arena_tiles, arena_width, arena_height, player, enemies,
    reinforcements = [], round, phase, biome,
    duplicate_seal_armed, woundglass_reveal_active, safe_tiles_revealed = []
  } = battle;

  // v6.1: Overview state
  const [overviewPhase, setOverviewPhase] = useState<OverviewPhase>('done');
  const [overviewDone, setOverviewDone] = useState(false);
  const lastBattleKeyRef = useRef<string | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Camera state for overview pan
  const [cameraScale, setCameraScale] = useState(1);
  const [cameraX, setCameraX] = useState(0);
  const [cameraY, setCameraY] = useState(0);

  // Calculate canvas size
  const canvasWidth = arena_width * TILE_SIZE;
  const canvasHeight = arena_height * TILE_SIZE;

  // Compute center positions for pan targets
  const arenaCenter = useMemo(() => ({
    x: canvasWidth / 2,
    y: canvasHeight / 2,
  }), [canvasWidth, canvasHeight]);

  const enemyCenter = useMemo(() => {
    const livingEnemies = enemies.filter(e => e.hp > 0);
    if (livingEnemies.length === 0) return arenaCenter;
    const avgX = livingEnemies.reduce((sum, e) => sum + e.arena_x, 0) / livingEnemies.length;
    const avgY = livingEnemies.reduce((sum, e) => sum + e.arena_y, 0) / livingEnemies.length;
    return {
      x: (avgX + 0.5) * TILE_SIZE,
      y: (avgY + 0.5) * TILE_SIZE,
    };
  }, [enemies, arenaCenter]);

  const playerCenter = useMemo(() => ({
    x: (player.arena_x + 0.5) * TILE_SIZE,
    y: (player.arena_y + 0.5) * TILE_SIZE,
  }), [player.arena_x, player.arena_y]);

  // Compute reinforcement entry edges (for highlighting)
  const reinforcementEdges = useMemo(() => {
    // Typically reinforcements enter from edges
    // Highlight top/bottom/left/right edge tiles
    const edges: Set<string> = new Set();
    // Top edge
    for (let x = 0; x < arena_width; x++) edges.add(`${x}-0`);
    // Bottom edge
    for (let x = 0; x < arena_width; x++) edges.add(`${x}-${arena_height - 1}`);
    // Left edge
    for (let y = 0; y < arena_height; y++) edges.add(`0-${y}`);
    // Right edge
    for (let y = 0; y < arena_height; y++) edges.add(`${arena_width - 1}-${y}`);
    return edges;
  }, [arena_width, arena_height]);

  // v6.1: Detect new battle and trigger overview
  useEffect(() => {
    const battleKey = getBattleKey(battle);

    // Check if this is a new battle
    if (battleKey !== lastBattleKeyRef.current) {
      lastBattleKeyRef.current = battleKey;

      // Only run overview on round 1, PLAYER_TURN
      if (round === 1 && phase === 'PLAYER_TURN') {
        setOverviewDone(false);
        setOverviewPhase('zoom_out');
        runOverviewAnimation();
      } else {
        // Mid-battle load or not first turn - skip overview
        setOverviewDone(true);
        setOverviewPhase('done');
        setCameraScale(1);
        setCameraX(0);
        setCameraY(0);
      }
    }
  }, [battle, round, phase]);

  // v6.1: Run overview animation
  const runOverviewAnimation = useCallback(() => {
    const phases: OverviewPhase[] = ['zoom_out', 'pan_enemies', 'pan_player', 'settle'];
    let currentPhaseIndex = 0;
    let phaseStartTime = performance.now();

    // Calculate timing multiplier based on arena size
    const timingMultiplier = getTimingMultiplier(arena_width, arena_height);

    // Calculate zoom-out scale to fit arena in viewport
    // Assume viewport is roughly 600x400 for the arena container
    const viewportWidth = 600;
    const viewportHeight = 400;
    const zoomOutScale = Math.min(
      viewportWidth / canvasWidth,
      viewportHeight / canvasHeight,
      0.6 // Don't zoom out too much
    );

    const animate = (time: number) => {
      const currentPhase = phases[currentPhaseIndex];
      const phaseDuration = OVERVIEW_BASE_TIMINGS[currentPhase] * timingMultiplier;
      const elapsed = time - phaseStartTime;
      const progress = Math.min(elapsed / phaseDuration, 1);

      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);

      switch (currentPhase) {
        case 'zoom_out':
          // Zoom out to show whole arena
          setCameraScale(1 - (1 - zoomOutScale) * eased);
          setOverviewPhase('zoom_out');
          break;

        case 'pan_enemies':
          // Pan to enemy center (while zoomed out)
          setCameraScale(zoomOutScale);
          const enemyOffsetX = (enemyCenter.x - arenaCenter.x) * eased * 0.3;
          const enemyOffsetY = (enemyCenter.y - arenaCenter.y) * eased * 0.3;
          setCameraX(enemyOffsetX);
          setCameraY(enemyOffsetY);
          setOverviewPhase('pan_enemies');
          break;

        case 'pan_player':
          // Pan to player (while zoomed out)
          const playerOffsetX = (playerCenter.x - arenaCenter.x) * eased * 0.3;
          const playerOffsetY = (playerCenter.y - arenaCenter.y) * eased * 0.3;
          setCameraX(playerOffsetX);
          setCameraY(playerOffsetY);
          setOverviewPhase('pan_player');
          break;

        case 'settle':
          // Zoom back in and center
          setCameraScale(zoomOutScale + (1 - zoomOutScale) * eased);
          setCameraX(0);
          setCameraY(0);
          setOverviewPhase('settle');
          break;
      }

      if (progress >= 1) {
        // Move to next phase
        currentPhaseIndex++;
        phaseStartTime = time;

        if (currentPhaseIndex >= phases.length) {
          // Animation complete
          setOverviewPhase('done');
          setOverviewDone(true);
          setCameraScale(1);
          setCameraX(0);
          setCameraY(0);
          return;
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [canvasWidth, canvasHeight, arenaCenter, enemyCenter, playerCenter, arena_width, arena_height]);

  // v6.1: Skip overview
  const skipOverview = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setOverviewPhase('done');
    setOverviewDone(true);
    setCameraScale(1);
    setCameraX(0);
    setCameraY(0);
  }, []);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Keyboard controls (with overview lock)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // v6.1: Handle skip during overview
    if (!overviewDone) {
      if (e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        skipOverview();
      }
      return; // Block all other input during overview
    }

    // Normal battle controls
    if (phase !== 'PLAYER_TURN') return;

    switch (e.key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        onCommand('MOVE_UP');
        break;
      case 's':
      case 'arrowdown':
        onCommand('MOVE_DOWN');
        break;
      case 'a':
      case 'arrowleft':
        onCommand('MOVE_LEFT');
        break;
      case 'd':
      case 'arrowright':
        onCommand('MOVE_RIGHT');
        break;
      case '1':
        onCommand('ABILITY_1');
        break;
      case '2':
        onCommand('ABILITY_2');
        break;
      case '3':
        onCommand('ABILITY_3');
        break;
      case '4':
        onCommand('ABILITY_4');
        break;
      case ' ':
      case 'enter':
        onCommand('WAIT');
        break;
      case 'escape':
        onCommand('FLEE');
        break;
    }
  }, [phase, onCommand, overviewDone, skipOverview]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Check if tile is safe (revealed by woundglass/archivist)
  const isSafeTile = (x: number, y: number) => {
    return safe_tiles_revealed.some(([sx, sy]) => sx === x && sy === y);
  };

  // Check if tile should be highlighted during overview
  const shouldHighlight = (x: number, y: number, tile: string) => {
    if (overviewDone) return false;
    const isHighlightPhase = overviewPhase === 'pan_enemies' || overviewPhase === 'pan_player';
    if (!isHighlightPhase) return false;

    // Highlight hazards
    if (isHazardTile(tile)) return true;

    // Highlight reinforcement edges if there are reinforcements
    if (reinforcements.length > 0 && reinforcementEdges.has(`${x}-${y}`)) return true;

    return false;
  };

  // Render tile
  const renderTile = (x: number, y: number) => {
    const tile = arena_tiles[y]?.[x] || ' ';
    const color = getTileColor(tile);
    const isSafe = isSafeTile(x, y);
    const highlight = shouldHighlight(x, y, tile);
    const isHazard = isHazardTile(tile);
    const isEdge = reinforcementEdges.has(`${x}-${y}`);

    const classes = [
      'arena-tile',
      isSafe ? 'safe-tile' : '',
      highlight && isHazard ? 'highlight-hazard' : '',
      highlight && isEdge && reinforcements.length > 0 ? 'highlight-edge' : '',
    ].filter(Boolean).join(' ');

    return (
      <div
        key={`${x}-${y}`}
        className={classes}
        style={{
          left: x * TILE_SIZE,
          top: y * TILE_SIZE,
          width: TILE_SIZE,
          height: TILE_SIZE,
          backgroundColor: color,
        }}
      />
    );
  };

  // Render entity
  const renderEntity = (entity: BattleEntity) => {
    const symbol = getEntitySymbol(entity);
    const color = getEntityColor(entity);

    return (
      <div
        key={entity.entity_id}
        className="arena-entity"
        style={{
          left: entity.arena_x * TILE_SIZE,
          top: entity.arena_y * TILE_SIZE,
          width: TILE_SIZE,
          height: TILE_SIZE,
          color,
        }}
      >
        <span className="entity-symbol">{symbol}</span>
        {entity.hp < entity.max_hp && (
          <div className="entity-hp-pip" style={{
            width: `${(entity.hp / entity.max_hp) * 100}%`,
            backgroundColor: entity.is_player ? '#44ff44' : '#ff4444',
          }} />
        )}
      </div>
    );
  };

  // Build tiles grid
  const tiles = [];
  for (let y = 0; y < arena_height; y++) {
    for (let x = 0; x < arena_width; x++) {
      tiles.push(renderTile(x, y));
    }
  }

  // All entities
  const allEntities = [player, ...enemies.filter(e => e.hp > 0)];

  // Group reinforcements for display
  const reinforcementGroups = groupReinforcements(reinforcements);

  // Calculate transform for camera
  const arenaTransform = `translate(${-cameraX}px, ${-cameraY}px) scale(${cameraScale})`;

  return (
    <div className="battle-overlay">
      <div className="battle-header">
        <h2 className="battle-title">TACTICAL COMBAT</h2>
        <div className="battle-info">
          <span className="battle-round">Round {round}</span>
          <span className="battle-phase">{phase.replace('_', ' ')}</span>
          <span className="battle-biome">{biome}</span>
        </div>
        {/* Artifact status indicators */}
        <div className="battle-artifacts">
          {duplicate_seal_armed && (
            <span className="artifact-indicator seal-armed" title="Duplicate Seal Armed">
              &amp;
            </span>
          )}
          {woundglass_reveal_active && (
            <span className="artifact-indicator woundglass-active" title="Woundglass Active">
              %
            </span>
          )}
        </div>
      </div>

      <div className="battle-arena-container">
        <div
          className={`battle-arena ${!overviewDone ? 'overview-active' : ''}`}
          style={{
            width: canvasWidth,
            height: canvasHeight,
            transform: arenaTransform,
            transformOrigin: 'center center',
          }}
        >
          {tiles}
          {allEntities.map(renderEntity)}
        </div>

        {/* v6.1: Overview skip hint */}
        {!overviewDone && (
          <div className="overview-hint">
            <span className="overview-phase-label">
              {overviewPhase === 'zoom_out' && 'Surveying battlefield...'}
              {overviewPhase === 'pan_enemies' && 'Enemy positions...'}
              {overviewPhase === 'pan_player' && 'Your position...'}
              {overviewPhase === 'settle' && 'Ready...'}
            </span>
            <span className="overview-skip-hint">Press SPACE to skip</span>
          </div>
        )}
      </div>

      <div className="battle-sidebar">
        <div className="player-status">
          <h3>Player</h3>
          <HealthBar current={player.hp} max={player.max_hp} />
          <div className="stat-row">
            <span>ATK: {player.attack}</span>
            <span>DEF: {player.defense}</span>
          </div>
          {player.status_effects.length > 0 && (
            <div className="status-effects">
              {player.status_effects.map((effect, i) => (
                <span key={i} className="status-effect">{effect}</span>
              ))}
            </div>
          )}
        </div>

        <div className="enemies-status">
          <h3>Enemies ({enemies.filter(e => e.hp > 0).length})</h3>
          {enemies.filter(e => e.hp > 0).map((enemy, i) => (
            <div key={enemy.entity_id} className="enemy-status">
              <span className="enemy-name">Enemy {i + 1}</span>
              <HealthBar current={enemy.hp} max={enemy.max_hp} />
            </div>
          ))}
        </div>

        {/* Reinforcements panel */}
        {reinforcementGroups.length > 0 && (
          <div className="reinforcements-status">
            <h3>Incoming ({reinforcements.length})</h3>
            {reinforcementGroups.map((group, i) => (
              <div key={i} className={`reinforcement-row ${group.isElite ? 'elite' : ''}`}>
                <span className="reinforcement-name">
                  {group.name} {group.count > 1 ? `x${group.count}` : ''}
                  {group.isElite && <span className="elite-marker">*</span>}
                </span>
                <span className="reinforcement-turns">{group.turns} turns</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions panel - disabled during overview */}
        {phase === 'PLAYER_TURN' && (
          <div className={`battle-actions ${!overviewDone ? 'disabled' : ''}`}>
            <h3>Actions</h3>
            <div className="action-hint">WASD to move, 1-4 for abilities</div>
            <button onClick={() => overviewDone && onCommand('ATTACK')} disabled={!overviewDone}>
              Attack (1)
            </button>
            <button onClick={() => overviewDone && onCommand('ABILITY_2')} disabled={!overviewDone}>
              Special (2)
            </button>
            <button onClick={() => overviewDone && onCommand('WAIT')} disabled={!overviewDone}>
              Wait (Space)
            </button>
            <button
              onClick={() => overviewDone && onCommand('FLEE')}
              disabled={!overviewDone}
              className="flee-btn"
            >
              Flee (Esc)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
