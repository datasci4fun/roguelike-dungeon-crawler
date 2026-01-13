/**
 * Audio Jukebox - Dev tool for previewing all game audio
 *
 * Features:
 * - Vinyl record visualization that spins when playing
 * - Real-time audio frequency visualizer
 * - Track browser organized by category
 * - Playback controls with seek bar
 * - Waveform display
 * - Integration with game's audio system
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Howl } from 'howler';
import { useAudio } from '../contexts/AudioContext';
import { MUSIC_TRACKS, BIOME_NAMES } from '../config/audioConfig';
import './AudioJukebox.css';

interface TrackInfo {
  id: string;
  name: string;
  category: 'ui' | 'biome' | 'special';
  floor?: number;
  boss?: string;
  file: string;
  duration?: number;
}

// Build track catalog from config
const TRACK_CATALOG: TrackInfo[] = [
  // UI Tracks
  { id: 'menu', name: 'Main Menu', category: 'ui', file: MUSIC_TRACKS.menu.file },
  { id: 'character_creation', name: 'Character Creation', category: 'ui', file: MUSIC_TRACKS.character_creation.file },
  { id: 'intro', name: 'Intro / Prologue', category: 'ui', file: MUSIC_TRACKS.intro.file },

  // Biome Tracks
  { id: 'biome_stone', name: 'Stone Dungeon', category: 'biome', floor: 1, boss: 'Goblin King', file: MUSIC_TRACKS.biome_stone.file },
  { id: 'biome_sewer', name: 'Sewers of Valdris', category: 'biome', floor: 2, boss: 'Rat King', file: MUSIC_TRACKS.biome_sewer.file },
  { id: 'biome_forest', name: 'Forest Depths', category: 'biome', floor: 3, boss: 'Spider Queen', file: MUSIC_TRACKS.biome_forest.file },
  { id: 'biome_crypt', name: 'Mirror Valdris', category: 'biome', floor: 4, boss: 'The Regent', file: MUSIC_TRACKS.biome_crypt.file },
  { id: 'biome_ice', name: 'Ice Cavern', category: 'biome', floor: 5, boss: 'Frost Giant', file: MUSIC_TRACKS.biome_ice.file },
  { id: 'biome_library', name: 'Ancient Library', category: 'biome', floor: 6, boss: 'Arcane Keeper', file: MUSIC_TRACKS.biome_library.file },
  { id: 'biome_volcanic', name: 'Volcanic Depths', category: 'biome', floor: 7, boss: 'Flame Lord', file: MUSIC_TRACKS.biome_volcanic.file },
  { id: 'biome_crystal', name: 'Crystal Cave', category: 'biome', floor: 8, boss: 'Dragon Emperor', file: MUSIC_TRACKS.biome_crystal.file },

  // Special Tracks
  { id: 'victory', name: 'Victory', category: 'special', file: MUSIC_TRACKS.victory.file },
  { id: 'death', name: 'Death', category: 'special', file: MUSIC_TRACKS.death.file },
];

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  ui: '#58a6ff',
  biome: '#7ee787',
  special: '#d2a8ff',
};

// Floor colors for vinyl
const FLOOR_COLORS: Record<number, string> = {
  1: '#6b7280', // Stone - gray
  2: '#065f46', // Sewer - dark green
  3: '#166534', // Forest - green
  4: '#7c3aed', // Crypt - purple
  5: '#0ea5e9', // Ice - cyan
  6: '#c2410c', // Library - amber
  7: '#dc2626', // Volcanic - red
  8: '#8b5cf6', // Crystal - violet
};

export function AudioJukebox() {
  const { getEffectiveVolume, isUnlocked, unlockAudio } = useAudio();
  const [currentTrack, setCurrentTrack] = useState<TrackInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [analyserData, setAnalyserData] = useState<number[]>(new Array(64).fill(0));

  const howlRef = useRef<Howl | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number>(0);
  const progressIntervalRef = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (howlRef.current) {
        howlRef.current.stop();
        howlRef.current.unload();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Setup audio analyser
  const setupAnalyser = useCallback((howl: Howl) => {
    try {
      // Get or create audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;

      // Create analyser
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // Connect Howler to analyser
      // Howler exposes the audio node through _sounds
      const sounds = (howl as unknown as { _sounds: Array<{ _node: HTMLAudioElement }> })._sounds;
      if (sounds && sounds[0] && sounds[0]._node) {
        const source = ctx.createMediaElementSource(sounds[0]._node);
        source.connect(analyser);
        analyser.connect(ctx.destination);
      }

      // Start visualization loop
      const updateVisualizer = () => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Normalize to 0-1 range
        const normalized = Array.from(dataArray).map(v => v / 255);
        setAnalyserData(normalized);

        animationRef.current = requestAnimationFrame(updateVisualizer);
      };
      updateVisualizer();
    } catch (e) {
      console.warn('Could not setup audio analyser:', e);
    }
  }, []);

  // Play track
  const playTrack = useCallback((track: TrackInfo) => {
    if (!isUnlocked) {
      unlockAudio();
    }

    // Stop current track
    if (howlRef.current) {
      howlRef.current.stop();
      howlRef.current.unload();
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    setIsLoading(true);
    setCurrentTrack(track);
    setProgress(0);

    const effectiveVolume = getEffectiveVolume('music');

    const howl = new Howl({
      src: [track.file],
      html5: true,
      volume: effectiveVolume,
      onload: () => {
        setDuration(howl.duration());
        setIsLoading(false);
      },
      onplay: () => {
        setIsPlaying(true);
        setupAnalyser(howl);

        // Update progress
        progressIntervalRef.current = window.setInterval(() => {
          const seek = howl.seek() as number;
          setProgress(seek);
        }, 100);
      },
      onpause: () => setIsPlaying(false),
      onstop: () => {
        setIsPlaying(false);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      },
      onend: () => {
        setIsPlaying(false);
        setProgress(0);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      },
      onloaderror: (_, err) => {
        console.error('Failed to load track:', err);
        setIsLoading(false);
      },
    });

    howlRef.current = howl;
    howl.play();
  }, [isUnlocked, unlockAudio, getEffectiveVolume, setupAnalyser]);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (!howlRef.current) return;

    if (isPlaying) {
      howlRef.current.pause();
    } else {
      howlRef.current.play();
    }
  }, [isPlaying]);

  // Stop playback
  const stopPlayback = useCallback(() => {
    if (howlRef.current) {
      howlRef.current.stop();
    }
    setProgress(0);
    setAnalyserData(new Array(64).fill(0));
  }, []);

  // Seek
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    if (howlRef.current) {
      howlRef.current.seek(seekTime);
      setProgress(seekTime);
    }
  }, []);

  // Skip to next/previous track
  const skipTrack = useCallback((direction: 1 | -1) => {
    if (!currentTrack) return;
    const currentIndex = TRACK_CATALOG.findIndex(t => t.id === currentTrack.id);
    const newIndex = (currentIndex + direction + TRACK_CATALOG.length) % TRACK_CATALOG.length;
    playTrack(TRACK_CATALOG[newIndex]);
  }, [currentTrack, playTrack]);

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get vinyl color based on current track
  const getVinylColor = (): string => {
    if (!currentTrack) return '#1a1a2e';
    if (currentTrack.floor) return FLOOR_COLORS[currentTrack.floor] || '#1a1a2e';
    if (currentTrack.category === 'special') return '#d2a8ff';
    return '#58a6ff';
  };

  // Group tracks by category
  const groupedTracks = {
    ui: TRACK_CATALOG.filter(t => t.category === 'ui'),
    biome: TRACK_CATALOG.filter(t => t.category === 'biome'),
    special: TRACK_CATALOG.filter(t => t.category === 'special'),
  };

  return (
    <div className="audio-jukebox">
      {/* Header */}
      <header className="jukebox-header">
        <div className="header-title">
          <h1>Audio Jukebox</h1>
          <span className="track-count">{TRACK_CATALOG.length} tracks</span>
        </div>
        <p className="header-subtitle">Preview and test all game music</p>
      </header>

      <div className="jukebox-body">
        {/* Left: Now Playing */}
        <div className="now-playing-panel">
          {/* Vinyl Record */}
          <div className="vinyl-container">
            <div
              className={`vinyl-record ${isPlaying ? 'spinning' : ''}`}
              style={{ '--vinyl-color': getVinylColor() } as React.CSSProperties}
            >
              <div className="vinyl-grooves">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="groove" style={{ '--i': i } as React.CSSProperties} />
                ))}
              </div>
              <div className="vinyl-label">
                {currentTrack ? (
                  <>
                    <div className="label-title">{currentTrack.name}</div>
                    {currentTrack.floor && (
                      <div className="label-floor">Floor {currentTrack.floor}</div>
                    )}
                  </>
                ) : (
                  <div className="label-empty">No Track</div>
                )}
              </div>
              <div className="vinyl-center" />
            </div>
            <div className={`tonearm ${isPlaying ? 'playing' : ''}`}>
              <div className="tonearm-base" />
              <div className="tonearm-arm" />
              <div className="tonearm-head" />
            </div>
          </div>

          {/* Visualizer */}
          <div className="visualizer">
            {analyserData.slice(0, 32).map((value, i) => (
              <div
                key={i}
                className="visualizer-bar"
                style={{
                  height: `${Math.max(4, value * 100)}%`,
                  backgroundColor: `hsl(${200 + i * 5}, 80%, ${50 + value * 30}%)`,
                }}
              />
            ))}
          </div>

          {/* Track Info */}
          <div className="track-info">
            {currentTrack ? (
              <>
                <h2 className="track-name">{currentTrack.name}</h2>
                <div className="track-meta">
                  <span
                    className="track-category"
                    style={{ backgroundColor: CATEGORY_COLORS[currentTrack.category] }}
                  >
                    {currentTrack.category}
                  </span>
                  {currentTrack.boss && (
                    <span className="track-boss">Boss: {currentTrack.boss}</span>
                  )}
                </div>
              </>
            ) : (
              <h2 className="track-name empty">Select a track to play</h2>
            )}
          </div>

          {/* Progress Bar */}
          <div className="progress-container">
            <span className="time-current">{formatTime(progress)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={progress}
              onChange={handleSeek}
              className="progress-slider"
              disabled={!currentTrack}
            />
            <span className="time-total">{formatTime(duration)}</span>
          </div>

          {/* Playback Controls */}
          <div className="playback-controls">
            <button
              className="control-btn skip-btn"
              onClick={() => skipTrack(-1)}
              disabled={!currentTrack}
              title="Previous track"
            >
              ⏮
            </button>
            <button
              className="control-btn play-btn"
              onClick={togglePlayPause}
              disabled={!currentTrack || isLoading}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading ? '...' : isPlaying ? '⏸' : '▶'}
            </button>
            <button
              className="control-btn stop-btn"
              onClick={stopPlayback}
              disabled={!currentTrack}
              title="Stop"
            >
              ⏹
            </button>
            <button
              className="control-btn skip-btn"
              onClick={() => skipTrack(1)}
              disabled={!currentTrack}
              title="Next track"
            >
              ⏭
            </button>
          </div>
        </div>

        {/* Right: Track List */}
        <div className="track-list-panel">
          {/* UI Tracks */}
          <div className="track-group">
            <h3 className="group-title">
              <span className="group-icon" style={{ backgroundColor: CATEGORY_COLORS.ui }}>UI</span>
              Menu & Interface
            </h3>
            <ul className="track-list">
              {groupedTracks.ui.map(track => (
                <li
                  key={track.id}
                  className={`track-item ${currentTrack?.id === track.id ? 'active' : ''}`}
                  onClick={() => playTrack(track)}
                >
                  <span className="track-play-indicator">
                    {currentTrack?.id === track.id && isPlaying ? '▶' : '○'}
                  </span>
                  <span className="track-item-name">{track.name}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Biome Tracks */}
          <div className="track-group">
            <h3 className="group-title">
              <span className="group-icon" style={{ backgroundColor: CATEGORY_COLORS.biome }}>BIOME</span>
              Dungeon Floors
            </h3>
            <ul className="track-list">
              {groupedTracks.biome.map(track => (
                <li
                  key={track.id}
                  className={`track-item ${currentTrack?.id === track.id ? 'active' : ''}`}
                  onClick={() => playTrack(track)}
                >
                  <span className="track-play-indicator">
                    {currentTrack?.id === track.id && isPlaying ? '▶' : '○'}
                  </span>
                  <span className="track-floor-badge" style={{ backgroundColor: FLOOR_COLORS[track.floor!] }}>
                    F{track.floor}
                  </span>
                  <div className="track-item-info">
                    <span className="track-item-name">{track.name}</span>
                    <span className="track-item-boss">{track.boss}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Special Tracks */}
          <div className="track-group">
            <h3 className="group-title">
              <span className="group-icon" style={{ backgroundColor: CATEGORY_COLORS.special }}>EVENT</span>
              Special Events
            </h3>
            <ul className="track-list">
              {groupedTracks.special.map(track => (
                <li
                  key={track.id}
                  className={`track-item ${currentTrack?.id === track.id ? 'active' : ''}`}
                  onClick={() => playTrack(track)}
                >
                  <span className="track-play-indicator">
                    {currentTrack?.id === track.id && isPlaying ? '▶' : '○'}
                  </span>
                  <span className="track-item-name">{track.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AudioJukebox;
