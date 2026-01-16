/**
 * Placement Rules System
 *
 * Defines rules for procedurally placing assets during dungeon generation.
 * Rules are designed to be exported as Python zone_layout code.
 */

// Position strategies for asset placement
export type PositionStrategy =
  | 'center'           // Place at room center
  | 'corners'          // Place in room corners
  | 'along_north_wall' // Along north wall
  | 'along_south_wall' // Along south wall
  | 'along_east_wall'  // Along east wall
  | 'along_west_wall'  // Along west wall
  | 'along_any_wall'   // Along any wall
  | 'at_entrances'     // At doorways/entrances
  | 'random_floor'     // Random floor tiles
  | 'grid'             // Regular grid pattern
  | 'perimeter';       // Around room perimeter

// Count specification
export interface CountSpec {
  type: 'fixed' | 'range' | 'density' | 'all';
  min?: number;
  max?: number;
  fixed?: number;
  perTiles?: number; // For density: 1 per N tiles
}

// Rotation options
export type RotationOption =
  | 'fixed'       // Fixed rotation value
  | 'face_center' // Rotate to face room center
  | 'face_wall'   // Rotate to face nearest wall
  | 'random';     // Random rotation

// A single placement rule
export interface PlacementRule {
  id: string;
  assetId: string;           // Model ID from library
  assetName: string;         // Display name
  position: PositionStrategy;
  count: CountSpec;
  rotation: RotationOption;
  rotationValue?: number;    // For fixed rotation (0, 90, 180, 270)
  scale: number;
  offsetFromWall?: number;   // Tiles away from wall (for wall positions)
  spacing?: number;          // Minimum spacing between instances
  avoidEntrances?: boolean;  // Don't place near doorways
  priority?: number;         // Higher priority rules run first
}

// A complete zone layout configuration
export interface ZoneLayoutConfig {
  zoneId: string;
  floor: number;
  displayName: string;
  description: string;
  rules: PlacementRule[];
}

// Preset rules for common patterns
export const PRESET_RULES: Record<string, Partial<PlacementRule>> = {
  // Structural
  corner_pillars: {
    position: 'corners',
    count: { type: 'all' },
    rotation: 'face_center',
    offsetFromWall: 1,
  },
  wall_pillars: {
    position: 'along_any_wall',
    count: { type: 'density', perTiles: 8 },
    rotation: 'face_center',
    offsetFromWall: 0,
    spacing: 3,
  },

  // Decorative
  center_statue: {
    position: 'center',
    count: { type: 'fixed', fixed: 1 },
    rotation: 'face_wall',
    scale: 1.2,
  },
  entrance_guards: {
    position: 'at_entrances',
    count: { type: 'all' },
    rotation: 'face_center',
    offsetFromWall: 1,
  },
  scattered_props: {
    position: 'random_floor',
    count: { type: 'range', min: 2, max: 5 },
    rotation: 'random',
    avoidEntrances: true,
    spacing: 2,
  },

  // Furniture
  throne_center: {
    position: 'center',
    count: { type: 'fixed', fixed: 1 },
    rotation: 'fixed',
    rotationValue: 180, // Face entrance
    scale: 1.0,
  },
  wall_furniture: {
    position: 'along_north_wall',
    count: { type: 'range', min: 1, max: 3 },
    rotation: 'face_center',
    offsetFromWall: 0,
    spacing: 2,
  },
};

// Generate Python code from rules
export function generatePythonCode(config: ZoneLayoutConfig): string {
  const lines: string[] = [];

  lines.push(`@register_layout(${config.floor}, "${config.zoneId}")`);
  lines.push(`def layout_${config.zoneId.replace(/-/g, '_')}(dungeon: 'Dungeon', room: 'Room'):`);
  lines.push(`    """${config.description}"""`);
  lines.push('');

  if (config.rules.length === 0) {
    lines.push('    pass  # No rules defined');
    return lines.join('\n');
  }

  // Generate code for each rule
  for (const rule of config.rules) {
    lines.push(`    # ${rule.assetName} - ${rule.position}`);
    lines.push(...generateRuleCode(rule));
    lines.push('');
  }

  return lines.join('\n');
}

function generateRuleCode(rule: PlacementRule): string[] {
  const lines: string[] = [];
  const indent = '    ';

  // Get positions based on strategy
  switch (rule.position) {
    case 'center':
      lines.push(`${indent}cx, cy = room.center()`);
      lines.push(`${indent}dungeon.set_tile_visual(cx, cy, TileVisual.with_set_piece(`);
      lines.push(`${indent}    piece_type=SetPieceType.${rule.assetId.toUpperCase()},`);
      lines.push(`${indent}    rotation=${rule.rotationValue || 0},`);
      lines.push(`${indent}    scale=${rule.scale}`);
      lines.push(`${indent}))`);
      break;

    case 'corners':
      lines.push(`${indent}corners = [`);
      lines.push(`${indent}    (room.x + 1, room.y + 1),`);
      lines.push(`${indent}    (room.x + room.width - 2, room.y + 1),`);
      lines.push(`${indent}    (room.x + 1, room.y + room.height - 2),`);
      lines.push(`${indent}    (room.x + room.width - 2, room.y + room.height - 2),`);
      lines.push(`${indent}]`);
      lines.push(`${indent}for cx, cy in corners:`);
      lines.push(`${indent}    if dungeon.tiles[cy][cx] == TileType.FLOOR:`);
      lines.push(`${indent}        dungeon.set_tile_visual(cx, cy, TileVisual.with_set_piece(`);
      lines.push(`${indent}            piece_type=SetPieceType.${rule.assetId.toUpperCase()},`);
      lines.push(`${indent}            rotation=0,`);
      lines.push(`${indent}            scale=${rule.scale}`);
      lines.push(`${indent}        ))`);
      break;

    case 'along_north_wall':
    case 'along_south_wall':
    case 'along_east_wall':
    case 'along_west_wall':
      const wallDir = rule.position.replace('along_', '').replace('_wall', '');
      lines.push(`${indent}# Place along ${wallDir} wall`);
      lines.push(`${indent}positions = get_wall_positions(room, "${wallDir}", offset=${rule.offsetFromWall || 1})`);
      if (rule.count.type === 'density' && rule.count.perTiles) {
        lines.push(`${indent}count = max(1, len(positions) // ${rule.count.perTiles})`);
      } else if (rule.count.type === 'range') {
        lines.push(`${indent}count = random.randint(${rule.count.min || 1}, ${rule.count.max || 3})`);
      } else if (rule.count.type === 'fixed') {
        lines.push(`${indent}count = ${rule.count.fixed || 1}`);
      }
      lines.push(`${indent}for pos in random.sample(positions, min(count, len(positions))):`);
      lines.push(`${indent}    dungeon.set_tile_visual(pos[0], pos[1], TileVisual.with_set_piece(`);
      lines.push(`${indent}        piece_type=SetPieceType.${rule.assetId.toUpperCase()},`);
      lines.push(`${indent}        rotation=${rule.rotationValue || 0},`);
      lines.push(`${indent}        scale=${rule.scale}`);
      lines.push(`${indent}    ))`);
      break;

    case 'random_floor':
      lines.push(`${indent}# Random floor positions`);
      lines.push(`${indent}floor_tiles = [`);
      lines.push(`${indent}    (x, y) for x in range(room.x + 1, room.x + room.width - 1)`);
      lines.push(`${indent}    for y in range(room.y + 1, room.y + room.height - 1)`);
      lines.push(`${indent}    if dungeon.tiles[y][x] == TileType.FLOOR`);
      lines.push(`${indent}]`);
      if (rule.count.type === 'range') {
        lines.push(`${indent}count = random.randint(${rule.count.min || 1}, min(${rule.count.max || 5}, len(floor_tiles)))`);
      } else if (rule.count.type === 'fixed') {
        lines.push(`${indent}count = min(${rule.count.fixed || 1}, len(floor_tiles))`);
      }
      lines.push(`${indent}for pos in random.sample(floor_tiles, count):`);
      lines.push(`${indent}    dungeon.set_tile_visual(pos[0], pos[1], TileVisual.with_set_piece(`);
      lines.push(`${indent}        piece_type=SetPieceType.${rule.assetId.toUpperCase()},`);
      const rotation = rule.rotation === 'random' ? 'random.choice([0, 90, 180, 270])' : String(rule.rotationValue || 0);
      lines.push(`${indent}        rotation=${rotation},`);
      lines.push(`${indent}        scale=${rule.scale}`);
      lines.push(`${indent}    ))`);
      break;

    default:
      lines.push(`${indent}# TODO: Implement ${rule.position} strategy`);
  }

  return lines;
}

// Create a new rule with defaults
export function createRule(assetId: string, assetName: string): PlacementRule {
  return {
    id: `rule-${Date.now()}`,
    assetId,
    assetName,
    position: 'random_floor',
    count: { type: 'range', min: 1, max: 3 },
    rotation: 'random',
    scale: 1.0,
    spacing: 2,
    avoidEntrances: true,
  };
}

// Apply a preset to a rule
export function applyPreset(rule: PlacementRule, presetKey: string): PlacementRule {
  const preset = PRESET_RULES[presetKey];
  if (!preset) return rule;
  return { ...rule, ...preset };
}
