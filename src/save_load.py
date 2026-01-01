"""Save and load game state using pickle."""
import os
import pickle
from typing import Optional


SAVE_FILE_PATH = "savegame.pkl"


def save_game(game_state: dict) -> bool:
    """
    Save game state to disk using pickle.

    Args:
        game_state: Dictionary containing serialized game state

    Returns:
        True if save succeeded, False otherwise
    """
    try:
        with open(SAVE_FILE_PATH, 'wb') as f:
            pickle.dump(game_state, f, protocol=4)  # Protocol 4 for Python 3.4+
        return True
    except Exception as e:
        print(f"Error saving game: {e}")
        return False


def load_game() -> Optional[dict]:
    """
    Load game state from disk.

    Returns:
        Dictionary containing game state, or None if load failed
    """
    if not save_exists():
        return None

    try:
        with open(SAVE_FILE_PATH, 'rb') as f:
            game_state = pickle.load(f)
        return game_state
    except Exception as e:
        print(f"Error loading game: {e}")
        return None


def delete_save() -> bool:
    """
    Delete the save file (for permadeath).

    Returns:
        True if deletion succeeded or file didn't exist, False on error
    """
    try:
        if save_exists():
            os.remove(SAVE_FILE_PATH)
        return True
    except Exception as e:
        print(f"Error deleting save: {e}")
        return False


def save_exists() -> bool:
    """
    Check if a save file exists.

    Returns:
        True if save file exists, False otherwise
    """
    return os.path.isfile(SAVE_FILE_PATH)
