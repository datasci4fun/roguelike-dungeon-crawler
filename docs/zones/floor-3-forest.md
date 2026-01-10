# Floor 3 — Forest Depths (GROWTH)

**Aspect:** GROWTH (what consumes boundaries)
**Monarchy Anchor:** Family Trees / Genealogy (branching truths cultivated like orchards)
**Warden:** Spider Queen

---

## Zone: `root_warrens` — Root Warrens
**Status:** `[ ]`

**Purpose:**
- Branchy, constricting routes that feel alive. Navigation becomes entanglement.
- Establishes “growth consumes boundaries” as the floor’s core language.

**Generation**
- **Eligibility:** elongated rooms preferred.
  - min_w=4, min_h=8 OR min_w=8, min_h=4
  - allowed_room_types=[NORMAL]
  - max_per_level=3–5
- **Selection rule:** weighted high. Prefer rooms with 2+ corridor connections (acts as a woven seam hub).
- **Layout pass:**
  - [ ] Add thin interior partitions (short `WALL (#)` segments) that create chokepoints but preserve connectivity.
  - [ ] Optional: 1–2 “root arches” (decoration clusters) near entrances.
  - [ ] Guarantee at least a 2-tile-wide route between all doors.

**Visual / Atmosphere**
- **Decorations (current system):** Forest theme props (`♠` trees, `¥` mushrooms) used to imply growth overtaking stone.
- **Optional custom props:** webs/roots if supported by renderer; otherwise treat decoration clusters as “roots.”
- **Environmental Evidence (choose 1):**
  - Roots avoid a crown-shaped stone patch
  - The same sigil geometry implied by repeated decoration arrangement
  - Footprints in soil that lead into a wall seam
- **Lighting notes:** dimmer, with occasional “bioluminescent” mushroom clusters (if you have color pairs; otherwise more `¥`).
- **3D overrides:** has_ceiling=true, skybox_override=None

**Spawns**
- **Enemies:** spiders bias x1.5; reduce goblin/orc presence if they exist at this level.
- **Items:** normal.
- **Lore drops:**
  - **Delver pool:** [`druid_log`]
  - **Surface/Authority pool:** [`genealogist_fragment_branches`]
  - Spawn rule: 15–25% chance per room; max 1 lore per room.

**Acceptance Criteria**
- [ ] Chokepoints create tactical decisions but never hard-block routes
- [ ] Visual identity reads as “living corridors”
- [ ] Spawn bias is noticeable (more spiders)

**Test Seeds:** 13001, 13002, 13003

---

## Zone: `canopy_halls` — Canopy Halls
**Status:** `[ ]`

**Purpose:**
- The “breathing” rooms of the forest pocket: open central space, tall feel.
- Candidate for future open-ceiling/skybox moments, but works now as a landmark room.

**Generation**
- **Eligibility:**
  - min_w=8, min_h=8
  - allowed_room_types=[LARGE_HALL, NORMAL]
  - max_per_level=1–2
- **Selection rule:** prefer the largest non-boss rooms; avoid boss approach cluster.
- **Layout pass:**
  - [ ] Keep center open.
  - [ ] Place decoration “trunks” along edges (cluster `♠` in vertical lines).
  - [ ] Optional: place a small `DEEP_WATER (≈)` corner pool (“underground spring”) for variety (must not block entrances).

**Visual / Atmosphere**
- **Decorations:** `♠` clustered as trunks, `¥` as undergrowth.
- **Environmental Evidence (choose 1):**
  - Two identical “trees” mirrored (field copying)
  - A corridor marker appears twice (duplicate landmark)
  - Roots form a ring around an empty center
- **Lighting notes:** slightly brighter than warrens (landmark).
- **3D overrides (future-ready):** has_ceiling=false (optional later), skybox_override=`forest` (optional later).
  *(For now, keep has_ceiling=true unless you’ve wired per-room ceiling.)*

**Spawns**
- **Enemies:** mixed; spiders still favored but lower density than nursery.
- **Items:** slightly higher chance of loot (reward landmark).
- **Lore drops:**
  - **Delver pool:** [`note_wrapped_in_silk`]
  - **Surface/Authority pool:** [`duplicate_decree_forest_graft`]
  - Spawn rule: 15–25% chance; max 1 lore.

**Acceptance Criteria**
- [ ] Feels like a recognizable landmark room
- [ ] Center stays navigable / readable
- [ ] Not overly cluttered

**Test Seeds:** 13011, 13012

---

## Zone: `webbed_gardens` — Webbed Gardens
**Status:** `[ ]`

**Purpose:**
- Spider influence made architectural: “larder” rooms, cocoon evidence, trap-like feel.
- Supports loot tension (“take the prize, pay the price”) without new mechanics.

**Generation**
- **Eligibility:**
  - min_w=6, min_h=6
  - allowed_room_types=[NORMAL]
  - max_per_level=2–3
- **Selection rule:** prefer rooms off the main route (dead-ends or 1-entrance).
- **Layout pass:**
  - [ ] Place 1–3 `TRAP_HIDDEN (.)` / `TRAP_VISIBLE (^)` tiles to simulate “web traps” (no new tile needed).
  - [ ] Place decorations in clustered “web lattice” patterns (use repeated placements).
  - [ ] Ensure at least one safe route exists.

**Visual / Atmosphere**
- **Decorations:** dense `¥` clusters + repeated patterns to imply webbing.
- **Environmental Evidence (choose 1–2):**
  - Web patterns forming the same sigil geometry (arranged props)
  - A royal signet ring stuck in “webbing” (prop)
  - Cocooned packs arranged in a ring (prop cluster)
- **Lighting notes:** dim; one highlight near “loot bait.”
- **3D overrides:** has_ceiling=true

**Spawns**
- **Enemies:** spiders bias x2.0
- **Items:** slightly higher loot chance in these rooms (risk/reward).
- **Lore drops:**
  - **Delver pool:** [`note_wrapped_in_silk`]
  - **Surface/Authority pool:** [`royal_signet_fragment`]
  - Spawn rule: 20–35% chance; max 1 lore.

**Acceptance Criteria**
- [ ] Trap placement doesn’t create unavoidable damage
- [ ] Room reads as “spider influence / larder”
- [ ] Loot feels tempting but risky

**Test Seeds:** 13021, 13022

---

## Zone: `nursery` — The Nursery
**Status:** `[ ]`

**Purpose:**
- High-danger spawn pocket: where the forest “gestates” new patterns.
- A distinct spike in pressure on this floor.

**Generation**
- **Eligibility:**
  - min_w=8, min_h=8
  - allowed_room_types=[LARGE_HALL, NORMAL]
  - max_per_level=1
- **Selection rule:** pick one large room far from start; not boss room.
- **Layout pass:**
  - [ ] Heavy decoration density around edges (implies egg clusters).
  - [ ] Optional: add 2–4 `TRAP_VISIBLE (^)` tiles as “hatch points.”
  - [ ] Keep a navigable center.

**Visual / Atmosphere**
- **Decorations:** dense `¥` clusters, scattered `♠` (twisted growth).
- **Environmental Evidence (choose 1):**
  - “The Nursery” marker repeated twice (duplicate plaque)
  - An “egg ring” arrangement that resembles the seal sigil
- **Lighting notes:** dim; a few concentrated “glow” spots (if supported).
- **3D overrides:** has_ceiling=true

**Spawns**
- **Enemies:** spiders overall density x1.8; allow multiple packs.
- **Items:** small reward for surviving (1 extra item chance).
- **Lore drops:**
  - **Delver pool:** [`druid_log`] (rare here)
  - **Surface/Authority pool:** [`field_growth_warning`]
  - Spawn rule: 10–20% chance; max 1 lore.

**Acceptance Criteria**
- [ ] Feels noticeably more dangerous than other zones
- [ ] Still navigable (no decoration walls)
- [ ] Spawn spike is real but fair

**Test Seeds:** 13031, 13032

---

## Zone: `digestion_chambers` — Digestion Chambers
**Status:** `[ ]`

**Purpose:**
- “Consumption” pocket: the forest breaks down intruders into usable matter.
- Achieve the vibe using existing hazard tiles (poison gas + water + traps), no new “acid” tile.

**Generation**
- **Eligibility:**
  - min_w=6, min_h=6
  - allowed_room_types=[NORMAL]
  - max_per_level=1–2
- **Selection rule:** avoid being the only mandatory path unless safe routes exist.
- **Layout pass:**
  - [ ] Place patchy `POISON_GAS (!)` areas (not full-room).
  - [ ] Optional: small `DEEP_WATER (≈)` pool or “rot slurry.”
  - [ ] 1–3 visible traps `(^)` as “digestive teeth.”
  - [ ] Guarantee a safe route from each entrance.

**Visual / Atmosphere**
- **Decorations:** sparse; let hazard tiles read. Cluster `¥` as “fungus.”
- **Environmental Evidence (choose 1):**
  - Partially dissolved gear pile (prop)
  - Footprints that enter gas and stop
  - Roots that “wrap” around a discarded crown icon
- **Lighting notes:** darker.
- **3D overrides:** has_ceiling=true

**Spawns**
- **Enemies:** low-to-normal (not none). Prefer spiders.
- **Items:** rare drops (risk/reward) but not high-tier.
- **Lore drops:**
  - **Delver pool:** [`delver_warning_dont_breathe`]
  - **Surface/Authority pool:** [`quarantine_marker_forest`]
  - Spawn rule: 10–20%; max 1 lore.

**Acceptance Criteria**
- [ ] Hazards are avoidable and fair
- [ ] Reads as “consumption pocket”
- [ ] Safe path exists from every entrance

**Test Seeds:** 13041, 13042

---

## Zone: `druid_ring` — Druid Ring (Anchor)
**Status:** `[ ]`

**Purpose:**
- Ritual anchor: where the druid made her last stand and was edited into the Queen’s gardener.
- Strong narrative room; reliable lore drop.

**Generation**
- **Eligibility:**
  - min_w=8, min_h=8
  - allowed_room_types=[NORMAL, LARGE_HALL]
  - max_per_level=1
- **Selection rule:** select one mid-late room (not start, not boss approach). Prefer single entrance.
- **Layout pass:**
  - [ ] Clear center.
  - [ ] Place a ring of decorations (`♠` or `¥`) in a circle-like pattern.
  - [ ] Optional: place 1–2 `BREAKABLE_WALL (░)` “root knots” near edges (future secrets).

**Visual / Atmosphere**
- **Decorations:** arranged in a circle. Minimal clutter beyond the ring.
- **Environmental Evidence:**
  - Stone arrangement that resembles the crown sigil (imperfect but recognizable)
  - A plaque with the druid’s name scratched over itself
- **Lighting notes:** slightly brighter; “ritual spotlight.”
- **3D overrides:** has_ceiling=true (future: could be pocket skybox).

**Spawns**
- **Enemies:** low density, but not empty.
- **Items:** guarantee 1 lore; slight chance of shrine-like reward.
- **Lore drops:**
  - **Delver pool:** [`druid_log`] (guaranteed here)
  - **Surface/Authority pool:** [`druid_order_fragment`]
  - Spawn rule: 100% for 1 lore here.

**Acceptance Criteria**
- [ ] Exactly one per level
- [ ] Circle reads as deliberate ritual geometry
- [ ] Lore always spawns here

**Test Seeds:** 13051, 13052

---

## Zone: `boss_approach` — Boss Approach (Spider Queen)
**Status:** `[ ]`

**Purpose:**
- Boss foreshadowing and escalation before the Queen.
- Guarantees trail props and “offerings” are present leading toward the arena.

**Generation**
- **Eligibility:** 1–3 rooms nearest to boss room center (excluding boss room).
- **Selection rule:** distance from room.center() to boss_room.center(); tag nearest N.
- **Layout pass:** keep walkable; avoid heavy hazards here.

**Boss Trail Integration**
- **Trail tells (pick 3):**
  - [ ] Cocooned packs arranged in a ring (offerings)
  - [ ] Royal signet ring stuck in “webbing” (prop)
  - [ ] “Pruned corridor” (decor clusters forming punctuation-like pattern)
- **Pre-boss reveal text:** “If you can read this, the silk has not finished editing you yet.”
- **Aftermath hook (future):** post-boss rooms feel less “watched” (spawn reduction).

**Spawns**
- **Enemies:** spiders bias x2.0; reduce unrelated spawns.
- **Items:** pre-boss supplies bias (healing).
- **Lore drops:**
  - **Delver pool:** [`note_wrapped_in_silk`]
  - **Surface/Authority pool:** [`royal_signet_fragment`]
  - Spawn rule: guarantee 1 lore across boss_approach rooms per level (not per room).

**Acceptance Criteria**
- [ ] Boss approach tagging reliable
- [ ] Trail props appear consistently
- [ ] Tension escalation reads clearly
