/**
 * Preview3D - 3D preview panel for the Level Editor
 *
 * Creates a synthetic first-person view from dungeon tile data
 * and renders it using FirstPersonRenderer3D.
 */

import { useMemo, useState } from 'react';
import type { GeneratedDungeon, Room, TileVisual } from '../../services/editorApi';
import { FirstPersonRenderer3D } from '../../components/SceneRenderer/FirstPersonRenderer3D';
import type { FirstPersonView, FirstPersonTile, FacingDirection } from '../../hooks/useGameSocket';
import { ZONE_COLORS } from './types';

interface Preview3DProps {
  dungeon: GeneratedDungeon | null;
  selectedTile: { x: number; y: number } | null;
  selectedRoom: Room | null;
}

// Direction vectors
const DIRECTIONS: Record<string, FacingDirection> = {
  north: { dx: 0, dy: -1, name: 'North' },
  south: { dx: 0, dy: 1, name: 'South' },
  east: { dx: 1, dy: 0, name: 'East' },
  west: { dx: -1, dy: 0, name: 'West' },
};

/**
 * Create a synthetic FirstPersonView from dungeon data
 */
function createViewFromDungeon(
  dungeon: GeneratedDungeon,
  centerX: number,
  centerY: number,
  facing: FacingDirection
): FirstPersonView {
  const depth = 9; // View distance
  const width = 11; // View width (odd number for center)
  const halfWidth = Math.floor(width / 2);

  const rows: FirstPersonTile[][] = [];

  // Build rows from front to back based on facing direction
  for (let d = 0; d < depth; d++) {
    const row: FirstPersonTile[] = [];

    for (let w = -halfWidth; w <= halfWidth; w++) {
      // Calculate world position based on facing
      let wx: number, wy: number;

      if (facing.dx === 0 && facing.dy === -1) {
        // Facing North
        wx = centerX + w;
        wy = centerY - d;
      } else if (facing.dx === 0 && facing.dy === 1) {
        // Facing South
        wx = centerX - w;
        wy = centerY + d;
      } else if (facing.dx === 1 && facing.dy === 0) {
        // Facing East
        wx = centerX + d;
        wy = centerY + w;
      } else {
        // Facing West
        wx = centerX - d;
        wy = centerY - w;
      }

      // Get tile type
      let tile = '#'; // Default to wall
      let zone = 'generic';
      let interactive: FirstPersonTile['interactive'] = undefined;
      let tileVisual: FirstPersonTile['tile_visual'] = undefined;

      if (wx >= 0 && wx < dungeon.width && wy >= 0 && wy < dungeon.height) {
        tile = dungeon.tiles[wy]?.[wx] || '#';

        // Find room/zone for this tile
        const room = dungeon.rooms.find(
          (r) => wx >= r.x && wx < r.x + r.width && wy >= r.y && wy < r.y + r.height
        );
        if (room) {
          zone = room.zone;
        }

        // Find interactive at this position
        const interactiveData = dungeon.interactives.find((i) => i.x === wx && i.y === wy);
        if (interactiveData) {
          interactive = {
            type: interactiveData.type,
            state: interactiveData.state || 'closed',
            wall_face: interactiveData.wallFace || 'north',
            target: undefined,
          };
        }

        // Find tile visual
        const visualData = dungeon.tileVisuals.find((v) => v.x === wx && v.y === wy);
        if (visualData) {
          tileVisual = {
            elevation: visualData.elevation || 0,
            slope_direction: visualData.slopeDirection as any,
            set_piece_type: visualData.setPieceType as any,
            set_piece_rotation: visualData.setPieceRotation || 0,
            set_piece_scale: visualData.setPieceScale || 1,
          };
        }
      }

      row.push({
        tile,
        zone,
        x: wx,
        y: wy,
        interactive,
        tile_visual: tileVisual,
      });
    }

    rows.push(row);
  }

  return {
    rows,
    entities: [],
    torches: [],
    lighting: {},
    facing,
    depth,
    zone_id: dungeon.rooms.find(
      (r) => centerX >= r.x && centerX < r.x + r.width && centerY >= r.y && centerY < r.y + r.height
    )?.zone,
    room_has_ceiling: true,
  };
}

export function Preview3D({ dungeon, selectedTile, selectedRoom }: Preview3DProps) {
  const [facingKey, setFacingKey] = useState<string>('north');

  const facing = DIRECTIONS[facingKey];

  // Create synthetic view
  const view = useMemo(() => {
    if (!dungeon || !selectedTile) return undefined;
    return createViewFromDungeon(dungeon, selectedTile.x, selectedTile.y, facing);
  }, [dungeon, selectedTile, facing]);

  // Zone color for current position
  const zoneColor = view?.zone_id ? ZONE_COLORS[view.zone_id] : undefined;

  if (!dungeon) {
    return (
      <div className="preview-3d-panel">
        <div className="preview-placeholder">
          Generate a dungeon to see 3D preview
        </div>
      </div>
    );
  }

  if (!selectedTile) {
    return (
      <div className="preview-3d-panel">
        <div className="preview-placeholder">
          Select a tile to see 3D preview
        </div>
      </div>
    );
  }

  return (
    <div className="preview-3d-panel">
      <div className="preview-toolbar">
        <span className="preview-title">3D Preview</span>
        <div className="facing-controls">
          {Object.entries(DIRECTIONS).map(([key, dir]) => (
            <button
              key={key}
              className={facingKey === key ? 'active' : ''}
              onClick={() => setFacingKey(key)}
              title={`Face ${dir.name}`}
            >
              {key === 'north' ? '↑' : key === 'south' ? '↓' : key === 'east' ? '→' : '←'}
            </button>
          ))}
        </div>
      </div>
      <div className="preview-container">
        <FirstPersonRenderer3D
          view={view}
          width={400}
          height={300}
          enableAnimations={false}
          settings={{
            gridLines: false,
            showCoordinates: false,
          }}
        />
      </div>
      <div className="preview-info">
        <span>
          Position: ({selectedTile.x}, {selectedTile.y})
        </span>
        {view?.zone_id && (
          <span style={{ color: zoneColor }}>Zone: {view.zone_id}</span>
        )}
        <span>Facing: {facing.name}</span>
      </div>
    </div>
  );
}
