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

**Available Primitives:**
| Primitive | Use Cases |
|-----------|-----------|
| `BoxGeometry` | Crates, walls, planks, books |
| `CylinderGeometry` | Columns, barrels, candles, legs |
| `SphereGeometry` | Orbs, heads, decorations |
| `TorusGeometry` | Rings, handles, frames |
| `ConeGeometry` | Spikes, roofs, flames |
| `PlaneGeometry` | Signs, paintings, rugs |

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
2. Direct user to Level Editor at `/level-editor`
3. They can click a tile and see the 3D preview
4. Accept feedback for refinements

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

## Example: Creating a Wooden Barrel

User: "Create a wooden barrel with iron bands"

1. **Design Plan:**
   - Body: Cylinder (slightly wider in middle)
   - Bands: 3 thin torus shapes
   - Material: darkWood for body, iron for bands

2. **Generated Code:**

```typescript
import * as THREE from 'three';
import { createMaterial } from './materials';

export interface BarrelOptions {
  scale?: number;
  rotation?: number;
}

export function createBarrel(options: BarrelOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();

  // Wood body (wider in middle for barrel shape)
  const woodMaterial = createMaterial('darkWood');
  const bodyGeometry = new THREE.CylinderGeometry(
    0.35 * scale,  // top radius
    0.35 * scale,  // bottom radius
    0.9 * scale,   // height
    12             // segments
  );
  const body = new THREE.Mesh(bodyGeometry, woodMaterial);
  body.position.y = 0.45 * scale;
  group.add(body);

  // Bulge in middle
  const bulgeGeometry = new THREE.CylinderGeometry(
    0.38 * scale,
    0.38 * scale,
    0.4 * scale,
    12
  );
  const bulge = new THREE.Mesh(bulgeGeometry, woodMaterial);
  bulge.position.y = 0.45 * scale;
  group.add(bulge);

  // Iron bands
  const ironMaterial = createMaterial('iron');
  const bandGeometry = new THREE.TorusGeometry(0.36 * scale, 0.02 * scale, 6, 16);

  const bandPositions = [0.15, 0.45, 0.75];
  for (const yPos of bandPositions) {
    const band = new THREE.Mesh(bandGeometry, ironMaterial);
    band.position.y = yPos * scale;
    band.rotation.x = Math.PI / 2;
    group.add(band);
  }

  return group;
}

export const BARREL_META = {
  id: 'barrel',
  name: 'Wooden Barrel',
  category: 'prop' as const,
  description: 'A wooden barrel with iron bands',
  defaultScale: 1.0,
  boundingBox: { x: 0.76, y: 0.9, z: 0.76 },
  tags: ['barrel', 'wood', 'container', 'prop'],
};
```

---

## Output

After generating a model:

1. Report the file created
2. Show the model metadata
3. Verify TypeScript compiles
4. Provide instructions to preview:
   > Model created! To preview:
   > 1. Navigate to http://localhost:5173/level-editor
   > 2. Generate a dungeon
   > 3. Select a floor tile
   > 4. The 3D preview will show the area

---

## Iteration

If the user requests changes:
- "Make it taller" → Adjust height parameters
- "Add a handle" → Add new geometry component
- "Change color" → Update material color
- "Make it metal" → Switch material preset

Always update the model file and re-verify compilation.

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
