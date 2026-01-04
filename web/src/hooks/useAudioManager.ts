import { useRef, useCallback, useEffect } from 'react';
import { Howl } from 'howler';
import { useAudio } from '../contexts/AudioContext';
import { MUSIC_TRACKS, CROSSFADE_DURATION } from '../config/audioConfig';

interface AudioManagerState {
  currentTrackId: string | null;
  isPlaying: boolean;
}

export function useAudioManager() {
  const {
    masterVolume,
    musicVolume,
    isMuted,
    isUnlocked,
    unlockAudio,
    getEffectiveVolume,
  } = useAudio();

  const currentTrackRef = useRef<Howl | null>(null);
  const currentTrackIdRef = useRef<string | null>(null);
  const stateRef = useRef<AudioManagerState>({
    currentTrackId: null,
    isPlaying: false,
  });

  // Create a Howl instance for a track
  const createTrack = useCallback((trackId: string): Howl | null => {
    const config = MUSIC_TRACKS[trackId];
    if (!config) {
      console.warn(`Track not found: ${trackId}`);
      return null;
    }

    const effectiveVolume = getEffectiveVolume('music');
    const trackVolume = config.volume ?? 1.0;

    // Handle loop points if specified
    if (config.loopStart !== undefined) {
      const loopStartMs = config.loopStart * 1000;
      const loopEndMs = config.loopEnd ? config.loopEnd * 1000 : undefined;

      // If no explicit loop end, use simple loop with offset
      const loopDurationMs = loopEndMs ? loopEndMs - loopStartMs : 600000; // 10 min fallback

      return new Howl({
        src: [config.file],
        volume: effectiveVolume * trackVolume,
        sprite: {
          intro: [0, loopStartMs, false],
          loop: [loopStartMs, loopDurationMs, true],
        },
        onloaderror: (_id, err) => {
          console.error(`Failed to load track ${trackId}:`, err);
        },
      });
    }

    // Simple looping track
    return new Howl({
      src: [config.file],
      loop: true,
      volume: effectiveVolume * trackVolume,
      onloaderror: (_id, err) => {
        console.error(`Failed to load track ${trackId}:`, err);
      },
    });
  }, [getEffectiveVolume]);

  // Play a track (with optional intro -> loop handling)
  const playMusic = useCallback((trackId: string) => {
    if (!isUnlocked) {
      console.log('Audio not unlocked yet. Call unlockAudio() first.');
      return;
    }

    // Already playing this track
    if (currentTrackIdRef.current === trackId && currentTrackRef.current?.playing()) {
      return;
    }

    // Stop current track
    if (currentTrackRef.current) {
      currentTrackRef.current.stop();
      currentTrackRef.current.unload();
    }

    const track = createTrack(trackId);
    if (!track) return;

    currentTrackRef.current = track;
    currentTrackIdRef.current = trackId;
    stateRef.current = { currentTrackId: trackId, isPlaying: true };

    const config = MUSIC_TRACKS[trackId];

    // If track has loop points, play intro then loop
    if (config.loopStart !== undefined) {
      track.play('intro');
      track.once('end', () => {
        if (currentTrackIdRef.current === trackId) {
          track.play('loop');
        }
      });
    } else {
      track.play();
    }
  }, [isUnlocked, createTrack]);

  // Stop current music with fade out
  const stopMusic = useCallback((fadeOut: boolean = true) => {
    if (!currentTrackRef.current) return;

    if (fadeOut) {
      const track = currentTrackRef.current;
      track.fade(track.volume(), 0, CROSSFADE_DURATION / 2);
      setTimeout(() => {
        track.stop();
        track.unload();
      }, CROSSFADE_DURATION / 2);
    } else {
      currentTrackRef.current.stop();
      currentTrackRef.current.unload();
    }

    currentTrackRef.current = null;
    currentTrackIdRef.current = null;
    stateRef.current = { currentTrackId: null, isPlaying: false };
  }, []);

  // Crossfade to a new track
  const crossfadeTo = useCallback((newTrackId: string, duration: number = CROSSFADE_DURATION) => {
    if (!isUnlocked) {
      console.log('Audio not unlocked yet. Call unlockAudio() first.');
      return;
    }

    // Already playing this track
    if (currentTrackIdRef.current === newTrackId && currentTrackRef.current?.playing()) {
      return;
    }

    const oldTrack = currentTrackRef.current;
    const newTrack = createTrack(newTrackId);
    if (!newTrack) return;

    // Start new track at zero volume
    newTrack.volume(0);
    currentTrackRef.current = newTrack;
    currentTrackIdRef.current = newTrackId;
    stateRef.current = { currentTrackId: newTrackId, isPlaying: true };

    const config = MUSIC_TRACKS[newTrackId];
    const effectiveVolume = getEffectiveVolume('music');
    const trackVolume = config.volume ?? 1.0;
    const targetVolume = effectiveVolume * trackVolume;

    // Play new track (handle loop points)
    if (config.loopStart !== undefined) {
      newTrack.play('intro');
      newTrack.once('end', () => {
        if (currentTrackIdRef.current === newTrackId) {
          newTrack.play('loop');
        }
      });
    } else {
      newTrack.play();
    }

    // Fade in new track
    newTrack.fade(0, targetVolume, duration);

    // Fade out and stop old track
    if (oldTrack) {
      oldTrack.fade(oldTrack.volume(), 0, duration);
      setTimeout(() => {
        oldTrack.stop();
        oldTrack.unload();
      }, duration);
    }
  }, [isUnlocked, createTrack, getEffectiveVolume]);

  // Update volume when settings change
  useEffect(() => {
    if (currentTrackRef.current && currentTrackIdRef.current) {
      const config = MUSIC_TRACKS[currentTrackIdRef.current];
      const effectiveVolume = getEffectiveVolume('music');
      const trackVolume = config?.volume ?? 1.0;
      currentTrackRef.current.volume(effectiveVolume * trackVolume);
    }
  }, [masterVolume, musicVolume, isMuted, getEffectiveVolume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentTrackRef.current) {
        currentTrackRef.current.stop();
        currentTrackRef.current.unload();
      }
    };
  }, []);

  // Get current playback state
  const getCurrentTrack = useCallback(() => currentTrackIdRef.current, []);
  const isPlaying = useCallback(() => currentTrackRef.current?.playing() ?? false, []);

  return {
    playMusic,
    stopMusic,
    crossfadeTo,
    getCurrentTrack,
    isPlaying,
    unlockAudio,
    isUnlocked,
  };
}
