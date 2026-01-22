#!/usr/bin/env python3
"""
Seed Database Script

Loads game constants from JSON seed files into PostgreSQL.
This script is idempotent - it clears and reloads all data on each run.

Usage:
    python scripts/seed_database.py [--dry-run] [--verbose]

Options:
    --dry-run    Show what would be loaded without writing to database
    --verbose    Show detailed progress information
    --table TABLE  Only seed a specific table (e.g., enemies, bosses)
"""
import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

# Add server to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "server"))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.game_constants import (
    Enemy,
    FloorEnemyPool,
    Boss,
    Race,
    PlayerClass,
    Theme,
    Trap,
    Hazard,
    StatusEffect,
    Item,
    Weapon,
    GameConstantsMeta,
)
from app.models.asset3d import Asset3D
from app.models.narrative_data import (
    BossAbility,
    Feat,
    Artifact,
    Vow,
    LoreEntry,
    EncounterMessage,
    LevelIntroMessage,
    TutorialHint,
    MicroEvent,
    FloorDescription,
    LoreQuote,
)


# Seed file locations
SEEDS_DIR = Path(__file__).parent.parent / "data" / "seeds"

# Mapping of table names to their seed files and model classes
SEED_CONFIG = {
    "enemies": {
        "file": "enemies.json",
        "model": Enemy,
        "id_field": "enemy_id",
        "has_pools": True,  # Special handling for floor_pools
    },
    "bosses": {
        "file": "bosses.json",
        "model": Boss,
        "id_field": "boss_id",
    },
    "races": {
        "file": "races.json",
        "model": Race,
        "id_field": "race_id",
    },
    "classes": {
        "file": "classes.json",
        "model": PlayerClass,
        "id_field": "class_id",
    },
    "themes": {
        "file": "themes.json",
        "model": Theme,
        "id_field": "theme_id",
    },
    "traps": {
        "file": "combat.json",
        "model": Trap,
        "id_field": "trap_id",
        "data_key": "traps",
    },
    "hazards": {
        "file": "combat.json",
        "model": Hazard,
        "id_field": "hazard_id",
        "data_key": "hazards",
    },
    "status_effects": {
        "file": "combat.json",
        "model": StatusEffect,
        "id_field": "effect_id",
        "data_key": "status_effects",
    },
    "items": {
        "file": "items.json",
        "model": Item,
        "id_field": "item_id",
    },
    "assets3d": {
        "file": "assets3d.json",
        "model": Asset3D,
        "id_field": "asset_id",
    },
    "weapons": {
        "file": "weapons.json",
        "model": Weapon,
        "id_field": "weapon_id",
    },
    # Narrative data tables
    "boss_abilities": {
        "file": "boss_abilities.json",
        "model": BossAbility,
        "id_field": "ability_id",
    },
    "feats": {
        "file": "feats.json",
        "model": Feat,
        "id_field": "feat_id",
    },
    "artifacts": {
        "file": "artifacts.json",
        "model": Artifact,
        "id_field": "artifact_id",
    },
    "vows": {
        "file": "vows.json",
        "model": Vow,
        "id_field": "vow_id",
    },
    "lore_entries": {
        "file": "lore_entries.json",
        "model": LoreEntry,
        "id_field": "lore_id",
    },
    "encounter_messages": {
        "file": "encounter_messages.json",
        "model": EncounterMessage,
        "id_field": "enemy_id",
    },
    "level_intros": {
        "file": "level_intros.json",
        "model": LevelIntroMessage,
        "id_field": "floor",
    },
    "tutorial_hints": {
        "file": "tutorial_hints.json",
        "model": TutorialHint,
        "id_field": "hint_id",
    },
    "micro_events": {
        "file": "micro_events.json",
        "model": MicroEvent,
        "id_field": "event_id",
    },
    "floor_descriptions": {
        "file": "floor_descriptions.json",
        "model": FloorDescription,
        "id_field": "floor",
    },
    "lore_quotes": {
        "file": "lore_quotes.json",
        "model": LoreQuote,
        "id_field": "quote_id",
    },
}


def load_seed_file(filename: str) -> dict:
    """Load and parse a JSON seed file."""
    filepath = SEEDS_DIR / filename
    if not filepath.exists():
        raise FileNotFoundError(f"Seed file not found: {filepath}")

    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def map_enemy_data(data: dict) -> dict:
    """Map enemy JSON data to model fields."""
    return {
        "enemy_id": data["id"],
        "name": data["name"],
        "symbol": data["symbol"],
        "hp": data["hp"],
        "damage": data["damage"],
        "xp": data["xp"],
        "weight": data.get("weight", 10),
        "min_level": data.get("min_level", 1),
        "max_level": data.get("max_level", 8),
        "ai_type": data.get("ai_type"),
        "element": data.get("element"),
        "abilities": data.get("abilities"),
        "resistances": data.get("resistances"),
        # D&D-style combat stats
        "armor_class": data.get("armor_class", 10),
        "attack_bonus": data.get("attack_bonus", 0),
        "damage_dice": data.get("damage_dice", "1d4"),
        "str_score": data.get("str_score", 10),
        "dex_score": data.get("dex_score", 10),
        "con_score": data.get("con_score", 10),
        "created_at": datetime.utcnow(),
    }


def map_boss_data(data: dict) -> dict:
    """Map boss JSON data to model fields."""
    return {
        "boss_id": data["id"],
        "name": data["name"],
        "symbol": data["symbol"],
        "hp": data["hp"],
        "damage": data["damage"],
        "xp": data["xp"],
        "level": data["level"],
        "theme": data.get("theme"),
        "description": data.get("description"),
        "abilities": data.get("abilities"),
        "loot": data.get("loot"),
        "created_at": datetime.utcnow(),
    }


def map_race_data(data: dict) -> dict:
    """Map race JSON data to model fields."""
    return {
        "race_id": data["id"],
        "name": data["name"],
        "description": data["description"],
        "hp_modifier": data.get("hp_modifier", 0),
        "atk_modifier": data.get("atk_modifier", 0),
        "def_modifier": data.get("def_modifier", 0),
        "trait": data["trait"],
        "trait_name": data["trait_name"],
        "trait_description": data["trait_description"],
        "starts_with_feat": data.get("starts_with_feat", False),
        # D&D-style ability score base stats
        "base_str": data.get("base_str", 10),
        "base_dex": data.get("base_dex", 10),
        "base_con": data.get("base_con", 10),
        "base_luck": data.get("base_luck", 10),
        # D&D-style ability score modifiers
        "str_modifier": data.get("str_modifier", 0),
        "dex_modifier": data.get("dex_modifier", 0),
        "con_modifier": data.get("con_modifier", 0),
        "luck_modifier": data.get("luck_modifier", 0),
        # Visual/model generation fields
        "appearance": data.get("appearance"),
        "lore": data.get("lore"),
        "base_height": data.get("base_height", 1.8),
        "skin_color": data.get("skin_color"),
        "eye_color": data.get("eye_color"),
        "icon": data.get("icon"),
        "created_at": datetime.utcnow(),
    }


def map_class_data(data: dict) -> dict:
    """Map class JSON data to model fields."""
    return {
        "class_id": data["id"],
        "name": data["name"],
        "description": data["description"],
        "hp_modifier": data.get("hp_modifier", 0),
        "atk_modifier": data.get("atk_modifier", 0),
        "def_modifier": data.get("def_modifier", 0),
        "active_abilities": data.get("active_abilities"),
        "passive_abilities": data.get("passive_abilities"),
        # D&D-style ability score modifiers
        "str_modifier": data.get("str_modifier", 0),
        "dex_modifier": data.get("dex_modifier", 0),
        "con_modifier": data.get("con_modifier", 0),
        "luck_modifier": data.get("luck_modifier", 0),
        # D&D-style hit die and primary stat
        "hit_die": data.get("hit_die", "d8"),
        "primary_stat": data.get("primary_stat", "STR"),
        "armor_proficiency": data.get("armor_proficiency"),
        # Visual/model generation fields
        "playstyle": data.get("playstyle"),
        "lore": data.get("lore"),
        "equipment_type": data.get("equipment_type"),
        "starting_equipment": data.get("starting_equipment"),
        "primary_color": data.get("primary_color"),
        "secondary_color": data.get("secondary_color"),
        "glow_color": data.get("glow_color"),
        "icon": data.get("icon"),
        "abilities": data.get("abilities"),
        "created_at": datetime.utcnow(),
    }


def map_theme_data(data: dict) -> dict:
    """Map theme JSON data to model fields."""
    torch_count = data.get("torch_count", {})
    return {
        "theme_id": data["id"],
        "name": data["name"],
        "level": data["level"],
        "tiles": data["tiles"],
        "decorations": data["decorations"],
        "terrain_features": data.get("terrain_features", []),
        "torch_count_min": torch_count.get("min", 4),
        "torch_count_max": torch_count.get("max", 8),
        "created_at": datetime.utcnow(),
    }


def map_trap_data(data: dict) -> dict:
    """Map trap JSON data to model fields."""
    return {
        "trap_id": data["id"],
        "name": data["name"],
        "symbol_hidden": data["symbol_hidden"],
        "symbol_visible": data["symbol_visible"],
        "damage_min": data["damage_min"],
        "damage_max": data["damage_max"],
        "cooldown": data["cooldown"],
        "effect": data.get("effect"),
        "detection_dc": data.get("detection_dc", 10),
        "created_at": datetime.utcnow(),
    }


def map_hazard_data(data: dict) -> dict:
    """Map hazard JSON data to model fields."""
    return {
        "hazard_id": data["id"],
        "name": data["name"],
        "symbol": data["symbol"],
        "damage_per_turn": data.get("damage_per_turn", 0),
        "effect": data.get("effect"),
        "blocks_movement": data.get("blocks_movement", False),
        "color": data.get("color", 7),
        "causes_slide": data.get("causes_slide", False),
        "spreads": data.get("spreads", False),
        "slows_movement": data.get("slows_movement", False),
        "drown_chance": data.get("drown_chance"),
        "created_at": datetime.utcnow(),
    }


def map_status_effect_data(data: dict) -> dict:
    """Map status effect JSON data to model fields."""
    return {
        "effect_id": data["id"],
        "name": data["name"],
        "damage_per_turn": data.get("damage_per_turn", 0),
        "duration": data["duration"],
        "max_stacks": data.get("max_stacks", 1),
        "stacking": data.get("stacking", "none"),
        "color": data.get("color", 7),
        "message": data.get("message"),
        "movement_penalty": data.get("movement_penalty"),
        "skip_turn": data.get("skip_turn", False),
        "created_at": datetime.utcnow(),
    }


def map_item_data(data: dict) -> dict:
    """Map item JSON data to model fields."""
    return {
        "item_id": data["id"],
        "category": data["category"],
        "name": data["name"],
        "symbol": data["symbol"],
        "description": data["description"],
        "rarity": data["rarity"],
        "slot": data.get("slot"),
        "attack_bonus": data.get("attack_bonus"),
        "defense_bonus": data.get("defense_bonus"),
        "stat_bonuses": data.get("stat_bonuses"),
        "block_chance": data.get("block_chance"),
        "heal_amount": data.get("heal_amount"),
        "atk_increase": data.get("atk_increase"),
        "effect": data.get("effect"),
        "effect_value": data.get("effect_value"),
        "damage": data.get("damage"),
        "range": data.get("range"),
        "is_ranged": data.get("is_ranged", False),
        "key_level": data.get("key_level"),
        "created_at": datetime.utcnow(),
    }


def map_asset3d_data(data: dict) -> dict:
    """Map 3D asset JSON data to model fields."""
    now = datetime.utcnow()
    return {
        "asset_id": data["id"],
        "name": data["name"],
        "category": data["category"],
        "status": data.get("status", "queued"),
        "priority": data.get("priority", "medium"),
        "source_image": data.get("source_image"),
        "model_path": data.get("model_path"),
        "texture_path": data.get("texture_path"),
        "notes": data.get("notes"),
        "vertex_count": data.get("vertex_count"),
        "file_size_bytes": data.get("file_size_bytes"),
        "created_at": now,
        "updated_at": now,
    }


def map_weapon_data(data: dict) -> dict:
    """Map weapon JSON data to model fields."""
    return {
        "weapon_id": data["id"],
        "name": data["name"],
        "description": data.get("description"),
        "damage_dice": data["damage_dice"],
        "damage_type": data.get("damage_type", "slashing"),
        "stat_used": data.get("stat_used", "STR"),
        "is_ranged": data.get("is_ranged", False),
        "range": data.get("range"),
        "weight": data.get("weight", 1.0),
        "rarity": data.get("rarity", "common"),
        "properties": data.get("properties"),
        "created_at": datetime.utcnow(),
    }


def map_boss_ability_data(data: dict) -> dict:
    """Map boss ability JSON data to model fields."""
    return {
        "ability_id": data["ability_id"],
        "name": data["name"],
        "description": data["description"],
        "ability_type": data["ability_type"],
        "cooldown": data.get("cooldown", 3),
        "damage": data.get("damage", 0),
        "range": data.get("range", 1),
        "radius": data.get("radius"),
        "summon_type": data.get("summon_type"),
        "summon_count": data.get("summon_count"),
        "buff_stat": data.get("buff_stat"),
        "buff_amount": data.get("buff_amount"),
        "buff_duration": data.get("buff_duration"),
        "status_effect": data.get("status_effect"),
        "created_at": datetime.utcnow(),
    }


def map_feat_data(data: dict) -> dict:
    """Map feat JSON data to model fields."""
    return {
        "feat_id": data["feat_id"],
        "name": data["name"],
        "description": data["description"],
        "category": data["category"],
        "hp_bonus": data.get("hp_bonus", 0),
        "atk_bonus": data.get("atk_bonus", 0),
        "def_bonus": data.get("def_bonus", 0),
        "damage_bonus": data.get("damage_bonus", 0.0),
        "crit_chance_bonus": data.get("crit_chance_bonus", 0.0),
        "dodge_bonus": data.get("dodge_bonus", 0.0),
        "effects": data.get("effects"),
        "level_required": data.get("level_required", 1),
        "prerequisites": data.get("prerequisites"),
        "created_at": datetime.utcnow(),
    }


def map_artifact_data(data: dict) -> dict:
    """Map artifact JSON data to model fields."""
    return {
        "artifact_id": data["artifact_id"],
        "name": data["name"],
        "description": data["description"],
        "lore": data.get("lore"),
        "effect": data["effect"],
        "cost": data.get("cost"),
        "unlock_condition": data.get("unlock_condition"),
        "created_at": datetime.utcnow(),
    }


def map_vow_data(data: dict) -> dict:
    """Map vow JSON data to model fields."""
    return {
        "vow_id": data["vow_id"],
        "name": data["name"],
        "description": data["description"],
        "restriction_type": data["restriction_type"],
        "xp_multiplier": data.get("xp_multiplier", 1.0),
        "reward": data.get("reward"),
        "created_at": datetime.utcnow(),
    }


def map_lore_entry_data(data: dict) -> dict:
    """Map lore entry JSON data to model fields."""
    return {
        "lore_id": data["lore_id"],
        "title": data["title"],
        "content": data["content"],
        "category": data["category"],
        "level_hint": data.get("level_hint"),
        "item_type": data.get("item_type"),
        "zone_hint": data.get("zone_hint"),
        "sort_order": data.get("sort_order", 0),
        "created_at": datetime.utcnow(),
    }


def map_encounter_message_data(data: dict) -> dict:
    """Map encounter message JSON data to model fields."""
    return {
        "enemy_id": data["enemy_id"],
        "message": data["message"],
        "created_at": datetime.utcnow(),
    }


def map_level_intro_data(data: dict) -> dict:
    """Map level intro JSON data to model fields."""
    return {
        "floor": data["floor"],
        "message": data["message"],
        "created_at": datetime.utcnow(),
    }


def map_tutorial_hint_data(data: dict) -> dict:
    """Map tutorial hint JSON data to model fields."""
    return {
        "hint_id": data["hint_id"],
        "message": data["message"],
        "trigger_condition": data.get("trigger_condition"),
        "priority": data.get("priority", 0),
        "created_at": datetime.utcnow(),
    }


def map_micro_event_data(data: dict) -> dict:
    """Map micro event JSON data to model fields."""
    return {
        "event_id": data["event_id"],
        "floor": data["floor"],
        "title": data["title"],
        "messages": data["messages"],
        "effect_type": data["effect_type"],
        "effect_value": data.get("effect_value", 0),
        "evidence_id": data.get("evidence_id"),
        "created_at": datetime.utcnow(),
    }


def map_floor_description_data(data: dict) -> dict:
    """Map floor description JSON data to model fields."""
    return {
        "floor": data["floor"],
        "name": data["name"],
        "aspect": data["aspect"],
        "hint": data["hint"],
        "warden": data["warden"],
        "warden_symbol": data["warden_symbol"],
        "created_at": datetime.utcnow(),
    }


def map_lore_quote_data(data: dict) -> dict:
    """Map lore quote JSON data to model fields."""
    return {
        "quote_id": data["quote_id"],
        "text": data["text"],
        "author": data["author"],
        "category": data.get("category"),
        "sort_order": data.get("sort_order", 0),
        "created_at": datetime.utcnow(),
    }


# Mapping functions for each table
DATA_MAPPERS = {
    "enemies": map_enemy_data,
    "bosses": map_boss_data,
    "races": map_race_data,
    "classes": map_class_data,
    "themes": map_theme_data,
    "traps": map_trap_data,
    "hazards": map_hazard_data,
    "status_effects": map_status_effect_data,
    "items": map_item_data,
    "assets3d": map_asset3d_data,
    "weapons": map_weapon_data,
    # Narrative data mappers
    "boss_abilities": map_boss_ability_data,
    "feats": map_feat_data,
    "artifacts": map_artifact_data,
    "vows": map_vow_data,
    "lore_entries": map_lore_entry_data,
    "encounter_messages": map_encounter_message_data,
    "level_intros": map_level_intro_data,
    "tutorial_hints": map_tutorial_hint_data,
    "micro_events": map_micro_event_data,
    "floor_descriptions": map_floor_description_data,
    "lore_quotes": map_lore_quote_data,
}


def seed_table(session, table_name: str, config: dict, verbose: bool = False) -> tuple[int, str]:
    """
    Seed a single table from its JSON file.

    Returns:
        Tuple of (record_count, version)
    """
    seed_data = load_seed_file(config["file"])
    version = seed_data.get("version", "1.0.0")

    # Get the data array (may be nested under a key for combat.json)
    data_key = config.get("data_key", "data")
    records = seed_data.get(data_key, [])

    if not records:
        if verbose:
            print(f"  No records found for {table_name}")
        return 0, version

    # Clear existing data
    model = config["model"]
    session.query(model).delete()

    # Map and insert records
    mapper = DATA_MAPPERS[table_name]
    for record in records:
        mapped = mapper(record)
        session.add(model(**mapped))

    if verbose:
        print(f"  Inserted {len(records)} records into {model.__tablename__}")

    return len(records), version


def seed_floor_pools(session, verbose: bool = False) -> int:
    """Seed the floor enemy pools from enemies.json."""
    seed_data = load_seed_file("enemies.json")
    floor_pools = seed_data.get("floor_pools", [])

    # Clear existing data
    session.query(FloorEnemyPool).delete()

    count = 0
    for pool in floor_pools:
        floor = pool["floor"]
        theme = pool.get("theme")
        lore_aspect = pool.get("lore_aspect")

        for enemy in pool.get("enemies", []):
            session.add(FloorEnemyPool(
                floor=floor,
                enemy_id=enemy["enemy_id"],
                weight=enemy["weight"],
                theme=theme,
                lore_aspect=lore_aspect,
                created_at=datetime.utcnow(),
            ))
            count += 1

    if verbose:
        print(f"  Inserted {count} floor pool entries")

    return count


def update_metadata(session, table_name: str, seed_file: str, version: str, count: int):
    """Update the game_constants_meta table with sync info."""
    # Check if entry exists
    existing = session.query(GameConstantsMeta).filter(
        GameConstantsMeta.table_name == table_name
    ).first()

    if existing:
        existing.version = version
        existing.seed_file = seed_file
        existing.record_count = count
        existing.last_synced_at = datetime.utcnow()
    else:
        session.add(GameConstantsMeta(
            table_name=table_name,
            version=version,
            seed_file=seed_file,
            record_count=count,
            last_synced_at=datetime.utcnow(),
        ))


def main():
    parser = argparse.ArgumentParser(
        description="Seed game constants from JSON files into PostgreSQL"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be loaded without writing to database"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Show detailed progress information"
    )
    parser.add_argument(
        "--table",
        choices=list(SEED_CONFIG.keys()) + ["floor_pools"],
        help="Only seed a specific table"
    )
    args = parser.parse_args()

    print("=" * 60)
    print("Game Constants Database Seeder")
    print("=" * 60)
    print(f"Seeds directory: {SEEDS_DIR}")
    print(f"Database: {settings.postgres_host}:{settings.postgres_port}/{settings.postgres_db}")
    print()

    if args.dry_run:
        print("DRY RUN MODE - No changes will be made")
        print()

        # Just show what would be loaded
        for table_name, config in SEED_CONFIG.items():
            if args.table and args.table != table_name:
                continue

            try:
                seed_data = load_seed_file(config["file"])
                data_key = config.get("data_key", "data")
                records = seed_data.get(data_key, [])
                version = seed_data.get("version", "unknown")
                print(f"{table_name}: {len(records)} records (v{version})")
            except FileNotFoundError as e:
                print(f"{table_name}: ERROR - {e}")

        # Floor pools
        if not args.table or args.table == "floor_pools":
            try:
                seed_data = load_seed_file("enemies.json")
                floor_pools = seed_data.get("floor_pools", [])
                pool_count = sum(len(p.get("enemies", [])) for p in floor_pools)
                print(f"floor_pools: {pool_count} entries")
            except FileNotFoundError as e:
                print(f"floor_pools: ERROR - {e}")

        return

    # Create sync database connection
    engine = create_engine(settings.database_url_sync, echo=False)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        total_records = 0

        # Seed each table
        for table_name, config in SEED_CONFIG.items():
            if args.table and args.table != table_name:
                continue

            print(f"Seeding {table_name}...")

            try:
                count, version = seed_table(session, table_name, config, args.verbose)
                update_metadata(
                    session,
                    table_name,
                    config["file"],
                    version,
                    count
                )
                total_records += count
                print(f"  {count} records (v{version})")
            except FileNotFoundError as e:
                print(f"  ERROR: {e}")
                continue
            except Exception as e:
                print(f"  ERROR: {e}")
                session.rollback()
                raise

        # Seed floor pools (special handling)
        if not args.table or args.table in ["enemies", "floor_pools"]:
            print("Seeding floor_pools...")
            try:
                pool_count = seed_floor_pools(session, args.verbose)
                # Get version from enemies.json
                enemies_data = load_seed_file("enemies.json")
                update_metadata(
                    session,
                    "floor_pools",
                    "enemies.json",
                    enemies_data.get("version", "1.0.0"),
                    pool_count
                )
                total_records += pool_count
                print(f"  {pool_count} entries")
            except Exception as e:
                print(f"  ERROR: {e}")
                session.rollback()
                raise

        # Commit all changes
        session.commit()

        print()
        print("=" * 60)
        print(f"SUCCESS: Seeded {total_records} total records")
        print("=" * 60)

    except Exception as e:
        session.rollback()
        print()
        print(f"FAILED: {e}")
        sys.exit(1)
    finally:
        session.close()


if __name__ == "__main__":
    main()
