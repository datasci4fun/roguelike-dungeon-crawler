"""Entry point for the roguelike dungeon crawler."""
import curses
import sys

from src.game import Game
from src.save_load import save_exists, load_game, delete_save


def show_load_prompt(stdscr):
    """
    Show load game prompt if save exists.

    Returns:
        'L' to load, 'N' for new game
    """
    stdscr.clear()
    max_y, max_x = stdscr.getmaxyx()

    messages = [
        "SAVE GAME FOUND",
        "",
        "Press L to LOAD saved game",
        "Press N for NEW game",
    ]

    start_y = max_y // 2 - len(messages) // 2

    for i, message in enumerate(messages):
        x = max_x // 2 - len(message) // 2
        y = start_y + i
        if 0 <= y < max_y and 0 <= x < max_x:
            try:
                stdscr.addstr(y, x, message)
            except curses.error:
                pass

    stdscr.refresh()

    # Wait for L or N key
    while True:
        key = stdscr.getch()
        if key in (ord('l'), ord('L')):
            return 'L'
        elif key in (ord('n'), ord('N')):
            return 'N'


def main(stdscr):
    """Main function wrapped by curses."""
    try:
        # Check if save exists and prompt user
        load_save = False
        if save_exists():
            choice = show_load_prompt(stdscr)
            if choice == 'L':
                load_save = True
            else:
                # Delete old save for new game
                delete_save()

        # Create game
        game = Game(stdscr)

        # Load saved state if requested
        if load_save:
            saved_state = load_game()
            if saved_state:
                if not game.load_game_state(saved_state):
                    # Load failed, continue with new game
                    game.add_message("Failed to load save, starting new game")
            else:
                game.add_message("Failed to load save, starting new game")

        game.run()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    try:
        curses.wrapper(main)
    except Exception as e:
        print(f"Error running game: {e}", file=sys.stderr)
        sys.exit(1)
