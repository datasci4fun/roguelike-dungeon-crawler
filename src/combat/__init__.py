"""Combat subsystem for v6.0 tactical battle mode."""
from .battle_types import (
    BattleState, BattleOutcome, BattlePhase, BattleEntity,
    PendingReinforcement, Reinforcement  # Reinforcement is alias for backwards compat
)
from .battle_manager import BattleManager
from .battle_actions import (
    BattleAction, AbilityDef, ActionResult, StatusEffect,
    get_class_abilities, get_valid_move_tiles, get_valid_attack_targets,
    create_status_effect, manhattan_distance, BATTLE_MOVE_RANGE,
    WARRIOR_ABILITIES, MAGE_ABILITIES, ROGUE_ABILITIES, CLERIC_ABILITIES, DEFAULT_ABILITIES,
)
from .arena_templates import (
    ArenaTemplate, ArenaBucket, TEMPLATES,
    pick_template, compile_template, generate_deterministic_seed
)

__all__ = [
    'BattleState', 'BattleOutcome', 'BattlePhase', 'BattleEntity',
    'PendingReinforcement', 'Reinforcement',
    'BattleManager',
    'BattleAction', 'AbilityDef', 'ActionResult', 'StatusEffect',
    'get_class_abilities', 'get_valid_move_tiles', 'get_valid_attack_targets',
    'create_status_effect', 'manhattan_distance', 'BATTLE_MOVE_RANGE',
    'WARRIOR_ABILITIES', 'MAGE_ABILITIES', 'ROGUE_ABILITIES', 'CLERIC_ABILITIES', 'DEFAULT_ABILITIES',
    'ArenaTemplate', 'ArenaBucket', 'TEMPLATES',
    'pick_template', 'compile_template', 'generate_deterministic_seed',
]
