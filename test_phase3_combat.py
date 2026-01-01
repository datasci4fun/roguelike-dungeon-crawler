"""Test Phase 3 combat feedback features."""
import sys
from unittest.mock import Mock, MagicMock
import time

# Mock curses since we can't run it in this environment
curses_mock = Mock()
curses_mock.has_colors = Mock(return_value=True)
curses_mock.init_pair = Mock()
curses_mock.color_pair = Mock(side_effect=lambda x: x)
curses_mock.A_REVERSE = 1 << 8
curses_mock.A_BOLD = 1 << 9
curses_mock.A_NORMAL = 0
curses_mock.curs_set = Mock()
curses_mock.error = Exception
curses_mock.COLOR_WHITE = 7
curses_mock.COLOR_YELLOW = 3
curses_mock.COLOR_RED = 1
curses_mock.COLOR_GREEN = 2
curses_mock.COLOR_CYAN = 6
curses_mock.COLOR_MAGENTA = 5
curses_mock.COLOR_BLACK = 0

sys.modules['curses'] = curses_mock

from src.renderer import Renderer
from src.entities import Player, Enemy

def test_hit_animation():
    """Test that hit animations are created and tracked."""
    print("Testing hit animation system...")

    # Create mock stdscr
    stdscr = Mock()
    stdscr.clear = Mock()
    stdscr.refresh = Mock()
    stdscr.getmaxyx = Mock(return_value=(40, 80))
    stdscr.addch = Mock()
    stdscr.addstr = Mock()

    renderer = Renderer(stdscr)

    # Create test entities
    player = Player(10, 10)
    enemy = Enemy(15, 15)

    # Add hit animations
    renderer.add_hit_animation(player)
    renderer.add_hit_animation(enemy)

    print(f"  Animations created: {len(renderer.animations)}")
    assert len(renderer.animations) == 2, "Should have 2 hit animations"

    # Check animation properties
    anim = renderer.animations[0]
    assert anim['entity'] == player, "First animation should be for player"
    assert anim['effect'] == 'hit', "Effect should be 'hit'"
    assert 'start_time' in anim, "Animation should have start_time"
    assert 'duration' in anim, "Animation should have duration"

    print("  Animation properties: OK")

    # Test cleanup
    time.sleep(0.2)  # Wait for animations to expire
    renderer._cleanup_animations()

    print(f"  After cleanup: {len(renderer.animations)} animations")
    assert len(renderer.animations) == 0, "Expired animations should be cleaned up"

    print("[PASS] Hit animation system works\n")

def test_damage_numbers():
    """Test floating damage number system."""
    print("Testing damage number system...")

    stdscr = Mock()
    stdscr.clear = Mock()
    stdscr.refresh = Mock()
    stdscr.getmaxyx = Mock(return_value=(40, 80))
    stdscr.addch = Mock()
    stdscr.addstr = Mock()

    renderer = Renderer(stdscr)

    # Add damage numbers
    renderer.add_damage_number(10, 10, 5)
    renderer.add_damage_number(15, 15, 8)
    renderer.add_damage_number(20, 20, 12)

    print(f"  Damage numbers created: {len(renderer.damage_numbers)}")
    assert len(renderer.damage_numbers) == 3, "Should have 3 damage numbers"

    # Check properties
    dmg = renderer.damage_numbers[0]
    assert dmg['x'] == 10, "X coordinate should be 10"
    assert dmg['y'] == 9, "Y coordinate should be 9 (above entity)"
    assert dmg['text'] == "-5", "Text should be '-5'"

    dmg2 = renderer.damage_numbers[2]
    assert dmg2['text'] == "-12", "Text should be '-12'"

    print("  Damage number properties: OK")

    # Test cleanup
    time.sleep(0.6)  # Wait for damage numbers to expire (0.5s duration)
    renderer._cleanup_animations()

    print(f"  After cleanup: {len(renderer.damage_numbers)} damage numbers")
    assert len(renderer.damage_numbers) == 0, "Expired damage numbers should be cleaned up"

    print("[PASS] Damage number system works\n")

def test_direction_indicators():
    """Test attack direction indicator system."""
    print("Testing direction indicator system...")

    stdscr = Mock()
    stdscr.clear = Mock()
    stdscr.refresh = Mock()
    stdscr.getmaxyx = Mock(return_value=(40, 80))
    stdscr.addch = Mock()
    stdscr.addstr = Mock()

    renderer = Renderer(stdscr)

    # Test all 8 directions + same position
    test_cases = [
        ((10, 10), (10, 5), '↑', "up"),
        ((10, 10), (10, 15), '↓', "down"),
        ((10, 10), (5, 10), '←', "left"),
        ((10, 10), (15, 10), '→', "right"),
        ((10, 10), (15, 5), '↗', "up-right"),
        ((10, 10), (15, 15), '↘', "down-right"),
        ((10, 10), (5, 15), '↙', "down-left"),
        ((10, 10), (5, 5), '↖', "up-left"),
    ]

    for (from_x, from_y), (to_x, to_y), expected_arrow, direction in test_cases:
        renderer.add_direction_indicator(from_x, from_y, to_x, to_y)

    print(f"  Direction indicators created: {len(renderer.direction_indicators)}")
    assert len(renderer.direction_indicators) == 8, "Should have 8 direction indicators"

    # Check arrows
    for i, ((from_x, from_y), (to_x, to_y), expected_arrow, direction) in enumerate(test_cases):
        indicator = renderer.direction_indicators[i]
        # Convert arrow to displayable format
        arrow_display = indicator['char'] if ord(indicator['char']) < 128 else f"U+{ord(indicator['char']):04X}"
        expected_display = expected_arrow if ord(expected_arrow) < 128 else f"U+{ord(expected_arrow):04X}"
        print(f"    {direction}: {arrow_display} (expected: {expected_display})")
        assert indicator['char'] == expected_arrow, f"{direction} arrow should be {expected_arrow}"

    print("  All direction arrows correct: OK")

    # Test cleanup
    time.sleep(0.15)  # Wait for indicators to expire (0.1s duration)
    renderer._cleanup_animations()

    print(f"  After cleanup: {len(renderer.direction_indicators)} indicators")
    assert len(renderer.direction_indicators) == 0, "Expired indicators should be cleaned up"

    print("[PASS] Direction indicator system works\n")

def test_death_flash():
    """Test death flash animation."""
    print("Testing death flash animation...")

    stdscr = Mock()
    stdscr.clear = Mock()
    stdscr.refresh = Mock()
    stdscr.getmaxyx = Mock(return_value=(40, 80))
    stdscr.addch = Mock()
    stdscr.addstr = Mock()

    renderer = Renderer(stdscr)

    # Add death flash
    renderer.add_death_flash(15, 15)

    print(f"  Death flashes created: {len(renderer.corpses)}")
    assert len(renderer.corpses) == 1, "Should have 1 death flash"

    # Check properties
    corpse = renderer.corpses[0]
    assert corpse['x'] == 15, "X coordinate should be 15"
    assert corpse['y'] == 15, "Y coordinate should be 15"
    assert corpse['char'] == '%', "Character should be '%'"
    assert corpse['phase'] == 'flash', "Phase should be 'flash'"

    print("  Death flash properties: OK")

    # Test cleanup
    time.sleep(0.25)  # Wait for flash to expire (0.2s duration)
    renderer._cleanup_animations()

    print(f"  After cleanup: {len(renderer.corpses)} corpses")
    assert len(renderer.corpses) == 0, "Expired death flash should be cleaned up"

    print("[PASS] Death flash system works\n")

def test_animation_lifecycle():
    """Test that multiple animations can coexist and clean up properly."""
    print("Testing animation lifecycle...")

    stdscr = Mock()
    stdscr.clear = Mock()
    stdscr.refresh = Mock()
    stdscr.getmaxyx = Mock(return_value=(40, 80))
    stdscr.addch = Mock()
    stdscr.addstr = Mock()

    renderer = Renderer(stdscr)

    player = Player(10, 10)
    enemy = Enemy(15, 15)

    # Add multiple types of animations
    renderer.add_hit_animation(player, duration=0.15)
    renderer.add_hit_animation(enemy, duration=0.15)
    renderer.add_damage_number(15, 15, 5, duration=0.5)
    renderer.add_direction_indicator(10, 10, 15, 15, duration=0.1)
    renderer.add_death_flash(20, 20, duration=0.2)

    print(f"  Initial state:")
    print(f"    Hit animations: {len(renderer.animations)}")
    print(f"    Damage numbers: {len(renderer.damage_numbers)}")
    print(f"    Direction indicators: {len(renderer.direction_indicators)}")
    print(f"    Death flashes: {len(renderer.corpses)}")

    assert len(renderer.animations) == 2, "Should have 2 hit animations"
    assert len(renderer.damage_numbers) == 1, "Should have 1 damage number"
    assert len(renderer.direction_indicators) == 1, "Should have 1 direction indicator"
    assert len(renderer.corpses) == 1, "Should have 1 death flash"

    # After 0.12s: direction indicator expires
    time.sleep(0.12)
    renderer._cleanup_animations()
    print(f"  After 0.12s (direction indicator expires):")
    print(f"    Direction indicators: {len(renderer.direction_indicators)}")
    assert len(renderer.direction_indicators) == 0, "Direction indicator should expire"
    assert len(renderer.animations) == 2, "Hit animations should still exist"

    # After 0.18s total: hit animations and death flash expire
    time.sleep(0.08)  # Total: 0.2s
    renderer._cleanup_animations()
    print(f"  After 0.2s (hit animations and death flash expire):")
    print(f"    Hit animations: {len(renderer.animations)}")
    print(f"    Death flashes: {len(renderer.corpses)}")
    assert len(renderer.animations) == 0, "Hit animations should expire"
    assert len(renderer.corpses) == 0, "Death flash should expire"
    assert len(renderer.damage_numbers) == 1, "Damage number should still exist"

    # After 0.55s total: damage numbers expire
    time.sleep(0.35)  # Total: 0.55s
    renderer._cleanup_animations()
    print(f"  After 0.55s (damage number expires):")
    print(f"    Damage numbers: {len(renderer.damage_numbers)}")
    assert len(renderer.damage_numbers) == 0, "Damage number should expire"

    print("  All animations cleaned up properly: OK")

    print("[PASS] Animation lifecycle works correctly\n")

def main():
    """Run all tests."""
    print("=" * 60)
    print("Phase 3 Combat Feedback - Verification Tests")
    print("=" * 60)
    print()

    try:
        test_hit_animation()
        test_damage_numbers()
        test_direction_indicators()
        test_death_flash()
        test_animation_lifecycle()

        print("\n" + "=" * 60)
        print("[SUCCESS] All Phase 3 tests passed!")
        print("=" * 60)
        print()
        print("To see the full visual experience with combat animations:")
        print("  python main.py")
        print()
        print("Combat feedback features:")
        print("  - Hit flash animations (reverse video + bold)")
        print("  - Floating damage numbers (red, above target)")
        print("  - Attack direction indicators (arrows)")
        print("  - Death flash animations (bright red '%')")
        print("  - Blood stains on floor where enemies die")

        return 0

    except Exception as e:
        print(f"\n[FAIL] Test failed: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
