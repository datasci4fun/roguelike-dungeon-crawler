/**
 * useDebugRenderer - Debug visualization controls for FirstPersonRenderer
 *
 * Features:
 * - Gated behind DEV mode or ?debug=1 query param
 * - Persists settings to localStorage
 * - Provides hotkey handlers (F8, F9, F10)
 * - Manages snapshot capture
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PROJECTION_CONFIG } from '../components/SceneRenderer/projection';
import type { CorridorInfoEntry } from '../components/SceneRenderer/FirstPersonRenderer';
import type { FirstPersonView } from './useGameSocket';

// Storage key for debug settings
const STORAGE_KEY = 'roguelike-debug-renderer';

export interface DebugRendererState {
  showWireframe: boolean;
  showOccluded: boolean;
}

export interface DebugSnapshot {
  timestamp: string;
  player?: {
    x: number;
    y: number;
    facing: { dx: number; dy: number };
  };
  view: FirstPersonView;
  projectionConfig: typeof PROJECTION_CONFIG;
  renderSettings?: Record<string, unknown>;
  corridorInfo?: CorridorInfoEntry[];
  topDownWindow?: string[][]; // 11x11 grid around player (if available from server)
  // Alignment metadata for debugging FPV vs top-down comparison
  topDownWindowCenter?: { row: number; col: number }; // Always [5][5] - player position
  depthWorldCoords?: Array<{ depth: number; x: number; y: number }>; // World coords at each FPV depth
  // Debug counters
  oobTileCount?: number; // Count of tiles with x<0 or y<0 (should be 0 after fix)
}

// Check if debug mode is enabled
function isDebugEnabled(): boolean {
  // Always enabled in development
  if (import.meta.env.DEV) {
    return true;
  }
  // Check for ?debug=1 query param
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    return params.get('debug') === '1';
  }
  return false;
}

// Load settings from localStorage
function loadSettings(): DebugRendererState {
  if (typeof window === 'undefined') {
    return { showWireframe: false, showOccluded: false };
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return { showWireframe: false, showOccluded: false };
}

// Save settings to localStorage
function saveSettings(state: DebugRendererState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

export interface UseDebugRendererResult {
  // Whether debug mode is available
  debugEnabled: boolean;
  // Current debug state
  showWireframe: boolean;
  showOccluded: boolean;
  // Toggle functions
  toggleWireframe: () => void;
  toggleOccluded: () => void;
  // Snapshot function
  captureSnapshot: (
    view: FirstPersonView | undefined,
    playerCoords?: { x: number; y: number },
    corridorInfo?: CorridorInfoEntry[],
    renderSettings?: Record<string, unknown>
  ) => DebugSnapshot | null;
  // Copy snapshot to clipboard
  copySnapshotToClipboard: (snapshot: DebugSnapshot) => Promise<boolean>;
  // Toast state
  toastMessage: string | null;
  clearToast: () => void;
}

export function useDebugRenderer(): UseDebugRendererResult {
  const debugEnabled = useMemo(() => isDebugEnabled(), []);
  const [state, setState] = useState<DebugRendererState>(loadSettings);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persist state changes
  useEffect(() => {
    saveSettings(state);
  }, [state]);

  // Auto-clear toast after 3 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const toggleWireframe = useCallback(() => {
    if (!debugEnabled) return;
    setState((prev) => ({ ...prev, showWireframe: !prev.showWireframe }));
  }, [debugEnabled]);

  const toggleOccluded = useCallback(() => {
    if (!debugEnabled) return;
    setState((prev) => ({ ...prev, showOccluded: !prev.showOccluded }));
  }, [debugEnabled]);

  const captureSnapshot = useCallback(
    (
      view: FirstPersonView | undefined,
      playerCoords?: { x: number; y: number },
      corridorInfo?: CorridorInfoEntry[],
      renderSettings?: Record<string, unknown>
    ): DebugSnapshot | null => {
      if (!view) return null;

      const snapshot: DebugSnapshot = {
        timestamp: new Date().toISOString(),
        view,
        projectionConfig: { ...PROJECTION_CONFIG },
        corridorInfo,
        renderSettings,
      };

      if (playerCoords && view.facing) {
        snapshot.player = {
          x: playerCoords.x,
          y: playerCoords.y,
          facing: view.facing,
        };
      }

      // Include top_down_window if server provides it (snake_case from server)
      if (view.top_down_window) {
        snapshot.topDownWindow = view.top_down_window;
        // Note: center of 11x11 window is always [5][5] = player position
        snapshot.topDownWindowCenter = { row: 5, col: 5 };
      }

      // Compute world coords at each FPV depth for alignment debugging
      if (playerCoords && view.facing) {
        const { x, y } = playerCoords;
        const { dx, dy } = view.facing;
        const maxDepth = view.rows?.length || 0;
        const depthCoords: Array<{ depth: number; x: number; y: number }> = [];
        for (let d = 0; d < maxDepth; d++) {
          // depth 0 = player row, depth 1 = one tile ahead, etc.
          depthCoords.push({
            depth: d,
            x: x + dx * d,
            y: y + dy * d,
          });
        }
        snapshot.depthWorldCoords = depthCoords;
      }

      // Debug counter: count OOB tiles (should be 0 after fix)
      if (view.rows) {
        snapshot.oobTileCount = view.rows.flat().filter(t => t.x < 0 || t.y < 0).length;
      }

      return snapshot;
    },
    []
  );

  const copySnapshotToClipboard = useCallback(
    async (snapshot: DebugSnapshot): Promise<boolean> => {
      try {
        const json = JSON.stringify(snapshot, null, 2);
        await navigator.clipboard.writeText(json);
        setToastMessage('Snapshot copied to clipboard');
        return true;
      } catch (err) {
        console.error('Failed to copy snapshot:', err);
        setToastMessage('Failed to copy snapshot');
        return false;
      }
    },
    []
  );

  const clearToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  return {
    debugEnabled,
    showWireframe: debugEnabled ? state.showWireframe : false,
    showOccluded: debugEnabled ? state.showOccluded : false,
    toggleWireframe,
    toggleOccluded,
    captureSnapshot,
    copySnapshotToClipboard,
    toastMessage,
    clearToast,
  };
}
