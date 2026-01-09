/**
 * Legacy Variants - Random victory legacy types
 */

import type { CaptionLine } from '../../../engine/types';
import { legacyBeaconId, legacyBeaconLines } from './beacon';
import { legacyChampionId, legacyChampionLines } from './champion';
import { legacyArchivistId, legacyArchivistLines } from './archivist';

export { legacyBeaconId, legacyBeaconLines } from './beacon';
export { legacyChampionId, legacyChampionLines } from './champion';
export { legacyArchivistId, legacyArchivistLines } from './archivist';

export interface LegacyVariant {
  id: string;
  lines: CaptionLine[];
}

export const legacyVariants: LegacyVariant[] = [
  { id: legacyBeaconId, lines: legacyBeaconLines },
  { id: legacyChampionId, lines: legacyChampionLines },
  { id: legacyArchivistId, lines: legacyArchivistLines },
];

/**
 * Get a random legacy variant
 */
export function getRandomLegacy(rng: () => number = Math.random): LegacyVariant {
  const index = Math.floor(rng() * legacyVariants.length);
  return legacyVariants[index];
}
