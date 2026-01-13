/**
 * LocationPresentation - Location/biome entry with visual preview and info
 */
import { useState, useEffect, useRef } from 'react';
import type { LocationEntry } from '../types';

interface LocationPresentationProps {
  entry: LocationEntry;
}

// Biome color schemes
const BIOME_COLORS: Record<string, { primary: string; secondary: string; accent: string }> = {
  stone: { primary: '#4a4a4a', secondary: '#2d2d2d', accent: '#6a6a6a' },
  ice: { primary: '#a8d8ea', secondary: '#5eb3d8', accent: '#e8f4f8' },
  forest: { primary: '#2d5a27', secondary: '#1a3a15', accent: '#4a8c42' },
  volcanic: { primary: '#8b2500', secondary: '#4a1400', accent: '#ff6b35' },
  crypt: { primary: '#3a3a4a', secondary: '#1a1a2a', accent: '#5a5a7a' },
  sewer: { primary: '#4a5a4a', secondary: '#2a3a2a', accent: '#6a7a6a' },
  library: { primary: '#5a4a3a', secondary: '#3a2a1a', accent: '#8a7a5a' },
  crystal: { primary: '#6a4a8a', secondary: '#3a2a4a', accent: '#9a7aba' },
};

export function LocationPresentation({ entry }: LocationPresentationProps) {
  const [showContent, setShowContent] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const { location_data } = entry;
  const colors = BIOME_COLORS[location_data.biome_id] || BIOME_COLORS.stone;

  useEffect(() => {
    setShowContent(false);
    const timer = setTimeout(() => setShowContent(true), 300);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const startTime = Date.now();

    function draw() {
      if (!ctx || !canvas) return;
      const time = (Date.now() - startTime) / 1000;
      drawBiomePreview(ctx, canvas.width, canvas.height, colors, location_data.biome_id, time);
      animationRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animationRef.current);
    };
  }, [entry.id, colors, location_data.biome_id]);

  return (
    <div className="location-presentation">
      {/* Biome visual preview */}
      <div className="location-biome-preview">
        <canvas
          ref={canvasRef}
          width={340}
          height={160}
          className="biome-canvas"
        />
        <div className="location-level-badge">
          Level {location_data.level}
        </div>
      </div>

      {/* Content area */}
      <div className={`location-content ${showContent ? 'visible' : ''}`}>
        <h3 className="location-name">{location_data.biome_name}</h3>

        {/* Intro message */}
        <div className="location-intro">
          <p className="intro-text">{location_data.intro_message}</p>
        </div>

        {/* Boss info */}
        {location_data.boss_name && (
          <div className="location-boss">
            <h4 className="boss-header">
              <span className="boss-icon">&#9760;</span>
              Boss Guardian
            </h4>
            <div className="boss-info">
              <span className="boss-symbol">{location_data.boss_symbol}</span>
              <span className="boss-name">{location_data.boss_name}</span>
            </div>
          </div>
        )}

        {/* Creatures found */}
        {location_data.creatures.length > 0 && (
          <div className="location-creatures">
            <h4 className="creatures-header">Creatures Found</h4>
            <div className="creatures-list">
              {location_data.creatures.map((creature, idx) => (
                <span key={idx} className="creature-tag">
                  {creature}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function drawBiomePreview(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: { primary: string; secondary: string; accent: string },
  biomeId: string,
  time: number
): void {
  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, colors.secondary);
  bgGrad.addColorStop(0.5, colors.primary);
  bgGrad.addColorStop(1, colors.secondary);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Biome-specific decorations
  switch (biomeId) {
    case 'ice':
      drawIceBiome(ctx, width, height, colors, time);
      break;
    case 'forest':
      drawForestBiome(ctx, width, height, colors, time);
      break;
    case 'volcanic':
      drawVolcanicBiome(ctx, width, height, colors, time);
      break;
    case 'crypt':
      drawCryptBiome(ctx, width, height, colors, time);
      break;
    case 'library':
      drawLibraryBiome(ctx, width, height, colors, time);
      break;
    case 'crystal':
      drawCrystalBiome(ctx, width, height, colors, time);
      break;
    case 'sewer':
      drawSewerBiome(ctx, width, height, colors, time);
      break;
    default:
      drawStoneBiome(ctx, width, height, colors, time);
  }

  // Atmospheric overlay
  const atmGrad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.7);
  atmGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  atmGrad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
  ctx.fillStyle = atmGrad;
  ctx.fillRect(0, 0, width, height);
}

function drawStoneBiome(ctx: CanvasRenderingContext2D, width: number, height: number, colors: typeof BIOME_COLORS.stone, time: number) {
  // Stone walls
  ctx.fillStyle = colors.accent;
  for (let i = 0; i < 8; i++) {
    const x = (i * width / 7) - 10;
    const h = 40 + Math.sin(i + time * 0.5) * 5;
    ctx.fillRect(x, height - h, 25, h);
  }

  // Torches
  for (let i = 0; i < 3; i++) {
    const x = width * (0.2 + i * 0.3);
    const flicker = Math.sin(time * 8 + i * 2) * 3;
    ctx.fillStyle = '#ff9800';
    ctx.beginPath();
    ctx.arc(x, height * 0.4 + flicker, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 152, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(x, height * 0.4, 20, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawIceBiome(ctx: CanvasRenderingContext2D, width: number, height: number, colors: typeof BIOME_COLORS.ice, time: number) {
  // Icicles
  ctx.fillStyle = colors.accent;
  for (let i = 0; i < 12; i++) {
    const x = (i * width / 11);
    const len = 30 + Math.sin(i * 0.7) * 15;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 8, 0);
    ctx.lineTo(x + 4, len);
    ctx.closePath();
    ctx.fill();
  }

  // Sparkles
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 10; i++) {
    const sparkle = Math.sin(time * 5 + i) * 0.5 + 0.5;
    if (sparkle > 0.7) {
      const sx = (i * width / 9) + Math.sin(i) * 20;
      const sy = height * 0.3 + Math.cos(i * 2) * 30;
      ctx.beginPath();
      ctx.arc(sx, sy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawForestBiome(ctx: CanvasRenderingContext2D, width: number, height: number, colors: typeof BIOME_COLORS.forest, time: number) {
  // Trees/vines
  ctx.fillStyle = colors.accent;
  for (let i = 0; i < 6; i++) {
    const x = (i * width / 5);
    const sway = Math.sin(time + i) * 3;
    ctx.fillRect(x + sway, 0, 8, height * 0.7);
    // Leaves
    ctx.beginPath();
    ctx.arc(x + sway + 4, height * 0.2, 20, 0, Math.PI * 2);
    ctx.fill();
  }

  // Glowing mushrooms
  for (let i = 0; i < 4; i++) {
    const x = width * (0.15 + i * 0.25);
    const glow = Math.sin(time * 2 + i) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(100, 255, 100, ${glow * 0.5})`;
    ctx.beginPath();
    ctx.arc(x, height - 20, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.ellipse(x, height - 25, 10, 6, 0, Math.PI, 0);
    ctx.fill();
  }
}

function drawVolcanicBiome(ctx: CanvasRenderingContext2D, width: number, height: number, colors: typeof BIOME_COLORS.volcanic, time: number) {
  // Lava pools
  ctx.fillStyle = colors.accent;
  for (let i = 0; i < 3; i++) {
    const x = width * (0.2 + i * 0.3);
    const bubble = Math.sin(time * 4 + i * 2);
    ctx.beginPath();
    ctx.ellipse(x, height - 15, 40 + bubble * 5, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Embers
  ctx.fillStyle = '#ffeb3b';
  for (let i = 0; i < 8; i++) {
    const y = (height - 30 - (time * 30 + i * 20) % height);
    const x = width * (0.1 + i * 0.1) + Math.sin(time * 2 + i) * 10;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCryptBiome(ctx: CanvasRenderingContext2D, width: number, height: number, colors: typeof BIOME_COLORS.crypt, time: number) {
  // Tombstones
  ctx.fillStyle = colors.accent;
  for (let i = 0; i < 5; i++) {
    const x = width * (0.1 + i * 0.2);
    ctx.beginPath();
    ctx.moveTo(x, height);
    ctx.lineTo(x, height - 50);
    ctx.arc(x + 15, height - 50, 15, Math.PI, 0);
    ctx.lineTo(x + 30, height);
    ctx.closePath();
    ctx.fill();
  }

  // Ghost wisps
  ctx.fillStyle = 'rgba(200, 200, 255, 0.3)';
  for (let i = 0; i < 3; i++) {
    const x = width * (0.25 + i * 0.25) + Math.sin(time + i) * 20;
    const y = height * 0.4 + Math.cos(time * 0.5 + i) * 15;
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLibraryBiome(ctx: CanvasRenderingContext2D, width: number, height: number, colors: typeof BIOME_COLORS.library, time: number) {
  // Bookshelves
  for (let i = 0; i < 4; i++) {
    const x = (i * width / 3);
    ctx.fillStyle = colors.accent;
    ctx.fillRect(x, height * 0.2, 25, height * 0.8);
    // Books
    const bookColors = ['#c62828', '#1565c0', '#2e7d32', '#6a1b9a'];
    for (let j = 0; j < 8; j++) {
      ctx.fillStyle = bookColors[j % 4];
      ctx.fillRect(x + 2, height * 0.25 + j * 12, 21, 10);
    }
  }

  // Floating candle light
  const flicker = Math.sin(time * 10) * 0.2 + 0.8;
  ctx.fillStyle = `rgba(255, 200, 100, ${flicker * 0.4})`;
  ctx.beginPath();
  ctx.arc(width / 2, height * 0.3, 50, 0, Math.PI * 2);
  ctx.fill();
}

function drawCrystalBiome(ctx: CanvasRenderingContext2D, width: number, height: number, _colors: typeof BIOME_COLORS.crystal, time: number) {
  // Crystals
  for (let i = 0; i < 6; i++) {
    const x = width * (0.1 + i * 0.15);
    const h = 40 + Math.sin(i) * 20;
    const hue = (time * 30 + i * 60) % 360;
    ctx.fillStyle = `hsla(${hue}, 70%, 60%, 0.8)`;
    ctx.beginPath();
    ctx.moveTo(x, height);
    ctx.lineTo(x + 10, height - h);
    ctx.lineTo(x + 20, height);
    ctx.closePath();
    ctx.fill();

    // Crystal glow
    ctx.fillStyle = `hsla(${hue}, 70%, 70%, 0.3)`;
    ctx.beginPath();
    ctx.arc(x + 10, height - h / 2, 25, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSewerBiome(ctx: CanvasRenderingContext2D, width: number, height: number, colors: typeof BIOME_COLORS.sewer, time: number) {
  // Water/sludge
  ctx.fillStyle = '#3a5a3a';
  ctx.fillRect(0, height - 30, width, 30);

  // Ripples
  ctx.strokeStyle = 'rgba(100, 150, 100, 0.5)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const x = width * (0.2 + i * 0.2);
    const r = 10 + Math.sin(time * 2 + i) * 5;
    ctx.beginPath();
    ctx.arc(x, height - 15, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Pipes
  ctx.fillStyle = colors.accent;
  ctx.fillRect(0, height * 0.3, width, 20);
  ctx.fillRect(0, height * 0.6, width, 15);
}
