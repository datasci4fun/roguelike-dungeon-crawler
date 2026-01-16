/**
 * Character Creation page - Prepare Your Descent
 *
 * Enhanced with:
 * - AtmosphericPage wrapper (underground theme)
 * - PhosphorHeader with lore title
 * - Race/class lore from Skyfall Seed canon
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { useAudioManager } from '../hooks/useAudioManager';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { GameIntro } from '../components/GameIntroNew';
import { AtmosphericPage } from '../components/AtmosphericPage';
import { PhosphorHeader } from '../components/PhosphorHeader';
import { CharacterPreview3D } from '../components/CharacterPreview3D';
import { StatRoller } from '../components/StatRoller';
import { RACE_LORE, CLASS_LORE, CHARACTER_CREATION } from '../data/loreSkyfall';
import type { RaceId, ClassId } from '../hooks/useGameSocket';
import type { AbilityScores } from '../types';
import { ABILITY_DESCRIPTIONS, BASE_STATS } from '../data/characterData';
import { useGameConstants } from '../hooks/useGameConstants';
import './CharacterCreation.css';

export function CharacterCreation() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [selectedRace, setSelectedRace] = useState<RaceId>('HUMAN');
  const [selectedClass, setSelectedClass] = useState<ClassId>('WARRIOR');
  const [isStarting, setIsStarting] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [showStatRoller, setShowStatRoller] = useState(false);
  const [abilityScores, setAbilityScores] = useState<AbilityScores | null>(null);

  const { status, gameState, newGame } = useGame();
  const { crossfadeTo, isUnlocked } = useAudioManager();

  // Fetch races and classes from API
  const {
    races: RACES,
    classes: CLASSES,
    racesArray,
    classesArray,
    isLoading: constantsLoading,
    error: constantsError,
  } = useGameConstants();

  // Derive arrays for navigation
  const RACE_IDS = racesArray.map(r => r.id);
  const CLASS_IDS = classesArray.map(c => c.id);

  // Calculate stats helper (uses API data)
  const calculateStats = useCallback((raceId: RaceId, classId: ClassId) => {
    if (!RACES || !CLASSES) return { hp: BASE_STATS.hp, atk: BASE_STATS.atk, def: BASE_STATS.def };
    const race = RACES[raceId];
    const playerClass = CLASSES[classId];
    if (!race || !playerClass) return { hp: BASE_STATS.hp, atk: BASE_STATS.atk, def: BASE_STATS.def };
    return {
      hp: BASE_STATS.hp + race.hp_modifier + playerClass.hp_modifier,
      atk: BASE_STATS.atk + race.atk_modifier + playerClass.atk_modifier,
      def: Math.max(0, BASE_STATS.def + race.def_modifier + playerClass.def_modifier),
    };
  }, [RACES, CLASSES]);

  // Keyboard navigation for race selection (2-column grid)
  const raceNav = useKeyboardNavigation({
    itemCount: RACE_IDS.length,
    columns: 2,
    selectedIndex: RACE_IDS.indexOf(selectedRace),
    onSelect: (index) => setSelectedRace(RACE_IDS[index]),
    enabled: !showIntro && !isStarting && !constantsLoading,
  });

  // Keyboard navigation for class selection (2-column grid)
  const classNav = useKeyboardNavigation({
    itemCount: CLASS_IDS.length,
    columns: 2,
    selectedIndex: CLASS_IDS.indexOf(selectedClass),
    onSelect: (index) => setSelectedClass(CLASS_IDS[index] as ClassId),
    enabled: !showIntro && !isStarting && !constantsLoading,
  });

  // Handle music change from intro
  const handleIntroMusic = useCallback((trackId: string) => {
    if (isUnlocked) {
      crossfadeTo(trackId);
    }
  }, [isUnlocked, crossfadeTo]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Navigate to play once game is actually running
  useEffect(() => {
    if (isStarting && gameState?.game_state === 'PLAYING') {
      navigate('/play');
    }
  }, [isStarting, gameState, navigate]);

  // Show stat roller when user clicks "Roll Stats"
  const handleRollStats = useCallback(() => {
    if (status !== 'connected') return;
    setShowStatRoller(true);
  }, [status]);

  // Handle stat roller completion
  const handleStatsComplete = useCallback((scores: AbilityScores) => {
    setAbilityScores(scores);
    setShowStatRoller(false);
  }, []);

  // Show intro when user clicks "Begin Adventure"
  const handleBeginAdventure = useCallback(() => {
    if (status !== 'connected') return;
    if (!abilityScores) {
      // If no stats rolled, show stat roller first
      setShowStatRoller(true);
      return;
    }
    setShowIntro(true);
  }, [status, abilityScores]);

  // Start game after intro completes
  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
    setIsStarting(true);
    newGame({
      race: selectedRace,
      class: selectedClass,
      ability_scores: abilityScores || undefined,
    });
  }, [selectedRace, selectedClass, abilityScores, newGame]);

  const stats = calculateStats(selectedRace, selectedClass);
  const race = RACES?.[selectedRace];
  const playerClass = CLASSES?.[selectedClass];

  // Combined loading state
  const isLoading = authLoading || constantsLoading;

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

  // Handle API error
  if (constantsError) {
    return (
      <AtmosphericPage backgroundType="underground">
        <div className="character-creation-loading">
          <div className="loading error">
            Failed to load game data: {constantsError}
            <br />
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      </AtmosphericPage>
    );
  }

  // Ensure data is loaded
  if (!race || !playerClass) {
    return (
      <div className="character-creation-loading">
        <div className="loading">Initializing...</div>
      </div>
    );
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
              {racesArray.map((r, index) => {
                const lore = RACE_LORE[r.id];
                const itemProps = raceNav.getItemProps(index);
                return (
                  <button
                    key={r.id}
                    {...itemProps}
                    className={`option-card ${selectedRace === r.id ? 'selected' : ''}`}
                    onClick={() => setSelectedRace(r.id)}
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
              {classesArray.map((c, index) => {
                const lore = CLASS_LORE[c.id];
                const itemProps = classNav.getItemProps(index);
                return (
                  <button
                    key={c.id}
                    {...itemProps}
                    className={`option-card ${selectedClass === c.id ? 'selected' : ''}`}
                    onClick={() => setSelectedClass(c.id as ClassId)}
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

            {/* Ability Scores Preview (if rolled) */}
            {abilityScores && (
              <div className="ability-scores-preview">
                <h3>Ability Scores</h3>
                <div className="ability-grid">
                  <div className="ability-item">
                    <span className="ability-label">STR</span>
                    <span className="ability-value">{abilityScores.strength}</span>
                    <span className={`ability-mod ${(abilityScores.str_mod || 0) >= 0 ? 'positive' : 'negative'}`}>
                      {(abilityScores.str_mod || 0) >= 0 ? '+' : ''}{abilityScores.str_mod || 0}
                    </span>
                  </div>
                  <div className="ability-item">
                    <span className="ability-label">DEX</span>
                    <span className="ability-value">{abilityScores.dexterity}</span>
                    <span className={`ability-mod ${(abilityScores.dex_mod || 0) >= 0 ? 'positive' : 'negative'}`}>
                      {(abilityScores.dex_mod || 0) >= 0 ? '+' : ''}{abilityScores.dex_mod || 0}
                    </span>
                  </div>
                  <div className="ability-item">
                    <span className="ability-label">CON</span>
                    <span className="ability-value">{abilityScores.constitution}</span>
                    <span className={`ability-mod ${(abilityScores.con_mod || 0) >= 0 ? 'positive' : 'negative'}`}>
                      {(abilityScores.con_mod || 0) >= 0 ? '+' : ''}{abilityScores.con_mod || 0}
                    </span>
                  </div>
                  <div className="ability-item">
                    <span className="ability-label">LUCK</span>
                    <span className="ability-value">{abilityScores.luck}</span>
                    <span className={`ability-mod ${(abilityScores.luck_mod || 0) >= 0 ? 'positive' : 'negative'}`}>
                      {(abilityScores.luck_mod || 0) >= 0 ? '+' : ''}{abilityScores.luck_mod || 0}
                    </span>
                  </div>
                </div>
                <button
                  className="reroll-stats-button"
                  onClick={handleRollStats}
                  disabled={status !== 'connected'}
                >
                  Re-roll Stats
                </button>
              </div>
            )}

            <div className="descent-warning">
              <span className="warning-icon">☠</span>
              <span>{CHARACTER_CREATION.warning}</span>
            </div>

            {!abilityScores ? (
              <button
                className="roll-stats-button"
                onClick={handleRollStats}
                disabled={status !== 'connected'}
              >
                {status === 'connecting' ? 'Connecting...' : 'Roll Your Stats'}
              </button>
            ) : (
              <button
                className="start-button"
                onClick={handleBeginAdventure}
                disabled={status !== 'connected'}
              >
                {status === 'connecting' ? 'Connecting...' : 'Begin Your Descent'}
              </button>
            )}
          </div>
        </div>

        {/* Stat Roller Overlay */}
        {showStatRoller && (
          <div className="stat-roller-overlay">
            <div className="stat-roller-modal">
              <button
                className="stat-roller-close"
                onClick={() => setShowStatRoller(false)}
              >
                ×
              </button>
              <StatRoller
                race={selectedRace}
                playerClass={selectedClass}
                onComplete={handleStatsComplete}
                allowReroll={true}
              />
            </div>
          </div>
        )}

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
