"""Ghost manager for spawning and behavior.

This module contains the GhostManager class that handles ghost
spawning, placement, and per-turn behavior processing.

Delegates to specialized modules:
- ghost_spawning.py: Ghost placement and Echo path generation
- ghost_behaviors.py: Per-turn behavior processing
- ghost_trials.py: Champion trial system and Hollowed spawning
"""
from typing import TYPE_CHECKING, Optional, List, Tuple, Set

from .types import GhostType
from .ghost import Ghost, GhostPath
from .ghost_spawning import GhostSpawner
from .ghost_behaviors import GhostBehaviorProcessor
from .ghost_trials import GhostTrialHandler

if TYPE_CHECKING:
    from ...world import Dungeon
    from ..entities import Player
    from ...story.completion import VictoryLegacyResult


class GhostManager:
    """Manages ghost spawning and behavior per floor.

    Ghosts are deterministically placed per seed+floor, with:
    - Zone-biased placement
    - Per-floor limits
    - Meaningful interactions

    Uses composition to delegate to specialized handlers.
    """

    def __init__(self):
        self.ghosts: List[Ghost] = []
        self.floor = 0
        self.seed = 0
        self._silence_positions: Set[Tuple[int, int]] = set()
        # Anti-spam: track which message types shown this floor
        self._messages_shown: Set[GhostType] = set()

        # Delegate to specialized handlers
        self._spawner = GhostSpawner()
        self._behavior_processor = GhostBehaviorProcessor()
        self._trial_handler = GhostTrialHandler()

    def initialize_floor(self, floor: int, dungeon: 'Dungeon',
                         ghost_data: List[dict] = None, seed: int = None,
                         victory_legacy: 'VictoryLegacyResult' = None):
        """Initialize ghosts for a new floor.

        Args:
            floor: Current floor number
            dungeon: The dungeon instance
            ghost_data: Optional list of ghost recordings to use
            seed: Optional seed for determinism
            victory_legacy: Optional VictoryLegacyResult for derived victory imprints
        """
        self.floor = floor
        self.seed = seed if seed is not None else floor * 8888
        self.ghosts.clear()
        self._silence_positions.clear()
        self._messages_shown.clear()
        self._trial_handler.clear()

        # Delegate spawning to GhostSpawner
        self.ghosts, self._silence_positions = self._spawner.initialize_floor(
            floor=floor,
            dungeon=dungeon,
            ghost_data=ghost_data,
            seed=self.seed,
            victory_legacy=victory_legacy
        )

    def tick(self, player: 'Player', dungeon: 'Dungeon') -> List[str]:
        """Process ghost behaviors for this turn.

        Returns:
            List of messages to display
        """
        return self._behavior_processor.tick(
            ghosts=self.ghosts,
            player=player,
            dungeon=dungeon,
            messages_shown=self._messages_shown,
            pending_trial_callback=self._trial_handler.set_pending_trial
        )

    def check_silence_debuff(self, x: int, y: int) -> Optional[str]:
        """Check if position is in a Silence zone.

        Returns:
            Debuff message if in Silence, None otherwise
        """
        if (x, y) in self._silence_positions:
            return "Something is missing here."
        return None

    def get_ghost_at(self, x: int, y: int) -> Optional[Ghost]:
        """Get ghost at position (for rendering)."""
        for ghost in self.ghosts:
            if ghost.active and ghost.x == x and ghost.y == y:
                return ghost
        return None

    def get_visible_ghosts(self, player_x: int, player_y: int,
                           view_distance: int = 8) -> List[Ghost]:
        """Get ghosts visible to player."""
        visible = []
        for ghost in self.ghosts:
            if not ghost.active:
                continue
            dist = abs(ghost.x - player_x) + abs(ghost.y - player_y)
            if dist <= view_distance:
                visible.append(ghost)
        return visible

    def spawn_hollowed_enemy(self, dungeon: 'Dungeon', entity_manager) -> bool:
        """Spawn Hollowed ghosts as actual enemies.

        Called after ghost initialization to add Hollowed to enemy list.

        Returns:
            True if any Hollowed were spawned
        """
        return self._trial_handler.spawn_hollowed_enemy(
            ghosts=self.ghosts,
            dungeon=dungeon,
            entity_manager=entity_manager
        )

    def has_pending_trial(self) -> bool:
        """Check if there's a pending champion trial to spawn."""
        return self._trial_handler.has_pending_trial()

    def spawn_champion_trial(self, dungeon: 'Dungeon', entity_manager) -> List[str]:
        """Spawn a champion trial enemy if one is pending.

        Creates a challenging elite enemy near the ghost position.
        Defeating it grants bonus rewards.

        Returns:
            List of messages to display
        """
        return self._trial_handler.spawn_champion_trial(
            floor=self.floor,
            dungeon=dungeon,
            entity_manager=entity_manager
        )

    def check_trial_completion(self, entity_manager, player: 'Player') -> List[str]:
        """Check if any champion trials have been completed.

        Called after combat to check if trial enemies were defeated.

        Returns:
            List of messages to display (including reward messages)
        """
        return self._trial_handler.check_trial_completion(
            ghosts=self.ghosts,
            entity_manager=entity_manager,
            player=player
        )

    def is_trial_enemy(self, enemy) -> bool:
        """Check if an enemy is a champion trial enemy."""
        return self._trial_handler.is_trial_enemy(enemy)

    def get_state(self) -> dict:
        """Get serializable state."""
        return {
            'floor': self.floor,
            'seed': self.seed,
            'ghosts': [
                {
                    'ghost_type': g.ghost_type.name,
                    'x': g.x,
                    'y': g.y,
                    'zone_id': g.zone_id,
                    'username': g.username,
                    'victory': g.victory,
                    'encountered': g.encountered,
                    'triggered': g.triggered,
                    'active': g.active,
                    'assist_used': g.assist_used,
                    'trial_spawned': g.trial_spawned,
                    'trial_completed': g.trial_completed,
                    'secondary_tag': g.secondary_tag,
                    'secondary_used': g.secondary_used,
                    'path_positions': g.path.positions if g.path else None,
                    'path_index': g.path.current_index if g.path else 0,
                    'path_dest': g.path.destination_type if g.path else None,
                }
                for g in self.ghosts
            ],
            'silence_positions': list(self._silence_positions),
            'messages_shown': [gt.name for gt in self._messages_shown],
        }

    def load_state(self, state: dict):
        """Load state from save data."""
        self.floor = state.get('floor', 0)
        self.seed = state.get('seed', 0)
        self._silence_positions = set(
            tuple(p) for p in state.get('silence_positions', [])
        )
        self._messages_shown = set(
            GhostType[name] for name in state.get('messages_shown', [])
        )

        self.ghosts = []
        self._trial_handler.clear()

        for g_data in state.get('ghosts', []):
            ghost = Ghost(
                ghost_type=GhostType[g_data['ghost_type']],
                x=g_data['x'],
                y=g_data['y'],
                zone_id=g_data.get('zone_id', ''),
                username=g_data.get('username', 'Unknown'),
                victory=g_data.get('victory', False),
                encountered=g_data.get('encountered', False),
                triggered=g_data.get('triggered', False),
                active=g_data.get('active', True),
                assist_used=g_data.get('assist_used', False),
                trial_spawned=g_data.get('trial_spawned', False),
                trial_completed=g_data.get('trial_completed', False),
                secondary_tag=g_data.get('secondary_tag'),
                secondary_used=g_data.get('secondary_used', False),
            )

            # Restore path for Echo
            if g_data.get('path_positions'):
                ghost.path = GhostPath(
                    positions=[tuple(p) for p in g_data['path_positions']],
                    current_index=g_data.get('path_index', 0),
                    destination_type=g_data.get('path_dest', 'lore'),
                )

            self.ghosts.append(ghost)

    def clear(self):
        """Clear ghost state for new floor."""
        self.ghosts.clear()
        self._silence_positions.clear()
        self._messages_shown.clear()
        self._trial_handler.clear()
