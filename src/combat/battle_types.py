"""Battle mode types and state for v6.0 tactical combat.

BattleState is the core data structure that holds all information about
an ongoing tactical battle. It must be fully serializable for save/load.
"""
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import List, Optional, Dict, Any, Tuple


class BattleOutcome(Enum):
    """Possible outcomes when a battle ends."""
    VICTORY = auto()      # All enemies defeated
    DEFEAT = auto()       # Player died
    FLEE = auto()         # Player escaped (future feature)
    PENDING = auto()      # Battle still in progress


@dataclass
class BattleEntity:
    """
    An entity participating in battle (player or enemy).

    Tracks battle-specific position (arena coords) separately from
    world position. Original world position is preserved for restoration.
    """
    entity_id: str                    # Unique identifier
    is_player: bool                   # True if this is the player
    arena_x: int                      # Position in arena grid
    arena_y: int                      # Position in arena grid
    world_x: int                      # Original world position (for restoration)
    world_y: int                      # Original world position (for restoration)

    # Stats snapshot at battle start (enemies may have buffs/debuffs)
    hp: int
    max_hp: int
    attack: int
    defense: int

    # Battle-specific state
    has_acted: bool = False           # Has taken action this turn
    status_effects: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize for save/load."""
        return {
            'entity_id': self.entity_id,
            'is_player': self.is_player,
            'arena_x': self.arena_x,
            'arena_y': self.arena_y,
            'world_x': self.world_x,
            'world_y': self.world_y,
            'hp': self.hp,
            'max_hp': self.max_hp,
            'attack': self.attack,
            'defense': self.defense,
            'has_acted': self.has_acted,
            'status_effects': self.status_effects.copy(),
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'BattleEntity':
        """Deserialize from save data."""
        return cls(
            entity_id=data['entity_id'],
            is_player=data['is_player'],
            arena_x=data['arena_x'],
            arena_y=data['arena_y'],
            world_x=data['world_x'],
            world_y=data['world_y'],
            hp=data['hp'],
            max_hp=data['max_hp'],
            attack=data['attack'],
            defense=data['defense'],
            has_acted=data.get('has_acted', False),
            status_effects=data.get('status_effects', []).copy(),
        )


@dataclass
class PendingReinforcement:
    """
    A reinforcement queued to join the battle after N turns.

    Used for "Quest 64 pressure" - nearby enemies join battle
    on a countdown, telegraphed to player. Snapshot taken at battle start.
    """
    entity_id: str                    # ID of enemy that will join
    enemy_name: str                   # Display name (e.g., "Goblin", "Rat")
    enemy_type: str                   # EnemyType name for grouping
    is_elite: bool                    # Elite status for UI display
    turns_until_arrival: int          # Countdown (min 2, never 0 at spawn)
    world_x: int                      # Original world position
    world_y: int                      # Original world position

    # Stats snapshot for when they join
    hp: int
    max_hp: int
    attack: int
    defense: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            'entity_id': self.entity_id,
            'enemy_name': self.enemy_name,
            'enemy_type': self.enemy_type,
            'is_elite': self.is_elite,
            'turns_until_arrival': self.turns_until_arrival,
            'world_x': self.world_x,
            'world_y': self.world_y,
            'hp': self.hp,
            'max_hp': self.max_hp,
            'attack': self.attack,
            'defense': self.defense,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'PendingReinforcement':
        return cls(
            entity_id=data['entity_id'],
            enemy_name=data['enemy_name'],
            enemy_type=data['enemy_type'],
            is_elite=data.get('is_elite', False),
            turns_until_arrival=data['turns_until_arrival'],
            world_x=data['world_x'],
            world_y=data['world_y'],
            hp=data['hp'],
            max_hp=data['max_hp'],
            attack=data['attack'],
            defense=data.get('defense', 0),
        )


# Backwards compatibility alias
Reinforcement = PendingReinforcement


@dataclass
class BattleState:
    """
    Complete state of an ongoing tactical battle.

    Generated deterministically from biome + zone context.
    Must be fully serializable for mid-battle save/load.
    """
    # Arena configuration
    arena_width: int                  # Arena grid width
    arena_height: int                 # Arena grid height
    arena_tiles: List[List[str]]      # 2D grid of tile types ('.', '#', '~', etc.)

    # Biome/zone context (for template selection, hazards, visuals)
    biome: str                        # DungeonTheme name (e.g., 'STONE', 'ICE')
    zone_id: Optional[str] = None     # Zone override if available
    floor_level: int = 1              # Dungeon floor (for scaling)

    # Combatants
    player: Optional[BattleEntity] = None
    enemies: List[BattleEntity] = field(default_factory=list)

    # Reinforcement queue (v6.0.3)
    reinforcements: List[PendingReinforcement] = field(default_factory=list)
    reinforcement_edges: List[Tuple[int, int]] = field(default_factory=list)  # Entry points
    max_reinforcements: int = 3       # Cap on total reinforcements
    reinforcements_spawned: int = 0   # Track how many have joined

    # Encounter origin (for reinforcement edge selection)
    encounter_origin: Tuple[int, int] = (0, 0)  # World coords where battle started

    # Outside time / noise tracking (v6.0.3)
    # Accumulates based on player actions; affects reinforcement countdown
    outside_time: float = 0.0         # Time accumulated from actions
    noise_level: float = 0.0          # Current noise (decays, affects arrival)

    # Turn tracking
    turn_number: int = 0
    outcome: BattleOutcome = BattleOutcome.PENDING

    # Seed for deterministic generation (replay/debug)
    seed: int = 0

    def to_dict(self) -> Dict[str, Any]:
        """Serialize entire battle state for save/load."""
        return {
            'arena_width': self.arena_width,
            'arena_height': self.arena_height,
            'arena_tiles': [row.copy() for row in self.arena_tiles],
            'biome': self.biome,
            'zone_id': self.zone_id,
            'floor_level': self.floor_level,
            'player': self.player.to_dict() if self.player else None,
            'enemies': [e.to_dict() for e in self.enemies],
            'reinforcements': [r.to_dict() for r in self.reinforcements],
            'reinforcement_edges': list(self.reinforcement_edges),
            'max_reinforcements': self.max_reinforcements,
            'reinforcements_spawned': self.reinforcements_spawned,
            'encounter_origin': list(self.encounter_origin),
            'outside_time': self.outside_time,
            'noise_level': self.noise_level,
            'turn_number': self.turn_number,
            'outcome': self.outcome.name,
            'seed': self.seed,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'BattleState':
        """Deserialize battle state from save data."""
        state = cls(
            arena_width=data['arena_width'],
            arena_height=data['arena_height'],
            arena_tiles=[row.copy() for row in data['arena_tiles']],
            biome=data['biome'],
            zone_id=data.get('zone_id'),
            floor_level=data.get('floor_level', 1),
            max_reinforcements=data.get('max_reinforcements', 3),
            reinforcements_spawned=data.get('reinforcements_spawned', 0),
            encounter_origin=tuple(data.get('encounter_origin', [0, 0])),
            outside_time=data.get('outside_time', 0.0),
            noise_level=data.get('noise_level', 0.0),
            turn_number=data.get('turn_number', 0),
            outcome=BattleOutcome[data.get('outcome', 'PENDING')],
            seed=data.get('seed', 0),
        )

        if data.get('player'):
            state.player = BattleEntity.from_dict(data['player'])

        state.enemies = [BattleEntity.from_dict(e) for e in data.get('enemies', [])]
        state.reinforcements = [PendingReinforcement.from_dict(r) for r in data.get('reinforcements', [])]
        state.reinforcement_edges = [tuple(e) for e in data.get('reinforcement_edges', [])]

        return state

    def get_living_enemies(self) -> List[BattleEntity]:
        """Return enemies that are still alive."""
        return [e for e in self.enemies if e.hp > 0]

    def is_tile_walkable(self, x: int, y: int) -> bool:
        """Check if an arena tile is walkable."""
        if x < 0 or x >= self.arena_width or y < 0 or y >= self.arena_height:
            return False
        tile = self.arena_tiles[y][x]
        return tile in ('.', '>', '<')  # Floor, stairs

    def get_entity_at(self, x: int, y: int) -> Optional[BattleEntity]:
        """Get entity at arena position, if any."""
        if self.player and self.player.arena_x == x and self.player.arena_y == y:
            return self.player
        for enemy in self.enemies:
            if enemy.hp > 0 and enemy.arena_x == x and enemy.arena_y == y:
                return enemy
        return None
