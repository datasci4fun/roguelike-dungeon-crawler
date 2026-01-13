/**
 * GameTerminal screen renderers - UI overlay screens
 */
import { Terminal } from '@xterm/xterm';
import type { FullGameState } from '../../hooks/useGameSocket';
import { COLORS } from './constants';

export function renderInventory(terminal: Terminal, state: FullGameState) {
  const { inventory } = state;
  if (!inventory) return;

  terminal.writeln('');
  terminal.writeln(`${COLORS.brightCyan}  ╔══════════════════════════════════════╗${COLORS.reset}`);
  terminal.writeln(`${COLORS.brightCyan}  ║${COLORS.reset}            ${COLORS.brightWhite}INVENTORY${COLORS.reset}                ${COLORS.brightCyan}║${COLORS.reset}`);
  terminal.writeln(`${COLORS.brightCyan}  ╚══════════════════════════════════════╝${COLORS.reset}`);
  terminal.writeln('');

  if (inventory.items.length === 0) {
    terminal.writeln(`  ${COLORS.dim}(empty)${COLORS.reset}`);
  } else {
    inventory.items.forEach((item, index) => {
      const selected = index === inventory.selected_index;
      const prefix = selected ? `${COLORS.brightWhite}> ` : '  ';
      const rarityColor = getRarityColor(item.rarity);
      terminal.writeln(
        `${prefix}${rarityColor}${item.name}${COLORS.reset}` +
        `${COLORS.dim} (${item.type})${COLORS.reset}`
      );
    });
  }

  terminal.writeln('');
  terminal.writeln(`${COLORS.dim}  [E]quip/Use  [D]rop  [R]ead  [I/ESC]Close${COLORS.reset}`);
}

export function renderDialog(terminal: Terminal, state: FullGameState) {
  const { dialog } = state;
  if (!dialog) return;

  terminal.writeln('');
  terminal.writeln(`${COLORS.brightYellow}  ╔══════════════════════════════════════╗${COLORS.reset}`);
  terminal.writeln(`${COLORS.brightYellow}  ║${COLORS.reset} ${COLORS.brightWhite}${dialog.title.padEnd(37)}${COLORS.reset}${COLORS.brightYellow}║${COLORS.reset}`);
  terminal.writeln(`${COLORS.brightYellow}  ╚══════════════════════════════════════╝${COLORS.reset}`);
  terminal.writeln('');
  terminal.writeln(`  ${dialog.message}`);
  terminal.writeln('');
  terminal.writeln(`${COLORS.dim}  [Y]es  [N]o${COLORS.reset}`);
}

export function renderCharacterScreen(terminal: Terminal, state: FullGameState) {
  const { player } = state;
  if (!player) return;

  terminal.writeln('');
  terminal.writeln(`${COLORS.brightCyan}  ╔══════════════════════════════════════╗${COLORS.reset}`);
  terminal.writeln(`${COLORS.brightCyan}  ║${COLORS.reset}           ${COLORS.brightWhite}CHARACTER INFO${COLORS.reset}             ${COLORS.brightCyan}║${COLORS.reset}`);
  terminal.writeln(`${COLORS.brightCyan}  ╚══════════════════════════════════════╝${COLORS.reset}`);
  terminal.writeln('');

  // Race and Class
  if (player.race) {
    terminal.writeln(`  ${COLORS.yellow}Race:${COLORS.reset} ${player.race.name}`);
    terminal.writeln(`    ${COLORS.dim}${player.race.trait_name}: ${player.race.trait_description}${COLORS.reset}`);
  }
  if (player.class) {
    terminal.writeln(`  ${COLORS.yellow}Class:${COLORS.reset} ${player.class.name}`);
    terminal.writeln(`    ${COLORS.dim}${player.class.description}${COLORS.reset}`);
  }
  terminal.writeln('');

  // Stats
  terminal.writeln(`  ${COLORS.brightWhite}── Stats ──${COLORS.reset}`);
  terminal.writeln(`  ${COLORS.green}HP:${COLORS.reset} ${player.health}/${player.max_health}`);
  terminal.writeln(`  ${COLORS.cyan}ATK:${COLORS.reset} ${player.attack}  ${COLORS.blue}DEF:${COLORS.reset} ${player.defense}`);
  terminal.writeln(`  ${COLORS.magenta}Level:${COLORS.reset} ${player.level}  ${COLORS.yellow}XP:${COLORS.reset} ${player.xp}/${player.xp_to_level}`);
  terminal.writeln(`  ${COLORS.red}Kills:${COLORS.reset} ${player.kills}`);
  terminal.writeln('');

  // Abilities
  if (player.abilities && player.abilities.length > 0) {
    terminal.writeln(`  ${COLORS.brightWhite}── Abilities ──${COLORS.reset}`);
    player.abilities.forEach((ability) => {
      const ready = ability.is_ready ? COLORS.green : COLORS.red;
      const cooldown = ability.cooldown_remaining > 0 ? ` (${ability.cooldown_remaining} turns)` : '';
      terminal.writeln(`  ${ready}●${COLORS.reset} ${ability.name}${COLORS.dim}${cooldown}${COLORS.reset}`);
      terminal.writeln(`    ${COLORS.dim}${ability.description}${COLORS.reset}`);
    });
    terminal.writeln('');
  }

  // Passives
  if (player.passives && player.passives.length > 0) {
    terminal.writeln(`  ${COLORS.brightWhite}── Passives ──${COLORS.reset}`);
    player.passives.forEach((passive) => {
      terminal.writeln(`  ${COLORS.cyan}◆${COLORS.reset} ${passive.name}`);
      terminal.writeln(`    ${COLORS.dim}${passive.description}${COLORS.reset}`);
    });
    terminal.writeln('');
  }

  // Feats
  if (player.feats && player.feats.length > 0) {
    terminal.writeln(`  ${COLORS.brightWhite}── Feats ──${COLORS.reset}`);
    player.feats.forEach((feat) => {
      terminal.writeln(`  ${COLORS.yellow}★${COLORS.reset} ${feat.name}`);
      terminal.writeln(`    ${COLORS.dim}${feat.description}${COLORS.reset}`);
    });
    terminal.writeln('');
  }

  terminal.writeln(`${COLORS.dim}  Press any key to close${COLORS.reset}`);
}

export function renderHelpScreen(terminal: Terminal) {
  terminal.writeln('');
  terminal.writeln(`${COLORS.brightYellow}  ╔══════════════════════════════════════╗${COLORS.reset}`);
  terminal.writeln(`${COLORS.brightYellow}  ║${COLORS.reset}              ${COLORS.brightWhite}CONTROLS${COLORS.reset}               ${COLORS.brightYellow}║${COLORS.reset}`);
  terminal.writeln(`${COLORS.brightYellow}  ╚══════════════════════════════════════╝${COLORS.reset}`);
  terminal.writeln('');
  terminal.writeln(`  ${COLORS.brightWhite}── Movement ──${COLORS.reset}`);
  terminal.writeln(`  ${COLORS.cyan}W/↑${COLORS.reset}  Move forward`);
  terminal.writeln(`  ${COLORS.cyan}S/↓${COLORS.reset}  Move backward`);
  terminal.writeln(`  ${COLORS.cyan}A/←${COLORS.reset}  Strafe left`);
  terminal.writeln(`  ${COLORS.cyan}D/→${COLORS.reset}  Strafe right`);
  terminal.writeln(`  ${COLORS.cyan}Q${COLORS.reset}    Turn left`);
  terminal.writeln(`  ${COLORS.cyan}E${COLORS.reset}    Turn right`);
  terminal.writeln('');
  terminal.writeln(`  ${COLORS.brightWhite}── Actions ──${COLORS.reset}`);
  terminal.writeln(`  ${COLORS.cyan}>${COLORS.reset}    Descend stairs`);
  terminal.writeln(`  ${COLORS.cyan}F${COLORS.reset}    Search for secrets`);
  terminal.writeln(`  ${COLORS.cyan}1-3${COLORS.reset}  Use quick slot item`);
  terminal.writeln('');
  terminal.writeln(`  ${COLORS.brightWhite}── Screens ──${COLORS.reset}`);
  terminal.writeln(`  ${COLORS.cyan}I${COLORS.reset}    Inventory`);
  terminal.writeln(`  ${COLORS.cyan}C${COLORS.reset}    Character info`);
  terminal.writeln(`  ${COLORS.cyan}M${COLORS.reset}    Message log`);
  terminal.writeln(`  ${COLORS.cyan}?${COLORS.reset}    This help screen`);
  terminal.writeln(`  ${COLORS.cyan}X${COLORS.reset}    Quit game`);
  terminal.writeln('');
  terminal.writeln(`${COLORS.dim}  Press any key to close${COLORS.reset}`);
}

export function renderMessageLog(terminal: Terminal, state: FullGameState) {
  const { messages } = state;

  terminal.writeln('');
  terminal.writeln(`${COLORS.brightMagenta}  ╔══════════════════════════════════════╗${COLORS.reset}`);
  terminal.writeln(`${COLORS.brightMagenta}  ║${COLORS.reset}            ${COLORS.brightWhite}MESSAGE LOG${COLORS.reset}              ${COLORS.brightMagenta}║${COLORS.reset}`);
  terminal.writeln(`${COLORS.brightMagenta}  ╚══════════════════════════════════════╝${COLORS.reset}`);
  terminal.writeln('');

  if (!messages || messages.length === 0) {
    terminal.writeln(`  ${COLORS.dim}(no messages)${COLORS.reset}`);
  } else {
    // Show last 15 messages (most recent at bottom)
    const displayMessages = messages.slice(-15);
    displayMessages.forEach((msg) => {
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
      } else if (msg.includes('turn to face')) {
        color = COLORS.blue;
      }
      terminal.writeln(`  ${color}${msg}${COLORS.reset}`);
    });
  }

  terminal.writeln('');
  terminal.writeln(`${COLORS.dim}  [W/↑] Scroll up  [S/↓] Scroll down  [ESC] Close${COLORS.reset}`);
}

export function renderReadingScreen(terminal: Terminal, state: FullGameState) {
  const { reading } = state;
  if (!reading) return;

  terminal.writeln('');
  terminal.writeln(`${COLORS.brightYellow}  ╔══════════════════════════════════════════════════╗${COLORS.reset}`);
  terminal.writeln(`${COLORS.brightYellow}  ║${COLORS.reset} ${COLORS.brightWhite}${reading.title.padEnd(49)}${COLORS.reset}${COLORS.brightYellow}║${COLORS.reset}`);
  terminal.writeln(`${COLORS.brightYellow}  ╚══════════════════════════════════════════════════╝${COLORS.reset}`);
  terminal.writeln('');

  // Word-wrap and display content paragraphs
  const maxWidth = 50;
  reading.content.forEach((paragraph) => {
    // Word wrap the paragraph
    const words = paragraph.split(' ');
    let currentLine = '  ';
    words.forEach((word) => {
      if (currentLine.length + word.length + 1 > maxWidth + 2) {
        terminal.writeln(`${COLORS.white}${currentLine}${COLORS.reset}`);
        currentLine = '  ' + word;
      } else {
        currentLine += (currentLine.length > 2 ? ' ' : '') + word;
      }
    });
    if (currentLine.length > 2) {
      terminal.writeln(`${COLORS.white}${currentLine}${COLORS.reset}`);
    }
    terminal.writeln(''); // Blank line between paragraphs
  });

  terminal.writeln(`${COLORS.dim}  Press any key to close${COLORS.reset}`);
}

export function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'COMMON':
      return COLORS.white;
    case 'UNCOMMON':
      return COLORS.cyan;
    case 'RARE':
      return COLORS.blue;
    case 'EPIC':
      return COLORS.magenta;
    case 'LEGENDARY':
      return COLORS.brightYellow;
    default:
      return COLORS.white;
  }
}
