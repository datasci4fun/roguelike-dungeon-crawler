/**
 * GameTerminal - xterm.js based game terminal component.
 *
 * Renders the roguelike game state to a terminal emulator and
 * captures keyboard input for game commands.
 *
 * Delegates to:
 * - GameTerminal/constants.ts: ANSI color definitions
 * - GameTerminal/keymap.ts: Keyboard input mapping
 * - GameTerminal/screens.ts: UI screen renderers
 */
import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import type { FullGameState, Enemy, Item } from '../hooks/useGameSocket';
import './GameTerminal.css';
import { COLORS, ENEMY_COLORS, ITEM_COLORS, TILE_COLORS } from './GameTerminal/constants';
import { mapKeyToCommand } from './GameTerminal/keymap';
import {
  renderInventory,
  renderDialog,
  renderCharacterScreen,
  renderHelpScreen,
  renderMessageLog,
  renderReadingScreen,
} from './GameTerminal/screens';

interface GameTerminalProps {
  gameState: FullGameState | null;
  onCommand?: (command: string) => void;
  onNewGame?: () => void;
  onQuit?: () => void;
  isConnected?: boolean;
  isSpectator?: boolean;
}

export function GameTerminal({
  gameState,
  onCommand,
  onNewGame,
  onQuit,
  isConnected = true,
  isSpectator = false,
}: GameTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  // Track previous state for animations
  const prevStateRef = useRef<{
    level: number;
    xp: number;
    health: number;
  } | null>(null);

  // Animation state
  const [animationClass, setAnimationClass] = useState('');

  // Detect state changes for animations
  useEffect(() => {
    if (!gameState?.player) {
      prevStateRef.current = null;
      return;
    }

    const { player } = gameState;
    const prev = prevStateRef.current;

    if (prev) {
      // Level up - gold flash
      if (player.level > prev.level) {
        setAnimationClass('level-up');
        setTimeout(() => setAnimationClass(''), 800);
      }
      // XP gain - subtle green flash
      else if (player.xp > prev.xp) {
        setAnimationClass('xp-gain');
        setTimeout(() => setAnimationClass(''), 400);
      }
      // Damage taken - red flash
      else if (player.health < prev.health) {
        setAnimationClass('damage-taken');
        setTimeout(() => setAnimationClass(''), 300);
      }
    }

    // Update previous state
    prevStateRef.current = {
      level: player.level,
      xp: player.xp,
      health: player.health,
    };
  }, [gameState?.player?.level, gameState?.player?.xp, gameState?.player?.health]);

  // Compute persistent classes based on game state
  const persistentClasses: string[] = [];
  if (gameState?.player) {
    const healthPercent = gameState.player.health / gameState.player.max_health;
    if (healthPercent <= 0.2 && healthPercent > 0) {
      persistentClasses.push('health-critical');
    }
  }
  if (gameState?.game_state === 'VICTORY') {
    persistentClasses.push('victory');
  }

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    const terminal = new Terminal({
      cursorBlink: false,
      cursorStyle: 'block',
      disableStdin: true,
      fontSize: 14,
      fontFamily: '"Cascadia Code", "Fira Code", "Consolas", monospace',
      theme: {
        background: '#1a1a2e',
        foreground: '#eaeaea',
        cursor: '#eaeaea',
        black: '#1a1a2e',
        red: '#ff5555',
        green: '#50fa7b',
        yellow: '#f1fa8c',
        blue: '#6272a4',
        magenta: '#ff79c6',
        cyan: '#8be9fd',
        white: '#f8f8f2',
        brightBlack: '#44475a',
        brightRed: '#ff6e6e',
        brightGreen: '#69ff94',
        brightYellow: '#ffffa5',
        brightBlue: '#d6acff',
        brightMagenta: '#ff92df',
        brightCyan: '#a4ffff',
        brightWhite: '#ffffff',
      },
      allowTransparency: false,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Handle resize and orientation change
    const handleResize = () => {
      // Small delay to let the layout settle
      setTimeout(() => {
        fitAddon.fit();
      }, 100);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      terminal.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture input if spectating, disconnected, or no game
      if (isSpectator || !isConnected) return;

      // When in battle mode, BattleHUD handles all input - skip GameTerminal handling
      // This prevents WASD from triggering both dungeon movement AND battle menu navigation
      if (gameState?.battle) {
        return;
      }

      // Prevent default for game keys
      const gameKeys = [
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'w', 'a', 's', 'd', 'W', 'A', 'S', 'D',
        'i', 'I', 'c', 'C', 'm', 'M', '?',
        '1', '2', '3', '>', 'q', 'Q', 'e', 'E',
        'Escape', 'Enter', 'x', 'X',
      ];

      if (gameKeys.includes(e.key)) {
        e.preventDefault();
      }

      // Map key to command
      const command = mapKeyToCommand(e.key, gameState?.ui_mode || 'GAME');
      if (command) {
        if (command === 'NEW_GAME') {
          onNewGame?.();
        } else if (command === 'QUIT' && !gameState) {
          onQuit?.();
        } else if ((command === 'ANY_KEY' || command === 'CONFIRM') && !gameState) {
          // Start new game when pressing Enter/Space with no active game
          onNewGame?.();
        } else {
          onCommand?.(command);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConnected, isSpectator, gameState?.ui_mode, gameState?.battle, onCommand, onNewGame, onQuit, gameState]);

  // Render game state to terminal
  useEffect(() => {
    const terminal = xtermRef.current;
    if (!terminal) return;

    // Clear and render
    terminal.clear();
    terminal.write('\x1b[H'); // Move cursor to home

    if (!isConnected) {
      renderDisconnected(terminal);
    } else if (!gameState) {
      if (!isSpectator) {
        renderNoGame(terminal);
      } else {
        terminal.writeln(`${COLORS.dim}  Connecting to game...${COLORS.reset}`);
      }
    } else {
      renderGameState(terminal, gameState, isSpectator);
    }
  }, [gameState, isConnected, isSpectator]);

  const terminalClasses = [
    'game-terminal',
    animationClass,
    ...persistentClasses,
  ].filter(Boolean).join(' ');

  return <div ref={terminalRef} className={terminalClasses} />;
}

function renderDisconnected(terminal: Terminal) {
  const lines = [
    '',
    `${COLORS.brightRed}  Disconnected from server${COLORS.reset}`,
    '',
    '  Refresh the page to reconnect.',
  ];
  lines.forEach((line) => terminal.writeln(line));
}

function renderNoGame(terminal: Terminal) {
  const title = [
    '',
    `${COLORS.brightYellow}  ╔══════════════════════════════════════╗${COLORS.reset}`,
    `${COLORS.brightYellow}  ║${COLORS.reset}     ${COLORS.brightWhite}ROGUELIKE DUNGEON CRAWLER${COLORS.reset}      ${COLORS.brightYellow}║${COLORS.reset}`,
    `${COLORS.brightYellow}  ╚══════════════════════════════════════╝${COLORS.reset}`,
    '',
    `${COLORS.cyan}  Press ${COLORS.brightWhite}ENTER${COLORS.cyan} or ${COLORS.brightWhite}SPACE${COLORS.cyan} to start a new game${COLORS.reset}`,
    '',
    `${COLORS.dim}  Controls:${COLORS.reset}`,
    `${COLORS.dim}    WASD / Arrow Keys - Move${COLORS.reset}`,
    `${COLORS.dim}    Q / E - Turn Left / Right${COLORS.reset}`,
    `${COLORS.dim}    I - Inventory${COLORS.reset}`,
    `${COLORS.dim}    C - Character${COLORS.reset}`,
    `${COLORS.dim}    M - Message Log${COLORS.reset}`,
    `${COLORS.dim}    > - Descend stairs${COLORS.reset}`,
    `${COLORS.dim}    X - Quit${COLORS.reset}`,
  ];
  title.forEach((line) => terminal.writeln(line));
}

function renderGameState(terminal: Terminal, state: FullGameState, isSpectator = false) {
  // Handle different game states
  if (state.game_state === 'DEAD') {
    renderDeathScreen(terminal, state, isSpectator);
    return;
  }

  if (state.game_state === 'VICTORY') {
    renderVictoryScreen(terminal, state, isSpectator);
    return;
  }

  // Handle UI modes
  if (state.ui_mode === 'INVENTORY' && state.inventory) {
    renderInventory(terminal, state);
    return;
  }

  if (state.ui_mode === 'DIALOG' && state.dialog) {
    renderDialog(terminal, state);
    return;
  }

  if (state.ui_mode === 'CHARACTER') {
    renderCharacterScreen(terminal, state);
    return;
  }

  if (state.ui_mode === 'HELP') {
    renderHelpScreen(terminal);
    return;
  }

  if (state.ui_mode === 'MESSAGE_LOG') {
    renderMessageLog(terminal, state);
    return;
  }

  if (state.ui_mode === 'READING' && state.reading) {
    renderReadingScreen(terminal, state);
    return;
  }

  // Default: render game view
  renderGameView(terminal, state, isSpectator);
}

function renderGameView(terminal: Terminal, state: FullGameState, isSpectator = false) {
  const { player, dungeon, enemies, items, messages } = state;

  if (!dungeon || !player) {
    terminal.writeln('  Loading...');
    return;
  }

  // Build the display
  const viewportWidth = dungeon.tiles[0]?.length || 40;
  const viewportHeight = dungeon.tiles.length || 20;

  // Calculate player position in viewport (center)
  const playerViewX = Math.floor(viewportWidth / 2);
  const playerViewY = Math.floor(viewportHeight / 2);

  // Create entity maps for quick lookup
  const enemyMap = new Map<string, Enemy>();
  const itemMap = new Map<string, Item>();

  enemies?.forEach((e) => {
    const vx = e.x - player.x + playerViewX;
    const vy = e.y - player.y + playerViewY;
    if (vx >= 0 && vx < viewportWidth && vy >= 0 && vy < viewportHeight) {
      enemyMap.set(`${vx},${vy}`, e);
    }
  });

  items?.forEach((i) => {
    const vx = i.x - player.x + playerViewX;
    const vy = i.y - player.y + playerViewY;
    if (vx >= 0 && vx < viewportWidth && vy >= 0 && vy < viewportHeight) {
      itemMap.set(`${vx},${vy}`, i);
    }
  });

  // Render header
  const spectatorBadge = isSpectator ? `${COLORS.brightMagenta}[SPECTATING]${COLORS.reset} ` : '';
  terminal.writeln(
    spectatorBadge +
    `${COLORS.brightYellow}Level ${dungeon.level}${COLORS.reset}` +
    `  ${COLORS.green}HP: ${player.health}/${player.max_health}${COLORS.reset}` +
    `  ${COLORS.cyan}ATK: ${player.attack}${COLORS.reset}` +
    `  ${COLORS.blue}DEF: ${player.defense}${COLORS.reset}` +
    `  ${COLORS.yellow}Kills: ${player.kills}${COLORS.reset}`
  );

  // XP bar (clamp values to prevent negative repeat)
  const xpPercent = player.xp_to_level > 0 ? Math.min(1, player.xp / player.xp_to_level) : 0;
  const xpBarWidth = 20;
  const xpFilled = Math.max(0, Math.min(xpBarWidth, Math.floor(xpPercent * xpBarWidth)));
  const xpBar = '█'.repeat(xpFilled) + '░'.repeat(xpBarWidth - xpFilled);
  terminal.writeln(
    `${COLORS.dim} Lv.${player.level} [${COLORS.magenta}${xpBar}${COLORS.dim}] ${player.xp}/${player.xp_to_level} XP${COLORS.reset}`
  );

  terminal.writeln('');

  // Get player facing direction for FOV cone
  const facing = player.facing || { dx: 0, dy: -1 }; // Default facing north

  // Render dungeon viewport
  for (let y = 0; y < viewportHeight; y++) {
    let line = ' ';
    for (let x = 0; x < viewportWidth; x++) {
      // Get tile first to check visibility
      const tile = dungeon.tiles[y]?.[x] || ' ';

      // Calculate relative position for FOV cone
      const relX = x - playerViewX;
      const relY = y - playerViewY;
      const inFovCone = isInFovCone(relX, relY, facing.dx, facing.dy, 6);

      // Only highlight FOV cone for tiles that are ACTUALLY VISIBLE
      // (not fog '~' or unexplored ' ') - this respects wall occlusion
      const isActuallyVisible = tile !== '~' && tile !== ' ';
      const fovBg = (inFovCone && isActuallyVisible) ? COLORS.bgBrightBlack : '';

      // Check for player - render directional arrow
      if (x === playerViewX && y === playerViewY) {
        // Player symbol shows facing direction
        let playerChar = '@';
        if (facing.dy < 0) playerChar = '▲'; // North
        else if (facing.dy > 0) playerChar = '▼'; // South
        else if (facing.dx < 0) playerChar = '◄'; // West
        else if (facing.dx > 0) playerChar = '►'; // East
        line += `${COLORS.brightWhite}${COLORS.bold}${playerChar}${COLORS.reset}`;
        continue;
      }

      // Check for enemy
      const enemy = enemyMap.get(`${x},${y}`);
      if (enemy) {
        const color = ENEMY_COLORS[enemy.symbol] || COLORS.red;
        line += `${fovBg}${color}${enemy.symbol}${COLORS.reset}`;
        continue;
      }

      // Check for item
      const item = itemMap.get(`${x},${y}`);
      if (item) {
        const color = ITEM_COLORS[item.symbol] || COLORS.white;
        line += `${fovBg}${color}${item.symbol}${COLORS.reset}`;
        continue;
      }

      // Render tile (already fetched above)
      const tileColor = TILE_COLORS[tile] || COLORS.white;
      line += `${fovBg}${tileColor}${tile}${COLORS.reset}`;
    }
    terminal.writeln(line);
  }

  terminal.writeln('');

  // Render messages
  const recentMessages = messages?.slice(-3) || [];
  recentMessages.forEach((msg) => {
    // Color code messages
    let color = COLORS.white;
    if (msg.includes('hit') || msg.includes('damage') || msg.includes('attack')) {
      color = COLORS.red;
    } else if (msg.includes('heal') || msg.includes('health')) {
      color = COLORS.green;
    } else if (msg.includes('level') || msg.includes('Level')) {
      color = COLORS.yellow;
    } else if (msg.includes('pick') || msg.includes('found')) {
      color = COLORS.cyan;
    }
    terminal.writeln(` ${color}${msg}${COLORS.reset}`);
  });

  // Controls hint
  terminal.writeln('');
  if (isSpectator) {
    terminal.writeln(`${COLORS.dim} Spectating - watch the player explore the dungeon${COLORS.reset}`);
  } else {
    terminal.writeln(`${COLORS.dim} [Q/E]Turn [I]nventory [C]haracter [M]essages [?]Help [X]Quit${COLORS.reset}`);
  }
}

function renderDeathScreen(terminal: Terminal, state: FullGameState, isSpectator = false) {
  const { player } = state;
  terminal.writeln('');
  terminal.writeln(`${COLORS.brightRed}  ╔══════════════════════════════════════╗${COLORS.reset}`);
  terminal.writeln(`${COLORS.brightRed}  ║${COLORS.reset}          ${COLORS.brightRed}${isSpectator ? 'PLAYER HAS DIED' : 'YOU HAVE DIED'}${COLORS.reset}           ${COLORS.brightRed}║${COLORS.reset}`);
  terminal.writeln(`${COLORS.brightRed}  ╚══════════════════════════════════════╝${COLORS.reset}`);
  terminal.writeln('');
  if (player) {
    terminal.writeln(`  ${COLORS.white}Level reached: ${COLORS.yellow}${player.level}${COLORS.reset}`);
    terminal.writeln(`  ${COLORS.white}Enemies slain: ${COLORS.red}${player.kills}${COLORS.reset}`);
  }
  terminal.writeln('');
  if (isSpectator) {
    terminal.writeln(`${COLORS.dim}  Game over - returning to spectate list...${COLORS.reset}`);
  } else {
    terminal.writeln(`${COLORS.cyan}  Press ${COLORS.brightWhite}ENTER${COLORS.cyan} to play again${COLORS.reset}`);
  }
}

function renderVictoryScreen(terminal: Terminal, state: FullGameState, isSpectator = false) {
  const { player } = state;
  terminal.writeln('');
  terminal.writeln(`${COLORS.brightYellow}  ╔══════════════════════════════════════╗${COLORS.reset}`);
  terminal.writeln(`${COLORS.brightYellow}  ║${COLORS.reset}          ${COLORS.brightGreen}VICTORY!${COLORS.reset}                   ${COLORS.brightYellow}║${COLORS.reset}`);
  terminal.writeln(`${COLORS.brightYellow}  ╚══════════════════════════════════════╝${COLORS.reset}`);
  terminal.writeln('');
  terminal.writeln(`  ${COLORS.brightWhite}${isSpectator ? 'Player has conquered the dungeon!' : 'You have conquered the dungeon!'}${COLORS.reset}`);
  terminal.writeln('');
  if (player) {
    terminal.writeln(`  ${COLORS.white}Final Level: ${COLORS.yellow}${player.level}${COLORS.reset}`);
    terminal.writeln(`  ${COLORS.white}Total Kills: ${COLORS.red}${player.kills}${COLORS.reset}`);
  }
  terminal.writeln('');
  if (isSpectator) {
    terminal.writeln(`${COLORS.dim}  Congratulations to the player!${COLORS.reset}`);
  } else {
    terminal.writeln(`${COLORS.cyan}  Press ${COLORS.brightWhite}ENTER${COLORS.cyan} to play again${COLORS.reset}`);
  }
}

/**
 * Check if a tile position is within the player's FOV cone.
 * The FOV cone is a ~90 degree arc in the facing direction.
 *
 * @param relX - X position relative to player (tile_x - player_x)
 * @param relY - Y position relative to player (tile_y - player_y)
 * @param facingDx - Player facing X direction
 * @param facingDy - Player facing Y direction
 * @param maxDistance - Maximum range of FOV cone (tiles)
 * @returns true if in FOV cone
 */
function isInFovCone(
  relX: number,
  relY: number,
  facingDx: number,
  facingDy: number,
  maxDistance: number = 6
): boolean {
  // Player's own position is always visible but not in "cone"
  if (relX === 0 && relY === 0) return false;

  // Calculate distance
  const distance = Math.sqrt(relX * relX + relY * relY);
  if (distance > maxDistance) return false;

  // Normalize the direction to tile
  const dirX = relX / distance;
  const dirY = relY / distance;

  // Dot product with facing direction
  // Facing is already a unit vector: (1,0), (-1,0), (0,1), or (0,-1)
  const dot = dirX * facingDx + dirY * facingDy;

  // cos(45°) ≈ 0.707 for a 90° cone (45° on each side)
  // Use a slightly wider threshold for better visibility
  const coneThreshold = 0.5; // ~120° cone (60° on each side)

  return dot >= coneThreshold;
}
