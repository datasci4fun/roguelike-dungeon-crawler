/**
 * StatsHUD - Displays player vital statistics in the top-left of the 3D view
 * Shows level, HP bar, XP bar, and combat stats (ATK, DEF, Kills)
 */
import { useMemo } from 'react';
import './StatsHUD.css';

interface StatsHUDProps {
  level: number;
  raceName?: string;
  className?: string;
  health: number;
  maxHealth: number;
  xp: number;
  xpToLevel: number;
  attack: number;
  defense: number;
  kills: number;
  isCompact?: boolean;
}

// Health percentage thresholds for color changes
function getHealthColor(ratio: number): string {
  if (ratio > 0.6) return '#4ade80'; // Green
  if (ratio > 0.3) return '#fbbf24'; // Yellow
  return '#ef4444'; // Red
}

// Health status for low HP warning
function getHealthStatus(ratio: number): 'healthy' | 'wounded' | 'critical' {
  if (ratio > 0.6) return 'healthy';
  if (ratio > 0.25) return 'wounded';
  return 'critical';
}

export function StatsHUD({
  level,
  raceName,
  className,
  health,
  maxHealth,
  xp,
  xpToLevel,
  attack,
  defense,
  kills,
  isCompact = false,
}: StatsHUDProps) {
  const healthRatio = maxHealth > 0 ? health / maxHealth : 0;
  const xpRatio = xpToLevel > 0 ? xp / xpToLevel : 0;
  const healthColor = useMemo(() => getHealthColor(healthRatio), [healthRatio]);
  const healthStatus = useMemo(() => getHealthStatus(healthRatio), [healthRatio]);

  return (
    <div
      className={`stats-hud ${isCompact ? 'compact' : ''} ${healthStatus}`}
      role="region"
      aria-label="Player statistics"
    >
      {/* Level, Race and Class */}
      <div className="stats-level" role="group" aria-label="Character level">
        <span className="level-number">Lv.{level}</span>
        {(raceName || className) && (
          <span className="class-name">
            {raceName}{raceName && className ? ' ' : ''}{className}
          </span>
        )}
      </div>

      {/* HP Bar */}
      <div className="stats-bar hp-bar" role="group" aria-label="Health">
        <span className="bar-label">HP</span>
        <div
          className="bar-container"
          role="progressbar"
          aria-valuenow={health}
          aria-valuemin={0}
          aria-valuemax={maxHealth}
          aria-label={`Health: ${health} of ${maxHealth}`}
        >
          <div
            className="bar-fill hp-fill"
            style={{
              width: `${healthRatio * 100}%`,
              backgroundColor: healthColor,
            }}
          />
          <div className="bar-glow" style={{ backgroundColor: healthColor }} />
        </div>
        <span className="bar-text">{health}/{maxHealth}</span>
      </div>

      {/* XP Bar */}
      <div className="stats-bar xp-bar" role="group" aria-label="Experience">
        <span className="bar-label">XP</span>
        <div
          className="bar-container"
          role="progressbar"
          aria-valuenow={xp}
          aria-valuemin={0}
          aria-valuemax={xpToLevel}
          aria-label={`Experience: ${xp} of ${xpToLevel}`}
        >
          <div
            className="bar-fill xp-fill"
            style={{ width: `${xpRatio * 100}%` }}
          />
        </div>
        <span className="bar-text">{xp}/{xpToLevel}</span>
      </div>

      {/* Combat Stats */}
      <div className="stats-combat" role="group" aria-label="Combat statistics">
        <div className="stat-item" title="Attack Power">
          <span className="stat-icon" aria-hidden="true">⚔</span>
          <span className="stat-value">{attack}</span>
        </div>
        <div className="stat-item" title="Defense">
          <span className="stat-icon" aria-hidden="true">🛡</span>
          <span className="stat-value">{defense}</span>
        </div>
        <div className="stat-item" title="Enemies Defeated">
          <span className="stat-icon" aria-hidden="true">💀</span>
          <span className="stat-value">{kills}</span>
        </div>
      </div>
    </div>
  );
}
