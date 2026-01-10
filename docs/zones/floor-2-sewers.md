# Floor 2 — Sewers of Valdris (CIRCULATION)

**Aspect:** CIRCULATION (what flows between)
**Monarchy Anchor:** Seals
**Warden:** Rat King

---

## Zone: `waste_channels` — Waste Channels
**Status:** `[ ]`

**Purpose:**
- Primary zone. Water flow lanes, movement restrictions. The Field's circulation made visible.

**Generation**
- **Eligibility:** min_w=4, min_h=8 OR min_w=8, min_h=4 (elongated), max_per_level=4
- **Layout pass:** Water tiles in center lane, walkable edges

**Visual / Atmosphere**
- **Decorations:** `~` water, `#` grates, `%` debris
- **Environmental Evidence:** Footprints in sludge that lead into a wall

**Spawns**
- **Enemies:** rats x2.0
- **Lore:** Delver pool [`sewer_worker`]

**Acceptance Criteria**
- [ ] Water lane doesn't block passage
- [ ] Rat spawn bias visible

---

## Zone: `carrier_nests` — Carrier Nests
**Status:** `[ ]`

**Purpose:**
- Rat clustering zones. Bone piles, high danger. Where the colony assembles its "carriers."

**Generation**
- **Eligibility:** min_w=5, min_h=5, max_per_level=3
- **Layout pass:** Bone pile props, nest decorations

**Visual / Atmosphere**
- **Decorations:** `%` bone piles, `~` debris, `.` droppings
- **Environmental Evidence:** Bone arrangements forming patterns

**Spawns**
- **Enemies:** rats x3.0, swarm spawns
- **Lore:** Environmental only

**Acceptance Criteria**
- [ ] High danger zone feels dangerous
- [ ] Bone props visible

---

## Zone: `confluence_chambers` — Confluence Chambers
**Status:** `[ ]`

**Purpose:**
- Wide junction halls. Multiple entrances. Ambush territory.

**Generation**
- **Eligibility:** min_w=8, min_h=8, must have 3+ exits, max_per_level=2
- **Layout pass:** Central water pool, multiple channel inflows

**Visual / Atmosphere**
- **Decorations:** `~` water pool, `#` drain grates
- **Environmental Evidence:** Multiple water sources converging

**Spawns**
- **Enemies:** mixed, Elite chance 25%
- **Lore:** Surface pool [`plague_warning`]

**Acceptance Criteria**
- [ ] Multiple exits work
- [ ] Ambush potential clear

---

## Zone: `maintenance_tunnels` — Maintenance Tunnels
**Status:** `[ ]`

**Purpose:**
- Pipes, grates, worker areas. Human infrastructure before the Field claimed it.

**Generation**
- **Eligibility:** Elongated rooms, max_per_level=2
- **Layout pass:** Pipe props along walls, grate floor tiles

**Visual / Atmosphere**
- **Decorations:** `|` pipes, `#` grates, `=` workbenches
- **Environmental Evidence:** Tools left mid-task

**Spawns**
- **Enemies:** Low (0.5x) — worker ghosts rare
- **Lore:** Delver pool [`sewer_worker`]

**Acceptance Criteria**
- [ ] Infrastructure feel achieved
- [ ] Low danger zone

---

## Zone: `diseased_pools` — Diseased Pools
**Status:** `[ ]`

**Purpose:**
- Poison gas pockets. Hazard zone. The circulation gone wrong.

**Generation**
- **Eligibility:** min_w=5, min_h=5, max_per_level=2
- **Layout pass:** Poison gas tiles (damage over time), pool tiles

**Visual / Atmosphere**
- **Decorations:** `~` toxic pools, `*` gas clouds
- **Lighting:** Green tint

**Spawns**
- **Enemies:** None (hazard focus)
- **Items:** Antidotes x2.0

**Acceptance Criteria**
- [ ] Poison hazard works
- [ ] Avoidable with care

---

## Zone: `seal_drifts` — Seal Drifts
**Status:** `[ ]`

**Purpose:**
- Wax/scroll debris zones. Where decrees wash downstream. Lore-dense.

**Generation**
- **Eligibility:** Any size, max_per_level=2
- **Layout pass:** Debris props, scroll clusters

**Visual / Atmosphere**
- **Decorations:** `~` scrolls, `o` wax seals, `%` debris
- **Environmental Evidence:**
  - Wax seals in rat nests attached to blank parchment
  - Duplicate decree fragments stuck in grate bars

**Spawns**
- **Enemies:** Low
- **Lore:** Surface pool x2.0 (primary lore zone)

**Acceptance Criteria**
- [ ] Lore-dense zone works
- [ ] Seal props visible

---

## Zone: `colony_heart` — The Colony Heart
**Status:** `[ ]`

**Purpose:**
- Anchor room. Boss-adjacent set piece. Where the distributed will converges.

**Generation**
- **Eligibility:** Large room, max_per_level=1
- **Selection:** Near boss room but not boss_approach
- **Layout pass:** Central bone/seal mosaic, offering lines

**Visual / Atmosphere**
- **Decorations:** Bone mosaic floor pattern, offering trails
- **Environmental Evidence:** Bone mosaics shaped like the royal crest

**Spawns**
- **Enemies:** None (atmosphere room)
- **Lore:** Guaranteed 1

**Acceptance Criteria**
- [ ] Anchor room placed correctly
- [ ] Mosaic pattern visible

---

## Zone: `boss_approach` — Boss Approach (Rat King)
**Status:** `[ ]`

**Purpose:**
- Rooms adjacent to Rat King arena. Boss trail props.

**Boss Trail Integration**
- **Trail tells:**
  - [ ] Bone mosaics shaped like the royal crest
  - [ ] "Offering lines" of clutter leading toward lair
  - [ ] Half-chewed decree where only the seal survives

**Acceptance Criteria**
- [ ] Trail props spawn reliably
- [ ] Tension escalation clear
