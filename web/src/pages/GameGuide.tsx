/**
 * Game Guide Page - Comprehensive reference for game mechanics
 *
 * Contains:
 * - Playable Races with stat modifiers and racial traits
 * - Character Classes with abilities
 * - Dungeon Traps and how to avoid them
 * - Environmental Hazards
 * - Status Effects and how they work
 * - Dungeon Biomes and their themes
 * - Element System and weaknesses
 */

import { useState, useEffect, useCallback } from 'react';
import './GameGuide.css';

const API_BASE = 'http://localhost:8000/api/guide';

// Types
interface Race {
  id: string;
  name: string;
  description: string;
  hp_modifier: number;
  atk_modifier: number;
  def_modifier: number;
  trait_name: string;
  trait_description: string;
}

interface PlayerClass {
  id: string;
  name: string;
  description: string;
  hp_modifier: number;
  atk_modifier: number;
  def_modifier: number;
  active_abilities: string[];
  passive_abilities: string[];
}

interface Trap {
  id: string;
  name: string;
  symbol: string;
  damage_min: number;
  damage_max: number;
  cooldown: number;
  effect: string | null;
  detection_dc: number;
}

interface Hazard {
  id: string;
  name: string;
  symbol: string;
  damage_per_turn: number;
  effect: string | null;
  special: string;
}

interface StatusEffect {
  id: string;
  name: string;
  damage_per_turn: number;
  duration: number;
  max_stacks: number;
  stacking: string;
  special: string | null;
  message: string;
}

interface Biome {
  id: string;
  floor: number;
  name: string;
  description: string;
  wall_symbol: string;
  floor_symbol: string;
  boss: string;
  field_aspect: string;
}

interface Element {
  id: string;
  name: string;
  color: string;
  weak_to: string;
  damage_multiplier: number;
}

interface GuideData {
  races: Race[];
  classes: PlayerClass[];
  traps: Trap[];
  hazards: Hazard[];
  status_effects: StatusEffect[];
  biomes: Biome[];
  elements: Element[];
}

type SectionType = 'races' | 'classes' | 'traps' | 'hazards' | 'effects' | 'biomes' | 'elements';

const SECTIONS: { id: SectionType; label: string; icon: string }[] = [
  { id: 'races', label: 'Races', icon: '👤' },
  { id: 'classes', label: 'Classes', icon: '⚔️' },
  { id: 'biomes', label: 'Biomes', icon: '🗺️' },
  { id: 'traps', label: 'Traps', icon: '⚠️' },
  { id: 'hazards', label: 'Hazards', icon: '☠️' },
  { id: 'effects', label: 'Status Effects', icon: '💀' },
  { id: 'elements', label: 'Elements', icon: '✨' },
];

const RACE_ICONS: Record<string, string> = {
  human: '👤',
  elf: '🧝',
  dwarf: '🧔',
  halfling: '🦶',
  orc: '👹',
};

const CLASS_ICONS: Record<string, string> = {
  warrior: '🗡️',
  mage: '🔮',
  rogue: '🗡️',
  cleric: '✝️',
};

const BIOME_COLORS: Record<string, string> = {
  stone_dungeon: '#6b7280',
  sewers: '#84cc16',
  forest_depths: '#22c55e',
  mirror_valdris: '#a855f7',
  ice_cavern: '#22d3ee',
  ancient_library: '#f59e0b',
  volcanic_depths: '#ef4444',
  crystal_cave: '#ec4899',
};

const STATUS_COLORS: Record<string, string> = {
  poison: '#22c55e',
  burn: '#ef4444',
  freeze: '#22d3ee',
  stun: '#fbbf24',
};

const ELEMENT_ICONS: Record<string, string> = {
  fire: '🔥',
  ice: '❄️',
  lightning: '⚡',
  dark: '🌑',
};

export function GameGuide() {
  const [data, setData] = useState<GuideData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionType>('races');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(API_BASE);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Format stat modifier for display
  const formatMod = (value: number) => {
    if (value > 0) return `+${value}`;
    if (value < 0) return `${value}`;
    return '0';
  };

  // Get stat badge class
  const getStatClass = (value: number) => {
    if (value > 0) return 'stat-positive';
    if (value < 0) return 'stat-negative';
    return 'stat-neutral';
  };

  if (loading) {
    return (
      <div className="game-guide-page">
        <div className="guide-loading">
          <div className="loading-spinner" />
          <p>Loading adventurer's guide...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="game-guide-page">
        <div className="guide-loading">
          <p>Failed to load guide data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="game-guide-page">
      {/* Header */}
      <header className="guide-header">
        <h1>Adventurer's Guide</h1>
        <p>Complete reference for the dungeons of Valdris</p>
      </header>

      {/* Section Navigation */}
      <nav className="section-nav">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            className={`section-btn ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => setActiveSection(section.id)}
          >
            <span className="section-icon">{section.icon}</span>
            {section.label}
          </button>
        ))}
      </nav>

      {/* Races Section */}
      {activeSection === 'races' && (
        <section className="guide-section">
          <h2><span>👤</span> Playable Races</h2>
          <p className="section-description">
            Choose your heritage wisely - each race offers unique advantages in the depths of Valdris.
          </p>
          <div className="card-grid">
            {data.races.map((race) => (
              <div key={race.id} className="guide-card">
                <div className="card-header">
                  <span className="card-icon">{RACE_ICONS[race.id] || '👤'}</span>
                  <div>
                    <h3 className="card-title">{race.name}</h3>
                    <p className="card-subtitle">{race.description}</p>
                  </div>
                </div>
                <div className="stat-row">
                  <span className={`stat-badge ${getStatClass(race.hp_modifier)}`}>
                    HP {formatMod(race.hp_modifier)}
                  </span>
                  <span className={`stat-badge ${getStatClass(race.atk_modifier)}`}>
                    ATK {formatMod(race.atk_modifier)}
                  </span>
                  <span className={`stat-badge ${getStatClass(race.def_modifier)}`}>
                    DEF {formatMod(race.def_modifier)}
                  </span>
                </div>
                <div className="trait-box">
                  <p className="trait-name">{race.trait_name}</p>
                  <p className="trait-desc">{race.trait_description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Classes Section */}
      {activeSection === 'classes' && (
        <section className="guide-section">
          <h2><span>⚔️</span> Character Classes</h2>
          <p className="section-description">
            Your calling defines your combat style and the abilities you'll master.
          </p>
          <div className="card-grid">
            {data.classes.map((cls) => (
              <div key={cls.id} className="guide-card">
                <div className="card-header">
                  <span className="card-icon">{CLASS_ICONS[cls.id] || '⚔️'}</span>
                  <div>
                    <h3 className="card-title">{cls.name}</h3>
                    <p className="card-subtitle">{cls.description}</p>
                  </div>
                </div>
                <div className="stat-row">
                  <span className={`stat-badge ${getStatClass(cls.hp_modifier)}`}>
                    HP {formatMod(cls.hp_modifier)}
                  </span>
                  <span className={`stat-badge ${getStatClass(cls.atk_modifier)}`}>
                    ATK {formatMod(cls.atk_modifier)}
                  </span>
                  <span className={`stat-badge ${getStatClass(cls.def_modifier)}`}>
                    DEF {formatMod(cls.def_modifier)}
                  </span>
                </div>
                <div className="ability-list">
                  <div className="ability-group">
                    <span className="ability-label">Active:</span>
                    {cls.active_abilities.map((ability) => (
                      <span key={ability} className="ability-tag">{ability}</span>
                    ))}
                  </div>
                  <div className="ability-group">
                    <span className="ability-label">Passive:</span>
                    {cls.passive_abilities.map((ability) => (
                      <span key={ability} className="ability-tag passive">{ability}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Biomes Section */}
      {activeSection === 'biomes' && (
        <section className="guide-section">
          <h2><span>🗺️</span> Dungeon Biomes</h2>
          <p className="section-description">
            Eight distinct zones, each shaped by an aspect of the Field. Defeat the Warden of each to descend deeper.
          </p>
          <div className="card-grid">
            {data.biomes.map((biome) => (
              <div
                key={biome.id}
                className="guide-card biome-card"
                style={{ '--biome-color': BIOME_COLORS[biome.id] } as React.CSSProperties}
              >
                <div className="card-header">
                  <span className="biome-floor">Floor {biome.floor}</span>
                  <h3 className="card-title">{biome.name}</h3>
                </div>
                <p className="card-description">{biome.description}</p>
                <div className="biome-meta">
                  <div className="biome-meta-item">
                    <span className="biome-meta-label">Boss:</span>
                    <span className="biome-meta-value">{biome.boss}</span>
                  </div>
                  <div className="biome-meta-item">
                    <span className="biome-meta-label">Aspect:</span>
                    <span className="field-aspect">{biome.field_aspect}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Traps Section */}
      {activeSection === 'traps' && (
        <section className="guide-section">
          <h2><span>⚠️</span> Dungeon Traps</h2>
          <p className="section-description">
            Hidden dangers lurk beneath the dungeon floor. A keen eye may spot them before it's too late.
          </p>
          <div className="card-grid">
            {data.traps.map((trap) => (
              <div key={trap.id} className="guide-card">
                <div className="card-header">
                  <span className="danger-symbol">{trap.symbol}</span>
                  <div>
                    <h3 className="card-title">{trap.name}</h3>
                    <p className="card-subtitle">Detection DC: {trap.detection_dc}</p>
                  </div>
                </div>
                <div className="stat-row">
                  <span className="damage-badge">
                    {trap.damage_min === trap.damage_max
                      ? `${trap.damage_min} damage`
                      : `${trap.damage_min}-${trap.damage_max} damage`}
                  </span>
                  {trap.effect && (
                    <span className="effect-badge">+ {trap.effect}</span>
                  )}
                </div>
                <p className="special-text">
                  Resets after {trap.cooldown} turn{trap.cooldown !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Hazards Section */}
      {activeSection === 'hazards' && (
        <section className="guide-section">
          <h2><span>☠️</span> Environmental Hazards</h2>
          <p className="section-description">
            The dungeon itself is hostile. Learn to navigate these dangers or perish.
          </p>
          <div className="card-grid">
            {data.hazards.map((hazard) => (
              <div key={hazard.id} className="guide-card">
                <div className="card-header">
                  <span className="danger-symbol">{hazard.symbol}</span>
                  <div>
                    <h3 className="card-title">{hazard.name}</h3>
                  </div>
                </div>
                <div className="stat-row">
                  {hazard.damage_per_turn > 0 && (
                    <span className="damage-badge">
                      {hazard.damage_per_turn} damage/turn
                    </span>
                  )}
                  {hazard.effect && (
                    <span className="effect-badge">Applies {hazard.effect}</span>
                  )}
                </div>
                <p className="special-text">{hazard.special}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Status Effects Section */}
      {activeSection === 'effects' && (
        <section className="guide-section">
          <h2><span>💀</span> Status Effects</h2>
          <p className="section-description">
            Afflictions that can turn the tide of battle. Know them well.
          </p>
          <div className="card-grid">
            {data.status_effects.map((effect) => (
              <div
                key={effect.id}
                className="guide-card status-card"
                style={{ '--status-color': STATUS_COLORS[effect.id] } as React.CSSProperties}
              >
                <div className="card-header">
                  <h3 className="card-title" style={{ color: STATUS_COLORS[effect.id] }}>
                    {effect.name}
                  </h3>
                </div>
                <div className="stat-row">
                  {effect.damage_per_turn > 0 && (
                    <span className="damage-badge">
                      {effect.damage_per_turn} damage/turn
                    </span>
                  )}
                  <span className="stat-badge stat-info">
                    {effect.duration} turn{effect.duration !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="stacking-info">
                  <span className="stacking-badge">
                    Stacking: {effect.stacking}
                  </span>
                  <span className="stacking-badge">
                    Max: {effect.max_stacks}x
                  </span>
                </div>
                {effect.special && (
                  <p className="special-text">{effect.special}</p>
                )}
                <div
                  className="status-message"
                  style={{ '--status-color': STATUS_COLORS[effect.id] } as React.CSSProperties}
                >
                  "{effect.message}"
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Elements Section */}
      {activeSection === 'elements' && (
        <section className="guide-section">
          <h2><span>✨</span> Element System</h2>
          <p className="section-description">
            Exploit elemental weaknesses to deal devastating damage. Each element is vulnerable to another.
          </p>
          <div className="card-grid">
            {data.elements.map((element) => (
              <div
                key={element.id}
                className="guide-card element-card"
                style={{ '--element-color': element.color } as React.CSSProperties}
              >
                <div className="card-header">
                  <div
                    className="element-icon"
                    style={{ background: element.color }}
                  >
                    {ELEMENT_ICONS[element.id] || '✨'}
                  </div>
                  <h3 className="card-title" style={{ color: element.color }}>
                    {element.name}
                  </h3>
                </div>
                <div className="weakness-info">
                  <span className="weakness-label">Weak to:</span>
                  <span className="weakness-value">{element.weak_to}</span>
                  <span className="multiplier-badge">
                    {element.damage_multiplier}x damage
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default GameGuide;
