/**
 * LoreCodex - Main container for the immersive lore viewing experience
 *
 * Features:
 * - Category-based organization (History, Characters, Creatures, Locations, Artifacts)
 * - Distinct scroll/book visual presentations with animations
 * - Ancient grimoire aesthetic with warm candlelit tones
 * - Scrollable long-form content support
 */
import { useEffect, useCallback } from 'react';
import { useCodexState } from './hooks/useCodexState';
import { CodexSidebar } from './components/CodexSidebar';
import { CodexEntryList } from './components/CodexEntryList';
import { CodexReader } from './components/CodexReader';
import type { LoreEntry } from './types';
import './LoreCodex.scss';

interface LoreCodexProps {
  entries: LoreEntry[];
  discoveredCount: number;
  totalCount: number;
  onClose: () => void;
}

export function LoreCodex({
  entries,
  discoveredCount,
  totalCount,
  onClose,
}: LoreCodexProps) {
  const {
    selectedCategory,
    selectedEntry,
    filteredEntries,
    transitionState,
    categoryCounts,
    setCategory,
    setEntry,
  } = useCodexState(entries);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'j' || e.key === 'J') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle click outside to close
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  return (
    <div className="lore-codex-overlay" onClick={handleOverlayClick}>
      {/* Main codex container */}
      <div className="lore-codex">
        {/* Header */}
        <div className="codex-header">
          <h2 className="codex-title">Lore Codex</h2>
          <span className="codex-progress">
            {discoveredCount} / {totalCount} discovered
          </span>
          <button
            className="codex-close-btn"
            onClick={onClose}
            aria-label="Close codex"
          >
            [X]
          </button>
        </div>

        {/* Body - three column layout */}
        <div className="codex-body">
          <CodexSidebar
            selectedCategory={selectedCategory}
            categoryCounts={categoryCounts}
            onSelectCategory={setCategory}
          />

          <CodexEntryList
            entries={filteredEntries}
            selectedEntryId={selectedEntry?.id ?? null}
            onSelectEntry={setEntry}
          />

          <CodexReader
            entry={selectedEntry}
            transitionState={transitionState}
          />
        </div>

        {/* Footer */}
        <div className="codex-footer">
          <span className="codex-hint">Press [J] or [ESC] to close</span>
        </div>
      </div>
    </div>
  );
}
