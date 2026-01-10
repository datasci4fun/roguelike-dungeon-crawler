# Floor 8 — Crystal Cave (INTEGRATION)

**Aspect:** INTEGRATION (where all layers meet)
**Monarchy Anchor:** Crown Meaning Itself
**Warden:** Dragon Emperor

---

## Zone: `crystal_gardens` — Crystal Gardens
**Status:** `[ ]`

**Purpose:**
- Refraction decor. The Seed's dreams crystallized into beauty.

**Generation**
- **Eligibility:** min_w=6, min_h=6, max_per_level=3
- **Layout pass:** Crystal cluster props, light refraction tiles

**Visual / Atmosphere**
- **Decorations:** `*` crystal clusters, `~` light beams, `.` crystal floor
- **3D Override:** Crystal geometry, light splitting effects, prismatic colors

**Spawns**
- **Enemies:** Crystal constructs, dragon fragments
- **Items:** Gems, crystallized lore

**Acceptance Criteria**
- [ ] Visual spectacle
- [ ] Light refraction works

---

## Zone: `geometry_wells` — Geometry Wells
**Status:** `[ ]`

**Purpose:**
- Patterned floors, "lattice nodes." The Seed's structure exposed.

**Generation**
- **Eligibility:** min_w=5, min_h=5, max_per_level=2
- **Layout pass:** Geometric floor patterns, node markers

**Visual / Atmosphere**
- **Decorations:** Geometric floor tiles, sigil patterns, convergence markers
- **Environmental Evidence:** Repeating sigil geometry across zones

**Spawns**
- **Enemies:** Patrolling dragon fragments
- **Lore:** [`dragon_pact`]

**Acceptance Criteria**
- [ ] Geometry pattern visible
- [ ] Lattice feel achieved

---

## Zone: `seal_chambers` — Seal Chambers
**Status:** `[ ]`

**Purpose:**
- Sigil ring rooms. Where the ancient seals were placed.

**Generation**
- **Eligibility:** Roughly circular or octagonal, max_per_level=2
- **Layout pass:** Circular sigil ring on floor, seal fragment props

**Visual / Atmosphere**
- **Decorations:** `O` sigil ring, `*` seal fragments, `~` binding lines
- **Environmental Evidence:** Crystal sigil incomplete/"missing segment"

**Spawns**
- **Enemies:** Guardian constructs
- **Lore:** Pact fragments, seal histories

**Acceptance Criteria**
- [ ] Seal ring visible
- [ ] Ancient binding feel

---

## Zone: `dragons_hoard` — The Dragon's Hoard
**Status:** `[ ]`

**Purpose:**
- Loot anchor. The accumulated treasures of generations.

**Generation**
- **Eligibility:** Large room, max_per_level=1
- **Layout pass:** Treasure pile props, gold scatter tiles

**Visual / Atmosphere**
- **Decorations:** `$` gold piles, `*` gems, `=` treasure chests, `~` crowns/regalia
- **Environmental Evidence:** Treasures from kings who never existed

**Spawns**
- **Enemies:** Dragon (sleeping until disturbed)
- **Items:** Legendary loot pool, guaranteed rare drops

**Acceptance Criteria**
- [ ] Treasure overwhelming
- [ ] Risk/reward clear (dragon guardian)

---

## Zone: `vault_antechamber` — Vault Antechamber
**Status:** `[ ]`

**Purpose:**
- Pre-boss staging. The threshold before the Star-Heart.

**Generation**
- **Eligibility:** min_w=6, min_h=6, max_per_level=1
- **Selection:** Adjacent to boss room
- **Layout pass:** Grand doorway props, final preparation space

**Visual / Atmosphere**
- **Decorations:** `#` vault door, `|` pillars, `~` inscriptions
- **Environmental Evidence:** Warnings in every language, including languages that don't exist

**Spawns**
- **Enemies:** None (final rest before boss)
- **Lore:** [`final_entry`] guaranteed
- **Items:** Final healing/prep supplies

**Acceptance Criteria**
- [ ] "Point of no return" feel
- [ ] Last King's Testament spawns

---

## Zone: `oath_interface` — Oath Interface
**Status:** `[ ]`

**Purpose:**
- Pact inscriptions. Where guardian and guarded became one.

**Generation**
- **Eligibility:** min_w=5, min_h=5, max_per_level=1
- **Layout pass:** Oath stone props, binding circle

**Visual / Atmosphere**
- **Decorations:** `O` central oath stone, `~` binding inscriptions, `*` crystallized vows
- **Environmental Evidence:** "I was appointed by Valdris / by the Seed" (both true)

**Spawns**
- **Enemies:** None (sacred space)
- **Lore:** Pact contradictions, guardian's confession

**Acceptance Criteria**
- [ ] Dual-loyalty theme clear
- [ ] Oath stone central

---

## Zone: `boss_approach` — Boss Approach (Dragon Emperor)
**Status:** `[ ]`

**Purpose:**
- Rooms adjacent to Dragon Emperor arena. Boss trail props.

**Boss Trail Integration**
- **Trail tells:**
  - [ ] Scorch orbit marks (patrol ring)
  - [ ] Bones arranged like a throne facing the vault
  - [ ] Pact inscription fragments ("I was appointed by Valdris / by the Seed")
- **Pre-boss reveal:** The guardian's paradox made visible
- **Aftermath hook:** Victory choice (re-seat seal vs break seal)

**Acceptance Criteria**
- [ ] Dragon's presence felt
- [ ] Paradox of guardianship visible
- [ ] Final confrontation weight achieved
