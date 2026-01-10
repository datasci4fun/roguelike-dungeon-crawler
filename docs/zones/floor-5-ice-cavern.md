# Floor 5 — Ice Cavern (STASIS)

**Aspect:** STASIS (what cannot change)
**Monarchy Anchor:** Treaties
**Warden:** Frost Giant

---

## Zone: `frozen_galleries` — Frozen Galleries
**Status:** `[ ]`

**Purpose:**
- Slippery lanes. Movement becomes treacherous.

**Generation**
- **Eligibility:** Elongated rooms, max_per_level=4
- **Layout pass:** Ice floor tiles (slide mechanic), frozen pillars

**Visual / Atmosphere**
- **Decorations:** `~` ice floor, `|` frozen pillars, `*` frost crystals
- **Hazard:** Ice tiles (momentum/slide movement)

**Spawns**
- **Enemies:** Ice elementals, frozen skeletons
- **Lore:** Environmental only

**Acceptance Criteria**
- [ ] Slide mechanic works
- [ ] Ice visual clear

---

## Zone: `ice_tombs` — Ice Tombs
**Status:** `[ ]`

**Purpose:**
- Frozen bodies, "breathing" props. Stasis made visible.

**Generation**
- **Eligibility:** min_w=5, min_h=5, max_per_level=3
- **Layout pass:** Frozen figure props, breath condensation effects

**Visual / Atmosphere**
- **Decorations:** `@` frozen figures, `~` breath vapor, `*` frost
- **Environmental Evidence:** Figures breathing the same breath for centuries

**Spawns**
- **Enemies:** Low (atmosphere)
- **Lore:** [`frozen_explorer`]

**Acceptance Criteria**
- [ ] Frozen figures menacing
- [ ] Stasis horror conveyed

---

## Zone: `crystal_grottos` — Crystal Grottos
**Status:** `[ ]`

**Purpose:**
- Sparkle pockets. Beauty hiding danger.

**Generation**
- **Eligibility:** min_w=6, min_h=6, max_per_level=2
- **Layout pass:** Crystal cluster props, light refraction tiles

**Visual / Atmosphere**
- **Decorations:** `*` crystals, `~` light beams
- **3D Override:** Crystal geometry, light ray effects

**Spawns**
- **Enemies:** Ice elementals
- **Items:** Rare gems x2.0

**Acceptance Criteria**
- [ ] Visual appeal high
- [ ] Loot opportunity clear

---

## Zone: `suspended_laboratories` — Suspended Laboratories
**Status:** `[ ]`

**Purpose:**
- Tools frozen mid-use. Research that never completed.

**Generation**
- **Eligibility:** min_w=5, min_h=5, max_per_level=1
- **Layout pass:** Frozen table props, suspended equipment

**Visual / Atmosphere**
- **Decorations:** `=` frozen tables, `~` suspended tools, `o` frozen vials
- **Environmental Evidence:** Experiment in progress, forever

**Spawns**
- **Enemies:** Low
- **Lore:** [`frozen_explorer`], [`contradictory_record`]

**Acceptance Criteria**
- [ ] "Frozen in time" feel
- [ ] Lore spawn high

---

## Zone: `breathing_chamber` — The Breathing Chamber
**Status:** `[ ]`

**Purpose:**
- Fog room, giant breath motif. The Frost Giant's presence felt.

**Generation**
- **Eligibility:** Large room, max_per_level=1
- **Layout pass:** Central fog effect, breath rhythm visual

**Visual / Atmosphere**
- **Decorations:** Fog tiles, frost condensation cycles
- **Environmental Evidence:** Breath fog that moves against physics

**Spawns**
- **Enemies:** None (atmosphere anchor)
- **Lore:** Environmental only

**Acceptance Criteria**
- [ ] Boss presence felt
- [ ] Fog effect works

---

## Zone: `thaw_fault` — Thaw Fault
**Status:** `[ ]`

**Purpose:**
- "Never-completing thaw" clues. The paradox of stasis.

**Generation**
- **Eligibility:** min_w=4, min_h=4, max_per_level=2
- **Layout pass:** Dripping water props that never hit ground, melting ice that stays frozen

**Visual / Atmosphere**
- **Decorations:** `~` suspended water drops, `*` "melting" ice
- **Environmental Evidence:** Thaw process frozen in progress

**Spawns**
- **Enemies:** Low
- **Lore:** [`ice_warning`]

**Acceptance Criteria**
- [ ] Paradox visual achieved
- [ ] Stasis concept reinforced

---

## Zone: `boss_approach` — Boss Approach (Frost Giant)
**Status:** `[ ]`

**Purpose:**
- Rooms adjacent to Frost Giant arena. Boss trail props.

**Boss Trail Integration**
- **Trail tells:**
  - [ ] Giant chain links embedded in ice like a ritual circle
  - [ ] Breath fog drifting upward against airflow
  - [ ] Ice "growing" over doors you just opened

**Acceptance Criteria**
- [ ] Giant's presence overwhelming
- [ ] Ice growth effect (optional mechanic)
