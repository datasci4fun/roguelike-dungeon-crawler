/**
 * useKeyboardNavigation - Reusable hook for keyboard navigation in lists/grids
 *
 * v6.5.1 med-05: Adds accessibility keyboard support
 *
 * Features:
 * - Arrow key navigation (up/down for lists, all directions for grids)
 * - Enter/Space to select
 * - Home/End to jump to first/last item
 * - Tab to move to next focusable section
 */
import { useCallback, useEffect, useRef } from 'react';

interface UseKeyboardNavigationOptions {
  /** Total number of items in the list/grid */
  itemCount: number;
  /** Number of columns (1 for vertical list, >1 for grid) */
  columns?: number;
  /** Currently selected index */
  selectedIndex: number;
  /** Callback when selection changes */
  onSelect: (index: number) => void;
  /** Callback when item is activated (Enter/Space) */
  onActivate?: (index: number) => void;
  /** Whether navigation is enabled */
  enabled?: boolean;
  /** Whether to wrap around at edges */
  wrap?: boolean;
}

export function useKeyboardNavigation({
  itemCount,
  columns = 1,
  selectedIndex,
  onSelect,
  onActivate,
  enabled = true,
  wrap = true,
}: UseKeyboardNavigationOptions) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled || itemCount === 0) return;

    let newIndex = selectedIndex;
    let handled = false;

    switch (e.key) {
      case 'ArrowUp':
        if (columns === 1) {
          // Vertical list: move up
          newIndex = selectedIndex - 1;
        } else {
          // Grid: move up one row
          newIndex = selectedIndex - columns;
        }
        handled = true;
        break;

      case 'ArrowDown':
        if (columns === 1) {
          // Vertical list: move down
          newIndex = selectedIndex + 1;
        } else {
          // Grid: move down one row
          newIndex = selectedIndex + columns;
        }
        handled = true;
        break;

      case 'ArrowLeft':
        if (columns > 1) {
          // Grid: move left
          newIndex = selectedIndex - 1;
          handled = true;
        }
        break;

      case 'ArrowRight':
        if (columns > 1) {
          // Grid: move right
          newIndex = selectedIndex + 1;
          handled = true;
        }
        break;

      case 'Home':
        newIndex = 0;
        handled = true;
        break;

      case 'End':
        newIndex = itemCount - 1;
        handled = true;
        break;

      case 'Enter':
      case ' ':
        if (onActivate) {
          onActivate(selectedIndex);
          handled = true;
        }
        break;
    }

    if (handled) {
      e.preventDefault();

      // Handle wrapping or clamping
      if (wrap) {
        if (newIndex < 0) newIndex = itemCount - 1;
        if (newIndex >= itemCount) newIndex = 0;
      } else {
        newIndex = Math.max(0, Math.min(itemCount - 1, newIndex));
      }

      if (newIndex !== selectedIndex && newIndex >= 0 && newIndex < itemCount) {
        onSelect(newIndex);
      }
    }
  }, [enabled, itemCount, columns, selectedIndex, onSelect, onActivate, wrap]);

  // Attach keyboard listener to container
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);

  // Focus management
  const focusContainer = useCallback(() => {
    containerRef.current?.focus();
  }, []);

  return {
    containerRef,
    focusContainer,
    // Props to spread on container element
    containerProps: {
      ref: containerRef,
      tabIndex: enabled ? 0 : -1,
      role: 'listbox',
      'aria-activedescendant': `item-${selectedIndex}`,
    },
    // Props to spread on each item
    getItemProps: (index: number) => ({
      id: `item-${index}`,
      role: 'option',
      'aria-selected': index === selectedIndex,
      tabIndex: -1, // Container handles focus
    }),
  };
}

/**
 * Simple hook for single-key shortcuts
 */
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === key && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // Don't trigger if user is typing in an input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, enabled]);
}
