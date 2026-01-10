/**
 * CodexReader - Reading pane that delegates to scroll or book presentation
 */
import type { LoreEntry, TransitionState } from '../types';
import { ScrollPresentation } from './ScrollPresentation';
import { BookPresentation } from './BookPresentation';

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

export function CodexReader({ entry, transitionState }: CodexReaderProps) {
  if (!entry) {
    return (
      <div className="codex-reader">
        <EmptyState />
      </div>
    );
  }

  const Presentation = entry.item_type === 'book'
    ? BookPresentation
    : ScrollPresentation;

  return (
    <div className={`codex-reader transition-${transitionState}`}>
      <Presentation entry={entry} />
    </div>
  );
}
