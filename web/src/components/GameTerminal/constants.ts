/**
 * GameTerminal constants - ANSI colors and symbol mappings
 */

// ANSI color codes for terminal rendering
export const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  // Foreground
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  // Bright foreground
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
  // Background
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  // Bright backgrounds for FOV
  bgBrightBlack: '\x1b[100m',
};

// Map enemy symbols to colors
export const ENEMY_COLORS: Record<string, string> = {
  'g': COLORS.green,
  'G': COLORS.brightGreen,
  's': COLORS.white,
  'S': COLORS.brightWhite,
  'o': COLORS.yellow,
  'O': COLORS.brightYellow,
  'W': COLORS.cyan,
  'T': COLORS.red,
  'D': COLORS.brightRed,
};

// Map item symbols to colors
export const ITEM_COLORS: Record<string, string> = {
  '!': COLORS.magenta,
  '?': COLORS.cyan,
  ')': COLORS.white,
  '[': COLORS.blue,
  '*': COLORS.yellow,
};

// Tile characters and colors
export const TILE_COLORS: Record<string, string> = {
  '#': COLORS.white,
  '.': COLORS.dim + COLORS.white,
  '>': COLORS.brightYellow,
  '<': COLORS.brightYellow,
  '~': COLORS.dim + COLORS.blue,
  '+': COLORS.yellow,
  '=': COLORS.blue,
};
