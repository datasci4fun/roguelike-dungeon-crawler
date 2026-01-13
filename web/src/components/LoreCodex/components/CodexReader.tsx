/**
 * CodexReader - Reading pane that delegates to category-specific presentations
 */
import type { LoreEntry, TransitionState } from '../types';
import { isCreatureEntry, isLocationEntry } from '../types';
import { ScrollPresentation } from './ScrollPresentation';
import { BookPresentation } from './BookPresentation';
import { CreaturePresentation } from './CreaturePresentation';
import { LocationPresentation } from './LocationPresentation';

type BasePresentationComponent = typeof ScrollPresentation | typeof BookPresentation;

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

/**
 * Get presentation component for base LoreEntry types (not creature or location)
 */
function getBasePresentation(entry: LoreEntry): BasePresentationComponent {
  switch (entry.item_type) {
    case 'book':
    case 'chronicle':
      return BookPresentation;
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

  // Base entry types use scroll or book presentation
  const Presentation = getBasePresentation(entry);
  return (
    <div className={`codex-reader transition-${transitionState}`}>
      <Presentation entry={entry} />
    </div>
  );
}
