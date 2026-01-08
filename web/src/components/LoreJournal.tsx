/**
 * LoreJournal - Modal overlay showing discovered lore entries
 */
import { useState } from 'react';
import './LoreJournal.css';

interface LoreEntry {
  id: string;
  title: string;
  content: string[];
}

interface LoreJournalProps {
  entries: LoreEntry[];
  discoveredCount: number;
  totalCount: number;
  onClose: () => void;
}

export function LoreJournal({
  entries,
  discoveredCount,
  totalCount,
  onClose,
}: LoreJournalProps) {
  const [selectedEntry, setSelectedEntry] = useState<LoreEntry | null>(
    entries.length > 0 ? entries[0] : null
  );

  return (
    <div className="lore-journal-overlay" onClick={onClose}>
      <div className="lore-journal" onClick={(e) => e.stopPropagation()}>
        <div className="lore-journal-header">
          <h2>Lore Journal</h2>
          <span className="lore-progress">
            {discoveredCount} / {totalCount} discovered
          </span>
          <button className="lore-close-btn" onClick={onClose}>
            [X]
          </button>
        </div>

        <div className="lore-journal-content">
          {entries.length === 0 ? (
            <div className="lore-empty">
              <p>No lore discovered yet.</p>
              <p className="lore-hint">
                Find and read scrolls and books throughout the dungeon to uncover its secrets.
              </p>
            </div>
          ) : (
            <>
              <div className="lore-list">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`lore-list-item ${selectedEntry?.id === entry.id ? 'selected' : ''}`}
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <span className="lore-icon">
                      {entry.id.includes('book') ? '+' : '?'}
                    </span>
                    <span className="lore-title">{entry.title}</span>
                  </div>
                ))}
              </div>

              <div className="lore-detail">
                {selectedEntry ? (
                  <>
                    <h3 className="lore-detail-title">{selectedEntry.title}</h3>
                    <div className="lore-detail-content">
                      {selectedEntry.content.map((paragraph, idx) => (
                        <p key={idx}>{paragraph}</p>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="lore-select-hint">Select an entry to read</p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="lore-journal-footer">
          <span className="lore-hint-text">Press [J] or [ESC] to close</span>
        </div>
      </div>
    </div>
  );
}
