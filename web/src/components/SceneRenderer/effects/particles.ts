/**
 * Particle effects for atmospheric visuals
 *
 * Dust motes, sparks, and ambient particles that float in the dungeon air.
 */
import { getProjection, getFogAmount } from '../projection';

interface Particle {
  x: number;      // Normalized position 0-1
  y: number;      // Normalized position 0-1
  z: number;      // Depth (0 = near, 1 = far)
  size: number;   // Base size in pixels
  speed: number;  // Movement speed multiplier
  drift: number;  // Horizontal drift factor
  brightness: number; // 0-1
  phase: number;  // Animation phase offset
}

// Pre-generated particles for consistent positions
const DUST_PARTICLES: Particle[] = [];
const NUM_PARTICLES = 30;

// Initialize particles with seeded positions
for (let i = 0; i < NUM_PARTICLES; i++) {
  DUST_PARTICLES.push({
    x: (i * 37) % 100 / 100,  // Pseudo-random but deterministic
    y: (i * 53 + 17) % 100 / 100,
    z: (i * 23 + 31) % 100 / 100,
    size: 1 + (i % 3) * 0.5,
    speed: 0.3 + (i % 5) * 0.15,
    drift: ((i * 7) % 100 - 50) / 100,
    brightness: 0.3 + (i % 4) * 0.2,
    phase: (i * 41) % 100 / 100,
  });
}

/**
 * Draw floating dust motes in the dungeon air
 */
export function drawDustParticles(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  time: number,
  enableAnimations: boolean
): void {
  if (!enableAnimations) return;

  for (const particle of DUST_PARTICLES) {
    // Animate position
    const animTime = time * particle.speed + particle.phase;

    // Vertical float - slow up and down
    const floatY = Math.sin(animTime * 0.5) * 0.1;

    // Horizontal drift
    const driftX = Math.sin(animTime * 0.3 + particle.drift * 10) * 0.05;

    // Calculate screen position
    const depth = 1 + particle.z * 5; // Map to depth 1-6
    const offset = (particle.x - 0.5) * 2 + driftX;

    const projection = getProjection(canvasWidth, canvasHeight, depth, offset);

    // Y position - between wall top and bottom with float
    const wallHeight = projection.wallBottom - projection.wallTop;
    const baseY = projection.wallTop + (particle.y + floatY) * wallHeight;

    // Skip if outside visible area
    if (baseY < projection.wallTop || baseY > projection.wallBottom) continue;
    if (projection.x < 0 || projection.x > canvasWidth) continue;

    // Size scales with depth
    const size = particle.size * projection.scale * 2;

    // Visibility affected by fog
    const fogAmount = getFogAmount(depth);
    const visibility = (1 - fogAmount) * particle.brightness * 0.4;

    if (visibility < 0.05) continue;

    // Draw particle with glow
    ctx.save();

    // Outer glow
    const gradient = ctx.createRadialGradient(
      projection.x, baseY, 0,
      projection.x, baseY, size * 2
    );
    gradient.addColorStop(0, `rgba(255, 240, 200, ${visibility})`);
    gradient.addColorStop(0.5, `rgba(255, 220, 180, ${visibility * 0.3})`);
    gradient.addColorStop(1, 'rgba(255, 200, 150, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(projection.x, baseY, size * 2, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright core
    ctx.fillStyle = `rgba(255, 250, 230, ${visibility * 1.5})`;
    ctx.beginPath();
    ctx.arc(projection.x, baseY, size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

/**
 * Draw ambient light rays from torches
 */
export function drawLightRays(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  torchPositions: { depth: number; side: 'left' | 'right' }[],
  time: number,
  enableAnimations: boolean
): void {
  for (const torch of torchPositions) {
    const projection = getProjection(
      canvasWidth,
      canvasHeight,
      torch.depth,
      torch.side === 'left' ? -0.8 : 0.8
    );

    const fogAmount = getFogAmount(torch.depth);
    if (fogAmount > 0.8) continue;

    const rayAlpha = (1 - fogAmount) * 0.15;
    const flicker = enableAnimations
      ? 0.8 + Math.sin(time * 4 + torch.depth) * 0.2
      : 1;

    // Draw conical light ray
    const rayWidth = 40 * projection.scale;
    const rayHeight = (projection.wallBottom - projection.wallTop) * 0.6;
    const rayTop = projection.wallTop + (projection.wallBottom - projection.wallTop) * 0.2;

    const gradient = ctx.createLinearGradient(
      projection.x, rayTop,
      projection.x, rayTop + rayHeight
    );
    gradient.addColorStop(0, `rgba(255, 200, 100, ${rayAlpha * flicker})`);
    gradient.addColorStop(0.5, `rgba(255, 180, 80, ${rayAlpha * flicker * 0.5})`);
    gradient.addColorStop(1, 'rgba(255, 150, 50, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(projection.x, rayTop);
    ctx.lineTo(projection.x - rayWidth, rayTop + rayHeight);
    ctx.lineTo(projection.x + rayWidth, rayTop + rayHeight);
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * Draw atmospheric fog wisps
 */
export function drawFogWisps(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  time: number,
  enableAnimations: boolean
): void {
  if (!enableAnimations) return;

  const numWisps = 5;

  for (let i = 0; i < numWisps; i++) {
    const phase = (i / numWisps) * Math.PI * 2;
    const depth = 3 + i % 3;

    // Slow horizontal movement
    const xOffset = Math.sin(time * 0.2 + phase) * 0.5;
    const yOffset = Math.sin(time * 0.15 + phase * 2) * 0.1;

    const projection = getProjection(canvasWidth, canvasHeight, depth, xOffset);

    const fogAmount = getFogAmount(depth);
    const alpha = fogAmount * 0.1;

    if (alpha < 0.02) continue;

    // Wispy shape
    const wispWidth = 100 * projection.scale;
    const wispHeight = 30 * projection.scale;
    const wispY = projection.wallTop + (projection.wallBottom - projection.wallTop) * (0.3 + yOffset);

    const gradient = ctx.createRadialGradient(
      projection.x, wispY, 0,
      projection.x, wispY, wispWidth
    );
    gradient.addColorStop(0, `rgba(60, 60, 80, ${alpha})`);
    gradient.addColorStop(0.5, `rgba(40, 40, 60, ${alpha * 0.5})`);
    gradient.addColorStop(1, 'rgba(20, 20, 40, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(projection.x, wispY, wispWidth, wispHeight, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
