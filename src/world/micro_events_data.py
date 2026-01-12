"""Micro-event definitions for Field Pulse system.

Each floor has 1 micro-event that can trigger during Field Pulse windows.
Events are deterministic per seed/floor and provide:
- 1-2 narrative messages
- A safe, non-blocking effect
- Optional codex evidence unlock

Design rules:
- NEVER block paths or create hazards
- Effects are always beneficial or neutral
- Deterministic: same seed = same event
"""
from dataclasses import dataclass
from enum import Enum, auto
from typing import List, Optional, Callable, TYPE_CHECKING

if TYPE_CHECKING:
    from ..core.engine import GameEngine


class MicroEventEffect(Enum):
    """Types of safe effects micro-events can provide."""
    NONE = auto()           # Just narrative, no mechanical effect
    REVEAL_TILES = auto()   # Reveal nearby tiles temporarily
    HEAL_MINOR = auto()     # Small HP recovery (1-3 HP)
    BOOST_VISION = auto()   # Temporary vision range increase
    LORE_HINT = auto()      # Message hints at lore location
    CALM_ENEMIES = auto()   # Nearby enemies skip their turn
    GLOW_ITEMS = auto()     # Nearby items briefly highlighted


@dataclass
class MicroEvent:
    """A single micro-event definition."""
    id: str                           # Unique identifier
    floor: int                        # Which floor this event belongs to
    title: str                        # Short name for logging
    messages: List[str]               # 1-2 narrative messages to display
    effect: MicroEventEffect          # What mechanical effect to apply
    effect_value: int = 0             # Magnitude of effect (varies by type)
    evidence_id: Optional[str] = None # Codex evidence to unlock


# Floor 1: Entrance Hall - The Fall
FLOOR_1_EVENT = MicroEvent(
    id="micro_f1_echo",
    floor=1,
    title="Echo of the Fall",
    messages=[
        "The walls seem to breathe with ancient memory...",
        "You feel a whisper of those who fell before you."
    ],
    effect=MicroEventEffect.REVEAL_TILES,
    effect_value=4,  # Reveal 4 tile radius
    evidence_id="evidence_echo_of_fall",
)

# Floor 2: Flooded Depths - Drowned Voices
FLOOR_2_EVENT = MicroEvent(
    id="micro_f2_drowned",
    floor=2,
    title="Drowned Voices",
    messages=[
        "Bubbles rise from cracks in the stone, carrying whispers...",
        "The water pulses with a faint, cold light."
    ],
    effect=MicroEventEffect.LORE_HINT,
    effect_value=0,
    evidence_id="evidence_drowned_voices",
)

# Floor 3: Fungal Caverns - Spore Memory
FLOOR_3_EVENT = MicroEvent(
    id="micro_f3_spores",
    floor=3,
    title="Spore Memory",
    messages=[
        "The fungi release a cloud of luminescent spores...",
        "For a moment, you see through the eyes of the colony."
    ],
    effect=MicroEventEffect.BOOST_VISION,
    effect_value=3,  # +3 vision range for duration
    evidence_id="evidence_spore_memory",
)

# Floor 4: Burning Mines - Ember Sigh
FLOOR_4_EVENT = MicroEvent(
    id="micro_f4_ember",
    floor=4,
    title="Ember Sigh",
    messages=[
        "The flames flicker in unison, then briefly dim...",
        "In the sudden coolness, you catch your breath."
    ],
    effect=MicroEventEffect.HEAL_MINOR,
    effect_value=3,  # Heal 3 HP
    evidence_id="evidence_ember_sigh",
)

# Floor 5: Frozen Crypts - Glacial Pause
FLOOR_5_EVENT = MicroEvent(
    id="micro_f5_glacial",
    floor=5,
    title="Glacial Pause",
    messages=[
        "Time seems to crystallize around you...",
        "The cold holds its breath."
    ],
    effect=MicroEventEffect.CALM_ENEMIES,
    effect_value=1,  # Enemies skip 1 turn
    evidence_id="evidence_glacial_pause",
)

# Floor 6: Shadow Sanctum - Void Glimpse
FLOOR_6_EVENT = MicroEvent(
    id="micro_f6_void",
    floor=6,
    title="Void Glimpse",
    messages=[
        "The shadows part, revealing what should not be seen...",
        "You glimpse the spaces between spaces."
    ],
    effect=MicroEventEffect.REVEAL_TILES,
    effect_value=6,  # Larger reveal on this floor
    evidence_id="evidence_void_glimpse",
)

# Floor 7: Throne Approach - Royal Echo
FLOOR_7_EVENT = MicroEvent(
    id="micro_f7_royal",
    floor=7,
    title="Royal Echo",
    messages=[
        "A spectral crown flickers into existence above you...",
        "The ancient king's blessing lingers, faint but real."
    ],
    effect=MicroEventEffect.HEAL_MINOR,
    effect_value=5,  # More healing on deeper floor
    evidence_id="evidence_royal_echo",
)

# Floor 8: Final Depths - The Watching
FLOOR_8_EVENT = MicroEvent(
    id="micro_f8_watching",
    floor=8,
    title="The Watching",
    messages=[
        "Something ancient turns its attention toward you...",
        "It sees. It knows. And for this moment, it waits."
    ],
    effect=MicroEventEffect.GLOW_ITEMS,
    effect_value=8,  # Highlight items in 8 tile radius
    evidence_id="evidence_the_watching",
)

# Master list indexed by floor number
MICRO_EVENTS_BY_FLOOR = {
    1: FLOOR_1_EVENT,
    2: FLOOR_2_EVENT,
    3: FLOOR_3_EVENT,
    4: FLOOR_4_EVENT,
    5: FLOOR_5_EVENT,
    6: FLOOR_6_EVENT,
    7: FLOOR_7_EVENT,
    8: FLOOR_8_EVENT,
}


def get_micro_event_for_floor(floor: int) -> Optional[MicroEvent]:
    """Get the micro-event for a specific floor.

    Args:
        floor: Floor number (1-8)

    Returns:
        The MicroEvent for that floor, or None if floor out of range.
    """
    return MICRO_EVENTS_BY_FLOOR.get(floor)


def apply_micro_event_effect(event: MicroEvent, engine: 'GameEngine') -> bool:
    """Apply a micro-event's effect to the game state.

    Args:
        event: The micro-event to apply
        engine: The game engine instance

    Returns:
        True if effect was applied successfully, False otherwise.

    Note: All effects are designed to be safe and non-blocking.
    """
    player = engine.player

    if event.effect == MicroEventEffect.NONE:
        return True

    elif event.effect == MicroEventEffect.REVEAL_TILES:
        # Reveal tiles in radius around player
        radius = event.effect_value
        dungeon = engine.dungeon
        for dy in range(-radius, radius + 1):
            for dx in range(-radius, radius + 1):
                nx, ny = player.x + dx, player.y + dy
                if 0 <= nx < dungeon.width and 0 <= ny < dungeon.height:
                    if dx * dx + dy * dy <= radius * radius:
                        dungeon.explored[ny][nx] = True
        return True

    elif event.effect == MicroEventEffect.HEAL_MINOR:
        # Heal a small amount
        heal_amount = min(event.effect_value, player.max_hp - player.hp)
        if heal_amount > 0:
            player.hp += heal_amount
            engine.add_message(f"You recover {heal_amount} HP from the Field's blessing.", important=True)
        return True

    elif event.effect == MicroEventEffect.BOOST_VISION:
        # Temporary vision boost - store on player for renderer to check
        current_boost = getattr(player, 'field_vision_boost', 0)
        player.field_vision_boost = current_boost + event.effect_value
        player.field_vision_boost_turns = 10  # Lasts 10 turns
        return True

    elif event.effect == MicroEventEffect.LORE_HINT:
        # Add a hint message about nearby lore
        engine.add_message("You sense ancient knowledge nearby...", important=True)
        return True

    elif event.effect == MicroEventEffect.CALM_ENEMIES:
        # Make nearby enemies skip their next turn
        entity_manager = engine.entity_manager
        radius = 5  # Affect enemies within 5 tiles
        calmed = 0
        for enemy in entity_manager.enemies:
            if not enemy.is_alive():
                continue
            dist = max(abs(enemy.x - player.x), abs(enemy.y - player.y))
            if dist <= radius:
                enemy.stunned_turns = getattr(enemy, 'stunned_turns', 0) + event.effect_value
                calmed += 1
        if calmed > 0:
            engine.add_message(f"The Field's pulse stuns {calmed} nearby enemies!", important=True)
        return True

    elif event.effect == MicroEventEffect.GLOW_ITEMS:
        # Mark nearby items as highlighted for renderer
        radius = event.effect_value
        items_highlighted = 0
        for item in engine.items:
            dist = max(abs(item.x - player.x), abs(item.y - player.y))
            if dist <= radius:
                item.field_highlighted = True
                item.field_highlight_turns = 10
                items_highlighted += 1
        if items_highlighted > 0:
            engine.add_message(f"The Field reveals {items_highlighted} items nearby!", important=True)
        return True

    return False


def unlock_micro_event_evidence(event: MicroEvent, engine: 'GameEngine') -> bool:
    """Unlock the codex evidence for a micro-event.

    Args:
        event: The micro-event that triggered
        engine: The game engine instance

    Returns:
        True if new evidence was unlocked, False if already known.
    """
    if not event.evidence_id:
        return False

    # Get story manager from engine
    story_manager = getattr(engine, 'story_manager', None)
    if story_manager is None:
        return False

    # Use discover_lore to unlock the evidence entry
    # validate=False since micro-event evidence might not be in ALL_LORE_IDS yet during testing
    return story_manager.discover_lore(event.evidence_id, validate=True)
