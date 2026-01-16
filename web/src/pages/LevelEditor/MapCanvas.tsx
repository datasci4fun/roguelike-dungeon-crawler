/**
 * MapCanvas - 2D dungeon map renderer using HTML5 Canvas
 *
 * Features:
 * - Pan and zoom with mouse
 * - Room highlighting with zone colors
 * - Tile selection
 * - Set piece markers
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import type { GeneratedDungeon, Room } from '../../services/editorApi';
import { ZONE_COLORS, type PlacedSetPiece } from './types';

interface MapCanvasProps {
  dungeon: GeneratedDungeon | null;
  selectedRoom: number | null;
  selectedTile: { x: number; y: number } | null;
  hoveredRoom: number | null;
  placedSetPieces: PlacedSetPiece[];
  onRoomClick: (roomId: number) => void;
  onTileClick: (x: number, y: number) => void;
  onRoomHover: (roomId: number | null) => void;
  onTileHover: (x: number, y: number) => void;
}

// Tile colors
const TILE_COLORS: Record<string, string> = {
  '#': '#1a1a2e',  // Wall
  '.': '#2d3436',  // Floor
  '<': '#4a90d9',  // Stairs up
  '>': '#22c55e',  // Stairs down
  'L': '#f97316',  // Lava
  'I': '#93c5fd',  // Ice
  'W': '#0ea5e9',  // Water
  'P': '#84cc16',  // Poison gas
};

export function MapCanvas({
  dungeon,
  selectedRoom,
  selectedTile,
  hoveredRoom,
  placedSetPieces,
  onRoomClick,
  onTileClick,
  onRoomHover,
  onTileHover,
}: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // View state
  const [scale, setScale] = useState(10);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [showZoneColors, setShowZoneColors] = useState(true);

  // Convert screen coords to tile coords
  const screenToTile = useCallback(
    (screenX: number, screenY: number) => {
      const x = Math.floor((screenX - offset.x) / scale);
      const y = Math.floor((screenY - offset.y) / scale);
      return { x, y };
    },
    [offset, scale]
  );

  // Find room at tile position
  const getRoomAt = useCallback(
    (x: number, y: number): Room | null => {
      if (!dungeon) return null;
      for (const room of dungeon.rooms) {
        if (
          x >= room.x &&
          x < room.x + room.width &&
          y >= room.y &&
          y < room.y + room.height
        ) {
          return room;
        }
      }
      return null;
    },
    [dungeon]
  );

  // Draw the map
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !dungeon) return;

    const { width, height } = canvas;

    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Draw tiles
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.width; x++) {
        const screenX = x * scale + offset.x;
        const screenY = y * scale + offset.y;

        // Skip if off screen
        if (screenX + scale < 0 || screenX > width) continue;
        if (screenY + scale < 0 || screenY > height) continue;

        const tile = dungeon.tiles[y]?.[x] || '#';

        // Get zone color if enabled
        let fillColor = TILE_COLORS[tile] || TILE_COLORS['#'];

        if (showZoneColors && tile !== '#') {
          const room = getRoomAt(x, y);
          if (room) {
            const zoneColor = ZONE_COLORS[room.zone];
            if (zoneColor) {
              fillColor = zoneColor + '40'; // 25% opacity
            }
          }
        }

        ctx.fillStyle = fillColor;
        ctx.fillRect(screenX, screenY, scale - (showGrid ? 1 : 0), scale - (showGrid ? 1 : 0));
      }
    }

    // Highlight hovered room
    if (hoveredRoom !== null) {
      const room = dungeon.rooms.find((r) => r.id === hoveredRoom);
      if (room) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(
          room.x * scale + offset.x,
          room.y * scale + offset.y,
          room.width * scale,
          room.height * scale
        );
      }
    }

    // Highlight selected room
    if (selectedRoom !== null) {
      const room = dungeon.rooms.find((r) => r.id === selectedRoom);
      if (room) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.strokeRect(
          room.x * scale + offset.x,
          room.y * scale + offset.y,
          room.width * scale,
          room.height * scale
        );
      }
    }

    // Highlight selected tile
    if (selectedTile) {
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        selectedTile.x * scale + offset.x,
        selectedTile.y * scale + offset.y,
        scale,
        scale
      );
    }

    // Draw placed set pieces
    for (const piece of placedSetPieces) {
      const screenX = piece.x * scale + offset.x;
      const screenY = piece.y * scale + offset.y;

      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(screenX + scale / 2, screenY + scale / 2, scale / 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = `${scale * 0.4}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(piece.type[0], screenX + scale / 2, screenY + scale / 2);
    }

    // Draw room labels
    if (scale > 8) {
      ctx.fillStyle = '#ffffff';
      ctx.font = `${Math.max(8, scale * 0.8)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (const room of dungeon.rooms) {
        const centerX = (room.x + room.width / 2) * scale + offset.x;
        const centerY = (room.y + room.height / 2) * scale + offset.y;

        // Draw zone name
        ctx.globalAlpha = 0.7;
        ctx.fillText(room.zone.substring(0, 6), centerX, centerY);
        ctx.globalAlpha = 1;
      }
    }

    // Draw tile visuals (set pieces)
    for (const visual of dungeon.tileVisuals) {
      if (visual.setPieceType && visual.setPieceType !== 'NONE') {
        const screenX = visual.x * scale + offset.x;
        const screenY = visual.y * scale + offset.y;

        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(screenX + scale / 2, screenY + scale / 2, scale / 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw interactives
    for (const interactive of dungeon.interactives) {
      const screenX = interactive.x * scale + offset.x;
      const screenY = interactive.y * scale + offset.y;

      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(screenX + scale * 0.3, screenY + scale * 0.3, scale * 0.4, scale * 0.4);
    }
  }, [
    dungeon,
    offset,
    scale,
    showGrid,
    showZoneColors,
    selectedRoom,
    selectedTile,
    hoveredRoom,
    placedSetPieces,
    getRoomAt,
  ]);

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width;
        canvas.height = height;
        draw();
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [draw]);

  // Redraw when dependencies change
  useEffect(() => {
    draw();
  }, [draw]);

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      // Left click - start drag or select
      if (e.shiftKey) {
        setIsDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      } else {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const tile = screenToTile(e.clientX - rect.left, e.clientY - rect.top);
          if (dungeon && tile.x >= 0 && tile.x < dungeon.width && tile.y >= 0 && tile.y < dungeon.height) {
            onTileClick(tile.x, tile.y);

            const room = getRoomAt(tile.x, tile.y);
            if (room) {
              onRoomClick(room.id);
            }
          }
        }
      }
    } else if (e.button === 2) {
      // Right click - always drag
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    } else {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const tile = screenToTile(e.clientX - rect.left, e.clientY - rect.top);
        if (dungeon && tile.x >= 0 && tile.x < dungeon.width && tile.y >= 0 && tile.y < dungeon.height) {
          onTileHover(tile.x, tile.y);

          const room = getRoomAt(tile.x, tile.y);
          onRoomHover(room?.id ?? null);
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel handler for zoom - use native event to avoid passive listener warning
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Zoom toward mouse position
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prevScale => {
      const newScale = Math.max(4, Math.min(40, prevScale * zoomFactor));
      const scaleRatio = newScale / prevScale;
      setOffset(prevOffset => ({
        x: mouseX - (mouseX - prevOffset.x) * scaleRatio,
        y: mouseY - (mouseY - prevOffset.y) * scaleRatio,
      }));
      return newScale;
    });
  }, []);

  // Attach wheel event with { passive: false } to allow preventDefault
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // Center view on dungeon
  const centerView = () => {
    if (!dungeon || !canvasRef.current) return;
    const canvas = canvasRef.current;

    const dungeonWidth = dungeon.width * scale;
    const dungeonHeight = dungeon.height * scale;

    setOffset({
      x: (canvas.width - dungeonWidth) / 2,
      y: (canvas.height - dungeonHeight) / 2,
    });
  };

  // Reset zoom and center
  const resetView = () => {
    setScale(10);
    centerView();
  };

  return (
    <div className="map-canvas-container" ref={containerRef}>
      <div className="map-canvas-toolbar">
        <button onClick={() => setShowGrid(!showGrid)} className={showGrid ? 'active' : ''}>
          Grid
        </button>
        <button onClick={() => setShowZoneColors(!showZoneColors)} className={showZoneColors ? 'active' : ''}>
          Zones
        </button>
        <button onClick={resetView}>Reset View</button>
        <span className="zoom-label">Zoom: {scale.toFixed(0)}x</span>
      </div>
      <canvas
        ref={canvasRef}
        className="map-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
      />
      <div className="map-canvas-help">
        Shift+drag or right-drag to pan | Scroll to zoom | Click to select
      </div>
    </div>
  );
}
