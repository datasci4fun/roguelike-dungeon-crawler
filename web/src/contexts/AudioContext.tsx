import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import {
  DEFAULT_AUDIO_SETTINGS,
  AUDIO_STORAGE_KEY,
} from '../config/audioConfig';

interface AudioState {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  isMuted: boolean;
  isUnlocked: boolean;  // Browser audio context unlocked
}

interface AudioContextType extends AudioState {
  setMasterVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  toggleMute: () => void;
  unlockAudio: () => void;
  getEffectiveVolume: (type: 'music' | 'sfx') => number;
}

const AudioContext = createContext<AudioContextType | null>(null);

function loadSettings(): Partial<AudioState> {
  try {
    const saved = localStorage.getItem(AUDIO_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load audio settings:', e);
  }
  return {};
}

function saveSettings(state: AudioState) {
  try {
    localStorage.setItem(
      AUDIO_STORAGE_KEY,
      JSON.stringify({
        masterVolume: state.masterVolume,
        musicVolume: state.musicVolume,
        sfxVolume: state.sfxVolume,
        isMuted: state.isMuted,
      })
    );
  } catch (e) {
    console.warn('Failed to save audio settings:', e);
  }
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AudioState>(() => {
    const saved = loadSettings();
    return {
      masterVolume: saved.masterVolume ?? DEFAULT_AUDIO_SETTINGS.masterVolume,
      musicVolume: saved.musicVolume ?? DEFAULT_AUDIO_SETTINGS.musicVolume,
      sfxVolume: saved.sfxVolume ?? DEFAULT_AUDIO_SETTINGS.sfxVolume,
      isMuted: saved.isMuted ?? DEFAULT_AUDIO_SETTINGS.isMuted,
      isUnlocked: false,
    };
  });

  // Save settings whenever they change
  useEffect(() => {
    saveSettings(state);
  }, [state.masterVolume, state.musicVolume, state.sfxVolume, state.isMuted]);

  const setMasterVolume = useCallback((volume: number) => {
    setState((s) => ({ ...s, masterVolume: Math.max(0, Math.min(1, volume)) }));
  }, []);

  const setMusicVolume = useCallback((volume: number) => {
    setState((s) => ({ ...s, musicVolume: Math.max(0, Math.min(1, volume)) }));
  }, []);

  const setSfxVolume = useCallback((volume: number) => {
    setState((s) => ({ ...s, sfxVolume: Math.max(0, Math.min(1, volume)) }));
  }, []);

  const toggleMute = useCallback(() => {
    setState((s) => ({ ...s, isMuted: !s.isMuted }));
  }, []);

  const unlockAudio = useCallback(() => {
    setState((s) => ({ ...s, isUnlocked: true }));
  }, []);

  const getEffectiveVolume = useCallback(
    (type: 'music' | 'sfx') => {
      if (state.isMuted) return 0;
      const typeVolume = type === 'music' ? state.musicVolume : state.sfxVolume;
      return state.masterVolume * typeVolume;
    },
    [state.masterVolume, state.musicVolume, state.sfxVolume, state.isMuted]
  );

  return (
    <AudioContext.Provider
      value={{
        ...state,
        setMasterVolume,
        setMusicVolume,
        setSfxVolume,
        toggleMute,
        unlockAudio,
        getEffectiveVolume,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
