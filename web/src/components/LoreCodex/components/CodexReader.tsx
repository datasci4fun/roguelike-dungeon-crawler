/**
 * CodexReader - Reading pane that delegates to category-specific presentations
 */
import type { LoreEntry, TransitionState, CreatureEntry, LocationEntry } from '../types';
import { isCreatureEntry, isLocationEntry } from '../types';
import { ScrollPresentation } from './ScrollPresentation';
import { BookPresentation } from './BookPresentation';
import { CreaturePresentation } from './CreaturePresentation';
import { LocationPresentation } from './LocationPresentation';

interface CodexReaderProps {
  entry: LoreEntry | null;
  transitionState: TransitionState;
}

function EmptyState() {
  return (
    <div className="codex-reader-empty">
      <div className="empty-icon">?</div>
      <p className="empty-text">Select an entry to read</p>
      <p className="empty-hint">
        Discover scrolls and books throughout the dungeon to uncover the secrets of Valdris.
      </p>
    </div>
  );
}

function getPresentation(entry: LoreEntry) {
  // Check for extended entry types first
  if (isCreatureEntry(entry)) {
    return CreaturePresentation;
  }
  if (isLocationEntry(entry)) {
    return LocationPresentation;
  }

  // Fall back to item_type based presentation
  switch (entry.item_type) {
    case 'bestiary':
      // Shouldn't reach here due to type guard, but handle gracefully
      return ScrollPresentation;
    case 'location':
      // Shouldn't reach here due to type guard, but handle gracefully
      return ScrollPresentation;
    case 'book':
    case 'chronicle':
      return BookPresentation;
    case 'scroll':
    case 'character':
    case 'artifact':
    default:
      return ScrollPresentation;
  }
}

export function CodexReader({ entry, transitionState }: CodexReaderProps) {
  if (!entry) {
    return (
      <div className="codex-reader">
        <EmptyState />
      </div>
    );
  }

  const Presentation = getPresentation(entry);

  // Type narrowing for specialized presentations
  if (isCreatureEntry(entry)) {
    return (
      <div className={`codex-reader transition-${transitionState}`}>
        <CreaturePresentation entry={entry} />
      </div>
    );
  }

  if (isLocationEntry(entry)) {
    return (
      <div className={`codex-reader transition-${transitionState}`}>
        <LocationPresentation entry={entry} />
      </div>
    );
  }

  return (
    <div className={`codex-reader transition-${transitionState}`}>
      <Presentation entry={entry} />
    </div>
  );
}
