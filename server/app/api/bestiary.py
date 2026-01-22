"""
Bestiary API - Creature and enemy database routes.

Features:
- Creature categories (Common, Elite, Thematic, Rare, Boss)
- Stats (health, damage, XP)
- Floor ranges and spawn locations
- Abilities, elements, and AI behaviors
- Loot drops and resistances
- Procedural 3D model coverage status
"""
import re
from pathlib import Path
from typing import Optional

from fastapi import APIRouter

from .bestiary_models import Creature
from .bestiary_data import CREATURES, CATEGORIES, FLOOR_THEMES

router = APIRouter(prefix="/api/bestiary", tags=["bestiary"])


# =============================================================================
# Procedural Model Coverage
# =============================================================================

def get_models_index_path() -> Path:
    """Get path to the models index.ts file."""
    # In Docker: mounted at /repo/web/src/models
    docker_path = Path("/repo/web/src/models/index.ts")
    if docker_path.exists():
        return docker_path
    # Local development
    return Path(__file__).parent.parent.parent.parent / "web" / "src" / "models" / "index.ts"


def parse_procedural_models() -> dict[str, dict]:
    """
    Parse MODEL_LIBRARY from index.ts to find procedural models.

    Returns a dict mapping enemyName -> model info
    """
    index_path = get_models_index_path()
    if not index_path.exists():
        return {}

    try:
        src = index_path.read_text(encoding="utf-8")
    except Exception:
        return {}

    # Find the library section
    lib_start = src.find("// @model-generator:library:start")
    lib_end = src.find("// @model-generator:library:end")

    if lib_start == -1 or lib_end == -1:
        return {}

    lib_content = src[lib_start:lib_end]

    # Parse each entry
    models_by_enemy: dict[str, list[dict]] = {}
    entry_regex = re.compile(r'\{\s*\.\.\.([A-Z0-9_]+)\s*,([^}]*)\}', re.DOTALL)

    for match in entry_regex.finditer(lib_content):
        meta_name = match.group(1)
        props_str = match.group(2)

        # Extract version info
        version_match = re.search(r'version:\s*(\d+)', props_str)
        is_active_match = re.search(r'isActive:\s*(true|false)', props_str)
        base_model_id_match = re.search(r"baseModelId:\s*['\"]([^'\"]+)['\"]", props_str)

        # Infer model ID from META name
        model_id = re.sub(r'_META$', '', meta_name).lower().replace('_', '-')

        version = int(version_match.group(1)) if version_match else 1
        is_active = is_active_match.group(1) == 'true' if is_active_match else True
        base_model_id = base_model_id_match.group(1) if base_model_id_match else re.sub(r'-v\d+$', '', model_id)

        # Now we need to find the enemyName - read the actual model file
        # Convert META name to camelCase file name:
        # GOBLIN_META -> goblin
        # GOBLIN_KING_META -> goblinKing
        # GOBLIN_V2_META -> goblinV2
        # SPIDER_QUEEN_META -> spiderQueen
        base_name = meta_name.replace('_META', '')

        # Handle versioned names first: GOBLIN_V2 -> goblinV2
        version_suffix = ''
        if '_V' in base_name and base_name.split('_V')[-1].isdigit():
            parts = base_name.rsplit('_V', 1)
            base_name = parts[0]
            version_suffix = 'V' + parts[1]

        # Convert GOBLIN_KING to goblinKing (camelCase)
        words = base_name.split('_')
        model_file_name = words[0].lower() + ''.join(w.capitalize() for w in words[1:]) + version_suffix

        model_file_path = index_path.parent / f"{model_file_name}.ts"
        enemy_name = None

        if model_file_path.exists():
            try:
                model_src = model_file_path.read_text(encoding="utf-8")
                enemy_name_match = re.search(r"enemyName:\s*['\"]([^'\"]+)['\"]", model_src)
                if enemy_name_match:
                    enemy_name = enemy_name_match.group(1)
            except Exception:
                pass

        if enemy_name:
            if enemy_name not in models_by_enemy:
                models_by_enemy[enemy_name] = []
            models_by_enemy[enemy_name].append({
                "modelId": model_id,
                "version": version,
                "isActive": is_active,
                "baseModelId": base_model_id,
            })

    # For each enemy, find the active model
    result = {}
    for enemy_name, models in models_by_enemy.items():
        # Sort by version descending
        models.sort(key=lambda m: m["version"], reverse=True)
        active_model = next((m for m in models if m["isActive"]), models[0] if models else None)

        result[enemy_name] = {
            "hasModel": True,
            "activeModel": active_model,
            "allVersions": models,
            "versionCount": len(models),
        }

    return result


def enrich_creature_with_model(creature_dict: dict, model_info: Optional[dict]) -> dict:
    """Add procedural model info to a creature dict."""
    if model_info:
        creature_dict["proceduralModel"] = model_info
    else:
        creature_dict["proceduralModel"] = {
            "hasModel": False,
            "activeModel": None,
            "allVersions": [],
            "versionCount": 0,
        }
    return creature_dict


# Cache the model info (refreshed on each request for now)
def get_model_coverage() -> dict[str, dict]:
    """Get current procedural model coverage."""
    return parse_procedural_models()


@router.get("")
async def get_all_creatures():
    """Get all bestiary entries with procedural model coverage."""
    model_coverage = get_model_coverage()

    creatures = []
    for c in CREATURES:
        creature_dict = c.model_dump()
        model_info = model_coverage.get(c.name)
        enrich_creature_with_model(creature_dict, model_info)
        creatures.append(creature_dict)

    # Calculate coverage stats
    with_models = sum(1 for c in creatures if c["proceduralModel"]["hasModel"])

    return {
        "creatures": creatures,
        "total": len(CREATURES),
        "categories": CATEGORIES,
        "modelCoverage": {
            "withModels": with_models,
            "withoutModels": len(CREATURES) - with_models,
            "percentage": round(with_models / len(CREATURES) * 100, 1) if CREATURES else 0,
        },
    }


@router.get("/categories")
async def get_categories():
    """Get creature categories."""
    category_counts = {}
    for creature in CREATURES:
        cat = creature.category
        category_counts[cat] = category_counts.get(cat, 0) + 1

    return {
        "categories": [
            {
                "id": cat_id,
                **cat_info,
                "count": category_counts.get(cat_id, 0),
            }
            for cat_id, cat_info in CATEGORIES.items()
        ]
    }


@router.get("/category/{category_id}")
async def get_creatures_by_category(category_id: str):
    """Get creatures in a specific category with model coverage."""
    model_coverage = get_model_coverage()
    creatures = []

    for c in CREATURES:
        if c.category == category_id:
            creature_dict = c.model_dump()
            model_info = model_coverage.get(c.name)
            enrich_creature_with_model(creature_dict, model_info)
            creatures.append(creature_dict)

    return {
        "category": CATEGORIES.get(category_id),
        "creatures": creatures,
        "count": len(creatures),
    }


@router.get("/creature/{creature_id}")
async def get_creature(creature_id: str):
    """Get a specific creature with model coverage."""
    model_coverage = get_model_coverage()

    for creature in CREATURES:
        if creature.id == creature_id:
            creature_dict = creature.model_dump()
            model_info = model_coverage.get(creature.name)
            enrich_creature_with_model(creature_dict, model_info)
            return creature_dict

    return {"error": "Creature not found"}


@router.get("/search")
async def search_creatures(q: str):
    """Search creatures by name or description with model coverage."""
    model_coverage = get_model_coverage()
    query = q.lower()

    results = []
    for c in CREATURES:
        if (query in c.name.lower()
            or query in c.description.lower()
            or (c.title and query in c.title.lower())):
            creature_dict = c.model_dump()
            model_info = model_coverage.get(c.name)
            enrich_creature_with_model(creature_dict, model_info)
            results.append(creature_dict)

    return {
        "query": q,
        "results": results,
        "count": len(results),
    }


@router.get("/floors/{floor}")
async def get_creatures_by_floor(floor: int):
    """Get creatures that appear on a specific floor with model coverage."""
    model_coverage = get_model_coverage()
    matched = []

    for creature in CREATURES:
        floor_range = creature.floors
        include = False

        if floor_range == "Any" or floor_range == "All":
            include = True
        elif "only" in floor_range.lower():
            # Single floor like "8 only"
            try:
                floor_num = int(floor_range.split()[0])
                if floor_num == floor:
                    include = True
            except ValueError:
                pass
        elif "(Boss)" in floor_range or "(Final Boss)" in floor_range:
            # Boss floor
            try:
                floor_num = int(floor_range.split()[0])
                if floor_num == floor:
                    include = True
            except ValueError:
                pass
        elif "-" in floor_range:
            # Handle ranges like "1-5"
            parts = floor_range.split("-")
            try:
                min_floor, max_floor = int(parts[0]), int(parts[1])
                if min_floor <= floor <= max_floor:
                    include = True
            except ValueError:
                pass

        if include:
            creature_dict = creature.model_dump()
            model_info = model_coverage.get(creature.name)
            enrich_creature_with_model(creature_dict, model_info)
            matched.append(creature_dict)

    return {
        "floor": floor,
        "theme": FLOOR_THEMES.get(floor, "Unknown"),
        "creatures": matched,
        "count": len(matched),
    }


@router.get("/stats")
async def get_bestiary_stats():
    """Get bestiary statistics including model coverage."""
    model_coverage = get_model_coverage()

    category_counts = {}
    total_health = 0
    max_damage = 0
    with_models = 0

    for creature in CREATURES:
        cat = creature.category
        category_counts[cat] = category_counts.get(cat, 0) + 1
        total_health += creature.health
        if creature.damage > max_damage:
            max_damage = creature.damage
        if creature.name in model_coverage:
            with_models += 1

    return {
        "total_creatures": len(CREATURES),
        "by_category": category_counts,
        "average_health": total_health // len(CREATURES) if CREATURES else 0,
        "max_damage": max_damage,
        "floor_themes": FLOOR_THEMES,
        "modelCoverage": {
            "withModels": with_models,
            "withoutModels": len(CREATURES) - with_models,
            "percentage": round(with_models / len(CREATURES) * 100, 1) if CREATURES else 0,
            "coveredCreatures": list(model_coverage.keys()),
        },
    }
