/**
 * TouchControls - Mobile touch control overlay for the game.
 *
 * Provides a D-pad for movement and action buttons for game commands.
 * Adapts layout for portrait and landscape orientations.
 */
import { useCallback, useState, useEffect } from 'react';
import type { UIMode } from '../hooks/useGameSocket';
import './TouchControls.css';

interface TouchControlsProps {
  onCommand: (command: string) => void;
  onNewGame?: () => void;
  uiMode?: UIMode;
  isConnected?: boolean;
  gameActive?: boolean;
}

export function TouchControls({
  onCommand,
  onNewGame,
  uiMode = 'GAME',
  isConnected = true,
  gameActive = false,
}: TouchControlsProps) {
  const [isLandscape, setIsLandscape] = useState(false);
  const [activeButton, setActiveButton] = useState<string | null>(null);

  // Detect orientation
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  // Handle button press with visual feedback
  const handlePress = useCallback(
    (command: string, buttonId: string) => {
      if (!isConnected) return;
      setActiveButton(buttonId);
      onCommand(command);
      // Clear active state after short delay
      setTimeout(() => setActiveButton(null), 100);
    },
    [onCommand, isConnected]
  );

  // Handle new game press
  const handleNewGame = useCallback(() => {
    if (!isConnected) return;
    onNewGame?.();
  }, [onNewGame, isConnected]);

  // Prevent default touch behavior (scrolling, zooming)
  const preventDefaults = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
  }, []);

  // Render different controls based on UI mode
  if (uiMode === 'INVENTORY') {
    return (
      <div
        className={`touch-controls ${isLandscape ? 'landscape' : 'portrait'}`}
        onTouchStart={preventDefaults}
      >
        <div className="controls-left">
          <DPad
            onUp={() => handlePress('INVENTORY_UP', 'up')}
            onDown={() => handlePress('INVENTORY_DOWN', 'down')}
            activeButton={activeButton}
            verticalOnly
          />
        </div>
        <div className="controls-right">
          <div className="action-grid inventory-actions">
            <ActionButton
              label="Use"
              icon="E"
              onPress={() => handlePress('INVENTORY_USE', 'use')}
              isActive={activeButton === 'use'}
              color="green"
            />
            <ActionButton
              label="Drop"
              icon="D"
              onPress={() => handlePress('INVENTORY_DROP', 'drop')}
              isActive={activeButton === 'drop'}
              color="red"
            />
            <ActionButton
              label="Read"
              icon="R"
              onPress={() => handlePress('INVENTORY_READ', 'read')}
              isActive={activeButton === 'read'}
              color="cyan"
            />
            <ActionButton
              label="Close"
              icon="X"
              onPress={() => handlePress('CLOSE_SCREEN', 'close')}
              isActive={activeButton === 'close'}
              color="yellow"
            />
          </div>
        </div>
      </div>
    );
  }

  if (uiMode === 'DIALOG') {
    return (
      <div
        className={`touch-controls ${isLandscape ? 'landscape' : 'portrait'}`}
        onTouchStart={preventDefaults}
      >
        <div className="controls-center dialog-controls">
          <ActionButton
            label="Yes"
            icon="Y"
            onPress={() => handlePress('CONFIRM', 'yes')}
            isActive={activeButton === 'yes'}
            color="green"
            large
          />
          <ActionButton
            label="No"
            icon="N"
            onPress={() => handlePress('CANCEL', 'no')}
            isActive={activeButton === 'no'}
            color="red"
            large
          />
        </div>
      </div>
    );
  }

  if (uiMode === 'MESSAGE_LOG') {
    return (
      <div
        className={`touch-controls ${isLandscape ? 'landscape' : 'portrait'}`}
        onTouchStart={preventDefaults}
      >
        <div className="controls-left">
          <DPad
            onUp={() => handlePress('SCROLL_UP', 'up')}
            onDown={() => handlePress('SCROLL_DOWN', 'down')}
            activeButton={activeButton}
            verticalOnly
          />
        </div>
        <div className="controls-right">
          <div className="action-grid">
            <ActionButton
              label="Close"
              icon="X"
              onPress={() => handlePress('CLOSE_SCREEN', 'close')}
              isActive={activeButton === 'close'}
              color="yellow"
              large
            />
          </div>
        </div>
      </div>
    );
  }

  if (['CHARACTER', 'HELP', 'READING'].includes(uiMode)) {
    return (
      <div
        className={`touch-controls ${isLandscape ? 'landscape' : 'portrait'}`}
        onTouchStart={preventDefaults}
      >
        <div className="controls-center">
          <ActionButton
            label="Close"
            icon="X"
            onPress={() => handlePress('CLOSE_SCREEN', 'close')}
            isActive={activeButton === 'close'}
            color="yellow"
            large
          />
        </div>
      </div>
    );
  }

  // Default: Game mode controls
  // Show "New Game" button if no active game
  if (!gameActive) {
    return (
      <div
        className={`touch-controls ${isLandscape ? 'landscape' : 'portrait'}`}
        onTouchStart={preventDefaults}
      >
        <div className="controls-center">
          <ActionButton
            label="New Game"
            icon="Play"
            onPress={handleNewGame}
            isActive={false}
            color="green"
            large
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`touch-controls ${isLandscape ? 'landscape' : 'portrait'}`}
      onTouchStart={preventDefaults}
    >
      <div className="controls-left">
        <DPad
          onUp={() => handlePress('MOVE_UP', 'up')}
          onDown={() => handlePress('MOVE_DOWN', 'down')}
          onLeft={() => handlePress('MOVE_LEFT', 'left')}
          onRight={() => handlePress('MOVE_RIGHT', 'right')}
          activeButton={activeButton}
        />
      </div>
      <div className="controls-right">
        <div className="action-grid">
          <ActionButton
            label="Inv"
            icon="I"
            onPress={() => handlePress('OPEN_INVENTORY', 'inv')}
            isActive={activeButton === 'inv'}
          />
          <ActionButton
            label="Strs"
            icon=">"
            onPress={() => handlePress('DESCEND', 'descend')}
            isActive={activeButton === 'descend'}
            color="yellow"
          />
          <ActionButton
            label="1"
            icon="1"
            onPress={() => handlePress('USE_ITEM_1', 'item1')}
            isActive={activeButton === 'item1'}
            color="magenta"
          />
          <ActionButton
            label="2"
            icon="2"
            onPress={() => handlePress('USE_ITEM_2', 'item2')}
            isActive={activeButton === 'item2'}
            color="magenta"
          />
          <ActionButton
            label="3"
            icon="3"
            onPress={() => handlePress('USE_ITEM_3', 'item3')}
            isActive={activeButton === 'item3'}
            color="magenta"
          />
          <ActionButton
            label="Quit"
            icon="Q"
            onPress={() => handlePress('QUIT', 'quit')}
            isActive={activeButton === 'quit'}
            color="red"
          />
        </div>
      </div>
    </div>
  );
}

// D-Pad Component
interface DPadProps {
  onUp?: () => void;
  onDown?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
  activeButton: string | null;
  verticalOnly?: boolean;
}

function DPad({ onUp, onDown, onLeft, onRight, activeButton, verticalOnly = false }: DPadProps) {
  return (
    <div className={`dpad ${verticalOnly ? 'vertical-only' : ''}`}>
      <button
        className={`dpad-btn dpad-up ${activeButton === 'up' ? 'active' : ''}`}
        onTouchStart={(e) => {
          e.preventDefault();
          onUp?.();
        }}
        aria-label="Up"
      >
        <span className="dpad-arrow">^</span>
      </button>
      {!verticalOnly && (
        <>
          <button
            className={`dpad-btn dpad-left ${activeButton === 'left' ? 'active' : ''}`}
            onTouchStart={(e) => {
              e.preventDefault();
              onLeft?.();
            }}
            aria-label="Left"
          >
            <span className="dpad-arrow">&lt;</span>
          </button>
          <div className="dpad-center" />
          <button
            className={`dpad-btn dpad-right ${activeButton === 'right' ? 'active' : ''}`}
            onTouchStart={(e) => {
              e.preventDefault();
              onRight?.();
            }}
            aria-label="Right"
          >
            <span className="dpad-arrow">&gt;</span>
          </button>
        </>
      )}
      <button
        className={`dpad-btn dpad-down ${activeButton === 'down' ? 'active' : ''}`}
        onTouchStart={(e) => {
          e.preventDefault();
          onDown?.();
        }}
        aria-label="Down"
      >
        <span className="dpad-arrow">v</span>
      </button>
    </div>
  );
}

// Action Button Component
interface ActionButtonProps {
  label: string;
  icon: string;
  onPress: () => void;
  isActive: boolean;
  color?: 'default' | 'green' | 'red' | 'yellow' | 'cyan' | 'magenta';
  large?: boolean;
}

function ActionButton({
  label,
  icon,
  onPress,
  isActive,
  color = 'default',
  large = false,
}: ActionButtonProps) {
  return (
    <button
      className={`action-btn ${color} ${isActive ? 'active' : ''} ${large ? 'large' : ''}`}
      onTouchStart={(e) => {
        e.preventDefault();
        onPress();
      }}
      aria-label={label}
    >
      <span className="action-icon">{icon}</span>
      <span className="action-label">{label}</span>
    </button>
  );
}
