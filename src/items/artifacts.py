"""Sky-Touched Artifacts - rare items with powerful effects and costs.

Three artifacts for MVP:
- Duplicate Seal: duplicates next scroll/consumable use
- Woundglass Shard: reveals hidden information
- Oathstone: choose a vow for bonus rewards
"""
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import TYPE_CHECKING, Optional, List, Tuple
import random

if TYPE_CHECKING:
    from ..entities import Player
    from ..core.engine import GameEngine


class ArtifactId(Enum):
    """Unique identifiers for artifacts."""
    DUPLICATE_SEAL = auto()
    WOUNDGLASS_SHARD = auto()
    OATHSTONE = auto()


class VowType(Enum):
    """Types of vows for Oathstone."""
    NO_POTIONS = auto()      # Cannot use potions this floor
    NO_BACKTRACK = auto()    # Cannot revisit rooms
    SLAY_WARDEN = auto()     # Must defeat boss without fleeing


@dataclass
class ArtifactInstance:
    """Instance of an artifact held by the player."""
    artifact_id: ArtifactId
    charges: int = 1              # Remaining uses (some artifacts are single-use)
    used: bool = False            # Whether effect has been triggered
    floor_acquired: int = 0       # Floor where artifact was picked up

    # Oathstone-specific
    active_vow: Optional[VowType] = None
    vow_broken: bool = False

    @property
    def name(self) -> str:
        return ARTIFACT_DATA[self.artifact_id]['name']

    @property
    def symbol(self) -> str:
        return ARTIFACT_DATA[self.artifact_id]['symbol']

    @property
    def description(self) -> str:
        return ARTIFACT_DATA[self.artifact_id]['description']


# Artifact definitions
ARTIFACT_DATA = {
    ArtifactId.DUPLICATE_SEAL: {
        'name': 'The Duplicate Seal',
        'symbol': '&',
        'description': 'The next scroll or consumable you use will be duplicated.',
        'zone_bias': ['seal_drifts', 'record_vaults', 'seal_chambers'],
        'base_weight': 1.0,
    },
    ArtifactId.WOUNDGLASS_SHARD: {
        'name': 'Woundglass Shard',
        'symbol': '%',
        'description': 'Reveals a room that should not exist. (1 use per floor)',
        'zone_bias': ['catalog_chambers', 'record_vaults', 'geometry_wells'],
        'base_weight': 1.0,
    },
    ArtifactId.OATHSTONE: {
        'name': 'Oathstone',
        'symbol': '*',
        'description': 'Take a vow for this floor. Keep it for rewards, break it for consequences.',
        'zone_bias': ['oath_chambers', 'oath_interface', 'throne_hall_ruins'],
        'base_weight': 1.0,
    },
}

# Vow definitions
VOW_DATA = {
    VowType.NO_POTIONS: {
        'name': 'Vow of Abstinence',
        'description': 'No potions this floor',
        'reward_description': '+2 max HP permanently',
    },
    VowType.NO_BACKTRACK: {
        'name': 'Vow of Progress',
        'description': 'Never revisit a room',
        'reward_description': '+1 attack permanently',
    },
    VowType.SLAY_WARDEN: {
        'name': 'Vow of Confrontation',
        'description': 'Defeat the Warden without fleeing',
        'reward_description': 'Guaranteed rare loot from boss',
    },
}


class ArtifactManager:
    """Manages artifact spawning and effects.

    Artifacts spawn 0-1 per floor, zone-biased, deterministically seeded.
    Field pulses in lore zones slightly increase spawn chance.
    """

    # Spawn configuration
    BASE_SPAWN_CHANCE = 0.15        # 15% base chance per floor
    PULSE_BONUS = 0.10              # +10% if pulse triggered in lore zone
    ZONE_BIAS_MULTIPLIER = 2.0      # 2x weight in biased zones

    def __init__(self):
        self.floor_artifact: Optional[ArtifactInstance] = None
        self.spawn_position: Optional[Tuple[int, int]] = None
        self.floor = 0
        self.seed = 0

    def initialize_floor(self, floor: int, seed: Optional[int] = None,
                         pulse_triggered_in_lore: bool = False):
        """Initialize artifact spawning for a new floor.

        Args:
            floor: Current floor number
            seed: Optional seed for determinism
            pulse_triggered_in_lore: Whether a pulse triggered in a lore zone
        """
        self.floor = floor
        self.seed = seed if seed is not None else floor * 7777
        self.floor_artifact = None
        self.spawn_position = None

        # Use seeded RNG for deterministic spawning
        rng = random.Random(self.seed)

        # Calculate spawn chance
        spawn_chance = self.BASE_SPAWN_CHANCE
        if pulse_triggered_in_lore:
            spawn_chance += self.PULSE_BONUS

        # Deeper floors have slightly higher chance
        spawn_chance += floor * 0.02  # +2% per floor

        # Roll for spawn
        if rng.random() < spawn_chance:
            # Determine which artifact spawns (weighted by floor theme)
            artifact_id = self._select_artifact(rng, floor)
            self.floor_artifact = ArtifactInstance(
                artifact_id=artifact_id,
                floor_acquired=floor,
            )

    def _select_artifact(self, rng: random.Random, floor: int) -> ArtifactId:
        """Select which artifact to spawn based on floor."""
        # Weight artifacts by floor theme
        weights = []
        for artifact_id in ArtifactId:
            data = ARTIFACT_DATA[artifact_id]
            weight = data['base_weight']

            # Oathstone more common in mid-floors
            if artifact_id == ArtifactId.OATHSTONE and 3 <= floor <= 6:
                weight *= 1.5

            # Woundglass more common in later floors
            if artifact_id == ArtifactId.WOUNDGLASS_SHARD and floor >= 5:
                weight *= 1.3

            weights.append(weight)

        # Weighted random choice
        total = sum(weights)
        r = rng.random() * total
        cumulative = 0
        for i, weight in enumerate(weights):
            cumulative += weight
            if r < cumulative:
                return list(ArtifactId)[i]

        return ArtifactId.DUPLICATE_SEAL  # Fallback

    def get_spawn_zone_bias(self) -> List[str]:
        """Get zone IDs where artifact should preferentially spawn."""
        if not self.floor_artifact:
            return []
        return ARTIFACT_DATA[self.floor_artifact.artifact_id]['zone_bias']

    def place_in_zone(self, zone_id: str, positions: List[Tuple[int, int]],
                      rng: random.Random) -> Optional[Tuple[int, int]]:
        """Try to place artifact in a zone.

        Args:
            zone_id: The zone to consider
            positions: Available floor positions in the zone
            rng: Random number generator

        Returns:
            Spawn position if placed, None otherwise
        """
        if not self.floor_artifact or self.spawn_position:
            return None

        if not positions:
            return None

        bias_zones = self.get_spawn_zone_bias()

        # Higher chance to spawn in biased zones
        if zone_id in bias_zones:
            if rng.random() < 0.6:  # 60% chance to spawn here
                self.spawn_position = rng.choice(positions)
                return self.spawn_position
        else:
            if rng.random() < 0.1:  # 10% chance in non-biased zones
                self.spawn_position = rng.choice(positions)
                return self.spawn_position

        return None

    def force_place(self, positions: List[Tuple[int, int]],
                    rng: random.Random) -> Optional[Tuple[int, int]]:
        """Force placement if artifact exists but wasn't placed yet.

        Called after zone placement attempts to ensure artifact spawns somewhere.
        """
        if not self.floor_artifact or self.spawn_position:
            return None

        if positions:
            self.spawn_position = rng.choice(positions)
            return self.spawn_position

        return None

    def has_artifact_at(self, x: int, y: int) -> bool:
        """Check if there's an uncollected artifact at position."""
        if not self.floor_artifact or not self.spawn_position:
            return False
        return self.spawn_position == (x, y)

    def collect_artifact(self, x: int, y: int) -> Optional[ArtifactInstance]:
        """Collect artifact at position.

        Returns:
            The artifact instance if collected, None otherwise
        """
        if self.has_artifact_at(x, y):
            artifact = self.floor_artifact
            self.floor_artifact = None
            self.spawn_position = None
            return artifact
        return None

    def get_state(self) -> dict:
        """Get serializable state."""
        state = {
            'floor': self.floor,
            'seed': self.seed,
            'spawn_position': self.spawn_position,
        }

        if self.floor_artifact:
            state['floor_artifact'] = {
                'artifact_id': self.floor_artifact.artifact_id.name,
                'charges': self.floor_artifact.charges,
                'used': self.floor_artifact.used,
                'floor_acquired': self.floor_artifact.floor_acquired,
                'active_vow': self.floor_artifact.active_vow.name if self.floor_artifact.active_vow else None,
                'vow_broken': self.floor_artifact.vow_broken,
            }

        return state

    def load_state(self, state: dict):
        """Load state from save data."""
        self.floor = state.get('floor', 0)
        self.seed = state.get('seed', 0)
        self.spawn_position = tuple(state['spawn_position']) if state.get('spawn_position') else None

        if state.get('floor_artifact'):
            art_data = state['floor_artifact']
            self.floor_artifact = ArtifactInstance(
                artifact_id=ArtifactId[art_data['artifact_id']],
                charges=art_data.get('charges', 1),
                used=art_data.get('used', False),
                floor_acquired=art_data.get('floor_acquired', 0),
                active_vow=VowType[art_data['active_vow']] if art_data.get('active_vow') else None,
                vow_broken=art_data.get('vow_broken', False),
            )
        else:
            self.floor_artifact = None

    def clear(self):
        """Clear artifact state for new floor."""
        self.floor_artifact = None
        self.spawn_position = None


# ============================================================================
# Artifact Effects
# ============================================================================

def use_duplicate_seal(artifact: ArtifactInstance, engine: 'GameEngine') -> Tuple[bool, str]:
    """Activate the Duplicate Seal effect.

    Sets a flag so the next consumable use is duplicated.
    Cost: Spawns a "paperwork witness" enemy near the player.

    Returns:
        (success, message)
    """
    if artifact.used:
        return False, "The Duplicate Seal has already been used."

    # Set the duplication flag on the player
    if engine.player:
        engine.player.duplicate_next_consumable = True
        artifact.used = True
        artifact.charges = 0

        # Cost: Spawn a witness enemy
        _spawn_witness_enemy(engine)

        return True, "The Duplicate Seal glows... your next consumable will be duplicated. A second seal appears somewhere else."

    return False, "Cannot use artifact."


def use_woundglass_shard(artifact: ArtifactInstance, engine: 'GameEngine') -> Tuple[bool, str]:
    """Activate the Woundglass Shard effect.

    Reveals the direction to the boss (marks unexplored rooms toward stairs).
    Cost: Increases next Field Pulse intensity.

    Returns:
        (success, message)
    """
    if artifact.charges <= 0:
        return False, "The Woundglass Shard is depleted for this floor."

    if not engine.dungeon or not engine.player:
        return False, "Cannot use artifact."

    # Effect: Reveal path to stairs
    revealed = _reveal_path_to_stairs(engine)

    if revealed:
        artifact.charges -= 1

        # Cost: Boost next pulse intensity
        if hasattr(engine, 'field_pulse_manager'):
            engine.field_pulse_manager.boost_next_pulse = True

        return True, f"The shard cuts reality... {revealed} rooms toward the depths are revealed. The Field takes notice."

    return False, "The shard shows nothing - perhaps you've seen all there is."


def use_oathstone(artifact: ArtifactInstance, vow: VowType, engine: 'GameEngine') -> Tuple[bool, str]:
    """Take a vow with the Oathstone.

    Args:
        artifact: The Oathstone instance
        vow: Which vow to take
        engine: Game engine

    Returns:
        (success, message)
    """
    if artifact.active_vow:
        return False, f"You have already sworn the {VOW_DATA[artifact.active_vow]['name']}."

    artifact.active_vow = vow
    vow_data = VOW_DATA[vow]

    return True, f"You swear the {vow_data['name']}: {vow_data['description']}. Reward if kept: {vow_data['reward_description']}"


def check_vow_violation(artifact: ArtifactInstance, action: str,
                        engine: 'GameEngine') -> Optional[str]:
    """Check if an action violates the active vow.

    Args:
        artifact: The Oathstone instance
        action: The action being taken ('use_potion', 'backtrack', 'flee')
        engine: Game engine

    Returns:
        Violation message if vow broken, None otherwise
    """
    if not artifact.active_vow or artifact.vow_broken:
        return None

    violated = False

    if artifact.active_vow == VowType.NO_POTIONS and action == 'use_potion':
        violated = True
    elif artifact.active_vow == VowType.NO_BACKTRACK and action == 'backtrack':
        violated = True
    elif artifact.active_vow == VowType.SLAY_WARDEN and action == 'flee':
        violated = True

    if violated:
        artifact.vow_broken = True
        vow_data = VOW_DATA[artifact.active_vow]

        # Apply penalty: confusion (skip next turn)
        if engine.player:
            from ..core.constants import StatusEffectType
            engine.player.apply_status_effect(StatusEffectType.STUN, "broken vow")

        return f"Your oath shatters! The {vow_data['name']} is broken. Memory fragments scatter..."

    return None


def grant_vow_reward(artifact: ArtifactInstance, engine: 'GameEngine') -> str:
    """Grant reward for keeping the vow (called on floor completion).

    Args:
        artifact: The Oathstone instance
        engine: Game engine

    Returns:
        Reward message
    """
    if not artifact.active_vow or artifact.vow_broken:
        return ""

    vow = artifact.active_vow
    vow_data = VOW_DATA[vow]

    if not engine.player:
        return ""

    if vow == VowType.NO_POTIONS:
        engine.player.max_health += 2
        engine.player.health = min(engine.player.health + 2, engine.player.max_health)
        return f"The {vow_data['name']} is honored! +2 max HP."

    elif vow == VowType.NO_BACKTRACK:
        engine.player.base_attack += 1
        engine.player.attack_damage += 1
        return f"The {vow_data['name']} is honored! +1 attack."

    elif vow == VowType.SLAY_WARDEN:
        # Mark for guaranteed rare loot (boss loot system handles this)
        engine.player.guaranteed_rare_from_boss = True
        return f"The {vow_data['name']} is honored! The Warden's treasure awaits..."

    return ""


# ============================================================================
# Helper Functions
# ============================================================================

def _spawn_witness_enemy(engine: 'GameEngine'):
    """Spawn a witness enemy near the player as artifact cost."""
    if not engine.dungeon or not engine.player:
        return

    from ..core.constants import EnemyType
    from ..entities import Enemy

    # Find a floor tile near the player
    player_x, player_y = engine.player.x, engine.player.y
    spawn_positions = []

    for dx in range(-3, 4):
        for dy in range(-3, 4):
            if dx == 0 and dy == 0:
                continue
            nx, ny = player_x + dx, player_y + dy
            if engine.dungeon.is_walkable(nx, ny):
                # Check no entity there
                occupied = False
                for e in engine.entity_manager.enemies:
                    if e.x == nx and e.y == ny:
                        occupied = True
                        break
                if not occupied:
                    spawn_positions.append((nx, ny))

    if spawn_positions:
        # Spawn a skeleton (thematic for "paperwork witness")
        pos = random.choice(spawn_positions)
        witness = Enemy(pos[0], pos[1], enemy_type=EnemyType.SKELETON)
        witness.name = "Oath-Bound Witness"
        engine.entity_manager.enemies.append(witness)


def _reveal_path_to_stairs(engine: 'GameEngine') -> int:
    """Reveal rooms along the path to the stairs.

    Returns:
        Number of rooms revealed
    """
    if not engine.dungeon:
        return 0

    # Find stairs position
    stairs_pos = engine.dungeon.stairs_down_pos
    if not stairs_pos:
        return 0

    # Reveal tiles along a rough path to stairs
    player_x, player_y = engine.player.x, engine.player.y
    stairs_x, stairs_y = stairs_pos

    revealed_count = 0

    # Simple approach: reveal tiles in a line toward stairs
    dx = 1 if stairs_x > player_x else (-1 if stairs_x < player_x else 0)
    dy = 1 if stairs_y > player_y else (-1 if stairs_y < player_y else 0)

    x, y = player_x, player_y
    steps = 0
    max_steps = 20

    while (x, y) != (stairs_x, stairs_y) and steps < max_steps:
        # Move toward stairs
        if x != stairs_x:
            x += dx
        if y != stairs_y:
            y += dy

        # Reveal this tile and surroundings
        for rx in range(max(0, x-1), min(engine.dungeon.width, x+2)):
            for ry in range(max(0, y-1), min(engine.dungeon.height, y+2)):
                if not engine.dungeon.explored[ry][rx]:
                    engine.dungeon.explored[ry][rx] = True
                    revealed_count += 1

        steps += 1

    return revealed_count
