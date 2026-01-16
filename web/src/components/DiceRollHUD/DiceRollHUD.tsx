import { useState, useEffect, useCallback } from 'react';
import { Dice3D, DieType } from '../Dice3D';
import type { DiceRollEvent, AttackRollResult, DamageRollResult } from '../../types';
import './DiceRollHUD.css';

interface DiceRollHUDProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

interface QueuedRoll {
  id: string;
  type: 'attack' | 'damage' | 'saving_throw' | 'stat_roll';
  dieType: DieType;
  result: number;
  modifier: number;
  total: number;
  targetAC?: number;
  targetDC?: number;
  isHit?: boolean;
  isCritical?: boolean;
  isFumble?: boolean;
  success?: boolean;
  luckApplied?: boolean;
  label?: string;
  timestamp: number;
}

// Parse dice notation to get die type (e.g., "1d20+3" -> "d20")
function parseDieType(notation: string): DieType {
  const match = notation.match(/d(\d+)/i);
  if (match) {
    const sides = parseInt(match[1], 10);
    if ([4, 6, 8, 10, 12, 20].includes(sides)) {
      return `d${sides}` as DieType;
    }
  }
  return 'd20'; // Default
}

// Extract result from dice notation (e.g., get the actual d20 roll before modifier)
function extractRollResult(rolls: number[]): number {
  return rolls.length > 0 ? rolls[0] : 10;
}

export function DiceRollHUD({ position = 'top-right', className = '' }: DiceRollHUDProps) {
  const [rollQueue, setRollQueue] = useState<QueuedRoll[]>([]);
  const [currentRoll, setCurrentRoll] = useState<QueuedRoll | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  // Add a roll to the queue
  const addRoll = useCallback((roll: QueuedRoll) => {
    setRollQueue(prev => [...prev, roll]);
  }, []);

  // Process next roll in queue
  useEffect(() => {
    if (!isRolling && rollQueue.length > 0 && !currentRoll) {
      const [nextRoll, ...rest] = rollQueue;
      setRollQueue(rest);
      setCurrentRoll(nextRoll);
      setIsRolling(true);
    }
  }, [isRolling, rollQueue, currentRoll]);

  // Handle roll completion
  const handleRollComplete = useCallback(() => {
    setIsRolling(false);
    // Keep current roll visible for a moment before clearing
    setTimeout(() => {
      setCurrentRoll(null);
    }, 2000);
  }, []);

  // Add attack roll from combat result
  const addAttackRoll = useCallback((attackRoll: AttackRollResult, attackerName: string) => {
    const roll: QueuedRoll = {
      id: `attack-${Date.now()}`,
      type: 'attack',
      dieType: 'd20',
      result: attackRoll.d20_roll,
      modifier: attackRoll.modifier,
      total: attackRoll.total,
      targetAC: attackRoll.target_ac,
      isHit: attackRoll.is_hit,
      isCritical: attackRoll.is_critical,
      isFumble: attackRoll.is_fumble,
      luckApplied: attackRoll.luck_applied,
      label: `${attackerName} Attack`,
      timestamp: Date.now(),
    };
    addRoll(roll);
  }, [addRoll]);

  // Add damage roll from combat result
  const addDamageRoll = useCallback((damageRoll: DamageRollResult, attackerName: string) => {
    const dieType = parseDieType(damageRoll.dice_notation);
    const roll: QueuedRoll = {
      id: `damage-${Date.now()}`,
      type: 'damage',
      dieType,
      result: damageRoll.dice_rolls[0] || damageRoll.total - damageRoll.modifier,
      modifier: damageRoll.modifier,
      total: damageRoll.total,
      isCritical: damageRoll.is_critical,
      label: `${attackerName} Damage`,
      timestamp: Date.now(),
    };
    addRoll(roll);
  }, [addRoll]);

  // Add generic dice roll event
  const addDiceRollEvent = useCallback((event: DiceRollEvent, label?: string) => {
    const dieType = parseDieType(event.dice_notation);
    const roll: QueuedRoll = {
      id: `roll-${Date.now()}`,
      type: event.type as QueuedRoll['type'],
      dieType,
      result: extractRollResult(event.rolls),
      modifier: event.modifier,
      total: event.total,
      targetAC: event.target_ac,
      targetDC: event.target_dc,
      isCritical: event.is_critical,
      isFumble: event.is_fumble,
      success: event.success,
      luckApplied: event.luck_applied,
      label: label || event.type,
      timestamp: Date.now(),
    };
    addRoll(roll);
  }, [addRoll]);

  // Expose methods for external use
  useEffect(() => {
    // Store functions on window for external access (temporary solution)
    (window as unknown as { diceRollHUD?: { addAttackRoll: typeof addAttackRoll; addDamageRoll: typeof addDamageRoll; addDiceRollEvent: typeof addDiceRollEvent } }).diceRollHUD = {
      addAttackRoll,
      addDamageRoll,
      addDiceRollEvent,
    };

    return () => {
      delete (window as unknown as { diceRollHUD?: unknown }).diceRollHUD;
    };
  }, [addAttackRoll, addDamageRoll, addDiceRollEvent]);

  // Format the roll result message
  const formatRollMessage = (roll: QueuedRoll): string => {
    if (roll.type === 'attack') {
      const modStr = roll.modifier >= 0 ? `+${roll.modifier}` : `${roll.modifier}`;
      let result = `${roll.result}${modStr}=${roll.total} vs AC ${roll.targetAC}`;

      if (roll.isCritical) {
        result += ' - CRITICAL HIT!';
      } else if (roll.isFumble) {
        result += ' - FUMBLE!';
      } else if (roll.isHit) {
        result += ' - HIT!';
      } else {
        result += ' - MISS!';
      }

      return result;
    }

    if (roll.type === 'damage') {
      const modStr = roll.modifier >= 0 ? `+${roll.modifier}` : `${roll.modifier}`;
      return `${roll.result}${modStr}=${roll.total} damage${roll.isCritical ? ' (CRIT!)' : ''}`;
    }

    if (roll.type === 'saving_throw') {
      const modStr = roll.modifier >= 0 ? `+${roll.modifier}` : `${roll.modifier}`;
      return `${roll.result}${modStr}=${roll.total} vs DC ${roll.targetDC} - ${roll.success ? 'SUCCESS!' : 'FAIL!'}`;
    }

    return `${roll.total}`;
  };

  if (!currentRoll && rollQueue.length === 0) {
    return null;
  }

  return (
    <div className={`dice-roll-hud dice-roll-hud--${position} ${className}`}>
      {currentRoll && (
        <div
          className={`dice-roll-hud__roll ${currentRoll.isCritical ? 'critical' : ''} ${currentRoll.isFumble ? 'fumble' : ''}`}
        >
          <div className="dice-roll-hud__label">{currentRoll.label}</div>

          <div className="dice-roll-hud__dice-container">
            <Dice3D
              dieType={currentRoll.dieType}
              result={currentRoll.result}
              rolling={isRolling}
              onRollComplete={handleRollComplete}
              size={70}
              luckModifier={currentRoll.luckApplied ? 1 : 0}
            />
          </div>

          <div className="dice-roll-hud__result">
            {formatRollMessage(currentRoll)}
          </div>

          {currentRoll.luckApplied && (
            <div className="dice-roll-hud__luck-indicator">
              LUCK
            </div>
          )}
        </div>
      )}

      {/* Queue indicator */}
      {rollQueue.length > 0 && (
        <div className="dice-roll-hud__queue">
          +{rollQueue.length} more
        </div>
      )}
    </div>
  );
}

export default DiceRollHUD;
