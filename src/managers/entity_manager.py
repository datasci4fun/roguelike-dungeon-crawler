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

    def spawn_enemies(self, dungeon: 'Dungeon', player: Player):
        """Spawn enemies in random rooms with weighted type selection."""
        from ..core.constants import ELITE_SPAWN_RATE, ENEMY_STATS, EnemyType

        self.enemies.clear()
        num_enemies = min(len(dungeon.rooms) * 2, 15)  # 2 enemies per room, max 15

        # Get weighted list of enemy types
        enemy_types = list(ENEMY_STATS.keys())
        weights = [ENEMY_STATS[t]['weight'] for t in enemy_types]

        for _ in range(num_enemies):
            pos = dungeon.get_random_floor_position()
            # Make sure not too close to player
            if abs(pos[0] - player.x) > 5 or abs(pos[1] - player.y) > 5:
                # Select enemy type using weighted random selection
                enemy_type = random.choices(enemy_types, weights=weights)[0]

                # 20% chance to spawn elite enemy
                is_elite = random.random() < ELITE_SPAWN_RATE

                enemy = Enemy(pos[0], pos[1], enemy_type=enemy_type, is_elite=is_elite)
                self.enemies.append(enemy)

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

        # LORE: Spawn level-appropriate lore items (scrolls/books)
        lore_entries = get_lore_entries_for_level(dungeon.level)
        for lore_id, entry in lore_entries:
            # 70% chance to spawn each lore item on its appropriate level
            if random.random() < 0.7:
                pos = dungeon.get_random_floor_position()
                if pos[0] != player.x or pos[1] != player.y:
                    try:
                        lore_item = create_lore_item(lore_id, pos[0], pos[1])
                        self.items.append(lore_item)
                    except ValueError:
                        pass  # Skip if lore entry not found

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
            if item.x == player.x and item.y == player.y:
                if player.inventory.add_item(item):
                    self.items.remove(item)
                    add_message_func(f"Picked up {item.name}")
                    return item
                else:
                    add_message_func("Inventory full!")
                    return None
        return None
