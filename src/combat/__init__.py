"""Combat subsystem for v6.0 tactical battle mode."""
from .battle_types import (
    BattleState, BattleOutcome, BattleEntity,
    PendingReinforcement, Reinforcement  # Reinforcement is alias for backwards compat
)
from .battle_manager import BattleManager
from .arena_templates import (
    ArenaTemplate, ArenaBucket, TEMPLATES,
    pick_template, compile_template, generate_deterministic_seed
)

__all__ = [
    'BattleState', 'BattleOutcome', 'BattleEntity',
    'PendingReinforcement', 'Reinforcement',
    'BattleManager',
    'ArenaTemplate', 'ArenaBucket', 'TEMPLATES',
    'pick_template', 'compile_template', 'generate_deterministic_seed',
]
