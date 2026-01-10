# Zone Implementation Tickets

**Source of Truth:** This document defines canonical zone IDs for BSP generation, decoration, spawns, and lore pools.

**Relationship to LORE_COMPENDIUM.md:** The compendium contains evocative in-world flavor. This document contains implementation specs. They may diverge in naming; that's intentional.

**Status Key:**
- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete
- `[!]` Blocked

---

## Canonical Zone IDs by Floor

| Floor | Biome | Aspect | Zone IDs |
|-------|-------|--------|----------|
| 1 | Stone Dungeon | MEMORY | `cell_blocks`, `guard_corridors`, `wardens_office`, `execution_chambers`, `record_vaults`, `intake_hall`, `boss_approach` |
| 2 | Sewers of Valdris | CIRCULATION | `waste_channels`, `carrier_nests`, `confluence_chambers`, `maintenance_tunnels`, `diseased_pools`, `seal_drifts`, `colony_heart`, `boss_approach` |
| 3 | Forest Depths | GROWTH | `root_warrens`, `canopy_halls`, `webbed_gardens`, `the_nursery`, `digestion_chambers`, `druid_ring`, `boss_approach` |
| 4 | Mirror Valdris | LEGITIMACY | `courtyard_squares`, `throne_hall_ruins`, `parade_corridors`, `seal_chambers`, `record_vaults`, `mausoleum_district`, `oath_chambers`, `boss_approach` |
| 5 | Ice Cavern | STASIS | `frozen_galleries`, `ice_tombs`, `crystal_grottos`, `suspended_laboratories`, `breathing_chamber`, `thaw_fault`, `boss_approach` |
| 6 | Ancient Library | COGNITION | `reading_halls`, `forbidden_stacks`, `catalog_chambers`, `indexing_heart`, `experiment_archives`, `marginalia_alcoves`, `boss_approach` |
| 7 | Volcanic Depths | TRANSFORMATION | `forge_halls`, `magma_channels`, `cooling_chambers`, `slag_pits`, `rune_press`, `ash_galleries`, `crucible_heart`, `boss_approach` |
| 8 | Crystal Cave | INTEGRATION | `crystal_gardens`, `geometry_wells`, `seal_chambers`, `dragons_hoard`, `vault_antechamber`, `oath_interface`, `boss_approach` |

---

# Floor 1 — Stone Dungeon (MEMORY)

## Zone: `cell_blocks` — Cell Blocks

**Purpose:**
- Primary zone type for Floor 1. Conveys the prison metaphor that the Field stabilized around. Players should feel confined, surveilled, processed.

**Generation**
- **Eligibility:**
  - min_w=6, min_h=6, max_w=12, max_h=12
  - allowed_room_types=[NORMAL, LARGE]
  - max_per_level=4
- **Selection rule:**
  - Weighted choice (weight=3, highest on floor)
  - Prefer rooms not adjacent to stairs
- **Layout pass:**
  - [x] Interior walls: 2x2 or 2x3 cell partitions along walls, leaving central corridor
  - [x] Doors / bars: Cell doors (locked 30% chance), bar tiles on cell windows
  - [ ] Special tiles: Drainage grates (cosmetic), shackle points
  - [x] Connectivity: Central corridor must connect all entrances

**Visual / Atmosphere**
- **Decorations:**
  - `#` bars (on cell partitions)
  - `~` chains/shackles
  - `%` straw piles
  - `&` bucket props
- **Environmental Evidence props:**
  - Duplicate plaque: same cell number, two prisoner names (1 per cell_blocks zone)
  - Day-scratch tallies that don't match carved dates (wall decoration)
- **Lighting notes:**
  - Darker than corridors; single torch per cell block
- **3D Overrides:**
  - has_ceiling: true
  - skybox_override: None

**Spawns**
- **Enemies:**
  - goblins x1.5, skeletons x1.0, orcs x0.5
  - Elite chance: default (20%)
- **Items:**
  - Keys x1.5 (thematic)
  - Healing x1.0
- **Lore drops:**
  - **Delver pool:** [`journal_adventurer_1`]
  - **Surface/Authority pool:** [`warning_stone`]
  - Spawn rule: 30% chance per zone, max 1 per zone

**Boss Trail Integration**
- N/A (not boss_approach)

**Acceptance Criteria**
- [ ] Zone can be assigned deterministically with seed
- [ ] Layout pass never blocks entrances/exits
- [ ] Visual identity is obvious at a glance (cells visible)
- [ ] Spawn bias works (goblins more common here)
- [ ] Lore spawns occur in correct zones
- [ ] No crashes / invalid tiles / unreachable areas

**Test Seeds**
- Seed(s) to validate: 12345, 67890, 11111
- Notes: Verify cell partitions don't block corridor flow

---

## Zone: `guard_corridors` — Guard Corridors

**Purpose:**
- Long, narrow patrol routes. Creates tension through sightlines. Players hear enemies before seeing them.

**Generation**
- **Eligibility:**
  - min_w=3, min_h=8 OR min_w=8, min_h=3 (elongated)
  - allowed_room_types=[CORRIDOR, NORMAL]
  - max_per_level=3
- **Selection rule:**
  - Weight=2
  - Prefer rooms connecting multiple zones
- **Layout pass:**
  - [ ] Interior walls: None (open corridor)
  - [ ] Alcoves: 1-2 guard alcoves (2x2 recesses) per corridor
  - [ ] Special tiles: Patrol markers (cosmetic floor tiles)
  - [x] Connectivity: Must have 2+ exits

**Visual / Atmosphere**
- **Decorations:**
  - `!` torch sconces (every 4 tiles)
  - `|` weapon racks
  - `=` benches
- **Environmental Evidence props:**
  - Two identical keys in different alcoves ("replacement" tell)
- **Lighting notes:**
  - Well-lit (patrol route)
- **3D Overrides:**
  - has_ceiling: true

**Spawns**
- **Enemies:**
  - goblins x1.0, skeletons x1.5 (guard echoes)
  - Elite chance: 25% (tougher patrols)
- **Items:**
  - Weapons x1.3
- **Lore drops:**
  - **Delver pool:** []
  - **Surface/Authority pool:** [`prison_transfer_order`]
  - Spawn rule: 20% chance, max 1

**Boss Trail Integration**
- N/A

**Acceptance Criteria**
- [ ] Elongated room detection works
- [ ] Alcoves don't block main path
- [ ] Sightlines feel long and exposed

**Test Seeds**
- TBD

---

## Zone: `wardens_office` — Warden's Office

**Purpose:**
- Anchor room. The seat of prison authority—now empty, keys still hanging. Guaranteed lore/item spawn.

**Generation**
- **Eligibility:**
  - min_w=5, min_h=5, max_w=8, max_h=8
  - allowed_room_types=[NORMAL]
  - max_per_level=1 (anchor room)
- **Selection rule:**
  - Promote to anchor status
  - Prefer room near center of level (not adjacent to stairs or boss)
- **Layout pass:**
  - [ ] Interior walls: Desk area (2x3 blocked tiles representing desk)
  - [ ] Shelves: Wall-adjacent shelf tiles
  - [ ] Special tiles: Key stash (guaranteed key spawn point)
  - [x] Connectivity: Single entrance preferred (defensible)

**Visual / Atmosphere**
- **Decorations:**
  - `=` desk
  - `[` `]` shelves
  - `o` key rack
  - `~` papers/scrolls
- **Environmental Evidence props:**
  - Registry with names that shift between reads (implied, not mechanical yet)
- **Lighting notes:**
  - Single central light source
- **3D Overrides:**
  - has_ceiling: true
  - Desk prop (3D model candidate)

**Spawns**
- **Enemies:**
  - Lower spawn rate (0.5x all)
  - Elite chance: 0% (loot room, not combat room)
- **Items:**
  - Keys: guaranteed 1
  - Lore: guaranteed 1
- **Lore drops:**
  - **Delver pool:** [`journal_adventurer_1`]
  - **Surface/Authority pool:** [`prison_transfer_order`, `duplicate_inscription`]
  - Spawn rule: 100% chance, 1 guaranteed

**Boss Trail Integration**
- N/A

**Acceptance Criteria**
- [ ] Exactly 1 per level
- [ ] Key always spawns
- [ ] Lore always spawns
- [ ] Desk doesn't block entrance

**Test Seeds**
- TBD

---

## Zone: `execution_chambers` — Execution Chambers

**Purpose:**
- Dark set piece. Drains, hooks, pit. The Field remembers punishment. High danger, high reward.

**Generation**
- **Eligibility:**
  - min_w=6, min_h=6
  - allowed_room_types=[NORMAL, LARGE]
  - max_per_level=1
- **Selection rule:**
  - Weight=1
  - Prefer rooms far from stairs (deep in level)
- **Layout pass:**
  - [ ] Interior walls: None
  - [ ] Hazards: Central pit (1-2 damage if stepped on), drain grates
  - [ ] Special tiles: Hook tiles (ceiling decoration markers)
  - [x] Connectivity: 1-2 exits

**Visual / Atmosphere**
- **Decorations:**
  - `v` hooks (ceiling)
  - `O` pit/drain
  - `~` bloodstains (floor)
  - `#` grate
- **Environmental Evidence props:**
  - Execution log with dates that don't match (surface doc style)
- **Lighting notes:**
  - Very dark, single dim light
- **3D Overrides:**
  - has_ceiling: true
  - Pit model (depth effect)

**Spawns**
- **Enemies:**
  - wraiths x2.0 (execution echoes)
  - Elite chance: 30%
- **Items:**
  - Rare loot x1.5
- **Lore drops:**
  - **Delver pool:** []
  - **Surface/Authority pool:** [`execution_log`]
  - Spawn rule: 40% chance

**Boss Trail Integration**
- N/A

**Acceptance Criteria**
- [ ] Pit hazard works (damage on step)
- [ ] Wraith bias visible in spawn distribution
- [ ] Atmosphere feels ominous

**Test Seeds**
- TBD

---

## Zone: `record_vaults` — Record Vaults

**Purpose:**
- Lore-dense zone. Shelves, plaques, "missing names." Primary surface document spawn location.

**Generation**
- **Eligibility:**
  - min_w=5, min_h=5
  - allowed_room_types=[NORMAL]
  - max_per_level=2
- **Selection rule:**
  - Weight=1.5
  - Bias toward rooms with single entrance (vault feel)
- **Layout pass:**
  - [ ] Interior walls: Shelf rows (1-tile wide, 3-4 tiles long)
  - [ ] Special tiles: Plaque tiles (wall markers)
  - [x] Connectivity: Narrow entrance corridor if possible

**Visual / Atmosphere**
- **Decorations:**
  - `[` `]` shelves
  - `~` scrolls
  - `=` plaque
- **Environmental Evidence props:**
  - Duplicate plaque: same room name, two monarchs (guaranteed)
  - Missing name slots on registry boards
- **Lighting notes:**
  - Dim, dusty atmosphere
- **3D Overrides:**
  - has_ceiling: true
  - Shelf props

**Spawns**
- **Enemies:**
  - skeletons x1.5 (record keepers)
  - Low overall spawn rate (0.7x)
- **Items:**
  - Lore x3.0 (primary lore zone)
  - Scrolls x2.0
- **Lore drops:**
  - **Delver pool:** [`journal_adventurer_1`]
  - **Surface/Authority pool:** [`warning_stone`, `duplicate_inscription`, `prison_transfer_order`]
  - Spawn rule: 60% chance, max 2 per zone

**Boss Trail Integration**
- N/A

**Acceptance Criteria**
- [ ] Shelf layout doesn't create dead ends
- [ ] Lore spawn rate noticeably higher here
- [ ] Plaque props visible

**Test Seeds**
- TBD

---

## Zone: `intake_hall` — Intake Hall

**Purpose:**
- Near stairs. "Orientation" room for new prisoners (and new players). Tutorial-friendly zone.

**Generation**
- **Eligibility:**
  - min_w=5, min_h=5
  - allowed_room_types=[NORMAL]
  - max_per_level=1
- **Selection rule:**
  - **Must be adjacent to entry stairs**
  - Promote to anchor status
- **Layout pass:**
  - [ ] Interior walls: Processing desk area
  - [ ] Special tiles: Sign tiles (tutorial markers)
  - [x] Connectivity: Must connect to stairs

**Visual / Atmosphere**
- **Decorations:**
  - `=` desk/counter
  - `!` sign posts
  - `o` key hook (empty)
- **Environmental Evidence props:**
  - Intake form with your name... and another name crossed out
- **Lighting notes:**
  - Well-lit (entry point)
- **3D Overrides:**
  - has_ceiling: true

**Spawns**
- **Enemies:**
  - Very low (0.3x all) — tutorial safety
  - Elite chance: 0%
- **Items:**
  - Basic items guaranteed (tutorial loot)
- **Lore drops:**
  - **Delver pool:** [`journal_adventurer_1`]
  - **Surface/Authority pool:** []
  - Spawn rule: 50% chance

**Boss Trail Integration**
- N/A

**Acceptance Criteria**
- [ ] Always adjacent to entry stairs
- [ ] Low danger (new player friendly)
- [ ] Tutorial messaging possible here

**Test Seeds**
- TBD

---

## Zone: `boss_approach` — Boss Approach (Threshold Corridors)

**Purpose:**
- Rooms adjacent to Goblin King arena. Boss trail props. Tension escalation before boss fight.

**Generation**
- **Eligibility:**
  - Any room directly adjacent to boss room
  - max_per_level=2-3 (depends on boss room connectivity)
- **Selection rule:**
  - **Automatic assignment** for rooms adjacent to boss
- **Layout pass:**
  - [ ] Interior walls: None (open approach)
  - [ ] Special tiles: Trail prop markers
  - [x] Connectivity: Must connect to boss room

**Visual / Atmosphere**
- **Decorations:**
  - Crown made from wax seals + chain links (floor prop)
  - Braziers arranged like seal sigil circle
  - Key ring decoration (keys that open nothing)
- **Environmental Evidence props:**
  - Warden's final log: "The keys... he took all the keys"
- **Lighting notes:**
  - Flickering, unstable
- **3D Overrides:**
  - Brazier glow effects

**Spawns**
- **Enemies:**
  - goblins x2.0 (king's guards)
  - Elite chance: 35%
- **Items:**
  - Pre-boss supplies (healing)
- **Lore drops:**
  - **Delver pool:** []
  - **Surface/Authority pool:** [`boss_approach_warning`]
  - Spawn rule: 30% chance

**Boss Trail Integration**
- **Trail tells (pick 3):**
  - [x] Crown made from official wax seals + chain links
  - [x] Braziers arranged like a seal sigil circle
  - [x] "Key ring" decoration near lair (keys that open nothing)
- **Pre-boss "reveal" artifact:** Warden's final order (lore pickup)
- **Aftermath hook:** Keys now work on previously locked cells (optional)

**Acceptance Criteria**
- [ ] Always assigned to boss-adjacent rooms
- [ ] Trail props reliably spawn
- [ ] Tension feels elevated
- [ ] Boss door/entrance visible from here

**Test Seeds**
- TBD

---

# Floor 2 — Sewers of Valdris (CIRCULATION)

## Zone: `waste_channels` — Waste Channels
**Status:** `[ ]` Skeleton ticket

**Purpose:**
- Primary zone. Water flow lanes, movement restrictions. The Field's circulation made visible.

**Generation**
- **Eligibility:** min_w=4, min_h=8 OR min_w=8, min_h=4, max_per_level=4
- **Layout pass:** Water tiles in center lane, walkable edges

**Spawns**
- Enemies: rats x2.0
- Lore: Delver pool [`sewer_worker`]

---

## Zone: `carrier_nests` — Carrier Nests
**Status:** `[ ]` Skeleton ticket

**Purpose:**
- Rat clustering zones. Bone piles, high danger. Where the colony assembles its "carriers."

**Generation**
- **Eligibility:** min_w=5, min_h=5, max_per_level=3
- **Layout pass:** Bone pile props, nest decorations

**Spawns**
- Enemies: rats x3.0, swarm spawns
- Lore: Environmental only (bone arrangements)

---

## Zone: `confluence_chambers` — Confluence Chambers
**Status:** `[ ]` Skeleton ticket

**Purpose:**
- Wide junction halls. Multiple entrances. Ambush territory.

**Generation**
- **Eligibility:** min_w=8, min_h=8, must have 3+ exits, max_per_level=2
- **Layout pass:** Central water pool, multiple channel inflows

**Spawns**
- Enemies: mixed, Elite chance 25%
- Lore: Surface pool [`plague_warning`]

---

## Zone: `maintenance_tunnels` — Maintenance Tunnels
**Status:** `[ ]` Skeleton ticket

**Purpose:**
- Pipes, grates, worker areas. Human infrastructure before the Field claimed it.

**Generation**
- **Eligibility:** Elongated rooms, max_per_level=2
- **Layout pass:** Pipe props along walls, grate floor tiles

**Spawns**
- Enemies: Low (0.5x) — worker ghosts rare
- Lore: Delver pool [`sewer_worker`]

---

## Zone: `diseased_pools` — Diseased Pools
**Status:** `[ ]` Skeleton ticket

**Purpose:**
- Poison gas pockets. Hazard zone. The circulation gone wrong.

**Generation**
- **Eligibility:** min_w=5, min_h=5, max_per_level=2
- **Layout pass:** Poison gas tiles (damage over time), pool tiles

**Spawns**
- Enemies: None (hazard focus)
- Items: Antidotes x2.0

---

## Zone: `seal_drifts` — Seal Drifts
**Status:** `[ ]` Skeleton ticket

**Purpose:**
- Wax/scroll debris zones. Where decrees wash downstream. Lore-dense.

**Generation**
- **Eligibility:** Any size, max_per_level=2
- **Layout pass:** Debris props, scroll clusters

**Spawns**
- Enemies: Low
- Lore: Surface pool x2.0 (primary lore zone for Floor 2)

**Environmental Evidence:**
- Wax seals in rat nests attached to blank parchment
- Duplicate decree fragments stuck in grate bars

---

## Zone: `colony_heart` — The Colony Heart
**Status:** `[ ]` Skeleton ticket

**Purpose:**
- Anchor room. Boss-adjacent set piece. Where the distributed will converges.

**Generation**
- **Eligibility:** Large room, max_per_level=1
- **Selection:** Near boss room but not boss_approach
- **Layout pass:** Central bone/seal mosaic, offering lines

**Spawns**
- Enemies: None (atmosphere room)
- Lore: Guaranteed 1

**Environmental Evidence:**
- Bone mosaics shaped like the royal crest

---

## Zone: `boss_approach` — Boss Approach (Rat King)
**Status:** `[ ]` Skeleton ticket

**Boss Trail:**
- Bone mosaics shaped like the royal crest
- "Offering lines" of clutter leading toward lair
- Half-chewed decree where only the seal survives

---

# Floor 3 — Forest Depths (GROWTH)

## Zone: `root_warrens` — Root Warrens
**Status:** `[ ]` Skeleton ticket
- Branchy corridors, chokepoints
- Enemies: spiders x1.5

## Zone: `canopy_halls` — Canopy Halls
**Status:** `[ ]` Skeleton ticket
- Taller rooms, skybox candidate (later)
- 3D Override: has_ceiling=false (eventually)

## Zone: `webbed_gardens` — Webbed Gardens
**Status:** `[ ]` Skeleton ticket
- Sticky traps (slow tiles), loot cocoons
- Items: Trapped loot (web interaction)

## Zone: `the_nursery` — The Nursery
**Status:** `[ ]` Skeleton ticket
- Dense spawns, egg/cocoon props
- Enemies: x2.0 all spider types

## Zone: `digestion_chambers` — Digestion Chambers
**Status:** `[ ]` Skeleton ticket
- Hazard pockets, "consumption" theme
- Hazard: Acid pools

## Zone: `druid_ring` — Druid Ring
**Status:** `[ ]` Skeleton ticket
- Ritual circle room, anchor
- Lore: Druid's Log guaranteed

## Zone: `boss_approach` — Boss Approach (Spider Queen)
**Status:** `[ ]` Skeleton ticket
- Cocooned packs in ring formation
- Royal signet ring in webbing
- "Pruned" corridor with punctuation-mark webs

---

# Floor 4 — Mirror Valdris (LEGITIMACY)

## Zone: `courtyard_squares` — Courtyard Squares
**Status:** `[ ]` Skeleton ticket
- Open-ceiling candidate, skybox candidate
- 3D Override: has_ceiling=false, skybox="counterfeit_sky"

## Zone: `throne_hall_ruins` — Throne Hall Ruins
**Status:** `[ ]` Skeleton ticket
- Large hall anchor, throne prop
- Lore: Guaranteed surface doc

## Zone: `parade_corridors` — Parade Corridors
**Status:** `[ ]` Skeleton ticket
- Banners, symmetry enforcement
- Decorations: Banner props every N tiles

## Zone: `seal_chambers` — Seal Chambers
**Status:** `[ ]` Skeleton ticket
- Wax pools, stamp tables
- Lore: Surface pool primary

## Zone: `record_vaults` — Record Vaults
**Status:** `[ ]` Skeleton ticket
- Ledgers, plaques (same template as Floor 1)
- Lore: Regent's Ledger, Succession Decrees

## Zone: `mausoleum_district` — Mausoleum District
**Status:** `[ ]` Skeleton ticket
- Crypt sub-zone, tomb rows
- Enemies: skeletons x2.0, oath-bound dead

## Zone: `oath_chambers` — Oath Chambers
**Status:** `[ ]` Skeleton ticket
- Oathstones, vow inscriptions
- Lore: Priest's Confession

## Zone: `boss_approach` — Boss Approach (Regent)
**Status:** `[ ]` Skeleton ticket
- Ink-stained desks with identical entries
- Oath-bound dead as honor guard
- Stamp blocks / wax puddles

---

# Floor 5 — Ice Cavern (STASIS)

## Zone: `frozen_galleries` — Frozen Galleries
**Status:** `[ ]` Skeleton ticket
- Slippery lanes (ice movement)
- Hazard: Ice tiles (slide)

## Zone: `ice_tombs` — Ice Tombs
**Status:** `[ ]` Skeleton ticket
- Frozen bodies, "breathing" props
- Decorations: Frozen figure props

## Zone: `crystal_grottos` — Crystal Grottos
**Status:** `[ ]` Skeleton ticket
- Sparkle pockets, light refraction
- 3D: Crystal geometry, light effects

## Zone: `suspended_laboratories` — Suspended Laboratories
**Status:** `[ ]` Skeleton ticket
- Tools frozen mid-use
- Lore: Frozen Explorer's Journal

## Zone: `breathing_chamber` — The Breathing Chamber
**Status:** `[ ]` Skeleton ticket
- Fog room, giant breath motif
- Boss-adjacent anchor

## Zone: `thaw_fault` — Thaw Fault
**Status:** `[ ]` Skeleton ticket
- "Never-completing thaw" clues
- Environmental: Ice that looks like it's melting but isn't

## Zone: `boss_approach` — Boss Approach (Frost Giant)
**Status:** `[ ]` Skeleton ticket
- Giant chain links in ice ritual circle
- Breath fog drifting against airflow
- Ice growing over doors you just opened

---

# Floor 6 — Ancient Library (COGNITION)

## Zone: `reading_halls` — Reading Halls
**Status:** `[ ]` Skeleton ticket
- Tables, quiet spaces
- Low enemy density

## Zone: `forbidden_stacks` — Forbidden Stacks
**Status:** `[ ]` Skeleton ticket
- Tight corridors, shelf partitions
- Enemies: wraiths x1.5

## Zone: `catalog_chambers` — Catalog Chambers
**Status:** `[ ]` Skeleton ticket
- Index tables, card drawers
- Lore: Surface docs primary

## Zone: `indexing_heart` — The Indexing Heart
**Status:** `[ ]` Skeleton ticket
- Anchor room, self-ordering effect
- Environmental: Books that "move"

## Zone: `experiment_archives` — Experiment Archives
**Status:** `[ ]` Skeleton ticket
- Burn marks, diagrams
- Lore: Arcane Research Notes

## Zone: `marginalia_alcoves` — Marginalia Alcoves
**Status:** `[ ]` Skeleton ticket
- Small pocket rooms for hints
- Lore: High density, short texts

## Zone: `boss_approach` — Boss Approach (Arcane Keeper)
**Status:** `[ ]` Skeleton ticket
- Pages pinned to walls (same sentence, varied order)
- Mirror-like tile cluster
- Door labeled "There was no Door"

---

# Floor 7 — Volcanic Depths (TRANSFORMATION)

## Zone: `forge_halls` — Forge Halls
**Status:** `[ ]` Skeleton ticket
- Hammer marks, anvils
- Decorations: Anvil props, tool racks

## Zone: `magma_channels` — Magma Channels
**Status:** `[ ]` Skeleton ticket
- Lava lanes (damage hazard)
- Hazard: Lava tiles

## Zone: `cooling_chambers` — Cooling Chambers
**Status:** `[ ]` Skeleton ticket
- Steam vents, transitional rooms
- Hazard: Steam (periodic damage)

## Zone: `slag_pits` — Slag Pits
**Status:** `[ ]` Skeleton ticket
- Hazard pockets
- Items: Rare metals x1.5

## Zone: `rune_press` — Rune Press
**Status:** `[ ]` Skeleton ticket
- Stamp plates, imprint motif
- Lore: Master Smith's Final Record

## Zone: `ash_galleries` — Ash Galleries
**Status:** `[ ]` Skeleton ticket
- Low visibility, soot
- Visual: Reduced view range

## Zone: `crucible_heart` — The Crucible Heart
**Status:** `[ ]` Skeleton ticket
- Anchor room, boss-adjacent
- Central forge set piece

## Zone: `boss_approach` — Boss Approach (Flame Lord)
**Status:** `[ ]` Skeleton ticket
- Melted weapons embedded in walls
- Rune plates stamped into stone
- Ash spirals pointing toward arena

---

# Floor 8 — Crystal Cave (INTEGRATION)

## Zone: `crystal_gardens` — Crystal Gardens
**Status:** `[ ]` Skeleton ticket
- Refraction decor
- 3D: Crystal geometry, light splitting

## Zone: `geometry_wells` — Geometry Wells
**Status:** `[ ]` Skeleton ticket
- Patterned floors, "lattice nodes"
- Environmental: Repeating sigil geometry

## Zone: `seal_chambers` — Seal Chambers
**Status:** `[ ]` Skeleton ticket
- Sigil ring rooms
- Lore: Pact fragments

## Zone: `dragons_hoard` — The Dragon's Hoard
**Status:** `[ ]` Skeleton ticket
- Loot anchor
- Items: Legendary loot pool

## Zone: `vault_antechamber` — Vault Antechamber
**Status:** `[ ]` Skeleton ticket
- Pre-boss staging
- Lore: Last King's Testament

## Zone: `oath_interface` — Oath Interface
**Status:** `[ ]` Skeleton ticket
- Pact inscriptions
- Environmental: "I was appointed by Valdris / by the Seed"

## Zone: `boss_approach` — Boss Approach (Dragon Emperor)
**Status:** `[ ]` Skeleton ticket
- Scorch orbit marks (patrol ring)
- Bones arranged like throne facing vault
- Pact inscription fragments

---

# Implementation Notes

## Priority Order
1. **Floor 1 complete** — Reference implementation
2. **boss_approach (all floors)** — Boss trail system
3. **Hazard zones** — diseased_pools, lava tiles, ice movement
4. **Anchor rooms** — One per floor guaranteed
5. **Remaining zones** — Fill in by floor order

## Shared Systems Needed
- [ ] Zone assignment algorithm (BSP post-process)
- [ ] Decoration spawner (per-zone decoration pools)
- [ ] Lore pool selector (per-zone bias)
- [ ] Hazard tile system (damage, movement effects)
- [ ] Environmental evidence props (duplicate plaque generator)
- [ ] Boss trail prop system

## Test Strategy
- Seed-based determinism for all zone assignments
- Visual spot-check: zone identity obvious at glance
- Spawn distribution tests: 100 runs, count enemy types per zone
- Lore spawn tests: 10 runs, verify lore appears in correct zones
