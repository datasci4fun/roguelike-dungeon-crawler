/**
 * CodexEntryList - List of lore entries within selected category
 */
import type { LoreEntry } from '../types';

interface CodexEntryListProps {
  entries: LoreEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (entryId: string) => void;
}

export function CodexEntryList({
  entries,
  selectedEntryId,
  onSelectEntry,
}: CodexEntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="codex-entry-list codex-entry-list--empty">
        <p className="empty-message">No entries discovered in this category.</p>
      </div>
    );
  }

  return (
    <div className="codex-entry-list">
      {entries.map((entry) => (
        <button
          key={entry.id}
          className={`codex-entry-item ${selectedEntryId === entry.id ? 'active' : ''}`}
          onClick={() => onSelectEntry(entry.id)}
        >
          <span className="entry-icon">
            {entry.item_type === 'book' ? '+' : '?'}
          </span>
          <span className="entry-title">{entry.title}</span>
          <span className="entry-type">{entry.item_type}</span>
        </button>
      ))}
    </div>
  );
}
