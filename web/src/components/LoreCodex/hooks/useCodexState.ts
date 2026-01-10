/**
 * State management hook for the Lore Codex
 */
import { useState, useCallback, useMemo } from 'react';
import type { LoreEntry, LoreCategory, TransitionState } from '../types';

interface CodexState {
  selectedCategory: LoreCategory | 'all';
  selectedEntryId: string | null;
  transitionState: TransitionState;
}

export function useCodexState(entries: LoreEntry[]) {
  const [state, setState] = useState<CodexState>({
    selectedCategory: 'all',
    selectedEntryId: entries.length > 0 ? entries[0].id : null,
    transitionState: 'idle',
  });

  const setCategory = useCallback((category: LoreCategory | 'all') => {
    setState(prev => ({
      ...prev,
      selectedCategory: category,
      selectedEntryId: null, // Reset selection on category change
    }));
  }, []);

  const setEntry = useCallback((entryId: string) => {
    // Start exit transition
    setState(prev => ({ ...prev, transitionState: 'exiting' }));

    // After exit animation, switch entry and start enter transition
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        selectedEntryId: entryId,
        transitionState: 'entering',
      }));

      // After enter animation, return to idle
      setTimeout(() => {
        setState(prev => ({ ...prev, transitionState: 'idle' }));
      }, 500);
    }, 300);
  }, []);

  const filteredEntries = useMemo(() => {
    if (state.selectedCategory === 'all') return entries;
    return entries.filter(e => e.category === state.selectedCategory);
  }, [entries, state.selectedCategory]);

  const selectedEntry = useMemo(() => {
    return entries.find(e => e.id === state.selectedEntryId) ?? null;
  }, [entries, state.selectedEntryId]);

  // Calculate counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<LoreCategory | 'all', number> = {
      all: entries.length,
      history: 0,
      characters: 0,
      creatures: 0,
      locations: 0,
      artifacts: 0,
    };
    entries.forEach(entry => {
      counts[entry.category]++;
    });
    return counts;
  }, [entries]);

  return {
    selectedCategory: state.selectedCategory,
    selectedEntry,
    filteredEntries,
    transitionState: state.transitionState,
    categoryCounts,
    setCategory,
    setEntry,
  };
}
