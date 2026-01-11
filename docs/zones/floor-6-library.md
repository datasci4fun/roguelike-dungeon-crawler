# Floor 6 — Ancient Library (COGNITION)

**Aspect:** COGNITION (what can be known)
**Monarchy Anchor:** Records (official history authored here)
**Warden:** Arcane Keeper

---

## Zone: `reading_halls` — Reading Halls
**Status:** `[ ]`

**Purpose:**
- Quiet, readable rooms—knowledge *used to* be safe here.
- Contrast zone: makes the later “forbidden stacks” feel sharper.

**Generation**
- **Eligibility:**
  - min_w=7, min_h=7
  - allowed_room_types=[NORMAL, LARGE_HALL]
  - max_per_level=2–3
- **Selection rule:** prefer rooms with 2+ connections (public halls), avoid boss approach cluster.
- **Layout pass:**
  - Keep center open.
  - Place table-like decoration clusters in rows (no tile changes required).

**Visual / Atmosphere**
- **Decorations (current system):** Library theme props `╤` (tables) and `║` (shelves) in orderly patterns.
- **Optional custom props:** papers, candles, reading lamps (if supported).
- **Environmental Evidence (choose 1):**
  - A reference table labeled with two different catalog numbers
  - A reading list where one title appears twice under different authors
- **Lighting notes:** softer / more even (relative to other zones).
- **3D overrides:** has_ceiling=true, skybox_override=None

**Spawns**
- **Enemies:** lower density (x0.7), but not empty.
- **Items:** normal; slight bias toward scrolls/lore.
- **Lore drops:**
  - **Delver pool:** [`arcane_research_notes_excerpt`]
  - **Surface/Authority pool:** [`royal_clerk_memo_excerpt`, `priest_redacted_prayer_fragment`]
  - Spawn rule: 15–25% chance per room; max 1 lore per room.

**Acceptance Criteria**
- [ ] Reads as “safe-ish public hall”
- [ ] Not a free room (still some threat)
- [ ] Table/shelf identity is obvious

**Test Seeds:** 16001, 16002

---

## Zone: `forbidden_stacks` — Forbidden Stacks
**Status:** `[ ]`

**Purpose:**
- Tight corridors and claustrophobic navigation: curiosity becomes danger.
- This is where cognition becomes consumption.

**Generation**
- **Eligibility:**
  - min_w=6, min_h=6
  - allowed_room_types=[NORMAL]
  - max_per_level=3–5
- **Selection rule:** weighted high. Prefer rooms with fewer entrances (maze-like).
- **Layout pass:**
  - Add interior partitions using short `WALL (#)` runs to create narrow aisles.
  - Preserve at least one clear route between entrances.
  - Optional: sprinkle 1–2 `TRAP_HIDDEN (.)` / `TRAP_VISIBLE (^)` tiles as “tripwire shelves” (no new mechanic required).

**Visual / Atmosphere**
- **Decorations:** dense `║` shelf lines, fewer `╤` tables.
- **Environmental Evidence (choose 1–2):**
  - Shelf labels that reference books “not yet written”
  - Two copies of the same book with different titles on the spine
  - Dust footprints that stop at a shelf face
- **Lighting notes:** dimmer, shadowy lanes (use fewer light props).
- **3D overrides:** has_ceiling=true

**Spawns**
- **Enemies:** wraiths bias x1.4 if present on this depth; otherwise tougher packs.
- **Items:** slightly higher chance for lore (dangerous knowledge).
- **Lore drops:**
  - **Delver pool:** [`arcane_research_notes`]
  - **Surface/Authority pool:** [`history_of_valdris_multiple_versions`]
  - Spawn rule: 25–40% chance; max 1 lore per room.

**Acceptance Criteria**
- [ ] Aisle maze feel is real
- [ ] Partitions never hard-block entrances
- [ ] Danger noticeably higher than reading_halls

**Test Seeds:** 16011, 16012

---

## Zone: `catalog_chambers` — Catalog Chambers
**Status:** `[ ]`

**Purpose:**
- Bureaucracy of knowledge: the library’s organizing interface.
- Primary surface-doc zone for Floor 6 (records/lineage/history).

**Generation**
- **Eligibility:**
  - min_w=6, min_h=6
  - allowed_room_types=[NORMAL]
  - max_per_level=1–2
- **Selection rule:** prefer rooms near reading_halls or central routes (public access).
- **Layout pass:**
  - Keep readable.
  - Place “catalog stations” with `╤` clusters and shelf walls.

**Visual / Atmosphere**
- **Decorations:** orderly `╤` and `║` placement; “index desk” vibe.
- **Environmental Evidence (choose 1):**
  - Cards that reference books that don’t exist (yet)
  - A drawer label that changes between reads (lore implication)
- **Lighting notes:** brighter than stacks (meant to be used).
- **3D overrides:** has_ceiling=true

**Spawns**
- **Enemies:** skeletons bias x1.2 (clerks/librarians) if present; otherwise normal.
- **Items:** lore bias high.
- **Lore drops:**
  - **Delver pool:** [`delver_note_books_reshelve_themselves`]
  - **Surface/Authority pool:** [`royal_clerk_memo_excerpt`, `history_of_valdris_multiple_versions`]
  - Spawn rule: 50–75% chance; max 1 lore per room.

**Acceptance Criteria**
- [ ] Reads as “index/catalog”
- [ ] Lore appears here reliably
- [ ] Doesn’t become cluttered

**Test Seeds:** 16021, 16022

---

## Zone: `indexing_heart` — The Indexing Heart (Anchor)
**Status:** `[ ]`

**Purpose:**
- The library’s will made manifest: self-ordering, self-authorship.
- Anchor room that sells “knowledge is owned here.”

**Generation**
- **Eligibility:**
  - min_w=8, min_h=8
  - allowed_room_types=[LARGE_HALL, NORMAL]
  - max_per_level=1
- **Selection rule:** choose one large mid-floor room not boss-adjacent.
- **Layout pass:**
  - Keep center open.
  - Arrange shelves (`║`) in a ring or orbit-like pattern around the center.
  - Place one central “index hub” cluster (tables `╤`).

**Visual / Atmosphere**
- **Decorations:** ring/orbit arrangement using `║` + `╤`.
- **Environmental Evidence (choose 1):**
  - Self-cataloging shelves (represented by run-to-run arrangement changes)
  - A central plaque titled “FINAL VERSION” (prop)
- **Lighting notes:** one focused center light, dim edges.
- **3D overrides:** has_ceiling=true

**Spawns**
- **Enemies:** low density, but not empty.
- **Items:** guarantee 1 lore drop.
- **Lore drops:**
  - **Delver pool:** [`arcane_research_notes_excerpt`]
  - **Surface/Authority pool:** [`history_of_valdris_multiple_versions`] (guaranteed here)
  - Spawn rule: 100% for 1 lore here.

**Acceptance Criteria**
- [ ] Exactly one per level
- [ ] Feels like a set-piece “index core”
- [ ] Guaranteed lore spawns here

**Test Seeds:** 16031, 16032

---

## Zone: `experiment_archives` — Experiment Archives
**Status:** `[ ]`

**Purpose:**
- Where cognition became ingestion: experiments invited the Field to learn.
- Danger feels like residue of failed understanding.

**Generation**
- **Eligibility:**
  - min_w=6, min_h=6
  - allowed_room_types=[NORMAL]
  - max_per_level=1–2
- **Selection rule:** prefer rooms deeper and/or near forbidden_stacks.
- **Layout pass:**
  - Optional: sprinkle 1–3 `TRAP_VISIBLE (^)` tiles as “volatile experiment nodes.”
  - Keep at least one safe route.
  - Use decoration clustering to imply diagrams/circles.

**Visual / Atmosphere**
- **Decorations:** mixed tables/shelves in messy, non-symmetric arrangements (contrast to catalog).
- **Environmental Evidence (choose 1):**
  - “Experiment 68 repeats” (plaque/scroll)
  - A diagram that resembles the seal sigil in miniature
- **Lighting notes:** uneven (some bright, some dark).
- **3D overrides:** has_ceiling=true

**Spawns**
- **Enemies:** slightly higher danger than reading halls; wraith bias x1.2 if present.
- **Items:** lore bias medium-high.
- **Lore drops:**
  - **Delver pool:** [`arcane_research_notes`]
  - **Surface/Authority pool:** [`priest_redacted_prayer_fragment`]
  - Spawn rule: 35–60% chance; max 1 lore per room.

**Acceptance Criteria**
- [ ] Reads as “messy lab / archives”
- [ ] Danger elevated but fair
- [ ] Traps never create unavoidable damage

**Test Seeds:** 16041, 16042

---

## Zone: `marginalia_alcoves` — Marginalia Alcoves
**Status:** `[ ]`

**Purpose:**
- Small pocket rooms for hints: knowledge hidden in margins.
- Reward curiosity with short, sharp lore.

**Generation**
- **Eligibility:** small rooms.
  - min_w=4, min_h=4
  - allowed_room_types=[NORMAL]
  - max_per_level=2–4
- **Selection rule:** prefer rooms with one entrance (alcove feel). Avoid boss approach.
- **Layout pass:**
  - Keep open, one “nook” decoration cluster.
  - Optional: one `BREAKABLE_WALL (░)` suggesting hidden margin passage (future).

**Visual / Atmosphere**
- **Decorations:** small cluster of `╤` + `║` to imply a note desk and one shelf.
- **Environmental Evidence (choose 1):**
  - Margin notes that warn or guide (lore)
  - A bookmark with two page numbers, both true
- **Lighting notes:** gentle; slightly brighter than forbidden stacks.
- **3D overrides:** has_ceiling=true

**Spawns**
- **Enemies:** low density (not none).
- **Items:** small chance of consumable or scroll.
- **Lore drops:**
  - **Delver pool:** [`marginal_note_warning`, `marginal_note_hint`]
  - **Surface/Authority pool:** [`royal_clerk_memo_excerpt`]
  - Spawn rule: 40–70% chance; max 1 lore per alcove.

**Acceptance Criteria**
- [ ] Feels like a “hidden nook”
- [ ] Lore spawns frequently enough to matter
- [ ] Doesn’t become a free safe room

**Test Seeds:** 16051, 16052

---

## Zone: `boss_approach` — Boss Approach (Arcane Keeper)
**Status:** `[ ]`

**Purpose:**
- Pre-boss escalation: paradox doors, rearranged sentences, identity drift hints.
- Guarantees 3 trail tells and one pre-boss reveal lore.

**Generation**
- **Eligibility:** 1–3 rooms nearest to boss room center (excluding boss room).
- **Selection rule:** distance from room.center() to boss_room.center(); tag nearest N.
- **Layout pass:** keep walkable; avoid heavy hazards.

**Boss Trail Integration**
- **Trail tells (pick 3):**
  - [ ] Pages pinned to walls (same sentence, varied order) (represented by repeated lore fragments)
  - [ ] Mirror-like cluster (props placed symmetrically but “wrong”)
  - [ ] A door plaque reading: “There was no Door” (contradiction marker)
- **Pre-boss reveal text:** “To be understood is to be owned.”
- **Aftermath hook (future):** post-boss, stacks become less contradictory (visual only).

**Spawns**
- **Enemies:** moderate; bias toward wraiths/skeletons if available.
- **Items:** pre-boss supplies (healing).
- **Lore drops:**
  - **Delver pool:** [`delver_note_the_library_reads_you`]
  - **Surface/Authority pool:** [`history_of_valdris_multiple_versions`]
  - Spawn rule: guarantee 1 lore drop across boss_approach rooms per level.

**Acceptance Criteria**
- [ ] Boss approach tagging reliable
- [ ] Trail props appear consistently
- [ ] Paradox feel is clear without special mechanics
