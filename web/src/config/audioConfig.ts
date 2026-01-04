/**
 * Audio configuration for the music system.
 * Defines tracks, loop points, and game state mappings.
 *
 * File naming convention:
 *   - menu.mp3, menu_alt.mp3      - Main menu / character creation
 *   - level1.mp3, level1_alt.mp3  - Dungeon level 1
 *   - level2.mp3, level2_alt.mp3  - Dungeon level 2
 *   - etc...
 *
 * Future: Biome-based tracks (caves.mp3, crypt.mp3, forest.mp3, etc.)
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
    alt: 'menu_alt'
  },
  menu_alt: {
    file: '/audio/music/menu_alt.mp3',
    volume: 1.0
  },
  character_creation: {
    file: '/audio/music/character_creation.mp3',
    volume: 1.0
  },

  // Level tracks - one per dungeon level
  level1: {
    file: '/audio/music/level1.mp3',
    volume: 1.0,
    alt: 'level1_alt'
  },
  level1_alt: {
    file: '/audio/music/level1_alt.mp3',
    volume: 1.0
  },
  level2: {
    file: '/audio/music/level2.mp3',
    volume: 1.0,
    alt: 'level2_alt'
  },
  level2_alt: {
    file: '/audio/music/level2_alt.mp3',
    volume: 1.0
  },
  level3: {
    file: '/audio/music/level3.mp3',
    volume: 1.0,
    alt: 'level3_alt'
  },
  level3_alt: {
    file: '/audio/music/level3_alt.mp3',
    volume: 1.0
  },
  level4: {
    file: '/audio/music/level4.mp3',
    volume: 1.0,
    alt: 'level4_alt'
  },
  level4_alt: {
    file: '/audio/music/level4_alt.mp3',
    volume: 1.0
  },
  level5: {
    file: '/audio/music/level5.mp3',
    volume: 1.0,
    alt: 'level5_alt'
  },
  level5_alt: {
    file: '/audio/music/level5_alt.mp3',
    volume: 1.0
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

  // Future: Biome tracks (when biome system is added)
  // biome_caves: { file: '/audio/music/biome_caves.mp3' },
  // biome_crypt: { file: '/audio/music/biome_crypt.mp3' },
  // biome_forest: { file: '/audio/music/biome_forest.mp3' },
};

// Maps game states/pages to track IDs
// Each dungeon level gets its own track
export const GAME_STATE_MUSIC: Record<string, string> = {
  // Menu states
  'menu': 'menu',
  'home': 'menu',
  'character-creation': 'character_creation',

  // Dungeon levels - each level has its own track
  'dungeon-1': 'level1',
  'dungeon-2': 'level2',
  'dungeon-3': 'level3',
  'dungeon-4': 'level4',
  'dungeon-5': 'level5',

  // Can extend for more levels
  'dungeon-6': 'level5',  // Fallback to level5 for deeper levels
  'dungeon-7': 'level5',
  'dungeon-8': 'level5',
  'dungeon-9': 'level5',
  'dungeon-10': 'level5',
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
