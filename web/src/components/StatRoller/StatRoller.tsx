import { useState, useCallback } from 'react';
import { Dice3D } from '../Dice3D';
import type { AbilityScores, AbilityModifiers, RaceId, ClassId } from '../../types';
import './StatRoller.css';

// Race ability modifiers
const RACE_ABILITY_MODIFIERS: Record<RaceId, { base: AbilityModifiers; mods: AbilityModifiers }> = {
  HUMAN: {
    base: { str: 10, dex: 10, con: 10, luck: 10 },
    mods: { str: 0, dex: 0, con: 0, luck: 2 },
  },
  ELF: {
    base: { str: 8, dex: 12, con: 8, luck: 10 },
    mods: { str: -1, dex: 2, con: 0, luck: 0 },
  },
  DWARF: {
    base: { str: 12, dex: 8, con: 12, luck: 8 },
    mods: { str: 1, dex: 0, con: 2, luck: -1 },
  },
  HALFLING: {
    base: { str: 6, dex: 14, con: 10, luck: 12 },
    mods: { str: -2, dex: 2, con: 0, luck: 2 },
  },
  ORC: {
    base: { str: 14, dex: 8, con: 12, luck: 6 },
    mods: { str: 2, dex: 0, con: 1, luck: -1 },
  },
};

// Class ability modifiers
const CLASS_ABILITY_MODIFIERS: Record<ClassId, AbilityModifiers> = {
  WARRIOR: { str: 2, dex: 0, con: 1, luck: 0 },
  MAGE: { str: -1, dex: 1, con: 0, luck: 2 },
  ROGUE: { str: 0, dex: 2, con: 0, luck: 1 },
  CLERIC: { str: 0, dex: 0, con: 2, luck: 1 },
};

interface StatRoll {
  dice: number[];
  total: number;
  rolled: boolean;
  rolling: boolean;
}

interface StatRollerProps {
  race: RaceId;
  playerClass: ClassId;
  onComplete: (scores: AbilityScores) => void;
  allowReroll?: boolean | number; // true = unlimited, number = count
}

type StatName = 'strength' | 'dexterity' | 'constitution' | 'luck';

const STAT_INFO: Record<StatName, { label: string; abbrev: string; description: string }> = {
  strength: {
    label: 'Strength',
    abbrev: 'STR',
    description: 'Physical power, melee damage',
  },
  dexterity: {
    label: 'Dexterity',
    abbrev: 'DEX',
    description: 'Agility, accuracy, dodge',
  },
  constitution: {
    label: 'Constitution',
    abbrev: 'CON',
    description: 'Endurance, HP pool',
  },
  luck: {
    label: 'Luck',
    abbrev: 'LUCK',
    description: 'Fortune, dice probability',
  },
};

// Calculate modifier from ability score
function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

// Format modifier string (+2, -1, etc.)
function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

// Roll 3d6
function roll3d6(): number[] {
  return [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
  ];
}

export function StatRoller({ race, playerClass, onComplete, allowReroll = true }: StatRollerProps) {
  const [rolls, setRolls] = useState<Record<StatName, StatRoll>>({
    strength: { dice: [], total: 0, rolled: false, rolling: false },
    dexterity: { dice: [], total: 0, rolled: false, rolling: false },
    constitution: { dice: [], total: 0, rolled: false, rolling: false },
    luck: { dice: [], total: 0, rolled: false, rolling: false },
  });

  const [rerollsRemaining, setRerollsRemaining] = useState<number>(
    typeof allowReroll === 'number' ? allowReroll : Infinity
  );

  const raceMods = RACE_ABILITY_MODIFIERS[race];
  const classMods = CLASS_ABILITY_MODIFIERS[playerClass];

  // Calculate final stat with all modifiers
  const calculateFinalStat = useCallback((stat: StatName, baseRoll: number): number => {
    // Map stat name to modifier key
    const modKey = stat === 'strength' ? 'str' : stat === 'dexterity' ? 'dex' : stat === 'constitution' ? 'con' : 'luck';

    const raceBaseAdj = (raceMods.base[modKey] || 10) - 10;
    const raceModVal = raceMods.mods[modKey] || 0;
    const classModVal = classMods[modKey] || 0;

    return Math.max(3, baseRoll + raceBaseAdj + raceModVal + classModVal);
  }, [raceMods, classMods]);

  // Roll a single stat
  const rollStat = useCallback((stat: StatName) => {
    if (rolls[stat].rolling) return;

    setRolls(prev => ({
      ...prev,
      [stat]: { ...prev[stat], rolling: true },
    }));

    // Simulate rolling animation
    setTimeout(() => {
      const dice = roll3d6();
      const total = dice.reduce((a, b) => a + b, 0);

      setRolls(prev => ({
        ...prev,
        [stat]: { dice, total, rolled: true, rolling: false },
      }));
    }, 1500);
  }, [rolls]);

  // Roll all stats at once
  const rollAll = useCallback(() => {
    const stats: StatName[] = ['strength', 'dexterity', 'constitution', 'luck'];

    // Set all to rolling
    setRolls(prev => {
      const newRolls = { ...prev };
      stats.forEach(stat => {
        newRolls[stat] = { ...prev[stat], rolling: true };
      });
      return newRolls;
    });

    // Stagger the roll completions for effect
    stats.forEach((stat, index) => {
      setTimeout(() => {
        const dice = roll3d6();
        const total = dice.reduce((a, b) => a + b, 0);

        setRolls(prev => ({
          ...prev,
          [stat]: { dice, total, rolled: true, rolling: false },
        }));
      }, 1500 + index * 500);
    });
  }, []);

  // Reroll a single stat
  const rerollStat = useCallback((stat: StatName) => {
    if (rerollsRemaining <= 0 && allowReroll !== true) return;

    if (typeof allowReroll === 'number') {
      setRerollsRemaining(prev => prev - 1);
    }

    setRolls(prev => ({
      ...prev,
      [stat]: { dice: [], total: 0, rolled: false, rolling: false },
    }));

    // Then roll it
    setTimeout(() => rollStat(stat), 100);
  }, [rerollsRemaining, allowReroll, rollStat]);

  // Check if all stats are rolled
  const allRolled = Object.values(rolls).every(r => r.rolled);
  const anyRolling = Object.values(rolls).some(r => r.rolling);

  // Accept stats and complete
  const acceptStats = useCallback(() => {
    if (!allRolled) return;

    const scores: AbilityScores = {
      strength: calculateFinalStat('strength', rolls.strength.total),
      dexterity: calculateFinalStat('dexterity', rolls.dexterity.total),
      constitution: calculateFinalStat('constitution', rolls.constitution.total),
      luck: calculateFinalStat('luck', rolls.luck.total),
    };

    // Add modifiers
    scores.str_mod = calculateModifier(scores.strength);
    scores.dex_mod = calculateModifier(scores.dexterity);
    scores.con_mod = calculateModifier(scores.constitution);
    scores.luck_mod = calculateModifier(scores.luck);

    onComplete(scores);
  }, [allRolled, rolls, calculateFinalStat, onComplete]);

  // Get total modifier preview for a stat
  const getTotalModifierPreview = (stat: StatName): number => {
    const modKey = stat === 'strength' ? 'str' : stat === 'dexterity' ? 'dex' : stat === 'constitution' ? 'con' : 'luck';
    const raceBaseAdj = (raceMods.base[modKey] || 10) - 10;
    const raceModVal = raceMods.mods[modKey] || 0;
    const classModVal = classMods[modKey] || 0;
    return raceBaseAdj + raceModVal + classModVal;
  };

  return (
    <div className="stat-roller">
      <h2 className="stat-roller__title">Roll Your Abilities</h2>
      <p className="stat-roller__subtitle">Roll 3d6 for each ability score</p>

      <div className="stat-roller__stats">
        {(Object.keys(STAT_INFO) as StatName[]).map(stat => {
          const info = STAT_INFO[stat];
          const roll = rolls[stat];
          const totalMod = getTotalModifierPreview(stat);
          const finalScore = roll.rolled ? calculateFinalStat(stat, roll.total) : null;
          const finalMod = finalScore ? calculateModifier(finalScore) : null;

          return (
            <div key={stat} className={`stat-roller__stat ${roll.rolled ? 'rolled' : ''}`}>
              <div className="stat-roller__stat-header">
                <span className="stat-roller__stat-abbrev">{info.abbrev}</span>
                <span className="stat-roller__stat-name">{info.label}</span>
              </div>

              <div className="stat-roller__stat-description">{info.description}</div>

              <div className="stat-roller__dice-area">
                {roll.rolling || roll.rolled ? (
                  <div className="stat-roller__dice-row">
                    {roll.dice.length > 0 ? (
                      roll.dice.map((die, i) => (
                        <Dice3D
                          key={i}
                          dieType="d6"
                          result={die}
                          rolling={roll.rolling}
                          size={40}
                        />
                      ))
                    ) : (
                      // Placeholder dice while rolling (use same keys 0,1,2 as actual dice)
                      [0, 1, 2].map(i => (
                        <Dice3D
                          key={i}
                          dieType="d6"
                          result={3}
                          rolling={true}
                          size={40}
                        />
                      ))
                    )}
                  </div>
                ) : (
                  <button
                    className="stat-roller__roll-btn"
                    onClick={() => rollStat(stat)}
                    disabled={anyRolling}
                  >
                    Roll 3d6
                  </button>
                )}
              </div>

              <div className="stat-roller__stat-result">
                {roll.rolled && (
                  <>
                    <div className="stat-roller__base-roll">
                      Base: {roll.total}
                    </div>
                    <div className={`stat-roller__modifiers ${totalMod >= 0 ? 'positive' : 'negative'}`}>
                      Mods: {formatModifier(totalMod)}
                    </div>
                    <div className="stat-roller__final-score">
                      <span className="stat-roller__final-value">{finalScore}</span>
                      <span className={`stat-roller__final-mod ${finalMod! >= 0 ? 'positive' : 'negative'}`}>
                        ({formatModifier(finalMod!)})
                      </span>
                    </div>
                    {(allowReroll === true || rerollsRemaining > 0) && (
                      <button
                        className="stat-roller__reroll-btn"
                        onClick={() => rerollStat(stat)}
                        disabled={anyRolling}
                      >
                        Reroll
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="stat-roller__actions">
        {!allRolled && (
          <button
            className="stat-roller__roll-all-btn"
            onClick={rollAll}
            disabled={anyRolling}
          >
            {anyRolling ? 'Rolling...' : 'Roll All Stats'}
          </button>
        )}

        {allRolled && (
          <button
            className="stat-roller__accept-btn"
            onClick={acceptStats}
            disabled={anyRolling}
          >
            Accept Stats
          </button>
        )}

        {typeof allowReroll === 'number' && (
          <div className="stat-roller__rerolls-remaining">
            Rerolls remaining: {rerollsRemaining}
          </div>
        )}
      </div>

      <div className="stat-roller__preview">
        <h3>Modifier Preview</h3>
        <div className="stat-roller__preview-row">
          <span>Race ({race}):</span>
          <span>
            STR {formatModifier((raceMods.base.str - 10) + raceMods.mods.str)},
            DEX {formatModifier((raceMods.base.dex - 10) + raceMods.mods.dex)},
            CON {formatModifier((raceMods.base.con - 10) + raceMods.mods.con)},
            LUCK {formatModifier((raceMods.base.luck - 10) + raceMods.mods.luck)}
          </span>
        </div>
        <div className="stat-roller__preview-row">
          <span>Class ({playerClass}):</span>
          <span>
            STR {formatModifier(classMods.str)},
            DEX {formatModifier(classMods.dex)},
            CON {formatModifier(classMods.con)},
            LUCK {formatModifier(classMods.luck)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default StatRoller;
