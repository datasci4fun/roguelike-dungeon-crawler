"""Combat subsystem for v6.0 tactical battle mode."""
from .battle_types import BattleState, BattleOutcome
from .battle_manager import BattleManager

__all__ = ['BattleState', 'BattleOutcome', 'BattleManager']
