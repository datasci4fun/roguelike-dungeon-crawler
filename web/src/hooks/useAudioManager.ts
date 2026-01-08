import { useCallback, useEffect } from 'react';
import { Howl } from 'howler';
import { useAudio } from '../contexts/AudioContext';
import { MUSIC_TRACKS, CROSSFADE_DURATION } from '../config/audioConfig';

// Global state - persists across component mounts/unmounts
let currentTrack: Howl | null = null;
let currentTrackId: string | null = null;

export function useAudioManager() {
  const {
    masterVolume,
    musicVolume,
    isMuted,
    isUnlocked,
    unlockAudio,
    getEffectiveVolume,
  } = useAudio();

  // Create a Howl instance for a track
  const createTrack = useCallback((trackId: string): Howl | null => {
    const config = MUSIC_TRACKS[trackId];
    if (!config) {
      console.warn(`Track not found: ${trackId}`);
      return null;
    }

    const effectiveVolume = getEffectiveVolume('music');
    const trackVolume = config.volume ?? 1.0;

    // Simple looping track (no sprites for HTML5 compatibility)
    return new Howl({
      src: [config.file],
      html5: true, // Use HTML5 Audio for better codec compatibility
      loop: true,
      volume: effectiveVolume * trackVolume,
      onloaderror: (_id, err) => {
        console.error(`Failed to load track ${trackId}:`, err);
      },
      onplayerror: (_id, err) => {
        console.error(`Failed to play track ${trackId}:`, err);
      },
      onload: () => {
        console.log(`Track loaded: ${trackId}`);
      },
    });
  }, [getEffectiveVolume]);

  // Play a track
  const playMusic = useCallback((trackId: string) => {
    if (!isUnlocked) {
      console.log('Audio not unlocked yet. Call unlockAudio() first.');
      return;
    }

    // Already playing this track
    if (currentTrackId === trackId && currentTrack?.playing()) {
      return;
    }

    // Stop current track
    if (currentTrack) {
      currentTrack.stop();
      currentTrack.unload();
    }

    const track = createTrack(trackId);
    if (!track) return;

    currentTrack = track;
    currentTrackId = trackId;
    track.play();
  }, [isUnlocked, createTrack]);

  // Stop current music with fade out
  const stopMusic = useCallback((fadeOut: boolean = true) => {
    if (!currentTrack) return;

    if (fadeOut) {
      const track = currentTrack;
      track.fade(track.volume(), 0, CROSSFADE_DURATION / 2);
      setTimeout(() => {
        track.stop();
        track.unload();
      }, CROSSFADE_DURATION / 2);
    } else {
      currentTrack.stop();
      currentTrack.unload();
    }

    currentTrack = null;
    currentTrackId = null;
  }, []);

  // Crossfade to a new track
  const crossfadeTo = useCallback((newTrackId: string, duration: number = CROSSFADE_DURATION) => {
    if (!isUnlocked) {
      console.log('Audio not unlocked yet. Call unlockAudio() first.');
      return;
    }

    // Already playing this track
    if (currentTrackId === newTrackId && currentTrack?.playing()) {
      return;
    }

    console.log(`Crossfading from ${currentTrackId} to ${newTrackId}`);

    const oldTrack = currentTrack;
    const newTrack = createTrack(newTrackId);
    if (!newTrack) return;

    // Update global state
    currentTrack = newTrack;
    currentTrackId = newTrackId;

    const config = MUSIC_TRACKS[newTrackId];
    const effectiveVolume = getEffectiveVolume('music');
    const trackVolume = config.volume ?? 1.0;
    const targetVolume = effectiveVolume * trackVolume;

    // Start new track at zero volume
    newTrack.volume(0);
    newTrack.play();

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
    if (currentTrack && currentTrackId) {
      const config = MUSIC_TRACKS[currentTrackId];
      const effectiveVolume = getEffectiveVolume('music');
      const trackVolume = config?.volume ?? 1.0;
      currentTrack.volume(effectiveVolume * trackVolume);
    }
  }, [masterVolume, musicVolume, isMuted, getEffectiveVolume]);

  // NO cleanup on unmount - music should persist across navigation

  // Get current playback state
  const getCurrentTrack = useCallback(() => currentTrackId, []);
  const isPlaying = useCallback(() => currentTrack?.playing() ?? false, []);

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
