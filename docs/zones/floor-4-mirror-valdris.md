# Floor 4 — Mirror Valdris (LEGITIMACY)

**Aspect:** LEGITIMACY (what is allowed to be true)
**Monarchy Anchor:** Crown and Paperwork
**Warden:** Regent of the Counterfeit Court

---

## Zone: `courtyard_squares` — Courtyard Squares
**Status:** `[ ]`

**Purpose:**
- Open-ceiling zones. The counterfeit kingdom's public spaces.

**Generation**
- **Eligibility:** min_w=8, min_h=8, max_per_level=2
- **Layout pass:** Open center, pillar borders, optional fountain prop

**Visual / Atmosphere**
- **Decorations:** `|` pillars, `~` fountain, `=` benches
- **Environmental Evidence:** Palace bell motif appears twice
- **3D Override:** has_ceiling=false, skybox="counterfeit_sky"

**Spawns**
- **Enemies:** Guards (skeletons), orcs x1.5
- **Lore:** Surface pool [`succession_decree`]

**Acceptance Criteria**
- [ ] Open-air feel achieved
- [ ] Counterfeit sky visible in 3D

---

## Zone: `throne_hall_ruins` — Throne Hall Ruins
**Status:** `[ ]`

**Purpose:**
- Large hall anchor. The seat of counterfeit power.

**Generation**
- **Eligibility:** min_w=10, min_h=8, max_per_level=1
- **Layout pass:** Throne prop at one end, carpet tiles, pillar rows

**Visual / Atmosphere**
- **Decorations:** `#` throne, `=` carpet, `|` pillars, `~` banners
- **Environmental Evidence:** Two portraits of the same ruler with different regalia

**Spawns**
- **Enemies:** Elite guards, oath-bound dead
- **Lore:** Guaranteed surface doc

**Acceptance Criteria**
- [ ] Throne room grandeur achieved
- [ ] Single instance enforced

---

## Zone: `parade_corridors` — Parade Corridors
**Status:** `[ ]`

**Purpose:**
- Banners, symmetry enforcement. The Field's aesthetic obsession.

**Generation**
- **Eligibility:** Elongated rooms, max_per_level=3
- **Layout pass:** Banner props at regular intervals, symmetrical placement

**Visual / Atmosphere**
- **Decorations:** `~` banners (every N tiles), `|` torch sconces
- **Environmental Evidence:** Banners with almost-correct sigils

**Spawns**
- **Enemies:** Patrol patterns
- **Lore:** Environmental only

**Acceptance Criteria**
- [ ] Symmetry enforced
- [ ] Banner spacing regular

---

## Zone: `seal_chambers` — Seal Chambers
**Status:** `[ ]`

**Purpose:**
- Wax pools, stamp tables. Where legitimacy is manufactured.

**Generation**
- **Eligibility:** min_w=5, min_h=5, max_per_level=2
- **Layout pass:** Tables with stamp props, wax pool tiles

**Visual / Atmosphere**
- **Decorations:** `=` tables, `o` stamps, `~` wax puddles
- **Environmental Evidence:** Stamp blocks ready to declare anything true

**Spawns**
- **Enemies:** Low
- **Lore:** Surface pool primary (legitimacy documents)

**Acceptance Criteria**
- [ ] Bureaucracy theme clear
- [ ] Lore spawn rate high

---

## Zone: `record_vaults` — Record Vaults
**Status:** `[ ]`

**Purpose:**
- Ledgers, plaques. The kingdom's official memory.

**Generation**
- **Eligibility:** min_w=5, min_h=5, max_per_level=2
- **Layout pass:** Shelf rows, plaque tiles

**Visual / Atmosphere**
- **Decorations:** `[` `]` shelves, `~` ledgers, `=` plaques
- **Environmental Evidence:** Door plaques that "declare" rooms (contradictory names)

**Spawns**
- **Enemies:** Skeleton clerks
- **Lore:** [`regents_ledger`, `succession_decree`]

**Acceptance Criteria**
- [ ] Lore-dense zone
- [ ] Plaque contradictions visible

---

## Zone: `mausoleum_district` — Mausoleum District
**Status:** `[ ]`

**Purpose:**
- Crypt sub-zone. Where the oath-bound dead wait.

**Generation**
- **Eligibility:** min_w=6, min_h=6, max_per_level=2
- **Layout pass:** Tomb rows, sarcophagus props, eternal flame braziers

**Visual / Atmosphere**
- **Decorations:** `#` tombs, `!` braziers, `~` oath inscriptions
- **Environmental Evidence:** Tomb inscription about endless rising

**Spawns**
- **Enemies:** skeletons x2.0, oath-bound dead (elite)
- **Lore:** [`tomb_inscription`]

**Acceptance Criteria**
- [ ] Crypt atmosphere achieved
- [ ] Undead spawn bias clear

---

## Zone: `oath_chambers` — Oath Chambers
**Status:** `[ ]`

**Purpose:**
- Oathstones, vow inscriptions. Where service became eternal.

**Generation**
- **Eligibility:** min_w=5, min_h=5, max_per_level=1
- **Layout pass:** Central oathstone prop, inscription walls

**Visual / Atmosphere**
- **Decorations:** `O` oathstone, `~` inscriptions, `!` ritual flames
- **Environmental Evidence:** Vows that bind beyond death

**Spawns**
- **Enemies:** Low (atmosphere)
- **Lore:** [`priest_confession`] guaranteed

**Acceptance Criteria**
- [ ] Oath theme clear
- [ ] Anchor room feel

---

## Zone: `boss_approach` — Boss Approach (Regent)
**Status:** `[ ]`

**Purpose:**
- Rooms adjacent to Regent arena. Boss trail props.

**Boss Trail Integration**
- **Trail tells:**
  - [ ] Ink-stained desks with identical entries in "different hands"
  - [ ] Oath-bound dead arranged like honor guard
  - [ ] Stamp blocks / wax puddles leading to arena

**Acceptance Criteria**
- [ ] Bureaucracy-made-flesh theme
- [ ] Honor guard placement
