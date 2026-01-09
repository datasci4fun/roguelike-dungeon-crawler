/**
 * FxLayer - Visual effect overlays (flash, shake, flicker)
 */

import { useCallback } from 'react';
import type { FxLayerProps, FxType } from '../types';
import './FxLayer.scss';

export function FxLayer({ activeEffects, onEffectComplete }: FxLayerProps) {
  const hasFlash = activeEffects.includes('flash');
  const hasShake = activeEffects.includes('shake');
  const hasFlicker = activeEffects.includes('flicker');

  // Handle animation end events
  const handleAnimationEnd = useCallback(
    (effect: FxType) => {
      onEffectComplete?.(effect);
    },
    [onEffectComplete]
  );

  return (
    <div className="fx-layer">
      {/* Flash overlay */}
      {hasFlash && (
        <div
          className="fx-flash"
          onAnimationEnd={() => handleAnimationEnd('flash')}
        />
      )}

      {/* Flicker overlay */}
      {hasFlicker && (
        <div
          className="fx-flicker"
          onAnimationEnd={() => handleAnimationEnd('flicker')}
        />
      )}

      {/* Shake is applied to parent via CSS class */}
      {hasShake && <div className="fx-shake-trigger" />}
    </div>
  );
}
