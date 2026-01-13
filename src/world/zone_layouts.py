"""Zone layout decorators registry.

Layout decorators modify room geometry based on zone type.
Each decorator takes (dungeon, room) and modifies tiles in-place.

Layouts are split by floor range:
- zone_layouts_early.py: Floors 1-4 (Stone Dungeon, Sewers, Forest, Mirror Valdris)
- zone_layouts_late.py: Floors 5-8 (Ice Cavern, Library, Volcanic, Crystal Cave)
"""
from typing import Callable, Dict, Tuple, TYPE_CHECKING

if TYPE_CHECKING:
    from .dungeon import Dungeon, Room

# Registry: (floor_level, zone_id) -> layout_handler
# Handler signature: (dungeon, room) -> None
ZONE_LAYOUTS: Dict[Tuple[int, str], Callable[['Dungeon', 'Room'], None]] = {}


def register_layout(floor: int, zone_id: str):
    """Decorator to register a zone layout handler."""
    def decorator(func: Callable[['Dungeon', 'Room'], None]):
        ZONE_LAYOUTS[(floor, zone_id)] = func
        return func
    return decorator


def apply_zone_layout(dungeon: 'Dungeon', room: 'Room'):
    """Apply the appropriate layout decorator for a room's zone."""
    key = (dungeon.level, room.zone)
    handler = ZONE_LAYOUTS.get(key)
    if handler:
        handler(dungeon, room)


# Import layout modules to trigger registration via @register_layout decorators
# These imports must come after register_layout is defined
from . import zone_layouts_early  # noqa: F401, E402
from . import zone_layouts_late   # noqa: F401, E402
