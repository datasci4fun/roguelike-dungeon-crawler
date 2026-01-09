/**
 * Cutscene Engine - Type Definitions
 * Modular system for cinematic sequences with effects and timing
 */

// ============================================
// EFFECT TYPES
// ============================================

export type FxType = 'flash' | 'shake' | 'flicker' | 'pressure' | 'none';
export type FxCueMatch = 'exact' | 'prefix' | 'includes';

export interface FxEvent {
  type: FxType;
  duration?: number; // ms
  intensity?: 'light' | 'medium' | 'heavy';
}

export interface FxCue {
  onText: string;
  match?: FxCueMatch;
  events: FxEvent[];
}

// ============================================
// PARTICLE TYPES
// ============================================

export type ParticleType =
  | 'stars'
  | 'embers'
  | 'dust'
  | 'darkness'
  | 'magic'
  | 'ash'
  | 'mist'
  | 'none';

export interface ParticleConfig {
  type: ParticleType;
  count?: number;
  speed?: 'slow' | 'normal' | 'fast';
  opacity?: number;
}

// ============================================
// BACKGROUND TYPES
// ============================================

export type BackgroundType =
  | 'title'
  | 'kingdom'
  | 'darkness'
  | 'underground'
  | 'depths'
  | 'entrance'
  | 'awakening'
  | 'victory'
  | 'defeat'
  | 'black';

export interface BackgroundConfig {
  type: BackgroundType;
  parallax?: boolean;
  animate?: boolean;
}

// ============================================
// TEXT/CAPTION TYPES
// ============================================

export type TextEffect =
  | 'typewriter'
  | 'fade'
  | 'glitch'
  | 'flicker'
  | 'none';

export interface CaptionLine {
  text: string;
  effect?: TextEffect;
  delay?: number; // ms before this line appears
  duration?: number; // ms to display (for auto-advance)
  style?: 'normal' | 'emphasis' | 'dramatic' | 'whisper';
}

export interface CaptionConfig {
  lines: CaptionLine[];
  position?: 'center' | 'bottom' | 'top';
  typeSpeed?: number; // legacy; ignored by our retro renderer
}

// ============================================
// SCENE TYPES
// ============================================

export type FadeStyle = 'slow' | 'fast' | 'dramatic' | 'none';

export interface SceneMetadata {
  id: string;
  name?: string;
  duration: number; // ms - total scene duration
  fadeIn?: FadeStyle;
  fadeOut?: FadeStyle;
}

export interface SceneConfig {
  meta: SceneMetadata;
  background: BackgroundConfig;
  particles?: ParticleConfig;
  captions?: CaptionConfig;
  effects?: FxEvent[];
  effectTimings?: number[];
  music?: string;
  ambience?: string;
  fxCues?: FxCue[];
}

// ============================================
// CUTSCENE TYPES
// ============================================

export interface CutsceneConfig {
  id: string;
  name: string;
  scenes: SceneConfig[];
  music?: string;
  skippable?: boolean;
  showProgress?: boolean;
  crtEffect?: boolean;
}

// ============================================
// PLAYER STATE
// ============================================

export interface CutsceneState {
  currentSceneIndex: number;
  sceneProgress: number;
  isPlaying: boolean;
  isPaused: boolean;
  fadeState: 'in' | 'visible' | 'out';
  activeEffects: FxType[];

  // Used for replay / forcing scene rerun without index change
  sceneRunId: number;
}

// ============================================
// CALLBACKS
// ============================================

export interface CutsceneCallbacks {
  onComplete: () => void;
  onSkip?: () => void;
  onSceneChange?: (sceneIndex: number, sceneId: string) => void;
  onMusicChange?: (trackId: string) => void;
  onSfxPlay?: (sfxId: string, opts?: { volume?: number }) => void;
}

// ============================================
// COMPONENT PROPS
// ============================================

export interface CutscenePlayerProps extends CutsceneCallbacks {
  cutscene: CutsceneConfig;
  autoPlay?: boolean;
}

export interface SceneBackgroundProps {
  config: BackgroundConfig;
  fadeState: 'in' | 'visible' | 'out';
}

export interface ParticlesLayerProps {
  config: ParticleConfig;
}

export interface FxLayerProps {
  activeEffects: FxType[];
  onEffectComplete?: (effect: FxType) => void;
}

export interface CrtLayerProps {
  enabled: boolean;
  intensity?: 'light' | 'medium' | 'heavy';
}

export interface RetroCaptionProps {
  config: CaptionConfig;
  isActive: boolean;
  onComplete?: () => void;
  onLineRevealDone?: (lineIndex: number, line: CaptionLine) => void;
}
