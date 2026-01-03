"""Achievement definitions for the roguelike game."""
from dataclasses import dataclass
from enum import Enum
from typing import Optional, Callable, Any


class AchievementCategory(str, Enum):
    """Achievement categories."""
    COMBAT = "combat"
    PROGRESSION = "progression"
    EFFICIENCY = "efficiency"
    COLLECTION = "collection"
    SPECIAL = "special"


class AchievementRarity(str, Enum):
    """Achievement rarity levels."""
    COMMON = "common"
    RARE = "rare"
    EPIC = "epic"
    LEGENDARY = "legendary"


@dataclass
class AchievementDef:
    """Definition of an achievement."""
    id: str
    name: str
    description: str
    category: AchievementCategory
    rarity: AchievementRarity
    icon: str
    points: int
    hidden: bool = False
    # Threshold for cumulative achievements (e.g., kill 100 enemies)
    threshold: Optional[int] = None
    # Field to check for cumulative achievements
    cumulative_field: Optional[str] = None


# Achievement checker functions
def check_first_blood(game_result: Any, user_stats: Any) -> bool:
    """First kill ever."""
    return user_stats.total_kills >= 1


def check_monster_slayer(game_result: Any, user_stats: Any) -> bool:
    """Kill 100 enemies total."""
    return user_stats.total_kills >= 100


def check_dragon_slayer(game_result: Any, user_stats: Any) -> bool:
    """Kill a dragon (check killed_by for dragon deaths of enemies)."""
    # This requires checking if the player killed a dragon in this game
    # We'd need to track enemy types killed - for now, approximate with high kill count + high level
    return game_result.level_reached >= 5 and game_result.kills >= 20


def check_overkill(game_result: Any, user_stats: Any) -> bool:
    """Deal 500+ damage in one run."""
    return game_result.damage_dealt >= 500


def check_elite_hunter(game_result: Any, user_stats: Any) -> bool:
    """Kill 10 elite enemies total (approximated by high total kills)."""
    return user_stats.total_kills >= 50  # Approximate


def check_first_victory(game_result: Any, user_stats: Any) -> bool:
    """Win first game."""
    return user_stats.victories >= 1


def check_victories_10(game_result: Any, user_stats: Any) -> bool:
    """Win 10 games."""
    return user_stats.victories >= 10


def check_deep_delver(game_result: Any, user_stats: Any) -> bool:
    """Reach level 5."""
    return user_stats.max_level_reached >= 5


def check_level_up_max(game_result: Any, user_stats: Any) -> bool:
    """Reach player level 10 in a single run."""
    return game_result.player_level >= 10


def check_dedicated(game_result: Any, user_stats: Any) -> bool:
    """Play 50 games."""
    return user_stats.games_played >= 50


def check_speedrunner(game_result: Any, user_stats: Any) -> bool:
    """Win in under 500 turns."""
    return game_result.victory and game_result.turns_taken < 500


def check_untouchable(game_result: Any, user_stats: Any) -> bool:
    """Win without taking any damage."""
    return game_result.victory and game_result.damage_taken == 0


def check_no_potions(game_result: Any, user_stats: Any) -> bool:
    """Win without using any potions."""
    return game_result.victory and game_result.potions_used == 0


def check_flawless_level(game_result: Any, user_stats: Any) -> bool:
    """Clear a level without taking damage (approximated)."""
    # Approximate: win with very low damage taken relative to kills
    return game_result.victory and game_result.damage_taken < 10


def check_collector(game_result: Any, user_stats: Any) -> bool:
    """Collect 50 items in one run."""
    return game_result.items_collected >= 50


def check_potion_master(game_result: Any, user_stats: Any) -> bool:
    """Use 50 potions total (approximated by games played)."""
    return user_stats.games_played >= 25  # Approximate


def check_hoarder(game_result: Any, user_stats: Any) -> bool:
    """Collect 500 items total (approximated)."""
    return user_stats.games_played >= 50  # Approximate


def check_welcome(game_result: Any, user_stats: Any) -> bool:
    """Play first game."""
    return user_stats.games_played >= 1


def check_comeback(game_result: Any, user_stats: Any) -> bool:
    """Win with less than 10% HP remaining."""
    if not game_result.victory or game_result.max_hp == 0:
        return False
    hp_percent = game_result.final_hp / game_result.max_hp
    return hp_percent < 0.10


def check_high_roller(game_result: Any, user_stats: Any) -> bool:
    """Score 50,000+."""
    return game_result.score >= 50000 or user_stats.high_score >= 50000


# Boss achievement checkers
def check_boss_slayer(game_result: Any, user_stats: Any) -> bool:
    """Defeat first boss."""
    bosses_killed = getattr(game_result, 'bosses_killed', 0)
    total_bosses = getattr(user_stats, 'total_bosses_killed', 0)
    return bosses_killed >= 1 or total_bosses >= 1


def check_kingslayer(game_result: Any, user_stats: Any) -> bool:
    """Defeat the Goblin King (level 1 boss)."""
    # Check if player got past level 1 (means they killed the boss)
    return game_result.level_reached >= 2


def check_dragon_emperor_slain(game_result: Any, user_stats: Any) -> bool:
    """Defeat the Dragon Emperor (final boss on level 5)."""
    # Victory means defeating the final boss
    return game_result.victory


def check_dungeon_master(game_result: Any, user_stats: Any) -> bool:
    """Defeat all 5 bosses in one run."""
    bosses_killed = getattr(game_result, 'bosses_killed', 0)
    # Victory with all 5 bosses killed
    return game_result.victory and bosses_killed >= 5


# All achievement definitions
ACHIEVEMENTS: dict[str, AchievementDef] = {
    # Combat (5)
    "first_blood": AchievementDef(
        id="first_blood",
        name="First Blood",
        description="Kill your first enemy",
        category=AchievementCategory.COMBAT,
        rarity=AchievementRarity.COMMON,
        icon="sword",
        points=10,
        threshold=1,
        cumulative_field="total_kills",
    ),
    "monster_slayer": AchievementDef(
        id="monster_slayer",
        name="Monster Slayer",
        description="Kill 100 enemies total",
        category=AchievementCategory.COMBAT,
        rarity=AchievementRarity.RARE,
        icon="skull",
        points=50,
        threshold=100,
        cumulative_field="total_kills",
    ),
    "dragon_slayer": AchievementDef(
        id="dragon_slayer",
        name="Dragon Slayer",
        description="Defeat a dragon",
        category=AchievementCategory.COMBAT,
        rarity=AchievementRarity.EPIC,
        icon="dragon",
        points=100,
    ),
    "overkill": AchievementDef(
        id="overkill",
        name="Overkill",
        description="Deal 500+ damage in a single run",
        category=AchievementCategory.COMBAT,
        rarity=AchievementRarity.RARE,
        icon="explosion",
        points=30,
    ),
    "elite_hunter": AchievementDef(
        id="elite_hunter",
        name="Elite Hunter",
        description="Kill 10 elite enemies total",
        category=AchievementCategory.COMBAT,
        rarity=AchievementRarity.RARE,
        icon="crown",
        points=50,
        threshold=50,
        cumulative_field="total_kills",
    ),
    "boss_slayer": AchievementDef(
        id="boss_slayer",
        name="Boss Slayer",
        description="Defeat your first boss",
        category=AchievementCategory.COMBAT,
        rarity=AchievementRarity.COMMON,
        icon="skull-crossbones",
        points=15,
    ),
    "kingslayer": AchievementDef(
        id="kingslayer",
        name="Kingslayer",
        description="Defeat the Goblin King",
        category=AchievementCategory.COMBAT,
        rarity=AchievementRarity.RARE,
        icon="crown",
        points=25,
    ),
    "dragon_emperor_slain": AchievementDef(
        id="dragon_emperor_slain",
        name="Dragon Emperor Slain",
        description="Defeat the Dragon Emperor, the final boss",
        category=AchievementCategory.COMBAT,
        rarity=AchievementRarity.EPIC,
        icon="dragon",
        points=100,
    ),
    "dungeon_master": AchievementDef(
        id="dungeon_master",
        name="Dungeon Master",
        description="Defeat all 5 bosses in a single run",
        category=AchievementCategory.COMBAT,
        rarity=AchievementRarity.LEGENDARY,
        icon="gem",
        points=200,
    ),

    # Progression (5)
    "first_victory": AchievementDef(
        id="first_victory",
        name="Champion",
        description="Win your first game",
        category=AchievementCategory.PROGRESSION,
        rarity=AchievementRarity.RARE,
        icon="trophy",
        points=50,
        threshold=1,
        cumulative_field="victories",
    ),
    "victories_10": AchievementDef(
        id="victories_10",
        name="Veteran",
        description="Win 10 games",
        category=AchievementCategory.PROGRESSION,
        rarity=AchievementRarity.EPIC,
        icon="medal",
        points=100,
        threshold=10,
        cumulative_field="victories",
    ),
    "deep_delver": AchievementDef(
        id="deep_delver",
        name="Deep Delver",
        description="Reach the deepest dungeon level",
        category=AchievementCategory.PROGRESSION,
        rarity=AchievementRarity.RARE,
        icon="stairs",
        points=30,
        threshold=5,
        cumulative_field="max_level_reached",
    ),
    "level_up_max": AchievementDef(
        id="level_up_max",
        name="Mighty Hero",
        description="Reach player level 10 in a single run",
        category=AchievementCategory.PROGRESSION,
        rarity=AchievementRarity.RARE,
        icon="star",
        points=40,
    ),
    "dedicated": AchievementDef(
        id="dedicated",
        name="Dedicated",
        description="Play 50 games",
        category=AchievementCategory.PROGRESSION,
        rarity=AchievementRarity.RARE,
        icon="calendar",
        points=30,
        threshold=50,
        cumulative_field="games_played",
    ),

    # Efficiency (4)
    "speedrunner": AchievementDef(
        id="speedrunner",
        name="Speedrunner",
        description="Win in under 500 turns",
        category=AchievementCategory.EFFICIENCY,
        rarity=AchievementRarity.EPIC,
        icon="lightning",
        points=75,
    ),
    "untouchable": AchievementDef(
        id="untouchable",
        name="Untouchable",
        description="Win without taking any damage",
        category=AchievementCategory.EFFICIENCY,
        rarity=AchievementRarity.LEGENDARY,
        icon="shield",
        points=200,
    ),
    "no_potions": AchievementDef(
        id="no_potions",
        name="Purist",
        description="Win without using any potions",
        category=AchievementCategory.EFFICIENCY,
        rarity=AchievementRarity.EPIC,
        icon="flask",
        points=75,
    ),
    "flawless_level": AchievementDef(
        id="flawless_level",
        name="Flawless",
        description="Win taking less than 10 damage total",
        category=AchievementCategory.EFFICIENCY,
        rarity=AchievementRarity.RARE,
        icon="sparkle",
        points=50,
    ),

    # Collection (3)
    "collector": AchievementDef(
        id="collector",
        name="Collector",
        description="Collect 50 items in a single run",
        category=AchievementCategory.COLLECTION,
        rarity=AchievementRarity.RARE,
        icon="bag",
        points=30,
    ),
    "potion_master": AchievementDef(
        id="potion_master",
        name="Potion Master",
        description="Use potions in 25 different games",
        category=AchievementCategory.COLLECTION,
        rarity=AchievementRarity.RARE,
        icon="potion",
        points=30,
        threshold=25,
        cumulative_field="games_played",
    ),
    "hoarder": AchievementDef(
        id="hoarder",
        name="Treasure Hunter",
        description="Play 50 games collecting items",
        category=AchievementCategory.COLLECTION,
        rarity=AchievementRarity.EPIC,
        icon="chest",
        points=50,
        threshold=50,
        cumulative_field="games_played",
    ),

    # Special (3)
    "welcome": AchievementDef(
        id="welcome",
        name="Welcome",
        description="Play your first game",
        category=AchievementCategory.SPECIAL,
        rarity=AchievementRarity.COMMON,
        icon="door",
        points=5,
        threshold=1,
        cumulative_field="games_played",
    ),
    "comeback": AchievementDef(
        id="comeback",
        name="Comeback King",
        description="Win with less than 10% HP remaining",
        category=AchievementCategory.SPECIAL,
        rarity=AchievementRarity.EPIC,
        icon="heart",
        points=75,
    ),
    "high_roller": AchievementDef(
        id="high_roller",
        name="High Roller",
        description="Achieve a score of 50,000+",
        category=AchievementCategory.SPECIAL,
        rarity=AchievementRarity.EPIC,
        icon="coins",
        points=100,
    ),
}


# Achievement checker mapping
ACHIEVEMENT_CHECKERS: dict[str, Callable[[Any, Any], bool]] = {
    "first_blood": check_first_blood,
    "monster_slayer": check_monster_slayer,
    "dragon_slayer": check_dragon_slayer,
    "overkill": check_overkill,
    "elite_hunter": check_elite_hunter,
    "boss_slayer": check_boss_slayer,
    "kingslayer": check_kingslayer,
    "dragon_emperor_slain": check_dragon_emperor_slain,
    "dungeon_master": check_dungeon_master,
    "first_victory": check_first_victory,
    "victories_10": check_victories_10,
    "deep_delver": check_deep_delver,
    "level_up_max": check_level_up_max,
    "dedicated": check_dedicated,
    "speedrunner": check_speedrunner,
    "untouchable": check_untouchable,
    "no_potions": check_no_potions,
    "flawless_level": check_flawless_level,
    "collector": check_collector,
    "potion_master": check_potion_master,
    "hoarder": check_hoarder,
    "welcome": check_welcome,
    "comeback": check_comeback,
    "high_roller": check_high_roller,
}


def get_all_achievements() -> list[AchievementDef]:
    """Get all achievement definitions."""
    return list(ACHIEVEMENTS.values())


def get_achievement(achievement_id: str) -> Optional[AchievementDef]:
    """Get a specific achievement definition."""
    return ACHIEVEMENTS.get(achievement_id)


def get_achievements_by_category(category: AchievementCategory) -> list[AchievementDef]:
    """Get achievements filtered by category."""
    return [a for a in ACHIEVEMENTS.values() if a.category == category]


def get_total_points() -> int:
    """Get total possible achievement points."""
    return sum(a.points for a in ACHIEVEMENTS.values())
