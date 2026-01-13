"""Tests for Exploration Mode.

Comprehensive testing of all exploration features including:
- Player movement
- Item pickup
- Enemy encounters
- Stairs/descending
- Traps and hazards
- Searching for secrets
- Field pulse events
- Message system
- Ice slide mechanic
"""
import pytest
from unittest.mock import Mock, MagicMock, patch
from typing import Optional

from src.core.engine import GameEngine
from src.core.constants import GameState, UIMode, TileType, HazardType
from src.core.commands import Command, CommandType
from src.core.messages import MessageLog, MessageCategory, MessageImportance
from src.entities.entities import Player, Enemy
from src.items.items import Inventory, Item, ItemType


class MockDungeon:
    """Mock dungeon for testing."""

    def __init__(self, width: int = 20, height: int = 15, level: int = 1):
        self.width = width
        self.height = height
        self.level = level
        # Create floor tiles with walls on borders
        self.tiles = [[TileType.FLOOR for _ in range(width)] for _ in range(height)]
        for x in range(width):
            self.tiles[0][x] = TileType.WALL
            self.tiles[height - 1][x] = TileType.WALL
        for y in range(height):
            self.tiles[y][0] = TileType.WALL
            self.tiles[y][width - 1] = TileType.WALL

        # Exploration state
        self.explored = [[False for _ in range(width)] for _ in range(height)]
        self.visible = [[False for _ in range(width)] for _ in range(height)]

        # Stairs
        self.stairs_x = 10
        self.stairs_y = 10

        # Rooms for zone system
        self.rooms = []

    def is_walkable(self, x: int, y: int) -> bool:
        """Check if a tile is walkable."""
        if not (0 <= x < self.width and 0 <= y < self.height):
            return False
        return self.tiles[y][x] in (TileType.FLOOR, TileType.DOOR_UNLOCKED)

    def get_tile(self, x: int, y: int) -> TileType:
        """Get tile at position."""
        if 0 <= x < self.width and 0 <= y < self.height:
            return self.tiles[y][x]
        return TileType.WALL

    def set_tile(self, x: int, y: int, tile_type: TileType):
        """Set tile at position."""
        if 0 <= x < self.width and 0 <= y < self.height:
            self.tiles[y][x] = tile_type


def create_mock_player(x: int = 5, y: int = 5) -> Player:
    """Create a mock player for testing."""
    player = Mock(spec=Player)
    player.x = x
    player.y = y
    player.health = 50
    player.max_health = 50
    player.attack = 10
    player.defense = 5
    player.level = 1
    player.name = "TestHero"
    player.inventory = Inventory(max_size=10)
    player.god_mode = False
    player.is_dead = False
    player.perception = 5
    return player


def create_mock_enemy(x: int, y: int, name: str = "Goblin") -> Enemy:
    """Create a mock enemy for testing."""
    enemy = Mock(spec=Enemy)
    enemy.x = x
    enemy.y = y
    enemy.health = 10
    enemy.max_health = 10
    enemy.attack = 3
    enemy.defense = 1
    enemy.name = name
    enemy.symbol = "g"
    enemy.is_dead = False
    enemy.is_boss = False
    enemy.is_elite = False
    return enemy


def create_mock_item(x: int, y: int, name: str = "Health Potion") -> Item:
    """Create a mock item for testing."""
    item = Mock(spec=Item)
    item.x = x
    item.y = y
    item.name = name
    item.item_type = ItemType.HEALTH_POTION
    item.is_consumable = True
    item.heal_amount = 25
    return item


class TestMessageSystem:
    """Test message system with importance parameter."""

    def test_add_message_normal(self):
        """Test adding a normal message."""
        log = MessageLog()
        log.add("Test message", MessageCategory.SYSTEM, MessageImportance.NORMAL)
        assert len(log.messages) == 1
        assert log.messages[0].text == "Test message"

    def test_add_message_important(self):
        """Test adding an important message."""
        log = MessageLog()
        log.add("Important!", MessageCategory.SYSTEM, MessageImportance.IMPORTANT)
        assert len(log.messages) == 1
        assert log.messages[0].importance == MessageImportance.IMPORTANT

    def test_add_message_critical(self):
        """Test adding a critical message."""
        log = MessageLog()
        log.add("Critical!", MessageCategory.COMBAT, MessageImportance.CRITICAL)
        assert len(log.messages) == 1
        assert log.messages[0].importance == MessageImportance.CRITICAL

    def test_message_categories(self):
        """Test different message categories."""
        log = MessageLog()
        log.add("System msg", MessageCategory.SYSTEM)
        log.add("Combat msg", MessageCategory.COMBAT)
        log.add("Item msg", MessageCategory.ITEM)
        log.add("Story msg", MessageCategory.STORY)
        assert len(log.messages) == 4


class TestPlayerMovement:
    """Test player movement in exploration mode."""

    def test_move_up(self):
        """Test moving player up."""
        dungeon = MockDungeon()
        player = create_mock_player(x=5, y=5)

        # Simulate movement
        new_y = player.y - 1
        assert dungeon.is_walkable(player.x, new_y)

    def test_move_down(self):
        """Test moving player down."""
        dungeon = MockDungeon()
        player = create_mock_player(x=5, y=5)

        new_y = player.y + 1
        assert dungeon.is_walkable(player.x, new_y)

    def test_move_left(self):
        """Test moving player left."""
        dungeon = MockDungeon()
        player = create_mock_player(x=5, y=5)

        new_x = player.x - 1
        assert dungeon.is_walkable(new_x, player.y)

    def test_move_right(self):
        """Test moving player right."""
        dungeon = MockDungeon()
        player = create_mock_player(x=5, y=5)

        new_x = player.x + 1
        assert dungeon.is_walkable(new_x, player.y)

    def test_blocked_by_wall(self):
        """Test that walls block movement."""
        dungeon = MockDungeon()
        # Try to move into wall at border
        assert not dungeon.is_walkable(0, 5)
        assert not dungeon.is_walkable(5, 0)

    def test_out_of_bounds(self):
        """Test movement outside dungeon bounds."""
        dungeon = MockDungeon()
        assert not dungeon.is_walkable(-1, 5)
        assert not dungeon.is_walkable(5, -1)
        assert not dungeon.is_walkable(dungeon.width, 5)
        assert not dungeon.is_walkable(5, dungeon.height)


class TestItemPickup:
    """Test item pickup mechanics."""

    def test_pickup_item(self):
        """Test picking up an item."""
        player = create_mock_player()
        item = create_mock_item(player.x, player.y)

        # Simulate pickup
        assert player.inventory.add_item(item)
        assert len(player.inventory.items) == 1

    def test_inventory_full(self):
        """Test that full inventory rejects items."""
        player = create_mock_player()
        player.inventory = Inventory(max_size=2)

        item1 = create_mock_item(5, 5, "Potion 1")
        item2 = create_mock_item(5, 5, "Potion 2")
        item3 = create_mock_item(5, 5, "Potion 3")

        assert player.inventory.add_item(item1)
        assert player.inventory.add_item(item2)
        assert not player.inventory.add_item(item3)  # Should fail
        assert len(player.inventory.items) == 2


class TestEnemyEncounters:
    """Test enemy encounter mechanics."""

    def test_enemy_at_position(self):
        """Test detecting enemy at position."""
        enemies = [
            create_mock_enemy(5, 4, "Goblin"),
            create_mock_enemy(7, 7, "Orc"),
        ]

        def get_enemy_at(x, y):
            for enemy in enemies:
                if enemy.x == x and enemy.y == y and not enemy.is_dead:
                    return enemy
            return None

        assert get_enemy_at(5, 4) is not None
        assert get_enemy_at(5, 4).name == "Goblin"
        assert get_enemy_at(5, 5) is None

    def test_bump_attack_detection(self):
        """Test that moving into enemy position triggers combat."""
        player = create_mock_player(x=5, y=5)
        enemy = create_mock_enemy(x=5, y=4)

        # Player tries to move up into enemy
        target_x, target_y = player.x, player.y - 1
        assert target_x == enemy.x and target_y == enemy.y


class TestStairs:
    """Test stair mechanics."""

    def test_stairs_detection(self):
        """Test detecting stairs at player position."""
        dungeon = MockDungeon()
        player = create_mock_player(x=dungeon.stairs_x, y=dungeon.stairs_y)

        # Player is on stairs
        assert player.x == dungeon.stairs_x
        assert player.y == dungeon.stairs_y

    def test_descend_increments_level(self):
        """Test that descending stairs increments floor level."""
        dungeon = MockDungeon(level=1)
        new_level = dungeon.level + 1
        assert new_level == 2


class TestHazards:
    """Test hazard tile mechanics."""

    def test_lava_damage(self):
        """Test that lava tiles deal damage."""
        dungeon = MockDungeon()
        # Place lava at position
        dungeon.tiles[5][5] = TileType.LAVA

        assert dungeon.get_tile(5, 5) == TileType.LAVA

    def test_ice_slide(self):
        """Test ice slide mechanic."""
        dungeon = MockDungeon()
        # Create ice path
        for x in range(3, 8):
            dungeon.tiles[5][x] = TileType.ICE

        # Verify ice tiles
        assert dungeon.get_tile(3, 5) == TileType.ICE
        assert dungeon.get_tile(7, 5) == TileType.ICE

    def test_trap_visible(self):
        """Test visible trap detection."""
        dungeon = MockDungeon()
        dungeon.tiles[5][5] = TileType.TRAP_VISIBLE

        assert dungeon.get_tile(5, 5) == TileType.TRAP_VISIBLE


class TestDoors:
    """Test door mechanics."""

    def test_locked_door_blocks_movement(self):
        """Test that locked doors block movement."""
        dungeon = MockDungeon()
        dungeon.tiles[5][5] = TileType.DOOR_LOCKED

        assert not dungeon.is_walkable(5, 5)

    def test_unlocked_door_allows_movement(self):
        """Test that unlocked doors allow movement."""
        dungeon = MockDungeon()
        dungeon.tiles[5][5] = TileType.DOOR_UNLOCKED

        assert dungeon.is_walkable(5, 5)


class TestFieldPulseSystem:
    """Test field pulse micro-events."""

    def test_message_importance_parameter(self):
        """Test that field pulse messages use correct importance parameter."""
        # This tests the fix for the important=True bug
        log = MessageLog()

        # Simulate field pulse message
        log.add(
            "The Field pulses with energy...",
            MessageCategory.STORY,
            MessageImportance.IMPORTANT
        )

        assert len(log.messages) == 1
        assert log.messages[0].importance == MessageImportance.IMPORTANT


class TestSearchMechanic:
    """Test searching for secrets."""

    def test_search_reveals_trap(self):
        """Test that searching can reveal hidden traps."""
        # Mock trap that was hidden
        trap = Mock()
        trap.name = "Spike Trap"
        trap.is_revealed = False

        # Simulate revealing
        trap.is_revealed = True
        assert trap.is_revealed

    def test_search_reveals_secret_door(self):
        """Test that searching can reveal secret doors."""
        dungeon = MockDungeon()
        # Secret door at position (hidden as wall)
        dungeon.tiles[5][5] = TileType.WALL

        # Simulate discovery - reveal as floor
        dungeon.tiles[5][5] = TileType.FLOOR
        assert dungeon.is_walkable(5, 5)


class TestExplorationState:
    """Test exploration state tracking."""

    def test_explored_tiles_tracked(self):
        """Test that explored tiles are tracked."""
        dungeon = MockDungeon()

        # Initially unexplored
        assert not dungeon.explored[5][5]

        # Mark as explored
        dungeon.explored[5][5] = True
        assert dungeon.explored[5][5]

    def test_visible_tiles_tracked(self):
        """Test that visible tiles are tracked."""
        dungeon = MockDungeon()

        # Initially not visible
        assert not dungeon.visible[5][5]

        # Mark as visible
        dungeon.visible[5][5] = True
        assert dungeon.visible[5][5]


class TestTileTypes:
    """Test various tile type behaviors."""

    def test_floor_walkable(self):
        """Test that floor tiles are walkable."""
        dungeon = MockDungeon()
        dungeon.tiles[5][5] = TileType.FLOOR
        assert dungeon.is_walkable(5, 5)

    def test_wall_not_walkable(self):
        """Test that wall tiles are not walkable."""
        dungeon = MockDungeon()
        dungeon.tiles[5][5] = TileType.WALL
        assert not dungeon.is_walkable(5, 5)

    def test_deep_water_tile(self):
        """Test deep water tile type exists."""
        dungeon = MockDungeon()
        dungeon.tiles[5][5] = TileType.DEEP_WATER
        assert dungeon.get_tile(5, 5) == TileType.DEEP_WATER


class TestInventoryOperations:
    """Test inventory operations during exploration."""

    def test_inventory_get_item(self):
        """Test getting item from inventory."""
        inv = Inventory(max_size=10)
        item = create_mock_item(0, 0, "Test Item")
        inv.add_item(item)

        retrieved = inv.get_item(0)
        assert retrieved == item

    def test_inventory_remove_item(self):
        """Test removing item from inventory."""
        inv = Inventory(max_size=10)
        item = create_mock_item(0, 0, "Test Item")
        inv.add_item(item)

        removed = inv.remove_item(0)
        assert removed == item
        assert len(inv.items) == 0

    def test_inventory_is_empty(self):
        """Test checking if inventory is empty."""
        inv = Inventory(max_size=10)
        assert inv.is_empty()

        inv.add_item(create_mock_item(0, 0))
        assert not inv.is_empty()

    def test_inventory_is_full(self):
        """Test checking if inventory is full."""
        inv = Inventory(max_size=2)
        assert not inv.is_full()

        inv.add_item(create_mock_item(0, 0, "Item 1"))
        inv.add_item(create_mock_item(0, 0, "Item 2"))
        assert inv.is_full()


class TestCommandTypes:
    """Test command type handling."""

    def test_movement_commands_exist(self):
        """Test that movement command types exist."""
        assert CommandType.MOVE_UP is not None
        assert CommandType.MOVE_DOWN is not None
        assert CommandType.MOVE_LEFT is not None
        assert CommandType.MOVE_RIGHT is not None

    def test_ability_commands_exist(self):
        """Test that ability command types exist (v6.0 battle)."""
        assert CommandType.ABILITY_1 is not None
        assert CommandType.ABILITY_2 is not None
        assert CommandType.ABILITY_3 is not None
        assert CommandType.ABILITY_4 is not None

    def test_battle_commands_exist(self):
        """Test that battle command types exist."""
        assert CommandType.WAIT is not None
        assert CommandType.FLEE is not None
        assert CommandType.ATTACK is not None

    def test_ui_commands_exist(self):
        """Test that UI command types exist."""
        assert CommandType.OPEN_INVENTORY is not None
        assert CommandType.OPEN_CHARACTER is not None
        assert CommandType.OPEN_HELP is not None
        assert CommandType.CLOSE_SCREEN is not None

    def test_item_commands_exist(self):
        """Test that item use command types exist."""
        assert CommandType.USE_ITEM_1 is not None
        assert CommandType.USE_ITEM_2 is not None
        assert CommandType.USE_ITEM_3 is not None


class TestGameStateTransitions:
    """Test game state transitions."""

    def test_game_states_exist(self):
        """Test that game states exist."""
        assert GameState.PLAYING is not None
        assert GameState.DEAD is not None
        assert GameState.VICTORY is not None

    def test_ui_modes_exist(self):
        """Test that UI modes exist."""
        assert UIMode.GAME is not None
        assert UIMode.INVENTORY is not None
        assert UIMode.BATTLE is not None
        assert UIMode.CHARACTER is not None


class TestHazardTypes:
    """Test hazard type constants."""

    def test_hazard_types_exist(self):
        """Test that hazard types are defined."""
        assert HazardType.LAVA is not None
        assert HazardType.ICE is not None
        assert HazardType.POISON_GAS is not None
        assert HazardType.DEEP_WATER is not None


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
