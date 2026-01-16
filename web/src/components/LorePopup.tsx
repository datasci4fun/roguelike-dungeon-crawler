/**
 * LorePopup.tsx - v7.0 Sprint 4: Lore discovery popup
 *
 * Displays discovered lore content when examining murals/inscriptions.
 * Shows title, source type, and full lore text.
 */
import React, { useEffect, useCallback } from 'react';
import './LorePopup.css';

interface LorePopupProps {
  loreId: string;
  title: string;
  content: string;
  isNew: boolean;
  sourceType: string;  // 'mural', 'inscription', etc.
  onClose: () => void;
}

const SOURCE_LABELS: Record<string, string> = {
  mural: 'Ancient Mural',
  inscription: 'Stone Inscription',
  scroll: 'Weathered Scroll',
  book: 'Dusty Tome',
  tablet: 'Clay Tablet',
};

export const LorePopup: React.FC<LorePopupProps> = ({
  title,
  content,
  isNew,
  sourceType,
  onClose,
}) => {
  // Close on Escape or Enter key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Format content - split by paragraphs
  const paragraphs = content.split('\n\n').filter(p => p.trim());

  const sourceLabel = SOURCE_LABELS[sourceType] || 'Unknown Source';

  return (
    <div className="lore-popup-overlay" onClick={handleOverlayClick}>
      <div className="lore-popup" role="dialog" aria-labelledby="lore-title">
        <div className="lore-popup-header">
          <h2 id="lore-title" className="lore-popup-title">
            {title}
            {isNew && <span className="lore-popup-new-badge">New</span>}
          </h2>
          <button
            className="lore-popup-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="lore-popup-source">
          Discovered from: {sourceLabel}
        </div>

        <div className="lore-popup-content">
          {paragraphs.length > 0 ? (
            paragraphs.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))
          ) : (
            <p><em>The text is too faded to read...</em></p>
          )}
        </div>

        <div className="lore-popup-footer">
          Press <kbd>Esc</kbd> or <kbd>Enter</kbd> to close
        </div>
      </div>
    </div>
  );
};

export default LorePopup;
