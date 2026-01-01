"""Test Phase 4 entity visuals features."""
import sys
from unittest.mock import Mock

# Mock curses since we can't run it in this environment
sys.modules['curses'] = Mock()

from src.entities import Enemy
from src.items import HealthPotion, StrengthPotion, ScrollTeleport
from src.constants import (
    EnemyType, ENEMY_STATS, ItemRarity, ITEM_RARITY_COLORS
)

def test_enemy_types():
    """Test that enemy types have correct stats."""
    print("Testing enemy types...")

    # Test all 6 enemy types
    test_cases = [
        (EnemyType.GOBLIN, 'g', 6, 1, 10),
        (EnemyType.SKELETON, 's', 8, 2, 15),
        (EnemyType.ORC, 'o', 12, 3, 20),
        (EnemyType.WRAITH, 'W', 10, 4, 25),
        (EnemyType.TROLL, 'T', 20, 5, 35),
        (EnemyType.DRAGON, 'D', 50, 10, 100),
    ]

    for enemy_type, expected_symbol, expected_hp, expected_damage, expected_xp in test_cases:
        enemy = Enemy(10, 10, enemy_type=enemy_type)
        stats = ENEMY_STATS[enemy_type]

        print(f"  {stats['name']}:")
        print(f"    Symbol: {enemy.symbol} (expected: {expected_symbol})")
        print(f"    HP: {enemy.max_health} (expected: {expected_hp})")
        print(f"    Damage: {enemy.attack_damage} (expected: {expected_damage})")
        print(f"    XP: {enemy.xp_reward} (expected: {expected_xp})")

        assert enemy.symbol == expected_symbol, f"{stats['name']} symbol mismatch"
        assert enemy.max_health == expected_hp, f"{stats['name']} HP mismatch"
        assert enemy.attack_damage == expected_damage, f"{stats['name']} damage mismatch"
        assert enemy.xp_reward == expected_xp, f"{stats['name']} XP mismatch"
        assert enemy.enemy_type == enemy_type, f"{stats['name']} type mismatch"

    print("[PASS] All enemy types have correct stats\n")

def test_elite_enemies():
    """Test that elite enemies have uppercase symbols and 2x stats."""
    print("Testing elite enemy visuals...")

    test_cases = [
        (EnemyType.GOBLIN, 'g', 'G'),
        (EnemyType.SKELETON, 's', 'S'),
        (EnemyType.ORC, 'o', 'O'),
        (EnemyType.WRAITH, 'W', 'W'),  # Already uppercase
        (EnemyType.TROLL, 'T', 'T'),  # Already uppercase
        (EnemyType.DRAGON, 'D', 'D'),  # Already uppercase
    ]

    for enemy_type, normal_symbol, elite_symbol in test_cases:
        stats = ENEMY_STATS[enemy_type]

        # Test normal enemy
        normal = Enemy(10, 10, enemy_type=enemy_type, is_elite=False)
        print(f"  {stats['name']}:")
        print(f"    Normal: {normal.symbol} (expected: {normal_symbol})")
        assert normal.symbol == normal_symbol, f"Normal {stats['name']} symbol mismatch"

        # Test elite enemy
        elite = Enemy(10, 10, enemy_type=enemy_type, is_elite=True)
        print(f"    Elite: {elite.symbol} (expected: {elite_symbol})")
        assert elite.symbol == elite_symbol, f"Elite {stats['name']} symbol mismatch"

        # Elite should have 2x HP and damage
        assert elite.max_health == normal.max_health * 2, f"Elite {stats['name']} should have 2x HP"
        assert elite.attack_damage == normal.attack_damage * 2, f"Elite {stats['name']} should have 2x damage"

    print("[PASS] Elite enemies have uppercase symbols and 2x stats\n")

def test_enemy_weighted_spawning():
    """Test that enemy spawning weights are configured."""
    print("Testing enemy spawning weights...")

    total_weight = 0
    for enemy_type, stats in ENEMY_STATS.items():
        weight = stats['weight']
        total_weight += weight
        print(f"  {stats['name']}: weight={weight}")

    print(f"  Total weight: {total_weight}")
    assert total_weight == 100, "Total spawn weight should be 100"

    # Check that common enemies have higher weight
    goblin_weight = ENEMY_STATS[EnemyType.GOBLIN]['weight']
    dragon_weight = ENEMY_STATS[EnemyType.DRAGON]['weight']
    print(f"  Goblin weight ({goblin_weight}) > Dragon weight ({dragon_weight}): {goblin_weight > dragon_weight}")
    assert goblin_weight > dragon_weight, "Goblins should be more common than Dragons"

    print("[PASS] Enemy spawning weights configured correctly\n")

def test_item_rarity():
    """Test that items have correct rarity."""
    print("Testing item rarity system...")

    # Create items
    health = HealthPotion(10, 10)
    strength = StrengthPotion(15, 15)
    scroll = ScrollTeleport(20, 20)

    print(f"  Health Potion: {health.rarity.name} (expected: COMMON)")
    print(f"  Strength Potion: {strength.rarity.name} (expected: UNCOMMON)")
    print(f"  Scroll of Teleport: {scroll.rarity.name} (expected: UNCOMMON)")

    assert health.rarity == ItemRarity.COMMON, "Health Potion should be COMMON"
    assert strength.rarity == ItemRarity.UNCOMMON, "Strength Potion should be UNCOMMON"
    assert scroll.rarity == ItemRarity.UNCOMMON, "Scroll should be UNCOMMON"

    print("[PASS] Items have correct rarity\n")

def test_item_rarity_colors():
    """Test that item rarities map to color pairs."""
    print("Testing item rarity color mapping...")

    color_mappings = [
        (ItemRarity.COMMON, 1, "White"),
        (ItemRarity.UNCOMMON, 5, "Cyan"),
        (ItemRarity.RARE, 11, "Blue"),
        (ItemRarity.EPIC, 6, "Magenta"),
    ]

    for rarity, expected_color, color_name in color_mappings:
        color_pair = ITEM_RARITY_COLORS[rarity]
        print(f"  {rarity.name}: color_pair {color_pair} ({color_name})")
        assert color_pair == expected_color, f"{rarity.name} should map to color pair {expected_color}"

    print("[PASS] Item rarity colors mapped correctly\n")

def test_enemy_names():
    """Test that enemies have names for combat messages."""
    print("Testing enemy names...")

    for enemy_type in EnemyType:
        enemy = Enemy(10, 10, enemy_type=enemy_type)
        stats = ENEMY_STATS[enemy_type]

        print(f"  {enemy_type.name}: name='{enemy.name}' (expected: '{stats['name']}')")
        assert enemy.name == stats['name'], f"{enemy_type.name} should have name '{stats['name']}'"

    print("[PASS] All enemies have names\n")

def test_enemy_xp_rewards():
    """Test that different enemy types award different XP."""
    print("Testing enemy XP rewards...")

    xp_values = []
    for enemy_type in EnemyType:
        enemy = Enemy(10, 10, enemy_type=enemy_type)
        xp = enemy.xp_reward
        xp_values.append((enemy.name, xp))
        print(f"  {enemy.name}: {xp} XP")

    # Check that stronger enemies award more XP
    goblin_xp = ENEMY_STATS[EnemyType.GOBLIN]['xp']
    dragon_xp = ENEMY_STATS[EnemyType.DRAGON]['xp']
    print(f"  Dragon XP ({dragon_xp}) > Goblin XP ({goblin_xp}): {dragon_xp > goblin_xp}")
    assert dragon_xp > goblin_xp, "Dragons should award more XP than Goblins"

    print("[PASS] Enemy XP rewards scale with difficulty\n")

def main():
    """Run all tests."""
    print("=" * 60)
    print("Phase 4 Entity Visuals - Verification Tests")
    print("=" * 60)
    print()

    try:
        test_enemy_types()
        test_elite_enemies()
        test_enemy_weighted_spawning()
        test_item_rarity()
        test_item_rarity_colors()
        test_enemy_names()
        test_enemy_xp_rewards()

        print("\n" + "=" * 60)
        print("[SUCCESS] All Phase 4 tests passed!")
        print("=" * 60)
        print()
        print("To see the full visual experience with diverse enemies:")
        print("  python main.py")
        print()
        print("Phase 4 features:")
        print("  - 6 enemy types: Goblin (g), Skeleton (s), Orc (o),")
        print("                    Wraith (W), Troll (T), Dragon (D)")
        print("  - Elite enemies use UPPERCASE symbols (S, O, G, etc.)")
        print("  - Weighted spawning (Goblins common, Dragons rare)")
        print("  - Enemy-specific stats (HP, damage, XP)")
        print("  - Enemy names in combat messages")
        print("  - Item rarity color coding:")
        print("    * Common (white): Health Potions")
        print("    * Uncommon (cyan): Strength Potions, Scrolls")
        print("    * Rare (blue): Future items")
        print("    * Epic (magenta): Future legendary items")

        return 0

    except Exception as e:
        print(f"\n[FAIL] Test failed: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
