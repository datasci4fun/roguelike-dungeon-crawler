"""Story manager for tracking narrative progress and discovered lore.

StoryManager serves as the Codex backend, maintaining display-ready caches
that mirror the authoritative CompletionLedger. The ledger is the source of
truth for completion tracking; StoryManager provides convenience views.
"""
from typing import Set, Dict, Any, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from .completion import CompletionLedger


class StoryManager:
    """Tracks story progress, discovered lore, and shown hints.

    When attached to a CompletionLedger, lore discoveries are mirrored to
    ensure consistency between Codex display and completion tracking.
    """

    def __init__(self, ledger: Optional['CompletionLedger'] = None):
        # Set of lore entry IDs that have been discovered
        self.discovered_lore: Set[str] = set()

        # Set of enemy types that have been encountered (for first-encounter messages)
        self.encountered_enemies: Set[str] = set()

        # Set of levels that have been visited (for location codex)
        self.visited_levels: Set[int] = set()

        # Set of hint IDs that have been shown (for tutorial system)
        self.shown_hints: Set[str] = set()

        # Reference to authoritative completion ledger (optional)
        self.ledger: Optional['CompletionLedger'] = ledger

    def attach_ledger(self, ledger: 'CompletionLedger') -> None:
        """Attach a completion ledger and hydrate caches from it.

        This ensures Codex and ledger are guaranteed consistent. Call this
        after loading a saved game or starting a new game with an existing ledger.
        """
        self.ledger = ledger

        # Hydrate lore cache from ledger (ledger is source of truth)
        self.discovered_lore = set(ledger.lore_found_ids)

        # Note: encountered_enemies and visited_levels are StoryManager-specific
        # (Codex display concerns) and not tracked by ledger, so we don't hydrate them.
        # They persist via StoryManager's own serialization.

    def discover_lore(self, entry_id: str, validate: bool = True) -> bool:
        """Mark a lore entry as discovered.

        Args:
            entry_id: The lore ID to discover
            validate: If True, validate the ID against known lore IDs

        Returns:
            True if this is a new discovery, False if already known

        Raises:
            ValueError: If validate=True and entry_id is not a valid lore ID
        """
        # Validate lore ID to catch typos
        if validate:
            from .lore_items import validate_lore_id
            validate_lore_id(entry_id, context="discover_lore")

        if entry_id in self.discovered_lore:
            return False

        self.discovered_lore.add(entry_id)

        # Mirror to ledger if attached
        if self.ledger:
            self.ledger.record_lore_found(entry_id)

        return True

    def has_discovered_lore(self, entry_id: str) -> bool:
        """Check if a lore entry has been discovered."""
        return entry_id in self.discovered_lore

    def encounter_enemy(self, enemy_name: str) -> bool:
        """Mark an enemy type as encountered.

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
        """Mark a level as visited.

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
        """Mark a hint as shown.

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
        """Get lore discovery progress.

        Returns:
            Tuple of (discovered_count, total_count)
        """
        from .story_data import LORE_ENTRIES
        return len(self.discovered_lore), len(LORE_ENTRIES)

    def get_discovered_lore_entries(self) -> list:
        """Get full data for all discovered lore entries.

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
        """Get bestiary entries for all encountered enemies.

        Returns:
            List of dicts with creature data for codex display
        """
        from ..core.constants import ENEMY_STATS, BOSS_STATS
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

    def get_artifact_entries(self) -> list:
        """Get artifact entries for all collected artifacts.

        Returns:
            List of dicts with artifact data for codex display
        """
        from ..items.artifacts import ArtifactId, ARTIFACT_DATA, VOW_DATA

        # Get discovered artifact IDs from ledger or empty set
        discovered_ids: Set[str] = set()
        if self.ledger:
            discovered_ids = set(self.ledger.artifacts_collected_ids)

        entries = []
        for artifact_id_name in sorted(discovered_ids):
            # Look up artifact by name
            try:
                artifact_id = ArtifactId[artifact_id_name]
            except KeyError:
                continue

            data = ARTIFACT_DATA.get(artifact_id)
            if not data:
                continue

            # Build content with description and zone info
            content = [data['description']]

            # Add vow info for Oathstone
            if artifact_id == ArtifactId.OATHSTONE:
                content.append("")
                content.append("Available Vows:")
                for vow_type, vow_data in VOW_DATA.items():
                    content.append(f"  {vow_data['name']}: {vow_data['description']}")
                    content.append(f"    Reward: {vow_data['reward_description']}")

            entries.append({
                'id': f'artifact_{artifact_id_name.lower()}',
                'title': data['name'],
                'content': content,
                'category': 'artifacts',
                'item_type': 'scroll',
                'artifact_data': {
                    'symbol': data['symbol'],
                    'name': data['name'],
                    'description': data['description'],
                    'zone_bias': data.get('zone_bias', []),
                }
            })

        return entries

    def get_location_entries(self) -> list:
        """Get location entries for all visited levels.

        Returns:
            List of dicts with location data for codex display, including
            completion progress from ledger if attached.
        """
        from ..core.constants import (
            LEVEL_THEMES, LEVEL_BOSS_MAP, BOSS_STATS, THEME_TILES,
            ENEMY_STATS, DungeonTheme
        )
        from .story_data import LEVEL_INTRO_MESSAGES
        from .lore_items import FLOOR_LORE_IDS

        entries = []

        for level in sorted(self.visited_levels):
            # Get theme for this level
            theme = LEVEL_THEMES.get(level, DungeonTheme.STONE)
            theme_data = THEME_TILES.get(theme, {})
            biome_name = theme_data.get('description', f'Level {level}')

            # Override display name for level 4 (uses CRYPT theme but is "Mirror Valdris")
            if level == 4:
                biome_name = "Mirror Valdris"

            # Get intro message
            intro_message = LEVEL_INTRO_MESSAGES.get(level, f'You enter dungeon level {level}.')

            # Get boss info for this level
            boss_type = LEVEL_BOSS_MAP.get(level)
            boss_name = None
            boss_symbol = None
            boss_type_name = None
            if boss_type and boss_type in BOSS_STATS:
                boss_data = BOSS_STATS[boss_type]
                boss_name = boss_data.get('name')
                boss_symbol = boss_data.get('symbol')
                boss_type_name = boss_type.name

            # Get creatures that can spawn on this level
            creatures = []
            for enemy_type, stats in ENEMY_STATS.items():
                min_level = stats.get('min_level', 1)
                max_level = stats.get('max_level', 8)
                if min_level <= level <= max_level:
                    creatures.append(stats['name'])

            # Calculate completion progress from ledger
            floor_cleared = False
            warden_defeated = False
            lore_found = 0
            lore_total = len(FLOOR_LORE_IDS.get(level, set()))

            if self.ledger:
                floor_cleared = level in self.ledger.floors_cleared
                if boss_type_name:
                    warden_defeated = boss_type_name in self.ledger.wardens_defeated
                # Count lore found for this floor
                floor_lore_ids = FLOOR_LORE_IDS.get(level, set())
                lore_found = len(self.ledger.lore_found_ids & floor_lore_ids)

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
                    # Completion progress from ledger
                    'cleared': floor_cleared,
                    'warden_defeated': warden_defeated,
                    'lore_progress': [lore_found, lore_total],
                }
            }
            entries.append(entry)

        return entries

    def get_sealed_page_entry(self) -> Optional[Dict[str, Any]]:
        """Get the Sealed Page entry showing overall completion progress.

        The Sealed Page is a mysterious Codex entry that shows the player's
        progress toward 100% completion without revealing what the reward is.

        Returns:
            Dict with sealed page data, or None if no ledger attached
        """
        if not self.ledger:
            return None

        from .lore_items import ALL_LORE_IDS, FLOOR_EVIDENCE_IDS
        from ..items.artifacts import ARTIFACT_DATA

        # Calculate totals
        total_floors = 8
        total_wardens = 8
        total_lore = len(ALL_LORE_IDS)  # All lore including evidence
        total_evidence = sum(len(ids) for ids in FLOOR_EVIDENCE_IDS.values())
        total_artifacts = len(ARTIFACT_DATA)

        # Get current counts from ledger
        floors_cleared = len(self.ledger.floors_cleared)
        wardens_defeated = len(self.ledger.wardens_defeated)
        lore_found = len(self.ledger.lore_found_ids)

        # Count evidence specifically (subset of lore)
        evidence_ids = set()
        for ids in FLOOR_EVIDENCE_IDS.values():
            evidence_ids.update(ids)
        evidence_found = len(self.ledger.lore_found_ids & evidence_ids)

        # Artifacts and ghosts
        artifacts_collected = len(self.ledger.artifacts_collected_ids)
        ghost_types_seen = len(self.ledger.ghost_encounters)

        # Calculate overall completion percentage
        # Weight: 25% floors, 25% wardens, 25% lore, 15% artifacts, 10% evidence
        floor_pct = floors_cleared / total_floors if total_floors > 0 else 0
        warden_pct = wardens_defeated / total_wardens if total_wardens > 0 else 0
        lore_pct = lore_found / total_lore if total_lore > 0 else 0
        artifact_pct = artifacts_collected / total_artifacts if total_artifacts > 0 else 0
        evidence_pct = evidence_found / total_evidence if total_evidence > 0 else 0

        overall_pct = (
            floor_pct * 0.25 +
            warden_pct * 0.25 +
            lore_pct * 0.25 +
            artifact_pct * 0.15 +
            evidence_pct * 0.10
        ) * 100

        # Build content lines
        content = [
            f"Completion: {overall_pct:.0f}%",
            "",
            f"Floors Cleared: {floors_cleared}/{total_floors}",
            f"Wardens Defeated: {wardens_defeated}/{total_wardens}",
            f"Lore Discovered: {lore_found}/{total_lore}",
            f"Evidence Found: {evidence_found}/{total_evidence}",
            f"Artifacts Collected: {artifacts_collected}/{total_artifacts}",
            f"Echoes Witnessed: {ghost_types_seen}",
            "",
        ]

        # Check if 100% complete
        is_complete = (
            floors_cleared >= total_floors and
            wardens_defeated >= total_wardens and
            lore_found >= total_lore and
            artifacts_collected >= total_artifacts
        )

        if is_complete:
            content.append("The page remains sealed.")
            content.append("Something else is required.")
        else:
            content.append("Condition: ???")

        return {
            'id': 'sealed_page',
            'title': 'SEALED PAGE',
            'content': content,
            'category': 'meta',
            'item_type': 'chronicle',
            'sealed_data': {
                'completion_pct': overall_pct,
                'floors': [floors_cleared, total_floors],
                'wardens': [wardens_defeated, total_wardens],
                'lore': [lore_found, total_lore],
                'evidence': [evidence_found, total_evidence],
                'artifacts': [artifacts_collected, total_artifacts],
                'ghosts': ghost_types_seen,
                'is_complete': is_complete,
            }
        }

    def to_dict(self) -> Dict[str, Any]:
        """Serialize story state to dictionary for saving."""
        return {
            'discovered_lore': list(self.discovered_lore),
            'encountered_enemies': list(self.encountered_enemies),
            'visited_levels': list(self.visited_levels),
            'shown_hints': list(self.shown_hints),
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any], ledger: Optional['CompletionLedger'] = None) -> 'StoryManager':
        """Deserialize story state from dictionary.

        Args:
            data: Serialized story manager data
            ledger: Optional CompletionLedger to attach

        Returns:
            Restored StoryManager instance
        """
        manager = cls(ledger=ledger)
        manager.discovered_lore = set(data.get('discovered_lore', []))
        manager.encountered_enemies = set(data.get('encountered_enemies', []))
        manager.visited_levels = set(data.get('visited_levels', []))
        manager.shown_hints = set(data.get('shown_hints', []))

        # If ledger provided, sync lore from ledger (ledger is source of truth)
        if ledger:
            # Merge any lore from ledger that might not be in saved state
            manager.discovered_lore |= set(ledger.lore_found_ids)

        return manager

    def reset(self):
        """Reset all story progress (for new game)."""
        self.discovered_lore.clear()
        self.encountered_enemies.clear()
        self.visited_levels.clear()
        self.shown_hints.clear()
        self.ledger = None
