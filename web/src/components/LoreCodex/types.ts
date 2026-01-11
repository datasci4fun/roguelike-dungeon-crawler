/**
 * Types for the Lore Codex system
 */

export type LoreCategory = 'history' | 'characters' | 'creatures' | 'locations' | 'artifacts' | 'meta';
export type LoreItemType = 'scroll' | 'book' | 'bestiary' | 'location' | 'character' | 'artifact' | 'chronicle' | 'evidence';

export interface LoreEntry {
  id: string;
  title: string;
  content: string[];
  category: LoreCategory;
  item_type: LoreItemType;
}

// Extended entry types for category-specific data

export interface CreatureData {
  symbol: string;
  name: string;
  hp: number;
  damage: number;
  xp: number;
  is_boss: boolean;
  abilities?: string[];
  resistances?: Record<string, number>;
  element?: string;
  level_range?: [number, number];
  first_encounter_text: string;
  description?: string;
}

export interface CreatureEntry extends LoreEntry {
  item_type: 'bestiary';
  creature_data: CreatureData;
}

export interface LocationData {
  level: number;
  biome_id: string;
  biome_name: string;
  intro_message: string;
  boss_name?: string;
  boss_symbol?: string;
  creatures: string[];
}

export interface LocationEntry extends LoreEntry {
  item_type: 'location';
  location_data: LocationData;
}

// Type guard functions
export function isCreatureEntry(entry: LoreEntry): entry is CreatureEntry {
  return entry.item_type === 'bestiary' && 'creature_data' in entry;
}

export function isLocationEntry(entry: LoreEntry): entry is LocationEntry {
  return entry.item_type === 'location' && 'location_data' in entry;
}

export interface CategoryConfig {
  id: LoreCategory;
  label: string;
  icon: string;
}

export const CATEGORIES: CategoryConfig[] = [
  { id: 'history', label: 'History', icon: 'H' },
  { id: 'characters', label: 'Characters', icon: 'C' },
  { id: 'creatures', label: 'Creatures', icon: 'M' },
  { id: 'locations', label: 'Locations', icon: 'L' },
  { id: 'artifacts', label: 'Artifacts', icon: 'A' },
  { id: 'meta', label: '???', icon: '?' },
];

// Sealed page data structure
export interface SealedData {
  completion_pct: number;
  floors: [number, number];
  wardens: [number, number];
  lore: [number, number];
  evidence: [number, number];
  artifacts: [number, number];
  ghosts: number;
  is_complete: boolean;
}

export interface SealedEntry extends LoreEntry {
  item_type: 'chronicle';
  sealed_data: SealedData;
}

export function isSealedEntry(entry: LoreEntry): entry is SealedEntry {
  return entry.item_type === 'chronicle' && 'sealed_data' in entry;
}

export type TransitionState = 'idle' | 'entering' | 'exiting';
