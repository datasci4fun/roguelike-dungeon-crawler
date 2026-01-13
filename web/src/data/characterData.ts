/**
 * Character creation data - ability descriptions and base stats.
 *
 * NOTE: Race and class definitions are now fetched from the API via useGameConstants hook.
 * This file only contains static ability descriptions (not yet migrated to DB).
 */

// Ability descriptions for display (abilities not yet in database)
export const ABILITY_DESCRIPTIONS: Record<string, { name: string; description: string; cooldown?: number }> = {
  power_strike: {
    name: 'Power Strike',
    description: '2x damage melee attack',
    cooldown: 4,
  },
  shield_wall: {
    name: 'Shield Wall',
    description: 'Block all damage for 2 turns',
    cooldown: 8,
  },
  combat_mastery: {
    name: 'Combat Mastery',
    description: '+15% melee damage (passive)',
  },
  fireball: {
    name: 'Fireball',
    description: '8 damage + burn effect (range 5)',
    cooldown: 3,
  },
  frost_nova: {
    name: 'Frost Nova',
    description: '4 damage + freeze to all nearby enemies',
    cooldown: 6,
  },
  mana_shield: {
    name: 'Mana Shield',
    description: '25% damage reduction (passive)',
  },
  backstab: {
    name: 'Backstab',
    description: '3x damage melee attack',
    cooldown: 2,
  },
  smoke_bomb: {
    name: 'Smoke Bomb',
    description: 'Invisible for 3 turns',
    cooldown: 10,
  },
  critical_strike: {
    name: 'Critical Strike',
    description: '20% chance for double damage (passive)',
  },
  heal: {
    name: 'Heal',
    description: 'Restore 10 HP to yourself',
    cooldown: 5,
  },
  smite: {
    name: 'Smite',
    description: '6 damage, 2x to undead',
    cooldown: 3,
  },
  divine_protection: {
    name: 'Divine Protection',
    description: '20% damage reduction (passive)',
  },
};

// Base stats for stat calculation
export const BASE_STATS = {
  hp: 20,
  atk: 3,
  def: 0,
};
