/**
 * ScrollPresentation - Animated scroll unroll presentation for lore scrolls
 */
import { useState, useEffect } from 'react';
import type { LoreEntry } from '../types';
import { PhosphorParagraph } from '../utils/phosphorText';

interface ScrollPresentationProps {
  entry: LoreEntry;
}

export function ScrollPresentation({ entry }: ScrollPresentationProps) {
  const [isUnrolled, setIsUnrolled] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Reset animation state when entry changes
    setIsUnrolled(false);
    setShowContent(false);

    // Start unroll animation
    const unrollTimer = setTimeout(() => {
      setIsUnrolled(true);
    }, 100);

    // Show content after unroll completes
    const contentTimer = setTimeout(() => {
      setShowContent(true);
    }, 700);

    return () => {
      clearTimeout(unrollTimer);
      clearTimeout(contentTimer);
    };
  }, [entry.id]);

  return (
    <div className={`scroll-presentation ${isUnrolled ? 'unrolled' : ''}`}>
      <div className="scroll-paper">
        <div className="scroll-header-ornament">
          <span className="ornament-line" />
          <span className="ornament-symbol">~</span>
          <span className="ornament-line" />
        </div>

        <h3 className="scroll-title">{entry.title}</h3>

        <div className="scroll-content">
          {showContent && entry.content.map((paragraph, idx) => (
            <PhosphorParagraph
              key={idx}
              text={paragraph}
              className="scroll-paragraph"
              delay={idx * 100}
            />
          ))}
        </div>

        <div className="scroll-footer-ornament">
          <span className="ornament-line" />
          <span className="ornament-symbol">~</span>
          <span className="ornament-line" />
        </div>
      </div>
    </div>
  );
}
