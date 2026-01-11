# Future TODO: Content Pass v1 (post-ship polish)

## Epic Goal

Make the Field feel **alive** moment-to-moment (not just lore + systems) without adding new core mechanics.

---

## TODO 1 — Field Pulse Micro-Events (1 per floor)

**Why:** Pulses already exist; micro-events turn them into authored moments.

**Implementation shape**

* Trigger only during Field Pulse windows
* Deterministic per seed/floor (like pulses)
* 1–2 narrative messages + tiny safe effect
* Must never block paths or violate hazard fairness

**Per-floor concepts**

| Floor | Theme | Trigger Message | Effect |
|-------|-------|-----------------|--------|
| 1 | Stone / MEMORY | "The keys rattle." | Cosmetic door clatter + short message, optional minor "lock shuffle" visual |
| 2 | Sewers / CIRCULATION | "The rats deliver a decree." | Spawn decree fragment marker in `seal_drifts` or near player |
| 3 | Forest / GROWTH | "The web tightens." | Add 1–2 traps in `webbed_gardens` (preserve safe lane) |
| 4 | Mirror Valdris / LEGITIMACY | "The bell tolls twice." | Brief eerie message + optional 1 guard spawn or short debuff pulse |
| 5 | Ice / STASIS | "The thaw repeats." | Message + cosmetic deep-water/ice contradiction marker |
| 6 | Library / COGNITION | "The catalog reorders." | Small archivist-style reveal in a nearby lore zone |
| 7 | Volcanic / TRANSFORMATION | "The crucible inhales." | Pulse message variant + ember/slag evidence spawn |
| 8 | Crystal / INTEGRATION | "A second shadow moves." | Double-shadow message + brief enemy tension bump |

**Done when**

* Every floor has 1 micro-event that triggers at least once across typical runs
* Events are noticeable but never unfair

---

## TODO 2 — Micro-Event Codex Evidence (optional, great for completionists)

**Why:** Turns "cool moment" into collectible progress + future secret-ending hooks.

**Implementation shape**

* Each micro-event unlocks 1 short `evidence_*` lore entry (history/evidence)
* Discovered when event triggers for the first time
* Adds to sealed-page completion % later

**Done when**

* Codex contains micro-event entries and they unlock cleanly once

---

## TODO 3 — Extra Thematic Enemy Variety (optional)

**Why:** You already have themed pools; add 1 "spice" enemy per floor.

**Rules**

* No new mechanics required (reuse existing AI behaviors)
* Add encounter message + codex description
* Add to floor enemy pools at low weight (5–12%)

**Done when**

* Each floor has at least 1 additional themed enemy and it appears occasionally

---

## TODO 4 — ICE Slide Mechanic (deferred polish)

**Why:** You already place ICE lanes; slide would make Floor 5 feel unique.

**Constraints**

* Must not create unwinnable forced-slide into lava/water
* Respect hazard fairness system

**Done when**

* Ice feels distinct, and fairness tests still pass

---

## TODO 5 — Secret Ending "Extra Conditions" Hooks (deferred)

**Why:** You already have `CompletionLedger.secrets_found` + `SECRET_ENDING_ENABLED`.

**Implementation shape**

* Add invisible "flags" for later requirements (not revealed to player)
* Never set `SECRET_ENDING_ENABLED` yet—only record candidate flags

**Done when**

* Ledger can track extra conditions without exposing them

---

## Priority Order

1. **TODO 1** (Micro-Events) — highest impact, builds on existing pulse system
2. **TODO 2** (Codex Evidence) — natural extension of TODO 1
3. **TODO 3** (Enemy Variety) — low effort, high flavor
4. **TODO 5** (Secret Ending Hooks) — infrastructure for future content
5. **TODO 4** (Ice Slide) — polish, requires careful fairness testing

---

*Last updated: 2025-01-11*
