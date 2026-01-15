/**
 * TransitionCurtain - v6.1 Cinematic transition overlay
 *
 * Prevents UI flicker between exploration/battle/cutscenes.
 * Handles fade to black, optional letterbox, and skip hints.
 */
import { useEffect, useState, useCallback } from 'react';
import { type TransitionState, type TransitionKind } from '../types';
import './TransitionCurtain.css';

interface TransitionCurtainProps {
  transition?: TransitionState;
  onSkip?: () => void;
}

// Transitions that should show letterbox bars
const LETTERBOX_TRANSITIONS: TransitionKind[] = ['ENGAGE', 'BOSS_VICTORY'];

// Phase of the curtain animation
type CurtainPhase = 'idle' | 'fade_in' | 'hold' | 'fade_out';

export function TransitionCurtain({ transition, onSkip }: TransitionCurtainProps) {
  const [phase, setPhase] = useState<CurtainPhase>('idle');
  const [opacity, setOpacity] = useState(0);
  const [showLetterbox, setShowLetterbox] = useState(false);

  // Track the transition we're animating
  const [currentKind, setCurrentKind] = useState<TransitionKind | null>(null);

  // Calculate timing based on transition kind
  const getTimings = useCallback((kind: TransitionKind | null, durationMs: number) => {
    // Default timings (can be overridden by duration_ms)
    const halfDuration = durationMs / 2;

    switch (kind) {
      case 'ENGAGE':
        // Quick fade out, brief hold, quick fade in
        return { fadeIn: halfDuration * 0.4, hold: halfDuration * 0.2, fadeOut: halfDuration * 0.4 };
      case 'WIN':
        // Short fade
        return { fadeIn: halfDuration * 0.5, hold: 0, fadeOut: halfDuration * 0.5 };
      case 'FLEE':
        // Faster than WIN
        return { fadeIn: halfDuration * 0.4, hold: 0, fadeOut: halfDuration * 0.6 };
      case 'DEFEAT':
        // Snap to black immediately, stay until cutscene
        return { fadeIn: 0, hold: durationMs, fadeOut: 0 };
      case 'BOSS_VICTORY':
        // Longer, more dramatic
        return { fadeIn: halfDuration * 0.6, hold: halfDuration * 0.2, fadeOut: halfDuration * 0.2 };
      default:
        return { fadeIn: 200, hold: 100, fadeOut: 200 };
    }
  }, []);

  // Handle transition state changes
  useEffect(() => {
    if (!transition?.active) {
      // Transition ended - fade out if we were showing
      if (phase !== 'idle') {
        setPhase('fade_out');
        // Quick fade out
        const fadeOutDuration = 150;
        const startOpacity = opacity;
        const startTime = performance.now();

        const animate = (time: number) => {
          const elapsed = time - startTime;
          const progress = Math.min(elapsed / fadeOutDuration, 1);
          setOpacity(startOpacity * (1 - progress));

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            setPhase('idle');
            setShowLetterbox(false);
            setCurrentKind(null);
          }
        };
        requestAnimationFrame(animate);
      }
      return;
    }

    // New transition starting
    const kind = transition.kind;
    const durationMs = transition.duration_ms || 500;
    const timings = getTimings(kind, durationMs);

    setCurrentKind(kind);
    setShowLetterbox(kind ? LETTERBOX_TRANSITIONS.includes(kind) : false);

    // Special case: DEFEAT snaps to black
    if (kind === 'DEFEAT') {
      setOpacity(1);
      setPhase('hold');
      return;
    }

    // Start fade in
    setPhase('fade_in');
    const startTime = performance.now();

    const animateFadeIn = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / timings.fadeIn, 1);
      setOpacity(progress);

      if (progress < 1) {
        requestAnimationFrame(animateFadeIn);
      } else {
        // Fade in complete - hold
        setPhase('hold');
        if (timings.hold > 0) {
          setTimeout(() => {
            setPhase('fade_out');
            animateFadeOut(performance.now());
          }, timings.hold);
        } else {
          setPhase('fade_out');
          animateFadeOut(performance.now());
        }
      }
    };

    const animateFadeOut = (startTime: number) => {
      const animate = (time: number) => {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / timings.fadeOut, 1);
        setOpacity(1 - progress);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Animation complete but keep curtain logic active until transition ends
          // Don't set to idle - let the transition state control visibility
        }
      };
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animateFadeIn);
  }, [transition?.active, transition?.kind, transition?.duration_ms, getTimings]);

  // Handle skip key
  useEffect(() => {
    if (!transition?.active || !transition?.can_skip || !onSkip) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip on Space or Escape
      if (e.key === ' ' || e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        onSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [transition?.active, transition?.can_skip, onSkip]);

  // Don't render if idle and no opacity
  if (phase === 'idle' && opacity === 0 && !transition?.active) {
    return null;
  }

  // Force full opacity for active DEFEAT transitions
  const displayOpacity = currentKind === 'DEFEAT' && transition?.active ? 1 : opacity;

  return (
    <div
      className={`transition-curtain ${phase} ${showLetterbox ? 'letterbox' : ''}`}
      style={{
        opacity: displayOpacity,
        pointerEvents: 'none', // Never capture clicks - curtain is purely visual
      }}
    >
      {/* Main black overlay */}
      <div className="curtain-backdrop" />

      {/* Letterbox bars (top/bottom) */}
      {showLetterbox && (
        <>
          <div className="letterbox-bar letterbox-top" />
          <div className="letterbox-bar letterbox-bottom" />
        </>
      )}

      {/* Transition indicator (optional, can be removed for production) */}
      {currentKind && transition?.active && (
        <div className="transition-indicator">
          {currentKind === 'ENGAGE' && 'Engaging...'}
          {currentKind === 'WIN' && 'Victory!'}
          {currentKind === 'FLEE' && 'Escaping...'}
          {currentKind === 'BOSS_VICTORY' && 'Victory!'}
          {currentKind === 'DEFEAT' && ''}
        </div>
      )}

      {/* Skip hint */}
      {transition?.can_skip && transition?.active && displayOpacity > 0.3 && (
        <div className="skip-hint">
          Press SPACE to skip
        </div>
      )}
    </div>
  );
}
