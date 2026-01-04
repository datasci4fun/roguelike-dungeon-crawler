/**
 * Draw item entities in first-person view
 */
import { getItemStyle } from './entityColors';

interface DrawItemParams {
  ctx: CanvasRenderingContext2D;
  centerX: number;
  baseY: number;
  entityWidth: number;
  entityHeight: number;
  scale: number;
  name: string;
  symbol: string;
  distance: number;
  time: number;
  enableAnimations: boolean;
  fogAlpha: number;
}

export function drawItem(params: DrawItemParams): void {
  const {
    ctx, centerX, baseY, entityWidth, entityHeight, scale,
    name, symbol, distance, time, enableAnimations, fogAlpha
  } = params;

  const itemStyle = getItemStyle(symbol, name);
  const itemY = baseY - entityHeight * 0.5;

  // Floating animation
  const floatY = enableAnimations ? Math.sin(time * 3) * 5 * scale : 0;

  // Ground shadow
  const shadowScale = 1 - floatY / (20 * scale);
  ctx.fillStyle = `rgba(0, 0, 0, ${0.3 * shadowScale})`;
  ctx.beginPath();
  ctx.ellipse(centerX, baseY + 5, entityWidth * 0.4 * shadowScale, entityHeight * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  // Item glow
  const glowPulse = enableAnimations ? Math.sin(time * 4) * 0.3 + 0.7 : 0.7;
  const glowGrad = ctx.createRadialGradient(centerX, itemY - floatY, 0, centerX, itemY - floatY, entityWidth * 0.8);
  glowGrad.addColorStop(0, itemStyle.glowColor.replace('0.5', String(0.4 * glowPulse)));
  glowGrad.addColorStop(0.5, itemStyle.glowColor.replace('0.5', String(0.15 * glowPulse)));
  glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(centerX, itemY - floatY, entityWidth * 0.8, 0, Math.PI * 2);
  ctx.fill();

  // Draw item based on shape
  switch (itemStyle.shape) {
    case 'potion':
      drawPotion(ctx, centerX, itemY - floatY, entityWidth, entityHeight, itemStyle.color, time, enableAnimations);
      break;
    case 'scroll':
      drawScroll(ctx, centerX, itemY - floatY, entityWidth, entityHeight, itemStyle.color, time, enableAnimations);
      break;
    case 'weapon':
      drawWeapon(ctx, centerX, itemY - floatY, entityWidth, entityHeight);
      break;
    case 'gold':
      drawGold(ctx, centerX, itemY - floatY, entityWidth, entityHeight, scale, time, enableAnimations);
      break;
    default:
      drawDefaultItem(ctx, centerX, itemY - floatY, entityWidth, itemStyle.color, symbol, scale, glowPulse);
      break;
  }

  // Sparkle particles
  if (enableAnimations) {
    drawSparkles(ctx, centerX, itemY - floatY, entityWidth, scale, time);
  }

  // Item name on hover/close
  if (distance <= 2) {
    drawItemName(ctx, centerX, itemY - floatY, entityHeight, name, itemStyle.color, scale);
  }

  // Distance fog
  if (fogAlpha > 0) {
    ctx.fillStyle = `rgba(10, 10, 20, ${fogAlpha * 0.4})`;
    ctx.beginPath();
    ctx.arc(centerX, itemY - floatY, entityWidth * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPotion(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  bottleY: number,
  entityWidth: number,
  entityHeight: number,
  color: string,
  time: number,
  enableAnimations: boolean
): void {
  const bottleWidth = entityWidth * 0.35;
  const bottleHeight = entityHeight * 0.4;

  // Bottle body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(centerX - bottleWidth * 0.3, bottleY - bottleHeight * 0.2);
  ctx.quadraticCurveTo(centerX - bottleWidth * 0.5, bottleY, centerX - bottleWidth * 0.4, bottleY + bottleHeight * 0.4);
  ctx.quadraticCurveTo(centerX, bottleY + bottleHeight * 0.5, centerX + bottleWidth * 0.4, bottleY + bottleHeight * 0.4);
  ctx.quadraticCurveTo(centerX + bottleWidth * 0.5, bottleY, centerX + bottleWidth * 0.3, bottleY - bottleHeight * 0.2);
  ctx.closePath();
  ctx.fill();

  // Bottle neck
  ctx.fillStyle = '#666';
  ctx.fillRect(centerX - bottleWidth * 0.15, bottleY - bottleHeight * 0.4, bottleWidth * 0.3, bottleHeight * 0.25);

  // Cork
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(centerX - bottleWidth * 0.12, bottleY - bottleHeight * 0.5, bottleWidth * 0.24, bottleHeight * 0.12);

  // Liquid shine
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.beginPath();
  ctx.ellipse(centerX - bottleWidth * 0.15, bottleY + bottleHeight * 0.1, bottleWidth * 0.1, bottleHeight * 0.15, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Bubbles (animated)
  if (enableAnimations) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (let i = 0; i < 3; i++) {
      const bubbleY = bottleY + bottleHeight * 0.2 - ((time * 30 + i * 20) % 40) * 0.02 * bottleHeight;
      const bubbleX = centerX + Math.sin(time * 2 + i) * bottleWidth * 0.2;
      ctx.beginPath();
      ctx.arc(bubbleX, bubbleY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawScroll(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  scrollY: number,
  entityWidth: number,
  entityHeight: number,
  color: string,
  time: number,
  enableAnimations: boolean
): void {
  const scrollWidth = entityWidth * 0.5;
  const scrollHeight = entityHeight * 0.35;

  // Scroll body
  ctx.fillStyle = color;
  ctx.fillRect(centerX - scrollWidth * 0.4, scrollY - scrollHeight * 0.3, scrollWidth * 0.8, scrollHeight * 0.6);

  // Scroll ends
  ctx.fillStyle = '#d4a574';
  ctx.beginPath();
  ctx.ellipse(centerX - scrollWidth * 0.4, scrollY, scrollWidth * 0.1, scrollHeight * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(centerX + scrollWidth * 0.4, scrollY, scrollWidth * 0.1, scrollHeight * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  // Magic runes (animated glow)
  if (enableAnimations) {
    const runeGlow = Math.sin(time * 3) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(100, 200, 255, ${runeGlow})`;
    ctx.font = `${Math.floor(8)}px serif`;
    ctx.textAlign = 'center';
    ctx.fillText('✧ ⚝ ✧', centerX, scrollY);
  }
}

function drawWeapon(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  swordY: number,
  entityWidth: number,
  entityHeight: number
): void {
  const swordLength = entityHeight * 0.5;

  // Blade
  ctx.fillStyle = '#b0bec5';
  ctx.beginPath();
  ctx.moveTo(centerX, swordY - swordLength * 0.5);
  ctx.lineTo(centerX - entityWidth * 0.08, swordY + swordLength * 0.2);
  ctx.lineTo(centerX + entityWidth * 0.08, swordY + swordLength * 0.2);
  ctx.closePath();
  ctx.fill();

  // Blade shine
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.beginPath();
  ctx.moveTo(centerX, swordY - swordLength * 0.45);
  ctx.lineTo(centerX - entityWidth * 0.02, swordY + swordLength * 0.15);
  ctx.lineTo(centerX + entityWidth * 0.02, swordY + swordLength * 0.15);
  ctx.closePath();
  ctx.fill();

  // Guard
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(centerX - entityWidth * 0.2, swordY + swordLength * 0.15, entityWidth * 0.4, swordLength * 0.08);

  // Handle
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(centerX - entityWidth * 0.06, swordY + swordLength * 0.2, entityWidth * 0.12, swordLength * 0.25);

  // Pommel
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.arc(centerX, swordY + swordLength * 0.48, entityWidth * 0.08, 0, Math.PI * 2);
  ctx.fill();
}

function drawGold(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  coinY: number,
  entityWidth: number,
  _entityHeight: number,
  scale: number,
  time: number,
  enableAnimations: boolean
): void {
  const coinSize = entityWidth * 0.25;

  // Stack of coins
  for (let i = 0; i < 3; i++) {
    const cx = centerX + (i - 1) * coinSize * 0.6;
    const cy = coinY + (2 - i) * coinSize * 0.3;

    // Coin shadow
    ctx.fillStyle = '#b8860b';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 2, coinSize, coinSize * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Coin face
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.ellipse(cx, cy, coinSize, coinSize * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Coin shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(cx - coinSize * 0.2, cy - coinSize * 0.1, coinSize * 0.3, coinSize * 0.15, -0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sparkles
  if (enableAnimations) {
    const sparkleTime = time * 5;
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 4; i++) {
      const sparklePhase = (sparkleTime + i * 1.5) % 6;
      if (sparklePhase < 1) {
        const sx = centerX + Math.cos(i * 1.5) * coinSize * 1.5;
        const sy = coinY + Math.sin(i * 1.5) * coinSize;
        const sparkleSize = (1 - sparklePhase) * 3 * scale;
        ctx.beginPath();
        ctx.arc(sx, sy, sparkleSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawDefaultItem(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  orbY: number,
  entityWidth: number,
  color: string,
  symbol: string,
  scale: number,
  glowPulse: number
): void {
  const orbSize = entityWidth * 0.35;

  // Outer glow
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 15 * scale * glowPulse;
  ctx.beginPath();
  ctx.arc(centerX, orbY, orbSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Inner shine
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.arc(centerX - orbSize * 0.3, orbY - orbSize * 0.3, orbSize * 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Symbol
  ctx.fillStyle = '#000';
  ctx.font = `bold ${Math.floor(14 * scale)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(symbol, centerX, orbY);
}

function drawSparkles(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  itemY: number,
  entityWidth: number,
  scale: number,
  time: number
): void {
  const particleCount = 5;
  for (let i = 0; i < particleCount; i++) {
    const angle = (time * 0.5 + i * (Math.PI * 2 / particleCount)) % (Math.PI * 2);
    const radius = entityWidth * 0.5 + Math.sin(time * 3 + i) * entityWidth * 0.2;
    const px = centerX + Math.cos(angle) * radius;
    const py = itemY + Math.sin(angle) * radius * 0.5;
    const particleAlpha = Math.sin(time * 4 + i * 2) * 0.3 + 0.4;

    ctx.fillStyle = `rgba(255, 255, 255, ${particleAlpha})`;
    ctx.beginPath();
    ctx.arc(px, py, 2 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawItemName(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  itemY: number,
  entityHeight: number,
  name: string,
  color: string,
  scale: number
): void {
  const labelY = itemY - entityHeight * 0.4;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  const textWidth = ctx.measureText(name).width + 10;
  ctx.fillRect(centerX - textWidth / 2, labelY - 8, textWidth, 16);

  ctx.fillStyle = color;
  ctx.font = `${Math.floor(10 * scale)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, centerX, labelY);
}
