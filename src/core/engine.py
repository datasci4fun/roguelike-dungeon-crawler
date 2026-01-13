"""Pure game engine - no rendering dependencies.

The GameEngine class contains all game state and logic, completely
decoupled from any rendering or input system. It processes Commands
and emits Events, making it usable by terminal, web, or any other client.
"""
from typing import List, Optional, Tuple, Callable

from .constants import GameState, UIMode, AUTO_SAVE_INTERVAL, MAX_DUNGEON_LEVELS, Race, PlayerClass, RACE_STATS, CLASS_STATS
from .messages import MessageLog, MessageCategory, MessageImportance
from .events import EventType, EventQueue, TransitionState, TransitionKind
from .commands import (
    Command, CommandType,
    MOVEMENT_COMMANDS, ITEM_COMMANDS, SCROLL_COMMANDS,
    get_movement_delta, get_item_index
)

# Turn commands set
TURN_COMMANDS = {CommandType.TURN_LEFT, CommandType.TURN_RIGHT}
from ..world import Dungeon, TrapManager, HazardManager, SecretDoorManager, TorchManager, FieldPulseManager
from ..entities import Player, GhostManager
from ..items import Item, ItemType, ScrollTeleport, LoreScroll, LoreBook
from ..story import StoryManager, CompletionLedger, derive_victory_legacy, resolve_ending
from ..story.story_data import get_tutorial_hint

# Import managers
from ..managers import (
    EntityManager, CombatManager, LevelManager, SaveManager
)

# v6.0: Battle mode
from ..combat import BattleManager, BattleState

# Import mixins for extracted functionality
from .engine_environment import EnvironmentMixin
from .engine_ui_commands import UICommandsMixin


class GameEngine(EnvironmentMixin, UICommandsMixin):
    """
    Pure game engine with no rendering dependencies.

    The engine maintains all game state and processes commands to update
    that state. It emits events that can be consumed by any renderer.

    Usage:
        engine = GameEngine()
        engine.start_new_game()

        # Game loop (in client)
        while engine.state != GameState.QUIT:
            command = get_command_from_input()
            engine.process_command(command)
            events = engine.flush_events()
            render_events(events)
    """

    def __init__(self):
        # Core game state
        self.state = GameState.TITLE
        self.ui_mode = UIMode.GAME
        self.current_level = 1

        # Game world (initialized on new game)
        self.dungeon: Optional[Dungeon] = None
        self.player: Optional[Player] = None

        # Event queue for communicating with renderer
        self.event_queue = EventQueue()

        # Message system
        self.message_log = MessageLog()

        # Managers
        self.entity_manager = EntityManager()
        self.combat_manager = CombatManager(self, event_queue=self.event_queue)
        self.level_manager = LevelManager(self)
        self.save_manager = SaveManager(self)
        self.story_manager = StoryManager()

        # v4.0: Trap and hazard managers
        self.trap_manager = TrapManager()
        self.hazard_manager = HazardManager()

        # v4.3: Secret door manager
        self.secret_door_manager = SecretDoorManager()

        # v4.5: Torch manager
        self.torch_manager = TorchManager()

        # v5.4: Field pulse manager
        self.field_pulse_manager = FieldPulseManager()

        # v5.5: Ghost manager
        self.ghost_manager = GhostManager()

        # v5.5: Completion ledger for run tracking
        self.completion_ledger = CompletionLedger()

        # Wire story manager to ledger (ledger is source of truth)
        self.story_manager.attach_ledger(self.completion_ledger)

        # v6.0: Battle mode
        self.battle: Optional[BattleState] = None
        self.battle_manager = BattleManager(self, event_queue=self.event_queue)

        # v6.1: Transition state (locks input during mode changes)
        self.transition = TransitionState()

        # Death tracking for recap
        self.last_attacker_name = None
        self.last_damage_taken = 0
        self.kills_count = 0
        self.max_level_reached = 1

        # Turn tracking for auto-save
        self.turns_since_save = 0

        # UI state
        self.selected_item_index = 0
        self.intro_page = 0
        self.intro_total_pages = 2

        # Reading screen state
        self.reading_title = ""
        self.reading_content = []

        # Dialog state
        self.dialog_title = ""
        self.dialog_message = ""
        self.dialog_callback: Optional[Callable[[bool], None]] = None

        # Pending drop state for confirmation dialogs
        self._pending_drop_item = None
        self._pending_drop_index = None

        # v6.5.1 low-01: Ice slide tracking
        self._last_move_direction: Tuple[int, int] = (0, 0)

    # =========================================================================
    # Public API
    # =========================================================================

    def start_new_game(self, race: Race = None, player_class: PlayerClass = None):
        """Initialize a new game with optional character configuration.

        Args:
            race: Player race (Human, Elf, Dwarf, Halfling, Orc)
            player_class: Player class (Warrior, Mage, Rogue)
        """
        self.current_level = 1
        self.max_level_reached = 1
        self.kills_count = 0
        self.turns_since_save = 0

        # v5.5: Reset completion ledger for new run
        self.completion_ledger = CompletionLedger()

        # Generate first dungeon
        self.dungeon = Dungeon(level=self.current_level, has_stairs_up=False)

        # Spawn player with race/class
        player_pos = self.dungeon.get_random_floor_position()
        self.player = Player(player_pos[0], player_pos[1], race=race, player_class=player_class)

        # Initialize FOV (with potential vision bonus from Elf's Keen Sight)
        vision_bonus = self.player.get_vision_bonus() if self.player else 0
        self.dungeon.update_fov(self.player.x, self.player.y, vision_bonus=vision_bonus)

        # Spawn entities
        self.entity_manager.spawn_enemies(self.dungeon, self.player)
        self.entity_manager.spawn_items(self.dungeon, self.player)
        self.entity_manager.spawn_boss(self.dungeon, self.player)

        # v4.0: Clear and generate traps/hazards
        self.trap_manager.clear()
        self.hazard_manager.clear()
        self.dungeon.generate_traps(self.trap_manager, self.player.x, self.player.y)
        self.dungeon.generate_hazards(self.hazard_manager, self.player.x, self.player.y)

        # v4.3: Generate secret doors
        self.secret_door_manager.clear()
        self.dungeon.generate_secret_doors(self.secret_door_manager, self.player.x, self.player.y)

        # v4.5: Generate torches
        self.torch_manager.clear()
        self.dungeon.generate_torches(self.torch_manager, self.player.x, self.player.y)

        # v5.4: Initialize field pulses for this floor
        self.field_pulse_manager.initialize_floor(self.current_level)

        # v5.5: Initialize ghosts for this floor
        self.ghost_manager.initialize_floor(self.current_level, self.dungeon)
        self.ghost_manager.spawn_hollowed_enemy(self.dungeon, self.entity_manager)

        # Welcome messages with character info
        if race and player_class:
            race_name = RACE_STATS[race]['name']
            class_name = CLASS_STATS[player_class]['name']
            self.add_message(f"You are a {race_name} {class_name}!")
            trait_name = RACE_STATS[race]['trait_name']
            self.add_message(f"Trait: {trait_name}")
        else:
            self.add_message("Welcome to the dungeon!")
        self.add_message("Find the stairs (>) to descend deeper")
        self.add_message("Use arrow keys or WASD to move")

        # Reset story manager for new game and attach to ledger
        self.story_manager = StoryManager(ledger=self.completion_ledger)
        # Register starting level in codex
        self.story_manager.visit_level(1)

        # Track newly discovered lore for frontend notification (one-shot)
        self.new_lore_discovered = None

        self.state = GameState.PLAYING
        self.ui_mode = UIMode.GAME

    def load_game(self) -> bool:
        """Load a saved game. Returns True if successful."""
        if self.save_manager.load_game():
            self.state = GameState.PLAYING
            return True
        return False

    def save_game(self) -> bool:
        """Save the current game. Returns True if successful."""
        return self.save_manager.save_game()

    def flush_events(self) -> List:
        """Get and clear all pending events."""
        return self.event_queue.flush()

    def add_message(self, message: str,
                    category: MessageCategory = MessageCategory.SYSTEM,
                    importance: MessageImportance = MessageImportance.NORMAL):
        """Add a message to the message log."""
        self.message_log.add(message, category, importance)

    def show_hint(self, hint_id: str) -> bool:
        """Show a tutorial hint if not already shown."""
        if self.story_manager.show_hint(hint_id):
            hint_text = get_tutorial_hint(hint_id)
            if hint_text:
                self.add_message(hint_text, MessageCategory.SYSTEM,
                                MessageImportance.IMPORTANT)
                return True
        return False

    # =========================================================================
    # Transition Orchestration (v6.1)
    # =========================================================================

    def start_transition(self, kind: TransitionKind, duration_ms: int = None, can_skip: bool = True):
        """
        Start a transition between game modes.

        During a transition:
        - Input is locked (except skip if can_skip=True)
        - TRANSITION_START event is emitted
        - Frontend should display transition visuals

        Args:
            kind: Type of transition (ENGAGE, WIN, FLEE, DEFEAT, BOSS_VICTORY)
            duration_ms: Override default duration (optional)
            can_skip: Whether player can skip by pressing any key
        """
        self.transition.start(kind, duration_ms, can_skip)
        self.event_queue.emit(
            EventType.TRANSITION_START,
            kind=kind.name,
            duration_ms=self.transition.duration_ms,
            can_skip=can_skip,
        )

    def end_transition(self):
        """
        End the current transition.

        Emits TRANSITION_END event and unlocks input.
        Should be called after transition duration completes or on skip.
        """
        if self.transition.active:
            kind = self.transition.kind
            self.transition.end()
            self.event_queue.emit(
                EventType.TRANSITION_END,
                kind=kind.name if kind else None,
            )

    def skip_transition(self):
        """Skip the current transition if allowed."""
        if self.transition.active and self.transition.can_skip:
            self.end_transition()

    def tick_transition(self) -> bool:
        """
        Check if transition has completed naturally (duration elapsed).

        Call this each tick during a transition. Returns True if transition
        just ended, False if still active or no transition.
        """
        if self.transition.active and self.transition.is_complete():
            self.end_transition()
            return True
        return False

    def is_input_locked(self) -> bool:
        """Check if input should be locked due to active transition."""
        return self.transition.active

    @property
    def messages(self) -> List[str]:
        """Get recent messages as strings."""
        return [msg.text for msg in self.message_log.get_recent(5)]

    @property
    def enemies(self) -> List:
        """Alias for entity_manager.enemies."""
        return self.entity_manager.enemies

    @property
    def items(self) -> List:
        """Alias for entity_manager.items."""
        return self.entity_manager.items

    # =========================================================================
    # Command Processing - Main Game
    # =========================================================================

    def process_game_command(self, command: Command) -> bool:
        """
        Process a command during normal gameplay.

        Returns:
            True if player took an action (moved/attacked), False otherwise
        """
        cmd_type = command.type

        # Movement commands - relative to facing direction
        if cmd_type in MOVEMENT_COMMANDS:
            dx, dy = self._get_relative_movement(cmd_type)
            player_moved = self.combat_manager.try_move_or_attack(dx, dy)

            if player_moved:
                # v6.5.1: Track movement direction for ice sliding
                self._last_move_direction = (dx, dy)

                # v4.0: Check for traps at new position
                self._process_traps()

                # v4.0: Process hazards at new position
                # Returns True if on slow terrain (deep water)
                on_slow_terrain = self._process_hazards()

                # v6.5.1 low-01: Handle ice slide mechanic
                self._process_ice_slide(dx, dy)

                # v4.0: Process player status effects
                self._process_player_status_effects()

                # v5.4: Check for zone evidence (lore discovery)
                self._process_zone_evidence()

                # Tick player ability cooldowns
                if hasattr(self.player, 'tick_cooldowns'):
                    self.player.tick_cooldowns()

                # v5.4: Process field pulses
                self._process_field_pulse()

                self._process_enemy_turns()

                # v5.5: Process ghost behaviors
                self._process_ghost_tick()

                # Deep water costs 2 turns - enemies get extra action
                if on_slow_terrain:
                    self._process_enemy_turns()

                # v4.0: Tick spreading hazards
                if self.dungeon:
                    new_hazards = self.hazard_manager.tick_spreading(self.dungeon.is_walkable)
                    for hazard in new_hazards:
                        if hazard and hasattr(hazard, 'name') and hazard.name:
                            self.add_message(f"The {hazard.name.lower()} spreads!")

                self._check_auto_save()
                self._check_player_death()

            return player_moved

        # Turn commands (rotate facing direction)
        if cmd_type in TURN_COMMANDS:
            if self._handle_turn(cmd_type):
                # Turning costs a turn - enemies get to act
                self._process_field_pulse()
                self._process_enemy_turns()
                self._process_ghost_tick()
                self._check_auto_save()
                self._check_player_death()
                return True
            return False

        # Search command (reveal hidden secrets)
        if cmd_type == CommandType.SEARCH:
            if self._handle_search():
                # Searching costs a turn
                self._process_field_pulse()
                self._process_enemy_turns()
                self._process_ghost_tick()
                self._check_auto_save()
                self._check_player_death()
                return True
            return False

        # Item use commands
        if cmd_type in ITEM_COMMANDS:
            item_index = get_item_index(cmd_type)
            if item_index >= 0:
                return self.use_item(item_index)
            return False

        # UI screen commands
        if cmd_type == CommandType.OPEN_INVENTORY:
            self.ui_mode = UIMode.INVENTORY
            self.selected_item_index = 0
            return False

        if cmd_type == CommandType.OPEN_CHARACTER:
            self.ui_mode = UIMode.CHARACTER
            return False

        if cmd_type == CommandType.OPEN_HELP:
            self.ui_mode = UIMode.HELP
            return False

        if cmd_type == CommandType.OPEN_MESSAGE_LOG:
            self.message_log.reset_scroll()
            self.ui_mode = UIMode.MESSAGE_LOG
            return False

        if cmd_type == CommandType.QUIT:
            self.show_dialog(
                "Quit Game",
                "Save and quit?",
                self._handle_quit_confirm
            )
            return False

        return False

    def _process_enemy_turns(self):
        """Process all enemy turns after player action."""
        self.combat_manager.process_enemy_turns()

    def _process_ghost_tick(self):
        """Process ghost behaviors for this turn."""
        if not self.ghost_manager or not self.player or not self.dungeon:
            return

        # Get ghosts that were triggered this tick (for ledger tracking)
        pre_triggered = {g.ghost_type.name for g in self.ghost_manager.ghosts if g.triggered}

        messages = self.ghost_manager.tick(self.player, self.dungeon)
        for msg in messages:
            self.add_message(msg, MessageCategory.SYSTEM, MessageImportance.IMPORTANT)

        # Spawn champion trial enemy if triggered
        if self.ghost_manager.has_pending_trial():
            trial_messages = self.ghost_manager.spawn_champion_trial(
                self.dungeon, self.entity_manager
            )
            for msg in trial_messages:
                self.add_message(msg, MessageCategory.COMBAT, MessageImportance.IMPORTANT)

        # Track newly triggered ghosts in completion ledger
        if self.completion_ledger:
            post_triggered = {g.ghost_type.name for g in self.ghost_manager.ghosts if g.triggered}
            new_triggers = post_triggered - pre_triggered
            for ghost_type_name in new_triggers:
                self.completion_ledger.record_ghost_encounter(ghost_type_name)

    def _get_relative_movement(self, cmd_type: CommandType) -> tuple:
        """
        Convert a movement command to actual (dx, dy) based on player facing.

        WASD/Arrows are interpreted relative to facing direction:
        - MOVE_UP (W/Up) = move forward (in facing direction)
        - MOVE_DOWN (S/Down) = move backward (opposite to facing)
        - MOVE_LEFT (A/Left) = strafe left (perpendicular left)
        - MOVE_RIGHT (D/Right) = strafe right (perpendicular right)

        Args:
            cmd_type: The movement command type

        Returns:
            (dx, dy) tuple for actual world movement
        """
        if not self.player:
            return get_movement_delta(cmd_type)  # Fall back to cardinal

        fx, fy = self.player.facing  # Current facing direction

        if cmd_type == CommandType.MOVE_UP:
            # Forward = facing direction
            return (fx, fy)
        elif cmd_type == CommandType.MOVE_DOWN:
            # Backward = opposite of facing
            return (-fx, -fy)
        elif cmd_type == CommandType.MOVE_LEFT:
            # Strafe left = rotate facing 90 deg counterclockwise: (fx, fy) -> (fy, -fx)
            return (fy, -fx)
        elif cmd_type == CommandType.MOVE_RIGHT:
            # Strafe right = rotate facing 90 deg clockwise: (fx, fy) -> (-fy, fx)
            return (-fy, fx)

        return (0, 0)

    def _handle_turn(self, cmd_type: CommandType) -> bool:
        """
        Handle turn-in-place command.

        Turn left (counterclockwise): (dx, dy) -> (dy, -dx)
        Turn right (clockwise): (dx, dy) -> (-dy, dx)

        Returns True if successful.
        """
        if not self.player:
            return False

        dx, dy = self.player.facing

        if cmd_type == CommandType.TURN_LEFT:
            # Counterclockwise: (dx, dy) -> (dy, -dx)
            new_facing = (dy, -dx)
        else:
            # Clockwise: (dx, dy) -> (-dy, dx)
            new_facing = (-dy, dx)

        self.player.facing = new_facing

        # Update FOV with new facing direction
        if self.dungeon:
            vision_bonus = self.player.get_vision_bonus() if hasattr(self.player, 'get_vision_bonus') else 0
            self.dungeon.update_fov(self.player.x, self.player.y, vision_bonus=vision_bonus)

        # Get direction name for message
        direction_names = {
            (0, -1): "north",
            (1, 0): "east",
            (0, 1): "south",
            (-1, 0): "west",
        }
        direction = direction_names.get(new_facing, "unknown")
        self.add_message(f"You turn to face {direction}.")

        return True

    def _handle_search(self) -> bool:
        """
        Handle search command - look for hidden secrets nearby.

        Searches for hidden traps and secret doors within range.
        Returns True if successful (always costs a turn).
        """
        from .constants import TileType

        if not self.player or not self.dungeon:
            return False

        found_something = False
        perception = 10  # Base perception, could be modified by character stats

        # Search for hidden traps
        if self.trap_manager:
            detected_traps = self.trap_manager.detect_nearby(
                self.player.x, self.player.y, perception, radius=1
            )
            for trap in detected_traps:
                trap_name = trap.name if trap and hasattr(trap, 'name') and trap.name else "trap"
                self.add_message(f"You found a hidden {trap_name}!", importance=MessageImportance.IMPORTANT)
                found_something = True

        # Search for secret doors
        if self.secret_door_manager:
            detected_doors = self.secret_door_manager.search_nearby(
                self.player.x, self.player.y, perception, radius=1
            )
            for door in detected_doors:
                self.add_message("You found a secret door!", importance=MessageImportance.IMPORTANT)
                # Reveal the secret door on the map - change wall to floor
                self.dungeon.tiles[door.y][door.x] = TileType.FLOOR
                found_something = True

        if not found_something:
            self.add_message("You search the area but find nothing.")

        return True

    def _check_auto_save(self):
        """Check if auto-save should trigger."""
        self.turns_since_save += 1

        # Track turn in completion ledger
        if hasattr(self, 'completion_ledger') and self.completion_ledger:
            self.completion_ledger.record_turn()

        if self.turns_since_save >= AUTO_SAVE_INTERVAL:
            self.save_manager.auto_save()
            self.add_message("Game saved.")

    def _check_player_death(self):
        """Check if player died and update state."""
        if self.player and not self.player.is_alive():
            from ..data import delete_save
            delete_save()
            self.state = GameState.DEAD

    # =========================================================================
    # Dialog System
    # =========================================================================

    def show_dialog(self, title: str, message: str, callback: Callable[[bool], None]):
        """Show a confirmation dialog."""
        self.dialog_title = title
        self.dialog_message = message
        self.dialog_callback = callback
        self.ui_mode = UIMode.DIALOG

    def _handle_quit_confirm(self, confirmed: bool):
        """Handle quit confirmation dialog result."""
        if confirmed:
            if self.save_manager.save_game():
                self.add_message("Game saved!")
            self.state = GameState.QUIT

    def _handle_drop_confirm(self, confirmed: bool):
        """Handle drop rare item confirmation dialog result."""
        if confirmed and self._pending_drop_item is not None:
            inventory = self.player.inventory
            item = inventory.remove_item(self._pending_drop_index)
            item.x = self.player.x
            item.y = self.player.y
            self.entity_manager.items.append(item)
            self.add_message(f"Dropped {item.name}")
            self._adjust_selection_after_removal()
        self._pending_drop_item = None
        self._pending_drop_index = None

    # =========================================================================
    # Item Usage
    # =========================================================================

    def use_item(self, item_index: int) -> bool:
        """Use an item from inventory. Returns True if used."""
        if not self.player:
            return False

        if item_index < 0 or item_index >= len(self.player.inventory.items):
            return False

        item = self.player.inventory.get_item(item_index)
        if not item:
            return False

        # Handle lore items specially - open reading screen
        if isinstance(item, (LoreScroll, LoreBook)):
            title, content = item.get_text()
            self.reading_title = title
            self.reading_content = content
            self.ui_mode = UIMode.READING

            # Mark lore as discovered
            self.story_manager.discover_lore(item.lore_id)

            # Remove item from inventory after reading
            self.player.inventory.remove_item(item_index)
            self.add_message(f"You read {item.name}.")
            return True

        # Use the item
        message = item.use(self.player)
        self.add_message(message)

        # Handle special item effects
        if isinstance(item, ScrollTeleport) and self.dungeon:
            new_pos = self.dungeon.get_random_floor_position()
            self.player.x, self.player.y = new_pos
            vision_bonus = self.player.get_vision_bonus() if hasattr(self.player, 'get_vision_bonus') else 0
            self.dungeon.update_fov(self.player.x, self.player.y, vision_bonus=vision_bonus)

        # Remove item from inventory
        self.player.inventory.remove_item(item_index)

        return True

    # =========================================================================
    # Game State Queries
    # =========================================================================

    def get_lore_progress(self) -> Tuple[int, int]:
        """Get lore discovery progress (found, total)."""
        return self.story_manager.get_lore_progress()

    def get_death_info(self) -> dict:
        """Get death recap information with telemetry."""
        lore_found, lore_total = self.get_lore_progress()

        # Include telemetry for balance tuning
        telemetry = {}
        if hasattr(self, 'completion_ledger') and self.completion_ledger:
            telemetry = {
                'total_kills': self.completion_ledger.total_kills,
                'elite_kills': self.completion_ledger.elite_kills,
                'lore_count': self.completion_ledger.lore_count,
                'damage_taken': self.completion_ledger.damage_taken,
                'potions_used': self.completion_ledger.potions_used,
                'total_turns': self.completion_ledger.total_turns,
                'floors_cleared': len(self.completion_ledger.floors_cleared),
            }
            # Dev telemetry output
            self._log_death_telemetry(telemetry, self.last_attacker_name)

        return {
            'attacker': self.last_attacker_name,
            'damage': self.last_damage_taken,
            'max_level': self.max_level_reached,
            'lore_found': lore_found,
            'lore_total': lore_total,
            'telemetry': telemetry,
        }

    def _log_death_telemetry(self, telemetry: dict, attacker: str):
        """Log death telemetry for balance tuning."""
        print("\n" + "=" * 60)
        print(f"DEATH TELEMETRY (dev) - Killed by {attacker}")
        print("=" * 60)
        print(f"  Kills: {telemetry.get('total_kills', 0)} (elite: {telemetry.get('elite_kills', 0)})")
        print(f"  Lore: {telemetry.get('lore_count', 0)}")
        print(f"  Damage Taken: {telemetry.get('damage_taken', 0)}")
        print(f"  Potions Used: {telemetry.get('potions_used', 0)}")
        print(f"  Total Turns: {telemetry.get('total_turns', 0)}")
        print(f"  Floors Cleared: {telemetry.get('floors_cleared', 0)}")
        print("=" * 60 + "\n")

    def get_victory_info(self) -> dict:
        """Get victory screen information with telemetry."""
        lore_found, lore_total = self.get_lore_progress()

        # Derive victory legacy from completion ledger
        legacy_result = None
        telemetry = {}
        if hasattr(self, 'completion_ledger') and self.completion_ledger:
            legacy_result = derive_victory_legacy(self.completion_ledger)
            telemetry = {
                'total_kills': self.completion_ledger.total_kills,
                'elite_kills': self.completion_ledger.elite_kills,
                'lore_count': self.completion_ledger.lore_count,
                'damage_taken': self.completion_ledger.damage_taken,
                'potions_used': self.completion_ledger.potions_used,
                'total_turns': self.completion_ledger.total_turns,
                'floors_cleared': len(self.completion_ledger.floors_cleared),
                'wardens_defeated': len(self.completion_ledger.wardens_defeated),
                'artifacts_collected': len(self.completion_ledger.artifacts_collected_ids),
                'derived_legacy': legacy_result.primary.name if legacy_result else None,
                'secondary_tag': legacy_result.secondary_tag if legacy_result else None,
            }
            # Dev telemetry output
            self._log_victory_telemetry(telemetry)

        return {
            'lore_found': lore_found,
            'lore_total': lore_total,
            'legacy': legacy_result.primary.name if legacy_result else 'BEACON',
            'secondary_tag': legacy_result.secondary_tag if legacy_result else None,
            'telemetry': telemetry,
        }

    def _log_victory_telemetry(self, telemetry: dict):
        """Log victory telemetry for balance tuning."""
        print("\n" + "=" * 60)
        print("VICTORY TELEMETRY (dev)")
        print("=" * 60)
        print(f"  Kills: {telemetry.get('total_kills', 0)} (elite: {telemetry.get('elite_kills', 0)})")
        print(f"  Lore: {telemetry.get('lore_count', 0)}")
        print(f"  Damage Taken: {telemetry.get('damage_taken', 0)}")
        print(f"  Potions Used: {telemetry.get('potions_used', 0)}")
        print(f"  Total Turns: {telemetry.get('total_turns', 0)}")
        print(f"  Floors Cleared: {telemetry.get('floors_cleared', 0)}")
        print(f"  Wardens Defeated: {telemetry.get('wardens_defeated', 0)}")
        print(f"  Artifacts: {telemetry.get('artifacts_collected', 0)}")
        print("-" * 60)
        print(f"  DERIVED LEGACY: {telemetry.get('derived_legacy', 'UNKNOWN')}")
        if telemetry.get('secondary_tag'):
            print(f"  Secondary: {telemetry.get('secondary_tag')}")
        print("=" * 60 + "\n")
