# Floor 4 — Mirror Valdris (LEGITIMACY)

**Aspect:** LEGITIMACY (what is allowed to be true)
**Monarchy Anchor:** Crown and Paperwork (decrees, seals, genealogies, oaths)
**Warden:** Regent of the Counterfeit Court

---

## Zone: `courtyard_squares` — Courtyard Squares
**Status:** `[ ]`

**Purpose:**
- “Public space” pocket: the counterfeit kingdom’s open plazas where authority is performed.
- Primary candidate for open-ceiling / skybox rooms once per-room ceiling is wired.

**Generation**
- **Eligibility:**
  - min_w=8, min_h=8
  - allowed_room_types=[LARGE_HALL, NORMAL]
  - max_per_level=1–2
- **Selection rule:** prefer large rooms that are not boss-adjacent; promote 1 as an “anchor courtyard” when possible.
- **Layout pass:**
  - Keep center open and readable.
  - Optional: small “fountain” using a 3×3 `DEEP_WATER (≈)` pool (must not block entrances).
  - Symmetry bias: place decorations mirrored across the centerline.

**Visual / Atmosphere**
- **Decorations (baseline):** use whatever the floor’s theme provides for “stone/architecture” (pillars + light sources).
- **Optional custom props (if supported later):** banners, benches, bell motifs.
- **Environmental Evidence (choose 1):**
  - Palace bell motif appears twice (two identical markers)
  - Two identical banners with almost-correct sigils
  - A plaque declaring the same courtyard name with two rulers
- **Lighting notes:** slightly brighter than other zones (this is “public”).
- **3D Overrides (future-ready):**
  - has_ceiling: false *(once wired)*
  - skybox_override: `dungeon` (fallback)
    *(Later: add a dedicated “kingdom” palette; for now use an existing biome palette.)*

**Spawns**
- **Enemies:** patrol-style packs; bias skeletons x1.2 (oath-dead), orcs x1.2 if present on this floor.
- **Items:** normal.
- **Lore drops:**
  - **Delver pool:** [`delver_note_two_coronations`]
  - **Surface/Authority pool:** [`succession_decree_contradictory`]
  - Spawn rule: 20–35% chance; max 1 lore per room.

**Acceptance Criteria**
- [ ] Reads as “plaza/courtyard” at a glance
- [ ] If fountain pool used, it never blocks connectivity
- [ ] Symmetry is noticeable (feels “declared”)

**Test Seeds:** 14001, 14002

---

## Zone: `throne_hall_ruins` — Throne Hall Ruins (Anchor)
**Status:** `[ ]`

**Purpose:**
- The set-piece seat of counterfeit power: a declared throne space.
- Where legitimacy feels like architecture trying to convince you.

**Generation**
- **Eligibility:**
  - min_w=10, min_h=8
  - allowed_room_types=[LARGE_HALL] preferred, else largest NORMAL
  - max_per_level=1
- **Selection rule:** promote one anchor room per level; prefer central-ish placement (not start seam, not boss approach).
- **Layout pass:**
  - Place a “throne end” focus: one end of room gets denser decorations (no tile changes required).
  - Create “aisle” feel via symmetric decoration lines.
  - Keep a central route clear.

**Visual / Atmosphere**
- **Decorations (baseline):** pillars + lights arranged in formal rows.
- **Optional custom props:** throne silhouette, banner wall, cracked crest mural.
- **Environmental Evidence (choose 1):**
  - Two portraits of the same ruler with different regalia
  - A coronation plaque that lists two heirs on the same date
- **Lighting notes:** brighter at the “throne end,” dimmer toward entrances.
- **3D Overrides:** has_ceiling=true (unless you want it open-air later).

**Spawns**
- **Enemies:** moderate; allow “honor guard” packs (skeletons) with slightly higher density x1.1.
- **Items:** small chance of higher-tier item (reward set piece).
- **Lore drops:**
  - **Delver pool:** [`delver_coronation_loop_entry`]
  - **Surface/Authority pool:** [`regents_ledger`]
  - Spawn rule: 60–80% chance; max 1 lore in this zone.

**Acceptance Criteria**
- [ ] Exactly one per level
- [ ] Reads as “throne hall” via symmetry + focal end
- [ ] Does not block movement with decoration density

**Test Seeds:** 14011, 14012

---

## Zone: `parade_corridors` — Parade Corridors
**Status:** `[ ]`

**Purpose:**
- Symmetry enforcement zone: the Field’s aesthetic obsession made navigable.
- Provides recognizable “processional” routes between pockets.

**Generation**
- **Eligibility:** elongated rooms preferred.
  - min_w=4, min_h=10 OR min_w=10, min_h=4
  - allowed_room_types=[NORMAL]
  - max_per_level=2–4
- **Selection rule:** prefer rooms that connect multiple corridors/regions.
- **Layout pass:**
  - Keep open.
  - Place decorations at regular intervals (every N tiles) in mirrored pairs.

**Visual / Atmosphere**
- **Decorations (baseline):** regular light placements + occasional pillars.
- **Optional custom props:** banners, “parade markers,” tiled sigils.
- **Environmental Evidence (choose 1):**
  - Banners with almost-correct sigils
  - Two identical “route marker” plaques, different monarch names
- **Lighting notes:** evenly lit (feels staged).

**Spawns**
- **Enemies:** patrol-style distribution; keep density normal.
- **Lore drops:**
  - **Delver pool:** [`delver_note_they_keep_applauding`]
  - **Surface/Authority pool:** [`duplicate_decree_fragment`]
  - Spawn rule: 10–20% chance; max 1 lore across parade corridors.

**Acceptance Criteria**
- [ ] Symmetry is obvious (reads as “procession route”)
- [ ] Spawns don’t overwhelm corridors

**Test Seeds:** 14021, 14022

---

## Zone: `seal_chambers` — Seal Chambers
**Status:** `[ ]`

**Purpose:**
- Bureaucracy made physical: where legitimacy is manufactured.
- Primary surface-document drop bias zone for Floor 4.

**Generation**
- **Eligibility:**
  - min_w=6, min_h=6
  - allowed_room_types=[NORMAL]
  - max_per_level=1–2
- **Selection rule:** prefer rooms near parade corridors or record vaults (bureaucracy cluster).
- **Layout pass:**
  - Keep room readable.
  - Create “stations” via decoration clusters (stamp table, wax pool corner, ledger pile).

**Visual / Atmosphere**
- **Decorations (baseline):** lights + pillars, arranged like “workstations.”
- **Optional custom props:** stamp blocks, wax puddles, blank parchment.
- **Environmental Evidence (choose 1–2):**
  - Stamp blocks ready to declare anything true
  - Wax seals attached to blank parchment
  - Pages where words fade but signatures remain
- **Lighting notes:** slightly brighter (reading/inspection zone).

**Spawns**
- **Enemies:** low-to-normal.
- **Items:** bias toward lore.
- **Lore drops:**
  - **Delver pool:** [`delver_note_the_seal_writes_itself`]
  - **Surface/Authority pool:** [`succession_decree_contradictory`, `blank_sealed_parchment`, `regents_ledger_excerpt`]
  - Spawn rule: 60–85% chance; allow up to 2 lore drops in one seal chamber per level.

**Acceptance Criteria**
- [ ] Reads as “bureaucracy workshop”
- [ ] Surface-doc lore appears here reliably

**Test Seeds:** 14031, 14032

---

## Zone: `record_vaults` — Record Vaults
**Status:** `[ ]`

**Purpose:**
- Official memory: ledgers, plaques, declared rooms.
- Second primary lore zone for this floor (history as a weapon).

**Generation**
- **Eligibility:**
  - min_w=6, min_h=6
  - allowed_room_types=[NORMAL]
  - max_per_level=1–2
- **Selection rule:** prefer rooms with fewer entrances (vault feel).
- **Layout pass:**
  - Optional: shelf strips via decoration clustering (or interior wall stubs once supported).
  - Place 1–2 “plaque walls” (evidence props).

**Visual / Atmosphere**
- **Decorations (baseline):** denser “shelf-like” arrangements.
- **Optional custom props:** ledger piles, plaques, archive cabinets.
- **Environmental Evidence (choose 1):**
  - Door plaques that declare rooms (contradictory names)
  - A genealogy board with missing slots
  - Two identical portraits with different crowns
- **Lighting notes:** dimmer, dustier.

**Spawns**
- **Enemies:** skeletons bias x1.4 (“clerks” and oath-dead).
- **Items:** lore bias high.
- **Lore drops:**
  - **Delver pool:** [`delver_note_the_records_changed`]
  - **Surface/Authority pool:** [`regents_ledger`, `royal_clerk_memo_excerpt`, `duplicate_decree_fragment`]
  - Spawn rule: 60–85% chance; max 2 lore drops across record vaults per level.

**Acceptance Criteria**
- [ ] Lore density noticeably high here
- [ ] Contradictory plaque evidence appears reliably

**Test Seeds:** 14041, 14042

---

## Zone: `mausoleum_district` — Mausoleum District (Crypt Sub-Pocket)
**Status:** `[ ]`

**Purpose:**
- Crypt flavor preserved as a sub-pocket: oath-bound dead as bureaucracy enforcement.
- A physical reminder that oaths persist even after meaning erodes.

**Generation**
- **Eligibility:**
  - min_w=6, min_h=6
  - allowed_room_types=[NORMAL, LARGE_HALL]
  - max_per_level=1–2
- **Selection rule:** prefer rooms deeper in the floor and nearer to boss route (but not boss_approach itself).
- **Layout pass:**
  - Keep open.
  - Use decoration rows to imply tomb lines / sarcophagi.

**Visual / Atmosphere**
- **Decorations (baseline):** stone pillars + low lights.
- **Optional custom props:** tombstones, statues, sarcophagus silhouettes.
- **Environmental Evidence (choose 1):**
  - Tomb inscription about endless rising
  - A guard “honor line” that faces the wrong throne
- **Lighting notes:** darker, colder.

**Spawns**
- **Enemies:** skeletons bias x2.0; allow more elites here (still bounded by global rules).
- **Items:** low-to-normal.
- **Lore drops:**
  - **Delver pool:** [`delver_note_the_dead_choose_wrong_crown`]
  - **Surface/Authority pool:** [`tomb_inscription_endless_rising`]
  - Spawn rule: 30–50% chance; max 1 lore per room.

**Acceptance Criteria**
- [ ] Reads as “crypt district” without inventing new tile types
- [ ] Undead bias obvious

**Test Seeds:** 14051, 14052

---

## Zone: `oath_chambers` — Oath Chambers (Anchor)
**Status:** `[ ]`

**Purpose:**
- The vow interface: service became eternal and now serves contradiction.
- Anchor narrative room; guaranteed lore.

**Generation**
- **Eligibility:**
  - min_w=7, min_h=7
  - allowed_room_types=[NORMAL]
  - max_per_level=1
- **Selection rule:** pick one room mid-to-late, not boss approach. Prefer 1 entrance.
- **Layout pass:**
  - Clear center.
  - Place a central “oathstone” via decoration cluster.
  - Arrange decorations in a ring (ritual geometry).

**Visual / Atmosphere**
- **Decorations (baseline):** ring pattern with lights/pillars.
- **Optional custom props:** oathstone, vow inscriptions, ritual flames.
- **Environmental Evidence (choose 1):**
  - Vows that bind beyond death (inscription prop)
  - A plaque that reads “WHICH CROWN” carved over itself
- **Lighting notes:** focused center light (ritual spotlight).

**Spawns**
- **Enemies:** low density, but not empty.
- **Items:** guarantee 1 lore drop.
- **Lore drops:**
  - **Delver pool:** [`delver_confession_service_to_what`]
  - **Surface/Authority pool:** [`priest_confession_oath_chambers`] (guaranteed here)
  - Spawn rule: 100% for 1 lore here.

**Acceptance Criteria**
- [ ] Exactly one per level
- [ ] Reads as “ritual/oath interface”
- [ ] Guaranteed lore spawns

**Test Seeds:** 14061, 14062

---

## Zone: `boss_approach` — Boss Approach (Regent)
**Status:** `[ ]`

**Purpose:**
- Ensures consistent boss foreshadowing: bureaucracy-made-flesh, honor guard, stamped reality.
- Guarantees trail props and one pre-boss reveal lore.

**Generation**
- **Eligibility:** 1–3 rooms nearest to boss room center (excluding boss room).
- **Selection rule:** distance from room.center() to boss_room.center(); tag nearest N.
- **Layout pass:** keep walkable; avoid heavy hazards here.

**Boss Trail Integration**
- **Trail tells (pick 3):**
  - [ ] Ink-stained desks with identical entries in “different hands”
  - [ ] Oath-bound dead arranged like an honor guard
  - [ ] Stamp blocks / wax-seal debris leading inward
- **Pre-boss reveal text:** “Legitimacy by repetition. The version witnessed most becomes the version that has always been.”
- **Aftermath hook (future):** after defeating Regent, contradictions feel “less coherent” (spawn/prop shift idea).

**Spawns**
- **Enemies:** skeletons bias x1.6; reduce unrelated spawns.
- **Items:** pre-boss supplies bias (healing).
- **Lore drops:**
  - **Delver pool:** [`delver_note_the_regent_declares_doors`]
  - **Surface/Authority pool:** [`regents_ledger_excerpt`, `succession_decree_contradictory`]
  - Spawn rule: guarantee 1 lore drop across boss_approach rooms per level.

**Acceptance Criteria**
- [ ] Boss approach tagging reliable
- [ ] Trail props appear consistently
- [ ] Escalation reads clearly
