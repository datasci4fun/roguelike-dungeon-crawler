"""Tests for Battle Mode Commands.

Comprehensive testing of all combat features including:
- Player movement in arena
- Ability usage (1-4 keys)
- Item usage during battle
- Flee attempts
- Turn processing
- Error handling
"""
import pytest
from unittest.mock import Mock, MagicMock, patch
from typing import Optional

from src.combat.battle_types import BattleState, BattleEntity, BattlePhase, BattleOutcome
from src.combat.battle_manager import BattleManager
from src.items.items import Inventory, Item, ItemType
from src.core.constants import ItemRarity
from src.entities.entities import Player


def create_mock_player(with_inventory: bool = True) -> Mock:
    """Create a mock player with optional inventory."""
    player = Mock(spec=Player)
    player.x = 10
    player.y = 10
    player.health = 50
    player.max_health = 50
    player.attack = 10
    player.defense = 5
    player.name = "TestHero"
    player.player_class = "WARRIOR"
    player.duplicate_next_consumable = False

    if with_inventory:
        # Create real inventory with test items
        player.inventory = Inventory(max_size=10)

        # Add a healing potion (consumable)
        potion = Mock(spec=Item)
        potion.name = "Health Potion"
        potion.item_type = ItemType.HEALTH_POTION
        potion.rarity = ItemRarity.COMMON
        potion.is_consumable = True
        potion.heal_amount = 25
        player.inventory.add_item(potion)

        # Add a weapon (non-consumable)
        sword = Mock(spec=Item)
        sword.name = "Iron Sword"
        sword.item_type = ItemType.WEAPON_SWORD
        sword.rarity = ItemRarity.COMMON
        sword.is_consumable = False
        sword.heal_amount = 0
        player.inventory.add_item(sword)
    else:
        player.inventory = None

    return player


def create_test_battle(
    player_pos: tuple = (4, 5),
    enemy_pos: tuple = (4, 2),
    arena_width: int = 9,
    arena_height: int = 7,
) -> BattleState:
    """Create a test battle state."""
    # Create floor tiles
    tiles = [['.' for _ in range(arena_width)] for _ in range(arena_height)]

    # Add walls on borders
    for x in range(arena_width):
        tiles[0][x] = '#'
        tiles[arena_height - 1][x] = '#'
    for y in range(arena_height):
        tiles[y][0] = '#'
        tiles[y][arena_width - 1] = '#'

    battle = BattleState(
        arena_width=arena_width,
        arena_height=arena_height,
        arena_tiles=tiles,
        biome='STONE',
        floor_level=1,
    )

    # Add player entity
    battle.player = BattleEntity(
        entity_id='player',
        is_player=True,
        arena_x=player_pos[0],
        arena_y=player_pos[1],
        world_x=0,
        world_y=0,
        hp=50,
        max_hp=50,
        attack=10,
        defense=2,
    )
    battle.player.cooldowns = {}
    battle.player.status_effects = []

    # Add enemy
    enemy = BattleEntity(
        entity_id='enemy_1',
        is_player=False,
        arena_x=enemy_pos[0],
        arena_y=enemy_pos[1],
        world_x=0,
        world_y=0,
        hp=20,
        max_hp=20,
        attack=5,
        defense=1,
        name="Goblin",
        symbol="g",
    )
    enemy.cooldowns = {}
    enemy.status_effects = []
    battle.enemies.append(enemy)

    battle.phase = BattlePhase.PLAYER_TURN
    battle.duplicate_seal_armed = False

    return battle


def create_mock_engine(battle: BattleState, player: Mock) -> Mock:
    """Create a mock engine with battle state."""
    engine = Mock()
    engine.battle = battle
    engine.player = player
    engine.add_message = Mock()
    engine.flush_events = Mock(return_value=[])

    # Create mock event manager
    engine.events = Mock()
    engine.events.emit = Mock()

    # Create mock entity manager with enemies list
    engine.entity_manager = Mock()
    engine.entity_manager.enemies = []

    # Create mock dungeon
    engine.dungeon = Mock()
    engine.dungeon.level = 1

    # Create mock field_pulse_manager
    engine.field_pulse_manager = Mock()
    engine.field_pulse_manager.get_current_amplification = Mock(return_value=1.0)

    return engine


class TestBattleMovement:
    """Test player movement in battle."""

    def test_move_up(self):
        """Test MOVE_UP command."""
        battle = create_test_battle(player_pos=(4, 4))
        player = create_mock_player()
        engine = create_mock_engine(battle, player)

        manager = BattleManager(engine)
        initial_y = battle.player.arena_y

        result = manager.process_battle_command('MOVE_UP')

        assert result is True
        assert battle.player.arena_y == initial_y - 1

    def test_move_down(self):
        """Test MOVE_DOWN command."""
        battle = create_test_battle(player_pos=(4, 3))
        player = create_mock_player()
        engine = create_mock_engine(battle, player)

        manager = BattleManager(engine)
        initial_y = battle.player.arena_y

        result = manager.process_battle_command('MOVE_DOWN')

        assert result is True
        assert battle.player.arena_y == initial_y + 1

    def test_move_blocked_by_wall(self):
        """Test that movement into walls is blocked."""
        battle = create_test_battle(player_pos=(1, 1))  # Adjacent to wall
        player = create_mock_player()
        engine = create_mock_engine(battle, player)

        manager = BattleManager(engine)

        result = manager.process_battle_command('MOVE_UP')

        assert result is False
        assert battle.player.arena_y == 1


class TestBattleAbilities:
    """Test ability usage in battle."""

    def test_ability_1(self):
        """Test ABILITY_1 command (basic attack)."""
        # Position player adjacent to enemy for melee attack
        battle = create_test_battle(player_pos=(4, 3), enemy_pos=(4, 2))
        player = create_mock_player()
        engine = create_mock_engine(battle, player)

        manager = BattleManager(engine)
        initial_enemy_hp = battle.enemies[0].hp

        result = manager.process_battle_command('ABILITY_1')

        assert result is True
        # Enemy should have taken damage
        assert battle.enemies[0].hp < initial_enemy_hp

    def test_ability_invalid_index(self):
        """Test ability with invalid index."""
        battle = create_test_battle()
        player = create_mock_player()
        engine = create_mock_engine(battle, player)

        manager = BattleManager(engine)

        # ABILITY_99 should fail gracefully
        result = manager.process_battle_command('ABILITY_99')

        assert result is False

    def test_ability_no_target_in_range(self):
        """Test ability when no enemies in range."""
        # Position player far from enemy
        battle = create_test_battle(player_pos=(2, 5), enemy_pos=(7, 2))
        player = create_mock_player()
        engine = create_mock_engine(battle, player)

        manager = BattleManager(engine)

        result = manager.process_battle_command('ABILITY_1')

        # Should fail - no targets in range for basic attack
        assert result is False


class TestBattleItemUsage:
    """Test item usage during battle."""

    def test_use_item_valid_consumable(self):
        """Test using a valid consumable item."""
        battle = create_test_battle()
        battle.player.hp = 25  # Wounded
        player = create_mock_player(with_inventory=True)
        engine = create_mock_engine(battle, player)

        manager = BattleManager(engine)
        initial_hp = battle.player.hp

        result = manager._try_use_item(0)  # Use first item (potion)

        assert result is True
        assert battle.player.hp > initial_hp

    def test_use_item_non_consumable(self):
        """Test that non-consumable items can't be used in battle."""
        battle = create_test_battle()
        player = create_mock_player(with_inventory=True)
        engine = create_mock_engine(battle, player)

        manager = BattleManager(engine)

        result = manager._try_use_item(1)  # Use second item (sword - not consumable)

        assert result is False

    def test_use_item_invalid_index(self):
        """Test using item with invalid index."""
        battle = create_test_battle()
        player = create_mock_player(with_inventory=True)
        engine = create_mock_engine(battle, player)

        manager = BattleManager(engine)

        result = manager._try_use_item(99)  # Invalid index

        assert result is False

    def test_use_item_negative_index(self):
        """Test using item with negative index."""
        battle = create_test_battle()
        player = create_mock_player(with_inventory=True)
        engine = create_mock_engine(battle, player)

        manager = BattleManager(engine)

        result = manager._try_use_item(-1)  # Negative index

        assert result is False

    def test_use_item_empty_inventory(self):
        """Test using item when inventory is empty."""
        battle = create_test_battle()
        player = create_mock_player(with_inventory=True)
        player.inventory = Inventory(max_size=10)  # Empty inventory
        engine = create_mock_engine(battle, player)

        manager = BattleManager(engine)

        result = manager._try_use_item(0)

        assert result is False

    def test_use_item_no_inventory(self):
        """Test using item when player has no inventory."""
        battle = create_test_battle()
        player = create_mock_player(with_inventory=False)
        engine = create_mock_engine(battle, player)

        manager = BattleManager(engine)

        result = manager._try_use_item(0)

        assert result is False

    def test_use_item_command_parsing(self):
        """Test USE_ITEM_X command parsing."""
        battle = create_test_battle()
        battle.player.hp = 25
        player = create_mock_player(with_inventory=True)
        engine = create_mock_engine(battle, player)

        manager = BattleManager(engine)

        result = manager.process_battle_command('USE_ITEM_0')

        assert result is True


class TestBattleFlee:
    """Test flee mechanics."""

    def test_flee_attempt(self):
        """Test flee attempt."""
        battle = create_test_battle()
        player = create_mock_player()
        engine = create_mock_engine(battle, player)

        manager = BattleManager(engine)

        # Flee should work (may or may not succeed based on RNG)
        result = manager.process_battle_command('FLEE')

        # Command should be processed
        assert result is True


class TestBattleWait:
    """Test wait/pass turn mechanics."""

    def test_wait_command(self):
        """Test WAIT command."""
        battle = create_test_battle()
        player = create_mock_player()
        engine = create_mock_engine(battle, player)

        manager = BattleManager(engine)

        result = manager.process_battle_command('WAIT')

        assert result is True


class TestBattlePhaseChecks:
    """Test battle phase restrictions."""

    def test_command_blocked_during_enemy_turn(self):
        """Test that commands are blocked during enemy turn."""
        battle = create_test_battle()
        battle.phase = BattlePhase.ENEMY_TURN
        player = create_mock_player()
        engine = create_mock_engine(battle, player)

        manager = BattleManager(engine)

        result = manager.process_battle_command('MOVE_UP')

        assert result is False

    def test_command_blocked_when_no_battle(self):
        """Test commands fail gracefully when no battle is active."""
        player = create_mock_player()
        engine = Mock()
        engine.battle = None
        engine.player = player

        manager = BattleManager(engine)

        result = manager.process_battle_command('MOVE_UP')

        assert result is False


class TestInventoryIntegration:
    """Test inventory interactions to catch len() errors."""

    def test_inventory_len_items(self):
        """Verify Inventory.items list exists and has length."""
        inv = Inventory(max_size=10)

        # Should work
        assert len(inv.items) == 0

        # Add item
        item = Mock(spec=Item)
        item.name = "Test"
        inv.add_item(item)

        assert len(inv.items) == 1

    def test_inventory_no_direct_len(self):
        """Verify Inventory class itself doesn't support len()."""
        inv = Inventory(max_size=10)

        # This should raise TypeError - no __len__ method
        with pytest.raises(TypeError):
            len(inv)

    def test_inventory_get_item(self):
        """Test Inventory.get_item method."""
        inv = Inventory(max_size=10)

        item = Mock(spec=Item)
        item.name = "Test"
        inv.add_item(item)

        assert inv.get_item(0) == item
        assert inv.get_item(99) is None
        assert inv.get_item(-1) is None

    def test_inventory_remove_item(self):
        """Test Inventory.remove_item method."""
        inv = Inventory(max_size=10)

        item = Mock(spec=Item)
        item.name = "Test"
        inv.add_item(item)

        removed = inv.remove_item(0)

        assert removed == item
        assert len(inv.items) == 0


class TestBattleManagerItemMethods:
    """Test BattleManager._try_use_item specifically."""

    def test_try_use_item_checks_inventory_items_length(self):
        """Verify _try_use_item uses len(inventory.items) not len(inventory)."""
        battle = create_test_battle()
        player = create_mock_player(with_inventory=True)
        engine = create_mock_engine(battle, player)

        manager = BattleManager(engine)

        # This should NOT raise "object of type 'Inventory' has no len()"
        try:
            manager._try_use_item(0)
        except TypeError as e:
            if "Inventory" in str(e) and "len" in str(e):
                pytest.fail(f"BattleManager is calling len() on Inventory directly: {e}")
            raise


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
