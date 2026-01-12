/**
 * CharacterHUD - Overlay for first-person view showing race, class, and abilities
 */
import { useCallback } from 'react';
import type { PlayerRace, PlayerClass, PlayerAbility, PlayerPassive } from '../hooks/useGameSocket';
import './CharacterHUD.css';

interface CharacterHUDProps {
  race?: PlayerRace;
  playerClass?: PlayerClass;
  abilities?: PlayerAbility[];
  passives?: PlayerPassive[];
  health?: number;
  maxHealth?: number;
  showAbilities?: boolean;
  compact?: boolean;
}

// Race visual symbols/colors
const RACE_VISUALS: Record<string, { symbol: string; color: string; bgColor: string }> = {
  HUMAN: { symbol: 'H', color: '#ffd700', bgColor: '#4a3a1a' },
  ELF: { symbol: 'E', color: '#4ade80', bgColor: '#1a3a2a' },
  DWARF: { symbol: 'D', color: '#f97316', bgColor: '#3a2a1a' },
  HALFLING: { symbol: 'h', color: '#fbbf24', bgColor: '#3a3a1a' },
  ORC: { symbol: 'O', color: '#ef4444', bgColor: '#3a1a1a' },
};

// Class visual symbols/colors
const CLASS_VISUALS: Record<string, { symbol: string; color: string; bgColor: string }> = {
  WARRIOR: { symbol: 'W', color: '#ef4444', bgColor: '#3a1a1a' },
  MAGE: { symbol: 'M', color: '#8b5cf6', bgColor: '#2a1a3a' },
  ROGUE: { symbol: 'R', color: '#22d3ee', bgColor: '#1a2a3a' },
};

// Ability icons
const ABILITY_ICONS: Record<string, string> = {
  power_strike: '/\\',
  shield_wall: '[]',
  fireball: '**',
  frost_nova: '~~',
  backstab: '><',
  smoke_bomb: '@@',
};

export function CharacterHUD({
  race,
  playerClass,
  abilities = [],
  passives = [],
  health,
  maxHealth,
  showAbilities = true,
  compact = false,
}: CharacterHUDProps) {
  const raceVisual = race ? RACE_VISUALS[race.id] || RACE_VISUALS.HUMAN : null;
  const classVisual = playerClass ? CLASS_VISUALS[playerClass.id] || CLASS_VISUALS.WARRIOR : null;

  const getHealthColor = useCallback(() => {
    if (!health || !maxHealth) return '#4ade80';
    const ratio = health / maxHealth;
    if (ratio > 0.6) return '#4ade80';
    if (ratio > 0.3) return '#fbbf24';
    return '#ef4444';
  }, [health, maxHealth]);

  if (!race && !playerClass) {
    return null;
  }

  return (
    <div
      className={`character-hud ${compact ? 'compact' : ''}`}
      role="region"
      aria-label="Character status"
    >
      {/* Race/Class Badges */}
      <div className="hud-identity" role="group" aria-label="Character identity">
        {raceVisual && (
          <div
            className="hud-badge race-badge"
            style={{ backgroundColor: raceVisual.bgColor, borderColor: raceVisual.color }}
            title={`${race?.name} - ${race?.trait_name}: ${race?.trait_description}`}
            role="img"
            aria-label={`Race: ${race?.name}. Trait: ${race?.trait_name}, ${race?.trait_description}`}
          >
            <span className="badge-symbol" style={{ color: raceVisual.color }} aria-hidden="true">
              {raceVisual.symbol}
            </span>
          </div>
        )}
        {classVisual && (
          <div
            className="hud-badge class-badge"
            style={{ backgroundColor: classVisual.bgColor, borderColor: classVisual.color }}
            title={`${playerClass?.name} - ${playerClass?.description}`}
            role="img"
            aria-label={`Class: ${playerClass?.name}. ${playerClass?.description}`}
          >
            <span className="badge-symbol" style={{ color: classVisual.color }} aria-hidden="true">
              {classVisual.symbol}
            </span>
          </div>
        )}
      </div>

      {/* Character Name */}
      {!compact && (
        <div className="hud-name">
          {race?.name} {playerClass?.name}
        </div>
      )}

      {/* Trait Indicator */}
      {race?.trait_name && !compact && (
        <div className="hud-trait" title={race.trait_description}>
          <span className="trait-icon" style={{ color: raceVisual?.color }}>*</span>
          <span className="trait-name">{race.trait_name}</span>
        </div>
      )}

      {/* Health Bar */}
      {health !== undefined && maxHealth !== undefined && (
        <div className="hud-health" role="group" aria-label="Health">
          <div
            className="health-bar-container"
            role="progressbar"
            aria-valuenow={health}
            aria-valuemin={0}
            aria-valuemax={maxHealth}
            aria-label={`Health: ${health} of ${maxHealth}`}
          >
            <div
              className="health-bar-fill"
              style={{
                width: `${(health / maxHealth) * 100}%`,
                backgroundColor: getHealthColor(),
              }}
              aria-hidden="true"
            />
          </div>
          {!compact && (
            <span className="health-text" aria-hidden="true">
              {health}/{maxHealth}
            </span>
          )}
        </div>
      )}

      {/* Abilities */}
      {showAbilities && abilities.length > 0 && (
        <div className="hud-abilities" role="group" aria-label="Abilities">
          {abilities.map((ability) => {
            const icon = ABILITY_ICONS[ability.id] || '??';
            const isReady = ability.is_ready;
            const cooldown = ability.cooldown_remaining;

            return (
              <div
                key={ability.id}
                className={`ability-slot ${isReady ? 'ready' : 'on-cooldown'}`}
                title={`${ability.name}: ${ability.description}`}
                role="img"
                aria-label={`${ability.name}: ${ability.description}. ${isReady ? 'Ready' : `Cooldown: ${cooldown} turns`}`}
              >
                <span className="ability-icon" aria-hidden="true">{icon}</span>
                {!isReady && <span className="cooldown-number" aria-hidden="true">{cooldown}</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Passive Indicator */}
      {passives.length > 0 && !compact && (
        <div className="hud-passives" role="group" aria-label="Passive abilities">
          {passives.map((passive) => (
            <div
              key={passive.id}
              className="passive-indicator"
              title={passive.description}
              role="img"
              aria-label={`Passive: ${passive.name}. ${passive.description}`}
            >
              <span className="passive-icon" aria-hidden="true">[P]</span>
              <span className="passive-name">{passive.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
