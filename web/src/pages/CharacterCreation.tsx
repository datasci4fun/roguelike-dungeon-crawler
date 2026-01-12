/**
 * Character Creation page - Prepare Your Descent
 *
 * Enhanced with:
 * - AtmosphericPage wrapper (underground theme)
 * - PhosphorHeader with lore title
 * - Race/class lore from Skyfall Seed canon
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { useAudioManager } from '../hooks/useAudioManager';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { GameIntro } from '../components/GameIntroNew';
import { AtmosphericPage } from '../components/AtmosphericPage';
import { PhosphorHeader } from '../components/PhosphorHeader';
import { CharacterPreview3D } from '../components/CharacterPreview3D';
import { RACE_LORE, CLASS_LORE, CHARACTER_CREATION } from '../data/loreSkyfall';
import type { RaceId, ClassId } from '../hooks/useGameSocket';
import { RACES, CLASSES, ABILITY_DESCRIPTIONS, calculateStats } from '../data/characterData';
import './CharacterCreation.css';

// Get arrays of IDs for index-based navigation
const RACE_IDS = Object.keys(RACES) as RaceId[];
const CLASS_IDS = Object.keys(CLASSES) as ClassId[];

export function CharacterCreation() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const [selectedRace, setSelectedRace] = useState<RaceId>('HUMAN');
  const [selectedClass, setSelectedClass] = useState<ClassId>('WARRIOR');
  const [isStarting, setIsStarting] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  const { status, gameState, newGame } = useGame();
  const { crossfadeTo, isUnlocked } = useAudioManager();

  // Keyboard navigation for race selection (2-column grid)
  const raceNav = useKeyboardNavigation({
    itemCount: RACE_IDS.length,
    columns: 2,
    selectedIndex: RACE_IDS.indexOf(selectedRace),
    onSelect: (index) => setSelectedRace(RACE_IDS[index]),
    enabled: !showIntro && !isStarting,
  });

  // Keyboard navigation for class selection (2-column grid)
  const classNav = useKeyboardNavigation({
    itemCount: CLASS_IDS.length,
    columns: 2,
    selectedIndex: CLASS_IDS.indexOf(selectedClass),
    onSelect: (index) => setSelectedClass(CLASS_IDS[index]),
    enabled: !showIntro && !isStarting,
  });

  // Handle music change from intro
  const handleIntroMusic = useCallback((trackId: string) => {
    if (isUnlocked) {
      crossfadeTo(trackId);
    }
  }, [isUnlocked, crossfadeTo]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Navigate to play once game is actually running
  useEffect(() => {
    if (isStarting && gameState?.game_state === 'PLAYING') {
      navigate('/play');
    }
  }, [isStarting, gameState, navigate]);

  // Show intro when user clicks "Begin Adventure"
  const handleBeginAdventure = useCallback(() => {
    if (status !== 'connected') return;
    setShowIntro(true);
  }, [status]);

  // Start game after intro completes
  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
    setIsStarting(true);
    newGame({ race: selectedRace, class: selectedClass });
  }, [selectedRace, selectedClass, newGame]);

  const stats = calculateStats(selectedRace, selectedClass);
  const race = RACES[selectedRace];
  const playerClass = CLASSES[selectedClass];

  if (isLoading) {
    return (
      <div className="character-creation-loading">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AtmosphericPage
      backgroundType="underground"
      particles={{ type: 'dust', count: 30, speed: 'slow', opacity: 0.2 }}
      crt={true}
      crtIntensity="light"
    >
      <div className="character-creation">
        <div className="creation-header">
          <PhosphorHeader
            title={CHARACTER_CREATION.title}
            subtitle={CHARACTER_CREATION.subtitle}
            style="dramatic"
            delay={100}
          />
        </div>

        <div className="creation-layout">
          {/* Race Selection */}
          <div className="selection-section">
            <h2 id="race-selection-label">Choose Your Heritage</h2>
            <div
              className="option-grid"
              {...raceNav.containerProps}
              aria-labelledby="race-selection-label"
            >
              {RACE_IDS.map((raceId, index) => {
                const r = RACES[raceId];
                const lore = RACE_LORE[raceId];
                const itemProps = raceNav.getItemProps(index);
                return (
                  <button
                    key={raceId}
                    {...itemProps}
                    className={`option-card ${selectedRace === raceId ? 'selected' : ''}`}
                    onClick={() => setSelectedRace(raceId)}
                  >
                    <div className="option-name">{r.name}</div>
                    <div className="option-desc">{r.description}</div>
                    <div className="option-modifiers">
                      <span className={r.hp_modifier > 0 ? 'positive' : r.hp_modifier < 0 ? 'negative' : ''}>
                        HP {r.hp_modifier >= 0 ? '+' : ''}{r.hp_modifier}
                      </span>
                      <span className={r.atk_modifier > 0 ? 'positive' : r.atk_modifier < 0 ? 'negative' : ''}>
                        ATK {r.atk_modifier >= 0 ? '+' : ''}{r.atk_modifier}
                      </span>
                      <span className={r.def_modifier > 0 ? 'positive' : r.def_modifier < 0 ? 'negative' : ''}>
                        DEF {r.def_modifier >= 0 ? '+' : ''}{r.def_modifier}
                      </span>
                    </div>
                    <div className="option-trait">
                      <span className="trait-name">{r.trait_name}:</span> {r.trait_description}
                    </div>
                    {lore && <div className="option-lore">{lore}</div>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Class Selection */}
          <div className="selection-section">
            <h2 id="class-selection-label">Choose Your Path</h2>
            <div
              className="option-grid"
              {...classNav.containerProps}
              aria-labelledby="class-selection-label"
            >
              {CLASS_IDS.map((classId, index) => {
                const c = CLASSES[classId];
                const lore = CLASS_LORE[classId];
                const itemProps = classNav.getItemProps(index);
                return (
                  <button
                    key={classId}
                    {...itemProps}
                    className={`option-card ${selectedClass === classId ? 'selected' : ''}`}
                    onClick={() => setSelectedClass(classId)}
                  >
                    <div className="option-name">{c.name}</div>
                    <div className="option-desc">{c.description}</div>
                    <div className="option-modifiers">
                      <span className={c.hp_modifier > 0 ? 'positive' : c.hp_modifier < 0 ? 'negative' : ''}>
                        HP {c.hp_modifier >= 0 ? '+' : ''}{c.hp_modifier}
                      </span>
                      <span className={c.atk_modifier > 0 ? 'positive' : c.atk_modifier < 0 ? 'negative' : ''}>
                        ATK {c.atk_modifier >= 0 ? '+' : ''}{c.atk_modifier}
                      </span>
                      <span className={c.def_modifier > 0 ? 'positive' : c.def_modifier < 0 ? 'negative' : ''}>
                        DEF {c.def_modifier >= 0 ? '+' : ''}{c.def_modifier}
                      </span>
                    </div>
                    <div className="option-abilities">
                      {c.active_abilities.concat(c.passive_abilities).map((abilityId) => {
                        const ability = ABILITY_DESCRIPTIONS[abilityId];
                        return (
                          <div key={abilityId} className="ability-item">
                            <span className="ability-name">{ability.name}</span>
                            {ability.cooldown && <span className="ability-cd">CD:{ability.cooldown}</span>}
                          </div>
                        );
                      })}
                    </div>
                    {lore && <div className="option-lore">{lore}</div>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stats Preview */}
          <div className="preview-section">
            <h2>{race.name} {playerClass.name}</h2>

            {/* 3D Character Preview */}
            <div className="character-preview-container">
              <CharacterPreview3D
                race={selectedRace}
                classId={selectedClass}
                height={250}
              />
              <p className="preview-hint">Drag to rotate</p>
            </div>

            <div className="stats-preview">
              <div className="stat-row">
                <span className="stat-label">Health</span>
                <span className="stat-value hp">{stats.hp}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Attack</span>
                <span className="stat-value atk">{stats.atk}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Defense</span>
                <span className="stat-value def">{stats.def}</span>
              </div>
            </div>

            <div className="trait-preview">
              <h3>Racial Trait</h3>
              <div className="trait-info">
                <span className="trait-name">{race.trait_name}</span>
                <span className="trait-desc">{race.trait_description}</span>
              </div>
            </div>

            <div className="abilities-preview">
              <h3>Abilities</h3>
              {playerClass.active_abilities.map((abilityId) => {
                const ability = ABILITY_DESCRIPTIONS[abilityId];
                return (
                  <div key={abilityId} className="ability-preview">
                    <span className="ability-name">{ability.name}</span>
                    <span className="ability-desc">{ability.description}</span>
                    {ability.cooldown && <span className="ability-cd">Cooldown: {ability.cooldown} turns</span>}
                  </div>
                );
              })}
              <h4>Passive</h4>
              {playerClass.passive_abilities.map((abilityId) => {
                const ability = ABILITY_DESCRIPTIONS[abilityId];
                return (
                  <div key={abilityId} className="ability-preview passive">
                    <span className="ability-name">{ability.name}</span>
                    <span className="ability-desc">{ability.description}</span>
                  </div>
                );
              })}
            </div>

            <div className="descent-warning">
              <span className="warning-icon">☠</span>
              <span>{CHARACTER_CREATION.warning}</span>
            </div>

            <button
              className="start-button"
              onClick={handleBeginAdventure}
              disabled={status !== 'connected'}
            >
              {status === 'connecting' ? 'Connecting...' : 'Begin Your Descent'}
            </button>
          </div>
        </div>

        {/* Game Intro Overlay */}
        {showIntro && (
          <GameIntro
            onComplete={handleIntroComplete}
            onSkip={handleIntroComplete}
            onMusicChange={handleIntroMusic}
          />
        )}
      </div>
    </AtmosphericPage>
  );
}
