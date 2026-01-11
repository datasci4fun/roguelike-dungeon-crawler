"""Entity spawning and management."""
import random
from typing import TYPE_CHECKING, List, Optional

from ..entities import Player, Enemy
from ..items import Item, ItemType, create_item, ArtifactManager, ArtifactInstance

if TYPE_CHECKING:
    from ..world import Dungeon


class EntityManager:
    """Manages spawning and querying of entities (enemies, items, artifacts)."""

    def __init__(self):
        self.enemies: List[Enemy] = []
        self.items: List[Item] = []
        self.boss: Optional[Enemy] = None
        self.boss_defeated: bool = False
        # v5.5: Artifact system
        self.artifact_manager = ArtifactManager()

    def spawn_enemies(self, dungeon: 'Dungeon', player: Player):
        """Spawn enemies in random rooms with weighted type selection.

        Uses FLOOR_ENEMY_POOLS as primary source (theme-first), with
        min/max level filtering as fallback. Zone weights are applied on top.
        """
        from ..core.constants import (
            ELITE_SPAWN_RATE, ENEMY_STATS, EnemyType, FLOOR_ENEMY_POOLS
        )

        self.enemies.clear()
        num_enemies = min(len(dungeon.rooms) * 2, 15)  # 2 enemies per room, max 15

        current_level = dungeon.level

        # Primary: use floor-specific enemy pool (theme-first)
        floor_pool = FLOOR_ENEMY_POOLS.get(current_level)
        if floor_pool:
            base_enemy_types = [t for (t, w) in floor_pool]
            base_weights = [w for (t, w) in floor_pool]
        else:
            # Fallback: filter by min/max level
            base_enemy_types = []
            base_weights = []
            for enemy_type, stats in ENEMY_STATS.items():
                min_lvl = stats.get('min_level', 1)
                max_lvl = stats.get('max_level', 5)
                if min_lvl <= current_level <= max_lvl:
                    base_enemy_types.append(enemy_type)
                    base_weights.append(stats['weight'])

        if not base_enemy_types:
            # Ultimate fallback to basic enemies
            base_enemy_types = [EnemyType.GOBLIN, EnemyType.SKELETON]
            base_weights = [40, 30]

        # Track dragon spawns for Floor 8 max-1 constraint
        dragon_spawned = False

        for _ in range(num_enemies):
            pos = dungeon.get_random_floor_position()
            # Make sure not too close to player
            if abs(pos[0] - player.x) > 5 or abs(pos[1] - player.y) > 5:
                # Get zone at spawn position and apply weight modifiers
                zone = dungeon.get_zone_at(pos[0], pos[1])
                zone_weights = self._apply_zone_weights(
                    base_enemy_types, base_weights.copy(), zone, current_level
                )

                # Select enemy type using zone-modified weights
                enemy_type = random.choices(base_enemy_types, weights=zone_weights)[0]

                # Floor 8: Max 1 dragon constraint (spicy but fair)
                if current_level == 8 and enemy_type == EnemyType.DRAGON:
                    if dragon_spawned:
                        # Already have a dragon - reroll once
                        enemy_type = random.choices(base_enemy_types, weights=zone_weights)[0]
                        if enemy_type == EnemyType.DRAGON:
                            # Still dragon - fallback to Crystal Sentinel
                            enemy_type = EnemyType.CRYSTAL_SENTINEL
                    else:
                        dragon_spawned = True

                # 20% chance to spawn elite enemy (0% in intake_hall for Floor 1)
                elite_rate = ELITE_SPAWN_RATE
                if zone == "intake_hall":
                    elite_rate = 0.0
                is_elite = random.random() < elite_rate

                enemy = Enemy(pos[0], pos[1], enemy_type=enemy_type, is_elite=is_elite)
                self.enemies.append(enemy)

    def _apply_zone_weights(self, enemy_types: list, weights: list, zone: str, level: int) -> list:
        """Apply zone-specific weight modifiers to enemy spawn weights.

        Implements zone modifiers for all floors with thematic enemy boosts.
        """
        from ..core.constants import EnemyType

        # Floor 1 zone modifiers (Stone Dungeon)
        if level == 1:
            zone_modifiers = {
                "cell_blocks": {EnemyType.GOBLIN: 1.5, EnemyType.SKELETON: 1.0, EnemyType.ORC: 0.5},
                "guard_corridors": {EnemyType.SKELETON: 1.4, EnemyType.GOBLIN: 1.0},
                "record_vaults": {EnemyType.SKELETON: 1.4},
                "execution_chambers": {EnemyType.SKELETON: 1.2},
                "boss_approach": {EnemyType.GOBLIN: 2.0},
                "intake_hall": {},
            }
            modifiers = zone_modifiers.get(zone, {})
            for i, enemy_type in enumerate(enemy_types):
                if enemy_type in modifiers:
                    weights[i] = int(weights[i] * modifiers[enemy_type])

        # Floor 2 zone modifiers (Sewers)
        # Thematic: RAT and PLAGUE_RAT dominate
        elif level == 2:
            zone_modifiers = {
                "carrier_nests": {EnemyType.RAT: 2.0, EnemyType.PLAGUE_RAT: 2.0},  # Rat swarms
                "waste_channels": {EnemyType.PLAGUE_RAT: 1.4},  # Diseased waters
                "seal_drifts": {EnemyType.ASSASSIN: 1.3},  # Witness-erasure vibe
                "colony_heart": {EnemyType.RAT: 2.0, EnemyType.PLAGUE_RAT: 1.6},  # Rats dominate
                "diseased_pools": {EnemyType.PLAGUE_RAT: 1.5},  # Disease bias
                "maintenance_tunnels": {},  # Default weights
                "boss_approach": {EnemyType.RAT: 1.8, EnemyType.PLAGUE_RAT: 1.5},
                "confluence_chambers": {},  # Start zone, default weights
            }
            modifiers = zone_modifiers.get(zone, {})
            for i, enemy_type in enumerate(enemy_types):
                if enemy_type in modifiers:
                    weights[i] = int(weights[i] * modifiers[enemy_type])

        # Floor 3 zone modifiers (Forest Depths)
        # Thematic: SPIDERLING and WEBWEAVER dominate
        elif level == 3:
            zone_modifiers = {
                "the_nursery": {EnemyType.SPIDERLING: 2.0, EnemyType.WEBWEAVER: 2.0},  # Spider density
                "webbed_gardens": {EnemyType.WEBWEAVER: 1.6, EnemyType.SPIDERLING: 1.4},  # Web bias
                "druid_ring": {EnemyType.WRAITH: 1.3},  # Low density, spectral
                "digestion_chambers": {EnemyType.SPIDERLING: 1.3},  # Spider hunting grounds
                "canopy_halls": {EnemyType.WEBWEAVER: 1.2},  # Mixed
                "root_warrens": {EnemyType.SPIDERLING: 1.5, EnemyType.RAT: 1.2},  # Prey/predator
                "boss_approach": {EnemyType.SPIDERLING: 1.8, EnemyType.WEBWEAVER: 1.6},
            }
            modifiers = zone_modifiers.get(zone, {})
            for i, enemy_type in enumerate(enemy_types):
                if enemy_type in modifiers:
                    weights[i] = int(weights[i] * modifiers[enemy_type])

        # Floor 4 zone modifiers (Mirror Valdris)
        # Thematic: OATHBOUND_GUARD and COURT_SCRIBE dominate
        elif level == 4:
            zone_modifiers = {
                "mausoleum_district": {EnemyType.OATHBOUND_GUARD: 1.6, EnemyType.SKELETON: 1.6},  # Undead
                "throne_hall_ruins": {EnemyType.OATHBOUND_GUARD: 1.4},  # Honor guard
                "record_vaults": {EnemyType.COURT_SCRIBE: 1.4, EnemyType.SKELETON: 1.2},  # Clerks
                "oath_chambers": {EnemyType.OATHBOUND_GUARD: 1.3, EnemyType.WRAITH: 1.2},  # Oath-bound
                "courtyard_squares": {EnemyType.OATHBOUND_GUARD: 1.3},  # Patrol
                "seal_chambers": {EnemyType.COURT_SCRIBE: 1.3},  # Bureaucracy
                "parade_corridors": {},  # Normal distribution
                "boss_approach": {EnemyType.OATHBOUND_GUARD: 1.6, EnemyType.COURT_SCRIBE: 1.4},
            }
            modifiers = zone_modifiers.get(zone, {})
            for i, enemy_type in enumerate(enemy_types):
                if enemy_type in modifiers:
                    weights[i] = int(weights[i] * modifiers[enemy_type])

        # Floor 5 zone modifiers (Ice Cavern)
        # Thematic: ICE_ELEMENTAL and frozen guards
        elif level == 5:
            zone_modifiers = {
                "ice_tombs": {EnemyType.ICE_ELEMENTAL: 1.6, EnemyType.SKELETON: 1.4},  # Frozen guards
                "frozen_galleries": {EnemyType.ICE_ELEMENTAL: 1.5},  # Ice lanes
                "crystal_grottos": {EnemyType.ICE_ELEMENTAL: 1.4, EnemyType.OATHBOUND_GUARD: 1.2},
                "suspended_laboratories": {EnemyType.WRAITH: 1.3},  # Experiments
                "breathing_chamber": {EnemyType.ICE_ELEMENTAL: 1.4, EnemyType.TROLL: 1.3},  # Set-piece
                "thaw_fault": {EnemyType.ICE_ELEMENTAL: 1.3},  # Paradox zone
                "boss_approach": {EnemyType.ICE_ELEMENTAL: 1.6, EnemyType.TROLL: 1.4},
            }
            modifiers = zone_modifiers.get(zone, {})
            for i, enemy_type in enumerate(enemy_types):
                if enemy_type in modifiers:
                    weights[i] = int(weights[i] * modifiers[enemy_type])

        # Floor 6 zone modifiers (Ancient Library)
        # Thematic: ANIMATED_TOME, NECROMANCER, COURT_SCRIBE
        elif level == 6:
            zone_modifiers = {
                "reading_halls": {EnemyType.WRAITH: 1.2},  # Quiet guards
                "forbidden_stacks": {EnemyType.ANIMATED_TOME: 1.5, EnemyType.NECROMANCER: 1.5},  # Danger
                "catalog_chambers": {EnemyType.COURT_SCRIBE: 1.4, EnemyType.ANIMATED_TOME: 1.2},  # Clerks
                "indexing_heart": {EnemyType.ANIMATED_TOME: 1.3},  # Library core
                "experiment_archives": {EnemyType.NECROMANCER: 1.4},  # Failed experiments
                "marginalia_alcoves": {EnemyType.ANIMATED_TOME: 1.3},  # Hidden nooks
                "boss_approach": {EnemyType.ANIMATED_TOME: 1.5, EnemyType.NECROMANCER: 1.4},
            }
            modifiers = zone_modifiers.get(zone, {})
            for i, enemy_type in enumerate(enemy_types):
                if enemy_type in modifiers:
                    weights[i] = int(weights[i] * modifiers[enemy_type])

        # Floor 7 zone modifiers (Volcanic Depths)
        # Thematic: FIRE_ELEMENTAL, DEMON, TROLL
        elif level == 7:
            zone_modifiers = {
                "forge_halls": {EnemyType.FIRE_ELEMENTAL: 1.4, EnemyType.TROLL: 1.2},  # Workshop
                "magma_channels": {EnemyType.FIRE_ELEMENTAL: 1.6, EnemyType.DEMON: 1.4},  # Fire lanes
                "cooling_chambers": {EnemyType.TROLL: 1.3},  # Cooler areas
                "slag_pits": {EnemyType.DEMON: 1.3},  # Demon territory
                "rune_press": {EnemyType.ANIMATED_TOME: 1.3, EnemyType.NECROMANCER: 1.2},  # Imprints
                "ash_galleries": {EnemyType.FIRE_ELEMENTAL: 1.3},  # Ambush-friendly
                "crucible_heart": {EnemyType.FIRE_ELEMENTAL: 1.5, EnemyType.DEMON: 1.4},  # Core
                "boss_approach": {EnemyType.FIRE_ELEMENTAL: 1.6, EnemyType.DEMON: 1.5},
            }
            modifiers = zone_modifiers.get(zone, {})
            for i, enemy_type in enumerate(enemy_types):
                if enemy_type in modifiers:
                    weights[i] = int(weights[i] * modifiers[enemy_type])

        # Floor 8 zone modifiers (Crystal Cave)
        # Thematic: CRYSTAL_SENTINEL, DRAGON, LIGHTNING_ELEMENTAL
        elif level == 8:
            zone_modifiers = {
                "crystal_gardens": {EnemyType.CRYSTAL_SENTINEL: 1.4},  # Guardian bias
                "geometry_wells": {EnemyType.LIGHTNING_ELEMENTAL: 1.3},  # Energy nodes
                "seal_chambers": {EnemyType.CRYSTAL_SENTINEL: 1.6},  # Guardians
                "dragons_hoard": {EnemyType.DRAGON: 1.5, EnemyType.CRYSTAL_SENTINEL: 1.3},  # Danger
                "vault_antechamber": {EnemyType.CRYSTAL_SENTINEL: 1.3},  # Threshold
                "oath_interface": {EnemyType.WRAITH: 1.3},  # Spectral pacts
                "boss_approach": {EnemyType.CRYSTAL_SENTINEL: 1.6, EnemyType.DRAGON: 1.4},
            }
            modifiers = zone_modifiers.get(zone, {})
            for i, enemy_type in enumerate(enemy_types):
                if enemy_type in modifiers:
                    weights[i] = int(weights[i] * modifiers[enemy_type])

        return weights

    def _spawn_zone_lore(self, dungeon: 'Dungeon', player: Player):
        """Spawn lore items with zone-aware placement and spawn chances.

        Floors 1-2 have zone-specific lore pools and spawn rates.
        Other floors use default 70% spawn chance for all lore.
        """
        from ..items import create_lore_item
        from ..story.story_data import get_lore_entries_for_level

        lore_entries = get_lore_entries_for_level(dungeon.level)
        if not lore_entries:
            return

        # Zone-aware lore spawning for implemented floors
        if dungeon.level == 1:
            self._spawn_floor_lore(dungeon, player, lore_entries, self._get_floor1_lore_config())
        elif dungeon.level == 2:
            self._spawn_floor_lore(dungeon, player, lore_entries, self._get_floor2_lore_config())
        elif dungeon.level == 3:
            self._spawn_floor_lore(dungeon, player, lore_entries, self._get_floor3_lore_config())
        elif dungeon.level == 4:
            self._spawn_floor_lore(dungeon, player, lore_entries, self._get_floor4_lore_config())
        elif dungeon.level == 5:
            self._spawn_floor_lore(dungeon, player, lore_entries, self._get_floor5_lore_config())
        elif dungeon.level == 6:
            self._spawn_floor_lore(dungeon, player, lore_entries, self._get_floor6_lore_config())
        elif dungeon.level == 7:
            self._spawn_floor_lore(dungeon, player, lore_entries, self._get_floor7_lore_config())
        elif dungeon.level == 8:
            self._spawn_floor_lore(dungeon, player, lore_entries, self._get_floor8_lore_config())
        else:
            # Default behavior for other floors
            for lore_id, entry in lore_entries:
                if random.random() < 0.7:
                    pos = dungeon.get_random_floor_position()
                    if pos[0] != player.x or pos[1] != player.y:
                        try:
                            lore_item = create_lore_item(lore_id, pos[0], pos[1])
                            self.items.append(lore_item)
                        except ValueError:
                            pass

    def _get_floor1_lore_config(self) -> dict:
        """Floor 1 zone lore configuration."""
        return {
            "wardens_office": (1.0, 1),   # Guaranteed 1 lore
            "record_vaults": (0.6, 2),    # 60% chance, up to 2 lore
            "cell_blocks": (0.3, 1),      # 30% chance, max 1
            "guard_corridors": (0.2, 1),  # 20% chance, max 1
            "execution_chambers": (0.4, 1),  # 40% chance, max 1
            "boss_approach": (1.0, 1),    # Guaranteed 1 lore
            "intake_hall": (0.3, 1),      # 30% chance, max 1
        }

    def _get_floor2_lore_config(self) -> dict:
        """Floor 2 zone lore configuration.

        Canonical zones: waste_channels, carrier_nests, confluence_chambers,
        maintenance_tunnels, diseased_pools, seal_drifts, colony_heart, boss_approach
        """
        return {
            "colony_heart": (1.0, 1),          # Guaranteed 1 lore (anchor)
            "seal_drifts": (0.7, 2),           # 70% chance, up to 2 lore (surface-doc biased)
            "carrier_nests": (0.2, 1),         # 20% chance, max 1
            "waste_channels": (0.15, 1),       # 15% chance, max 1
            "maintenance_tunnels": (0.25, 1),  # 25% chance, max 1
            "diseased_pools": (0.3, 1),        # 30% chance, max 1
            "boss_approach": (1.0, 1),         # Guaranteed 1 lore
            "confluence_chambers": (0.25, 1),  # 25% chance, max 1 (start zone)
        }

    def _get_floor3_lore_config(self) -> dict:
        """Floor 3 zone lore configuration.

        Canonical zones: root_warrens, canopy_halls, webbed_gardens, the_nursery,
        digestion_chambers, druid_ring, boss_approach
        """
        return {
            "druid_ring": (1.0, 1),            # Guaranteed 1 lore (anchor)
            "webbed_gardens": (0.3, 1),        # 20-35% chance, max 1
            "canopy_halls": (0.2, 1),          # 15-25% chance, max 1
            "the_nursery": (0.15, 1),              # 10-20% chance, max 1
            "digestion_chambers": (0.15, 1),   # 10-20% chance, max 1
            "root_warrens": (0.2, 1),          # 15-25% chance, max 1
            "boss_approach": (1.0, 1),         # Guaranteed 1 lore
        }

    def _get_floor4_lore_config(self) -> dict:
        """Floor 4 zone lore configuration.

        Canonical zones: courtyard_squares, throne_hall_ruins, parade_corridors,
        seal_chambers, record_vaults, mausoleum_district, oath_chambers, boss_approach
        """
        return {
            "oath_chambers": (1.0, 1),         # Guaranteed 1 lore (anchor)
            "throne_hall_ruins": (0.7, 1),     # 60-80% chance, max 1
            "seal_chambers": (0.75, 2),        # 60-85% chance, up to 2 (bureaucracy lore)
            "record_vaults": (0.75, 2),        # 60-85% chance, up to 2 (archive lore)
            "mausoleum_district": (0.4, 1),    # 30-50% chance, max 1
            "courtyard_squares": (0.25, 1),    # 20-35% chance, max 1
            "parade_corridors": (0.15, 1),     # 10-20% chance, max 1
            "boss_approach": (1.0, 1),         # Guaranteed 1 lore
        }

    def _get_floor5_lore_config(self) -> dict:
        """Floor 5 zone lore configuration.

        Canonical zones: frozen_galleries, ice_tombs, crystal_grottos,
        suspended_laboratories, breathing_chamber, thaw_fault, boss_approach
        Lore bias: delver journals + treaty contradictions in labs/tombs.
        """
        return {
            "suspended_laboratories": (1.0, 2),    # Guaranteed 1-2 lore (research docs)
            "ice_tombs": (0.8, 2),                 # 80% chance, up to 2 (preserved journals)
            "breathing_chamber": (0.7, 1),         # 70% chance, max 1 (anchor)
            "thaw_fault": (0.5, 1),                # 50% chance, max 1 (paradox lore)
            "crystal_grottos": (0.4, 1),           # 40% chance, max 1
            "frozen_galleries": (0.2, 1),          # 20% chance, max 1 (corridor)
            "boss_approach": (1.0, 1),             # Guaranteed 1 lore
        }

    def _get_floor6_lore_config(self) -> dict:
        """Floor 6 zone lore configuration.

        Canonical zones: reading_halls, forbidden_stacks, catalog_chambers,
        indexing_heart, experiment_archives, marginalia_alcoves, boss_approach
        Lore bias: arcane research + surface authority docs (library records).
        """
        return {
            "indexing_heart": (1.0, 1),            # Guaranteed 1 lore (anchor)
            "catalog_chambers": (0.75, 1),         # 50-75% chance (bureaucracy hub)
            "forbidden_stacks": (0.4, 1),          # 25-40% chance (dangerous knowledge)
            "experiment_archives": (0.6, 1),       # 35-60% chance (research residue)
            "marginalia_alcoves": (0.6, 1),        # 40-70% chance (hints in margins)
            "reading_halls": (0.25, 1),            # 15-25% chance (public zone)
            "boss_approach": (1.0, 1),             # Guaranteed 1 lore
        }

    def _get_floor7_lore_config(self) -> dict:
        """Floor 7 zone lore configuration.

        Canonical zones: forge_halls, magma_channels, cooling_chambers, slag_pits,
        rune_press, ash_galleries, crucible_heart, boss_approach
        Lore bias: smith records + obsidian tablets (transformation lore).
        """
        return {
            "crucible_heart": (1.0, 1),            # Guaranteed 1 lore (anchor)
            "rune_press": (0.6, 1),                # 35-60% chance (imprint lore)
            "forge_halls": (0.35, 1),              # 20-35% chance
            "magma_channels": (0.2, 1),            # 10-20% chance (hazard zone)
            "cooling_chambers": (0.2, 1),          # 10-20% chance
            "slag_pits": (0.2, 1),                 # 10-20% chance
            "ash_galleries": (0.2, 1),             # 10-20% chance
            "boss_approach": (1.0, 1),             # Guaranteed 1 lore
        }

    def _get_floor8_lore_config(self) -> dict:
        """Floor 8 zone lore configuration.

        Canonical zones: crystal_gardens, geometry_wells, seal_chambers,
        dragons_hoard, vault_antechamber, oath_interface, boss_approach
        Lore bias: dragon pact + seal history + last king's testament.
        """
        return {
            "dragons_hoard": (1.0, 1),             # Guaranteed 1 lore (anchor)
            "oath_interface": (0.85, 1),           # 70-100% chance (pact lore)
            "vault_antechamber": (0.75, 1),        # 60-90% chance (threshold lore)
            "seal_chambers": (0.5, 1),             # 30-55% chance
            "geometry_wells": (0.3, 1),            # 15-30% chance
            "crystal_gardens": (0.2, 1),           # 10-20% chance
            "boss_approach": (1.0, 1),             # Guaranteed 1 lore
        }

    def _spawn_floor_lore(self, dungeon: 'Dungeon', player: Player, lore_entries: list, zone_config: dict):
        """Spawn lore items using zone configuration."""
        from ..items import create_lore_item

        zone_lore_counts = {zone: 0 for zone in zone_config}
        lore_pool = list(lore_entries)

        for room in dungeon.rooms:
            zone = room.zone
            if zone not in zone_config:
                continue

            spawn_chance, max_lore = zone_config[zone]

            if zone_lore_counts[zone] >= max_lore:
                continue

            if random.random() > spawn_chance:
                continue

            if not lore_pool:
                break

            lore_id, entry = random.choice(lore_pool)
            pos = self._get_floor_in_room(dungeon, room, player)
            if pos:
                try:
                    lore_item = create_lore_item(lore_id, pos[0], pos[1])
                    self.items.append(lore_item)
                    zone_lore_counts[zone] += 1
                    lore_pool.remove((lore_id, entry))
                except ValueError:
                    pass

    def _get_floor_in_room(self, dungeon: 'Dungeon', room, player: Player):
        """Find a random walkable floor position within a room."""
        from ..world.dungeon import Room
        attempts = 20
        for _ in range(attempts):
            x = random.randint(room.x + 1, room.x + room.width - 2)
            y = random.randint(room.y + 1, room.y + room.height - 2)
            if (dungeon.is_walkable(x, y) and
                (x != player.x or y != player.y)):
                return (x, y)
        return None

    def spawn_items(self, dungeon: 'Dungeon', player: Player):
        """Spawn items in random locations."""
        from ..items import CONSUMABLE_TYPES, EQUIPMENT_TYPES, create_lore_item
        from ..story.story_data import get_lore_entries_for_level

        self.items.clear()

        # GUARANTEED: 2 health potions per level for survivability
        for _ in range(2):
            pos = dungeon.get_random_floor_position()
            if pos[0] != player.x or pos[1] != player.y:
                item = create_item(ItemType.HEALTH_POTION, pos[0], pos[1])
                self.items.append(item)

        # RANDOM: 0-2 additional consumable items
        num_consumables = random.randint(0, 2)
        for _ in range(num_consumables):
            pos = dungeon.get_random_floor_position()
            if pos[0] != player.x or pos[1] != player.y:
                item_type = random.choice(CONSUMABLE_TYPES)
                item = create_item(item_type, pos[0], pos[1])
                self.items.append(item)

        # RANDOM: 0-2 equipment items per level (rarer than consumables)
        num_equipment = random.randint(0, 2)
        for _ in range(num_equipment):
            pos = dungeon.get_random_floor_position()
            if pos[0] != player.x or pos[1] != player.y:
                # Weight equipment by rarity (common more likely than rare)
                equipment_weights = [3, 2, 1, 3, 2, 1]  # Dagger, Sword, Axe, Leather, Chain, Plate
                item_type = random.choices(EQUIPMENT_TYPES, weights=equipment_weights)[0]
                item = create_item(item_type, pos[0], pos[1])
                self.items.append(item)

        # LORE: Spawn level-appropriate lore items with zone awareness
        self._spawn_zone_lore(dungeon, player)

        # v5.5: ARTIFACTS - 0-1 per floor, zone-biased
        self._spawn_artifact(dungeon, player)

    def _spawn_artifact(self, dungeon: 'Dungeon', player: Player):
        """Spawn 0-1 artifact per floor with zone bias.

        Artifacts spawn in biased zones based on their type.
        Uses deterministic seeding based on floor number.
        """
        # Initialize artifact manager for this floor
        # Seed based on floor for determinism
        floor_seed = dungeon.level * 7777
        self.artifact_manager.initialize_floor(dungeon.level, floor_seed)

        # If no artifact spawns this floor, return
        if not self.artifact_manager.floor_artifact:
            return

        # Use seeded RNG for placement
        rng = random.Random(floor_seed + 1)

        # Try to place in biased zones first
        bias_zones = self.artifact_manager.get_spawn_zone_bias()

        for room in dungeon.rooms:
            if not room.zone:
                continue

            if room.zone in bias_zones:
                # Get floor positions in this room
                positions = []
                for x in range(room.x + 1, room.x + room.width - 1):
                    for y in range(room.y + 1, room.y + room.height - 1):
                        if dungeon.is_walkable(x, y):
                            # Not on player, not on stairs
                            if (x, y) != (player.x, player.y):
                                if dungeon.stairs_down_pos != (x, y):
                                    if dungeon.stairs_up_pos != (x, y):
                                        positions.append((x, y))

                if self.artifact_manager.place_in_zone(room.zone, positions, rng):
                    return  # Placed successfully

        # Fallback: place anywhere if not placed in biased zone
        all_positions = []
        for room in dungeon.rooms:
            for x in range(room.x + 1, room.x + room.width - 1):
                for y in range(room.y + 1, room.y + room.height - 1):
                    if dungeon.is_walkable(x, y):
                        if (x, y) != (player.x, player.y):
                            all_positions.append((x, y))

        self.artifact_manager.force_place(all_positions, rng)

    def spawn_boss(self, dungeon: 'Dungeon', player: Player):
        """Spawn the level boss in the boss room (largest room)."""
        from ..core.constants import LEVEL_BOSS_MAP

        # Get boss type for this level
        boss_type = LEVEL_BOSS_MAP.get(dungeon.level)
        if not boss_type:
            return

        # Find the largest room for boss placement
        if not dungeon.rooms:
            return

        boss_room = max(dungeon.rooms, key=lambda r: r.width * r.height)

        # Get room center
        cx = boss_room.x + boss_room.width // 2
        cy = boss_room.y + boss_room.height // 2

        # Remove any regular enemies from the boss room
        boss_room_enemies = [
            e for e in self.enemies
            if (boss_room.x <= e.x < boss_room.x + boss_room.width and
                boss_room.y <= e.y < boss_room.y + boss_room.height)
        ]
        for enemy in boss_room_enemies:
            self.enemies.remove(enemy)

        # Create boss enemy
        boss = Enemy(cx, cy)
        boss.make_boss(boss_type)

        self.enemies.append(boss)
        self.boss = boss
        self.boss_defeated = False

    def get_enemy_at(self, x: int, y: int) -> Optional[Enemy]:
        """Get the living enemy at the given position, or None."""
        for enemy in self.enemies:
            if enemy.is_alive() and enemy.x == x and enemy.y == y:
                return enemy
        return None

    def get_living_enemies(self) -> List[Enemy]:
        """Get all living enemies."""
        return [e for e in self.enemies if e.is_alive()]

    def get_item_at(self, x: int, y: int) -> Optional[Item]:
        """Get item at the given position, or None."""
        for item in self.items:
            if item.x == x and item.y == y:
                return item
        return None

    def remove_item(self, item: Item):
        """Remove an item from the world."""
        if item in self.items:
            self.items.remove(item)

    def add_item(self, item: Item):
        """Add an item to the world."""
        self.items.append(item)

    def check_item_pickup(self, player: Player, add_message_func) -> Optional[Item]:
        """
        Check if player is standing on an item and pick it up.

        Returns:
            The picked up item, or None if no item was picked up

        Note: Lore items (scrolls/books) are handled specially - they go directly
        to the lore codex and don't take up inventory space. The item is still
        returned so the caller can process the lore discovery.
        """
        for item in self.items[:]:  # Use slice to iterate over copy
            if item is None:
                continue
            if item.x == player.x and item.y == player.y:
                # Check if this is a lore item (has lore_id attribute)
                is_lore_item = hasattr(item, 'lore_id') and item.lore_id

                if is_lore_item:
                    # Lore items go directly to codex - don't add to inventory
                    self.items.remove(item)
                    item_name = item.name if hasattr(item, 'name') and item.name else "item"
                    add_message_func(f"Found: {item_name}")
                    add_message_func("New lore added to Codex! Press [J] to read.")
                    return item
                else:
                    # Regular items go to inventory
                    if player.inventory.add_item(item):
                        self.items.remove(item)
                        item_name = item.name if hasattr(item, 'name') and item.name else "item"
                        add_message_func(f"Picked up {item_name}")
                        return item
                    else:
                        add_message_func("Inventory full!")
                        return None
        return None

    def check_artifact_pickup(self, player: Player, add_message_func) -> Optional[ArtifactInstance]:
        """
        Check if player is standing on an artifact and pick it up.

        Returns:
            The artifact instance if picked up, None otherwise
        """
        artifact = self.artifact_manager.collect_artifact(player.x, player.y)

        if artifact:
            # Check if player can hold more artifacts (max 2)
            if len(player.artifacts) >= 2:
                add_message_func("You cannot carry more artifacts!")
                # Put artifact back
                self.artifact_manager.floor_artifact = artifact
                self.artifact_manager.spawn_position = (player.x, player.y)
                return None

            # Add to player
            player.artifacts.append(artifact)
            add_message_func(f"You found {artifact.name}!")
            add_message_func(f"  {artifact.description}")
            return artifact

        return None

    def has_artifact_at(self, x: int, y: int) -> bool:
        """Check if there's an uncollected artifact at position."""
        return self.artifact_manager.has_artifact_at(x, y)

    def get_artifact_info_at(self, x: int, y: int) -> Optional[dict]:
        """Get artifact info at position for rendering."""
        if not self.artifact_manager.has_artifact_at(x, y):
            return None
        artifact = self.artifact_manager.floor_artifact
        if artifact:
            from ..items.artifacts import ARTIFACT_DATA
            data = ARTIFACT_DATA[artifact.artifact_id]
            return {
                'symbol': data['symbol'],
                'name': data['name'],
            }
        return None
