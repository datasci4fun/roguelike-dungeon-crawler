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
- existing models and their versions
- enemy models mapped to bestiary names

### Step 2a: Fetch enemy data (REQUIRED for enemy models)

**For enemy/boss models, you MUST fetch canonical data from the bestiary API:**

```bash
node .claude/skills/model-generator/tools/fetch_enemy.mjs --enemy-id <bestiary_id>
```

Examples:
```bash
node .claude/skills/model-generator/tools/fetch_enemy.mjs --enemy-id wraith
node .claude/skills/model-generator/tools/fetch_enemy.mjs --enemy-id goblin_king
node .claude/skills/model-generator/tools/fetch_enemy.mjs --enemy-id spider_queen
```

To see all available enemies:
```bash
node .claude/skills/model-generator/tools/fetch_enemy.mjs --list
```

This produces `.claude/skills/model-generator/out/enemy_data.json` with:
- `name` - Display name (use for `enemyName` field)
- `appearance` - **CANONICAL visual description - USE THIS for the 3D model**
- `behavior` - Animation/pose hints
- `abilities` - For effects and visual details
- `weaknesses`/`resistances` - Color/material hints

**IMPORTANT**: The `appearance` field is the authoritative description. Do NOT invent visual details - interpret this description into Three.js geometry.

### Step 2b: Fetch player data (REQUIRED for player models)

**For player character models, you MUST fetch canonical data from the character guide API:**

```bash
node .claude/skills/model-generator/tools/fetch_player.mjs --race <race_id> --class <class_id>
```

Examples:
```bash
node .claude/skills/model-generator/tools/fetch_player.mjs --race DWARF --class CLERIC
node .claude/skills/model-generator/tools/fetch_player.mjs --race ELF --class MAGE
node .claude/skills/model-generator/tools/fetch_player.mjs --race ORC --class WARRIOR
node .claude/skills/model-generator/tools/fetch_player.mjs --race HUMAN --class ROGUE
node .claude/skills/model-generator/tools/fetch_player.mjs --race HALFLING --class WARRIOR
```

To see all available races and classes:
```bash
node .claude/skills/model-generator/tools/fetch_player.mjs --list
node .claude/skills/model-generator/tools/fetch_player.mjs --list-races
node .claude/skills/model-generator/tools/fetch_player.mjs --list-classes
```

This produces `.claude/skills/model-generator/out/player_data.json` with:

**Race data:**
- `race.appearance` - **CANONICAL body description - USE THIS for body shape/proportions**
- `race.base_height` - Scale multiplier (1.0 = human, 0.6 = halfling, 1.2 = orc)
- `race.skin_color` - Skin tone (e.g., "tan", "pale green", "earthy brown")
- `race.eye_color` - Eye color for glow/detail
- `race.racial_trait` - Special trait that may have visual effects

**Class data:**
- `class.equipment_type` - Weapon/armor style (sword_shield, staff, daggers, mace_shield)
- `class.starting_equipment` - Specific equipment names
- `class.primary_color` - Main armor/clothing color (hex)
- `class.secondary_color` - Accent color (hex)
- `class.glow_color` - Magic/effect glow color (hex)
- `class.abilities` - Skills that may inform pose or effects
- `class.playstyle` - Stance/pose hints

**IMPORTANT**: Use `race.appearance` for body shape and `class.primary_color`/`class.secondary_color` for clothing. The model ID should be `player-{race}-{class}` in lowercase.

### Step 3: Generate model file (creative)
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
- For enemies, include `enemyName` field matching the bestiary `name` exactly

**For Enemy Models - Interpreting Bestiary Data:**

Read the `enemy_data.json` output and translate the canonical `appearance` field:

| Appearance Text | Three.js Interpretation |
|-----------------|------------------------|
| "Small green-skinned humanoid" | Scale down, use green material |
| "Translucent ghostly figure" | Use transparent/emissive material |
| "Towering humanoid of ice" | Scale up, use crystal/ice materials |
| "Robed figure with glowing eyes" | Cone/cylinder robe, emissive eye spheres |
| "Massive spider with iridescent carapace" | Large scale, metallic sheen material |

Use `weaknesses`/`resistances` for color hints:
- Fire weakness → ice-blue colors
- Ice weakness → warm/red colors
- Fire resistance → red/orange accents
- Dark element → purple/black tones

Use `threat_level` for visual intensity:
- Level 1-2: Simple geometry, muted colors
- Level 3-4: More detail, glowing elements
- Level 5: Complex, dramatic, emissive effects

**For Player Models - Interpreting Character Guide Data:**

Read the `player_data.json` output and translate race + class data:

| Race | Key Visual Traits |
|------|-------------------|
| HUMAN | base_height: 1.0, balanced proportions, tan/varied skin |
| ELF | base_height: 1.1, slender/tall, pointed ears, pale skin |
| DWARF | base_height: 0.7, stocky/broad, thick limbs, braided beard |
| HALFLING | base_height: 0.6, small/nimble, large feet, cheerful |
| ORC | base_height: 1.2, muscular/hulking, tusks, green skin |

| Class | Equipment & Colors |
|-------|-------------------|
| WARRIOR | Sword + Shield, red/silver armor, sturdy stance |
| MAGE | Staff, purple/blue robes, magical glow effects |
| ROGUE | Twin daggers, dark leather, hooded, stealthy pose |
| CLERIC | Mace + Shield, white/gold robes, holy glow |

**Combining Race + Class:**
1. Use `race.appearance` for body proportions and skin
2. Use `race.base_height` for scale multiplier
3. Use `class.primary_color` for main armor/clothing color
4. Use `class.secondary_color` for trim/accents
5. Use `class.glow_color` for magical effects
6. Use `class.equipment_type` to determine weapon/armor style
7. Reference `class.playstyle` for stance/pose hints

**Example - Dwarf Cleric:**
- Body: Stocky, broad-shouldered (race.appearance)
- Scale: 0.7x human height (race.base_height)
- Skin: Earthy brown (race.skin_color)
- Armor: White/gold robes with mace and shield (class colors + equipment)
- Effect: Subtle holy glow (class.glow_color)

### Step 4: Deterministic registration + validation
Run the driver:
```bash
bash .claude/skills/model-generator/run.sh \
  --model-id <id> \
  --model-file <path> \
  --factory <createFn> \
  --meta <META_NAME> \
  [--category <cat>] \
  [--enemy-name <name>] \
  [--create-expr "<expr>"] \
  [--version <num>] \
  [--is-active true|false] \
  [--base-model-id <id>] \
  [--auto-version]
```

This will:
- register imports/exports/MODEL_LIBRARY entry into `web/src/models/index.ts`
- run `cd web && npx tsc --noEmit`
- write:
  - `.claude/skills/model-generator/out/result.json`
  - `.claude/skills/model-generator/out/log.txt`

### Step 5: Output to user
Only report:
- files created/changed
- model id/name/category
- preview instructions

Do NOT dump logs. If errors exist, summarize from `out/result.json`.

---

## Model Versioning

The model-generator supports multiple versions of the same model. This allows iterating on designs while preserving old versions for comparison in the Asset Viewer.

### Version Fields

Models can have these optional fields in their META export:
- `version: number` - Version number (1, 2, 3, etc.) - defaults to 1
- `isActive: boolean` - Whether this version is used in-game - defaults to true
- `baseModelId: string` - Groups versions together (e.g., "goblin" for goblin-v1, goblin-v2)

### Creating a New Model (v1)

For brand new models, no version args are needed - they default to v1, active:
```bash
bash .claude/skills/model-generator/run.sh \
  --model-id goblin \
  --model-file web/src/models/goblin.ts \
  --factory createGoblin \
  --meta GOBLIN_META
```

### Creating a New Version (v2+)

**Option A: Auto-version (recommended)**

Use `--auto-version` to automatically detect existing versions and increment:
```bash
bash .claude/skills/model-generator/run.sh \
  --model-id goblin-v2 \
  --model-file web/src/models/goblinV2.ts \
  --factory createGoblinV2 \
  --meta GOBLIN_V2_META \
  --base-model-id goblin \
  --auto-version
```

This will:
1. Detect that "goblin" exists at v1
2. Set the new model to v2, active=true
3. Mark the old goblin v1 as inactive

**Option B: Manual version**

Explicitly set version fields:
```bash
bash .claude/skills/model-generator/run.sh \
  --model-id goblin-v2 \
  --model-file web/src/models/goblinV2.ts \
  --factory createGoblinV2 \
  --meta GOBLIN_V2_META \
  --version 2 \
  --is-active true \
  --base-model-id goblin
```

### Repo Context

Run `analyze_repo.mjs` to see existing models and their versions:
```bash
node .claude/skills/model-generator/tools/analyze_repo.mjs
cat .claude/skills/model-generator/out/repo_context.json
```

The output includes:
- `existingModels`: List of all models with version info
- `versionInfo`: Models grouped by baseModelId with highest version

### Asset Viewer Integration

The Asset Viewer automatically shows:
- Version badges (v1, v2, etc.) when multiple versions exist
- Active/Archived status badges
- Version selector dropdown to switch between versions

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
| `player` | Player character models | Human Warrior, Elf Mage, Dwarf Cleric |

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
