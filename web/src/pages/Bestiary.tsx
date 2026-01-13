/**
 * Bestiary Page - Creature and enemy database
 *
 * Features:
 * - Creature categories (Common, Elite, Mini-Boss, Boss, Unique)
 * - Detailed stat displays
 * - Abilities and loot information
 * - Search and filter functionality
 * - Threat level indicators
 */

import { useState, useEffect, useCallback } from 'react';
import './Bestiary.css';

const API_BASE = 'http://localhost:8000/api/bestiary';

interface Ability {
  name: string;
  description: string;
  damage?: number;
  effect?: string;
}

interface LootDrop {
  item: string;
  chance: string;
}

interface Creature {
  id: string;
  name: string;
  title?: string;
  category: string;
  description: string;
  appearance: string;
  behavior: string;
  floors: string;
  health: number;
  damage: number;
  speed: string;
  abilities: Ability[];
  weaknesses: string[];
  resistances: string[];
  experience: number;
  loot: LootDrop[];
  icon: string;
  threat_level: number;
}

interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  count: number;
}

const SPEED_COLORS: Record<string, string> = {
  'Slow': '#6b7280',
  'Normal': '#22c55e',
  'Fast': '#f59e0b',
  'Very Fast': '#ef4444',
};

const CATEGORY_COLORS: Record<string, string> = {
  common: '#6b7280',
  elite: '#3b82f6',
  miniboss: '#a855f7',
  boss: '#f59e0b',
  unique: '#22c55e',
};

export function Bestiary() {
  const [creatures, setCreatures] = useState<Creature[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCreature, setSelectedCreature] = useState<Creature | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all creatures
  const fetchCreatures = useCallback(async () => {
    try {
      const res = await fetch(API_BASE);
      if (res.ok) {
        const data = await res.json();
        setCreatures(data.creatures);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCreatures(), fetchCategories()]);
      setLoading(false);
    };
    loadData();
  }, [fetchCreatures, fetchCategories]);

  // Filter creatures
  const filteredCreatures = creatures.filter((creature) => {
    if (selectedCategory && creature.category !== selectedCategory) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !creature.name.toLowerCase().includes(query) &&
        !creature.description.toLowerCase().includes(query) &&
        !(creature.title && creature.title.toLowerCase().includes(query))
      ) {
        return false;
      }
    }
    return true;
  });

  // Render threat skulls
  const renderThreat = (level: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`skull ${i < level ? 'active' : ''}`}>
        💀
      </span>
    ));
  };

  // Render stat bar
  const renderStatBar = (value: number, max: number, color: string) => {
    const percent = Math.min((value / max) * 100, 100);
    return (
      <div className="stat-bar">
        <div
          className="stat-bar-fill"
          style={{ width: `${percent}%`, background: color }}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bestiary-page">
        <div className="bestiary-loading">
          <div className="loading-spinner" />
          <p>Consulting the archives...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bestiary-page">
      {/* Header */}
      <header className="bestiary-header">
        <div className="header-content">
          <h1>Bestiary</h1>
          <p className="header-subtitle">Creatures of the Sunken Citadel</p>
        </div>
        <div className="header-search">
          <input
            type="text"
            placeholder="Search creatures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </header>

      {/* Category Filter */}
      <div className="category-filter">
        <button
          className={`category-btn ${selectedCategory === null ? 'active' : ''}`}
          onClick={() => setSelectedCategory(null)}
        >
          All ({creatures.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
            style={{
              '--cat-color': cat.color,
            } as React.CSSProperties}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.name} ({cat.count})
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="bestiary-content">
        {/* Creature List */}
        <div className="creature-list">
          {filteredCreatures.length === 0 ? (
            <div className="no-creatures">
              <p>No creatures found</p>
            </div>
          ) : (
            filteredCreatures.map((creature) => (
              <button
                key={creature.id}
                className={`creature-card ${selectedCreature?.id === creature.id ? 'selected' : ''}`}
                onClick={() => setSelectedCreature(creature)}
                style={{
                  '--card-color': CATEGORY_COLORS[creature.category],
                } as React.CSSProperties}
              >
                <div className="creature-card-header">
                  <span className="creature-icon">{creature.icon}</span>
                  <div className="creature-info">
                    <h3>{creature.name}</h3>
                    {creature.title && <p className="creature-title">{creature.title}</p>}
                  </div>
                  <div className="creature-threat">
                    {renderThreat(creature.threat_level)}
                  </div>
                </div>
                <div className="creature-card-stats">
                  <span className="stat">
                    <span className="stat-icon">❤️</span>
                    {creature.health}
                  </span>
                  <span className="stat">
                    <span className="stat-icon">⚔️</span>
                    {creature.damage}
                  </span>
                  <span className="stat floors">
                    <span className="stat-icon">🏛️</span>
                    {creature.floors}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Creature Detail */}
        <div className="creature-detail">
          {selectedCreature ? (
            <article className="creature-article">
              {/* Header */}
              <header className="article-header">
                <div className="header-top">
                  <span
                    className="category-badge"
                    style={{ background: CATEGORY_COLORS[selectedCreature.category] }}
                  >
                    {categories.find((c) => c.id === selectedCreature.category)?.name}
                  </span>
                  <div className="threat-display">
                    {renderThreat(selectedCreature.threat_level)}
                  </div>
                </div>
                <div className="header-main">
                  <span className="creature-icon-large">{selectedCreature.icon}</span>
                  <div>
                    <h1>{selectedCreature.name}</h1>
                    {selectedCreature.title && (
                      <p className="creature-title-large">{selectedCreature.title}</p>
                    )}
                  </div>
                </div>
              </header>

              {/* Stats */}
              <section className="stats-section">
                <h2>Statistics</h2>
                <div className="stats-grid">
                  <div className="stat-row">
                    <span className="stat-label">Health</span>
                    <span className="stat-value">{selectedCreature.health}</span>
                    {renderStatBar(selectedCreature.health, 1200, '#ef4444')}
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Damage</span>
                    <span className="stat-value">{selectedCreature.damage}</span>
                    {renderStatBar(selectedCreature.damage, 50, '#f59e0b')}
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Speed</span>
                    <span
                      className="stat-value speed"
                      style={{ color: SPEED_COLORS[selectedCreature.speed] }}
                    >
                      {selectedCreature.speed}
                    </span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Experience</span>
                    <span className="stat-value xp">{selectedCreature.experience} XP</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Floors</span>
                    <span className="stat-value">{selectedCreature.floors}</span>
                  </div>
                </div>
              </section>

              {/* Description */}
              <section className="description-section">
                <h2>Description</h2>
                <p>{selectedCreature.description}</p>
              </section>

              {/* Appearance & Behavior */}
              <section className="info-section">
                <div className="info-block">
                  <h3>Appearance</h3>
                  <p>{selectedCreature.appearance}</p>
                </div>
                <div className="info-block">
                  <h3>Behavior</h3>
                  <p>{selectedCreature.behavior}</p>
                </div>
              </section>

              {/* Abilities */}
              <section className="abilities-section">
                <h2>Abilities</h2>
                <div className="abilities-list">
                  {selectedCreature.abilities.map((ability, idx) => (
                    <div key={idx} className="ability-card">
                      <div className="ability-header">
                        <h4>{ability.name}</h4>
                        {ability.damage && (
                          <span className="ability-damage">{ability.damage} dmg</span>
                        )}
                      </div>
                      <p className="ability-description">{ability.description}</p>
                      {ability.effect && (
                        <p className="ability-effect">Effect: {ability.effect}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Weaknesses & Resistances */}
              <section className="combat-section">
                <div className="combat-block">
                  <h3>Weaknesses</h3>
                  <div className="tag-list">
                    {selectedCreature.weaknesses.length > 0 ? (
                      selectedCreature.weaknesses.map((w, idx) => (
                        <span key={idx} className="tag weakness">{w}</span>
                      ))
                    ) : (
                      <span className="no-data">None known</span>
                    )}
                  </div>
                </div>
                <div className="combat-block">
                  <h3>Resistances</h3>
                  <div className="tag-list">
                    {selectedCreature.resistances.length > 0 ? (
                      selectedCreature.resistances.map((r, idx) => (
                        <span key={idx} className="tag resistance">{r}</span>
                      ))
                    ) : (
                      <span className="no-data">None</span>
                    )}
                  </div>
                </div>
              </section>

              {/* Loot */}
              {selectedCreature.loot.length > 0 && (
                <section className="loot-section">
                  <h2>Loot Drops</h2>
                  <div className="loot-list">
                    {selectedCreature.loot.map((drop, idx) => (
                      <div key={idx} className={`loot-item ${drop.chance.toLowerCase().replace(' ', '-')}`}>
                        <span className="loot-name">{drop.item}</span>
                        <span className="loot-chance">{drop.chance}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </article>
          ) : (
            <div className="no-creature-selected">
              <div className="placeholder-icon">📖</div>
              <p>Select a creature to view details</p>
              <p className="placeholder-hint">
                Choose from the list on the left to learn about the denizens of the Citadel
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Bestiary;
