# Zone Implementation System

**Source of Truth:** This directory defines canonical zone IDs for BSP generation, decoration, spawns, and lore pools.

**Relationship to LORE_COMPENDIUM.md:** The compendium contains evocative in-world flavor. These files contain implementation specs. Names may diverge intentionally.

---

## Canonical Zone IDs by Floor

| Floor | Biome | Aspect | Zone IDs |
|-------|-------|--------|----------|
| 1 | Stone Dungeon | MEMORY | `cell_blocks`, `guard_corridors`, `wardens_office`, `execution_chambers`, `record_vaults`, `intake_hall`, `boss_approach` |
| 2 | Sewers of Valdris | CIRCULATION | `waste_channels`, `carrier_nests`, `confluence_chambers`, `maintenance_tunnels`, `diseased_pools`, `seal_drifts`, `colony_heart`, `boss_approach` |
| 3 | Forest Depths | GROWTH | `root_warrens`, `canopy_halls`, `webbed_gardens`, `the_nursery`, `digestion_chambers`, `druid_ring`, `boss_approach` |
| 4 | Mirror Valdris | LEGITIMACY | `courtyard_squares`, `throne_hall_ruins`, `parade_corridors`, `seal_chambers`, `record_vaults`, `mausoleum_district`, `oath_chambers`, `boss_approach` |
| 5 | Ice Cavern | STASIS | `frozen_galleries`, `ice_tombs`, `crystal_grottos`, `suspended_laboratories`, `breathing_chamber`, `thaw_fault`, `boss_approach` |
| 6 | Ancient Library | COGNITION | `reading_halls`, `forbidden_stacks`, `catalog_chambers`, `indexing_heart`, `experiment_archives`, `marginalia_alcoves`, `boss_approach` |
| 7 | Volcanic Depths | TRANSFORMATION | `forge_halls`, `magma_channels`, `cooling_chambers`, `slag_pits`, `rune_press`, `ash_galleries`, `crucible_heart`, `boss_approach` |
| 8 | Crystal Cave | INTEGRATION | `crystal_gardens`, `geometry_wells`, `seal_chambers`, `dragons_hoard`, `vault_antechamber`, `oath_interface`, `boss_approach` |

---

## Floor Files

- [Floor 1 — Stone Dungeon](./floor-1-stone-dungeon.md) *(reference implementation)*
- [Floor 2 — Sewers of Valdris](./floor-2-sewers.md)
- [Floor 3 — Forest Depths](./floor-3-forest.md)
- [Floor 4 — Mirror Valdris](./floor-4-mirror-valdris.md)
- [Floor 5 — Ice Cavern](./floor-5-ice-cavern.md)
- [Floor 6 — Ancient Library](./floor-6-library.md)
- [Floor 7 — Volcanic Depths](./floor-7-volcanic.md)
- [Floor 8 — Crystal Cave](./floor-8-crystal.md)

---

## Status Key

- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete
- `[!]` Blocked

---

## Implementation Priority

1. **Floor 1 complete** — Reference implementation
2. **boss_approach (all floors)** — Boss trail system
3. **Hazard zones** — diseased_pools, lava tiles, ice movement
4. **Anchor rooms** — One per floor guaranteed
5. **Remaining zones** — Fill in by floor order

---

## Shared Systems Needed

- [ ] Zone assignment algorithm (BSP post-process)
- [ ] Decoration spawner (per-zone decoration pools)
- [ ] Lore pool selector (per-zone bias)
- [ ] Hazard tile system (damage, movement effects)
- [ ] Environmental evidence props (duplicate plaque generator)
- [ ] Boss trail prop system

---

## Test Strategy

- Seed-based determinism for all zone assignments
- Visual spot-check: zone identity obvious at glance
- Spawn distribution tests: 100 runs, count enemy types per zone
- Lore spawn tests: 10 runs, verify lore appears in correct zones
