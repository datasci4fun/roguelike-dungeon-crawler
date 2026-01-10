# Floor 8 — Crystal Cave (INTEGRATION)

**Aspect:** INTEGRATION (where all layers meet)
**Monarchy Anchor:** Crown Meaning Itself (authority becomes an interface)
**Warden:** Dragon Emperor

---

## Zone: `crystal_gardens` — Crystal Gardens
**Status:** `[ ]`

**Purpose:**
- The lure layer: beauty that feels authored by an alien rule set.
- Establishes that here, “meaning” has solidified into visible structure.

**Generation**
- **Eligibility:**
  - min_w=7, min_h=7
  - allowed_room_types=[NORMAL, LARGE_HALL]
  - max_per_level=2–3
- **Selection rule:** prefer larger rooms not boss-adjacent; use as scenic landmarks.
- **Layout pass:**
  - Keep center open and readable.
  - Optional: add a few `BREAKABLE_WALL (░)` clusters as “brittle crystal growth” (only if breakable mechanic exists; otherwise skip).

**Visual / Atmosphere**
- **Decorations (current system):** Crystal theme props `◇` and `✦` in heavy clusters (garden beds).
- **Optional custom props:** prismatic shards, floating motes, refracted “double” pillars (later).
- **Environmental Evidence (choose 1):**
  - Two identical crystal clusters mirrored perfectly (field copying)
  - A corridor marker that appears twice with equal age
  - Double-shadow motif implied by symmetric prop placement
- **Lighting notes:** brightest floor zone (this is the lure).
- **3D overrides:** has_ceiling=true (future: has_ceiling=false as an “impossible open air” moment is allowed once per floor if you want).

**Spawns**
- **Enemies:** bias toward high-level “guardian” enemies and dragon fragments if present (x1.3).
- **Items:** slightly increased loot chance (reward landmark).
- **Lore drops:**
  - **Delver pool:** [`delver_note_the_crystal_sings`]
  - **Surface/Authority pool:** [`prewritten_victory_proclamation_fragment`]
  - Spawn rule: 10–20% chance; max 1 lore per room.

**Acceptance Criteria**
- [ ] Visual spectacle reads instantly (dense crystal clusters)
- [ ] Room remains navigable and not cluttered
- [ ] Loot feels like a lure, not a freebie

**Test Seeds:** 18001, 18002

---

## Zone: `geometry_wells` — Geometry Wells
**Status:** `[ ]`

**Purpose:**
- Lattice nodes: where the Field’s structure is exposed as pattern.
- Makes “integration” feel like an engineered interface, not a cave.

**Generation**
- **Eligibility:**
  - min_w=6, min_h=6
  - allowed_room_types=[NORMAL]
  - max_per_level=1–2
- **Selection rule:** prefer rooms on the critical path (player should see at least one).
- **Layout pass:**
  - No special tiles required.
  - Arrange decorations in strict geometric motifs (rings, diagonals, mirrored pairs).
  - Optional: 1–2 `TRAP_VISIBLE (^)` tiles as “unstable node points” (fair placement only).

**Visual / Atmosphere**
- **Decorations:** `◇` / `✦` arranged as a sigil-like diagram (not random scatter).
- **Environmental Evidence (choose 1):**
  - Repeating sigil geometry across zones (same shape, different material)
  - Incomplete sigil segment (a “missing wedge” in the pattern)
- **Lighting notes:** focused, deliberate (less organic than gardens).
- **3D overrides:** has_ceiling=true

**Spawns**
- **Enemies:** moderate; bias toward dragon fragments/wardens if present.
- **Items:** normal.
- **Lore drops:**
  - **Delver pool:** [`dragons_pact_fragment`] (rare)
  - **Surface/Authority pool:** [`seal_history_excerpt`]
  - Spawn rule: 15–30%; max 1 lore.

**Acceptance Criteria**
- [ ] Pattern is visibly “engineered”
- [ ] Any traps are avoidable and fair
- [ ] Feels distinct from gardens

**Test Seeds:** 18011, 18012

---

## Zone: `seal_chambers` — Seal Chambers
**Status:** `[ ]`

**Purpose:**
- Binding rooms: where the ancient seal is visible—and visibly failing.
- Reinforces the core idea: the seal is an interface, not just a wall.

**Generation**
- **Eligibility:**
  - min_w=7, min_h=7
  - allowed_room_types=[NORMAL]
  - max_per_level=1–2
- **Selection rule:** prefer rooms deeper than geometry wells but before the final approach.
- **Layout pass:**
  - Create a “ring” motif using decoration placement (circle/oval approximation).
  - Leave one deliberate “gap” in the ring (the missing segment evidence).
  - Keep the center walkable.

**Visual / Atmosphere**
- **Decorations:** ring of `◇` with `✦` accents; one missing segment.
- **Environmental Evidence (choose 1):**
  - Crystal sigil incomplete / missing segment
  - Two contradictory binding plaques, both “original”
- **Lighting notes:** dimmer than gardens, brighter than approach.
- **3D overrides:** has_ceiling=true

**Spawns**
- **Enemies:** moderate; bias toward guardians.
- **Items:** small chance of higher-tier loot (seal rooms should feel important).
- **Lore drops:**
  - **Delver pool:** [`dragons_pact_fragment`]
  - **Surface/Authority pool:** [`seal_history_excerpt`, `last_kings_testament_excerpt`]
  - Spawn rule: 30–55% chance; max 1 lore per room.

**Acceptance Criteria**
- [ ] Seal-ring motif is obvious
- [ ] Missing segment reads as intentional
- [ ] Does not block navigation

**Test Seeds:** 18021, 18022

---

## Zone: `dragons_hoard` — The Dragon’s Hoard (Anchor)
**Status:** `[ ]`

**Purpose:**
- Risk/reward anchor: treasure as bait, meaning as debt.
- Reinforces the monarchy anchor: regalia from kings who never existed.

**Generation**
- **Eligibility:** choose 1 anchor room; prefer LARGE_HALL or largest NORMAL; max_per_level=1
- **Selection rule:** place mid-to-late, not boss room, not boss_approach.
- **Layout pass:**
  - Keep center open.
  - Heavy decoration clustering in “piles” along edges/corners.
  - Optional: a few `BREAKABLE_WALL (░)` clusters as brittle crystal barricades (only if breaking exists).

**Visual / Atmosphere**
- **Decorations:** dense `◇`/`✦` “piles.”
- **Optional custom props:** crowns/regalia silhouettes, treasure chests (later).
- **Environmental Evidence (choose 1):**
  - Treasures tagged with two contradictory monarch names
  - Duplicate crown outline present twice (replacement tell)
- **Lighting notes:** bright lure, but with darker corners.
- **3D overrides:** has_ceiling=true

**Spawns**
- **Enemies:** higher danger than normal rooms (do not make it empty).
  Bias toward dragon fragments/guards x1.4 if present.
- **Items:** best loot on the floor outside boss (risk/reward).
- **Lore drops:**
  - **Delver pool:** [`delver_note_the_hoard_is_a_lie`]
  - **Surface/Authority pool:** [`regalia_catalog_entry_contradictory`]
  - Spawn rule: guarantee exactly 1 lore in this zone.

**Acceptance Criteria**
- [ ] Feels like a set-piece hoard
- [ ] Reward is obvious, danger is real
- [ ] Doesn’t become a free safe room

**Test Seeds:** 18031, 18032

---

## Zone: `vault_antechamber` — Vault Antechamber (Anchor)
**Status:** `[ ]`

**Purpose:**
- Point-of-no-return staging: the threshold before the Dragon and the Star-Heart route.
- A room that feels declared as “final.”

**Generation**
- **Eligibility:**
  - min_w=8, min_h=8
  - allowed_room_types=[NORMAL, LARGE_HALL]
  - max_per_level=1
- **Selection rule:** prefer a room on the direct route to boss; often near boss_approach cluster but not necessarily the nearest.
- **Layout pass:**
  - Keep clean and readable.
  - Symmetry bias: mirrored decoration lines like “pillars” leading forward.
  - Avoid hazards here.

**Visual / Atmosphere**
- **Decorations:** orderly `◇`/`✦` lines, fewer clusters.
- **Optional custom props:** massive “vault door” silhouette, inscription bands.
- **Environmental Evidence (choose 1):**
  - Warnings in every language, including one that becomes readable as you stare (lore implication)
  - A plaque that reads “FINAL VERSION”
- **Lighting notes:** restrained, ceremonial.
- **3D overrides:** has_ceiling=true (future: could be open ceiling if you want the “impossible air” moment here).

**Spawns**
- **Enemies:** low-to-normal (this is a staging room, not a free rest).
- **Items:** pre-boss supplies bias (healing).
- **Lore drops:**
  - **Delver pool:** [`last_kings_testament_excerpt`] (high chance)
  - **Surface/Authority pool:** [`prewritten_victory_proclamation_fragment`]
  - Spawn rule: 60–90% chance; max 1 lore here.

**Acceptance Criteria**
- [ ] Feels like a threshold room
- [ ] Stays readable (not cluttered)
- [ ] Lore appears often here

**Test Seeds:** 18041, 18042

---

## Zone: `oath_interface` — Oath Interface (Anchor)
**Status:** `[ ]`

**Purpose:**
- Pact logic made physical: where guardian and guarded became one.
- Reinforces the paradox of guardianship before the boss.

**Generation**
- **Eligibility:**
  - min_w=7, min_h=7
  - allowed_room_types=[NORMAL]
  - max_per_level=1
- **Selection rule:** choose one mid-to-late room near boss route but not boss_approach.
- **Layout pass:**
  - Keep center open.
  - Arrange a “binding circle” via decoration ring pattern.
  - Avoid hazards.

**Visual / Atmosphere**
- **Decorations:** ring motif using `◇` and `✦` with deliberate symmetry.
- **Environmental Evidence (choose 1):**
  - “I was appointed by Valdris / by the Seed” (both true) (inscription prop/lore)
  - Two identical pact fragments placed opposite each other
- **Lighting notes:** focused center light (ritual feel).
- **3D overrides:** has_ceiling=true

**Spawns**
- **Enemies:** low density, not empty.
- **Items:** normal.
- **Lore drops:**
  - **Delver pool:** [`dragons_pact`] (higher chance)
  - **Surface/Authority pool:** [`last_kings_testament_excerpt`]
  - Spawn rule: 70–100% chance for 1 lore here.

**Acceptance Criteria**
- [ ] Dual-loyalty/paradox theme is obvious
- [ ] Ring geometry reads as “binding”
- [ ] Lore appears reliably

**Test Seeds:** 18051, 18052

---

## Zone: `boss_approach` — Boss Approach (Dragon Emperor)
**Status:** `[ ]`

**Purpose:**
- Final escalation: the Warden’s patrol logic, throne bones, pact fragments.
- Guarantees trail tells and one pre-boss reveal lore.

**Generation**
- **Eligibility:** 1–3 rooms nearest to boss room center (excluding boss room).
- **Selection rule:** distance from room.center() to boss_room.center(); tag nearest N.
- **Layout pass:** keep walkable; avoid heavy hazards.

**Boss Trail Integration**
- **Trail tells (pick 3):**
  - [ ] Scorch orbit marks (represented by circular decoration arrangement)
  - [ ] Bones arranged like a throne facing the vault (prop cluster)
  - [ ] Pact inscription fragments (“appointed by Valdris / by the Seed”) (lore/prop)
- **Pre-boss reveal:** “Protection and imprisonment are the same role here.”
- **Aftermath hook:** victory choice lore (sleep vs wake) is revealed in the cutscene and summary systems.

**Spawns**
- **Enemies:** moderate; bias toward dragon fragments/guards x1.4 if present.
- **Items:** pre-boss supplies bias (healing).
- **Lore drops:**
  - **Delver pool:** [`delver_note_the_guardian_is_the_lock`]
  - **Surface/Authority pool:** [`last_kings_testament_excerpt`]
  - Spawn rule: guarantee 1 lore drop across boss_approach rooms per level.

**Acceptance Criteria**
- [ ] Dragon presence felt before arena
- [ ] Paradox theme visible via trail tells
- [ ] Boss approach tagging reliable
