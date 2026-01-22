"""Enemy spawning logic with zone-aware weight modifiers.

Handles spawning enemies with theme-appropriate types and zone biases.
Supports multi-tile enemies (2x2, 3x3) by restricting them to rooms.
"""
import random
from typing import TYPE_CHECKING, List, Tuple, Optional

from ..entities import Player, Enemy

if TYPE_CHECKING:
    from ..world import Dungeon
    from ..world.dungeon_bsp import Room


def _get_enemy_size(enemy_type) -> Tuple[int, int]:
    """Get the size (width, height) for an enemy type. Default is (1, 1)."""
    from ..core.constants import ENEMY_STATS
    stats = ENEMY_STATS.get(enemy_type, {})
    return stats.get('size', (1, 1))


def _find_room_spawn_position(
    dungeon: 'Dungeon',
    size_w: int,
    size_h: int,
    player: Player,
    max_attempts: int = 50
) -> Optional[Tuple[int, int]]:
    """Find a valid spawn position for a multi-tile enemy inside a room.

    Args:
        dungeon: The dungeon to spawn in
        size_w, size_h: The enemy's footprint size
        player: The player (to avoid spawning too close)
        max_attempts: Maximum random attempts before giving up

    Returns:
        (x, y) position or None if no valid position found
    """
    # Filter rooms that can fit the enemy (need at least size + 1 for walls)
    valid_rooms = [
        room for room in dungeon.rooms
        if room.width >= size_w + 2 and room.height >= size_h + 2
    ]

    if not valid_rooms:
        return None

    for _ in range(max_attempts):
        # Pick a random room that can fit the enemy
        room = random.choice(valid_rooms)

        # Pick a random position inside the room (leaving 1-tile margin from walls)
        x = random.randint(room.x + 1, room.x + room.width - size_w - 1)
        y = random.randint(room.y + 1, room.y + room.height - size_h - 1)

        # Check distance from player
        if abs(x - player.x) <= 5 and abs(y - player.y) <= 5:
            continue

        # Verify all tiles in footprint are walkable
        all_walkable = True
        for dx in range(size_w):
            for dy in range(size_h):
                if not dungeon.is_walkable(x + dx, y + dy):
                    all_walkable = False
                    break
            if not all_walkable:
                break

        if all_walkable:
            return (x, y)

    return None


def spawn_enemies(enemies: List[Enemy], dungeon: 'Dungeon', player: Player):
    """Spawn enemies in random rooms with weighted type selection.

    Uses FLOOR_ENEMY_POOLS as primary source (theme-first), with
    min/max level filtering as fallback. Zone weights are applied on top.
    """
    from ..core.constants import (
        ELITE_SPAWN_RATE, ENEMY_STATS, EnemyType, FLOOR_ENEMY_POOLS
    )

    enemies.clear()
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
        # First, select enemy type to determine size requirements
        # Use a temporary position to get zone weights
        temp_pos = dungeon.get_random_floor_position()
        zone = dungeon.get_zone_at(temp_pos[0], temp_pos[1])
        zone_weights = _apply_zone_weights(
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

        # Get enemy size and find appropriate spawn position
        size_w, size_h = _get_enemy_size(enemy_type)

        if size_w > 1 or size_h > 1:
            # Large enemy: must spawn in a room with enough space
            pos = _find_room_spawn_position(dungeon, size_w, size_h, player)
            if pos is None:
                # Can't fit this enemy, try a smaller enemy type instead
                # Filter to 1x1 enemies only
                small_types = [t for t in base_enemy_types if _get_enemy_size(t) == (1, 1)]
                if small_types:
                    small_weights = [
                        zone_weights[i] for i, t in enumerate(base_enemy_types)
                        if _get_enemy_size(t) == (1, 1)
                    ]
                    enemy_type = random.choices(small_types, weights=small_weights)[0]
                    pos = dungeon.get_random_floor_position()
                    # Make sure not too close to player
                    if abs(pos[0] - player.x) <= 5 and abs(pos[1] - player.y) <= 5:
                        continue
                else:
                    continue
        else:
            # Normal 1x1 enemy: can spawn anywhere
            pos = dungeon.get_random_floor_position()
            # Make sure not too close to player
            if abs(pos[0] - player.x) <= 5 and abs(pos[1] - player.y) <= 5:
                continue

        # Get zone at actual spawn position for elite rate
        zone = dungeon.get_zone_at(pos[0], pos[1])

        # 20% chance to spawn elite enemy (0% in intake_hall for Floor 1)
        elite_rate = ELITE_SPAWN_RATE
        if zone == "intake_hall":
            elite_rate = 0.0
        is_elite = random.random() < elite_rate

        enemy = Enemy(pos[0], pos[1], enemy_type=enemy_type, is_elite=is_elite)
        enemies.append(enemy)


def _apply_zone_weights(enemy_types: list, weights: list, zone: str, level: int) -> list:
    """Apply zone-specific weight modifiers to enemy spawn weights.

    Implements zone modifiers for all floors with thematic enemy boosts.

    Note: This zone weight data is a candidate for database migration to allow
    easier balancing without code changes.
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
    elif level == 2:
        zone_modifiers = {
            "carrier_nests": {EnemyType.RAT: 2.0, EnemyType.PLAGUE_RAT: 2.0},
            "waste_channels": {EnemyType.PLAGUE_RAT: 1.4},
            "seal_drifts": {EnemyType.ASSASSIN: 1.3},
            "colony_heart": {EnemyType.RAT: 2.0, EnemyType.PLAGUE_RAT: 1.6},
            "diseased_pools": {EnemyType.PLAGUE_RAT: 1.5},
            "maintenance_tunnels": {},
            "boss_approach": {EnemyType.RAT: 1.8, EnemyType.PLAGUE_RAT: 1.5},
            "confluence_chambers": {},
        }
        modifiers = zone_modifiers.get(zone, {})
        for i, enemy_type in enumerate(enemy_types):
            if enemy_type in modifiers:
                weights[i] = int(weights[i] * modifiers[enemy_type])

    # Floor 3 zone modifiers (Forest Depths)
    elif level == 3:
        zone_modifiers = {
            "the_nursery": {EnemyType.SPIDERLING: 2.0, EnemyType.WEBWEAVER: 2.0},
            "webbed_gardens": {EnemyType.WEBWEAVER: 1.6, EnemyType.SPIDERLING: 1.4},
            "druid_ring": {EnemyType.WRAITH: 1.3},
            "digestion_chambers": {EnemyType.SPIDERLING: 1.3},
            "canopy_halls": {EnemyType.WEBWEAVER: 1.2},
            "root_warrens": {EnemyType.SPIDERLING: 1.5, EnemyType.RAT: 1.2},
            "boss_approach": {EnemyType.SPIDERLING: 1.8, EnemyType.WEBWEAVER: 1.6},
        }
        modifiers = zone_modifiers.get(zone, {})
        for i, enemy_type in enumerate(enemy_types):
            if enemy_type in modifiers:
                weights[i] = int(weights[i] * modifiers[enemy_type])

    # Floor 4 zone modifiers (Mirror Valdris)
    elif level == 4:
        zone_modifiers = {
            "mausoleum_district": {EnemyType.OATHBOUND_GUARD: 1.6, EnemyType.SKELETON: 1.6},
            "throne_hall_ruins": {EnemyType.OATHBOUND_GUARD: 1.4},
            "record_vaults": {EnemyType.COURT_SCRIBE: 1.4, EnemyType.SKELETON: 1.2},
            "oath_chambers": {EnemyType.OATHBOUND_GUARD: 1.3, EnemyType.WRAITH: 1.2},
            "courtyard_squares": {EnemyType.OATHBOUND_GUARD: 1.3},
            "seal_chambers": {EnemyType.COURT_SCRIBE: 1.3},
            "parade_corridors": {},
            "boss_approach": {EnemyType.OATHBOUND_GUARD: 1.6, EnemyType.COURT_SCRIBE: 1.4},
        }
        modifiers = zone_modifiers.get(zone, {})
        for i, enemy_type in enumerate(enemy_types):
            if enemy_type in modifiers:
                weights[i] = int(weights[i] * modifiers[enemy_type])

    # Floor 5 zone modifiers (Ice Cavern)
    elif level == 5:
        zone_modifiers = {
            "ice_tombs": {EnemyType.ICE_ELEMENTAL: 1.6, EnemyType.SKELETON: 1.4},
            "frozen_galleries": {EnemyType.ICE_ELEMENTAL: 1.5},
            "crystal_grottos": {EnemyType.ICE_ELEMENTAL: 1.4, EnemyType.OATHBOUND_GUARD: 1.2},
            "suspended_laboratories": {EnemyType.WRAITH: 1.3},
            "breathing_chamber": {EnemyType.ICE_ELEMENTAL: 1.4, EnemyType.TROLL: 1.3},
            "thaw_fault": {EnemyType.ICE_ELEMENTAL: 1.3},
            "boss_approach": {EnemyType.ICE_ELEMENTAL: 1.6, EnemyType.TROLL: 1.4},
        }
        modifiers = zone_modifiers.get(zone, {})
        for i, enemy_type in enumerate(enemy_types):
            if enemy_type in modifiers:
                weights[i] = int(weights[i] * modifiers[enemy_type])

    # Floor 6 zone modifiers (Ancient Library)
    elif level == 6:
        zone_modifiers = {
            "reading_halls": {EnemyType.WRAITH: 1.2},
            "forbidden_stacks": {EnemyType.ANIMATED_TOME: 1.5, EnemyType.NECROMANCER: 1.5},
            "catalog_chambers": {EnemyType.COURT_SCRIBE: 1.4, EnemyType.ANIMATED_TOME: 1.2},
            "indexing_heart": {EnemyType.ANIMATED_TOME: 1.3},
            "experiment_archives": {EnemyType.NECROMANCER: 1.4},
            "marginalia_alcoves": {EnemyType.ANIMATED_TOME: 1.3},
            "boss_approach": {EnemyType.ANIMATED_TOME: 1.5, EnemyType.NECROMANCER: 1.4},
        }
        modifiers = zone_modifiers.get(zone, {})
        for i, enemy_type in enumerate(enemy_types):
            if enemy_type in modifiers:
                weights[i] = int(weights[i] * modifiers[enemy_type])

    # Floor 7 zone modifiers (Volcanic Depths)
    elif level == 7:
        zone_modifiers = {
            "forge_halls": {EnemyType.FIRE_ELEMENTAL: 1.4, EnemyType.TROLL: 1.2},
            "magma_channels": {EnemyType.FIRE_ELEMENTAL: 1.6, EnemyType.DEMON: 1.4},
            "cooling_chambers": {EnemyType.TROLL: 1.3},
            "slag_pits": {EnemyType.DEMON: 1.3},
            "rune_press": {EnemyType.ANIMATED_TOME: 1.3, EnemyType.NECROMANCER: 1.2},
            "ash_galleries": {EnemyType.FIRE_ELEMENTAL: 1.3},
            "crucible_heart": {EnemyType.FIRE_ELEMENTAL: 1.5, EnemyType.DEMON: 1.4},
            "boss_approach": {EnemyType.FIRE_ELEMENTAL: 1.6, EnemyType.DEMON: 1.5},
        }
        modifiers = zone_modifiers.get(zone, {})
        for i, enemy_type in enumerate(enemy_types):
            if enemy_type in modifiers:
                weights[i] = int(weights[i] * modifiers[enemy_type])

    # Floor 8 zone modifiers (Crystal Cave)
    elif level == 8:
        zone_modifiers = {
            "crystal_gardens": {EnemyType.CRYSTAL_SENTINEL: 1.4},
            "geometry_wells": {EnemyType.LIGHTNING_ELEMENTAL: 1.3},
            "seal_chambers": {EnemyType.CRYSTAL_SENTINEL: 1.6},
            "dragons_hoard": {EnemyType.DRAGON: 1.5, EnemyType.CRYSTAL_SENTINEL: 1.3},
            "vault_antechamber": {EnemyType.CRYSTAL_SENTINEL: 1.3},
            "oath_interface": {EnemyType.WRAITH: 1.3},
            "boss_approach": {EnemyType.CRYSTAL_SENTINEL: 1.6, EnemyType.DRAGON: 1.4},
        }
        modifiers = zone_modifiers.get(zone, {})
        for i, enemy_type in enumerate(enemy_types):
            if enemy_type in modifiers:
                weights[i] = int(weights[i] * modifiers[enemy_type])

    return weights
