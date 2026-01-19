/**
 * Character Guide Page - Player races and classes database
 *
 * Layout: Left panel for race/class selection, right panel for character sheet
 */

import { useState, useEffect, useCallback, Suspense } from 'react';
import './CharacterGuide.css';
import { createPlayerCharacter } from '../models';
import { ProceduralModelViewer } from '../components/ProceduralModelViewer';
import type { RaceId, ClassId } from '../types';

const API_BASE = 'http://localhost:8000/api/character-guide';

interface StatModifier {
  health: number;
  attack: number;
  defense: number;
}

interface RacialTrait {
  name: string;
  description: string;
  effect: string;
}

interface ClassAbility {
  name: string;
  description: string;
  ability_type: string;
  damage?: number;
  effect?: string;
  cooldown?: number;
}

interface Race {
  id: string;
  name: string;
  description: string;
  appearance: string;
  lore: string;
  stat_modifiers: StatModifier;
  base_height: number;
  racial_trait: RacialTrait;
  icon: string;
  skin_color: string;
  eye_color: string;
}

interface PlayerClass {
  id: string;
  name: string;
  description: string;
  playstyle: string;
  lore: string;
  stat_modifiers: StatModifier;
  abilities: ClassAbility[];
  starting_equipment: string;
  equipment_type: string;
  icon: string;
  primary_color: string;
  secondary_color: string;
  glow_color: string;
}

interface RaceClassCombination {
  race_id: string;
  class_id: string;
  display_name: string;
  combined_stats: StatModifier;
  synergy_notes?: string;
}

const STAT_COLORS = {
  positive: '#22c55e',
  negative: '#ef4444',
  neutral: '#6b7280',
};

const BASE_STATS = {
  health: 100,
  attack: 10,
  defense: 5,
};

export function CharacterGuide() {
  const [races, setRaces] = useState<Race[]>([]);
  const [classes, setClasses] = useState<PlayerClass[]>([]);
  const [combinations, setCombinations] = useState<RaceClassCombination[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [selectedClass, setSelectedClass] = useState<PlayerClass | null>(null);
  const [expandedRace, setExpandedRace] = useState<string | null>(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(API_BASE);
      if (res.ok) {
        const data = await res.json();
        setRaces(data.races);
        setClasses(data.classes);
        setCombinations(data.combinations);
        // Auto-select first race and class
        if (data.races.length > 0 && data.classes.length > 0) {
          setSelectedRace(data.races[0]);
          setSelectedClass(data.classes[0]);
          setExpandedRace(data.races[0].id);
        }
      }
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    loadData();
  }, [fetchData]);

  // Get combination data
  const currentCombination = selectedRace && selectedClass
    ? combinations.find(c => c.race_id === selectedRace.id && c.class_id === selectedClass.id)
    : null;

  // Calculate stats
  const combinedStats = selectedRace && selectedClass ? {
    health: BASE_STATS.health + selectedRace.stat_modifiers.health + selectedClass.stat_modifiers.health,
    attack: BASE_STATS.attack + selectedRace.stat_modifiers.attack + selectedClass.stat_modifiers.attack,
    defense: BASE_STATS.defense + selectedRace.stat_modifiers.defense + selectedClass.stat_modifiers.defense,
  } : null;

  const totalModifiers = selectedRace && selectedClass ? {
    health: selectedRace.stat_modifiers.health + selectedClass.stat_modifiers.health,
    attack: selectedRace.stat_modifiers.attack + selectedClass.stat_modifiers.attack,
    defense: selectedRace.stat_modifiers.defense + selectedClass.stat_modifiers.defense,
  } : null;

  const handleRaceClick = (race: Race) => {
    if (expandedRace === race.id) {
      // Already expanded, just select
      setSelectedRace(race);
    } else {
      // Expand and select
      setExpandedRace(race.id);
      setSelectedRace(race);
    }
  };

  const handleClassClick = (cls: PlayerClass) => {
    setSelectedClass(cls);
  };

  if (loading) {
    return (
      <div className="character-guide">
        <div className="cg-loading">Loading Character Guide...</div>
      </div>
    );
  }

  return (
    <div className="character-guide">
      <div className="cg-layout">
        {/* Left Panel - Selection Tree */}
        <div className="cg-left-panel">
          <h2>Select Character</h2>
          <div className="cg-tree">
            {races.map((race) => (
              <div key={race.id} className="cg-race-group">
                <div
                  className={`cg-race-item ${selectedRace?.id === race.id ? 'selected' : ''}`}
                  onClick={() => handleRaceClick(race)}
                >
                  <span className="cg-expand-icon">
                    {expandedRace === race.id ? '▼' : '▶'}
                  </span>
                  <span className="cg-race-icon">{race.icon}</span>
                  <span className="cg-race-name">{race.name}</span>
                  <span className="cg-race-stats">
                    <span style={{ color: race.stat_modifiers.health >= 0 ? STAT_COLORS.positive : STAT_COLORS.negative }}>
                      {race.stat_modifiers.health >= 0 ? '+' : ''}{race.stat_modifiers.health}
                    </span>
                    /
                    <span style={{ color: race.stat_modifiers.attack >= 0 ? STAT_COLORS.positive : STAT_COLORS.negative }}>
                      {race.stat_modifiers.attack >= 0 ? '+' : ''}{race.stat_modifiers.attack}
                    </span>
                    /
                    <span style={{ color: race.stat_modifiers.defense >= 0 ? STAT_COLORS.positive : STAT_COLORS.negative }}>
                      {race.stat_modifiers.defense >= 0 ? '+' : ''}{race.stat_modifiers.defense}
                    </span>
                  </span>
                </div>
                {expandedRace === race.id && (
                  <div className="cg-class-list">
                    {classes.map((cls) => (
                      <div
                        key={cls.id}
                        className={`cg-class-item ${selectedRace?.id === race.id && selectedClass?.id === cls.id ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedRace(race);
                          handleClassClick(cls);
                        }}
                        style={{ borderLeftColor: cls.primary_color }}
                      >
                        <span className="cg-class-icon">{cls.icon}</span>
                        <span className="cg-class-name">{cls.name}</span>
                        <span className="cg-class-stats">
                          <span style={{ color: cls.stat_modifiers.health >= 0 ? STAT_COLORS.positive : STAT_COLORS.negative }}>
                            {cls.stat_modifiers.health >= 0 ? '+' : ''}{cls.stat_modifiers.health}
                          </span>
                          /
                          <span style={{ color: cls.stat_modifiers.attack >= 0 ? STAT_COLORS.positive : STAT_COLORS.negative }}>
                            {cls.stat_modifiers.attack >= 0 ? '+' : ''}{cls.stat_modifiers.attack}
                          </span>
                          /
                          <span style={{ color: cls.stat_modifiers.defense >= 0 ? STAT_COLORS.positive : STAT_COLORS.negative }}>
                            {cls.stat_modifiers.defense >= 0 ? '+' : ''}{cls.stat_modifiers.defense}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Character Sheet */}
        <div className="cg-right-panel">
          {selectedRace && selectedClass && combinedStats && totalModifiers ? (
            <>
              {/* Header */}
              <div className="cg-sheet-header">
                <div className="cg-sheet-title">
                  <span className="cg-sheet-icon">{selectedRace.icon}</span>
                  <span className="cg-sheet-icon">{selectedClass.icon}</span>
                  <h1>{currentCombination?.display_name || `${selectedRace.name} ${selectedClass.name}`}</h1>
                </div>
                {currentCombination?.synergy_notes && (
                  <p className="cg-synergy">{currentCombination.synergy_notes}</p>
                )}
              </div>

              <div className="cg-sheet-body">
                {/* Model and Stats Column */}
                <div className="cg-sheet-left">
                  <div className="cg-model-container">
                    <Suspense fallback={<div className="cg-model-loading">Loading model...</div>}>
                      <ProceduralModelViewer
                        createModel={() => createPlayerCharacter({
                          race: selectedRace.id as RaceId,
                          classId: selectedClass.id as ClassId
                        })}
                        modelId={`sheet-${selectedRace.id}-${selectedClass.id}`}
                        height={320}
                      />
                    </Suspense>
                  </div>

                  {/* Stats */}
                  <div className="cg-stats-panel">
                    <h3>Statistics</h3>
                    <div className="cg-stat-bars">
                      <div className="cg-stat-row">
                        <span className="cg-stat-label">Health</span>
                        <div className="cg-stat-bar">
                          <div className="cg-stat-fill health" style={{ width: `${(combinedStats.health / 150) * 100}%` }} />
                        </div>
                        <span className="cg-stat-value">{combinedStats.health}</span>
                        <span className="cg-stat-mod" style={{ color: totalModifiers.health >= 0 ? STAT_COLORS.positive : STAT_COLORS.negative }}>
                          ({totalModifiers.health >= 0 ? '+' : ''}{totalModifiers.health})
                        </span>
                      </div>
                      <div className="cg-stat-row">
                        <span className="cg-stat-label">Attack</span>
                        <div className="cg-stat-bar">
                          <div className="cg-stat-fill attack" style={{ width: `${(combinedStats.attack / 25) * 100}%` }} />
                        </div>
                        <span className="cg-stat-value">{combinedStats.attack}</span>
                        <span className="cg-stat-mod" style={{ color: totalModifiers.attack >= 0 ? STAT_COLORS.positive : STAT_COLORS.negative }}>
                          ({totalModifiers.attack >= 0 ? '+' : ''}{totalModifiers.attack})
                        </span>
                      </div>
                      <div className="cg-stat-row">
                        <span className="cg-stat-label">Defense</span>
                        <div className="cg-stat-bar">
                          <div className="cg-stat-fill defense" style={{ width: `${(combinedStats.defense / 15) * 100}%` }} />
                        </div>
                        <span className="cg-stat-value">{combinedStats.defense}</span>
                        <span className="cg-stat-mod" style={{ color: totalModifiers.defense >= 0 ? STAT_COLORS.positive : STAT_COLORS.negative }}>
                          ({totalModifiers.defense >= 0 ? '+' : ''}{totalModifiers.defense})
                        </span>
                      </div>
                    </div>

                    <div className="cg-stat-breakdown">
                      <div className="cg-breakdown-row">
                        <span>Base</span>
                        <span>{BASE_STATS.health}</span>
                        <span>{BASE_STATS.attack}</span>
                        <span>{BASE_STATS.defense}</span>
                      </div>
                      <div className="cg-breakdown-row">
                        <span>{selectedRace.name}</span>
                        <span style={{ color: selectedRace.stat_modifiers.health >= 0 ? STAT_COLORS.positive : STAT_COLORS.negative }}>
                          {selectedRace.stat_modifiers.health >= 0 ? '+' : ''}{selectedRace.stat_modifiers.health}
                        </span>
                        <span style={{ color: selectedRace.stat_modifiers.attack >= 0 ? STAT_COLORS.positive : STAT_COLORS.negative }}>
                          {selectedRace.stat_modifiers.attack >= 0 ? '+' : ''}{selectedRace.stat_modifiers.attack}
                        </span>
                        <span style={{ color: selectedRace.stat_modifiers.defense >= 0 ? STAT_COLORS.positive : STAT_COLORS.negative }}>
                          {selectedRace.stat_modifiers.defense >= 0 ? '+' : ''}{selectedRace.stat_modifiers.defense}
                        </span>
                      </div>
                      <div className="cg-breakdown-row">
                        <span>{selectedClass.name}</span>
                        <span style={{ color: selectedClass.stat_modifiers.health >= 0 ? STAT_COLORS.positive : STAT_COLORS.negative }}>
                          {selectedClass.stat_modifiers.health >= 0 ? '+' : ''}{selectedClass.stat_modifiers.health}
                        </span>
                        <span style={{ color: selectedClass.stat_modifiers.attack >= 0 ? STAT_COLORS.positive : STAT_COLORS.negative }}>
                          {selectedClass.stat_modifiers.attack >= 0 ? '+' : ''}{selectedClass.stat_modifiers.attack}
                        </span>
                        <span style={{ color: selectedClass.stat_modifiers.defense >= 0 ? STAT_COLORS.positive : STAT_COLORS.negative }}>
                          {selectedClass.stat_modifiers.defense >= 0 ? '+' : ''}{selectedClass.stat_modifiers.defense}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Equipment */}
                  <div className="cg-equipment-panel">
                    <h3>Starting Equipment</h3>
                    <div className="cg-equipment">
                      <span className="cg-equipment-type">{selectedClass.equipment_type}</span>
                      <span className="cg-equipment-name">{selectedClass.starting_equipment}</span>
                    </div>
                  </div>
                </div>

                {/* Details Column */}
                <div className="cg-sheet-right">
                  {/* Racial Trait */}
                  <div className="cg-section cg-trait-section">
                    <h3>{selectedRace.icon} Racial Trait: {selectedRace.racial_trait.name}</h3>
                    <p>{selectedRace.racial_trait.description}</p>
                    <div className="cg-trait-effect">{selectedRace.racial_trait.effect}</div>
                  </div>

                  {/* Class Abilities */}
                  <div className="cg-section cg-abilities-section">
                    <h3>{selectedClass.icon} Class Abilities</h3>
                    <div className="cg-abilities">
                      {selectedClass.abilities.map((ability) => (
                        <div key={ability.name} className="cg-ability" style={{ borderLeftColor: selectedClass.primary_color }}>
                          <div className="cg-ability-header">
                            <span className="cg-ability-name">{ability.name}</span>
                            <span className={`cg-ability-type ${ability.ability_type}`}>{ability.ability_type}</span>
                          </div>
                          <p>{ability.description}</p>
                          <div className="cg-ability-stats">
                            {ability.damage && <span className="cg-ability-damage">Damage: {ability.damage}</span>}
                            {ability.effect && <span className="cg-ability-effect">{ability.effect}</span>}
                            {ability.cooldown && <span className="cg-ability-cooldown">{ability.cooldown} turn CD</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Playstyle */}
                  <div className="cg-section">
                    <h3>Playstyle</h3>
                    <p className="cg-playstyle">{selectedClass.playstyle}</p>
                  </div>

                  {/* Lore */}
                  <div className="cg-section">
                    <h3>Race Lore</h3>
                    <p>{selectedRace.lore}</p>
                  </div>

                  <div className="cg-section">
                    <h3>Class Lore</h3>
                    <p>{selectedClass.lore}</p>
                  </div>

                  {/* Appearance */}
                  <div className="cg-section">
                    <h3>Appearance</h3>
                    <p>{selectedRace.appearance}</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="cg-empty">
              <p>Select a race and class from the left panel</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CharacterGuide;
