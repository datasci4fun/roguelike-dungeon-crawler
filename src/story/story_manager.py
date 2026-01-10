"""Story manager for tracking narrative progress and discovered lore."""
from typing import Set, Dict, Any


class StoryManager:
    """Tracks story progress, discovered lore, and shown hints."""

    def __init__(self):
        # Set of lore entry IDs that have been discovered
        self.discovered_lore: Set[str] = set()

        # Set of enemy types that have been encountered (for first-encounter messages)
        self.encountered_enemies: Set[str] = set()

        # Set of levels that have shown their intro message
        self.visited_levels: Set[int] = set()

        # Set of hint IDs that have been shown (for tutorial system)
        self.shown_hints: Set[str] = set()

    def discover_lore(self, entry_id: str) -> bool:
        """
        Mark a lore entry as discovered.

        Returns:
            True if this is a new discovery, False if already known
        """
        if entry_id in self.discovered_lore:
            return False
        self.discovered_lore.add(entry_id)
        return True

    def has_discovered_lore(self, entry_id: str) -> bool:
        """Check if a lore entry has been discovered."""
        return entry_id in self.discovered_lore

    def encounter_enemy(self, enemy_name: str) -> bool:
        """
        Mark an enemy type as encountered.

        Returns:
            True if this is the first encounter, False otherwise
        """
        if enemy_name in self.encountered_enemies:
            return False
        self.encountered_enemies.add(enemy_name)
        return True

    def has_encountered_enemy(self, enemy_name: str) -> bool:
        """Check if an enemy type has been encountered before."""
        return enemy_name in self.encountered_enemies

    def visit_level(self, level: int) -> bool:
        """
        Mark a level as visited.

        Returns:
            True if this is the first visit, False otherwise
        """
        if level in self.visited_levels:
            return False
        self.visited_levels.add(level)
        return True

    def has_visited_level(self, level: int) -> bool:
        """Check if a level has been visited before."""
        return level in self.visited_levels

    def show_hint(self, hint_id: str) -> bool:
        """
        Mark a hint as shown.

        Returns:
            True if this is a new hint, False if already shown
        """
        if hint_id in self.shown_hints:
            return False
        self.shown_hints.add(hint_id)
        return True

    def has_shown_hint(self, hint_id: str) -> bool:
        """Check if a hint has been shown."""
        return hint_id in self.shown_hints

    def get_lore_progress(self) -> tuple:
        """
        Get lore discovery progress.

        Returns:
            Tuple of (discovered_count, total_count)
        """
        from .story_data import LORE_ENTRIES
        return len(self.discovered_lore), len(LORE_ENTRIES)

    def get_discovered_lore_entries(self) -> list:
        """
        Get full data for all discovered lore entries.

        Returns:
            List of dicts with id, title, content, category, item_type for each discovered entry
        """
        from .story_data import LORE_ENTRIES
        entries = []
        for lore_id in sorted(self.discovered_lore):
            if lore_id in LORE_ENTRIES:
                entry = LORE_ENTRIES[lore_id]
                entries.append({
                    'id': lore_id,
                    'title': entry['title'],
                    'content': entry['content'],
                    'category': entry.get('category', 'history'),
                    'item_type': entry.get('item_type', 'scroll'),
                })
        return entries

    def get_bestiary_entries(self) -> list:
        """
        Get bestiary entries for all encountered enemies.

        Returns:
            List of dicts with creature data for codex display
        """
        from ..core.constants import ENEMY_STATS, BOSS_STATS, EnemyType, BossType
        from .story_data import ENEMY_ENCOUNTER_MESSAGES

        entries = []

        # Regular enemies
        for enemy_name in sorted(self.encountered_enemies):
            # Find the matching enemy type
            enemy_data = None
            for enemy_type, stats in ENEMY_STATS.items():
                if stats['name'] == enemy_name:
                    enemy_data = stats
                    break

            # Check if it's a boss
            is_boss = False
            for boss_type, boss_stats in BOSS_STATS.items():
                if boss_stats['name'] == enemy_name:
                    enemy_data = boss_stats
                    is_boss = True
                    break

            if enemy_data:
                encounter_text = ENEMY_ENCOUNTER_MESSAGES.get(enemy_name, f"You have encountered a {enemy_name}.")
                entry = {
                    'id': f'creature_{enemy_name.lower().replace(" ", "_")}',
                    'title': enemy_name,
                    'content': [encounter_text],
                    'category': 'creatures',
                    'item_type': 'bestiary',
                    'creature_data': {
                        'symbol': enemy_data.get('symbol', '?'),
                        'name': enemy_name,
                        'hp': enemy_data.get('hp', 0),
                        'damage': enemy_data.get('damage', 0),
                        'xp': enemy_data.get('xp', 0),
                        'is_boss': is_boss,
                        'abilities': enemy_data.get('abilities', []),
                        'resistances': enemy_data.get('resistances', {}),
                        'element': enemy_data.get('element', {}).name if enemy_data.get('element') else None,
                        'level_range': [enemy_data.get('min_level', 1), enemy_data.get('max_level', 8)],
                        'first_encounter_text': encounter_text,
                        'description': enemy_data.get('description', ''),
                    }
                }
                entries.append(entry)

        return entries

    def get_location_entries(self) -> list:
        """
        Get location entries for all visited levels.

        Returns:
            List of dicts with location data for codex display
        """
        from ..core.constants import (
            LEVEL_THEMES, LEVEL_BOSS_MAP, BOSS_STATS, THEME_TILES,
            ENEMY_STATS, DungeonTheme
        )
        from .story_data import LEVEL_INTRO_MESSAGES

        entries = []

        for level in sorted(self.visited_levels):
            # Get theme for this level
            theme = LEVEL_THEMES.get(level, DungeonTheme.STONE)
            theme_data = THEME_TILES.get(theme, {})
            biome_name = theme_data.get('description', f'Level {level}')

            # Get intro message
            intro_message = LEVEL_INTRO_MESSAGES.get(level, f'You enter dungeon level {level}.')

            # Get boss info for this level
            boss_type = LEVEL_BOSS_MAP.get(level)
            boss_name = None
            boss_symbol = None
            if boss_type and boss_type in BOSS_STATS:
                boss_data = BOSS_STATS[boss_type]
                boss_name = boss_data.get('name')
                boss_symbol = boss_data.get('symbol')

            # Get creatures that can spawn on this level
            creatures = []
            for enemy_type, stats in ENEMY_STATS.items():
                min_level = stats.get('min_level', 1)
                max_level = stats.get('max_level', 8)
                if min_level <= level <= max_level:
                    creatures.append(stats['name'])

            entry = {
                'id': f'location_level_{level}',
                'title': biome_name,
                'content': [intro_message],
                'category': 'locations',
                'item_type': 'location',
                'location_data': {
                    'level': level,
                    'biome_id': theme.name.lower(),
                    'biome_name': biome_name,
                    'intro_message': intro_message,
                    'boss_name': boss_name,
                    'boss_symbol': boss_symbol,
                    'creatures': creatures,
                }
            }
            entries.append(entry)

        return entries

    def to_dict(self) -> Dict[str, Any]:
        """Serialize story state to dictionary for saving."""
        return {
            'discovered_lore': list(self.discovered_lore),
            'encountered_enemies': list(self.encountered_enemies),
            'visited_levels': list(self.visited_levels),
            'shown_hints': list(self.shown_hints),
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'StoryManager':
        """Deserialize story state from dictionary."""
        manager = cls()
        manager.discovered_lore = set(data.get('discovered_lore', []))
        manager.encountered_enemies = set(data.get('encountered_enemies', []))
        manager.visited_levels = set(data.get('visited_levels', []))
        manager.shown_hints = set(data.get('shown_hints', []))
        return manager

    def reset(self):
        """Reset all story progress (for new game)."""
        self.discovered_lore.clear()
        self.encountered_enemies.clear()
        self.visited_levels.clear()
        self.shown_hints.clear()
