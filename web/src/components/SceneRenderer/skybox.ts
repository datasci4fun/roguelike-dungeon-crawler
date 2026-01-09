/**
 * Parallax skybox rendering for first-person dungeon view
 *
 * Draws a procedural gradient background that shifts with player facing direction,
 * creating a sense of depth and space behind the dungeon walls.
 */
import { getBiome, adjustBrightness, rgbToString, type BiomeId } from './biomes';

export interface SkyboxOptions {
  biome: BiomeId;
  facingDx: number;    // Player facing direction X (-1, 0, or 1)
  facingDy: number;    // Player facing direction Y (-1, 0, or 1)
  canvasWidth: number;
  canvasHeight: number;
  brightness?: number;
  extraParallaxOffset?: number; // Additional offset during turn animation
}

/**
 * Calculate facing angle from direction vector
 * Returns angle in radians where 0 = north (facing -Y)
 */
function getFacingAngle(dx: number, dy: number): number {
  // atan2(dx, -dy) gives angle where 0 = facing north (negative Y)
  return Math.atan2(dx, -dy);
}

/**
 * Draw the parallax skybox background
 *
 * The skybox creates an illusion of distant space behind the dungeon,
 * using procedural gradients based on the biome colors. The parallax
 * effect shifts the background when the player turns.
 */
export function drawSkybox(
  ctx: CanvasRenderingContext2D,
  options: SkyboxOptions
): void {
  const {
    biome: biomeId,
    facingDx,
    facingDy,
    canvasWidth,
    canvasHeight,
    brightness = 1.0,
    extraParallaxOffset = 0,
  } = options;

  const biome = getBiome(biomeId);

  // Calculate parallax offset from facing direction
  // Convert direction to angle (0-2PI), then to horizontal offset
  const angle = getFacingAngle(facingDx, facingDy);
  const normalizedAngle = (angle + Math.PI) / (2 * Math.PI); // 0-1 range

  // Parallax moves slowly (distant objects move less)
  const parallaxFactor = 0.15; // 15% of a full rotation
  const baseOffset = normalizedAngle * canvasWidth * parallaxFactor;
  const totalOffset = baseOffset + extraParallaxOffset * parallaxFactor;

  // Wrap the offset for seamless tiling
  const wrappedOffset = ((totalOffset % canvasWidth) + canvasWidth) % canvasWidth;

  // Draw procedural skybox based on biome
  drawBiomeSkybox(ctx, biome.id, canvasWidth, canvasHeight, wrappedOffset, brightness, biome);
}

/**
 * Draw biome-specific procedural skybox
 */
function drawBiomeSkybox(
  ctx: CanvasRenderingContext2D,
  biomeId: string,
  width: number,
  height: number,
  parallaxOffset: number,
  brightness: number,
  biome: ReturnType<typeof getBiome>
): void {
  const horizon = height / 2;

  // Use biome colors for the skybox
  // Upper part: darker ceiling color fading to black
  // Lower part: floor color (will be covered by floor segments)
  const ceilingColor = adjustBrightness(biome.ceilingColor, brightness * 0.3);
  const fogColor = adjustBrightness(biome.fogColor, brightness);

  // Create vertical gradient for ceiling/upper area
  const skyGrad = ctx.createLinearGradient(0, 0, 0, horizon);
  skyGrad.addColorStop(0, rgbToString(fogColor)); // Top: pure fog/darkness
  skyGrad.addColorStop(0.5, rgbToString(ceilingColor, 0.8));
  skyGrad.addColorStop(1, rgbToString(ceilingColor, 0.4));

  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, horizon);

  // Add ambient glow spots that shift with parallax
  // These create a subtle sense of distant lights or openings
  if (biomeId !== 'dungeon') {
    drawDistantLights(ctx, width, horizon, parallaxOffset, brightness, biome);
  }

  // Add subtle parallax stripes (architectural detail in distance)
  drawParallaxStripes(ctx, width, horizon, parallaxOffset, brightness, biome);
}

/**
 * Draw distant light sources that parallax with turning
 */
function drawDistantLights(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  parallaxOffset: number,
  brightness: number,
  biome: ReturnType<typeof getBiome>
): void {
  const lightColor = adjustBrightness(biome.lightColor, brightness * 0.15);

  // Place 3 distant "glow" spots that wrap around
  const numLights = 3;
  const spacing = width / numLights;

  for (let i = 0; i < numLights; i++) {
    // Calculate position with parallax offset (wrap for seamless loop)
    const baseX = i * spacing + spacing / 2;
    const x = ((baseX + parallaxOffset) % width);

    // Vary the height slightly for each light
    const y = height * (0.3 + (i % 2) * 0.15);
    const radius = width * 0.15;

    // Create radial glow
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, rgbToString(lightColor, 0.15));
    glow.addColorStop(0.5, rgbToString(lightColor, 0.05));
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = glow;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);

    // Handle wrap-around (draw again on opposite side if near edge)
    if (x < radius) {
      const wrapX = x + width;
      ctx.fillStyle = glow;
      ctx.fillRect(wrapX - radius, y - radius, radius * 2, radius * 2);
    } else if (x > width - radius) {
      const wrapX = x - width;
      const wrapGlow = ctx.createRadialGradient(wrapX, y, 0, wrapX, y, radius);
      wrapGlow.addColorStop(0, rgbToString(lightColor, 0.15));
      wrapGlow.addColorStop(0.5, rgbToString(lightColor, 0.05));
      wrapGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = wrapGlow;
      ctx.fillRect(wrapX - radius, y - radius, radius * 2, radius * 2);
    }
  }
}

/**
 * Draw parallax architectural stripes (distant pillars/arches)
 */
function drawParallaxStripes(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  parallaxOffset: number,
  brightness: number,
  biome: ReturnType<typeof getBiome>
): void {
  // Use a darker version of wall color for distant pillars
  const stripeColor = adjustBrightness(biome.wallColor, brightness * 0.1);

  // Draw vertical stripes that suggest distant architecture
  const numStripes = 6;
  const stripeWidth = width * 0.02;
  const spacing = width / numStripes;

  ctx.fillStyle = rgbToString(stripeColor, 0.3);

  for (let i = 0; i < numStripes; i++) {
    const baseX = i * spacing;
    // Parallax offset (slower than lights for depth perception)
    const x = ((baseX + parallaxOffset * 0.5) % width);

    // Tapered stripe (wider at bottom, narrower at top)
    ctx.beginPath();
    ctx.moveTo(x - stripeWidth * 0.5, height);
    ctx.lineTo(x - stripeWidth * 0.3, height * 0.3);
    ctx.lineTo(x + stripeWidth * 0.3, height * 0.3);
    ctx.lineTo(x + stripeWidth * 0.5, height);
    ctx.closePath();
    ctx.fill();
  }
}
