/**
 * TileManager - Loads and manages tile textures for the renderer
 *
 * Tiles are loaded from /tiles/{biome}/{tileName}.png
 * Example: /tiles/dungeon/floor.png
 *
 * Tile types:
 * - floor: Floor tiles (perspective grid)
 * - ceiling: Ceiling tiles
 * - wall_front: Front-facing walls
 * - wall_left: Left corridor walls
 * - wall_right: Right corridor walls
 * - wall_corner_left: Left corner pieces
 * - wall_corner_right: Right corner pieces
 */

export type TileType =
  | 'floor'
  | 'ceiling'
  | 'wall_front'
  | 'wall_left'
  | 'wall_right'
  | 'wall_corner_left'
  | 'wall_corner_right'
  | 'door'
  | 'water';

export interface TileSet {
  biomeId: string;
  tiles: Map<TileType, HTMLImageElement>;
  loaded: boolean;
  loading: boolean;
}

export interface TileConfig {
  // Base path for tile images
  basePath: string;
  // Default tile size (tiles should be square)
  tileSize: number;
  // Fallback color if tile not found
  fallbackColors: Record<TileType, string>;
}

const DEFAULT_CONFIG: TileConfig = {
  basePath: '/tiles',
  tileSize: 64,
  fallbackColors: {
    floor: '#2a2a3e',
    ceiling: '#1a1a2e',
    wall_front: '#4a4a5e',
    wall_left: '#3a3a4e',
    wall_right: '#5a5a6e',
    wall_corner_left: '#3a3a4e',
    wall_corner_right: '#5a5a6e',
    door: '#6b3510',
    water: '#1a3a5a',
  },
};

// Singleton tile manager
class TileManagerClass {
  private tileSets: Map<string, TileSet> = new Map();
  private config: TileConfig = DEFAULT_CONFIG;
  private loadPromises: Map<string, Promise<TileSet>> = new Map();

  /**
   * Configure the tile manager
   */
  configure(config: Partial<TileConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get the base path for tiles
   */
  getBasePath(): string {
    return this.config.basePath;
  }

  /**
   * Get the configured tile size
   */
  getTileSize(): number {
    return this.config.tileSize;
  }

  /**
   * Load a tile set for a biome
   * Returns a promise that resolves when all tiles are loaded
   */
  async loadTileSet(biomeId: string): Promise<TileSet> {
    // Check if already loaded
    const existing = this.tileSets.get(biomeId);
    if (existing?.loaded) {
      return existing;
    }

    // Check if currently loading
    const loadingPromise = this.loadPromises.get(biomeId);
    if (loadingPromise) {
      return loadingPromise;
    }

    // Create new tile set
    const tileSet: TileSet = {
      biomeId,
      tiles: new Map(),
      loaded: false,
      loading: true,
    };
    this.tileSets.set(biomeId, tileSet);

    // Create loading promise
    const promise = this.loadAllTiles(biomeId, tileSet);
    this.loadPromises.set(biomeId, promise);

    return promise;
  }

  /**
   * Load all tiles for a biome
   */
  private async loadAllTiles(biomeId: string, tileSet: TileSet): Promise<TileSet> {
    const tileTypes: TileType[] = [
      'floor', 'ceiling', 'wall_front', 'wall_left', 'wall_right',
      'wall_corner_left', 'wall_corner_right', 'door', 'water'
    ];

    const loadPromises = tileTypes.map(async (tileType) => {
      try {
        const image = await this.loadTileImage(biomeId, tileType);
        if (image) {
          tileSet.tiles.set(tileType, image);
        }
      } catch (e) {
        // Tile not found - will use fallback color
        console.debug(`Tile not found: ${biomeId}/${tileType}`);
      }
    });

    await Promise.all(loadPromises);

    tileSet.loaded = true;
    tileSet.loading = false;
    this.loadPromises.delete(biomeId);

    return tileSet;
  }

  /**
   * Load a single tile image
   */
  private loadTileImage(biomeId: string, tileType: TileType): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
      const img = new Image();
      const path = `${this.config.basePath}/${biomeId}/${tileType}.png`;

      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = path;
    });
  }

  /**
   * Get a tile image for a biome
   * Returns null if not loaded or not found
   */
  getTile(biomeId: string, tileType: TileType): HTMLImageElement | null {
    const tileSet = this.tileSets.get(biomeId);
    if (!tileSet?.loaded) {
      return null;
    }
    return tileSet.tiles.get(tileType) || null;
  }

  /**
   * Get fallback color for a tile type
   */
  getFallbackColor(tileType: TileType): string {
    return this.config.fallbackColors[tileType];
  }

  /**
   * Check if a tile set is loaded
   */
  isTileSetLoaded(biomeId: string): boolean {
    return this.tileSets.get(biomeId)?.loaded ?? false;
  }

  /**
   * Check if a specific tile exists for a biome
   */
  hasTile(biomeId: string, tileType: TileType): boolean {
    const tileSet = this.tileSets.get(biomeId);
    return tileSet?.tiles.has(tileType) ?? false;
  }

  /**
   * Preload tile sets for multiple biomes
   */
  async preloadBiomes(biomeIds: string[]): Promise<void> {
    await Promise.all(biomeIds.map(id => this.loadTileSet(id)));
  }

  /**
   * Clear all loaded tiles (for memory management)
   */
  clearAll(): void {
    this.tileSets.clear();
    this.loadPromises.clear();
  }

  /**
   * Clear tiles for a specific biome
   */
  clearBiome(biomeId: string): void {
    this.tileSets.delete(biomeId);
    this.loadPromises.delete(biomeId);
  }
}

// Export singleton instance
export const TileManager = new TileManagerClass();

// Note: useTileSet hook is in a separate file to avoid circular dependencies
