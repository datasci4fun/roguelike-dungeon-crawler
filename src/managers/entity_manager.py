"""Entity spawning and management."""
import random
from typing import TYPE_CHECKING, List, Optional

from ..entities import Player, Enemy
from ..items import Item, ItemType, create_item

if TYPE_CHECKING:
    from ..world import Dungeon


class EntityManager:
    """Manages spawning and querying of entities (enemies, items)."""

    def __init__(self):
        self.enemies: List[Enemy] = []
        self.items: List[Item] = []
        self.boss: Optional[Enemy] = None
        self.boss_defeated: bool = False

    def spawn_enemies(self, dungeon: 'Dungeon', player: Player):
        """Spawn enemies in random rooms with weighted type selection.

        Enemy weights are modified by zone (Floor 1 zone system).
        """
        from ..core.constants import ELITE_SPAWN_RATE, ENEMY_STATS, EnemyType

        self.enemies.clear()
        num_enemies = min(len(dungeon.rooms) * 2, 15)  # 2 enemies per room, max 15

        # Get base enemy types filtered by dungeon level
        current_level = dungeon.level
        base_enemy_types = []
        base_weights = []

        for enemy_type, stats in ENEMY_STATS.items():
            min_lvl = stats.get('min_level', 1)
            max_lvl = stats.get('max_level', 5)
            # Only include enemies appropriate for this dungeon level
            if min_lvl <= current_level <= max_lvl:
                base_enemy_types.append(enemy_type)
                base_weights.append(stats['weight'])

        if not base_enemy_types:
            # Fallback to basic enemies if none match
            base_enemy_types = [EnemyType.GOBLIN, EnemyType.SKELETON]
            base_weights = [40, 30]

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

                # 20% chance to spawn elite enemy (0% in intake_hall for Floor 1)
                elite_rate = ELITE_SPAWN_RATE
                if zone == "intake_hall":
                    elite_rate = 0.0
                is_elite = random.random() < elite_rate

                enemy = Enemy(pos[0], pos[1], enemy_type=enemy_type, is_elite=is_elite)
                self.enemies.append(enemy)

    def _apply_zone_weights(self, enemy_types: list, weights: list, zone: str, level: int) -> list:
        """Apply zone-specific weight modifiers to enemy spawn weights.

        Implements zone modifiers for Floors 1-2.
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
        # Canonical zones: waste_channels, carrier_nests, confluence_chambers,
        # maintenance_tunnels, diseased_pools, seal_drifts, colony_heart, boss_approach
        elif level == 2:
            zone_modifiers = {
                "carrier_nests": {EnemyType.GOBLIN: 0.5, EnemyType.SKELETON: 0.7},  # Rats bias (reduce others)
                "waste_channels": {EnemyType.SKELETON: 1.2},
                "seal_drifts": {},  # Low combat, handled by density
                "colony_heart": {EnemyType.GOBLIN: 0.3, EnemyType.SKELETON: 0.5},  # Rats dominate
                "diseased_pools": {EnemyType.SKELETON: 1.3},  # Undead bias
                "maintenance_tunnels": {},  # Default weights
                "boss_approach": {EnemyType.GOBLIN: 0.3},  # Rats bias x2
                "confluence_chambers": {},  # Start zone, default weights
            }
            modifiers = zone_modifiers.get(zone, {})
            for i, enemy_type in enumerate(enemy_types):
                if enemy_type in modifiers:
                    weights[i] = int(weights[i] * modifiers[enemy_type])

        # Floor 3 zone modifiers (Forest Depths)
        # Canonical zones: root_warrens, canopy_halls, webbed_gardens, the_nursery,
        # digestion_chambers, druid_ring, boss_approach
        # Spider bias overall (reduce goblin/orc, keep skeleton for variety)
        elif level == 3:
            zone_modifiers = {
                "the_nursery": {EnemyType.GOBLIN: 0.3, EnemyType.ORC: 0.2},  # Spider density x1.8
                "webbed_gardens": {EnemyType.GOBLIN: 0.2, EnemyType.ORC: 0.2},  # Spider bias x2.0
                "druid_ring": {EnemyType.GOBLIN: 0.5, EnemyType.SKELETON: 0.5},  # Low density
                "digestion_chambers": {EnemyType.GOBLIN: 0.4},  # Low-to-normal
                "canopy_halls": {EnemyType.SKELETON: 1.2},  # Mixed, slight skeleton
                "root_warrens": {EnemyType.GOBLIN: 0.6},  # Spider bias x1.5
                "boss_approach": {EnemyType.GOBLIN: 0.2, EnemyType.ORC: 0.2},  # Spider bias x2.0
            }
            modifiers = zone_modifiers.get(zone, {})
            for i, enemy_type in enumerate(enemy_types):
                if enemy_type in modifiers:
                    weights[i] = int(weights[i] * modifiers[enemy_type])

        # Floor 4 zone modifiers (Mirror Valdris)
        # Canonical zones: courtyard_squares, throne_hall_ruins, parade_corridors,
        # seal_chambers, record_vaults, mausoleum_district, oath_chambers, boss_approach
        # Skeleton/undead bias overall (oath-dead servants)
        elif level == 4:
            zone_modifiers = {
                "mausoleum_district": {EnemyType.SKELETON: 2.0, EnemyType.GOBLIN: 0.3},  # Undead x2
                "throne_hall_ruins": {EnemyType.SKELETON: 1.2},  # Honor guard skeletons
                "record_vaults": {EnemyType.SKELETON: 1.4, EnemyType.GOBLIN: 0.5},  # Clerk undead
                "oath_chambers": {EnemyType.SKELETON: 1.3, EnemyType.GOBLIN: 0.4},  # Low density
                "courtyard_squares": {EnemyType.SKELETON: 1.2, EnemyType.ORC: 1.2},  # Patrol bias
                "seal_chambers": {EnemyType.GOBLIN: 0.6},  # Low-to-normal
                "parade_corridors": {},  # Normal distribution
                "boss_approach": {EnemyType.SKELETON: 1.6, EnemyType.GOBLIN: 0.4},  # Skeleton x1.6
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
        """
        for item in self.items[:]:  # Use slice to iterate over copy
            if item is None:
                continue
            if item.x == player.x and item.y == player.y:
                if player.inventory.add_item(item):
                    self.items.remove(item)
                    item_name = item.name if hasattr(item, 'name') and item.name else "item"
                    add_message_func(f"Picked up {item_name}")
                    return item
                else:
                    add_message_func("Inventory full!")
                    return None
        return None
