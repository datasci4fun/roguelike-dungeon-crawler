/**
 * Trap rendering for first-person view
 *
 * Each trap type has a distinct visual appearance on the dungeon floor.
 */
import { getFogAmount } from '../projection';

type TrapType = 'spike' | 'fire' | 'poison' | 'arrow';

interface DrawTrapParams {
  ctx: CanvasRenderingContext2D;
  centerX: number;
  floorY: number;
  width: number;
  height: number;
  scale: number;
  trapType: TrapType;
  triggered: boolean;
  isActive: boolean;
  distance: number;
  time: number;
  enableAnimations: boolean;
  fogAlpha: number;
}

/**
 * Draw a trap on the dungeon floor
 */
export function drawTrap({
  ctx,
  centerX,
  floorY,
  width,
  height,
  scale,
  trapType,
  triggered,
  isActive,
  distance,
  time,
  enableAnimations,
  fogAlpha,
}: DrawTrapParams): void {
  // Base trap size scales with distance
  const trapWidth = Math.max(20, 60 * scale);
  const trapHeight = Math.max(10, 30 * scale);
  const trapX = centerX - trapWidth / 2;
  const trapY = floorY - trapHeight;

  // Fog affects visibility
  const visibility = 1 - fogAlpha * 0.7;
  if (visibility < 0.1) return; // Too dark to see

  ctx.save();
  ctx.globalAlpha = visibility;

  switch (trapType) {
    case 'spike':
      drawSpikeTrap(ctx, trapX, trapY, trapWidth, trapHeight, triggered, isActive, time, enableAnimations);
      break;
    case 'fire':
      drawFireTrap(ctx, trapX, trapY, trapWidth, trapHeight, triggered, isActive, time, enableAnimations);
      break;
    case 'poison':
      drawPoisonTrap(ctx, trapX, trapY, trapWidth, trapHeight, triggered, isActive, time, enableAnimations);
      break;
    case 'arrow':
      drawArrowTrap(ctx, trapX, trapY, trapWidth, trapHeight, triggered, isActive, time, enableAnimations);
      break;
  }

  ctx.restore();

  // Draw warning indicator for active traps
  if (isActive && !triggered && distance <= 3) {
    drawWarningIndicator(ctx, centerX, trapY - 10, scale, time, enableAnimations);
  }
}

/**
 * Spike trap - metal spikes on a pressure plate
 */
function drawSpikeTrap(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  triggered: boolean,
  isActive: boolean,
  time: number,
  enableAnimations: boolean
): void {
  // Pressure plate base
  ctx.fillStyle = triggered ? '#3a3530' : '#4a4540';
  ctx.fillRect(x, y + height * 0.6, width, height * 0.4);

  // Metal frame
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y + height * 0.6, width, height * 0.4);

  // Spikes
  const spikeCount = Math.max(3, Math.floor(width / 12));
  const spikeWidth = width / (spikeCount * 2);
  const spikeHeight = triggered ? height * 0.3 : height * 0.8;

  for (let i = 0; i < spikeCount; i++) {
    const spikeX = x + (i * 2 + 1) * spikeWidth;
    const spikeY = y + height - spikeHeight;

    // Spike body (metal gray)
    const gradient = ctx.createLinearGradient(spikeX, spikeY, spikeX + spikeWidth, spikeY);
    gradient.addColorStop(0, '#888');
    gradient.addColorStop(0.5, '#aaa');
    gradient.addColorStop(1, '#777');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(spikeX, y + height * 0.6);
    ctx.lineTo(spikeX + spikeWidth / 2, spikeY);
    ctx.lineTo(spikeX + spikeWidth, y + height * 0.6);
    ctx.closePath();
    ctx.fill();

    // Spike tip highlight
    ctx.fillStyle = '#ccc';
    ctx.beginPath();
    ctx.arc(spikeX + spikeWidth / 2, spikeY + 2, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Blood stains if triggered
  if (triggered) {
    ctx.fillStyle = 'rgba(139, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.ellipse(x + width * 0.3, y + height * 0.7, width * 0.15, height * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Fire trap - grate with flames underneath
 */
function drawFireTrap(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  triggered: boolean,
  isActive: boolean,
  time: number,
  enableAnimations: boolean
): void {
  // Glowing coals underneath
  const glowIntensity = enableAnimations ? Math.sin(time * 4) * 0.2 + 0.8 : 1;
  const glowGrad = ctx.createRadialGradient(
    x + width / 2, y + height,
    0,
    x + width / 2, y + height,
    width * 0.6
  );
  glowGrad.addColorStop(0, `rgba(255, 100, 20, ${0.4 * glowIntensity})`);
  glowGrad.addColorStop(0.5, `rgba(255, 50, 0, ${0.2 * glowIntensity})`);
  glowGrad.addColorStop(1, 'rgba(100, 20, 0, 0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(x - width * 0.2, y, width * 1.4, height * 1.2);

  // Metal grate
  ctx.fillStyle = '#333';
  ctx.fillRect(x, y + height * 0.5, width, height * 0.5);

  // Grate bars
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 2;
  const barCount = Math.floor(width / 8);
  for (let i = 0; i <= barCount; i++) {
    const barX = x + (i / barCount) * width;
    ctx.beginPath();
    ctx.moveTo(barX, y + height * 0.5);
    ctx.lineTo(barX, y + height);
    ctx.stroke();
  }

  // Flames (if active or recently triggered)
  if (isActive || triggered) {
    const flameCount = 3;
    for (let i = 0; i < flameCount; i++) {
      const flameX = x + ((i + 0.5) / flameCount) * width;
      const flameOffset = enableAnimations ? Math.sin(time * 8 + i * 2) * 3 : 0;
      const flameHeight = height * (0.6 + (enableAnimations ? Math.sin(time * 10 + i) * 0.2 : 0));

      // Outer flame
      ctx.fillStyle = `rgba(255, 100, 0, ${triggered ? 0.9 : 0.6})`;
      ctx.beginPath();
      ctx.moveTo(flameX - 4, y + height * 0.5);
      ctx.quadraticCurveTo(flameX + flameOffset, y + height * 0.5 - flameHeight, flameX + 4, y + height * 0.5);
      ctx.fill();

      // Inner flame
      ctx.fillStyle = `rgba(255, 200, 50, ${triggered ? 0.8 : 0.5})`;
      ctx.beginPath();
      ctx.moveTo(flameX - 2, y + height * 0.5);
      ctx.quadraticCurveTo(flameX + flameOffset * 0.5, y + height * 0.5 - flameHeight * 0.6, flameX + 2, y + height * 0.5);
      ctx.fill();
    }
  }
}

/**
 * Poison trap - bubbling green pool
 */
function drawPoisonTrap(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  triggered: boolean,
  isActive: boolean,
  time: number,
  enableAnimations: boolean
): void {
  // Pool basin
  ctx.fillStyle = '#2a2a20';
  ctx.beginPath();
  ctx.ellipse(x + width / 2, y + height * 0.7, width / 2, height * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Poison liquid
  const poisonGrad = ctx.createRadialGradient(
    x + width / 2, y + height * 0.7,
    0,
    x + width / 2, y + height * 0.7,
    width / 2
  );
  poisonGrad.addColorStop(0, 'rgba(80, 200, 80, 0.9)');
  poisonGrad.addColorStop(0.6, 'rgba(40, 150, 40, 0.8)');
  poisonGrad.addColorStop(1, 'rgba(20, 80, 20, 0.6)');
  ctx.fillStyle = poisonGrad;
  ctx.beginPath();
  ctx.ellipse(x + width / 2, y + height * 0.7, width * 0.45, height * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bubbles
  if (enableAnimations && isActive) {
    const bubbleCount = 4;
    for (let i = 0; i < bubbleCount; i++) {
      const bubblePhase = (time * 2 + i * 0.7) % 1;
      const bubbleX = x + width * (0.3 + (i / bubbleCount) * 0.4);
      const bubbleY = y + height * (0.7 - bubblePhase * 0.3);
      const bubbleSize = 2 + Math.sin(i) * 1;
      const bubbleAlpha = 1 - bubblePhase;

      ctx.fillStyle = `rgba(100, 255, 100, ${bubbleAlpha * 0.6})`;
      ctx.beginPath();
      ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Poison mist
  if (triggered && enableAnimations) {
    const mistAlpha = Math.sin(time * 3) * 0.1 + 0.2;
    ctx.fillStyle = `rgba(100, 200, 100, ${mistAlpha})`;
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + height * 0.4, width * 0.6, height * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Skull warning symbol
  ctx.fillStyle = 'rgba(200, 200, 180, 0.7)';
  ctx.font = `${Math.max(8, height * 0.4)}px serif`;
  ctx.textAlign = 'center';
  ctx.fillText('☠', x + width / 2, y + height * 0.5);
}

/**
 * Arrow trap - holes in wall with arrow tips
 */
function drawArrowTrap(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  triggered: boolean,
  isActive: boolean,
  time: number,
  enableAnimations: boolean
): void {
  // Floor pressure plate
  ctx.fillStyle = triggered ? '#3a3530' : '#4a4540';
  ctx.fillRect(x, y + height * 0.7, width, height * 0.3);

  // Plate border
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y + height * 0.7, width, height * 0.3);

  // Arrow holes (on side)
  const holeCount = 2;
  for (let i = 0; i < holeCount; i++) {
    const holeX = x + width * 0.1;
    const holeY = y + height * (0.2 + i * 0.3);
    const holeWidth = width * 0.15;
    const holeHeight = height * 0.15;

    // Dark hole
    ctx.fillStyle = '#111';
    ctx.fillRect(holeX, holeY, holeWidth, holeHeight);

    // Arrow tip poking out (if active)
    if (isActive && !triggered) {
      const arrowPoke = enableAnimations ? Math.sin(time * 2 + i) * 2 : 0;
      ctx.fillStyle = '#888';
      ctx.beginPath();
      ctx.moveTo(holeX + holeWidth + arrowPoke, holeY + holeHeight / 2);
      ctx.lineTo(holeX + holeWidth - 3, holeY + 2);
      ctx.lineTo(holeX + holeWidth - 3, holeY + holeHeight - 2);
      ctx.closePath();
      ctx.fill();
    }

    // Flying arrow if triggered
    if (triggered && enableAnimations) {
      const arrowProgress = (time * 5) % 1;
      const arrowX = holeX + holeWidth + arrowProgress * width * 0.8;

      ctx.fillStyle = '#8b4513';
      ctx.fillRect(arrowX, holeY + holeHeight * 0.3, width * 0.3, holeHeight * 0.4);

      // Arrow head
      ctx.fillStyle = '#888';
      ctx.beginPath();
      ctx.moveTo(arrowX + width * 0.3, holeY + holeHeight / 2);
      ctx.lineTo(arrowX + width * 0.35, holeY + 2);
      ctx.lineTo(arrowX + width * 0.35, holeY + holeHeight - 2);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Danger symbol
  ctx.fillStyle = 'rgba(255, 200, 50, 0.8)';
  ctx.font = `${Math.max(8, height * 0.3)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('⚠', x + width * 0.7, y + height * 0.5);
}

/**
 * Draw warning indicator for active traps
 */
function drawWarningIndicator(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  time: number,
  enableAnimations: boolean
): void {
  const pulse = enableAnimations ? Math.sin(time * 6) * 0.3 + 0.7 : 1;
  const size = Math.max(6, 12 * scale);

  // Pulsing red triangle
  ctx.fillStyle = `rgba(255, 50, 50, ${pulse})`;
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x - size * 0.7, y);
  ctx.lineTo(x + size * 0.7, y);
  ctx.closePath();
  ctx.fill();

  // Exclamation mark
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.max(6, size * 0.8)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('!', x, y - size * 0.4);
}
