/**
 * Audio configuration for the music system.
 * Defines tracks, loop points, and game state mappings.
 *
 * Biome-based tracks for each dungeon level:
 *   Level 1: Stone Dungeon
 *   Level 2: Ice Cavern
 *   Level 3: Forest Depths
 *   Level 4: Volcanic Depths
 *   Level 5: Ancient Crypt
 *   Level 6: Sewer
 *   Level 7: Ancient Library
 *   Level 8: Crystal Cave
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

  // Level tracks - biome-based music for each dungeon level
  level1: {
    file: '/audio/music/level1_stone_dungeon_biome.mp3',
    volume: 1.0,
  },
  level2: {
    file: '/audio/music/level2_ice_cavern_biome.mp3',
    volume: 1.0,
  },
  level3: {
    file: '/audio/music/level3_forest_depths_biome.mp3',
    volume: 1.0,
  },
  level4: {
    file: '/audio/music/level4_volcanic_depths_biome.mp3',
    volume: 1.0,
  },
  level5: {
    file: '/audio/music/level5_ancient_crypt_biome.mp3',
    volume: 1.0,
  },
  level6: {
    file: '/audio/music/level6_sewer_biome.mp3',
    volume: 1.0,
  },
  level7: {
    file: '/audio/music/level7_ancient_library_biome.mp3',
    volume: 1.0,
  },
  level8: {
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

// Biome descriptions for reference
export const BIOME_NAMES: Record<number, string> = {
  1: 'Stone Dungeon',
  2: 'Ice Cavern',
  3: 'Forest Depths',
  4: 'Volcanic Depths',
  5: 'Ancient Crypt',
  6: 'Sewer',
  7: 'Ancient Library',
  8: 'Crystal Cave',
};

// Maps game states/pages to track IDs
// Each dungeon level gets its own biome track
export const GAME_STATE_MUSIC: Record<string, string> = {
  // Menu states
  'menu': 'menu',
  'home': 'menu',
  'character-creation': 'character_creation',
  'intro': 'intro',

  // Game end states
  'victory': 'victory',
  'death': 'death',

  // Dungeon levels - each level has its own biome track
  'dungeon-1': 'level1',   // Stone Dungeon
  'dungeon-2': 'level2',   // Ice Cavern
  'dungeon-3': 'level3',   // Forest Depths
  'dungeon-4': 'level4',   // Volcanic Depths
  'dungeon-5': 'level5',   // Ancient Crypt
  'dungeon-6': 'level6',   // Sewer
  'dungeon-7': 'level7',   // Ancient Library
  'dungeon-8': 'level8',   // Crystal Cave

  // Deeper levels cycle back through biomes
  'dungeon-9': 'level1',
  'dungeon-10': 'level2',
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
