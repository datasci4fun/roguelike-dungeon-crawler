/**
 * Draw enemy entities in first-person view
 */
import { getEnemyColors } from './entityColors';

interface DrawEnemyParams {
  ctx: CanvasRenderingContext2D;
  centerX: number;
  baseY: number;
  entityWidth: number;
  entityHeight: number;
  scale: number;
  name: string;
  symbol: string;
  distance: number;
  health?: number;
  maxHealth?: number;
  isElite: boolean;
  time: number;
  enableAnimations: boolean;
  fogAlpha: number;
}

export function drawEnemy(params: DrawEnemyParams): void {
  const {
    ctx, centerX, baseY, entityWidth, entityHeight, scale,
    name, symbol, distance, health, maxHealth, isElite,
    time, enableAnimations, fogAlpha
  } = params;

  const colors = getEnemyColors(symbol, name, isElite);

  // Animation values
  let bobY = 0;
  let breathe = 1;
  let sway = 0;
  if (enableAnimations) {
    bobY = Math.sin(time * 2.5 + distance) * 4 * scale;
    breathe = 1 + Math.sin(time * 3) * 0.05;
    sway = Math.sin(time * 1.5) * 2 * scale;
  }

  const y = baseY - entityHeight + bobY;

  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(centerX, baseY + 5, entityWidth * 0.6, entityHeight * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Elite aura/glow
  if (isElite) {
    const auraSize = entityHeight * 0.8;
    const auraPulse = enableAnimations ? Math.sin(time * 4) * 0.2 + 0.6 : 0.6;
    const auraGrad = ctx.createRadialGradient(centerX, y + entityHeight * 0.5, 0, centerX, y + entityHeight * 0.5, auraSize);
    auraGrad.addColorStop(0, `rgba(255, 215, 0, ${auraPulse * 0.3})`);
    auraGrad.addColorStop(0.5, `rgba(255, 140, 0, ${auraPulse * 0.15})`);
    auraGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(centerX, y + entityHeight * 0.5, auraSize, 0, Math.PI * 2);
    ctx.fill();
  }

  // Body - darker base layer for depth
  ctx.fillStyle = colors.secondary;
  ctx.beginPath();
  ctx.ellipse(centerX + 2, y + entityHeight * 0.62, entityWidth * 0.42 * breathe, entityHeight * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body - main shape
  const bodyGrad = ctx.createRadialGradient(
    centerX - entityWidth * 0.15, y + entityHeight * 0.5,
    0,
    centerX, y + entityHeight * 0.6,
    entityWidth * 0.5
  );
  bodyGrad.addColorStop(0, colors.accent);
  bodyGrad.addColorStop(0.5, colors.primary);
  bodyGrad.addColorStop(1, colors.secondary);
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(centerX + sway * 0.3, y + entityHeight * 0.6, entityWidth * 0.4 * breathe, entityHeight * 0.36, 0, 0, Math.PI * 2);
  ctx.fill();

  // Arms/appendages
  ctx.fillStyle = colors.primary;
  ctx.beginPath();
  ctx.ellipse(centerX - entityWidth * 0.45, y + entityHeight * 0.55, entityWidth * 0.12, entityHeight * 0.2, -0.3 + sway * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(centerX + entityWidth * 0.45, y + entityHeight * 0.55, entityWidth * 0.12, entityHeight * 0.2, 0.3 - sway * 0.05, 0, Math.PI * 2);
  ctx.fill();

  // Head - shadow
  ctx.fillStyle = colors.secondary;
  ctx.beginPath();
  ctx.arc(centerX + 2 + sway * 0.5, y + entityHeight * 0.27, entityWidth * 0.32, 0, Math.PI * 2);
  ctx.fill();

  // Head - main
  const headGrad = ctx.createRadialGradient(
    centerX - entityWidth * 0.1, y + entityHeight * 0.2,
    0,
    centerX + sway * 0.5, y + entityHeight * 0.25,
    entityWidth * 0.35
  );
  headGrad.addColorStop(0, colors.accent);
  headGrad.addColorStop(0.6, colors.primary);
  headGrad.addColorStop(1, colors.secondary);
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.arc(centerX + sway * 0.5, y + entityHeight * 0.25, entityWidth * 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  drawEyes(ctx, centerX, y, entityWidth, entityHeight, sway, colors.eye, time, enableAnimations);

  // Elite crown
  if (isElite) {
    drawCrown(ctx, centerX, y, entityWidth, entityHeight, scale);
  }

  // Mouth/teeth for close enemies
  if (distance <= 3) {
    drawMouth(ctx, centerX, y, entityWidth, entityHeight, sway);
  }

  // Health bar
  if (distance <= 5 && health !== undefined && maxHealth !== undefined) {
    drawHealthBar(ctx, centerX, y, entityWidth, entityHeight, scale, health, maxHealth, colors.secondary);
  }

  // Name label
  if (distance <= 3) {
    drawNameLabel(ctx, centerX, y, entityWidth, scale, name, isElite);
  }

  // Distance fog overlay
  if (fogAlpha > 0) {
    ctx.fillStyle = `rgba(10, 10, 20, ${fogAlpha * 0.5})`;
    ctx.beginPath();
    ctx.ellipse(centerX, y + entityHeight * 0.5, entityWidth * 0.6, entityHeight * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEyes(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  y: number,
  entityWidth: number,
  entityHeight: number,
  sway: number,
  eyeColor: string,
  time: number,
  enableAnimations: boolean
): void {
  const eyeGlow = enableAnimations ? Math.sin(time * 5) * 0.3 + 0.7 : 1;
  const eyeY = y + entityHeight * 0.23;
  const eyeSpacing = entityWidth * 0.15;
  const eyeSize = entityWidth * 0.1;

  // Eye glow
  const eyeGlowGrad = ctx.createRadialGradient(centerX, eyeY, 0, centerX, eyeY, eyeSize * 3);
  eyeGlowGrad.addColorStop(0, `rgba(255, 100, 100, ${0.3 * eyeGlow})`);
  eyeGlowGrad.addColorStop(1, 'rgba(255, 100, 100, 0)');
  ctx.fillStyle = eyeGlowGrad;
  ctx.fillRect(centerX - eyeSize * 3, eyeY - eyeSize * 2, eyeSize * 6, eyeSize * 4);

  // Eyes
  ctx.fillStyle = eyeColor;
  ctx.shadowColor = eyeColor;
  ctx.shadowBlur = 8 * eyeGlow;
  ctx.beginPath();
  ctx.ellipse(centerX - eyeSpacing + sway * 0.3, eyeY, eyeSize, eyeSize * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(centerX + eyeSpacing + sway * 0.3, eyeY, eyeSize, eyeSize * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Pupils
  ctx.fillStyle = '#000';
  const pupilOffset = Math.sin(time * 0.5) * eyeSize * 0.2;
  ctx.beginPath();
  ctx.arc(centerX - eyeSpacing + pupilOffset + sway * 0.3, eyeY, eyeSize * 0.4, 0, Math.PI * 2);
  ctx.arc(centerX + eyeSpacing + pupilOffset + sway * 0.3, eyeY, eyeSize * 0.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawCrown(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  y: number,
  entityWidth: number,
  entityHeight: number,
  scale: number
): void {
  const crownY = y + entityHeight * 0.02;
  const crownWidth = entityWidth * 0.4;
  const crownHeight = entityHeight * 0.12;

  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur = 10 * scale;

  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.moveTo(centerX - crownWidth, crownY + crownHeight);
  ctx.lineTo(centerX - crownWidth * 0.8, crownY);
  ctx.lineTo(centerX - crownWidth * 0.4, crownY + crownHeight * 0.5);
  ctx.lineTo(centerX, crownY - crownHeight * 0.3);
  ctx.lineTo(centerX + crownWidth * 0.4, crownY + crownHeight * 0.5);
  ctx.lineTo(centerX + crownWidth * 0.8, crownY);
  ctx.lineTo(centerX + crownWidth, crownY + crownHeight);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ff1744';
  ctx.beginPath();
  ctx.arc(centerX, crownY + crownHeight * 0.3, crownHeight * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawMouth(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  y: number,
  entityWidth: number,
  entityHeight: number,
  sway: number
): void {
  const mouthY = y + entityHeight * 0.32;
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.ellipse(centerX + sway * 0.3, mouthY, entityWidth * 0.15, entityHeight * 0.04, 0, 0, Math.PI);
  ctx.fill();

  // Teeth
  ctx.fillStyle = '#fff';
  const teethCount = 4;
  const teethWidth = entityWidth * 0.06;
  for (let i = 0; i < teethCount; i++) {
    const tx = centerX - entityWidth * 0.1 + i * teethWidth + sway * 0.3;
    ctx.beginPath();
    ctx.moveTo(tx, mouthY - entityHeight * 0.015);
    ctx.lineTo(tx + teethWidth * 0.5, mouthY + entityHeight * 0.025);
    ctx.lineTo(tx + teethWidth, mouthY - entityHeight * 0.015);
    ctx.fill();
  }
}

function drawHealthBar(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  y: number,
  entityWidth: number,
  _entityHeight: number,
  scale: number,
  health: number,
  maxHealth: number,
  secondaryColor: string
): void {
  const barWidth = entityWidth * 1.2;
  const barHeight = 8 * scale;
  const barX = centerX - barWidth / 2;
  const barY = y - barHeight - 10 * scale;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

  const healthPercent = health / maxHealth;
  const healthColor = healthPercent > 0.5 ? '#50fa7b' : healthPercent > 0.25 ? '#ffb86c' : '#ff5555';
  const healthGrad = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
  healthGrad.addColorStop(0, healthColor);
  healthGrad.addColorStop(1, secondaryColor);
  ctx.fillStyle = healthGrad;
  ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight * 0.4);

  ctx.strokeStyle = healthColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barWidth, barHeight);
}

function drawNameLabel(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  y: number,
  entityWidth: number,
  scale: number,
  name: string,
  isElite: boolean
): void {
  const labelY = y - 25 * scale;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(centerX - entityWidth * 0.8, labelY - 10, entityWidth * 1.6, 16);

  ctx.fillStyle = isElite ? '#ffd700' : '#fff';
  ctx.font = `bold ${Math.floor(11 * scale)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isElite ? `★ ${name}` : name, centerX, labelY - 2);
}
