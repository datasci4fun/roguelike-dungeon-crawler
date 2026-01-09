/**
 * useCutsceneTimeline - Hook for managing cutscene scene progression
 * Handles timing, transitions, and scene state
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { CutsceneConfig, CutsceneState, FadeStyle } from '../types';

interface UseTimelineOptions {
  onSceneChange?: (sceneIndex: number, sceneId: string) => void;
  onComplete?: () => void;
  autoPlay?: boolean;
  debugMode?: boolean;
}

interface UseTimelineReturn {
  state: CutsceneState;
  currentScene: CutsceneConfig['scenes'][0] | null;
  isLastScene: boolean;
  play: () => void;
  pause: () => void;
  advance: () => void;
  skip: () => void;
  reset: () => void;
  goToScene: (index: number) => void;
}

const FADE_DURATIONS: Record<FadeStyle, number> = {
  slow: 1500,
  fast: 300,
  dramatic: 2000,
  none: 0,
};

const SCENE_END_PAUSE = 2000;

export function useCutsceneTimeline(
  cutscene: CutsceneConfig,
  options: UseTimelineOptions = {}
): UseTimelineReturn {
  const { onSceneChange, onComplete, autoPlay = true, debugMode = false } = options;

  const [state, setState] = useState<CutsceneState>({
    currentSceneIndex: 0,
    sceneProgress: 0,
    isPlaying: autoPlay,
    isPaused: false,
    fadeState: 'in',
    activeEffects: [],
    sceneRunId: 0,
  });

  const timersRef = useRef<number[]>([]);
  const onCompleteRef = useRef(onComplete);
  const onSceneChangeRef = useRef(onSceneChange);
  const transitionLockRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onSceneChangeRef.current = onSceneChange;
  }, [onComplete, onSceneChange]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
    transitionLockRef.current = false;
  }, []);

  const setTimer = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const getScene = (index: number) => cutscene.scenes[index] || null;

  const currentScene = getScene(state.currentSceneIndex);
  const isLastScene = state.currentSceneIndex === cutscene.scenes.length - 1;

  // Auto progression (enter -> visible -> out -> next)
  useEffect(() => {
    if (!state.isPlaying || state.isPaused) return;

    const scene = getScene(state.currentSceneIndex);
    if (!scene) return;

    clearTimers();

    const fadeInMs = FADE_DURATIONS[scene.meta.fadeIn || 'fast'];
    const fadeOutMs = FADE_DURATIONS[scene.meta.fadeOut || 'fast'];
    const sceneDuration = scene.meta.duration;
    const totalScenes = cutscene.scenes.length;
    const idx = state.currentSceneIndex;
    const last = idx === totalScenes - 1;

    // Step 1: fade in -> visible
    setTimer(() => {
      setState((prev) => ({ ...prev, fadeState: 'visible' }));

      // DEBUG MODE: hold indefinitely
      if (debugMode) return;

      // Step 2: wait duration + pause -> fade out -> next scene
      if (!last) {
        setTimer(() => {
          transitionLockRef.current = true;
          setState((prev) => ({ ...prev, fadeState: 'out' }));

          setTimer(() => {
            const nextIndex = idx + 1;
            const nextScene = getScene(nextIndex);

            setState((prev) => ({
              ...prev,
              currentSceneIndex: nextIndex,
              sceneProgress: 0,
              fadeState: 'in',
              sceneRunId: prev.sceneRunId + 1,
            }));

            transitionLockRef.current = false;

            if (nextScene) onSceneChangeRef.current?.(nextIndex, nextScene.meta.id);
          }, fadeOutMs);
        }, sceneDuration + SCENE_END_PAUSE);
      }
    }, fadeInMs);

    return clearTimers;
  }, [
    state.currentSceneIndex,
    state.sceneRunId,
    state.isPlaying,
    state.isPaused,
    cutscene,
    debugMode,
    clearTimers,
    setTimer,
  ]);

  const play = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: true, isPaused: false }));
  }, []);

  const pause = useCallback(() => {
    setState((prev) => ({ ...prev, isPaused: true }));
  }, []);

  const advance = useCallback(() => {
    if (transitionLockRef.current) return;

    const scene = getScene(state.currentSceneIndex);
    if (!scene) return;

    clearTimers();

    const last = state.currentSceneIndex === cutscene.scenes.length - 1;
    if (last) {
      transitionLockRef.current = true;
      setState((prev) => ({ ...prev, fadeState: 'out' }));
      setTimer(() => {
        transitionLockRef.current = false;
        onCompleteRef.current?.();
      }, 300);
      return;
    }

    const fadeOutMs = FADE_DURATIONS[scene.meta.fadeOut || 'fast'];
    transitionLockRef.current = true;

    setState((prev) => ({ ...prev, fadeState: 'out' }));

    setTimer(() => {
      const nextIndex = state.currentSceneIndex + 1;
      const nextScene = getScene(nextIndex);

      setState((prev) => ({
        ...prev,
        currentSceneIndex: nextIndex,
        sceneProgress: 0,
        fadeState: 'in',
        sceneRunId: prev.sceneRunId + 1,
      }));

      transitionLockRef.current = false;

      if (nextScene) onSceneChangeRef.current?.(nextIndex, nextScene.meta.id);
    }, fadeOutMs);
  }, [clearTimers, cutscene.scenes.length, getScene, setTimer, state.currentSceneIndex]);

  const goToScene = useCallback(
    (index: number) => {
      if (transitionLockRef.current) return;

      const target = Math.max(0, Math.min(index, cutscene.scenes.length - 1));
      const scene = getScene(state.currentSceneIndex);
      const fadeOutMs = FADE_DURATIONS[scene?.meta.fadeOut || 'fast'];

      clearTimers();

      transitionLockRef.current = true;
      setState((prev) => ({ ...prev, fadeState: 'out' }));

      setTimer(() => {
        const nextScene = getScene(target);

        setState((prev) => ({
          ...prev,
          currentSceneIndex: target,
          sceneProgress: 0,
          isPlaying: true,
          isPaused: false,
          fadeState: 'in',
          activeEffects: [],
          sceneRunId: prev.sceneRunId + 1,
        }));

        transitionLockRef.current = false;

        if (nextScene) onSceneChangeRef.current?.(target, nextScene.meta.id);
      }, fadeOutMs);
    },
    [clearTimers, cutscene.scenes.length, getScene, setTimer, state.currentSceneIndex]
  );

  const skip = useCallback(() => {
    if (transitionLockRef.current) return;

    clearTimers();
    transitionLockRef.current = true;
    setState((prev) => ({ ...prev, fadeState: 'out' }));

    setTimer(() => {
      transitionLockRef.current = false;
      onCompleteRef.current?.();
    }, 300);
  }, [clearTimers, setTimer]);

  const reset = useCallback(() => {
    clearTimers();
    setState((prev) => ({
      currentSceneIndex: 0,
      sceneProgress: 0,
      isPlaying: autoPlay,
      isPaused: false,
      fadeState: 'in',
      activeEffects: [],
      sceneRunId: prev.sceneRunId + 1,
    }));
  }, [autoPlay, clearTimers]);

  useEffect(() => clearTimers, [clearTimers]);

  return {
    state,
    currentScene,
    isLastScene,
    play,
    pause,
    advance,
    skip,
    reset,
    goToScene,
  };
}
