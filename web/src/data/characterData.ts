/**
 * Character creation data - races and classes with their stats and abilities.
 */
import type { RaceId, ClassId, RaceDefinition, ClassDefinition } from '../types';

export const RACES: Record<RaceId, RaceDefinition> = {
  HUMAN: {
    id: 'HUMAN',
    name: 'Human',
    description: 'Balanced and adaptable',
    hp_modifier: 0,
    atk_modifier: 0,
    def_modifier: 0,
    trait: 'adaptive',
    trait_name: 'Adaptive',
    trait_description: '+10% XP gain',
  },
  ELF: {
    id: 'ELF',
    name: 'Elf',
    description: 'Graceful and perceptive',
    hp_modifier: -2,
    atk_modifier: 1,
    def_modifier: 0,
    trait: 'keen_sight',
    trait_name: 'Keen Sight',
    trait_description: '+2 vision range',
  },
  DWARF: {
    id: 'DWARF',
    name: 'Dwarf',
    description: 'Sturdy and resilient',
    hp_modifier: 4,
    atk_modifier: -1,
    def_modifier: 2,
    trait: 'poison_resist',
    trait_name: 'Poison Resist',
    trait_description: '50% poison resistance',
  },
  HALFLING: {
    id: 'HALFLING',
    name: 'Halfling',
    description: 'Small but lucky',
    hp_modifier: -4,
    atk_modifier: 0,
    def_modifier: 0,
    trait: 'lucky',
    trait_name: 'Lucky',
    trait_description: '15% dodge chance',
  },
  ORC: {
    id: 'ORC',
    name: 'Orc',
    description: 'Powerful and fierce',
    hp_modifier: 6,
    atk_modifier: 2,
    def_modifier: -1,
    trait: 'rage',
    trait_name: 'Rage',
    trait_description: '+50% damage when below 25% HP',
  },
};

export const CLASSES: Record<ClassId, ClassDefinition> = {
  WARRIOR: {
    id: 'WARRIOR',
    name: 'Warrior',
    description: 'Master of melee combat',
    hp_modifier: 5,
    atk_modifier: 1,
    def_modifier: 1,
    active_abilities: ['power_strike', 'shield_wall'],
    passive_abilities: ['combat_mastery'],
  },
  MAGE: {
    id: 'MAGE',
    name: 'Mage',
    description: 'Wielder of arcane magic',
    hp_modifier: -3,
    atk_modifier: -1,
    def_modifier: 0,
    active_abilities: ['fireball', 'frost_nova'],
    passive_abilities: ['mana_shield'],
  },
  ROGUE: {
    id: 'ROGUE',
    name: 'Rogue',
    description: 'Master of stealth and precision',
    hp_modifier: 0,
    atk_modifier: 2,
    def_modifier: -1,
    active_abilities: ['backstab', 'smoke_bomb'],
    passive_abilities: ['critical_strike'],
  },
};

// Ability descriptions for display
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
};

// Base stats for stat calculation
export const BASE_STATS = {
  hp: 20,
  atk: 3,
  def: 0,
};

// Calculate final stats for a race/class combo
export function calculateStats(raceId: RaceId, classId: ClassId) {
  const race = RACES[raceId];
  const playerClass = CLASSES[classId];

  return {
    hp: BASE_STATS.hp + race.hp_modifier + playerClass.hp_modifier,
    atk: BASE_STATS.atk + race.atk_modifier + playerClass.atk_modifier,
    def: Math.max(0, BASE_STATS.def + race.def_modifier + playerClass.def_modifier),
  };
}
