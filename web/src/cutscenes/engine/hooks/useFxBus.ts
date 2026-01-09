/**
 * useFxBus - Hook for managing visual effects during cutscenes
 * Handles flash, shake, flicker, pressure effects with automatic cleanup
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { FxType, FxEvent } from '../types';

interface FxState {
  flash: boolean;
  shake: boolean;
  flicker: boolean;
  pressure: boolean;
}

interface UseFxBusReturn {
  activeEffects: FxType[];
  isEffectActive: (effect: FxType) => boolean;
  triggerEffect: (event: FxEvent) => void;
  clearEffect: (effect: FxType) => void;
  clearAll: () => void;

  // Pressure metadata (optional consumers)
  pressurePulseId: number;
  pressureIntensity: 'light' | 'medium' | 'heavy';
}

const DEFAULT_DURATIONS: Record<FxType, number> = {
  flash: 150,
  shake: 600,
  flicker: 300,
  pressure: 900, // pulse duration (medium)
  none: 0,
};

const INTENSITY_MULTIPLIERS: Record<string, number> = {
  light: 0.5,
  medium: 1,
  heavy: 1.5,
};

export function useFxBus(): UseFxBusReturn {
  const [fxState, setFxState] = useState<FxState>({
    flash: false,
    shake: false,
    flicker: false,
    pressure: false,
  });

  const [pressurePulseId, setPressurePulseId] = useState(0);
  const [pressureIntensity, setPressureIntensity] = useState<'light' | 'medium' | 'heavy'>('medium');

  const timersRef = useRef<Map<FxType, number>>(new Map());

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  const triggerEffect = useCallback((event: FxEvent) => {
    if (event.type === 'none') return;

    const intensity = (event.intensity || 'medium') as 'light' | 'medium' | 'heavy';
    const multiplier = INTENSITY_MULTIPLIERS[intensity] ?? 1;
    const baseDuration = event.duration || DEFAULT_DURATIONS[event.type];
    const duration = baseDuration * multiplier;

    const existingTimer = timersRef.current.get(event.type);
    if (existingTimer) clearTimeout(existingTimer);

    // Pressure: track intensity + bump pulse id so animation restarts
    if (event.type === 'pressure') {
      setPressureIntensity(intensity);
      setPressurePulseId((n) => n + 1);
    }

    setFxState((prev) => ({
      ...prev,
      [event.type]: true,
    }));

    const timer = window.setTimeout(() => {
      setFxState((prev) => ({
        ...prev,
        [event.type]: false,
      }));
      timersRef.current.delete(event.type);
    }, duration);

    timersRef.current.set(event.type, timer);
  }, []);

  const clearEffect = useCallback((effect: FxType) => {
    if (effect === 'none') return;

    const timer = timersRef.current.get(effect);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(effect);
    }

    setFxState((prev) => ({
      ...prev,
      [effect]: false,
    }));
  }, []);

  const clearAll = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();

    setFxState({
      flash: false,
      shake: false,
      flicker: false,
      pressure: false,
    });
  }, []);

  const isEffectActive = useCallback(
    (effect: FxType): boolean => {
      if (effect === 'none') return false;
      return fxState[effect as keyof FxState] ?? false;
    },
    [fxState]
  );

  const activeEffects: FxType[] = (Object.keys(fxState) as (keyof FxState)[])
    .filter((k) => fxState[k]) as FxType[];

  return {
    activeEffects,
    isEffectActive,
    triggerEffect,
    clearEffect,
    clearAll,
    pressurePulseId,
    pressureIntensity,
  };
}
