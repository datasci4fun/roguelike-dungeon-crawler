# Floor 5 — Ice Cavern (STASIS)

**Aspect:** STASIS (what cannot change)
**Monarchy Anchor:** Treaties (pacts sealed so they cannot change)
**Warden:** Frost Giant

---

## Zone: `frozen_galleries` — Frozen Galleries
**Status:** `[ ]`

**Purpose:**
- Primary movement language: stasis made physical through slippery lanes and forced lines.
- Teaches the floor’s core rule: progress slows, decisions don’t resolve cleanly.

**Generation**
- **Eligibility:** elongated rooms preferred.
  - min_w=4, min_h=10 OR min_w=10, min_h=4
  - allowed_room_types=[NORMAL]
  - max_per_level=3–5
- **Selection rule:** weighted high. Prefer rooms that connect multiple corridors (acts like seam arteries).
- **Layout pass:**
  - Paint `ICE (=)` lanes through the room (center or offset).
  - Preserve at least one safe `FLOOR (.)` route from each entrance (do not ice-lock all paths).
  - Optional: small `ICE` “patches” near corners for slip risk.

**Visual / Atmosphere**
- **Decorations (current system):** Ice theme props (`❄`, `◇`) clustered along ice lanes and corners.
- **Environmental Evidence (choose 1):**
  - Frost sigil etched identically in two locations (pattern via prop placement)
  - A crack line that disappears and reappears elsewhere (duplicate marker props)
  - Footprints that repeat the same step pattern twice
- **Lighting notes:** colder/dimmer; one bright “crystal” point per room (via `◇` clustering).
- **3D overrides:** has_ceiling=true, skybox_override=None

**Spawns**
- **Enemies:** ice elementals bias x1.3 if available; otherwise skeletons x1.1 (“frozen guard echoes”).
- **Items:** normal.
- **Lore drops:**
  - **Delver pool:** [`frozen_explorer_journal`]
  - **Surface/Authority pool:** [`treaty_scroll_contradiction`]
  - Spawn rule: 10–20% chance per room; max 1 lore per room.

**Acceptance Criteria**
- [ ] Ice tiles never block all entrances
- [ ] At least one safe route exists
- [ ] Visual identity reads as “stasis lanes”
- [ ] Spawn bias noticeable (ice-adjacent enemies appear more)

**Test Seeds:** 15001, 15002, 15003

---

## Zone: `ice_tombs` — Ice Tombs
**Status:** `[ ]`

**Purpose:**
- Stasis horror: bodies and moments preserved as if breath never advanced.
- Low combat pressure, high dread / lore density.

**Generation**
- **Eligibility:**
  - min_w=6, min_h=6
  - allowed_room_types=[NORMAL]
  - max_per_level=1–3
- **Selection rule:** prefer rooms with fewer entrances (tomb feel).
- **Layout pass:**
  - Optional: place small `ICE (=)` patches around the perimeter.
  - Keep center open for readability.
  - Use decoration clustering to imply “figures in ice” (no special tile needed).

**Visual / Atmosphere**
- **Decorations:** `◇` clusters as “frozen forms” plus `❄` scatter.
- **Environmental Evidence (choose 1):**
  - “Breathing” implied by repeated condensation markers (prop clusters near one “figure”)
  - A plaque that repeats the same day number (Day 12, Day 12)
- **Lighting notes:** minimal; dim.
- **3D overrides:** has_ceiling=true

**Spawns**
- **Enemies:** low density (not empty). Prefer slow enemies / guards.
- **Items:** small chance of consumable.
- **Lore drops:**
  - **Delver pool:** [`frozen_explorer_journal`]
  - **Surface/Authority pool:** [`ice_warning_carved`]
  - Spawn rule: 35–60% chance; max 1 lore per tomb room.

**Acceptance Criteria**
- [ ] Reads as “tomb/preservation” zone
- [ ] Doesn’t become a free safe room (some threat remains)
- [ ] Lore appears often enough to matter

**Test Seeds:** 15011, 15012

---

## Zone: `crystal_grottos` — Crystal Grottos
**Status:** `[ ]`

**Purpose:**
- Beautiful pocket with hidden danger: crystals as stasis’ “ornament.”
- Reward landmark—players should recognize this room instantly.

**Generation**
- **Eligibility:**
  - min_w=7, min_h=7
  - allowed_room_types=[NORMAL, LARGE_HALL]
  - max_per_level=1–2
- **Selection rule:** prefer larger rooms; avoid boss approach cluster.
- **Layout pass:**
  - Keep center open.
  - Optional: small `ICE (=)` rings around crystal clusters.
  - No new tiles required.

**Visual / Atmosphere**
- **Decorations:** heavy `◇` crystals, light `❄` scatter.
- **Environmental Evidence (choose 1):**
  - Crystal growth forming the same sigil geometry as other floors (prop arrangement)
  - Two identical crystal clusters mirrored (field copying)
- **Lighting notes:** slightly brighter than other zones (lure).
- **3D overrides:** has_ceiling=true (future: you can add “sparkle” shader, but not required here).

**Spawns**
- **Enemies:** ice elementals bias x1.3; otherwise mixed.
- **Items:** increased chance of loot (minor reward zone).
  *(If “gems” aren’t a mechanic, just bias to equipment/consumables.)*
- **Lore drops:**
  - **Delver pool:** [`delver_note_the_crystals_watch`]
  - **Surface/Authority pool:** [`treaty_scroll_contradiction`]
  - Spawn rule: 15–25%; max 1 lore.

**Acceptance Criteria**
- [ ] Looks distinct and “beautiful”
- [ ] Loot opportunity feels clear
- [ ] Doesn’t become overly safe

**Test Seeds:** 15021, 15022

---

## Zone: `suspended_laboratories` — Suspended Laboratories
**Status:** `[ ]`

**Purpose:**
- “Research that never completes.” Experiments frozen mid-process.
- High lore density and strong “stasis paradox” signal.

**Generation**
- **Eligibility:**
  - min_w=6, min_h=6
  - allowed_room_types=[NORMAL]
  - max_per_level=1
- **Selection rule:** pick one mid-floor room not adjacent to boss.
- **Layout pass:**
  - Keep open.
  - Use decoration clusters to imply tables/tools frozen mid-use (no new tiles required).
  - Optional: 1–2 `ICE (=)` patches near “tables.”

**Visual / Atmosphere**
- **Decorations:** mix `◇` (crystals/tools) + `❄` (frost) in “workbench rows.”
- **Environmental Evidence (choose 1):**
  - “Experiment in progress, forever” (plaque/prop cluster)
  - Two identical notes, both “original”
- **Lighting notes:** focused to center.
- **3D overrides:** has_ceiling=true

**Spawns**
- **Enemies:** low-to-normal (not empty).
- **Items:** bias toward lore; small chance of utility.
- **Lore drops:**
  - **Delver pool:** [`frozen_explorer_journal`]
  - **Surface/Authority pool:** [`contradictory_record_ice`]
  - Spawn rule: 60–90% chance; max 2 lore drops in this zone (rare exception).

**Acceptance Criteria**
- [ ] Reads as “lab frozen in time”
- [ ] Lore density noticeably high
- [ ] Still navigable

**Test Seeds:** 15031, 15032

---

## Zone: `breathing_chamber` — The Breathing Chamber (Anchor)
**Status:** `[ ]`

**Purpose:**
- Boss presence is felt before the arena: “the same breath for centuries.”
- Set-piece anchor that teaches stasis as an endless loop.

**Generation**
- **Eligibility:**
  - min_w=10, min_h=8
  - allowed_room_types=[LARGE_HALL, NORMAL]
  - max_per_level=1
- **Selection rule:** choose a large room near the boss route but not necessarily boss_approach.
- **Layout pass:**
  - Minimal hazards.
  - Optional: small `DEEP_WATER (≈)` strip at edge as “condensation runoff.”
  - Keep center open.

**Visual / Atmosphere**
- **Decorations:** concentrated `◇` at one “breath source” edge, `❄` scattered.
- **Environmental Evidence (choose 1):**
  - “Breath fog drifting upward against airflow” (represented as repeated prop cluster alignment)
  - A repeating inscription that loops on itself
- **Lighting notes:** dim, with one focal “cold glow.”
- **3D overrides:** has_ceiling=true

**Spawns**
- **Enemies:** low density (not empty).
- **Items:** small chance of consumable.
- **Lore drops:**
  - **Delver pool:** [`frozen_explorer_journal`] (low chance)
  - **Surface/Authority pool:** [`ice_warning_carved`]
  - Spawn rule: 20–35% chance; max 1 lore.

**Acceptance Criteria**
- [ ] Feels like a set-piece “breath” landmark
- [ ] Not a free safe room
- [ ] Connects cleanly to the boss route

**Test Seeds:** 15041, 15042

---

## Zone: `thaw_fault` — Thaw Fault
**Status:** `[ ]`

**Purpose:**
- The paradox of stasis: thaw that never completes.
- Small pocket rooms that feel “wrong” and reinforce the rules of the Field.

**Generation**
- **Eligibility:**
  - min_w=5, min_h=5
  - allowed_room_types=[NORMAL]
  - max_per_level=1–2
- **Selection rule:** prefer rooms adjacent to seams between zones (transition moments).
- **Layout pass:**
  - Place 1–2 small `DEEP_WATER (≈)` patches (drips that “never finish”).
  - Surround with `ICE (=)` so “melt” and “freeze” coexist.
  - Guarantee safe path.

**Visual / Atmosphere**
- **Decorations:** mixed `❄` + `◇` with deliberate contradictory placement.
- **Environmental Evidence (choose 1):**
  - “The thaw is part of the freeze” (short inscription / prop)
  - Two identical warnings, both true
- **Lighting notes:** dim.
- **3D overrides:** has_ceiling=true

**Spawns**
- **Enemies:** low-to-normal.
- **Items:** normal.
- **Lore drops:**
  - **Delver pool:** [`delver_note_the_thaw_never_finishes`]
  - **Surface/Authority pool:** [`ice_warning_carved`]
  - Spawn rule: 15–30%; max 1 lore.

**Acceptance Criteria**
- [ ] Paradox reads visually (ice + drips)
- [ ] Hazards remain fair
- [ ] Safe path exists

**Test Seeds:** 15051, 15052

---

## Zone: `boss_approach` — Boss Approach (Frost Giant)
**Status:** `[ ]`

**Purpose:**
- Consistent pre-boss escalation: chain-circle ritual, breath against physics, doors icing over.
- Guarantees 3 trail tells and one pre-boss reveal lore.

**Generation**
- **Eligibility:** 1–3 rooms nearest to boss room center (excluding boss room).
- **Selection rule:** distance from room.center() to boss_room.center(); tag nearest N.
- **Layout pass:** keep walkable; avoid heavy hazards here.

**Boss Trail Integration**
- **Trail tells (pick 3):**
  - [ ] Giant chain links embedded in ice like a ritual circle (prop arrangement)
  - [ ] Breath markers aligned upward against flow (prop pattern)
  - [ ] Ice “growing” over doors you just opened (represented by icing props near entrances)
- **Pre-boss reveal text:** “DO NOT THAW. THE THAW IS PART OF THE FREEZE.”
- **Aftermath hook (future):** stasis loosens slightly after defeat (visual only).

**Spawns**
- **Enemies:** ice elementals bias x1.4; otherwise guards.
- **Items:** pre-boss supplies bias (healing).
- **Lore drops:**
  - **Delver pool:** [`frozen_explorer_journal`]
  - **Surface/Authority pool:** [`ice_warning_carved`, `treaty_scroll_contradiction`]
  - Spawn rule: guarantee 1 lore drop across boss_approach rooms.

**Acceptance Criteria**
- [ ] Boss approach tagging reliable
- [ ] Trail props appear consistently
- [ ] Escalation reads clearly
