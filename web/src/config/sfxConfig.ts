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
  // Abilities
  | 'ability_ready'
  | 'ability_use'
  | 'ability_fail';

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
};
