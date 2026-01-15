"""Game state serialization for GameSessionManager.

Handles converting game engine state to JSON-serializable dictionaries
for sending to web clients.
"""
from typing import List, Any

from .session import GameSession
from .view import is_visible, serialize_visible_tiles, serialize_first_person_view

# These are set by manager.py to avoid circular imports
RACE_STATS = {}
CLASS_STATS = {}
UIMode = None


def set_game_constants(race_stats: dict, class_stats: dict, ui_mode):
    """Set game constants from manager.py to avoid circular imports."""
    global RACE_STATS, CLASS_STATS, UIMode
    RACE_STATS = race_stats
    CLASS_STATS = class_stats
    UIMode = ui_mode


def serialize_player(engine, player) -> dict:
    """Serialize player data."""
    facing = getattr(player, 'facing', (0, 1))

    player_data = {
        "x": player.x,
        "y": player.y,
        "health": player.health,
        "max_health": player.max_health,
        "attack": player.attack_damage,
        "defense": player.defense,
        "level": player.level,
        "xp": player.xp,
        "xp_to_level": player.xp_to_next_level,
        "kills": player.kills,
        "facing": {"dx": facing[0], "dy": facing[1]},
    }

    # Add race/class info if character has them
    if hasattr(player, 'race') and player.race:
        race_data = RACE_STATS.get(player.race, {})
        player_data["race"] = {
            "id": player.race.name,
            "name": race_data.get('name', 'Unknown'),
            "trait": player.race_trait,
            "trait_name": player.race_trait_name,
            "trait_description": player.race_trait_description,
        }

    if hasattr(player, 'player_class') and player.player_class:
        class_data = CLASS_STATS.get(player.player_class, {})
        player_data["class"] = {
            "id": player.player_class.name,
            "name": class_data.get('name', 'Unknown'),
            "description": class_data.get('description', ''),
        }

    # Add abilities info
    if hasattr(player, 'get_ability_info'):
        player_data["abilities"] = player.get_ability_info()
    if hasattr(player, 'get_passive_info'):
        player_data["passives"] = player.get_passive_info()

    # Add feats info
    if hasattr(player, 'feats'):
        player_data["feats"] = player.get_feat_info()
        player_data["pending_feat_selection"] = player.pending_feat_selection
        if player.pending_feat_selection:
            player_data["available_feats"] = player.get_available_feats_info()

    # v5.5: Add artifacts info
    if hasattr(player, 'artifacts'):
        player_data["artifacts"] = [
            {
                "id": a.artifact_id.name,
                "name": a.name,
                "symbol": a.symbol,
                "charges": a.charges,
                "used": a.used,
                "active_vow": a.active_vow.name if a.active_vow else None,
                "vow_broken": a.vow_broken,
            }
            for a in player.artifacts
        ]

    return player_data, facing


def serialize_enemies(engine) -> List[dict]:
    """Serialize visible enemies."""
    enemies_list = []
    for e in engine.entity_manager.enemies:
        if e is None:
            continue
        try:
            if e.is_alive() and is_visible(engine, e.x, e.y):
                enemies_list.append({
                    "x": e.x,
                    "y": e.y,
                    "name": e.name if hasattr(e, 'name') and e.name else "enemy",
                    "health": e.health if hasattr(e, 'health') else 0,
                    "max_health": e.max_health if hasattr(e, 'max_health') else 0,
                    "is_elite": getattr(e, 'is_elite', False),
                    "symbol": e.symbol if hasattr(e, 'symbol') and e.symbol else "?",
                })
        except (AttributeError, TypeError):
            continue
    return enemies_list


def serialize_items(engine) -> List[dict]:
    """Serialize visible items."""
    items_list = []
    for i in engine.entity_manager.items:
        if i is None:
            continue
        try:
            if is_visible(engine, i.x, i.y):
                items_list.append({
                    "x": i.x,
                    "y": i.y,
                    "name": i.name if hasattr(i, 'name') and i.name else "item",
                    "symbol": getattr(i, 'symbol', '?'),
                })
        except (AttributeError, TypeError):
            continue
    return items_list


def serialize_events(events: List, sanitize_func) -> List[dict]:
    """Serialize game events for animations."""
    events_list = []
    for e in events:
        if e is None:
            continue
        try:
            event_type = e.type.name if hasattr(e, 'type') and hasattr(e.type, 'name') else "UNKNOWN"
            event_data = sanitize_func(e.data) if hasattr(e, 'data') else {}
            events_list.append({"type": event_type, "data": event_data})
        except (AttributeError, TypeError):
            continue
    return events_list


def serialize_inventory(engine) -> dict:
    """Serialize inventory UI data."""
    inventory_items = []
    for item in engine.player.inventory.items:
        if item is None:
            continue
        try:
            inventory_items.append({
                "name": item.name if hasattr(item, 'name') and item.name else "Unknown Item",
                "type": item.item_type.name if hasattr(item, 'item_type') and item.item_type else "UNKNOWN",
                "rarity": item.rarity.name if hasattr(item, 'rarity') and item.rarity else "COMMON",
            })
        except (AttributeError, TypeError):
            continue
    return {
        "items": inventory_items,
        "selected_index": engine.selected_item_index,
    }


def serialize_lore_journal(engine) -> dict:
    """Serialize lore journal data."""
    discovered, total = engine.story_manager.get_lore_progress()

    lore_entries = engine.story_manager.get_discovered_lore_entries()
    bestiary_entries = engine.story_manager.get_bestiary_entries()
    location_entries = engine.story_manager.get_location_entries()
    artifact_entries = engine.story_manager.get_artifact_entries()
    all_entries = lore_entries + bestiary_entries + location_entries + artifact_entries

    # Add sealed page (always visible, shows completion progress)
    sealed_page = engine.story_manager.get_sealed_page_entry()
    if sealed_page:
        all_entries.append(sealed_page)

    total_discovered = len(lore_entries) + len(bestiary_entries) + len(location_entries) + len(artifact_entries)
    return {
        "entries": all_entries,
        "discovered_count": total_discovered,
        "total_count": total + len(bestiary_entries) + len(location_entries) + len(artifact_entries),
    }


def serialize_battle_state(battle) -> dict:
    """Serialize tactical battle state."""
    # v6.11: Build turn order list with full entity data
    turn_order_entities = []
    for entity_id in battle.turn_order:
        entity = battle.get_entity_by_id(entity_id)
        if entity and entity.hp > 0:
            turn_order_entities.append({
                "entity_id": entity.entity_id,
                "display_id": entity.display_id,
                "name": entity.name if not entity.is_player else "Hero",
                "initiative": entity.initiative,
                "hp": entity.hp,
                "max_hp": entity.max_hp,
                "is_player": entity.is_player,
                "is_elite": entity.is_elite,
                "is_boss": entity.is_boss,
                "symbol": entity.symbol,
            })

    return {
        "active": True,
        "biome": battle.biome,
        "floor_level": battle.floor_level,
        "round": battle.turn_number,  # Frontend expects 'round'
        "phase": battle.phase.name if battle.phase else "PLAYER_TURN",
        "arena_width": battle.arena_width,
        "arena_height": battle.arena_height,
        "arena_tiles": battle.arena_tiles,
        "player": {
            "arena_x": battle.player.arena_x,
            "arena_y": battle.player.arena_y,
            "hp": battle.player.hp,
            "max_hp": battle.player.max_hp,
            "attack": battle.player.attack,
            "defense": battle.player.defense,
            "status_effects": [e.get('name', '') for e in battle.player.status_effects],
            "cooldowns": battle.player.cooldowns,
            "display_id": battle.player.display_id,
            "initiative": battle.player.initiative,
        } if battle.player else None,
        "enemies": [
            {
                "entity_id": e.entity_id,
                "arena_x": e.arena_x,
                "arena_y": e.arena_y,
                "hp": e.hp,
                "max_hp": e.max_hp,
                "attack": e.attack,
                "defense": e.defense,
                "name": e.name,
                "symbol": e.symbol,
                "is_elite": e.is_elite,
                "is_boss": e.is_boss,
                "status_effects": [ef.get('name', '') for ef in e.status_effects],
                "display_id": e.display_id,
                "initiative": e.initiative,
            }
            for e in battle.get_living_enemies()
        ],
        "reinforcements": [
            {
                "entity_id": r.entity_id,
                "enemy_name": r.enemy_name,
                "turns_until_arrival": r.turns_until_arrival,
                "is_elite": r.is_elite,
                "symbol": r.symbol,
            }
            for r in battle.reinforcements
            if r.turns_until_arrival > 0
        ],
        "outcome": battle.outcome.name if battle.outcome else None,
        # v6.11: Turn order data
        "turn_order": turn_order_entities,
        "active_entity_index": battle.active_entity_index,
    }


def serialize_zone_overlay(engine) -> dict:
    """Serialize zone overlay debug data."""
    zone_labels = []
    for room in engine.dungeon.rooms:
        zone_labels.append({
            "x": room.x + room.width // 2,
            "y": room.y + room.height // 2,
            "zone": room.zone,
            "width": room.width,
            "height": room.height,
        })
    return {
        "enabled": True,
        "labels": zone_labels,
    }


def sanitize_event_data(data: dict) -> dict:
    """Convert non-serializable objects in event data to JSON-safe values."""
    result = {}
    for key, value in data.items():
        if hasattr(value, 'x') and hasattr(value, 'y'):
            # Entity-like object - extract coordinates and name
            result[key] = {
                'x': value.x,
                'y': value.y,
                'name': getattr(value, 'name', str(value)),
            }
        elif isinstance(value, (str, int, float, bool, type(None))):
            result[key] = value
        elif isinstance(value, dict):
            result[key] = sanitize_event_data(value)
        elif isinstance(value, list):
            result[key] = [
                sanitize_event_data({'v': v})['v'] if isinstance(v, dict) or hasattr(v, 'x') else v
                for v in value
            ]
        else:
            # Fallback - convert to string
            result[key] = str(value)
    return result
