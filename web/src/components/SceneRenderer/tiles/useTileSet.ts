/**
 * React hook to load and use tile sets
 */
import { useState, useEffect } from 'react';
import { TileManager } from './TileManager';

/**
 * Hook to ensure a tile set is loaded
 * Returns true when tiles are ready to use
 */
export function useTileSet(biomeId: string): boolean {
  const [loaded, setLoaded] = useState(TileManager.isTileSetLoaded(biomeId));

  useEffect(() => {
    if (!TileManager.isTileSetLoaded(biomeId)) {
      setLoaded(false);
      TileManager.loadTileSet(biomeId).then(() => {
        setLoaded(true);
      });
    } else {
      setLoaded(true);
    }
  }, [biomeId]);

  return loaded;
}

/**
 * Hook to preload multiple tile sets
 */
export function usePreloadTileSets(biomeIds: string[]): boolean {
  const [allLoaded, setAllLoaded] = useState(false);

  useEffect(() => {
    const loadAll = async () => {
      await TileManager.preloadBiomes(biomeIds);
      setAllLoaded(true);
    };
    loadAll();
  }, [biomeIds.join(',')]);

  return allLoaded;
}
