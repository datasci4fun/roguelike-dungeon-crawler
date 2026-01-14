# BattleRenderer3D Module

Three.js-based 3D battle arena renderer for the roguelike dungeon crawler.

## Architecture

The module is split into focused files for maintainability:

```
BattleRenderer3D/
├── index.ts           # Re-exports for external use
├── BattleRenderer3D.tsx  # Main React component (~500 lines)
├── constants.ts       # Configuration values, shared geometries
├── types.ts           # TypeScript interfaces
├── modelLoader.ts     # GLB model loading and caching
├── entityFactory.ts   # Entity sprite/3D model creation
├── arenaBuilder.ts    # Arena geometry construction
├── entityUpdater.ts   # Entity position updates, lifecycle
├── cameraController.ts # Camera phases and positioning
├── highlightSystem.ts  # Tile action highlights
└── effectsSystem.ts    # Damage numbers, particles, shake
```

## Key Components

### BattleRenderer3D.tsx
Main React component that orchestrates the 3D scene:
- Initializes Three.js scene, camera, renderer
- Manages animation loop
- Handles mouse/keyboard input
- Processes battle events (damage, turns, attacks)

### entityFactory.ts
Creates visual representations of entities:
- `createEntitySprite()` - 2D sprite fallback with HP bar
- `createEntity3D()` - 3D model with HP bar (falls back to sprite)
- `createHpBar()` - HP bar sprite

### entityUpdater.ts
Manages entity lifecycle and smooth movement:
- Tracks entities via `EntityAnimState` map
- Lerps positions for smooth movement
- Handles 3D model upgrades when assets load
- **Handles React Strict Mode remounting** (see below)

### modelLoader.ts
Async model loading with caching:
- `modelCache` - Map of loaded GLTFGroup objects
- `loadEntityModel()` - Load single model
- `preloadBattleModels()` - Preload all enemy models

### cameraController.ts
Camera positioning and animation:
- Overview phases: zoom_out → pan_enemies → pan_player → settle → complete
- First-person view with mouse look (yaw/pitch)
- Camera shake support

### effectsSystem.ts
Visual effects:
- Floating damage numbers with canvas pooling
- Hit particles (point cloud)
- Camera shake
- Attack telegraphs (ground indicators)

## React Strict Mode Compatibility

**Problem:** React Strict Mode double-mounts components in development. The Three.js scene is disposed during cleanup, but `entityAnimRef` (a React ref) persists across mounts. This causes stale references where the animMap thinks entities exist but they're no longer in the scene.

**Solution:** In `entityUpdater.ts`, we check if sprites are still in the group before reusing them:

```typescript
const existing = animMap.get(entityId);
const isStillInGroup = existing && group.children.includes(existing.sprite);

if (existing && isStillInGroup) {
  // Safe to update existing entity
} else {
  // Stale reference or new entity - recreate
  if (existing && !isStillInGroup) {
    animMap.delete(entityId);  // Clean up stale entry
  }
  // Create new entity...
}
```

This pattern ensures entities are properly recreated after React Strict Mode remounts.

## Usage

```tsx
import { BattleRenderer3D } from '../components/BattleRenderer3D';

<BattleRenderer3D
  battle={battleState}
  onOverviewComplete={() => setReady(true)}
  selectedAction={selectedAction}
  onTileClick={(tile, hasEnemy) => handleTileClick(tile, hasEnemy)}
  onTileHover={(tile) => setHoveredTile(tile)}
  events={gameEvents}
/>
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `battle` | `BattleState` | Current battle state from server |
| `onOverviewComplete` | `() => void` | Called when overview animation finishes |
| `selectedAction` | `string \| null` | Currently selected action for highlights |
| `onTileClick` | `(tile, hasEnemy) => void` | Tile click handler |
| `onTileHover` | `(tile) => void` | Tile hover handler |
| `events` | `GameEvent[]` | Events to process (damage, turns, etc.) |

## Constants

Key configuration in `constants.ts`:

| Constant | Value | Description |
|----------|-------|-------------|
| `TILE_SIZE` | 2 | World units per arena tile |
| `WALL_HEIGHT` | 3 | Height of arena walls |
| `CAMERA_HEIGHT` | 1.6 | First-person camera height |
| `ENTITY_MODEL_SCALE` | 1.4 | Scale for 3D models |
| `ENTITY_MODEL_Y_OFFSET` | 0.3 | Y offset for 3D models |

## Event Types Handled

- `DAMAGE_NUMBER` - Show floating damage text
- `HIT_FLASH` - Camera shake + hit particles
- `ENEMY_ATTACK` - Show attack telegraph
- `ENEMY_TURN_START/END` - Turn-based combat flow
- `PLAYER_TURN_START/END` - Turn-based combat flow
