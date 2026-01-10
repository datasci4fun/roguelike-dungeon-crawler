# Floor 1 — Stone Dungeon (MEMORY)

**Aspect:** MEMORY (what was locked away)
**Monarchy Anchor:** Keys
**Warden:** Goblin King

---

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

**Test Seeds:** 12345, 67890, 11111

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

**Acceptance Criteria**
- [ ] Elongated room detection works
- [ ] Alcoves don't block main path
- [ ] Sightlines feel long and exposed

**Test Seeds:** TBD

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

**Acceptance Criteria**
- [ ] Exactly 1 per level
- [ ] Key always spawns
- [ ] Lore always spawns
- [ ] Desk doesn't block entrance

**Test Seeds:** TBD

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

**Acceptance Criteria**
- [ ] Pit hazard works (damage on step)
- [ ] Wraith bias visible in spawn distribution
- [ ] Atmosphere feels ominous

**Test Seeds:** TBD

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

**Acceptance Criteria**
- [ ] Shelf layout doesn't create dead ends
- [ ] Lore spawn rate noticeably higher here
- [ ] Plaque props visible

**Test Seeds:** TBD

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

**Acceptance Criteria**
- [ ] Always adjacent to entry stairs
- [ ] Low danger (new player friendly)
- [ ] Tutorial messaging possible here

**Test Seeds:** TBD

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
- **Trail tells:**
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

**Test Seeds:** TBD
