# Floor 7 — Volcanic Depths (TRANSFORMATION)

**Aspect:** TRANSFORMATION (what cannot remain)
**Monarchy Anchor:** Crown Jewels / Regalia Metals (recognition forged, then rewritten)
**Warden:** Flame Lord

---

## Zone: `forge_halls` — Forge Halls
**Status:** `[ ]`

**Purpose:**
- The “controlled transformation” rooms: where smithing once had intention.
- Establishes the floor’s language: heat, process, and tools that cannot stay stable.

**Generation**
- **Eligibility:**
  - min_w=7, min_h=7
  - allowed_room_types=[NORMAL, LARGE_HALL]
  - max_per_level=2–3
- **Selection rule:** weighted high. Prefer mid-map rooms with 2+ corridor connections.
- **Layout pass:**
  - Keep center usable.
  - Optional: small “work lanes” using short `WALL (#)` stubs (do not block entrances).
  - No hazard tiles required here—this is a “process” zone.

**Visual / Atmosphere**
- **Decorations (current system):** Volcanic theme props `∆` (rocks) and `≡` (vents) clustered like workstations and slag piles.
- **Optional custom props:** anvils, tool racks, forge braziers (later).
- **Environmental Evidence (choose 1):**
  - Tool racks with warped duplicates (two of the same hammer)
  - A crest plate melted until it is “almost” correct
- **Lighting notes:** brighter, warmer (more vents/“heat” props).
- **3D overrides:** has_ceiling=true, skybox_override=None

**Spawns**
- **Enemies:** fire-adjacent enemies bias x1.2 if available; otherwise normal.
- **Items:** slight bias toward equipment (forge rooms imply gear).
- **Lore drops:**
  - **Delver pool:** [`master_smith_final_record`]
  - **Surface/Authority pool:** [`regalia_requisition_order_wrong_king`]
  - Spawn rule: 20–35% chance; max 1 lore per room.

**Acceptance Criteria**
- [ ] Reads as “forge/workshop”
- [ ] Doesn’t create cluttered choke points
- [ ] Duplicate tool evidence appears sometimes

**Test Seeds:** 17001, 17002

---

## Zone: `magma_channels` — Magma Channels
**Status:** `[ ]`

**Purpose:**
- The floor’s primary hazard lanes: transformation made lethal.
- Players learn that here, the environment is the crucible.

**Generation**
- **Eligibility:** elongated rooms preferred.
  - min_w=4, min_h=10 OR min_w=10, min_h=4
  - allowed_room_types=[NORMAL]
  - max_per_level=3–5
- **Selection rule:** prefer corridor-heavy connectors (seam arteries).
- **Layout pass:**
  - Paint a central `LAVA (~)` lane (straight or slightly offset).
  - Guarantee at least one safe `FLOOR (.)` route from each entrance.
  - Optional: add 1–2 narrow bridge crossings (single-tile safe spans).

**Visual / Atmosphere**
- **Decorations:** use `≡` vents near lava edges; `∆` rock clusters near safe routes.
- **Environmental Evidence (choose 1):**
  - Melted crest with “almost-right” sigil
  - Heat haze implied by dense vent placement near lava
- **Lighting notes:** strongest on this floor (hazard readable).
- **3D overrides:** has_ceiling=true

**Spawns**
- **Enemies:** fire elementals bias x1.4 if available; otherwise reduce melee swarms (fairness).
- **Items:** normal.
- **Lore drops:**
  - **Delver pool:** [`delver_note_the_lava_edits_metal`]
  - **Surface/Authority pool:** [`obsidian_tablet_change_cannot_return`]
  - Spawn rule: 10–20% chance; max 1 lore per room.

**Acceptance Criteria**
- [ ] Lava never blocks all entrances
- [ ] Safe path always exists
- [ ] Lava is clearly visible and feels threatening

**Test Seeds:** 17011, 17012

---

## Zone: `cooling_chambers` — Cooling Chambers
**Status:** `[ ]`

**Purpose:**
- Transitional relief rooms: solidification after heat.
- Great place for “reliability illusion” before the next hazard pocket.

**Generation**
- **Eligibility:**
  - min_w=6, min_h=6
  - allowed_room_types=[NORMAL]
  - max_per_level=1–2
- **Selection rule:** prefer rooms adjacent to magma channels or forge halls.
- **Layout pass:**
  - Optional: 1–2 small `DEEP_WATER (≈)` trough patches (cooling water).
  - Avoid traps/hazards; keep readable.
  - Use decorations to suggest racks / cooling stations.

**Visual / Atmosphere**
- **Decorations:** fewer vents (`≡`), more rock (`∆`) arranged like racks.
- **Environmental Evidence (choose 1):**
  - A cooled metal plate stamped twice with different crests
  - Two identical ingots placed in mirrored corners
- **Lighting notes:** slightly dimmer than magma channels.
- **3D overrides:** has_ceiling=true

**Spawns**
- **Enemies:** normal-to-low density (x0.9).
- **Items:** slight bias toward consumables (recovery).
- **Lore drops:**
  - **Delver pool:** [`master_smith_final_record`] (rare here)
  - **Surface/Authority pool:** [`regalia_requisition_order_wrong_king`]
  - Spawn rule: 10–20%; max 1 lore.

**Acceptance Criteria**
- [ ] Feels like a “breather” zone
- [ ] Does not become a free safe room
- [ ] Water troughs never block paths

**Test Seeds:** 17021, 17022

---

## Zone: `slag_pits` — Slag Pits
**Status:** `[ ]`

**Purpose:**
- Hazard pockets: waste of transformation.
- Risk/reward rooms that tempt the player off the safe path.

**Generation**
- **Eligibility:**
  - min_w=5, min_h=5
  - allowed_room_types=[NORMAL]
  - max_per_level=1–2
- **Selection rule:** prefer dead-end rooms or side branches.
- **Layout pass:**
  - Place 1–3 small `LAVA (~)` puddles in corners or along one wall (not full lanes).
  - Optional: 1–2 `TRAP_VISIBLE (^)` tiles as unstable slag collapse.
  - Guarantee safe path around hazards.

**Visual / Atmosphere**
- **Decorations:** dense `∆` “slag” clusters, sparse vents.
- **Environmental Evidence (choose 1):**
  - A half-melted crest plate
  - Debris arranged like an unfinished crown
- **Lighting notes:** moderate; hazards must be readable.

**Spawns**
- **Enemies:** low-to-normal; not empty.
- **Items:** higher chance of loot (risk/reward).
- **Lore drops:**
  - **Delver pool:** [`delver_note_the_slag_remembers`]
  - **Surface/Authority pool:** [`obsidian_tablet_change_cannot_return`]
  - Spawn rule: 10–20%; max 1 lore.

**Acceptance Criteria**
- [ ] Hazards are avoidable and fair
- [ ] Tempting reward placement is possible
- [ ] Does not gate the critical path

**Test Seeds:** 17031, 17032

---

## Zone: `rune_press` — Rune Press
**Status:** `[ ]`

**Purpose:**
- The imprint motif made literal: meaning pressed into metal.
- The place where “almost-right” sigils originate.

**Generation**
- **Eligibility:**
  - min_w=7, min_h=7
  - allowed_room_types=[NORMAL]
  - max_per_level=1
- **Selection rule:** choose one mid-to-late room not boss-adjacent.
- **Layout pass:**
  - Keep center open.
  - Use decoration clusters arranged in a “press + plates” layout.
  - Optional: short `WALL (#)` stubs to frame the press station (do not block).

**Visual / Atmosphere**
- **Decorations:** `≡` vents around center, `∆` as plate piles.
- **Environmental Evidence (choose 1):**
  - Melted crests with almost-right sigils (prop)
  - A stamped plate that lists two monarch names with equal authority
- **Lighting notes:** focused center light.
- **3D overrides:** has_ceiling=true

**Spawns**
- **Enemies:** low-to-normal.
- **Items:** slight lore bias.
- **Lore drops:**
  - **Delver pool:** [`master_smith_final_record`]
  - **Surface/Authority pool:** [`obsidian_tablet_change_cannot_return`, `regalia_requisition_order_wrong_king`]
  - Spawn rule: 35–60% chance; max 1 lore.

**Acceptance Criteria**
- [ ] Reads as “press station” without special models
- [ ] Imprint theme is obvious

**Test Seeds:** 17041, 17042

---

## Zone: `ash_galleries` — Ash Galleries
**Status:** `[ ]`

**Purpose:**
- Soot and ambiguity: what remains after transformation.
- Creates tension by clutter + trap placement, without needing view-range hacks.

**Generation**
- **Eligibility:** any size.
  - allowed_room_types=[NORMAL]
  - max_per_level=2–3
- **Selection rule:** prefer rooms that are not key junctions (avoid trapping player).
- **Layout pass:**
  - Place 1–4 `TRAP_HIDDEN (.)` / `TRAP_VISIBLE (^)` tiles to simulate unstable footing.
  - Increase decoration density (rocks/vents) to create visual “noise.”
  - Keep at least one clean route.

**Visual / Atmosphere**
- **Decorations:** more `∆` clusters, fewer vents.
- **Environmental Evidence (choose 1):**
  - Ash spirals pointing toward the arena (prop arrangement)
  - Two identical scorch marks implied by symmetry of props
- **Lighting notes:** dimmer.

**Spawns**
- **Enemies:** normal density; allow ambush-friendly placements.
- **Items:** normal.
- **Lore drops:**
  - **Delver pool:** [`delver_note_the_ash_points_inward`]
  - **Surface/Authority pool:** [`obsidian_tablet_change_cannot_return`]
  - Spawn rule: 10–20%; max 1 lore.

**Acceptance Criteria**
- [ ] Feels “unclear/sooty” without special renderer work
- [ ] Traps remain fair and avoidable
- [ ] Movement is not blocked by decoration

**Test Seeds:** 17051, 17052

---

## Zone: `crucible_heart` — The Crucible Heart (Anchor)
**Status:** `[ ]`

**Purpose:**
- Anchor set piece: the forge that became aware.
- Where “transformation” feels like a mind, not a hazard.

**Generation**
- **Eligibility:** choose 1 anchor room; prefer LARGE_HALL or largest NORMAL not boss room; max_per_level=1
- **Selection rule:** prefer placement near boss route but not `boss_approach` itself (pre-arena landmark).
- **Layout pass:**
  - Keep center open.
  - Optional: place a small ring of `LAVA (~)` at the edges (not central) to suggest “heat halo.”
  - Use dense decoration clustering to imply a “massive forge” (no new model required).

**Visual / Atmosphere**
- **Decorations:** high density vents (`≡`) near the “forge core,” rock (`∆`) around edges.
- **Environmental Evidence (choose 1):**
  - “The forge that learned to forge forgers” (inscription/lore prop)
  - A crest plate melted into unreadability except for the seal outline
- **Lighting notes:** strong center glow (more vents, more lights).

**Spawns**
- **Enemies:** low-to-normal (not empty).
- **Items:** guarantee 1 lore drop here.
- **Lore drops:**
  - **Delver pool:** [`master_smith_final_record`]
  - **Surface/Authority pool:** [`obsidian_tablet_change_cannot_return`]
  - Spawn rule: 100% for 1 lore in this zone.

**Acceptance Criteria**
- [ ] Feels like a set-piece anchor room
- [ ] Doesn’t become a free safe room
- [ ] Guaranteed lore spawns

**Test Seeds:** 17061, 17062

---

## Zone: `boss_approach` — Boss Approach (Flame Lord)
**Status:** `[ ]`

**Purpose:**
- Pre-boss escalation: offerings, branding, spirals inward.
- Guarantees trail tells and one pre-boss reveal lore.

**Generation**
- **Eligibility:** 1–3 rooms nearest to boss room center (excluding boss room).
- **Selection rule:** distance from room.center() to boss_room.center(); tag nearest N.
- **Layout pass:** keep walkable; avoid heavy hazard placement.

**Boss Trail Integration**
- **Trail tells (pick 3):**
  - [ ] Melted weapons embedded in walls like offerings (prop cluster)
  - [ ] Rune plates “stamped” into stone (arranged props)
  - [ ] Ash spirals pointing toward the arena (prop arrangement)
- **Pre-boss reveal text:** “WHAT ENTERS FIRE BECOMES FIRE.”
- **Aftermath hook (future):** post-boss, magma lanes feel calmer (visual only).

**Spawns**
- **Enemies:** fire-adjacent bias x1.4 if available; otherwise normal.
- **Items:** pre-boss supplies bias (healing).
- **Lore drops:**
  - **Delver pool:** [`delver_note_the_forge_is_learning`]
  - **Surface/Authority pool:** [`obsidian_tablet_change_cannot_return`]
  - Spawn rule: guarantee 1 lore across boss_approach rooms.

**Acceptance Criteria**
- [ ] Boss approach tagging reliable
- [ ] Trail props appear consistently
- [ ] Escalation reads clearly
