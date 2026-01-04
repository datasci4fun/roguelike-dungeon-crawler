/**
 * Animation System
 *
 * Provides time-based animation effects for entities and tiles.
 */

export interface AnimationState {
  time: number; // Current animation time in ms
  deltaTime: number; // Time since last frame
  frameCount: number; // Total frames rendered
}

/**
 * Easing functions for smooth animations
 */
export const Easing = {
  linear: (t: number) => t,
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  easeOutBounce: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
  pulse: (t: number) => Math.sin(t * Math.PI),
};

/**
 * Calculate idle bob animation (up/down movement)
 */
export function idleBob(time: number, amplitude: number = 2, speed: number = 2): number {
  return Math.sin(time * speed / 1000 * Math.PI * 2) * amplitude;
}

/**
 * Calculate pulse/glow animation (scale or alpha)
 */
export function pulse(time: number, min: number = 0.8, max: number = 1.2, speed: number = 2): number {
  const t = (Math.sin(time * speed / 1000 * Math.PI * 2) + 1) / 2;
  return min + t * (max - min);
}

/**
 * Calculate rotation animation
 */
export function rotate(time: number, speed: number = 1): number {
  return (time * speed / 1000 * Math.PI * 2) % (Math.PI * 2);
}

/**
 * Calculate sparkle/twinkle effect (random opacity)
 */
export function sparkle(time: number, id: string, speed: number = 3): number {
  // Use id hash to offset the animation for each entity
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const offset = (hash % 1000) / 1000 * Math.PI * 2;
  return (Math.sin(time * speed / 1000 * Math.PI * 2 + offset) + 1) / 2 * 0.5 + 0.5;
}

/**
 * Calculate damage flash (red tint that fades)
 */
export function damageFlash(healthPercent: number, time: number): number {
  if (healthPercent > 0.25) return 0;
  // Low health - continuous pulse
  return pulse(time, 0, 0.4, 4);
}

/**
 * Calculate shake effect (for damage or impact)
 */
export function shake(
  time: number,
  startTime: number,
  duration: number = 200,
  intensity: number = 3
): { x: number; y: number } {
  const elapsed = time - startTime;
  if (elapsed < 0 || elapsed > duration) {
    return { x: 0, y: 0 };
  }

  const progress = elapsed / duration;
  const decay = 1 - progress;
  const frequency = 30;

  return {
    x: Math.sin(elapsed * frequency / 1000 * Math.PI * 2) * intensity * decay,
    y: Math.cos(elapsed * frequency / 1000 * Math.PI * 2 * 1.3) * intensity * decay,
  };
}

/**
 * Calculate movement interpolation between two positions
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * Math.max(0, Math.min(1, t));
}

/**
 * Calculate smooth position interpolation for entity movement
 */
export function smoothMove(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  startTime: number,
  currentTime: number,
  duration: number = 150
): { x: number; y: number } {
  const elapsed = currentTime - startTime;
  const t = Math.min(1, elapsed / duration);
  const eased = Easing.easeInOut(t);

  return {
    x: lerp(fromX, toX, eased),
    y: lerp(fromY, toY, eased),
  };
}

/**
 * Entity animation configuration
 */
export interface EntityAnimation {
  idleBob?: boolean;
  idleBobAmplitude?: number;
  idleBobSpeed?: number;
  pulse?: boolean;
  pulseMin?: number;
  pulseMax?: number;
  pulseSpeed?: number;
  rotate?: boolean;
  rotateSpeed?: number;
  sparkle?: boolean;
  sparkleSpeed?: number;
}

/**
 * Default animations for entity kinds
 */
export const DEFAULT_ENTITY_ANIMATIONS: Record<string, EntityAnimation> = {
  player: {
    idleBob: true,
    idleBobAmplitude: 1.5,
    idleBobSpeed: 2,
  },
  enemy: {
    idleBob: true,
    idleBobAmplitude: 1,
    idleBobSpeed: 1.5,
  },
  boss: {
    idleBob: true,
    idleBobAmplitude: 2,
    idleBobSpeed: 1,
    pulse: true,
    pulseMin: 0.95,
    pulseMax: 1.05,
    pulseSpeed: 1.5,
  },
  item: {
    idleBob: true,
    idleBobAmplitude: 2,
    idleBobSpeed: 3,
    sparkle: true,
    sparkleSpeed: 4,
  },
  trap: {
    pulse: true,
    pulseMin: 0.9,
    pulseMax: 1.1,
    pulseSpeed: 2,
  },
  hazard: {
    pulse: true,
    pulseMin: 0.7,
    pulseMax: 1.0,
    pulseSpeed: 1,
  },
};

/**
 * Apply entity animations and return transform values
 */
export function applyEntityAnimation(
  kind: string,
  id: string,
  time: number,
  healthPercent?: number,
  customAnimation?: EntityAnimation
): {
  offsetY: number;
  scale: number;
  alpha: number;
  rotation: number;
  tintRed: number;
} {
  const anim = customAnimation || DEFAULT_ENTITY_ANIMATIONS[kind] || {};
  let offsetY = 0;
  let scale = 1;
  let alpha = 1;
  let rotation = 0;
  let tintRed = 0;

  // Idle bob
  if (anim.idleBob) {
    offsetY = idleBob(time, anim.idleBobAmplitude, anim.idleBobSpeed);
  }

  // Pulse
  if (anim.pulse) {
    scale = pulse(time, anim.pulseMin, anim.pulseMax, anim.pulseSpeed);
  }

  // Rotate
  if (anim.rotate) {
    rotation = rotate(time, anim.rotateSpeed);
  }

  // Sparkle
  if (anim.sparkle) {
    alpha = sparkle(time, id, anim.sparkleSpeed);
  }

  // Damage flash for low health
  if (healthPercent !== undefined && healthPercent < 1) {
    tintRed = damageFlash(healthPercent, time);
  }

  return { offsetY, scale, alpha, rotation, tintRed };
}
