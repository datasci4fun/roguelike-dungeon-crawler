/**
 * Cinematic SFX Configuration
 * Maps semantic SFX IDs to audio files for cutscene effects.
 *
 * Place audio files in: public/audio/sfx/cinematic/
 */

export type CinematicSfxId =
  // Lightning/electrical
  | 'sfx_lightning_soft'
  | 'sfx_lightning'
  | 'sfx_thunder_clap'
  // Rumble/ominous
  | 'sfx_rumble_soft'
  | 'sfx_rumble'
  | 'sfx_rumble_heavy'
  // Impact/physical
  | 'sfx_stone_shift'
  | 'sfx_impact'
  | 'sfx_impact_heavy'
  // Power/electrical
  | 'sfx_power_tick'
  | 'sfx_power_buzz'
  | 'sfx_power_surge';

export interface CinematicSfxConfig {
  file: string;
  volume?: number;  // 0-1, default 1.0
}

export const CINEMATIC_SFX: Record<CinematicSfxId, CinematicSfxConfig> = {
  // Lightning/electrical
  sfx_lightning_soft: {
    file: '/audio/sfx/cinematic/lightning_soft.mp3',
    volume: 0.6,
  },
  sfx_lightning: {
    file: '/audio/sfx/cinematic/lightning.mp3',
    volume: 0.7,
  },
  sfx_thunder_clap: {
    file: '/audio/sfx/cinematic/thunder_clap.mp3',
    volume: 0.8,
  },

  // Rumble/ominous
  sfx_rumble_soft: {
    file: '/audio/sfx/cinematic/rumble_soft.mp3',
    volume: 0.5,
  },
  sfx_rumble: {
    file: '/audio/sfx/cinematic/rumble.mp3',
    volume: 0.65,
  },
  sfx_rumble_heavy: {
    file: '/audio/sfx/cinematic/rumble_heavy.mp3',
    volume: 0.8,
  },

  // Impact/physical
  sfx_stone_shift: {
    file: '/audio/sfx/cinematic/stone_shift.mp3',
    volume: 0.55,
  },
  sfx_impact: {
    file: '/audio/sfx/cinematic/impact.mp3',
    volume: 0.65,
  },
  sfx_impact_heavy: {
    file: '/audio/sfx/cinematic/impact_heavy.mp3',
    volume: 0.8,
  },

  // Power/electrical
  sfx_power_tick: {
    file: '/audio/sfx/cinematic/power_tick.mp3',
    volume: 0.4,
  },
  sfx_power_buzz: {
    file: '/audio/sfx/cinematic/power_buzz.mp3',
    volume: 0.5,
  },
  sfx_power_surge: {
    file: '/audio/sfx/cinematic/power_surge.mp3',
    volume: 0.6,
  },
};

// Check if an ID is a valid cinematic SFX
export function isCinematicSfx(id: string): id is CinematicSfxId {
  return id in CINEMATIC_SFX;
}
