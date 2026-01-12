/**
 * PhosphorHeader - Phosphor reveal effect for page titles
 *
 * A simplified version of the cutscene RetroCaption system,
 * designed for standalone page headers with dramatic reveal.
 */

import { useEffect, useState, useRef } from 'react';
import './PhosphorHeader.scss';

export type PhosphorStyle = 'dramatic' | 'emphasis' | 'normal' | 'whisper';

export interface PhosphorHeaderProps {
  /** Main title text */
  title: string;

  /** Optional subtitle (smaller, whisper style) */
  subtitle?: string;

  /** Text style variant */
  style?: PhosphorStyle;

  /** Delay before reveal starts (ms) */
  delay?: number;

  /** Callback when reveal animation completes */
  onRevealComplete?: () => void;

  /** Additional CSS class */
  className?: string;
}

function renderPhosphorText(text: string) {
  const chars = Array.from(text);
  return chars.map((ch, i) => (
    <span
      key={i}
      className="ph-char"
      style={{ '--ph-char-index': i } as React.CSSProperties}
    >
      {ch === ' ' ? '\u00A0' : ch}
    </span>
  ));
}

export function PhosphorHeader({
  title,
  subtitle,
  style = 'dramatic',
  delay = 100,
  onRevealComplete,
  className = '',
}: PhosphorHeaderProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [subtitleRevealed, setSubtitleRevealed] = useState(false);
  const timerRef = useRef<number | null>(null);
  const subtitleTimerRef = useRef<number | null>(null);
  const completeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // Start title reveal after initial delay
    timerRef.current = window.setTimeout(() => {
      setIsRevealed(true);

      // Start subtitle reveal after title completes (estimate based on char count)
      const titleDuration = title.length * 12 + 720; // stagger + duration
      subtitleTimerRef.current = window.setTimeout(() => {
        setSubtitleRevealed(true);

        // Call complete callback after subtitle reveals
        if (onRevealComplete) {
          const subtitleDuration = subtitle ? subtitle.length * 14 + 640 : 0;
          completeTimerRef.current = window.setTimeout(() => {
            onRevealComplete();
          }, subtitleDuration + 100);
        }
      }, titleDuration);
    }, delay);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (subtitleTimerRef.current) window.clearTimeout(subtitleTimerRef.current);
      if (completeTimerRef.current) window.clearTimeout(completeTimerRef.current);
    };
  }, [title, subtitle, delay, onRevealComplete]);

  return (
    <header className={`phosphor-header ${className}`}>
      <h1 className={`ph-title ph-style-${style} ${isRevealed ? 'is-revealed' : ''}`}>
        <span className="ph-text">{renderPhosphorText(title)}</span>
      </h1>
      {subtitle && (
        <p className={`ph-subtitle ${subtitleRevealed ? 'is-revealed' : ''}`}>
          <span className="ph-text">{renderPhosphorText(subtitle)}</span>
        </p>
      )}
    </header>
  );
}

export default PhosphorHeader;
