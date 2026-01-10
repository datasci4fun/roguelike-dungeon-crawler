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
