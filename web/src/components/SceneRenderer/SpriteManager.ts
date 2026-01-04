/**
 * SpriteManager
 *
 * Handles loading, caching, and managing sprite images.
 * Falls back to placeholder rendering if sprites aren't available.
 */

export interface SpriteDefinition {
  url: string;
  width: number;
  height: number;
  frameCount?: number; // For animated sprites
  frameRate?: number; // Frames per second
}

export interface SpriteSheet {
  image: HTMLImageElement;
  definition: SpriteDefinition;
  loaded: boolean;
  error: boolean;
}

// Default sprite definitions (placeholders - replace URLs with real sprites later)
export const DEFAULT_SPRITES: Record<string, SpriteDefinition> = {
  // Tiles
  'tile.floor': { url: '/sprites/tiles/floor.png', width: 32, height: 32 },
  'tile.wall': { url: '/sprites/tiles/wall.png', width: 32, height: 32 },
  'tile.door': { url: '/sprites/tiles/door.png', width: 32, height: 32 },
  'tile.stairs_down': { url: '/sprites/tiles/stairs_down.png', width: 32, height: 32 },
  'tile.stairs_up': { url: '/sprites/tiles/stairs_up.png', width: 32, height: 32 },

  // Entities
  'entity.player': { url: '/sprites/entities/player.png', width: 32, height: 32, frameCount: 4, frameRate: 8 },
  'entity.enemy': { url: '/sprites/entities/enemy.png', width: 32, height: 32, frameCount: 2, frameRate: 4 },
  'entity.boss': { url: '/sprites/entities/boss.png', width: 48, height: 48, frameCount: 4, frameRate: 6 },
  'entity.item': { url: '/sprites/entities/item.png', width: 24, height: 24, frameCount: 4, frameRate: 8 },
};

class SpriteManagerClass {
  private cache: Map<string, SpriteSheet> = new Map();
  private loadPromises: Map<string, Promise<SpriteSheet>> = new Map();

  /**
   * Load a sprite by key
   */
  async loadSprite(key: string, definition?: SpriteDefinition): Promise<SpriteSheet> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    // Check if already loading
    const loading = this.loadPromises.get(key);
    if (loading) {
      return loading;
    }

    // Get definition
    const def = definition || DEFAULT_SPRITES[key];
    if (!def) {
      // Return a "not found" sprite sheet
      const notFound: SpriteSheet = {
        image: new Image(),
        definition: { url: '', width: 32, height: 32 },
        loaded: false,
        error: true,
      };
      this.cache.set(key, notFound);
      return notFound;
    }

    // Start loading
    const loadPromise = new Promise<SpriteSheet>((resolve) => {
      const img = new Image();
      const sheet: SpriteSheet = {
        image: img,
        definition: def,
        loaded: false,
        error: false,
      };

      img.onload = () => {
        sheet.loaded = true;
        this.cache.set(key, sheet);
        this.loadPromises.delete(key);
        resolve(sheet);
      };

      img.onerror = () => {
        sheet.error = true;
        this.cache.set(key, sheet);
        this.loadPromises.delete(key);
        resolve(sheet);
      };

      img.src = def.url;
    });

    this.loadPromises.set(key, loadPromise);
    return loadPromise;
  }

  /**
   * Get a sprite synchronously (returns null if not loaded)
   */
  getSprite(key: string): SpriteSheet | null {
    return this.cache.get(key) || null;
  }

  /**
   * Preload multiple sprites
   */
  async preloadSprites(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.loadSprite(key)));
  }

  /**
   * Check if a sprite is loaded and valid
   */
  isSpriteReady(key: string): boolean {
    const sheet = this.cache.get(key);
    return sheet?.loaded === true && !sheet.error;
  }

  /**
   * Clear all cached sprites
   */
  clearCache(): void {
    this.cache.clear();
    this.loadPromises.clear();
  }

  /**
   * Get current frame for an animated sprite
   */
  getAnimationFrame(key: string, time: number): number {
    const sheet = this.cache.get(key);
    if (!sheet?.loaded || !sheet.definition.frameCount) {
      return 0;
    }

    const frameRate = sheet.definition.frameRate || 8;
    const frameCount = sheet.definition.frameCount;
    const frameIndex = Math.floor((time * frameRate) / 1000) % frameCount;
    return frameIndex;
  }
}

// Singleton instance
export const SpriteManager = new SpriteManagerClass();
