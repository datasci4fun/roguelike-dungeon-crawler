/**
 * GameMenu - In-game pause menu with options for resume, help, settings, and quit
 * Replaces immediate quit with a proper menu system
 */
import { useEffect, useCallback, useState } from 'react';
import './GameMenu.css';

interface GameMenuProps {
  onClose: () => void;
  onQuit: () => void;
  onOpenHelp: () => void;
  onQuitToTitle?: () => void;
}

type MenuOption = 'resume' | 'help' | 'settings' | 'quit-title' | 'quit-game';

interface MenuItem {
  id: MenuOption;
  label: string;
  icon: string;
  description: string;
  disabled?: boolean;
  danger?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'resume',
    label: 'Resume Game',
    icon: '▶',
    description: 'Continue playing',
  },
  {
    id: 'help',
    label: 'Help & Controls',
    icon: '?',
    description: 'View keybindings and tips',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: '⚙',
    description: 'Audio and display options',
    disabled: true, // Not yet implemented
  },
  {
    id: 'quit-title',
    label: 'Quit to Title',
    icon: '🏠',
    description: 'Return to title screen',
    danger: true,
  },
  {
    id: 'quit-game',
    label: 'Quit Game',
    icon: '✕',
    description: 'Exit the application',
    danger: true,
  },
];

export function GameMenu({
  onClose,
  onQuit,
  onOpenHelp,
  onQuitToTitle,
}: GameMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [confirmQuit, setConfirmQuit] = useState<'title' | 'game' | null>(null);

  // Get enabled menu items
  const enabledItems = MENU_ITEMS.filter(item => !item.disabled);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (confirmQuit) {
        // In confirmation dialog
        if (e.key === 'Escape' || e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          setConfirmQuit(null);
        } else if (e.key === 'Enter' || e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          if (confirmQuit === 'title' && onQuitToTitle) {
            onQuitToTitle();
          } else if (confirmQuit === 'game') {
            onQuit();
          }
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + enabledItems.length) % enabledItems.length);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % enabledItems.length);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          handleSelect(enabledItems[selectedIndex].id);
          break;
      }
    },
    [selectedIndex, enabledItems, onClose, confirmQuit, onQuit, onQuitToTitle]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSelect = (id: MenuOption) => {
    switch (id) {
      case 'resume':
        onClose();
        break;
      case 'help':
        onClose();
        onOpenHelp();
        break;
      case 'settings':
        // Not yet implemented
        break;
      case 'quit-title':
        setConfirmQuit('title');
        break;
      case 'quit-game':
        setConfirmQuit('game');
        break;
    }
  };

  return (
    <div className="game-menu-overlay" onClick={onClose}>
      <div className="game-menu" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="gm-header">
          <h2 className="gm-title">Game Menu</h2>
        </div>

        {/* Menu Options */}
        <div className="gm-options">
          {enabledItems.map((item, index) => (
            <button
              key={item.id}
              className={`gm-option ${selectedIndex === index ? 'selected' : ''} ${item.danger ? 'danger' : ''}`}
              onClick={() => {
                setSelectedIndex(index);
                handleSelect(item.id);
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="option-icon">{item.icon}</span>
              <div className="option-text">
                <span className="option-label">{item.label}</span>
                <span className="option-description">{item.description}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <div className="gm-footer">
          <span className="gm-hint">
            <kbd>↑</kbd><kbd>↓</kbd> Navigate • <kbd>Enter</kbd> Select • <kbd>Esc</kbd> Close
          </span>
        </div>

        {/* Confirmation Dialog */}
        {confirmQuit && (
          <div className="gm-confirm-overlay">
            <div className="gm-confirm">
              <h3 className="confirm-title">
                {confirmQuit === 'title' ? 'Quit to Title?' : 'Quit Game?'}
              </h3>
              <p className="confirm-message">
                {confirmQuit === 'title'
                  ? 'Your current progress will be lost. Are you sure?'
                  : 'Are you sure you want to exit the game?'}
              </p>
              <div className="confirm-buttons">
                <button
                  className="confirm-btn cancel"
                  onClick={() => setConfirmQuit(null)}
                >
                  Cancel
                </button>
                <button
                  className="confirm-btn confirm"
                  onClick={() => {
                    if (confirmQuit === 'title' && onQuitToTitle) {
                      onQuitToTitle();
                    } else {
                      onQuit();
                    }
                  }}
                >
                  {confirmQuit === 'title' ? 'Quit to Title' : 'Quit Game'}
                </button>
              </div>
              <span className="confirm-hint">
                <kbd>Y</kbd> Confirm • <kbd>N</kbd> Cancel
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
