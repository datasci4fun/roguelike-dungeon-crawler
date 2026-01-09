/**
 * Legacy Variant: Beacon
 * The victor becomes a guiding light for future delvers
 */

import type { CaptionLine } from '../../../engine/types';

export const legacyBeaconId = 'legacy-beacon';

export const legacyBeaconLines: CaptionLine[] = [
  { text: '', delay: 400 },
  { text: 'Some will see you at the edge of torchlight—', effect: 'fade', style: 'emphasis', delay: 400, duration: 2000 },
  { text: 'a hand raised, a path revealed.', effect: 'fade', delay: 300, duration: 1800 },
  { text: 'A warning without words.', effect: 'fade', style: 'whisper', delay: 400, duration: 1600 },
];
