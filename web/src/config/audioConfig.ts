/**
 * Audio configuration for the music system.
 * Defines tracks, loop points, and game state mappings.
 *
 * Canonical floor order (matches STATE.md and LEVEL_BOSS_MAP):
 *   Level 1: Stone Dungeon (Goblin King)
 *   Level 2: Sewers of Valdris (Rat King)
 *   Level 3: Forest Depths (Spider Queen)
 *   Level 4: Mirror Valdris - crypt palette (Regent)
 *   Level 5: Ice Cavern (Frost Giant)
 *   Level 6: Ancient Library (Arcane Keeper)
 *   Level 7: Volcanic Depths (Flame Lord)
 *   Level 8: Crystal Cave (Dragon Emperor)
 */

export interface TrackConfig {
  file: string;
  loopStart?: number;  // Start of loop section (seconds)
  loopEnd?: number;    // End of loop section (seconds), null = end of file
  volume?: number;     // Track-specific volume multiplier (0-1)
  alt?: string;        // Alternative track ID for variety
}

export const MUSIC_TRACKS: Record<string, TrackConfig> = {
  // Menu / UI tracks
  menu: {
    file: '/audio/music/menu.mp3',
    volume: 1.0,
  },
  character_creation: {
    file: '/audio/music/character_creation.mp3',
    volume: 1.0
  },

  // Intro / Prologue
  intro: {
    file: '/audio/music/intro.mp3',
    volume: 1.0
  },

  // Biome tracks - named by biome, mapped to floors below
  // Note: file names use old level numbers, but track IDs are biome-based
  biome_stone: {
    file: '/audio/music/level1_stone_dungeon_biome.mp3',
    volume: 1.0,
  },
  biome_sewer: {
    file: '/audio/music/level6_sewer_biome.mp3',
    volume: 1.0,
  },
  biome_forest: {
    file: '/audio/music/level3_forest_depths_biome.mp3',
    volume: 1.0,
  },
  biome_crypt: {
    file: '/audio/music/level5_ancient_crypt_biome.mp3',
    volume: 1.0,
  },
  biome_ice: {
    file: '/audio/music/level2_ice_cavern_biome.mp3',
    volume: 1.0,
  },
  biome_library: {
    file: '/audio/music/level7_ancient_library_biome.mp3',
    volume: 1.0,
  },
  biome_volcanic: {
    file: '/audio/music/level4_volcanic_depths_biome.mp3',
    volume: 1.0,
  },
  biome_crystal: {
    file: '/audio/music/level8_crystal_cave_biome.mp3',
    volume: 1.0,
  },

  // Special tracks
  combat: {
    file: '/audio/music/combat.mp3',
    volume: 1.0
  },
  boss: {
    file: '/audio/music/boss.mp3',
    volume: 1.0
  },
  victory: {
    file: '/audio/music/victory.mp3',
    volume: 1.0
  },
  death: {
    file: '/audio/music/death.mp3',
    volume: 1.0
  },
};

// Biome descriptions for reference (canonical floor order)
export const BIOME_NAMES: Record<number, string> = {
  1: 'Stone Dungeon',
  2: 'Sewers of Valdris',
  3: 'Forest Depths',
  4: 'Mirror Valdris',
  5: 'Ice Cavern',
  6: 'Ancient Library',
  7: 'Volcanic Depths',
  8: 'Crystal Cave',
};

// Maps game states/pages to track IDs
// Each dungeon level gets its own biome track (canonical floor order)
export const GAME_STATE_MUSIC: Record<string, string> = {
  // Menu states
  'menu': 'menu',
  'home': 'menu',
  'character-creation': 'character_creation',
  'intro': 'intro',

  // Game end states
  'victory': 'victory',
  'death': 'death',

  // Dungeon levels - mapped to biome tracks (canonical order)
  'dungeon-1': 'biome_stone',     // Stone Dungeon (Goblin King)
  'dungeon-2': 'biome_sewer',     // Sewers of Valdris (Rat King)
  'dungeon-3': 'biome_forest',    // Forest Depths (Spider Queen)
  'dungeon-4': 'biome_crypt',     // Mirror Valdris (Regent)
  'dungeon-5': 'biome_ice',       // Ice Cavern (Frost Giant)
  'dungeon-6': 'biome_library',   // Ancient Library (Arcane Keeper)
  'dungeon-7': 'biome_volcanic',  // Volcanic Depths (Flame Lord)
  'dungeon-8': 'biome_crystal',   // Crystal Cave (Dragon Emperor)

  // Deeper levels cycle back through biomes
  'dungeon-9': 'biome_stone',
  'dungeon-10': 'biome_sewer',
};

// Default volume settings
export const DEFAULT_AUDIO_SETTINGS = {
  masterVolume: 0.8,
  musicVolume: 0.7,
  sfxVolume: 0.8,
  isMuted: false,
};

// Crossfade duration in milliseconds
export const CROSSFADE_DURATION = 2000;

// localStorage key for persisting settings
export const AUDIO_STORAGE_KEY = 'roguelike_audio_settings';
