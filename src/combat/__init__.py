"""Combat subsystem for v6.0 tactical battle mode."""
from .battle_types import BattleState, BattleOutcome, BattleEntity, Reinforcement
from .battle_manager import BattleManager
from .arena_templates import (
    ArenaTemplate, ArenaBucket, TEMPLATES,
    pick_template, compile_template, generate_deterministic_seed
)

__all__ = [
    'BattleState', 'BattleOutcome', 'BattleEntity', 'Reinforcement',
    'BattleManager',
    'ArenaTemplate', 'ArenaBucket', 'TEMPLATES',
    'pick_template', 'compile_template', 'generate_deterministic_seed',
]
