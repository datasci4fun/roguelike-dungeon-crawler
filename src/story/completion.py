"""Completion tracking and ending resolution for victory legacy and secret ending.

This module provides:
1. CompletionLedger - tracks completionist progress during a run
2. EndingId - enumeration of possible ending types
3. resolve_ending() - determines ending based on run state
4. derive_victory_legacy() - computes legacy from run stats (not random)

The secret ending is not yet implemented but hooks are in place.
"""
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Set, Dict, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from ..entities.ghosts import GhostType


class EndingId(Enum):
    """Possible ending types."""
    DEATH_STANDARD = auto()    # Normal death
    VICTORY_STANDARD = auto()  # Beat floor 8 boss
    VICTORY_SECRET = auto()    # 100% completion + secret criteria (placeholder)


class VictoryLegacy(Enum):
    """Victory imprint types derived from run stats."""
    BEACON = auto()     # Balanced/guided run
    CHAMPION = auto()   # Combat-focused run
    ARCHIVIST = auto()  # Lore-focused run


@dataclass
class CompletionLedger:
    """Tracks completionist progress during a run.

    This is the measurement layer for determining endings and legacy types.
    Serializable and deterministic.
    """
    # Core progress
    floors_cleared: Set[int] = field(default_factory=set)  # 1-8
    wardens_defeated: Set[str] = field(default_factory=set)  # BossType names
    lore_found_ids: Set[str] = field(default_factory=set)  # LoreId strings
    artifacts_collected_ids: Set[str] = field(default_factory=set)  # ArtifactId names

    # Ghost encounters by type (counts)
    ghost_encounters: Dict[str, int] = field(default_factory=dict)

    # Combat/survival stats
    total_kills: int = 0
    elite_kills: int = 0
    boss_kills: int = 0
    damage_taken: int = 0
    potions_used: int = 0
    pulses_survived: int = 0

    # v6.0.5: Battle mode stats
    reinforcements_faced: int = 0
    reinforcement_types: Dict[str, int] = field(default_factory=dict)
    battles_escaped: int = 0

    # Turn tracking
    total_turns: int = 0

    # Reserved for future secret ending criteria
    secrets_found: Set[str] = field(default_factory=set)

    def record_turn(self):
        """Record a turn taken."""
        self.total_turns += 1

    def record_floor_cleared(self, floor: int):
        """Record that a floor was cleared."""
        self.floors_cleared.add(floor)

    def record_warden_defeated(self, boss_type_name: str):
        """Record a boss/warden defeat."""
        self.wardens_defeated.add(boss_type_name)
        self.boss_kills += 1

    def record_lore_found(self, lore_id: str):
        """Record a lore item discovered."""
        self.lore_found_ids.add(lore_id)

    def record_artifact_collected(self, artifact_id_name: str):
        """Record an artifact collected."""
        self.artifacts_collected_ids.add(artifact_id_name)

    def record_ghost_encounter(self, ghost_type_name: str):
        """Record encountering a ghost."""
        self.ghost_encounters[ghost_type_name] = self.ghost_encounters.get(ghost_type_name, 0) + 1

    def record_kill(self, is_elite: bool = False):
        """Record an enemy kill."""
        self.total_kills += 1
        if is_elite:
            self.elite_kills += 1

    def record_damage(self, amount: int):
        """Record damage taken."""
        self.damage_taken += amount

    def record_potion_used(self):
        """Record a potion consumption."""
        self.potions_used += 1

    def record_pulse_survived(self):
        """Record surviving a field pulse."""
        self.pulses_survived += 1

    def record_reinforcement(self, enemy_name: str, is_elite: bool = False):
        """Record a reinforcement that joined a battle (v6.0.5)."""
        self.reinforcements_faced += 1
        # Track by base name (strip "Elite" prefix if present)
        base_name = enemy_name
        self.reinforcement_types[base_name] = self.reinforcement_types.get(base_name, 0) + 1

    def record_battle_escaped(self):
        """Record fleeing from a battle (v6.0.5)."""
        self.battles_escaped += 1

    @property
    def lore_count(self) -> int:
        """Number of lore items found."""
        return len(self.lore_found_ids)

    @property
    def completion_pct(self) -> float:
        """Rough completion percentage (0-100).

        This is a simplified metric. The real secret ending will have
        more specific criteria defined later.
        """
        # Simple calculation: floors + bosses + some lore
        floor_pct = len(self.floors_cleared) / 8.0
        boss_pct = len(self.wardens_defeated) / 8.0

        # Weight: 40% floors, 40% bosses, 20% lore (at least 10 pieces)
        lore_pct = min(1.0, self.lore_count / 10.0)

        return (floor_pct * 0.4 + boss_pct * 0.4 + lore_pct * 0.2) * 100

    def to_dict(self) -> dict:
        """Serialize to dictionary."""
        return {
            'floors_cleared': list(self.floors_cleared),
            'wardens_defeated': list(self.wardens_defeated),
            'lore_found_ids': list(self.lore_found_ids),
            'artifacts_collected_ids': list(self.artifacts_collected_ids),
            'ghost_encounters': self.ghost_encounters.copy(),
            'total_kills': self.total_kills,
            'elite_kills': self.elite_kills,
            'boss_kills': self.boss_kills,
            'damage_taken': self.damage_taken,
            'potions_used': self.potions_used,
            'pulses_survived': self.pulses_survived,
            'total_turns': self.total_turns,
            'secrets_found': list(self.secrets_found),
            # v6.0.5: Battle mode stats
            'reinforcements_faced': self.reinforcements_faced,
            'reinforcement_types': self.reinforcement_types.copy(),
            'battles_escaped': self.battles_escaped,
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'CompletionLedger':
        """Deserialize from dictionary."""
        return cls(
            floors_cleared=set(data.get('floors_cleared', [])),
            wardens_defeated=set(data.get('wardens_defeated', [])),
            lore_found_ids=set(data.get('lore_found_ids', [])),
            artifacts_collected_ids=set(data.get('artifacts_collected_ids', [])),
            ghost_encounters=data.get('ghost_encounters', {}).copy(),
            total_kills=data.get('total_kills', 0),
            elite_kills=data.get('elite_kills', 0),
            boss_kills=data.get('boss_kills', 0),
            damage_taken=data.get('damage_taken', 0),
            potions_used=data.get('potions_used', 0),
            pulses_survived=data.get('pulses_survived', 0),
            total_turns=data.get('total_turns', 0),
            secrets_found=set(data.get('secrets_found', [])),
            # v6.0.5: Battle mode stats
            reinforcements_faced=data.get('reinforcements_faced', 0),
            reinforcement_types=data.get('reinforcement_types', {}).copy(),
            battles_escaped=data.get('battles_escaped', 0),
        )


# Thresholds for "high" combat/lore scores
COMBAT_HIGH_THRESHOLD = 20  # kills
LORE_HIGH_THRESHOLD = 5     # lore items found


@dataclass
class VictoryLegacyResult:
    """Result of deriving victory legacy from run stats."""
    primary: VictoryLegacy
    secondary_tag: Optional[str] = None  # "archivist_mark" or "champion_edge"

    @property
    def has_secondary(self) -> bool:
        return self.secondary_tag is not None

    def to_dict(self) -> dict:
        return {
            'primary': self.primary.name,
            'secondary_tag': self.secondary_tag,
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'VictoryLegacyResult':
        return cls(
            primary=VictoryLegacy[data['primary']],
            secondary_tag=data.get('secondary_tag'),
        )


def derive_victory_legacy(ledger: CompletionLedger) -> VictoryLegacyResult:
    """Derive victory legacy type from run stats.

    Rules (deterministic, no RNG):
    - If both combat_score and lore_score < thresholds → Beacon
    - If combat high, lore low → Champion
    - If lore high, combat low → Archivist
    - If both high → pick by whichever is higher, add secondary flourish

    The hybrid rule (both high) gives primary by higher score and
    a secondary tag for the other side's flavor.
    """
    combat_score = ledger.total_kills
    lore_score = ledger.lore_count

    combat_high = combat_score >= COMBAT_HIGH_THRESHOLD
    lore_high = lore_score >= LORE_HIGH_THRESHOLD

    # Both low → Beacon (balanced/guided run)
    if not combat_high and not lore_high:
        return VictoryLegacyResult(primary=VictoryLegacy.BEACON)

    # Only combat high → Champion
    if combat_high and not lore_high:
        return VictoryLegacyResult(primary=VictoryLegacy.CHAMPION)

    # Only lore high → Archivist
    if lore_high and not combat_high:
        return VictoryLegacyResult(primary=VictoryLegacy.ARCHIVIST)

    # Both high → hybrid rule
    # Pick primary by whichever is higher, add secondary flourish
    if combat_score >= lore_score:
        # Champion primary, Archivist secondary
        return VictoryLegacyResult(
            primary=VictoryLegacy.CHAMPION,
            secondary_tag="archivist_mark"
        )
    else:
        # Archivist primary, Champion secondary
        return VictoryLegacyResult(
            primary=VictoryLegacy.ARCHIVIST,
            secondary_tag="champion_edge"
        )


def resolve_ending(ledger: CompletionLedger, player_alive: bool) -> EndingId:
    """Determine ending type based on run state.

    Args:
        ledger: The completion ledger for this run
        player_alive: Whether the player is still alive

    Returns:
        EndingId indicating which ending to show

    Note: VICTORY_SECRET is currently unreachable unless
    secrets_found contains "SECRET_ENDING_ENABLED" (not set yet).
    """
    if not player_alive:
        return EndingId.DEATH_STANDARD

    # Check for secret ending (placeholder - not reachable yet)
    if "SECRET_ENDING_ENABLED" in ledger.secrets_found:
        # Additional criteria would be checked here
        if ledger.completion_pct >= 100.0:
            return EndingId.VICTORY_SECRET

    return EndingId.VICTORY_STANDARD


def debug_print_completion_ledger(ledger: CompletionLedger):
    """Print completion ledger for debugging."""
    print("=" * 50)
    print("COMPLETION LEDGER")
    print("=" * 50)
    print(f"Floors Cleared: {sorted(ledger.floors_cleared)}")
    print(f"Wardens Defeated: {sorted(ledger.wardens_defeated)}")
    print(f"Lore Found: {ledger.lore_count} items")
    print(f"Artifacts Collected: {sorted(ledger.artifacts_collected_ids)}")
    print(f"Ghost Encounters: {ledger.ghost_encounters}")
    print("-" * 50)
    print(f"Total Kills: {ledger.total_kills}")
    print(f"Elite Kills: {ledger.elite_kills}")
    print(f"Boss Kills: {ledger.boss_kills}")
    print(f"Damage Taken: {ledger.damage_taken}")
    print(f"Potions Used: {ledger.potions_used}")
    print(f"Pulses Survived: {ledger.pulses_survived}")
    print("-" * 50)
    print(f"Completion: {ledger.completion_pct:.1f}%")
    print(f"Secrets Found: {sorted(ledger.secrets_found)}")
    print("=" * 50)


# Messages for secondary flourishes
SECONDARY_MESSAGES = {
    "archivist_mark": "An archivist's mark lingers in your wake.",
    "champion_edge": "A champion's edge remains.",
}

# Effects for secondary flourishes (applied when imprint triggers)
SECONDARY_EFFECTS = {
    "archivist_mark": {
        "type": "reveal",
        "description": "Reveals nearby tiles once per floor",
        "radius": 3,
    },
    "champion_edge": {
        "type": "temp_hp",
        "description": "Grants +2 temporary HP once",
        "amount": 2,
    },
}
