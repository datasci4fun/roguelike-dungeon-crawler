/**
 * Character Creation page - select race and class before starting the game.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGameSocket, RaceId, ClassId, CharacterConfig } from '../hooks/useGameSocket';
import { RACES, CLASSES, ABILITY_DESCRIPTIONS, calculateStats } from '../data/characterData';
import './CharacterCreation.css';

export function CharacterCreation() {
  const { isAuthenticated, isLoading, token } = useAuth();
  const navigate = useNavigate();

  const [selectedRace, setSelectedRace] = useState<RaceId>('HUMAN');
  const [selectedClass, setSelectedClass] = useState<ClassId>('WARRIOR');

  const {
    status,
    gameState,
    connect,
    newGame,
  } = useGameSocket(token);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Connect to game server when authenticated
  useEffect(() => {
    if (isAuthenticated && token && status === 'disconnected') {
      connect();
    }
  }, [isAuthenticated, token, status, connect]);

  // Navigate to play page when game starts
  useEffect(() => {
    if (gameState?.game_state === 'PLAYING') {
      navigate('/play');
    }
  }, [gameState, navigate]);

  const handleStartGame = useCallback(() => {
    const config: CharacterConfig = {
      race: selectedRace,
      class: selectedClass,
    };
    newGame(config);
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
    <div className="character-creation">
      <h1 className="title">Create Your Hero</h1>

      <div className="creation-layout">
        {/* Race Selection */}
        <div className="selection-section">
          <h2>Choose Race</h2>
          <div className="option-grid">
            {(Object.keys(RACES) as RaceId[]).map((raceId) => {
              const r = RACES[raceId];
              return (
                <button
                  key={raceId}
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
                </button>
              );
            })}
          </div>
        </div>

        {/* Class Selection */}
        <div className="selection-section">
          <h2>Choose Class</h2>
          <div className="option-grid">
            {(Object.keys(CLASSES) as ClassId[]).map((classId) => {
              const c = CLASSES[classId];
              return (
                <button
                  key={classId}
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
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats Preview */}
        <div className="preview-section">
          <h2>{race.name} {playerClass.name}</h2>
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

          <button
            className="start-button"
            onClick={handleStartGame}
            disabled={status !== 'connected'}
          >
            {status === 'connecting' ? 'Connecting...' : 'Begin Adventure'}
          </button>
        </div>
      </div>
    </div>
  );
}
