/**
 * Sound Effects Hook
 * Uses Web Audio API to generate synthetic sounds.
 * No audio files required - all sounds are procedurally generated.
 */

import { useCallback, useRef, useEffect } from 'react';
import { useAudio } from '../contexts/AudioContext';
import { SFX_DEFINITIONS, type SfxId, type SfxNote, type SfxEnvelope } from '../config/sfxConfig';

// Default envelope values
const DEFAULT_ENVELOPE: SfxEnvelope = {
  attack: 0.01,
  decay: 0.1,
  sustain: 0.5,
  release: 0.1,
};

export function useSoundEffect() {
  const { getEffectiveVolume, isUnlocked } = useAudio();
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize AudioContext on first use (must be after user interaction)
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    // Resume if suspended (browser autoplay policy)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  // Play a single note with envelope
  const playNote = useCallback((
    ctx: AudioContext,
    note: SfxNote,
    masterVolume: number,
    startTime: number
  ) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = note.type;
    osc.frequency.setValueAtTime(note.frequency, startTime);

    // Apply pitch bend if specified
    if (note.pitchBend) {
      osc.frequency.linearRampToValueAtTime(
        note.frequency + note.pitchBend,
        startTime + note.duration
      );
    }

    // Get envelope values
    const env = {
      ...DEFAULT_ENVELOPE,
      ...note.envelope,
    };

    const noteVolume = (note.volume ?? 1) * masterVolume;
    const attackEnd = startTime + env.attack;
    const decayEnd = attackEnd + env.decay;
    const releaseStart = startTime + note.duration - env.release;

    // ADSR envelope
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(noteVolume, attackEnd);
    gain.gain.linearRampToValueAtTime(noteVolume * env.sustain, decayEnd);
    gain.gain.setValueAtTime(noteVolume * env.sustain, releaseStart);
    gain.gain.linearRampToValueAtTime(0, startTime + note.duration);

    // Connect and schedule
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + note.duration + 0.01);

    return { osc, gain };
  }, []);

  // Play a sound effect by ID
  const play = useCallback((sfxId: SfxId) => {
    // Check if audio is unlocked and volume is audible
    if (!isUnlocked) return;

    const volume = getEffectiveVolume('sfx');
    if (volume <= 0) return;

    const definition = SFX_DEFINITIONS[sfxId];
    if (!definition) {
      console.warn(`Unknown SFX: ${sfxId}`);
      return;
    }

    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const masterVolume = volume * (definition.volume ?? 1);

      // Play all notes in the definition
      for (const note of definition.notes) {
        const noteStart = now + (note.delay ?? 0);
        playNote(ctx, note, masterVolume, noteStart);
      }
    } catch (err) {
      console.warn('Failed to play SFX:', err);
    }
  }, [isUnlocked, getEffectiveVolume, getAudioContext, playNote]);

  // Play multiple sounds in sequence with optional gap
  const playSequence = useCallback((sfxIds: SfxId[], gapMs = 100) => {
    sfxIds.forEach((id, index) => {
      setTimeout(() => play(id), index * gapMs);
    });
  }, [play]);

  return {
    play,
    playSequence,
  };
}

// Convenience hook for components that just need to play sounds
export function useSfx() {
  const { play } = useSoundEffect();
  return play;
}
