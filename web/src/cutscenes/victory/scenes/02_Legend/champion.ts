/**
 * Legacy Variant: Champion
 * The victor becomes a trial for future delvers
 */

import type { CaptionLine } from '../../../engine/types';

export const legacyChampionId = 'legacy-champion';

export const legacyChampionLines: CaptionLine[] = [
  { text: '', delay: 400 },
  { text: 'Some will meet you where the stone runs red—', effect: 'fade', style: 'emphasis', delay: 400, duration: 2000 },
  { text: 'a blade that does not tire,', effect: 'fade', delay: 300, duration: 1600 },
  { text: 'a silence that demands proof.', effect: 'fade', style: 'whisper', delay: 400, duration: 1800 },
];
