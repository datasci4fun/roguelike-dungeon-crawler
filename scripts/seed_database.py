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
    GameConstantsMeta,
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
