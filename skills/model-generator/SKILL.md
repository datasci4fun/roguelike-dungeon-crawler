---
name: model-generator
description: Generate procedural Three.js 3D models through natural language. Creates models for the game's level editor and 3D renderer.
---

## Purpose

This Skill creates procedural 3D models using Three.js geometry primitives. Models are generated as TypeScript code that can be:
- Previewed in the Model Viewer dev page
- Saved to the model library
- Placed in the Level Editor
- Used as set pieces in the game

Examples of trigger phrases:
- "Create a 3D model of a wooden barrel"
- "Generate a model for a torch sconce"
- "Make a stone altar model"
- "/model-generator Create a treasure chest"

---

## Preconditions

Before running this Skill:

1. Confirm the working directory is the roguelike project root.
2. Ensure the model library exists at `web/src/models/`.
3. Verify the frontend dev server is running.

---

## Procedure

### Step 1: Understand the Request

Parse the user's request for:
- **Primary shape**: door, barrel, table, statue, etc.
- **Materials**: wood, stone, metal, fabric, etc.
- **Size/scale**: relative dimensions
- **Detail level**: simple (<500 tris), medium (<1500 tris), detailed (<3000 tris)

Ask clarifying questions if:
- The request is ambiguous
- Multiple valid interpretations exist
- Material or scale preferences are unclear

### Step 2: Design the Geometry

Plan the model structure:
1. List component parts
2. Choose Three.js primitives for each part
3. Define material properties
4. Calculate relative positions

**⚠️ CRITICAL: Simplicity First**

Keep models simple and use box-based geometry whenever possible:
- **Target: ~100 lines of code** for simple props, ~150 for medium complexity
- **Prefer BoxGeometry** for all rectangular/cubic shapes (chests, furniture, architectural elements)
- **Avoid complex rotations** on cylinders - they cause alignment issues
- **No ExtrudeGeometry or LatheGeometry** - too complex and error-prone

**Available Primitives (in order of preference):**
| Primitive | Use Cases | Notes |
|-----------|-----------|-------|
| `BoxGeometry` | **Use for most things** - crates, walls, planks, chests, furniture | Easiest to position and align |
| `CylinderGeometry` | Columns, candles, legs | Avoid rotation.x/z - causes alignment issues |
| `SphereGeometry` | Orbs, heads, decorations | Use sparingly |
| `TorusGeometry` | Rings, handles | Simple use only - no complex positioning |
| `ConeGeometry` | Spikes, roofs, flames | Keep upright (no rotation) |
| `PlaneGeometry` | Signs, paintings, rugs | Flat surfaces only |

### Step 3: Generate the Model Code

Create a new file at `web/src/models/[modelName].ts`:

```typescript
/**
 * [Model Name] Model
 * [Brief description of what this model represents]
 */

import * as THREE from 'three';
import { createMaterial } from './materials';

export interface [ModelName]Options {
  scale?: number;
  rotation?: number;
  // Add model-specific options
}

export function create[ModelName](options: [ModelName]Options = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();

  // Materials
  const primaryMaterial = createMaterial('wood'); // or custom

  // Geometry components
  const bodyGeometry = new THREE.CylinderGeometry(
    0.4 * scale,   // radiusTop
    0.35 * scale,  // radiusBottom
    0.8 * scale,   // height
    16             // radialSegments
  );
  const body = new THREE.Mesh(bodyGeometry, primaryMaterial);
  body.position.y = 0.4 * scale;
  group.add(body);

  // ... more components

  return group;
}

export const [MODEL_NAME]_META = {
  id: '[model_id]',
  name: '[Display Name]',
  category: 'furniture' as const,  // structure | furniture | decoration | interactive | prop
  description: '[Description]',
  defaultScale: 1.0,
  boundingBox: { x: 0.8, y: 0.8, z: 0.8 },
  tags: ['tag1', 'tag2'],
};
```

### Step 4: Register in Model Library

Update `web/src/models/index.ts` to include the new model:

1. Import the model factory and metadata
2. Add to MODEL_LIBRARY array
3. Re-export for external use

### Step 5: Preview & Iterate

After generating the model:
1. Verify TypeScript compilation: `cd web && npx tsc --noEmit`
2. Direct user to **Asset Viewer** at `/asset-viewer` → **Procedural tab**
3. Select the new model from the list to see the 3D preview with auto-rotation
4. Accept feedback for refinements
5. Alternatively, preview in Level Editor at `/level-editor`

---

## Material Presets

Use materials from `web/src/models/materials.ts`:

```typescript
// Wood materials
'wood'        // color: 0x8b4513, roughness: 0.8
'darkWood'    // color: 0x2a1a0a, roughness: 0.8
'lightWood'   // color: 0xdeb887, roughness: 0.75
'oldWood'     // color: 0x4a3520, roughness: 0.9

// Stone materials
'stone'       // color: 0x808080, roughness: 0.9
'darkStone'   // color: 0x404040, roughness: 0.85
'granite'     // color: 0x666666, roughness: 0.7
'marble'      // color: 0xf0f0f0, roughness: 0.3

// Metal materials
'iron'        // color: 0x3a3a3a, metalness: 0.8
'steel'       // color: 0x888888, metalness: 0.8
'bronze'      // color: 0xcd7f32, metalness: 0.7
'gold'        // color: 0xffd700, metalness: 0.9

// Fabric materials
'cloth'       // color: 0x8b0000, roughness: 0.95
'leather'     // color: 0x654321, roughness: 0.8

// Special materials
'crystal'     // color: 0x87ceeb, roughness: 0.1
'bone'        // color: 0xf5f5dc, roughness: 0.7
'lava'        // color: 0xff4500, emissive
```

---

## Performance Guidelines

| Model Type | Max Triangles | Example Uses |
|------------|---------------|--------------|
| Simple | < 500 | Barrels, crates, small props |
| Medium | < 1500 | Furniture, statues |
| Detailed | < 3000 | Thrones, doors, complex pieces |

Tips:
- Use fewer radial segments for cylinders/spheres (8-16 is often enough)
- Share materials between similar parts
- Avoid excessive detail for parts that won't be seen closely
- Keep bounding boxes accurate for collision

---

## Model Categories

| Category | Description | Examples |
|----------|-------------|----------|
| `structure` | Architectural elements | Doors, pillars, archways |
| `furniture` | Functional objects | Thrones, tables, chairs |
| `decoration` | Visual props | Statues, paintings, plants |
| `interactive` | Objects with behavior | Switches, levers, chests |
| `prop` | Generic props | Barrels, crates, books |

---

## Example: Creating a Treasure Chest

User: "Create a treasure chest"

1. **Design Plan:**
   - Base: Box for the main body
   - Lid: Box (positioned on top, optionally tilted when open)
   - Details: Boxes for bands, corners, and lock plate
   - Materials: darkWood for body, bronze for bands, gold for lock

2. **Generated Code (~100 lines, all BoxGeometry):**

```typescript
/**
 * Treasure Chest Model
 * A simple wooden treasure chest with metal bands and gold lock
 */

import * as THREE from 'three';
import { createMaterial } from './materials';

export interface TreasureChestOptions {
  scale?: number;
  open?: boolean;
}

export function createTreasureChest(options: TreasureChestOptions = {}): THREE.Group {
  const { scale = 1.0, open = false } = options;

  const group = new THREE.Group();

  // Materials
  const woodMaterial = createMaterial('darkWood');
  const bronzeMaterial = createMaterial('bronze');
  const goldMaterial = createMaterial('gold');
  const ironMaterial = createMaterial('iron');

  // Dimensions
  const w = 0.8 * scale;  // width (X)
  const d = 0.5 * scale;  // depth (Z)
  const h = 0.35 * scale; // base height (Y)
  const lidH = 0.15 * scale; // lid height

  // === BASE BOX ===
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    woodMaterial
  );
  base.position.y = h / 2;
  group.add(base);

  // === LID (simple box) ===
  const lid = new THREE.Mesh(
    new THREE.BoxGeometry(w, lidH, d),
    woodMaterial
  );
  if (open) {
    lid.position.set(0, h + lidH / 2 + 0.1 * scale, -d / 2 + 0.05 * scale);
    lid.rotation.x = -Math.PI / 3;
  } else {
    lid.position.y = h + lidH / 2;
  }
  group.add(lid);

  // === HORIZONTAL BANDS (bronze boxes) ===
  const bandH = 0.04 * scale;
  const bandT = 0.02 * scale;

  const frontBand = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.01, bandH, bandT),
    bronzeMaterial
  );
  frontBand.position.set(0, h * 0.4, d / 2);
  group.add(frontBand);

  const backBand = frontBand.clone();
  backBand.position.z = -d / 2;
  group.add(backBand);

  // === CORNER BRACKETS (iron boxes) ===
  const bracketSize = 0.05 * scale;
  const bracketGeo = new THREE.BoxGeometry(bracketSize, bracketSize, bracketSize);

  const corners = [
    [-w/2, 0, d/2], [w/2, 0, d/2],
    [-w/2, 0, -d/2], [w/2, 0, -d/2]
  ];
  corners.forEach(([x, y, z]) => {
    const bracket = new THREE.Mesh(bracketGeo, ironMaterial);
    bracket.position.set(x, y + bracketSize/2, z);
    group.add(bracket);
  });

  // === LOCK PLATE (gold box) ===
  const lockPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.1 * scale, 0.08 * scale, 0.015 * scale),
    goldMaterial
  );
  lockPlate.position.set(0, h * 0.7, d / 2 + 0.008 * scale);
  group.add(lockPlate);

  return group;
}

export const TREASURE_CHEST_META = {
  id: 'treasure_chest',
  name: 'Treasure Chest',
  category: 'interactive' as const,
  description: 'A wooden treasure chest with bronze bands and gold lock',
  defaultScale: 1.0,
  boundingBox: { x: 0.8, y: 0.5, z: 0.5 },
  tags: ['chest', 'treasure', 'container', 'loot', 'interactive', 'wood', 'gold'],
};
```

**Why this works well:**
- Uses only BoxGeometry (easy to position, no alignment issues)
- ~100 lines of code
- Clear dimensions defined upfront
- Simple Y-positioning (height / 2)
- Minimal rotation (only lid when open, single axis)

---

## Output

After generating a model:

1. Report the file created
2. Show the model metadata
3. Verify TypeScript compiles
4. Provide instructions to preview:
   > Model created! To preview:
   > 1. Navigate to http://localhost:5173/asset-viewer
   > 2. Click the **Procedural** tab
   > 3. Select your new model from the list
   > 4. View the 3D preview with auto-rotation
   > 5. Click fullscreen icon for larger view

---

## Iteration

If the user requests changes:
- "Make it taller" → Adjust height parameters
- "Add a handle" → Add new geometry component
- "Change color" → Update material color
- "Make it metal" → Switch material preset

Always update the model file and re-verify compilation.

---

## Common Pitfalls to Avoid

**❌ DON'T do these:**

1. **Don't use CylinderGeometry for curved surfaces that need rotation**
   ```typescript
   // BAD: Half-cylinder lid with rotation causes alignment nightmares
   const lid = new THREE.CylinderGeometry(0.4, 0.4, 0.8, 16, 1, false, 0, Math.PI);
   lid.rotation.z = Math.PI / 2;  // Now nothing aligns
   ```

2. **Don't use ExtrudeGeometry or complex shapes**
   ```typescript
   // BAD: Shape paths are error-prone and hard to debug
   const shape = new THREE.Shape();
   shape.moveTo(0, 0);
   shape.lineTo(0.5, 0);
   // ... 20 more lines of path coordinates that don't work
   ```

3. **Don't create overly complex "bulge" effects**
   ```typescript
   // BAD: Multiple overlapping cylinders for barrel bulge
   const bulge = new THREE.CylinderGeometry(0.38, 0.38, 0.4, 12);
   // Just use a box or simple cylinder
   ```

4. **Don't exceed ~150 lines for simple models**
   - If your model needs more code, it's probably too complex
   - Simplify the design instead of adding complexity

**✅ DO these instead:**

1. **Use boxes for rectangular shapes** (chests, crates, furniture)
2. **Keep rotations to a single axis** when needed
3. **Define dimensions as variables** at the top for easy adjustment
4. **Position with simple formulas** like `height / 2` for Y centering

---

## Safety Rules

- Only create files in `web/src/models/`
- Always include proper TypeScript types
- Follow existing naming conventions
- Don't modify core game files
- Keep triangle counts reasonable

---

## Quick Reference

**Create material:**
```typescript
import { createMaterial } from './materials';
const mat = createMaterial('stone');
```

**Common geometries:**
```typescript
new THREE.BoxGeometry(width, height, depth);
new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments);
new THREE.SphereGeometry(radius, widthSegs, heightSegs);
new THREE.TorusGeometry(radius, tube, radialSegs, tubularSegs);
```

**Position/rotate:**
```typescript
mesh.position.set(x, y, z);
mesh.rotation.set(rx, ry, rz);  // radians
mesh.scale.setScalar(s);
```
