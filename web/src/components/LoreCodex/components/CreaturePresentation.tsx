/**
 * CreaturePresentation - Bestiary entry with animated portrait and stats
 */
import { useRef, useEffect, useState } from 'react';
import type { CreatureEntry } from '../types';
import { getEnemyColors } from '../../SceneRenderer/entities/entityColors';

interface CreaturePresentationProps {
  entry: CreatureEntry;
}

export function CreaturePresentation({ entry }: CreaturePresentationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [showContent, setShowContent] = useState(false);

  const { creature_data } = entry;

  // Animate the creature portrait
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset state
    setShowContent(false);
    const contentTimer = setTimeout(() => setShowContent(true), 400);

    const startTime = Date.now();

    function draw() {
      if (!ctx || !canvas) return;

      const time = (Date.now() - startTime) / 1000;

      // Clear canvas
      ctx.fillStyle = '#1a1410';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw creature portrait
      drawCreaturePortrait(ctx, canvas.width, canvas.height, creature_data, time);

      animationRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
      clearTimeout(contentTimer);
    };
  }, [entry.id, creature_data]);

  return (
    <div className="creature-presentation">
      {/* Portrait area */}
      <div className="creature-portrait">
        <canvas
          ref={canvasRef}
          width={280}
          height={240}
          className="creature-canvas"
        />
        {creature_data.is_boss && (
          <div className="boss-badge">BOSS</div>
        )}
      </div>

      {/* Content area */}
      <div className={`creature-content ${showContent ? 'visible' : ''}`}>
        <h3 className="creature-name">
          {creature_data.is_boss && <span className="boss-star">&#9733; </span>}
          {creature_data.name}
        </h3>

        {/* Stats grid */}
        <div className="creature-stats">
          <div className="stat-item">
            <span className="stat-label">HP</span>
            <span className="stat-value hp-value">{creature_data.hp}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">ATK</span>
            <span className="stat-value atk-value">{creature_data.damage}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">XP</span>
            <span className="stat-value xp-value">{creature_data.xp}</span>
          </div>
          {creature_data.level_range && (
            <div className="stat-item">
              <span className="stat-label">Levels</span>
              <span className="stat-value">{creature_data.level_range[0]}-{creature_data.level_range[1]}</span>
            </div>
          )}
        </div>

        {/* Element/Type */}
        {creature_data.element && (
          <div className="creature-element">
            <span className="element-label">Element:</span>
            <span className={`element-value element-${creature_data.element.toLowerCase()}`}>
              {creature_data.element}
            </span>
          </div>
        )}

        {/* Abilities */}
        {creature_data.abilities && creature_data.abilities.length > 0 && (
          <div className="creature-abilities">
            <h4 className="abilities-header">Abilities</h4>
            <ul className="abilities-list">
              {creature_data.abilities.map((ability, idx) => (
                <li key={idx} className="ability-item">
                  {formatAbilityName(ability)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Resistances */}
        {creature_data.resistances && Object.keys(creature_data.resistances).length > 0 && (
          <div className="creature-resistances">
            <h4 className="resistances-header">Resistances</h4>
            <div className="resistances-list">
              {Object.entries(creature_data.resistances).map(([element, value]) => (
                <span key={element} className={`resistance-item resistance-${element}`}>
                  {element}: {value >= 1 ? 'Immune' : `${Math.round(value * 100)}%`}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {creature_data.description && (
          <p className="creature-description">{creature_data.description}</p>
        )}

        {/* First encounter text */}
        <div className="creature-encounter-text">
          <div className="encounter-quote">"</div>
          <p>{creature_data.first_encounter_text}</p>
        </div>
      </div>
    </div>
  );
}

function formatAbilityName(ability: string): string {
  return ability
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function drawCreaturePortrait(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  data: CreatureEntry['creature_data'],
  time: number
): void {
  const colors = getEnemyColors(data.symbol, data.name, data.is_boss);

  // Center position
  const centerX = width / 2;
  const baseY = height * 0.85;
  const entityWidth = width * 0.5;
  const entityHeight = height * 0.65;
  const scale = 1.5;

  // Animation values
  const bobY = Math.sin(time * 2.5) * 6;
  const breathe = 1 + Math.sin(time * 3) * 0.05;
  const sway = Math.sin(time * 1.5) * 3;

  const y = baseY - entityHeight + bobY;

  // Background glow for boss
  if (data.is_boss) {
    const auraSize = entityHeight * 1.2;
    const auraPulse = Math.sin(time * 4) * 0.2 + 0.6;
    const auraGrad = ctx.createRadialGradient(centerX, y + entityHeight * 0.5, 0, centerX, y + entityHeight * 0.5, auraSize);
    auraGrad.addColorStop(0, `rgba(255, 215, 0, ${auraPulse * 0.3})`);
    auraGrad.addColorStop(0.5, `rgba(255, 140, 0, ${auraPulse * 0.15})`);
    auraGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(centerX, y + entityHeight * 0.5, auraSize, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.ellipse(centerX, baseY + 8, entityWidth * 0.5, entityHeight * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body - darker base layer for depth
  ctx.fillStyle = colors.secondary;
  ctx.beginPath();
  ctx.ellipse(centerX + 3, y + entityHeight * 0.62, entityWidth * 0.42 * breathe, entityHeight * 0.38, 0, 0, Math.PI * 2);
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
  ctx.arc(centerX + 3 + sway * 0.5, y + entityHeight * 0.27, entityWidth * 0.32, 0, Math.PI * 2);
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
  const eyeGlow = Math.sin(time * 5) * 0.3 + 0.7;
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
  ctx.fillStyle = colors.eye;
  ctx.shadowColor = colors.eye;
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

  // Boss crown
  if (data.is_boss) {
    const crownY = y + entityHeight * 0.02;
    const crownWidth = entityWidth * 0.4;
    const crownHeight = entityHeight * 0.12;

    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 15 * scale;

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

    // Crown gem
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.arc(centerX, crownY + crownHeight * 0.3, crownHeight * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Mouth with teeth
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

  // Symbol display in corner
  ctx.fillStyle = 'rgba(212, 168, 80, 0.3)';
  ctx.font = 'bold 32px monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(data.symbol, width - 15, 10);
}
