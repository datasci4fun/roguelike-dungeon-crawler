# Floor 1 — Stone Dungeon (MEMORY)

**Aspect:** MEMORY (what was locked away)
**Monarchy Anchor:** Keys (authority defined by who holds access)
**Warden:** Goblin King

---

## Zone: `cell_blocks` — Cell Blocks
**Status:** `[ ]`

**Purpose:**
- Primary Floor 1 identity: confinement, labels, processed people.
- Teaches “authority-as-memory”: the prison decides who you are by where it places you.

**Generation**
- **Eligibility:**
  - min_w=10, min_h=8
  - allowed_room_types=[NORMAL, LARGE_HALL]
  - max_per_level=3–5
- **Selection rule:** weighted choice (highest on floor). Prefer rooms not equal to start room. Prefer rooms with 1–2 entrances.
- **Layout pass:**
  - [ ] Interior walls: partition into 2×3 “cells” along side walls with a central corridor.
  - [ ] Doors / bars: use `DOOR_LOCKED (+)` for ~30% of cell doors, `DOOR_UNLOCKED (/)` otherwise.
  - [ ] Special tiles: optional `BREAKABLE_WALL (░)` for one “weakened cell wall” (future secret).
  - [ ] Connectivity: central corridor must connect every room entrance; never lock the only path.

**Visual / Atmosphere**
- **Decorations (current system):** use Stone theme props (`Θ` pillars, `♪` braziers) sparingly so partitions remain readable.
- **Optional custom props (if allowed by renderer):** `⛓` chains, `🪣` bucket, `✎` tally marks.
- **Environmental Evidence (choose 1–2):**
  - Duplicate plaque: same cell number, two prisoner names
  - Day-scratch tallies that don’t match carved dates
  - A key hook with two identical keys (replacement tell)
- **Lighting notes:** dimmer than corridors; one brazier (`♪`) per cell block room.
- **3D overrides:** has_ceiling=true, skybox_override=None

**Spawns**
- **Enemies:** goblins x1.5, skeletons x1.0, orcs x0.5
- **Items:** slight bias toward early survivability (consumables).
  *(If/when key items exist: bias keys here x1.3.)*
- **Lore drops:**
  - **Delver pool:** [`stone_tattered_journal`]
  - **Surface/Authority pool:** [`stone_carved_warning`, `prison_transfer_order`]
  - Spawn rule: 25–35% chance per room in this zone, max 1 lore per room.

**Acceptance Criteria**
- [ ] Deterministic with seed
- [ ] Partitions never block entrances/exits
- [ ] Cells are visually obvious at a glance
- [ ] At least one safe path always exists even with locked cell doors
- [ ] Spawn bias is noticeable (more goblins than other zones)

**Test Seeds:** 11001, 11002, 11003

---

## Zone: `guard_corridors` — Guard Corridors (Corridor-Like Rooms)
**Status:** `[ ]`

**Purpose:**
- Long sightlines and patrol feel; “you are being watched.”
- A seam-like zone that connects other pockets and creates exposure.

**Generation**
- **Eligibility:** elongated rooms:
  - min_w=3, min_h=10 OR min_w=10, min_h=3
  - allowed_room_types=[NORMAL]
  - max_per_level=2–4
- **Selection rule:** prefer rooms that connect multiple corridors/regions (proxy: rooms with 2+ corridor connections).
- **Layout pass:**
  - [ ] Alcoves: carve 1–2 small 2×2 recesses along sides (pure floor shaping).
  - [ ] No interior wall partitions by default (keep readable).
  - [ ] Connectivity: must keep entrances clear and line-of-sight long.

**Visual / Atmosphere**
- **Decorations:** sparse. Use occasional `Θ` pillar at alcove edges and `♪` brazier every ~6–8 tiles if long enough.
- **Environmental Evidence (choose 1):**
  - Two identical keys placed in separate alcoves
  - Patrol tally marks that restart mid-line
  - A plaque that reads “GUARD POST” and “PRISONER HALL” in equal weathering
- **Lighting notes:** brighter than cell blocks (patrol routes are lit).
- **3D overrides:** has_ceiling=true

**Spawns**
- **Enemies:** skeletons x1.4 (guard echoes), goblins x1.0
- **Items:** slight bias toward weapons/armor (guards leave gear).
- **Lore drops:**
  - **Delver pool:** [`delver_warning_prison_is_for_you`]
  - **Surface/Authority pool:** [`prison_transfer_order`]
  - Spawn rule: 15–25% chance, max 1 lore in this zone.

**Acceptance Criteria**
- [ ] Long exposed sightline feel is preserved
- [ ] Alcoves do not block movement
- [ ] Does not become cluttered

**Test Seeds:** 11011, 11012

---

## Zone: `wardens_office` — Warden’s Office (Anchor)
**Status:** `[ ]`

**Purpose:**
- Seat of prison authority—paperwork, keys, the “official truth.”
- Anchor room that introduces the monarchy rewrite theme early.

**Generation**
- **Eligibility:**
  - min_w=6, min_h=6, max_per_level=1
  - allowed_room_types=[NORMAL]
- **Selection rule:** choose a mid-map room (center-ish), not start room, not boss cluster.
- **Layout pass:**
  - [ ] Desk block: reserve a 2×3 “desk” footprint by leaving floor but placing dense decorations.
  - [ ] Shelf rows: 1-tile wide shelf strips along walls (decorations or interior wall stubs if supported).
  - [ ] Key rack corner: small prop cluster.
  - [ ] Connectivity: single entrance preferred but not required; never block.

**Visual / Atmosphere**
- **Decorations:** higher density of `Θ`/`♪` plus “paperwork” props if supported.
- **Environmental Evidence:**
  - A registry page where one line is blank (surname missing)
  - A seal stamp that looks correct until you stare at it
- **Lighting notes:** one central light source (feels “official”).
- **3D overrides:** has_ceiling=true

**Spawns**
- **Enemies:** low-to-normal density (not zero).
- **Items:** guarantee 1 lore drop here; slight bias toward utility.
- **Lore drops:**
  - **Delver pool:** [`stone_tattered_journal`]
  - **Surface/Authority pool:** [`prison_transfer_order`, `stone_duplicate_inscription`]
  - Spawn rule: 100% for 1 lore here.

**Acceptance Criteria**
- [ ] Exactly one per level
- [ ] Reads immediately as “office/records”
- [ ] Lore always spawns
- [ ] No accidental softlocks due to decoration density

**Test Seeds:** 11021, 11022

---

## Zone: `execution_chambers` — Execution Chambers
**Status:** `[ ]`

**Purpose:**
- Punishment remembered as architecture: drains, hooks, a place where meaning was taken.
- High tension set piece without requiring new tile types.

**Generation**
- **Eligibility:**
  - min_w=8, min_h=8
  - allowed_room_types=[NORMAL, LARGE_HALL]
  - max_per_level=1–2
- **Selection rule:** prefer rooms far from start (late exploration).
- **Layout pass:**
  - [ ] Central hazard: use `TRAP_VISIBLE (^)` as “pit trap” cluster (1–3 tiles).
    *(No new pit tile required.)*
  - [ ] Drain line: a short `DEEP_WATER (≈)` strip at one edge (optional).
  - [ ] Keep 1–2 clear routes around hazards.

**Visual / Atmosphere**
- **Decorations:** minimal; 1–2 braziers max, a couple pillars. Let hazard read.
- **Environmental Evidence:**
  - An “execution log” plaque where dates contradict
- **Lighting notes:** darker than average.
- **3D overrides:** has_ceiling=true

**Spawns**
- **Enemies:** wraiths bias x1.5 if present on this depth; otherwise skeletons x1.2
- **Items:** slight bias toward rare loot (risk/reward room).
- **Lore drops:**
  - **Delver pool:** [`delver_last_words_scratched`]
  - **Surface/Authority pool:** [`execution_log_plaque`]
  - Spawn rule: 30–45% chance, max 1 lore.

**Acceptance Criteria**
- [ ] Hazards are avoidable (no unavoidable damage)
- [ ] Atmosphere reads as “punishment chamber”
- [ ] Spawn bias feels different from cell blocks

**Test Seeds:** 11031, 11032

---

## Zone: `record_vaults` — Record Vaults
**Status:** `[ ]`

**Purpose:**
- Lore-dense zone: missing names, duplicate inscriptions, “official history” rot.
- Primary surface-document drop location for Floor 1.

**Generation**
- **Eligibility:**
  - min_w=6, min_h=6
  - allowed_room_types=[NORMAL]
  - max_per_level=1–3
- **Selection rule:** prefer rooms with fewer entrances (vault feel).
- **Layout pass:**
  - [ ] Shelf rows: 2–4 short shelf strips (decorations or interior wall stubs later).
  - [ ] Plaque walls: place 1–2 wall-adjacent evidence props.

**Visual / Atmosphere**
- **Decorations:** more “shelf-like” clustering; use `Θ`/`♪` sparingly to avoid clutter.
- **Environmental Evidence (guarantee 1):**
  - Duplicate plaque: same room name, two monarchs
  - Missing-name slots on registry boards
- **Lighting notes:** dim, dusty.
- **3D overrides:** has_ceiling=true

**Spawns**
- **Enemies:** skeletons x1.4 (record keepers), overall density x0.8
- **Items:** lore x2.0 (highest on floor).
- **Lore drops:**
  - **Delver pool:** [`stone_tattered_journal`]
  - **Surface/Authority pool:** [`stone_carved_warning`, `stone_duplicate_inscription`, `prison_transfer_order`]
  - Spawn rule: 50–70% chance, allow up to 2 lore drops across this zone per level.

**Acceptance Criteria**
- [ ] Lore presence noticeably higher here
- [ ] Shelving doesn’t create accidental dead ends
- [ ] Evidence prop appears reliably

**Test Seeds:** 11041, 11042

---

## Zone: `intake_hall` — Intake Hall (Start Room Anchor)
**Status:** `[ ]`

**Purpose:**
- “Orientation” room: the place the prison begins processing you.
- Serves as a tutorial-friendly staging area.

**Generation**
- **Eligibility:** max_per_level=1
- **Selection rule:** assign to the **start room** (the room containing player spawn on Floor 1).
- **Layout pass:**
  - [ ] Keep open and readable.
  - [ ] Optional “counter” area (decoration cluster) suggesting processing.

**Visual / Atmosphere**
- **Decorations:** slightly brighter; 1 brazier and 0–1 pillar.
- **Environmental Evidence:**
  - Intake form with your name… and another name crossed out (lore prop)
- **Lighting notes:** well lit.
- **3D overrides:** has_ceiling=true

**Spawns**
- **Enemies:** very low density; elite chance 0% here (safety start).
- **Items:** small guaranteed basics (existing item system).
- **Lore drops:**
  - **Delver pool:** [`stone_tattered_journal`] (low chance)
  - **Surface/Authority pool:** [`intake_form_crossed_name`]
  - Spawn rule: 25–40% chance for 1 lore here.

**Acceptance Criteria**
- [ ] Always the start room
- [ ] Low threat
- [ ] Readable layout (no clutter)

**Test Seeds:** any (always present)

---

## Zone: `boss_approach` — Boss Approach (Threshold Seams)
**Status:** `[ ]`

**Purpose:**
- Guarantees boss foreshadowing and escalation before Goblin King.
- Provides consistent “trail tells” even though corridors aren’t rooms.

**Generation**
- **Eligibility:** 1–3 rooms closest (by center distance) to the boss room center, excluding the boss room.
- **Selection rule:** compute distance from each room.center() to boss_room.center(); tag nearest N.
- **Layout pass:** keep walkable; avoid heavy hazards here.

**Visual / Atmosphere**
- **Decorations:** more braziers than average (flicker tension).
  *(No special glyphs required; keep to `♪`, `Θ`.)*
- **Environmental Evidence (choose 1):**
  - “The keys… he took all the keys.” (short carved line)
  - Crown made from seal wax (prop cluster)
- **Lighting notes:** unstable/flickery in feel (later via renderer); for now: denser braziers.

**Spawns**
- **Enemies:** goblins x2.0; elite chance remains default (20%) unless you later raise globally near boss.
- **Items:** pre-boss supplies bias (healing).
- **Lore drops:**
  - **Delver pool:** [`delver_warning_king_has_keys`]
  - **Surface/Authority pool:** [`boss_approach_warning_plaque`]
  - Spawn rule: guarantee 1 lore drop across boss_approach rooms per level.

**Boss Trail Integration**
- **Trail tells (pick 3):**
  - [ ] A “crown” made from seal wax + chain links (decoration cluster)
  - [ ] Braziers arranged in a crude sigil circle
  - [ ] Key ring decoration near the route (keys that open nothing)
- **Pre-boss reveal:** “The jailer forgot the prison. The prison remembered the jailer.”
- **Aftermath hook (future):** keys begin appearing more often after boss defeat (meta feel).

**Acceptance Criteria**
- [ ] Assigned reliably near boss room
- [ ] Trail tells appear consistently
- [ ] Does not block navigation

**Test Seeds:** 11051, 11052
