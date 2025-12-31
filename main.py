"""Entry point for the roguelike dungeon crawler."""
import curses
import sys

from src.game import Game


def main(stdscr):
    """Main function wrapped by curses."""
    try:
        game = Game(stdscr)
        game.run()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    try:
        curses.wrapper(main)
    except Exception as e:
        print(f"Error running game: {e}", file=sys.stderr)
        sys.exit(1)
