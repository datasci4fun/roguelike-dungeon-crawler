/**
 * CutscenePlayer - Main cutscene playback component
 * Orchestrates all layers and handles scene progression
 */

import { useCallback, useEffect, useState } from 'react';
import type { CutscenePlayerProps, FxType, FadeStyle } from './types';
import { useCutsceneTimeline } from './hooks/useCutsceneTimeline';
import { useFxBus } from './hooks/useFxBus';
import { SceneBackground } from './layers/SceneBackground';
import { ParticlesLayer } from './layers/ParticlesLayer';
import { FxLayer } from './layers/FxLayer';
import { CrtLayer } from './layers/CrtLayer';
import { RetroCaption } from './text/RetroCaption';
import { CutsceneHUD } from './ui/CutsceneHUD';
import { TitleScreen } from '../intro/scenes/00_Title/TitleScreen';
import './CutscenePlayer.scss';

// Debug mode - keep true while tuning scenes
const DEBUG_MODE = false;

const FADE_DURATIONS: Record<FadeStyle, number> = {
  slow: 1500,
  fast: 300,
  dramatic: 2000,
  none: 0,
};

export function CutscenePlayer({
  cutscene,
  autoPlay = true,
  onComplete,
  onSkip,
  onSceneChange,
  onMusicChange,
  onSfxPlay,
}: CutscenePlayerProps) {
  const [introComplete, setIntroComplete] = useState(false);

  const { state, currentScene, isLastScene, advance, goToScene } =
    useCutsceneTimeline(cutscene, {
      // In debug mode: we still want fade-in + visible state, but NO auto transitions
      autoPlay: DEBUG_MODE ? true : autoPlay,
      debugMode: DEBUG_MODE,
      onSceneChange,
      onComplete: () => {
        if (isLastScene) {
          setIntroComplete(true);
        } else {
          onComplete();
        }
      },
    });

  // ✅ UPDATED: include pressurePulseId + pressureIntensity from useFxBus
  const {
    activeEffects,
    triggerEffect,
    clearAll,
    pressurePulseId,
    pressureIntensity,
  } = useFxBus();

  // FX -> SFX bridge (optional). Keeps visuals decoupled from audio system.
  const triggerEffectWithSfx = useCallback(
    (ev: any) => {
      triggerEffect(ev);

      if (!onSfxPlay || !ev?.type || ev.type === 'none') return;
      const intensity: 'light' | 'medium' | 'heavy' = ev.intensity ?? 'medium';

      const map: Record<string, Record<string, string>> = {
        flash: {
          light: 'sfx_lightning_soft',
          medium: 'sfx_lightning',
          heavy: 'sfx_thunder_clap',
        },
        pressure: {
          light: 'sfx_rumble_soft',
          medium: 'sfx_rumble',
          heavy: 'sfx_rumble_heavy',
        },
        shake: {
          light: 'sfx_stone_shift',
          medium: 'sfx_impact',
          heavy: 'sfx_impact_heavy',
        },
        flicker: {
          light: 'sfx_power_tick',
          medium: 'sfx_power_buzz',
          heavy: 'sfx_power_surge',
        },
      };

      const id = map[ev.type]?.[intensity];
      if (id) {
        onSfxPlay(id, { volume: intensity === 'heavy' ? 1 : 0.85 });
      }
    },
    [triggerEffect, onSfxPlay]
  );

  // Trigger music on mount
  useEffect(() => {
    if (cutscene.music) {
      onMusicChange?.(cutscene.music);
    }
  }, [cutscene.music, onMusicChange]);

  // Trigger scene-specific effects
  useEffect(() => {
    if (!currentScene?.effects) return;

    const timings = currentScene.effectTimings || [];
    const timers: number[] = [];

    currentScene.effects.forEach((effect, index) => {
      const delay = timings[index] || 0;
      const timer = window.setTimeout(() => {
        triggerEffectWithSfx(effect);
      }, delay);
      timers.push(timer);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [currentScene, triggerEffectWithSfx]);

  // Scene-specific music changes
  useEffect(() => {
    if (currentScene?.music) {
      onMusicChange?.(currentScene.music);
    }
  }, [currentScene?.music, onMusicChange]);

  const handleAdvance = useCallback(() => {
    if (introComplete) return;
    advance();
  }, [advance, introComplete]);

  const handleSkip = useCallback(() => {
    clearAll();
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  }, [clearAll, onSkip, onComplete]);

  const handleBegin = useCallback(() => {
    clearAll();
    onComplete();
  }, [clearAll, onComplete]);

  const handleEffectComplete = useCallback((_effect: FxType) => {
    // hook for later if you want
  }, []);

  const jumpTo = useCallback(
    (index: number) => {
      setIntroComplete(false);
      clearAll();
      goToScene(index);
    },
    [clearAll, goToScene]
  );

  const handleLineRevealDone = useCallback(
    (_lineIndex: number, line: any) => {
      const cues = (currentScene as any)?.fxCues;
      if (!cues || !Array.isArray(cues)) return;

      for (const cue of cues) {
        const target = String(cue.onText ?? '');
        const mode = (cue.match ?? 'exact') as 'exact' | 'prefix' | 'includes';
        const text = String(line?.text ?? '');

        const match =
          mode === 'exact' ? text === target :
          mode === 'prefix' ? text.startsWith(target) :
          text.includes(target);

        if (match) {
          for (const ev of cue.events ?? []) triggerEffectWithSfx(ev);
        }
      }
    },
    [currentScene, triggerEffectWithSfx]
  );

  if (!currentScene) {
    // Never return null here; keep an opaque black layer so underlying UI can’t flash.
    return <div className="cutscene-player" />;
  }

  const hasShake = activeEffects.includes('shake');

  // ✅ NEW: pressure active flag
  const hasPressure = activeEffects.includes('pressure');

  // ✅ NEW: filter out pressure so FxLayer doesn’t need to know about it
  const fxLayerEffects = activeEffects.filter((e) => e !== 'pressure');

  // NEW: scene-specific class (sanitized, safe)
  const sceneIdSafe = currentScene.meta.id.replace(/[^a-z0-9_-]/gi, '-').toLowerCase();

  const containerClass = [
    'cutscene-player',
    `cs-scene-${sceneIdSafe}`,     // <-- add this
    hasShake ? 'cutscene-shake' : '',
    introComplete ? 'intro-complete' : '',
    DEBUG_MODE ? 'debug-mode' : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Disable click-to-advance in debug mode (use buttons)
  const canClickAdvance = !DEBUG_MODE && !introComplete && state.fadeState === 'visible';

  const fadeInMs = FADE_DURATIONS[currentScene.meta.fadeIn || 'fast'];
  const fadeOutMs = FADE_DURATIONS[currentScene.meta.fadeOut || 'fast'];

  const prevIndex = Math.max(0, state.currentSceneIndex - 1);
  const nextIndex = Math.min(cutscene.scenes.length - 1, state.currentSceneIndex + 1);

  return (
    <div
      className={containerClass}
      onClick={canClickAdvance ? handleAdvance : undefined}
    >
      {/* Background layer */}
      <SceneBackground
        config={currentScene.background}
        fadeState={state.fadeState}
      />

      {/* Particles layer */}
      {currentScene.particles && (
        <ParticlesLayer config={currentScene.particles} />
      )}

      {/* FX layer */}
      <FxLayer
        activeEffects={fxLayerEffects}
        onEffectComplete={handleEffectComplete}
      />

      {/* Content layer - Title screen or captions */}
      {currentScene.meta.id === 'title' ? (
        <TitleScreen
          // keep original behavior; TitleScreen itself handles its own reveal
          isActive={state.fadeState === 'visible'}
          key={`title:${state.currentSceneIndex}:${(state as any).sceneRunId ?? 0}`}
        />
      ) : (
        currentScene.captions && (
          <RetroCaption
            config={currentScene.captions}
            isActive={state.fadeState !== 'in'}
            onComplete={() => {
              if (isLastScene) setIntroComplete(true);
            }}
            onLineRevealDone={handleLineRevealDone}
            key={`${currentScene.meta.id}:${state.currentSceneIndex}:${(state as any).sceneRunId ?? 0}`}
          />
        )
      )}

      {/* CRT overlay */}
      {cutscene.crtEffect !== false && (
        <CrtLayer enabled={true} intensity="light" />
      )}

      {/* Letterbox bars */}
      <div className="cs-letterbox cs-letterbox-top" />
      <div className="cs-letterbox cs-letterbox-bottom" />

      {/* ✅ NEW: PRESSURE PULSE (global dim) */}
      <div
        key={`pressure:${pressurePulseId}`}
        className={[
          'cs-pressure',
          `cs-pressure-${pressureIntensity}`,
          hasPressure ? 'active' : '',
        ].join(' ')}
      />

      {/* FADE CURTAIN (namespaced) — hides scene swaps & prevents underlying UI flashes */}
      <div
        className={`cs-curtain cs-curtain-${state.fadeState}`}
        style={
          {
            ['--cs-curtain-in-ms' as any]: `${fadeInMs}ms`,
            ['--cs-curtain-out-ms' as any]: `${fadeOutMs}ms`,
          } as React.CSSProperties
        }
      />

      {/* Begin button for last scene */}
      {introComplete && (
        <div className="begin-container">
          <button
            className="begin-adventure-button"
            onClick={(e) => {
              e.stopPropagation();
              handleBegin();
            }}
          >
            <span className="button-icon">▶</span>
            <span className="button-text">Begin Your Adventure</span>
          </button>
        </div>
      )}

      {/* HUD - hide in debug mode */}
      {cutscene.showProgress !== false && !DEBUG_MODE && (
        <CutsceneHUD
          totalScenes={cutscene.scenes.length}
          currentSceneIndex={state.currentSceneIndex}
          showProgress={cutscene.showProgress}
          isLastScene={isLastScene}
          introComplete={introComplete}
          onSkip={handleSkip}
          onAdvance={handleAdvance}
          onBegin={handleBegin}
        />
      )}

      {/* Debug Panel (restored Prev/Next) */}
      {DEBUG_MODE && (
        <div className="debug-panel" onClick={(e) => e.stopPropagation()}>
          <div className="debug-title">🎬 Scene Debug</div>

          <div className="debug-info">
            Scene {state.currentSceneIndex + 1}/{cutscene.scenes.length}:{' '}
            <strong>{currentScene?.meta.id}</strong>
            <br />
            Fade: {state.fadeState} | Duration: {currentScene?.meta.duration}ms
          </div>

          <div className="debug-actions">
            <button
              className="debug-action-btn"
              onClick={() => jumpTo(prevIndex)}
              disabled={state.currentSceneIndex === 0}
            >
              ◀ Prev
            </button>

            <button
              className="debug-action-btn"
              onClick={() => jumpTo(nextIndex)}
              disabled={state.currentSceneIndex === cutscene.scenes.length - 1}
            >
              Next ▶
            </button>

            <button className="debug-action-btn" onClick={() => jumpTo(state.currentSceneIndex)}>
              🔄 Replay
            </button>

            {/* ✅ NEW: Pressure debug trigger */}
            <button
              className="debug-action-btn"
              onClick={() => triggerEffectWithSfx({ type: 'pressure', intensity: 'medium' })}
            >
              🕳 Pressure
            </button>

            <button className="debug-action-btn" onClick={() => triggerEffectWithSfx({ type: 'flash', intensity: 'medium' })}>
              ⚡ Flash
            </button>
            <button className="debug-action-btn" onClick={() => triggerEffectWithSfx({ type: 'shake', intensity: 'medium' })}>
              📳 Shake
            </button>
            <button className="debug-action-btn" onClick={() => triggerEffectWithSfx({ type: 'flicker', intensity: 'medium' })}>
              💡 Flicker
            </button>
          </div>

          <div className="debug-scene-list">
            {cutscene.scenes.map((scene, index) => (
              <button
                key={scene.meta.id}
                className={`debug-scene-btn ${index === state.currentSceneIndex ? 'active' : ''}`}
                onClick={() => jumpTo(index)}
              >
                {String(index).padStart(2, '0')}: {scene.meta.id}
              </button>
            ))}
          </div>

          <button className="debug-exit-btn" onClick={handleSkip}>
            ✕ Exit Debug
          </button>
        </div>
      )}
    </div>
  );
}
