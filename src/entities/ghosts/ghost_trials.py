"""Champion trial system and Hollowed enemy spawning.

Handles champion combat trials, rewards, and Hollowed ghost
conversion to actual enemies.
"""
from typing import TYPE_CHECKING, List, Optional, Set

from .types import GhostType
from .ghost import Ghost

if TYPE_CHECKING:
    from ...world import Dungeon
    from ..entities import Player


class GhostTrialHandler:
    """Handles champion trials and Hollowed spawning."""

    def __init__(self):
        self._pending_trial_ghost: Optional[Ghost] = None
        self._trial_enemies: Set[int] = set()

    def set_pending_trial(self, ghost: Ghost):
        """Set a ghost as having a pending trial."""
        self._pending_trial_ghost = ghost

    def has_pending_trial(self) -> bool:
        """Check if there's a pending champion trial to spawn."""
        return self._pending_trial_ghost is not None

    def spawn_hollowed_enemy(
        self,
        ghosts: List[Ghost],
        dungeon: 'Dungeon',
        entity_manager
    ) -> bool:
        """Spawn Hollowed ghosts as actual enemies.

        Called after ghost initialization to add Hollowed to enemy list.

        Returns:
            True if any Hollowed were spawned
        """
        from ...core.constants import EnemyType
        from ..entities import Enemy

        spawned_any = False

        for ghost in ghosts:
            if ghost.ghost_type != GhostType.HOLLOWED:
                continue

            # Create enemy at ghost position
            enemy = Enemy(ghost.x, ghost.y, enemy_type=EnemyType.SKELETON)
            enemy.name = f"Hollowed {ghost.username[:8]}"
            enemy.is_elite = True  # Slightly tougher

            entity_manager.enemies.append(enemy)
            ghost.active = False  # Ghost converted to enemy
            spawned_any = True

        return spawned_any

    def spawn_champion_trial(
        self,
        floor: int,
        dungeon: 'Dungeon',
        entity_manager
    ) -> List[str]:
        """Spawn a champion trial enemy if one is pending.

        Creates a challenging elite enemy near the ghost position.
        Defeating it grants bonus rewards.

        Returns:
            List of messages to display
        """
        messages = []

        if not self._pending_trial_ghost:
            return messages

        ghost = self._pending_trial_ghost
        self._pending_trial_ghost = None

        from ...core.constants import EnemyType, FLOOR_ENEMY_POOLS
        from ..entities import Enemy

        # Select a challenging enemy type based on floor
        floor_pool = FLOOR_ENEMY_POOLS.get(floor, [])
        if floor_pool:
            # Choose the enemy with highest weight (most thematic)
            enemy_types = [(t, w) for (t, w) in floor_pool]
            enemy_types.sort(key=lambda x: x[1], reverse=True)
            trial_type = enemy_types[0][0]
        else:
            # Fallback to skeleton
            trial_type = EnemyType.SKELETON

        # Find spawn position near ghost (within 3 tiles)
        spawn_pos = None
        for dx in range(-3, 4):
            for dy in range(-3, 4):
                nx, ny = ghost.x + dx, ghost.y + dy
                if dungeon.is_walkable(nx, ny):
                    # Check not occupied by entity
                    occupied = False
                    for enemy in entity_manager.enemies:
                        if enemy.is_alive() and enemy.x == nx and enemy.y == ny:
                            occupied = True
                            break
                    if not occupied:
                        spawn_pos = (nx, ny)
                        break
            if spawn_pos:
                break

        if not spawn_pos:
            messages.append("The trial fades... no space for combat.")
            ghost.trial_completed = True  # Skip trial, no reward
            return messages

        # Create elite trial enemy
        trial_enemy = Enemy(spawn_pos[0], spawn_pos[1], enemy_type=trial_type, is_elite=True)
        trial_enemy.name = "Champion's Challenger"
        trial_enemy.xp_reward = int(trial_enemy.xp_reward * 1.5)  # Bonus XP

        # Track the trial enemy by its id
        trial_id = id(trial_enemy)
        ghost.trial_enemy_id = trial_id
        self._trial_enemies.add(trial_id)

        entity_manager.enemies.append(trial_enemy)
        messages.append(f"A {trial_enemy.name} materializes!")

        return messages

    def check_trial_completion(
        self,
        ghosts: List[Ghost],
        entity_manager,
        player: 'Player'
    ) -> List[str]:
        """Check if any champion trials have been completed.

        Called after combat to check if trial enemies were defeated.

        Returns:
            List of messages to display (including reward messages)
        """
        messages = []

        for ghost in ghosts:
            if ghost.ghost_type != GhostType.CHAMPION:
                continue
            if not ghost.trial_spawned or ghost.trial_completed:
                continue
            if ghost.trial_enemy_id is None:
                continue

            # Check if trial enemy is still alive
            trial_alive = False
            for enemy in entity_manager.enemies:
                if id(enemy) == ghost.trial_enemy_id and enemy.is_alive():
                    trial_alive = True
                    break

            if not trial_alive:
                # Trial completed! Grant reward
                ghost.trial_completed = True
                self._trial_enemies.discard(ghost.trial_enemy_id)

                messages.append("You have proven yourself worthy!")
                messages.append("The champion's blessing strengthens you!")

                # Rewards: +5 HP (can exceed max), +10% damage for remainder of floor
                player.health = min(player.health + 5, player.max_health + 5)
                messages.append("  +5 HP restored!")

                # Mark player with temporary damage buff (handled by combat system)
                if not hasattr(player, 'champion_blessing'):
                    player.champion_blessing = 0
                player.champion_blessing = 3  # 3 combats with bonus damage

                messages.append("  Champion's Blessing: +20% damage for next 3 combats!")

        return messages

    def is_trial_enemy(self, enemy) -> bool:
        """Check if an enemy is a champion trial enemy."""
        return id(enemy) in self._trial_enemies

    def clear(self):
        """Clear trial state."""
        self._pending_trial_ghost = None
        self._trial_enemies.clear()

    def get_state(self) -> dict:
        """Get serializable state for trials."""
        return {
            'trial_enemies': list(self._trial_enemies),
        }

    def load_state(self, state: dict):
        """Load trial state."""
        self._trial_enemies = set(state.get('trial_enemies', []))
        self._pending_trial_ghost = None
