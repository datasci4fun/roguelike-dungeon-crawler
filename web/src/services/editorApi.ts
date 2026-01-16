/**
 * Level Editor API client
 * Communicates with the backend editor endpoints for dungeon generation and zone configuration.
 */

const API_BASE = 'http://localhost:8000';

// ============================================================================
// Types
// ============================================================================

export interface Room {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  zone: string;
  roomType: string;
}

export interface InteractiveTile {
  x: number;
  y: number;
  type: string;
  subtype?: string;
  wallFace?: string;
  examineText?: string;
  state?: string;
}

export interface TileVisual {
  x: number;
  y: number;
  elevation?: number;
  slopeDirection?: string;
  setPieceType?: string;
  setPieceRotation?: number;
  setPieceScale?: number;
}

export interface ZoneSpec {
  zoneId: string;
  weight: number;
  requiredCount: number;
  selectionRule: string;
  eligibilityDescription?: string;
}

export interface FloorZoneConfig {
  floorLevel: number;
  startZone: string;
  bossApproachCount: number;
  fallbackZone: string;
  zones: ZoneSpec[];
}

export interface GeneratedDungeon {
  seed: number;
  floor: number;
  width: number;
  height: number;
  tiles: string[][];
  rooms: Room[];
  zoneConfig: FloorZoneConfig;
  interactives: InteractiveTile[];
  tileVisuals: TileVisual[];
  zoneSummary: string;
  generatedAt: string;
}

export interface SetPieceType {
  id: string;
  value: number;
}

export interface DungeonThemes {
  levelThemes: Record<number, string>;
  themeTiles: Record<string, { wall: string; floor: string }>;
}

// ============================================================================
// API Helpers
// ============================================================================

function camelCaseKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(camelCaseKeys);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      // Convert snake_case to camelCase
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      acc[camelKey] = camelCaseKeys(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Generate a dungeon with optional seed and floor
 */
export async function generateDungeon(floor: number, seed?: number): Promise<GeneratedDungeon> {
  const params = new URLSearchParams({ floor: String(floor) });
  if (seed !== undefined) {
    params.set('seed', String(seed));
  }

  const response = await fetch(`${API_BASE}/api/editor/generate?${params}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate dungeon');
  }

  const data = await response.json();
  return camelCaseKeys(data);
}

/**
 * Get zone configurations for all floors
 */
export async function getZoneConfigs(): Promise<Record<number, FloorZoneConfig>> {
  const response = await fetch(`${API_BASE}/api/editor/zone-configs`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get zone configs');
  }

  const data = await response.json();
  const configs = camelCaseKeys(data.configs);

  // Convert string keys to numbers
  const result: Record<number, FloorZoneConfig> = {};
  for (const [key, value] of Object.entries(configs)) {
    result[parseInt(key)] = value as FloorZoneConfig;
  }
  return result;
}

/**
 * Get zone configuration for a specific floor
 */
export async function getFloorZones(floor: number): Promise<FloorZoneConfig> {
  const response = await fetch(`${API_BASE}/api/editor/zones/${floor}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get floor zones');
  }

  const data = await response.json();
  return camelCaseKeys(data);
}

/**
 * Get available set piece types
 */
export async function getSetPieceTypes(): Promise<SetPieceType[]> {
  const response = await fetch(`${API_BASE}/api/editor/set-piece-types`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get set piece types');
  }

  const data = await response.json();
  return data.types;
}

/**
 * Get dungeon themes
 */
export async function getDungeonThemes(): Promise<DungeonThemes> {
  const response = await fetch(`${API_BASE}/api/editor/themes`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get themes');
  }

  const data = await response.json();
  return camelCaseKeys(data);
}

/**
 * Export editor state as Python code
 */
export async function exportAsPython(
  floor: number,
  seed: number,
  zoneName: string,
  setPieces: Array<{ x: number; y: number; type: string; rotation?: number; scale?: number }>,
  zoneOverrides?: Record<number, string>
): Promise<{ code: string; filename: string }> {
  const response = await fetch(`${API_BASE}/api/editor/export/python`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      floor,
      seed,
      zone_name: zoneName,
      set_pieces: setPieces.map(p => ({
        x: p.x,
        y: p.y,
        type: p.type,
        rotation: p.rotation ?? 0,
        scale: p.scale ?? 1.0,
      })),
      zone_overrides: zoneOverrides ?? {},
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to export');
  }

  return response.json();
}
