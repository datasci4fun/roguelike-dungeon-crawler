/**
 * ParticlesLayer - Animated particle effects for cutscene ambiance
 * Keeps existing per-type CSS animations, but adds:
 * - per-particle opacity variation (--p-opacity)
 * - per-particle blur (--blur)
 * - per-particle drift vectors for dust (--dx1/--dy1 etc.)
 */

import { useMemo } from 'react';
import type { ParticlesLayerProps, ParticleType } from '../types';
import './ParticlesLayer.scss';

const PARTICLE_COUNTS: Record<string, number> = {
  stars: 50,
  embers: 30,
  dust: 20,
  darkness: 25,
  magic: 15,
  ash: 20,
  mist: 10,
  none: 0,
};

const SPEED_MULTIPLIERS: Record<string, number> = {
  slow: 1.5,
  normal: 1,
  fast: 0.6,
};

type Range = [number, number];

const TYPE_PROFILE: Record<ParticleType, { size: Range; duration: Range; blur: Range; opacityJitter: Range }> = {
  stars: { size: [1, 2.4], duration: [6, 14], blur: [0, 0], opacityJitter: [0.35, 1.0] },
  embers: { size: [1.2, 3.2], duration: [3, 7], blur: [0, 0.4], opacityJitter: [0.55, 1.0] },
  dust: { size: [1.0, 3.6], duration: [10, 18], blur: [0.2, 1.4], opacityJitter: [0.45, 1.0] },
  darkness: { size: [2.0, 5.0], duration: [7, 14], blur: [1.5, 5.5], opacityJitter: [0.5, 1.0] },
  magic: { size: [1.5, 3.5], duration: [2.5, 6], blur: [0, 0.8], opacityJitter: [0.6, 1.0] },
  ash: { size: [1.6, 4.2], duration: [6, 12], blur: [0, 1.0], opacityJitter: [0.5, 1.0] },
  mist: { size: [1.8, 4.0], duration: [16, 28], blur: [8, 14], opacityJitter: [0.35, 0.8] },
  none: { size: [0, 0], duration: [0, 0], blur: [0, 0], opacityJitter: [0, 0] },
};

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function ParticlesLayer({ config }: ParticlesLayerProps) {
  const { type, count, speed = 'normal', opacity = 1 } = config;

  if (type === 'none') return null;

  const particleCount = count ?? PARTICLE_COUNTS[type] ?? 20;
  const speedMult = SPEED_MULTIPLIERS[speed];
  const profile = TYPE_PROFILE[type as ParticleType] ?? TYPE_PROFILE.dust;

  const particles = useMemo(() => {
    return Array.from({ length: particleCount }).map((_, i) => {
      const x = Math.random() * 100;
      const y = Math.random() * 100;

      const duration = rand(profile.duration[0], profile.duration[1]) * speedMult;
      const size = rand(profile.size[0], profile.size[1]);
      const blur = rand(profile.blur[0], profile.blur[1]);
      const pOpacity = rand(profile.opacityJitter[0], profile.opacityJitter[1]);

      // Dust: gentle looping drift vectors (used by updated dustFloat keyframes)
      const isDust = type === 'dust';
      const dx1 = isDust ? rand(-18, 18) : 0;
      const dy1 = isDust ? rand(-10, 10) : 0;
      const dx2 = isDust ? rand(-28, 28) : 0;
      const dy2 = isDust ? rand(-16, 16) : 0;
      const dx3 = isDust ? rand(-16, 16) : 0;
      const dy3 = isDust ? rand(-10, 10) : 0;

      return {
        id: i,
        delay: Math.random() * 6,
        x,
        y,
        duration,
        size,
        blur,
        pOpacity,
        dx1,
        dy1,
        dx2,
        dy2,
        dx3,
        dy3,
      };
    });
  }, [particleCount, speedMult, type, profile.duration, profile.size, profile.blur, profile.opacityJitter]);

  return (
    <div
      className={`particles-layer particles-${type}`}
      style={{ '--particle-opacity': opacity } as React.CSSProperties}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={
            {
              '--delay': `${p.delay}s`,
              '--x': `${p.x}%`,
              '--y': `${p.y}%`,
              '--duration': `${p.duration}s`,
              '--size': `${p.size}px`,
              '--blur': `${p.blur}px`,
              '--p-opacity': `${p.pOpacity}`,
              '--dx1': `${p.dx1}px`,
              '--dy1': `${p.dy1}px`,
              '--dx2': `${p.dx2}px`,
              '--dy2': `${p.dy2}px`,
              '--dx3': `${p.dx3}px`,
              '--dy3': `${p.dy3}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
