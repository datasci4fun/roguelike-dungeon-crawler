"""Lore item spawning with zone-aware placement.

Handles spawning lore items based on floor-specific zone configurations.

Note: The floor lore configurations are candidates for database migration
to allow easier content updates without code changes.
"""
import random
from typing import TYPE_CHECKING, List

from ..entities import Player
from ..items import Item

if TYPE_CHECKING:
    from ..world import Dungeon


def spawn_zone_lore(items: List[Item], dungeon: 'Dungeon', player: Player):
    """Spawn lore items with zone-aware placement and spawn chances.

    Floors 1-8 have zone-specific lore pools and spawn rates.
    """
    from ..items import create_lore_item
    from ..story.story_data import get_lore_entries_for_level

    lore_entries = get_lore_entries_for_level(dungeon.level)
    if not lore_entries:
        return

    # Zone-aware lore spawning for all implemented floors
    config_getters = {
        1: _get_floor1_lore_config,
        2: _get_floor2_lore_config,
        3: _get_floor3_lore_config,
        4: _get_floor4_lore_config,
        5: _get_floor5_lore_config,
        6: _get_floor6_lore_config,
        7: _get_floor7_lore_config,
        8: _get_floor8_lore_config,
    }

    if dungeon.level in config_getters:
        _spawn_floor_lore(items, dungeon, player, lore_entries, config_getters[dungeon.level]())
    else:
        # Default behavior for other floors
        for lore_id, entry in lore_entries:
            if random.random() < 0.7:
                pos = dungeon.get_random_floor_position()
                if pos[0] != player.x or pos[1] != player.y:
                    try:
                        lore_item = create_lore_item(lore_id, pos[0], pos[1])
                        items.append(lore_item)
                    except ValueError:
                        pass


def _get_floor1_lore_config() -> dict:
    """Floor 1 zone lore configuration."""
    return {
        "wardens_office": (1.0, 1),
        "record_vaults": (0.6, 2),
        "cell_blocks": (0.3, 1),
        "guard_corridors": (0.2, 1),
        "execution_chambers": (0.4, 1),
        "boss_approach": (1.0, 1),
        "intake_hall": (0.3, 1),
    }


def _get_floor2_lore_config() -> dict:
    """Floor 2 zone lore configuration."""
    return {
        "colony_heart": (1.0, 1),
        "seal_drifts": (0.7, 2),
        "carrier_nests": (0.2, 1),
        "waste_channels": (0.15, 1),
        "maintenance_tunnels": (0.25, 1),
        "diseased_pools": (0.3, 1),
        "boss_approach": (1.0, 1),
        "confluence_chambers": (0.25, 1),
    }


def _get_floor3_lore_config() -> dict:
    """Floor 3 zone lore configuration."""
    return {
        "druid_ring": (1.0, 1),
        "webbed_gardens": (0.3, 1),
        "canopy_halls": (0.2, 1),
        "the_nursery": (0.15, 1),
        "digestion_chambers": (0.15, 1),
        "root_warrens": (0.2, 1),
        "boss_approach": (1.0, 1),
    }


def _get_floor4_lore_config() -> dict:
    """Floor 4 zone lore configuration."""
    return {
        "oath_chambers": (1.0, 1),
        "throne_hall_ruins": (0.7, 1),
        "seal_chambers": (0.75, 2),
        "record_vaults": (0.75, 2),
        "mausoleum_district": (0.4, 1),
        "courtyard_squares": (0.25, 1),
        "parade_corridors": (0.15, 1),
        "boss_approach": (1.0, 1),
    }


def _get_floor5_lore_config() -> dict:
    """Floor 5 zone lore configuration."""
    return {
        "suspended_laboratories": (1.0, 2),
        "ice_tombs": (0.8, 2),
        "breathing_chamber": (0.7, 1),
        "thaw_fault": (0.5, 1),
        "crystal_grottos": (0.4, 1),
        "frozen_galleries": (0.2, 1),
        "boss_approach": (1.0, 1),
    }


def _get_floor6_lore_config() -> dict:
    """Floor 6 zone lore configuration."""
    return {
        "indexing_heart": (1.0, 1),
        "catalog_chambers": (0.75, 1),
        "forbidden_stacks": (0.4, 1),
        "experiment_archives": (0.6, 1),
        "marginalia_alcoves": (0.6, 1),
        "reading_halls": (0.25, 1),
        "boss_approach": (1.0, 1),
    }


def _get_floor7_lore_config() -> dict:
    """Floor 7 zone lore configuration."""
    return {
        "crucible_heart": (1.0, 1),
        "rune_press": (0.6, 1),
        "forge_halls": (0.35, 1),
        "magma_channels": (0.2, 1),
        "cooling_chambers": (0.2, 1),
        "slag_pits": (0.2, 1),
        "ash_galleries": (0.2, 1),
        "boss_approach": (1.0, 1),
    }


def _get_floor8_lore_config() -> dict:
    """Floor 8 zone lore configuration."""
    return {
        "dragons_hoard": (1.0, 1),
        "oath_interface": (0.85, 1),
        "vault_antechamber": (0.75, 1),
        "seal_chambers": (0.5, 1),
        "geometry_wells": (0.3, 1),
        "crystal_gardens": (0.2, 1),
        "boss_approach": (1.0, 1),
    }


def _spawn_floor_lore(items: List[Item], dungeon: 'Dungeon', player: Player, lore_entries: list, zone_config: dict):
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
        pos = _get_floor_in_room(dungeon, room, player)
        if pos:
            try:
                lore_item = create_lore_item(lore_id, pos[0], pos[1])
                items.append(lore_item)
                zone_lore_counts[zone] += 1
                lore_pool.remove((lore_id, entry))
            except ValueError:
                pass


def _get_floor_in_room(dungeon: 'Dungeon', room, player: Player):
    """Find a random walkable floor position within a room."""
    attempts = 20
    for _ in range(attempts):
        x = random.randint(room.x + 1, room.x + room.width - 2)
        y = random.randint(room.y + 1, room.y + room.height - 2)
        if (dungeon.is_walkable(x, y) and
            (x != player.x or y != player.y)):
            return (x, y)
    return None
