# Floor 6 — Ancient Library (COGNITION)

**Aspect:** COGNITION (what can be known)
**Monarchy Anchor:** Records
**Warden:** Arcane Keeper

---

## Zone: `reading_halls` — Reading Halls
**Status:** `[ ]`

**Purpose:**
- Tables, quiet spaces. Where knowledge was consumed safely.

**Generation**
- **Eligibility:** min_w=6, min_h=6, max_per_level=3
- **Layout pass:** Table props, chair props, open floor space

**Visual / Atmosphere**
- **Decorations:** `=` tables, `o` chairs, `~` scattered papers
- **Lighting:** Soft, even (reading light)

**Spawns**
- **Enemies:** Low density (0.5x)
- **Lore:** Delver pool [`wizard_research`]

**Acceptance Criteria**
- [ ] Quiet atmosphere
- [ ] Low danger zone

---

## Zone: `forbidden_stacks` — Forbidden Stacks
**Status:** `[ ]`

**Purpose:**
- Tight corridors, shelf partitions. Knowledge too dangerous to access freely.

**Generation**
- **Eligibility:** Any size, max_per_level=4
- **Layout pass:** Dense shelf rows creating maze-like corridors

**Visual / Atmosphere**
- **Decorations:** `[` `]` tall shelves, `~` forbidden tomes, `!` warning signs
- **Lighting:** Dim, shadows between stacks

**Spawns**
- **Enemies:** wraiths x1.5 (knowledge seekers who stayed too long)
- **Lore:** Rare/dangerous texts

**Acceptance Criteria**
- [ ] Maze-like feel
- [ ] Danger elevated

---

## Zone: `catalog_chambers` — Catalog Chambers
**Status:** `[ ]`

**Purpose:**
- Index tables, card drawers. The library's organizational heart.

**Generation**
- **Eligibility:** min_w=5, min_h=5, max_per_level=2
- **Layout pass:** Card catalog props, index tables

**Visual / Atmosphere**
- **Decorations:** `=` index tables, `#` card drawers, `~` reference cards
- **Environmental Evidence:** Cards that reference books that don't exist (yet)

**Spawns**
- **Enemies:** Skeleton librarians
- **Lore:** Surface pool primary

**Acceptance Criteria**
- [ ] Organization theme clear
- [ ] Catalog props visible

---

## Zone: `indexing_heart` — The Indexing Heart
**Status:** `[ ]`

**Purpose:**
- Anchor room. Self-ordering effect. The library's will made manifest.

**Generation**
- **Eligibility:** min_w=6, min_h=6, max_per_level=1
- **Layout pass:** Central index mechanism prop, orbiting book shelves

**Visual / Atmosphere**
- **Decorations:** Central mechanism, floating/moving book props
- **Environmental Evidence:** Self-cataloging shelves (books that "move" run-to-run)

**Spawns**
- **Enemies:** None (atmosphere anchor)
- **Lore:** Guaranteed 1

**Acceptance Criteria**
- [ ] Self-ordering visual
- [ ] Anchor room presence

---

## Zone: `experiment_archives` — Experiment Archives
**Status:** `[ ]`

**Purpose:**
- Burn marks, diagrams. Where the wizards pushed too far.

**Generation**
- **Eligibility:** min_w=5, min_h=5, max_per_level=2
- **Layout pass:** Scorch marks on floor, diagram props on walls

**Visual / Atmosphere**
- **Decorations:** `*` burn marks, `~` diagrams, `%` ash piles
- **Environmental Evidence:** Experiments that went wrong (or right, in wrong ways)

**Spawns**
- **Enemies:** Fire elementals (residue), wraiths
- **Lore:** [`wizard_research`] guaranteed

**Acceptance Criteria**
- [ ] Danger history visible
- [ ] Research gone wrong theme

---

## Zone: `marginalia_alcoves` — Marginalia Alcoves
**Status:** `[ ]`

**Purpose:**
- Small pocket rooms for hints. Knowledge hidden in margins.

**Generation**
- **Eligibility:** Small rooms (min_w=3, min_h=3), max_per_level=3
- **Layout pass:** Single desk/reading nook, hidden feeling

**Visual / Atmosphere**
- **Decorations:** `=` small desk, `~` notes, `o` candle
- **Environmental Evidence:** Margin notes that warn or guide

**Spawns**
- **Enemies:** None (safe havens)
- **Lore:** High density, short texts (hints)

**Acceptance Criteria**
- [ ] Hidden feel achieved
- [ ] Hint system works

---

## Zone: `boss_approach` — Boss Approach (Arcane Keeper)
**Status:** `[ ]`

**Purpose:**
- Rooms adjacent to Arcane Keeper arena. Boss trail props.

**Boss Trail Integration**
- **Trail tells:**
  - [ ] Pages pinned to walls (same sentence, varied order)
  - [ ] Mirror-like tile cluster (identity drift hint)
  - [ ] A door labeled "There was no Door"

**Acceptance Criteria**
- [ ] Knowledge-as-threat theme
- [ ] Paradox door works
