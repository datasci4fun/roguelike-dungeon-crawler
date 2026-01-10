/**
 * Types for the Lore Codex system
 */

export type LoreCategory = 'history' | 'characters' | 'creatures' | 'locations' | 'artifacts';
export type LoreItemType = 'scroll' | 'book';

export interface LoreEntry {
  id: string;
  title: string;
  content: string[];
  category: LoreCategory;
  item_type: LoreItemType;
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
];

export type TransitionState = 'idle' | 'entering' | 'exiting';
