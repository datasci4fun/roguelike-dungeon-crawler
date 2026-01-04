import { useCallback } from 'react';
import { useAudio } from '../contexts/AudioContext';
import './VolumeControls.css';

interface VolumeControlsProps {
  showSfx?: boolean;
  compact?: boolean;
}

export function VolumeControls({ showSfx = true, compact = false }: VolumeControlsProps) {
  const {
    masterVolume,
    musicVolume,
    sfxVolume,
    isMuted,
    setMasterVolume,
    setMusicVolume,
    setSfxVolume,
    toggleMute,
  } = useAudio();

  const handleMasterChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setMasterVolume(parseFloat(e.target.value));
    },
    [setMasterVolume]
  );

  const handleMusicChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setMusicVolume(parseFloat(e.target.value));
    },
    [setMusicVolume]
  );

  const handleSfxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSfxVolume(parseFloat(e.target.value));
    },
    [setSfxVolume]
  );

  const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

  return (
    <div className={`volume-controls ${compact ? 'compact' : ''}`}>
      <div className="volume-header">
        <span className="volume-title">Audio</span>
        <button
          className={`mute-button ${isMuted ? 'muted' : ''}`}
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '\u{1F507}' : '\u{1F50A}'}
        </button>
      </div>

      <div className="volume-sliders">
        <div className="volume-slider-row">
          <label htmlFor="master-volume">Master</label>
          <input
            id="master-volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={masterVolume}
            onChange={handleMasterChange}
            className="volume-slider"
          />
          <span className="volume-value">{formatPercent(masterVolume)}</span>
        </div>

        <div className="volume-slider-row">
          <label htmlFor="music-volume">Music</label>
          <input
            id="music-volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={musicVolume}
            onChange={handleMusicChange}
            className="volume-slider"
          />
          <span className="volume-value">{formatPercent(musicVolume)}</span>
        </div>

        {showSfx && (
          <div className="volume-slider-row">
            <label htmlFor="sfx-volume">SFX</label>
            <input
              id="sfx-volume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sfxVolume}
              onChange={handleSfxChange}
              className="volume-slider"
            />
            <span className="volume-value">{formatPercent(sfxVolume)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
