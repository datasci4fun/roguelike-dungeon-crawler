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


class BattlePhase(Enum):
    """Current phase within a battle turn (v6.0.4)."""
    PLAYER_TURN = auto()    # Player is acting
    ENEMY_TURN = auto()     # Enemies are acting
    END_OF_ROUND = auto()   # Processing end-of-round effects


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

    # Display info (for UI rendering)
    name: str = ""                    # Entity display name
    symbol: str = ""                  # Entity symbol for sprite
    is_elite: bool = False            # Elite enemy flag
    is_boss: bool = False             # Boss enemy flag
    display_id: str = ""              # Unique display ID (e.g., "goblin_01", "player")

    # Initiative system (v6.11)
    initiative: int = 0               # Turn order priority (higher = earlier)

    # Battle-specific state
    has_acted: bool = False           # Has taken action this turn
    status_effects: List[Dict[str, Any]] = field(default_factory=list)  # [{name, duration, ...}]
    cooldowns: Dict[str, int] = field(default_factory=dict)  # {ability_name: turns_remaining}

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
            'name': self.name,
            'symbol': self.symbol,
            'is_elite': self.is_elite,
            'is_boss': self.is_boss,
            'display_id': self.display_id,
            'initiative': self.initiative,
            'has_acted': self.has_acted,
            'status_effects': [e.copy() for e in self.status_effects],
            'cooldowns': self.cooldowns.copy(),
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'BattleEntity':
        """Deserialize from save data."""
        entity = cls(
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
            name=data.get('name', ''),
            symbol=data.get('symbol', ''),
            is_elite=data.get('is_elite', False),
            is_boss=data.get('is_boss', False),
            display_id=data.get('display_id', ''),
            initiative=data.get('initiative', 0),
            has_acted=data.get('has_acted', False),
        )
        entity.status_effects = [e.copy() for e in data.get('status_effects', [])]
        entity.cooldowns = data.get('cooldowns', {}).copy()
        return entity

    def has_status(self, name: str) -> bool:
        """Check if entity has a specific status effect."""
        return any(e.get('name') == name for e in self.status_effects)

    def get_status(self, name: str) -> Optional[Dict[str, Any]]:
        """Get a specific status effect if present."""
        for e in self.status_effects:
            if e.get('name') == name:
                return e
        return None

    def add_status(self, effect: Dict[str, Any]) -> None:
        """Add or refresh a status effect."""
        # Remove existing effect of same name
        self.status_effects = [e for e in self.status_effects if e.get('name') != effect.get('name')]
        self.status_effects.append(effect.copy())

    def remove_status(self, name: str) -> None:
        """Remove a status effect by name."""
        self.status_effects = [e for e in self.status_effects if e.get('name') != name]

    def get_effective_defense(self) -> int:
        """Get defense after status modifiers."""
        defense = self.defense
        for effect in self.status_effects:
            mod = effect.get('defense_mod', 1.0)
            defense = int(defense * mod)
        return defense

    def is_hidden(self) -> bool:
        """Check if entity is hidden/invisible."""
        return any(e.get('is_hidden', False) for e in self.status_effects)


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
    symbol: str = ""                  # Enemy symbol for sprite rendering

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
            'symbol': self.symbol,
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
            symbol=data.get('symbol', ''),
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

    # Turn tracking (v6.0.4)
    turn_number: int = 0
    phase: BattlePhase = BattlePhase.PLAYER_TURN
    outcome: BattleOutcome = BattleOutcome.PENDING

    # Initiative/turn order (v6.11)
    turn_order: List[str] = field(default_factory=list)  # Entity IDs in initiative order
    active_entity_index: int = 0                          # Current turn in turn_order

    # Seed for deterministic generation (replay/debug)
    seed: int = 0

    # v6.0.5: Artifact battle state
    duplicate_seal_armed: bool = False      # True if next consumable is duplicated
    woundglass_reveal_active: bool = False  # True if reinforcement ETAs revealed
    safe_tiles_revealed: List[Tuple[int, int]] = field(default_factory=list)  # Woundglass revealed tiles

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
            'phase': self.phase.name,
            'outcome': self.outcome.name,
            'turn_order': list(self.turn_order),
            'active_entity_index': self.active_entity_index,
            'seed': self.seed,
            # v6.0.5: Artifact state
            'duplicate_seal_armed': self.duplicate_seal_armed,
            'woundglass_reveal_active': self.woundglass_reveal_active,
            'safe_tiles_revealed': list(self.safe_tiles_revealed),
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
            phase=BattlePhase[data.get('phase', 'PLAYER_TURN')],
            outcome=BattleOutcome[data.get('outcome', 'PENDING')],
            seed=data.get('seed', 0),
            # v6.0.5: Artifact state
            duplicate_seal_armed=data.get('duplicate_seal_armed', False),
            woundglass_reveal_active=data.get('woundglass_reveal_active', False),
            safe_tiles_revealed=[tuple(t) for t in data.get('safe_tiles_revealed', [])],
        )

        if data.get('player'):
            state.player = BattleEntity.from_dict(data['player'])

        state.enemies = [BattleEntity.from_dict(e) for e in data.get('enemies', [])]
        state.reinforcements = [PendingReinforcement.from_dict(r) for r in data.get('reinforcements', [])]
        state.reinforcement_edges = [tuple(e) for e in data.get('reinforcement_edges', [])]
        state.turn_order = list(data.get('turn_order', []))
        state.active_entity_index = data.get('active_entity_index', 0)

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

    def get_entity_by_id(self, entity_id: str) -> Optional[BattleEntity]:
        """Get entity by entity_id."""
        if self.player and self.player.entity_id == entity_id:
            return self.player
        for enemy in self.enemies:
            if enemy.entity_id == entity_id:
                return enemy
        return None

    def calculate_turn_order(self) -> None:
        """Calculate turn order based on initiative (v6.11).

        Higher initiative = earlier in turn order.
        Ties broken by: player first, then by entity_id.
        """
        all_entities: List[BattleEntity] = []
        if self.player and self.player.hp > 0:
            all_entities.append(self.player)
        for enemy in self.enemies:
            if enemy.hp > 0:
                all_entities.append(enemy)

        # Sort by initiative (descending), then player priority, then entity_id
        all_entities.sort(
            key=lambda e: (-e.initiative, not e.is_player, e.entity_id)
        )

        self.turn_order = [e.entity_id for e in all_entities]
        self.active_entity_index = 0

    def get_current_entity(self) -> Optional[BattleEntity]:
        """Get the entity whose turn it currently is."""
        if not self.turn_order or self.active_entity_index >= len(self.turn_order):
            return None
        current_id = self.turn_order[self.active_entity_index]
        return self.get_entity_by_id(current_id)

    def get_turn_order_entities(self) -> List[BattleEntity]:
        """Get list of entities in turn order (for UI display)."""
        entities = []
        for entity_id in self.turn_order:
            entity = self.get_entity_by_id(entity_id)
            if entity and entity.hp > 0:
                entities.append(entity)
        return entities
