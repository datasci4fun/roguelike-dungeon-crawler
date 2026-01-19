---
name: model-generator
description: Generate procedural Three.js 3D models via TypeScript, then deterministically register them in web/src/models/index.ts and validate compilation using bundled tools. Minimizes token use by offloading diagnostics to scripts.
---

## Purpose

This Skill generates procedural 3D models using Three.js primitives as TypeScript code.

The Skill is **tool-first**:
- Claude should generate the model file content (creative part).
- All mechanical steps (registration, validation, diagnostics) are done by bundled deterministic scripts.

## Preconditions

1. Confirm working directory is the project root (git root).
2. Ensure model library exists at `web/src/models/`.
3. Ensure `web/src/models/index.ts` contains model-generator marker blocks (see below).
4. Node + npm available; TypeScript dependency is local to this skill.

## Marker Block Requirement (one-time repo edit)

`web/src/models/index.ts` must contain these marker blocks so registration is deterministic:
- `// @model-generator:imports:start` ... `// @model-generator:imports:end`
- `// @model-generator:exports:start` ... `// @model-generator:exports:end`
- `// @model-generator:library:start` ... `// @model-generator:library:end`

The registration script will only edit content between markers and will preserve the rest of the file.

## Procedure (tool-first)

### Step 1: Repo context scan (deterministic)
Run:
```bash
node .claude/skills/model-generator/tools/analyze_repo.mjs
```

This produces `.claude/skills/model-generator/out/repo_context.json` with:
- available material preset names
- categories

### Step 2: Generate model file (creative)
Create a new file at:
- `web/src/models/<modelFileStem>.ts`

Use:
- `.claude/skills/model-generator/templates/model.ts.tpl` as the skeleton
- `createMaterial(presetName)` where possible
- Keep triangle budgets reasonable by limiting segment counts

**Design Guidelines (from lessons learned):**
- Prefer `BoxGeometry` for body parts - more stable than complex primitives
- Avoid `ConeGeometry` rotations when possible - use boxes/cylinders instead
- Keep models simple - 100-300 lines is typical
- Use material presets from `materials.ts` when possible
- For enemies, include `enemyName` field matching the battle state name

### Step 3: Deterministic registration + validation
Run the driver:
```bash
bash .claude/skills/model-generator/run.sh \
  --model-id <id> \
  --model-file <path> \
  --factory <createFn> \
  --meta <META_NAME> \
  [--category <cat>] \
  [--enemy-name <name>] \
  [--create-expr "<expr>"]
```

This will:
- register imports/exports/MODEL_LIBRARY entry into `web/src/models/index.ts`
- run `cd web && npx tsc --noEmit`
- write:
  - `.claude/skills/model-generator/out/result.json`
  - `.claude/skills/model-generator/out/log.txt`

### Step 4: Output to user
Only report:
- files created/changed
- model id/name/category
- preview instructions

Do NOT dump logs. If errors exist, summarize from `out/result.json`.

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

## Model Categories

| Category | Description | Examples |
|----------|-------------|----------|
| `structure` | Architectural elements | Doors, pillars, archways |
| `furniture` | Functional objects | Thrones, tables, chairs |
| `decoration` | Visual props | Statues, paintings, plants |
| `interactive` | Objects with behavior | Switches, levers, chests |
| `prop` | Generic props | Barrels, crates, books |
| `enemy` | Enemy/boss models | Goblin, Skeleton, Spider Queen |

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

## Safety Rules

- Only create new model files under `web/src/models/`
- Only modify `web/src/models/index.ts` via marker blocks
- Never modify unrelated core game files
- Keep code deterministic and consistent with existing style

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
