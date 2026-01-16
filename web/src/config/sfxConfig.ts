/**
 * Sound Effects Configuration
 * Defines synthetic sounds generated via Web Audio API.
 * No audio files needed - all sounds are procedurally generated.
 */

export type SfxId =
  // Movement
  | 'footstep'
  | 'bump_wall'
  // Combat
  | 'attack_hit'
  | 'attack_miss'
  | 'player_hurt'
  | 'enemy_death'
  | 'critical_hit'
  // Items
  | 'item_pickup'
  | 'gold_pickup'
  | 'potion_drink'
  | 'scroll_use'
  | 'equip_weapon'
  | 'equip_armor'
  // UI
  | 'menu_select'
  | 'menu_confirm'
  | 'menu_back'
  | 'level_up'
  | 'feat_unlock'
  // Environment
  | 'door_open'
  | 'stairs_descend'
  | 'trap_trigger'
  // Interactions (v7.0)
  | 'switch_flip'
  | 'lever_pull'
  | 'mural_examine'
  | 'inscription_read'
  | 'puzzle_solve'
  | 'pressure_plate'
  | 'hidden_door_reveal'
  // Abilities
  | 'ability_ready'
  | 'ability_use'
  | 'ability_fail'
  // Cinematics
  | 'sfx_lightning_soft'
  | 'sfx_lightning'
  | 'sfx_thunder_clap'
  | 'sfx_rumble_soft'
  | 'sfx_rumble'
  | 'sfx_rumble_heavy'
  | 'sfx_stone_shift'
  | 'sfx_impact'
  | 'sfx_impact_heavy'
  | 'sfx_power_tick'
  | 'sfx_power_buzz'
  | 'sfx_power_surge';

export type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface SfxEnvelope {
  attack: number;   // Time to reach peak (seconds)
  decay: number;    // Time to reach sustain level (seconds)
  sustain: number;  // Sustain level (0-1)
  release: number;  // Time to fade out (seconds)
}

export interface SfxNote {
  frequency: number;        // Hz
  type: OscillatorType;
  duration: number;         // Total duration in seconds
  envelope?: Partial<SfxEnvelope>;
  delay?: number;           // Delay before note starts (seconds)
  pitchBend?: number;       // Frequency change over duration (Hz)
  volume?: number;          // Note-specific volume (0-1)
}

export interface SfxDefinition {
  notes: SfxNote[];
  volume?: number;          // Overall volume multiplier (0-1)
}

// Default envelope for quick sounds
const QUICK_ENV: SfxEnvelope = { attack: 0.01, decay: 0.05, sustain: 0.3, release: 0.1 };
const PUNCH_ENV: SfxEnvelope = { attack: 0.005, decay: 0.1, sustain: 0.2, release: 0.15 };
const SOFT_ENV: SfxEnvelope = { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.2 };
const RUMBLE_ENV: SfxEnvelope = { attack: 0.02, decay: 0.2, sustain: 0.7, release: 0.35 };
const BUZZ_ENV: SfxEnvelope = { attack: 0.01, decay: 0.08, sustain: 0.25, release: 0.12 };

export const SFX_DEFINITIONS: Record<SfxId, SfxDefinition> = {
  // Movement
  footstep: {
    notes: [
      { frequency: 100, type: 'sine', duration: 0.08, envelope: QUICK_ENV, volume: 0.3 },
    ],
    volume: 0.4,
  },
  bump_wall: {
    notes: [
      { frequency: 80, type: 'square', duration: 0.1, envelope: PUNCH_ENV, volume: 0.5 },
    ],
    volume: 0.5,
  },

  // Combat
  attack_hit: {
    notes: [
      { frequency: 200, type: 'sawtooth', duration: 0.1, envelope: PUNCH_ENV, pitchBend: -100 },
      { frequency: 100, type: 'square', duration: 0.08, delay: 0.05, envelope: QUICK_ENV },
    ],
    volume: 0.6,
  },
  attack_miss: {
    notes: [
      { frequency: 400, type: 'sine', duration: 0.15, envelope: SOFT_ENV, pitchBend: -200, volume: 0.4 },
    ],
    volume: 0.4,
  },
  player_hurt: {
    notes: [
      { frequency: 150, type: 'sawtooth', duration: 0.2, envelope: PUNCH_ENV, pitchBend: -50 },
      { frequency: 100, type: 'square', duration: 0.15, delay: 0.1, envelope: QUICK_ENV },
    ],
    volume: 0.7,
  },
  enemy_death: {
    notes: [
      { frequency: 300, type: 'sawtooth', duration: 0.1, envelope: PUNCH_ENV, pitchBend: -200 },
      { frequency: 150, type: 'square', duration: 0.15, delay: 0.08, envelope: QUICK_ENV, pitchBend: -100 },
      { frequency: 80, type: 'sine', duration: 0.2, delay: 0.15, envelope: SOFT_ENV },
    ],
    volume: 0.6,
  },
  critical_hit: {
    notes: [
      { frequency: 400, type: 'sawtooth', duration: 0.08, envelope: PUNCH_ENV },
      { frequency: 300, type: 'square', duration: 0.1, delay: 0.05, envelope: PUNCH_ENV, pitchBend: -150 },
      { frequency: 600, type: 'sine', duration: 0.15, delay: 0.1, envelope: SOFT_ENV },
    ],
    volume: 0.7,
  },

  // Items
  item_pickup: {
    notes: [
      { frequency: 440, type: 'sine', duration: 0.1, envelope: QUICK_ENV },
      { frequency: 550, type: 'sine', duration: 0.1, delay: 0.08, envelope: QUICK_ENV },
    ],
    volume: 0.5,
  },
  gold_pickup: {
    notes: [
      { frequency: 800, type: 'sine', duration: 0.08, envelope: QUICK_ENV },
      { frequency: 1000, type: 'sine', duration: 0.08, delay: 0.06, envelope: QUICK_ENV },
      { frequency: 1200, type: 'sine', duration: 0.1, delay: 0.12, envelope: SOFT_ENV },
    ],
    volume: 0.4,
  },
  potion_drink: {
    notes: [
      { frequency: 200, type: 'sine', duration: 0.15, envelope: SOFT_ENV, pitchBend: 100 },
      { frequency: 350, type: 'sine', duration: 0.2, delay: 0.1, envelope: SOFT_ENV },
    ],
    volume: 0.5,
  },
  scroll_use: {
    notes: [
      { frequency: 600, type: 'sine', duration: 0.2, envelope: SOFT_ENV, pitchBend: 200 },
      { frequency: 800, type: 'triangle', duration: 0.15, delay: 0.15, envelope: QUICK_ENV },
    ],
    volume: 0.5,
  },
  equip_weapon: {
    notes: [
      { frequency: 150, type: 'sawtooth', duration: 0.1, envelope: PUNCH_ENV },
      { frequency: 300, type: 'square', duration: 0.08, delay: 0.08, envelope: QUICK_ENV },
    ],
    volume: 0.5,
  },
  equip_armor: {
    notes: [
      { frequency: 100, type: 'square', duration: 0.12, envelope: PUNCH_ENV },
      { frequency: 120, type: 'sawtooth', duration: 0.1, delay: 0.1, envelope: QUICK_ENV },
    ],
    volume: 0.5,
  },

  // UI
  menu_select: {
    notes: [
      { frequency: 440, type: 'sine', duration: 0.05, envelope: QUICK_ENV },
    ],
    volume: 0.3,
  },
  menu_confirm: {
    notes: [
      { frequency: 440, type: 'sine', duration: 0.08, envelope: QUICK_ENV },
      { frequency: 660, type: 'sine', duration: 0.1, delay: 0.06, envelope: QUICK_ENV },
    ],
    volume: 0.4,
  },
  menu_back: {
    notes: [
      { frequency: 330, type: 'sine', duration: 0.08, envelope: QUICK_ENV },
      { frequency: 220, type: 'sine', duration: 0.1, delay: 0.06, envelope: QUICK_ENV },
    ],
    volume: 0.3,
  },
  level_up: {
    notes: [
      { frequency: 440, type: 'sine', duration: 0.15, envelope: SOFT_ENV },
      { frequency: 550, type: 'sine', duration: 0.15, delay: 0.1, envelope: SOFT_ENV },
      { frequency: 660, type: 'sine', duration: 0.15, delay: 0.2, envelope: SOFT_ENV },
      { frequency: 880, type: 'sine', duration: 0.3, delay: 0.3, envelope: SOFT_ENV },
    ],
    volume: 0.6,
  },
  feat_unlock: {
    notes: [
      { frequency: 523, type: 'sine', duration: 0.12, envelope: SOFT_ENV },  // C5
      { frequency: 659, type: 'sine', duration: 0.12, delay: 0.1, envelope: SOFT_ENV },  // E5
      { frequency: 784, type: 'sine', duration: 0.2, delay: 0.2, envelope: SOFT_ENV },   // G5
    ],
    volume: 0.6,
  },

  // Environment
  door_open: {
    notes: [
      { frequency: 120, type: 'square', duration: 0.2, envelope: SOFT_ENV, pitchBend: -30 },
      { frequency: 80, type: 'sawtooth', duration: 0.15, delay: 0.15, envelope: QUICK_ENV },
    ],
    volume: 0.5,
  },
  stairs_descend: {
    notes: [
      { frequency: 300, type: 'sine', duration: 0.15, envelope: SOFT_ENV, pitchBend: -150 },
      { frequency: 200, type: 'sine', duration: 0.15, delay: 0.12, envelope: SOFT_ENV, pitchBend: -100 },
      { frequency: 120, type: 'sine', duration: 0.2, delay: 0.24, envelope: SOFT_ENV },
    ],
    volume: 0.5,
  },
  trap_trigger: {
    notes: [
      { frequency: 200, type: 'sawtooth', duration: 0.1, envelope: PUNCH_ENV },
      { frequency: 150, type: 'square', duration: 0.15, delay: 0.08, envelope: PUNCH_ENV, pitchBend: -50 },
    ],
    volume: 0.7,
  },

  // Interactions (v7.0)
  switch_flip: {
    notes: [
      { frequency: 180, type: 'square', duration: 0.08, envelope: PUNCH_ENV },
      { frequency: 320, type: 'sine', duration: 0.1, delay: 0.06, envelope: QUICK_ENV },
    ],
    volume: 0.5,
  },
  lever_pull: {
    notes: [
      { frequency: 100, type: 'square', duration: 0.15, envelope: PUNCH_ENV, pitchBend: -40 },
      { frequency: 200, type: 'sine', duration: 0.1, delay: 0.1, envelope: QUICK_ENV },
    ],
    volume: 0.5,
  },
  mural_examine: {
    notes: [
      { frequency: 400, type: 'sine', duration: 0.2, envelope: SOFT_ENV, pitchBend: 50 },
      { frequency: 500, type: 'triangle', duration: 0.25, delay: 0.15, envelope: SOFT_ENV },
    ],
    volume: 0.4,
  },
  inscription_read: {
    notes: [
      { frequency: 350, type: 'sine', duration: 0.15, envelope: SOFT_ENV },
      { frequency: 450, type: 'triangle', duration: 0.2, delay: 0.1, envelope: SOFT_ENV, pitchBend: 30 },
    ],
    volume: 0.35,
  },
  puzzle_solve: {
    notes: [
      { frequency: 440, type: 'sine', duration: 0.12, envelope: SOFT_ENV },
      { frequency: 554, type: 'sine', duration: 0.12, delay: 0.1, envelope: SOFT_ENV },  // C#
      { frequency: 659, type: 'sine', duration: 0.12, delay: 0.2, envelope: SOFT_ENV },  // E
      { frequency: 880, type: 'sine', duration: 0.25, delay: 0.3, envelope: SOFT_ENV },  // A (major chord resolution)
    ],
    volume: 0.6,
  },
  pressure_plate: {
    notes: [
      { frequency: 150, type: 'sine', duration: 0.1, envelope: QUICK_ENV },
      { frequency: 120, type: 'square', duration: 0.15, delay: 0.05, envelope: SOFT_ENV, pitchBend: -30 },
    ],
    volume: 0.4,
  },
  hidden_door_reveal: {
    notes: [
      { frequency: 80, type: 'square', duration: 0.3, envelope: SOFT_ENV, pitchBend: -20 },
      { frequency: 150, type: 'sawtooth', duration: 0.2, delay: 0.2, envelope: PUNCH_ENV },
      { frequency: 300, type: 'sine', duration: 0.15, delay: 0.35, envelope: SOFT_ENV, pitchBend: 50 },
    ],
    volume: 0.6,
  },

  // Abilities
  ability_ready: {
    notes: [
      { frequency: 600, type: 'sine', duration: 0.1, envelope: QUICK_ENV },
      { frequency: 700, type: 'sine', duration: 0.1, delay: 0.08, envelope: QUICK_ENV },
    ],
    volume: 0.4,
  },
  ability_use: {
    notes: [
      { frequency: 400, type: 'triangle', duration: 0.15, envelope: SOFT_ENV, pitchBend: 200 },
      { frequency: 600, type: 'sine', duration: 0.2, delay: 0.1, envelope: SOFT_ENV },
    ],
    volume: 0.6,
  },
  ability_fail: {
    notes: [
      { frequency: 200, type: 'sine', duration: 0.15, envelope: SOFT_ENV, pitchBend: -100 },
    ],
    volume: 0.4,
  },

  // ============================================================
  // Cinematics (procedural)
  // ============================================================

  sfx_lightning_soft: {
    notes: [
      { frequency: 1200, type: 'square', duration: 0.06, envelope: QUICK_ENV, pitchBend: -700, volume: 0.55 },
      { frequency: 360, type: 'sawtooth', duration: 0.12, envelope: PUNCH_ENV, pitchBend: -160, volume: 0.35 },
      { frequency: 90, type: 'sine', duration: 0.18, delay: 0.02, envelope: SOFT_ENV, pitchBend: -20, volume: 0.25 },
    ],
    volume: 0.55,
  },

  sfx_lightning: {
    notes: [
      { frequency: 1700, type: 'square', duration: 0.05, envelope: QUICK_ENV, pitchBend: -1200, volume: 0.6 },
      { frequency: 620, type: 'sawtooth', duration: 0.11, envelope: PUNCH_ENV, pitchBend: -260, volume: 0.4 },
      { frequency: 140, type: 'square', duration: 0.12, delay: 0.05, envelope: PUNCH_ENV, pitchBend: -60, volume: 0.25 },
      { frequency: 70, type: 'sine', duration: 0.28, delay: 0.03, envelope: SOFT_ENV, pitchBend: -18, volume: 0.25 },
    ],
    volume: 0.65,
  },

  sfx_thunder_clap: {
    notes: [
      { frequency: 80, type: 'sawtooth', duration: 0.22, envelope: PUNCH_ENV, pitchBend: -40, volume: 0.5 },
      { frequency: 55, type: 'sine', duration: 0.95, delay: 0.05, envelope: RUMBLE_ENV, pitchBend: -25, volume: 0.45 },
      { frequency: 42, type: 'triangle', duration: 1.1, delay: 0.08, envelope: RUMBLE_ENV, pitchBend: -18, volume: 0.35 },
    ],
    volume: 0.7,
  },

  sfx_rumble_soft: {
    notes: [
      { frequency: 70, type: 'sine', duration: 0.45, envelope: RUMBLE_ENV, pitchBend: -10, volume: 0.35 },
      { frequency: 95, type: 'triangle', duration: 0.32, delay: 0.04, envelope: SOFT_ENV, pitchBend: -12, volume: 0.2 },
    ],
    volume: 0.55,
  },

  sfx_rumble: {
    notes: [
      { frequency: 60, type: 'sine', duration: 0.75, envelope: RUMBLE_ENV, pitchBend: -18, volume: 0.45 },
      { frequency: 88, type: 'square', duration: 0.22, delay: 0.06, envelope: SOFT_ENV, pitchBend: -10, volume: 0.18 },
    ],
    volume: 0.65,
  },

  sfx_rumble_heavy: {
    notes: [
      { frequency: 48, type: 'sine', duration: 1.2, envelope: RUMBLE_ENV, pitchBend: -30, volume: 0.55 },
      { frequency: 72, type: 'sawtooth', duration: 0.42, delay: 0.08, envelope: SOFT_ENV, pitchBend: -18, volume: 0.22 },
      { frequency: 110, type: 'square', duration: 0.18, delay: 0.12, envelope: QUICK_ENV, pitchBend: -40, volume: 0.15 },
    ],
    volume: 0.75,
  },

  sfx_stone_shift: {
    notes: [
      { frequency: 160, type: 'square', duration: 0.18, envelope: SOFT_ENV, pitchBend: -80, volume: 0.45 },
      { frequency: 70, type: 'sine', duration: 0.32, delay: 0.06, envelope: SOFT_ENV, pitchBend: -15, volume: 0.25 },
    ],
    volume: 0.55,
  },

  sfx_impact: {
    notes: [
      { frequency: 240, type: 'sawtooth', duration: 0.12, envelope: PUNCH_ENV, pitchBend: -160, volume: 0.55 },
      { frequency: 130, type: 'square', duration: 0.10, delay: 0.03, envelope: QUICK_ENV, pitchBend: -60, volume: 0.25 },
    ],
    volume: 0.65,
  },

  sfx_impact_heavy: {
    notes: [
      { frequency: 190, type: 'sawtooth', duration: 0.18, envelope: PUNCH_ENV, pitchBend: -140, volume: 0.6 },
      { frequency: 95, type: 'square', duration: 0.18, delay: 0.04, envelope: PUNCH_ENV, pitchBend: -55, volume: 0.28 },
      { frequency: 60, type: 'sine', duration: 0.45, delay: 0.06, envelope: SOFT_ENV, pitchBend: -12, volume: 0.25 },
    ],
    volume: 0.75,
  },

  sfx_power_tick: {
    notes: [
      { frequency: 980, type: 'sine', duration: 0.045, envelope: QUICK_ENV, pitchBend: -140, volume: 0.5 },
    ],
    volume: 0.35,
  },

  sfx_power_buzz: {
    notes: [
      { frequency: 420, type: 'square', duration: 0.18, envelope: BUZZ_ENV, pitchBend: 20, volume: 0.35 },
      { frequency: 620, type: 'triangle', duration: 0.16, delay: 0.03, envelope: BUZZ_ENV, pitchBend: -30, volume: 0.25 },
    ],
    volume: 0.4,
  },

  sfx_power_surge: {
    notes: [
      { frequency: 520, type: 'triangle', duration: 0.22, envelope: SOFT_ENV, pitchBend: 380, volume: 0.35 },
      { frequency: 820, type: 'sine', duration: 0.18, delay: 0.07, envelope: SOFT_ENV, pitchBend: -220, volume: 0.3 },
      { frequency: 240, type: 'square', duration: 0.12, delay: 0.09, envelope: QUICK_ENV, pitchBend: -60, volume: 0.18 },
    ],
    volume: 0.5,
  },
};
