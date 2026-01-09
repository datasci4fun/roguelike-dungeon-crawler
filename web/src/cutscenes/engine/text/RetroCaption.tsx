/**
 * RetroCaption - Cinematic text display with retro phosphor reveals
 * - No typewriter cursor
 * - Renders all lines always (no layout jump)
 * - Calls onLineRevealDone when glyph animation is complete (+120ms)
 * - DOES NOT restart due to callback identity changes / rerenders
 */

import { useEffect, useRef, useState } from 'react';
import type { RetroCaptionProps, CaptionLine, TextEffect } from '../types';
import './RetroCaption.scss';

const DEFAULT_HOLD_MS = 650;
const DEFAULT_BREAK_MS = 260;
const MIN_AFTER_REVEAL_MS = 240;
const REVEAL_DONE_OFFSET_MS = 120;

function normalizeEffect(effect?: TextEffect): 'fade' | 'glitch' | 'flicker' | 'none' {
  if (!effect || effect === 'typewriter') return 'fade';
  if (effect === 'fade' || effect === 'glitch' || effect === 'flicker') return effect;
  return 'none';
}

function renderPhosphorText(text: string) {
  const chars = Array.from(text.length ? text : ' ');
  return chars.map((ch, i) => (
    <span
      key={i}
      className="retro-char"
      style={{ ['--rc-char-index' as any]: i } as React.CSSProperties}
    >
      {ch === ' ' ? '\u00A0' : ch}
    </span>
  ));
}

function parseCssTimeMs(raw: string, fallback: number) {
  const v = (raw || '').trim();
  if (!v) return fallback;
  if (v.endsWith('ms')) return Number.parseFloat(v);
  if (v.endsWith('s')) return Number.parseFloat(v) * 1000;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

function makeSignature(lines: CaptionLine[]) {
  return lines
    .map((l) => {
      const t = l.text ?? '';
      const e = l.effect ?? '';
      const s = l.style ?? '';
      const d = l.delay ?? '';
      const du = l.duration ?? '';
      return `${t}§${e}§${s}§${d}§${du}`;
    })
    .join('|');
}

export function RetroCaption({
  config,
  isActive,
  onComplete,
  onLineRevealDone,
}: RetroCaptionProps) {
  const { lines, position = 'center' } = config;

  const linesSignature = makeSignature(lines);

  const [revealed, setRevealed] = useState<boolean[]>(() => lines.map(() => false));
  const [isComplete, setIsComplete] = useState(false);

  const timersRef = useRef<number[]>([]);
  const lineRefs = useRef<Array<HTMLParagraphElement | null>>([]);

  // ✅ store callbacks in refs so effect doesn't restart on rerenders
  const onCompleteRef = useRef(onComplete);
  const onLineRevealDoneRef = useRef(onLineRevealDone);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onLineRevealDoneRef.current = onLineRevealDone;
  }, [onComplete, onLineRevealDone]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  };

  const estimateRevealMs = (
    idx: number,
    text: string,
    effect: 'fade' | 'flicker' | 'glitch' | 'none'
  ) => {
    if (effect !== 'fade' && effect !== 'flicker') return 0;

    const el = lineRefs.current[idx];
    const cs = el ? window.getComputedStyle(el) : null;

    const charStagger = parseCssTimeMs(cs?.getPropertyValue('--rc-char-stagger') ?? '', 10);
    const charDur = parseCssTimeMs(cs?.getPropertyValue('--rc-char-dur') ?? '', 560);

    const len = Math.max(1, text.length);
    return (len - 1) * charStagger + charDur;
  };

  // Reset ONLY when the actual content changes (not array identity)
  useEffect(() => {
    clearTimers();
    setRevealed(lines.map(() => false));
    setIsComplete(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linesSignature]);

  // Sequential reveal runner (depends only on isActive + content signature)
  useEffect(() => {
    clearTimers();
    if (!isActive) return;

    setRevealed(lines.map(() => false));
    setIsComplete(false);

    let step = 0;

    const runStep = () => {
      if (step >= lines.length) {
        setIsComplete(true);
        onCompleteRef.current?.();
        return;
      }

      const line: CaptionLine | undefined = lines[step];
      if (!line) {
        step += 1;
        runStep();
        return;
      }

      if (line.text === '') {
        const pause = line.delay ?? DEFAULT_BREAK_MS;
        const t = window.setTimeout(() => {
          step += 1;
          runStep();
        }, pause);
        timersRef.current.push(t);
        return;
      }

      const eff = normalizeEffect(line.effect);
      const startDelay = line.delay ?? 0;

      const idx = step; // capture

      const tStart = window.setTimeout(() => {
        const revealMs = estimateRevealMs(idx, line.text, eff);

        setRevealed((prev) => {
          const next = prev.slice();
          next[idx] = true;
          return next;
        });

        const cb = onLineRevealDoneRef.current;
        if (cb) {
          const tDone = window.setTimeout(
            () => cb(idx, line),
            revealMs + REVEAL_DONE_OFFSET_MS
          );
          timersRef.current.push(tDone);
        }

        const hold = line.duration ?? DEFAULT_HOLD_MS;
        const advanceAfter = Math.max(hold, revealMs + MIN_AFTER_REVEAL_MS);

        const tHold = window.setTimeout(() => {
          step += 1;
          runStep();
        }, advanceAfter);

        timersRef.current.push(tHold);
      }, startDelay);

      timersRef.current.push(tStart);
    };

    runStep();

    return () => clearTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, linesSignature]);

  if (!isActive) return null;

  return (
    <div className={`retro-caption caption-${position}`}>
      <div className="caption-content">
        {lines.map((line, index) => {
          const isEmpty = line.text === '';
          const styleClass = line.style || 'normal';
          const eff = normalizeEffect(line.effect);
          const isRevealed = revealed[index];

          const effectClasses =
            eff === 'flicker' ? ['effect-fade', 'effect-flicker'] : [`effect-${eff}`];

          const dataTextProps = eff === 'glitch' ? { 'data-text': line.text } : {};
          const usePhosphor = eff === 'fade' || eff === 'flicker';

          return (
            <p
              key={index}
              ref={(el) => { lineRefs.current[index] = el; }}  // ✅ returns void
              {...dataTextProps}
              className={[
                'caption-line',
                styleClass,
                ...effectClasses,
                isEmpty ? 'empty-line' : '',
                isRevealed ? 'is-revealed' : 'is-hidden',
                isComplete ? 'is-complete' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="line-text">
                {isEmpty ? '\u00A0' : usePhosphor ? renderPhosphorText(line.text) : line.text}
              </span>
            </p>
          );
        })}
      </div>
    </div>
  );
}
