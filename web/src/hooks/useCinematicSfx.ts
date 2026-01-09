/**
 * Cinematic SFX Hook
 * Plays audio file-based sound effects for cutscenes using Howler.js,
 * with automatic fallback to procedural synthesis if files don't exist.
 */

import { useCallback, useRef } from 'react';
import { Howl } from 'howler';
import { useAudio } from '../contexts/AudioContext';
import { useSoundEffect } from './useSoundEffect';
import {
  CINEMATIC_SFX,
  isCinematicSfx,
  type CinematicSfxId,
} from '../config/cinematicSfxConfig';
import type { SfxId } from '../config/sfxConfig';

// Cache for loaded Howl instances (null = failed to load, use procedural)
const sfxCache = new Map<string, Howl | null>();
const failedLoads = new Set<string>();

export function useCinematicSfx() {
  const { getEffectiveVolume, isUnlocked } = useAudio();
  const { play: playProcedural } = useSoundEffect();
  const lastPlayedRef = useRef<Record<string, number>>({});

  // Get or create a Howl instance for an SFX
  const getHowl = useCallback((sfxId: CinematicSfxId): Howl | null => {
    // Already know this file doesn't exist
    if (failedLoads.has(sfxId)) return null;

    const config = CINEMATIC_SFX[sfxId];
    if (!config) return null;

    // Check cache first
    if (sfxCache.has(sfxId)) {
      return sfxCache.get(sfxId) ?? null;
    }

    // Create new Howl instance
    const howl = new Howl({
      src: [config.file],
      volume: config.volume ?? 1.0,
      preload: true,
      onloaderror: () => {
        // Mark as failed, will use procedural fallback
        failedLoads.add(sfxId);
        sfxCache.set(sfxId, null);
      },
    });

    sfxCache.set(sfxId, howl);
    return howl;
  }, []);

  // Play a cinematic SFX (file-based or procedural fallback)
  const play = useCallback(
    (id: string, opts?: { volume?: number }) => {
      // Must be unlocked
      if (!isUnlocked) return;

      // Validate ID
      if (!isCinematicSfx(id)) {
        // Try procedural as last resort
        playProcedural(id as SfxId, opts);
        return;
      }

      // Cooldown check (150ms minimum gap per sound)
      const now = performance.now();
      const last = lastPlayedRef.current[id] ?? 0;
      if (now - last < 150) return;
      lastPlayedRef.current[id] = now;

      // If file failed to load, use procedural
      if (failedLoads.has(id)) {
        playProcedural(id as SfxId, opts);
        return;
      }

      const howl = getHowl(id);

      // If no howl yet or failed, try procedural
      if (!howl) {
        playProcedural(id as SfxId, opts);
        return;
      }

      // Check if actually loaded (state: 'loaded')
      if (howl.state() !== 'loaded') {
        // Not loaded yet - fall back to procedural
        playProcedural(id as SfxId, opts);
        return;
      }

      // Calculate final volume
      const sfxVolume = getEffectiveVolume('sfx');
      const configVolume = CINEMATIC_SFX[id].volume ?? 1.0;
      const perCallVolume = opts?.volume ?? 1.0;
      const finalVolume = sfxVolume * configVolume * perCallVolume;

      // Play with adjusted volume
      howl.volume(finalVolume);
      howl.play();
    },
    [isUnlocked, getEffectiveVolume, getHowl, playProcedural]
  );

  // Preload all cinematic SFX (call during loading screen if needed)
  const preloadAll = useCallback(() => {
    for (const sfxId of Object.keys(CINEMATIC_SFX) as CinematicSfxId[]) {
      getHowl(sfxId);
    }
  }, [getHowl]);

  return {
    play,
    preloadAll,
  };
}
