# Floor 3 — Forest Depths (GROWTH)

**Aspect:** GROWTH (what consumes boundaries)
**Monarchy Anchor:** Family Trees / Genealogy
**Warden:** Spider Queen

---

## Zone: `root_warrens` — Root Warrens
**Status:** `[ ]`

**Purpose:**
- Branchy corridors, chokepoints. The forest's grip on architecture.

**Generation**
- **Eligibility:** Elongated or irregular rooms, max_per_level=4
- **Layout pass:** Root props creating narrow passages, organic wall shapes

**Visual / Atmosphere**
- **Decorations:** `%` roots, `|` vines, `.` soil patches
- **Environmental Evidence:** Roots avoid a crown-shaped stone patch

**Spawns**
- **Enemies:** spiders x1.5
- **Lore:** Environmental only

**Acceptance Criteria**
- [ ] Chokepoints create tactical decisions
- [ ] Organic feel achieved

---

## Zone: `canopy_halls` — Canopy Halls
**Status:** `[ ]`

**Purpose:**
- Taller rooms, eventual skybox candidate. The forest reaching upward.

**Generation**
- **Eligibility:** min_w=6, min_h=6, max_per_level=2
- **Layout pass:** Pillar-like tree props, open central space

**Visual / Atmosphere**
- **Decorations:** `|` tree trunks, `^` canopy hints
- **3D Override:** has_ceiling=false (future), skybox="forest_canopy"

**Spawns**
- **Enemies:** Mixed, flying types if any
- **Lore:** Delver pool [`druid_log`]

**Acceptance Criteria**
- [ ] Vertical feel conveyed
- [ ] Tree props placed well

---

## Zone: `webbed_gardens` — Webbed Gardens
**Status:** `[ ]`

**Purpose:**
- Sticky traps (slow tiles), loot cocoons. The Spider Queen's larder.

**Generation**
- **Eligibility:** min_w=5, min_h=5, max_per_level=3
- **Layout pass:** Web tiles (movement penalty), cocoon props

**Visual / Atmosphere**
- **Decorations:** `#` webs, `O` cocoons, `~` silk strands
- **Environmental Evidence:** Web patterns forming the same sigil geometry

**Spawns**
- **Enemies:** spiders x2.0
- **Items:** Trapped loot in cocoons (web interaction)

**Acceptance Criteria**
- [ ] Slow tiles work
- [ ] Cocoon loot retrievable

---

## Zone: `the_nursery` — The Nursery
**Status:** `[ ]`

**Purpose:**
- Dense spawns, egg/cocoon props. Where new patterns gestate.

**Generation**
- **Eligibility:** min_w=6, min_h=6, max_per_level=1
- **Layout pass:** Egg cluster props, cocoon walls

**Visual / Atmosphere**
- **Decorations:** `o` eggs, `O` large cocoons, `~` silk
- **Lighting:** Dim, organic glow

**Spawns**
- **Enemies:** x2.0 all spider types, hatchling swarms
- **Lore:** Environmental only

**Acceptance Criteria**
- [ ] High danger zone
- [ ] Egg props menacing

---

## Zone: `digestion_chambers` — Digestion Chambers
**Status:** `[ ]`

**Purpose:**
- Hazard pockets, "consumption" theme. Where the forest breaks down intruders.

**Generation**
- **Eligibility:** min_w=5, min_h=5, max_per_level=2
- **Layout pass:** Acid pool tiles, dissolving props

**Visual / Atmosphere**
- **Decorations:** `~` acid pools, `%` partially dissolved items
- **Hazard:** Acid tiles (damage over time)

**Spawns**
- **Enemies:** Low (hazard focus)
- **Items:** Rare drops (risk/reward)

**Acceptance Criteria**
- [ ] Acid hazard works
- [ ] Consumption theme clear

---

## Zone: `druid_ring` — Druid Ring
**Status:** `[ ]`

**Purpose:**
- Ritual circle room, anchor. Where the druid made her last stand.

**Generation**
- **Eligibility:** Roughly circular or square, max_per_level=1
- **Layout pass:** Stone circle in center, standing stones

**Visual / Atmosphere**
- **Decorations:** `O` standing stones, `.` ritual circle floor
- **Environmental Evidence:** Stone arrangement matches crown sigil

**Spawns**
- **Enemies:** Low (atmosphere)
- **Lore:** Druid's Log guaranteed

**Acceptance Criteria**
- [ ] Anchor room placement
- [ ] Ritual circle visible

---

## Zone: `boss_approach` — Boss Approach (Spider Queen)
**Status:** `[ ]`

**Purpose:**
- Rooms adjacent to Spider Queen arena. Boss trail props.

**Boss Trail Integration**
- **Trail tells:**
  - [ ] Cocooned packs arranged in a ring (offerings)
  - [ ] Royal signet ring stuck in webbing
  - [ ] "Pruned" corridor where webs form punctuation marks

**Acceptance Criteria**
- [ ] Trail props spawn reliably
- [ ] Offering arrangement visible
