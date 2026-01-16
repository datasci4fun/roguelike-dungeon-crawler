/**
 * Level Editor types
 */

export interface EditorTile {
  x: number;
  y: number;
  type: string;
  zone?: string;
  roomId?: number;
}

export interface PlacedSetPiece {
  id: string;
  x: number;
  y: number;
  type: string;
  rotation: number;
  scale: number;
}

export interface EditorState {
  floor: number;
  seed: number | null;
  selectedRoom: number | null;
  selectedTile: { x: number; y: number } | null;
  hoveredRoom: number | null;
  hoveredTile: { x: number; y: number } | null;
  placedSetPieces: PlacedSetPiece[];
  zoneOverrides: Map<number, string>;
}

export type EditorTool = 'select' | 'place' | 'erase' | 'zone';

export interface ZoneColorMap {
  [zoneName: string]: string;
}

// Standard zone color palette
export const ZONE_COLORS: ZoneColorMap = {
  // Floor 1 - Stone Dungeon
  intake_hall: '#4a90d9',
  cell_blocks: '#6b7280',
  guard_corridors: '#9ca3af',
  wardens_office: '#f59e0b',
  execution_chambers: '#ef4444',
  record_vaults: '#8b5cf6',

  // Floor 2 - Sewers
  confluence_chambers: '#06b6d4',
  waste_channels: '#84cc16',
  carrier_nests: '#a3e635',
  maintenance_tunnels: '#78716c',
  diseased_pools: '#22c55e',
  seal_drifts: '#0ea5e9',
  colony_heart: '#f97316',

  // Floor 3 - Forest Depths
  root_warrens: '#854d0e',
  canopy_halls: '#16a34a',
  webbed_gardens: '#7c3aed',
  the_nursery: '#dc2626',
  digestion_chambers: '#65a30d',
  druid_ring: '#059669',

  // Floor 4 - Mirror Valdris
  courtyard_squares: '#d4d4d4',
  throne_hall_ruins: '#fbbf24',
  parade_corridors: '#a8a29e',
  seal_chambers: '#3b82f6',
  mausoleum_district: '#4b5563',
  oath_chambers: '#c084fc',

  // Floor 5 - Ice Cavern
  frozen_galleries: '#93c5fd',
  ice_tombs: '#60a5fa',
  crystal_grottos: '#a5f3fc',
  suspended_laboratories: '#67e8f9',
  breathing_chamber: '#38bdf8',
  thaw_fault: '#f87171',

  // Floor 6 - Ancient Library
  reading_halls: '#fcd34d',
  forbidden_stacks: '#7c2d12',
  catalog_chambers: '#d97706',
  indexing_heart: '#f59e0b',
  experiment_archives: '#ea580c',
  marginalia_alcoves: '#b45309',

  // Floor 7 - Volcanic Depths
  forge_halls: '#ef4444',
  magma_channels: '#f97316',
  cooling_chambers: '#64748b',
  slag_pits: '#78350f',
  rune_press: '#dc2626',
  ash_galleries: '#44403c',
  crucible_heart: '#b91c1c',

  // Floor 8 - Crystal Cave
  crystal_gardens: '#a78bfa',
  geometry_wells: '#8b5cf6',
  seal_chambers_8: '#6366f1',
  dragons_hoard: '#eab308',
  vault_antechamber: '#c4b5fd',
  oath_interface: '#7c3aed',

  // Common zones
  boss_approach: '#dc2626',
  boss_room: '#7f1d1d',
  generic: '#6b7280',
  corridor: '#374151',
};
