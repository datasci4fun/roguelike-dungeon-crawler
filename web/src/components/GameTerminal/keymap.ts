/**
 * GameTerminal key mapping - converts keyboard input to game commands
 */

export function mapKeyToCommand(key: string, uiMode: string): string | null {
  // Universal commands
  if (key === 'Escape') return 'CLOSE_SCREEN';

  // UI Mode specific
  if (uiMode === 'INVENTORY') {
    switch (key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        return 'INVENTORY_UP';
      case 'ArrowDown':
      case 's':
      case 'S':
        return 'INVENTORY_DOWN';
      case 'e':
      case 'E':
      case 'Enter':
        return 'INVENTORY_USE';
      case 'd':
      case 'D':
        return 'INVENTORY_DROP';
      case 'r':
      case 'R':
        return 'INVENTORY_READ';
      case 'i':
      case 'I':
      case 'q':
      case 'Q':
        return 'CLOSE_SCREEN';
    }
    return null;
  }

  if (uiMode === 'DIALOG') {
    switch (key) {
      case 'y':
      case 'Y':
      case 'Enter':
        return 'CONFIRM';
      case 'n':
      case 'N':
      case 'Escape':
        return 'CANCEL';
    }
    return null;
  }

  if (uiMode === 'MESSAGE_LOG') {
    switch (key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        return 'SCROLL_UP';
      case 'ArrowDown':
      case 's':
      case 'S':
        return 'SCROLL_DOWN';
      case 'PageUp':
        return 'PAGE_UP';
      case 'PageDown':
        return 'PAGE_DOWN';
      default:
        return 'CLOSE_SCREEN';
    }
  }

  if (['CHARACTER', 'HELP', 'READING'].includes(uiMode)) {
    return 'CLOSE_SCREEN';
  }

  // Game mode commands
  switch (key) {
    // Movement
    case 'ArrowUp':
    case 'w':
    case 'W':
      return 'MOVE_UP';
    case 'ArrowDown':
    case 's':
    case 'S':
      return 'MOVE_DOWN';
    case 'ArrowLeft':
    case 'a':
    case 'A':
      return 'MOVE_LEFT';
    case 'ArrowRight':
    case 'd':
    case 'D':
      return 'MOVE_RIGHT';

    // Quick items
    case '1':
      return 'USE_ITEM_1';
    case '2':
      return 'USE_ITEM_2';
    case '3':
      return 'USE_ITEM_3';

    // UI screens
    case 'i':
    case 'I':
      return 'OPEN_INVENTORY';
    case 'c':
    case 'C':
      return 'OPEN_CHARACTER';
    case '?':
      return 'OPEN_HELP';
    case 'm':
    case 'M':
      return 'OPEN_MESSAGE_LOG';

    // Actions
    case '>':
      return 'DESCEND';
    case 'x':
    case 'X':
      return 'QUIT';

    // Turn in place (rotate facing direction)
    case 'q':
    case 'Q':
      return 'TURN_LEFT';
    case 'e':
    case 'E':
      return 'TURN_RIGHT';

    // Search for hidden secrets
    case 'f':
    case 'F':
    case '/':
      return 'SEARCH';

    // v7.0: Interaction with environment
    case 'g':
    case 'G':
      return 'INTERACT';
    case 'v':
    case 'V':
      return 'EXAMINE';

    // For "press any key" prompts
    case 'Enter':
    case ' ':
      return 'ANY_KEY';
  }

  return null;
}
