import { useState, useEffect, useRef, useCallback } from 'react';
import './Dice3D.css';

export type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';

interface Dice3DProps {
  dieType: DieType;
  result: number;
  rolling?: boolean;
  onRollComplete?: () => void;
  size?: number;
  luckModifier?: number;
  className?: string;
}

// Face rotations for each die type to show specific values
const FACE_ROTATIONS: Record<DieType, Record<number, { rotateX: number; rotateY: number; rotateZ: number }>> = {
  d6: {
    1: { rotateX: 0, rotateY: 0, rotateZ: 0 },
    2: { rotateX: 0, rotateY: -90, rotateZ: 0 },
    3: { rotateX: -90, rotateY: 0, rotateZ: 0 },
    4: { rotateX: 90, rotateY: 0, rotateZ: 0 },
    5: { rotateX: 0, rotateY: 90, rotateZ: 0 },
    6: { rotateX: 180, rotateY: 0, rotateZ: 0 },
  },
  d4: {
    1: { rotateX: 0, rotateY: 0, rotateZ: 0 },
    2: { rotateX: 109.5, rotateY: 0, rotateZ: 120 },
    3: { rotateX: 109.5, rotateY: 0, rotateZ: 240 },
    4: { rotateX: 109.5, rotateY: 0, rotateZ: 0 },
  },
  d8: {
    1: { rotateX: 35.26, rotateY: 45, rotateZ: 0 },
    2: { rotateX: 35.26, rotateY: 135, rotateZ: 0 },
    3: { rotateX: 35.26, rotateY: 225, rotateZ: 0 },
    4: { rotateX: 35.26, rotateY: 315, rotateZ: 0 },
    5: { rotateX: -35.26, rotateY: 45, rotateZ: 180 },
    6: { rotateX: -35.26, rotateY: 135, rotateZ: 180 },
    7: { rotateX: -35.26, rotateY: 225, rotateZ: 180 },
    8: { rotateX: -35.26, rotateY: 315, rotateZ: 180 },
  },
  d10: {
    0: { rotateX: 0, rotateY: 0, rotateZ: 0 },
    1: { rotateX: 0, rotateY: 36, rotateZ: 0 },
    2: { rotateX: 0, rotateY: 72, rotateZ: 0 },
    3: { rotateX: 0, rotateY: 108, rotateZ: 0 },
    4: { rotateX: 0, rotateY: 144, rotateZ: 0 },
    5: { rotateX: 0, rotateY: 180, rotateZ: 0 },
    6: { rotateX: 0, rotateY: 216, rotateZ: 0 },
    7: { rotateX: 0, rotateY: 252, rotateZ: 0 },
    8: { rotateX: 0, rotateY: 288, rotateZ: 0 },
    9: { rotateX: 0, rotateY: 324, rotateZ: 0 },
  },
  d12: {
    1: { rotateX: 0, rotateY: 0, rotateZ: 0 },
    2: { rotateX: 0, rotateY: 72, rotateZ: 0 },
    3: { rotateX: 0, rotateY: 144, rotateZ: 0 },
    4: { rotateX: 0, rotateY: 216, rotateZ: 0 },
    5: { rotateX: 0, rotateY: 288, rotateZ: 0 },
    6: { rotateX: 116.57, rotateY: 0, rotateZ: 0 },
    7: { rotateX: 116.57, rotateY: 72, rotateZ: 0 },
    8: { rotateX: 116.57, rotateY: 144, rotateZ: 0 },
    9: { rotateX: 116.57, rotateY: 216, rotateZ: 0 },
    10: { rotateX: 116.57, rotateY: 288, rotateZ: 0 },
    11: { rotateX: 180, rotateY: 36, rotateZ: 0 },
    12: { rotateX: 180, rotateY: 0, rotateZ: 0 },
  },
  d20: {
    1: { rotateX: 0, rotateY: 0, rotateZ: 0 },
    2: { rotateX: 0, rotateY: 72, rotateZ: 0 },
    3: { rotateX: 0, rotateY: 144, rotateZ: 0 },
    4: { rotateX: 0, rotateY: 216, rotateZ: 0 },
    5: { rotateX: 0, rotateY: 288, rotateZ: 0 },
    6: { rotateX: 52.62, rotateY: 36, rotateZ: 0 },
    7: { rotateX: 52.62, rotateY: 108, rotateZ: 0 },
    8: { rotateX: 52.62, rotateY: 180, rotateZ: 0 },
    9: { rotateX: 52.62, rotateY: 252, rotateZ: 0 },
    10: { rotateX: 52.62, rotateY: 324, rotateZ: 0 },
    11: { rotateX: -52.62, rotateY: 36, rotateZ: 180 },
    12: { rotateX: -52.62, rotateY: 108, rotateZ: 180 },
    13: { rotateX: -52.62, rotateY: 180, rotateZ: 180 },
    14: { rotateX: -52.62, rotateY: 252, rotateZ: 180 },
    15: { rotateX: -52.62, rotateY: 324, rotateZ: 180 },
    16: { rotateX: 180, rotateY: 0, rotateZ: 0 },
    17: { rotateX: 180, rotateY: 72, rotateZ: 0 },
    18: { rotateX: 180, rotateY: 144, rotateZ: 0 },
    19: { rotateX: 180, rotateY: 216, rotateZ: 0 },
    20: { rotateX: 180, rotateY: 288, rotateZ: 0 },
  },
};

// Get max value for die type
function getMaxValue(dieType: DieType): number {
  const match = dieType.match(/d(\d+)/);
  return match ? parseInt(match[1], 10) : 6;
}

export function Dice3D({
  dieType,
  result,
  rolling = false,
  onRollComplete,
  size = 60,
  luckModifier = 0,
  className = '',
}: Dice3DProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [currentRotation, setCurrentRotation] = useState({ rotateX: 0, rotateY: 0, rotateZ: 0 });
  const [showResult, setShowResult] = useState(false);
  const rollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get final rotation to show result
  const getResultRotation = useCallback(() => {
    const maxVal = getMaxValue(dieType);
    const clampedResult = Math.min(Math.max(1, result), maxVal);

    // For d10, 0 is represented as 10
    const lookupValue = dieType === 'd10' && clampedResult === 10 ? 0 : clampedResult;

    const rotations = FACE_ROTATIONS[dieType];
    if (rotations && rotations[lookupValue]) {
      return rotations[lookupValue];
    }

    // Fallback rotation
    return { rotateX: 0, rotateY: 0, rotateZ: 0 };
  }, [dieType, result]);

  // Handle rolling animation
  useEffect(() => {
    if (rolling && !isRolling) {
      setIsRolling(true);
      setShowResult(false);

      // Random tumbling during roll
      const rollDuration = 1500 + Math.random() * 500;
      const tumbleInterval = setInterval(() => {
        setCurrentRotation({
          rotateX: Math.random() * 720 - 360,
          rotateY: Math.random() * 720 - 360,
          rotateZ: Math.random() * 720 - 360,
        });
      }, 100);

      rollTimeoutRef.current = setTimeout(() => {
        clearInterval(tumbleInterval);
        setCurrentRotation(getResultRotation());
        setShowResult(true);

        setTimeout(() => {
          setIsRolling(false);
          onRollComplete?.();
        }, 300);
      }, rollDuration);

      return () => {
        clearInterval(tumbleInterval);
        if (rollTimeoutRef.current) {
          clearTimeout(rollTimeoutRef.current);
        }
      };
    }
  }, [rolling, isRolling, getResultRotation, onRollComplete]);

  // Handle external rolling prop becoming false while still animating
  // This can happen if the parent decides the roll is complete before our animation finishes
  useEffect(() => {
    if (!rolling && isRolling) {
      // External says stop rolling - force stop the animation
      setIsRolling(false);
      setCurrentRotation(getResultRotation());
      setShowResult(true);
    }
  }, [rolling, isRolling, getResultRotation]);

  // Set initial rotation when not rolling
  useEffect(() => {
    if (!rolling && !isRolling) {
      setCurrentRotation(getResultRotation());
      setShowResult(true);
    }
  }, [rolling, isRolling, result, getResultRotation]);

  const maxVal = getMaxValue(dieType);
  const isCritical = dieType === 'd20' && result === 20;
  const isFumble = dieType === 'd20' && result === 1;
  const hasLuck = luckModifier !== 0;

  return (
    <div
      className={`dice3d ${className} ${isRolling ? 'rolling' : ''} ${isCritical ? 'critical' : ''} ${isFumble ? 'fumble' : ''} ${hasLuck ? 'luck-influenced' : ''}`}
      style={{ '--dice-size': `${size}px` } as React.CSSProperties}
    >
      <div className="dice3d-scene">
        <div
          className={`dice3d-cube dice3d-${dieType}`}
          style={{
            transform: `rotateX(${currentRotation.rotateX}deg) rotateY(${currentRotation.rotateY}deg) rotateZ(${currentRotation.rotateZ}deg)`,
          }}
        >
          {/* Generate faces based on die type */}
          {Array.from({ length: dieType === 'd10' ? 10 : maxVal }, (_, i) => (
            <div key={i} className={`dice3d-face dice3d-face-${i + 1}`}>
              {dieType === 'd10' && i === 9 ? '0' : i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Result display overlay */}
      {showResult && !isRolling && (
        <div className="dice3d-result">
          <span className={`dice3d-result-value ${isCritical ? 'critical' : ''} ${isFumble ? 'fumble' : ''}`}>
            {result}
          </span>
        </div>
      )}

      {/* Luck indicator */}
      {hasLuck && (
        <div className={`dice3d-luck ${luckModifier > 0 ? 'positive' : 'negative'}`}>
          {luckModifier > 0 ? '+' : ''}{luckModifier}
        </div>
      )}
    </div>
  );
}

export default Dice3D;
