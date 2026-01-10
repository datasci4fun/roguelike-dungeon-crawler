/**
 * Phosphor text rendering utility for retro CRT glow effect
 */
import React from 'react';

/**
 * Renders text with per-character staggered animation for phosphor glow effect.
 * Each character gets a CSS custom property for animation delay.
 */
export function renderPhosphorText(text: string, baseDelay: number = 0): React.ReactNode {
  const chars = Array.from(text || ' ');
  return chars.map((ch, i) => (
    <span
      key={i}
      className="phosphor-char"
      style={{
        '--char-index': i,
        '--char-delay': `${baseDelay + i * 20}ms`,
      } as React.CSSProperties}
    >
      {ch === ' ' ? '\u00A0' : ch}
    </span>
  ));
}

/**
 * Renders a paragraph with phosphor effect
 */
export function PhosphorParagraph({
  text,
  className = '',
  delay = 0
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  return (
    <p className={`phosphor-text ${className}`}>
      {renderPhosphorText(text, delay)}
    </p>
  );
}
