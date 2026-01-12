/**
 * AtmosphericPage - Wrapper component for immersive pre-game pages
 *
 * Provides consistent atmospheric treatment using existing cutscene layers:
 * - Parallax background
 * - Particle effects
 * - CRT overlay
 * - Fog and vignette
 * - Optional Three.js canvas layer
 */

import { ReactNode } from 'react';
import {
  SceneBackground,
  ParticlesLayer,
  CrtLayer,
} from '../../cutscenes/engine/layers';
import type {
  BackgroundType,
  ParticleConfig,
} from '../../cutscenes/engine/types';
import './AtmosphericPage.css';

export interface AtmosphericPageProps {
  /** Background scene type (uses cutscene background system) */
  backgroundType: BackgroundType;

  /** Particle configuration */
  particles?: ParticleConfig;

  /** Enable CRT scanline overlay */
  crt?: boolean;

  /** CRT effect intensity */
  crtIntensity?: 'light' | 'medium' | 'heavy';

  /** Optional Three.js canvas layer (renders behind content) */
  threeLayer?: ReactNode;

  /** Page content */
  children: ReactNode;

  /** Additional CSS class */
  className?: string;
}

export function AtmosphericPage({
  backgroundType,
  particles,
  crt = false,
  crtIntensity = 'light',
  threeLayer,
  children,
  className = '',
}: AtmosphericPageProps) {
  return (
    <div className={`atmospheric-page cs-scene-${backgroundType} ${className}`}>
      {/* Layer 0: Optional Three.js canvas */}
      {threeLayer && <div className="atm-three-layer">{threeLayer}</div>}

      {/* Layer 1: Parallax background */}
      <div className="atm-background-layer">
        <SceneBackground
          config={{ type: backgroundType, parallax: true, animate: true }}
          fadeState="visible"
        />
      </div>

      {/* Layer 2: Fog effect */}
      <div className="atm-fog-layer" />

      {/* Layer 3: Particles */}
      {particles && particles.type !== 'none' && (
        <div className="atm-particles-layer">
          <ParticlesLayer config={particles} />
        </div>
      )}

      {/* Layer 4: Content */}
      <div className="atm-content-layer">{children}</div>

      {/* Layer 5: CRT overlay */}
      {crt && (
        <div className="atm-crt-layer">
          <CrtLayer enabled={true} intensity={crtIntensity} />
        </div>
      )}

      {/* Layer 6: Vignette */}
      <div className="atm-vignette" />
    </div>
  );
}

export default AtmosphericPage;
