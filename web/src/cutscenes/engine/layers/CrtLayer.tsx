/**
 * CrtLayer - Retro CRT monitor effects (scanlines, vignette, flicker)
 */

import type { CrtLayerProps } from '../types';
import './CrtLayer.scss';

export function CrtLayer({ enabled, intensity = 'medium' }: CrtLayerProps) {
  if (!enabled) return null;

  return (
    <div className={`crt-layer crt-${intensity}`}>
      <div className="crt-scanlines" />
      <div className="crt-vignette" />
      <div className="crt-glow" />
      <div className="crt-flicker" />
    </div>
  );
}
