"""Entity spawning and management."""
import random
from typing import TYPE_CHECKING, List, Optional

from ..entities import Player, Enemy
from ..items import Item, ItemType, create_item, ArtifactManager, ArtifactInstance
from . import entity_spawning
from . import lore_spawning

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
        """Spawn enemies in random rooms with weighted type selection."""
        entity_spawning.spawn_enemies(self.enemies, dungeon, player)

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
        lore_spawning.spawn_zone_lore(self.items, dungeon, player)

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
