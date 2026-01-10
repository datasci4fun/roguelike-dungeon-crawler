/**
 * CodexEntryList - List of lore entries within selected category
 */
import type { LoreEntry, LoreItemType } from '../types';

function getEntryIcon(itemType: LoreItemType): string {
  switch (itemType) {
    case 'book':
    case 'chronicle':
      return '+';
    case 'bestiary':
      return 'M';
    case 'location':
      return 'L';
    case 'character':
      return 'C';
    case 'artifact':
      return '*';
    case 'scroll':
    default:
      return '?';
  }
}

function formatItemType(itemType: LoreItemType): string {
  switch (itemType) {
    case 'bestiary':
      return 'creature';
    case 'chronicle':
      return 'history';
    default:
      return itemType;
  }
}

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
            {getEntryIcon(entry.item_type)}
          </span>
          <span className="entry-title">{entry.title}</span>
          <span className="entry-type">{formatItemType(entry.item_type)}</span>
        </button>
      ))}
    </div>
  );
}
