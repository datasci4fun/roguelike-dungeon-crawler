# Floor 7 — Volcanic Depths (TRANSFORMATION)

**Aspect:** TRANSFORMATION (what cannot remain)
**Monarchy Anchor:** Crown Jewels / Regalia Metals
**Warden:** Flame Lord

---

## Zone: `forge_halls` — Forge Halls
**Status:** `[ ]`

**Purpose:**
- Hammer marks, anvils. Where transformation was once controlled.

**Generation**
- **Eligibility:** min_w=6, min_h=6, max_per_level=3
- **Layout pass:** Anvil props, forge fire props, tool rack walls

**Visual / Atmosphere**
- **Decorations:** `#` anvils, `!` forge fires, `|` tool racks, `~` cooling troughs
- **Environmental Evidence:** Tool racks with warped duplicates (two of the same hammer)

**Spawns**
- **Enemies:** Fire elementals, smithing ghosts
- **Lore:** [`smith_journal`]

**Acceptance Criteria**
- [ ] Forge atmosphere achieved
- [ ] Duplicate tool props visible

---

## Zone: `magma_channels` — Magma Channels
**Status:** `[ ]`

**Purpose:**
- Lava lanes. The crucible's blood flowing.

**Generation**
- **Eligibility:** Elongated rooms, max_per_level=4
- **Layout pass:** Central lava channel, walkable edges

**Visual / Atmosphere**
- **Decorations:** `~` lava tiles, `*` ember particles
- **Hazard:** Lava tiles (high damage on contact)
- **Lighting:** Orange glow, heat haze

**Spawns**
- **Enemies:** Fire elementals x2.0
- **Lore:** Environmental only

**Acceptance Criteria**
- [ ] Lava hazard lethal
- [ ] Heat visual achieved

---

## Zone: `cooling_chambers` — Cooling Chambers
**Status:** `[ ]`

**Purpose:**
- Steam vents, transitional rooms. Where metal becomes solid again.

**Generation**
- **Eligibility:** min_w=5, min_h=5, max_per_level=2
- **Layout pass:** Steam vent tiles, cooling rack props

**Visual / Atmosphere**
- **Decorations:** `*` steam vents, `=` cooling racks, `~` water troughs
- **Hazard:** Steam vents (periodic damage bursts)

**Spawns**
- **Enemies:** Mixed
- **Items:** Cooled metals, crafting materials

**Acceptance Criteria**
- [ ] Steam hazard works (periodic)
- [ ] Transitional feel

---

## Zone: `slag_pits` — Slag Pits
**Status:** `[ ]`

**Purpose:**
- Hazard pockets. The waste of transformation.

**Generation**
- **Eligibility:** min_w=4, min_h=4, max_per_level=2
- **Layout pass:** Slag pool tiles, debris props

**Visual / Atmosphere**
- **Decorations:** `~` slag pools, `%` metal debris
- **Hazard:** Slag tiles (damage + slow)

**Spawns**
- **Enemies:** Low (hazard focus)
- **Items:** Rare metals x1.5 (risk/reward)

**Acceptance Criteria**
- [ ] Hazard avoidable
- [ ] Rare loot tempting

---

## Zone: `rune_press` — Rune Press
**Status:** `[ ]`

**Purpose:**
- Stamp plates, imprint motif. Where meaning was pressed into metal.

**Generation**
- **Eligibility:** min_w=5, min_h=5, max_per_level=1
- **Layout pass:** Central press mechanism, rune plate props on walls

**Visual / Atmosphere**
- **Decorations:** `#` press mechanism, `=` rune plates, `~` imprint patterns
- **Environmental Evidence:** Melted crests with "almost-right" sigils

**Spawns**
- **Enemies:** Low
- **Lore:** [`smith_journal`], [`obsidian_tablet`]

**Acceptance Criteria**
- [ ] Imprint theme clear
- [ ] Rune press visual

---

## Zone: `ash_galleries` — Ash Galleries
**Status:** `[ ]`

**Purpose:**
- Low visibility, soot. What remains after transformation.

**Generation**
- **Eligibility:** Any size, max_per_level=3
- **Layout pass:** Ash floor tiles, reduced visibility range

**Visual / Atmosphere**
- **Decorations:** `.` ash floor, `%` soot piles, `~` ash drifts
- **Visual Effect:** Reduced view range (fog of war tighter)

**Spawns**
- **Enemies:** Ambush potential (hidden in ash)
- **Lore:** Environmental only

**Acceptance Criteria**
- [ ] Visibility reduced
- [ ] Ambush danger real

---

## Zone: `crucible_heart` — The Crucible Heart
**Status:** `[ ]`

**Purpose:**
- Anchor room, boss-adjacent. The central forge that became aware.

**Generation**
- **Eligibility:** Large room, max_per_level=1
- **Selection:** Near boss room
- **Layout pass:** Central massive forge prop, heat distortion effect

**Visual / Atmosphere**
- **Decorations:** Central forge, ember rain, heat waves
- **Environmental Evidence:** The forge that learned to forge forgers

**Spawns**
- **Enemies:** None (atmosphere anchor)
- **Lore:** Guaranteed 1

**Acceptance Criteria**
- [ ] Forge presence overwhelming
- [ ] Heat distortion visual

---

## Zone: `boss_approach` — Boss Approach (Flame Lord)
**Status:** `[ ]`

**Purpose:**
- Rooms adjacent to Flame Lord arena. Boss trail props.

**Boss Trail Integration**
- **Trail tells:**
  - [ ] Melted weapons embedded in walls like offerings
  - [ ] Rune plates stamped into stone (branding reality)
  - [ ] Ash spirals pointing toward arena

**Acceptance Criteria**
- [ ] Transformation-as-consumption theme
- [ ] Offering arrangement visible
