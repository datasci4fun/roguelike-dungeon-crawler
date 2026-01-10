# Floor 2 — Sewers of Valdris (CIRCULATION)

**Aspect:** CIRCULATION (what flows between)
**Monarchy Anchor:** Seals (decrees carried/duplicated downstream)
**Warden:** Rat King

---

## Zone: `waste_channels` — Waste Channels
**Status:** `[ ]`

**Purpose:**
- Primary movement language for the floor: channels, crossings, directionality.
- Establishes “circulation” as a system—routes are shaped by flow, not by architecture.

**Generation**
- **Eligibility:** elongated rooms preferred.
  - min_w=4, min_h=8 OR min_w=8, min_h=4
  - allowed_room_types=[NORMAL, LARGE_HALL]
  - max_per_level=4
- **Selection rule:** prefer rooms that touch 2+ corridors (junction-y), or long thin leaves from BSP.
- **Layout pass:**
  - Paint a channel lane of `DEEP_WATER (≈)` through the room (center or offset).
  - Ensure at least one continuous `FLOOR (.)` walkway from every door connection.
  - Optional: add 1–2 narrow crossing points (single-tile bridges) that are always safe.

**Visual / Atmosphere**
- **Decorations:** use theme decorations (`○`, `=`) for pipes/grates clustered along channel edges.
- **Environmental Evidence (choose 1):**
  - Footprints in sludge that lead into a wall
  - A wax seal stuck to a grate with no parchment
  - Duplicate maintenance marker: same location, different year
- **Lighting notes:** slightly dim; crossings get 1 light source so players read safe path.

**Spawns**
- **Enemies:** rats bias x2.0 (prefer small packs).
- **Items:** normal.
- **Lore drops:**
  - **Delver pool:** [`sewer_worker_note`, `delver_route_sketch`]
  - **Surface/Authority pool:** [`condemnation_notice_which_crown`, `duplicate_decree_fragment`]
  - Spawn rule: 15–25% chance in this zone; max 1 lore drop per room.

**Acceptance Criteria**
- [ ] Water lane never blocks all entrances
- [ ] Walkway connectivity preserved
- [ ] Rat spawn bias is noticeable

---

## Zone: `carrier_nests` — Carrier Nests
**Status:** `[ ]`

**Purpose:**
- High-activity “rat logistics” rooms: the colony’s presence is undeniable.
- Reinforces the Warden concept: distributed will, not random vermin.

**Generation**
- **Eligibility:**
  - min_w=5, min_h=5
  - allowed_room_types=[NORMAL]
  - max_per_level=3
- **Selection rule:** prefer dead-ends / leaf rooms (end-of-corridor feel). Avoid stairs room.
- **Layout pass:**
  - Heavy decoration density (trash, bones, pipes).
  - Optional: create 1–2 “channels” of `DEEP_WATER (≈)` at edges (not central).
  - Keep center walkable for fights.

**Visual / Atmosphere**
- **Decorations:** dense clusters of sewer theme props (`○`, `=`) + any generic clutter props your renderer supports.
- **Environmental Evidence (choose 1–2):**
  - Wax seals in nests attached to blank parchment
  - Bone piles arranged like a royal crest (roughly)
  - A strip of decree parchment used as bedding (prop near pile)
- **Lighting notes:** pockets of darkness; one dim “nest core” light.

**Spawns**
- **Enemies:** rats bias x3.0, allow swarm-like groups; elite chance normal (don’t spike too early).
- **Items:** low-to-normal; occasional consumable.
- **Lore drops:**
  - **Delver pool:** [`sewer_worker_note`, `delver_last_words_smear`]
  - **Surface/Authority pool:** [`blank_sealed_parchment`, `health_warden_warning`]
  - Spawn rule: 35–50% chance here; max 1 lore per room.

**Acceptance Criteria**
- [ ] Reads instantly as “nest/colony activity”
- [ ] High pressure without unfair softlocks
- [ ] Decoration does not block movement

---

## Zone: `confluence_chambers` — Confluence Chambers
**Status:** `[ ]`

**Purpose:**
- Landmark junction rooms where multiple flows meet.
- Fair, readable combat spaces (contrast to cramped tunnels).

**Generation**
- **Eligibility:**
  - min_w=8, min_h=8
  - allowed_room_types=[LARGE_HALL, NORMAL]
  - max_per_level=2
- **Selection rule:** prefer rooms with 3+ corridor connections when possible.
- **Layout pass:**
  - Keep mostly open floor.
  - Optional: place 1 corner pool of `DEEP_WATER (≈)` or `POISON_GAS (!)` (small).
  - Ensure entrances remain clear.

**Visual / Atmosphere**
- **Decorations:** symmetric grate/pipe placements to read “junction.”
- **Environmental Evidence (choose 1):**
  - Two identical markers, different dates
  - A decree fragment pinned under a grate
  - Footprints that stop at the seam line
- **Lighting notes:** slightly brighter than most rooms (navigation landmark).

**Spawns**
- **Enemies:** mixed packs; do NOT increase elite chance above global yet (keep 20% baseline).
- **Items:** small chance of extra loot; good place for keys later.
- **Lore drops:**
  - **Delver pool:** [`delver_warning_which_crown`, `delver_route_sketch`]
  - **Surface/Authority pool:** [`duplicate_decree_fragment`, `royal_clerk_memo_excerpt`]
  - Spawn rule: 20–30% chance; max 1 lore here.

**Acceptance Criteria**
- [ ] Multiple entrances remain usable
- [ ] Feels like a recognizable landmark
- [ ] Doesn’t become cluttered/unreadable

---

## Zone: `maintenance_tunnels` — Maintenance Tunnels
**Status:** `[ ]`

**Purpose:**
- The “human-built” seam inside circulation: pipes, condemned signage, access panels.
- Great future home for lock/key systems without adding new floors.

**Generation**
- **Eligibility:** elongated rooms preferred.
  - min_w=4, min_h=8 OR min_w=8, min_h=4
  - allowed_room_types=[NORMAL]
  - max_per_level=2
- **Selection rule:** prefer corridor-heavy regions; avoid boss approach cluster.
- **Layout pass:**
  - Add thin interior partitions as `WALL (#)` lines to suggest pipe runs (leave 2-tile walkways).
  - Optional: 1 small “closet” alcove that could later become a locked room (for now, open).

**Visual / Atmosphere**
- **Decorations:** pipe/grate heavy (`○`, `=`). Minimal debris.
- **Environmental Evidence (choose 1):**
  - Tools left mid-task (prop cluster)
  - Condemned notice fragment
  - Seal stamped on blank paper in a tool tray
- **Lighting notes:** slightly brighter than nests (readability).

**Spawns**
- **Enemies:** low-to-normal density (not empty).
- **Items:** slight bias toward utility/consumables.
- **Lore drops:**
  - **Delver pool:** [`delver_note_follow_the_pipes`]
  - **Surface/Authority pool:** [`condemnation_notice_which_crown`]
  - Spawn rule: 10–20% chance; max 1 lore.

**Acceptance Criteria**
- [ ] Feels “constructed” vs organic
- [ ] Partitions don’t block entrances
- [ ] Still has some threat (not a free hallway)

---

## Zone: `diseased_pools` — Diseased Pools
**Status:** `[ ]`

**Purpose:**
- Hazard pocket: circulation turned toxic.
- Introduces poison gas + stagnant water as a tactical constraint.

**Generation**
- **Eligibility:**
  - min_w=5, min_h=5
  - allowed_room_types=[NORMAL]
  - max_per_level=2
- **Selection rule:** avoid placing on the only critical path if possible (but okay if walkways exist).
- **Layout pass:**
  - Place `POISON_GAS (!)`: patchy clusters (not full-room).
  - Optional: small `DEEP_WATER (≈)` corner pool.
  - Guarantee a safe route from each entrance (at least 2 tiles wide).

**Visual / Atmosphere**
- **Decorations:** minimal; let hazard tiles read. Add 1–2 grates (`=`) near gas.
- **Environmental Evidence (choose 1):**
  - Footprints entering gas and not leaving
  - A wax seal dissolved into mush but still readable (prop)
  - A quarantine marker posted twice (duplicate)
- **Lighting notes:** dim; no explicit “green tint” requirement for now.

**Spawns**
- **Enemies:** low density (not none). Prefer poison-resistant enemies if you have them; otherwise keep small packs.
- **Items:** slight bias to healing (potions) rather than “antidotes” (unless antidote exists).
- **Lore drops:**
  - **Delver pool:** [`delver_warning_dont_breathe`]
  - **Surface/Authority pool:** [`sewer_quarantine_order`]
  - Spawn rule: 10–20%; max 1 lore.

**Acceptance Criteria**
- [ ] Hazards are avoidable with careful movement
- [ ] No unavoidable damage rooms
- [ ] Safe path exists from every entrance

---

## Zone: `seal_drifts` — Seal Drifts
**Status:** `[ ]`

**Purpose:**
- The monarchy anchor made physical: wax, parchment, contradictory decrees.
- Primary “surface-doc” lore zone for Floor 2.

**Generation**
- **Eligibility:** any room size; allowed_room_types=[NORMAL, LARGE_HALL]; max_per_level=2
- **Selection rule:** prefer rooms near confluence OR near exit/boss route (accumulation zones).
- **Layout pass:**
  - Keep room open and readable (avoid hazards).
  - Place a “drift” of document props along one side (decoration cluster).
  - Optional: 1 corner table-like cluster for “seal station” (decorations only).

**Visual / Atmosphere**
- **Decorations:** fewer pipes, more “paperwork debris” representation (use any scroll/book props you have; otherwise use themed decorations and treat as abstract).
- **Environmental Evidence (choose 1–2):**
  - Wax seals attached to blank parchment
  - Duplicate decree fragments wedged in grates
  - Pages where words fade but the signature remains
- **Lighting notes:** slightly brighter (reading zone).

**Spawns**
- **Enemies:** low.
- **Items:** bias toward lore (surface documents).
- **Lore drops:**
  - **Delver pool:** [`delver_note_the_seals_keep_moving`]
  - **Surface/Authority pool:** [`duplicate_decree_fragment`, `condemnation_notice_which_crown`, `blank_sealed_parchment`]
  - Spawn rule: 60–80% chance; allow up to **2** lore drops here (rare exception).

**Acceptance Criteria**
- [ ] Reads instantly as “paperwork drift”
- [ ] Surface-doc lore spawns reliably here
- [ ] Does not clutter combat-critical paths

---

## Zone: `colony_heart` — The Colony Heart (Anchor)
**Status:** `[ ]`

**Purpose:**
- Boss-adjacent set piece: where the distributed will becomes visible as one system.
- This is the “proof room” that rats are logistics, not random.

**Generation**
- **Eligibility:** choose 1 anchor room; prefer LARGE_HALL or largest NORMAL not containing stairs; max_per_level=1
- **Selection rule:** prefer rooms closer to boss room but not necessarily `boss_approach` itself (pre-arena set piece).
- **Layout pass:**
  - Central “mound” of debris (decorations only).
  - Optional: ring of shallow hazard (small `DEEP_WATER`) with 1–2 crossings.
  - Ensure center remains walkable.

**Visual / Atmosphere**
- **Decorations:** heavy density; create a crest-like arrangement (even crude) using clutter.
- **Environmental Evidence (choose 1):**
  - Bone mosaics shaped like the royal crest
  - Blank decrees waiting for words
  - Person-shaped outline assembled from mismatched items
- **Lighting notes:** dim halo around mound.

**Spawns**
- **Enemies:** low-to-medium (not none). It should be tense, not empty.
- **Items:** guarantee 1 lore drop (delver or surface).
- **Lore drops:**
  - **Delver pool:** [`delver_last_words_smear`, `delver_note_they_build_people`]
  - **Surface/Authority pool:** [`health_warden_warning`, `confiscation_receipt`]
  - Spawn rule: guarantee exactly 1 lore drop in this zone.

**Acceptance Criteria**
- [ ] Feels like a set-piece anchor room
- [ ] Crest/seal evidence visible
- [ ] Doesn’t become a free safe room

---

## Zone: `boss_approach` — Boss Approach (Rat King)
**Status:** `[ ]`

**Purpose:**
- Boss trail rooms adjacent to the boss arena.
- Guarantees consistent pacing: the dungeon “tightens” and points inward.

**Generation**
- **Eligibility:** 1–3 rooms closest to boss room center; allowed_room_types=[NORMAL, LARGE_HALL]
- **Selection rule:** compute room-center distance to boss room center; tag nearest N as boss_approach.
- **Layout pass:**
  - Keep walkable and readable.
  - Avoid heavy hazard placement here.
  - Place “procession” decoration lines pointing toward arena.

**Boss Trail Integration**
- **Trail tells:**
  - [ ] Bone/debris arranged like a royal crest
  - [ ] Wax seals with no documents
  - [ ] Half-chewed decree where only the seal survives
- **Pre-boss reveal text:** “Rats carry decrees; decrees carry edits.” (short plaque/scroll)
- **Aftermath hook:** optional future—boss route rooms feel emptier post-win.

**Spawns**
- **Enemies:** rats bias x2.0; reduce unrelated spawns.
- **Items:** avoid clutter; guarantee 1 pre-boss lore across boss_approach rooms (not each).
- **Lore drops:**
  - **Delver pool:** [`delver_warning_they_are_organized`]
  - **Surface/Authority pool:** [`condemnation_notice_which_crown`]

**Acceptance Criteria**
- [ ] Boss approach tagging reliable
- [ ] Trail props spawn consistently
- [ ] Tension escalation is readable
